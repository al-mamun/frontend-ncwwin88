'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket } from 'lucide-react';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function money(m: number, c = 'BDT') { return `${c} ${(m / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function CouponsPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const history = useQuery({ queryKey: ['player', 'coupons'], queryFn: () => playerApi.getCoupons() });
  const redeem = useMutation({
    mutationFn: () => playerApi.redeemCoupon(code.trim()),
    onSuccess: (r) => { setMsg({ ok: true, text: `Success! ${money(r.amountMinor, r.currency)} credited to your wallet.` }); setCode(''); qc.invalidateQueries({ queryKey: ['player', 'coupons'] }); qc.invalidateQueries({ queryKey: ['wallet'] }); },
    onError: (e) => setMsg({ ok: false, text: e instanceof ApiRequestError ? e.message : 'Could not redeem this code.' }),
  });
  return (
    <PageContainer>
      <PlayerPageHeader title="Coupons" subtitle="Redeem a promo code for wallet credit" icon={Ticket} />
      <Card className="border-border bg-surface">
        <CardContent className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) redeem.mutate(); }} className="flex flex-col gap-3 sm:flex-row">
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="font-mono uppercase" />
            <Button type="submit" disabled={redeem.isPending || !code.trim()}>{redeem.isPending ? 'Redeeming…' : 'Redeem'}</Button>
          </form>
          {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
        </CardContent>
      </Card>
      <h2 className="mb-3 mt-6 text-sm font-bold text-primary">Redemption history</h2>
      {history.isLoading ? <LoadingState message="Loading…" /> : (history.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted">No coupons redeemed yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {history.data!.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <span className="font-mono font-semibold text-primary">{r.code}</span>
              <span className="text-sm font-bold text-success">+{money(r.amountMinor, r.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
