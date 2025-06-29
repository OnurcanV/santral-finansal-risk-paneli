// frontend/src/app/page.tsx - Toast Bildirimleri Entegre Edilmiş
'use client';
    
import { useState, useEffect } from "react";
// 1. Adım: toast'ı kütüphaneden import ediyoruz.
import toast from "react-hot-toast"; 
import SantralEkleForm from "@/components/SantralEkleForm";
import SantralListesi from "@/components/SantralListesi";
import { getSantraller, deleteSantral } from "@/services/santralApiService"; 
import { Santral } from "@/types/santral";

export default function HomePage() {
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [editingSantral, setEditingSantral] = useState<Santral | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSantraller = async () => {
    try {
      const data = await getSantraller();
      setSantraller(data);
    } catch (error) {
      console.error("Santraller yüklenemedi:", error);
      // 2. Adım: Hata durumunda kullanıcıya toast bildirimi gösteriyoruz.
      toast.error("Santraller listesi yüklenirken bir hata oluştu.");
      setSantraller([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSantraller();
  }, []);

  const handleSantralSilindi = async (id: string) => {
    const santralToDelete = santraller.find(s => s.id === id);
    if (!santralToDelete) return;

    const confirmationMessage = `'${santralToDelete.ad} ${santralToDelete.tip}' adlı santrali silmek istediğinizden emin misiniz?`;
    
    // window.confirm() kullanıcıdan onay almak için hala iyi bir yöntemdir.
    if (window.confirm(confirmationMessage)) {
        try {
            await deleteSantral(id);
            const successMessage = `'${santralToDelete.ad} ${santralToDelete.tip}' başarıyla silindi.`;
            // 3. Adım: alert() yerine toast.success() kullanıyoruz.
            toast.success(successMessage);
            fetchSantraller(); 
        } catch (error) {
            // 4. Adım: alert() yerine toast.error() kullanıyoruz.
            toast.error("Hata: Santral silinemedi.");
        }
    }
  };

  const handleDuzenleBaslat = (santral: Santral) => {
    setEditingSantral(santral);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = () => {
    setEditingSantral(null);
    fetchSantraller();
  };

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
        Santral Finansal Risk Paneli
      </h1>
      <SantralEkleForm 
        santralToEdit={editingSantral}
        onFormSubmit={handleFormSubmit}
      />
      {isLoading ? (
        <p className="text-center mt-12 animate-pulse">Santraller Yükleniyor...</p>
      ) : (
        <SantralListesi 
          santraller={santraller} 
          onSantralSilindi={handleSantralSilindi}
          onDuzenle={handleDuzenleBaslat}
        />
      )}
    </main>
  );
}
