/**
 * Default theme — public shell.
 *
 * A clean, neutral white-label header + footer used as the fallback for any
 * tenant whose themeKey is unknown or 'default'. Branding (logo/name) comes
 * from useTenant(); auth state from useAuth(). Token-only colours — no literal
 * hex — so per-tenant overrides apply.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LogIn, Wallet, ChevronDown, LogOut, HelpCircle } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../../components/ui/button';

function TenantLogo() {
  const { tenant } = useTenant();
  if (tenant.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto" />
    );
  }
  return <span className="text-xl font-extrabold tracking-wider text-brand">{tenant.name}</span>;
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const label = user.fullName || user.username || user.email || 'Account';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-elevated"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
          {label.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-sm font-medium sm:inline">{label}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <Link href="/player/wallet" role="menuitem" className="block px-4 py-2.5 text-sm hover:bg-elevated" onClick={() => setOpen(false)}>
              Wallet
            </Link>
            <Link href="/player/account" role="menuitem" className="block px-4 py-2.5 text-sm hover:bg-elevated" onClick={() => setOpen(false)}>
              My Account
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-elevated"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DefaultPublicLayout({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const { user, loading } = useAuth();
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-base">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2" aria-label={`${tenant.name} home`}>
              <TenantLogo />
            </Link>
            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              <Link href="#games" className="text-sm font-medium text-muted transition-colors hover:text-brand">
                Games
              </Link>
              <Link href="#promotions" className="text-sm font-medium text-muted transition-colors hover:text-brand">
                Promotions
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-elevated" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link href="/player/wallet">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand" /> Wallet
                  </Button>
                </Link>
                <UserMenu />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="default">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <TenantLogo />
              <p className="text-xs leading-relaxed text-muted">
                A secure, responsive gaming portal. Play responsibly.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Navigation</h4>
              <ul className="flex flex-col gap-2 text-xs text-muted">
                <li><Link href="#games" className="hover:text-brand">Games</Link></li>
                <li><Link href="#promotions" className="hover:text-brand">Promotions</Link></li>
                <li><Link href="/login" className="hover:text-brand">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Support</h4>
              <ul className="flex flex-col gap-2 text-xs text-muted">
                <li className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-brand" />
                  <Link href="/player/account" className="hover:text-brand">Help Center</Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-danger text-xs font-bold text-danger">
                    18+
                  </span>
                  <span className="leading-tight">Please play responsibly.</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
            <p>© {year} {tenant.name}. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-brand">Privacy Policy</Link>
              <Link href="#" className="hover:text-brand">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
