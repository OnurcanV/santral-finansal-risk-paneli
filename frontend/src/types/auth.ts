// Dosya: frontend/src/types/auth.ts
// YENİ/GÜNCELLENMİŞ DOSYA: Admin'in müşteri listesini çekebilmesi için
// `Musteri` tipini ekliyoruz.
export type AuthRole = 'admin' | 'user';

export interface AuthSession {
  token: string;
  user_id: string;
  musteri_id: string;
  rol: AuthRole;
}

// YENİ TİP
export interface Musteri {
    id: string;
    ad: string;
    aktif: boolean;
    olusturma_tarihi: string;
}