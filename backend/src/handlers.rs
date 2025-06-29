// backend/src/handlers.rs

// Gerekli olan her şeyi içeri aktarıyoruz.
// actix_web'den: web (uygulama durumu ve JSON için), HttpResponse (cevap oluşturmak için), Responder (cevap döndürebilmek için), post (routing macro'su için)
use actix_web::{delete, get, put, web, HttpResponse, Responder, post};
// sqlx'ten: Veritabanı bağlantı havuzu tipimiz
use sqlx::PgPool;
// Kendi modüllerimizden: Girdi modeli ve veritabanı fonksiyonu
use crate::models::InputSantral;
use crate::db;
use uuid::Uuid; // Uuid tipini de burada kullanacağız.
use crate::models::{DengesizlikInput, DengesizlikOutput}; // Yeni modelleri import et
use crate::models::{KgupPlanInput}; // Yeni modeli import et

// #[post("/api/santral")] macro'su, bu fonksiyonun sadece '/api/santral' adresine
// gelen HTTP POST isteklerini dinleyeceğini Actix-web'e bildirir.
#[post("/api/santral")]
pub async fn create_santral_handler(
    // pool ve yeni_santral "Extractor" olarak adlandırılır.
    // Actix-web'e, gelen istekten bu verileri bizim için "çıkarmasını" söylerler.
    
    // pool: Uygulama durumu olarak paylaşılan veritabanı bağlantı havuzunu ister.
    pool: web::Data<PgPool>,
    // yeni_santral: İsteğin body'sindeki JSON'u otomatik olarak InputSantral struct'ına dönüştürmesini ister.
    // Eğer JSON hatalıysa, Actix bizim için otomatik olarak 400 Bad Request hatası döndürür!
    yeni_santral: web::Json<InputSantral>,
) -> impl Responder {
    // web::Json bir sarmalayıcıdır (wrapper). .into_inner() ile içindeki asıl veriyi alırız.
    let santral_data = yeni_santral.into_inner();

    // db modülümüzde yazdığımız fonksiyonu çağırıyoruz.
    // pool bir sarmalayıcı olduğu için, asıl bağlantıyı .get_ref() ile ödünç alırız.
    let result = db::create_santral(pool.get_ref(), santral_data).await;

    // Veritabanından dönen sonucu (Result<Santral, sqlx::Error>) işliyoruz.
    match result {
        // Başarılı olursa...
        Ok(santral) => {
            // ...bir HTTP 200 OK cevabı ve body'de yeni oluşturulan santralin JSON halini döndürürüz.
            HttpResponse::Ok().json(santral)
        }
        // Hata olursa...
        Err(e) => {
            // ...terminale hatayı yazdırırız (hata ayıklama için) ve bir HTTP 500 Internal Server Error cevabı döneriz.
            eprintln!("Santral oluşturulurken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

// #[get(...)] macro'su bu fonksiyonun GET isteklerini dinleyeceğini belirtir.
#[get("/api/santraller")]
pub async fn get_all_santraller_handler(
    pool: web::Data<PgPool>,
) -> impl Responder {
    // db modülümüzdeki yeni fonksiyonu çağırıyoruz.
    match db::get_all_santraller(pool.get_ref()).await {
        // Başarılı olursa, santral listesini JSON olarak ve 200 OK status koduyla döndür.
        Ok(santraller) => HttpResponse::Ok().json(santraller),
        // Hata olursa, 500 Internal Server Error döndür.
        Err(e) => {
            eprintln!("Santraller listelenirken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

// #[delete(...)] macro'su, bu fonksiyonun DELETE isteklerini dinleyeceğini belirtir.
// {id} ise URL'den dinamik bir parça alacağımızı gösteren bir "path parameter"dır.
#[delete("/api/santral/{id}")]
pub async fn delete_santral_handler(
    pool: web::Data<PgPool>,
    // web::Path<Uuid> extractor'ı, URL'deki {id} parçasını
    // alıp otomatik olarak bir Uuid tipine dönüştürmeye çalışır.
    id: web::Path<Uuid>,
) -> impl Responder {
    // .into_inner() ile Uuid değerini sarmalayıcısından çıkarırız.
    let santral_id_to_delete = id.into_inner();

    match db::delete_santral_by_id(pool.get_ref(), santral_id_to_delete).await {
        // Eğer db fonksiyonu başarılı olursa...
        Ok(rows_affected) => {
            // ...ve etkilenen satır sayısı 0'dan büyükse (yani silme başarılıysa)...
            if rows_affected > 0 {
                // ...bir HTTP 200 OK ve basit bir başarı mesajı döndürürüz.
                HttpResponse::Ok().json(serde_json::json!({"status": "success", "message": "Santral başarıyla silindi."}))
            } else {
                // ...eğer 0 satır etkilendiyse, o ID'ye sahip bir santral bulunamamıştır.
                HttpResponse::NotFound().json(serde_json::json!({"status": "error", "message": "Santral bulunamadı."}))
            }
        }
        // Eğer db fonksiyonu hata döndürürse...
        Err(e) => {
            eprintln!("Santral silinirken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[put("/api/santral/{id}")]
pub async fn update_santral_handler(
    pool: web::Data<PgPool>,
    // Bu handler, hem URL'den ID'yi hem de isteğin gövdesinden JSON verisini alır.
    id: web::Path<Uuid>,
    // Güncellenecek yeni veriyi JSON olarak alıyoruz.
    santral_data: web::Json<InputSantral>,
) -> impl Responder {
    let santral_id_to_update = id.into_inner();
    let data_to_update = santral_data.into_inner();

    match db::update_santral_by_id(pool.get_ref(), santral_id_to_update, data_to_update).await {
        // Başarılı olursa, güncellenmiş santral verisini JSON olarak geri döndür.
        Ok(updated_santral) => HttpResponse::Ok().json(updated_santral),
        Err(e) => {
            eprintln!("Santral güncellenirken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[get("/api/santral/{id}")]
pub async fn get_santral_by_id_handler(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
) -> impl Responder {
    let santral_id_to_fetch = id.into_inner();
    match db::get_santral_by_id(pool.get_ref(), santral_id_to_fetch).await {
        Ok(santral) => HttpResponse::Ok().json(santral),
        // Eğer sqlx::Error::RowNotFound hatası dönerse, bu o ID'de bir santral olmadığını gösterir.
        // Bu durumda 404 Not Found cevabı dönmek daha doğrudur.
        Err(sqlx::Error::RowNotFound) => {
            HttpResponse::NotFound().json(serde_json::json!({"status": "error", "message": "Santral bulunamadı."}))
        }
        Err(e) => {
            eprintln!("Santral getirilirken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

#[post("/api/hesapla/dengesizlik")]
pub async fn dengesizlik_hesapla_handler(
    inputs: web::Json<Vec<DengesizlikInput>>,
) -> impl Responder {
    
    let outputs: Vec<DengesizlikOutput> = inputs.iter().map(|input| {
        // ... hesaplama mantığı aynı kalıyor ...
        let dengesizlik_miktari = input.gerceklesen_uretim_mwh - input.tahmini_uretim_mwh;
        let mut dengesizlik_tutari: f64 = 0.0;
        let dengesizlik_tipi: String;
        let aciklama: String;

        if dengesizlik_miktari > 0.0 {
            dengesizlik_tipi = "Pozitif Dengesizlik (Fazla Üretim)".to_string();
            let fiyat = input.ptf_tl.min(input.smf_tl);
            dengesizlik_tutari = dengesizlik_miktari * fiyat;
            aciklama = format!("Sistem, fazla ürettiğiniz {:.2} MWh enerjiyi, düşük olan {:.2} TL fiyattan satın aldı.", dengesizlik_miktari, fiyat);
        } else if dengesizlik_miktari < 0.0 {
            dengesizlik_tipi = "Negatif Dengesizlik (Eksik Üretim)".to_string();
            let fiyat = input.ptf_tl.max(input.smf_tl);
            dengesizlik_tutari = dengesizlik_miktari * fiyat;
            aciklama = format!("Sistem, eksik ürettiğiniz {:.2} MWh enerjiyi, yüksek olan {:.2} TL fiyattan adınıza satın aldı.", dengesizlik_miktari.abs(), fiyat);
        } else {
            dengesizlik_tipi = "Dengede".to_string();
            aciklama = "Santral üretim tahmini ile tam dengededir.".to_string();
        }
        
        // --- DEĞİŞİKLİK BURADA ---
        // Artık sadece sonuçları değil, orijinal girdileri de içeren yeni struct'ımızı oluşturuyoruz.
        DengesizlikOutput {
            // Orijinal Girdileri kopyalıyoruz
            tahmini_uretim_mwh: input.tahmini_uretim_mwh,
            gerceklesen_uretim_mwh: input.gerceklesen_uretim_mwh,
            ptf_tl: input.ptf_tl,
            smf_tl: input.smf_tl,
            // Hesaplanan Sonuçlar
            dengesizlik_miktari_mwh: dengesizlik_miktari,
            dengesizlik_tipi,
            dengesizlik_tutari_tl: dengesizlik_tutari,
            aciklama,
        }
    }).collect(); 
    
    HttpResponse::Ok().json(outputs)
}

#[post("/api/santral/{id}/kgupplan")]
pub async fn create_or_update_kgup_plan_handler(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    plan_input: web::Json<KgupPlanInput>,
) -> impl Responder {
    match db::create_or_update_kgup_plan(pool.get_ref(), id.into_inner(), plan_input.into_inner()).await {
        Ok(plan) => HttpResponse::Ok().json(plan),
        Err(e) => {
            eprintln!("KGÜP Planı kaydedilirken hata oluştu: {:?}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}