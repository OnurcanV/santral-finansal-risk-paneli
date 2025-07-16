use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

// -------------------- SANTRAL --------------------
#[derive(Serialize, Deserialize, Debug, FromRow, Clone)]
pub struct Santral {
    pub id: Uuid,
    pub ad: String,
    pub tip: String,
    pub kurulu_guc_mw: BigDecimal,
    pub koordinat_enlem: BigDecimal,
    pub koordinat_boylam: BigDecimal,
    pub musteri_id: Option<Uuid>,        // yeni
    pub olusturma_tarihi: DateTime<Utc>, // düzeltildi
}

#[derive(Deserialize, Debug, Clone)]
pub struct InputSantral {
    pub ad: String,
    pub tip: String,
    pub kurulu_guc_mw: BigDecimal,
    pub koordinat_enlem: BigDecimal,
    pub koordinat_boylam: BigDecimal,
}

// -------------------- DENGESİZLİK --------------------
#[derive(Deserialize, Debug)]
pub struct DengesizlikInput {
    pub tahmini_uretim_mwh: f64,
    pub gerceklesen_uretim_mwh: f64,
    pub ptf_tl: f64,
    pub smf_tl: f64,
}

#[derive(Serialize, Debug)]
pub struct DengesizlikOutput {
    pub tahmini_uretim_mwh: f64,
    pub gerceklesen_uretim_mwh: f64,
    pub ptf_tl: f64,
    pub smf_tl: f64,
    pub dengesizlik_miktari_mwh: f64,
    pub dengesizlik_tipi: String,
    pub dengesizlik_tutari_tl: f64,
    pub aciklama: String,
}

// -------------------- KGÜP --------------------
#[derive(Deserialize, Debug)]
pub struct KgupPlanInput {
    pub plan_tarihi: NaiveDate,
    pub saatlik_plan_mwh: Vec<f64>, // düzeltildi
}

#[derive(Serialize, Debug, FromRow, Clone)]
pub struct KgupPlan {
    pub id: Uuid,
    pub santral_id: Uuid,
    pub plan_tarihi: NaiveDate,
    pub saatlik_plan_mwh: JsonValue,
    pub olusturma_tarihi: DateTime<Utc>, // düzeltildi
}

// -------------------- AUTH --------------------
#[derive(Debug, FromRow, Serialize)]
pub struct Musteri {
    pub id: Uuid,
    pub ad: String,
    pub aktif: bool,
    pub olusturma_tarihi: DateTime<Utc>,
}

#[derive(Debug, FromRow, Serialize)]
pub struct Kullanici {
    pub id: Uuid,
    pub musteri_id: Uuid,
    pub email: String,
    pub sifre_hash: String,
    pub ad_soyad: Option<String>,
    pub rol: String,
    pub aktif: bool,
    pub olusturma_tarihi: DateTime<Utc>,
}
