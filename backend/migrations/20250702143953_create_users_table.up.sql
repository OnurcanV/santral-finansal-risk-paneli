-- Add up migration script here
-- Add up migration script here

CREATE TABLE kullanicilar (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    
    -- E-posta adresi kullanıcı adı olarak kullanılacak ve benzersiz olmalı.
    email TEXT UNIQUE NOT NULL,

    -- Şifrenin kendisi DEĞİL, güvenli bir şekilde hash'lenmiş hali saklanacak.
    password_hash TEXT NOT NULL,

    -- Kullanıcı rolleri (gelecekteki yetkilendirme için)
    rol TEXT NOT NULL DEFAULT 'user', -- Varsayılan rol 'user'

    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Santraller tablosuna, her santralin hangi kullanıcıya ait olduğunu
-- belirtmek için bir 'kullanici_id' sütunu ekliyoruz.
ALTER TABLE santraller
ADD COLUMN kullanici_id UUID REFERENCES kullanicilar(id) ON DELETE CASCADE;

-- KGÜP Planları tablosuna da 'kullanici_id' sütununu ekliyoruz.
ALTER TABLE kgup_planlari
ADD COLUMN kullanici_id UUID REFERENCES kullanicilar(id) ON DELETE CASCADE;
