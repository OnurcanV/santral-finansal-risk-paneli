// frontend/src/components/SantralEkleForm.tsx
'use client';

import { useState, useEffect } from 'react';
// 1. Adım: toast'ı kütüphaneden import ediyoruz.
import toast from 'react-hot-toast'; 
import { InputSantral, Santral } from '@/types/santral';
import { createSantral, updateSantral } from '@/services/santralApiService';

// Component'in dışarıdan alacağı props'ları tanımlıyoruz.
interface Props {
    santralToEdit: Santral | null; // Düzenlenecek santral verisi veya boş.
    onFormSubmit: () => void; // Form gönderildiğinde ana sayfayı haberdar etmek için.
}

export default function SantralEkleForm({ santralToEdit, onFormSubmit }: Props) {
    const [formData, setFormData] = useState<InputSantral>({
        ad: '',
        tip: 'RES',
        kurulu_guc_mw: '',
        koordinat_enlem: '',
        koordinat_boylam: '',
    });
    // Butonu işlem sırasında pasif hale getirmek için bir state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bu 'useEffect', 'santralToEdit' prop'u her değiştiğinde çalışır.
    // Eğer dışarıdan düzenlenecek bir santral bilgisi gelirse, formu o bilgilerle doldurur.
    useEffect(() => {
        if (santralToEdit) {
            setFormData({
                ad: santralToEdit.ad,
                tip: santralToEdit.tip,
                kurulu_guc_mw: santralToEdit.kurulu_guc_mw,
                koordinat_enlem: santralToEdit.koordinat_enlem,
                koordinat_boylam: santralToEdit.koordinat_boylam,
            });
        } else {
            // Eğer düzenlenecek santral yoksa (yani 'create' modundaysak), formu temizle.
            setFormData({ ad: '', tip: 'RES', kurulu_guc_mw: '', koordinat_enlem: '', koordinat_boylam: '' });
        }
    }, [santralToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); // İşlem başlarken butonu pasif yap

        // Veriyi sayıya çevirirken hata kontrolü yapalım.
        const dataToSubmit = {
            ...formData,
            kurulu_guc_mw: parseFloat(formData.kurulu_guc_mw) || 0,
            koordinat_enlem: parseFloat(formData.koordinat_enlem) || 0,
            koordinat_boylam: parseFloat(formData.koordinat_boylam) || 0
        };

        try {
            if (santralToEdit) {
                // Düzenleme modundaysak, update API'sini çağır.
                await updateSantral(santralToEdit.id, dataToSubmit);
                // 2. Adım: alert() yerine toast.success() kullanıyoruz.
                toast.success(`'${dataToSubmit.ad} ${dataToSubmit.tip}' başarıyla güncellendi.`);
            } else {
                // Yaratma modundaysak, create API'sini çağır.
                await createSantral(dataToSubmit);
                // 3. Adım: alert() yerine toast.success() kullanıyoruz.
                toast.success(`'${dataToSubmit.ad} ${dataToSubmit.tip}' başarıyla oluşturuldu.`);
            }
            onFormSubmit(); // İşlem bittiğinde ana sayfayı haberdar et.
        } catch (error) {
            // 4. Adım: alert() yerine toast.error() kullanıyoruz.
            toast.error("Hata: İşlem gerçekleştirilemedi.");
        } finally {
            setIsSubmitting(false); // İşlem bitince butonu tekrar aktif yap
        }
    };

    // Düzenleme modunda olup olmadığımızı kontrol eden bir değişken.
    const isEditing = !!santralToEdit;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-component-dark border border-border-dark p-8 rounded-lg shadow-2xl shadow-brand-green/10">
            <div>
                <label htmlFor="ad" className="block text-sm font-medium text-text-dark">Santral Adı</label>
                <input type="text" name="ad" id="ad" value={formData.ad} onChange={handleChange} required className="mt-1 block w-full bg-base-dark border-border-dark rounded-md shadow-sm text-text-light focus:ring-brand-green focus:border-brand-green"/>
            </div>
            <div>
                <label htmlFor="tip" className="block text-sm font-medium text-text-dark">Santral Tipi</label>
                <select name="tip" id="tip" value={formData.tip} onChange={handleChange} className="mt-1 block w-full bg-base-dark border-border-dark rounded-md shadow-sm text-text-light focus:ring-brand-green focus:border-brand-green">
                    <option>RES</option> <option>GES</option> <option>TERMİK</option>
                </select>
            </div>
            <div>
                <label htmlFor="kurulu_guc_mw" className="block text-sm font-medium text-text-dark">Kurulu Güç (MW)</label>
                <input type="number" step="any" name="kurulu_guc_mw" id="kurulu_guc_mw" value={formData.kurulu_guc_mw} onChange={handleChange} required className="mt-1 block w-full bg-base-dark border-border-dark rounded-md shadow-sm text-text-light focus:ring-brand-green focus:border-brand-green"/>
            </div>
            <div>
                <label htmlFor="koordinat_enlem" className="block text-sm font-medium text-text-dark">Enlem</label>
                <input type="number" step="any" name="koordinat_enlem" id="koordinat_enlem" value={formData.koordinat_enlem} onChange={handleChange} required className="mt-1 block w-full bg-base-dark border-border-dark rounded-md shadow-sm text-text-light focus:ring-brand-green focus:border-brand-green"/>
            </div>
            <div>
                <label htmlFor="koordinat_boylam" className="block text-sm font-medium text-text-dark">Boylam</label>
                <input type="number" step="any" name="koordinat_boylam" id="koordinat_boylam" value={formData.koordinat_boylam} onChange={handleChange} required className="mt-1 block w-full bg-base-dark border-border-dark rounded-md shadow-sm text-text-light focus:ring-brand-green focus:border-brand-green"/>
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting} // Butonu işlem sırasında pasif yap
                className={`w-full border font-bold py-2 px-4 rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-dark disabled:opacity-50 disabled:cursor-not-allowed
                ${isEditing 
                    ? 'border-brand-green text-brand-green hover:bg-brand-green hover:text-black focus:ring-brand-green' 
                    : 'bg-brand-green text-black hover:bg-opacity-80 focus:ring-brand-green'}`}
            >
                {isSubmitting ? (isEditing ? 'Güncelleniyor...' : 'Kaydediliyor...') : (isEditing ? 'Güncelle' : 'Kaydet')}
            </button>
        </form>
    );
}
