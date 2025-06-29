// frontend/src/services/weatherApiService.ts

// Open-Meteo'dan dönecek olan saatlik verinin tipini güncelliyoruz.
export interface HourlyWeatherData {
    time: string[];
    weather_code?: number[]; // Açıklayıcı metin için hava durumu kodu
    wind_speed_10m?: number[]; 
    shortwave_radiation?: number[];
}

// Belirli bir konum ve TARİH için hava durumu tahminini getiren fonksiyon.
export const getWeatherData = async (
    enlem: number, 
    boylam: number,
    tarih: string, // YENİ: "YYYY-MM-DD" formatında bir tarih alacak.
    santralTipi: 'RES' | 'GES' | 'TERMİK'
): Promise<HourlyWeatherData | null> => {
    
    if (santralTipi === 'TERMİK') return null;

    // Santral tipine göre hangi hava durumu verilerini isteyeceğimizi belirliyoruz.
    // 'weather_code' parametresini her zaman istiyoruz.
    const hourlyParams = santralTipi === 'RES' 
        ? 'weather_code,wind_speed_10m'
        : 'weather_code,shortwave_radiation';

    // Open-Meteo API'sine istek göndereceğimiz URL'i güncelliyoruz.
    // Artık start_date ve end_date parametrelerini kullanarak belirli bir günü hedefliyoruz.
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${enlem}&longitude=${boylam}&hourly=${hourlyParams}&start_date=${tarih}&end_date=${tarih}&timezone=Europe/Istanbul`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Hava durumu verisi alınamadı.');
        const data = await response.json();
        return data.hourly as HourlyWeatherData;
    } catch (error) {
        console.error("Hava durumu API hatası:", error);
        return null;
    }
};

// --- YENİ EKLENEN TERCÜMAN FONKSİYONU ---
// WMO Hava Durumu kodlarını anlamlı metin ve emoji'ye çevirir.
export const translateWeatherCode = (code: number): { text: string; emoji: string } => {
    switch (code) {
        case 0: return { text: 'Açık', emoji: '☀️' };
        case 1: return { text: 'Az Bulutlu', emoji: '🌤️' };
        case 2: return { text: 'Parçalı Bulutlu', emoji: '🌥️' };
        case 3: return { text: 'Çok Bulutlu', emoji: '☁️' };
        case 45: case 48: return { text: 'Sisli', emoji: '🌫️' };
        case 51: case 53: case 55: return { text: 'Çisenti', emoji: '💧' };
        case 61: case 63: case 65: return { text: 'Yağmurlu', emoji: '🌧️' };
        case 80: case 81: case 82: return { text: 'Sağanak Yağış', emoji: '⛈️' };
        // RES için rüzgar durumunu da ekleyebiliriz (bu kodlar WMO'da yok, biz ekliyoruz)
        // Bu fonksiyonu daha sonra rüzgar hızına göre de zenginleştirebiliriz.
        default: return { text: 'Bilinmiyor', emoji: '❓' };
    }
};
