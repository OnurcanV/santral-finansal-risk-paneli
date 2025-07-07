//! HTTP endpoint’leri

use crate::{
    auth_middleware::AuthUser,
    db,
    models::{
        DengesizlikInput, DengesizlikOutput, InputSantral, KgupInput, KgupPlanInput,
        LoginUserInput, RegisterUserInput, TokenClaims,
    },
};
use actix_web::{delete, get, post, put, web, HttpResponse, Responder};
use argon2::{password_hash::PasswordHash, Argon2, PasswordVerifier};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use std::env;
use uuid::Uuid;

/* --------------- AUTH --------------- */

#[post("/register")]
pub async fn register_user_handler(
    pool: web::Data<sqlx::PgPool>,
    body: web::Json<RegisterUserInput>,
) -> impl Responder {
    match db::register_user(pool.get_ref(), body.into_inner()).await {
        Ok(u) => HttpResponse::Created().json(u.to_filtered()),
        Err(sqlx::Error::Database(e)) if e.is_unique_violation() => HttpResponse::Conflict()
            .json(serde_json::json!({ "message": "Bu e-posta zaten kayıtlı" })),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

#[post("/login")]
pub async fn login_user_handler(
    pool: web::Data<sqlx::PgPool>,
    body: web::Json<LoginUserInput>,
) -> impl Responder {
    let Some(user) = db::find_user_by_email(pool.get_ref(), body.email.clone())
        .await
        .unwrap_or(None) else {
        return HttpResponse::Unauthorized()
            .json(serde_json::json!({ "message": "Geçersiz e-posta veya şifre" }));
    };

    let parsed = PasswordHash::new(&user.password_hash).unwrap();
    if Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed)
        .is_err()
    {
        return HttpResponse::Unauthorized()
            .json(serde_json::json!({ "message": "Geçersiz e-posta veya şifre" }));
    }

    let now = Utc::now();
    let claims = TokenClaims {
        sub: user.id,
        email: user.email.clone(), // YENİ EKLENDİ
        rol: user.rol.clone(),
        iat: now.timestamp(),
        exp: (now + Duration::days(7)).timestamp(),
    };

    let secret = env::var("JWT_SECRET").expect("JWT_SECRET missing");
    let token =
        encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())).unwrap();

    HttpResponse::Ok().json(serde_json::json!({ "token": token }))
}

/* ---------- SANTRAL CRUD ---------- */

#[post("")]
pub async fn create_santral_handler(
    pool: web::Data<sqlx::PgPool>,
    body: web::Json<InputSantral>,
    auth: AuthUser,
) -> impl Responder {
    db::create_santral(pool.get_ref(), body.into_inner(), auth.id)
        .await
        .map_or_else(
            |e| HttpResponse::InternalServerError().body(e.to_string()),
            |s| HttpResponse::Created().json(s),
        )
}

#[get("")]
pub async fn get_all_santraller_handler(
    pool: web::Data<sqlx::PgPool>,
    auth: AuthUser,
) -> impl Responder {
    db::get_all_santraller(pool.get_ref(), auth.id)
        .await
        .map_or_else(
            |e| HttpResponse::InternalServerError().body(e.to_string()),
            |list| HttpResponse::Ok().json(list),
        )
}

#[get("/{id}")]
pub async fn get_santral_by_id_handler(
    pool: web::Data<sqlx::PgPool>,
    id: web::Path<Uuid>,
    auth: AuthUser,
) -> impl Responder {
    match db::get_santral_by_id(pool.get_ref(), id.into_inner(), auth.id).await {
        Ok(Some(s)) => HttpResponse::Ok().json(s),
        Ok(None) => HttpResponse::NotFound().finish(),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

#[put("/{id}")]
pub async fn update_santral_handler(
    pool: web::Data<sqlx::PgPool>,
    id: web::Path<Uuid>,
    body: web::Json<InputSantral>,
    auth: AuthUser,
) -> impl Responder {
    match db::update_santral_by_id(pool.get_ref(), id.into_inner(), auth.id, body.into_inner())
        .await
    {
        Ok(s) => HttpResponse::Ok().json(s),
        Err(_) => HttpResponse::NotFound().finish(),
    }
}

#[delete("/{id}")]
pub async fn delete_santral_handler(
    pool: web::Data<sqlx::PgPool>,
    id: web::Path<Uuid>,
    auth: AuthUser,
) -> impl Responder {
    db::delete_santral_by_id(pool.get_ref(), id.into_inner(), auth.id)
        .await
        .map_or_else(
            |_| HttpResponse::NotFound().finish(),
            |n| {
                if n > 0 {
                    HttpResponse::Ok()
                        .json(serde_json::json!({ "message": "Silindi" }))
                } else {
                    HttpResponse::NotFound().finish()
                }
            },
        )
}

/* ---------- KGÜP Plan ---------- */

#[post("/kgupplan/{id}")]
pub async fn create_or_update_kgup_plan_handler(
    pool: web::Data<sqlx::PgPool>,
    id: web::Path<Uuid>,
    body: web::Json<KgupPlanInput>,
    auth: AuthUser,
) -> impl Responder {
    db::create_or_update_kgup_plan(
        pool.get_ref(),
        id.into_inner(),
        auth.id,
        body.into_inner(),
    )
    .await
    .map_or_else(
        |e| HttpResponse::InternalServerError().body(e.to_string()),
        |p| HttpResponse::Ok().json(p),
    )
}

/* ---------- Hesaplamalar ---------- */

#[post("/dengesizlik")]
pub async fn dengesizlik_hesapla_handler(
    list: web::Json<Vec<DengesizlikInput>>,
) -> impl Responder {
    let out: Vec<DengesizlikOutput> = list
        .iter()
        .map(|i| {
            let diff = i.gerceklesen_uretim_mwh - i.tahmini_uretim_mwh;
            let (tip, tutar, aciklama) = if diff > 0.0 {
                let fiyat = i.ptf_tl.min(i.smf_tl);
                (
                    "Pozitif".into(),
                    diff * fiyat,
                    format!("Fazla üretim {} MWh x {:.2} TL", diff, fiyat),
                )
            } else if diff < 0.0 {
                let fiyat = i.ptf_tl.max(i.smf_tl);
                (
                    "Negatif".into(),
                    diff * fiyat,
                    format!("Eksik üretim {} MWh x {:.2} TL", diff.abs(), fiyat),
                )
            } else {
                ("Denge".into(), 0.0, "Tam dengede".into())
            };
            DengesizlikOutput {
                tahmini_uretim_mwh: i.tahmini_uretim_mwh,
                gerceklesen_uretim_mwh: i.gerceklesen_uretim_mwh,
                ptf_tl: i.ptf_tl,
                smf_tl: i.smf_tl,
                dengesizlik_miktari_mwh: diff,
                dengesizlik_tipi: tip,
                dengesizlik_tutari_tl: tutar,
                aciklama,
            }
        })
        .collect();

    HttpResponse::Ok().json(out)
}

#[post("/kgup")]
pub async fn kgup_hesapla_handler(body: web::Json<KgupInput>) -> impl Responder {
    let pko = body.kurulu_guc_mw
        * body.fatura_donemi_saat as f64
        * body.eak_orani
        * body.birim_kapasite_fiyati;

    let fark = body.hedef_eak_orani - body.eak_orani;
    let (kesinti, aciklama) = if fark > 0.0 {
        (
            body.kurulu_guc_mw
                * body.fatura_donemi_saat as f64
                * fark
                * body.ceza_fiyati,
            "KGÜP kesintisi uygulandı".into(),
        )
    } else {
        (0.0, "Kesinti yok".into())
    };

    HttpResponse::Ok().json(crate::models::KgupOutput {
        potansiyel_kapasite_odemesi: pko,
        eak_farki: fark,
        kgup_kesinti_tutari: kesinti,
        net_sonuc: pko - kesinti,
        aciklama,
    })
}
