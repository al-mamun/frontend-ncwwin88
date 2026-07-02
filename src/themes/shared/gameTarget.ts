/**
 * Shared helpers for theme public surfaces.
 *
 * Resolving where a game card should send the visitor:
 *  - authenticated  -> the real authenticated category lobby (the live launch
 *    flow lives at /player/games/[category]).
 *  - unauthenticated -> /login (browse-but-login-to-play).
 *
 * We never fabricate a launch on the public surface — launching requires the
 * authenticated player context.
 */

import type { Game } from '../../types';

/** Route a game card should navigate to, based on auth state. */
export function gameTarget(game: Pick<Game, 'category'>, isAuthed: boolean): string {
  if (!isAuthed) return '/login';
  const category = (game.category || 'slots').toLowerCase();
  return `/player/games/${encodeURIComponent(category)}`;
}

/** Route a category tile should navigate to, based on auth state. */
export function categoryTarget(categorySlug: string, isAuthed: boolean): string {
  if (!isAuthed) return '/login';
  return `/player/games/${encodeURIComponent(categorySlug.toLowerCase())}`;
}
