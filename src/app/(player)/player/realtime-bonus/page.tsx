'use client';

/**
 * Real-Time Bonus — dedicated page.
 *
 * Linked from the account menu's "Real-Time Bonus" tile. Shows the explainer for
 * players who haven't earned one yet, and the Claim card the moment a balance is
 * ready (both states live in the shared RealtimeBonusClaim component).
 */

import { RealtimeBonusClaim } from '@/components/shared/RealtimeBonusClaim';
import { PageContainer } from '@/components/shared';

export default function RealtimeBonusPage() {
  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-xl py-2">
        <h1 className="mb-1 text-xl font-extrabold text-white">Real-Time Bonus</h1>
        <p className="mb-5 text-sm text-gray-400">
          Cashback bonus you earn automatically as you play — no code needed.
        </p>
        <RealtimeBonusClaim />

        <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h2 className="text-sm font-bold text-white">How it works</h2>
          <ol className="mt-3 space-y-3 text-xs text-gray-300">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-bold text-amber-300">1</span>
              <span>Play any game. Every bet you place counts toward your turnover.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-bold text-amber-300">2</span>
              <span>As your turnover builds, you automatically earn a cashback bonus — the more you play, the more you earn.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-bold text-amber-300">3</span>
              <span>When a bonus is ready it appears above with a Claim button. Claimed bonus moves to your bonus wallet and can be withdrawn once its wagering requirement is met.</span>
            </li>
          </ol>
        </div>
      </div>
    </PageContainer>
  );
}
