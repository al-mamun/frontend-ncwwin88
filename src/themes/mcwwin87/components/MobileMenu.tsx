/**
 * mcwwin87 (MCW) — mobile side menu (matches the desktop look).
 *
 * Slide-in panel from the left:
 *   - gold header: tenant logo + "Hi Welcome" (+ username) + close (×)
 *   - guest: LOGIN / SIGN UP buttons
 *   - search box
 *   - 3-column category grid with gold SVG icons (no emoji)
 *   - socials row (24·7 CS / Telegram / Facebook)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Search, Flame, Trophy, Spade, Cherry, Rocket, Dices, Fish, Gamepad2, Ticket,
  Gift, Crown, Download, Users, Handshake, Award, Headset, Send, Facebook,
  type LucideIcon,
} from 'lucide-react';
import { useTenant } from '../../../core/tenant/TenantProvider';
import { useAuth } from '../../../providers/auth-provider';
import { categoryTarget } from '../../shared/gameTarget';
import { affiliateSiteUrl } from '../../../lib/affiliate';

type GridItem = {
  label: string;
  Icon: LucideIcon;
  slug?: string;        // game category -> games lobby
  href?: string;        // internal route (auth-gated)
  external?: boolean;   // affiliate portal
};

const GRID: GridItem[] = [
  { label: 'HOT', Icon: Flame, slug: 'hot' },
  { label: 'Sports', Icon: Trophy, slug: 'sports' },
  { label: 'Casino', Icon: Spade, slug: 'casino' },
  { label: 'Slot', Icon: Cherry, slug: 'slot' },
  { label: 'Crash', Icon: Rocket, slug: 'crash' },
  { label: 'Table', Icon: Dices, slug: 'table' },
  { label: 'Fishing', Icon: Fish, slug: 'fishing' },
  { label: 'Arcade', Icon: Gamepad2, slug: 'arcade' },
  { label: 'Lottery', Icon: Ticket, slug: 'lottery' },
  { label: 'Promotions', Icon: Gift, href: '/player/promotions' },
  { label: 'VIP', Icon: Crown, href: '/player/vip' },
  { label: 'Download', Icon: Download, href: '/' },
  { label: 'Affiliates', Icon: Users, external: true },
  { label: 'Partnerships', Icon: Handshake, href: '/player/referral' },
  { label: 'Winner Board', Icon: Award, href: '/player/winner-board' },
];

const GOLD = { color: 'var(--gold-2, #e7c14c)' } as const;

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const isAuthed = !!user;
  const [search, setSearch] = useState('');

  if (!open) return null;

  const initials = (tenant.name || 'MCW').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'MCW';
  const affUrl = affiliateSiteUrl(tenant.domain);

  const onGrid = (item: GridItem) => {
    if (item.external) { window.open(affUrl, '_blank', 'noopener'); onClose(); return; }
    if (item.slug) { router.push(categoryTarget(item.slug, isAuthed)); onClose(); return; }
    if (item.href) { router.push(isAuthed || item.href === '/' ? item.href : '?auth=login', { scroll: false }); onClose(); }
  };

  const submitSearch = () => {
    const q = search.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/');
    onClose();
  };

  const SOCIALS: { label: string; Icon: LucideIcon; href: string; external: boolean }[] = [
    { label: '24·7 CS', Icon: Headset, href: isAuthed ? '/player/support' : '?auth=login', external: false },
    { label: 'Telegram', Icon: Send, href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM || '#', external: true },
    { label: 'Facebook', Icon: Facebook, href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || '#', external: true },
  ];

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <aside className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col overflow-y-auto border-r border-border bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-base)] shadow-2xl">
        {/* Gold header */}
        <div className="flex items-center gap-3 bg-gradient-to-b from-[var(--brand)] to-[var(--brand-2-dark)] p-4">
          {tenant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-auto max-w-[150px] object-contain" />
          ) : (
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-black/20 text-base font-extrabold text-black">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="text-[1.02rem] font-bold leading-tight text-black">Hi Welcome</div>
            {isAuthed && (
              <div className="text-[0.85rem] text-black/80">{user?.username || user?.fullName}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-black"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Guest auth buttons */}
        {!isAuthed && (
          <div className="grid grid-cols-2 gap-3 p-4">
            <button
              type="button"
              onClick={() => { router.push('?auth=login', { scroll: false }); onClose(); }}
              className="rounded-lg border border-gold-soft/60 py-3 text-sm font-bold uppercase text-gold-soft transition-colors hover:bg-gold-soft/10"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { router.push('?auth=register', { scroll: false }); onClose(); }}
              className="rounded-lg bg-gradient-to-b from-[var(--brand)] to-[var(--brand-2-dark)] py-3 text-sm font-bold uppercase text-black"
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mx-4 mb-4 mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-base px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
            placeholder="Search Games"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {GRID.map(({ label, Icon, ...rest }) => (
            <button
              key={label}
              type="button"
              onClick={() => onGrid({ label, Icon, ...rest })}
              className="flex flex-col items-center gap-2 rounded-[8px] border border-border bg-elevated px-2 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand)]"
            >
              <Icon className="h-6 w-6" style={GOLD} aria-hidden />
              <span className="text-center text-[0.72rem] font-semibold leading-tight text-foreground">{label}</span>
            </button>
          ))}
        </div>

        {/* Socials */}
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border px-4 py-4">
          {SOCIALS.map(({ label, Icon, href, external }) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group flex flex-col items-center gap-1.5 rounded-lg bg-elevated px-1 py-3 transition-colors hover:bg-[var(--brand)]"
              >
                <Icon className="h-5 w-5 group-hover:!text-black" style={GOLD} aria-hidden />
                <span className="text-[0.7rem] font-semibold text-foreground group-hover:text-black">{label}</span>
              </a>
            ) : (
              <button
                key={label}
                type="button"
                onClick={() => { router.push(href); onClose(); }}
                className="group flex flex-col items-center gap-1.5 rounded-lg bg-elevated px-1 py-3 transition-colors hover:bg-[var(--brand)]"
              >
                <Icon className="h-5 w-5 group-hover:!text-black" style={GOLD} aria-hidden />
                <span className="text-[0.7rem] font-semibold text-foreground group-hover:text-black">{label}</span>
              </button>
            ),
          )}
        </div>
      </aside>
    </div>
  );
}
