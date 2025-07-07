'use client';
    
import { useState, useEffect } from "react";
import toast from "react-hot-toast"; 
import SantralEkleForm from "@/components/SantralEkleForm";
import SantralListesi from "@/components/SantralListesi";
import { getSantraller, deleteSantral } from "@/services/santralApiService"; 
import { Santral } from "@/types/santral";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";

function HomePage() {
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [editingSantral, setEditingSantral] = useState<Santral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchSantraller = async () => {
    setIsLoading(true);
    try {
      const data = await getSantraller();
      setSantraller(data);
    } catch (error) {
      console.error("Santraller yüklenemedi:", error);
      toast.error("Santral verileri getirilemedi. Lütfen tekrar giriş yapmayı deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Sadece token varsa veri çekme işlemini başlat.
    if (token) {
        fetchSantraller();
    }
  }, [token]);

  const handleSantralSilindi = async (id: string) => {
    const santralToDelete = santraller.find(s => s.id === id);
    if (!santralToDelete) return;

    if (window.confirm(`'${santralToDelete.ad} ${santralToDelete.tip}' adlı santrali silmek istediğinizden emin misiniz?`)) {
        try {
            await deleteSantral(id);
            toast.success(`'${santralToDelete.ad} ${santralToDelete.tip}' başarıyla silindi.`);
            fetchSantraller();
        } catch (error) {
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

export default withAuth(HomePage);