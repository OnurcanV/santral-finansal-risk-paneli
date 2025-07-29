// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Bildirimler
import { Toaster } from "react-hot-toast";
// --- YENİ EKLENEN IMPORT ---
// Kendi oluşturduğumuz AuthProvider'ı context dosyasından import ediyoruz.
import { AuthProvider } from "@/context/AuthContext";

// Üst bar
import HeaderBar from "@/components/HeaderBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Santral Finansal Risk Paneli",
  description: "Enerji santralleri için finansal analiz ve planlama paneli",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-base-dark text-text-light">
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
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#FFFFFF",
                },
              },
            }}
          />
          {/* Uygulama geneli üst bar */}
          <HeaderBar />
          {/* Sayfa içeriği */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
