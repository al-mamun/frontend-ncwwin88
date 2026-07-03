/**
 * useGamesFeed — the single source of truth for player-facing game lists.
 *
 * DB-first + server-side pagination (the read path is the backend `/public/games`,
 * which serves the synced catalog from the database — fast, secure, resilient).
 * We page with TanStack `useInfiniteQuery`: an initial page + "Load more" appends
 * the next page. Category / provider / search are applied SERVER-SIDE.
 *
 *   - `games`          accumulated items across loaded pages (or the demo set)
 *   - `total`          total matching the active filters
 *   - `hasMore`        another page is available
 *   - `fetchMore()`    load the next page
 *   - `isDemo`         the real catalog was empty -> labelled demo fallback
 *
 * Demo fallback: if the real catalog is empty (backend down / unseeded) and
 * NEXT_PUBLIC_DEMO_GAMES isn't 'off', a labelled placeholder set is shown
 * (filtered client-side to mirror the same category/provider/search semantics).
 */

import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { playerApi } from '../../services/player.service';
import { useTenant } from '../tenant/TenantProvider';
import { DEMO_GAMES, demoProviders, filterDemoGames, isDemoGamesEnabled } from './demoGames';
import { Gamepad2 } from 'lucide-react';
import { CATEGORY_NAV, CATEGORY_META, type CategoryNavItem } from './categories';
import type { Game } from '../../types';

const DEFAULT_LIMIT = 60;

export interface GamesFeedFilters {
  category?: string;
  provider?: string;
  search?: string;
  limit?: number;
  favourite?: boolean;
  featured?: boolean;
  popular?: boolean;
}

export interface GamesFeedResult {
  games: Game[];
  total: number;
  isDemo: boolean;
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  fetchMore: () => void;
}

export function useGamesFeed(filters: GamesFeedFilters = {}): GamesFeedResult {
  const { category = 'hot', provider = 'ALL', search = '', limit = DEFAULT_LIMIT, favourite, featured, popular } = filters;
  const tenant = useTenant().tenant.slug || undefined;

  const query = useInfiniteQuery({
    queryKey: ['gamesFeed', { category, provider, search, limit, tenant, favourite, featured, popular }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      playerApi.getGamesPage({ page: pageParam as number, limit, category, provider, search, tenant, favourite, featured, popular }),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    staleTime: 30_000,
  });

  const realItems = useMemo<Game[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data],
  );
  const realTotal = query.data?.pages[0]?.total ?? 0;

  // Demo fallback only when the REAL catalog is genuinely empty (not while loading).
  const isDemo = !query.isLoading && realTotal === 0 && realItems.length === 0 && isDemoGamesEnabled();
  const demoItems = useMemo<Game[]>(
    () => (isDemo ? filterDemoGames({ category, provider, search }) : []),
    [isDemo, category, provider, search],
  );

  return {
    games: isDemo ? demoItems : realItems,
    total: isDemo ? demoItems.length : realTotal,
    isDemo,
    isLoading: query.isLoading,
    isError: query.isError,
    hasMore: isDemo ? false : !!query.hasNextPage,
    isFetchingMore: query.isFetchingNextPage,
    fetchMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}

/**
 * Distinct provider list for the filter strip, prefixed with 'ALL'. Falls back to
 * the demo providers when the real catalog is empty (so demo mode has a strip too).
 */
export function useGameProviders(): string[] {
  const tenant = useTenant().tenant.slug || undefined;
  const query = useQuery({
    queryKey: ['gameProviders', tenant],
    queryFn: () => playerApi.getGameProviders(tenant),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => {
    const real = query.data ?? [];
    const base = real.length > 0 ? real : isDemoGamesEnabled() && DEMO_GAMES.length ? demoProviders() : [];
    return ['ALL', ...base];
  }, [query.data]);
}

/**
 * Provider keys the operator flagged FEATURED (tenant override wins) — used to
 * build the Featured Games marquee tabs. Empty array when none are flagged.
 */
export function useFeaturedProviders(): string[] {
  const tenant = useTenant().tenant.slug || undefined;
  const query = useQuery({
    queryKey: ['featuredProviders', tenant],
    queryFn: () => playerApi.getFeaturedProviders(tenant),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => query.data ?? [], [query.data]);
}

/** Visible providers with their effective logo — for the category filter strip. */
export function useGameProvidersDetailed(category?: string): Array<{ key: string; logoUrl: string | null }> {
  const tenant = useTenant().tenant.slug || undefined;
  const query = useQuery({
    queryKey: ['providersDetailed', tenant, category ?? null],
    queryFn: () => playerApi.getProvidersDetailed(tenant, category),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => query.data ?? [], [query.data]);
}


/**
 * Category tabs for the player site. Backend-driven: honors the tenant's category
 * ORDER + hidden categories (GET /public/games/categories). 'hot' is virtual and
 * always prepended. Known slugs reuse the canonical icon/label; unknown slugs get
 * a Title-cased label + default icon. Falls back to the static taxonomy when the
 * catalog is empty (demo/visitor/backend down).
 */
export function useGameCategories(): CategoryNavItem[] {
  const tenant = useTenant().tenant.slug || undefined;
  const menu = useQuery({
    queryKey: ['gameMenu', tenant],
    queryFn: () => playerApi.getGameMenu(tenant),
    staleTime: 5 * 60_000,
  });
  const query = useQuery({
    queryKey: ['gameCategories', tenant],
    queryFn: () => playerApi.getGameCategories(tenant),
    staleTime: 5 * 60_000,
    enabled: (menu.data?.length ?? 0) === 0,
  });
  return useMemo(() => {
    // 1) Operator-defined custom menu wins (fully custom category bar).
    const m = menu.data ?? [];
    if (m.length) {
      const items = m.map((item): CategoryNavItem => {
        const icon = CATEGORY_META[item.icon ?? '']?.icon ?? CATEGORY_META[item.key]?.icon ?? Gamepad2;
        return { slug: item.key as CategoryNavItem['slug'], label: item.label || item.key, icon };
      });
      // Always surface the virtual 'Hot' tab FIRST when the menu omits it.
      return items.some((i) => i.slug === 'hot') ? items : [CATEGORY_NAV[0], ...items];
    }
    // 2) Menu still resolving -> return nothing (don't flash the static default
    //    set, which caused a visible category "blink" on first paint).
    if (menu.isLoading) return [];
    // 3) Fallback: data-derived categories (Hot + the feed's categories).
    const hot = CATEGORY_NAV[0];
    const slugs = (query.data ?? []).filter((x) => x && x !== 'hot');
    if (slugs.length === 0) return CATEGORY_NAV;
    const items = slugs.map((slug): CategoryNavItem => {
      const meta = CATEGORY_META[slug];
      const label = meta?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1);
      const icon = meta?.icon ?? Gamepad2;
      return { slug: slug as CategoryNavItem['slug'], label, icon };
    });
    return [hot, ...items];
  }, [menu.data, menu.isLoading, query.data]);
}


/** Lowercased set of category keys + baseCategories the operator flagged `popular`
 *  in the homepage category menu. Drives the home "Popular Games" rail. */
export function usePopularCategoryKeys(): Set<string> {
  const tenant = useTenant().tenant.slug || undefined;
  const menu = useQuery({
    queryKey: ['gameMenu', tenant],
    queryFn: () => playerApi.getGameMenu(tenant),
    staleTime: 5 * 60_000,
  });
  return useMemo(() => {
    const set = new Set<string>();
    for (const c of menu.data ?? []) {
      if (!c?.popular) continue;
      if (c.key) set.add(String(c.key).toLowerCase());
      if (c.baseCategory) set.add(String(c.baseCategory).toLowerCase());
    }
    return set;
  }, [menu.data]);
}
