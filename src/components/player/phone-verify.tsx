'use client';

import { useState } from 'react';
import { Smartphone, X, Check, ShieldAlert } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, queryKeys } from '@/hooks/player-hooks';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { useI18n } from '@/core/i18n/LanguageProvider';

/** SMS phone-verification popup (send code + enter code). White card, theme-independent. */
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

  if (!open) return null;
  const hasPhone = !!profile?.phone;
  const target = profile?.phone ?? phone;

  const send = async () => {
    setError(null); setOkMsg(null); setBusy(true);
    try {
      const res = await playerApi.requestPhoneOtp(hasPhone ? {} : { phone: phone.trim() });
      if (res.alreadyVerified) { await qc.invalidateQueries({ queryKey: queryKeys.profile }); onClose(); return; }
      setSent(true);
      setOkMsg(bn ? 'কোড পাঠানো হয়েছে।' : 'Code sent to your phone.');
    } catch (e) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Smartphone className="h-6 w-6" aria-hidden />
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-xl font-extrabold uppercase tracking-wide text-blue-900">{bn ? 'ফোন যাচাই' : 'Phone Verification'}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {bn ? "এসএমএস ওটিপি পেতে 'কোড পাঠান' চাপুন — " : "Click 'Send Code' to receive an SMS OTP at "}
          <span className="font-bold text-blue-700">{target || '—'}</span>
        </p>

        <button type="button" onClick={send} disabled={busy || (!hasPhone && !phone.trim())}
          className="mt-5 w-full rounded-xl bg-blue-700 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-800 disabled:opacity-50">
          {busy && !sent ? (bn ? 'পাঠানো হচ্ছে…' : 'Sending…') : (bn ? 'এসএমএস কোড পাঠান' : 'Send SMS Code')}
        </button>

        {!hasPhone && (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX"
            className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500" />
        )}

        <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> {bn ? 'অথবা কোড দিন' : 'Or enter code'} <span className="h-px flex-1 bg-gray-200" />
        </div>

        <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={8}
          placeholder={bn ? '৬-সংখ্যার কোড দিন' : 'Enter 6-digit code'}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-gray-900 outline-none focus:border-blue-500" />

        <button type="button" onClick={verify} disabled={busy || code.trim().length < 4}
          className="mt-4 w-full rounded-xl bg-green-600 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-green-700 disabled:opacity-50">
          {busy && sent ? (bn ? 'যাচাই হচ্ছে…' : 'Verifying…') : (bn ? 'ফোন যাচাই করুন' : 'Verify Phone')}
        </button>

        {error && <p className="mt-3 text-center text-xs font-semibold text-red-600">{error}</p>}
        {okMsg && !error && <p className="mt-3 text-center text-xs font-semibold text-green-600">{okMsg}</p>}
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
      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-bold uppercase text-green-500">
        <Check className="h-3.5 w-3.5" aria-hidden /> {bn ? 'যাচাইকৃত' : 'Verified'}
      </span>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold uppercase text-red-500 transition hover:bg-red-500/25">
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
