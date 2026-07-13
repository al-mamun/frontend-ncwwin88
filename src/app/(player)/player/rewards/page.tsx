'use client';

import { useQuery } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { RealtimeBonusClaim } from '@/components/shared/RealtimeBonusClaim';

function money(m: number, c = 'BDT') { return `${c} ${(m / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function when(s: string | null) { return s ? new Date(s).toLocaleDateString() : ''; }

export default function RewardsPage() {
  const bonusWallet = useQuery({ queryKey: ['player', 'bonus-wallet'], queryFn: () => playerApi.getBonusWallet() });
  const bonuses = useQuery({ queryKey: ['player', 'bonuses'], queryFn: () => playerApi.getBonuses() });
  const cashback = useQuery({ queryKey: ['player', 'cashback'], queryFn: () => playerApi.getCashback() });
  const freeSpins = useQuery({ queryKey: ['player', 'freespins'], queryFn: () => playerApi.getFreeSpins() });
  return (
    <PageContainer>
      <PlayerPageHeader title="My Rewards" subtitle="Bonuses and cashback credited to you" icon={Gift} />
      <RealtimeBonusClaim />
      {bonusWallet.data && bonusWallet.data.lockedMinor > 0 && (
        <div className="mb-6 rounded-xl border border-gold-soft/30 bg-gradient-to-b from-elevated to-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Locked bonus</span>
            <span className="text-lg font-extrabold text-gold-soft">{money(bonusWallet.data.lockedMinor, bonusWallet.data.currency)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">Wager {money(bonusWallet.data.remainingTurnoverMinor, bonusWallet.data.currency)} more to unlock this to your withdrawable balance.</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0a0e1a]/60">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#ffd60a,#ffb300)]" style={{ width: `${bonusWallet.data.requiredTurnoverMinor > 0 ? Math.min(100, Math.round((bonusWallet.data.achievedTurnoverMinor / bonusWallet.data.requiredTurnoverMinor) * 100)) : 0}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{money(bonusWallet.data.achievedTurnoverMinor, bonusWallet.data.currency)} / {money(bonusWallet.data.requiredTurnoverMinor, bonusWallet.data.currency)} wagered</p>
        </div>
      )}
      <h2 className="mb-3 text-sm font-bold text-primary">Bonuses</h2>
      {bonuses.isLoading ? <LoadingState message="Loading…" /> : (bonuses.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted">No bonuses yet. Deposit during an active promotion to get a bonus.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bonuses.data!.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div><div className="text-sm font-semibold text-primary">{b.promotionName ?? 'Bonus'}</div><div className="text-[11px] text-muted">{when(b.createdAt)}</div></div>
              <span className="text-sm font-bold text-success">+{money(b.amountMinor, b.currency)}</span>
            </div>
          ))}
        </div>
      )}
      <h2 className="mb-3 mt-6 text-sm font-bold text-primary">Cashback</h2>
      {cashback.isLoading ? <LoadingState message="Loading…" /> : (cashback.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted">No cashback yet. Cashback is paid on your net losses each period.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {cashback.data!.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div><div className="text-sm font-semibold text-primary">{c.programName ?? 'Cashback'} · {c.periodLabel}</div><div className="text-[11px] text-muted">{c.cashbackPercent}% of {money(c.netLossMinor, c.currency)} net loss</div></div>
              <span className="text-sm font-bold text-success">+{money(c.cashbackMinor, c.currency)}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-6 text-sm font-bold text-primary">Free spins</h2>
      {freeSpins.isLoading ? <LoadingState message="Loading…" /> : (freeSpins.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted">No free spins yet. Deposit during an active free-spins campaign to receive them.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {freeSpins.data!.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div><div className="text-sm font-semibold text-primary">{g.campaignName ?? 'Free spins'}</div><div className="text-[11px] text-muted">{g.spinsCount} spins{g.provider ? ` · ${g.provider}` : ''} · {when(g.createdAt)}</div></div>
              <span className="text-sm font-bold text-success">+{money(g.amountMinor, g.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
