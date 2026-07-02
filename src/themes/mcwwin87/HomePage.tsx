'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Skeleton } from '../../components/shared';
import { GamePlayOverlay } from '../../components/shared/game-play-overlay';
import { GuestGamePreview } from '../../components/shared/guest-game-preview';
import { SignupPrompt } from '../../components/shared/signup-prompt';
import { GamePoster } from '../../core/games/GamePoster';
import { useFeaturedProviders, useGameProviders, useGameProvidersDetailed, useGamesFeed, usePopularCategoryKeys } from '../../core/games/useGameCatalog';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useRouter } from 'next/navigation';
import { useGameLaunch, useWallet } from '../../hooks/player-hooks';
import { cn } from '../../lib/utils';
import { useAuth } from '../../providers/auth-provider';
import { useI18n } from '../../core/i18n/LanguageProvider';
import MobileCategoryBar from './components/MobileCategoryBar';
import type { Game, GameSession } from '../../types';

// ── Static banner fallbacks (from html-design/assets/slider) ──────────────
const BANNER_SLIDES = [
  '/assets/slider/image_261526.jpg',
  '/assets/slider/image_437000.jpg',
  '/assets/slider/image_439336.jpg',
  '/assets/slider/image_439624.jpg',
];



// ── Static provider tabs matching HTML design ──────────────────────────────
const FEATURED_TABS = [
  { label: 'All',        provider: 'ALL' },
  { label: 'FC',         provider: 'slot' },
  { label: 'JILI',       provider: 'JILI' },
  { label: 'JDB',        provider: 'JDB' },
  { label: 'PP',         provider: 'PP' },
  { label: 'WorldMatch', provider: 'WorldMatch' },
  { label: 'FastSpin',   provider: 'FastSpin' },
];

// ── Banner Carousel ────────────────────────────────────────────────────────
function BannerCarousel({ isAuthed }: { isAuthed: boolean }) {
  const { tenant } = useTenant();
  const tenantSlides = (tenant.sliderImages ?? []).filter(s => s?.imageUrl);
  const slides = tenantSlides.length > 0
    ? tenantSlides.map(s => s.imageUrl)
    : BANNER_SLIDES;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((delta: number) => setIndex(i => (i + delta + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, slides.length]);

  return (
    <section className="top-banner-wrapper" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="carousel-frame">
        <div className="carousel-frame__shell" id="bannerShell">
          {slides.map((src, i) => (
            <div
              key={i}
              className={cn('carousel-frame__unit', i === index && 'active')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="carousel-frame__img" src={src} alt={`Banner ${i + 1}`} />
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <>
            <button className="carousel-frame__arrow carousel-frame__arrow--prev" id="bannerPrev" aria-label="Previous" onClick={() => go(-1)}>&#10094;</button>
            <button className="carousel-frame__arrow carousel-frame__arrow--next" id="bannerNext" aria-label="Next" onClick={() => go(1)}>&#10095;</button>
            <div className="carousel-frame__pagination" id="bannerDots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to banner ${i + 1}`}
                  className={cn('carousel-frame__dot', i === index && 'active')}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Provider Grid (logo tiles + gold corner triangle, like NCW) ─────────────
function prettyProvider(key: string): string {
  return key.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function ProviderGrid({ category }: { category?: string }) {
  const router = useRouter();
  const providers = useGameProvidersDetailed(category).filter((p) => p.key && p.key.trim() && p.key !== 'ALL');
  if (providers.length === 0) return null;
  const target = category && category !== 'hot' ? category : 'slot';
  return (
    <div className="provider-grid">
      {providers.map(({ key, logoUrl }) => (
        <button
          key={key}
          className="prov-tile"
          onClick={() => router.push(`/player/games/${target}?provider=${encodeURIComponent(key)}`)}
        >
          <div className="prov-tile__media">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={key} className="prov-tile__logo" onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
            ) : (
              <span className="prov-tile__mark notranslate">{key.toUpperCase()}</span>
            )}
          </div>
          <div className="prov-tile__name notranslate">{prettyProvider(key)}</div>
        </button>
      ))}
    </div>
  );
}

// ── Provider Marquee (auto-scrolling real-provider logo slider, desktop) ────
function ProviderMarquee() {
  const providers = useGameProvidersDetailed().filter((p) => p.logoUrl && p.key && p.key !== 'ALL');
  if (providers.length === 0) return null;
  const loop = [...providers, ...providers];
  return (
    <div className="provider-marquee">
      <div className="provider-track">
        {loop.map((p, i) => (
          <span key={`${p.key}-${i}`} className="provider-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.logoUrl as string} alt={p.key} onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Game Card (matches HTML .game-card) ────────────────────────────────────
function GameCard({ game, onPlay }: { game: Game; onPlay?: (g: Game) => void }) {
  return (
    <button
      type="button"
      className="game-card"
      onClick={() => onPlay?.(game)}
      aria-label={`Play ${game.name}`}
    >
      <div className="game-card__media">
        <GamePoster game={game} />
        {game.badge && (
          <span className={cn(
            'game-card__badge',
            game.badge.toUpperCase() === 'NEW' ? 'bg-emerald-500 text-white' :
            game.badge.toUpperCase() === 'HOT' ? 'bg-amber-500 text-[#0d0d0d]' : 'bg-red-500 text-white'
          )}>
            {game.badge}
          </span>
        )}
        <div className="game-card__hover">
          <span className="game-card__play"></span>
        </div>
      </div>
      <div className="game-card__info">
        <span className="game-card__title notranslate">{game.name}</span>
      </div>
    </button>
  );
}

// ── Featured Panel Slides (left side of featured-grid) ────────────────────
function FeaturedPanel({ games }: { games: Game[] }) {
  const [idx, setIdx] = useState(0);
  const panelGames = games.slice(0, 5);
  useEffect(() => {
    if (panelGames.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % panelGames.length), 3000);
    return () => clearInterval(t);
  }, [panelGames.length]);

  if (panelGames.length === 0) {
    return (
      <div className="featured-panel" style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', minHeight: 280 }}>
        <div className="featured-panel__tag">Featured</div>
      </div>
    );
  }

  return (
    <div className="featured-panel">
      <div className="featured-panel__slides" id="featuredPanelSlides">
        {panelGames.map((g, i) => (
          <div key={g.id} className={cn('featured-panel__slide', i === idx && 'active')}>
            <GamePoster game={g} />
          </div>
        ))}
      </div>
      <div className="featured-panel__tag">{panelGames[idx]?.name || 'Featured'}</div>
    </div>
  );
}

// ── Favourites Slider (real favourite game cards) ─────────────────────────
function FavouritesSlider({ games, onPlay }: { games: Game[]; onPlay: (g: Game) => void }) {
  const [offset, setOffset] = useState(0);
  const [perView, setPerView] = useState(6);
  const total = games.length;

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setPerView(w < 560 ? 2 : w < 900 ? 3 : w < 1200 ? 4 : 6);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const maxIdx = Math.max(0, total - perView);
  useEffect(() => { setOffset((o) => Math.min(o, maxIdx)); }, [maxIdx]);

  // Auto-advance every 3.5s; loops back to the start at the end.
  useEffect(() => {
    if (maxIdx <= 0) return;
    const t = setInterval(() => setOffset((o) => (o >= maxIdx ? 0 : o + 1)), 3500);
    return () => clearInterval(t);
  }, [maxIdx]);

  const prev = () => setOffset((o) => (o <= 0 ? maxIdx : o - 1));
  const next = () => setOffset((o) => (o >= maxIdx ? 0 : o + 1));

  if (total === 0) return null;

  return (
    <div className="fav-carousel">
      {total > perView && <button className="fav-arrow fav-arrow--prev" aria-label="Previous" onClick={prev}>&#10094;</button>}
      <div className="fav-viewport">
        <div className="fav-games-track" style={{ transform: `translateX(calc(-${offset} * (100% + 12px) / ${perView}))` }}>
          {games.map((g) => (
            <div key={g.id} className="fav-games-slide" style={{ flex: `0 0 calc((100% - ${(perView - 1) * 12}px) / ${perView})` }}>
              <GameCard game={g} onPlay={onPlay} />
            </div>
          ))}
        </div>
      </div>
      {total > perView && <button className="fav-arrow fav-arrow--next" aria-label="Next" onClick={next}>&#10095;</button>}
    </div>
  );
}

// ── Main Home Page ─────────────────────────────────────────────────────────
export default function Mcwwin87HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const isAuthed = !!user;
  const { tenant } = useTenant();

  const [category, setCategory] = useState('hot');
  const [mobileCat, setMobileCat] = useState('hot');
  const [activeTab, setActiveTab] = useState(0);
  const [featuredProvider, setFeaturedProvider] = useState('ALL');

  // Main feed (popular games)
  const { games, isLoading, isDemo, hasMore, fetchMore, isFetchingMore } = useGamesFeed({
    category,
    provider: 'ALL',
    search: '',
    limit: 66,
  });

  // Separate feed for featured games — filtered by selected provider tab
  const { games: featuredGames, isLoading: featuredLoading } = useGamesFeed({
    category,
    provider: featuredProvider,
    search: '',
    limit: 20,
  });

  // Featured Games tabs = the operator-flagged FEATURED providers (tenant override
  // wins). 'All' is first and shows POPULAR games across all providers; each
  // provider tab shows that provider's games. When NOTHING is flagged featured yet,
  // fall back to the real provider list (data-driven) rather than a static list.
  const featuredProviderKeys = useFeaturedProviders();
  const allProviderKeys = useGameProviders().filter((p) => p && p !== 'ALL');
  const tabProviderKeys = featuredProviderKeys.length > 0 ? featuredProviderKeys : allProviderKeys.slice(0, 8);
  const providerTabs = tabProviderKeys.length > 0
    ? [{ label: 'All', provider: 'ALL' }, ...tabProviderKeys.map((p) => ({ label: p, provider: p }))]
    : FEATURED_TABS;

  const { data: wallet, refetch: refetchWallet } = useWallet();
  const launchMutation = useGameLaunch();
  const [activePlay, setActivePlay] = useState<{ game: Game; session: GameSession } | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [signupGame, setSignupGame] = useState<Game | null>(null);
  const [previewGame, setPreviewGame] = useState<Game | null>(null);

  const handlePlay = (game: Game) => {
    if (!isAuthed) { setPreviewGame(game); return; }
    setLaunchError(null);
    launchMutation.mutate(game.id, {
      onSuccess: (session) => setActivePlay({ game, session }),
      onError: (err) => setLaunchError(err instanceof Error ? err.message : 'Could not start the game.'),
    });
  };

  const [visibleRows, setVisibleRows] = useState(3);
  const columnCount = 6; // 6 columns per row as requested
  // Popular Games come from the categories the operator flagged "popular".
  const popularKeys = usePopularCategoryKeys();
  const popularByCategory = games.filter((g) => g.category && popularKeys.has(String(g.category).toLowerCase()));
  const popularPool = popularKeys.size > 0 ? popularByCategory : games.filter((g) => g.popular);
  const popularGames = (popularPool.length ? popularPool : games).slice(0, visibleRows * columnCount);
  // Featured Games grid: 'All' tab → popular games from all providers; a provider
  // tab → that provider's games (from the dedicated featured feed).
  const featuredGridGames = featuredProvider === 'ALL' ? popularGames : featuredGames;
  const featuredGridLoading = featuredProvider === 'ALL' ? isLoading : featuredLoading;
  // Favourites: a dedicated feed of ALL games flagged "favourite" (owner global
  // flag), not a slice of the loaded list. No static promo images.
  const { games: favouriteGames, isLoading: favouriteLoading } = useGamesFeed({ favourite: true, limit: 24 });
  // Notice bar text comes from the Announcement Bar setting (dashboard Profile).
  const noticeText = (tenant.announcementText ?? '').trim();
  const showNotice = tenant.announcementEnabled !== false && !!noticeText;

  // Load More now adds another row (6 more games)
  const handleLoadMore = () => setVisibleRows(rv => rv + 1);


  return (
    <>
      {/* Loading spinner overlay */}
      {launchMutation.isPending && !activePlay && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--gold)]/30 border-t-[var(--gold)]" />
          <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>Loading game…</p>
        </div>
      )}

      {/* Guest game preview */}
      {previewGame && (
        <GuestGamePreview
          game={previewGame}
          onClose={() => setPreviewGame(null)}
          onSignup={() => { const g = previewGame; setPreviewGame(null); setSignupGame(g); }}
        />
      )}

      <SignupPrompt open={!!signupGame} gameName={signupGame?.name} onClose={() => setSignupGame(null)} onLogin={() => { setSignupGame(null); router.push('?auth=login', { scroll: false }); }} />

      {/* Game overlay */}
      {activePlay && (
        <GamePlayOverlay
          game={activePlay.game}
          session={activePlay.session}
          balanceMinor={wallet?.balanceMinor ?? 0}
          currency={tenant.currency}
          onRefreshBalance={refetchWallet}
          onClose={() => { setActivePlay(null); refetchWallet(); }}
        />
      )}

      {/* ── Banner ── */}
      <div className="container main-wrapper">
        <BannerCarousel isAuthed={isAuthed} />

        {/* Partner strip */}
        <section className="partner-strip">
          <div className="partner-strip__item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://img.m167cw.com/mcw/h5/assets/images/footer/partner/atletico-de-madrid.png?v=1781597658456&source=mcdsrc" loading="lazy" alt="Atlético de Madrid" />
            <span>Official Regional Partner</span>
          </div>
          <span className="partner-strip__divider"></span>
          <div className="partner-strip__item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://img.m167cw.com/mcw/h5/assets/images/footer/partner/bundesliga.png?v=1781597658456&source=mcdsrc" loading="lazy" alt="BUNDESLIGA" />
            <span>Regional Betting Partner - Asia</span>
          </div>
        </section>
      </div>

      {/* ── Notice bar (content from the Announcement Bar setting) ── */}
      {showNotice && (
      <section className="notice-bar">
        <div className="container notice-bar__inner">
          <span className="notice-bar__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#000">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </span>
          <div className="notice-bar__marquee">
            <p>{noticeText}</p>
          </div>
        </div>
      </section>
      )}

      {/* Mobile category bar (icons) — acts as in-page tabs on mobile */}
      <MobileCategoryBar active={mobileCat} onSelect={setMobileCat} />

      <div className="container main-wrapper">

        {/* ── Mobile: provider brand grid for the selected category tab ── */}
        <section className="block lg:hidden">
          <ProviderGrid category={mobileCat === 'hot' ? undefined : mobileCat} />
        </section>

        {/* ── Featured Games ── */}
        <section className="block">
          <div className="block__head">
            <h2 className="block__title">{t('section.featured')}</h2>
            <div className="provider-tabs" id="featuredTabs">
              {providerTabs.map((tab, i) => (
                <button
                  key={tab.label}
                  className={cn('provider-tab', i === activeTab && 'active')}
                  onClick={() => { setActiveTab(i); setFeaturedProvider(tab.provider); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="featured-grid">
            {/* Left: Featured panel slideshow */}
            <FeaturedPanel games={featuredGridGames} />

            {/* Right: 5-col game grid (filtered by provider tab) */}
            <div className="games-box games-box--5" id="featuredBox">
              {featuredGridLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="game-card"><Skeleton className="aspect-[4/3] w-full" /></div>
                  ))
                : featuredGridGames.slice(0, 10).map(g => (
                    <GameCard key={g.id} game={g} onPlay={handlePlay} />
                  ))
              }
            </div>
          </div>
        </section>

        {/* ── Favourites ── */}
        <section className="block">
          <div className="block__head"><h2 className="block__title">{t('section.favourites')}</h2></div>
          {favouriteLoading ? (
            <div className="games-box games-box--6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="game-card"><Skeleton className="aspect-[4/3] w-full" /></div>
              ))}
            </div>
          ) : favouriteGames.length > 0 ? (
            <FavouritesSlider games={favouriteGames} onPlay={handlePlay} />
          ) : (
            <p style={{ color: 'var(--text-muted, #8b92a8)', fontSize: 14, padding: '12px 0' }}>{t('common.noFav')}</p>
          )}
        </section>

        {/* ── Popular Games ── */}
        <section className="block">
          <div className="block__head"><h2 className="block__title">{t('section.popular')}</h2></div>
          <div className="games-box games-box--6" id="popularBox">
            {isLoading && popularGames.length === 0
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="game-card"><Skeleton className="aspect-[4/3] w-full" /></div>
                ))
              : popularGames.map(g => (
                  <GameCard key={g.id} game={g} onPlay={handlePlay} />
                ))
            }
          </div>
        </section>

        {/* Load More — directly under Popular Games */}
        {hasMore && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              className="btn btn--secondary"
              onClick={() => { fetchMore(); handleLoadMore(); }}
              disabled={isFetchingMore}
              style={{ minWidth: '180px' }}
            >
              {isFetchingMore ? `${t('common.loadingMore')}` : t('common.loadMore')}
            </button>
          </div>
        )}

        {/* ── Game Providers (desktop; mobile shows the tab-driven grid up top) ── */}
        <section className="block hidden lg:block">
          <div className="block__head"><h2 className="block__title">{t('section.gameProviders')}</h2></div>
          <ProviderMarquee />
        </section>


        {launchError && (
          <div style={{ margin: '16px auto', maxWidth: '400px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '12px', textAlign: 'center', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
            {launchError}
          </div>
        )}
      </div>
    </>
  );
}
