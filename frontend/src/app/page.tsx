// Dosya: frontend/src/app/page.tsx
// DÜZELTME: `allFeatureCards` dizisi, tüm bileşenlerin erişebilmesi için
// dosyanın en üstüne taşındı.
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMusterilerForAdmin } from "@/services/adminApiService";
import type { Musteri } from "@/types/auth";

// --- ÇÖZÜM: `allFeatureCards` dizisini buraya, dosyanın en üstüne taşıyoruz ---
const allFeatureCards = [
    { href: "/santraller", emoji: "🏭", title: "Santralleri Yönet", description: "Yeni santral ekleyin, mevcut santralleri düzenleyin veya portföyünüzü görüntüleyin.", roles: ['admin'] },
    { href: "/dashboard", emoji: "📊", title: "Canlı Dashboard", description: "Tüm santrallerinizin anlık üretim verilerini gerçek zamanlı olarak izleyin.", roles: ['admin', 'user'] },
    { href: "/raporlama", emoji: "📄", title: "Tarihsel Raporlama", description: "Geçmişe dönük performans analizleri ve detaylı sapma raporları oluşturun.", roles: ['admin', 'user'] },
    { href: "/harita", emoji: "🗺️", title: "Operasyon Haritası", description: "Santrallerinizin coğrafi konumlarını ve anlık durumlarını harita üzerinde görün.", roles: ['admin', 'user'] },
    { href: "/kgup", emoji: "📅", title: "KGÜP Planlama", description: "Santralleriniz için Gün Öncesi Üretim/Tüketim Programı (KGÜP) oluşturun ve yönetin.", roles: ['admin', 'user'] },
    { href: "/analiz", emoji: "⚖️", title: "Dengesizlik Analizi", description: "Tekli veya toplu senaryolarla santrallerinizin potansiyel dengesizlik maliyetlerini simüle edin.", roles: ['admin', 'user'] }
];

const FeatureCard = ({ href, title, description, emoji }: { href: string, title: string, description: string, emoji: string }) => (
    <Link href={href} className="block bg-component-dark border border-border-dark rounded-lg p-6 hover:border-brand-neon-green hover:scale-105 transition-all duration-300 group">
        <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">{emoji}</div>
        <h3 className="text-xl font-bold text-text-light mb-2">{title}</h3>
        <p className="text-text-dark">{description}</p>
    </Link>
);

const AdminCustomerSelector = () => {
    const [musteriler, setMusteriler] = useState<Musteri[]>([]);
    const [loading, setLoading] = useState(true);
    const { session, startImpersonation } = useAuth();

    useEffect(() => {
        if (session) {
            getMusterilerForAdmin(session)
                .then(data => setMusteriler(data))
                .catch(err => console.error("Müşteriler yüklenemedi", err))
                .finally(() => setLoading(false));
        }
    }, [session]);

    const handleSelectCustomer = (musteri: Musteri) => {
        startImpersonation(musteri.id);
    };

    if (loading) return <p>Müşteriler yükleniyor...</p>;

    return (
        <div>
            <h2 className="text-3xl font-bold text-text-light mb-6">Müşteri Portföyü Seçin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {musteriler.map(musteri => (
                    <button 
                        key={musteri.id}
                        onClick={() => handleSelectCustomer(musteri)}
                        className="block bg-component-dark border border-border-dark rounded-lg p-6 text-left hover:border-brand-neon-green hover:scale-105 transition-all duration-300"
                    >
                        <h3 className="text-xl font-bold text-text-light">{musteri.ad}</h3>
                        <p className="text-sm text-text-dark">ID: {musteri.id.slice(0,8)}...</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const UserDashboard = () => {
    const { session } = useAuth();
    const visibleCards = session 
        ? allFeatureCards.filter(card => card.roles.includes(session.rol))
        : [];
    
    return (
        <div>
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-text-light">Hoş Geldiniz!</h1>
                <p className="mt-4 text-lg text-text-dark">Lütfen bir işlem seçin.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleCards.map(card => <FeatureCard key={card.href} {...card} />)}
            </div>
        </div>
    );
};


export default function HomePage() {
  const { session, loading, isImpersonating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading || !session) {
    return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
  }

  const isAdminRootView = session.rol === 'admin' && !isImpersonating;

  return (
    <main className="container mx-auto p-4 sm:p-8">
      {isAdminRootView ? <AdminCustomerSelector /> : <UserDashboard />}
    </main>
  );
}