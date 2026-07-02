/**
 * Player Promotions Page — live offers created by the operator in the dashboard
 * (Marketing → Promotions). Shows only ACTIVE, in-window promotions for this tenant.
 */
'use client';

import { useRouter } from 'next/navigation';
import { Gift, ArrowRight, Star, Coins, Repeat, CalendarClock } from 'lucide-react';
import { usePromotions } from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/card-badge-label';
import type { Promotion } from '@/types';
import { useI18n } from '@/core/i18n/LanguageProvider';

const TYPE_LABEL_EN: Record<string, string> = {
  deposit_bonus: 'Deposit Bonus',
  cashback: 'Cashback',
  free_spins: 'Free Spins',
  free_credit: 'Free Credit',
};
const TYPE_LABEL_BN: Record<string, string> = {
  deposit_bonus: 'ডিপোজিট বোনাস',
  cashback: 'ক্যাশব্যাক',
  free_spins: 'ফ্রি স্পিন',
  free_credit: 'ফ্রি ক্রেডিট',
};

function money(minor: number | undefined, currency = 'BDT'): string {
  return `${currency} ${((minor ?? 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/** Headline reward, derived from the promotion type + configured amounts. */
function rewardText(p: Promotion, locale: string): string | null {
  const bn = locale === 'bn';
  const cur = p.currency || 'BDT';
  switch (p.type) {
    case 'deposit_bonus':
      return p.bonusPercent
        ? `${p.bonusPercent}% ${bn ? 'বোনাস' : 'Bonus'}${p.rewardAmountMinor ? ` ${bn ? 'সর্বোচ্চ' : 'up to'} ${money(p.rewardAmountMinor, cur)}` : ''}`
        : p.rewardAmountMinor ? `${money(p.rewardAmountMinor, cur)} ${bn ? 'বোনাস' : 'Bonus'}` : null;
    case 'cashback':
      return p.bonusPercent ? `${p.bonusPercent}% ${bn ? 'ক্যাশব্যাক' : 'Cashback'}` : null;
    case 'free_spins':
      return p.freeSpins ? `${p.freeSpins} ${bn ? 'ফ্রি স্পিন' : 'Free Spins'}` : null;
    case 'free_credit':
      return p.rewardAmountMinor ? `${money(p.rewardAmountMinor, cur)} ${bn ? 'ফ্রি ক্রেডিট' : 'Free Credit'}` : null;
    default:
      return null;
  }
}

function fmtDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PromotionsPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const { data, isLoading, isError } = usePromotions();
  const promotions: Promotion[] = data ?? [];

  const L = locale === 'bn'
    ? {
        title: 'সক্রিয় প্রোমোশন',
        subtitle: 'ডিপোজিট বুস্ট, ক্যাশব্যাক এবং বোনাস স্পিন দাবি করুন',
        loading: 'সক্রিয় প্রোমোশন লোড হচ্ছে…',
        error: 'প্রোমোশন লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
        emptyTitle: 'এই মুহূর্তে কোনো সক্রিয় প্রোমোশন নেই',
        emptyBody: 'নিয়মিত নতুন অফার যোগ করা হয়। শীঘ্রই আবার দেখুন, অথবা খেলা চালিয়ে যেতে একটি ডিপোজিট করুন।',
        goDeposit: 'ডিপোজিটে যান',
        liveOffer: 'লাইভ অফার',
        minDeposit: 'ন্যূনতম ডিপোজিট',
        wagering: 'ওয়েজারিং',
        validUntil: 'বৈধতার শেষ',
        depositToClaim: 'দাবি করতে ডিপোজিট করুন',
        typeLabel: TYPE_LABEL_BN,
      }
    : {
        title: 'Active Promotions',
        subtitle: 'Claim deposit boosts, cashback, and bonus spins',
        loading: 'Loading active promotions…',
        error: "Couldn't load promotions. Please try again.",
        emptyTitle: 'No active promotions right now',
        emptyBody: 'New offers are added regularly. Check back soon, or make a deposit to keep playing.',
        goDeposit: 'Go to Deposit',
        liveOffer: 'Live Offer',
        minDeposit: 'Min deposit',
        wagering: 'Wagering',
        validUntil: 'Valid until',
        depositToClaim: 'Deposit to Claim',
        typeLabel: TYPE_LABEL_EN,
      };

  if (isLoading) {
    return (
      <PageContainer>
        <PlayerPageHeader title={L.title} subtitle={L.subtitle} icon={Gift} />
        <LoadingState message={L.loading} />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <PlayerPageHeader title={L.title} subtitle={L.subtitle} icon={Gift} />
        <ErrorState message={L.error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PlayerPageHeader
        title={L.title}
        subtitle={L.subtitle}
        icon={Gift}
      />

      {promotions.length === 0 ? (
        <Card className="border-border bg-surface">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Gift className="h-10 w-10 text-muted" />
            <h3 className="text-lg font-bold text-primary">{L.emptyTitle}</h3>
            <p className="max-w-sm text-sm text-muted">{L.emptyBody}</p>
            <Button onClick={() => router.push('/player/deposit')} variant="outline" className="mt-2 gap-1.5 font-bold">
              {L.goDeposit} <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {promotions.map((promo) => {
            const reward = rewardText(promo, locale);
            const validUntil = fmtDate(promo.endsAt);
            return (
              <Card
                key={promo.id}
                className="relative overflow-hidden border-border bg-surface shadow-md transition-all hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
              >
                {promo.bannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={promo.bannerUrl} alt={promo.title} className="h-36 w-full object-cover" />
                ) : (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand to-amber-600" />
                )}

                <CardContent className={`flex h-full flex-col gap-4 p-6 ${promo.bannerUrl ? '' : 'pl-8'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <Badge variant="default" className="text-xxs font-bold uppercase tracking-wider">
                      {promo.type ? L.typeLabel[promo.type] ?? L.liveOffer : L.liveOffer}
                    </Badge>
                    <Star className="h-4 w-4 fill-brand/20 text-brand" />
                  </div>

                  <div className="flex-1">
                    {reward && <p className="text-xl font-extrabold text-brand">{reward}</p>}
                    <h3 className="mt-1 text-lg font-bold leading-snug text-primary">{promo.title}</h3>
                    {promo.description && <p className="mt-2 text-sm leading-relaxed text-muted">{promo.description}</p>}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-border bg-elevated px-4 py-3 text-xs">
                    {promo.minDepositMinor ? (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Coins className="h-3.5 w-3.5 text-brand" /> {L.minDeposit} <b className="text-primary">{money(promo.minDepositMinor, promo.currency)}</b>
                      </span>
                    ) : null}
                    {promo.wagerMultiplier && promo.wagerMultiplier > 1 ? (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Repeat className="h-3.5 w-3.5 text-brand" /> {L.wagering} <b className="text-primary">{promo.wagerMultiplier}x</b>
                      </span>
                    ) : null}
                    {validUntil ? (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <CalendarClock className="h-3.5 w-3.5 text-brand" /> {L.validUntil} <b className="text-primary">{validUntil}</b>
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto border-t border-border pt-4">
                    <Button
                      onClick={() => router.push('/player/deposit')}
                      variant="outline"
                      className="group w-full gap-1.5 font-bold transition-all hover:border-transparent hover:bg-brand hover:text-brand-fg"
                    >
                      {L.depositToClaim}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
