// Dosya: frontend/src/app/analiz/page.tsx
// DÜZELTME: CSV yükleme sonrası sonuçları gösteren detaylı grafik ve özet eklendi.
'use client';

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Santral, DengesizlikOutput } from "@/types/santral";
import { getSantraller } from "@/services/santralApiService";
import DengesizlikForm from "@/components/DengesizlikForm";
import CsvUploader from "@/components/CsvUploader";
import SantralListesi from "@/components/SantralListesi";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// YENİ BİLEŞEN: Toplu analiz sonuçlarını görselleştirmek için
const TopluAnalizSonuclari = ({ sonuclar }: { sonuclar: DengesizlikOutput[] }) => {
    const { toplamEtki, toplamPozitifSapma, toplamNegatifSapma } = useMemo(() => {
        let toplamEtki = 0;
        let toplamPozitifSapma = 0;
        let toplamNegatifSapma = 0;
        sonuclar.forEach(s => {
            toplamEtki += s.dengesizlik_tutari_tl;
            if (s.dengesizlik_miktari_mwh > 0) {
                toplamPozitifSapma += s.dengesizlik_miktari_mwh;
            } else {
                toplamNegatifSapma += s.dengesizlik_miktari_mwh;
            }
        });
        return { toplamEtki, toplamPozitifSapma, toplamNegatifSapma };
    }, [sonuclar]);

    const chartData = {
        labels: sonuclar.map((_, i) => `${i + 1}. Saat`),
        datasets: [{
            label: 'Saatlik Finansal Etki (₺)',
            data: sonuclar.map(s => s.dengesizlik_tutari_tl),
            backgroundColor: sonuclar.map(s => s.dengesizlik_tutari_tl < 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'),
            borderColor: sonuclar.map(s => s.dengesizlik_tutari_tl < 0 ? 'rgba(239, 68, 68, 1)' : 'rgba(16, 185, 129, 1)'),
            borderWidth: 1,
        }],
    };

    return (
        <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-text-light">Toplu Analiz Sonuçları</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-component-dark border border-border-dark p-4 rounded-lg text-center">
                    <h4 className="text-sm font-medium text-text-dark">Toplam Finansal Etki</h4>
                    <p className={`mt-1 text-2xl font-bold ${toplamEtki < 0 ? 'text-red-400' : 'text-green-400'}`}>{toplamEtki.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
                <div className="bg-component-dark border border-border-dark p-4 rounded-lg text-center">
                    <h4 className="text-sm font-medium text-text-dark">Toplam Pozitif Sapma</h4>
                    <p className="mt-1 text-2xl font-bold text-green-400">{toplamPozitifSapma.toFixed(2)} MWh</p>
                </div>
                <div className="bg-component-dark border border-border-dark p-4 rounded-lg text-center">
                    <h4 className="text-sm font-medium text-text-dark">Toplam Negatif Sapma</h4>
                    <p className="mt-1 text-2xl font-bold text-red-400">{toplamNegatifSapma.toFixed(2)} MWh</p>
                </div>
            </div>
            <div className="bg-component-dark border border-border-dark p-6 rounded-lg">
                <h4 className="text-xl font-bold text-text-light mb-4">Saatlik Finansal Etki Grafiği</h4>
                <Bar data={chartData} options={{ responsive: true }} />
            </div>
        </div>
    );
};


export default function AnalizPage() {
    const { session, loading: authLoading } = useAuth();
    const router = useRouter();
    const [santraller, setSantraller] = useState<Santral[]>([]);
    const [seciliSantral, setSeciliSantral] = useState<Santral | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tekliSonuc, setTekliSonuc] = useState<DengesizlikOutput | null>(null);
    const [topluSonuclar, setTopluSonuclar] = useState<DengesizlikOutput[] | null>(null);
    const [analizModu, setAnalizModu] = useState<'tekli' | 'toplu'>('tekli');

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
                    if (data.length > 0) {
                        setSeciliSantral(data[0]);
                    }
                })
                .catch(err => console.error("Santraller yüklenemedi:", err))
                .finally(() => setIsLoading(false));
        }
    }, [session]);

    const handleTekliHesaplama = (sonuc: DengesizlikOutput) => {
        setTopluSonuclar(null);
        setTekliSonuc(sonuc);
    };

    const handleTopluHesaplama = (sonuclar: DengesizlikOutput[]) => {
        setTekliSonuc(null);
        setTopluSonuclar(sonuclar);
    };

    if (authLoading || !session || isLoading) {
        return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
    }

    return (
        <main className="container mx-auto p-4 sm:p-8">
            <h1 className="text-4xl font-bold text-text-light mb-8">Dengesizlik Analizi</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h2 className="text-2xl font-bold text-text-light mb-4">Santral Seçin</h2>
                    <SantralListesi 
                        santraller={santraller}
                        onSantralSec={setSeciliSantral}
                        seciliSantralId={seciliSantral?.id}
                        mode="select"
                    />
                </div>
                <div className="lg:col-span-2">
                    {seciliSantral ? (
                        <div>
                            <div className="flex border-b border-border-dark mb-6">
                                <button onClick={() => setAnalizModu('tekli')} className={`py-2 px-4 transition-colors ${analizModu === 'tekli' ? 'border-b-2 border-brand-neon-green text-brand-neon-green' : 'text-text-dark hover:text-text-light'}`}>Tekli Senaryo</button>
                                <button onClick={() => setAnalizModu('toplu')} className={`py-2 px-4 transition-colors ${analizModu === 'toplu' ? 'border-b-2 border-brand-neon-green text-brand-neon-green' : 'text-text-dark hover:text-text-light'}`}>Toplu Analiz (CSV)</button>
                            </div>
                            
                            {analizModu === 'tekli' && <DengesizlikForm onHesaplama={handleTekliHesaplama} />}
                            {analizModu === 'toplu' && <CsvUploader onTopluHesaplama={handleTopluHesaplama} />}

                            {tekliSonuc && analizModu === 'tekli' && (
                                <div className="mt-8 p-6 bg-component-dark border border-border-dark rounded-lg">
                                    <h3 className="text-xl font-bold text-text-light">Simülasyon Sonucu</h3>
                                    <div className="mt-4 space-y-2 text-text-light">
                                        <p><strong>Dengesizlik Tipi:</strong> <span className="font-semibold">{tekliSonuc.dengesizlik_tipi}</span></p>
                                        <p><strong>Finansal Etki:</strong> <span className={`font-bold text-lg ${tekliSonuc.dengesizlik_tutari_tl < 0 ? 'text-red-500' : 'text-green-500'}`}>{tekliSonuc.dengesizlik_tutari_tl.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></p>
                                        <p className="text-sm text-text-dark pt-2 border-t border-border-dark/50 mt-2">{tekliSonuc.aciklama}</p>
                                    </div>
                                </div>
                            )}
                            {topluSonuclar && analizModu === 'toplu' && (
                                <TopluAnalizSonuclari sonuclar={topluSonuclar} />
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-component-dark border-2 border-dashed border-border-dark rounded-lg h-full flex items-center justify-center">
                            <p className="text-text-dark">Lütfen analiz yapmak için bir santral seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}