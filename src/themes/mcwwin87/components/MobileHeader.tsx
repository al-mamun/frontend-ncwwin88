/**
 * mcwwin87 (NCW) — mobile header.
 *
 * NCW design lockup: hamburger + brand on the left; country flag + "24-7 CS"
 * customer-support button on the right (matches the NCW mobile design).
 * Deposit / account are reached via the sticky bottom nav.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTenant } from '../../../core/tenant/TenantProvider';
import { useI18n } from '../../../core/i18n/LanguageProvider';
import MobileMenu from './MobileMenu';

function BrandLockup({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-8 w-auto object-contain" />;
  }
  const initials = (name || 'NCW').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'NCW';
  const parts = (name || 'Nega Casino World').split(/\s+/);
  const top = parts.slice(0, Math.max(1, parts.length - 1)).join(' ').toUpperCase() || 'MEGA CASINO';
  const bottom = (parts.length > 1 ? parts[parts.length - 1] : 'WORLD').toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gradient-to-br from-gold-soft to-brand text-[11px] font-extrabold leading-none text-brand-fg">
        {initials}
      </div>
      <div className="leading-none">
        <div className="text-[11px] font-extrabold tracking-wide text-gold-soft">{top}</div>
        <div className="text-[9px] font-semibold tracking-[0.2em] text-muted">{bottom}</div>
      </div>
    </div>
  );
}

export default function MobileHeader() {
  const { tenant } = useTenant();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="header lg:hidden">
        <div className="container header__main">
          <button
            type="button"
            className="header__menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span></span><span></span><span></span>
          </button>

          <Link href="/" className="header__logo">
            <BrandLockup name={tenant.name} logoUrl={tenant.logoUrl} />
          </Link>

          <div className="header__right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Country flag */}
            <span
              className="fi fis fi-bd"
              aria-hidden
              style={{ width: '22px', height: '22px', borderRadius: '50%', fontSize: '22px', boxShadow: '0 0 0 2px rgba(255,255,255,.15)' }}
            ></span>

            {/* 24-7 customer support */}
            <Link href="/player/support" aria-label="24-7 customer support" className="flex items-center gap-1.5 text-gold-soft">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
                <path d="M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-2a7 7 0 0 1 14 0v2h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z"/>
              </svg>
              <span className="text-[13px] font-extrabold leading-none">{t('header.support')}</span>
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
