"use client";

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, queryKeys } from '@/hooks/player-hooks';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { useI18n } from '@/core/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Self-service phone (SMS OTP) verification card. Renders only when the player is
 * NOT yet verified. Sends a code via the backend, confirms it, then refreshes the
 * profile so the "Verified" badge updates. Used on the profile page and, in
 * `withdraw` context, at the top of the withdraw page (withdrawals are blocked
 * server-side until verified when the tenant requires it).
 */
export function PhoneVerifyCard({ context = 'profile' }: { context?: 'profile' | 'withdraw' }) {
  const { locale } = useI18n();
  const bn = locale === 'bn';
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  if (!profile || profile.isPhoneVerified) return null;
  const hasPhone = !!profile.phone;

  const send = async () => {
    setError(null); setBusy(true);
    try {
      const res = await playerApi.requestPhoneOtp(hasPhone ? {} : { phone: phone.trim() });
      if (res.alreadyVerified) { await qc.invalidateQueries({ queryKey: queryKeys.profile }); return; }
      setTarget(res.target ?? null);
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : (bn ? 'কোড পাঠানো যায়নি।' : 'Could not send code.'));
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    setError(null); setBusy(true);
    try {
      await playerApi.confirmPhoneOtp({ code: code.trim() });
      await qc.invalidateQueries({ queryKey: queryKeys.profile });
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : (bn ? 'যাচাই ব্যর্থ হয়েছে।' : 'Verification failed.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-4 rounded-xl border border-brand-2/30 bg-brand-2/10 p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-2" aria-hidden />
        <p className="text-sm font-bold text-white">
          {context === 'withdraw'
            ? (bn ? 'উত্তোলনের জন্য ফোন যাচাই করুন' : 'Verify your phone to withdraw')
            : (bn ? 'আপনার ফোন নম্বর যাচাই করুন' : 'Verify your phone number')}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">
        {bn ? 'আমরা আপনার মোবাইলে একটি এসএমএস কোড পাঠাব।' : 'We will send a one-time SMS code to your mobile.'}
      </p>

      {!sent ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {!hasPhone && (
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" className="flex-1" />
          )}
          <Button onClick={send} disabled={busy || (!hasPhone && !phone.trim())} className="shrink-0">
            {busy ? (bn ? 'পাঠানো হচ্ছে…' : 'Sending…') : (bn ? 'কোড পাঠান' : 'Send code')}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted">
            {bn ? 'কোড পাঠানো হয়েছে ' : 'Code sent to '}
            {target ? <span className="font-semibold text-white">{target}</span> : null}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" maxLength={8} placeholder={bn ? 'যাচাই কোড' : 'Verification code'} className="flex-1" />
            <Button onClick={confirm} disabled={busy || code.trim().length < 4} className="shrink-0">
              {busy ? (bn ? 'যাচাই হচ্ছে…' : 'Verifying…') : (bn ? 'নিশ্চিত করুন' : 'Confirm')}
            </Button>
          </div>
          <button type="button" onClick={send} disabled={busy} className="self-start text-xs font-semibold text-gold-soft hover:underline">
            {bn ? 'আবার কোড পাঠান' : 'Resend code'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
