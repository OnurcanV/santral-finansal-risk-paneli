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

#[derive(Debug, serde::Serialize)]
pub struct SapmaSaat {
    pub saat: i32,                    // 0..23
    pub saat_ts: chrono::DateTime<chrono::Utc>,
    pub plan_mwh: Option<f64>,
    pub gercek_mwh: Option<f64>,
    pub sapma_mwh: Option<f64>,
    pub sapma_oran: Option<f64>,
}

/// Gün bazlı sapma cevabı (API response).
#[derive(Debug, serde::Serialize)]
pub struct SapmaGunResponse {
    pub santral_id: uuid::Uuid,
    pub gun: chrono::NaiveDate,
    pub rows: Vec<SapmaSaat>,
    pub toplam_plan_mwh: Option<f64>,
    pub toplam_gercek_mwh: Option<f64>,
    pub toplam_sapma_mwh: Option<f64>,
    pub mape_yaklasik: Option<f64>,   // Σ |plan-actual| / Σ plan  (plan>0)
}

#[derive(Debug, serde::Serialize)]
pub struct PlanGercekSaat {
    pub ts_utc: chrono::DateTime<chrono::Utc>,
    pub plan_mwh: Option<f64>,
    pub gercek_mwh: Option<f64>,
    pub sapma_mwh: Option<f64>,
}

#[derive(Debug, serde::Serialize)]
pub struct PlanGercekResponse {
    pub santral_id: uuid::Uuid,
    pub start: chrono::NaiveDate,
    pub end: chrono::NaiveDate, // exclusive
    pub rows: Vec<PlanGercekSaat>,
    pub toplam_plan_mwh: Option<f64>,
    pub toplam_gercek_mwh: Option<f64>,
    pub toplam_sapma_mwh: Option<f64>,
    pub mape_yaklasik: Option<f64>,
}
