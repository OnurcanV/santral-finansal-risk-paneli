-- UUID tipini kullanabilmek için PostgreSQL eklentisini aktif ediyoruz.
-- UUID, benzersiz ve karmaşık kimlikler oluşturmak için kullanılır.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 'santraller' adında bir tablo oluşturuyoruz.
-- Bu tablo, elektrik santrallerine ait temel bilgileri tutacak.
CREATE TABLE santraller (
    -- Santralin benzersiz kimliği. UUID türünde ve zorunlu.
    id UUID PRIMARY KEY NOT NULL,

    -- Santralin adı, örn: "Ankara Rüzgar Santrali"
    ad TEXT NOT NULL,

    -- Santralin tipi, örn: "Rüzgar", "Güneş", "Hidroelektrik"
    tip TEXT NOT NULL,

    -- Santralin kurulu gücü megawatt (MW) cinsinden, 10 hane toplam, 2 ondalık hassasiyetle
    kurulu_guc_mw DECIMAL(10, 2) NOT NULL,

    -- Santralin coğrafi enlemi, 9 hane toplam, 6 ondalık hassasiyetle
    koordinat_enlem DECIMAL(9, 6) NOT NULL,

    -- Santralin coğrafi boylamı, aynı hassasiyetle
    koordinat_boylam DECIMAL(9, 6) NOT NULL,

    -- Kayıt oluşturulma zamanı; zaman dilimi bilgisiyle birlikte,
    -- eğer belirtilmezse otomatik olarak o anın zamanı atanır
    olusturma_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 'hesaplamalar' adında bir tablo oluşturuyoruz.
-- Bu tablo, santrallerle ilişkili yapılan çeşitli hesaplama verilerini tutacak.
CREATE TABLE hesaplamalar (
    -- Hesaplamanın benzersiz kimliği, UUID türünde
    id UUID PRIMARY KEY NOT NULL,

    -- Bu hesaplamanın hangi santrale ait olduğunu gösteren yabancı anahtar.
    -- Santraller tablosundaki 'id' sütununa referans verir.
    -- Eğer bir santral silinirse ona bağlı hesaplamalar da otomatik silinir (CASCADE).
    santral_id UUID NOT NULL REFERENCES santraller(id) ON DELETE CASCADE,

    -- Hesaplama türü, örn: "Üretim Tahmini", "Performans Analizi"
    hesaplama_tipi TEXT NOT NULL,

    -- Hesaplama için kullanılan girdiler JSONB formatında saklanır.
    -- JSONB, JSON verisini veritabanında verimli şekilde depolar ve sorgulamayı kolaylaştırır.
    input_verileri JSONB NOT NULL,

    -- Hesaplama sonucu yine JSONB formatında depolanır.
    sonuc JSONB NOT NULL,

    -- Hesaplamanın yapıldığı tarih ve zaman bilgisi, varsayılan olarak şimdiki zaman atanır.
    hesaplama_tarihi TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
