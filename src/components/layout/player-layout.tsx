/**
 * Player-portal layout system.
 * Header + Sidebar + MobileNav + Footer + ProfileDropdown.
 * Responsive: sidebar on desktop, bottom nav on mobile.
 */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Wallet,
  User,
  Shield,
  FileText,
  Handshake,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { useTenant } from '../../core/tenant/TenantProvider';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/player/wallet', label: 'Wallet', icon: Wallet },
  { href: '/player/account', label: 'Account', icon: User },
  { href: '/player/security', label: 'Security', icon: Shield },
  { href: '/player/ledger', label: 'Ledger', icon: FileText },
  { href: '/player/affiliate', label: 'Affiliate', icon: Handshake },
];

// ─── Header ────────────────────────────────────────────────────
export function Header({ platformName }: { platformName?: string }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const name = platformName || tenant.name || 'Casino';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link href="/player/wallet" className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand">{name}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? <ProfileDropdown onLogout={handleLogout} /> : (
            <Link href="/login">
              <Button size="sm" variant="default">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <nav className="border-t border-border bg-surface md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-elevated"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

// ─── ProfileDropdown ───────────────────────────────────────────
function ProfileDropdown({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-elevated"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft text-sm font-bold text-[#0d0d0d]">
          {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium sm:inline">
          {user.fullName || user.username}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium">{user.fullName || user.username}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <Link
              href="/player/account"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-elevated"
            >
              My Account
            </Link>
            <Link
              href="/player/security"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-elevated"
            >
              Security
            </Link>
            <button
              onClick={onLogout}
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

// ─── Sidebar (desktop) ─────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-base font-semibold text-gold-soft ring-1 ring-white/5' : 'text-muted hover:bg-elevated',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── MobileNav (bottom bar) ────────────────────────────────────
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              active ? 'text-gold-soft' : 'text-muted',
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Footer ────────────────────────────────────────────────────
export function Footer({ supportEmail, supportPhone }: { supportEmail?: string | null; supportPhone?: string | null }) {
  const { tenant } = useTenant();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} {tenant.name || 'Casino'}. All rights reserved.</p>
        <div className="flex gap-4">
          {supportEmail && <span>Support: {supportEmail}</span>}
          {supportPhone && <span>Phone: {supportPhone}</span>}
        </div>
      </div>
    </footer>
  );
}