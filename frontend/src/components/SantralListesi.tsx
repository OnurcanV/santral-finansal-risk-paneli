// Dosya: frontend/src/components/SantralListesi.tsx
// DÜZELTME: 'manage' modundaki butonlar isteğe göre sadeleştirildi.
'use client';

import type { Santral } from '@/types/santral';
import Link from 'next/link';

interface Props {
  santraller: Santral[];
  onSantralSilindi?: (id: string) => void;
  onDuzenle?: (santral: Santral) => void;
  onSantralSec?: (santral: Santral) => void;
  seciliSantralId?: string | null;
  mode?: 'manage' | 'select';
}

export default function SantralListesi({
  santraller,
  onSantralSilindi,
  onDuzenle,
  onSantralSec,
  seciliSantralId,
  mode = 'manage',
}: Props) {

  if (santraller.length === 0) {
    return <p className="text-text-dark">Portföyünüzde kayıtlı santral bulunmuyor.</p>;
  }

  if (mode === 'select') {
    return (
        <div className="space-y-2">
            {santraller.map(s => (
                <button
                    key={s.id}
                    onClick={() => onSantralSec?.(s)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                        seciliSantralId === s.id 
                            ? 'bg-brand-neon-green text-black font-bold' 
                            : 'bg-component-dark hover:bg-border-dark'
                    }`}
                >
                    <span className="font-semibold">{s.ad}</span>
                    <span className="text-sm text-text-dark ml-2">({s.tip})</span>
                </button>
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {santraller.map((s) => (
        <div key={s.id} className="bg-component-dark p-4 rounded-lg border border-border-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-text-light">{s.ad} <span className="text-sm font-normal text-text-dark">{s.tip}</span></h3>
            <p className="text-text-dark text-sm mt-1">Kurulu Güç: {s.kurulu_guc_mw} MW</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* DÜZELTME: Sadece Düzenle ve Sil butonları kaldı. */}
            <button onClick={() => onDuzenle?.(s)} className="text-sm px-3 py-1 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition-colors">Düzenle</button>
            <button onClick={() => onSantralSilindi?.(s.id)} className="text-sm px-3 py-1 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/40 transition-colors">Sil</button>
          </div>
        </div>
      ))}
    </div>
  );
}