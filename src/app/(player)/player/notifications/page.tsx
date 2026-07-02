/**
 * Notifications inbox — the player's full list of in-app alerts.
 * Live data via the cookie-scoped /notifications API (deposit/withdrawal
 * approvals & rejections, wallet credits, security events, etc.).
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { PlayerNotification } from '@/types';

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function dotColor(type: string): string {
  switch (type) {
    case 'WARNING':
      return 'bg-brand-2';
    case 'SUCCESS':
    case 'DEPOSIT':
      return 'bg-success';
    case 'WITHDRAW':
      return 'bg-gold-soft';
    default:
      return 'bg-muted';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useNotifications({ page, limit }, true);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items: PlayerNotification[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/player/account')}
            aria-label="Back"
            className="rounded-md p-2 text-muted transition-colors hover:bg-elevated hover:text-gold-soft"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gold-soft" aria-hidden />
            <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || total === 0}
          className="flex items-center gap-1.5"
        >
          <CheckCheck className="h-4 w-4" aria-hidden /> Mark all read
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading notifications…" />
      ) : isError ? (
        <ErrorState message="Could not load notifications." />
      ) : items.length === 0 ? (
        <EmptyState message="You're all caught up." />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                  }}
                  className={`flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-elevated ${
                    n.isRead ? '' : 'bg-elevated/40'
                  }`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(n.type)}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{n.title}</span>
                      {!n.isRead ? (
                        <span className="shrink-0 rounded-full bg-brand-2/15 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-2">
                          New
                        </span>
                      ) : null}
                    </span>
                    {n.message ? <span className="mt-1 block text-sm text-muted">{n.message}</span> : null}
                    <span className="mt-1.5 block text-xs text-muted/70">{timeLabel(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
