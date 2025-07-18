export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8080";

/**
 * Temel GET fetch helper (Bearer opsiyonel).
 */
export async function apiGet<T = unknown>(
  path: string,
  token?: string
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}
