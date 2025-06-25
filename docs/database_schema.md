# Veritabanı Şeması v1.0

Bu doküman, "Santral Finansal Risk Paneli" uygulamasının PostgreSQL veritabanı yapısını tanımlar.

## Tablo 1: `santraller`

Bu tablo, kullanıcı tarafından yönetilen her bir santralin temel bilgilerini içerir.

| Sütun Adı          | Veri Tipi                | Açıklama                                           |
| ------------------ | ------------------------ | -------------------------------------------------- |
| `id`               | `UUID` (Primary Key)     | Her santral için evrensel, benzersiz kimlik.       |
| `ad`               | `TEXT`                   | Santralin adı (Örn: "Yılmaz RES").                 |
| `tip`              | `TEXT`                   | Santralin tipi ('RES', 'GES', 'TERMİK' vb.).      |
| `kurulu_guc_mw`    | `DECIMAL(10, 2)`         | Santralin MW cinsinden kurulu gücü.                |
| `koordinat_enlem`  | `DECIMAL(9, 6)`          | Hava durumu API'si için santralin enlemi.          |
| `koordinat_boylam` | `DECIMAL(9, 6)`          | Hava durumu API'si için santralin boylamı.         |
| `olusturma_tarihi` | `TIMESTAMPTZ`            | Bu kaydın oluşturulduğu zaman damgası (zaman dilimi dahil). |

**Notlar:**
- `id` için `UUID` kullanmamızın sebebi, basit sıralı sayılara (1, 2, 3) göre daha güvenli ve tahmin edilemez olmasıdır.
- `DECIMAL` tipi, ondalık sayılarda `float` tipine göre hassasiyet kaybını önler.
- `TIMESTAMPTZ`, zaman damgasını UTC olarak saklayarak farklı zaman dilimlerindeki karışıklıkları önler.

## Tablo 2: `hesaplamalar`

Bu tablo, yapılan her bir simülasyonun girdilerini, sonuçlarını ve meta verilerini saklar.

| Sütun Adı        | Veri Tipi            | Açıklama                                                     |
| ---------------- | -------------------- | ------------------------------------------------------------ |
| `id`             | `UUID` (Primary Key) | Her hesaplama için benzersiz kimlik.                         |
| `santral_id`     | `UUID` (Foreign Key) | Bu hesabın hangi santrale ait olduğunu belirtir (`santraller.id`'ye bağlanır). |
| `hesaplama_tipi` | `TEXT`               | 'DENGESİZLİK' veya 'KGÜP' gibi.                              |
| `input_verileri` | `JSONB`              | Hesaplama için kullanılan tüm girdiler (JSON formatında).     |
| `sonuc`          | `JSONB`              | Hesaplama sonucu (JSON formatında).                          |
| `hesaplama_tarihi` | `TIMESTAMPTZ`        | Bu hesabın yapıldığı zaman damgası.                          |

**Notlar:**
- `santral_id` bir **Foreign Key**'dir. Bu, veritabanına "bu sütundaki değer, mutlaka `santraller` tablosundaki bir `id` ile eşleşmeli" demektir. Bu, veri bütünlüğünü sağlar.
- `input_verileri` ve `sonuc` için `JSONB` kullanmak bize inanılmaz bir esneklik sunar. Gelecekte yeni bir hesaplayıcı eklediğimizde, veritabanı tablosunu değiştirmemize gerek kalmadan farklı yapıdaki girdileri ve sonuçları saklayabiliriz.