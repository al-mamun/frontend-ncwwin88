/**
 * Player Affiliate Portal.
 * Apply to the affiliate program, then view your referral link, code, status,
 * acquisition stats (clicks / signups / FTDs), commission balances, and request
 * payouts of available commission.
 */
'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake, Copy, Check, MousePointerClick, UserPlus, Wallet, Banknote } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useProfile } from '@/hooks/player-hooks';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface PlayerAffiliate {
  id: string;
  code: string;
  displayName: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  programId: string | null;
  clicks: number;
  signups: number;
  ftdCount: number;
  pendingCommissionMinor: number;
  availableCommissionMinor: number;
  paidCommissionMinor: number;
  lifetimeCommissionMinor: number;
  currency: string;
}

interface PlayerPayout {
  id: string;
  status: 'requested' | 'approved' | 'paid' | 'rejected';
  amountMinor: number;
  currency: string;
  method: string;
  reference: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

interface PlayerProgram {
  id: string;
  name: string;
  description: string | null;
  model: 'revenue_share' | 'cpa' | 'hybrid';
  revenueSharePercent: number;
  cpaAmountMinor: number;
  qualifyingDepositMinor: number;
  minPayoutMinor: number;
  currency: string;
}

/** Human-readable summary of a program's commission terms. */
function programTerms(p: PlayerProgram): string {
  const parts: string[] = [];
  if (p.model === 'revenue_share' || p.model === 'hybrid') parts.push(`${p.revenueSharePercent}% revenue share`);
  if (p.model === 'cpa' || p.model === 'hybrid') parts.push(`${formatCurrency(p.cpaAmountMinor, p.currency)} per qualified referral`);
  return parts.join(' + ') || 'Custom terms';
}

const STATUS_TEXT: Record<PlayerAffiliate['status'], string> = {
  pending: 'Pending review',
  approved: 'Active',
  suspended: 'Suspended',
  rejected: 'Not approved',
};

const PAYOUT_STATUS_TEXT: Record<PlayerPayout['status'], string> = {
  requested: 'Requested',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export default function AffiliatePortalPage() {
  const client = useQueryClient();
  const { data: profile } = useProfile();
  const [copied, setCopied] = useState(false);

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ['player-affiliate'],
    queryFn: () => apiFetch<{ affiliate: PlayerAffiliate | null }>('/player/affiliate/me'),
  });

  const programsQuery = useQuery({
    queryKey: ['player-affiliate-programs'],
    queryFn: () => apiFetch<{ items: PlayerProgram[] }>('/player/affiliate/programs'),
  });
  const programs = programsQuery.data?.items ?? [];

  const apply = useMutation({
    mutationFn: () =>
      apiFetch<{ affiliate: PlayerAffiliate }>('/player/affiliate/apply', {
        method: 'POST',
        body: JSON.stringify({
          displayName: profile?.displayName || profile?.username,
          email: profile?.email,
          programId: selectedProgramId ?? programs[0]?.id,
        }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['player-affiliate'] }),
  });

  const affiliate = meQuery.data?.affiliate ?? null;
  const myProgram = useMemo(
    () => programs.find((p) => p.id === affiliate?.programId) ?? null,
    [programs, affiliate],
  );

  // Payout amount (major units); defaults to the full available balance.
  const [payoutAmount, setPayoutAmount] = useState('');

  const payoutsQuery = useQuery({
    queryKey: ['player-affiliate-payouts'],
    queryFn: () => apiFetch<{ items: PlayerPayout[] }>('/player/affiliate/payouts?limit=20'),
    enabled: !!affiliate && affiliate.status === 'approved',
  });

  const available = affiliate?.availableCommissionMinor ?? 0;
  // Requested amount in MINOR units: parse the input, else default to full balance.
  const requestedMinor = useMemo(() => {
    const major = parseFloat(payoutAmount);
    if (!payoutAmount.trim() || !Number.isFinite(major)) return available;
    return Math.round(major * 100);
  }, [payoutAmount, available]);

  const requestPayout = useMutation({
    mutationFn: () =>
      apiFetch<{ payout: PlayerPayout }>('/player/affiliate/payout-request', {
        method: 'POST',
        body: JSON.stringify({ amountMinor: requestedMinor }),
      }),
    onSuccess: () => {
      setPayoutAmount('');
      client.invalidateQueries({ queryKey: ['player-affiliate'] });
      client.invalidateQueries({ queryKey: ['player-affiliate-payouts'] });
    },
  });

  const payouts = payoutsQuery.data?.items ?? [];
  const hasPending = payouts.some((p) => p.status === 'requested' || p.status === 'approved');
  const amountValid = requestedMinor > 0 && requestedMinor <= available;
  const canRequest = affiliate?.status === 'approved' && available > 0 && !hasPending && amountValid;

  const referralUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return affiliate ? `${origin}/?ref=${affiliate.code}` : '';
  }, [affiliate]);

  const copy = () => {
    if (typeof navigator !== 'undefined' && referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (meQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading affiliate portal…" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PlayerPageHeader title="Affiliate Program" subtitle="Become a partner and earn ongoing commission on the players you bring in." icon={Handshake} />

      {!affiliate ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 py-5">
              <h3 className="text-lg font-semibold">Become an affiliate partner</h3>
              <p className="text-sm text-muted-foreground">
                The Affiliate Program is for partners who promote us and earn <strong>ongoing commission</strong> (revenue share and/or CPA) on players they refer, withdrawn on request. Choose a plan below and apply — a team member reviews and approves your application.
              </p>
              <p className="text-xs text-muted-foreground">
                Just want a quick one-off bonus for inviting a friend? Use <strong>Refer a Friend</strong> instead.
              </p>
            </CardContent>
          </Card>

          {programs.length > 0 ? (
            <div className="space-y-2">
              {programs.map((p) => {
                const sel = (selectedProgramId ?? programs[0]?.id) === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProgramId(p.id)}
                    className={
                      'flex w-full flex-col items-start rounded-lg border p-4 text-left transition-colors ' +
                      (sel ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted/40')
                    }
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-sm font-medium text-brand">{programTerms(p)}</span>
                    </div>
                    {p.description ? <span className="mt-1 text-sm text-muted-foreground">{p.description}</span> : null}
                    <span className="mt-1 text-xs text-muted-foreground">Minimum payout: {formatCurrency(p.minPayoutMinor, p.currency)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No affiliate plans are open right now. Please check back later.</CardContent></Card>
          )}

          <div className="flex flex-col items-center gap-2">
            <Button onClick={() => apply.mutate()} disabled={apply.isPending || programs.length === 0}>
              {apply.isPending ? 'Submitting…' : 'Apply now'}
            </Button>
            {apply.isError && (
              <p className="text-sm text-red-500">
                {(apply.error as Error)?.message || 'Could not submit your application. Please try again.'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Your affiliate code</div>
                  <div className="font-mono text-xl font-bold">{affiliate.code}</div>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-medium">{STATUS_TEXT[affiliate.status]}</span>
              </div>
              {myProgram && (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Your plan: </span>
                  <span className="font-medium">{myProgram.name}</span>
                  <span className="text-muted-foreground"> — {programTerms(myProgram)}</span>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Your tracking link</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-sm">{referralUrl}</code>
                  <Button variant="outline" size="sm" onClick={copy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Share this link. When someone signs up through it and deposits, you earn commission per your plan.</p>
              </div>
              {affiliate.status === 'pending' && (
                <p className="text-sm text-muted-foreground">Your application is under review — your tracking link activates once approved.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-3 py-4">
              <MousePointerClick className="h-5 w-5 opacity-70" />
              <div><div className="text-2xl font-bold">{affiliate.clicks}</div><div className="text-xs text-muted-foreground">Clicks</div></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 py-4">
              <UserPlus className="h-5 w-5 opacity-70" />
              <div><div className="text-2xl font-bold">{affiliate.signups}</div><div className="text-xs text-muted-foreground">Signups</div></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 py-4">
              <Wallet className="h-5 w-5 opacity-70" />
              <div><div className="text-2xl font-bold">{affiliate.ftdCount}</div><div className="text-xs text-muted-foreground">First deposits</div></div>
            </CardContent></Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="py-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Available commission</div>
              <div className="text-xl font-bold">{formatCurrency(affiliate.availableCommissionMinor, affiliate.currency)}</div>
            </CardContent></Card>
            <Card><CardContent className="py-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Pending commission</div>
              <div className="text-xl font-bold">{formatCurrency(affiliate.pendingCommissionMinor, affiliate.currency)}</div>
            </CardContent></Card>
            <Card><CardContent className="py-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Lifetime commission</div>
              <div className="text-xl font-bold">{formatCurrency(affiliate.lifetimeCommissionMinor, affiliate.currency)}</div>
            </CardContent></Card>
          </div>

          {affiliate.status === 'approved' && (
            <Card>
              <CardContent className="space-y-3 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 opacity-80" />
                    <div>
                      <div className="text-sm font-semibold">Payouts</div>
                      <div className="text-xs text-muted-foreground">Request a payout of your available commission.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`Max ${formatCurrency(available, affiliate.currency)}`}
                      disabled={!hasPending ? false : true}
                      className="h-9 w-40 rounded-md border bg-background px-3 text-sm"
                      aria-label="Payout amount"
                    />
                    <Button onClick={() => requestPayout.mutate()} disabled={!canRequest || requestPayout.isPending}>
                      {requestPayout.isPending ? 'Requesting…' : 'Request payout'}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Leave the amount blank to request your full available balance.</p>
                {requestPayout.isError && (
                  <p className="text-xs text-red-500">{(requestPayout.error as Error)?.message || 'Payout request failed.'}</p>
                )}
                {payoutAmount.trim() !== '' && !amountValid && !hasPending && available > 0 && (
                  <p className="text-xs text-red-500">Enter an amount between 0 and your available balance.</p>
                )}
                {hasPending && <p className="text-xs text-muted-foreground">You have a payout request awaiting processing.</p>}
                {!hasPending && available <= 0 && (
                  <p className="text-xs text-muted-foreground">No available commission to withdraw yet.</p>
                )}
                {payouts.length > 0 && (
                  <div className="divide-y rounded-md border">
                    {payouts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span className="font-medium">{formatCurrency(p.amountMinor, p.currency)}</span>
                        <span className="text-xs uppercase text-muted-foreground">{p.method}</span>
                        <span className="rounded-full border px-2 py-0.5 text-xs">{PAYOUT_STATUS_TEXT[p.status]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageContainer>
  );
}
