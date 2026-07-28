/**
 * Activity: raw transaction history for the affiliate's referred players.
 *
 * Two tabs over the two existing endpoints — finance (deposits/withdrawals)
 * and betting (per-round stakes and results). The reports section aggregates;
 * this page is the ledger you drill into when an aggregate looks wrong.
 */
'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { affiliateApi, type AffiliateBettingRow, type AffiliateFinanceRow } from '@/services/affiliate.service';
import {
  DataTable,
  DateRangeFilter,
  ErrorNote,
  FilterChips,
  LABEL,
  Money,
  Pager,
  presetRange,
  ReportShell,
  SegmentedControl,
  formatDate,
  formatDateTime,
  type Column,
  type DateRange,
} from '@/components/affiliate/portal-ui';

const LIMIT = 25;
type Tab = 'finance' | 'betting';

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'finance', label: 'Finance', hint: 'Deposits and withdrawals made by your referred players.' },
  { key: 'betting', label: 'Betting', hint: 'Settled bet rounds, stake and win per round.' },
];

export default function AffiliateActivityPage() {
  const [tab, setTab] = useState<Tab>('finance');
  const [range, setRange] = useState<DateRange>(() => presetRange('30d'));
  const [finPage, setFinPage] = useState(1);
  const [betPage, setBetPage] = useState(1);

  // Changing the range invalidates both paginations — page 7 of the old range
  // is meaningless in the new one.
  const applyRange = (r: DateRange) => { setRange(r); setFinPage(1); setBetPage(1); };

  const params = { from: range.from || undefined, to: range.to || undefined, limit: LIMIT };

  const financeQ = useQuery({
    queryKey: ['affiliate', 'finance-history', range.from, range.to, finPage],
    queryFn: () => affiliateApi.financeHistory({ ...params, page: finPage }),
    enabled: tab === 'finance',
    placeholderData: keepPreviousData,
  });

  const bettingQ = useQuery({
    queryKey: ['affiliate', 'betting-history', range.from, range.to, betPage],
    queryFn: () => affiliateApi.bettingHistory({ ...params, page: betPage }),
    enabled: tab === 'betting',
    placeholderData: keepPreviousData,
  });

  const active = tab === 'finance' ? financeQ : bettingQ;
  const currency = active.data?.currency;

  const financeCols: Column<AffiliateFinanceRow>[] = [
    { key: 'at', label: 'When', render: (r) => formatDateTime(r.at), sortValue: (r) => r.at ?? '' },
    {
      key: 'player',
      label: 'Player',
      render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.player}</span>,
      sortValue: (r) => r.player ?? '',
    },
    {
      key: 'kind',
      label: 'Type',
      render: (r) => (
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
            r.kind === 'deposit'
              ? 'bg-[var(--success-a12)] text-[var(--success)]'
              : 'bg-[var(--danger-a12)] text-[var(--danger)]'
          }`}
        >
          {r.kind === 'deposit' ? 'Deposit' : 'Withdrawal'}
        </span>
      ),
      sortValue: (r) => r.kind ?? '',
    },
    {
      key: 'amountMinor',
      label: 'Amount',
      numeric: true,
      // Withdrawals leave the player's balance, so render them negative rather
      // than making the reader infer the sign from the Type column.
      render: (r) => <Money minor={r.kind === 'withdrawal' ? -r.amountMinor : r.amountMinor} currency={r.currency} signed />,
      // Sort on the signed value too, so one click groups withdrawals at one end.
      sortValue: (r) => (r.kind === 'withdrawal' ? -r.amountMinor : r.amountMinor),
    },
  ];

  const bettingCols: Column<AffiliateBettingRow>[] = [
    { key: 'at', label: 'When', render: (r) => formatDateTime(r.at), sortValue: (r) => r.at ?? '' },
    {
      key: 'player',
      label: 'Player',
      render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.player}</span>,
      sortValue: (r) => r.player ?? '',
    },
    { key: 'game', label: 'Game', render: (r) => r.game || '—', sortValue: (r) => r.game ?? '' },
    {
      key: 'betMinor',
      label: 'Stake',
      numeric: true,
      render: (r) => <Money minor={r.betMinor} currency={r.currency} />,
      sortValue: (r) => r.betMinor ?? 0,
    },
    {
      key: 'winMinor',
      label: 'Win',
      numeric: true,
      render: (r) => <Money minor={r.winMinor} currency={r.currency} />,
      sortValue: (r) => r.winMinor ?? 0,
    },
    // Net is from the player's point of view: positive means the player won.
    {
      key: 'netMinor',
      label: 'Net',
      numeric: true,
      render: (r) => <Money minor={r.netMinor} currency={r.currency} signed />,
      sortValue: (r) => r.netMinor ?? 0,
    },
  ];

  return (
    <ReportShell
      title="Activity"
      description="Individual deposits, withdrawals and bet rounds from the players you referred."
      filters={
        <div className="space-y-3">
          <DateRangeFilter value={range} onChange={applyRange} />
          <FilterChips
            items={[
              {
                key: 'range',
                label: 'Dates',
                value: range.from || range.to ? `${range.from ? formatDate(range.from) : 'start'} → ${range.to ? formatDate(range.to) : 'now'}` : '',
                onClear: () => applyRange({ from: '', to: '' }),
              },
            ]}
          />
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl label="History type" value={tab} options={TABS} onChange={setTab} />
        {currency ? <span className={`${LABEL} ml-auto`}>Amounts in {currency}</span> : null}
      </div>

      <ErrorNote error={active.error} paused={active.isPaused} />

      {tab === 'finance' ? (
        <>
          <DataTable
            columns={financeCols}
            rows={financeQ.data?.items ?? []}
            loading={financeQ.isLoading || financeQ.isPaused}
            failed={!!financeQ.error}
            empty="No deposits or withdrawals in this range."
            emptyHint="The default range is the last 30 days — widen it to look further back."
            rowKey={(r) => r.id}
            paged
          />
          <Pager
            page={financeQ.data?.page ?? finPage}
            pages={financeQ.data?.pages ?? 1}
            total={financeQ.data?.total ?? 0}
            limit={financeQ.data?.limit ?? LIMIT}
            onPage={setFinPage}
          />
        </>
      ) : (
        <>
          <DataTable
            columns={bettingCols}
            rows={bettingQ.data?.items ?? []}
            loading={bettingQ.isLoading || bettingQ.isPaused}
            failed={!!bettingQ.error}
            empty="No bets settled in this range."
            emptyHint="The default range is the last 30 days — widen it to look further back."
            rowKey={(r) => r.id}
            paged
          />
          <Pager
            page={bettingQ.data?.page ?? betPage}
            pages={bettingQ.data?.pages ?? 1}
            total={bettingQ.data?.total ?? 0}
            limit={bettingQ.data?.limit ?? LIMIT}
            onPage={setBetPage}
          />
        </>
      )}
    </ReportShell>
  );
}
