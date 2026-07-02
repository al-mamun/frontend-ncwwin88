/**
 * DEMO games — a clearly-labelled placeholder catalog.
 *
 * Purpose: when the REAL public catalog (`GET /public/games`) is empty — e.g.
 * the backend is down, unseeded, or this is a marketing/demo deploy — the home
 * grid can fall back to these so it is never blank (the app-frontend approach).
 *
 * IMPORTANT — these are NOT real games:
 *   - every id is prefixed `demo-` and `badge` may be 'DEMO'
 *   - there are no imageUrls, so they render the token gradient poster
 *   - they must NEVER be launched as if real; the launch flow already routes a
 *     visitor to /login and an authed user to the (deferred) launch path.
 *
 * Controlled by NEXT_PUBLIC_DEMO_GAMES (see isDemoGamesEnabled). The fallback
 * only ever activates when the real catalog returns ZERO games.
 */

import type { Game } from '../../types';
import { normalizeCategory } from './categories';

/** Whether the demo fallback is allowed. Default ON; set NEXT_PUBLIC_DEMO_GAMES=off to disable. */
export function isDemoGamesEnabled(): boolean {
  return (process.env.NEXT_PUBLIC_DEMO_GAMES ?? 'on').toLowerCase() !== 'off';
}

const BADGE_CYCLE = ['HOT', 'HOT', 'TOP', 'NEW', 'HOT', 'TOP', 'NEW', 'HOT'] as const;

/** Compact seed list: [name, provider, category]. Spans every canonical category. */
const SEED: ReadonlyArray<readonly [string, string, string]> = [
  ['Cricket Exchange', 'SBO', 'sports'],
  ['Royal Casino', 'EVO', 'casino'],
  ['Fortune Roulette', 'JILI', 'table'],
  ['Super Ace', 'JILI', 'slot'],
  ['Super Ace Deluxe', 'JILI', 'slot'],
  ['Mega Fishing', 'JDB', 'fishing'],
  ['Golden Gems', 'PG', 'slot'],
  ['Aviator', 'SPRIBE', 'crash'],
  ['King Jackpot', 'CQ9', 'casino'],
  ['Dragon Tiger', 'EVO', 'casino'],
  ['Fish World', 'JDB', 'fishing'],
  ['Gem Hunter', 'PG', 'slot'],
  ['Baccarat Live', 'EVO', 'casino'],
  ['Money Coming', 'JILI', 'slot'],
  ['Cricket IPL', 'SBO', 'sports'],
  ['Crazy Time', 'EVO', 'casino'],
  ['Ocean King', 'JDB', 'fishing'],
  ['JetX', 'SMARTSOFT', 'crash'],
  ['Lightning Dice', 'EVO', 'table'],
  ['Sweet Bonanza', 'PG', 'slot'],
  ['Mines', 'SPRIBE', 'arcade'],
  ['Plinko', 'SMARTSOFT', 'arcade'],
  ['Andar Bahar', 'EZUGI', 'table'],
  ['Teen Patti', 'EZUGI', 'table'],
  ['Football Studio', 'EVO', 'sports'],
  ['Wild Bounty', 'PG', 'slot'],
  ['Crash X', 'TURBO', 'crash'],
  ['Lucky Fishing', 'JDB', 'fishing'],
  ['Boxing King', 'JILI', 'slot'],
  ['Roulette Live', 'EZUGI', 'casino'],
  ['Coin Flip', 'TURBO', 'arcade'],
  ['Dragon Hatch', 'PG', 'slot'],
];

/** The demo catalog (memoised module-level constant). */
export const DEMO_GAMES: Game[] = SEED.map(([name, provider, category], i) => ({
  id: `demo-${i + 1}`,
  name,
  provider,
  category,
  imageUrl: null,
  providerLogoUrl: null,
  art: null,
  color: null,
  badge: BADGE_CYCLE[i % BADGE_CYCLE.length],
}));

/** Distinct providers present in the demo set (for the filter strip in demo mode). */
export function demoProviders(): string[] {
  return Array.from(new Set(DEMO_GAMES.map((g) => g.provider).filter(Boolean))).sort();
}

/**
 * Client-side filter over the demo set, mirroring the server's category/provider/
 * search semantics so demo mode behaves like the real feed (just un-paginated).
 */
export function filterDemoGames(filters: { category?: string; provider?: string; search?: string } = {}): Game[] {
  const cat = normalizeCategory(filters.category ?? 'hot');
  const provider = filters.provider ?? 'ALL';
  const q = (filters.search ?? '').trim().toLowerCase();
  return DEMO_GAMES.filter((g) => {
    const catOk = cat === 'hot' ? true : normalizeCategory(g.category) === cat;
    const provOk = provider === 'ALL' || g.provider === provider;
    const qOk = !q || g.name.toLowerCase().includes(q) || (g.provider ?? '').toLowerCase().includes(q);
    return catOk && provOk && qOk;
  });
}
