-- Add up migration script here

-- UUID'leri kullanabilmek için gerekli olan eklentiyi aktif ediyoruz.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Santraller tablosunu oluşturuyoruz.
CREATE TABLE santraller (
    id UUID PRIMARY KEY NOT NULL,
    ad TEXT NOT NULL,
    tip TEXT NOT NULL,
    kurulu_guc_mw DECIMAL(10, 2) NOT NULL,
    koordinat_enlem DECIMAL(9, 6) NOT NULL,
    koordinat_boylam DECIMAL(9, 6) NOT NULL,
    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hesaplamalar tablosunu oluşturuyoruz.
CREATE TABLE hesaplamalar (
    id UUID PRIMARY KEY NOT NULL,
    santral_id UUID NOT NULL REFERENCES santraller(id) ON DELETE CASCADE,
    hesaplama_tipi TEXT NOT NULL,
    input_verileri JSONB NOT NULL,
    sonuc JSONB NOT NULL,
    hesaplama_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW()
);