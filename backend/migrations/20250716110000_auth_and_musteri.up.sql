-- 20250716110000_auth_and_musteri.up.sql
-- Gün 2: Müşteri / Kullanıcı şeması + santraller.musteri_id

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS musteriler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kullanicilar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    musteri_id UUID NOT NULL REFERENCES musteriler(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    sifre_hash TEXT NOT NULL,
    ad_soyad TEXT,
    rol TEXT NOT NULL DEFAULT 'user',
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE santraller
    ADD COLUMN IF NOT EXISTS musteri_id UUID NULL REFERENCES musteriler(id);

-- Demo Portföy ekle
-- Demo Portföy ekle veya var olanın id'sini kullan
WITH upsert AS (
    INSERT INTO musteriler (ad) VALUES ('Demo Portföy')
    ON CONFLICT DO NOTHING
    RETURNING id
),
existing AS (
    SELECT id FROM musteriler WHERE ad = 'Demo Portföy'
)
UPDATE santraller
SET musteri_id = e.id
FROM (
    SELECT id FROM upsert
    UNION
    SELECT id FROM existing
) AS e
WHERE santraller.musteri_id IS NULL;

-- Admin kullanıcı
INSERT INTO kullanicilar (musteri_id, email, sifre_hash, ad_soyad, rol)
SELECT id, 'admin@example.com', '$argon2id$v=19$m=65536,t=3,p=1$c3lCWUs3aGRmdmY0eWhrdE9SVFhoQT09$0sheM+Hjdi9z5jnZlzmWQ0/jV8Ew/yYb+SXbkduA7jY', 'Admin Kullanıcı', 'admin'
FROM musteriler
WHERE ad = 'Demo Portföy'
ON CONFLICT (email) DO NOTHING;
