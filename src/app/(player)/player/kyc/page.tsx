/**
 * KYC Verification — player identity verification (manual review).
 *
 * Shows the current status and, when the player can act (not submitted / rejected
 * / revoked), a submission form (full name, date of birth, document number, note).
 * Submitting sends it for manual review (status → SUBMITTED). Wired to the real
 * backend: GET/POST /player/kyc. Document image upload is a separate flow.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useKyc, useSubmitKyc } from '@/hooks/player-hooks';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { PageContainer, LoadingState, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/card-badge-label';
import { cn } from '@/lib/utils';
import type { PlayerKycStatus, SubmitKycInput } from '@/types';

const STATUS_META: Record<
  PlayerKycStatus,
  { label: string; tone: string; icon: typeof BadgeCheck; blurb: string; canSubmit: boolean }
> = {
  NOT_SUBMITTED: {
    label: 'Not Verified',
    tone: 'bg-brand-2/15 text-brand-2',
    icon: ShieldAlert,
    blurb: 'Verify your identity to unlock withdrawals and higher limits.',
    canSubmit: true,
  },
  REJECTED: {
    label: 'Rejected',
    tone: 'bg-danger/15 text-danger',
    icon: ShieldAlert,
    blurb: 'Your previous submission was rejected. Please review and submit again.',
    canSubmit: true,
  },
  REVOKED: {
    label: 'Revoked',
    tone: 'bg-danger/15 text-danger',
    icon: ShieldAlert,
    blurb: 'Your verification was revoked. Please submit your details again.',
    canSubmit: true,
  },
  SUBMITTED: {
    label: 'Under Review',
    tone: 'bg-warning/15 text-warning',
    icon: Clock,
    blurb: 'Your documents are being reviewed. This usually takes a short while.',
    canSubmit: false,
  },
  PENDING: {
    label: 'Under Review',
    tone: 'bg-warning/15 text-warning',
    icon: Clock,
    blurb: 'Your verification is in review. We will update your status soon.',
    canSubmit: false,
  },
  APPROVED: {
    label: 'Verified',
    tone: 'bg-success/15 text-success',
    icon: ShieldCheck,
    blurb: 'Your identity is verified. You have full access to withdrawals.',
    canSubmit: false,
  },
};

export default function KycPage() {
  const router = useRouter();
  const { data: kyc, isLoading, isError } = useKyc();
  const submit = useSubmitKyc();

  const [form, setForm] = useState<SubmitKycInput>({});
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (kyc) {
      setForm({
        fullName: kyc.fullName ?? '',
        docNumber: kyc.docNumber ?? '',
        dob: kyc.dob ? kyc.dob.slice(0, 10) : '',
        notes: kyc.notes ?? '',
      });
    }
  }, [kyc]);

  if (isLoading) return <LoadingState message="Loading verification…" />;
  if (isError || !kyc)
    return (
      <PageContainer>
        <ErrorState message="Unable to load verification status." />
      </PageContainer>
    );

  const meta = STATUS_META[kyc.status] ?? STATUS_META.NOT_SUBMITTED;
  const Icon = meta.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName?.trim()) return setError('Please enter your full legal name.');
    if (!form.dob) return setError('Please enter your date of birth.');
    if (!form.docNumber?.trim()) return setError('Please enter your document number.');
    try {
      let documentUrl: string | undefined;
      if (docFile) {
        setUploading(true);
        try {
          const up = await playerApi.uploadImage(docFile, 'kyc');
          documentUrl = up.url;
        } finally {
          setUploading(false);
        }
      }
      await submit.mutateAsync({
        fullName: form.fullName.trim(),
        docNumber: form.docNumber.trim(),
        dob: form.dob,
        notes: form.notes?.trim() || undefined,
        documentUrl,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Submission failed. Please try again.');
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Button onClick={() => router.push('/player/account')} variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <BadgeCheck className="h-5 w-5 text-gold-soft" aria-hidden /> KYC Verification
          </h1>
        </div>

        {/* Status card */}
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-gold-soft/20 bg-gradient-to-b from-elevated to-surface p-5">
          <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', meta.tone)}>
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Status</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', meta.tone)}>
                {meta.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">{meta.blurb}</p>
            {kyc.status === 'REJECTED' && kyc.rejectionReason && (
              <p className="mt-1 text-xs text-danger">Reason: {kyc.rejectionReason}</p>
            )}
          </div>
        </div>

        {done ? (
          <div className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            Submitted! Your verification is now under review.
          </div>
        ) : meta.canSubmit ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full Legal Name</Label>
              <Input id="fullName" value={form.fullName ?? ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="As on your ID" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={form.dob ?? ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="docNumber">Document Number</Label>
                <Input id="docNumber" value={form.docNumber ?? ''} onChange={(e) => setForm({ ...form, docNumber: e.target.value })} placeholder="NID / Passport / License no." />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Note (optional)</Label>
              <Input id="notes" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything the reviewer should know" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="kycDoc">Identity document (image)</Label>
              <input
                id="kycDoc"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-elevated file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-colors hover:file:border-gold-soft/50 hover:file:bg-base"
              />
              <p className="text-xs text-muted">Upload a clear photo of your NID, passport or license (PNG/JPG/WEBP, max 8MB). Optional but speeds up review.</p>
              {kyc.documentUrl && !docFile && (
                <a href={kyc.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-gold-soft underline">View previously uploaded document</a>
              )}
            </div>

            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            )}

            <Button type="submit" disabled={submit.isPending || uploading} className="w-full">
              {uploading ? 'Uploading document…' : submit.isPending ? 'Submitting…' : 'Submit for Verification'}
            </Button>
          </form>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            {kyc.fullName && <p><span className="text-white">Name:</span> {kyc.fullName}</p>}
            {kyc.submittedAt && <p className="mt-1">Submitted {new Date(kyc.submittedAt).toLocaleDateString()}</p>}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
