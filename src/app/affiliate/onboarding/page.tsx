/**
 * Affiliate onboarding wizard: email OTP → phone OTP → KYC upload → review.
 * Drives off the live verification status; each successful step refreshes it.
 */
'use client';

import BrandLockup from '@/components/shared/brand-lockup';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
import { useTenant } from '@/core/tenant/TenantProvider';
import { affiliateApi } from '@/services/affiliate.service';
import { ApiRequestError } from '@/lib/api';
import { AffiliateBackground } from '@/components/affiliate/AffiliateBackground';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/card-badge-label';

const DOC_TYPES = [
  { value: 'nid', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: "Driver's License" },
];

const FIELD = 'h-11 border-white/10 bg-[var(--bg-base)]';
const GOLD_BTN = 'h-11 rounded-xl bg-[linear-gradient(180deg,var(--gold-soft),var(--brand-2-dark))] px-5 font-bold text-[var(--bg-base)] shadow-[0_10px_24px_-10px_rgba(255,193,7,0.7)] transition-transform hover:-translate-y-0.5 disabled:opacity-60';
const GHOST_BTN = 'h-11 rounded-xl border border-white/15 bg-white/5 px-5 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60';

function Dot({ done, active }: { done: boolean; active: boolean }) {
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-success/20 text-success' : active ? 'bg-[var(--brand)]/20 text-[var(--gold-soft)]' : 'bg-white/10 text-muted'}`}>
      {done ? '✓' : '•'}
    </span>
  );
}

function Shell({ done, title, desc, children }: { done: boolean; title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-6 backdrop-blur ${done ? 'border-success/40 bg-[var(--bg-elevated)]' : 'border-white/10 bg-[var(--bg-elevated)]'}`}>
      <div className="flex items-start gap-3">
        <Dot done={done} active={!done} />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AffiliateOnboardingPage() {
  const { me, loading, refresh } = useAffiliateAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!me) { router.replace('/login'); return; }
    // All required steps satisfied (or all turned off) → go to the dashboard.
    if (me.verification.onboardingComplete) router.replace('/dashboard');
  }, [loading, me, router]);

  if (loading || !me) {
    return (
      <div className="relative flex min-h-screen items-center justify-center text-muted">
        <AffiliateBackground />Loading…
      </div>
    );
  }

  const v = me.verification;
  // A step is shown only if the tenant REQUIRES it (default true when the flag is
  // absent). Steps the tenant turned off are skipped entirely — never rendered.
  const needEmail = v.email.required !== false;
  const needPhone = v.phone.required !== false;
  const needKyc = v.kyc.required !== false;

  // If onboarding is already complete (e.g. all required steps satisfied or all
  // turned off), send the affiliate straight to the dashboard — no flash.
  if (v.onboardingComplete) {
    router.replace('/dashboard');
    return (
      <div className="relative flex min-h-screen items-center justify-center text-muted">
        <AffiliateBackground />Loading…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-10 text-[#f5f7fa]">
      <AffiliateBackground />
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
                        <BrandLockup className="h-11 w-auto object-contain" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Complete your onboarding</h1>
          <p className="mt-1 text-sm text-muted">Verify your email and phone, then upload your ID to get approved.</p>
        </div>

        <div className="flex flex-col gap-4">
          {needEmail && <EmailStep verified={v.email.verified} target={v.email.value} onDone={refresh} />}
          {needPhone && <PhoneStep verified={v.phone.verified} target={v.phone.value} onDone={refresh} />}
          {needKyc && <KycStep status={v.kyc.status} rejectionReason={v.kyc.rejectionReason} fileUrl={v.kyc.fileUrl} docType={v.kyc.docType} onDone={refresh} />}
        </div>

        {v.onboardingComplete && (
          <div className="mt-6 rounded-2xl border border-success/40 bg-success/5 p-6 text-center backdrop-blur">
            <p className="text-lg font-semibold text-success">You&apos;re all set! 🎉</p>
            <p className="mt-2 text-sm text-muted">
              Verification complete — your account is now awaiting final approval. We&apos;ll notify you once it&apos;s
              approved, then you can start sharing your link.
            </p>
            <Link href="/dashboard" className={`mt-4 inline-flex items-center ${GOLD_BTN}`}>Go to dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Email ── */
function EmailStep({ verified, target, onDone }: { verified: boolean; target: string | null; onDone: () => Promise<void> }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    setErr(null); setMsg(null); setBusy(true);
    try {
      const r = await affiliateApi.requestEmailOtp();
      if (r.alreadyVerified) { await onDone(); return; }
      setSent(true);
      setMsg(r.delivered ? `Code sent to ${r.target ?? 'your email'}.` : 'Code generated. (Email delivery may be unconfigured — contact support.)');
    } catch (e) { setErr(e instanceof ApiRequestError ? e.message : 'Could not send code.'); } finally { setBusy(false); }
  };
  const confirm = async () => {
    setErr(null); setBusy(true);
    try { await affiliateApi.confirmEmailOtp(code.trim()); await onDone(); }
    catch (e) { setErr(e instanceof ApiRequestError ? e.message : 'Invalid code.'); } finally { setBusy(false); }
  };

  return (
    <Shell done={verified} title={`Verify email${target ? ` (${target})` : ''}`} desc={verified ? undefined : "We'll send a 6-digit code to your email."}>
      {!verified && (
        <div className="mt-4 flex flex-col gap-3">
          {!sent ? (
            <button onClick={send} disabled={busy} className={GOLD_BTN}>{busy ? 'Sending…' : 'Send code'}</button>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email-code" className="text-white/80">Enter code</Label>
                <Input id="email-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={FIELD} />
              </div>
              <div className="flex gap-2">
                <button onClick={confirm} disabled={busy || code.length < 4} className={GOLD_BTN}>{busy ? 'Verifying…' : 'Verify'}</button>
                <button onClick={send} disabled={busy} className={GHOST_BTN}>Resend</button>
              </div>
            </>
          )}
          {msg && <p className="text-xs text-muted">{msg}</p>}
          {err && <p className="text-xs text-danger">{err}</p>}
        </div>
      )}
    </Shell>
  );
}

/* ── Phone ── */
function PhoneStep({ verified, target, onDone }: { verified: boolean; target: string | null; onDone: () => Promise<void> }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    setErr(null); setMsg(null); setBusy(true);
    try {
      const r = await affiliateApi.requestPhoneOtp();
      if (r.alreadyVerified) { await onDone(); return; }
      setSent(true);
      setMsg(r.delivered ? `Code sent to ${r.target ?? 'your phone'}.` : 'Code generated. (SMS delivery may be unconfigured — contact support.)');
    } catch (e) { setErr(e instanceof ApiRequestError ? e.message : 'Could not send code.'); } finally { setBusy(false); }
  };
  const confirm = async () => {
    setErr(null); setBusy(true);
    try { await affiliateApi.confirmPhoneOtp(code.trim()); await onDone(); }
    catch (e) { setErr(e instanceof ApiRequestError ? e.message : 'Invalid code.'); } finally { setBusy(false); }
  };

  return (
    <Shell done={verified} title={`Verify phone${target ? ` (${target})` : ''}`} desc={verified ? undefined : "We'll text a 6-digit code to your phone."}>
      {!verified && (
        <div className="mt-4 flex flex-col gap-3">
          {!sent ? (
            <button onClick={send} disabled={busy} className={GOLD_BTN}>{busy ? 'Sending…' : 'Send code'}</button>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone-code" className="text-white/80">Enter code</Label>
                <Input id="phone-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={FIELD} />
              </div>
              <div className="flex gap-2">
                <button onClick={confirm} disabled={busy || code.length < 4} className={GOLD_BTN}>{busy ? 'Verifying…' : 'Verify'}</button>
                <button onClick={send} disabled={busy} className={GHOST_BTN}>Resend</button>
              </div>
            </>
          )}
          {msg && <p className="text-xs text-muted">{msg}</p>}
          {err && <p className="text-xs text-danger">{err}</p>}
        </div>
      )}
    </Shell>
  );
}

/* ── KYC ── */
function KycStep({ status, rejectionReason, fileUrl, docType: submittedDocType, onDone }: { status: string; rejectionReason: string | null; fileUrl: string | null; docType: string | null; onDone: () => Promise<void> }) {
  const [docType, setDocType] = useState('nid');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submitted = status === 'pending' || status === 'approved';
  const isRejected = status === 'rejected';
  const desc = status === 'approved' ? 'Your document was approved.'
    : status === 'pending' ? 'Your document is under review.'
    : isRejected ? `Rejected${rejectionReason ? `: ${rejectionReason}` : ''}. Please re-upload.`
    : 'Upload a clear photo of your ID (PNG/JPG/WEBP, max 8MB).';

  const upload = async () => {
    if (!file) { setErr('Choose a file first.'); return; }
    setErr(null); setBusy(true);
    try { await affiliateApi.uploadKyc(file, docType); await onDone(); }
    catch (e) { setErr(e instanceof ApiRequestError ? e.message : 'Upload failed.'); } finally { setBusy(false); }
  };

  const docLabel = DOC_TYPES.find((d) => d.value === submittedDocType)?.label ?? submittedDocType;

  return (
    <Shell done={status === 'approved'} title="Identity verification (KYC)" desc={desc}>
      {fileUrl && (
        <div className="mt-4 rounded-xl border border-white/10 bg-[var(--bg-base)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Uploaded document{docLabel ? ` · ${docLabel}` : ''}</span>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--gold-soft)] hover:underline">View full size ↗</a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl} alt="Uploaded KYC document" className="max-h-48 w-full rounded-lg object-contain" />
        </div>
      )}
      {status !== 'approved' && (!submitted || isRejected) && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="docType" className="text-white/80">Document type</Label>
            <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} className="h-11 rounded-md border border-white/10 bg-[var(--bg-base)] px-3 text-sm text-white">
              {DOC_TYPES.map((d) => <option key={d.value} value={d.value} className="bg-[var(--bg-elevated)]">{d.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="kyc-file" className="text-white/80">Document image</Label>
            <Input id="kyc-file" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="border-white/10 bg-[var(--bg-base)] file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white" />
          </div>
          <button onClick={upload} disabled={busy} className={GOLD_BTN}>{busy ? 'Uploading…' : 'Upload document'}</button>
          {err && <p className="text-xs text-danger">{err}</p>}
        </div>
      )}
    </Shell>
  );
}
