// backend/src/main.rs - FİNAL VERSİYONU (Loglama Eklenmiş)

// Gerekli tüm kütüphanelerimizi ve modüllerimizi çağırıyoruz.
use actix_cors::Cors;
// Logger middleware'ini ve log kütüphanesini import ediyoruz.
use actix_web::{App, HttpServer, middleware::Logger, web};
use sqlx::postgres::PgPoolOptions;
use std::env;

// Kendi oluşturduğumuz modülleri projeye dahil ediyoruz.
pub mod db;
pub mod handlers;
mod models;

// Main fonksiyonumuz, tüm uygulamanın başlangıç noktası.
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // .env dosyasını yükleyerek ortam değişkenlerine erişim sağlıyoruz.
    dotenvy::dotenv().ok();

    // --- YENİ EKLENEN KISIM: Loglama sistemini başlatıyoruz. ---
    // RUST_LOG ortam değişkenine göre log seviyesini ayarlar.
    // Eğer değişken ayarlı değilse, varsayılan olarak 'actix_web=info' seviyesinde log tutar.
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("actix_web=info"));
    // --- YENİ EKLENEN KISIM SONU ---

    // DATABASE_URL'i ortamdan okuyoruz.
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL ortam değişkeni bulunamadı.");

    // Veritabanı bağlantı havuzunu (pool) oluşturuyoruz.
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Veritabanı bağlantısı başarısız oldu.");

    println!("🚀 Sunucu http://127.0.0.1:8080 adresinde başlatılıyor...");

    // HTTP sunucusunu kurup başlatıyoruz.
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        // Actix uygulamamızı oluşturuyoruz.
        App::new()
            .wrap(cors)
            // --- YENİ EKLENEN KISIM: Logger'ı bir middleware olarak ekliyoruz ---
            // %a: IP Adresi, %r: İstek satırı, %s: Cevap status kodu, %b: Cevap boyutu, %T: Süre
            .wrap(Logger::new(
                "%a \"%r\" %s %b \"%{Referer}i\" \"%{User-Agent}i\" %T s",
            ))
            // --- YENİ EKLENEN KISIM SONU ---
            .app_data(web::Data::new(pool.clone()))
            // Handler'larımızı servis olarak kaydediyoruz.
            .service(handlers::create_santral_handler)
            .service(handlers::get_all_santraller_handler)
            .service(handlers::delete_santral_handler)
            .service(handlers::update_santral_handler)
            .service(handlers::get_santral_by_id_handler)
            .service(handlers::dengesizlik_hesapla_handler)
            .service(handlers::create_or_update_kgup_plan_handler)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
