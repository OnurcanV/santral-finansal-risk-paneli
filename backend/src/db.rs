// Gerekli modülleri ve tipleri içeri aktarıyoruz.
use crate::models::{InputSantral, Santral};
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{KgupPlan, KgupPlanInput};
use serde_json::json;

pub async fn create_santral(
    pool: &PgPool,
    yeni_santral_data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    // sqlx::query_as! makrosu, sorguyu doğrudan bir string literali olarak bekler.
    // Bu sayede derleme zamanında SQL sorgusunu ve tipleri kontrol edebilir.
    let santral = sqlx::query_as!(
        Santral,
        // --- DEĞİŞİKLİK BURADA ---
        // SQL sorgusunu bir değişkenden almak yerine doğrudan buraya yazıyoruz.
        "
        INSERT INTO santraller (id, ad, tip, kurulu_guc_mw, koordinat_enlem, koordinat_boylam)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, ad, tip, kurulu_guc_mw, koordinat_enlem, koordinat_boylam, olusturma_tarihi
        ",
        // --- DEĞİŞİKLİK SONU ---
        Uuid::new_v4(),
        yeni_santral_data.ad,
        yeni_santral_data.tip,
        yeni_santral_data.kurulu_guc_mw,
        yeni_santral_data.koordinat_enlem,
        yeni_santral_data.koordinat_boylam
    )
    .fetch_one(pool)
    .await?;

    Ok(santral)
}

// Veritabanındaki tüm santral kayıtlarını getiren yeni asenkron fonksiyonumuz.
pub async fn get_all_santraller(pool: &PgPool) -> Result<Vec<Santral>, sqlx::Error> {
    // query_as! makrosunu bu sefer SELECT sorgusu için kullanıyoruz.
    let santraller = sqlx::query_as!(
        Santral,
        // En son eklenenleri en üstte görmek için tarihe göre tersten sıralıyoruz.
        "SELECT * FROM santraller ORDER BY olusturma_tarihi DESC"
    )
    // .fetch_one() yerine .fetch_all() kullanıyoruz.
    // Bu, dönen TÜM satırları bir Vec<Santral> (Santral listesi) içine toplar.
    .fetch_all(pool)
    .await?;

    // Başarılı olursa, santral listesini Ok() içine sararak döndür.
    Ok(santraller)
}

// Belirtilen ID'ye sahip santrali veritabanından silen fonksiyon.
pub async fn delete_santral_by_id(
    pool: &PgPool,
    santral_id: Uuid,
) -> Result<u64, sqlx::Error> {
    // sqlx::query! makrosu, query_as!'a benzer ama sonucu bir struct'a dönüştürmez.
    // Sadece sorguyu çalıştırmak ve etkilenen satır sayısı gibi bilgileri almak için idealdir.
    let result = sqlx::query!(
        "DELETE FROM santraller WHERE id = $1",
        santral_id
    )
    .execute(pool) // Sorguyu çalıştırır ama satır döndürmesini beklemez.
    .await?;

    // .rows_affected(), bu işlemden kaç satırın etkilendiğini (bizim durumumuzda silindiğini) döndürür.
    // Başarılı bir silme işleminde bu değerin 1 olmasını bekleriz.
    Ok(result.rows_affected())
}

// Belirtilen ID'ye sahip santrali, verilen yeni bilgilerle güncelleyen fonksiyon.
pub async fn update_santral_by_id(
    pool: &PgPool,
    santral_id: Uuid,
    // Güncelleme için de yeni santral oluştururken kullandığımız
    // InputSantral struct'ını kullanabiliriz.
    santral_data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    // Bu sefer query_as! makrosunu UPDATE sorgusu için kullanıyoruz.
    let santral = sqlx::query_as!(
        Santral,
        // SQL'de UPDATE sorgusunun yapısı: UPDATE tablo ADI SET sütun1 = $1, ... WHERE id = $N
        // RETURNING *; komutu, güncellenen satırın son halini bize geri döndürür.
        "
        UPDATE santraller 
        SET ad = $1, tip = $2, kurulu_guc_mw = $3, koordinat_enlem = $4, koordinat_boylam = $5
        WHERE id = $6
        RETURNING *
        ",
        santral_data.ad,
        santral_data.tip,
        santral_data.kurulu_guc_mw,
        santral_data.koordinat_enlem,
        santral_data.koordinat_boylam,
        santral_id
    )
    // Güncelleme işlemi de tek bir satırı etkilemeli ve o tek satırı döndürmelidir.
    .fetch_one(pool)
    .await?;

    Ok(santral)
}

// Verilen ID'ye göre tek bir santral getiren fonksiyon.
pub async fn get_santral_by_id(pool: &PgPool, santral_id: Uuid) -> Result<Santral, sqlx::Error> {
    let santral = sqlx::query_as!(
        Santral,
        // WHERE id = $1 şartı ile sadece o ID'ye sahip satırı seçiyoruz.
        "SELECT * FROM santraller WHERE id = $1",
        santral_id
    )
    // Tek bir satır beklediğimiz için fetch_one() kullanıyoruz.
    .fetch_one(pool)
    .await?;

    Ok(santral)
}
// Yeni bir KGÜP planı oluşturur veya o tarihe ait mevcut bir plan varsa onu günceller.
pub async fn create_or_update_kgup_plan(
    pool: &PgPool,
    santral_id: Uuid,
    plan_data: KgupPlanInput,
) -> Result<KgupPlan, sqlx::Error> {
    
    // Gelen f64 listesini, veritabanına yazmak için bir JSON Value'ya dönüştürüyoruz.
    let saatlik_plan_json = json!(plan_data.saatlik_plan_mwh);

    let plan = sqlx::query_as!(
        KgupPlan,
        r#"
        INSERT INTO kgup_planlari (santral_id, plan_tarihi, saatlik_plan_mwh)
        VALUES ($1, $2, $3)
        ON CONFLICT (santral_id, plan_tarihi) 
        DO UPDATE SET saatlik_plan_mwh = EXCLUDED.saatlik_plan_mwh
        RETURNING *
        "#,
        santral_id,
        plan_data.plan_tarihi,
        saatlik_plan_json,
    )
    .fetch_one(pool)
    .await?;

    Ok(plan)
}