<<<<<<< HEAD
use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

// -------------------- SANTRAL --------------------
#[derive(Serialize, Deserialize, Debug, FromRow, Clone)]
=======
//! Ortak veri modelleri

use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};
use uuid::Uuid;

/* ----------- KULLANICI ----------- */

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterUserInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginUserInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow, Clone)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub rol: String,
    pub olusturma_tarihi: DateTime<Utc>,
}

impl User {
    pub fn to_filtered(&self) -> Self {
        let mut me = self.clone();
        me.password_hash.clear();
        me
    }
}

/* ----------- SANTRAL ----------- */

#[derive(Debug, Serialize, Deserialize)]
pub struct InputSantral {
    pub ad: String,
    pub tip: String,
    pub kurulu_guc_mw: f64,
    pub koordinat_enlem: f64,
    pub koordinat_boylam: f64,
}
#[serde_as]
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
pub struct Santral {
    pub id: Uuid,
    pub ad: String,
    pub tip: String,
<<<<<<< HEAD
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
=======

    #[serde_as(as = "DisplayFromStr")]
    pub kurulu_guc_mw: BigDecimal,
    #[serde_as(as = "DisplayFromStr")]
    pub koordinat_enlem: BigDecimal,
    #[serde_as(as = "DisplayFromStr")]
    pub koordinat_boylam: BigDecimal,

    pub kullanici_id: Uuid,
    pub olusturma_tarihi: DateTime<Utc>,
}


/* ----------- KGÜP PLAN ----------- */

#[derive(Debug, Serialize, Deserialize)]
pub struct KgupPlanInput {
    pub plan_tarihi: NaiveDate,
    pub saatlik_plan_mwh: Vec<f64>, // 24 eleman
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct KgupPlan {
    pub id: Uuid,
    pub santral_id: Uuid,
    pub plan_tarihi: NaiveDate,
    pub saatlik_plan_mwh: serde_json::Value,
    pub kullanici_id: Uuid,
    pub olusturma_tarihi: DateTime<Utc>,
}

/* ----------- HESAPLAMA MODEL ----------- */

#[derive(Debug, Serialize, Deserialize)]
pub struct DengesizlikInput {
    pub tahmini_uretim_mwh: f64,
    pub gerceklesen_uretim_mwh: f64,
    pub ptf_tl: f64,
    pub smf_tl: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DengesizlikOutput {
    pub tahmini_uretim_mwh: f64,
    pub gerceklesen_uretim_mwh: f64,
    pub ptf_tl: f64,
    pub smf_tl: f64,
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
    pub dengesizlik_miktari_mwh: f64,
    pub dengesizlik_tipi: String,
    pub dengesizlik_tutari_tl: f64,
    pub aciklama: String,
}

<<<<<<< HEAD
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
=======
#[derive(Debug, Serialize, Deserialize)]
pub struct KgupInput {
    pub kurulu_guc_mw: f64,
    pub fatura_donemi_saat: i32,
    pub eak_orani: f64,
    pub hedef_eak_orani: f64,
    pub birim_kapasite_fiyati: f64,
    pub ceza_fiyati: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KgupOutput {
    pub potansiyel_kapasite_odemesi: f64,
    pub eak_farki: f64,
    pub kgup_kesinti_tutari: f64,
    pub net_sonuc: f64,
    pub aciklama: String,
}

/* ----------- JWT CLAIMS ----------- */

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: Uuid,
    pub email: String, // YENİ EKLENDİ
    pub rol: String,
    pub iat: i64,
    pub exp: i64,
}
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
