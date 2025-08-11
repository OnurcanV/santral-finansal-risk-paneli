"use client";

import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Santral } from '@/types/santral';
import type { UretimData } from '@/hooks/useUretimSocket';

// Santral tipine göre emoji döndüren yardımcı fonksiyon
const getSantralEmoji = (tip: string): string => {
  switch (tip.toLowerCase()) {
    case 'res': return '🌬️';
    case 'ges': return '☀️';
    case 'hidro': return '💧';
    case 'termik': return '🔥';
    case 'dogalgaz': return '🔥';
    default: return '⚡';
  }
};

// Santralin tipine ve anlık durumuna göre dinamik bir ikon oluşturan fonksiyon
const createSantralIcon = (tip: string, uretim: number | null) => {
    const emoji = getSantralEmoji(tip);
    const isOnline = uretim !== null && uretim > 0;
    const statusColor = isOnline ? 'bg-green-500' : 'bg-gray-500';
    const pulseClass = isOnline ? 'animate-pulse' : '';

    return L.divIcon({
        html: `
            <div class="relative flex items-center justify-center w-10 h-10">
                <span class="text-3xl drop-shadow-lg">${emoji}</span>
                <div class="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColor} border-2 border-white ${pulseClass}"></div>
            </div>
        `,
        className: 'bg-transparent border-0',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
};

interface MapComponentProps {
    santraller: Santral[];
    liveData: Map<string, UretimData>;
}

export default function MapComponent({ santraller, liveData }: MapComponentProps) {
    return (
        <MapContainer 
            center={[39.0, 35.0]}
            zoom={6} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Aydınlık tema harita
            />
            {santraller.map(santral => {
                const anlikVeri = liveData.get(santral.id);
                const anlikUretim = anlikVeri ? parseFloat(anlikVeri.anlik_uretim_mw) : null;
                const kuruluGuc = parseFloat(santral.kurulu_guc_mw);
                const icon = createSantralIcon(santral.tip, anlikUretim);

                return (
                    <Marker 
                        key={santral.id} 
                        position={[parseFloat(santral.koordinat_enlem), parseFloat(santral.koordinat_boylam)]}
                        icon={icon}
                    >
                        <Tooltip
                            permanent={true}
                            direction="top"
                            offset={[0, -40]}
                            opacity={1}
                            className="!bg-transparent !border-none !shadow-none !p-0"
                        >
                            <div className="bg-emerald-800 bg-opacity-90 backdrop-blur-sm text-white rounded-lg p-3 shadow-xl border border-emerald-600">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-white">{santral.ad}</h3>
                                    <span className="font-mono bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full text-xs">{santral.tip}</span>
                                </div>
                                <p className="text-sm text-emerald-200">Kurulu Güç: {kuruluGuc.toFixed(2)} MW</p>
                                <p className="font-bold text-md mt-1">
                                    <span className={anlikUretim && anlikUretim > 0 ? 'text-green-300' : 'text-red-400'}>
                                        {anlikUretim !== null ? `${anlikUretim.toFixed(2)} MW` : 'Veri Yok'}
                                    </span>
                                </p>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
