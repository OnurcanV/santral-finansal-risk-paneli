// frontend/src/components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation'; // Yönlendirme için yeni hook
import { registerUser } from '@/services/authApiService';

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter(); // Yönlendirme fonksiyonlarını kullanmak için

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basit şifre kontrolü
        if (password !== passwordConfirm) {
            toast.error("Şifreler eşleşmiyor!");
            return;
        }

        setIsSubmitting(true);

        try {
            await registerUser({ email, password });
            toast.success("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");

            // Kayıt başarılı olduğunda, 2 saniye sonra kullanıcıyı giriş sayfasına yönlendir.
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error: any) {
            // API servisinden fırlatılan hatayı yakalayıp kullanıcıya gösteriyoruz.
            toast.error(error.message || "Kayıt sırasında bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto bg-component-dark border border-border-dark p-8 rounded-lg shadow-2xl">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-dark">E-posta Adresi</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-dark">Şifre</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
                />
            </div>
            <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-text-dark">Şifre Tekrar</label>
                <input
                    type="password"
                    id="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-green text-black font-bold py-2 px-4 rounded-md transition-all duration-300 hover:bg-opacity-80 disabled:opacity-50"
            >
                {isSubmitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
        </form>
    );
}
