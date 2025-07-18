'use client';

import { useState, useEffect } from "react";
<<<<<<< HEAD
import toast from "react-hot-toast";
import SantralEkleForm from "@/components/SantralEkleForm";
import SantralListesi from "@/components/SantralListesi";
import { getSantraller, deleteSantral } from "@/services/santralApiService";
import type { Santral } from "@/types/santral";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function HomePage() {
  const { session } = useAuth();  // HeaderBar'daki Çıkış'ı kullanıyoruz; burada logout gerekmez.
=======
import toast from "react-hot-toast"; 
import SantralEkleForm from "@/components/SantralEkleForm";
import SantralListesi from "@/components/SantralListesi";
import { getSantraller, deleteSantral } from "@/services/santralApiService"; 
import { Santral } from "@/types/santral";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";

function HomePage() {
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [editingSantral, setEditingSantral] = useState<Santral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

<<<<<<< HEAD
  async function fetchSantraller() {
    if (!session) {
      setSantraller([]);
      setIsLoading(false);
      return;
    }
=======
  const fetchSantraller = async () => {
    setIsLoading(true);
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
    try {
      const data = await getSantraller(session);
      setSantraller(data);
<<<<<<< HEAD
    } catch (err) {
      console.error(err);
      toast.error("Santraller yüklenemedi.");
      setSantraller([]);
=======
    } catch (error) {
      console.error("Santraller yüklenemedi:", error);
      toast.error("Santral verileri getirilemedi. Lütfen tekrar giriş yapmayı deneyin.");
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
<<<<<<< HEAD
    fetchSantraller();
    // session token değiştiğinde yeniden yükle
  }, [session?.token]);

  async function handleSantralSilindi(id: string) {
    if (!session) {
      toast.error("Giriş yapmalısın.");
      return;
=======
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
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
    }
    const s = santraller.find((x) => x.id === id);
    if (!s) return;
    if (!window.confirm(`'${s.ad} ${s.tip}' silinsin mi?`)) return;
    try {
      await deleteSantral(id, session);
      toast.success(`'${s.ad}' silindi.`);
      fetchSantraller();
    } catch (err) {
      console.error(err);
      toast.error("Silinemedi.");
    }
  }

  function handleDuzenleBaslat(santral: Santral) {
    setEditingSantral(santral);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFormSubmit() {
    setEditingSantral(null);
    fetchSantraller();
  }

  /* ---- Giriş yapılmamışsa ---- */
  if (!session) {
    return (
      <main className="container mx-auto p-8 text-center space-y-4 pt-24">
        <h1 className="text-3xl font-bold">Giriş Gerekli</h1>
        <p>Lütfen önce oturum aç.</p>
        <Link href="/login" className="text-brand-green underline">Giriş sayfasına git</Link>
      </main>
    );
  }

  /* ---- Ana içerik (giriş yapıldı) ---- */
  return (
    <main className="container mx-auto p-4 sm:p-8 pt-24">
      {/* Erişilebilir ama görünmez sayfa başlığı (HeaderBar zaten büyük başlık gösteriyor) */}
      <h2 className="sr-only">Santral Ekle</h2>

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