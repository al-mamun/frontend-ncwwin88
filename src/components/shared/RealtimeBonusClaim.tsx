/**
 * RealtimeBonusClaim — player-facing claim card for the TURNOVER-STEP real-time bonus.
 *
 * Self-contained: talks to the player API directly (no dependency on the per-site
 * player.service / hooks, which drift between sites). Polls the pending balance and
 * renders NOTHING when there's nothing to claim, so it's safe to drop unconditionally
 * on the Rewards / My Account page. On claim, the pending amount moves into the bonus
 * wallet (subject to its wagering requirement) and the card refreshes.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface RealtimeBonusClaimItem {
  bonusId: string;
  bonusName: string;
  pendingMinor: number;
  currency: string;
  wagerMultiplier: number;
}
interface RealtimeBonusClaimView {
  totalMinor: number;
  currency: string;
  items: RealtimeBonusClaimItem[];
}

function money(minor: number, currency: string) {
  const amount = (minor || 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function RealtimeBonusClaim({ className }: { className?: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['player', 'realtime-bonus'],
    queryFn: () => apiFetch<RealtimeBonusClaimView>('/player/realtime-bonus'),
    refetchInterval: 30_000,
  });

  const claim = useMutation({
    mutationFn: () => apiFetch<{ claimedMinor: number; currency: string }>('/player/realtime-bonus/claim', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', 'realtime-bonus'] });
      qc.invalidateQueries({ queryKey: ['bonusWallet'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['player', 'bonus-wallet'] });
    },
  });

  if (!data || (data.totalMinor ?? 0) <= 0) return null;

  const maxWager = data.items.reduce((m, i) => Math.max(m, i.wagerMultiplier || 0), 0);

  return (
    <div className={`mb-6 rounded-xl border border-gold-soft/30 bg-gradient-to-b from-elevated to-surface p-5 ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-soft/15 text-gold-soft">
            <Zap className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="text-sm font-semibold text-white">Real-Time Bonus</div>
            <div className="text-[11px] text-muted">Earned from your turnover — ready to claim</div>
          </div>
        </div>
        <span className="text-xl font-extrabold text-gold-soft">{money(data.totalMinor, data.currency)}</span>
      </div>
      <button
        type="button"
        onClick={() => claim.mutate()}
        disabled={claim.isPending}
        className="mt-4 w-full rounded-lg bg-[linear-gradient(90deg,#ffd60a,#ffb300)] py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {claim.isPending ? 'Claiming…' : `Claim ${money(data.totalMinor, data.currency)}`}
      </button>
      {maxWager > 0 && (
        <p className="mt-2 text-center text-[11px] text-muted">
          Claimed bonus must be wagered {maxWager}× before withdrawal.
        </p>
      )}
      {claim.isError && (
        <p className="mt-2 text-center text-[11px] text-red-400">Couldn&apos;t claim right now. Please try again.</p>
      )}
    </div>
  );
}

export default RealtimeBonusClaim;
