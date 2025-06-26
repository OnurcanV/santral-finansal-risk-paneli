// frontend/src/app/page.tsx

'use client';

import SantralEkleForm from "@/components/SantralEkleForm";

export default function HomePage() {
  return (
    <main className="container mx-auto p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8">
        Santral Finansal Risk Paneli
      </h1>

      <SantralEkleForm />
    </main>
  );
}