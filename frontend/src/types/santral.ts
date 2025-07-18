// frontend/src/types/santral.ts

/**
 * Backend'den gelen Santral JSON yapısı.
 */
export interface Santral {
  id: string;
  ad: string;
  tip: string;
  kurulu_guc_mw: string;
  koordinat_enlem: string;
  koordinat_boylam: string;
  musteri_id: string;        // backend artık bunu döndürüyor
  olusturma_tarihi: string;
}

/**
 * Backend'e santral oluşturma/güncelleme için gönderdiğimiz input.
 * (Numeric alanları string olarak tutuyoruz; formdan okunuyor.)
 */
export interface InputSantral {
  ad: string;
  tip: string;
  kurulu_guc_mw: string;
  koordinat_enlem: string;
  koordinat_boylam: string;
}
