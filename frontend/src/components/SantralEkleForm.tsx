'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { InputSantral, Santral } from '@/types/santral';
import { createSantral, updateSantral } from '@/services/santralApiService';
import { useAuth } from '@/context/AuthContext';

interface Props {
  santralToEdit: Santral | null;
  onFormSubmit: () => void;
}

export default function SantralEkleForm({ santralToEdit, onFormSubmit }: Props) {
  const { session } = useAuth();

  const [formData, setFormData] = useState<InputSantral>({
    ad: '',
    tip: 'RES',
    kurulu_guc_mw: '',
    koordinat_enlem: '',
    koordinat_boylam: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (santralToEdit) {
      setFormData({
        ad: santralToEdit.ad,
        tip: santralToEdit.tip,
        kurulu_guc_mw: santralToEdit.kurulu_guc_mw.toString(),
        koordinat_enlem: santralToEdit.koordinat_enlem.toString(),
        koordinat_boylam: santralToEdit.koordinat_boylam.toString(),
      });
    } else {
      setFormData({
        ad: '',
        tip: 'RES',
        kurulu_guc_mw: '',
        koordinat_enlem: '',
        koordinat_boylam: '',
      });
    }
  }, [santralToEdit]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      toast.error("Önce giriş yap.");
      return;
    }
    setIsSubmitting(true);
    const payload: InputSantral = { ...formData };
    try {
      if (santralToEdit) {
        await updateSantral(santralToEdit.id, payload, session);
        toast.success(`'${payload.ad}' güncellendi.`);
      } else {
        await createSantral(payload, session);
        toast.success(`'${payload.ad}' oluşturuldu.`);
      }
      onFormSubmit();
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEditing = !!santralToEdit;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-lg mx-auto bg-component-dark border border-border-dark p-8 rounded-lg shadow-2xl shadow-brand-green/10"
    >
      <div>
        <label htmlFor="ad" className="block text-sm font-medium text-text-dark">Santral Adı</label>
        <input
          type="text"
          id="ad"
          name="ad"
          value={formData.ad}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
        />
      </div>

      <div>
        <label htmlFor="tip" className="block text-sm font-medium text-text-dark">Santral Tipi</label>
        <select
          id="tip"
          name="tip"
          value={formData.tip}
          onChange={handleChange}
          className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
        >
          <option value="RES">RES</option>
          <option value="GES">GES</option>
          <option value="TERMİK">TERMİK</option>
          <option value="hidro">hidro</option>
          <option value="dogalgaz">dogalgaz</option>
        </select>
      </div>

      <div>
        <label htmlFor="kurulu_guc_mw" className="block text-sm font-medium text-text-dark">Kurulu Güç (MW)</label>
        <input
          type="number"
          step="any"
          id="kurulu_guc_mw"
          name="kurulu_guc_mw"
          value={formData.kurulu_guc_mw}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
        />
      </div>

      <div>
        <label htmlFor="koordinat_enlem" className="block text-sm font-medium text-text-dark">Enlem</label>
        <input
          type="number"
          step="any"
          id="koordinat_enlem"
          name="koordinat_enlem"
          value={formData.koordinat_enlem}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
        />
      </div>

      <div>
        <label htmlFor="koordinat_boylam" className="block text-sm font-medium text-text-dark">Boylam</label>
        <input
          type="number"
          step="any"
          id="koordinat_boylam"
          name="koordinat_boylam"
          value={formData.koordinat_boylam}
          onChange={handleChange}
          required
          className="mt-1 block w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !session}
        className={`w-full border font-bold py-2 px-4 rounded-md transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            isEditing
              ? 'border-brand-green text-brand-green hover:bg-brand-green hover:text-black'
              : 'bg-brand-green text-black hover:bg-brand-green/80'
          }`}
      >
        {isSubmitting ? (isEditing ? 'Güncelleniyor...' : 'Kaydediliyor...') : (isEditing ? 'Güncelle' : 'Kaydet')}
      </button>
    </form>
  );
}
