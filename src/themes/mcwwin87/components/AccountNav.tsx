/**
 * Account sub-navigation — a horizontal tab bar shown at the top of the
 * authenticated account pages (not the games lobby). Replaces the old left-rail
 * account links: a clean, standard top menu (Wallet / Deposit / Withdraw /
 * Transactions / My Account / Security) with the active tab underlined in gold.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ReceiptText,
  UserCircle,
  ShieldCheck,
  ShieldAlert,
  LifeBuoy,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AccountTab {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TABS: AccountTab[] = [
  { label: 'My Account', href: '/player/account', icon: UserCircle },
  { label: 'Wallet', href: '/player/wallet', icon: Wallet },
  { label: 'Deposit', href: '/player/deposit', icon: ArrowDownToLine },
  { label: 'Withdraw', href: '/player/withdraw', icon: ArrowUpFromLine },
  { label: 'Transactions', href: '/player/ledger', icon: ReceiptText },
  { label: 'Security', href: '/player/security', icon: ShieldCheck },
  { label: 'Responsible Gaming', href: '/player/responsible-gaming', icon: ShieldAlert },
  { label: 'Support', href: '/player/support', icon: LifeBuoy },
];

export default function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto" aria-label="Account">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
              active
                ? 'border-gold-soft text-gold-soft'
                : 'border-transparent text-muted hover:text-white',
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
