/**
 * Registration report — who signed up through your link, and whether they funded.
 *
 * Server-paged and server-totalled: `pageTotals` covers the rows on screen,
 * `grandTotals` covers the whole filtered range. Showing both is the point —
 * a page subtotal on its own is easy to mistake for the range total.
 */
'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  affiliateReportsApi,
  downloadCsv,
  type RegistrationRow,
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
  SummaryStat,
  SummaryStrip,
  formatDate,
  formatDateTime,
  formatInt,
  formatMoney,
  type DateRange,
} from '@/components/affiliate/portal-ui';

const LIMIT = 25;

export default function RegistrationsReportPage() {
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const params = { from: range.from || undefined, to: range.to || undefined, keyword: keyword || undefined };

  const q = useQuery({
    queryKey: ['affiliate', 'report', 'registrations', params, page],
    queryFn: () => affiliateReportsApi.registrations({ ...params, page, limit: LIMIT }),
    // Keeps the previous page on screen while the next one loads instead of
    // collapsing the table to a skeleton on every click.
    placeholderData: keepPreviousData,
  });

  const currency = q.data?.currency ?? '';
  const pageTotals = q.data?.pageTotals;
  const grandTotals = q.data?.grandTotals;

  const columns: Column<RegistrationRow>[] = [
    {
      key: 'username',
      label: 'Player',
      render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.username}</span>,
      sortValue: (r) => r.username ?? '',
      footer: pageTotals ? `${formatInt(pageTotals.count)} on this page` : undefined,
    },
    {
      key: 'keyword',
      label: 'Keyword',
      render: (r) => r.keyword || <span className="text-[var(--text-muted)]">—</span>,
      sortValue: (r) => r.keyword ?? '',
    },
    {
      key: 'registeredAt',
      label: 'Registered',
      render: (r) => formatDateTime(r.registeredAt),
      // ISO-8601 sorts correctly as a string, so no Date parsing is needed.
      sortValue: (r) => r.registeredAt ?? '',
    },
    {
      key: 'firstDepositAt',
      label: 'First deposit',
      render: (r) => formatDateTime(r.firstDepositAt),
      // Players who never funded sort last on descending, which is where a
      // partner scanning for their best signups expects them to be.
      sortValue: (r) => r.firstDepositAt ?? '',
    },
    {
      key: 'firstDepositMinor',
      label: 'First deposit amount',
      numeric: true,
      render: (r) =>
        r.firstDepositMinor ? <Money minor={r.firstDepositMinor} /> : <span className="text-[var(--text-muted)]">—</span>,
      sortValue: (r) => r.firstDepositMinor ?? 0,
      footer: pageTotals ? formatMoney(pageTotals.firstDepositMinor) : undefined,
    },
    {
      key: 'currency',
      label: 'Currency',
      render: (r) => r.currency || currency,
      sortValue: (r) => r.currency || currency,
    },
  ];

  return (
    <ReportShell
      title="Registrations"
      description="Players who created an account through your referral link, with their first deposit if they have made one."
      actions={
        <ExportButton
          disabled={!q.data?.total}
          onExport={async () => downloadCsv(await affiliateReportsApi.exportReport('registrations', params))}
        />
      }
      filters={
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <DateRangeFilter value={range} onChange={(r) => { setRange(r); setPage(1); }} />
            <SearchField
              label="Keyword / sub-ID"
              value={keyword}
              onApply={(v) => { setKeyword(v); setPage(1); }}
              placeholder="e.g. tg-promo"
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
              { key: 'keyword', label: 'Keyword', value: keyword, onClear: () => { setKeyword(''); setPage(1); } },
            ]}
          />
        </div>
      }
    >
      <ErrorNote error={q.error} paused={q.isPaused} />

      {grandTotals ? (
        <SummaryStrip>
          <SummaryStat label="Registrations in range" value={formatInt(grandTotals.count)} />
          <SummaryStat label="First deposits value" value={formatMoney(grandTotals.firstDepositMinor, currency)} tone="gold" />
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
        empty="No registrations in this range."
        emptyHint="Try widening the date range, or clearing the keyword filter."
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
    </ReportShell>
  );
}
