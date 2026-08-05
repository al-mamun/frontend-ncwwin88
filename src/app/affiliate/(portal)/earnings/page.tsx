/**
 * Earnings — where the money came from, what is still owed, and when it can be
 * withdrawn.
 *
 * Three bands, in the order the questions actually get asked:
 *
 *  1. Balances. "How much do I have" is why anyone opens this page, so it is the
 *     first thing on it. Available is the only figure that is withdrawable, so it
 *     is the only one in gold.
 *  2. This month's statement. The server returns an ordered waterfall (turnover →
 *     revenue → deductions → carry-forward → earnings) and it is rendered as an
 *     accounting statement rather than a chart: a partner disputing a figure needs
 *     to see the arithmetic, not a shape.
 *  3. History. Closed accrual periods, so the running month has something to be
 *     read against — a single month in isolation says nothing about direction.
 *
 * Every query here is `retry: false` and every card collapses to nothing when its
 * data is absent. An operator on an older backend has no /affiliate/earnings/
 * breakdown, and a page that quietly shows less is a better outcome than an error
 * panel stacked over the parts that do work.
 */
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliateReportsApi, type EarningsLine } from '@/services/affiliate-reports.service';
import { Donut, type DonutSlice } from '@/components/affiliate/portal-charts';
import { WithdrawCard } from '@/components/affiliate/WithdrawCard';
import {
  Badge,
  EmptyState,
  ErrorNote,
  LABEL,
  ProgressBar,
  SectionCard,
  Skeleton,
  formatDate,
  formatInt,
  formatMoney,
  formatMoneyCompact,
} from '@/components/affiliate/portal-ui';

/* ── local bits ──────────────────────────────────────────────────────────── */

/** `2026-07` → `July 2026`. Anything that is not a month key is passed through. */
function monthLabel(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  return new Date(+m[1], +m[2] - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** One balance. Only `gold` is withdrawable money — see the file header. */
function BalanceTile({
  label,
  value,
  hint,
  tone = 'plain',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'plain' | 'gold' | 'muted';
}) {
  const figure =
    tone === 'gold'
      ? 'aff-gold-text'
      : tone === 'muted'
        ? 'text-[var(--text-secondary)]'
        : 'text-[var(--text-primary)]';
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${
        tone === 'gold'
          ? 'border-[var(--gold-a35)] bg-[var(--gold-a06)]'
          : 'border-[var(--line)] bg-[var(--bg-surface)]'
      }`}
    >
      <p className={LABEL}>{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${figure}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

/**
 * One line of the waterfall. `kind` carries all the meaning, so the styling is
 * driven entirely off it rather than off the label text:
 *
 *  - `info`      context, not part of the sum. Muted, so the eye skips it when
 *                adding the column up.
 *  - `add`       a positive contribution.
 *  - `subtract`  a deduction. The server already sends these negative, so the
 *                sign is real rather than something this component paints on.
 *  - `subtotal`  ruled above, because a rule is how a statement says "so far".
 *  - `total`     the payable figure. The only gold on the card.
 */
function StatementRow({ line, currency }: { line: EarningsLine; currency: string }) {
  const { kind, amountMinor } = line;
  const total = kind === 'total';
  const subtotal = kind === 'subtotal';
  const info = kind === 'info';

  const rowRule = total
    ? 'mt-1.5 border-t border-[var(--gold-a35)] pt-3.5'
    : subtotal
      ? 'mt-1 border-t border-[var(--line-strong)] pt-3'
      : '';

  const labelTone = total
    ? 'font-semibold text-[var(--text-primary)]'
    : subtotal
      ? 'font-medium text-[var(--text-primary)]'
      : info
        ? 'text-[var(--text-muted)]'
        : 'text-[var(--text-secondary)]';

  const valueTone = total
    ? 'aff-gold-text text-xl font-bold'
    : subtotal
      ? 'text-base font-semibold text-[var(--text-primary)]'
      : amountMinor < 0
        ? 'text-sm text-[var(--danger)]'
        : info
          ? 'text-sm text-[var(--text-muted)]'
          : 'text-sm text-[var(--text-primary)]';

  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${rowRule}`}>
      <p className={`text-sm leading-snug ${labelTone}`}>{line.label}</p>
      <p className={`shrink-0 tabular-nums ${valueTone}`}>{formatMoney(amountMinor, currency)}</p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function EarningsPage() {
  // Month-to-date aggregation across every referred player. Not a cheap query,
  // and the answer does not move faster than play does.
  const breakdownQ = useQuery({
    queryKey: ['affiliate', 'earnings', 'breakdown'],
    queryFn: () => affiliateReportsApi.earningsBreakdown(),
    staleTime: 60_000,
    retry: false,
  });

  // Closed periods only, so this is effectively immutable within a session — but
  // it shares its key with the commission report, which is the point: opening
  // both pages costs one request, not two.
  const historyQ = useQuery({
    queryKey: ['affiliate', 'report', 'commission', { from: undefined, to: undefined, scope: 'self' }],
    queryFn: () => affiliateReportsApi.commission({ scope: 'self' }),
    staleTime: 300_000,
    retry: false,
  });

  // Same key the dashboard uses, so navigating here serves it from cache. Only
  // the `payout` half is read; the ladder belongs on the dashboard.
  const statusQ = useQuery({
    queryKey: ['affiliate', 'status'],
    queryFn: () => affiliateReportsApi.status(),
    staleTime: 120_000,
    retry: false,
  });

  const data = breakdownQ.data;
  const currency = data?.currency ?? historyQ.data?.currency ?? '';
  const ctx = data?.context;
  const payout = statusQ.data?.payout;

  const mix: DonutSlice[] = useMemo(() => {
    if (!ctx) return [];
    return (
      [
        { key: 'revenueShare', label: 'Revenue share', value: ctx.revenueShareMinor, tone: 'gold' as const },
        { key: 'cpa', label: 'CPA', value: ctx.cpaMinor, tone: 'amber' as const },
        { key: 'bonus', label: 'Bonus commission', value: ctx.bonusCommissionMinor, tone: 'info' as const },
        { key: 'adjustment', label: 'Adjustments', value: ctx.adjustmentMinor, tone: 'success' as const },
      ]
        // A zero slice draws nothing but still claims a legend row, which reads as
        // "you have a CPA arrangement that paid nothing" rather than "you have none".
        .filter((s) => s.value > 0)
    );
  }, [ctx]);

  /**
   * The real approved figure, including anything negative.
   *
   * A donut cannot draw a negative wedge, so `mix` drops them — but summing the
   * drawn slices for the centre number would print a total higher than the money
   * actually approved whenever an adjustment claws something back. The centre
   * label reports the account; the wedges report what can be drawn.
   */
  const approvedTotalMinor = useMemo(() => {
    if (!ctx) return 0;
    return (ctx.revenueShareMinor || 0) + (ctx.cpaMinor || 0) + (ctx.bonusCommissionMinor || 0) + (ctx.adjustmentMinor || 0);
  }, [ctx]);

  // Newest first: the most recent closed period is the one being compared against.
  const history = useMemo(() => {
    const rows = historyQ.data?.items ?? [];
    return [...rows].sort((a, b) => (b.period ?? '').localeCompare(a.period ?? '')).slice(0, 12);
  }, [historyQ.data]);

  const maxCommission = useMemo(
    () => history.reduce((m, r) => Math.max(m, Math.abs(r.commissionMinor || 0)), 0),
    [history],
  );

  return (
    <div className="aff-rise space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Earnings</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
            What your referrals produced this month, how that became commission, and what is available to withdraw.
          </p>
        </div>
        {data?.ratePercent != null ? <Badge tone="gold">{data.ratePercent}% rev share</Badge> : null}
      </header>

      {/*
        Collapsing to nothing is the right behaviour for a backend that has never
        heard of these routes; it is the wrong behaviour for one that tried and
        failed, because "No settled periods yet" then states as fact something
        nobody checked. One note covers the page — the cards still degrade
        quietly underneath it rather than being replaced by an error panel.
      */}
      <ErrorNote
        error={breakdownQ.error ?? historyQ.error ?? statusQ.error}
        paused={breakdownQ.isPaused || historyQ.isPaused || statusQ.isPaused}
      />

      {/* ── Balances ─────────────────────────────────────────────────────── */}
      {breakdownQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />
          ))}
        </div>
      ) : ctx ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BalanceTile
            label="Available"
            value={formatMoney(ctx.availableMinor, currency)}
            hint="Cleared and withdrawable"
            tone="gold"
          />
          <BalanceTile
            label="Pending"
            value={formatMoney(ctx.pendingMinor, currency)}
            hint="Earned Monday, available Tuesday"
            tone="muted"
          />
          <BalanceTile label="Paid to date" value={formatMoney(ctx.paidMinor, currency)} hint="Already withdrawn" />
          <BalanceTile
            label="Lifetime earned"
            value={formatMoney(ctx.lifetimeMinor, currency)}
            hint="Every commission ever approved"
          />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ── Statement ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <SectionCard
            title="This month's statement"
            hint={
              data
                ? `${monthLabel(data.periodLabel)} · running total, settles when the period closes`
                : 'Running total, settles when the period closes'
            }
          >
            {breakdownQ.isLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : !data ? (
              <EmptyState
                title="No statement available"
                hint="This portal could not reach the earnings breakdown. Your balances and commission reports are unaffected."
              />
            ) : (
              <>
                <div>
                  {data.lines.map((line) => (
                    <StatementRow key={line.key} line={line} currency={currency} />
                  ))}
                </div>

                {/* Deposits and withdrawals are the players' money, not the partner's.
                    They sit below a divider and outside the sum for exactly that
                    reason — they explain the turnover above without joining it. */}
                {ctx ? (
                  <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
                    <div>
                      <p className={LABEL}>Player deposits</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-[var(--text-primary)]">
                        {formatMoney(ctx.depositsMinor, currency)}
                      </p>
                    </div>
                    <div>
                      <p className={LABEL}>Player withdrawals</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-[var(--text-secondary)]">
                        {formatMoney(ctx.withdrawalsMinor, currency)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </SectionCard>
        </div>

        {/* ── Payout readiness + mix ─────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          {/*
            The withdrawal control sits ABOVE the readiness meter on purpose: a
            partner opening this page wants to move their money, not read about
            whether they could. The meter below still explains a shortfall when
            there is one.
          */}
          <WithdrawCard currency={currency} />

          {payout ? (
            <SectionCard
              title="Payout readiness"
              actions={
                payout.ready ? (
                  <Badge tone="success">Ready</Badge>
                ) : (
                  <Badge tone="neutral">{Math.round(payout.progressPct)}%</Badge>
                )
              }
            >
              <p className="text-2xl font-bold tabular-nums aff-gold-text">
                {formatMoney(payout.availableMinor, currency)}
              </p>
              {payout.minPayoutMinor > 0 ? (
                <>
                  <ProgressBar
                    pct={payout.progressPct}
                    tone={payout.ready ? 'success' : 'gold'}
                    className="mt-3"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {payout.ready ? (
                      <>
                        You are above the {formatMoney(payout.minPayoutMinor, currency)} minimum — this balance can be
                        withdrawn.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {formatMoney(payout.shortfallMinor, currency)}
                        </span>{' '}
                        more to reach the {formatMoney(payout.minPayoutMinor, currency)} minimum payout.
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  This program sets no minimum — anything cleared can be withdrawn.
                </p>
              )}
            </SectionCard>
          ) : null}

          <SectionCard title="Commission mix" hint="Approved this month, by how it was earned">
            {breakdownQ.isLoading ? (
              <Skeleton className="h-[132px] w-full" />
            ) : !data ? (
              /*
               * Guarded on `data`, not left to the donut's own empty state. With
               * `ctx` undefined the donut draws no wedges and the centre reads
               * 0.00 under "Approved this month" — two confident assertions about
               * the partner's money made from a request that never returned. The
               * statement card beside this one already draws that distinction;
               * this card was the one place still answering as if it knew.
               */
              <EmptyState
                title="Mix unavailable"
                hint="This portal could not reach the earnings breakdown, so the split by commission type is unknown."
              />
            ) : (
              <Donut
                slices={mix}
                centerLabel="Approved this month"
                centerValue={formatMoneyCompact(approvedTotalMinor, currency)}
                emptyText="No commission approved yet this month."
              />
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── History ──────────────────────────────────────────────────────── */}
      <SectionCard
        title="Closed periods"
        hint="The last twelve settled accrual periods, newest first"
        actions={
          historyQ.data?.grandTotals ? (
            <span className="text-xs tabular-nums text-[var(--text-muted)]">
              {formatMoney(historyQ.data.grandTotals.commissionMinor, currency)} all time
            </span>
          ) : null
        }
      >
        {historyQ.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !historyQ.data ? (
          // Same distinction as the mix card: an empty list because the period
          // history never loaded is not the same claim as "nothing has settled".
          <EmptyState
            title="History unavailable"
            hint="This portal could not reach your closed periods. Your balances and commission reports are unaffected."
          />
        ) : !history.length ? (
          <EmptyState
            title="No settled periods yet"
            hint="Commission is written once an accrual period closes. Your first statement appears after that run."
          />
        ) : (
          <ul className="space-y-1.5">
            {history.map((r) => {
              // Bars are relative to the best period on show, not to an absolute
              // scale — the question this answers is "which months were strong",
              // and a fixed axis would flatten every row on a modest account.
              const pct = maxCommission > 0 ? (Math.abs(r.commissionMinor) / maxCommission) * 100 : 0;
              return (
                <li
                  key={r.period}
                  className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-white/[0.02] px-3.5 py-2.5"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 bg-[var(--gold-a06)]"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {monthLabel(r.period)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        from {formatDate(r.startDate)} · {formatInt(r.entries)} entr{r.entries === 1 ? 'y' : 'ies'}
                        {r.reversedMinor ? (
                          <>
                            {' · '}
                            <span className="text-[var(--danger)]">
                              {formatMoneyCompact(r.reversedMinor, currency)} reversed
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold tabular-nums text-[var(--gold)]">
                        {formatMoney(r.commissionMinor, currency)}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">
                        on {formatMoneyCompact(r.netProfitMinor, currency)} net
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
