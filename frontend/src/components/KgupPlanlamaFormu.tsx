// frontend/src/components/KgupPlanlamaFormu.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast'; // YENİ IMPORT
import { Santral } from '@/types/santral';
import { saveKgupPlan, KgupPlanInput } from '@/services/santralApiService';
import Papa from 'papaparse';
import { getWeatherData, HourlyWeatherData, translateWeatherCode } from '@/services/weatherApiService';

interface Props {
    santral: Santral;
}

type HourlyPlan = { hour: string; value: string; };
const generateInitialPlan = (): HourlyPlan[] => Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, value: '' }));

export default function KgupPlanlamaFormu({ santral }: Props) {
    const [plan, setPlan] = useState<HourlyPlan[]>(generateInitialPlan());
    const [eak, setEak] = useState(santral.kurulu_guc_mw);
    const [planTarihi, setPlanTarihi] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [weatherData, setWeatherData] = useState<HourlyWeatherData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            setIsWeatherLoading(true);
            try {
                const data = await getWeatherData(
                    parseFloat(santral.koordinat_enlem),
                    parseFloat(santral.koordinat_boylam),
                    planTarihi,
                    santral.tip as any
                );
                setWeatherData(data);
            } catch (error) {
                toast.error("Hava durumu verileri alınamadı.");
            } finally {
                setIsWeatherLoading(false);
            }
        };
        fetchWeather();
    }, [santral, planTarihi]);

    const handlePlanChange = (index: number, value: string) => {
        const yeniPlan = [...plan];
        yeniPlan[index].value = value;
        setPlan(yeniPlan);
    };

    const handlePlanKaydet = async () => {
        setIsSubmitting(true);
        const saatlikPlanMwh = plan.map(p => parseFloat(p.value) || 0);
        const planData: KgupPlanInput = { plan_tarihi: planTarihi, saatlik_plan_mwh: saatlikPlanMwh };

        try {
            await saveKgupPlan(santral.id, planData);
            toast.success(`'${santral.ad}' için ${planTarihi} tarihli KGÜP planı başarıyla kaydedildi.`);
        } catch (error) {
            toast.error("Hata: Plan kaydedilemedi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCsvIndir = () => {
        const csvData = plan.map(p => ({ "Saat": p.hour, "Miktar": parseFloat(p.value) || 0 }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `kgup_plan_${santral.ad}_${planTarihi}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const eakValue = parseFloat(eak);
    const columns = Array.from({ length: 3 }, (_, colIndex) => plan.slice(colIndex * 8, colIndex * 8 + 8));

    return (
        <div className="mt-8 p-6 bg-component-dark border border-border-dark rounded-lg">
            {/* ... Formun JSX içeriği aynı kalıyor ... */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <label htmlFor="planTarihi" className="block text-sm font-medium text-text-dark">Plan Tarihi</label>
                    <input type="date" id="planTarihi" value={planTarihi} onChange={(e) => setPlanTarihi(e.target.value)} className="mt-1 block bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green" />
                </div>
                <div>
                    <label htmlFor="eak" className="block text-sm font-medium text-text-dark">Emre Amade Kapasite (MW)</label>
                    <input type="number" id="eak" value={eak} onChange={(e) => setEak(e.target.value)} className="mt-1 block w-40 bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green" />
                </div>
            </div>
            <h3 className="text-xl font-bold text-text-light mb-6 mt-6 pt-6 border-t border-border-dark">Saatlik Üretim Planı</h3>
            {isWeatherLoading && <p className="text-center text-text-dark animate-pulse">Hava durumu verileri yükleniyor...</p>}
            {!isWeatherLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
                    {columns.map((column, colIndex) => (
                        <div key={colIndex} className="space-y-4">
                            {column.map((saat, rowIndex) => {
                                const originalIndex = colIndex * 8 + rowIndex;
                                const currentValue = parseFloat(plan[originalIndex].value);
                                const isInvalid = !isNaN(currentValue) && currentValue > eakValue;
                                
                                let weatherText = '', weatherEmoji = '❓', weatherValue = '';
                                if (weatherData?.weather_code) {
                                    const { text, emoji } = translateWeatherCode(weatherData.weather_code[originalIndex]);
                                    weatherText = text; weatherEmoji = emoji;
                                }
                                if (santral.tip === 'RES' && weatherData?.wind_speed_10m) {
                                    weatherValue = `${weatherData.wind_speed_10m[originalIndex]} m/s`;
                                } else if (santral.tip === 'GES' && weatherData?.shortwave_radiation) {
                                    weatherValue = `${weatherData.shortwave_radiation[originalIndex]} W/m²`;
                                }

                                return (
                                    <div key={saat.hour} className="grid grid-cols-3 items-center gap-2">
                                        <label htmlFor={`hour-${originalIndex}`} className="text-right font-mono text-sm text-text-dark pr-2">{saat.hour}</label>
                                        <div className="col-span-2">
                                            <input type="number" id={`hour-${originalIndex}`} min="0" placeholder="MWh" value={plan[originalIndex].value} onChange={(e) => handlePlanChange(originalIndex, e.target.value)} className={`block w-full bg-base-dark border rounded-md text-text-light focus:ring-brand-green focus:border-brand-green ${isInvalid ? 'border-red-500' : 'border-border-dark'}`} />
                                            {weatherData && (
                                                <div className="text-xs text-text-dark mt-1 flex items-center justify-center gap-2">
                                                    <span>{weatherEmoji} {weatherText}</span>
                                                    {weatherValue && <span className="font-mono">({weatherValue})</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-6 pt-6 border-t border-border-dark flex justify-end space-x-4">
                <button type="button" onClick={handleCsvIndir} className="border border-blue-500 text-blue-400 font-bold py-2 px-6 rounded-md transition-all duration-300 hover:bg-blue-500 hover:text-white">
                    CSV İndir
                </button>
                <button type="button" onClick={handlePlanKaydet} disabled={isSubmitting} className="border border-brand-green text-brand-green font-bold py-2 px-6 rounded-md transition-all duration-300 hover:bg-brand-green hover:text-black disabled:opacity-50">
                    {isSubmitting ? 'Kaydediliyor...' : 'Planı Kaydet'}
                </button>
            </div>
        </div>
    );
}
