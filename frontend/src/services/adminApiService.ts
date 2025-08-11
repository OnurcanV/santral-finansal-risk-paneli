// Dosya: frontend/src/services/adminApiService.ts
// YENİ DOSYA: Bu dosyayı `src/services` klasörü altına oluşturun.
// Admin'e özel API çağrılarını burada toplayacağız.
import { apiFetch } from "@/lib/api";
import type { AuthSession, Musteri } from "@/types/auth";

/**
 * Sadece admin rolüyle çağrılabilen, sistemdeki tüm müşterileri
 * listeleyen API fonksiyonu.
 * @param session - Admin kullanıcısının AuthSession'ı.
 */
export async function getMusterilerForAdmin(session: AuthSession): Promise<Musteri[]> {
    return await apiFetch<Musteri[]>("/api/admin/musteriler", {}, session);
}