"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { getSantrallerByMusteri } from '@/services/santralApiService';
import type { Santral } from '@/types/santral';
import { useUretimSocket, UretimData } from '@/hooks/useUretimSocket';

// Harita bileşenini, sunucu tarafında render edilmeyecek şekilde dinamik olarak yüklüyoruz.
const MapWithNoSSR = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center"><p>Harita Yükleniyor...</p></div>
});

export default function HaritaSayfasi() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [santraller, setSantraller] = useState<Santral[]>([]);
  const { latestMessage } = useUretimSocket(session?.token ?? null);
  const [liveData, setLiveData] = useState<Map<string, UretimData>>(new Map());

  useEffect(() => {
    if (session) {
      getSantrallerByMusteri(session)
        .then(data => setSantraller(data))
        .catch(err => console.error("Santraller yüklenemedi:", err));
    }
  }, [session]);

  useEffect(() => {
    if (latestMessage) {
      setLiveData(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(latestMessage.santral_id, latestMessage);
        return newMap;
      });
    }
  }, [latestMessage]);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  if (authLoading || !session) {
    return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <main className="w-full h-[calc(100vh-64px)]">
      <MapWithNoSSR santraller={santraller} liveData={liveData} />
    </main>
  );
}