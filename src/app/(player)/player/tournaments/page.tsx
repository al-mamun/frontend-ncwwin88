'use client';

import { useQuery } from '@tanstack/react-query';
import { Medal } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import type { PlayerTournament } from '@/types';

function money(m: number, c = 'BDT') { return `${c} ${(m / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }
const METRIC_LABEL: Record<string, string> = { wagered: 'Wagered', net_win: 'Net win', rounds: 'Rounds', points: 'Points' };
function metricVal(t: PlayerTournament, v: number) { return t.metric === 'rounds' || t.metric === 'points' ? String(v) : money(v, t.currency); }

export default function TournamentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['player', 'tournaments'], queryFn: () => playerApi.getTournaments() });
  if (isLoading || !data) {
    return <PageContainer><PlayerPageHeader title="Tournaments" subtitle="Compete on the leaderboard for prizes" icon={Medal} /><LoadingState message="Loading…" /></PageContainer>;
  }
  return (
    <PageContainer>
      <PlayerPageHeader title="Tournaments" subtitle="Compete on the leaderboard for prizes" icon={Medal} />
      {data.length === 0 ? (
        <Card className="border-border bg-surface"><CardContent className="py-12 text-center text-sm text-muted">No active tournaments right now. Check back soon!</CardContent></Card>
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((t) => (
            <Card key={t.id} className="border-border bg-surface">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-primary">{t.name}</h3>
                    {t.description && <p className="text-xs text-muted">{t.description}</p>}
                    <p className="mt-1 text-xs text-muted">Ranked by {METRIC_LABEL[t.metric] ?? t.metric}{t.endsAt ? ` · ends ${new Date(t.endsAt).toLocaleDateString()}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-muted">Prize pool</div>
                    <div className="text-xl font-extrabold text-gold-soft">{money(t.prizePoolMinor, t.currency)}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-gold-soft/20 bg-gold-soft/5 px-3 py-2 text-sm">
                  {t.myRank ? <>Your rank: <b className="text-gold-soft">#{t.myRank}</b> · {metricVal(t, t.myMetric)}</> : <span className="text-muted">Play during the tournament window to join the leaderboard.</span>}
                </div>
                <div className="mt-3 divide-y divide-white/5">
                  {t.leaderboard.map((r) => (
                    <div key={r.rank} className={`flex items-center justify-between py-1.5 text-sm ${r.isMe ? 'font-bold text-gold-soft' : 'text-primary'}`}>
                      <span><span className="inline-block w-7 text-muted">#{r.rank}</span>{r.name}{r.isMe ? ' (you)' : ''}</span>
                      <span className="font-mono">{metricVal(t, r.metricValue)}</span>
                    </div>
                  ))}
                  {t.leaderboard.length === 0 && <p className="py-3 text-xs text-muted">No entries yet — be the first to play!</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
