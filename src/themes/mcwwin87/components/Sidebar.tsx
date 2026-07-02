'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { affiliateSiteUrl } from '@/lib/affiliate';
import { useI18n } from '@/core/i18n/LanguageProvider';

export default function Sidebar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { user } = useAuth();
  const isAuthed = !!user;
  const { tenant } = useTenant();
  const affUrl = affiliateSiteUrl(tenant.domain);
  const { t } = useI18n();

  const closeMenu = () => {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  };

  const handleCatClick = (categorySlug: string) => {
    if (categorySlug === 'hot') {
      router.push('/');
    } else if (isAuthed) {
      router.push(`/player/games/${categorySlug}`);
    } else {
      router.push('/login');
    }
    closeMenu();
  };

  const isCatActive = (categorySlug: string) => {
    if (categorySlug === 'hot') {
      return pathname === '/' || pathname === '/player/games/hot';
    }
    return pathname === `/player/games/${categorySlug}`;
  };

  const getLinkClass = (href: string) => {
    return pathname === href ? 'active' : '';
  };

  return (
    <>
      <div className="mobile-overlay" id="mobileOverlay" onClick={closeMenu}></div>
      <aside className="mobile-menu" id="mobileMenu">
        <div className="mobile-menu__inner">
          {/* Search bar */}
          <div className="mobile-menu__section mobile-menu__section--search">
            <div className="mobile-menu__search">
              <input 
                type="text" 
                placeholder="Search Games" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    router.push(val ? `/?q=${encodeURIComponent(val)}` : '/');
                    closeMenu();
                  }
                }}
              />
              <svg className="mobile-menu__search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
          </div>

          {/* Categories Block */}
          <div className="mobile-menu__section">
            <ul className="mobile-menu__list">
              <li 
                data-cat="hot" 
                className={isCatActive('hot') ? 'active' : ''} 
                onClick={() => handleCatClick('hot')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-.5 2.5-2.5 4.5-4 7s-1.5 5-1 7c1 3.5 4 5 7 5s6-1.5 7-5c.5-2-0.5-4.5-2-7s-3.5-4.5-4-7C14 4.5 13 3 12 2z"/></svg>
                </span>
                <span className="mm-label">{t('nav.hot')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="sports" 
                className={isCatActive('sports') ? 'active' : ''} 
                onClick={() => handleCatClick('sports')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14.93V7h2V5.07c2.56.45 4.6 2.45 5.1 4.93H16v2h2.05C17.55 14.56 15.5 16.55 13 17v-1.93h-2V17c-2.56-.45-4.6-2.45-5.1-4.93H8v-2H5.95c.5-2.48 2.54-4.48 5.05-4.93z"/></svg>
                </span>
                <span className="mm-label">{t('nav.sports')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="casino" 
                className={isCatActive('casino') ? 'active' : ''} 
                onClick={() => handleCatClick('casino')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-5 8c-1.5 2.5-2.5 5.5-.5 8.5 2 3 5 3.5 5.5 3.5s3.5-.5 5.5-3.5c2-3 1-6-.5-8.5L12 2z"/></svg>
                </span>
                <span className="mm-label">{t('nav.casino')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="slot" 
                className={isCatActive('slot') ? 'active' : ''} 
                onClick={() => handleCatClick('slot')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2L5 6H2v14h20V6h-3l-2-4H7zm2 2h6l1.5 3H7.5L9 4z"/></svg>
                </span>
                <span className="mm-label">{t('nav.slot')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="crash" 
                className={isCatActive('crash') ? 'active' : ''} 
                onClick={() => handleCatClick('crash')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.13 2.13l1.83 1.83-3.04 3.04 4.24 4.24 3.04-3.04 1.83 1.83V2.13h-7.9zm-4.24 4.24L2 13.24V21.1h7.87l6.87-6.87-7.85-7.86z"/></svg>
                </span>
                <span className="mm-label">{t('nav.crash')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="table" 
                className={isCatActive('table') ? 'active' : ''} 
                onClick={() => handleCatClick('table')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/></svg>
                </span>
                <span className="mm-label">{t('nav.table')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="fishing" 
                className={isCatActive('fishing') ? 'active' : ''} 
                onClick={() => handleCatClick('fishing')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3 12c-2.5 0-4.5-2-4.5-4.5S12.5 5 15 5s4.5 2 4.5 4.5S17.5 14 15 14zm-6 2H6v-2h3v2z"/></svg>
                </span>
                <span className="mm-label">{t('nav.fishing')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="arcade" 
                className={isCatActive('arcade') ? 'active' : ''} 
                onClick={() => handleCatClick('arcade')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm6.5 1c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-3c-.83 0-1.5-.67-1.5-1.5S13.67 8 14.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                </span>
                <span className="mm-label">{t('nav.arcade')}</span>
                <span className="mm-arrow"></span>
              </li>
              <li 
                data-cat="lottery" 
                className={isCatActive('lottery') ? 'active' : ''} 
                onClick={() => handleCatClick('lottery')}
              >
                <span className="mm-ico">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/></svg>
                </span>
                <span className="mm-label">{t('nav.lottery')}</span>
                <span className="mm-arrow"></span>
              </li>
            </ul>
          </div>

          {/* Promotions / Winner Board / VIP / Download / Affiliates / Partnerships */}
          <div className="mobile-menu__section">
            <ul className="mobile-menu__list">
              <li>
                <Link href="/player/promotions" className={getLinkClass('/player/promotions')} onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1h-4v-2h4zM9 4c.55 0 1 .45 1 1s-.45 1-1 1H5v-2h4zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>
                  </span>
                  <span className="mm-label">{t('nav.promotions')}</span>
                </Link>
              </li>
              <li>
                <Link href="/player/winner-board" className={getLinkClass('/player/winner-board')} onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5v18l7-3 7 3V3zm-2 14.5l-5-2.14-5 2.14V5h10v12.5zM10.75 14L8 11h2.25V7h3.5v4H16l-2.75 3z"/></svg>
                  </span>
                  <span className="mm-label">{t('acct.winnerBoard')}</span>
                </Link>
              </li>
              <li>
                <Link href="/player/vip" className={getLinkClass('/player/vip')} onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </span>
                  <span className="mm-label">{t('nav.vip')}</span>
                </Link>
              </li>
              <li>
                <Link href="/player/rewards" className={getLinkClass('/player/rewards')} onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  </span>
                  <span className="mm-label">{t('side.download')}</span>
                </Link>
              </li>
              <li>
                <a href={affUrl} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  </span>
                  <span className="mm-label">{t('side.affiliates')}</span>
                </a>
              </li>
              <li>
                <Link href="/player/referral" className={getLinkClass('/player/referral')} onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </span>
                  <span className="mm-label">{t('side.partnerships')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us Block */}
          <div className="mobile-menu__section">
            <ul className="mobile-menu__list">
              <li>
                <Link href="/player/support" className={getLinkClass('/player/support')} onClick={closeMenu}>
                  <span className="mm-ico">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                  </span>
                  <span className="mm-label">{t('side.contactUs')}</span>
                  <span className="mm-arrow"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
