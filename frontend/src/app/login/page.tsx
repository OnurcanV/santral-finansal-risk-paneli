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