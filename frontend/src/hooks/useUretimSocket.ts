// Dosya: frontend/src/hooks/useUretimSocket.ts
// YENİ DOSYA: Bu dosyayı projenizin `src` klasörü altına `hooks` adında yeni bir klasör oluşturup içine ekleyin.

import { useState, useEffect, useRef } from 'react';

// Backend'den gelen broadcast mesajının tip tanımı.
// Bu, TypeScript'in bize tip güvenliği sağlaması için kritik.
export interface UretimData {
    musteri_id: string;
    santral_id: string;
    santral_ad: string;
    anlik_uretim_mw: string; // BigDecimal string olarak gelir.
    zaman_utc: string;
}

// WebSocket bağlantı durumlarını yönetmek için bir tip.
type ConnectionStatus = 'Connecting' | 'Open' | 'Closed';

/**
 * WebSocket bağlantısını yöneten, canlı üretim verisini alan ve
 * bileşenlere sunan özel bir React hook'u.
 * @param token - Kimlik doğrulama için kullanılacak JWT.
 */
export const useUretimSocket = (token: string | null) => {
    // Gelen en son mesajı tutacak state.
    const [latestMessage, setLatestMessage] = useState<UretimData | null>(null);
    // Bağlantı durumunu tutacak state.
    const [status, setStatus] = useState<ConnectionStatus>('Closed');
    // WebSocket nesnesini referans olarak tutuyoruz ki re-render'larda kaybolmasın.
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Eğer token yoksa veya zaten bir bağlantı varsa, işlem yapma.
        if (!token || ws.current) {
            return;
        }

        // Backend'deki WebSocket endpoint'inin adresi.
        const wsUrl = `ws://127.0.0.1:8080/ws/uretim?token=${token}`;
        
        // Yeni bir WebSocket bağlantısı oluştur.
        ws.current = new WebSocket(wsUrl);
        setStatus('Connecting');
        console.log(`[WS Hook] Connecting to ${wsUrl}...`);

        // Bağlantı başarıyla açıldığında tetiklenir.
        ws.current.onopen = () => {
            console.log('[WS Hook] Connection opened.');
            setStatus('Open');
        };

        // Sunucudan yeni bir mesaj geldiğinde tetiklenir.
        ws.current.onmessage = (event) => {
            try {
                const data: UretimData = JSON.parse(event.data);
                // "welcome" mesajlarını filtrele, sadece gerçek veriyi işle.
                if ((data as any).type !== 'welcome') {
                    setLatestMessage(data);
                }
            } catch (error) {
                console.error('[WS Hook] Error parsing message:', error);
            }
        };

        // Bağlantı kapandığında tetiklenir.
        ws.current.onclose = () => {
            console.log('[WS Hook] Connection closed.');
            setStatus('Closed');
            ws.current = null; // Referansı temizle.
        };

        // Bir hata oluştuğunda tetiklenir.
        ws.current.onerror = (error) => {
            console.error('[WS Hook] WebSocket error:', error);
            setStatus('Closed');
        };

        // Bu 'useEffect'in temizleme fonksiyonu.
        // Bileşen ekrandan kaldırıldığında, WebSocket bağlantısını güvenli bir şekilde kapatır.
        return () => {
            if (ws.current) {
                console.log('[WS Hook] Closing connection.');
                ws.current.close();
            }
        };
    }, [token]); // Bu effect sadece `token` değiştiğinde yeniden çalışır.

    // Hook'un dış dünyaya sunduğu değerler.
    return { latestMessage, status };
};