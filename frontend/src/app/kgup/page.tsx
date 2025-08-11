// Dosya: frontend/src/app/kgup/page.tsx
// YENİ DOSYA: Bu dosya, KGÜP planlaması için odaklanmış bir arayüz sunar.
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Santral } from "@/types/santral";
import { getSantraller } from "@/services/santralApiService";
import KgupPlanlamaFormu from "@/components/KgupPlanlamaFormu";
import SantralListesi from "@/components/SantralListesi";

export default function KgupPage() {
    const { session, loading: authLoading } = useAuth();
    const router = useRouter();
    const [santraller, setSantraller] = useState<Santral[]>([]);
    const [seciliSantral, setSeciliSantral] = useState<Santral | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !session) {
            router.push('/login');
        }
    }, [session, authLoading, router]);

    useEffect(() => {
        if (session) {
            setIsLoading(true);
            getSantraller(session)
                .then(data => {
                    setSantraller(data);
                    // Sayfa ilk yüklendiğinde ilk santrali otomatik seç
                    if (data.length > 0) {
                        setSeciliSantral(data[0]);
                    }
                })
                .catch(err => console.error("Santraller yüklenemedi:", err))
                .finally(() => setIsLoading(false));
        }
    }, [session]);

    if (authLoading || !session || isLoading) {
        return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
    }

    return (
        <main className="container mx-auto p-4 sm:p-8">
            <h1 className="text-4xl font-bold text-text-light mb-8">KGÜP Planlama</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sol Taraf: Santral Seçim Listesi */}
                <div className="md:col-span-1">
                    <h2 className="text-2xl font-bold text-text-light mb-4">Santral Seçin</h2>
                    <SantralListesi 
                        santraller={santraller}
                        onSantralSec={setSeciliSantral}
                        seciliSantralId={seciliSantral?.id}
                        mode="select" // Sadece seçim modu, ekstra butonlar yok
                    />
                </div>

                {/* Sağ Taraf: KGÜP Formu */}
                <div className="md:col-span-2">
                    {seciliSantral ? (
                        <KgupPlanlamaFormu santral={seciliSantral} />
                    ) : (
                        <div className="text-center p-12 bg-component-dark border-2 border-dashed border-border-dark rounded-lg h-full flex items-center justify-center">
                            <p className="text-text-dark">Lütfen planlama yapmak için bir santral seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}