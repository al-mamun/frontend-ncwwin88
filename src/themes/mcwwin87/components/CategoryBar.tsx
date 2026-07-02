/**
 * mcwwin87 (MCW) — horizontal category card bar.
 *
 * Matches the MCW design: a row of category cards (emoji tile + label). The
 * active card uses the gold gradient with dark text; inactive cards are dark
 * elevated cards that highlight gold on hover. On desktop the cards stretch to
 * fill the full row; on mobile the row scrolls horizontally. Drives the same
 * category filter state as the grid.
 */

'use client';

import { cn } from '../../../lib/utils';

export interface CategoryBarItem {
  slug: string;
  label: string;
  icon: string; // emoji
}

/** MCW category set, in the design's display order (extended to fill the row). */
export const MCW_CATEGORIES: CategoryBarItem[] = [
  { slug: 'hot', label: 'HOT', icon: '🔥' },
  { slug: 'sports', label: 'Sports', icon: '⚽' },
  { slug: 'casino', label: 'Casino', icon: '🎰' },
  { slug: 'slot', label: 'Slot', icon: '🎲' },
  { slug: 'crash', label: 'Crash', icon: '🚀' },
  { slug: 'table', label: 'Table', icon: '🎴' },
  { slug: 'fishing', label: 'Fishing', icon: '🎣' },
  { slug: 'arcade', label: 'Arcade', icon: '🎮' },
  { slug: 'lottery', label: 'Lottery', icon: '🎟️' },
  { slug: 'bingo', label: 'Bingo', icon: '🎱' },
  { slug: 'poker', label: 'Poker', icon: '🃏' },
];

export default function CategoryBar({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:overflow-visible [&::-webkit-scrollbar]:hidden">
      {MCW_CATEGORIES.map((c) => {
        const active = activeSlug === c.slug;
        return (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelect(c.slug)}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'group flex min-w-[72px] flex-col items-center justify-center gap-1.5 rounded-[8px] border px-3 py-3 text-[11px] font-semibold uppercase tracking-wide transition-all duration-150 lg:min-w-0 lg:flex-1',
              active
                ? 'border-gold-soft bg-gradient-to-b from-[var(--brand)] to-[var(--brand-2-dark)] text-[#0d0d0d] shadow-md'
                : 'border-transparent bg-elevated text-muted hover:-translate-y-0.5 hover:border-gold-soft/60 hover:bg-[var(--bg-surface)] hover:text-gold-soft',
            )}
          >
            <span
              className={cn(
                'text-2xl leading-none transition-transform duration-150 group-hover:scale-110',
              )}
              aria-hidden
            >
              {c.icon}
            </span>
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
