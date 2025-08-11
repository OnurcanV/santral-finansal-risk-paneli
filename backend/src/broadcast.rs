// Dosya: backend/src/broadcast.rs
// YENİ DOSYA: Bu dosyayı projenize ekleyin.

use actix::Message; // <-- YENİ: Actor mesajı olabilmesi için.
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

/// DÜZELTME: Bu struct'ın bir Actix mesajı olduğunu belirtiyoruz.
/// #[rtype(result = "()")] -> Bu mesaj işlendiğinde bir sonuç dönmeyeceğini belirtir.
#[derive(Clone, Debug, Serialize, Message)]
#[rtype(result = "()")]
pub struct UretimBroadcastMessage {
    pub musteri_id: Uuid,
    pub santral_id: Uuid,
    pub santral_ad: String,
    pub anlik_uretim_mw: BigDecimal,
    pub zaman_utc: DateTime<Utc>,
}