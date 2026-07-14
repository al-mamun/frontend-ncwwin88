/**
 * WageringStatus — player-facing rollover (turnover) progress toward unlocking
 * withdrawals. Self-contained (talks to /player/wagering directly, like
 * RealtimeBonusClaim). Renders NOTHING when the tenant hasn't enabled the rule or
 * the player has no requirement, so it's safe to drop on Turnover + Withdraw pages.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface WageringView {
  enabled: boolean;
  remainingMinor: number;
  targetMinor: number;
  wageredMinor: number;
}

function money(minor: number) {
  const amount = (minor || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `BDT ${amount.toFixed(2)}`;
  }
}

export function WageringStatus({ className }: { className?: string }) {
  const { data } = useQuery({
    queryKey: ['player', 'wagering'],
    queryFn: () => apiFetch<WageringView>('/player/wagering'),
    refetchInterval: 30_000,
  });

  if (!data || !data.enabled || (data.targetMinor ?? 0) <= 0) return null;

  const cleared = (data.remainingMinor ?? 0) <= 0;
  const wagered = data.wageredMinor || 0;
  const pct = data.targetMinor > 0 ? Math.min(100, (wagered / data.targetMinor) * 100) : 100;
  // Give any real progress a visible sliver so the bar never looks empty when the
  // player has actually wagered something (e.g. 0.27% would otherwise round to 0).
  const barWidth = cleared ? 100 : wagered > 0 ? Math.max(pct, 3) : 0;

  return (
    <div className={`mb-6 rounded-xl border border-gold-soft/30 bg-gradient-to-b from-elevated to-surface p-5 ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft/15 text-gold-soft">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="text-sm font-semibold text-white">Withdrawal requirement</div>
            <div className="text-[11px] text-muted">{cleared ? 'Wagering complete — withdrawals unlocked' : 'Wager your deposits to unlock withdrawals'}</div>
          </div>
        </div>
        <span className={`text-sm font-bold ${cleared ? 'text-green-400' : 'text-gold-soft'}`}>
          {cleared ? '✓ Unlocked' : `${money(data.remainingMinor)} left`}
        </span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${barWidth}%`,
            background: cleared
              ? 'linear-gradient(90deg,#22c55e,#16a34a)'
              : 'linear-gradient(90deg,#ffd60a,#ffb300)',
          }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Wagered {money(wagered)} of {money(data.targetMinor)}
        {' '}({cleared ? '100' : pct.toFixed(pct < 10 ? 2 : 0)}%).{cleared ? '' : ' You must finish this before you can withdraw.'}
      </p>
    </div>
  );
}

export default WageringStatus;
