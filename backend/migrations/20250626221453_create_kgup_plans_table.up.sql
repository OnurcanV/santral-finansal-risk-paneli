-- Add up migration script here
-- Add up migration script here

-- Bu tablo, her santralin belirli bir tarih için yaptığı 24 saatlik üretim planını saklar.
CREATE TABLE kgup_planlari (
    -- Her plan için benzersiz bir kimlik
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),

    -- Bu planın hangi santrale ait olduğunu belirten yabancı anahtar.
    -- Eğer santral silinirse, ona ait tüm planlar da otomatik olarak silinir (ON DELETE CASCADE).
    santral_id UUID NOT NULL REFERENCES santraller(id) ON DELETE CASCADE,

    -- Bu planın hangi gün için geçerli olduğu (örn: 2025-07-15)
    plan_tarihi DATE NOT NULL,

    -- 24 saatlik üretim verisini (MWh) bir JSONB dizisi olarak saklar.
    -- JSONB, metin tabanlı JSON'a göre daha verimli ve sorgulanabilirdir.
    -- Örnek: [100.5, 98.2, 110.0, ..., 95.0]
    saatlik_plan_mwh JSONB NOT NULL,

    -- Bu plan kaydının ne zaman oluşturulduğu
    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Bir santralin aynı tarih için birden fazla planı olmasını engeller.
    -- Bu, veri bütünlüğü için çok önemlidir.
    UNIQUE(santral_id, plan_tarihi)
);
