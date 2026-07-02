/**
 * RecordsView — shared reference-style "Records" surface.
 *
 * Header (back + title + support icon), a row of date-range chips + a Type
 * filter, then a Date / Type / Amount / Status table. All data is REAL, read
 * from GET /player/ledger via useLedger. The view restricts entries to the
 * `scopeTypes` it is given (e.g. money types for Transaction Records, BET/WIN
 * for Betting Records). Date filtering is applied client-side over the loaded
 * page (the backend ledger endpoint exposes page/limit/type only). An optional
 * turnover summary sums the wagered amount across the loaded records.
 *
 * Themed entirely via design tokens (bdbet21 black/red/gold).
 */
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Headphones, type LucideIcon } from 'lucide-react';
import { useLedger } from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { LedgerEntry, LedgerEntryType } from '@/types';

const PAGE_SIZE = 20;

const RANGES = [
  { key: 'all', label: 'All', days: -1 },
  { key: 'today', label: 'Today', days: 0 },
  { key: '7d', label: 'Last 7 Days', days: 7 },
  { key: '30d', label: 'Last 30 Days', days: 30 },
] as const;

type RangeKey = (typeof RANGES)[number]['key'];

/** Start-of-window timestamp for a given range (ms), or 0 for "all". */
function rangeStart(key: RangeKey): number {
  if (key === 'all') return 0;
  if (key === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  const days = key === '7d' ? 7 : 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/** Map a ledger status string to a badge tone. */
function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (['APPROVED', 'COMPLETED', 'SUCCESS', 'SETTLED', 'CONFIRMED', 'WIN'].includes(s))
    return 'border-success/40 text-success';
  if (['PENDING', 'PROCESSING', 'HELD', 'REVIEW'].includes(s))
    return 'border-warning/40 text-warning';
  if (['REJECTED', 'FAILED', 'CANCELLED', 'VOID', 'LOSS'].includes(s))
    return 'border-danger/40 text-danger';
  return 'border-border text-muted';
}

export interface RecordsViewProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Restrict displayed entries to these ledger types. */
  scopeTypes: LedgerEntryType[];
  /** Options for the Type <select> ('' = all in scope). */
  typeOptions: { value: string; label: string }[];
  /** Show a "Total wagered (loaded)" summary card (Turnover view). */
  showTurnover?: boolean;
}

export default function RecordsView({
  title,
  subtitle,
  icon: Icon,
  scopeTypes,
  typeOptions,
  showTurnover = false,
}: RecordsViewProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [range, setRange] = useState<RangeKey>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading, isError } = useLedger({
    page,
    limit: PAGE_SIZE,
    type: typeFilter || undefined,
  });

  const scopeSet = useMemo(() => new Set(scopeTypes), [scopeTypes]);

  // Restrict to in-scope types + the selected date window (client-side).
  const rows = useMemo<LedgerEntry[]>(() => {
    const start = rangeStart(range);
    return (data?.items ?? []).filter((e) => {
      if (!scopeSet.has(e.type)) return false;
      if (start > 0 && new Date(e.createdAt).getTime() < start) return false;
      return true;
    });
  }, [data, scopeSet, range]);

  const totalPages = data?.totalPages ?? 1;
  const currency = rows[0]?.currency ?? 'BDT';
  const turnover = useMemo(
    () => rows.filter((r) => r.type === 'BET').reduce((sum, r) => sum + Math.abs(r.amountMinor), 0),
    [rows],
  );

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/player/account')} variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Icon className="h-5 w-5 text-gold-soft" aria-hidden />
                {title}
              </h1>
              {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
            </div>
          </div>
          <Headphones className="h-5 w-5 text-gold-soft" aria-hidden />
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-col gap-3 rounded-lg bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => { setRange(r.key); setPage(1); }}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                  range === r.key
                    ? 'border-gold-soft bg-gold-soft/10 text-gold-soft'
                    : 'border-border bg-elevated text-muted hover:border-gold-soft/40',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          {typeOptions.length > 1 && (
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-border bg-base px-3 text-sm text-white"
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Turnover summary */}
        {showTurnover && (
          <div className="mb-4 rounded-xl border border-gold-soft/20 bg-gradient-to-r from-elevated to-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Wagered (loaded records)</p>
            <p className="mt-1 text-3xl font-extrabold text-gold-soft">{formatCurrency(turnover, currency)}</p>
            <p className="mt-1 text-xs text-muted">
              Sum of bets in the records shown below. Adjust the date range or load more pages to widen the total.
            </p>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <LoadingState message="Loading records…" />
        ) : isError ? (
          <ErrorState message="Unable to load records." />
        ) : rows.length === 0 ? (
          <EmptyState message="No records found for this filter." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-elevated">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-elevated/50">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white">{r.type}</span>
                      {r.description && <span className="block text-xs text-muted">{r.description}</span>}
                    </td>
                    <td className={cn('whitespace-nowrap px-4 py-3 text-right font-semibold', r.amountMinor >= 0 ? 'text-success' : 'text-danger')}>
                      {r.amountMinor >= 0 ? '+' : '−'}
                      {formatCurrency(Math.abs(r.amountMinor), r.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', statusTone(r.status))}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <span className="px-3 text-sm text-muted">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
