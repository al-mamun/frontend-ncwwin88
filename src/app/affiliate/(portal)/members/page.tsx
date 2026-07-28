/**
 * Member search — find a specific referred player.
 *
 * Filters mirror the ones an affiliate manager actually asks for: registration
 * window, username, last login IP (shared-device / fraud checks) and "deposited
 * since", which is the fastest way to separate live players from dormant ones.
 *
 * Filters are applied on submit rather than on keystroke: each search is a server
 * aggregation, and firing one per character would hammer the API for nothing.
 * The chip row underneath reports what is actually applied, which is not always
 * what is typed in the boxes — an unsubmitted edit narrows nothing.
 */
'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { affiliateReportsApi, downloadCsv, type MemberQuery, type MemberRow } from '@/services/affiliate-reports.service';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  Column,
  DataTable,
  ErrorNote,
  ExportButton,
  FilterChips,
  INPUT,
  LABEL,
  Pager,
  ReportShell,
  formatDate,
  formatDateTime,
} from '@/components/affiliate/portal-ui';

const LIMIT = 25;

const EMPTY: MemberQuery = {
  registeredFrom: '',
  registeredTo: '',
  username: '',
  lastLoginIp: '',
  lastDepositSince: '',
};

/** Only the user-facing filter fields - `page` and `limit` also live on MemberQuery. */
type FilterKey = 'username' | 'registeredFrom' | 'registeredTo' | 'lastLoginIp' | 'lastDepositSince';

/** Chip captions, kept beside EMPTY so a new filter cannot be added without one. */
const FILTER_LABELS: { key: FilterKey; label: string; date?: boolean }[] = [
  { key: 'username', label: 'Username' },
  { key: 'registeredFrom', label: 'Registered from', date: true },
  { key: 'registeredTo', label: 'Registered to', date: true },
  { key: 'lastLoginIp', label: 'Last login IP' },
  { key: 'lastDepositSince', label: 'Deposited since', date: true },
];

export default function MemberSearchPage() {
  const [draft, setDraft] = useState<MemberQuery>(EMPTY);
  const [applied, setApplied] = useState<MemberQuery>(EMPTY);
  const [page, setPage] = useState(1);

  // Strip empties so the query key (and the URL) stay stable across no-op edits.
  const params: MemberQuery = Object.fromEntries(
    Object.entries(applied).filter(([, v]) => v !== '' && v !== undefined),
  );

  const q = useQuery({
    queryKey: ['affiliate', 'members', params, page],
    queryFn: () => affiliateReportsApi.members({ ...params, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const currency = q.data?.currency ?? '';

  const columns: Column<MemberRow>[] = [
    {
      key: 'username',
      label: 'Username',
      render: (r) => <span className="font-medium text-[var(--text-primary)]">{r.username}</span>,
      sortValue: (r) => r.username ?? '',
    },
    {
      key: 'registeredAt',
      label: 'Registered',
      render: (r) => formatDateTime(r.registeredAt),
      sortValue: (r) => r.registeredAt ?? '',
    },
    {
      key: 'keyword',
      label: 'Keyword',
      render: (r) => r.keyword || <span className="text-[var(--text-muted)]">—</span>,
      sortValue: (r) => r.keyword ?? '',
    },
    {
      key: 'lastLoginIp',
      label: 'Last login IP',
      render: (r) => <span className="font-mono text-xs">{r.lastLoginIp || '—'}</span>,
      sortValue: (r) => r.lastLoginIp ?? '',
    },
    {
      key: 'lastLoginAt',
      label: 'Last login',
      render: (r) => formatDateTime(r.lastLoginAt),
      sortValue: (r) => r.lastLoginAt ?? '',
    },
    {
      key: 'lastDepositAt',
      label: 'Last deposit',
      render: (r) => formatDate(r.lastDepositAt),
      sortValue: (r) => r.lastDepositAt ?? '',
    },
    {
      key: 'currency',
      label: 'Ccy',
      render: (r) => r.currency || currency,
      sortValue: (r) => r.currency || currency,
    },
  ];

  const set = (k: keyof MemberQuery) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const search = () => { setApplied(draft); setPage(1); };
  const reset = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1); };

  // Clearing a chip clears the box as well as the applied value — leaving the
  // typed text behind would make the next Search silently re-apply it.
  const clearOne = (k: FilterKey) => () => {
    setDraft((d) => ({ ...d, [k]: '' }));
    setApplied((a) => ({ ...a, [k]: '' }));
    setPage(1);
  };

  return (
    <ReportShell
      title="Member search"
      description="Look up any player referred by your account."
      actions={
        <ExportButton
          disabled={!q.data?.total}
          onExport={async () => downloadCsv(await affiliateReportsApi.exportReport('members', params))}
        />
      }
      filters={
        <div className="space-y-3">
          <form
            onSubmit={(e) => { e.preventDefault(); search(); }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            <Field label="Username">
              <input value={draft.username ?? ''} onChange={set('username')} placeholder="Partial match" className={INPUT} />
            </Field>
            <Field label="Registered from">
              <input type="date" value={draft.registeredFrom ?? ''} onChange={set('registeredFrom')} className={INPUT} />
            </Field>
            <Field label="Registered to">
              <input type="date" value={draft.registeredTo ?? ''} onChange={set('registeredTo')} className={INPUT} />
            </Field>
            <Field label="Last login IP">
              <input value={draft.lastLoginIp ?? ''} onChange={set('lastLoginIp')} placeholder="e.g. 103.108." className={INPUT} />
            </Field>
            <Field label="Deposited since">
              <input type="date" value={draft.lastDepositSince ?? ''} onChange={set('lastDepositSince')} className={INPUT} />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-5">
              <button type="submit" className={BTN_PRIMARY}>Search</button>
              <button type="button" onClick={reset} className={BTN_GHOST}>Reset</button>
            </div>
          </form>
          <FilterChips
            items={FILTER_LABELS.map((f) => {
              const raw = applied[f.key] ?? '';
              return {
                key: f.key,
                label: f.label,
                value: raw && f.date ? formatDate(raw) : raw,
                onClear: clearOne(f.key),
              };
            })}
          />
        </div>
      }
    >
      <ErrorNote error={q.error} paused={q.isPaused} />
      <DataTable
        columns={columns}
        rows={q.data?.items ?? []}
        loading={q.isLoading || q.isPaused}
        failed={!!q.error}
        rowKey={(r) => r.id}
        empty="No members match these filters."
        emptyHint="Try a shorter username fragment, or clear a filter chip above."
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}
