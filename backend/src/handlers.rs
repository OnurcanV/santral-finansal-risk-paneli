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

