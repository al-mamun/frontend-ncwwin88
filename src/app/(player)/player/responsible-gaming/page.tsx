'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ResponsibleGamingInput } from '@/types';

const toMajor = (m: number | null | undefined) => (m == null ? '' : String(m / 100));
const toMinor = (v: string): number | null => { const t = v.trim(); if (!t) return null; const n = Number(t); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null; };
const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

export default function ResponsibleGamingPage() {
  const qc = useQueryClient();
  const rg = useQuery({ queryKey: ['player', 'responsible-gaming'], queryFn: () => playerApi.getResponsibleGaming() });
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const d = rg.data;
    setForm({
      depositDailyMinor: toMajor(d?.depositDailyMinor),
      depositWeeklyMinor: toMajor(d?.depositWeeklyMinor),
      depositMonthlyMinor: toMajor(d?.depositMonthlyMinor),
      withdrawalDailyMinor: toMajor(d?.withdrawalDailyMinor),
      coolingOffUntil: toDateInput(d?.coolingOffUntil),
      selfExclusionUntil: toDateInput(d?.selfExclusionUntil),
    });
  }, [rg.data]);

  const save = useMutation({
    mutationFn: (input: ResponsibleGamingInput) => playerApi.setResponsibleGaming(input),
    onSuccess: () => { setMsg({ ok: true, text: 'Your limits have been saved.' }); qc.invalidateQueries({ queryKey: ['player', 'responsible-gaming'] }); },
    onError: (e) => setMsg({ ok: false, text: e instanceof ApiRequestError ? e.message : 'Could not save your limits.' }),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = (extra: Partial<ResponsibleGamingInput> = {}) => {
    setMsg(null);
    save.mutate({
      depositDailyMinor: toMinor(form.depositDailyMinor ?? ''),
      depositWeeklyMinor: toMinor(form.depositWeeklyMinor ?? ''),
      depositMonthlyMinor: toMinor(form.depositMonthlyMinor ?? ''),
      withdrawalDailyMinor: toMinor(form.withdrawalDailyMinor ?? ''),
      coolingOffUntil: form.coolingOffUntil?.trim() ? new Date(form.coolingOffUntil).toISOString() : null,
      ...extra,
    });
  };

  const fields: Array<[string, string, string]> = [
    ['depositDailyMinor', 'Daily deposit limit', 'Max you can deposit per day'],
    ['depositWeeklyMinor', 'Weekly deposit limit', 'Max you can deposit per week'],
    ['depositMonthlyMinor', 'Monthly deposit limit', 'Max you can deposit per month'],
    ['withdrawalDailyMinor', 'Daily withdrawal limit', 'Max you can withdraw per day'],
  ];

  return (
    <PageContainer>
      <PlayerPageHeader title="Responsible Gaming" subtitle="Set your own limits and take a break when you need to" icon={ShieldCheck} />

      {rg.isLoading ? <LoadingState message="Loading…" /> : (
        <div className="space-y-5">
          {rg.data?.selfExcluded && (
            <Card className="border-danger bg-surface"><CardContent className="p-4 text-sm text-danger">Your account is self-excluded until {toDateInput(rg.data.selfExclusionUntil)}. Deposits and play are blocked during this period.</CardContent></Card>
          )}

          <Card className="border-border bg-surface">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-sm font-bold text-primary">My limits</h2>
              <p className="text-xs text-muted">Amounts are in your account currency. Leave blank for no limit. Limits apply immediately.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map(([k, label, hint]) => (
                  <div key={k} className="space-y-1">
                    <label className="text-xs font-medium text-primary">{label}</label>
                    <Input type="number" min={0} value={form[k] ?? ''} placeholder="No limit" onChange={(e) => set(k, e.target.value)} />
                    <p className="text-[11px] text-muted">{hint}</p>
                  </div>
                ))}
              </div>
              <Button disabled={save.isPending} onClick={() => submit()}>{save.isPending ? 'Saving…' : 'Save limits'}</Button>
              {msg && <p className={`text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-sm font-bold text-primary">Take a break</h2>
              <div className="space-y-1">
                <label className="text-xs font-medium text-primary">Cooling-off until</label>
                <Input type="date" value={form.coolingOffUntil ?? ''} onChange={(e) => set('coolingOffUntil', e.target.value)} />
                <p className="text-[11px] text-muted">A short break — deposits are blocked until this date.</p>
              </div>
              <Button variant="outline" disabled={save.isPending} onClick={() => submit()}>Save cooling-off</Button>

              <div className="border-t border-border pt-4">
                <label className="text-xs font-medium text-primary">Self-exclude until</label>
                <Input type="date" value={form.selfExclusionUntil ?? ''} onChange={(e) => set('selfExclusionUntil', e.target.value)} />
                <p className="mt-1 text-[11px] text-muted">Self-exclusion locks deposits and play until the chosen date. This cannot be shortened — please be sure.</p>
                <Button
                  variant="outline"
                  className="mt-2 border-danger text-danger"
                  disabled={save.isPending || !form.selfExclusionUntil?.trim()}
                  onClick={() => { if (window.confirm('Self-exclude until ' + form.selfExclusionUntil + '? You will not be able to deposit or play until then.')) submit({ selfExclusionUntil: new Date(form.selfExclusionUntil).toISOString() }); }}
                >
                  Self-exclude
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
