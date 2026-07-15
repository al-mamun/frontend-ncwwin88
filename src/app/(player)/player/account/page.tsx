/**
 * My Account hub — the reference "My Account" overlay rebuilt for our portal.
 *
 * A wallet balance card + grouped grids of icon tiles (Funds / My Promotion /
 * History / My / Social / Contact) + Log Out. Tiles link to REAL routes; items
 * whose backend isn't built yet (Inbox) are shown disabled with a "Soon" tag —
 * no dead links, no fabricated data. Social/Contact links come from optional env
 * vars and are hidden when unset. Themed via tokens (bdbet21 black/red/gold).
 */
'use client';


import Link from 'next/link';
import {
  CreditCard, Banknote, Zap, Sparkles, Gift, Users, Trophy, CalendarCheck,
  ClipboardList, BarChart3, ReceiptText, UserCircle, KeyRound, Mail,
  Facebook, Send, Instagram, Youtube, LogOut, RefreshCw, Wallet, Headphones,
  Info, BadgeCheck, Handshake, Crown, Target, Ticket, Medal, type LucideIcon,
} from 'lucide-react';
import { useWallet, useProfile } from '@/hooks/player-hooks';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { affiliateSiteUrl } from '@/lib/affiliate';
import { PageContainer } from '@/components/shared';
import { cn } from '@/lib/utils';

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: 'BDT ', USD: '$', EUR: '€', GBP: '£', INR: '₹', PKR: '₨', NPR: 'रू',
};

interface Tile {
  label: string;
  icon: LucideIcon;
  href?: string;
  soon?: boolean;
}

const FUNDS: Tile[] = [
  { label: 'Deposit', icon: CreditCard, href: '/player/deposit' },
  { label: 'Withdrawal', icon: Banknote, href: '/player/withdraw' },
  { label: 'Free Spin', icon: Sparkles, href: '/player/promotions' },
];

const PROMOTION: Tile[] = [
  { label: 'Real-Time Bonus', icon: Zap, href: '/player/realtime-bonus' },
  { label: 'Promotions', icon: Gift, href: '/player/promotions' },
  { label: 'My Rewards', icon: Sparkles, href: '/player/rewards' },
  { label: 'Coupons', icon: Ticket, href: '/player/coupons' },
  { label: 'VIP', icon: Crown, href: '/player/vip' },
  { label: 'Loyalty', icon: Target, href: '/player/loyalty' },
  { label: 'Tournaments', icon: Medal, href: '/player/tournaments' },
  { label: 'Referral', icon: Users, href: '/player/referral' },
  { label: 'Affiliate', icon: Handshake, href: '/player/affiliate' },
  { label: 'Winner Board', icon: Trophy, href: '/player/winner-board' },
];

const HISTORY: Tile[] = [
  { label: 'Betting Records', icon: ClipboardList, href: '/player/betting-records' },
  { label: 'Turnover', icon: BarChart3, href: '/player/turnover' },
  { label: 'Transaction Records', icon: ReceiptText, href: '/player/ledger' },
];

const MY: Tile[] = [
  { label: 'Personal Info', icon: UserCircle, href: '/player/profile' },
  { label: 'KYC Verification', icon: BadgeCheck, href: '/player/kyc' },
  { label: 'Change Password', icon: KeyRound, href: '/player/security' },
  { label: 'Inbox', icon: Mail, soon: true },
];

const SOCIAL: Tile[] = [
  { label: 'Facebook', icon: Facebook, href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK },
  { label: 'Telegram', icon: Send, href: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM },
  { label: 'Instagram', icon: Instagram, href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM },
  { label: 'YouTube', icon: Youtube, href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE },
].filter((t) => !!t.href);

const CONTACT: Tile[] = [
  { label: '24-7 CS', icon: Headphones, href: '/player/support' },
  { label: 'Email', icon: Mail, href: process.env.NEXT_PUBLIC_CONTACT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}` : undefined },
].filter((t) => !!t.href);

function TileButton({ tile }: { tile: Tile }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-elevated text-gold-soft">
        <tile.icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-center text-xs font-medium leading-tight">{tile.label}</span>
      {tile.soon && (
        <span className="rounded-full border border-border px-1.5 text-[9px] font-bold uppercase text-muted">Soon</span>
      )}
    </>
  );
  const base = 'flex w-20 flex-col items-center gap-2 rounded-lg p-2 text-center transition-colors';

  if (tile.soon || !tile.href) {
    return <div className={cn(base, 'cursor-not-allowed opacity-50')}>{inner}</div>;
  }
  if (tile.href.startsWith('http') || tile.href.startsWith('mailto:')) {
    return (
      <a href={tile.href} target="_blank" rel="noopener noreferrer" className={cn(base, 'hover:bg-elevated')}>
        {inner}
      </a>
    );
  }
  return <Link href={tile.href} className={cn(base, 'hover:bg-elevated')}>{inner}</Link>;
}

function Group({ title, tiles }: { title: string; tiles: Tile[] }) {
  if (tiles.length === 0) return null;
  return (
    <section className="rounded-lg bg-surface p-4 md:px-6">
      <h2 className="mb-4 text-sm font-bold text-white">{title}</h2>
      <div className="flex flex-wrap items-start justify-around gap-x-4 gap-y-6">
        {tiles.map((t) => (
          <TileButton key={t.label} tile={t} />
        ))}
      </div>
    </section>
  );
}

export default function MyAccountHub() {
  const { logout } = useAuth();
  const { tenant } = useTenant();
  const { data: wallet, refetch, isFetching } = useWallet();
  const { data: profile } = useProfile();
  const promotionTiles = PROMOTION.map((t) => (t.label === 'Affiliate' ? { ...t, href: affiliateSiteUrl(tenant.domain) } : t));

  const currency = wallet?.currency || 'BDT';
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  const balance = wallet ? ((wallet.balanceMinor - wallet.heldMinor) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—';
  const membership = profile?.kycStatus === 'APPROVED' ? 'VERIFIED MEMBER' : 'STANDARD MEMBER';

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        {/* Wallet balance card */}
        <div className="flex items-center justify-between rounded-xl border border-gold-soft/20 bg-gradient-to-r from-elevated to-surface p-5">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Wallet className="h-4 w-4 text-gold-soft" aria-hidden /> Main Wallet
              <span className="rounded-full bg-brand-2/15 px-2 py-0.5 text-[10px] font-bold text-brand-2">{membership}</span>
            </span>
            <span className="text-3xl font-extrabold text-white">
              {symbol}{balance}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              aria-label="Refresh balance"
              className="rounded-full p-2 text-muted transition-colors hover:bg-elevated hover:text-gold-soft"
            >
              <RefreshCw className={cn('h-5 w-5', isFetching && 'animate-spin')} aria-hidden />
            </button>
            <Link
              href="/player/wallet"
              className="rounded-md bg-brand-2 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-2-dark"
            >
              Wallet
            </Link>
          </div>
        </div>

        <Group title="Funds" tiles={FUNDS} />
        <Group title="My Promotion" tiles={promotionTiles} />
        <Group title="History" tiles={HISTORY} />
        <Group title="My" tiles={MY} />
        <Group title="Social" tiles={SOCIAL} />
        <Group title="Contact Us" tiles={CONTACT} />

        {/* About + Log Out */}
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface py-3 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-gold-soft"
          >
            <Info className="h-4 w-4" aria-hidden /> About Us
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 rounded-lg border border-brand-2/40 bg-brand-2/10 py-3 text-sm font-bold text-brand-2 transition-colors hover:bg-brand-2 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Log Out
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
