// frontend/src/app/santral/[id]/planlama/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';          // <-- eklendi
import type { Santral } from '@/types/santral';
import { getSantralById } from '@/services/santralApiService';
import KgupPlanlamaFormu from '@/components/KgupPlanlamaFormu';

export default function PlanlamaSayfasi({ params }: { params: { id: string } }) {
  const { session } = useAuth();                          // <-- eklendi
  const [santral, setSantral] = useState<Santral | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSantralDetay() {
      if (!session) { setLoading(false); return; }
      try {
        const data = await getSantralById(params.id, session);  // <-- 2. arg
        setSantral(data);
      } catch (error) {
        console.error('Santral detayı yüklenemedi', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSantralDetay();
  }, [params.id, session]);

  if (!session) {
    return (
      <main className="container mx-auto p-8 text-center">
        <p>Giriş yapmanız gerekiyor.</p>
        <Link href="/login" className="text-brand-green underline">Giriş</Link>
      </main>
    );
  }

  if (loading) return <div className="container mx-auto p-8 text-center text-text-dark">Yükleniyor...</div>;
  if (!santral) return <div className="container mx-auto p-8 text-center">Santral bulunamadı.</div>;

  return (
    <main className="container mx-auto p-8">
      <Link href="/" className="text-brand-green hover:underline mb-8 block transition-colors">&larr; Ana Sayfaya Geri Dön</Link>
      <div className="border-b border-border-dark pb-4 mb-8">
        <h1 className="text-4xl font-bold text-text-light">
          KGÜP Planlama: {santral.ad}
        </h1>
        <p className="mt-2 text-text-dark">
          <span className="font-mono bg-brand-green/20 text-brand-green px-2 py-1 rounded-full text-sm">{santral.tip}</span>
        </p>
      </div>
      <KgupPlanlamaFormu santral={santral} />
    </main>
  );
}
