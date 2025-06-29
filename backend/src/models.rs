// backend/src/models.rs
use bigdecimal::BigDecimal; // YENİ
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::NaiveDate;
use serde_json::Value as JsonValue;

#[derive(Serialize, Deserialize, Debug, FromRow)]
pub struct Santral {
    pub id: Uuid,
    pub ad: String,
    pub tip: String,
    pub kurulu_guc_mw: BigDecimal, // DEĞİŞTİ
    pub koordinat_enlem: BigDecimal, // DEĞİŞTİ
    pub koordinat_boylam: BigDecimal, // DEĞİŞTİ
    pub olusturma_tarihi: DateTime<Utc>,
}

#[derive(Deserialize, Debug)]
pub struct InputSantral {
    pub ad: String,
    pub tip: String,
    pub kurulu_guc_mw: BigDecimal, // DEĞİŞTİ
    pub koordinat_enlem: BigDecimal, // DEĞİŞTİ
    pub koordinat_boylam: BigDecimal, // DEĞİŞTİ
}

// Dengesizlik simülasyonu için frontend'den gelecek olan girdi.
#[derive(Deserialize, Debug)]
pub struct DengesizlikInput {
    pub tahmini_uretim_mwh: f64,
    pub gerceklesen_uretim_mwh: f64,
    pub ptf_tl: f64, // Piyasa Takas Fiyatı
    pub smf_tl: f64, // Sistem Marjinal Fiyatı
}

// Hesaplama sonucu backend'den frontend'e gönderilecek olan çıktı.
#[derive(Serialize, Debug)]
pub struct DengesizlikOutput {
    // Orijinal Girdiler
    pub tahmini_uretim_mwh: f64,
    pub gerceklesen_uretim_mwh: f64,
    pub ptf_tl: f64,
    pub smf_tl: f64,
    // Hesaplanan Sonuçlar
    pub dengesizlik_miktari_mwh: f64,
    pub dengesizlik_tipi: String,
    pub dengesizlik_tutari_tl: f64,
    pub aciklama: String,
}

// Frontend'den bir KGÜP planı kaydetme isteği geldiğinde alınacak olan veri.
#[derive(Deserialize, Debug)]
pub struct KgupPlanInput {
    // Planın hangi tarih için olduğu, örn: "2025-07-15"
    pub plan_tarihi: NaiveDate,
    // 24 saatlik üretim değerlerinin listesi
    pub saatlik_plan_mwh: Vec<f64>,
}

// Veritabanındaki 'kgup_planlari' tablosunun bir satırını temsil eden struct.
#[derive(Serialize, Debug, FromRow)]
pub struct KgupPlan {
    pub id: Uuid,
    pub santral_id: Uuid,
    pub plan_tarihi: NaiveDate,
    // Veritabanındaki JSONB sütununu, 'serde_json' kütüphanesinin 'Value' tipi ile temsil ediyoruz.
    pub saatlik_plan_mwh: JsonValue,
    pub olusturma_tarihi: DateTime<Utc>,
}

