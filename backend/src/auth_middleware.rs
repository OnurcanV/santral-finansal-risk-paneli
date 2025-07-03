use actix_web::{dev::Payload, error::ErrorUnauthorized, http::header, FromRequest, HttpRequest};
use futures::future::{ready, Ready};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::env;
use uuid::Uuid;

use crate::models::TokenClaims;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub rol: String,
}

impl FromRequest for AuthUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let bearer = req
            .headers()
            .get(header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "))
            .map(String::from);

        let token = match bearer {
            Some(t) => t,
            None => return ready(Err(ErrorUnauthorized("Bearer token eksik"))),
        };

        let secret = env::var("JWT_SECRET").expect("JWT_SECRET tanımlı değil");
        match decode::<TokenClaims>(
            &token,
            &DecodingKey::from_secret(secret.as_ref()),
            &Validation::default(),
        ) {
            Ok(data) => ready(Ok(AuthUser {
                id: data.claims.sub,
                rol: data.claims.rol,
            })),
            Err(_) => ready(Err(ErrorUnauthorized("Geçersiz token"))),
        }
    }
}
