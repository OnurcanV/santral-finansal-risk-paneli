import { z } from "zod";

/** Tek saatlik veri satırı */
export const SantralTarihselRowSchema = z.object({
  ts_utc: z.string().datetime().or(z.string()), // backend ISO; bazı durumlarda saniye hassasiyeti
  plan_mwh: z.number().nullable(),
  gercek_mwh: z.number().nullable(),
  sapma_mwh: z.number().nullable(),
});

/** Response üst seviye */
export const SantralTarihselResponseSchema = z.object({
  santral_id: z.string().uuid(),
  start: z.string(), // backend string
  end: z.string(),
  rows: z.array(SantralTarihselRowSchema),
  toplam_plan_mwh: z.number().nullable(),
  toplam_gercek_mwh: z.number().nullable(),
  toplam_sapma_mwh: z.number().nullable(),
  mape_yaklasik: z.number().nullable(),
});

export type SantralTarihselRow = z.infer<typeof SantralTarihselRowSchema>;
export type SantralTarihselResponse = z.infer<typeof SantralTarihselResponseSchema>;
