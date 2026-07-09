'use client';

import { useState, useEffect } from 'react';
import ScrollTop from '../../components/shared/scroll-top';
import { useRouter } from 'next/navigation';
import TopHeader from './components/TopHeader';
import MobileHeader from './components/MobileHeader';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import { useGameProviders, useGameProvidersDetailedState, useGamesFeed, useGameCategories } from '../../core/games/useGameCatalog';
import type { Game } from '../../types';
import { AuthModal } from '../../components/shared/auth-modal';
import { useI18n } from '../../core/i18n/LanguageProvider';

const NAV_CATS = [
  { slug: 'hot', label: 'HOT' },
  { slug: 'sports', label: 'Sports' },
  { slug: 'casino', label: 'Casino' },
  { slug: 'slot', label: 'Slot' },
  { slug: 'crash', label: 'Crash' },
  { slug: 'table', label: 'Table' },
  { slug: 'fishing', label: 'Fishing' },
  { slug: 'arcade', label: 'Arcade' },
  { slug: 'lottery', label: 'Lottery' },
];

interface DesktopNavbarProps {
  megaOpenCat: string | null;
  setMegaOpenCat: (cat: string | null) => void;
}

function getInitialsSafe(name: string) {
  return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function prettyProviderName(key: string): string {
  return key.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Mega-menu for the HOT category: real games rendered with their artwork.
function MegaGames({ onPick }: { onPick: (g: Game) => void }) {
  const { games, isLoading } = useGamesFeed({ category: 'hot', provider: 'ALL', limit: 24 });

  if (isLoading) {
    return (
      <div className="nav-mega__grid">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="nav-mega__item"><div className="nav-mega__icon nav-mega__icon--sk" /></div>
        ))}
      </div>
    );
  }
  if (games.length === 0) {
    return <div className="nav-mega__grid"><div style={{ gridColumn: '1 / -1', color: 'var(--text-dim)', fontSize: 13, padding: '8px 0' }}>No games in this category yet.</div></div>;
  }
  return (
    <div className="nav-mega__grid">
      {games.slice(0, 24).map((g) => (
        <div key={g.id} className="nav-mega__item" onClick={() => onPick(g)}>
          <div className="nav-mega__icon">
            {g.imageUrl
              ? // eslint-disable-next-line @next/next/no-img-element
                <img src={g.imageUrl} alt={g.name} />
              : <span>{getInitialsSafe(g.name)}</span>}
          </div>
          <div className="nav-mega__name notranslate">{g.name}</div>
        </div>
      ))}
    </div>
  );
}

// Mega-menu for every non-HOT category: provider logos + names. Clicking a
// provider opens that provider's games within the category.
function MegaProviders({ cat, onPickProvider }: { cat: string; onPickProvider: (providerKey: string) => void }) {
  const { providers: raw, isLoading } = useGameProvidersDetailedState(cat);
  const providers = raw.filter((p) => p.key && p.key.trim() && p.key !== 'ALL');

  if (isLoading) {
    return (
      <div className="nav-mega__grid">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="nav-mega__item"><div className="nav-mega__icon nav-mega__icon--sk" /></div>
        ))}
      </div>
    );
  }
  if (providers.length === 0) {
    return <div className="nav-mega__grid"><div style={{ gridColumn: '1 / -1', color: 'var(--text-dim)', fontSize: 13, padding: '8px 0' }}>No providers in this category yet.</div></div>;
  }
  return (
    <div className="nav-mega__grid">
      {providers.map(({ key, name, logoUrl }) => (
        <div key={key} className="nav-mega__item" onClick={() => onPickProvider(key)}>
          <div className="nav-mega__icon">
            {logoUrl
              ? // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={key} onError={(e) => { (e.currentTarget.style.display = 'none'); }} />
              : <span className="notranslate">{key.toUpperCase().slice(0, 3)}</span>}
          </div>
          <div className="nav-mega__name notranslate">{name || prettyProviderName(key)}</div>
        </div>
      ))}
    </div>
  );
}

// Mega-menu content: HOT shows games, all other categories show providers.
function MegaContent({
  cat,
  megaMenuType = 'providers',
  onPick,
  onPickProvider,
}: {
  cat: string;
  megaMenuType?: 'providers' | 'games';
  onPick: (g: Game) => void;
  onPickProvider: (providerKey: string) => void;
}) {
  if (cat === 'hot' || megaMenuType === 'games') return <MegaGames onPick={onPick} />;
  return <MegaProviders cat={cat} onPickProvider={onPickProvider} />;
}

function DesktopNavbar({ megaOpenCat, setMegaOpenCat }: DesktopNavbarProps) {
  const providers = useGameProviders();
  const categories = useGameCategories();
  const router = useRouter();
  const { t } = useI18n();

  function handleCatClick(slug: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (megaOpenCat === slug) {
      setMegaOpenCat(null);
    } else {
      setMegaOpenCat(slug);
    }
  }

  function handlePick(game: Game) {
    const cat = megaOpenCat || 'hot';
    setMegaOpenCat(null);
    // Launch the clicked game (the lobby auto-opens it via ?launch=<id>).
    router.push(`/player/games/${cat}?launch=${encodeURIComponent(game.id)}`);
  }

  function handlePickProvider(providerKey: string) {
    const cat = megaOpenCat || 'hot';
    setMegaOpenCat(null);
    router.push(`/player/games/${cat}?provider=${encodeURIComponent(providerKey)}`);
  }

  const activeCatItem = categories.find((c) => c.slug === megaOpenCat);

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        {categories.map(cat => (
          <div
            key={cat.slug}
            className={`navbar__item${cat.slug === 'hot' && !megaOpenCat ? ' active' : ''}${megaOpenCat === cat.slug ? ' mega-open' : ''} has-sub`}
            data-cat={cat.slug}
            onClick={(e) => handleCatClick(cat.slug, e)}
          >
            <span className="navbar__item-head">
              <span className="navbar__item-text">{cat.label}</span>
              <span className="navbar__item-arrow">&#9662;</span>
            </span>
            {providers.length > 0 && cat.slug !== 'hot' && (
              <div className="navbar__sub-nav">
                <div className="navbar__sub-nav-inner">
                  {providers.slice(0, 8).map(p => (
                    <a
                      key={p}
                      className="navbar__sub-nav-item"
                      href={`/player/games/${cat.slug}?provider=${encodeURIComponent(p)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="navbar__sub-nav-item-icon">&#9679;</span>{p}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <a className="navbar__link" href="/player/promotions">{t('nav.promotions')}</a>
        <a className="navbar__link" href="/player/vip">{t('nav.vip')}</a>
      </div>
      <div className={`nav-mega ${megaOpenCat ? 'open' : ''}`} id="navMega">
        <div className="container" style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          <div style={{ flex: 1 }}>
            {megaOpenCat && (
              <MegaContent
                cat={megaOpenCat}
                megaMenuType={activeCatItem?.megaMenuType}
                onPick={handlePick}
                onPickProvider={handlePickProvider}
              />
            )}
          </div>
          {activeCatItem?.megaMenuImageUrl && (
            <div className="nav-mega__banner" style={{ width: 280, flexShrink: 0, padding: '16px 0', display: 'flex', alignItems: 'center' }}>
              <img
                src={activeCatItem.megaMenuImageUrl}
                alt=""
                style={{ width: '100%', height: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 8 }}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function Mcwwin87PublicLayout({ children }: { children: React.ReactNode }) {
  const [megaOpenCat, setMegaOpenCat] = useState<string | null>(null);

  // Close mega menu when clicking outside on the document
  useEffect(() => {
    if (!megaOpenCat) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.navbar__item') && !target.closest('.nav-mega')) {
        setMegaOpenCat(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [megaOpenCat]);

  return (
    <div className="layout">
      {/* Glassmorphism backdrop */}
      <div
        className={`mega-backdrop ${megaOpenCat ? 'open' : ''}`}
        id="megaBackdrop"
        onClick={() => setMegaOpenCat(null)}
      ></div>

      <MobileHeader />
      <TopHeader />
      <AuthModal />

      <DesktopNavbar megaOpenCat={megaOpenCat} setMegaOpenCat={setMegaOpenCat} />

      {/* Mobile overlay + sidebar */}
      <Sidebar />

      <main className="layout__content">
        {children}
      </main>

      <Footer />

      <ScrollTop />
      <MobileBottomNav />
    </div>
  );
}
