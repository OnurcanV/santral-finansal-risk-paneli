import type { AuthSession } from "@/types/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

/**
 * LocalStorage key under which we store session.
 */
const AUTH_KEY = "auth_session";

/** Load session from localStorage (browser only). */
export function loadSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

/** Save session to localStorage. */
export function saveSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_KEY);
  }
}

/**
 * Wrapper around fetch that automatically prefixes backend API URL
 * and attaches Authorization header if session present.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit = {},
  session?: AuthSession | null
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(opts.headers ?? {});
  const s = session ?? loadSession();
  if (s?.token) {
    headers.set("Authorization", `Bearer ${s.token}`);
  }
  if (!headers.has("Content-Type") && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    // try to parse error json
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = JSON.stringify(data);
    } catch (_) {}
    throw new Error(`API ${res.status}: ${msg}`);
  }
  // 204 No Content?
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Convenience: login */
export interface LoginResponse {
  access_token: string;
  user_id: string;
  musteri_id: string;
  rol: string;
}
export async function apiLogin(email: string, sifre: string): Promise<AuthSession> {
  const body = JSON.stringify({ email, sifre });
  const data = await apiFetch<LoginResponse>("/auth/login", { method: "POST", body }, null);
  return {
    token: data.access_token,
    user_id: data.user_id,
    musteri_id: data.musteri_id,
    rol: data.rol as any,
  };
}
