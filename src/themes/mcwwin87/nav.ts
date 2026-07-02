/**
 * Static navigation metadata for the mcwwin87 (Nega Casino World) theme.
 *
 * NAV_CATEGORIES drives the top GameTabs (canonical category taxonomy, lucide
 * icons). SIDEBAR_ITEMS drives the left sidebar / side menu — the NCW design's
 * clean category grid, with full-colour EMOJI icons matching the reference.
 * These are navigation labels only; they drive filtering/routing, not game logic.
 */

import { CATEGORY_NAV, type CategoryNavItem } from '../../core/games/categories';

export type NavCategory = CategoryNavItem;

/** One nav entry per canonical category, in display order (top GameTabs). */
export const NAV_CATEGORIES: NavCategory[] = CATEGORY_NAV;

export type SidebarItemKind = 'category' | 'provider' | 'all';

export interface SidebarItem {
  key: string;
  label: string;
  /** Full-colour emoji icon (renders coloured natively). */
  icon: string;
  kind: SidebarItemKind;
  /** category slug, provider match keyword, or '' for 'all'. */
  value: string;
}

/**
 * NCW category set (matches the design's side-menu / category bar). All entries
 * are game categories so the filter behaves consistently; "All Games" maps to
 * the virtual 'hot' bucket (show everything).
 */
export const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'hot', label: 'HOT', icon: '🔥', kind: 'category', value: 'hot' },
  { key: 'sports', label: 'Sports', icon: '⚽', kind: 'category', value: 'sports' },
  { key: 'casino', label: 'Casino', icon: '🎰', kind: 'category', value: 'casino' },
  { key: 'slot', label: 'Slot', icon: '🎲', kind: 'category', value: 'slot' },
  { key: 'crash', label: 'Crash', icon: '🚀', kind: 'category', value: 'crash' },
  { key: 'table', label: 'Table', icon: '🎴', kind: 'category', value: 'table' },
  { key: 'fishing', label: 'Fishing', icon: '🎣', kind: 'category', value: 'fishing' },
  { key: 'arcade', label: 'Arcade', icon: '🎮', kind: 'category', value: 'arcade' },
  { key: 'lottery', label: 'Lottery', icon: '🎟️', kind: 'category', value: 'lottery' },
  { key: 'all', label: 'All Games', icon: '🏢', kind: 'all', value: '' },
];
