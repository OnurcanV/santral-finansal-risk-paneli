// frontend/src/components/SantralListesi.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Santral } from "@/types/santral";

interface Props {
  santraller: Santral[];
  onSantralSilindi: (id: string) => void;
  onDuzenle: (santral: Santral) => void;
}

export default function SantralListesi({ santraller, onSantralSilindi, onDuzenle }: Props) {
  const { session } = useAuth();
  const rol = session?.rol ?? 'user';

  return (
    <div className="mt-12 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-text-light mb-4">Kaydedilen Santraller</h2>
      <div className="bg-component-dark border border-border-dark rounded-lg p-4 space-y-3">
        {santraller.map((santral) => (
          <div
            key={santral.id}
            className="p-3 bg-base-dark rounded-md flex justify-between items-center transition-all hover:bg-border-dark"
          >
            <div>
              <p className="font-semibold text-text-light">
                {santral.ad}
                <span className="ml-2 text-xs font-mono bg-brand-green/20 text-brand-green px-2 py-1 rounded-full">
                  {santral.tip}
                </span>
              </p>
              <p className="text-sm text-text-dark">Kurulu Güç: {santral.kurulu_guc_mw} MW</p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Planlama: sadece admin */}
              {rol === 'admin' && (
                <Link href={`/santral/${santral.id}/planlama`}>
                  <button
                    className="bg-yellow-900/50 text-yellow-400 border border-yellow-500/50 rounded-md px-3 py-1 text-sm font-semibold transition-all hover:bg-yellow-500 hover:text-white"
                  >
                    Planlama
                  </button>
                </Link>
              )}

              {/* Analiz: herkes */}
              <Link href={`/santral/${santral.id}/analiz`}>
                <button
                  className="bg-cyan-900/50 text-cyan-400 border border-cyan-500/50 rounded-md px-3 py-1 text-sm font-semibold transition-all hover:bg-cyan-500 hover:text-white"
                >
                  Analiz
                </button>
              </Link>

              {/* Düzenle + Sil: sadece admin */}
              {rol === 'admin' && (
                <>
                  <button
                    onClick={() => onDuzenle(santral)}
                    className="bg-blue-900/50 text-blue-400 border border-blue-500/50 rounded-md px-3 py-1 text-sm font-semibold transition-all hover:bg-blue-500 hover:text-white"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => onSantralSilindi(santral.id)}
                    className="bg-red-900/50 text-red-400 border border-red-500/50 rounded-md px-3 py-1 text-sm font-semibold transition-all hover:bg-red-500 hover:text-white"
                  >
                    Sil
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
