// frontend/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  // --- DEĞİŞİKLİK BURADA ---
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // --- DEĞİŞİKLİK SONU ---
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;