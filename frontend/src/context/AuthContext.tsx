// --- 2. DOSYA: frontend/src/context/AuthContext.tsx ---
// DÜZELTME: Kimliğe bürünme mantığı, "gizli talimat" yöntemine
// uygun olarak yeniden yazıldı ve `startImpersonation` artık doğru parametreyi alıyor.
"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthSession } from "@/types/auth";
import { loadSession, saveSession, apiLogin } from "@/lib/api";

interface AuthState {
  session: AuthSession | null;
  loading: boolean;
  isImpersonating: boolean;
  login: (email: string, sifre: string) => Promise<boolean>;
  logout: () => void;
  startImpersonation: (musteriId: string) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const IMPERSONATION_KEY = "impersonated_musteri_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedId, setImpersonatedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedSession = loadSession();
      if (savedSession) {
        setSession(savedSession);
      }
      const savedImpersonatedId = window.localStorage.getItem(IMPERSONATION_KEY);
      if (savedImpersonatedId) {
        setImpersonatedId(savedImpersonatedId);
      }
    } catch (error) {
      console.error("Session yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, sifre: string) => {
    try {
      const newSession = await apiLogin(email, sifre);
      setSession(newSession);
      saveSession(newSession);
      return true;
    } catch (err) {
      console.error("login failed", err);
      // Hata durumunda her şeyi temizle
      setSession(null);
      saveSession(null);
      setImpersonatedId(null);
      window.localStorage.removeItem(IMPERSONATION_KEY);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
    setImpersonatedId(null);
    window.localStorage.removeItem(IMPERSONATION_KEY);
  }, []);

  const startImpersonation = useCallback((musteriId: string) => {
    if (session && session.rol === 'admin') {
      setImpersonatedId(musteriId);
      window.localStorage.setItem(IMPERSONATION_KEY, musteriId);
      // Sayfanın yeniden yüklenerek yeni kimlikle veri çekmesini sağla
      window.location.href = '/'; 
    }
  }, [session]);
  
  const stopImpersonation = useCallback(() => {
    setImpersonatedId(null);
    window.localStorage.removeItem(IMPERSONATION_KEY);
    // Sayfanın yeniden yüklenerek admin kimliğine dönmesini sağla
    window.location.href = '/';
  }, []);

  const value: AuthState = { 
    session, 
    loading, 
    isImpersonating: !!impersonatedId,
    login, 
    logout,
    startImpersonation,
    stopImpersonation
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}