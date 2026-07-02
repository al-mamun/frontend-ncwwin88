/**
 * bdbet21 — mobile action bar (shown below the lg breakpoint, under the slider).
 *
 * A quick-access strip: Login (or wallet balance when authed) on the left, and
 * Deposit / Support / More / Search actions on the right. "More" opens the shared
 * MobileMenu drawer; "Search" opens a full-screen search overlay wired to the
 * home feed's search state (the inline GameTabs search is hidden on mobile).
 * Desktop is unaffected (this whole bar is lg:hidden).
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, Headphones, LayoutGrid, LogIn, Search, Wallet, X } from 'lucide-react';
import MobileMenu from './MobileMenu';

function money(minor: number, currency: string): string {
  return `${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export default function ActionBar({
  isAuthed,
  balanceMinor,
  currency,
  search,
  onSearch,
}: {
  isAuthed: boolean;
  balanceMinor?: number;
  currency?: string;
  search: string;
  onSearch: (value: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // The mobile header's search icon opens THIS overlay (one shared search UX).
  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener('bdbet:open-search', open as EventListener);
    return () => window.removeEventListener('bdbet:open-search', open as EventListener);
  }, []);

  const actionClass =
    'flex flex-col items-center gap-0.5 px-1 text-[10px] font-medium text-muted transition-colors hover:text-gold-soft';

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-y border-border bg-surface px-3 py-2 lg:hidden">
        {/* Left: balance (authed) or Login */}
        {isAuthed ? (
          <Link
            href="/player/deposit"
            className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2 text-sm font-bold text-gold-soft"
          >
            <Wallet className="h-4 w-4" aria-hidden />
            {money(balanceMinor ?? 0, currency ?? 'BDT')}
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-gold-soft to-[#d4a017] px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-[#0d0d0d] shadow-md ring-1 ring-white/25"
          >
            <LogIn className="h-4 w-4" aria-hidden /> Login / Register
          </Link>
        )}

        {/* Right: quick actions */}
        <div className="flex items-center gap-3">
          <Link href={isAuthed ? '/player/deposit' : '/login'} className={actionClass}>
            <ArrowDownToLine className="h-5 w-5" aria-hidden />
            Deposit
          </Link>
          <Link href={isAuthed ? '/player/support' : '/login'} className={actionClass}>
            <Headphones className="h-5 w-5" aria-hidden />
            Support
          </Link>
          <button type="button" onClick={() => setMenuOpen(true)} className={actionClass} aria-label="More">
            <LayoutGrid className="h-5 w-5" aria-hidden />
            More
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} className={actionClass} aria-label="Search games">
            <Search className="h-5 w-5" aria-hidden />
            Search
          </button>
        </div>
      </div>

      {/* "More" reuses the shared navigation drawer. */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Full-screen search overlay (mobile). Results filter the grid below live. */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-base lg:hidden" role="dialog" aria-modal="true" aria-label="Search games">
          <div className="flex items-center gap-2 border-b border-border bg-surface p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search games…"
                aria-label="Search games"
                className="h-11 w-full rounded-full border border-border bg-elevated pl-9 pr-3 text-sm text-brand outline-none focus:border-gold-soft"
              />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="rounded-md p-2 text-muted transition-colors hover:text-gold-soft"
              aria-label="Close search"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="m-3 rounded-lg bg-gold-soft py-2.5 text-sm font-bold text-brand-fg"
          >
            {search.trim() ? `Show results for "${search.trim()}"` : 'Close'}
          </button>
        </div>
      )}
    </>
  );
}
