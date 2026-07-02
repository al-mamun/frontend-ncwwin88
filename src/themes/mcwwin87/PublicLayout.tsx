'use client';

import { useState, useEffect } from 'react';
import ScrollTop from '../../components/shared/scroll-top';
import { useRouter } from 'next/navigation';
import TopHeader from './components/TopHeader';
import MobileHeader from './components/MobileHeader';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import { useGameProviders, useGamesFeed } from '../../core/games/useGameCatalog';
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

// Mega-menu content: real games for the open category, rendered with their
// actual artwork (falls back to initials only when a game has no image).
function MegaContent({ cat, onPick }: { cat: string; onPick: (g: Game) => void }) {
  const category = cat === 'hot' ? 'hot' : cat;
  const { games, isLoading } = useGamesFeed({ category, provider: 'ALL', limit: 24 });

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

function DesktopNavbar({ megaOpenCat, setMegaOpenCat }: DesktopNavbarProps) {
  const providers = useGameProviders();
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

  function handlePick() {
    const cat = megaOpenCat || 'hot';
    setMegaOpenCat(null);
    router.push(`/player/games/${cat}`);
  }

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        {NAV_CATS.map(cat => (
          <div
            key={cat.slug}
            className={`navbar__item${cat.slug === 'hot' && !megaOpenCat ? ' active' : ''}${megaOpenCat === cat.slug ? ' mega-open' : ''} has-sub`}
            data-cat={cat.slug}
            onClick={(e) => handleCatClick(cat.slug, e)}
          >
            <span className="navbar__item-head">
              <span className="navbar__item-text">{t(`nav.${cat.slug}`)}</span>
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
        <div className="container">
          {megaOpenCat && <MegaContent cat={megaOpenCat} onPick={handlePick} />}
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
