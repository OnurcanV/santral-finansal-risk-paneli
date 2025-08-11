// Dosya: backend/src/generator.rs
// BU DOSYAYI GÜNCELLEYİN

use std::time::Duration;
use sqlx::PgPool;
use tokio::sync::broadcast::Sender;
use crate::broadcast::UretimBroadcastMessage;
use crate::db;
use bigdecimal::{BigDecimal, FromPrimitive, ToPrimitive};
use rand::Rng;
use tokio::time;

pub async fn start_data_generator(pool: PgPool, tx: Sender<UretimBroadcastMessage>) {
    log::info!("🚀 Veri Jeneratörü (Yayıncı ile) başlatılıyor...");

    let mut interval = time::interval(Duration::from_secs(60));

    loop {
        interval.tick().await;
        log::info!("[GENERATOR] Tick! Yeni veriler üretiliyor...");

        let santraller = match db::get_all_santraller(&pool).await {
            Ok(s) => s,
            Err(e) => {
                log::error!("[GENERATOR] Santraller çekilemedi: {}", e);
                continue;
            }
        };

        if santraller.is_empty() {
            log::warn!("[GENERATOR] Veritabanında hiç santral bulunamadı. Veri üretimi atlanıyor.");
            continue;
        }

        for santral in santraller {
            let uretim_verisi = {
                // DÜZELTME: Deprecated uyarılarını gidermek için modern kullanımı tercih ediyoruz.
                let mut rng = rand::thread_rng();
                if let Some(kurulu_guc) = santral.kurulu_guc_mw.to_f64() {
                    let anlik_uretim_f64 = kurulu_guc * rng.gen_range(0.8..1.0);
                    BigDecimal::from_f64(anlik_uretim_f64)
                } else {
                    None
                }
            };

            if let Some(anlik_uretim_bd) = uretim_verisi {
                 let insert_result = db::insert_uretim_olcumu(&pool, santral.id, anlik_uretim_bd.clone()).await;
                 
                 match insert_result {
                    Ok(yeni_olcum) => {
                        log::info!("[GENERATOR] Santral '{}' için yeni üretim verisi eklendi: {:.2} MW", santral.ad, anlik_uretim_bd.to_f64().unwrap_or(0.0));
                        
                        if let Some(musteri_id) = santral.musteri_id {
                            let broadcast_message = UretimBroadcastMessage {
                                musteri_id,
                                santral_id: santral.id,
                                santral_ad: santral.ad.clone(),
                                anlik_uretim_mw: anlik_uretim_bd.clone(),
                                zaman_utc: yeni_olcum.zaman_utc,
                            };

                            if let Err(e) = tx.send(broadcast_message) {
                                log::trace!("[GENERATOR] Broadcast hatası (muhtemelen abone yok): {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("[GENERATOR] Santral '{}' için üretim verisi eklenirken hata: {}", santral.ad, e);
                    }
                }
            } else {
                log::error!("[GENERATOR] BigDecimal'e dönüştürme hatası oluştu.");
            }
        }
    }
}