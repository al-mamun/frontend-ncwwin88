/**
 * Affiliate portal REPORTING service.
 *
 * Kept separate from `affiliate.service.ts` (auth + onboarding + dashboard) so the
 * reporting surface can grow without turning that file into a grab bag. Every call
 * goes through the affiliate-surface client: cookie auth, no JWT in JS.
 *
 * All money is in MINOR units on the wire. Formatting happens in the UI only.
 */
import { affiliateFetch } from '../lib/affiliate-api';

/* ────────────────────────────────────────────────────────────────────────────
 * Shared shapes
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ReportColumn {
  key: string;
  label: string;
}

export interface Paged<T> {
  currency: string;
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  columns: ReportColumn[];
}

export interface ReportQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  keyword?: string;
  player?: string;
  scope?: 'player' | 'downline' | 'self';
}

function qs(params: Record<string, string | number | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    s.set(k, String(v));
  }
  const q = s.toString();
  return q ? `?${q}` : '';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Overview period grid
 * ──────────────────────────────────────────────────────────────────────────── */

export const OVERVIEW_PERIODS = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'] as const;
export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];

export const OVERVIEW_METRICS = [
  'registrations',
  'firstDeposits',
  'deposits',
  'withdrawals',
  'bonus',
  'referralCommission',
  'turnover',
  'profitLoss',
  'activePlayers',
] as const;
export type OverviewMetric = (typeof OVERVIEW_METRICS)[number];

export interface OverviewBucket {
  count: number;
  amountMinor: number;
}

export interface AffiliateOverview {
  currency: string;
  /** ISO instant the snapshot was taken. */
  generatedAt: string;
  /** Half-open [from, to) ISO bounds per column, so the UI can label each range. */
  periods: Record<OverviewPeriod, { from: string; to: string }>;
  metrics: Record<OverviewMetric, Record<OverviewPeriod, OverviewBucket>>;
  /**
   * Per-metric total over the UNION of the six periods, counted once — the
   * periods overlap (today ⊂ thisWeek ⊂ thisMonth), so summing the grid would
   * double-count.
   */
  totals: Record<OverviewMetric, OverviewBucket>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Daily activity series (dashboard charts)
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * One calendar day of activity. Every day in the requested span is present,
 * including days with nothing on them - a chart that silently omits empty days
 * draws a slope that did not happen.
 *
 * `date` is a LOCAL day key (YYYY-MM-DD) produced server-side from local
 * calendar fields, so parse it with `new Date(y, m - 1, d)` and never with
 * `new Date(dateString)`, which would read it as UTC midnight and shift the
 * point a day west.
 */
export interface SeriesPoint {
  date: string;
  registrations: number;
  firstDeposits: number;
  activePlayers: number;
  depositCount: number;
  depositsMinor: number;
  withdrawalsMinor: number;
  turnoverMinor: number;
  profitLossMinor: number;
  bonusMinor: number;
  commissionMinor: number;
}

export type SeriesTotals = Omit<SeriesPoint, 'date'>;

export interface AffiliateSeries {
  currency: string;
  from: string;
  to: string;
  days: number;
  points: SeriesPoint[];
  /**
   * Span totals. `activePlayers` here is the count of DISTINCT players active
   * at any point in the span, which is deliberately not the sum of the daily
   * figures - one player betting on ten days is one active player, not ten.
   */
  totals: SeriesTotals;
  /**
   * Registration -> first deposit -> actually playing. The platform has no
   * click tracking, so the funnel starts at registration rather than inventing
   * an impressions number.
   */
  funnel: {
    registrations: number;
    firstDeposits: number;
    activePlayers: number;
    referredTotal: number;
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Report rows
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RegistrationRow {
  /** Opaque, stable row identity — safe to use as a React key across sorts. */
  id: string;
  username: string;
  keyword: string;
  currency: string;
  registeredAt: string | null;
  firstDepositAt: string | null;
  firstDepositMinor: number;
}

export interface RegistrationReport extends Paged<RegistrationRow> {
  pageTotals: { count: number; firstDepositMinor: number };
  grandTotals: { count: number; firstDepositMinor: number };
}

export interface PerformanceRow {
  /** Opaque, stable row identity — safe to use as a React key across sorts. */
  id: string;
  username: string;
  keyword: string;
  country: string;
  currency: string;
  registeredAt: string | null;
  firstDepositAt: string | null;
  depositsMinor: number;
  depositCount: number;
  withdrawalsMinor: number;
  withdrawalCount: number;
  betCount: number;
  turnoverMinor: number;
  profitLossMinor: number;
  bonusMinor: number;
  commissionMinor: number;
  adjustmentMinor: number;
}

/**
 * Column totals. `count` is the number of rows summed — the API sends it, the footer shows it.
 *
 * `id` is omitted along with the other per-player fields: a totals row is not a
 * player and has no row identity to carry.
 */
export type PerformanceTotals = Omit<
  PerformanceRow,
  'id' | 'username' | 'keyword' | 'country' | 'currency' | 'registeredAt' | 'firstDepositAt'
> & { count: number };

export interface PerformanceReport extends Paged<PerformanceRow> {
  pageTotals: PerformanceTotals;
  grandTotals: PerformanceTotals;
}

export interface CommissionStatementRow {
  period: string;
  startDate: string | null;
  currency: string;
  netProfitMinor: number;
  commissionMinor: number;
  reversedMinor: number;
  entries: number;
  status: 'approved' | 'reversed';
}

export interface CommissionReport {
  currency: string;
  items: CommissionStatementRow[];
  total: number;
  columns: ReportColumn[];
  grandTotals: { netProfitMinor: number; commissionMinor: number };
}

export interface MemberRow {
  id: string;
  registeredAt: string | null;
  username: string;
  keyword: string;
  lastLoginIp: string;
  lastLoginAt: string | null;
  lastDepositAt: string | null;
  currency: string;
}

export type MemberReport = Paged<MemberRow>;

export interface MemberQuery {
  registeredFrom?: string;
  registeredTo?: string;
  username?: string;
  lastLoginIp?: string;
  lastDepositSince?: string;
  page?: number;
  limit?: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Earnings + hierarchy
 * ──────────────────────────────────────────────────────────────────────────── */

export interface EarningsLine {
  key: string;
  label: string;
  amountMinor: number;
  kind: 'info' | 'add' | 'subtract' | 'subtotal' | 'total';
}

export interface EarningsBreakdown {
  currency: string;
  periodLabel: string;
  periodStart: string;
  ratePercent: number | null;
  lines: EarningsLine[];
  context: {
    depositsMinor: number;
    withdrawalsMinor: number;
    cpaMinor: number;
    revenueShareMinor: number;
    bonusCommissionMinor: number;
    adjustmentMinor: number;
    pendingMinor: number;
    availableMinor: number;
    paidMinor: number;
    lifetimeMinor: number;
  };
}

export interface HierarchyNode {
  id: string;
  code: string;
  displayName: string;
  status: string;
  signups: number;
  ftdCount: number;
  lifetimeCommissionMinor: number;
}

export interface HierarchyTreeNode extends HierarchyNode {
  children: HierarchyTreeNode[];
  /**
   * This node has sub-affiliates below it that the requested depth cut off.
   * `children: []` alone cannot be trusted to mean "no one below" — and since
   * nothing is rolled up, the hidden partners are not counted anywhere else.
   */
  truncated: boolean;
}

export interface AffiliateHierarchy {
  self: HierarchyNode;
  upline: HierarchyNode[];
  downline: HierarchyTreeNode[];
  maxDepth: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * CSV export
 * ──────────────────────────────────────────────────────────────────────────── */

export type ExportableReport = 'registrations' | 'performance' | 'commission' | 'members';

export interface CsvExport {
  filename: string;
  rowCount: number;
  truncated: boolean;
  csv: string;
}

/**
 * The API returns the CSV as a string rather than a file body, because the portal
 * authenticates with a surface header the browser cannot attach to a plain
 * `<a download>` navigation. We turn it into a download client-side instead.
 */
export function downloadCsv(result: CsvExport): void {
  // BOM so Excel opens UTF-8 (Bengali/Hindi usernames) without mojibake.
  const blob = new Blob(['﻿', result.csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick — revoking synchronously can cancel the download in
  // some Chromium builds before the blob has been read.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Partner status — rev-share ladder, week-to-date progress, milestones
 * ──────────────────────────────────────────────────────────────────────────── */

/** One rung of the program's revenue-share ladder. Floor-and-rate, not a range. */
export interface PartnerTier {
  name: string;
  minNgrMinor: number;
  revenueSharePercent: number;
}

/**
 * One achievement. `label` carries a literal `{target}` placeholder that the UI
 * substitutes, so the number is formatted in the partner's own currency and
 * grouping rather than however the server happened to render it.
 */
export interface PartnerMilestone {
  key: string;
  label: string;
  value: number;
  target: number;
  achieved: boolean;
  kind: 'count' | 'money';
}

/**
 * `GET /affiliate/status`. A projection, not a settlement: the week's numbers
 * move until Monday's accrual run makes them real.
 *
 * `ladder.active` is false whenever the rate cannot climb — no program, a
 * non-rev-share model, no rungs configured, or an admin override pinning this
 * partner to a fixed rate. Render nothing rather than a ladder nobody can move up.
 */
export interface PartnerStatus {
  currency: string;
  week: { label: string; start: string; end: string };
  revenue: {
    betsMinor: number;
    winsMinor: number;
    refundsMinor: number;
    bonusMinor: number;
    /**
     * Wagering funded by the house rather than by the player - bonus balance,
     * free spins, manual credits. It is stripped out before the deposit ceiling
     * is worked out, because money the house handed over is not money a player
     * lost from their own pocket.
     */
    houseCreditsMinor: number;
    /** Deposits less withdrawals, lifetime, across this partner's players. */
    netRealMinor: number;
    /** How much of `netRealMinor` has not already been paid commission on. */
    headroomMinor: number;
    /** `ngrMinor` after the deposit ceiling is applied. This is what pays. */
    eligibleMinor: number;
    /** True when the ceiling is what is holding the commission down, not the NGR. */
    cappedByDeposits: boolean;
    ggrMinor: number;
    ngrMinor: number;
    carryoverMinor: number;
    runningMinor: number;
    projectedCommissionMinor: number;
    /** Outstanding overpayment still being recovered out of future accruals. */
    debtMinor: number;
    /** What this week would actually credit once `debtMinor` is recovered. */
    projectedCreditMinor: number;
  };
  rate: {
    percent: number;
    source: 'override' | 'tier' | 'program';
    tierName: string | null;
    /** -1 when the running total has not reached even the first rung. */
    tierIndex: number;
  };
  ladder: {
    active: boolean;
    tiers: PartnerTier[];
    nextTier: (PartnerTier & { gapMinor: number }) | null;
    progressPct: number;
  };
  lifetime: {
    referredPlayers: number;
    signups: number;
    ftdCount: number;
    ngrMinor: number;
    commissionMinor: number;
    paidMinor: number;
    availableMinor: number;
    pendingMinor: number;
  };
  milestones: PartnerMilestone[];
  payout: {
    minPayoutMinor: number;
    availableMinor: number;
    ready: boolean;
    shortfallMinor: number;
    progressPct: number;
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * API
 * ──────────────────────────────────────────────────────────────────────────── */

export const affiliateReportsApi = {
  overview(): Promise<AffiliateOverview> {
    return affiliateFetch<AffiliateOverview>('/affiliate/overview');
  },

  /** Tier ladder, week-to-date rate and milestones. Read-only; accrues nothing. */
  status(): Promise<PartnerStatus> {
    return affiliateFetch<PartnerStatus>('/affiliate/status');
  },

  /** Daily series for the dashboard charts. The server clamps `days` to 7-180. */
  series(days = 30): Promise<AffiliateSeries> {
    return affiliateFetch<AffiliateSeries>(`/affiliate/overview/series${qs({ days })}`);
  },

  registrations(p: ReportQuery = {}): Promise<RegistrationReport> {
    return affiliateFetch<RegistrationReport>(
      `/affiliate/reports/registrations${qs({ from: p.from, to: p.to, page: p.page, limit: p.limit, keyword: p.keyword })}`,
    );
  },

  performance(p: ReportQuery = {}): Promise<PerformanceReport> {
    return affiliateFetch<PerformanceReport>(
      `/affiliate/reports/performance${qs({ from: p.from, to: p.to, page: p.page, limit: p.limit, scope: p.scope, player: p.player, keyword: p.keyword })}`,
    );
  },

  commission(p: ReportQuery = {}): Promise<CommissionReport> {
    return affiliateFetch<CommissionReport>(
      `/affiliate/reports/commission${qs({ from: p.from, to: p.to, scope: p.scope })}`,
    );
  },

  members(p: MemberQuery = {}): Promise<MemberReport> {
    return affiliateFetch<MemberReport>(
      `/affiliate/members/search${qs({
        registeredFrom: p.registeredFrom,
        registeredTo: p.registeredTo,
        username: p.username,
        lastLoginIp: p.lastLoginIp,
        lastDepositSince: p.lastDepositSince,
        page: p.page,
        limit: p.limit,
      })}`,
    );
  },

  earningsBreakdown(): Promise<EarningsBreakdown> {
    return affiliateFetch<EarningsBreakdown>('/affiliate/earnings/breakdown');
  },

  hierarchy(depth = 3): Promise<AffiliateHierarchy> {
    return affiliateFetch<AffiliateHierarchy>(`/affiliate/hierarchy${qs({ depth })}`);
  },

  exportReport(report: ExportableReport, p: ReportQuery & MemberQuery = {}): Promise<CsvExport> {
    return affiliateFetch<CsvExport>(
      `/affiliate/reports/${report}/export${qs({
        from: p.from ?? p.registeredFrom,
        to: p.to ?? p.registeredTo,
        scope: p.scope,
        player: p.player,
        keyword: p.keyword,
        username: p.username,
        lastLoginIp: p.lastLoginIp,
        lastDepositSince: p.lastDepositSince,
      })}`,
    );
  },
};
