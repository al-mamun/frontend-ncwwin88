'use client';

import { useEffect, useState } from 'react';
import { Smartphone, X, Check, ShieldAlert } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, queryKeys } from '@/hooks/player-hooks';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { useI18n } from '@/core/i18n/LanguageProvider';

/** SMS phone-verification popup. Themed via tokens so it follows each site's
 *  branding (surface / brand / success colours), light or dark. */
export function PhoneVerifyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Tick the resend cooldown down to zero, once per second.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!open) return null;
  const hasPhone = !!profile?.phone;
  const target = profile?.phone ?? phone;

  const send = async () => {
    if (cooldown > 0) return;
    setError(null); setOkMsg(null); setBusy(true);
    try {
      const res = await playerApi.requestPhoneOtp(hasPhone ? {} : { phone: phone.trim() });
      if (res.alreadyVerified) { await qc.invalidateQueries({ queryKey: queryKeys.profile }); onClose(); return; }
      setSent(true);
      setOkMsg(bn ? 'কোড পাঠানো হয়েছে।' : 'Code sent to your phone.');
      setCooldown(60); // matches the backend 60s resend cooldown
    } catch (e) {
      // Pull the remaining seconds from the structured payload or the message text
      // so the "please wait Ns" notice can actually count down instead of sitting static.
      let secs = 0;
      if (e instanceof ApiRequestError) {
        const d = e.details as { retryAfterSec?: number } | undefined;
        if (typeof d?.retryAfterSec === 'number') secs = d.retryAfterSec;
        else { const m = /(\d+)\s*s/.exec(e.message); if (m) secs = parseInt(m[1], 10); }
      }
      if (secs > 0) setCooldown(secs);
      setError(e instanceof ApiRequestError ? e.message : (bn ? 'কোড পাঠানো যায়নি।' : 'Could not send code.'));
    } finally { setBusy(false); }
  };

  const verify = async () => {
    setError(null); setBusy(true);
    try {
      await playerApi.confirmPhoneOtp({ code: code.trim() });
      await qc.invalidateQueries({ queryKey: queryKeys.profile });
      onClose();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : (bn ? 'যাচাই ব্যর্থ হয়েছে।' : 'Verification failed.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-[var(--text-primary,#fff)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-2/15 text-brand-2">
            <Smartphone className="h-6 w-6" aria-hidden />
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-muted transition-colors hover:text-[var(--text-primary,#fff)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary,#fff)]">{bn ? 'ফোন যাচাই' : 'Phone Verification'}</h2>
        <p className="mt-2 text-sm text-muted">
          {bn ? "এসএমএস ওটিপি পেতে 'কোড পাঠান' চাপুন — " : "Click 'Send Code' to receive an SMS OTP at "}
          <span className="font-bold text-brand-2">{target || '—'}</span>
        </p>

        <button type="button" onClick={send} disabled={busy || cooldown > 0 || (!hasPhone && !phone.trim())}
          className="mt-5 w-full rounded-xl bg-brand-2 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-50">
          {busy && !sent
            ? (bn ? 'পাঠানো হচ্ছে…' : 'Sending…')
            : cooldown > 0
              ? (bn ? `আবার পাঠান (${cooldown}s)` : `Resend in ${cooldown}s`)
              : sent
                ? (bn ? 'কোড আবার পাঠান' : 'Resend SMS Code')
                : (bn ? 'এসএমএস কোড পাঠান' : 'Send SMS Code')}
        </button>

        {!hasPhone && (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX"
            className="mt-3 w-full rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-[var(--text-primary,#fff)] outline-none placeholder:text-muted focus:border-brand-2" />
        )}

        <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-border" /> {bn ? 'অথবা কোড দিন' : 'Or enter code'} <span className="h-px flex-1 bg-border" />
        </div>

        <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={8}
          placeholder={bn ? '৬-সংখ্যার কোড দিন' : 'Enter 6-digit code'}
          className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-[var(--text-primary,#fff)] outline-none placeholder:text-muted focus:border-brand-2" />

        <button type="button" onClick={verify} disabled={busy || code.trim().length < 4}
          className="mt-4 w-full rounded-xl bg-success py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:opacity-90 disabled:opacity-50">
          {busy && sent ? (bn ? 'যাচাই হচ্ছে…' : 'Verifying…') : (bn ? 'ফোন যাচাই করুন' : 'Verify Phone')}
        </button>

        {error
          ? <p className="mt-3 text-center text-xs font-semibold text-danger">
              {cooldown > 0
                ? (bn ? `আরেকটি কোড চাইতে ${cooldown} সেকেন্ড অপেক্ষা করুন।` : `Please wait ${cooldown}s before requesting another code.`)
                : error}
            </p>
          : okMsg && <p className="mt-3 text-center text-xs font-semibold text-success">{okMsg}</p>}
      </div>
    </div>
  );
}

/** Verify / Verified control for the profile phone row (same size; opens the modal). */
export function PhoneVerifyButton() {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  if (profile.isPhoneVerified) {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success/15 px-3 py-1.5 text-xs font-bold uppercase text-success">
        <Check className="h-3.5 w-3.5" aria-hidden /> {bn ? 'যাচাইকৃত' : 'Verified'}
      </span>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-bold uppercase text-danger transition hover:bg-danger/25">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> {bn ? 'যাচাই করুন' : 'Verify'}
      </button>
      <PhoneVerifyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Withdraw-page gate card (shown only when required + unverified). Opens the modal. */
export function PhoneVerifyPrompt() {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-2/15 text-brand-2">
        <ShieldAlert className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="mt-3 text-lg font-bold text-[var(--text-primary,#fff)]">{bn ? 'উত্তোলনের আগে ফোন যাচাই করুন' : 'Verify your phone to withdraw'}</h3>
      <p className="mt-1 text-sm text-muted">{bn ? 'উত্তোলনের অনুরোধের আগে আপনার মোবাইল নম্বর যাচাই করতে হবে।' : 'Please verify your mobile number before you can request a withdrawal.'}</p>
      <button type="button" onClick={() => setOpen(true)}
        className="mx-auto mt-4 rounded-xl bg-brand-2 px-6 py-2.5 text-sm font-bold uppercase text-white transition hover:opacity-90">
        {bn ? 'এখন যাচাই করুন' : 'Verify Now'}
      </button>
      <PhoneVerifyModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/**
 * Back-compat wrapper for pages that still import PhoneVerifyCard.
 * profile  -> inline Verify/Verified pill (opens the redesigned modal popup).
 * withdraw -> the "verify to withdraw" gate card.
 * Renders nothing once the player is verified (mirrors the previous card).
 */
export function PhoneVerifyCard({ context = 'profile' }: { context?: 'profile' | 'withdraw' }) {
  const { data: profile } = useProfile();
  if (!profile || profile.isPhoneVerified) return null;
  if (context === 'withdraw') return <PhoneVerifyPrompt />;
  return (
    <div className="mt-4 flex">
      <PhoneVerifyButton />
    </div>
  );
}
