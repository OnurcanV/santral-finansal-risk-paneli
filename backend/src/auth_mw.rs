use actix_web::{dev::Payload, http::header, Error, FromRequest, HttpRequest};
use futures::future::{ready, Ready};
use uuid::Uuid;

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
        // Config
        let auth_cfg = match req.app_data::<actix_web::web::Data<AuthConfig>>() {
            Some(c) => c.clone(),
            None => return ready(Err(actix_web::error::ErrorInternalServerError("auth cfg yok"))),
        };

        // Authorization header
        let header_val = match req.headers().get(header::AUTHORIZATION) {
            Some(v) => v,
            None => return ready(Err(actix_web::error::ErrorUnauthorized("Bearer yok"))),
        };

        let header_str = match header_val.to_str() {
            Ok(s) => s,
            Err(_) => return ready(Err(actix_web::error::ErrorUnauthorized("geçersiz header"))),
        };

        // "Bearer token"
        let parts: Vec<&str> = header_str.split_whitespace().collect();
        if parts.len() != 2 || parts[0] != "Bearer" {
            return ready(Err(actix_web::error::ErrorUnauthorized("format yanlış")));
        }
        let token = parts[1];

        // Decode
        match decode_jwt(&auth_cfg, token) {
            Ok(data) => {
                let Claims { sub, mus, rol, .. } = data.claims;
                ready(Ok(AuthenticatedUser {
                    user_id: sub,
                    musteri_id: mus,
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
