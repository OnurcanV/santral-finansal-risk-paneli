// Dosya: frontend/src/components/CsvUploader.tsx
// YENİ DOSYA: Bu dosyayı `src/components` klasörü altına oluşturun.
'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { DengesizlikInput, DengesizlikOutput, hesaplaDengesizlik } from '@/services/santralApiService';

interface Props {
    onTopluHesaplama: (sonuclar: DengesizlikOutput[]) => void;
}

export default function CsvUploader({ onTopluHesaplama }: Props) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileUpload = () => {
        if (!selectedFile) return;
        
        setIsLoading(true);

        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: async (results) => {
                const processedData: DengesizlikInput[] = results.data.map((row: any) => ({
                    tahmini_uretim_mwh: row.tahmini_uretim_mwh || 0,
                    gerceklesen_uretim_mwh: row.gerceklesen_uretim_mwh || 0,
                    ptf_tl: row.ptf_tl || 0,
                    smf_tl: row.smf_tl || 0,
                }));
                
                try {
                    const apiResults = await hesaplaDengesizlik(processedData);
                    onTopluHesaplama(apiResults);
                } catch (error) {
                    alert("Hesaplama sırasında bir hata oluştu.");
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    return (
        <div className="p-6 bg-component-dark border border-border-dark rounded-lg">
            <h3 className="text-xl font-bold text-text-light mb-4">Saatlik Veri ile Toplu Analiz</h3>
            <p className="text-sm text-text-dark mb-4">Saatlik üretim ve fiyat verilerinizi içeren bir CSV dosyası yükleyin. Başlıklar: `tahmini_uretim_mwh`, `gerceklesen_uretim_mwh`, `ptf_tl`, `smf_tl` olmalıdır.</p>
            <div className="flex items-center space-x-4">
                <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-text-dark file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-base-dark file:text-brand-neon-green hover:file:bg-brand-neon-green/20"/>
                <button onClick={handleFileUpload} disabled={!selectedFile || isLoading} className="whitespace-nowrap border border-brand-neon-green text-brand-neon-green font-bold py-2 px-4 rounded-md transition-all duration-300 hover:bg-brand-neon-green hover:text-black disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Hesaplanıyor...' : 'Yükle ve Analiz Et'}
                </button>
            </div>
        </div>
    );
}