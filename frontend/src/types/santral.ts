// frontend/src/types/santral.ts
export interface Santral {
    id: string; // UUID'ler string olarak gelir
    ad: string;
    tip: string;
    kurulu_guc_mw: string; // BigDecimal string olarak gelebilir
    koordinat_enlem: string;
    koordinat_boylam: string;
    olusturma_tarihi: string; // Tarih de string olarak gelir
}