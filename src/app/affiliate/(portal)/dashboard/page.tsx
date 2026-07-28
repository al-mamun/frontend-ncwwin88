/**
 * Affiliate dashboard — the portal's home screen.
 *
 * Three data sources, deliberately kept separate:
 *   • GET /affiliate/overview         → the period grid (today … last month) and
 *     the KPI deltas. One request, nine metrics, six periods.
 *   • GET /affiliate/overview/series  → a daily series behind the trend chart,
 *     the KPI sparklines and the signup funnel.
 *   • GET /affiliate/dashboard        → account/program/payout state and the
 *     earnings history.
 *
 * The series endpoint is the newest of the three and may not be deployed on the
 * API this build talks to. It is therefore treated as ENHANCEMENT ONLY: if it
 * fails, the sparklines and the chart quietly stand down and every figure on the
 * page still comes from the other two calls. Nothing here fabricates a number.
 *
 * The auth + onboarding gate and the chrome (sidebar, topbar, sign-out) live in
 * the (portal) layout, so this file is only the page body.
 */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { affiliateApi } from '@/services/affiliate.service';
import {
  affiliateReportsApi,
  OVERVIEW_PERIODS,
  type OverviewMetric,
  type OverviewPeriod,
  type PartnerStatus,
  type SeriesPoint,
} from '@/services/affiliate-reports.service';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  CARD,
  Badge,
  Chip,
  CountUpMoney,
  DeltaChip,
  ErrorNote,
  LABEL,
  MetricCard,
  ProgressBar,
  SectionCard,
  Skeleton,
  delta,
  formatDate,
  formatDateRange,
  formatDayShort,
  formatInt,
  formatMoney,
  formatMoneyCompact,
} from '@/components/affiliate/portal-ui';
import { AreaChart, Donut, Funnel, type DonutSlice } from '@/components/affiliate/portal-charts';

const STATUS_COPY: Record<string, { label: string; tone: 'success' | 'gold' | 'danger' }> = {
  approved: { label: 'Approved', tone: 'success' },
  pending: { label: 'Pending approval', tone: 'gold' },
  suspended: { label: 'Suspended', tone: 'danger' },
  rejected: { label: 'Rejected', tone: 'danger' },
};

const TYPE_LABEL: Record<string, string> = {
  cpa: 'CPA',
  revenue_share: 'Revenue share',
  bonus: 'Bonus',
  adjustment: 'Adjustment',
};

const PERIOD_LABEL: Record<OverviewPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This week',
  lastWeek: 'Last week',
  thisMonth: 'This month',
  lastMonth: 'Last month',
};

/**
 * The hero/KPI window. Each one names the period it compares against, so a
 * delta is never ambiguous about its baseline the way a bare "+12%" is.
 */
const WINDOWS = [
  { key: 'today', label: 'Today', prev: 'yesterday', prevLabel: 'vs yesterday', days: 14 },
  { key: 'thisWeek', label: 'This week', prev: 'lastWeek', prevLabel: 'vs last week', days: 30 },
  { key: 'thisMonth', label: 'This month', prev: 'lastMonth', prevLabel: 'vs last month', days: 90 },
] as const satisfies readonly { key: OverviewPeriod; label: string; prev: OverviewPeriod; prevLabel: string; days: number }[];

type WindowKey = (typeof WINDOWS)[number]['key'];

/**
 * How each overview metric reads. `kind` decides count-vs-money formatting, and
 * `signed` colours a figure that can legitimately go negative (player P&L), so a
 * losing week is obvious at a glance instead of hiding behind a minus sign.
 */
const METRIC_META: { key: OverviewMetric; label: string; kind: 'count' | 'money'; signed?: boolean }[] = [
  { key: 'registrations', label: 'Registrations', kind: 'count' },
  { key: 'firstDeposits', label: 'First deposits', kind: 'count' },
  { key: 'activePlayers', label: 'Active players', kind: 'count' },
  { key: 'deposits', label: 'Deposits', kind: 'money' },
  { key: 'withdrawals', label: 'Withdrawals', kind: 'money' },
  { key: 'bonus', label: 'Bonus', kind: 'money' },
  { key: 'turnover', label: 'Turnover', kind: 'money' },
  { key: 'profitLoss', label: 'Player P&L', kind: 'money', signed: true },
  { key: 'referralCommission', label: 'Referral commission', kind: 'money' },
];

/** Chart metrics. Money and counts never share an axis, so one is picked at a time. */
const CHART_METRICS: { key: keyof Omit<SeriesPoint, 'date'>; label: string; money: boolean }[] = [
  { key: 'commissionMinor', label: 'Commission', money: true },
  { key: 'depositsMinor', label: 'Deposits', money: true },
  { key: 'turnoverMinor', label: 'Turnover', money: true },
  { key: 'registrations', label: 'Registrations', money: false },
  { key: 'activePlayers', label: 'Active players', money: false },
];

export default function AffiliateDashboardPage() {
  const { me } = useAffiliateAuth();
  const { tenant } = useTenant();
  const [copied, setCopied] = useState(false);
  const [win, setWin] = useState<WindowKey>('today');
  const [chartMetric, setChartMetric] = useState<keyof Omit<SeriesPoint, 'date'>>('commissionMinor');
  const [chartDays, setChartDays] = useState(30);

  const dashboardQ = useQuery({
    queryKey: ['affiliate', 'dashboard'],
    queryFn: () => affiliateApi.dashboard(),
  });
  const overviewQ = useQuery({
    queryKey: ['affiliate', 'overview'],
    queryFn: () => affiliateReportsApi.overview(),
    // The grid is six periods of aggregation; a short cache keeps tab-switching snappy.
    staleTime: 60_000,
  });
  const seriesQ = useQuery({
    queryKey: ['affiliate', 'series', chartDays],
    queryFn: () => affiliateReportsApi.series(chartDays),
    staleTime: 60_000,
    // Enhancement only (see the file header): one attempt, then get out of the
    // way. Retrying a 404 just delays the rest of the page behind a spinner.
    retry: false,
  });
  const statusQ = useQuery({
    queryKey: ['affiliate', 'status'],
    queryFn: () => affiliateReportsApi.status(),
    // Week-to-date aggregation over every referred player - not cheap, and the
    // figure only moves as fast as play does.
    staleTime: 120_000,
    // Enhancement only, same reasoning as the series above: an operator on an
    // older backend has no /affiliate/status, and the card simply will not render.
    retry: false,
  });

  const points = useMemo(() => seriesQ.data?.points ?? [], [seriesQ.data]);
  const spark = useMemo(() => {
    const take = (k: keyof Omit<SeriesPoint, 'date'>, n: number) => points.slice(-n).map((p) => Number(p[k]) || 0);
    return { take };
  }, [points]);

  // `me` is guaranteed by the (portal) layout gate, but the optional chain keeps
  // this component independently renderable (and type-safe) if that ever changes.
  const aff = dashboardQ.data?.affiliate ?? me?.affiliate;
  if (!aff) return null;

  const program = dashboardQ.data?.program ?? null;
  const stats = dashboardQ.data?.stats ?? null;
  const status = STATUS_COPY[aff.status] ?? STATUS_COPY.pending;
  const currency = overviewQ.data?.currency ?? aff.currency;
  const activeWin = WINDOWS.find((w) => w.key === win) ?? WINDOWS[0];

  const playerHost = (tenant.domain || (typeof window !== 'undefined' ? window.location.host : '')).replace(/^affiliate\./i, '');
  // A configured tenant domain is always https; the window fallback only happens in
  // local dev, where forcing https yields an unreachable `https://localhost:3000`.
  const scheme = !tenant.domain && typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : 'https';
  const refLink = playerHost ? `${scheme}://${playerHost}/?ref=${aff.code}` : `?ref=${aff.code}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the link stays selectable on screen */
    }
  };
  const share = async () => {
    // Native share sheet where it exists (every mobile browser that matters);
    // otherwise fall back to the same copy the button beside it performs.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: tenant.name || 'Join me', text: 'Sign up with my link', url: refLink });
        return;
      } catch {
        /* user dismissed the sheet - not an error */
      }
    }
    await copy();
  };

  const cell = (metric: OverviewMetric, period: OverviewPeriod) =>
    overviewQ.data?.metrics?.[metric]?.[period] ?? { count: 0, amountMinor: 0 };

  // When the overview request failed there is no data - and a grid of confident
  // zeros is a wrong answer, not a neutral one. Show em dashes so "we don't know"
  // never reads as "nothing happened today".
  const hasOverview = !!overviewQ.data;

  /** Headline value + delta for a metric in the currently selected window. */
  const headline = (metric: OverviewMetric, kind: 'count' | 'money') => {
    if (!hasOverview) return { value: '—', d: null };
    const now = cell(metric, activeWin.key);
    const prev = cell(metric, activeWin.prev);
    const value = kind === 'count' ? formatInt(now.count) : formatMoney(now.amountMinor, currency);
    const d = kind === 'count' ? delta(now.count, prev.count) : delta(now.amountMinor, prev.amountMinor);
    return { value, d };
  };

  const periodCommission = cell('referralCommission', activeWin.key).amountMinor;
  const periodCommissionDelta = delta(periodCommission, cell('referralCommission', activeWin.prev).amountMinor);

  // Progress towards the operator's minimum payout. This is a real threshold on
  // the assigned program, not an invented "tier" - the partner cannot withdraw
  // until they cross it, so it is the one number worth gamifying.
  const minPayout = program?.minPayoutMinor ?? 0;
  const payoutPct = minPayout > 0 ? Math.min(100, (aff.availableCommissionMinor / minPayout) * 100) : null;

  const monthly = stats?.monthly ?? [];
  const mix: DonutSlice[] = (stats?.commissionByType ?? []).map((c, i) => ({
    key: c.type,
    label: `${TYPE_LABEL[c.type] ?? c.type} (${c.count})`,
    value: c.amountMinor,
    tone: (['gold', 'amber', 'info', 'success', 'neutral'] as const)[i % 5],
  }));

  const chartMeta = CHART_METRICS.find((m) => m.key === chartMetric) ?? CHART_METRICS[0];
  const chartValues = points.map((p) => Number(p[chartMeta.key]) || 0);

  return (
    <div className="aff-rise space-y-6">
      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, {aff.displayName || aff.code}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Affiliate code <span className="font-mono font-semibold text-[var(--gold)]">{aff.code}</span>
            {overviewQ.data ? <> · figures as of {new Date(overviewQ.data.generatedAt).toLocaleTimeString()}</> : null}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>

      {aff.status === 'pending' && (
        <div className={`${CARD} border-[var(--gold-a35)] bg-[var(--gold-glow)] p-4 text-sm text-[var(--text-secondary)]`}>
          Verification complete — your account is awaiting final approval. Your referral link activates once approved.
        </div>
      )}

      {/* ── Earnings hero ──────────────────────────────────────────────────── */}
      <section className={`${CARD} relative overflow-hidden`}>
        {/* One warm bloom, top-left. The hero is the only place on the page that
            gets a glow; repeat it and the hierarchy is gone. */}
        <span className="pointer-events-none absolute -left-24 -top-32 h-72 w-96 rounded-full bg-[var(--gold-a12)] blur-3xl" aria-hidden />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          <div className="min-w-0">
            <p className={LABEL}>Available to withdraw</p>
            {dashboardQ.isLoading ? (
              <Skeleton className="mt-2 h-11 w-64" />
            ) : (
              <p className="aff-gold-text mt-1.5 text-[34px] font-bold leading-none tracking-tight sm:text-[40px]">
                <CountUpMoney minor={aff.availableCommissionMinor} currency={aff.currency} />
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <MiniStat label="Pending" value={formatMoney(aff.pendingCommissionMinor, aff.currency)} />
              <MiniStat label="Paid out" value={formatMoney(aff.paidCommissionMinor, aff.currency)} />
              <MiniStat label="Lifetime" value={formatMoney(aff.lifetimeCommissionMinor, aff.currency)} />
            </div>

            {payoutPct !== null ? (
              <div className="mt-5 max-w-sm">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className={LABEL}>Progress to payout</span>
                  <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                    {payoutPct >= 100
                      ? 'Minimum reached'
                      : `${formatMoney(minPayout - aff.availableCommissionMinor, aff.currency)} to go`}
                  </span>
                </div>
                <ProgressBar pct={payoutPct} tone={payoutPct >= 100 ? 'success' : 'gold'} />
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                  Minimum payout on {program?.name ?? 'your program'} is {formatMoney(minPayout, program?.currency ?? aff.currency)}.
                </p>
              </div>
            ) : null}
          </div>

          {/* Period earnings + its own trend, so the hero answers "how much have I
              made" and "is that better than last time" in one glance. */}
          <div className="min-w-0 border-t border-[var(--line)] pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={LABEL}>Commission earned</p>
              <div className="flex gap-1">
                {WINDOWS.map((w) => (
                  <Chip key={w.key} active={win === w.key} onClick={() => setWin(w.key)}>
                    {w.label}
                  </Chip>
                ))}
              </div>
            </div>
            {overviewQ.isLoading ? (
              <Skeleton className="mt-3 h-9 w-40" />
            ) : (
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <p className="text-[28px] font-bold leading-none tabular-nums text-[var(--text-primary)]">
                  {hasOverview ? formatMoney(periodCommission, currency) : '—'}
                </p>
                <DeltaChip value={periodCommissionDelta} suffix={` ${activeWin.prevLabel}`} />
              </div>
            )}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {overviewQ.data
                ? formatDateRange(overviewQ.data.periods[activeWin.key]?.from, overviewQ.data.periods[activeWin.key]?.to)
                : 'Waiting for figures…'}
            </p>

            <div className="mt-4 grid grid-cols-3 items-stretch gap-3">
              <HeroStat label="Signups" value={hasOverview ? formatInt(cell('registrations', activeWin.key).count) : '—'} />
              <HeroStat label="1st deposits" value={hasOverview ? formatInt(cell('firstDeposits', activeWin.key).count) : '—'} />
              <HeroStat label="Active" value={hasOverview ? formatInt(cell('activePlayers', activeWin.key).count) : '—'} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Referral link ──────────────────────────────────────────────────── */}
      <section className={`${CARD} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Your referral link</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Every visitor who arrives through this link is tracked to your account for life.
            </p>
          </div>
          {aff.status !== 'approved' ? <Badge tone="warning">Activates on approval</Badge> : null}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2.5 font-mono text-sm text-[var(--text-secondary)]">
            {refLink}
          </code>
          <button onClick={copy} disabled={aff.status !== 'approved'} className={BTN_PRIMARY}>
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
          <button onClick={share} disabled={aff.status !== 'approved'} className={BTN_GHOST}>
            Share
          </button>
        </div>
      </section>

      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className={LABEL}>{activeWin.label}</h2>
          <span className="text-xs text-[var(--text-muted)]">{activeWin.prevLabel}</span>
        </div>
        <ErrorNote error={overviewQ.error} paused={overviewQ.isPaused} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { m: METRIC_META[8], sparkKey: 'commissionMinor' as const, accent: 'gold' as const },
            { m: METRIC_META[0], sparkKey: 'registrations' as const, accent: 'none' as const },
            { m: METRIC_META[1], sparkKey: 'firstDeposits' as const, accent: 'none' as const },
            { m: METRIC_META[3], sparkKey: 'depositsMinor' as const, accent: 'none' as const },
          ].map(({ m, sparkKey, accent }) => {
            const h = headline(m.key, m.kind);
            const b = cell(m.key, activeWin.key);
            return (
              <MetricCard
                key={m.key}
                label={m.label}
                value={h.value}
                sub={m.kind === 'money' && b.count > 0 ? `${formatInt(b.count)} txn` : undefined}
                deltaPct={h.d}
                accent={accent}
                loading={overviewQ.isLoading}
                spark={spark.take(sparkKey, activeWin.days)}
              />
            );
          })}
        </div>
      </section>

      {/* ── Partner status ─────────────────────────────────────────────────── */}
      <PartnerStatusCard status={statusQ.data} loading={statusQ.isLoading} />

      {/* ── Trend chart ────────────────────────────────────────────────────── */}
      <SectionCard
        title="Trend"
        hint={seriesQ.data ? `${seriesQ.data.days} days to ${formatDate(seriesQ.data.to)}` : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-1">
            {[7, 30, 90].map((d) => (
              <Chip key={d} active={chartDays === d} onClick={() => setChartDays(d)}>
                {d}d
              </Chip>
            ))}
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CHART_METRICS.map((m) => (
            <Chip key={String(m.key)} active={chartMetric === m.key} onClick={() => setChartMetric(m.key)}>
              {m.label}
            </Chip>
          ))}
        </div>

        {seriesQ.isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : seriesQ.isError ? (
          <p className="py-14 text-center text-xs text-[var(--text-muted)]">
            Daily history isn&apos;t available from this API yet — every figure above still comes straight from your account.
          </p>
        ) : (
          <AreaChart
            labels={points.map((p) => p.date)}
            series={[{ key: String(chartMeta.key), label: chartMeta.label, values: chartValues, tone: 'gold' }]}
            formatLabel={formatDayShort}
            formatValue={(v) => (chartMeta.money ? formatMoneyCompact(v) : Math.round(v).toLocaleString())}
          />
        )}
      </SectionCard>

      {/* ── Funnel + commission mix ────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Referral funnel" hint="Where your traffic stops converting.">
          {seriesQ.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
            </div>
          ) : seriesQ.data ? (
            <Funnel
              stages={[
                { key: 'reg', label: 'Registered', value: seriesQ.data.funnel.registrations, hint: `${seriesQ.data.days}d` },
                { key: 'dep', label: 'Made a first deposit', value: seriesQ.data.funnel.firstDeposits },
                { key: 'act', label: 'Placed a bet', value: seriesQ.data.funnel.activePlayers },
              ]}
            />
          ) : (
            <p className="py-6 text-center text-xs text-[var(--text-muted)]">
              Funnel needs the daily history endpoint, which this API doesn&apos;t serve yet.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Commission by type" hint="Lifetime, split by how it was earned.">
          <Donut
            slices={mix}
            centerLabel="Lifetime"
            centerValue={formatMoney(aff.lifetimeCommissionMinor, aff.currency)}
            emptyText="No commissions recorded yet."
          />
        </SectionCard>
      </div>

      {/* ── Earnings history ───────────────────────────────────────────────── */}
      <SectionCard
        title="Earnings by month"
        hint="Commission approved per calendar month."
        actions={
          monthly.length >= 2 ? (
            <DeltaChip value={delta(monthly[monthly.length - 1].amountMinor, monthly[monthly.length - 2].amountMinor)} />
          ) : null
        }
      >
        {monthly.length > 0 ? (
          <MonthBars months={monthly} currency={aff.currency} />
        ) : (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">
            No earnings yet — they appear here once your first commission is approved.
          </p>
        )}
      </SectionCard>

      {/* ── Period grid ────────────────────────────────────────────────────── */}
      <SectionCard
        title="Performance by period"
        hint="Every metric, every window — one view, no tab-hopping."
        actions={
          <Link href="/affiliate/reports/performance" className="text-xs font-semibold text-[var(--gold)] hover:underline">
            Open full report →
          </Link>
        }
      >
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 whitespace-nowrap border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Metric
                </th>
                {OVERVIEW_PERIODS.map((p) => (
                  <th
                    key={p}
                    className="whitespace-nowrap border-b border-[var(--line)] px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
                  >
                    {PERIOD_LABEL[p]}
                    {overviewQ.data ? (
                      <span className="block text-[10px] font-normal normal-case text-[var(--text-faint)]">
                        {formatDate(overviewQ.data.periods[p]?.from)}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_META.map((m) => (
                <tr key={m.key} className="group transition-colors hover:bg-[var(--gold-a06)]">
                  <td className="sticky left-0 z-10 whitespace-nowrap border-b border-white/[0.045] bg-[var(--bg-elevated)] px-3 py-2.5 text-left font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                    {m.label}
                  </td>
                  {OVERVIEW_PERIODS.map((p) => {
                    const b = cell(m.key, p);
                    const n = m.kind === 'count' ? b.count : b.amountMinor;
                    const tone = m.signed && n < 0 ? 'text-danger' : m.signed && n > 0 ? 'text-success' : 'text-[var(--text-secondary)]';
                    return (
                      <td key={p} className={`whitespace-nowrap border-b border-white/[0.045] px-3 py-2.5 text-right tabular-nums ${tone}`}>
                        {overviewQ.isLoading ? (
                          <Skeleton className="ml-auto inline-block h-3 w-14" />
                        ) : !hasOverview ? (
                          '—'
                        ) : m.kind === 'count' ? (
                          formatInt(b.count)
                        ) : (
                          formatMoney(b.amountMinor)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
          Money shown in {currency}. Player P&amp;L is positive when the house wins.
        </p>
      </SectionCard>

      {/* ── Recent commissions ─────────────────────────────────────────────── */}
      <SectionCard
        title="Recent commissions"
        actions={
          <Link href="/affiliate/reports/commission" className="text-xs font-semibold text-[var(--gold)] hover:underline">
            Statements →
          </Link>
        }
      >
        {stats && stats.recentCommissions.length > 0 ? (
          <div className="divide-y divide-white/[0.045]">
            {stats.recentCommissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-[var(--text-primary)]">{TYPE_LABEL[c.type] ?? c.type}</span>
                  {c.note ? <span className="ml-2 truncate text-xs text-[var(--text-muted)]">{c.note}</span> : null}
                  <span className="ml-2 text-[11px] text-[var(--text-muted)]">{formatDate(c.createdAt)}</span>
                </div>
                <span className={`shrink-0 tabular-nums ${c.status === 'reversed' ? 'text-danger line-through' : 'font-semibold text-success'}`}>
                  {formatMoney(c.amountMinor, c.currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--text-muted)]">No commissions recorded yet.</p>
        )}
      </SectionCard>

      {/* ── Payout method ──────────────────────────────────────────────────── */}
      <PayoutMethodCard method={aff.payoutMethod} details={aff.payoutDetails} />

      {/* ── Program ────────────────────────────────────────────────────────── */}
      <SectionCard title="Your program" actions={program ? <Badge tone="gold">Assigned</Badge> : null}>
        {dashboardQ.isLoading ? (
          <Skeleton className="h-20" />
        ) : program ? (
          <div>
            <p className="aff-gold-text text-lg font-bold">{program.name}</p>
            <p className={`mt-0.5 ${LABEL}`}>{program.model.replace('_', ' ')} model</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {program.revenueSharePercent != null && <ProgramStat label="Revenue share" value={`${program.revenueSharePercent}%`} />}
              {program.cpaAmountMinor != null && program.cpaAmountMinor > 0 && (
                <ProgramStat label="CPA / player" value={formatMoney(program.cpaAmountMinor, program.currency)} />
              )}
              {program.qualifyingDepositMinor != null && program.qualifyingDepositMinor > 0 && (
                <ProgramStat label="Qualifying deposit" value={formatMoney(program.qualifyingDepositMinor, program.currency)} />
              )}
              {program.minPayoutMinor != null && <ProgramStat label="Min. payout" value={formatMoney(program.minPayoutMinor, program.currency)} />}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              {program.model === 'revenue_share'
                ? 'You earn a share of the net gaming revenue (NGR) generated by your referred players, settled weekly.'
                : program.model === 'cpa'
                  ? 'You earn a fixed CPA reward the first time a referred player makes a qualifying deposit.'
                  : 'Hybrid: a fixed CPA on the first qualifying deposit of a referred player, plus an ongoing revenue share.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">You&apos;ll be assigned a program when your account is approved.</p>
        )}
      </SectionCard>
    </div>
  );
}

/* ── partner status ─────────────────────────────────────────────────────── */
/** `Refer {target} players` -> `Refer 50 players`, formatted for this partner. */
function milestoneLabel(m: PartnerStatus['milestones'][number], currency: string): string {
  const target = m.kind === 'money' ? formatMoneyCompact(m.target, currency) : formatInt(m.target);
  return m.label.replace('{target}', target);
}

/** Share of a milestone completed. Guards a zero target rather than dividing by it. */
function milestonePct(m: PartnerStatus['milestones'][number]): number {
  if (m.achieved) return 100;
  if (m.target <= 0) return 100;
  return Math.min(100, Math.max(0, (m.value / m.target) * 100));
}

/**
 * Why this week's commission is the number it is.
 *
 * Commission is not a share of the NGR. It is a share of the NGR *capped by what
 * this partner's players actually lost out of their own deposits* - deposits less
 * withdrawals, less every taka already paid commission on. A partner whose players
 * swung big on house-funded credit can post a large NGR and still be paid on a
 * smaller figure, and if nobody tells them why, the only available explanation
 * left to them is that they were short-changed.
 *
 * So this strip renders exactly when there is something to explain: the ceiling is
 * biting, or an overpayment is being recovered. The rest of the time it renders
 * nothing rather than adding three numbers nobody needs to read.
 */
function RevenueBasisNote({
  revenue,
  currency,
  percent,
}: {
  revenue: PartnerStatus['revenue'];
  currency: string;
  percent: number;
}) {
  const capped = revenue.cappedByDeposits;
  const inDebt = revenue.debtMinor > 0;
  if (!capped && !inDebt) return null;

  return (
    <div className="mt-3 space-y-2">
      {capped ? (
        <div className="rounded-xl border border-[var(--gold-a35)] bg-[var(--gold-a06)] px-3.5 py-3">
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">
            Paid on {formatMoney(revenue.eligibleMinor, currency)}, not {formatMoney(revenue.ngrMinor, currency)}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
            Commission is earned on what your players lost from their own deposits. Their net real
            deposits come to {formatMoney(revenue.netRealMinor, currency)}, of which{' '}
            {formatMoney(revenue.headroomMinor, currency)} has not been commissioned yet - so that is
            the ceiling this week. The rest of the net revenue was funded by house credit
            ({formatMoney(revenue.houseCreditsMinor, currency)} of turnover), which does not earn.
          </p>
        </div>
      ) : null}

      {inDebt ? (
        <div className="rounded-xl border border-[var(--line-strong)] bg-white/[0.03] px-3.5 py-3">
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">
            {formatMoney(revenue.debtMinor, currency)} being recovered
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
            An earlier week paid out more than it should have. Nothing is owed back - it comes off
            future earnings instead. This week projects{' '}
            {formatMoney(revenue.projectedCommissionMinor, currency)} at {percent}%, of which{' '}
            {formatMoney(revenue.projectedCreditMinor, currency)} credits to you and the remainder
            clears the balance.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Where the partner stands: the rate they are on, the rung they are climbing,
 * and the achievement set.
 *
 * Everything above the milestones is week-to-date PROJECTION - the numbers move
 * until Monday's accrual run settles them - so the header says so out loud.
 * Someone reading a mid-week commission figure as money already banked is the
 * one misunderstanding this card could cause.
 *
 * Renders nothing at all when the endpoint is unavailable: an operator on an
 * older backend gets the rest of the dashboard rather than an error panel.
 */
/**
 * Why this week's commission is the number it is.
 *
 * Commission is not a share of the NGR. It is a share of the NGR *capped by what
 * this partner's players actually lost out of their own deposits* - deposits less
 * withdrawals, less every taka already paid commission on. A partner whose players
 * swung big on house-funded credit can post a large NGR and still be paid on a
 * smaller figure, and if nobody tells them why, the only available explanation is
 * that they were short-changed.
 *
 * So this strip renders exactly when there is something to explain: the ceiling is
 * biting, or an overpayment is being recovered. The rest of the time it renders
 * nothing rather than adding three numbers nobody needs to read.
 */
function PartnerStatusCard({ status, loading }: { status?: PartnerStatus; loading: boolean }) {
  if (loading) {
    return (
      <SectionCard title="Partner status">
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </SectionCard>
    );
  }
  if (!status) return null;

  const { currency, ladder, rate, revenue, milestones } = status;
  const next = ladder.nextTier;
  // -1 means "has not reached even the first rung", which is a real state: the
  // ladder shows with nothing cleared rather than pretending rung 0 is active.
  const activeIdx = rate.source === 'tier' ? rate.tierIndex : -1;

  return (
    <SectionCard
      title="Partner status"
      hint={`Week ${status.week.label} · live projection, settles Monday`}
      actions={
        <Badge tone="gold">
          {rate.percent}% rev share
          {rate.source === 'override' ? ' · custom' : rate.tierName ? ` · ${rate.tierName}` : ''}
        </Badge>
      }
    >
      {/* Week-to-date headline. `running` includes any negative carryover, which is
          why it can sit below the raw NGR - the label says "running" for that reason. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-white/[0.02] px-3.5 py-3">
          <p className={LABEL}>Running net revenue</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {formatMoney(revenue.runningMinor, currency)}
          </p>
          {revenue.carryoverMinor < 0 ? (
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              After {formatMoney(revenue.carryoverMinor, currency)} carried over
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white/[0.02] px-3.5 py-3">
          <p className={LABEL}>Projected commission</p>
          <p className="mt-1.5 aff-gold-text text-xl font-bold tabular-nums">
            {formatMoney(revenue.projectedCommissionMinor, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {revenue.debtMinor > 0
              ? `${formatMoney(revenue.projectedCreditMinor, currency)} credits after recovery`
              : `At ${rate.percent}% of running`}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white/[0.02] px-3.5 py-3">
          <p className={LABEL}>Week to date</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {formatMoney(revenue.ngrMinor, currency)}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            GGR {formatMoneyCompact(revenue.ggrMinor, currency)} less bonus {formatMoneyCompact(revenue.bonusMinor, currency)}
          </p>
        </div>
      </div>

      <RevenueBasisNote revenue={revenue} currency={currency} percent={rate.percent} />

      {/* The ladder. Cleared rungs stay visible - the climb is the point - but only
          the one currently paying gets gold, since gold means money on this surface. */}
      {ladder.active ? (
        <div className="mt-5">
          <p className={LABEL}>Revenue share tiers</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {ladder.tiers.map((t, i) => {
              const isActive = i === activeIdx;
              const cleared = i < activeIdx;
              return (
                <div
                  key={`${t.name}-${t.minNgrMinor}`}
                  className={`rounded-xl border px-3 py-2.5 ${
                    isActive
                      ? 'border-[var(--gold-a55)] bg-[var(--gold-a12)]'
                      : cleared
                        ? 'border-[var(--line-strong)] bg-white/[0.03]'
                        : 'border-[var(--line)] bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-xs font-semibold ${
                        isActive
                          ? 'text-[var(--gold-bright)]'
                          : cleared
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-muted)]'
                      }`}
                      title={t.name}
                    >
                      {t.name}
                    </p>
                    {cleared ? <span className="shrink-0 text-[11px] text-[var(--success)]">✓</span> : null}
                  </div>
                  <p className={`mt-1 text-lg font-bold tabular-nums ${isActive ? 'aff-gold-text' : 'text-[var(--text-secondary)]'}`}>
                    {t.revenueSharePercent}%
                  </p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-[var(--text-muted)]">
                    From {formatMoneyCompact(t.minNgrMinor, currency)}
                  </p>
                </div>
              );
            })}
          </div>

          {next ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">{formatMoney(next.gapMinor, currency)}</span> more this
                  week unlocks <span className="font-semibold text-[var(--gold)]">{next.name}</span> at {next.revenueSharePercent}%
                </p>
                <p className="text-[11px] tabular-nums text-[var(--text-muted)]">{Math.round(ladder.progressPct)}%</p>
              </div>
              <ProgressBar pct={ladder.progressPct} className="mt-2" />
            </div>
          ) : (
            <p className="mt-3.5 text-xs text-[var(--text-secondary)]">
              Top tier reached — you are earning the highest rate this program offers.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {rate.source === 'override'
            ? `Your operator has set a custom ${rate.percent}% rate on your account, so the standard tiers do not apply.`
            : `This program pays a flat ${rate.percent}% — there are no tiers to climb.`}
        </p>
      )}

      {/* Milestones are LIFETIME, not week-to-date. They sit below a divider so the
          switch of timeframe is visible rather than something you have to infer. */}
      {milestones.length ? (
        <div className="mt-5 border-t border-[var(--line)] pt-4">
          <p className={LABEL}>Milestones · all time</p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => {
              const shown = (n: number) => (m.kind === 'money' ? formatMoneyCompact(n, currency) : formatInt(n));
              return (
                <div
                  key={m.key}
                  className={`rounded-xl border px-3 py-2.5 ${
                    m.achieved ? 'border-[var(--success-a35)] bg-[var(--success-a06)]' : 'border-[var(--line)] bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] leading-snug text-[var(--text-secondary)]">{milestoneLabel(m, currency)}</p>
                    {m.achieved ? <span className="shrink-0 text-[11px] text-[var(--success)]">✓</span> : null}
                  </div>
                  <ProgressBar pct={milestonePct(m)} tone={m.achieved ? 'success' : 'neutral'} className="mt-2" />
                  <p className="mt-1.5 text-[10px] tabular-nums text-[var(--text-muted)]">
                    {shown(m.value)} / {shown(m.target)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

/* ── local bits ─────────────────────────────────────────────────────────── */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className={LABEL}>{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-[var(--text-primary)]" title={value}>
        {value}
      </p>
    </div>
  );
}

/**
 * One hero stat. The card is a full-height column with the value pushed to the
 * bottom, so a label that wraps to two lines ("1st deposits") does not shove its
 * number below the neighbours' - all three values sit on one baseline.
 */
function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase leading-tight tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-auto pt-1 text-base font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

/**
 * `2026-02` -> `Feb`. Built from the calendar fields rather than `new Date(str)`,
 * which would read the key as UTC midnight and can shift the month west.
 */
function monthLabel(period: string): string {
  const [y, mo] = period.split('-').map(Number);
  if (!y || !mo || mo < 1 || mo > 12) return period;
  return new Date(y, mo - 1, 1).toLocaleString(undefined, { month: 'short' });
}

/** Monthly earnings as bars. Hovering a bar reveals its exact amount. */
function MonthBars({ months, currency }: { months: { period: string; amountMinor: number }[]; currency: string }) {
  const max = months.reduce((m, x) => Math.max(m, x.amountMinor), 0);
  return (
    <div className="flex h-40 items-end gap-2 sm:gap-3">
      {months.map((m) => {
        const pct = max ? Math.max(2, (m.amountMinor / max) * 100) : 2;
        return (
          <div key={m.period} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] font-semibold tabular-nums text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
              {formatMoneyCompact(m.amountMinor)}
            </span>
            <div
              className="w-full rounded-t-md bg-[linear-gradient(180deg,#E7C873,#C89F3F_70%,rgba(200,159,63,0.25))] transition-[filter,height] duration-500 group-hover:brightness-110"
              style={{ height: `${pct}%` }}
              title={formatMoney(m.amountMinor, currency)}
            />
            <span className="text-[10px] text-[var(--text-muted)]">{monthLabel(m.period)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgramStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['affiliate', 'dashboard'] });
    },
  });
  const placeholder =
    m === 'bank'
      ? 'Account name, number, bank & branch'
      : m === 'usdt'
        ? 'USDT wallet address (and network)'
        : m === 'other'
          ? 'Payout account details'
          : 'Account / wallet number';
  return (
    <SectionCard title="Payout method" hint="Where to send your commission. Shown to the operator when they pay you out.">
      <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
        <select
          value={m}
          onChange={(e) => setM(e.target.value)}
          className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--line-strong)] focus:border-[var(--gold-a55)]"
        >
          {PAYOUT_METHODS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[var(--bg-elevated)]">
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={d}
          onChange={(e) => setD(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:border-[var(--line-strong)] focus:border-[var(--gold-a55)]"
        />
        <button onClick={() => save.mutate()} disabled={save.isPending || !d.trim()} className={BTN_PRIMARY}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {save.isSuccess && (
        <p className="mt-2 text-xs text-success">Saved — operators will pay to this {PAYOUT_METHODS.find((x) => x.value === m)?.label}.</p>
      )}
      {save.isError && <p className="mt-2 text-xs text-danger">Could not save — please try again.</p>}
    </SectionCard>
  );
}
