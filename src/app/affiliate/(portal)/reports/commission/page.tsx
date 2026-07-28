/**
 * Commission statements — one row per accrual period.
 *
 * This is the report an affiliate reconciles against their bank, so reversals get
 * their own column rather than being silently netted into the headline figure:
 * seeing "commission 12,000 / reversed 400" is auditable, seeing "11,600" is not.
 *
 * Not paged — an affiliate has tens of periods, not thousands, and a single list
 * is easier to scan and total than four pages of five rows. That also means the
 * table's sort covers every row in range, so no `paged` caveat is shown.
 */
'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  affiliateReportsApi,
  downloadCsv,
  type CommissionStatementRow,
} from '@/services/affiliate-reports.service';
import {
  Column,
  DataTable,
  DateRangeFilter,
  ErrorNote,
  ExportButton,
  FilterChips,
  Money,
  ReportShell,
  SegmentedControl,
  SummaryStat,
  SummaryStrip,
  formatDate,
  formatInt,
  formatMoney,
  type DateRange,
} from '@/components/affiliate/portal-ui';
import { usePortalFeatures } from '@/providers/affiliate-auth-provider';

const SCOPES = [
  { key: 'self' as const, label: 'My commission', hint: 'Commission accrued on your own referrals.' },
  { key: 'downline' as const, label: 'Including downline', hint: 'Adds commission generated through your sub-affiliates.' },
];

export default function CommissionReportPage() {
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [scopeChoice, setScopeChoice] = useState<'self' | 'downline'>('self');
  const { subAffiliates } = usePortalFeatures();

  // Derived, not just hidden — see the note on the performance report: a stale
  // 'downline' choice must not survive the switch being turned off, or the
  // report keeps asking for downline totals with no way back to 'self'.
  const scope: 'self' | 'downline' = subAffiliates ? scopeChoice : 'self';

  const params = { from: range.from || undefined, to: range.to || undefined, scope };

  const q = useQuery({
    queryKey: ['affiliate', 'report', 'commission', params],
    queryFn: () => affiliateReportsApi.commission(params),
    placeholderData: keepPreviousData,
  });

  const currency = q.data?.currency ?? '';
  const gt = q.data?.grandTotals;
  const rows = q.data?.items ?? [];

  const columns: Column<CommissionStatementRow>[] = [
    {
      key: 'period',
      label: 'Period',
      render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.period}</span>,
      sortValue: (r) => r.period ?? '',
      // Conditional on `gt` for the same reason every money footer below is: this
      // is the label for the totals row, and without totals to sit beside it the
      // row renders as a period count followed by a line of empty money cells.
      footer: gt ? `${formatInt(rows.length)} period${rows.length === 1 ? '' : 's'}` : undefined,
    },
    {
      key: 'startDate',
      label: 'Starting',
      render: (r) => formatDate(r.startDate),
      sortValue: (r) => r.startDate ?? '',
    },
    {
      key: 'netProfitMinor',
      label: 'Net profit',
      numeric: true,
      render: (r) => <Money minor={r.netProfitMinor} signed />,
      sortValue: (r) => r.netProfitMinor ?? 0,
      footer: gt ? formatMoney(gt.netProfitMinor) : undefined,
    },
    {
      key: 'commissionMinor',
      label: 'Commission',
      numeric: true,
      render: (r) => <span className="font-semibold text-[var(--success)]">{formatMoney(r.commissionMinor)}</span>,
      sortValue: (r) => r.commissionMinor ?? 0,
      footer: gt ? formatMoney(gt.commissionMinor) : undefined,
    },
    {
      key: 'reversedMinor',
      label: 'Reversed',
      numeric: true,
      render: (r) =>
        r.reversedMinor
          ? <span className="text-[var(--danger)]">{formatMoney(r.reversedMinor)}</span>
          : <span className="text-[var(--text-muted)]">—</span>,
      sortValue: (r) => r.reversedMinor ?? 0,
    },
    {
      key: 'entries',
      label: 'Entries',
      numeric: true,
      render: (r) => formatInt(r.entries),
      sortValue: (r) => r.entries ?? 0,
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            r.status === 'reversed'
              ? 'bg-[var(--danger-a12)] text-[var(--danger)]'
              : 'bg-[var(--success-a12)] text-[var(--success)]'
          }`}
        >
          {r.status === 'reversed' ? 'Reversed' : 'Approved'}
        </span>
      ),
      sortValue: (r) => r.status ?? '',
    },
    {
      key: 'currency',
      label: 'Ccy',
      render: (r) => r.currency || currency,
      sortValue: (r) => r.currency || currency,
    },
  ];

  return (
    <ReportShell
      title="Commission statements"
      description="Your commission accrual period by period, with the net profit it was calculated from and anything later reversed."
      actions={
        <ExportButton
          disabled={!rows.length}
          onExport={async () => downloadCsv(await affiliateReportsApi.exportReport('commission', params))}
        />
      }
      filters={
        <div className="space-y-3">
          <DateRangeFilter value={range} onChange={setRange} />
          {subAffiliates ? (
            <SegmentedControl label="Commission scope" value={scope} options={SCOPES} onChange={setScopeChoice} />
          ) : null}
          <FilterChips
            items={[
              {
                key: 'range',
                label: 'Dates',
                value: range.from || range.to ? `${range.from ? formatDate(range.from) : 'start'} → ${range.to ? formatDate(range.to) : 'now'}` : '',
                onClear: () => setRange({ from: '', to: '' }),
              },
              {
                key: 'scope',
                label: 'Scope',
                value: scope === 'downline' ? 'Including downline' : '',
                onClear: () => setScopeChoice('self'),
              },
            ]}
          />
        </div>
      }
    >
      <ErrorNote error={q.error} paused={q.isPaused} />

      {gt ? (
        <SummaryStrip>
          <SummaryStat label="Net profit in range" value={formatMoney(gt.netProfitMinor, currency)} />
          <SummaryStat label="Commission earned" value={formatMoney(gt.commissionMinor, currency)} tone="gold" />
        </SummaryStrip>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        loading={q.isLoading || q.isPaused}
        failed={!!q.error}
        rowKey={(r) => r.period}
        empty="No commission statements in this range."
        emptyHint="Commission is written once a period closes — a range inside the current period will be empty."
        showFooter
      />
    </ReportShell>
  );
}
