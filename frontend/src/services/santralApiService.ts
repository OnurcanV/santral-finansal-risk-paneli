// frontend/src/services/santralApiService.ts

// Dengesizlik simülasyonu için girdi tipi
export type DengesizlikInput = {
    tahmini_uretim_mwh: number;
    gerceklesen_uretim_mwh: number;
    ptf_tl: number;
    smf_tl: number;
};

// Dengesizlik simülasyonu için çıktı tipi
export type DengesizlikOutput = {
    dengesizlik_miktari_mwh: number;
    dengesizlik_tipi: string;
    dengesizlik_tutari_tl: number;
    aciklama: string;
};

// Göndereceğimiz verinin tipini TypeScript ile tanımlıyoruz.
// Bu, Rust backend'imizdeki InputSantral struct'ı ile eşleşmelidir.
type SantralInput = {
    ad: string;
    tip: string;
    kurulu_guc_mw: string; // DEĞİŞTİ
    koordinat_enlem: string; // DEĞİŞTİ
    koordinat_boylam: string; // DEĞİŞTİ
};

// Rust backend'imizin çalıştığı adres.
const API_URL = 'http://localhost:8080/api';

// Yeni bir santral oluşturmak için API isteği gönderen asenkron fonksiyonumuz.
export const createSantral = async (santralData: SantralInput) => {
    try {
        // Tarayıcının yerleşik 'fetch' fonksiyonu ile POST isteği gönderiyoruz.
        const response = await fetch(`${API_URL}/santral`, {
            method: 'POST',
            headers: {
                // Gönderdiğimiz verinin JSON formatında olduğunu sunucuya bildiriyoruz.
                'Content-Type': 'application/json',
            },
            // JavaScript objemizi, ağ üzerinden göndermek için JSON metnine çeviriyoruz.
            body: JSON.stringify(santralData),
        });

        // Eğer sunucudan gelen cevap "başarılı" değilse (örn: 500 Internal Server Error),
        // bir hata fırlatarak 'catch' bloğunun çalışmasını sağlıyoruz.
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        // Sunucudan gelen JSON cevabını (yeni oluşturulan santral verisi) işle ve geri döndür.
        return await response.json();

    } catch (error) {
        console.error("Santral oluşturulurken API servisinde hata oluştu:", error);
        // Hatayı, onu çağıran component'in de yakalayabilmesi için tekrar fırlatıyoruz.
        throw error;
    }
};

// Tüm santralleri getiren yeni fonksiyon
export const getSantraller = async () => {
    try {
        // Bu bir GET isteği olduğu için method, headers veya body belirtmemize gerek yok.
        const response = await fetch(`${API_URL}/santraller`);

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Santraller getirilirken API servisinde hata oluştu:", error);
        throw error;
    }
};

// Belirtilen ID'ye sahip santrali silen yeni fonksiyon
export const deleteSantral = async (id: string) => {
    try {
        // Bu sefer DELETE metodunu kullanıyoruz ve ID'yi URL'in sonuna ekliyoruz.
        const response = await fetch(`${API_URL}/santral/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }

        // Backend'den gelen başarı mesajını JSON olarak işleyip döndürüyoruz.
        return await response.json();

    } catch (error) {
        console.error(`${id} ID'li santral silinirken hata oluştu:`, error);
        throw error;
    }
};

// Belirtilen ID'ye sahip santrali, verilen yeni verilerle güncelleyen fonksiyon
export const updateSantral = async (id: string, santralData: SantralInput) => {
    try {
        // PUT metodu ile isteğimizi gönderiyoruz.
        const response = await fetch(`${API_URL}/santral/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(santralData),
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`${id} ID'li santral güncellenirken hata oluştu:`, error);
        throw error;
    }
};


// ID'si verilen tek bir santrali getiren fonksiyon
export const getSantralById = async (id: string) => {
    try {
        const response = await fetch(`${API_URL}/santral/${id}`);
        if (!response.ok) {
            // Eğer sunucu 404 gibi bir hata dönerse, burada yakalıyoruz.
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`${id} ID'li santral getirilirken hata oluştu:`, error);
        throw error;
    }
};

// Dengesizlik maliyetini hesaplamak için backend'e istek gönderen fonksiyon
export const hesaplaDengesizlik = async (inputData: DengesizlikInput) => {
    try {
        const response = await fetch(`${API_URL}/hesapla/dengesizlik`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputData),
        });
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Dengesizlik hesaplanırken hata oluştu:", error);
        throw error;
    }
};

// KGÜP Planı'nın backend'e gönderileceği veri tipi.
// Rust'taki KgupPlanInput struct'ımızla eşleşiyor.
export type KgupPlanInput = {
    plan_tarihi: string; // "YYYY-MM-DD" formatında
    saatlik_plan_mwh: number[];
};

// Yeni bir KGÜP planı kaydeder veya mevcut olanı günceller.
export const saveKgupPlan = async (santralId: string, planData: KgupPlanInput) => {
    try {
        const response = await fetch(`${API_URL}/santral/${santralId}/kgupplan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData),
        });

        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("KGÜP Planı kaydedilirken hata oluştu:", error);
        throw error;
    }
};