/**
 * Canonical game-category taxonomy + alias normalisation.
 *
 * Adopted from the proven app-frontend model (GameGrid.jsx): the backend (and
 * upstream aggregators) emit a wide range of free-form category strings. The UI
 * collapses them into a small, stable set of CANONICAL categories so that
 * client-side filtering, the sidebar nav, and the route param all agree.
 *
 * `hot` is a virtual category meaning "show ALL games" — it is not a real
 * server-side bucket.
 */

import {
  Flame,
  Cherry,
  Spade,
  Trophy,
  Rocket,
  Fish,
  Dices,
  Gamepad2,
  Ticket,
  Grid3x3,
  Club,
  Bird,
  Tv,
  Heart,
  type LucideIcon,
} from 'lucide-react';

/** The canonical categories, in display order. `hot` = show everything. */
export const CANONICAL_CATEGORIES = [
  'hot',
  'slot',
  'casino',
  'sports',
  'crash',
  'fishing',
  'table',
  'arcade',
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];

/**
 * Normalise any free-form category value into a canonical category.
 *
 * Steps (matching the reference model):
 *   1. lowercase + collapse `_`/whitespace runs to a single `-`
 *   2. map known aliases to their canonical bucket
 *   3. otherwise return the cleaned value, defaulting to `slot`
 */
export function normalizeCategory(value: string | null | undefined = ''): string {
  const c = String(value ?? '')
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

  if (['hot-game', 'hot-games', 'popular', 'featured'].includes(c)) return 'hot';
  if (['slots', 'slot-game', 'slot-games'].includes(c)) return 'slot';
  if (['live', 'live-casino', 'casino-live', 'baccarat', 'roulette'].includes(c)) return 'casino';
  if (['sportsbook', 'sport', 'sports-game', 'exchange'].includes(c)) return 'sports';
  if (['fish', 'fishing-game', 'fish-shooting'].includes(c)) return 'fishing';
  if (['crash-game', 'crash-games', 'instant', 'flash'].includes(c)) return 'crash';

  return c || 'slot';
}

export interface CategoryNavItem {
  /** Canonical slug. */
  slug: CanonicalCategory;
  /** Human label (localise here). */
  label: string;
  icon: LucideIcon;
}

/** Sidebar / tab nav metadata, one entry per canonical category. */
export const CATEGORY_NAV: CategoryNavItem[] = [
  { slug: 'hot', label: 'Hot', icon: Flame },
  { slug: 'slot', label: 'Slots', icon: Cherry },
  { slug: 'casino', label: 'Casino', icon: Spade },
  { slug: 'sports', label: 'Sports', icon: Trophy },
  { slug: 'crash', label: 'Crash', icon: Rocket },
  { slug: 'fishing', label: 'Fishing', icon: Fish },
  { slug: 'table', label: 'Table', icon: Dices },
  { slug: 'arcade', label: 'Arcade', icon: Gamepad2 },
];

/**
 * Richer icon/label lookup used to render ANY category the backend returns
 * (data-driven tabs), beyond the core fallback set above. Unknown slugs fall back
 * to a Title-cased label + a generic icon at the call site.
 */
export const CATEGORY_META: Record<string, { label: string; icon: LucideIcon }> = {
  hot: { label: 'Hot', icon: Flame },
  slot: { label: 'Slots', icon: Cherry },
  casino: { label: 'Casino', icon: Spade },
  live: { label: 'Live Casino', icon: Tv },
  sports: { label: 'Sports', icon: Trophy },
  crash: { label: 'Crash', icon: Rocket },
  fishing: { label: 'Fishing', icon: Fish },
  table: { label: 'Table', icon: Dices },
  arcade: { label: 'Arcade', icon: Gamepad2 },
  lottery: { label: 'Lottery', icon: Ticket },
  bingo: { label: 'Bingo', icon: Grid3x3 },
  poker: { label: 'Poker', icon: Club },
  cockfight: { label: 'Cockfight', icon: Bird },
  virtual: { label: 'Virtual', icon: Tv },
  egames: { label: 'E-Games', icon: Gamepad2 },
  lotto: { label: 'Lotto', icon: Ticket },
  favorite: { label: 'Favorites', icon: Heart },
};
