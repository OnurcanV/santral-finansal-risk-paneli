use std::env;
use anyhow::{anyhow, Result};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation, TokenData};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Argon2/password-hash
use argon2::{Argon2, PasswordVerifier};
use password_hash::{PasswordHash, PasswordHasher, SaltString};
use password_hash::rand_core::OsRng;

/// Uygulama Auth yapılandırması.
#[derive(Debug, Clone)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub jwt_exp_hours: i64,
}

impl AuthConfig {
    pub fn from_env() -> Result<Self> {
        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| anyhow!("JWT_SECRET env yok"))?;
        let jwt_exp_hours: i64 = env::var("JWT_EXP_HOURS")
            .unwrap_or_else(|_| "24".to_string())
            .parse()
            .map_err(|_| anyhow!("JWT_EXP_HOURS sayı değil"))?;
        Ok(Self { jwt_secret, jwt_exp_hours })
    }
}

/// JWT Claims
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,   // user_id
    pub mus: Uuid,   // musteri_id
    pub rol: String, // "admin" | "user"
    pub exp: usize,  // unix ts
}

/// Şifre doğrulama. Hata durumunda false döndürür.
pub fn verify_password(plain: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default()
            .verify_password(plain.as_bytes(), &parsed)
            .is_ok(),
        Err(_) => false,
    }
}

/// Geliştirme amaçlı hash üretme (opsiyonel kullan).
pub fn hash_password(plain: &str) -> Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hashed = argon2
        .hash_password(plain.as_bytes(), &salt)
        .map_err(|e| anyhow!("hash_password hata: {e}"))?
        .to_string();
    Ok(hashed)
}
/// JWT üret.
pub fn create_jwt(cfg: &AuthConfig, user_id: Uuid, musteri_id: Uuid, rol: &str) -> Result<String> {
    let exp = (Utc::now() + Duration::hours(cfg.jwt_exp_hours)).timestamp() as usize;
    let claims = Claims {
        sub: user_id,
        mus: musteri_id,
        rol: rol.to_string(),
        exp,
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(cfg.jwt_secret.as_bytes()),
    )?;
    Ok(token)
}

/// JWT doğrula.
pub fn decode_jwt(cfg: &AuthConfig, token: &str) -> Result<TokenData<Claims>> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(cfg.jwt_secret.as_bytes()),
        &validation,
    )?;
    Ok(data)
}
