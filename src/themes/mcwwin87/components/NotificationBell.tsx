/**
 * Player notification bell (bdbet21).
 *
 * Live, cookie-scoped to the logged-in player via the shared /notifications API.
 * Shows an unread badge (polled), and a dropdown of recent notifications with
 * mark-as-read. Players receive these for deposit/withdrawal approval &
 * rejection, wallet credits, security events, etc. (projected from the backend
 * outbox). Rendered only for authenticated users.
 */

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {
  useNotifications,
  useUnreadNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../../hooks/player-hooks';
import type { PlayerNotification } from '../../../types';

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const unread = useUnreadNotifications(true);
  const list = useNotifications({ limit: 8 }, open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = unread.data?.count ?? 0;
  const items: PlayerNotification[] = list.data?.items ?? [];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        className="relative rounded-md p-2 text-muted transition-colors hover:bg-elevated hover:text-gold-soft"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[1.05rem] items-center justify-center rounded-full bg-brand-2 px-1 text-[10px] font-bold leading-4 text-white">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending || count === 0}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-elevated hover:text-gold-soft disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Mark all read
            </button>
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {list.isLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-md bg-elevated" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.isRead) markRead.mutate(n.id);
                      }}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated ${
                        n.isRead ? '' : 'bg-elevated/40'
                      }`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor(n.type)}`} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{n.title}</span>
                        {n.message ? (
                          <span className="mt-0.5 block text-xs text-muted">{n.message}</span>
                        ) : null}
                        <span className="mt-1 block text-[11px] text-muted/70">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2">
            <Link
              href="/player/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-center text-xs font-medium text-muted transition-colors hover:bg-elevated hover:text-gold-soft"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
