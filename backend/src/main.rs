// backend/src/main.rs
//
// Ana Actix uygulaması.
// - .env yükle
// - PgPool kur
// - AuthConfig oku
// - REST endpoint'ler
// - WebSocket /ws/uretim (JWT zorunlu)

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

use crate::auth::AuthConfig;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // .env dosyasını yükle (sessiz)
    dotenvy::dotenv().ok();

    // Logger ‑ yalnızca BİR kez kur; zaten kuruluysa hata yutulsun
    let _ = env_logger::Builder::from_env(
        env_logger::Env::new().default_filter_or("actix_web=info"),
    )
    .try_init();

    // DB bağlantısı
    let database_url =
        env::var("DATABASE_URL").expect("DATABASE_URL ortam değişkeni yok.");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Veritabanı bağlantısı kurulamadı.");

    // JWT ayarları
    let auth_cfg =
        AuthConfig::from_env().expect("AuthConfig ortam değişkenleri okunamadı");

    println!("🚀  http://127.0.0.1:8080");

    HttpServer::new(move || {
        // Geliştirme içi CORS
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(web::Data::new(auth_cfg.clone()))
            .wrap(cors)
            .wrap(Logger::new(
                "%a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T s",
            ))
            // ---------- AUTH ----------
            .route("/auth/login", web::post().to(handlers::login_handler))
            .route("/auth/whoami", web::get().to(handlers::whoami))
            // ---------- SANTRAL CRUD & ANALİZ ----------
            .service(handlers::create_santral_handler)
            .service(handlers::get_all_santraller_handler)
            .service(handlers::delete_santral_handler)
            .service(handlers::update_santral_handler)
            .service(handlers::get_santral_by_id_handler)
            // ---------- KGÜP & DENGESİZLİK ----------
            .service(handlers::dengesizlik_hesapla_handler)
            .service(handlers::create_or_update_kgup_plan_handler)
            .service(handlers::sapma_gun_handler)
            .service(handlers::plan_gercek_tarihsel_handler)
            // ---------- WebSocket ----------
            .route("/ws/uretim", web::get().to(ws::ws_uretim_route))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
