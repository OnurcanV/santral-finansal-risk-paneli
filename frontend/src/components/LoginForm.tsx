// ==================================================================
// DOSYA 2: frontend/src/components/LoginForm.tsx - GÜNCELLEME
// ==================================================================
// handleSubmit fonksiyonunu, artık gerçek bir API isteği gönderecek şekilde güncelliyoruz.

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/services/authApiService'; // Yeni servisi import et

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // API servisimizdeki login fonksiyonunu çağırıyoruz.
            const data = await loginUser({ email, password });

            // Backend'den bir token geldiyse...
            if (data.token) {
                toast.success(`Hoş geldin, ${email}!`);
                
                // Token'ı tarayıcının yerel depolamasına kaydediyoruz.
                // Bu, kullanıcının oturumunun sayfa yenilense bile açık kalmasını sağlar.
                localStorage.setItem('authToken', data.token);

                // 1.5 saniye sonra ana sayfaya yönlendir.
                setTimeout(() => {
                    router.push('/'); // Ana sayfaya yönlendir
                }, 1500);
            }
        } catch (error: any) {
            // Backend'den gelen "Geçersiz e-posta veya şifre" gibi hataları göster.
            toast.error(error.message || "Giriş sırasında bir hata oluştu.");
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
                    className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-green text-black font-bold py-2 px-4 rounded-md transition-all duration-300 hover:bg-opacity-80 disabled:opacity-50"
            >
                {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
        </form>
    );
}