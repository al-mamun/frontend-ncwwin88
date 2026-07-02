/**
 * Default theme — public home page.
 *
 * Game-rich landing modelled on the app-frontend reference (logic, not design):
 *  - Loads the FULL public game catalog ONCE via useGameCatalog (visible to
 *    visitors AND players — no auth gate on browsing).
 *  - Category navigation grid (CANONICAL_CATEGORIES).
 *  - "Hot Games" poster grid (GamePoster: image or token-driven fallback).
 *  - Provider strip derived from the catalog.
 *  - Promotions section uses REAL data only (usePromotions); hidden if none.
 *
 * Browse-but-login-to-play: a game/category card routes to the authenticated
 * lobby when signed in, otherwise to /login. We never fabricate a launch, a
 * balance, winners, or jackpot timers. Token-only colours.
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Gift, ShieldCheck, Zap, Trophy } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useAuth } from '../../providers/auth-provider';
import { usePromotions } from '../../hooks/player-hooks';
import { useGamesFeed, useGameProviders } from '../../core/games/useGameCatalog';
import { CATEGORY_NAV } from '../../core/games/categories';
import { GamePoster } from '../../core/games/GamePoster';
import { Button } from '../../components/ui/button';
import { categoryTarget, gameTarget } from '../shared/gameTarget';
import type { Game } from '../../types';

/** How many providers to show in the strip. */
const PROVIDER_LIMIT = 14;

function GameCard({ game, isAuthed }: { game: Game; isAuthed: boolean }) {
  return (
    <Link
      href={gameTarget(game, isAuthed)}
      className="group relative block overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl"
      aria-label={`Play ${game.name}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <GamePoster game={game} className="transition-transform duration-300 group-hover:scale-105" />
        {game.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-fg">
            {game.badge}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-base/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <span className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-brand-fg">Play Now</span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold">{game.name}</p>
        <p className="truncate text-xs text-muted">{game.provider}</p>
      </div>
    </Link>
  );
}

function PosterSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="aspect-[3/4] animate-pulse bg-elevated" />
      <div className="space-y-1.5 p-2.5">
        <div className="h-3 w-3/4 animate-pulse rounded bg-elevated" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-elevated" />
      </div>
    </div>
  );
}

export default function DefaultHomePage() {
  const { tenant } = useTenant();
  const { user, loading: authLoading } = useAuth();
  const isAuthed = !!user;

  // Public catalog: visible to everyone (browse-but-login-to-play). Server-paginated
  // feed (60 + Load more); providers from the dedicated endpoint.
  const { games: hotGames, isLoading: gamesLoading, isDemo, hasMore, fetchMore, isFetchingMore } =
    useGamesFeed({ category: 'hot', limit: 64 });
  const providers = useGameProviders();
  const { data: promotions } = usePromotions();

  const providerChips = providers.filter((p) => p !== 'ALL').slice(0, PROVIDER_LIMIT);
  const activePromotions = (promotions ?? []).filter((p) => p.status === 'active');

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface via-base to-base py-14 md:py-20">
        <div className="absolute left-1/4 top-1/4 -z-10 h-72 w-72 rounded-full bg-brand/10 blur-[100px]" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 text-center md:px-6">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Welcome to {tenant.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
            Play premium games and manage deposits and withdrawals in one secure portal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {authLoading ? (
              <div className="h-12 w-40 animate-pulse rounded-md bg-elevated" />
            ) : isAuthed ? (
              <Link href="/player/wallet">
                <Button size="lg" className="flex items-center gap-2 font-bold">
                  Go to Wallet <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="flex items-center gap-2 font-bold">
                    Join Now <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#games">
                  <Button size="lg" variant="outline">Explore Games</Button>
                </Link>
              </>
            )}
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 border-t border-border/60 pt-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1">
              <Zap className="h-6 w-6 text-brand" aria-hidden />
              <span className="text-sm font-semibold">Fast Transactions</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-6 w-6 text-brand" aria-hidden />
              <span className="text-sm font-semibold">Secure &amp; Private</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Trophy className="h-6 w-6 text-brand" aria-hidden />
              <span className="text-sm font-semibold">Fair Play</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category navigation */}
      <section className="border-t border-border/40 py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {CATEGORY_NAV.map(({ slug, label, icon: Icon }) => (
              <Link
                key={slug}
                href={categoryTarget(slug, isAuthed)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:bg-elevated"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-elevated text-brand transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Games grid */}
      <section id="games" className="py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <span className="inline-block h-6 w-1.5 rounded-full bg-brand" aria-hidden /> Hot Games
              {isDemo && (
                <span className="rounded-full border border-border bg-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Demo
                </span>
              )}
            </h2>
            <Link href={categoryTarget('hot', isAuthed)} className="text-sm font-semibold text-brand hover:underline">
              View all
            </Link>
          </div>

          {gamesLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <PosterSkeleton key={i} />
              ))}
            </div>
          ) : hotGames.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {hotGames.map((game) => (
                <GameCard key={game.id} game={game} isAuthed={isAuthed} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface/50 p-10 text-center">
              <p className="text-sm font-medium text-muted">
                Games are being prepared. Please check back shortly.
              </p>
            </div>
          )}

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={fetchMore}
                disabled={isFetchingMore}
                className="min-w-[180px] font-semibold"
              >
                {isFetchingMore ? 'Loading…' : 'Load more games'}
              </Button>
            </div>
          )}

          {/* Provider strip (derived from the catalog) */}
          {providerChips.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Providers</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {providerChips.map((provider) => (
                  <Link
                    key={provider}
                    href={categoryTarget('hot', isAuthed)}
                    className="flex shrink-0 flex-col items-center gap-1 rounded-lg border border-border bg-surface px-4 py-2.5 transition-colors hover:border-brand/50 hover:bg-elevated"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-elevated text-xs font-bold text-brand">
                      {provider.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="max-w-[80px] truncate text-[11px] font-medium text-muted">{provider}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Promotions (real data only) */}
      {activePromotions.length > 0 && (
        <section id="promotions" className="border-t border-border/40 bg-surface/30 py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <h2 className="mb-8 flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <Gift className="h-7 w-7 text-brand" aria-hidden /> Promotions
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {activePromotions.map((promo) => (
                <div key={promo.id} className="rounded-lg border border-border bg-surface p-6">
                  <h3 className="text-xl font-bold">{promo.title}</h3>
                  <p className="mt-2 text-sm text-muted">{promo.description}</p>
                  {promo.code && (
                    <p className="mt-4 text-sm">
                      <span className="text-muted">Code: </span>
                      <span className="font-mono font-bold text-brand">{promo.code}</span>
                    </p>
                  )}
                  <Link href={isAuthed ? '/player/deposit' : '/login'} className="mt-4 inline-block">
                    <Button variant="outline" size="sm">Claim</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
