// Dosya: frontend/src/components/HeaderBar.tsx
// DÜZELTME: Navigasyon linkleri artık kullanıcının rolüne göre filtreleniyor.
'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const allNavLinks = [
  { href: '/dashboard', label: 'Canlı Dashboard', roles: ['admin', 'user'] },
  { href: '/raporlama', label: 'Raporlama', roles: ['admin', 'user'] },
  { href: '/harita', label: 'Harita', roles: ['admin', 'user'] },
  { href: '/santraller', label: 'Santral Yönetimi', roles: ['admin'] }, // Sadece admin görebilir
];

export default function HeaderBar() {
  const { session, logout, isImpersonating, stopImpersonation } = useAuth();
  const pathname = usePathname();

  // Kullanıcının rolüne göre gösterilecek linkleri filtrele
  const visibleLinks = session
    ? allNavLinks.filter(link => link.roles.includes(session.rol))
    : [];

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border-dark bg-base-dark/80 backdrop-blur sticky top-0 z-50">
      <Link href="/" className="text-xl font-bold text-text-light hover:text-brand-neon-green transition-colors">
        Santral Paneli
      </Link>

      {session && (
        <nav className="hidden md:flex items-center gap-6">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? 'text-brand-neon-green'
                  : 'text-text-dark hover:text-text-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      {session ? (
        <div className="flex items-center gap-4">
          {isImpersonating && (
            <button onClick={stopImpersonation} className="text-sm text-yellow-400 hover:underline">
              Admin'e Dön
            </button>
          )}
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full border ${
              session.rol === 'admin'
                ? 'text-red-300 border-red-500/40 bg-red-500/10'
                : 'text-brand-neon-green border-brand-neon-green/40 bg-brand-neon-green/10'
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
          className="px-4 py-2 rounded-md text-sm bg-brand-neon-green text-black font-semibold hover:bg-opacity-80 transition-colors"
        >
          Giriş Yap
        </Link>
      )}
    </header>
  );
}