// frontend/src/services/santralApiService.ts
//
// Backend API çağrılarını tek noktada topluyoruz.
// Tüm istekler apiFetch() üzerinden gider; token otomatik eklenir.

import type { AuthSession } from '@/types/auth';
import type { Santral, InputSantral } from '@/types/santral';
import { apiFetch } from '@/lib/api';


/* ---------------- DENGESİZLİK ---------------- */

export type DengesizlikInput = {
  tahmini_uretim_mwh: number;
  gerceklesen_uretim_mwh: number;
  ptf_tl: number;
  smf_tl: number;
};

export type DengesizlikOutput = {
  tahmini_uretim_mwh: number;
  gerceklesen_uretim_mwh: number;
  ptf_tl: number;
  smf_tl: number;
  dengesizlik_miktari_mwh: number;
  dengesizlik_tipi: string;
  dengesizlik_tutari_tl: number;
  aciklama: string;
};

/** Tekli veya toplu dengesizlik hesabı (backend dizi bekliyor). */
export async function hesaplaDengesizlik(
  inputs: DengesizlikInput[] | DengesizlikInput,
  session?: AuthSession | null
): Promise<DengesizlikOutput[]> {
  const body = Array.isArray(inputs) ? inputs : [inputs];
  return await apiFetch<DengesizlikOutput[]>(
    '/api/hesapla/dengesizlik',
    { method: 'POST', body: JSON.stringify(body) },
    session
  );
}

/* ---------------- SANTRAL CRUD ---------------- */

/** Yeni santral oluştur. */
export async function createSantral(
  data: InputSantral,
  session?: AuthSession | null
): Promise<Santral> {
  return await apiFetch<Santral>(
    '/api/santral',
    { method: 'POST', body: JSON.stringify(data) },
    session
  );
}

/** Santrallerimi getir. */
export async function getSantraller(
  session?: AuthSession | null
): Promise<Santral[]> {
  return await apiFetch<Santral[]>('/api/santraller', {}, session);
}

/** Tek santral detayı. */
export async function getSantralById(
  id: string,
  session?: AuthSession | null
): Promise<Santral> {
  return await apiFetch<Santral>(`/api/santral/${id}`, {}, session);
}

/** Santral güncelle. */
export async function updateSantral(
  id: string,
  data: InputSantral,
  session?: AuthSession | null
): Promise<Santral> {
  return await apiFetch<Santral>(
    `/api/santral/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    session
  );
}

/** Santral sil. */
export async function deleteSantral(
  id: string,
  session?: AuthSession | null
): Promise<{ status: string; message: string }> {
  return await apiFetch<{ status: string; message: string }>(
    `/api/santral/${id}`,
    { method: 'DELETE' },
    session
  );
}

/* ---------------- KGÜP ---------------- */

export interface KgupPlanInput {
  plan_tarihi: string;          // YYYY-MM-DD
  saatlik_plan_mwh: number[];   // 24 saat
}

/** KGÜP planı kaydet/güncelle. */
export async function saveKgupPlan(
  santralId: string,
  plan: KgupPlanInput,
  session?: AuthSession | null
) {
  return await apiFetch(
    `/api/santral/${santralId}/kgupplan`,
    { method: 'POST', body: JSON.stringify(plan) },
    session
  );
}


/**
 * Giriş yapmış müşteriye ait santrallerin listesini getirir.
 * Backend, session token'ına göre doğru santralleri otomatik olarak filtreler.
 * @param session - Kimlik doğrulama için AuthSession.
 */
export async function getSantrallerByMusteri(session: AuthSession): Promise<Santral[]> {
  return await apiFetch<Santral[]>("/api/santraller", {}, session);
}

export async function getTarihselRapor(
  santralId: string,
  startDate: string,
  endDate: string,
  session: AuthSession
): Promise<PlanGercekResponse> {
  const path = `/api/santral/${santralId}/tarihsel?start=${startDate}&end=${endDate}`;
  return await apiFetch<PlanGercekResponse>(path, {}, session);
}
