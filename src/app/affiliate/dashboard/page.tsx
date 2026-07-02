/**
 * Affiliate dashboard: account status, referral link, live stats, and program.
 * Gated to the affiliate session; nudges incomplete onboarding to finish first.
 */
'use client';

import BrandLockup from '@/components/shared/brand-lockup';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { affiliateApi } from '@/services/affiliate.service';
import { AffiliateBackground } from '@/components/affiliate/AffiliateBackground';

function money(minor: number, currency: string): string {
  return `${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const STATUS_COPY: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Approved', cls: 'bg-success/20 text-success' },
  pending: { label: 'Pending approval', cls: 'bg-[var(--brand)]/20 text-[var(--gold-soft)]' },
  suspended: { label: 'Suspended', cls: 'bg-danger/20 text-danger' },
  rejected: { label: 'Rejected', cls: 'bg-danger/20 text-danger' },
};

const CARD = 'rounded-2xl border border-white/10 bg-[var(--bg-elevated)] backdrop-blur';

export default function AffiliateDashboardPage() {
  const { me, loading, logout } = useAffiliateAuth();
  const { tenant } = useTenant();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!me) { router.replace('/login'); return; }
    // Onboarding must be complete (email + phone + KYC submitted) before the dashboard.
    if (!me.verification.onboardingComplete) router.replace('/onboarding');
  }, [loading, me, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate', 'dashboard'],
    queryFn: () => affiliateApi.dashboard(),
    enabled: !!me,
  });
  const playersQ = useQuery({
    queryKey: ['affiliate', 'players'],
    queryFn: () => affiliateApi.players(),
    enabled: !!me,
  });

  // Render nothing dashboard-related until we KNOW the session is valid AND
  // onboarding is complete. This prevents the dashboard flashing for a frame
  // before the redirect effect runs (gated programmatically, not via CSS).
  if (loading || !me || !me.verification.onboardingComplete) {
    return <div className="relative flex min-h-screen items-center justify-center text-muted"><AffiliateBackground />Loading…</div>;
  }

  const v = me.verification;
  const aff = data?.affiliate ?? me.affiliate;
  const program = data?.program ?? null;
  const stats = data?.stats ?? null;
  const TYPE_LABEL: Record<string, string> = { cpa: 'CPA', revenue_share: 'Revenue share', bonus: 'Bonus', adjustment: 'Adjustment' };
  const maxMonth = stats?.monthly?.reduce((m, x) => Math.max(m, x.amountMinor), 0) ?? 0;
  const status = STATUS_COPY[aff.status] ?? STATUS_COPY.pending;
  // Referral links point at the PLAYER site (apex), never the affiliate subdomain.
  const playerHost = (tenant.domain || (typeof window !== 'undefined' ? window.location.host : '')).replace(/^affiliate\./i, '');
  const refLink = playerHost ? `https://${playerHost}/?ref=${aff.code}` : `?ref=${aff.code}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="relative min-h-screen px-4 py-8 text-[#f5f7fa]">
      <AffiliateBackground />
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
                        <BrandLockup className="h-8 w-auto object-contain" />
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--gold-soft)]">PARTNER</span>
          </Link>
          <button onClick={() => { void logout().then(() => router.replace('/login')); }} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">Sign out</button>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{aff.displayName}</h1>
            <p className="text-sm text-muted">Code <span className="font-mono font-semibold text-[var(--gold-soft)]">{aff.code}</span></p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.cls}`}>{status.label}</span>
        </div>

        {!v.onboardingComplete && (
          <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 border-[var(--brand)]/40 ${CARD} p-4`}>
            <p className="text-sm">Finish verifying your email, phone and ID to get approved.</p>
            <Link href="/onboarding" className="rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-5 py-2.5 text-sm font-bold text-[var(--bg-base)] transition-transform hover:-translate-y-0.5">Complete onboarding</Link>
          </div>
        )}
        {v.onboardingComplete && aff.status === 'pending' && (
          <div className={`mb-6 ${CARD} p-4 text-sm text-muted`}>Verification complete — your account is awaiting final approval.</div>
        )}

        {/* Referral link */}
        <div className={`mb-6 ${CARD} p-6`}>
          <p className="text-sm font-semibold text-white">Your referral link</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-white/10 bg-[var(--bg-base)] px-3 py-2.5 font-mono text-sm text-white/90">{refLink}</code>
            <button onClick={copy} disabled={aff.status !== 'approved'} className="rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-5 py-2.5 text-sm font-bold text-[var(--bg-base)] transition-transform hover:-translate-y-0.5 disabled:opacity-50">{copied ? 'Copied!' : 'Copy'}</button>
            {aff.status !== 'approved' && <span className="w-full text-xs text-muted">Your link activates once your account is approved.</span>}
          </div>
        </div>

        {/* Payout method */}
        <PayoutMethodCard method={aff.payoutMethod} details={aff.payoutDetails} />

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Clicks" value={String(aff.clicks)} />
          <Stat label="Sign-ups" value={String(aff.signups)} />
          <Stat label="First deposits" value={String(aff.ftdCount)} />
          <Stat label="Lifetime earned" value={money(aff.lifetimeCommissionMinor, aff.currency)} />
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Pending" value={money(aff.pendingCommissionMinor, aff.currency)} />
          <Stat label="Available" value={money(aff.availableCommissionMinor, aff.currency)} highlight />
          <Stat label="Paid out" value={money(aff.paidCommissionMinor, aff.currency)} />
        </div>

        {/* Referred players + finance */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={`${CARD} p-6`}>
            <p className="mb-3 text-sm font-semibold text-white">Your players</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <MiniStat label="Referred" value={String(stats?.players.total ?? 0)} />
              <MiniStat label="Depositors" value={String(stats?.players.ftd ?? aff.ftdCount)} />
              <MiniStat label="Sign-ups" value={String(stats?.players.signups ?? aff.signups)} />
            </div>
          </div>
          <div className={`${CARD} p-6`}>
            <p className="mb-3 text-sm font-semibold text-white">Players&apos; finance</p>
            <div className="space-y-2 text-sm">
              <Row k={`Deposits${stats ? ` (${stats.finance.depositCount})` : ''}`} v={money(stats?.finance.depositsMinor ?? 0, aff.currency)} />
              <Row k={`Withdrawals${stats ? ` (${stats.finance.withdrawalCount})` : ''}`} v={money(stats?.finance.withdrawalsMinor ?? 0, aff.currency)} />
              <Row k="Net (NGR)" v={money(stats?.finance.netMinor ?? 0, aff.currency)} strong />
            </div>
          </div>
        </div>

        {/* Referred players list */}
        <div className={`${CARD} mb-6 p-6`}>
          <p className="mb-3 text-sm font-semibold text-white">Referred players</p>
          {playersQ.data && playersQ.data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="pb-2 pr-3 font-medium">Player</th>
                    <th className="pb-2 pr-3 font-medium">Joined</th>
                    <th className="pb-2 pr-3 font-medium">Deposited</th>
                    <th className="pb-2 font-medium">FTD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {playersQ.data.items.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-3 font-medium text-white">{p.name}</td>
                      <td className="py-2 pr-3 text-muted">{p.joinedAt ? new Date(p.joinedAt).toLocaleDateString() : '—'}</td>
                      <td className="py-2 pr-3">{money(p.depositsMinor, playersQ.data!.currency)}{p.depositCount ? ` (${p.depositCount})` : ''}</td>
                      <td className="py-2">{p.ftd ? <span className="rounded bg-success/20 px-2 py-0.5 text-xs text-success">Yes</span> : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">{playersQ.isLoading ? 'Loading…' : 'No referred players yet. Share your referral link to start earning.'}</p>
          )}
        </div>

        {/* Earnings by month + by type */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={`${CARD} p-6`}>
            <p className="mb-4 text-sm font-semibold text-white">Earnings (last 6 months)</p>
            {stats && stats.monthly.length > 0 ? (
              <div className="flex h-32 items-end gap-2">
                {stats.monthly.map((m) => (
                  <div key={m.period} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))]" style={{ height: `${maxMonth ? Math.max(4, (m.amountMinor / maxMonth) * 100) : 4}%` }} title={money(m.amountMinor, aff.currency)} />
                    <span className="text-[10px] text-muted">{m.period.slice(5)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No earnings yet.</p>
            )}
          </div>
          <div className={`${CARD} p-6`}>
            <p className="mb-3 text-sm font-semibold text-white">Commission by type</p>
            {stats && stats.commissionByType.length > 0 ? (
              <div className="space-y-2 text-sm">
                {stats.commissionByType.map((c) => (
                  <Row key={c.type} k={`${TYPE_LABEL[c.type] ?? c.type} (${c.count})`} v={money(c.amountMinor, aff.currency)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No commissions yet.</p>
            )}
          </div>
        </div>

        {/* Recent commissions */}
        <div className={`mb-6 ${CARD} p-6`}>
          <p className="mb-3 text-sm font-semibold text-white">Recent commissions</p>
          {stats && stats.recentCommissions.length > 0 ? (
            <div className="divide-y divide-white/5">
              {stats.recentCommissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-white">{TYPE_LABEL[c.type] ?? c.type}</span>
                    {c.note ? <span className="ml-2 truncate text-xs text-muted">{c.note}</span> : null}
                    <span className="ml-2 text-[11px] text-muted">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <span className={c.status === 'reversed' ? 'text-danger line-through' : 'font-semibold text-success'}>{money(c.amountMinor, c.currency)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No commissions recorded yet.</p>
          )}
        </div>

        {/* Betting report (not available until game rounds exist) */}
        <div className={`mb-6 ${CARD} p-6`}>
          <p className="text-sm font-semibold text-white">Betting report</p>
          {stats && stats.betting.available ? (
            <div className="mt-3 space-y-1.5">
              <Row k={`Rounds (${stats.betting.roundsCount})`} v={String(stats.betting.roundsCount)} />
              <Row k="Wagered" v={money(stats.betting.wageredMinor, aff.currency)} />
              <Row k="Won" v={money(stats.betting.wonMinor, aff.currency)} />
              <Row k="Net (GGR)" v={money(stats.betting.ggrMinor, aff.currency)} strong />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No betting activity from your referred players yet — figures appear here as they play.</p>
          )}
        </div>

        {/* Program */}
        <div className={`${CARD} p-6`}>
          <p className="mb-3 text-sm font-semibold text-white">Your program</p>
          {isLoading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : program ? (
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-[var(--gold-soft)]">{program.name}</p>
              <p className="text-muted">
                Model: {program.model}
                {program.revenueSharePercent != null && ` · Rev share ${program.revenueSharePercent}%`}
                {program.cpaAmountMinor != null && ` · CPA ${money(program.cpaAmountMinor, program.currency)}`}
              </p>
              {program.minPayoutMinor != null && <p className="text-muted">Minimum payout: {money(program.minPayoutMinor, program.currency)}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted">You&apos;ll be assigned a program when your account is approved.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const PAYOUT_METHODS: { value: string; label: string }[] = [
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'usdt', label: 'USDT (crypto)' },
  { value: 'skrill', label: 'Skrill' },
  { value: 'neteller', label: 'Neteller' },
  { value: 'other', label: 'Other' },
];

function PayoutMethodCard({ method, details }: { method: string; details: string | null }) {
  const qc = useQueryClient();
  const [m, setM] = useState(method && method !== 'manual' && method !== 'ewallet' && method !== 'crypto' ? method : 'bkash');
  const [d, setD] = useState(details ?? '');
  const save = useMutation({
    mutationFn: () => affiliateApi.updatePayoutMethod(m, d.trim()),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['affiliate', 'dashboard'] }); },
  });
  const placeholder = m === 'bank' ? 'Account name, number, bank & branch' : m === 'usdt' ? 'USDT wallet address (and network)' : m === 'other' ? 'Payout account details' : 'Account / wallet number';
  return (
    <div className={`mb-6 ${CARD} p-6`}>
      <p className="text-sm font-semibold text-white">Payout method</p>
      <p className="mt-1 text-xs text-muted">Tell us where to send your commission. This is shown to the operator when they pay you out.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
        <select value={m} onChange={(e) => setM(e.target.value)} className="rounded-lg border border-white/10 bg-[var(--bg-base)] px-3 py-2.5 text-sm text-white">
          {PAYOUT_METHODS.map((o) => <option key={o.value} value={o.value} className="bg-[var(--bg-elevated)]">{o.label}</option>)}
        </select>
        <input value={d} onChange={(e) => setD(e.target.value)} placeholder={placeholder} className="rounded-lg border border-white/10 bg-[var(--bg-base)] px-3 py-2.5 text-sm text-white placeholder:text-muted" />
        <button onClick={() => save.mutate()} disabled={save.isPending || !d.trim()} className="rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-5 py-2.5 text-sm font-bold text-[var(--bg-base)] transition-transform hover:-translate-y-0.5 disabled:opacity-50">{save.isPending ? 'Saving…' : 'Save'}</button>
      </div>
      {save.isSuccess && <p className="mt-2 text-xs text-success">Saved — operators will pay to this {PAYOUT_METHODS.find((x) => x.value === m)?.label}.</p>}
      {save.isError && <p className="mt-2 text-xs text-danger">Could not save — please try again.</p>}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 backdrop-blur ${highlight ? 'border-success/40 bg-success/5' : 'border-white/10 bg-[var(--bg-elevated)]'}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--bg-base)] p-3">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span className={strong ? 'font-bold text-[var(--gold-soft)]' : 'font-semibold text-white'}>{v}</span>
    </div>
  );
}
