/**
 * Affiliate — My Account. A partner can edit their display name, manage contact
 * verification (email / phone / KYC via onboarding), set a payout method, and
 * change their password. Password uses the shared /auth/change-password.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLockup from '@/components/shared/brand-lockup';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { affiliateApi } from '@/services/affiliate.service';
import { AffiliateBackground } from '@/components/affiliate/AffiliateBackground';
import { ApiRequestError } from '@/lib/api';

const CARD = 'rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-5 backdrop-blur';
const INPUT = 'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]';
const BTN = 'rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50';
const PAYOUT_METHODS = ['bank', 'bkash', 'nagad', 'usdt', 'skrill', 'neteller', 'ewallet', 'crypto', 'other', 'manual'];

function Badge({ ok, okText, noText }: { ok: boolean; okText: string; noText: string }) {
  return ok
    ? <span className="rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-semibold text-success">{okText}</span>
    : <span className="rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-semibold text-danger">{noText}</span>;
}

export default function AffiliateAccountPage() {
  const { me, loading, logout, refresh } = useAffiliateAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);

  const [method, setMethod] = useState('bank');
  const [details, setDetails] = useState('');
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState<string | null>(null);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!me) { router.replace('/login'); return; }
    setName(me.affiliate.displayName || '');
    setMethod(me.affiliate.payoutMethod || 'bank');
    setDetails(me.affiliate.payoutDetails || '');
  }, [loading, me, router]);

  if (loading || !me) {
    return (
      <div className="relative min-h-screen px-4 py-8 text-[#f5f7fa]">
        <AffiliateBackground />
        <div className="mx-auto max-w-3xl text-sm text-muted">Loading…</div>
      </div>
    );
  }
  const v = me.verification;

  const saveName = async () => {
    setNameBusy(true); setNameMsg(null);
    try { await affiliateApi.updateProfile(name.trim()); await refresh(); setNameMsg('Saved.'); }
    catch (e) { setNameMsg(e instanceof ApiRequestError ? e.message : 'Could not save.'); }
    finally { setNameBusy(false); }
  };

  const savePayout = async () => {
    setPayBusy(true); setPayMsg(null);
    try { await affiliateApi.updatePayoutMethod(method, details.trim()); await refresh(); setPayMsg('Payout method saved.'); }
    catch (e) { setPayMsg(e instanceof ApiRequestError ? e.message : 'Could not save.'); }
    finally { setPayBusy(false); }
  };

  const savePw = async () => {
    setPwErr(null); setPwMsg(null);
    if (newPw.length < 8) { setPwErr('New password must be at least 8 characters.'); return; }
    if (newPw !== confPw) { setPwErr('New passwords do not match.'); return; }
    setPwBusy(true);
    try {
      await affiliateApi.changePassword(curPw, newPw);
      setPwMsg('Password changed.'); setCurPw(''); setNewPw(''); setConfPw('');
    } catch (e) { setPwErr(e instanceof ApiRequestError ? e.message : 'Could not change password.'); }
    finally { setPwBusy(false); }
  };

  return (
    <div className="relative min-h-screen px-4 py-8 text-[#f5f7fa]">
      <AffiliateBackground />
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <BrandLockup className="h-8 w-auto object-contain" />
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-[var(--gold-soft)]">PARTNER</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">Dashboard</Link>
            <button onClick={() => { void logout().then(() => router.replace('/login')); }} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">Sign out</button>
          </div>
        </header>

        <h1 className="mb-6 text-2xl font-bold">My Account</h1>

        <div className="grid gap-5 md:grid-cols-2">
          <section className={CARD}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--gold-soft)]">Profile</h2>
            <label className="mb-1 block text-xs font-semibold text-muted">Display name</label>
            <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
            <p className="mt-2 text-xs text-muted">Affiliate code <span className="font-mono font-semibold text-[var(--gold-soft)]">{me.affiliate.code}</span></p>
            <button className={BTN + ' mt-3'} onClick={saveName} disabled={nameBusy || !name.trim()}>{nameBusy ? 'Saving…' : 'Save'}</button>
            {nameMsg && <p className="mt-2 text-xs text-muted">{nameMsg}</p>}
          </section>

          <section className={CARD}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--gold-soft)]">Contact &amp; verification</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="text-xs text-muted">Email</p><p className="truncate">{v.email.value || '—'}</p></div>
                <Badge ok={v.email.verified} okText="Verified" noText="Unverified" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="text-xs text-muted">Phone</p><p className="truncate">{v.phone.value || '—'}</p></div>
                <Badge ok={v.phone.verified} okText="Verified" noText="Unverified" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div><p className="text-xs text-muted">KYC</p><p className="capitalize">{v.kyc.status}</p></div>
                <Badge ok={v.kyc.status === 'approved'} okText="Approved" noText={v.kyc.status === 'pending' ? 'Pending' : 'Required'} />
              </div>
            </div>
            <Link href="/onboarding" className="mt-4 inline-block rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Manage verification</Link>
          </section>

          <section className={CARD}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--gold-soft)]">Payout method</h2>
            <label className="mb-1 block text-xs font-semibold text-muted">Method</label>
            <select className={INPUT} value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYOUT_METHODS.map((m) => <option key={m} value={m} className="bg-[#14161b]">{m.toUpperCase()}</option>)}
            </select>
            <label className="mb-1 mt-3 block text-xs font-semibold text-muted">Account / destination details</label>
            <input className={INPUT} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Account number, wallet address, etc." />
            <button className={BTN + ' mt-3'} onClick={savePayout} disabled={payBusy}>{payBusy ? 'Saving…' : 'Save payout'}</button>
            {payMsg && <p className="mt-2 text-xs text-muted">{payMsg}</p>}
          </section>

          <section className={CARD}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--gold-soft)]">Change password</h2>
            <input type="password" className={INPUT + ' mb-2'} value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="Current password" autoComplete="current-password" />
            <input type="password" className={INPUT + ' mb-2'} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" autoComplete="new-password" />
            <input type="password" className={INPUT} value={confPw} onChange={(e) => setConfPw(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" />
            <button className={BTN + ' mt-3'} onClick={savePw} disabled={pwBusy || !curPw || !newPw}>{pwBusy ? 'Changing…' : 'Change password'}</button>
            {pwErr && <p className="mt-2 text-xs text-danger">{pwErr}</p>}
            {pwMsg && !pwErr && <p className="mt-2 text-xs text-success">{pwMsg}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
