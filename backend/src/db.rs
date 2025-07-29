// src/db.rs — derlenebilir, sqlx-query kontrollü sürüm
// -----------------------------------------------
use crate::models::{
    InputSantral, KgupPlan, KgupPlanInput, Santral, SapmaSaat,
};
use bigdecimal::{BigDecimal, ToPrimitive};
use chrono::{DateTime, NaiveDate, Utc};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

//-----------------------------------------------------------
// SANTRAL CRUD
//-----------------------------------------------------------

/// Yeni santral ekler ve kaydı döndürür.
/// `musteri_id` şimdilik NULL bırakılabilir.
pub async fn create_santral(
    pool: &PgPool,
    data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    let new_id = Uuid::new_v4();

    sqlx::query_as!(
        Santral,
        r#"
        INSERT INTO santraller (
            id, ad, tip, kurulu_guc_mw,
            koordinat_enlem, koordinat_boylam
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id, ad, tip, kurulu_guc_mw,
            koordinat_enlem, koordinat_boylam,
            musteri_id, olusturma_tarihi
        "#,
        new_id,
        data.ad,
        data.tip,
        data.kurulu_guc_mw,
        data.koordinat_enlem,
        data.koordinat_boylam,
    )
    .fetch_one(pool)
    .await
}

/// Tüm santralleri (yeni → eski) getirir.
pub async fn get_all_santraller(pool: &PgPool) -> Result<Vec<Santral>, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        SELECT id, ad, tip, kurulu_guc_mw,
               koordinat_enlem, koordinat_boylam,
               musteri_id, olusturma_tarihi
        FROM   santraller
        ORDER  BY olusturma_tarihi DESC
        "#
    )
    .fetch_all(pool)
    .await
}

/// Santrali günceller.
pub async fn update_santral_by_id(
    pool: &PgPool,
    santral_id: Uuid,
    data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        UPDATE santraller SET
            ad              = $1,
            tip             = $2,
            kurulu_guc_mw   = $3,
            koordinat_enlem = $4,
            koordinat_boylam= $5
        WHERE id = $6
        RETURNING id, ad, tip, kurulu_guc_mw,
                  koordinat_enlem, koordinat_boylam,
                  musteri_id, olusturma_tarihi
        "#,
        data.ad,
        data.tip,
        data.kurulu_guc_mw,
        data.koordinat_enlem,
        data.koordinat_boylam,
        santral_id,
    )
    .fetch_one(pool)
    .await
}

/// Santral siler; etkilenen satır sayısını döndürür.
pub async fn delete_santral_by_id(
    pool: &PgPool,
    santral_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let res = sqlx::query!(
        "DELETE FROM santraller WHERE id = $1",
        santral_id
    )
    .execute(pool)
    .await?;
    Ok(res.rows_affected())
}

/// ID ile santral getirir.
pub async fn get_santral_by_id(
    pool: &PgPool,
    santral_id: Uuid,
) -> Result<Santral, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        SELECT id, ad, tip, kurulu_guc_mw,
               koordinat_enlem, koordinat_boylam,
               musteri_id, olusturma_tarihi
        FROM   santraller
        WHERE  id = $1
        "#,
        santral_id
    )
    .fetch_one(pool)
    .await
}

//-----------------------------------------------------------
// KGÜP PLAN
//-----------------------------------------------------------

/// KGÜP planı ekler veya günceller.
pub async fn create_or_update_kgup_plan(
    pool: &PgPool,
    santral_id: Uuid,
    plan: KgupPlanInput,
) -> Result<KgupPlan, sqlx::Error> {
    let saatlik_plan_json = json!(plan.saatlik_plan_mwh);

    sqlx::query_as!(
        KgupPlan,
        r#"
        INSERT INTO kgup_planlari (
            santral_id, plan_tarihi, saatlik_plan_mwh
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (santral_id, plan_tarihi)
        DO UPDATE SET saatlik_plan_mwh = EXCLUDED.saatlik_plan_mwh
        RETURNING id, santral_id, plan_tarihi,
                  saatlik_plan_mwh, olusturma_tarihi
        "#,
        santral_id,
        plan.plan_tarihi,
        saatlik_plan_json,
    )
    .fetch_one(pool)
    .await
}

//-----------------------------------------------------------
// MÜŞTERİYE GÖRE İŞLEMLER
//-----------------------------------------------------------

pub async fn create_santral_for_musteri(
    pool: &PgPool,
    musteri_id: Uuid,
    data: InputSantral,
) -> Result<Santral, sqlx::Error> {
    let new_id = Uuid::new_v4();
    sqlx::query_as!(
        Santral,
        r#"
        INSERT INTO santraller (
            id, ad, tip, kurulu_guc_mw,
            koordinat_enlem, koordinat_boylam, musteri_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id, ad, tip, kurulu_guc_mw,
                  koordinat_enlem, koordinat_boylam,
                  musteri_id, olusturma_tarihi
        "#,
        new_id,
        data.ad,
        data.tip,
        data.kurulu_guc_mw,
        data.koordinat_enlem,
        data.koordinat_boylam,
        musteri_id,
    )
    .fetch_one(pool)
    .await
}

pub async fn get_santraller_by_musteri(
    pool: &PgPool,
    musteri_id: Uuid,
) -> Result<Vec<Santral>, sqlx::Error> {
    sqlx::query_as!(
        Santral,
        r#"
        SELECT id, ad, tip, kurulu_guc_mw,
               koordinat_enlem, koordinat_boylam,
               musteri_id, olusturma_tarihi
        FROM   santraller
        WHERE  musteri_id = $1
        ORDER  BY olusturma_tarihi DESC
        "#,
        musteri_id
    )
    .fetch_all(pool)
    .await
}

pub async fn santral_belongs_to_musteri(
    pool: &PgPool,
    santral_id: Uuid,
    musteri_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let exists = sqlx::query_scalar!(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM santraller
            WHERE id = $1 AND musteri_id = $2
        ) AS "exists!"
        "#,
        santral_id,
        musteri_id
    )
    .fetch_one(pool)
    .await?;
    Ok(exists)
}

//-----------------------------------------------------------
// GERÇEK ZAMANLI ÜRETİM (WebSocket görünümü)
//-----------------------------------------------------------

#[derive(Debug, serde::Serialize)]
pub struct WsSantralUretimRow {
    pub id: Uuid,
    pub ad: String,
    pub kurulu_guc_mw: BigDecimal,
    pub son_mw: Option<f64>,
    pub son_ts: Option<DateTime<Utc>>,
}

pub async fn get_son_uretimler_by_musteri(
    pool: &PgPool,
    musteri_id: Uuid,
) -> Result<Vec<WsSantralUretimRow>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        SELECT
            s.id,
            s.ad,
            s.kurulu_guc_mw,
            u.guc_mw :: float8 AS "son_mw?",
            u.zaman_utc        AS "son_ts?"
        FROM santraller s
        LEFT JOIN LATERAL (
            SELECT guc_mw, zaman_utc
            FROM uretim_olcumleri
            WHERE santral_id = s.id
            ORDER BY zaman_utc DESC
            LIMIT 1
        ) u ON TRUE
        WHERE s.musteri_id = $1
        ORDER BY s.ad
        "#,
        musteri_id
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| WsSantralUretimRow {
            id: r.id,
            ad: r.ad,
            kurulu_guc_mw: r.kurulu_guc_mw,
            son_mw: r.son_mw,
            son_ts: r.son_ts,
        })
        .collect())
}

//-----------------------------------------------------------
// SAPMA HESAPLARI
//-----------------------------------------------------------

pub async fn sapma_saatlik_gun(
    pool: &PgPool,
    santral_id: Uuid,
    gun: NaiveDate,
) -> Result<Vec<SapmaSaat>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
WITH gun_aralik AS (
  SELECT
    $2::date AS gun,
    ($2::date)::timestamptz AS ts_start,
    ($2::date + INTERVAL '1 day')::timestamptz AS ts_end
),
plan AS (
  SELECT
    gs.i                                AS saat_index,
    (p.saatlik_plan_mwh ->> gs.i)::numeric AS plan_mwh
  FROM kgup_planlari p
  JOIN gun_aralik ga ON p.plan_tarihi = ga.gun
  CROSS JOIN generate_series(0,23) AS gs(i)
  WHERE p.santral_id = $1
),
olcum AS (
  SELECT
    date_trunc('hour', u.zaman_utc) AS saat_ts,
    SUM(u.guc_mw * (5.0/60.0))::float8 AS gercek_mwh,
    COUNT(*)                           AS n_sample,
    COUNT(*) FILTER (WHERE u.guc_mw IS NOT NULL) AS n_sample_valid
  FROM uretim_olcumleri u
  JOIN gun_aralik ga ON u.zaman_utc >= ga.ts_start AND u.zaman_utc < ga.ts_end
  WHERE u.santral_id = $1
  GROUP BY 1
),
saat_grid AS (
  SELECT gs AS saat_ts,
         EXTRACT(HOUR FROM gs)::int AS saat_index
  FROM generate_series(
    (SELECT ts_start FROM gun_aralik),
    (SELECT ts_end   FROM gun_aralik) - INTERVAL '1 hour',
    INTERVAL '1 hour'
  ) AS gs
)
SELECT
  sg.saat_index                      AS "saat_index!",
  sg.saat_ts                         AS "saat_ts!",
  pl.plan_mwh                        AS "plan_mwh?",
  ol.gercek_mwh                      AS "gercek_mwh?",
  ol.n_sample                        AS "n_sample?",
  ol.n_sample_valid                  AS "n_sample_valid?"
FROM saat_grid sg
LEFT JOIN plan  pl ON pl.saat_index = sg.saat_index
LEFT JOIN olcum ol ON ol.saat_ts    = sg.saat_ts
ORDER BY sg.saat_index
        "#,
        santral_id,
        gun,
    )
    .fetch_all(pool)
    .await?;

    let mut out = Vec::with_capacity(rows.len());
    for r in rows {
        let plan_mwh   = r.plan_mwh.and_then(|v| v.to_f64());
        let gercek_mwh = r.gercek_mwh.and_then(|v| v.to_f64());
        let sapma_mwh  = match (plan_mwh, gercek_mwh) {
            (Some(p), Some(g)) => Some(g - p),
            _ => None,
        };
        let sapma_oran = match (plan_mwh, gercek_mwh) {
            (Some(p), Some(g)) if p > 0.0 => Some((g - p) / p),
            _ => None,
        };

        out.push(SapmaSaat {
            saat: r.saat_index,
            saat_ts: r.saat_ts,
            plan_mwh,
            gercek_mwh,
            sapma_mwh,
            sapma_oran,
        });
    }
    Ok(out)
}

//-----------------------------------------------------------
// PLAN VS GERÇEK — TARİH ARALIĞI
//-----------------------------------------------------------

pub async fn plan_gercek_aralik(
    pool: &PgPool,
    santral_id: Uuid,
    start: NaiveDate,
    end: NaiveDate, // exclusive
) -> Result<Vec<(DateTime<Utc>, Option<f64>, Option<f64>)>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
WITH params AS (
  SELECT $1::uuid AS santral_id,
         $2::date AS start_gun,
         $3::date AS end_gun
),
ts_serie AS (
  SELECT generate_series(start_gun::timestamptz,
                         (end_gun::timestamptz - INTERVAL '1 hour'),
                         INTERVAL '1 hour') AS saat_ts
  FROM params
),
plan_expanded AS (
  SELECT
    ts.saat_ts,
    (kp.saatlik_plan_mwh ->> EXTRACT(HOUR FROM ts.saat_ts)::int)::float8 AS plan_mwh
  FROM ts_serie ts
  LEFT JOIN kgup_planlari kp
    ON kp.santral_id = (SELECT santral_id FROM params)
   AND kp.plan_tarihi = (ts.saat_ts AT TIME ZONE 'UTC')::date
),
olcum AS (
  SELECT
    date_trunc('hour', u.zaman_utc) AS saat_ts,
    SUM(u.guc_mw * (5.0/60.0))::float8 AS gercek_mwh
  FROM uretim_olcumleri u
  WHERE u.santral_id = (SELECT santral_id FROM params)
    AND u.zaman_utc >= (SELECT start_gun::timestamptz FROM params)
    AND u.zaman_utc <  (SELECT end_gun::timestamptz   FROM params)
  GROUP BY 1
)
SELECT
  ts.saat_ts    AS "saat_ts!",
  pl.plan_mwh   AS "plan_mwh",
  ol.gercek_mwh AS "gercek_mwh"
FROM ts_serie ts
LEFT JOIN plan_expanded pl USING (saat_ts)
LEFT JOIN olcum         ol USING (saat_ts)
ORDER BY ts.saat_ts
        "#,
        santral_id,
        start,
        end,
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| (r.saat_ts, r.plan_mwh, r.gercek_mwh))
        .collect())
}
