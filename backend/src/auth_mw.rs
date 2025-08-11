// --- 3. DOSYA: backend/src/auth_mw.rs ---
// DÜZELTME: Bu dosya, frontend'den gelen "gizli talimatı"
// anlayacak şekilde akıllı hale getirildi.

use actix_web::{dev::Payload, http::header, Error, FromRequest, HttpRequest};
use futures::future::{ready, Ready};
use uuid::Uuid;
use std::str::FromStr; // Uuid'yi string'den parse etmek için

use crate::auth::{AuthConfig, decode_jwt, Claims};

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: Uuid,
    pub musteri_id: Uuid,
    pub rol: String,
}

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = Ready<Result<Self, Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let auth_cfg = match req.app_data::<actix_web::web::Data<AuthConfig>>() {
            Some(c) => c.clone(),
            None => return ready(Err(actix_web::error::ErrorInternalServerError("auth cfg yok"))),
        };

        let auth_header = match req.headers().get(header::AUTHORIZATION) {
            Some(v) => v.to_str().unwrap_or(""),
            None => return ready(Err(actix_web::error::ErrorUnauthorized("Bearer yok"))),
        };

        if !auth_header.starts_with("Bearer ") {
            return ready(Err(actix_web::error::ErrorUnauthorized("format yanlış")));
        }

        let token = &auth_header[7..];

        match decode_jwt(&auth_cfg, token) {
            Ok(data) => {
                let Claims { sub, mus, rol, .. } = data.claims;
                
                // Başlangıçta, musteri_id token'dan gelendir.
                let mut final_musteri_id = mus;

                // --- YENİ GİZLİ TALİMAT KONTROLÜ ---
                // Eğer kullanıcı admin ise, özel başlığı kontrol et.
                if rol == "admin" {
                    if let Some(impersonate_header) = req.headers().get("X-Impersonate-Musteri-ID") {
                        if let Ok(id_str) = impersonate_header.to_str() {
                            // Başlıktaki ID'yi Uuid'ye çevirmeye çalış.
                            if let Ok(impersonated_id) = Uuid::from_str(id_str) {
                                // Başarılı olursa, musteri_id'yi bu yeni ID ile GÜNCELLE.
                                final_musteri_id = impersonated_id;
                                log::info!("Admin {} kullanıcısı, {} müşterisinin kimliğine bürünüyor.", sub, final_musteri_id);
                            }
                        }
                    }
                }

                ready(Ok(AuthenticatedUser {
                    user_id: sub,
                    musteri_id: final_musteri_id, // Her zaman doğru ID'yi kullan
                    rol,
                }))
            }
            Err(e) => {
                log::warn!("JWT decode hata: {e}");
                ready(Err(actix_web::error::ErrorUnauthorized("token geçersiz")))
            }
        }
    }
}