-- Add up migration script here
-- create_uretim_olcumleri.sql
-- Ham üretim ölçümleri (genelde 5 dakikalık SCADA verisi).
-- MW saklıyoruz; enerji türetilebilir.

CREATE TABLE IF NOT EXISTS uretim_olcumleri (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    santral_id      UUID NOT NULL REFERENCES santraller(id) ON DELETE CASCADE,
    zaman_utc       TIMESTAMPTZ NOT NULL,
    guc_mw          NUMERIC(18,6) NOT NULL,
    eklenme_tarihi  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uretim_olcumleri_unique_ts UNIQUE (santral_id, zaman_utc)
);

-- Sorgu performansı
CREATE INDEX IF NOT EXISTS idx_uretim_santral_zaman ON uretim_olcumleri (santral_id, zaman_utc DESC);
CREATE INDEX IF NOT EXISTS idx_uretim_zaman ON uretim_olcumleri (zaman_utc);
