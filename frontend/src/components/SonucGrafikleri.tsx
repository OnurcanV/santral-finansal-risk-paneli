// frontend/src/components/SonucGrafikleri.tsx
'use client';

// Gerekli olan her şeyi chart.js ve react-chartjs-2'den import ediyoruz.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { DengesizlikOutput } from '@/services/santralApiService';

// Chart.js'e kullanacağımız tüm modülleri tanıtıyoruz. Bu adım şarttır.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Component'imizin alacağı props'u tanımlıyoruz.
interface Props {
  results: DengesizlikOutput[];
}

export default function SonucGrafikleri({ results }: Props) {
  // --- GRAFİKLER İÇİN VERİ HAZIRLAMA ---
  
  // Tüm grafikler için ortak olacak etiketler (1. Saat, 2. Saat, ...)
  const labels = results.map((_, index) => `${index + 1}. Saat`);

  // Çizgi Grafik (Üretim Karşılaştırması) için veri
  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Tahmini Üretim (MWh)',
        // Artık veriyi doğrudan 'results' içinden okuyoruz!
        data: results.map(r => r.tahmini_uretim_mwh),
        borderColor: '#8892b0',
        backgroundColor: '#8892b033',
        tension: 0.1,
      },
      {
        label: 'Gerçekleşen Üretim (MWh)',
        // Artık veriyi doğrudan 'results' içinden okuyoruz!
        data: results.map(r => r.gerceklesen_uretim_mwh),
        borderColor: '#39FF14',
        backgroundColor: '#39FF1433',
        tension: 0.1,
      },
    ],
  };

  // Çubuk Grafik (Finansal Etki) için veri
  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Finansal Etki (TL)',
        data: results.map(r => r.dengesizlik_tutari_tl),
        // Her bir çubuğun rengini, değere göre dinamik olarak ayarlıyoruz.
        backgroundColor: results.map(r => 
          r.dengesizlik_tutari_tl < 0 ? '#ef4444' : '#22c55e' // Tailwind Kırmızı ve Yeşil renkleri
        ),
        borderColor: results.map(r => 
            r.dengesizlik_tutari_tl < 0 ? '#ef4444' : '#22c55e'
        ),
        borderWidth: 1,
      },
    ],
  };

  // Tüm grafikler için ortak seçenekler
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E6EDF3', // Açık metin rengimiz
        },
      },
    },
    scales: {
        x: {
            ticks: { color: '#8B949E' }, // Eksen yazı rengi
            grid: { color: '#30363D' } // Eksen çizgileri
        },
        y: {
            ticks: { color: '#8B949E' },
            grid: { color: '#30363D' }
        }
    }
  };


  // --- COMPONENT'İN GÖRSEL KISMI (JSX) ---
  return (
    <div className="mt-8">
        <h3 className="text-xl font-bold text-text-light mb-4">Görsel Analiz</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Üretim Grafiği */}
            <div className="p-4 bg-component-dark border border-border-dark rounded-lg">
                <h4 className="text-lg font-semibold text-text-light mb-2 text-center">Üretim Karşılaştırması (MWh)</h4>
                <Line options={chartOptions} data={lineChartData} />
            </div>
            {/* Finansal Etki Grafiği */}
            <div className="p-4 bg-component-dark border border-border-dark rounded-lg">
                <h4 className="text-lg font-semibold text-text-light mb-2 text-center">Saatlik Finansal Etki (TL)</h4>
                <Bar options={chartOptions} data={barChartData} />
            </div>
        </div>
    </div>
  );
}
