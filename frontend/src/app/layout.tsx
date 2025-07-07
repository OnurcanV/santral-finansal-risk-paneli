// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
// --- YENİ EKLENEN IMPORT ---
// Kendi oluşturduğumuz AuthProvider'ı context dosyasından import ediyoruz.
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Santral Finansal Risk Paneli",
  description: "Türkiye Enerji Piyasası için Analiz ve Planlama Aracı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-base-dark text-text-light">
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
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
          {/* children, yani o anki sayfa, AuthProvider'ın içinde render edilir. */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
