/**
 * RealtimeBonusClaim — player-facing real-time (turnover-step) bonus card.
 *
 * Two states, one component:
 *   • CLAIM  — when there's a pending balance, a bright gold card + "Claim ৳X" button.
 *   • INFO   — when there's nothing to claim yet, a compact explainer so players who
 *              haven't earned one know what it is and how they'll get it. Renders by
 *              default so the existing Account/Rewards placements teach every player;
 *              pass `claimOnly` to suppress the info state (render nothing when idle).
 *
 * Self-contained (talks to the player API directly) and THEME-INDEPENDENT (explicit
 * colors, not `surface`/`gold-soft` tokens) so it renders with the same high contrast
 * on every brand theme and on mobile.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Gamepad2, Coins, Gift } from 'lucide-react';
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

export function RealtimeBonusClaim({ className, claimOnly = false }: { className?: string; claimOnly?: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
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

  const hasClaim = !!data && (data.totalMinor ?? 0) > 0;

  // INFO state — nothing to claim yet.
  if (!hasClaim) {
    if (claimOnly || isLoading) return null;
    return (
      <div
        className={`relative mb-6 overflow-hidden rounded-2xl border border-amber-400/25 p-5 ${className ?? ''}`}
        style={{ background: 'linear-gradient(160deg,#17151a 0%,#1d1a15 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
            <Zap className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="text-sm font-bold text-white">Real-Time Bonus</div>
            <div className="text-[11px] text-amber-100/60">Cashback bonus — automatically, as you play</div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-gray-300">
          The more you wager, the more you earn. Every bet adds to your turnover and you pick up a real-time
          cashback bonus along the way — no code, nothing to opt into. When a reward is ready it appears right
          here with a Claim button.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: Gamepad2, label: 'Play games' },
            { icon: Coins, label: 'Earn from turnover' },
            { icon: Gift, label: 'Claim your bonus' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] px-1 py-2">
              <s.icon className="mx-auto h-4 w-4 text-amber-300" aria-hidden />
              <div className="mt-1 text-[10px] font-semibold text-gray-300">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CLAIM state — pending balance ready.
  const maxWager = data!.items.reduce((m, i) => Math.max(m, i.wagerMultiplier || 0), 0);
  return (
    <div
      className={`relative mb-6 overflow-hidden rounded-2xl border border-amber-400/60 p-5 shadow-[0_0_0_1px_rgba(251,191,36,0.15),0_10px_30px_-10px_rgba(251,191,36,0.35)] ${className ?? ''}`}
      style={{ background: 'linear-gradient(160deg,#1c1917 0%,#26211a 55%,#3a2d12 100%)' }}
    >
      <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" aria-hidden />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/40">
            <Zap className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              Real-Time Bonus
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              </span>
            </div>
            <div className="text-[11px] text-amber-100/70">Earned from your turnover — ready to claim</div>
          </div>
        </div>
        <span className="text-xl font-extrabold text-amber-300 drop-shadow">{money(data!.totalMinor, data!.currency)}</span>
      </div>
      <button
        type="button"
        onClick={() => claim.mutate()}
        disabled={claim.isPending}
        className="relative mt-4 w-full rounded-xl py-3 text-sm font-extrabold uppercase tracking-wide text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(90deg,#ffd60a,#ffb300)' }}
      >
        {claim.isPending ? 'Claiming…' : `Claim ${money(data!.totalMinor, data!.currency)}`}
      </button>
      {maxWager > 0 && (
        <p className="relative mt-2 text-center text-[11px] text-amber-100/70">
          Claimed bonus must be wagered {maxWager}× before withdrawal.
        </p>
      )}
      {claim.isError && (
        <p className="relative mt-2 text-center text-[11px] text-red-400">Couldn&apos;t claim right now. Please try again.</p>
      )}
    </div>
  );
}

export default RealtimeBonusClaim;
