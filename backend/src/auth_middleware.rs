use actix_web::{dev::Payload, Error as ActixError, FromRequest, HttpRequest};
use std::future::{ready, Ready};
use crate::models::TokenClaims;
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::env;

#[derive(Debug)]
pub struct AuthUser {
    pub id: uuid::Uuid,
    pub rol: String,
}

impl FromRequest for AuthUser {
    type Error = ActixError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        if let Some(auth_header) = req.headers().get("Authorization") {
            if let Ok(auth_str) = auth_header.to_str() {
                if auth_str.starts_with("Bearer ") {
                    let token = &auth_str[7..];
                    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "default_secret".to_string());
                    
                    if let Ok(token_data) = decode::<TokenClaims>(
                        token,
                        &DecodingKey::from_secret(secret.as_ref()),
                        &Validation::default(),
                    ) {
                        return ready(Ok(AuthUser {
                            id: token_data.claims.sub,
                            rol: token_data.claims.rol,
                        }));
                    }
                }
            }
        }
        ready(Err(actix_web::error::ErrorUnauthorized("Geçersiz veya eksik token.")))
    }
}