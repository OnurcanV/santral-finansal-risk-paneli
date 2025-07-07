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
pub struct Santral {
    pub id: Uuid,
    pub ad: String,
    pub tip: String,

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
    pub dengesizlik_miktari_mwh: f64,
    pub dengesizlik_tipi: String,
    pub dengesizlik_tutari_tl: f64,
    pub aciklama: String,
}

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
