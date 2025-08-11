// Dosya: backend/src/ws.rs
// BU DOSYAYI TAMAMEN DEĞİŞTİRİN

use std::time::{Duration, Instant};

use actix::{Actor, ActorContext, AsyncContext, Handler, StreamHandler};
use actix_web::{web, Error, HttpRequest, HttpResponse};
use actix_web_actors::ws;
use tokio::sync::broadcast::Receiver;
use uuid::Uuid;

use crate::auth::{decode_jwt, AuthConfig}; // <-- YENİ
use crate::auth_mw::AuthenticatedUser;
use crate::broadcast::UretimBroadcastMessage;

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub struct UretimWs {
    pub musteri_id: Uuid,
    hb: Instant,
    rx: Receiver<UretimBroadcastMessage>,
}

impl UretimWs {
    pub fn new(musteri_id: Uuid, rx: Receiver<UretimBroadcastMessage>) -> Self {
        Self {
            musteri_id,
            hb: Instant::now(),
            rx,
        }
    }

    fn start_heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                log::info!("[WS] Müşteri {} için bağlantı zaman aşımı, kapanıyor.", act.musteri_id);
                ctx.stop();
                return;
            }
            ctx.ping(b"");
        });
    }
}

impl Actor for UretimWs {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        log::info!("[WS] Müşteri {} için WebSocket bağlantısı başlatıldı.", self.musteri_id);
        self.start_heartbeat(ctx);

        let mut rx = self.rx.resubscribe();
        let musteri_id = self.musteri_id;
        let addr = ctx.address();

        ctx.spawn(
            actix::fut::wrap_future::<_, Self>(async move {
                loop {
                    match rx.recv().await {
                        Ok(msg) => {
                            if msg.musteri_id == musteri_id {
                                addr.do_send(msg);
                            }
                        }
                        Err(e) => {
                            log::error!("[WS] Broadcast alıcı hatası: {}. Dinleyici görev sonlandırılıyor.", e);
                            break;
                        }
                    }
                }
            })
        );
    }
}

impl Handler<UretimBroadcastMessage> for UretimWs {
    type Result = ();

    fn handle(&mut self, msg: UretimBroadcastMessage, ctx: &mut Self::Context) {
        log::trace!("[WS] Müşteri {} için yayın mesajı gönderiliyor: Santral {}", self.musteri_id, msg.santral_ad);
        ctx.text(serde_json::to_string(&msg).unwrap_or_default());
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for UretimWs {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => (),
        }
    }
}

/// Gelen isteğin query parametresinden veya Authorization başlığından token'ı çıkarır.
fn get_user_from_req(req: &HttpRequest, auth_cfg: &AuthConfig) -> Result<AuthenticatedUser, Error> {
    // 1. Authorization: Bearer <token> başlığını dene
    if let Some(auth_header) = req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                return decode_jwt(auth_cfg, token)
                    .map(|data| AuthenticatedUser {
                        user_id: data.claims.sub,
                        musteri_id: data.claims.mus,
                        rol: data.claims.rol,
                    })
                    .map_err(|_| actix_web::error::ErrorUnauthorized("invalid_token_header"));
            }
        }
    }

    // 2. ?token=<token> query parametresini dene
    if let Some(token_str) = req.query_string().split("token=").nth(1) {
        if let Ok(token) = urlencoding::decode(token_str) {
            return decode_jwt(auth_cfg, &token)
                .map(|data| AuthenticatedUser {
                    user_id: data.claims.sub,
                    musteri_id: data.claims.mus,
                    rol: data.claims.rol,
                })
                .map_err(|_| actix_web::error::ErrorUnauthorized("invalid_token_query"));
        }
    }
    
    Err(actix_web::error::ErrorUnauthorized("missing_token"))
}

/// WebSocket bağlantı isteğini işleyen ana handler.
/// DÜZELTME: Artık AuthenticatedUser'ı doğrudan almıyor, onun yerine isteğin kendisinden
/// manuel olarak çıkarıyoruz. Bu, hem header hem de query param ile doğrulamaya izin verir.
pub async fn ws_uretim_route(
    req: HttpRequest,
    stream: web::Payload,
    auth_cfg: web::Data<AuthConfig>,
    tx: web::Data<tokio::sync::broadcast::Sender<UretimBroadcastMessage>>,
) -> Result<HttpResponse, Error> {
    // Kullanıcıyı manuel olarak doğrula
    let user = get_user_from_req(&req, &auth_cfg)?;

    let rx = tx.subscribe();
    let ws = UretimWs::new(user.musteri_id, rx);
    ws::start(ws, &req, stream)
}