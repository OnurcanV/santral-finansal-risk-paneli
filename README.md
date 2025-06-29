Santral Finansal Risk Paneli
Türkiye Elektrik Piyasası'nda faaliyet gösteren santral yöneticileri ve enerji tüccarları için geliştirilmiş, KGÜP Planlama, Dengesizlik Maliyeti Simülasyonu ve Veri Görselleştirme özelliklerini bir araya getiren modern bir web uygulaması prototipidir.

🌟 Proje Hakkında
Bu proje, bir santralin günlük operasyonlarında karşılaştığı en kritik finansal ve operasyonel zorluklara modern, hızlı ve kullanıcı dostu çözümler sunmayı amaçlamaktadır. Kullanıcılar, bu platformu kullanarak:

Santral portföylerini yönetebilir (Ekle, Güncelle, Sil, Listele).

Ertesi gün için üretim planlarını (KGÜP), hava durumu verileriyle desteklenmiş akıllı bir arayüzde oluşturabilirler.

Oluşturdukları planları, TEİAŞ'ın PYS sistemine yüklenebilecek standart CSV formatında dışa aktarabilirler.

Saatlik bazda dengesizlik maliyeti analizi yaparak, plan sapmalarının finansal etkisini hem tablolarla hem de interaktif grafiklerle görselleştirebilirler.

🛠️ Teknoloji Yığını
Bu proje, performans, güvenlik ve modern geliştirme pratikleri göz önünde bulundurularak, uçtan uca Rust ve TypeScript ile inşa edilmiştir.

Backend: Rust

Web Framework: Actix-web

Veritabanı İletişimi: SQLx (Asenkron, Compile-time Güvenli)

Veritabanı: PostgreSQL (Docker üzerinde)

Frontend: Next.js (React)

Dil: TypeScript

Stil: Tailwind CSS

Grafikler: Chart.js

Veri Okuma (CSV): Papa Parse

Containerization: Docker & Docker Compose

🚀 Kurulum ve Çalıştırma
Bu projeyi kendi bilgisayarınızda çalıştırmak için Rust, Node.js ve Docker'ın kurulu olması gerekmektedir.

Projeyi Klonlayın:

git clone https://github.com/OnurcanV/santral-finansal-risk-paneli.git
cd santral-finansal-risk-paneli

Backend Kurulumu:

backend klasörünün yanına bir .env dosyası oluşturun ve içine şu satırı ekleyin:

DATABASE_URL="postgres://onurust:superguclusifre@localhost:5433/santral_db"

sqlx-cli aracını kurun:

cargo install sqlx-cli

Uygulamayı Başlatma (Tek Komutla):
Projenin ana dizinindeyken, Docker Compose tüm servisleri (PostgreSQL, Backend, Frontend) sizin için ayağa kaldıracaktır.

docker-compose up --build

--build bayrağı, ilk çalıştırmada Docker imajlarının oluşturulmasını sağlar.

Birkaç dakika sonra, backend http://localhost:8080 ve frontend http://localhost:3000 adreslerinde çalışmaya başlayacaktır.

Veritabanı Şemasını Yükleme (Migration):
Uygulama ilk kez çalıştırıldığında, veritabanı tablolarını oluşturmak için yeni bir terminal açıp backend klasörüne girin ve şu komutu çalıştırın:

sqlx migrate run

Tarayıcınızı Açın:
http://localhost:3000 adresine giderek uygulamayı kullanmaya başlayabilirsiniz!

🔮 Gelecek Vizyonu (v2.0 ve Ötesi)
Bu prototip, aşağıdaki gibi heyecan verici özelliklerle daha da geliştirilebilir:

Makine Öğrenmesi ile KGÜP Önerileri: Geçmiş üretim, hava durumu ve piyasa verilerini kullanarak, kullanıcıya optimum KGÜP planları önermek.

Gelişmiş Senaryo Analizi: "Kötümser rüzgar", "yüksek fiyat" gibi farklı senaryoların finansal etkisini tek tıkla simüle etme.

Kullanıcı Yönetimi ve Yetkilendirme: Çoklu kullanıcı desteği ve her kullanıcının sadece kendi santral verilerini görmesi.

Gerçek Zamanlı Piyasa Verisi Entegrasyonu: EPİAŞ'ın şeffaflık platformundan PTF, SMF gibi verileri anlık olarak çekerek simülasyonları daha gerçekçi hale getirme.