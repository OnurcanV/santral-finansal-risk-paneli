// Ortam değişkenlerini okumak için standart kütüphane
use std::env;
// Herhangi bir hata oluştuğunda kolayca kullanmak için anyhow crate'i
use anyhow::{anyhow, Result};
// Zaman işlemleri için chrono crate'i (tarih, süre vs.)
use chrono::{Duration, Utc};
// JSON Web Token (JWT) işlemleri için jsonwebtoken crate'i
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation, TokenData};
// Veri yapılarını serileştirmek ve deserialize etmek için serde crate'i
use serde::{Deserialize, Serialize};
// UUID (benzersiz kimlik) tipi için uuid crate'i
use uuid::Uuid;

// Şifreleme ve doğrulama için Argon2 algoritması ve ilgili yardımcı crate'ler
use argon2::{Argon2, PasswordVerifier};
// Şifre hash yapısı ve oluşturmak için gerekli araçlar
use password_hash::{PasswordHash, PasswordHasher, SaltString};
// Rastgele sayı üreteci (salt için)
use password_hash::rand_core::OsRng;


/// Uygulamanın kimlik doğrulama (auth) yapılandırmasını tutan yapı.
/// Burada JWT imzalamak için gizli anahtar ve token geçerlilik süresi bulunur.
#[derive(Debug, Clone)]
pub struct AuthConfig {
    pub jwt_secret: String,   // JWT imzalama için gizli anahtar (secret key)
    pub jwt_exp_hours: i64,   // Token geçerlilik süresi (saat olarak)
}

impl AuthConfig {
    /// Ortam değişkenlerinden config değerlerini okuyup yapı oluşturur.
    /// Eğer JWT_SECRET yoksa veya JWT_EXP_HOURS sayı değilse hata döner.
    pub fn from_env() -> Result<Self> {
        // JWT_SECRET ortam değişkeni zorunlu, yoksa hata verir
        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| anyhow!("JWT_SECRET env yok"))?;
        // JWT_EXP_HOURS varsa sayıya çevirir, yoksa 24 saat varsayılan olarak atanır
        let jwt_exp_hours: i64 = env::var("JWT_EXP_HOURS")
            .unwrap_or_else(|_| "24".to_string())
            .parse()
            .map_err(|_| anyhow!("JWT_EXP_HOURS sayı değil"))?;
        // Config yapısını döner
        Ok(Self { jwt_secret, jwt_exp_hours })
    }
}

/// JWT içinde taşınacak kullanıcı bilgilerini temsil eder.
/// Bu yapının alanları token payload'una yazılır ve okunur.
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,   // Kullanıcı ID'si (subject)
    pub mus: Uuid,   // Müşteri ID'si (uygulamaya özgü)
    pub rol: String, // Kullanıcı rolü (admin, user vb.)
    pub exp: usize,  // Token'ın sona erme zamanı (Unix timestamp)
}

/// Kullanıcının şifresini doğrulamak için kullanılır.
/// Düz metin şifre ile hash edilmiş şifreyi karşılaştırır.
/// Başarılıysa true döner, aksi halde false.
/// Hata durumunda false döner.
pub fn verify_password(plain: &str, hash: &str) -> bool {
    match PasswordHash::new(hash) {
        Ok(parsed) => Argon2::default()
            .verify_password(plain.as_bytes(), &parsed)
            .is_ok(),  // Şifre doğrulandı mı?
        Err(_) => false, // Hash okunamadıysa başarısız
    }
}

/// Geliştirme ve test amaçlı düz metin şifreyi Argon2 ile hash eder.
/// Gerçek uygulamada kullanıcı şifresi kayıt için kullanılır.
/// Rastgele salt eklenir, böylece aynı şifre farklı hash üretir.
pub fn hash_password(plain: &str) -> Result<String> {
    // Rastgele salt oluşturulur
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    // Şifre hashlenir, hata varsa custom hata mesajı döner
    let hashed = argon2
        .hash_password(plain.as_bytes(), &salt)
        .map_err(|e| anyhow!("hash_password hata: {e}"))?
        .to_string();
    // Hash string olarak döner
    Ok(hashed)
}

/// JWT token oluşturur.
/// Kullanıcı bilgileri ve config parametreleri kullanılarak token payload hazırlanır.
/// Token HS256 algoritmasıyla imzalanır.
/// Token geçerlilik süresi config'ten alınır.
pub fn create_jwt(cfg: &AuthConfig, user_id: Uuid, musteri_id: Uuid, rol: &str) -> Result<String> {
    // Token'ın sona erme zamanı hesaplanır (şimdiki zaman + geçerlilik süresi)
    let exp = (Utc::now() + Duration::hours(cfg.jwt_exp_hours)).timestamp() as usize;

    // Token payload'u (claims) oluşturulur
    let claims = Claims {
        sub: user_id,
        mus: musteri_id,
        rol: rol.to_string(),
        exp,
    };

    // Token imzalanarak oluşturulur
    let token = encode(
        &Header::new(Algorithm::HS256),                 // Kullanılan algoritma HS256
        &claims,                                        // Payload
        &EncodingKey::from_secret(cfg.jwt_secret.as_bytes()), // Gizli anahtar
    )?;

    // Oluşturulan JWT string olarak döner
    Ok(token)
}

/// Gelen JWT token'ı doğrular ve payload'u çözer.
/// Token imzasını ve süresini kontrol eder.
/// Geçerliyse çözümlenmiş token verisini döner.
pub fn decode_jwt(cfg: &AuthConfig, token: &str) -> Result<TokenData<Claims>> {
    // Doğrulama ayarları, algoritma belirtilir
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true; // Token süresi kontrol edilsin

    // Token decode edilir, imza ve expiration kontrolü yapılır
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(cfg.jwt_secret.as_bytes()),
        &validation,
    )?;

    // Çözümlenmiş ve doğrulanmış token verisi döner
    Ok(data)
}