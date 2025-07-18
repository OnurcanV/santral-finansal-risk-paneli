// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
<<<<<<< HEAD

// Bildirimler
=======
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
import { Toaster } from "react-hot-toast";
// --- YENİ EKLENEN IMPORT ---
// Kendi oluşturduğumuz AuthProvider'ı context dosyasından import ediyoruz.
import { AuthProvider } from "@/context/AuthContext";

// Auth sağlayıcısı (tüm uygulamayı sarmalar)
import { AuthProvider } from "@/context/AuthContext";

// Üst bar
import HeaderBar from "@/components/HeaderBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Santral Finansal Risk Paneli",
<<<<<<< HEAD
  description: "Enerji santralleri için finansal analiz ve planlama paneli",
=======
  description: "Türkiye Enerji Piyasası için Analiz ve Planlama Aracı",
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-base-dark text-text-light">
<<<<<<< HEAD
        {/* Auth context tüm çocuklara token sağlar */}
        <AuthProvider>
          {/* Bildirimler */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#161B22",
                color: "#E6EDF3",
                border: "1px solid #30363D",
              },
              success: {
                iconTheme: {
                  primary: "#39FF14",
                  secondary: "#0D1117",
=======
        {/* --- DEĞİŞİKLİK BURADA --- */}
        {/* AuthProvider, tüm children'ları (yani tüm sayfaları) sarmalar. */}
        {/* Artık her sayfa ve component, AuthContext'in sağladığı verilere erişebilir. */}
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#161B22',
                color: '#E6EDF3',
                border: '1px solid #30363D',
              },
              success: {
                iconTheme: {
                  primary: '#39FF14',
                  secondary: '#0D1117',
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
                },
              },
              error: {
                iconTheme: {
<<<<<<< HEAD
                  primary: "#ef4444",
                  secondary: "#FFFFFF",
=======
                  primary: '#ef4444',
                  secondary: '#FFFFFF',
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
                },
              },
            }}
          />
<<<<<<< HEAD
          {/* Uygulama geneli üst bar */}
          <HeaderBar />
          {/* Sayfa içeriği */}
=======
          {/* children, yani o anki sayfa, AuthProvider'ın içinde render edilir. */}
>>>>>>> ac6ae1aab7b9915e4d91c0e28a19794566b4096e
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
