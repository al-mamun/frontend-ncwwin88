'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Plus, ArrowLeft, Send } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/core/i18n/LanguageProvider';

function statusTone(s: string) {
  if (s === 'resolved' || s === 'closed') return 'text-muted';
  if (s === 'pending') return 'text-warning';
  return 'text-success';
}

function statusLabel(s: string, bn: boolean) {
  if (!bn) return s;
  const map: Record<string, string> = {
    open: 'খোলা',
    pending: 'অপেক্ষমাণ',
    resolved: 'সমাধান হয়েছে',
    closed: 'বন্ধ',
  };
  return map[s] ?? s;
}

export default function SupportPage() {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const L = bn
    ? {
        title: 'সহায়তা',
        subtitle: 'একটি টিকিট খুলুন এবং আমাদের টিমের সাথে চ্যাট করুন',
        close: 'বন্ধ করুন',
        newTicket: 'নতুন টিকিট',
        loading: 'লোড হচ্ছে…',
        empty: 'আপনার এখনও কোনো সহায়তা টিকিট নেই।',
        message: 'বার্তা',
        messages: 'বার্তা',
      }
    : {
        title: 'Support',
        subtitle: 'Open a ticket and chat with our team',
        close: 'Close',
        newTicket: 'New ticket',
        loading: 'Loading…',
        empty: 'You have no support tickets yet.',
        message: 'message',
        messages: 'messages',
      };

  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useQuery({ queryKey: ['player', 'support'], queryFn: () => playerApi.getSupportTickets({ limit: 50 }) });

  if (openId) return <TicketThread id={openId} onBack={() => setOpenId(null)} />;

  return (
    <PageContainer>
      <PlayerPageHeader title={L.title} subtitle={L.subtitle} icon={LifeBuoy} />

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating((v) => !v)}><Plus className="mr-1 h-4 w-4" />{creating ? L.close : L.newTicket}</Button>
      </div>

      {creating && <NewTicketForm onCreated={(id) => { setCreating(false); qc.invalidateQueries({ queryKey: ['player', 'support'] }); setOpenId(id); }} />}

      {list.isLoading ? <LoadingState message={L.loading} /> : (list.data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-muted">{L.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.data!.items.map((tk) => (
            <button key={tk.id} onClick={() => setOpenId(tk.id)} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-primary/40">
              <div className="min-w-0">
                <p className="truncate font-semibold text-primary">{tk.subject}</p>
                <p className="truncate text-xs text-muted">{tk.category} · {tk.messageCount} {tk.messageCount === 1 ? L.message : L.messages}</p>
              </div>
              <span className={`text-xs font-bold uppercase ${statusTone(tk.status)}`}>{statusLabel(tk.status, bn)}</span>
            </button>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function NewTicketForm({ onCreated }: { onCreated: (id: string) => void }) {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const L = bn
    ? {
        subject: 'বিষয়',
        describe: 'আপনার সমস্যা বর্ণনা করুন…',
        error: 'টিকিটটি তৈরি করা যায়নি।',
        submitting: 'জমা দেওয়া হচ্ছে…',
        submit: 'টিকিট জমা দিন',
      }
    : {
        subject: 'Subject',
        describe: 'Describe your issue…',
        error: 'Could not create the ticket.',
        submitting: 'Submitting…',
        submit: 'Submit ticket',
      };

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => playerApi.createSupportTicket({ subject: subject.trim(), body: body.trim() }),
    onSuccess: (tk) => onCreated(tk.id),
    onError: (e) => setErr(e instanceof ApiRequestError ? e.message : L.error),
  });
  return (
    <Card className="mb-4 border-border bg-surface">
      <CardContent className="space-y-3 p-5">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={L.subject} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={L.describe} className="min-h-28 w-full rounded-md border border-border bg-background p-2 text-sm" />
        {err && <p className="text-sm text-danger">{err}</p>}
        <Button disabled={create.isPending || !subject.trim() || !body.trim()} onClick={() => { setErr(null); create.mutate(); }}>
          {create.isPending ? L.submitting : L.submit}
        </Button>
      </CardContent>
    </Card>
  );
}

function TicketThread({ id, onBack }: { id: string; onBack: () => void }) {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const L = bn
    ? {
        back: 'টিকিটে ফিরে যান',
        ticket: 'টিকিট',
        loading: 'লোড হচ্ছে…',
        support: 'সহায়তা',
        you: 'আপনি',
        reply: 'একটি উত্তর টাইপ করুন…',
        send: 'পাঠান',
      }
    : {
        back: 'Back to tickets',
        ticket: 'Ticket',
        loading: 'Loading…',
        support: 'Support',
        you: 'You',
        reply: 'Type a reply…',
        send: 'Send',
      };

  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const detail = useQuery({ queryKey: ['player', 'support', id], queryFn: () => playerApi.getSupportTicket(id) });
  const send = useMutation({
    mutationFn: () => playerApi.replySupportTicket(id, reply.trim()),
    onSuccess: () => { setReply(''); qc.invalidateQueries({ queryKey: ['player', 'support', id] }); qc.invalidateQueries({ queryKey: ['player', 'support'] }); },
  });
  const tk = detail.data?.ticket;
  return (
    <PageContainer>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-primary"><ArrowLeft className="h-4 w-4" />{L.back}</button>
      <PlayerPageHeader title={tk?.subject ?? L.ticket} subtitle={tk ? `${tk.category} · ${statusLabel(tk.status, bn)}` : L.loading} icon={LifeBuoy} />
      {detail.isLoading ? <LoadingState message={L.loading} /> : (
        <div className="space-y-3">
          {(detail.data?.messages ?? []).map((m) => (
            <div key={m.id} className={`rounded-lg border border-border p-3 ${m.authorType === 'staff' ? 'bg-surface' : 'bg-background'}`}>
              <p className="mb-1 text-xs text-muted">{m.authorType === 'staff' ? `${L.support}${m.authorName ? ` · ${m.authorName}` : ''}` : L.you}</p>
              <p className="whitespace-pre-wrap text-sm text-primary">{m.body}</p>
            </div>
          ))}
          {tk && tk.status !== 'closed' && (
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={L.reply} onKeyDown={(e) => { if (e.key === 'Enter' && reply.trim()) send.mutate(); }} />
              <Button disabled={send.isPending || !reply.trim()} onClick={() => send.mutate()}><Send className="mr-1 h-4 w-4" />{L.send}</Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
