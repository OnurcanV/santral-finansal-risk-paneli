<<<<<<< HEAD
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("admin@example.com");
  const [sifre, setSifre] = useState("Admin123!");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, sifre);
    setLoading(false);
    if (ok) {
      toast.success("Giriş başarılı.");
      router.push("/");
    } else {
      toast.error("Giriş başarısız. Bilgileri kontrol et.");
    }
  }

  return (
    <main className="w-full flex justify-center mt-20 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-component-dark border border-border-dark rounded-lg p-8 shadow-2xl shadow-brand-green/10 space-y-6"
      >
        <h1 className="text-2xl font-bold text-center">Giriş Yap</h1>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-dark">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
          />
        </div>

        <div>
          <label htmlFor="sifre" className="block text-sm font-medium text-text-dark">
            Şifre
          </label>
          <input
            id="sifre"
            type="password"
            value={sifre}
            autoComplete="current-password"
            onChange={(e) => setSifre(e.target.value)}
            required
            className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-black font-bold py-2 rounded-md hover:bg-brand-green/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Giriş..." : "Giriş Yap"}
        </button>

        <p className="text-center text-xs text-text-dark">
          Test hesapları: <br />
          admin@example.com / Admin123! <br />
          user@example.com / User123!
        </p>

        <p className="text-center text-xs text-text-dark">
          Ana sayfaya dönmek istersen{" "}
          <Link href="/" className="text-brand-green underline">
            tıkla
          </Link>.
        </p>
      </form>
    </main>
  );
}
=======
// ==================================================================
// DOSYA 1: frontend/src/app/login/page.tsx
// ==================================================================
// Bu dosyanın içeriği SADECE bu kadar olmalı.
// Bu dosya, /login adresine gidildiğinde görünen ana sayfadır.

import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-base-dark">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold mb-2 text-center text-text-light">
                    Giriş Yap
                </h1>
                <p className="text-text-dark mb-8 text-center">
                    Henüz bir hesabın yok mu?{' '}
                    <Link href="/register" className="text-brand-green hover:underline">
                        Hesap Oluştur
                    </Link>
                </p>
                {/* components klasöründeki LoginForm'u burada çağırıyoruz. */}
                <LoginForm />
            </div>
        </div>
    );
}
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
