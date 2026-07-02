/**
 * Shared player-portal components.
 * Each is presentational, typed, and design-token driven.
 */
import { AlertCircle, Inbox } from 'lucide-react';
import { Card, CardContent } from '../ui/card-badge-label';
import { cn } from '../../lib/utils';

// ─── PageContainer ─────────────────────────────────────────────
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8', className)}>
      {children}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-elevated">
            <Icon className="h-6 w-6 text-brand" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{label}</p>
          <p className="truncate text-xl font-bold text-base">{value}</p>
          {hint && <p className="truncate text-xs text-muted">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BalanceCard ───────────────────────────────────────────────
export function BalanceCard({
  balance,
  held,
  currency,
}: {
  balance: number;
  held: number;
  currency: string;
}) {
  return (
    <Card className="overflow-hidden border-brand/30">
      <div className="bg-gradient-to-br from-elevated to-surface p-6">
        <p className="text-sm text-muted">Total Balance</p>
        <p className="mt-2 text-4xl font-extrabold text-brand">
          {(balance / 100).toLocaleString('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
          })}
        </p>
        {held > 0 && (
          <p className="mt-2 text-sm text-warning">
            Held: {(held / 100).toLocaleString('en-US', {
              style: 'currency',
              currency,
            })}
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── ProfileCard ───────────────────────────────────────────────
export function ProfileCard({
  displayName,
  email,
  username,
  avatar,
}: {
  displayName: string;
  email: string;
  username: string;
  avatar?: string | null;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-brand-fg">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={displayName} className="h-full w-full rounded-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{displayName}</p>
          <p className="truncate text-sm text-muted">{email}</p>
          <p className="truncate text-xs text-muted">@{username}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EmptyState ────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="mb-4 h-12 w-12 text-muted" />
      <p className="text-muted">{message}</p>
    </div>
  );
}

// ─── LoadingState ──────────────────────────────────────────────
export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand" />
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}

// ─── ErrorState ────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-danger" />
      <p className="text-danger">{message}</p>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-elevated', className)} />;
}

// ─── ConfirmDialog ─────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted">{message}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:bg-elevated disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="rounded-md bg-danger px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '…' : confirmText}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── DataTable ─────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = 'No data available',
}: {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}) {
  if (!data.length) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-elevated">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn('whitespace-nowrap px-4 py-3 text-left font-medium text-muted', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-elevated/50">
              {columns.map((col) => (
                <td key={String(col.key)} className={cn('whitespace-nowrap px-4 py-3', col.className)}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key as string] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}