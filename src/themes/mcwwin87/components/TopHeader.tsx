'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '../../../core/tenant/TenantProvider';
import { useAuth } from '../../../providers/auth-provider';
import { useWallet } from '../../../hooks/player-hooks';
import { useI18n } from '../../../core/i18n/LanguageProvider';
import NotificationBell from './NotificationBell';

export default function TopHeader() {
  const { tenant } = useTenant();
  const { user, loading, logout } = useAuth();
  const { data: wallet } = useWallet();
  const { t, locale, setLocale } = useI18n();
  const [acctOpen, setAcctOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const logoSrc = tenant.logoUrl || '/assets/images/logo/logo.webp';
  const balance = wallet?.balanceMinor != null ? (wallet.balanceMinor / 100).toFixed(2) : '0';
  const currency = tenant.currency || '৳';

  function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    if (menu) menu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  }

  function chooseLang(lang: 'en' | 'bn') {
    setLocale(lang);
    setLangOpen(false);
  }

  return (
    <header className="header hidden lg:block">
      <div className="container header__main">
        {/* Hamburger */}
        <button className="header__menu-btn" id="menuBtn" aria-label="Menu" onClick={toggleMenu}>
          <span></span><span></span><span></span>
        </button>

        {/* Logo */}
        <Link href="/" className="header__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src={logoSrc} alt="Logo" />
        </Link>

        <div className="header__right">
          {/* GUEST */}
          {!user && !loading && (
            <div className="header__guest">
              <Link href="?auth=register" scroll={false} className="btn btn--secondary">{t('auth.signup')}</Link>
              <Link href="?auth=login" scroll={false} className="btn btn--primary">{t('auth.login')}</Link>
            </div>
          )}

          {/* AUTHED */}
          {user && !loading && (
            <div className="header__user">
              <Link href="/player/deposit" className="btn btn--primary header__deposit">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>
                </svg>
                {t('header.deposit')}
              </Link>
              <div className="header__wallet">
                <span className="header__wallet-refresh">&#8635;</span>
                {t('header.mainWallet')} {currency}{balance}
              </div>
              <NotificationBell />
              {/* Account dropdown */}
              <div className={`header__account ${acctOpen ? 'open' : ''}`} id="accountMenu" style={{ position: 'relative' }}>
                <button
                  className="header__avatar"
                  aria-label="Account"
                  onClick={() => setAcctOpen(o => !o)}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0z"/>
                  </svg>
                </button>
                <div className="header__dropdown" style={{ display: acctOpen ? 'block' : 'none' }}>
                  <div className="acct-head">
                    <div className="acct-name">{user.username || user.email || 'User'}</div>
                    <div className="acct-vip">{t('acct.vipPoints')} <strong>0</strong> <span className="acct-refresh">&#8635;</span></div>
                  </div>
                  <div className="acct-group">
                    <Link href="/player/deposit" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></span>{t('acct.deposit')}</Link>
                    <Link href="/player/withdraw" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M5 20h14v-2H5v2zm7-16L5 11h4v6h6v-6h4l-7-7z"/></svg></span>{t('acct.withdrawal')}</Link>
                    <Link href="/player/rewards" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5H5c0 3.87 3.13 7 7 7s7-3.13 7-7-3.13-7-7-7z"/></svg></span>{t('acct.freeSpin')}</Link>
                  </div>
                  <div className="acct-group">
                    <Link href="/player/promotions" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-5.5-1.65l-.5.67-.5-.68A3 3 0 0 0 6 5c0 .35.07.69.18 1H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/></svg></span>{t('acct.realtimeBonus')}</Link>
                    <Link href="/player/referral" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></span>{t('acct.referral')}</Link>
                    <Link href="/player/winner-board" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 18.9V21H7v2h10v-2h-4v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg></span>{t('acct.winnerBoard')}</Link>
                    <Link href="/player/loyalty" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg></span>{t('acct.dailyStreak')} <span className="acct-badge">!</span></Link>
                  </div>
                  <div className="acct-group">
                    <Link href="/player/betting-records" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg></span>{t('acct.bettingRecords')}</Link>
                    <Link href="/player/turnover" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg></span>{t('acct.turnover')}</Link>
                    <Link href="/player/ledger" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></span>{t('acct.transactions')}</Link>
                    <Link href="/player/profile" className="acct-item" onClick={() => setAcctOpen(false)}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></span>{t('acct.personalInfo')}</Link>
                  </div>
                  <div className="acct-group">
                    <button className="acct-item acct-logout" onClick={() => { setAcctOpen(false); logout(); }}><span className="acct-icon"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg></span>{t('auth.logout')}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language */}
          <div className={`header__lang-wrapper ${langOpen ? 'open' : ''}`} id="langMenu" style={{ position: 'relative' }}>
            <button className="header__lang" aria-label="Language" onClick={() => setLangOpen(o => !o)}>
              <span className={`header__lang-icon fi fis ${locale === 'bn' ? 'fi-bd' : 'fi-gb'}`}></span>
            </button>
            <div className="header__dropdown header__dropdown--lang" style={{ display: langOpen ? 'block' : 'none' }}>
              <div className="acct-group" style={{ padding: '4px' }}>
                <button type="button" className={`acct-item js-lang-opt ${locale === 'en' ? 'active' : ''}`} onClick={() => chooseLang('en')}>
                  <span className="fi fis fi-gb" style={{ borderRadius: '2px', marginRight: '8px', fontSize: '16px' }}></span>English
                </button>
                <button type="button" className={`acct-item js-lang-opt ${locale === 'bn' ? 'active' : ''}`} onClick={() => chooseLang('bn')}>
                  <span className="fi fis fi-bd" style={{ borderRadius: '2px', marginRight: '8px', fontSize: '16px' }}></span>বাংলা
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
