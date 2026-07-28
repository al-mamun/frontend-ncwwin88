/**
 * Affiliate onboarding wizard: email OTP → phone OTP → KYC upload → review.
 * Drives off the live verification status; each successful step refreshes it.
 *
 * TWO ENTRY POINTS, and they want opposite things:
 *
 *   1. Straight after sign-up (`/affiliate/onboarding`) this is a GATE. It shows
 *      only the steps the tenant actually requires and, once those are satisfied,
 *      sends the partner on to the dashboard. Nobody is held up by a channel
 *      their brand never switched on.
 *
 *   2. "Manage verification" on My account (`?manage=1`) is a DESTINATION. The
 *      partner came here deliberately, so every channel is listed — including the
 *      ones their brand does not require — and the page never redirects away.
 *
 * Collapsing those two into one behaviour is what made the account page's
 * "Manage verification" button a dead end: with, say, email verification turned
 * off tenant-side, `onboardingComplete` was already true, so the click bounced
 * straight back to the dashboard while the account page went on displaying an
 * "Unverified" badge the partner had no way to clear.
 */
'use client';

import BrandLockup from '@/components/shared/brand-lockup';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAffiliateAuth } from '@/providers/affiliate-auth-provider';
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

function Splash() {
  return (
    <div className="relative flex min-h-screen items-center justify-center text-muted">
      <AffiliateBackground />Loading…
    </div>
  );
}

function Dot({ done, active }: { done: boolean; active: boolean }) {
  return (
    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-[var(--success-a22)] text-success' : active ? 'bg-[var(--gold-a22)] text-[var(--gold-soft)]' : 'bg-white/10 text-muted'}`}>
      {done ? '✓' : '•'}
    </span>
  );
}

function Shell({ done, optional, title, desc, children }: { done: boolean; optional?: boolean; title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-6 backdrop-blur ${done ? 'border-[var(--success-a35)] bg-[var(--bg-elevated)]' : 'border-white/10 bg-[var(--bg-elevated)]'}`}>
      <div className="flex items-start gap-3">
        <Dot done={done} active={!done} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {optional && !done && (
              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Optional
              </span>
            )}
          </div>
          {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AffiliateOnboardingPage() {
  // `useSearchParams` opts this route into dynamic rendering, which Next only
  // allows behind a Suspense boundary. Without it `next build` fails the page.
  return (
    <Suspense fallback={<Splash />}>
      <OnboardingWizard />
    </Suspense>
  );
}

function OnboardingWizard() {
  const { me, loading, refresh } = useAffiliateAuth();
  const router = useRouter();
  const manage = useSearchParams().get('manage') === '1';

  useEffect(() => {
    if (loading) return;
    if (!me) { router.replace('/affiliate/login'); return; }
    // Gate mode only: all required steps satisfied (or all turned off) → dashboard.
    // Manage mode never redirects — the partner asked to be here.
    if (!manage && me.verification.onboardingComplete) router.replace('/affiliate/dashboard');
  }, [loading, me, router, manage]);

  if (loading || !me) return <Splash />;

  const v = me.verification;
  // Opt-in: a step is REQUIRED only when the backend says `required: true` — i.e.
  // the tenant switched it on in its dashboard, or (if the tenant never touched
  // it) the owner switched it on platform-wide. A missing/unknown flag counts as
  // not required, so nobody is blocked by a toggle their brand never turned on.
  const needEmail = v.email.required === true;
  const needPhone = v.phone.required === true;
  const needKyc = v.kyc.required === true;

  // What is actually SATISFIED, independent of what is required. KYC counts as
  // done once it is submitted, matching the server's own completeness rule.
  const emailDone = v.email.verified;
  const phoneDone = v.phone.verified;
  const kycDone = v.kyc.status === 'approved' || v.kyc.status === 'pending';
  const allDone = emailDone && phoneDone && kycDone;

  // Gate mode renders required steps only. Manage mode lists every channel so the
  // partner can see and clear the badges My account is showing them.
  const showEmail = manage || needEmail;
  const showPhone = manage || needPhone;
  const showKyc = manage || needKyc;

  // Gate mode with nothing left to do: hold this frame while the effect above
  // navigates. The redirect lives in the effect ON PURPOSE — calling
  // router.replace() during render is a render-phase side effect, which React's
  // StrictMode double-render can drop, wedging this screen on "Loading…"
  // forever. Render stays pure; navigation stays in the effect.
  if (!manage && v.onboardingComplete) return <Splash />;

  return (
    <div className="relative min-h-screen px-4 py-10 text-[#f5f7fa]">
      <AffiliateBackground />
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/affiliate">
            <BrandLockup className="h-11 w-auto object-contain" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold">{manage ? 'Verification' : 'Complete your onboarding'}</h1>
          <p className="mt-1 text-sm text-muted">
            {manage
              ? 'Verify your email and phone and upload your ID. Anything marked optional is not required by your brand — verifying it anyway is up to you.'
              : 'Verify your email and phone, then upload your ID to get approved.'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {showEmail && <EmailStep verified={emailDone} optional={!needEmail} target={v.email.value} onDone={refresh} />}
          {showPhone && <PhoneStep verified={phoneDone} optional={!needPhone} target={v.phone.value} onDone={refresh} />}
          {showKyc && <KycStep status={v.kyc.status} optional={!needKyc} rejectionReason={v.kyc.rejectionReason} fileUrl={v.kyc.fileUrl} docType={v.kyc.docType} onDone={refresh} />}
        </div>

        {manage ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            {allDone && (
              <div className="w-full rounded-2xl border border-[var(--success-a35)] bg-[var(--success-a06)] p-6">
                <p className="text-lg font-semibold text-success">Everything&apos;s verified 🎉</p>
                <p className="mt-2 text-sm text-muted">Nothing left to do here.</p>
              </div>
            )}
            <Link href="/affiliate/account" className="text-sm font-semibold text-[var(--gold-soft)] hover:underline">← Back to my account</Link>
          </div>
        ) : (
          v.onboardingComplete && (
            <div className="mt-6 rounded-2xl border border-[var(--success-a35)] bg-[var(--success-a06)] p-6 text-center backdrop-blur">
              <p className="text-lg font-semibold text-success">You&apos;re all set! 🎉</p>
              <p className="mt-2 text-sm text-muted">
                Verification complete — your account is now awaiting final approval. We&apos;ll notify you once it&apos;s
                approved, then you can start sharing your link.
              </p>
              <Link href="/affiliate/dashboard" className={`mt-4 inline-flex items-center ${GOLD_BTN}`}>Go to dashboard</Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ── Email ── */
function EmailStep({ verified, optional, target, onDone }: { verified: boolean; optional?: boolean; target: string | null; onDone: () => Promise<void> }) {
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
    <Shell done={verified} optional={optional} title={`Verify email${target ? ` (${target})` : ''}`} desc={verified ? undefined : "We'll send a 6-digit code to your email."}>
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
function PhoneStep({ verified, optional, target, onDone }: { verified: boolean; optional?: boolean; target: string | null; onDone: () => Promise<void> }) {
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
    <Shell done={verified} optional={optional} title={`Verify phone${target ? ` (${target})` : ''}`} desc={verified ? undefined : "We'll text a 6-digit code to your phone."}>
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
function KycStep({ status, optional, rejectionReason, fileUrl, docType: submittedDocType, onDone }: { status: string; optional?: boolean; rejectionReason: string | null; fileUrl: string | null; docType: string | null; onDone: () => Promise<void> }) {
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
    <Shell done={status === 'approved'} optional={optional} title="Identity verification (KYC)" desc={desc}>
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
