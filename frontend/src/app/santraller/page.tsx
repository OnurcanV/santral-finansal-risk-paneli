"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Santral } from "@/types/santral";
import Link from "next/link";

export default function SantrallerPage() {
  const { session, logout } = useAuth();
  const [data, setData] = useState<Santral[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // veri çek
  useEffect(() => {
    async function load() {
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const rows = await apiFetch<Santral[]>("/api/santraller", {}, session);
        setData(rows);
      } catch (e: any) {
        console.error(e);
        setErr(e.message ?? "Hata");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  // login yoksa
  if (!session) {
    return (
      <div className="p-4">
        <p>Giriş yapılmadı. <Link className="text-blue-600 underline" href="/login">Giriş yap</Link></p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Santrallerim</h1>
        <button
          onClick={logout}
          className="px-3 py-1 rounded bg-gray-700 text-white text-sm hover:bg-gray-800"
        >
          Çıkış
        </button>
      </header>

      {loading && <p>Yükleniyor...</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && !err && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-1 px-2">Ad</th>
                <th className="py-1 px-2">Tip</th>
                <th className="py-1 px-2">Kurulu Güç (MW)</th>
                <th className="py-1 px-2">Koord.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-1 px-2">{s.ad}</td>
                  <td className="py-1 px-2">{s.tip}</td>
                  <td className="py-1 px-2">{s.kurulu_guc_mw}</td>
                  <td className="py-1 px-2 text-xs">
                    {s.koordinat_enlem}, {s.koordinat_boylam}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td className="py-2 px-2 text-gray-500" colSpan={4}>
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
