/**
 * Player performance report — the widest table in the portal.
 *
 * Sixteen columns of per-player money and volume, server-aggregated. Two scopes:
 * `player` (your own referrals) and `downline` (rolled up through your
 * sub-affiliates), because a sub-affiliate's players are earnings too and hiding
 * them behind a separate screen makes the numbers impossible to reconcile.
 */
'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  affiliateReportsApi,
  downloadCsv,
  type PerformanceRow,
  type PerformanceTotals,
} from '@/services/affiliate-reports.service';
import {
  Column,
  DataTable,
  DateRangeFilter,
  ErrorNote,
  ExportButton,
  FilterChips,
  Money,
  Pager,
  ReportShell,
  SearchField,
  SegmentedControl,
  SummaryStat,
  SummaryStrip,
  formatDate,
  formatInt,
  formatMoney,
  type DateRange,
} from '@/components/affiliate/portal-ui';
import { usePortalFeatures } from '@/providers/affiliate-auth-provider';

const LIMIT = 25;
/*
 * The two scopes return DIFFERENT KINDS OF ROW, which the hints have to say
 * plainly: `player` is one row per player, `downline` is one row per direct
 * sub-affiliate. The downline hint used to promise "your players plus everyone
 * referred by your sub-affiliates", which described neither — the partner's own
 * players are not in that scope at all, and nothing is per-player.
 */
const SCOPES = [
  { key: 'player' as const, label: 'My players', hint: 'One row per player who registered through your own link.' },
  { key: 'downline' as const, label: 'Downline', hint: 'One row per direct sub-affiliate, totalling the players they referred.' },
];

export default function PerformanceReportPage() {
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [scopeChoice, setScopeChoice] = useState<'player' | 'downline'>('player');
  const [player, setPlayer] = useState('');
  const [page, setPage] = useState(1);
  const { subAffiliates } = usePortalFeatures();

  /*
   * Pinned rather than merely hidden. If the switch is turned off while a
   * partner is sitting on the downline view, the stale `scopeChoice` would keep
   * requesting a downline report with no control left to get back out of it —
   * so the effective scope is derived, and the stored choice is ignored.
   */
  const scope: 'player' | 'downline' = subAffiliates ? scopeChoice : 'player';

  const params = {
    from: range.from || undefined,
    to: range.to || undefined,
    scope,
    player: player || undefined,
  };

  const q = useQuery({
    queryKey: ['affiliate', 'report', 'performance', params, page],
    queryFn: () => affiliateReportsApi.performance({ ...params, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const currency = q.data?.currency ?? '';
  const pt: PerformanceTotals | undefined = q.data?.pageTotals;
  const gt: PerformanceTotals | undefined = q.data?.grandTotals;

  /** money column with a page-subtotal footer, so the footer can never drift from the body */
  const moneyCol = (
    key: keyof PerformanceRow & keyof PerformanceTotals,
    label: string,
    signed = false,
  ): Column<PerformanceRow> => ({
    key,
    label,
    numeric: true,
    render: (r) => <Money minor={r[key] as number} signed={signed} />,
    sortValue: (r) => (r[key] as number) ?? 0,
    footer: pt ? formatMoney(pt[key] as number) : undefined,
  });

  const countCol = (
    key: keyof PerformanceRow & keyof PerformanceTotals,
    label: string,
  ): Column<PerformanceRow> => ({
    key,
    label,
    numeric: true,
    render: (r) => formatInt(r[key] as number),
    sortValue: (r) => (r[key] as number) ?? 0,
    footer: pt ? formatInt(pt[key] as number) : undefined,
  });

  /*
   * In downline scope a row is a sub-affiliate, not a player, so the two
   * identity columns and the "N on this page" footer have to be renamed with
   * it. Leaving them as "Player" and "Keyword" made a partner scan the list for
   * a player name that was never going to be there.
   */
  const isDownline = scope === 'downline';
  const subjectLabel = isDownline ? 'Sub-affiliate' : 'Player';

  const columns: Column<PerformanceRow>[] = [
    {
      key: 'username',
      label: subjectLabel,
      render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.username}</span>,
      sortValue: (r) => r.username ?? '',
      footer: pt
        ? `${formatInt(pt.count)} ${isDownline ? 'sub-affiliate' : 'player'}${pt.count === 1 ? '' : 's'} on this page`
        : undefined,
    },
    {
      key: 'keyword',
      label: isDownline ? 'Code' : 'Keyword',
      render: (r) => r.keyword || <span className="text-[var(--text-muted)]">—</span>,
      sortValue: (r) => r.keyword ?? '',
    },
    {
      key: 'country',
      label: 'Country',
      render: (r) => r.country || <span className="text-[var(--text-muted)]">—</span>,
      sortValue: (r) => r.country ?? '',
    },
    {
      key: 'registeredAt',
      label: 'Registered',
      render: (r) => formatDate(r.registeredAt),
      sortValue: (r) => r.registeredAt ?? '',
    },
    {
      key: 'firstDepositAt',
      label: 'FTD',
      render: (r) => formatDate(r.firstDepositAt),
      sortValue: (r) => r.firstDepositAt ?? '',
    },
    moneyCol('depositsMinor', 'Deposits'),
    countCol('depositCount', 'Dep #'),
    moneyCol('withdrawalsMinor', 'Withdrawals'),
    countCol('withdrawalCount', 'Wd #'),
    countCol('betCount', 'Bets'),
    moneyCol('turnoverMinor', 'Turnover'),
    moneyCol('profitLossMinor', 'Player P&L', true),
    moneyCol('bonusMinor', 'Bonus'),
    moneyCol('commissionMinor', 'Commission'),
    moneyCol('adjustmentMinor', 'Adjustments', true),
    {
      key: 'currency',
      label: 'Ccy',
      render: (r) => r.currency || currency,
      sortValue: (r) => r.currency || currency,
    },
  ];

  return (
    <ReportShell
      title={isDownline ? 'Downline performance' : 'Player performance'}
      description={
        isDownline
          ? 'One row per direct sub-affiliate: the deposits, turnover and player P&L generated by the players they referred, and the commission they earned in the selected range.'
          : 'Deposits, turnover, player P&L and the commission each referred player has generated in the selected range.'
      }
      actions={
        <ExportButton
          disabled={!q.data?.total}
          onExport={async () => downloadCsv(await affiliateReportsApi.exportReport('performance', params))}
        />
      }
      filters={
        <div className="space-y-3">
          <DateRangeFilter value={range} onChange={(r) => { setRange(r); setPage(1); }} />
          <div className="flex flex-wrap items-end justify-between gap-4">
            {subAffiliates ? (
              <SegmentedControl
                label="Report scope"
                value={scope}
                options={SCOPES}
                onChange={(k) => { setScopeChoice(k); setPage(1); }}
              />
            ) : (
              // The flex row is `justify-between`; with the control gone the search
              // field would jump to the left edge, so hold its column.
              <span aria-hidden />
            )}
            <SearchField
              label={subjectLabel}
              value={player}
              onApply={(v) => { setPlayer(v); setPage(1); }}
              placeholder={isDownline ? 'Search sub-affiliate name' : 'Search player username'}
            />
          </div>
          <FilterChips
            items={[
              {
                key: 'range',
                label: 'Dates',
                value: range.from || range.to ? `${range.from ? formatDate(range.from) : 'start'} → ${range.to ? formatDate(range.to) : 'now'}` : '',
                onClear: () => { setRange({ from: '', to: '' }); setPage(1); },
              },
              // Scope only shows as a chip when it is off the default, so the
              // chip row stays empty on an untouched report.
              {
                key: 'scope',
                label: 'Scope',
                value: scope === 'downline' ? 'Downline' : '',
                onClear: () => { setScopeChoice('player'); setPage(1); },
              },
              { key: 'player', label: subjectLabel, value: player, onClear: () => { setPlayer(''); setPage(1); } },
            ]}
          />
        </div>
      }
    >
      <ErrorNote error={q.error} paused={q.isPaused} />

      {gt ? (
        <SummaryStrip>
          <SummaryStat label={isDownline ? 'Sub-affiliates' : 'Players'} value={formatInt(gt.count)} />
          <SummaryStat label="Deposits" value={formatMoney(gt.depositsMinor, currency)} />
          <SummaryStat label="Withdrawals" value={formatMoney(gt.withdrawalsMinor, currency)} />
          <SummaryStat label="Turnover" value={formatMoney(gt.turnoverMinor, currency)} />
          <SummaryStat
            label="Player P&L"
            value={formatMoney(gt.profitLossMinor, currency)}
            tone={gt.profitLossMinor < 0 ? 'danger' : gt.profitLossMinor > 0 ? 'success' : 'plain'}
          />
          <SummaryStat label="Commission" value={formatMoney(gt.commissionMinor, currency)} tone="gold" />
        </SummaryStrip>
      ) : null}

      {/* `rowKey` is the row's own id, not its position: `i` is the POST-sort
          index, so keying on it renamed every row on any header click and React
          remounted the whole table instead of reordering it. */}
      <DataTable
        columns={columns}
        rows={q.data?.items ?? []}
        loading={q.isLoading || q.isPaused}
        failed={!!q.error}
        rowKey={(r) => r.id}
        empty={isDownline ? 'No sub-affiliate activity in this range.' : 'No player activity in this range.'}
        emptyHint={
          isDownline
            ? 'Widen the date range, clear the search, or switch back to your own players. This scope only lists partners you referred directly.'
            : 'Widen the date range, switch to the downline scope, or clear the player filter.'
        }
        minWidth={1400}
        showFooter
        paged
      />
      <Pager
        page={q.data?.page ?? 1}
        pages={q.data?.pages ?? 1}
        total={q.data?.total ?? 0}
        limit={q.data?.limit ?? LIMIT}
        onPage={setPage}
      />
      <p className="mt-3 text-[11px] text-[var(--text-muted)]">
        Totals above cover the whole filtered range; the row under the table is the subtotal for this page only.
      </p>
    </ReportShell>
  );
}
