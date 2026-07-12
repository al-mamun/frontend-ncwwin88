/**
 * ChatWidget — a branded, floating live-chat launcher + panel for the player site.
 *
 * Fully tenant-branded via the CSS design tokens (--brand, --brand-fg, --surface,
 * --elevated, --text, --text-dim, --line, --success …) — never hardcodes brand
 * colours, so it looks right in every theme.
 *
 * Gating (belt-and-suspenders):
 *   1. tenant.chatEnabled === true            (owner/tenant toggle; renders nothing otherwise)
 *   2. GET /player/chat returns enabled:true  (backend is the real boundary)
 *
 * Data:
 *   - On open (enabled only): GET /player/chat → { enabled, conversation, messages }.
 *   - When logged in + panel open: polls GET /player/chat/messages?after=<lastAt>
 *     every ~4s and merges new messages.
 *   - Send: POST /player/chat/messages { body } → the new Message (appended).
 *
 * Guests: in-site chat needs a login (messages tie to the player account), so the
 * composer is replaced with a "Log in to chat" note. The WhatsApp / Telegram
 * quick-connect chips (from tenant.social) always show — they work for guests too.
 *
 * Drop <ChatWidget/> once, INSIDE the providers tree (it uses useTenant + useAuth).
 * See docs/16-live-chat-widget.md.
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X, Send, LogIn, Headphones } from 'lucide-react';
import { useTenant } from '../../core/tenant/TenantProvider';
import { useAuth } from '../../providers/auth-provider';
import { apiFetch } from '../../lib/api';

type SenderType = 'player' | 'staff' | 'ai' | 'system';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface ChatState {
  enabled: boolean;
  conversation?: { id: string; status: string } | null;
  messages?: ChatMessage[];
}

interface PollResult {
  enabled: boolean;
  messages: ChatMessage[];
}

const POLL_MS = 4000;

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** De-dupe + sort messages by createdAt (id-keyed). */
function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return existing;
  const map = new Map<string, ChatMessage>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function ChatWidget() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();

  const chatAllowed = tenant?.chatEnabled === true;
  const loggedIn = !!user;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Quick-connect channels (guest-safe). tenant.social holds full URLs.
  const whatsapp = tenant?.social?.whatsapp?.trim() || '';
  const telegram = tenant?.social?.telegram?.trim() || '';

  // Initial load — only when the tenant allows chat AND the panel has been opened.
  const { data, isLoading } = useQuery({
    queryKey: ['player-chat'],
    queryFn: () => apiFetch<ChatState>('/player/chat'),
    enabled: chatAllowed && open,
    staleTime: 15_000,
    retry: false,
  });

  // Seed local messages from the initial fetch.
  useEffect(() => {
    if (data?.messages) setMessages((prev) => mergeMessages(prev, data.messages ?? []));
  }, [data]);

  // Backend flag can turn chat off even when the tenant flag was true.
  const backendEnabled = data?.enabled !== false;

  const lastAt = useMemo(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1].createdAt;
  }, [messages]);

  // Poll for new inbound messages while the panel is open + player is logged in.
  useEffect(() => {
    if (!chatAllowed || !open || !loggedIn || !backendEnabled) return;
    let active = true;
    const tick = async () => {
      try {
        const qs = lastAt ? `?after=${encodeURIComponent(lastAt)}` : '';
        const res = await apiFetch<PollResult>(`/player/chat/messages${qs}`);
        if (!active) return;
        if (res.enabled === false) return;
        if (res.messages?.length) {
          setMessages((prev) => mergeMessages(prev, res.messages));
        }
      } catch {
        /* transient — next tick retries */
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [chatAllowed, open, loggedIn, backendEnabled, lastAt]);

  // Auto-scroll to newest message.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // Track unread while the panel is closed (new inbound staff/ai/system messages).
  const seenCountRef = useRef(0);
  useEffect(() => {
    if (open) {
      setUnread(false);
      seenCountRef.current = messages.length;
      return;
    }
    if (messages.length > seenCountRef.current) {
      const fresh = messages.slice(seenCountRef.current);
      if (fresh.some((m) => m.senderType !== 'player')) setUnread(true);
    }
  }, [messages, open]);

  if (!chatAllowed || !backendEnabled) return null;

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !loggedIn) return;
    setSending(true);
    try {
      const msg = await apiFetch<ChatMessage>('/player/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setMessages((prev) => mergeMessages(prev, [msg]));
      setDraft('');
      qc.invalidateQueries({ queryKey: ['player-chat'] });
    } catch {
      /* leave the draft in place so the player can retry */
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  // Sits above the mobile bottom nav (~64px) + safe-area inset.
  const bottomOffset = 'calc(132px + env(safe-area-inset-bottom, 0px))';
  const rightOffset = 'calc(16px + env(safe-area-inset-right, 0px))';

  return (
    <>
      {/* ── Floating launcher ─────────────────────────────── */}
      {!open && (
        <button
          type="button"
          aria-label="Open live chat"
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: bottomOffset,
            right: rightOffset,
            zIndex: 120,
            width: 56,
            height: 56,
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--brand, #e5a900), var(--brand-2-dark, #c89200))',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(229, 169, 0, 0.4)',
            transition: 'transform .16s ease, box-shadow .16s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(229, 169, 0, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(229, 169, 0, 0.4)';
          }}
        >
          <Headphones size={26} strokeWidth={2.2} aria-hidden />
          {unread && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 12,
                height: 12,
                borderRadius: 999,
                background: 'var(--success, #35c46b)',
                border: '2px solid var(--brand, #000)',
              }}
            />
          )}
        </button>
      )}

      {/* ── Chat panel ────────────────────────────────────── */}
      {open && (
        <div
          role="dialog"
          aria-label="Live chat"
          style={{
            position: 'fixed',
            bottom: bottomOffset,
            right: rightOffset,
            left: 'auto',
            zIndex: 121,
            width: 'min(360px, calc(100vw - 24px))',
            height: 'min(560px, calc(100vh - 140px))',
            maxHeight: 'calc(100dvh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface, #16181d)',
            color: '#f1f1f1',
            border: '1px solid var(--line, rgba(255,255,255,.12))',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 18px 50px rgba(0,0,0,.55)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              background: 'var(--brand, var(--lux, var(--gold, #d4af37)))',
              color: 'var(--brand-fg, var(--brand-foreground, #08130c))',
            }}
          >
            <MessageCircle size={20} aria-hidden />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>Live chat</div>
              <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tenant?.name || 'Support'}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'rgba(0,0,0,.12)',
                color: 'inherit',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          {/* Quick-connect chips (guest-safe) */}
          {(whatsapp || telegram) && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '10px 12px',
                borderBottom: '1px solid var(--line, rgba(255,255,255,.08))',
                background: 'var(--elevated, rgba(255,255,255,.03))',
              }}
            >
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 999,
                    textDecoration: 'none',
                    color: '#f1f1f1',
                    background: 'var(--surface, #16181d)',
                    border: '1px solid var(--success, #25d366)',
                  }}
                >
                  <span aria-hidden style={{ color: 'var(--success, #25d366)' }}>●</span> WhatsApp
                </a>
              )}
              {telegram && (
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 999,
                    textDecoration: 'none',
                    color: '#f1f1f1',
                    background: 'var(--surface, #16181d)',
                    border: '1px solid var(--brand, #2aabee)',
                  }}
                >
                  <span aria-hidden style={{ color: 'var(--brand, #2aabee)' }}>●</span> Telegram
                </a>
              )}
            </div>
          )}

          {/* Message list */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {isLoading && messages.length === 0 ? (
              <p style={{ margin: 'auto', fontSize: 13, color: 'var(--text-dim, var(--muted, #9aa))' }}>Loading…</p>
            ) : messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '0 12px' }}>
                <p style={{ fontSize: 13, color: 'var(--text-dim, var(--muted, #9aa))', lineHeight: 1.5 }}>
                  Start a conversation — we usually reply in a few minutes.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.senderType === 'player';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: mine ? 'flex-end' : 'flex-start',
                      maxWidth: '100%',
                    }}
                  >
                    {!mine && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim, var(--muted, #9aa))', margin: '0 4px 2px' }}>
                        {m.senderName || (m.senderType === 'ai' ? 'Assistant' : m.senderType === 'system' ? 'System' : 'Support')}
                      </span>
                    )}
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '8px 11px',
                        borderRadius: 12,
                        fontSize: 13,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        ...(mine
                          ? {
                              background: 'var(--brand, var(--lux, #d4af37))',
                              color: 'var(--brand-fg, var(--brand-foreground, #08130c))',
                              borderBottomRightRadius: 4,
                            }
                          : {
                              background: 'var(--elevated, rgba(255,255,255,.06))',
                              color: '#f1f1f1',
                              border: '1px solid var(--line, rgba(255,255,255,.08))',
                              borderBottomLeftRadius: 4,
                            }),
                      }}
                    >
                      {m.body}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-dim, var(--muted, #9aa))', margin: '2px 4px 0' }}>
                      {timeLabel(m.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer / guest note */}
          {loggedIn ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                padding: '10px 12px',
                borderTop: '1px solid var(--line, rgba(255,255,255,.1))',
                background: 'var(--surface, #16181d)',
              }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a message…"
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  maxHeight: 96,
                  minHeight: 38,
                  padding: '9px 11px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#f1f1f1',
                  background: 'var(--elevated, rgba(255,255,255,.05))',
                  border: '1px solid var(--line, rgba(255,255,255,.14))',
                  borderRadius: 10,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => void send()}
                disabled={sending || !draft.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: 10,
                  border: 'none',
                  cursor: sending || !draft.trim() ? 'default' : 'pointer',
                  background: 'var(--brand, var(--lux, #d4af37))',
                  color: 'var(--brand-fg, var(--brand-foreground, #08130c))',
                  opacity: sending || !draft.trim() ? 0.5 : 1,
                }}
              >
                <Send size={18} aria-hidden />
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 14px calc(14px + env(safe-area-inset-bottom, 0px))',
                borderTop: '1px solid var(--line, rgba(255,255,255,.1))',
                background: 'var(--surface, #16181d)',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--text-dim, var(--muted, #9aa))', margin: '0 0 10px', lineHeight: 1.5 }}>
                Log in to chat with our team{whatsapp || telegram ? ' — or reach us instantly above.' : '.'}
              </p>
              <a
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '9px 18px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  background: 'var(--brand, var(--lux, #d4af37))',
                  color: 'var(--brand-fg, var(--brand-foreground, #08130c))',
                }}
              >
                <LogIn size={16} aria-hidden /> Log in to chat
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ChatWidget;
