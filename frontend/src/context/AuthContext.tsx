<<<<<<< HEAD
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
=======
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    token: string | null;
    email: string | null;
    isLoading: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext [1]: useEffect çalıştı. Kimlik kontrolü başlıyor.");
        try {
            const storedToken = localStorage.getItem('authToken');
            console.log("AuthContext [2]: localStorage'dan okunan token:", storedToken);
            
            if (storedToken) {
                const decoded: { email: string; exp: number } = jwtDecode(storedToken);
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setEmail(decoded.email);
                    console.log("AuthContext [3]: Geçerli token bulundu ve state'e set edildi.");
                } else {
                    console.log("AuthContext [3]: Token'ın süresi dolmuş.");
                    localStorage.removeItem('authToken');
                }
            } else {
                console.log("AuthContext [3]: localStorage'da token bulunamadı.");
            }
        } catch (error) {
            console.error("AuthContext [HATA]: Token kontrol hatası:", error);
            localStorage.removeItem('authToken');
        }
        
        setIsLoading(false);
        console.log("AuthContext [4]: Kimlik kontrolü bitti. isLoading -> false");
    }, []);

    const login = (newToken: string) => { /* ... içerik aynı ... */ };
    const logout = () => { /* ... içerik aynı ... */ };

    const value = { token, email, isLoading, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth, bir AuthProvider içinde kullanılmalıdır.');
    }
    return context;
}
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
