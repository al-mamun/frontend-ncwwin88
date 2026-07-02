'use client';

import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';

function money(m: number, c = 'BDT') { return `${c} ${(m / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }
function fmt(v: number, isAmount: boolean, c: string) { return isAmount ? money(v, c) : String(v); }

export default function LoyaltyPage() {
  const { data, isLoading } = useQuery({ queryKey: ['player', 'loyalty'], queryFn: () => playerApi.getLoyalty() });
  if (isLoading || !data) {
    return <PageContainer><PlayerPageHeader title="Loyalty" subtitle="Complete missions, earn points" icon={Target} /><LoadingState message="Loading…" /></PageContainer>;
  }
  return (
    <PageContainer>
      <PlayerPageHeader title="Loyalty" subtitle="Complete missions, earn points" icon={Target} />
      <Card className="border-gold-soft/30 bg-gradient-to-b from-elevated to-surface">
        <CardContent className="flex items-center justify-between p-6">
          <span className="text-sm font-medium text-muted">Loyalty points</span>
          <span className="text-2xl font-extrabold text-gold-soft">{data.points.toLocaleString()}</span>
        </CardContent>
      </Card>
      <h2 className="mb-3 mt-6 text-sm font-bold text-primary">Missions</h2>
      <div className="flex flex-col gap-3">
        {data.missions.map((m) => {
          const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
          return (
            <div key={m.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{m.name}</span>
                <span className="text-xs font-semibold text-gold-soft">{m.completed ? 'Completed' : `+${m.rewardPoints} pts${m.rewardAmountMinor > 0 ? ` + ${money(m.rewardAmountMinor, m.currency)}` : ''}`}</span>
              </div>
              {m.description && <p className="mt-0.5 text-xs text-muted">{m.description}</p>}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#ffd60a,#ffb300)]" style={{ width: `${m.completed ? 100 : pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-muted">{fmt(m.progress, m.isAmount, m.currency)} / {fmt(m.target, m.isAmount, m.currency)}</p>
            </div>
          );
        })}
        {data.missions.length === 0 && <p className="text-sm text-muted">No active missions right now.</p>}
      </div>
    </PageContainer>
  );
}
