use crate::models::{InputSantral, KgupPlan, KgupPlanInput, Santral};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

/// Yeni santral oluşturur ve kaydı döndürür.
///
/// Şimdilik musteri_id NULL kalabilir (portföy entegrasyonu sonraki aşama).
pub async fn create_santral(
    pool: &PgPool,
    yeni_santral_data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    let new_id = Uuid::new_v4();

    let santral = sqlx::query_as!(
        Santral,
        r#"
        INSERT INTO santraller (
            id,
            ad,
            tip,
            kurulu_guc_mw,
            koordinat_enlem,
            koordinat_boylam
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            ad,
            tip,
            kurulu_guc_mw,
            koordinat_enlem,
            koordinat_boylam,
            musteri_id,
            olusturma_tarihi
        "#,
        new_id,
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

/// Tüm santralleri tarihe göre (yeni → eski) döndürür.
pub async fn get_all_santraller(pool: &PgPool) -> Result<Vec<Santral>, sqlx::Error> {
    let santraller = sqlx::query_as!(
        Santral,
        r#"
        SELECT
            id,
            ad,
            tip,
            kurulu_guc_mw,
            koordinat_enlem,
            koordinat_boylam,
            musteri_id,
            olusturma_tarihi
        FROM santraller
        ORDER BY olusturma_tarihi DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(santraller)
}

/// Belirli santrali siler; etkilenen satır sayısını döndürür (1 beklenir).
pub async fn delete_santral_by_id(pool: &PgPool, santral_id: Uuid) -> Result<u64, sqlx::Error> {
    let result = sqlx::query!(
        r#"DELETE FROM santraller WHERE id = $1"#,
        santral_id
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
}

/// Santrali günceller ve güncellenmiş kaydı döndürür.
pub async fn update_santral_by_id(
    pool: &PgPool,
    santral_id: Uuid,
    santral_data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    let santral = sqlx::query_as!(
        Santral,
        r#"
        UPDATE santraller
        SET
            ad = $1,
            tip = $2,
            kurulu_guc_mw = $3,
            koordinat_enlem = $4,
            koordinat_boylam = $5
        WHERE id = $6
        RETURNING
            id,
            ad,
            tip,
            kurulu_guc_mw,
            koordinat_enlem,
            koordinat_boylam,
            musteri_id,
            olusturma_tarihi
        "#,
        santral_data.ad,
        santral_data.tip,
        santral_data.kurulu_guc_mw,
        santral_data.koordinat_enlem,
        santral_data.koordinat_boylam,
        santral_id
    )
    .fetch_one(pool)
    .await?;

    Ok(santral)
}

/// ID ile tek santral getirir.
pub async fn get_santral_by_id(pool: &PgPool, santral_id: Uuid) -> Result<Santral, sqlx::Error> {
    let santral = sqlx::query_as!(
        Santral,
        r#"
        SELECT
            id,
            ad,
            tip,
            kurulu_guc_mw,
            koordinat_enlem,
            koordinat_boylam,
            musteri_id,
            olusturma_tarihi
        FROM santraller
        WHERE id = $1
        "#,
        santral_id
    )
    .fetch_one(pool)
    .await?;

    Ok(santral)
}

/// KGÜP planı ekler veya (santral_id + plan_tarihi) benzersizliğinde günceller.
/// JSON alanı otomatik güncellenir. Güncel kayıt döner.
pub async fn create_or_update_kgup_plan(
    pool: &PgPool,
    santral_id: Uuid,
    plan_data: KgupPlanInput,
) -> Result<KgupPlan, sqlx::Error> {
    // Vec<f64> → JSON
    let saatlik_plan_json = json!(plan_data.saatlik_plan_mwh);

    let plan = sqlx::query_as!(
        KgupPlan,
        r#"
        INSERT INTO kgup_planlari (
            santral_id,
            plan_tarihi,
            saatlik_plan_mwh
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (santral_id, plan_tarihi)
        DO UPDATE
          SET saatlik_plan_mwh = EXCLUDED.saatlik_plan_mwh
        RETURNING
            id,
            santral_id,
            plan_tarihi,
            saatlik_plan_mwh,
            olusturma_tarihi
        "#,
        santral_id,
        plan_data.plan_tarihi,
        saatlik_plan_json
    )
    .fetch_one(pool)
    .await?;

    Ok(plan)
}
