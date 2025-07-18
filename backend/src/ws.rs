// backend/src/ws.rs  (debug broadcast loglu)
//
// WebSocket bağlantıları: UretimWs
// Amaç: JWT ile doğrula, musteri_id bağla, ping/pong, echo, hoş geldin mesajı,
// ve (Gün 8) periyodik portföy üretim yayını.
//
// Yayın formatı örneği:
// {
//   "type": "uretim_tick",
//   "musteri_id": "...",
//   "santraller": [...],
//   "portfoy_toplam_mw": 123.4,
//   "portfoy_kurulu_mw": 250.0,
//   "portfoy_oran": 0.494
// }

use std::time::{Duration, Instant};

use actix::{fut, Actor, ActorContext, AsyncContext, StreamHandler, ActorFutureExt};
use actix_web::{self, web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use actix_web_actors::ws::{Message as WsMessage, ProtocolError};
use uuid::Uuid;

use bigdecimal::ToPrimitive;
use serde_json::json;

use crate::auth::{self, AuthConfig};
use crate::db;
use sqlx::PgPool;

// --- zamanlama sabitleri ---
const HEARTBEAT_INTERVAL: Duration   = Duration::from_secs(5); // ping sıklığı
const CLIENT_TIMEOUT: Duration       = Duration::from_secs(10); // pong gelmezse kopar
const BROADCAST_INTERVAL: Duration   = Duration::from_secs(5); // üretim yayını periyodu

pub struct UretimWs {
    pub musteri_id: Uuid,
    hb: Instant,
    pool: PgPool,
}

impl UretimWs {
    pub fn new(musteri_id: Uuid, pool: PgPool) -> Self {
        Self {
            musteri_id,
            hb: Instant::now(),
            pool,
        }
    }

    /// Sunucudan düzenli ping gönder + timeout kontrolü.
    fn start_heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                println!("[WS] musteri_id={} -> bağlantı zaman aşımı, kapanıyor.", act.musteri_id);
                ctx.stop();
                return;
            }
            ctx.ping(b"ping");
        });
    }

    /// Periyodik üretim yayını.
    fn start_broadcast(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(BROADCAST_INTERVAL, |act, ctx| {
            println!("[WS] broadcast tick -> mus={}", act.musteri_id);

            let pool = act.pool.clone();
            let mus  = act.musteri_id;

            // async DB çağrısını actor context'te future olarak sar
            ctx.spawn(
                fut::wrap_future(async move {
                    db::get_son_uretimler_by_musteri(&pool, mus).await
                })
                .map(move |res, _act, ctx: &mut ws::WebsocketContext<UretimWs>| {
                    match res {
                        Ok(rows) => {
                            println!("[WS] broadcast DB ok ({} rows) mus={}", rows.len(), mus);

                            let mut top_kurulu = 0f64;
                            let mut top_mw     = 0f64;
                            let mut list = Vec::with_capacity(rows.len());

                            for r in rows {
                                let k_mw = r.kurulu_guc_mw.to_f64().unwrap_or(0.0);
                                top_kurulu += k_mw;
                                if let Some(mw) = r.son_mw {
                                    top_mw += mw;
                                }
                                list.push(json!({
                                    "id": r.id,
                                    "ad": r.ad,
                                    "kurulu_guc_mw": r.kurulu_guc_mw.to_string(),
                                    "son_mw": r.son_mw,
                                    "son_ts": r.son_ts.map(|ts| ts.to_rfc3339()),
                                }));
                            }

                            let oran = if top_kurulu > 0.0 { top_mw / top_kurulu } else { 0.0 };

                            let payload = json!({
                                "type": "uretim_tick",
                                "musteri_id": mus,
                                "santraller": list,
                                "portfoy_toplam_mw": top_mw,
                                "portfoy_kurulu_mw": top_kurulu,
                                "portfoy_oran": oran,
                            });
                            ctx.text(payload.to_string());
                        }
                        Err(e) => {
                            eprintln!("[WS] broadcast DB ERROR mus={}: {e}", mus);
                        }
                    }
                }),
            );
        });
    }
}

impl Actor for UretimWs {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.start_heartbeat(ctx);
        self.start_broadcast(ctx);

        // hoş geldin mesajı
        let welcome = json!({
            "type": "welcome",
            "musteri_id": self.musteri_id,
            "msg": "WebSocket bağlantısı kuruldu."
        });
        ctx.text(welcome.to_string());
    }
}

impl StreamHandler<Result<WsMessage, ProtocolError>> for UretimWs {
    fn handle(&mut self, msg: Result<WsMessage, ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(WsMessage::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(WsMessage::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(WsMessage::Text(txt)) => {
                // echo (debug)
                let echo_payload = json!({
                    "type": "echo",
                    "musteri_id": self.musteri_id,
                    "recv": txt.to_string(),
                });
                ctx.text(echo_payload.to_string());
            }
            Ok(WsMessage::Binary(bin)) => {
                ctx.binary(bin);
            }
            Ok(WsMessage::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => {}
        }
    }
}

/// Query string'den ?token= al.
fn extract_token_from_query(req: &HttpRequest) -> Option<String> {
    req.query_string().split('&').find_map(|kv| {
        let mut it = kv.splitn(2, '=');
        let k = it.next()?;
        let v = it.next()?;
        if k == "token" {
            Some(urlencoding::decode(v).ok()?.to_string())
        } else {
            None
        }
    })
}

/// Token'ı doğrula -> musteri_id dön.
fn auth_from_req(req: &HttpRequest) -> Result<Uuid, String> {
    // 1) query ?token=
    if let Some(tok) = extract_token_from_query(req) {
        return decode_token_to_musteri(&tok);
    }

    // 2) Authorization: Bearer ...
    if let Some(hv) = req.headers().get(actix_web::http::header::AUTHORIZATION) {
        if let Ok(s) = hv.to_str() {
            if let Some(rest) = s.strip_prefix("Bearer ") {
                return decode_token_to_musteri(rest.trim());
            }
        }
    }

    Err("Token bulunamadı.".into())
}

/// JWT çöz → musteri_id.
fn decode_token_to_musteri(token: &str) -> Result<Uuid, String> {
    let secret = std::env::var("JWT_SECRET").map_err(|_| "JWT_SECRET env yok.".to_string())?;

    // decode_jwt(cfg, token) -- secret lazım
    let cfg = AuthConfig {
        jwt_secret: secret,
        jwt_exp_hours: 24, // decode için önemli değil
    };

    let token_data = auth::decode_jwt(&cfg, token).map_err(|e| format!("JWT hata: {e}"))?;
    let claims = token_data.claims;
    Ok(claims.mus) // mus zaten Uuid
}

/// WebSocket handshake handler.
/// route: GET /ws/uretim
pub async fn ws_uretim_route(
    req: HttpRequest,
    stream: web::Payload,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    // token doğrula
    let musteri_id = match auth_from_req(&req) {
        Ok(id) => id,
        Err(msg) => {
            println!("[WS] bağlantı reddedildi: {msg}");
            return Ok(HttpResponse::Unauthorized().body(msg));
        }
    };

    // actor başlat
    let ws = UretimWs::new(musteri_id, pool.get_ref().clone());
    ws::start(ws, &req, stream)
}
