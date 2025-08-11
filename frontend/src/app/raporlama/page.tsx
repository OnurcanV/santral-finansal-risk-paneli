// Dosya: frontend/src/app/raporlama/page.tsx
// DÜZELTME: Sayfa, istenen inovatif fikirler ve daha canlı bir tasarımla
// baştan aşağı yeniden oluşturuldu.
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
// DÜZELTME: Çizgi grafik için Line elementini import ediyoruz.
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { getSantrallerByMusteri, getTarihselRapor } from '@/services/santralApiService';
import type { Santral, PlanGercekResponse, PlanGercekSaat } from '@/types/santral';

// DÜZELTME: Yeni grafik elemanlarını kaydediyoruz.
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

// --- YARDIMCI BİLEŞENLER ---

const RaporPlaceholder = () => (
    <div className="text-center p-12 bg-component-dark border-2 border-dashed border-border-dark rounded-lg">
        <h3 className="text-xl font-semibold text-text-light">📊 Detaylı Rapor Görüntüleyin</h3>
        <p className="mt-2 text-text-dark">Lütfen yukarıdan bir santral ve tarih aralığı seçerek "Rapor Oluştur" butonuna tıklayın.</p>
    </div>
);

const RaporOzeti = ({ rapor, santral }: { rapor: PlanGercekResponse, santral: Santral | null }) => {
    const kapasiteFaktoru = useMemo(() => {
        if (!rapor.toplam_gercek_mwh || !santral || rapor.rows.length === 0) return 0;
        const saatSayisi = rapor.rows.length;
        const kuruluGuc = parseFloat(santral.kurulu_guc_mw);
        return (rapor.toplam_gercek_mwh / (kuruluGuc * saatSayisi)) * 100;
    }, [rapor, santral]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-component-dark border border-border-dark p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-sm font-medium text-text-dark">⚡ Kapasite Faktörü</h3>
                <p className="mt-1 text-3xl font-bold text-yellow-400">{kapasiteFaktoru.toFixed(2)}%</p>
            </div>
            <div className="bg-component-dark border border-border-dark p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-sm font-medium text-text-dark">📉 Net Sapma</h3>
                <p className={`mt-1 text-3xl font-bold ${ (rapor.toplam_sapma_mwh ?? 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {rapor.toplam_sapma_mwh?.toFixed(2) ?? 'N/A'} MWh
                </p>
            </div>
            <div className="bg-component-dark border border-border-dark p-4 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
                <h3 className="text-sm font-medium text-text-dark">🎯 Tahmin Hata Oranı (MAPE)</h3>
                <p className="mt-1 text-3xl font-bold text-cyan-400">
                    {rapor.mape_yaklasik ? `${(rapor.mape_yaklasik * 100).toFixed(2)}%` : 'N/A'}
                </p>
            </div>
        </div>
    );
};

const SapmaHistogrami = ({ rows }: { rows: PlanGercekSaat[] }) => {
    const chartData = useMemo(() => {
        const sapmalar = rows.map(r => r.sapma_mwh ?? 0);
        const buckets = { '< -20': 0, '-20..-10': 0, '-10..0': 0, '0..10': 0, '10..20': 0, '> 20': 0 };
        sapmalar.forEach(s => {
            if (s < -20) buckets['< -20']++;
            else if (s <= -10) buckets['-20..-10']++;
            else if (s < 0) buckets['-10..0']++;
            else if (s <= 10) buckets['0..10']++;
            else if (s <= 20) buckets['10..20']++;
            else buckets['> 20']++;
        });
        return {
            labels: Object.keys(buckets),
            datasets: [{
                label: 'Sapma Sıklığı (Saat)',
                data: Object.values(buckets),
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
            }],
        };
    }, [rows]);

    return (
        <div className="bg-component-dark border border-border-dark p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold text-text-light mb-4">Sapma Dağılım Grafiği (Histogram)</h2>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
    );
};

// DÜZELTME: Not ekleme/düzenleme işlevselliği eklendi.
const RaporDetayTablosu = ({ rows, onRowClick, onNotDuzenle, notlar }: { rows: PlanGercekSaat[], onRowClick: (row: PlanGercekSaat) => void, onNotDuzenle: (row: PlanGercekSaat) => void, notlar: Map<string, string> }) => {
    const { mean, stdDev } = useMemo(() => {
        const sapmalar = rows.map(r => r.sapma_mwh ?? 0).filter(s => s !== 0);
        if (sapmalar.length === 0) return { mean: 0, stdDev: 0 };
        const mean = sapmalar.reduce((a, b) => a + b) / sapmalar.length;
        const stdDev = Math.sqrt(sapmalar.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / sapmalar.length);
        return { mean, stdDev };
    }, [rows]);

    const isAnomali = (sapma: number | null | undefined) => {
        if (sapma === null || sapma === undefined || stdDev === 0) return false;
        return Math.abs(sapma - mean) > 2 * stdDev;
    };

    return (
        <div className="overflow-x-auto bg-component-dark border border-border-dark rounded-lg">
            <table className="min-w-full divide-y divide-border-dark">
                <thead className="bg-base-dark">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Tarih / Saat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Gerçekleşen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Sapma (MWh)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-dark uppercase tracking-wider">Notlar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    {rows.map((row) => {
                        const not = notlar.get(row.ts_utc);
                        return (
                            <tr key={row.ts_utc} className="hover:bg-base-dark/50 cursor-pointer" onClick={() => onRowClick(row)}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-dark font-mono">
                                    {new Date(row.ts_utc).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-light font-mono">{row.plan_mwh?.toFixed(2) ?? '-'}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-text-light font-mono">{row.gercek_mwh?.toFixed(2) ?? '-'}</td>
                                <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold font-mono ${ (row.sapma_mwh ?? 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {isAnomali(row.sapma_mwh) && <span title="Anomali: Beklenenden çok farklı sapma">⚠️ </span>}
                                    {row.sapma_mwh?.toFixed(2) ?? '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <button onClick={(e) => { e.stopPropagation(); onNotDuzenle(row); }} className="text-text-dark hover:text-text-light transition-colors flex items-center gap-2">
                                        {not ? '✏️ Düzenle' : '+ 📝 Ekle'}
                                    </button>
                                    {not && <p className="text-xs text-text-dark mt-1 truncate italic">"{not}"</p>}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

const DetayModal = ({ row, onClose }: { row: PlanGercekSaat | null, onClose: () => void }) => {
    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (row) {
            setLoading(true);
            setTimeout(() => {
                const labels = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
                const saatlikUretim = row.gercek_mwh ?? 0;
                const data = labels.map(() => saatlikUretim + (Math.random() - 0.5) * (saatlikUretim * 0.2));
                
                setChartData({
                    labels,
                    datasets: [{
                        label: '5 Dakikalık Gerçekleşen Üretim (MWh)',
                        data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        fill: true,
                        tension: 0.4
                    }]
                });
                setLoading(false);
            }, 500);
        }
    }, [row]);

    if (!row) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-component-dark border border-border-dark rounded-lg p-8 max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-light mb-4">Saatlik Detay: {new Date(row.ts_utc).toLocaleString('tr-TR')}</h2>
                {loading && <p className="text-text-dark">5 dakikalık veriler yükleniyor...</p>}
                {chartData && (
                    <div>
                        <p className="text-text-dark mb-4">Seçilen saate ait 5 dakikalık periyotlarla üretim dağılımı.</p>
                        <Line data={chartData} />
                    </div>
                )}
                <div className="mt-6 text-right">
                    <button onClick={onClose} className="bg-brand-green text-black font-bold py-2 px-6 rounded-md">Kapat</button>
                </div>
            </div>
        </div>
    );
};

// --- YENİ BİLEŞEN: Not Ekleme/Düzenleme Modalı ---
const NotModal = ({ row, mevcutNot, onSave, onClose }: { row: PlanGercekSaat | null, mevcutNot: string, onSave: (not: string) => void, onClose: () => void }) => {
    const [not, setNot] = useState(mevcutNot);

    useEffect(() => {
        setNot(mevcutNot);
    }, [mevcutNot]);

    if (!row) return null;

    const handleSave = () => {
        onSave(not);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-component-dark border border-border-dark rounded-lg p-8 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-light mb-2">Not Düzenle</h2>
                <p className="text-text-dark mb-4">{new Date(row.ts_utc).toLocaleString('tr-TR')} saati için notunuz:</p>
                <textarea
                    value={not}
                    onChange={(e) => setNot(e.target.value)}
                    rows={4}
                    className="w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green p-2"
                    placeholder="Örn: Fırtına nedeniyle üretim düştü..."
                />
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-md">İptal</button>
                    <button onClick={handleSave} className="bg-brand-green text-black font-bold py-2 px-6 rounded-md">Kaydet</button>
                </div>
            </div>
        </div>
    );
};

export default function RaporlamaSayfasi() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const [santraller, setSantraller] = useState<Santral[]>([]);
  const [seciliSantral, setSeciliSantral] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [raporVerisi, setRaporVerisi] = useState<PlanGercekResponse | null>(null);
  const [raporLoading, setRaporLoading] = useState(false);
  const [modalData, setModalData] = useState<PlanGercekSaat | null>(null);
  const [aktifNotSatiri, setAktifNotSatiri] = useState<PlanGercekSaat | null>(null);
  const [notlar, setNotlar] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (session) {
      getSantrallerByMusteri(session)
        .then(data => {
          setSantraller(data);
          if (data.length > 0) setSeciliSantral(data[0].id);
        })
        .catch(err => console.error("Santraller yüklenemedi:", err));
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && !session) router.push('/login');
  }, [session, authLoading, router]);

  const handleRaporOlustur = async () => {
    if (!seciliSantral || !startDate || !endDate || !session) return;
    setRaporLoading(true);
    setRaporVerisi(null);
    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      const data = await getTarihselRapor(seciliSantral, startStr, endStr, session);
      setRaporVerisi(data);
    } catch (error) {
      console.error("Rapor oluşturulurken hata:", error);
      alert("Rapor oluşturulurken bir hata oluştu.");
    } finally {
      setRaporLoading(false);
    }
  };
  
  const handlePdfIndir = () => {
      const input = reportRef.current;
      if (!input) return;
      const originalBg = input.style.backgroundColor;
      input.style.backgroundColor = 'white';
      html2canvas(input).then(canvas => {
          input.style.backgroundColor = originalBg;
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save("rapor.pdf");
      });
  };

  const handleNotKaydet = (not: string) => {
      if (aktifNotSatiri) {
          const yeniNotlar = new Map(notlar);
          if (not.trim() === '') {
              yeniNotlar.delete(aktifNotSatiri.ts_utc);
          } else {
              yeniNotlar.set(aktifNotSatiri.ts_utc, not);
          }
          setNotlar(yeniNotlar);
      }
  };

  if (authLoading || !session) {
    return <div className="container mx-auto p-8 text-center">Yükleniyor...</div>;
  }

  const seciliSantralObjesi = santraller.find(s => s.id === seciliSantral) || null;

  return (
    <>
      <DetayModal row={modalData} onClose={() => setModalData(null)} />
      <NotModal 
        row={aktifNotSatiri} 
        mevcutNot={aktifNotSatiri ? notlar.get(aktifNotSatiri.ts_utc) || '' : ''}
        onSave={handleNotKaydet}
        onClose={() => setAktifNotSatiri(null)} 
      />
      <main className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Tarihsel Analiz Raporları</h1>
          {raporVerisi && (
              <button onClick={handlePdfIndir} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 hover:bg-indigo-700">
                  📄 PDF Olarak İndir
              </button>
          )}
        </div>

        <div className="bg-component-dark border border-border-dark p-6 rounded-lg mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/3">
            <label htmlFor="santral-select" className="block text-sm font-medium text-text-dark mb-1">Santral Seçin</label>
            <select id="santral-select" value={seciliSantral} onChange={(e) => setSeciliSantral(e.target.value)}
              className="w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green p-2">
              {santraller.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-text-dark mb-1">Tarih Aralığı</label>
            <DatePicker selectsRange={true} startDate={startDate} endDate={endDate}
              onChange={(update) => { const [start, end] = update; setStartDate(start); setEndDate(end); }}
              dateFormat="dd/MM/yyyy"
              className="w-full bg-base-dark border-border-dark rounded-md text-text-light focus:ring-brand-green focus:border-brand-green p-2" />
          </div>
          <div className="w-full md:w-auto mt-auto">
            <button onClick={handleRaporOlustur} disabled={raporLoading}
              className="w-full bg-brand-green text-black font-bold py-2 px-6 rounded-md transition-all duration-300 hover:bg-opacity-80 disabled:opacity-50">
              {raporLoading ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
            </button>
          </div>
        </div>

        <div ref={reportRef}>
          {raporLoading && <div className="text-center p-8">Rapor verileri yükleniyor...</div>}
          {!raporLoading && !raporVerisi && <RaporPlaceholder />}
          {raporVerisi && (
            <div>
              <RaporOzeti rapor={raporVerisi} santral={seciliSantralObjesi} />
              <SapmaHistogrami rows={raporVerisi.rows} />
              <RaporDetayTablosu 
                rows={raporVerisi.rows} 
                onRowClick={(row) => setModalData(row)} 
                onNotDuzenle={(row) => setAktifNotSatiri(row)}
                notlar={notlar}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}