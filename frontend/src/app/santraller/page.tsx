// Dosya: frontend/src/app/santraller/page.tsx
// DÜZELTME: Bu sayfa, eski fonksiyonelliğini koruyarak yeni tasarıma kavuştu.
'use client';

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import SantralEkleForm from "@/components/SantralEkleForm";
import SantralListesi from "@/components/SantralListesi";
import { getSantraller, deleteSantral } from "@/services/santralApiService";
import type { Santral } from "@/types/santral";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SantrallerPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [editingSantral, setEditingSantral] = useState<Santral | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  const fetchSantraller = async () => {
    if (!session) {
      setSantraller([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await getSantraller(session);
      setSantraller(data);
    } catch (err) {
      console.error(err);
      toast.error("Santraller yüklenemedi.");
      setSantraller([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchSantraller();
    }
  }, [session]);

  const handleSantralSilindi = async (id: string) => {
    if (!session) return;
    const s = santraller.find((x) => x.id === id);
    if (!s) return;
    
    if (!confirm(`'${s.ad} ${s.tip}' silinsin mi?`)) return;

    try {
      await deleteSantral(id, session);
      toast.success(`'${s.ad}' silindi.`);
      fetchSantraller();
    } catch (err) {
      console.error(err);
      toast.error("Silinemedi.");
    }
  };

  const handleDuzenleBaslat = (santral: Santral) => {
    setEditingSantral(santral);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSubmit = () => {
    setEditingSantral(null);
    fetchSantraller();
  };

  if (authLoading || !session) {
    return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-text-light mb-2">Santral Yönetimi</h1>
        <p className="text-text-dark">Yeni santral ekleyin veya mevcut santrallerinizi düzenleyin.</p>
      </div>

      <SantralEkleForm
        santralToEdit={editingSantral}
        onFormSubmit={handleFormSubmit}
      />

      <div className="mt-16">
        <h2 className="text-3xl font-bold text-text-light mb-6">Portföyünüzdeki Santraller</h2>
        {isLoading ? (
          <p className="text-center mt-12 animate-pulse">Santraller Yükleniyor...</p>
        ) : (
          <SantralListesi
            santraller={santraller}
            onSantralSilindi={handleSantralSilindi}
            onDuzenle={handleDuzenleBaslat}
            mode="manage"
          />
        )}
      </div>
    </main>
  );
}