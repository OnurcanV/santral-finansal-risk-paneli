/// <reference types="vite/client" />
// Proje Vite değilse bile, minimal env interface tanımlayalım:

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  // ileride başka şeyler eklenebilir
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
