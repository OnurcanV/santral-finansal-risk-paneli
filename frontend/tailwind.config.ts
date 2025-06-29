// frontend/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // --- YENİ RENK PALETİMİZ ---
      colors: {
        'base-dark': '#0D1117',       // Simsiyah ana arkaplan
        'component-dark': '#161B22',  // Form gibi bileşenlerin arkaplanı
        'brand-green': '#39FF14',    // O meşhur neon yeşilimiz
        'text-light': '#E6EDF3',     // Ana metin rengi (beyaz)
        'text-dark': '#8B949E',      // İkincil metin rengi (label'lar)
        'border-dark': '#30363D',    // Kenarlık rengi
      }
      // --- YENİ RENK PALETİ SONU ---
    },
  },
  plugins: [],
};
export default config;