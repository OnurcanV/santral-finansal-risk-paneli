// frontend/src/app/register/page.tsx
import RegisterForm from "@/components/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-base-dark">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold mb-2 text-center text-text-light">
                    Hesap Oluştur
                </h1>
                <p className="text-text-dark mb-8 text-center">
                    Zaten bir hesabın var mı?{' '}
                    <Link href="/login" className="text-brand-green hover:underline">
                        Giriş Yap
                    </Link>
                </p>
                <RegisterForm />
            </div>
        </div>
    );
}
