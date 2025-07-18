// frontend/src/app/santral/[id]/analiz/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import type { Santral } from '@/types/santral';
import { getSantralById, DengesizlikOutput } from '@/services/santralApiService';

import DengesizlikForm from '@/components/DengesizlikForm';
import CsvUploader from '@/components/CsvUploader';
import SonucGrafikleri from '@/components/SonucGrafikleri';

export default function AnalizSayfasi({ params }: { params: { id: string } }) {
  const { session } = useAuth();

  const [santral, setSantral] = useState<Santral | null>(null);
  const [loading, setLoading] = useState(true);

  // Hem tekli hem de toplu sonuçlar için ayrı state'ler
  const [tekliSonuc, setTekliSonuc] = useState<DengesizlikOutput | null>(null);
  const [topluSonuclar, setTopluSonuclar] = useState<DengesizlikOutput[] | null>(null);

  // Scroll için referanslar
  const tekliResultRef = useRef<HTMLDivElement>(null);
  const topluResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSantralDetay() {
      if (!session) { setLoading(false); return; }
      try {
        setLoading(true);
        const data = await getSantralById(params.id, session);
        setSantral(data);
      } catch (error) {
        console.error("Santral detayı yüklenemedi", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSantralDetay();
  }, [params.id, session]);

  // Auth yoksa
  if (!session) {
    return (
      <main className="container mx-auto p-8 text-center">
        <p>Giriş yapmanız gerekiyor.</p>
        <Link href="/login" className="text-brand-green underline">Giriş</Link>
      </main>
    );
  }

  // Sonuç gelince scroll
  useEffect(() => {
    if (tekliSonuc) {
      tekliResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [tekliSonuc]);

  useEffect(() => {
    if (topluSonuclar) {
      topluResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [topluSonuclar]);

  // Tekli form callback
  const handleTekliHesaplama = (sonuc: DengesizlikOutput) => {
    setTopluSonuclar(null);
    setTekliSonuc(sonuc);
  };

  // CSV callback
  const handleTopluHesaplama = (sonuclar: DengesizlikOutput[]) => {
    setTekliSonuc(null);
    setTopluSonuclar(sonuclar);
  };

  if (loading) return <div className="container mx-auto p-8 text-center text-text-dark">Yükleniyor...</div>;
  if (!santral) return <div className="container mx-auto p-8 text-center">Santral bulunamadı.</div>;

  return (
    <main className="container mx-auto p-8">
      <Link href="/" className="text-brand-green hover:underline mb-8 block transition-colors">&larr; Ana Sayfaya Geri Dön</Link>
      <div className="border-b border-border-dark pb-4 mb-8">
        <h1 className="text-4xl font-bold text-text-light">{santral.ad}</h1>
        <p className="mt-2 text-text-dark">
          <span className="font-mono bg-brand-green/20 text-brand-green px-2 py-1 rounded-full text-sm">{santral.tip}</span>
          <span className="mx-2">&bull;</span>
          <span>Kurulu Güç: {santral.kurulu_guc_mw} MW</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-text-light mb-4">Tekli Senaryo Simülatörü</h2>
          <DengesizlikForm onHesaplama={handleTekliHesaplama} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-light mb-4">Saatlik Veri ile Toplu Analiz</h2>
          <CsvUploader onTopluHesaplama={handleTopluHesaplama} />
        </div>
      </div>

      {/* Tekli Sonuç */}
      {tekliSonuc && (
        <div ref={tekliResultRef} className="mt-8 p-6 bg-component-dark border border-border-dark rounded-lg">
          <h3 className="text-xl font-bold text-text-light">Tekli Simülasyon Sonucu</h3>
          <div className="mt-4 space-y-2 text-text-light">
            <p><strong>Dengesizlik Tipi:</strong> <span className="font-semibold">{tekliSonuc.dengesizlik_tipi}</span></p>
            <p><strong>Dengesizlik Miktarı:</strong> <span className="font-mono">{tekliSonuc.dengesizlik_miktari_mwh.toFixed(2)} MWh</span></p>
            <p><strong>Finansal Etki:</strong>
              <span className={`font-bold text-lg ${tekliSonuc.dengesizlik_tutari_tl < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {tekliSonuc.dengesizlik_tutari_tl.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </span>
            </p>
            <p className="text-sm text-text-dark pt-2 border-t border-border-dark/50 mt-2">{tekliSonuc.aciklama}</p>
          </div>
        </div>
      )}

      {/* Toplu Sonuç */}
      {topluSonuclar && (
        <div ref={topluResultRef} className="mt-8">
          <SonucGrafikleri results={topluSonuclar} />

          <h3 className="text-xl font-bold text-text-light mb-4 mt-8">Detaylı Saatlik Analiz</h3>
          <div className="overflow-x-auto bg-component-dark border border-border-dark rounded-lg">
            <table className="min-w-full divide-y divide-border-dark">
              <thead className="bg-base-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Saat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Dengesizlik Miktarı (MWh)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Dengesizlik Tipi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Finansal Etki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {topluSonuclar.map((r, i) => (
                  <tr key={i} className="hover:bg-base-dark/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">{i + 1}. Saat</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light font-mono">{r.dengesizlik_miktari_mwh.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{r.dengesizlik_tipi.includes("Pozitif") ? '🟢' : '🔴'} {r.dengesizlik_tipi}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${r.dengesizlik_tutari_tl < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {r.dengesizlik_tutari_tl.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
