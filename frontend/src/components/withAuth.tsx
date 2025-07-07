'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    
    const AuthComponent = (props: P) => {
        const router = useRouter();
        const { token, isLoading } = useAuth();

        useEffect(() => {
            // AuthContext'in ilk yüklemesinin bitmesini bekliyoruz.
            if (!isLoading) {
                // Yükleme bitti ve token yoksa (kullanıcı giriş yapmamışsa),
                // kullanıcıyı anında /login sayfasına yönlendir.
                if (!token) {
                    router.replace('/login');
                }
            }
        }, [token, isLoading, router]);

        // --- NİHAİ VE DAHA SAĞLAM RENDER MANTIĞI ---
        
        // Eğer token'ımız varsa VE kimlik kontrolü bittiyse,
        // o zaman kullanıcı yetkilidir ve asıl component'i güvenle gösterebiliriz.
        if (token && !isLoading) {
            return <WrappedComponent {...props} />;
        }

        // Yukarıdaki koşul sağlanmıyorsa, bu demektir ki:
        // 1. Ya kimlik kontrolü hala devam ediyor (`isLoading` true).
        // 2. Ya da kontrol bitti ama token yok (`!token` true) ve yönlendirme bekleniyor.
        // Her iki durumda da, asıl component'in sızmasını önlemek için HİÇBİR ŞEY render etmiyoruz.
        // Kullanıcı, yönlendirme tamamlanana kadar boş bir ekran görecek.
        return null;
    };

    AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return AuthComponent;
};

export default withAuth;