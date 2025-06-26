// frontend/src/components/SantralEkleForm.tsx

// 'use client' direktifi, Next.js'e bu component'in interaktif olduğunu ve
// tarayıcıda çalışması gerektiğini söyler. State (useState) ve event'ler (onClick)
// sadece client component'lerinde kullanılabilir.
'use client';

// React'tan 'useState' hook'unu import ediyoruz. Bu, component'imizin hafızası olacak.
import { useState } from 'react';

// Formumuzun tutacağı verinin şeklini TypeScript ile tanımlıyoruz.
// Bu, Rust'taki InputSantral struct'ımızın frontend'deki karşılığıdır.
type FormData = {
    ad: string;
    tip: string;
    kurulu_guc_mw: number;
    koordinat_enlem: number;
    koordinat_boylam: number;
};

export default function SantralEkleForm() {
    // useState hook'u ile component'imizin state'ini (hafızasını) oluşturuyoruz.
    // formData: mevcut form verisini tutan değişken.
    // setFormData: bu veriyi güncellememizi sağlayan TEK fonksiyon.
    const [formData, setFormData] = useState<FormData>({
        ad: '',
        tip: 'RES',
        kurulu_guc_mw: 0,
        koordinat_enlem: 0,
        koordinat_boylam: 0,
    });

    // Formdaki herhangi bir input değiştiğinde bu fonksiyon çalışır.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: name.includes('mw') || name.includes('koordinat') ? parseFloat(value) : value,
        }));
    };

    // Form gönderildiğinde (butona tıklandığında) bu fonksiyon çalışır.
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Sayfanın yeniden yüklenmesini engeller.
        // ŞİMDİLİK: Sadece form verisini konsola yazdırarak doğru çalıştığını görelim.
        // BİR SONRAKİ ADIMDA: Bu veriyi Rust backend'imize göndereceğiz.
        console.log("Form Verisi:", formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto bg-gray-800 p-6 rounded-lg">
            <div>
                <label htmlFor="ad" className="block text-sm font-medium text-gray-300">Santral Adı</label>
                <input type="text" name="ad" id="ad" value={formData.ad} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="tip" className="block text-sm font-medium text-gray-300">Santral Tipi</label>
                <select name="tip" id="tip" value={formData.tip} onChange={handleChange} className="mt-1 block w-full bg-g-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500">
                    <option>RES</option>
                    <option>GES</option>
                    <option>TERMİK</option>
                </select>
            </div>
            <div>
                <label htmlFor="kurulu_guc_mw" className="block text-sm font-medium text-gray-300">Kurulu Güç (MW)</label>
                <input type="number" name="kurulu_guc_mw" id="kurulu_guc_mw" value={formData.kurulu_guc_mw} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            {/* Diğer inputlar için de benzer yapı... */}
            <div>
                <label htmlFor="koordinat_enlem" className="block text-sm font-medium text-gray-300">Enlem</label>
                <input type="number" step="any" name="koordinat_enlem" id="koordinat_enlem" value={formData.koordinat_enlem} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
                <label htmlFor="koordinat_boylam" className="block text-sm font-medium text-gray-300">Boylam</label>
                <input type="number" step="any" name="koordinat_boylam" id="koordinat_boylam" value={formData.koordinat_boylam} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                Kaydet
            </button>
        </form>
    );
}