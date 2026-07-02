/**
 * mcwwin87 (MCW) — sticky bottom bar (mobile).
 *
 * Guests: language selector + Sign up + Login (matches MCW mobile design).
 * Logged-in: Home / Promotions / Deposit / My Account with active gold circle.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gift, CreditCard, User, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../providers/auth-provider';
import { useI18n } from '../../../core/i18n/LanguageProvider';

interface Item { key: string; icon: LucideIcon; href: string; }
const ITEMS: Item[] = [
  { key: 'nav.home', icon: Home, href: '/' },
  { key: 'nav.promotions', icon: Gift, href: '/player/promotions' },
  { key: 'header.deposit', icon: CreditCard, href: '/player/deposit' },
  { key: 'nav.myAccount', icon: User, href: '/player/account' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t, locale, setLocale } = useI18n();

  // GUEST: language + Sign up + Login
  if (!user) {
    return (
      <div className="mnav-guest lg:hidden">
        <button
          type="button"
          className="mnav-lang"
          onClick={() => setLocale(locale === 'bn' ? 'en' : 'bn')}
          aria-label="Change language"
        >
          <span className="fi fis fi-bd" aria-hidden />
          <span>{locale === 'bn' ? 'বাংলা' : 'English'}</span>
        </button>
        <Link href="?auth=register" scroll={false} className="btn btn--secondary mnav-btn">{t('auth.signup')}</Link>
        <Link href="?auth=login" scroll={false} className="btn btn--primary mnav-btn">{t('auth.login')}</Link>
      </div>
    );
  }

  // AUTHED: primary nav
  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-surface lg:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors',
              active ? 'text-gold-soft' : 'text-muted hover:text-gold-soft',
            )}
          >
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full transition-colors', active ? 'bg-gradient-to-b from-gold-soft to-brand text-brand-fg shadow-md' : '')}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
