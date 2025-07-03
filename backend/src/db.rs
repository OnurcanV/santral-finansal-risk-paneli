//! Veritabanı erişim katmanı

use crate::models::{
    InputSantral, KgupPlan, KgupPlanInput, RegisterUserInput, Santral, User,
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use chrono::Utc;    
use bigdecimal::BigDecimal;
use serde_json::json;
use sqlx::PgPool;
use std::str::FromStr;
use uuid::Uuid;

fn bd(v: f64) -> BigDecimal {
    BigDecimal::from_str(&v.to_string()).unwrap()
}

/* ---------- Kullanıcı ---------- */

pub async fn register_user(pool: &PgPool, input: RegisterUserInput) -> Result<User, sqlx::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let hashed = Argon2::default()
        .hash_password(input.password.as_bytes(), &salt)
        .map_err(|e| sqlx::Error::Protocol(e.to_string().into()))?
        .to_string();

    sqlx::query_as!(
        User,
        r#"
        INSERT INTO kullanicilar (email, password_hash)
        VALUES ($1, $2)
        RETURNING
            id                as "id!: Uuid",
            email,
            password_hash,
            rol               as "rol!: String",
            olusturma_tarihi  as "olusturma_tarihi!: chrono::DateTime<Utc>"
        "#,
        input.email.to_lowercase(),
        hashed
    )
    .fetch_one(pool)
    .await
}

pub async fn find_user_by_email(
    pool: &PgPool,
    email: String,
) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(
        User,
        r#"
        SELECT
            id                as "id!: Uuid",
            email,
            password_hash,
            rol               as "rol!: String",
            olusturma_tarihi  as "olusturma_tarihi!: chrono::DateTime<Utc>"
        FROM kullanicilar
        WHERE email = $1
        "#,
        email.to_lowercase()
    )
    .fetch_optional(pool)
    .await
}

/* ---------- Santral CRUD ---------- */

pub async fn create_santral(
    pool: &PgPool,
    s: InputSantral,
    uid: Uuid,
) -> Result<Santral, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        INSERT INTO santraller
            (ad, tip, kurulu_guc_mw, koordinat_enlem, koordinat_boylam, kullanici_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id               as "id!: Uuid",
            ad,
            tip,
            kurulu_guc_mw    as "kurulu_guc_mw!: BigDecimal",
            koordinat_enlem  as "koordinat_enlem!: BigDecimal",
            koordinat_boylam as "koordinat_boylam!: BigDecimal",
            kullanici_id     as "kullanici_id!: Uuid",
            olusturma_tarihi as "olusturma_tarihi!: chrono::DateTime<Utc>"
        "#,
        s.ad,
        s.tip,
        bd(s.kurulu_guc_mw),
        bd(s.koordinat_enlem),
        bd(s.koordinat_boylam),
        uid
    )
    .fetch_one(pool)
    .await
}

pub async fn get_all_santraller(pool: &PgPool, uid: Uuid) -> Result<Vec<Santral>, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        SELECT
            id               as "id!: Uuid",
            ad,
            tip,
            kurulu_guc_mw    as "kurulu_guc_mw!: BigDecimal",
            koordinat_enlem  as "koordinat_enlem!: BigDecimal",
            koordinat_boylam as "koordinat_boylam!: BigDecimal",
            kullanici_id     as "kullanici_id!: Uuid",
            olusturma_tarihi as "olusturma_tarihi!: chrono::DateTime<Utc>"
        FROM santraller
        WHERE kullanici_id = $1
        ORDER BY olusturma_tarihi DESC
        "#,
        uid
    )
    .fetch_all(pool)
    .await
}

pub async fn get_santral_by_id(
    pool: &PgPool,
    id: Uuid,
    uid: Uuid,
) -> Result<Option<Santral>, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        SELECT
            id               as "id!: Uuid",
            ad,
            tip,
            kurulu_guc_mw    as "kurulu_guc_mw!: BigDecimal",
            koordinat_enlem  as "koordinat_enlem!: BigDecimal",
            koordinat_boylam as "koordinat_boylam!: BigDecimal",
            kullanici_id     as "kullanici_id!: Uuid",
            olusturma_tarihi as "olusturma_tarihi!: chrono::DateTime<Utc>"
        FROM santraller
        WHERE id = $1 AND kullanici_id = $2
        "#,
        id,
        uid
    )
    .fetch_optional(pool)
    .await
}

pub async fn update_santral_by_id(
    pool: &PgPool,
    id: Uuid,
    uid: Uuid,
    s: InputSantral,
) -> Result<Santral, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        UPDATE santraller
        SET ad = $1,
            tip = $2,
            kurulu_guc_mw = $3,
            koordinat_enlem = $4,
            koordinat_boylam = $5
        WHERE id = $6 AND kullanici_id = $7
        RETURNING
            id               as "id!: Uuid",
            ad,
            tip,
            kurulu_guc_mw    as "kurulu_guc_mw!: BigDecimal",
            koordinat_enlem  as "koordinat_enlem!: BigDecimal",
            koordinat_boylam as "koordinat_boylam!: BigDecimal",
            kullanici_id     as "kullanici_id!: Uuid",
            olusturma_tarihi as "olusturma_tarihi!: chrono::DateTime<Utc>"
        "#,
        s.ad,
        s.tip,
        bd(s.kurulu_guc_mw),
        bd(s.koordinat_enlem),
        bd(s.koordinat_boylam),
        id,
        uid
    )
    .fetch_one(pool)
    .await
}

pub async fn delete_santral_by_id(pool: &PgPool, id: Uuid, uid: Uuid) -> Result<u64, sqlx::Error> {
    Ok(sqlx::query!(
        r#"DELETE FROM santraller WHERE id = $1 AND kullanici_id = $2"#,
        id,
        uid
    )
    .execute(pool)
    .await?
    .rows_affected())
}

/* ---------- KGÜP PLAN ---------- */

pub async fn create_or_update_kgup_plan(
    pool: &PgPool,
    santral_id: Uuid,
    uid: Uuid,
    plan: KgupPlanInput,
) -> Result<KgupPlan, sqlx::Error> {
    let json_plan = json!(plan.saatlik_plan_mwh);

    sqlx::query_as!(
        KgupPlan,
        r#"
        INSERT INTO kgup_planlari
            (santral_id, plan_tarihi, saatlik_plan_mwh, kullanici_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (santral_id, plan_tarihi)
        DO UPDATE SET
            saatlik_plan_mwh = EXCLUDED.saatlik_plan_mwh,
            kullanici_id     = EXCLUDED.kullanici_id
        RETURNING
            id               as "id!: Uuid",
            santral_id       as "santral_id!: Uuid",
            plan_tarihi,
            saatlik_plan_mwh,
            kullanici_id     as "kullanici_id!: Uuid",
            olusturma_tarihi as "olusturma_tarihi!: chrono::DateTime<Utc>"
        "#,
        santral_id,
        plan.plan_tarihi,
        json_plan,
        uid
    )
    .fetch_one(pool)
    .await
}
