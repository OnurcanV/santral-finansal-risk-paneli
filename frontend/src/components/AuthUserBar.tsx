'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AuthUserBar() {
  const { session, logout } = useAuth();

  if (!session) {
    return (
      <div className="fixed top-3 right-4 text-sm z-50">
        <Link
          href="/login"
          className="px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
        >
          Giriş
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed top-3 right-4 flex items-center gap-2 text-xs sm:text-sm bg-component-dark border border-border-dark px-3 py-1 rounded-md shadow z-50">
      <span className="font-mono text-text-light">{session.rol}</span>
      <span className="hidden sm:inline text-text-dark">|</span>
      <span className="hidden sm:inline text-text-dark">{session.user_id.slice(0,8)}…</span>
      <button
        onClick={logout}
        className="ml-2 px-2 py-[1px] rounded bg-gray-700 text-white hover:bg-gray-800 text-xs"
      >
        Çıkış
      </button>
    </div>
  );
}
