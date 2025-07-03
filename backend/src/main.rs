use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use sqlx::postgres::PgPoolOptions;
use std::env;

mod models;
mod db;
mod handlers;
mod auth_middleware; // Auth extractor (değiştirmediysek önceki sürümünüzü koruyun)

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL environment variable missing");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Database connection failed");

    println!("🚀  http://127.0.0.1:8080");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allow_any_header()
            .allow_any_method();

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            // — AUTH —
            .service(
                web::scope("/api/auth")
                    .service(handlers::register_user_handler)
                    .service(handlers::login_user_handler),
            )
            // — SANTRAL + KGÜP —
            .service(
                web::scope("/api/santral")
                    .service(handlers::create_santral_handler)
                    .service(handlers::get_all_santraller_handler)
                    .service(handlers::get_santral_by_id_handler)
                    .service(handlers::update_santral_handler)
                    .service(handlers::delete_santral_handler)
                    .service(handlers::create_or_update_kgup_plan_handler),
            )
            // — Hesaplamalar —
            .service(
                web::scope("/api/hesapla")
                    .service(handlers::dengesizlik_hesapla_handler)
                    .service(handlers::kgup_hesapla_handler),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
