'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HeaderBar() {
  const { session, logout } = useAuth();

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-8 py-4 mb-8 border-b border-border-dark bg-base-dark/70 backdrop-blur">
      <Link
        href="/"
        className="text-2xl sm:text-3xl font-bold text-text-light hover:text-brand-green transition-colors"
      >
        Santral Finansal Risk Paneli
      </Link>

      {session ? (
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-text-dark font-mono">
            {session.user_id.slice(0, 8)}…
          </span>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full border
              ${
                session.rol === 'admin'
                  ? 'text-red-300 border-red-500/40 bg-red-500/10'
                  : 'text-brand-green border-brand-green/40 bg-brand-green/10'
              }`}
          >
            {session.rol.toUpperCase()}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded-md text-sm bg-component-dark border border-border-dark text-text-light hover:bg-border-dark transition-colors"
          >
            Çıkış
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="px-3 py-1 rounded-md text-sm bg-brand-green text-black font-semibold hover:bg-brand-green/80 transition-colors"
        >
          Giriş
        </Link>
      )}
    </header>
  );
}
