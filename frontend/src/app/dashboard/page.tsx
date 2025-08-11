// Dosya: frontend/src/app/dashboard/page.tsx
// DÜZELTME: Yeni ve akıllı AuthContext'in `loading` durumunu kullanacak şekilde güncellendi.
"use client";

import { useUretimSocket, UretimData } from '../../hooks/useUretimSocket';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const PortfolioSummary = ({ data }: { data: UretimData[] }) => {
    const totalProduction = data.reduce((sum, item) => sum + parseFloat(item.anlik_uretim_mw), 0);
    
    return (
        <div className="bg-component-dark border border-border-dark p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-text-light mb-4">Portföy Özeti</h2>
            <div className="flex justify-between items-center">
                <span className="text-text-dark">Toplam Anlık Üretim:</span>
                <span className="text-3xl font-bold text-cyan-400">{totalProduction.toFixed(2)} MW</span>
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className="text-text-dark">Aktif Santral Sayısı:</span>
                <span className="text-3xl font-bold text-cyan-400">{data.length}</span>
            </div>
        </div>
    );
};

const LivePlantTable = ({ data }: { data: UretimData[] }) => {
    return (
        <div className="bg-component-dark border border-border-dark p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-xl font-bold text-text-light mb-4">Canlı Santral Verileri</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-border-dark">
                            <th className="p-3 text-text-dark">Santral Adı</th>
                            <th className="p-3 text-text-dark">Anlık Üretim (MW)</th>
                            <th className="p-3 text-text-dark">Son Veri Zamanı</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-text-dark">Veri bekleniyor...</td>
                            </tr>
                        ) : (
                            data.map(santral => (
                                <tr key={santral.santral_id} className="border-b border-border-dark/50 hover:bg-base-dark/50">
                                    <td className="p-3 font-medium text-text-light">{santral.santral_ad}</td>
                                    <td className="p-3 text-green-400 font-mono">{parseFloat(santral.anlik_uretim_mw).toFixed(2)}</td>
                                    <td className="p-3 text-text-dark font-mono">{new Date(santral.zaman_utc).toLocaleTimeString('tr-TR')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    // AuthContext'ten artık `session` ve `loading` durumunu alıyoruz.
    const { session, loading } = useAuth();
    const router = useRouter();
    // WebSocket hook'una token'ı `session` içinden veriyoruz.
    const { latestMessage, status } = useUretimSocket(session?.token ?? null);
    const [plantData, setPlantData] = useState<Map<string, UretimData>>(new Map());

    useEffect(() => {
        // AuthContext'in localStorage'ı kontrol etmesi bitene kadar bekle.
        if (loading) {
            return;
        }
        // Kontrol bittikten sonra, eğer session hala yoksa login'e yönlendir.
        if (!session) {
            router.push('/login');
        }
    }, [session, loading, router]);
    
    useEffect(() => {
        if (latestMessage) {
            setPlantData(prevMap => {
                const newMap = new Map(prevMap);
                newMap.set(latestMessage.santral_id, latestMessage);
                return newMap;
            });
        }
    }, [latestMessage]);

    const plantDataArray = Array.from(plantData.values());

    // Yükleme devam ederken veya session yoksa "Yükleniyor..." göster.
    // Bu, yönlendirme gerçekleşene kadar boş sayfa görünmesini engeller.
    if (loading || !session) {
        return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
    }

    return (
        <main className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Canlı Operasyon Paneli</h1>
                <div className="flex items-center space-x-2">
                    <span className={`h-4 w-4 rounded-full ${status === 'Open' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>Bağlantı: {status}</span>
                </div>
            </div>
            
            <PortfolioSummary data={plantDataArray} />
            <LivePlantTable data={plantDataArray} />
        </main>
    );
}