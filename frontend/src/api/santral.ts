// frontend/src/api/santral.ts

import { z } from "zod";

/* ------------------------------------------------------------------ *
 * Şema Tanımları
 * ------------------------------------------------------------------ */

export const SantralTarihselRowSchema = z.object({
  ts_utc: z.string(),                // ISO timestamp UTC
  plan_mwh: z.number().nullable(),
  gercek_mwh: z.number().nullable(),
  sapma_mwh: z.number().nullable(),
});

export type SantralTarihselRow = z.infer<typeof SantralTarihselRowSchema>;

export const SantralTarihselRespSchema = z.object({
  santral_id: z.string(),
  start: z.string(),
  end: z.string(),
  rows: z.array(SantralTarihselRowSchema),
  toplam_plan_mwh: z.number().nullable(),
  toplam_gercek_mwh: z.number().nullable(),
  toplam_sapma_mwh: z.number().nullable(),
  mape_yaklasik: z.number().nullable(),
});

export type SantralTarihselResp = z.infer<typeof SantralTarihselRespSchema>;

/* ------------------------------------------------------------------ *
 * API Base helper
 * ------------------------------------------------------------------ */
function resolveApiBase(explicit?: string): string {
  if (explicit) return explicit;
  // Vite
  // @ts-ignore
  if (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) {
    // @ts-ignore
    return import.meta.env.VITE_API_BASE;
  }
  // Next / fallback
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  return "http://127.0.0.1:8080";
}

/* ------------------------------------------------------------------ *
 * Fetch Fonksiyonu
 * ------------------------------------------------------------------ */
/**
 * Belirli santral için tarih aralığında saatlik plan/gerçek/sapma verisi alır.
 *
 * @param token      Bearer JWT
 * @param santralId  UUID
 * @param startDate  YYYY-MM-DD
 * @param endDate    YYYY-MM-DD (exclusive değil; backend end dahil ettiği için aynen ilet)
 * @param apiBaseOpt override base URL (opsiyonel)
 */
export async function fetchSantralTarihsel(
  token: string,
  santralId: string,
  startDate: string,
  endDate: string,
  apiBaseOpt?: string
): Promise<SantralTarihselResp> {
  const apiBase = resolveApiBase(apiBaseOpt);
  const url = `${apiBase}/api/santral/${santralId}/tarihsel?start=${encodeURIComponent(
    startDate
  )}&end=${encodeURIComponent(endDate)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fetchSantralTarihsel HTTP ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const parsed = SantralTarihselRespSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Şema hatası:", parsed.error.issues);
    throw new Error("fetchSantralTarihsel: API json şema uyumsuz.");
  }

  return parsed.data;
}
