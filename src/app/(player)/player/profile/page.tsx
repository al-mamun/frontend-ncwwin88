/**
 * Personal Info — reference-style profile view + collapsible edit.
 *
 * Read view: avatar + name + membership badge, then info rows (Full Name,
 * Username, Mobile, Email) with KYC-derived "Verified" pills. An "Edit Profile"
 * toggle reveals the editable fields (first/last name, phone, language, timezone).
 * Email is read-only. Themed via tokens (bdbet21).
 */
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Headphones, User, BadgeCheck, Phone, Mail, AtSign, Pencil,
} from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/player-hooks';
import { PhoneVerifyButton } from '@/components/player/phone-verify';
import { useI18n } from '@/core/i18n/LanguageProvider';
import { playerApi } from '@/services/player.service';
import { ApiRequestError } from '@/lib/api';
import { PageContainer, LoadingState, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/card-badge-label';
import { cn } from '@/lib/utils';
import type { UpdateProfileInput } from '@/types';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
];
const TIMEZONES = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Karachi', 'UTC', 'America/New_York'];

function InfoRow({
  icon: Icon, label, value, verified, locale, action,
}: { icon: typeof User; label: string; value: string; verified?: boolean; locale: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-elevated/60 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-gold-soft">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-white">{value || '—'}</p>
      </div>
      {action ? action : (verified && (
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-success/40 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
          <BadgeCheck className="h-3 w-3" aria-hidden /> {locale === 'bn' ? 'যাচাইকৃত' : 'Verified'}
        </span>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { locale } = useI18n();
  const { data: profile, isLoading, isError } = useProfile();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfileInput>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        email: profile.email ?? '',
        phone: profile.phone ?? '',
        avatar: profile.avatar ?? '',
        language: profile.language,
        timezone: profile.timezone,
      });
    }
  }, [profile]);

  if (isLoading) return <LoadingState message={locale === 'bn' ? 'প্রোফাইল লোড হচ্ছে…' : 'Loading profile…'} />;
  if (isError || !profile)
    return (
      <PageContainer>
        <ErrorState message={locale === 'bn' ? 'প্রোফাইল লোড করা যায়নি।' : 'Unable to load profile.'} />
      </PageContainer>
    );

  const verified = profile.kycStatus === 'APPROVED';
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const displayName = fullName || profile.username;
  const initial = (displayName || '?').charAt(0).toUpperCase();

  const onAvatarFile = async (file: File | null) => {
    if (!file) return;
    setUploadErr(null);
    setAvatarUploading(true);
    try {
      const up = await playerApi.uploadImage(file, 'avatar');
      setForm((prev) => ({ ...prev, avatar: up.url }));
    } catch (err) {
      setUploadErr(err instanceof ApiRequestError ? err.message : (locale === 'bn' ? 'আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await updateProfile.mutateAsync(form);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : (locale === 'bn' ? 'আপডেট ব্যর্থ হয়েছে।' : 'Update failed.'));
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/player/account')} variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{locale === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Info'}</h1>
          </div>
          <Headphones className="h-5 w-5 text-gold-soft" aria-hidden />
        </div>

        {/* Avatar + name + membership */}
        <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-gold-soft/20 bg-gradient-to-b from-elevated to-surface py-6">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-elevated text-3xl font-extrabold text-gold-soft ring-2 ring-gold-soft/30">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <p className="text-lg font-bold text-white">{displayName}</p>
          <span className={cn(
            'rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide',
            verified ? 'bg-success/15 text-success' : 'bg-brand-2/15 text-brand-2',
          )}>
            {verified ? (locale === 'bn' ? 'যাচাইকৃত সদস্য' : 'Verified Member') : (locale === 'bn' ? 'সাধারণ সদস্য' : 'Standard Member')}
          </span>
        </div>

        {/* Info rows */}
        <div className="flex flex-col gap-2">
          <InfoRow icon={User} label={locale === 'bn' ? 'পুরো নাম' : 'Full Name'} value={fullName} locale={locale} />
          <InfoRow icon={AtSign} label={locale === 'bn' ? 'ইউজারনেম' : 'Username'} value={profile.username} locale={locale} />
          <InfoRow icon={Phone} label={locale === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} value={profile.phone ?? ''} action={<PhoneVerifyButton />} locale={locale} />
          <InfoRow icon={Mail} label={locale === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'} value={profile.email} verified={verified} locale={locale} />
        </div>


        {success && (
          <div className="mt-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            {locale === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে।' : 'Profile updated successfully.'}
          </div>
        )}

        {/* Edit toggle + form */}
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline" className="mt-5 flex w-full items-center justify-center gap-2">
            <Pencil className="h-4 w-4" aria-hidden /> {locale === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">{locale === 'bn' ? 'প্রথম নাম' : 'First Name'}</Label>
                <Input id="firstName" value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">{locale === 'bn' ? 'শেষ নাম' : 'Last Name'}</Label>
                <Input id="lastName" value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{locale === 'bn' ? 'ইমেইল' : 'Email'}</Label>
              <Input id="email" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={locale === 'bn' ? 'you@example.com' : 'you@example.com'} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{locale === 'bn' ? 'ফোন' : 'Phone'}</Label>
              <Input id="phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={locale === 'bn' ? '+8801XXXXXXXXX' : '+8801XXXXXXXXX'} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avatar">{locale === 'bn' ? 'প্রোফাইল ছবির URL' : 'Profile Image URL'}</Label>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-lg font-bold text-gold-soft ring-1 ring-gold-soft/30">
                  {form.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatar} alt={locale === 'bn' ? 'অবতার প্রিভিউ' : 'Avatar preview'} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    initial
                  )}
                </span>
                <Input id="avatar" value={form.avatar ?? ''} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder={locale === 'bn' ? 'https://…/photo.jpg' : 'https://…/photo.jpg'} />
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                className="block w-full cursor-pointer text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-border file:bg-elevated file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-colors hover:file:border-gold-soft/50 hover:file:bg-base"
              />
              <p className="text-xs text-muted">{avatarUploading ? (locale === 'bn' ? 'আপলোড হচ্ছে…' : 'Uploading…') : (locale === 'bn' ? 'একটি ছবি আপলোড করুন (PNG/JPG/WEBP, সর্বোচ্চ 8MB) অথবা উপরে একটি লিংক পেস্ট করুন।' : 'Upload an image (PNG/JPG/WEBP, max 8MB) or paste a link above.')}</p>
              {uploadErr && <p className="text-xs text-danger">{uploadErr}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="language">{locale === 'bn' ? 'ভাষা' : 'Language'}</Label>
                <select
                  id="language"
                  value={form.language ?? 'en'}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="flex h-10 rounded-md border border-border bg-base px-3 text-sm text-white"
                >
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">{locale === 'bn' ? 'টাইমজোন' : 'Timezone'}</Label>
                <select
                  id="timezone"
                  value={form.timezone ?? 'Asia/Dhaka'}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="flex h-10 rounded-md border border-border bg-base px-3 text-sm text-white"
                >
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={updateProfile.isPending || avatarUploading} className="flex-1">
                {updateProfile.isPending ? (locale === 'bn' ? 'সংরক্ষণ হচ্ছে…' : 'Saving…') : (locale === 'bn' ? 'পরিবর্তন সংরক্ষণ' : 'Save Changes')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1">
                {locale === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          {locale === 'bn' ? 'বিজ্ঞপ্তি চ্যানেল ও পাসওয়ার্ড পরিচালনা করুন ' : 'Manage notification channels and password in'}{' '}
          <button type="button" onClick={() => router.push('/player/security')} className="font-semibold text-gold-soft hover:underline">
            {locale === 'bn' ? 'সিকিউরিটি' : 'Security'}
          </button>{locale === 'bn' ? ' এ।' : '.'}
        </p>
      </div>
    </PageContainer>
  );
}
