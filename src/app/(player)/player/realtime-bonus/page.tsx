'use client';

/**
 * Real-Time Bonus — dedicated page (rich design).
 *
 * Rebate tab is wired to the live turnover-step bonus (`/player/realtime-bonus`):
 * shows the claimable "Available Amount", a Claim button when there's a balance,
 * else a Play Games CTA. Claimed Today / This Week and the Summary date-filter are
 * scaffolded UI — they show 0 / empty until a backend stats endpoint is added.
 *
 * Rescue tab is a placeholder (loss-rescue bonus isn't wired yet).
 *
 * Theme-independent colors so it looks the same on every brand.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface RTBView { totalMinor: number; currency: string; items: { wagerMultiplier: number }[] }

function taka(minor: number) {
  return `৳${((minor || 0) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

const SUMMARY_TABS = ['Today', 'Yesterday', 'Last 7 days', 'Optional Date'] as const;

export default function RealtimeBonusPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rebate' | 'rescue'>('rebate');
  const [range, setRange] = useState<(typeof SUMMARY_TABS)[number]>('Today');

  const { data } = useQuery({
    queryKey: ['player', 'realtime-bonus'],
    queryFn: () => apiFetch<RTBView>('/player/realtime-bonus'),
    refetchInterval: 30_000,
  });

  const claim = useMutation({
    mutationFn: () => apiFetch<{ claimedMinor: number }>('/player/realtime-bonus/claim', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', 'realtime-bonus'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['player', 'bonus-wallet'] });
    },
  });

  const rebate = tab === 'rebate';
  const available = rebate ? data?.totalMinor ?? 0 : 0;

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(180deg,#141c33 0%,#0e1424 100%)' }}>
      {/* Tabs */}
      <div className="sticky top-0 z-10 flex" style={{ background: 'linear-gradient(180deg,#d9a83022,#0e142400)' }}>
        {(['rebate', 'rescue'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="relative flex-1 py-3 text-center text-sm font-bold capitalize transition-colors"
            style={{ color: tab === t ? '#ffffff' : 'rgba(255,255,255,.5)' }}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full" style={{ background: '#ffd24a' }} />}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-xl px-3 pb-8 pt-4">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl px-4 py-8 text-center" style={{ background: 'radial-gradient(120% 90% at 50% 0%,#1c2748 0%,#131b30 70%)' }}>
          {/* subtle stars */}
          <div className="pointer-events-none absolute inset-0 opacity-60"
            style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%,#ffffff55,transparent),radial-gradient(1.5px 1.5px at 70% 20%,#ffffff44,transparent),radial-gradient(1.5px 1.5px at 85% 60%,#ffffff33,transparent),radial-gradient(1.5px 1.5px at 30% 70%,#ffffff44,transparent),radial-gradient(1.5px 1.5px at 55% 85%,#ffffff33,transparent)' }} aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-white/90">
              <Sparkles className="h-4 w-4 text-white" aria-hidden /> Available Amount
            </div>
            <div className="my-5 text-6xl leading-none" aria-hidden>💵</div>
            <div className="text-3xl font-extrabold text-white">{taka(available)}</div>

            {available > 0 && rebate ? (
              <button
                type="button"
                onClick={() => claim.mutate()}
                disabled={claim.isPending}
                className="mt-6 w-full max-w-xs rounded-xl py-3.5 text-base font-extrabold text-black shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg,#f4c752,#c8901f)' }}
              >
                {claim.isPending ? 'Claiming…' : `Claim ${taka(available)}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/')}
                className="mt-6 w-full max-w-xs rounded-xl py-3.5 text-base font-extrabold text-black shadow-lg transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(180deg,#f4c752,#c8901f)' }}
              >
                Play Games
              </button>
            )}
          </div>
        </div>

        {/* Claimed stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Claimed Today', value: 0 },
            { label: 'Claimed This Week', value: 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl px-4 py-4 text-center" style={{ background: '#161f38' }}>
              <div className="text-xs text-white/70">{s.label}</div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: '#ffd24a' }}>{taka(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 rounded-2xl p-4" style={{ background: '#161f38' }}>
          <div className="flex items-center gap-2">
            <span className="h-4 w-1.5 rounded-full" style={{ background: '#ffd24a' }} />
            <h2 className="text-base font-bold text-white">Summary</h2>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {SUMMARY_TABS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className="shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                style={
                  range === r
                    ? { borderColor: '#ffd24a', background: '#ffd24a1a', color: '#ffd24a' }
                    : { borderColor: 'rgba(255,255,255,.1)', background: '#0f1830', color: 'rgba(255,255,255,.75)' }
                }
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-4 flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
            <span className="text-2xl opacity-60" aria-hidden>🧾</span>
            <p className="mt-2 text-xs text-white/50">No {tab} records for “{range}”.</p>
            <p className="text-[11px] text-white/40">Play games to earn real-time bonus — it appears here.</p>
          </div>
        </div>

        <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-white/45">
          Real-time bonus is cashback earned automatically from your turnover. Every bet you place builds toward
          your next reward — claim it above when it’s ready.
        </p>
      </div>
    </div>
  );
}
