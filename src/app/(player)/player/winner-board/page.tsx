/**
 * Winner Board Page.
 * Shows REAL recent wins for the tenant (from the ledger), with masked usernames.
 * Top-3 podium by amount + a recent-wins feed. Graceful empty state when there
 * are no wins yet (e.g. before game play picks up).
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Badge } from '@/components/ui/card-badge-label';
import { formatCurrency } from '@/lib/format';

interface Winner {
  id: string;
  player: string;
  amountMinor: number;
  currency: string;
  at: string | null;
}

function relativeTime(at: string | null): string {
  if (!at) return '';
  const diffMs = Date.now() - new Date(at).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function WinnerBoardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['player-winners'],
    queryFn: () => apiFetch<Winner[]>('/player/winners'),
    refetchInterval: 30000,
  });
  const winners = useMemo(() => data ?? [], [data]);
  const topWins = useMemo(() => [...winners].sort((a, b) => b.amountMinor - a.amountMinor).slice(0, 3), [winners]);

  return (
    <PageContainer>
      <PlayerPageHeader title="Winner Board" subtitle="Recent big wins from players across the casino." icon={Trophy} />

      {isLoading ? (
        <LoadingState message="Loading recent wins…" />
      ) : winners.length === 0 ? (
        <Card className="bg-surface border-border">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Trophy className="h-10 w-10 text-brand opacity-70" />
            <h3 className="text-lg font-bold">No big wins yet</h3>
            <p className="max-w-md text-sm text-muted">
              As players win across the games, their wins will appear here live. Be the first to hit a big one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Podium — top 3 by amount */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {topWins.map((win, index) => {
              const places = ['1st Place', '2nd Place', '3rd Place'];
              const placeColors = [
                'text-brand border-brand/35 bg-brand/5',
                'text-slate-300 border-slate-500/30 bg-slate-500/5',
                'text-amber-600 border-amber-800/30 bg-amber-800/5',
              ];
              return (
                <Card key={win.id} className="border-border bg-surface relative overflow-hidden">
                  <div className="absolute right-3 top-3"><Sparkles className="h-5 w-5 text-brand" /></div>
                  <CardContent className="p-6 text-center flex flex-col items-center gap-2">
                    <Badge className={placeColors[index]}>{places[index]}</Badge>
                    <div className="h-12 w-12 rounded-full bg-elevated flex items-center justify-center font-bold text-lg border border-border mt-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <h3 className="font-extrabold text-lg mt-2">{win.player}</h3>
                    <p className="text-2xl font-black text-success mt-1">{formatCurrency(win.amountMinor, win.currency)}</p>
                    <span className="text-xs text-muted mt-1">{relativeTime(win.at)}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent wins feed */}
          <div className="mt-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-brand fill-brand/20" /> Recent Wins
            </h2>
            <Card className="bg-surface border-border overflow-hidden">
              <CardContent className="p-0 divide-y divide-border/60">
                {winners.map((win) => (
                  <div key={win.id} className="flex items-center justify-between p-4 transition-colors hover:bg-elevated/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-elevated border border-border rounded-lg flex items-center justify-center font-bold text-sm shrink-0">🏆</div>
                      <div>
                        <span className="text-sm font-bold text-primary">{win.player}</span>
                        <p className="text-xs text-muted">{relativeTime(win.at)}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-base text-success">+{formatCurrency(win.amountMinor, win.currency)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageContainer>
  );
}
