/**
 * mcwwin87 (NCW) — mobile category bar (icons + labels, horizontal scroll).
 * Two modes:
 *  - Controlled TAB mode (pass `active` + `onSelect`): tapping a category swaps
 *    content in place (no navigation). Used on the mobile home.
 *  - Link mode (no props): navigates to /player/games/<slug>. Used on the
 *    standalone category page.
 * The active tab auto-scrolls into view so the row "slides" one by one.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Flame, Trophy, Spade, Cherry, Rocket, Dices, Fish, Gamepad2, Ticket, type LucideIcon } from 'lucide-react';
import { useI18n } from '../../../core/i18n/LanguageProvider';
import { cn } from '../../../lib/utils';

const CATS: { slug: string; icon: LucideIcon }[] = [
  { slug: 'hot', icon: Flame },
  { slug: 'sports', icon: Trophy },
  { slug: 'casino', icon: Spade },
  { slug: 'slot', icon: Cherry },
  { slug: 'crash', icon: Rocket },
  { slug: 'table', icon: Dices },
  { slug: 'fishing', icon: Fish },
  { slug: 'arcade', icon: Gamepad2 },
  { slug: 'lottery', icon: Ticket },
];

export default function MobileCategoryBar({
  active,
  onSelect,
}: {
  active?: string;
  onSelect?: (slug: string) => void;
} = {}) {
  const pathname = usePathname() || '';
  const { t } = useI18n();
  const controlled = typeof onSelect === 'function';
  const activeRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  const isActive = (slug: string) =>
    controlled
      ? active === slug
      : slug === 'hot'
        ? pathname === '/' || pathname === '/player/games/hot'
        : pathname === `/player/games/${slug}`;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [active, pathname]);

  return (
    <nav className="mcat-bar lg:hidden" aria-label="Game categories">
      {CATS.map(({ slug, icon: Icon }) => {
        const on = isActive(slug);
        const inner = (
          <>
            <Icon className="mcat-ico" aria-hidden />
            <span>{t(`nav.${slug}`)}</span>
          </>
        );
        if (controlled) {
          return (
            <button
              key={slug}
              type="button"
              ref={on ? (activeRef as RefObject<HTMLButtonElement>) : undefined}
              onClick={() => onSelect?.(slug)}
              className={cn('mcat-item', on && 'active')}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={slug}
            href={slug === 'hot' ? '/' : `/player/games/${slug}`}
            ref={on ? (activeRef as RefObject<HTMLAnchorElement>) : undefined}
            className={cn('mcat-item', on && 'active')}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
