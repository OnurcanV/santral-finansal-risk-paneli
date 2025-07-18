// backend/src/handlers.rs

//! HTTP handler fonksiyonları.
//!
//! - Santral CRUD
//! - Dengesizlik Hesabı
//! - KGÜP Plan Kaydetme
//! - Auth: Login (Bearer) & Whoami

use actix_web::{delete, get, post, put, web, Error, HttpResponse, Responder};
use sqlx::PgPool;
use uuid::Uuid;
use chrono::NaiveDate;
use crate::models::SapmaGunResponse;

use crate::db;
use crate::models::{
    DengesizlikInput, DengesizlikOutput, InputSantral, KgupPlanInput, Kullanici,
};
use crate::auth::{create_jwt, verify_password, AuthConfig};
use crate::auth_mw::AuthenticatedUser;

// -----------------------------------------------------------------------------
// AUTH
// -----------------------------------------------------------------------------

#[derive(serde::Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub sifre: String,
}

#[derive(serde::Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub user_id: Uuid,
    pub musteri_id: Uuid,
    pub rol: String,
}

/// POST /auth/login
///
/// Body: { "email": "...", "sifre": "..." }
pub async fn login_handler(
    pool: web::Data<PgPool>,
    auth_cfg: web::Data<AuthConfig>,
    form: web::Json<LoginRequest>,
) -> Result<HttpResponse, Error> {
    // Kullanıcıyı çek
    let user = sqlx::query_as!(
        Kullanici,
        r#"
        SELECT
            id,
            musteri_id,
            email,
            sifre_hash,
            ad_soyad,
            rol,
            aktif,
            olusturma_tarihi
        FROM kullanicilar
        WHERE email = $1
        LIMIT 1
        "#,
        form.email
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        log::error!("DB login error: {e}");
        actix_web::error::ErrorInternalServerError("db hata")
    })?;

    // Kullanıcı var mı?
    let user = match user {
        Some(u) => {
            if !u.aktif {
                return Ok(HttpResponse::Unauthorized().body("Hesap pasif."));
            }
            u
        }
        None => {
            // generic mesaj → bilgi sızmasını engelle
            return Ok(HttpResponse::Unauthorized().body("Giriş bilgileri hatalı."));
        }
    };

    // Şifre doğrulama
    if !verify_password(&form.sifre, &user.sifre_hash) {
    return Ok(HttpResponse::Unauthorized().body("Giriş bilgileri hatalı."));
    }

    // JWT üret
    let token = create_jwt(&auth_cfg, user.id, user.musteri_id, &user.rol).map_err(|e| {
        log::error!("JWT üretilemedi: {e}");
        actix_web::error::ErrorInternalServerError("jwt hata")
    })?;

    let resp = LoginResponse {
        access_token: token,
        user_id: user.id,
        musteri_id: user.musteri_id,
        rol: user.rol,
    };

    Ok(HttpResponse::Ok().json(resp))
}

/// GET /auth/whoami
///
/// Authorization: Bearer <token>
pub async fn whoami(user: AuthenticatedUser) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "user_id": user.user_id,
        "musteri_id": user.musteri_id,
        "rol": user.rol,
    }))
}

// -----------------------------------------------------------------------------
// SANTRAL CRUD
// -----------------------------------------------------------------------------

#[post("/api/santral")]
pub async fn create_santral_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    yeni_santral: web::Json<InputSantral>,
) -> impl Responder {
    let data = yeni_santral.into_inner();
    let musteri_id = user.musteri_id; // admin de kendi default musteri'sine ekliyor (şimdilik)

    match db::create_santral_for_musteri(pool.get_ref(), musteri_id, data).await {
        Ok(santral) => HttpResponse::Ok().json(santral),
        Err(e) => {
            eprintln!("Santral oluşturulurken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[get("/api/santraller")]
pub async fn get_all_santraller_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
) -> impl Responder {
    if user.rol == "admin" {
        match db::get_all_santraller(pool.get_ref()).await {
            Ok(santraller) => HttpResponse::Ok().json(santraller),
            Err(e) => {
                eprintln!("Santraller listelenirken hata oluştu: {:?}", e);
                HttpResponse::InternalServerError().finish()
            }
        }
    } else {
        match db::get_santraller_by_musteri(pool.get_ref(), user.musteri_id).await {
            Ok(santraller) => HttpResponse::Ok().json(santraller),
            Err(e) => {
                eprintln!("Müşteri santralleri listelenirken hata oluştu: {:?}", e);
                HttpResponse::InternalServerError().finish()
            }
        }
    }
}

#[delete("/api/santral/{id}")]
pub async fn delete_santral_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> impl Responder {
    let santral_id = id.into_inner();

    // admin → doğrudan sil
    if user.rol == "admin" {
        match db::delete_santral_by_id(pool.get_ref(), santral_id).await {
            Ok(rows) if rows > 0 => {
                return HttpResponse::Ok().json(serde_json::json!({"status":"success"}));
            }
            Ok(_) => {
                return HttpResponse::NotFound().json(serde_json::json!({"status":"error","message":"Santral bulunamadı."}));
            }
            Err(e) => {
                eprintln!("Santral sil hata: {e:?}");
                return HttpResponse::InternalServerError().finish();
            }
        }
    }

    // user → sahiplik kontrolü
    match db::santral_belongs_to_musteri(pool.get_ref(), santral_id, user.musteri_id).await {
        Ok(true) => {}
        Ok(false) => {
            return HttpResponse::Forbidden().json(serde_json::json!({"status":"error","message":"Yetkin yok."}));
        }
        Err(e) => {
            eprintln!("Sahiplik kontrol hata: {e:?}");
            return HttpResponse::InternalServerError().finish();
        }
    }

    // sahip → sil
    match db::delete_santral_by_id(pool.get_ref(), santral_id).await {
        Ok(rows) if rows > 0 => HttpResponse::Ok().json(serde_json::json!({"status":"success"})),
        Ok(_) => HttpResponse::NotFound().json(serde_json::json!({"status":"error","message":"Santral bulunamadı."})),
        Err(e) => {
            eprintln!("Santral sil hata: {e:?}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[put("/api/santral/{id}")]
pub async fn update_santral_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    id: web::Path<Uuid>,
    santral_data: web::Json<InputSantral>,
) -> impl Responder {
    let santral_id = id.into_inner();

    if user.rol != "admin" {
        match db::santral_belongs_to_musteri(pool.get_ref(), santral_id, user.musteri_id).await {
            Ok(true) => {}
            Ok(false) => {
                return HttpResponse::Forbidden().json(serde_json::json!({"status":"error","message":"Yetkin yok."}));
            }
            Err(e) => {
                eprintln!("Sahiplik kontrol hata: {e:?}");
                return HttpResponse::InternalServerError().finish();
            }
        }
    }

    let data = santral_data.into_inner();
    match db::update_santral_by_id(pool.get_ref(), santral_id, data).await {
        Ok(santral) => HttpResponse::Ok().json(santral),
        Err(sqlx::Error::RowNotFound) => HttpResponse::NotFound().json(serde_json::json!({"status":"error","message":"Santral bulunamadı."})),
        Err(e) => {
            eprintln!("Update santral hata: {e:?}");
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[get("/api/santral/{id}")]
pub async fn get_santral_by_id_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> impl Responder {
    let santral_id = id.into_inner();

    if user.rol != "admin" {
        match db::santral_belongs_to_musteri(pool.get_ref(), santral_id, user.musteri_id).await {
            Ok(true) => {}
            Ok(false) => {
                return HttpResponse::Forbidden().json(serde_json::json!({"status":"error","message":"Yetkin yok."}));
            }
            Err(e) => {
                eprintln!("Sahiplik kontrol hata: {e:?}");
                return HttpResponse::InternalServerError().finish();
            }
        }
    }

    match db::get_santral_by_id(pool.get_ref(), santral_id).await {
        Ok(santral) => HttpResponse::Ok().json(santral),
        Err(sqlx::Error::RowNotFound) => HttpResponse::NotFound().json(serde_json::json!({"status":"error","message":"Santral bulunamadı."})),
        Err(e) => {
            eprintln!("Get santral hata: {e:?}");
            HttpResponse::InternalServerError().finish()
        }
    }
}


// -----------------------------------------------------------------------------
// DENGESİZLİK HESAPLAMA
// -----------------------------------------------------------------------------

#[post("/api/hesapla/dengesizlik")]
pub async fn dengesizlik_hesapla_handler(
    inputs: web::Json<Vec<DengesizlikInput>>,
) -> impl Responder {
    let outputs: Vec<DengesizlikOutput> = inputs
        .iter()
        .map(|input| {
            let dengesizlik_miktari = input.gerceklesen_uretim_mwh - input.tahmini_uretim_mwh;
            let (dengesizlik_tipi, dengesizlik_tutari, aciklama) = if dengesizlik_miktari > 0.0 {
                let fiyat = input.ptf_tl.min(input.smf_tl);
                (
                    "Pozitif Dengesizlik (Fazla Üretim)".to_string(),
                    dengesizlik_miktari * fiyat,
                    format!(
                        "Sistem, fazla ürettiğiniz {:.2} MWh enerjiyi, düşük olan {:.2} TL fiyattan satın aldı.",
                        dengesizlik_miktari, fiyat
                    ),
                )
            } else if dengesizlik_miktari < 0.0 {
                let fiyat = input.ptf_tl.max(input.smf_tl);
                (
                    "Negatif Dengesizlik (Eksik Üretim)".to_string(),
                    dengesizlik_miktari * fiyat,
                    format!(
                        "Sistem, eksik ürettiğiniz {:.2} MWh enerjiyi, yüksek olan {:.2} TL fiyattan adınıza satın aldı.",
                        dengesizlik_miktari.abs(),
                        fiyat
                    ),
                )
            } else {
                (
                    "Dengede".to_string(),
                    0.0,
                    "Santral üretim tahmini ile tam dengededir.".to_string(),
                )
            };

            DengesizlikOutput {
                tahmini_uretim_mwh: input.tahmini_uretim_mwh,
                gerceklesen_uretim_mwh: input.gerceklesen_uretim_mwh,
                ptf_tl: input.ptf_tl,
                smf_tl: input.smf_tl,
                dengesizlik_miktari_mwh: dengesizlik_miktari,
                dengesizlik_tutari_tl: dengesizlik_tutari,
                dengesizlik_tipi,
                aciklama,
            }
        })
        .collect();

    HttpResponse::Ok().json(outputs)
}

// -----------------------------------------------------------------------------
// KGÜP PLAN
// -----------------------------------------------------------------------------

#[post("/api/santral/{id}/kgupplan")]
pub async fn create_or_update_kgup_plan_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    id: web::Path<Uuid>,
    plan_input: web::Json<KgupPlanInput>,
) -> impl Responder {
    let santral_id = id.into_inner();

    if user.rol != "admin" {
        match db::santral_belongs_to_musteri(pool.get_ref(), santral_id, user.musteri_id).await {
            Ok(true) => {}
            Ok(false) => {
                return HttpResponse::Forbidden().json(serde_json::json!({"status":"error","message":"Yetkin yok."}));
            }
            Err(e) => {
                eprintln!("Sahiplik kontrol hata: {e:?}");
                return HttpResponse::InternalServerError().finish();
            }
        }
    }

    match db::create_or_update_kgup_plan(pool.get_ref(), santral_id, plan_input.into_inner()).await {
        Ok(plan) => HttpResponse::Ok().json(plan),
        Err(e) => {
            eprintln!("KGÜP Planı kaydedilirken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[derive(Debug, serde::Deserialize)]
pub struct SapmaQuery {
    pub gun: Option<String>, // YYYY-MM-DD (opsiyonel; yoksa bugün UTC)
}

// -----------------------------------------------------------------------------
// SAPMA (Plan vs Gerçekleşen) - Gün Bazlı Saatlik
// -----------------------------------------------------------------------------
// GET /api/santral/{id}/sapma/{gun}
// örn: /api/santral/ab3d.../sapma/2025-07-17
//
// Yetki:
//   - admin: istediği santrali sorabilir
//   - user : sadece kendi portföyündeki santrali sorabilir
#[get("/api/santral/{id}/sapma/{gun}")]
pub async fn sapma_gun_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,           // bearer -> musteri_id, rol
    path: web::Path<(Uuid, String)>,   // (santral_id, gun_str)
) -> Result<HttpResponse, Error> {
    let (santral_id, gun_str) = path.into_inner();

    // Tarih parse
    let gun = match chrono::NaiveDate::parse_from_str(&gun_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => {
            return Ok(HttpResponse::BadRequest().body("Tarih formatı YYYY-MM-DD olmalı."));
        }
    };

    // user ise santral sahiplik kontrolü
    if user.rol != "admin" {
        match db::santral_belongs_to_musteri(pool.get_ref(), santral_id, user.musteri_id).await {
            Ok(true) => {}
            Ok(false) => {
                return Ok(HttpResponse::Forbidden().body("Bu santrale erişim yetkin yok."));
            }
            Err(e) => {
                log::error!("sahiplik kontrol hata: {e}");
                return Ok(HttpResponse::InternalServerError().finish());
            }
        }
    }

    // Veriyi çek
    let rows = match db::sapma_saatlik_gun(pool.get_ref(), santral_id, gun).await {
        Ok(r) => r,
        Err(e) => {
            log::error!("sapma_saatlik_gun DB hata: {e}");
            return Ok(HttpResponse::InternalServerError().finish());
        }
    };

    // Toplamlar + MAPE
    let mut toplam_plan = 0.0_f64;
    let mut toplam_gercek = 0.0_f64;
    let mut toplam_abs = 0.0_f64;
    let mut has_plan = false;
    let mut has_gercek = false;

    for r in &rows {
        if let Some(p) = r.plan_mwh {
            toplam_plan += p;
            has_plan = true;
        }
        if let Some(g) = r.gercek_mwh {
            toplam_gercek += g;
            has_gercek = true;
        }
        if let (Some(p), Some(g)) = (r.plan_mwh, r.gercek_mwh) {
            if p > 0.0 {
                toplam_abs += (p - g).abs();
            }
        }
    }

    let toplam_sapma = if has_plan && has_gercek {
        Some(toplam_gercek - toplam_plan)
    } else {
        None
    };

    let mape_yaklasik = if toplam_plan > 0.0 {
        Some(toplam_abs / toplam_plan)
    } else {
        None
    };

    let resp = SapmaGunResponse {
        santral_id,
        gun,
        rows,
        toplam_plan_mwh: if has_plan { Some(toplam_plan) } else { None },
        toplam_gercek_mwh: if has_gercek { Some(toplam_gercek) } else { None },
        toplam_sapma_mwh: toplam_sapma,
        mape_yaklasik,
    };

    Ok(HttpResponse::Ok().json(resp))
}

#[get("/api/santral/{id}/tarihsel")]
pub async fn plan_gercek_tarihsel_handler(
    pool: web::Data<PgPool>,
    user: AuthenticatedUser,
    path: web::Path<Uuid>,
    q: web::Query<std::collections::HashMap<String,String>>,
) -> HttpResponse {
    let santral_id = path.into_inner();

    // User yetki kontrolü (admin her şeyi görür; user sadece kendi)
    if user.rol != "admin" {
        match db::santral_belongs_to_musteri(pool.get_ref(), santral_id, user.musteri_id).await {
            Ok(true) => {}
            Ok(false) => {
                return HttpResponse::Forbidden().body("Yetkin yok.");
            }
            Err(e) => {
                eprintln!("sahiplik kontrolü hata: {e}");
                return HttpResponse::InternalServerError().finish();
            }
        }
    }

    // Paramları çek
    let start_str = q.get("start").map(String::as_str).unwrap_or_else(|| {
        // default: bugün
        // TR timezone’a girmiyoruz; UTC date
        let today = chrono::Utc::now().date_naive();
        Box::leak(Box::new(today.to_string()))
    });
    let end_str = q.get("end").map(String::as_str).unwrap_or(start_str); // yoksa tek gün

    // parse
    let start = match chrono::NaiveDate::parse_from_str(start_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => return HttpResponse::BadRequest().body("start format YYYY-MM-DD olmalı"),
    };
    let mut end = match chrono::NaiveDate::parse_from_str(end_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(_) => return HttpResponse::BadRequest().body("end format YYYY-MM-DD olmalı"),
    };
    if end <= start {
        // tek gün durumu: end = start + 1
        end = start.succ_opt().unwrap_or(start);
    }

    // limit (örnek: max 31 gün)
    if (end - start).num_days() > 31 {
        return HttpResponse::BadRequest().body("Tarih aralığı 31 günden uzun olamaz.");
    }

    // DB çağrısı
    let rows = match db::plan_gercek_aralik(pool.get_ref(), santral_id, start, end).await {
        Ok(r) => r,
        Err(e) => {
            eprintln!("plan_gercek_aralik DB hata: {e}");
            return HttpResponse::InternalServerError().finish();
        }
    };

    // Agrega
    let mut toplam_plan = 0.0;
    let mut toplam_gercek = 0.0;
    let mut toplam_sapma = 0.0;

    let mut mape_num = 0.0; // Σ |plan-actual|
    let mut mape_den = 0.0; // Σ plan (plan>0 & actual mevcut)

    let mut out_rows = Vec::with_capacity(rows.len());

    for (ts, plan, gercek) in rows {
        let sapma_opt = match (plan, gercek) {
            (Some(p), Some(a)) => {
                toplam_plan += p;
                toplam_gercek += a;
                toplam_sapma += a - p;
                mape_num += (a - p).abs();
                if p > 0.0 {
                    mape_den += p;
                }
                Some(a - p)
            }
            (Some(p), None) => {
                toplam_plan += p;
                None
            }
            (None, Some(a)) => {
                toplam_gercek += a;
                None
            }
            (None, None) => None,
        };

        out_rows.push(crate::models::PlanGercekSaat {
            ts_utc: ts,
            plan_mwh: plan,
            gercek_mwh: gercek,
            sapma_mwh: sapma_opt,
        });
    }

    let mape = if mape_den > 0.0 { Some(mape_num / mape_den) } else { None };

    let resp = crate::models::PlanGercekResponse {
        santral_id,
        start,
        end,
        rows: out_rows,
        toplam_plan_mwh: Some(toplam_plan),
        toplam_gercek_mwh: Some(toplam_gercek),
        toplam_sapma_mwh: Some(toplam_sapma),
        mape_yaklasik: mape,
    };

    HttpResponse::Ok().json(resp)
}
