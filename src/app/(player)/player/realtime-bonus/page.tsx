'use client';

/**
 * Real-Time Bonus — dedicated page.
 *
 * Rebate tab is wired to the live turnover-step bonus (`/player/realtime-bonus`):
 * shows the claimable "Available Amount", a Claim button when there's a balance,
 * else a Play Games CTA. Claimed Today / This Week and the Summary date-filter are
 * scaffolded UI — they show 0 / empty until a backend stats endpoint is added.
 *
 * Rescue tab is a placeholder (loss-rescue bonus isn't wired yet).
 *
 * COLORS: driven entirely by the brand's theme tokens — bg-base/surface/elevated,
 * text-white/muted, brand + brand-fg, gold-soft and border. The page therefore
 * wears each site's own colours (e.g. bestbet44's green) instead of a fixed
 * navy+gold palette. Branded tints use element-level opacity so they work with
 * CSS-variable colours on every brand.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Wallet, Play, Receipt } from 'lucide-react';
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
  const canClaim = available > 0 && rebate;

  return (
    <div className="min-h-screen w-full bg-base text-white">
      {/* Tabs */}
      <div className="sticky top-0 z-10 flex border-b border-border bg-surface/90 backdrop-blur">
        {(['rebate', 'rescue'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative flex-1 py-3.5 text-center text-sm font-bold capitalize transition-colors ${
              tab === t ? 'text-white' : 'text-muted hover:text-white'
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-gold-soft" />
            )}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-xl px-3 pb-10 pt-4">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated px-4 py-9 text-center shadow-xl">
          {/* branded glow (element-level opacity so it works with CSS-var colours) */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--gold-soft), transparent 70%)' }}
            aria-hidden
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Sparkles className="h-3.5 w-3.5 text-gold-soft" aria-hidden /> Available Amount
            </div>

            <div className="mx-auto my-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface ring-1 ring-border">
              <Wallet className="h-9 w-9 text-gold-soft" aria-hidden />
            </div>

            <div className="text-4xl font-extrabold tracking-tight text-white">{taka(available)}</div>

            <button
              type="button"
              onClick={() => (canClaim ? claim.mutate() : router.push('/'))}
              disabled={claim.isPending}
              className="mt-7 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-base font-extrabold text-brand-fg shadow-lg transition hover:opacity-90 active:scale-[.99] disabled:opacity-60"
              style={{ boxShadow: '0 12px 28px -10px var(--brand)' }}
            >
              {canClaim ? (
                claim.isPending ? 'Claiming…' : `Claim ${taka(available)}`
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden /> Play Games
                </>
              )}
            </button>
          </div>
        </div>

        {/* Claimed stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Claimed Today', value: 0 },
            { label: 'Claimed This Week', value: 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-surface px-4 py-4 text-center">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="mt-1 text-lg font-extrabold text-gold-soft">{taka(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1.5 rounded-full bg-gold-soft" />
            <h2 className="text-base font-bold text-white">Summary</h2>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {SUMMARY_TABS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  range === r
                    ? 'border-gold-soft text-gold-soft'
                    : 'border-border text-muted hover:text-white'
                } bg-base`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-4 flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
            <Receipt className="h-6 w-6 text-muted" aria-hidden />
            <p className="mt-2 text-xs text-muted">No {tab} records for &ldquo;{range}&rdquo;.</p>
            <p className="text-[11px] text-muted">Play games to earn real-time bonus — it appears here.</p>
          </div>
        </div>

        <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-muted">
          Real-time bonus is cashback earned automatically from your turnover. Every bet you place builds toward
          your next reward — claim it above when it&rsquo;s ready.
        </p>
      </div>
    </div>
  );
}
