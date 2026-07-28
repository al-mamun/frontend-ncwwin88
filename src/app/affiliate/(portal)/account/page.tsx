/**
 * Affiliate — My Account. A partner can edit their display name, manage contact
 * verification (email / phone / KYC via onboarding), set a payout method, and
 * change their password. Password uses the shared /auth/change-password.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { affiliateApi } from '@/services/affiliate.service';
import { ApiRequestError } from '@/lib/api';

const CARD = 'rounded-2xl border border-white/10 bg-[var(--bg-elevated)] p-5 backdrop-blur';
const INPUT = 'w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--brand)]';
const BTN = 'rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50';
const PAYOUT_METHODS = ['bank', 'bkash', 'nagad', 'usdt', 'skrill', 'neteller', 'ewallet', 'crypto', 'other', 'manual'];

function Badge({ ok, okText, noText }: { ok: boolean; okText: string; noText: string }) {
  return ok
    ? <span className="rounded-full bg-[var(--success-a22)] px-2.5 py-0.5 text-xs font-semibold text-success">{okText}</span>
    : <span className="rounded-full bg-[var(--danger-a22)] px-2.5 py-0.5 text-xs font-semibold text-danger">{noText}</span>;
}

export default function AffiliateAccountPage() {
  // Session gating, the sidebar and Sign out all live in the (portal) layout -
  // this page renders content only, like every other portal screen.
  const { me, loading, refresh } = useAffiliateAuth();

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
    if (loading || !me) return;
    setName(me.affiliate.displayName || '');
    setMethod(me.affiliate.payoutMethod || 'bank');
    setDetails(me.affiliate.payoutDetails || '');
  }, [loading, me]);

  // The layout gate guarantees a session before this renders; the guard is here
  // purely so the rest of the component can treat `me` as non-null.
  if (!me) return null;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">My account</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Your profile, contact verification, where commission gets paid, and your password.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
          {/*
            `?manage=1` puts the onboarding wizard in manage mode. Without it the
            wizard treats itself as a sign-up gate: when every REQUIRED step is
            satisfied it redirects to the dashboard, so a partner whose brand does
            not require (say) email verification clicked this button, bounced
            straight back, and was left staring at an "Unverified" badge with no
            way to clear it. Manage mode lists every channel and never redirects.
          */}
          <Link href="/affiliate/onboarding?manage=1" className="mt-4 inline-block rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Manage verification</Link>
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
  );
}
