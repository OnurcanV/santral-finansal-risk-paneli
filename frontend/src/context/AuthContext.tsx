"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AuthSession } from "@/types/auth";
import { loadSession, saveSession, apiLogin } from "@/lib/api";

interface AuthState {
  session: AuthSession | null;
  login: (email: string, sifre: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  // load once (browser)
  useEffect(() => {
    const s = loadSession();
    if (s) setSession(s);
  }, []);

  const login = useCallback(async (email: string, sifre: string) => {
    try {
      const sess = await apiLogin(email, sifre);
      setSession(sess);
      saveSession(sess);
      return true;
    } catch (err) {
      console.error("login failed", err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  const value: AuthState = { session, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
