// frontend/src/components/DengesizlikForm.tsx
'use client';

import { useState } from 'react';
import { DengesizlikInput, DengesizlikOutput, hesaplaDengesizlik } from '@/services/santralApiService';

interface Props {
    onHesaplama: (sonuc: DengesizlikOutput) => void;
}

export default function DengesizlikForm({ onHesaplama }: Props) {
    const [input, setInput] = useState<DengesizlikInput>({
        tahmini_uretim_mwh: 100,
        gerceklesen_uretim_mwh: 90,
        ptf_tl: 2500,
        smf_tl: 2800,
    });
    // Yüklenme durumunu yönetmek için yeni bir state ekliyoruz.
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInput(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    // --- BU FONKSİYON GÜNCELLENDİ ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true); // Hesaplama başlarken butonu pasif yapmak için
        try {
            // DEĞİŞİKLİK 1: Tek objemizi bir köşeli parantez içine alarak
            // onu tek elemanlı bir diziye (listeye) dönüştürüyoruz.
            const results = await hesaplaDengesizlik([input]);

            // DEĞİŞİKLİK 2: Backend artık her zaman bir dizi döndüreceği için,
            // dönen dizinin boş olmadığından ve ilk elemanının var olduğundan emin oluyoruz.
            if (results && results.length > 0) {
                // Sonucu, dizinin ilk elemanını alarak parent component'e gönderiyoruz.
                onHesaplama(results[0]);
            }

        } catch (error) {
            alert("Hesaplama sırasında bir hata oluştu.");
        } finally {
            setIsLoading(false); // İşlem bitince butonu tekrar aktif yap
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-6 p-6 bg-component-dark border border-border-dark rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input alanları aynı kalıyor... */}
                <div>
                    <label htmlFor="tahmini_uretim_mwh" className="block text-sm font-medium text-text-dark">Tahmini Üretim (MWh)</label>
                    <input type="number" step="any" name="tahmini_uretim_mwh" value={input.tahmini_uretim_mwh} onChange={handleChange} className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"/>
                </div>
                <div>
                    <label htmlFor="gerceklesen_uretim_mwh" className="block text-sm font-medium text-text-dark">Gerçekleşen Üretim (MWh)</label>
                    <input type="number" step="any" name="gerceklesen_uretim_mwh" value={input.gerceklesen_uretim_mwh} onChange={handleChange} className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"/>
                </div>
                <div>
                    <label htmlFor="ptf_tl" className="block text-sm font-medium text-text-dark">PTF (TL/MWh)</label>
                    <input type="number" step="any" name="ptf_tl" value={input.ptf_tl} onChange={handleChange} className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"/>
                </div>
                <div>
                    <label htmlFor="smf_tl" className="block text-sm font-medium text-text-dark">SMF (TL/MWh)</label>
                    <input type="number" step="any" name="smf_tl" value={input.smf_tl} onChange={handleChange} className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"/>
                </div>
            </div>
            {/* DEĞİŞİKLİK 3: Butona 'disabled' özelliği ekliyoruz */}
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full border border-brand-green text-brand-green font-bold py-2 px-4 rounded-md transition-all duration-300 hover:bg-brand-green hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Hesaplanıyor...' : 'Hesapla'}
            </button>
        </form>
    );
}
