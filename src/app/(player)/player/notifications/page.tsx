/**
 * Notifications inbox — the player's full list of in-app alerts.
 * Live data via the cookie-scoped /notifications API (deposit/withdrawal
 * approvals & rejections, wallet credits, security events, etc.).
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, CheckCheck, CheckCircle2, XCircle, AlertCircle, Info, Calendar } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/player-hooks';
import { PageContainer, LoadingState, ErrorState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { PlayerNotification } from '@/types';
import { cn } from '@/lib/utils';

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function getNotificationStyles(type: string, isRead: boolean) {
  switch (type) {
    case 'WARNING':
      return {
        border: isRead ? 'border-l-rose-500/20' : 'border-l-rose-500',
        bg: 'from-rose-500/5 to-transparent',
        icon: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      };
    case 'SUCCESS':
    case 'DEPOSIT':
      return {
        border: isRead ? 'border-l-emerald-500/20' : 'border-l-emerald-500',
        bg: 'from-emerald-500/5 to-transparent',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    case 'WITHDRAW':
      return {
        border: isRead ? 'border-l-amber-500/20' : 'border-l-amber-500',
        bg: 'from-amber-500/5 to-transparent',
        icon: <Info className="h-5 w-5 text-amber-500 shrink-0" />,
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    default:
      return {
        border: isRead ? 'border-l-blue-500/20' : 'border-l-blue-500',
        bg: 'from-blue-500/5 to-transparent',
        icon: <Bell className="h-5 w-5 text-blue-500 shrink-0" />,
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
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
            <h1 className="text-xl font-extrabold text-foreground tracking-wide">Notifications</h1>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || total === 0}
          className="flex items-center gap-1.5 text-xs font-bold border-[#2d3035] hover:bg-[#202124]"
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
          <div className="grid gap-3.5">
            {items.map((n) => {
              const styles = getNotificationStyles(n.type, n.isRead);
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                  }}
                  className={cn(
                    'group relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-[#2d3035] bg-gradient-to-r p-4 text-left transition-all duration-300 cursor-pointer border-l-4 shadow-sm hover:shadow-md hover:border-gray-500/30',
                    styles.border,
                    styles.bg,
                    n.isRead ? 'bg-[#1a1b1e]/40 opacity-75' : 'bg-[#1a1b1e]/90 hover:bg-[#202124]'
                  )}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-black/20 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                      {styles.icon}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white tracking-wide">{n.title}</span>
                        {!n.isRead && (
                          <span className="shrink-0 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-rose-400 tracking-wider animate-pulse">
                            New
                          </span>
                        )}
                        <span className={cn('text-[9px] font-black uppercase border px-1.5 py-0.5 rounded tracking-wide shrink-0', styles.badge)}>
                          {n.type}
                        </span>
                      </div>
                      {n.message && <p className="text-xs text-gray-400 font-semibold leading-relaxed">{n.message}</p>}
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                        <Calendar className="h-3 w-3" />
                        <span>{timeLabel(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-[#2d3035] hover:bg-[#202124] text-xs font-bold"
              >
                Previous
              </Button>
              <span className="text-xs text-muted font-bold">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-[#2d3035] hover:bg-[#202124] text-xs font-bold"
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
