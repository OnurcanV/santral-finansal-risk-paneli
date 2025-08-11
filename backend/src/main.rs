// Dosya: backend/src/main.rs
// DÜZELTME: Admin'in müşteri listesini çekebilmesi için eksik olan
// service kaydını ekliyoruz.
use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use sqlx::postgres::PgPoolOptions;
use std::env;

// Modüller
pub mod auth;
pub mod auth_mw;
pub mod db;
pub mod handlers;
mod models;
mod ws;
mod generator;
mod broadcast;

use crate::auth::AuthConfig;
use crate::broadcast::UretimBroadcastMessage;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();

    let _ = env_logger::Builder::from_env(
        env_logger::Env::new().default_filter_or("actix_web=info,santral_finansal_risk_paneli=info"),
    )
    .try_init();

    let database_url =
        env::var("DATABASE_URL").expect("DATABASE_URL ortam değişkeni yok.");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Veritabanı bağlantısı kurulamadı.");

    let (tx, _rx) = tokio::sync::broadcast::channel::<UretimBroadcastMessage>(100);

    let generator_pool = pool.clone();
    let generator_tx = tx.clone();
    tokio::spawn(async move {
        generator::start_data_generator(generator_pool, generator_tx).await;
    });
    
    let auth_cfg =
        AuthConfig::from_env().expect("AuthConfig ortam değişkenleri okunamadı");

    log::info!("🚀 Sunucu http://127.0.0.1:8080 adresinde başlatılıyor...");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(auth_cfg.clone()))
            .app_data(web::Data::new(tx.clone()))
            .wrap(cors)
            .wrap(Logger::new(
                "%a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T s",
            ))
            .route("/auth/login", web::post().to(handlers::login_handler))
            .route("/auth/whoami", web::get().to(handlers::whoami))
            .service(handlers::create_santral_handler)
            .service(handlers::get_all_santraller_handler)
            .service(handlers::delete_santral_handler)
            .service(handlers::update_santral_handler)
            .service(handlers::get_santral_by_id_handler)
            .service(handlers::dengesizlik_hesapla_handler)
            .service(handlers::create_or_update_kgup_plan_handler)
            .service(handlers::sapma_gun_handler)
            .service(handlers::plan_gercek_tarihsel_handler)
            .service(handlers::get_musteriler_handler) // <-- YENİ EKLENEN SATIR
            .route("/ws/uretim", web::get().to(ws::ws_uretim_route))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
} 