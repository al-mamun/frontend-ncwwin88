'use client';

import { useQuery } from '@tanstack/react-query';
import { Crown } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { useI18n } from '@/core/i18n/LanguageProvider';

function money(m: number, c = 'BDT') { return `${c} ${(m / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

export default function VipPage() {
  const { locale } = useI18n();
  const { data: v, isLoading } = useQuery({ queryKey: ['player', 'vip'], queryFn: () => playerApi.getVip() });
  if (isLoading || !v) {
    return <PageContainer><PlayerPageHeader title="VIP" subtitle={locale === 'bn' ? 'আপনার ভিআইপি টিয়ার ও সুবিধা' : 'Your VIP tier & benefits'} icon={Crown} /><LoadingState message={locale === 'bn' ? 'লোড হচ্ছে…' : 'Loading…'} /></PageContainer>;
  }
  const cur = v.current;
  const next = v.next;
  return (
    <PageContainer>
      <PlayerPageHeader title="VIP" subtitle={locale === 'bn' ? 'আপনার ভিআইপি টিয়ার ও সুবিধা' : 'Your VIP tier & benefits'} icon={Crown} />
      <Card className="border-gold-soft/30 bg-gradient-to-b from-elevated to-surface">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-wide text-muted">{locale === 'bn' ? 'বর্তমান টিয়ার' : 'Current tier'}</p>
          <p className="text-2xl font-extrabold text-gold-soft">{cur ? cur.name : (locale === 'bn' ? 'এখনও কোনো টিয়ার নেই' : 'No tier yet')}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted">{locale === 'bn' ? 'মোট জমা' : 'Total deposited'}</span><div className="font-bold text-primary">{money(v.cumulativeDepositMinor)}</div></div>
            <div><span className="text-muted">{locale === 'bn' ? 'মোট বাজি' : 'Total wagered'}</span><div className="font-bold text-primary">{money(v.cumulativeTurnoverMinor)}</div></div>
          </div>
          {next && <p className="mt-4 text-sm text-muted">{locale === 'bn' ? 'পরবর্তী' : 'Next'}: <b className="text-primary">{next.name}</b> — {locale === 'bn' ? `${money(next.minDepositMinor || 0)} জমা করুন` : `reach ${money(next.minDepositMinor || 0)} deposited`}{next.minTurnoverMinor ? (locale === 'bn' ? ` + ${money(next.minTurnoverMinor)} বাজি` : ` + ${money(next.minTurnoverMinor)} wagered`) : ''}.</p>}
        </CardContent>
      </Card>
      <h2 className="mb-3 mt-6 text-sm font-bold text-primary">{locale === 'bn' ? 'সকল টিয়ার' : 'All tiers'}</h2>
      <div className="flex flex-col gap-2">
        {v.tiers.map((t) => (
          <div key={t.id ?? t.name} className={`rounded-lg border px-4 py-3 ${cur && cur.level === t.level ? 'border-gold-soft/50 bg-gold-soft/5' : 'border-border bg-surface'}`}>
            <div className="flex items-center justify-between"><span className="font-bold text-primary">{t.name}</span><span className="text-xs text-muted">{locale === 'bn' ? 'লেভেল' : 'Level'} {t.level}</span></div>
            <p className="mt-1 text-xs text-muted">
              {locale === 'bn' ? 'যোগ্যতা' : 'Qualify'}: {money(t.minDepositMinor || 0)} {locale === 'bn' ? 'জমা' : 'deposit'}{t.minTurnoverMinor ? ` · ${money(t.minTurnoverMinor)} ${locale === 'bn' ? 'টার্নওভার' : 'turnover'}` : ''}
              {(t.cashbackPercent || 0) > 0 ? ` · ${t.cashbackPercent}% ${locale === 'bn' ? 'ক্যাশব্যাক' : 'cashback'}` : ''}{(t.bonusPercent || 0) > 0 ? ` · ${t.bonusPercent}% ${locale === 'bn' ? 'রিলোড' : 'reload'}` : ''}
            </p>
          </div>
        ))}
        {v.tiers.length === 0 && <p className="text-sm text-muted">{locale === 'bn' ? 'এখনও কোনো ভিআইপি টিয়ার নেই।' : 'No VIP tiers available yet.'}</p>}
      </div>
    </PageContainer>
  );
}
