/**
 * bdbet21 — promotions section.
 *
 * Real promotions only (usePromotions, active). Renders nothing when there are
 * none (visitor/unauthorized included). No fabricated bonus claims.
 */

'use client';

import Link from 'next/link';
import { Gift } from 'lucide-react';
import { usePromotions } from '../../../hooks/player-hooks';
import { Button } from '../../../components/ui/button';
import type { Promotion } from '../../../types';

const TYPE_LABEL: Record<string, string> = {
  deposit_bonus: 'Deposit Bonus',
  cashback: 'Cashback',
  free_spins: 'Free Spins',
  free_credit: 'Free Credit',
};

function money(minor: number | undefined, currency = 'BDT'): string {
  return `${currency} ${((minor ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function rewardText(p: Promotion): string | null {
  const cur = p.currency || 'BDT';
  switch (p.type) {
    case 'deposit_bonus':
      return p.bonusPercent
        ? `${p.bonusPercent}% Bonus${p.rewardAmountMinor ? ` up to ${money(p.rewardAmountMinor, cur)}` : ''}`
        : p.rewardAmountMinor ? `${money(p.rewardAmountMinor, cur)} Bonus` : null;
    case 'cashback':
      return p.bonusPercent ? `${p.bonusPercent}% Cashback` : null;
    case 'free_spins':
      return p.freeSpins ? `${p.freeSpins} Free Spins` : null;
    case 'free_credit':
      return p.rewardAmountMinor ? `${money(p.rewardAmountMinor, cur)} Free Credit` : null;
    default:
      return null;
  }
}

export default function PromotionsSection({ isAuthed }: { isAuthed: boolean }) {
  const { data: promotions } = usePromotions();
  const active = (promotions ?? []).filter((p) => p.status === 'active');
  if (active.length === 0) return null;

  return (
    <section id="promotions" aria-labelledby="promotions-heading">
      <h2 id="promotions-heading" className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Gift className="h-5 w-5 text-gold-soft" aria-hidden /> Promotions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((promo) => {
          const reward = rewardText(promo);
          return (
            <div
              key={promo.id}
              className="flex flex-col overflow-hidden rounded-xl border border-gold-soft/20 bg-gradient-to-br from-elevated to-surface transition-all duration-200 hover:-translate-y-1 hover:border-gold-soft/50 hover:shadow-xl"
            >
              {promo.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={promo.bannerUrl} alt={promo.title} className="h-28 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-4">
                {promo.type && (
                  <span className="mb-1 w-fit rounded-full bg-gold-soft/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-soft">
                    {TYPE_LABEL[promo.type] ?? 'Offer'}
                  </span>
                )}
                {reward && <p className="text-base font-extrabold text-gold-soft">{reward}</p>}
                <h3 className="mt-0.5 font-bold text-primary">{promo.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{promo.description}</p>
                {promo.minDepositMinor ? (
                  <p className="mt-2 text-xs text-muted">Min deposit <b className="text-primary">{money(promo.minDepositMinor, promo.currency)}</b></p>
                ) : null}
                <Link href={isAuthed ? '/player/promotions' : '/login'} className="mt-3">
                  <Button size="sm" variant="default" className="w-full bg-brand-2 text-white hover:bg-brand-2-dark">
                    {isAuthed ? 'View promotion' : 'Login to claim'}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
