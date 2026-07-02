/**
 * Dynamic Game Category Lobby (authenticated).
 *
 * DB-first + server-side pagination: useGamesFeed pages the catalog from the
 * backend, filtering by the route category (normalized) + provider + search on
 * the server. "Load more" appends the next page. No fabricated fallback games —
 * an empty catalog shows a graceful empty state (or the labelled demo set).
 *
 * Launch flow is preserved via useGameLaunch + GamePlayOverlay. Imageless games
 * render the token-driven FALLBACK POSTER (never a blank/black box).
 */
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Play, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameLaunch, useWallet } from '@/hooks/player-hooks';
import { useAuth } from '@/providers/auth-provider';
import { useI18n } from '@/core/i18n/LanguageProvider';
import { useGamesFeed, useGameProvidersDetailed } from '@/core/games/useGameCatalog';
import { normalizeCategory } from '@/core/games/categories';
import { GamePoster } from '@/core/games/GamePoster';
import MobileCategoryBar from '@/themes/mcwwin87/components/MobileCategoryBar';
import { PageContainer, EmptyState } from '@/components/shared';
import { GamePlayOverlay } from '@/components/shared/game-play-overlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Game, GameSession } from '@/types';

export default function GameCategoryLobby() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawCategory = (params?.category as string) || 'slot';
  const category = normalizeCategory(rawCategory);

  // Active user queries
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const { user } = useAuth();
  const { t } = useI18n();
  const launchMutation = useGameLaunch();

  // Search & provider filter states
  const providerParam = searchParams?.get('provider');
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'recommend' | 'latest' | 'favorite' | 'az'>('recommend');

  // Sync url param if clicking from mega menu
  useEffect(() => {
    if (providerParam) {
      setSelectedProvider(providerParam);
    } else {
      setSelectedProvider('ALL');
    }
  }, [providerParam]);

  // Server-paginated feed for this route category (+ provider/search)
  const { games, isLoading, hasMore, fetchMore, isFetchingMore } = useGamesFeed({
    category,
    provider: selectedProvider,
    search,
    limit: 120,
  });
  const providersDetailed = useGameProvidersDetailed(category);

  // Active game play session overlay state
  const [activePlay, setActivePlay] = useState<{ game: Game; session: GameSession } | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const displayCategory = useMemo(() => category.replace(/-/g, ' '), [category]);
  const categoryTitle = useMemo(() => { const k = `nav.${category}`; const tr = t(k); return tr === k ? displayCategory : tr; }, [category, displayCategory, t]);

  // Client-side sorting/filtering enhancements based on selected sort-tab
  const processedGames = useMemo(() => {
    let result = [...games];
    if (sortBy === 'az') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'latest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'favorite') {
      result.sort((a, b) => (a.name.toLowerCase().includes('ace') || a.name.toLowerCase().includes('garuda') ? -1 : 1));
    }
    return result;
  }, [games, sortBy]);

  // Infinite Scroll loading handler
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => {
      setCanScroll(el.scrollWidth - el.clientWidth > 4);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [providersDetailed]);
  const handleArrow = () => {
    const el = barRef.current;
    if (!el) return;
    if (atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
    else el.scrollBy({ left: 320, behavior: 'smooth' });
  };
  useEffect(() => {
    if (!hasMore || isFetchingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: '300px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isFetchingMore, fetchMore, isLoading]);

  // Trigger game launch via the real launch endpoint.
  const handleLaunch = (game: Game) => {
    if (!user) { router.push('/login'); return; }
    setLaunchError(null);
    launchMutation.mutate(game.id, {
      onSuccess: (session) => setActivePlay({ game, session }),
      onError: (err) =>
        setLaunchError(
          err instanceof Error ? err.message : 'Could not start the game. Please try again.',
        ),
    });
  };

  // Helper to generate multiplier labels
  const getMultiplier = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const multipliers = ['1000x', '5330x', '10000x', '2100x', '25000x', '2000x', '1500x'];
    if (hash % 3 === 0) {
      return multipliers[hash % multipliers.length];
    }
    return null;
  };

  return (
    <PageContainer className="max-w-[1240px]">
      <MobileCategoryBar />
      {/* Launching loader — visible while the launch request is in flight. */}
      {launchMutation.isPending && !activePlay && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-base/90 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-gold-soft/30 border-t-gold-soft" />
          <p className="text-sm font-semibold text-gold-soft">Loading game…</p>
        </div>
      )}

      {/* Dynamic Game Overlay */}
      {activePlay && (
        <GamePlayOverlay
          game={activePlay.game}
          session={activePlay.session}
          balanceMinor={wallet?.balanceMinor ?? 0}
          currency={wallet?.currency ?? 'BDT'}
          onClose={() => setActivePlay(null)}
          onRefreshBalance={refetchWallet}
        />
      )}

      {/* Launch error feedback */}
      {launchError && (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {launchError}
        </div>
      )}

      {/* Title block with back arrow, category label and sorting tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-border bg-elevated hover:bg-base"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div className="category-title-bar">
            {categoryTitle}
          </div>
        </div>

        {/* Sorting tabs */}
        <div className="sort-tabs-container">
          {(['recommend', 'latest', 'favorite', 'az'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSortBy(tab)}
              className={`sort-tab-btn ${sortBy === tab ? 'active' : ''}`}
            >
              {t(`sort.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters: Horizontal bar of providers + Search toggle */}
      <div className="mb-6">
        <div className="provider-filter-outer">
          <div className="provider-filter-scroll">
          <div className="provider-filter-bar" ref={barRef}>
          {/* Layout Grid / ALL button */}
          <button
            onClick={() => {
              setSelectedProvider('ALL');
              router.push(`/player/games/${category}`);
            }}
            className={`provider-filter-btn layout-btn ${selectedProvider === 'ALL' ? 'active' : ''}`}
            title="All Providers"
          >
            <LayoutGrid className="h-4.5 w-4.5" />
          </button>

          {/* Providers chips — skip the 'ALL' sentinel (dedicated button above) and any blank entries */}
          {providersDetailed.filter((p) => p.key && p.key.trim() && p.key !== 'ALL').map(({ key: p, logoUrl }) => {
            const active = p === selectedProvider;
            return (
              <button
                key={p}
                title={p}
                onClick={() => {
                  setSelectedProvider(p);
                  router.push(`/player/games/${category}?provider=${encodeURIComponent(p)}`);
                }}
                className={`provider-filter-btn ${logoUrl ? 'provider-filter-btn--logo' : ''} ${active ? 'active' : ''}`}
              >
                {logoUrl
                  ? // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={p} className="provider-filter-logo" />
                  : p}
              </button>
            );
          })}

          {/* Search toggle button on the right */}
          </div>
          {canScroll && (
            <button type="button" className="pf-arrow" aria-label="Scroll providers" onClick={handleArrow}>
              {atEnd ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
            </button>
          )}
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`provider-filter-btn pf-search ${showSearch ? 'active' : ''}`}
            title="Search Games"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Toggleable search input */}
        {showSearch && (
          <div className="mt-3 animate-casino-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t('common.search')} ${displayCategory}…`}
                className="pl-9 h-10 bg-elevated border-border text-sm text-white placeholder-muted focus:border-gold-soft"
              />
            </div>
          </div>
        )}
      </div>

      {/* Games Display grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="cat-card"><div className="cat-card__media" /></div>
          ))}
        </div>
      ) : processedGames.length === 0 ? (
        <EmptyState message={t('common.noGames')} />
      ) : (
        <>
          <div className="grid animate-casino-fade-in grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6">
            {processedGames.map((game) => {
              const mult = getMultiplier(game.id);
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleLaunch(game)}
                  aria-label={`Play ${game.name} by ${game.provider}`}
                  className="cat-card group"
                >
                  <div className="cat-card__media">
                    <GamePoster game={game} className="transition-transform duration-200 group-hover:scale-[1.05]" />

                    {mult && (
                      <div className="game-multiplier-badge">{mult}</div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/45 to-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-full bg-gradient-to-b from-gold-soft to-[#d4a017] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d0d0d] shadow-md ring-1 ring-white/25 transition-transform duration-200 group-hover:scale-105">
                        <Play className="h-3 w-3 fill-current" aria-hidden /> Play
                      </span>
                    </div>
                  </div>
                  <div className="cat-card__name notranslate">{game.name}</div>
                </button>
              );
            })}
          </div>

          {/* Sentinel element for infinite scroll observer */}
          <div ref={sentinelRef} className="h-10 mt-8 flex items-center justify-center">
            {isFetchingMore && (
              <div className="flex items-center gap-2 text-gold-soft text-sm font-semibold">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold-soft/30 border-t-gold-soft" />
                {t('common.loadingMore')}
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
