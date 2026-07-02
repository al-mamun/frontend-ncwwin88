/**
 * Player Referral Desk Page.
 * Displays invite link, registration codes, referred counts, and rewards ledger.
 */
'use client';

import { useMemo, useState } from 'react';
import { Users, Copy, Check, Info, Award, HelpCircle } from 'lucide-react';
import { useProfile, useReferralSummary } from '@/hooks/player-hooks';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Card, CardContent } from '@/components/ui/card-badge-label';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { useI18n } from '@/core/i18n/LanguageProvider';

export default function ReferralPage() {
  const { locale } = useI18n();
  const { data: profile } = useProfile();
  const { data: referralData, isLoading } = useReferralSummary();
  const [copied, setCopied] = useState(false);

  // Referral data from the API; minimal fallback only for the code label.
  const referralSummary = useMemo(() => {
    if (referralData) return referralData;
    const code = profile ? `REF${profile.username.toUpperCase()}` : '…';
    return { code, count: 0, rewardMinor: 0, currency: 'BDT', active: false, signupBonusMinor: 0, qualifyingDepositMinor: 0 };
  }, [referralData, profile]);

  const active = referralSummary.active ?? false;
  const bonusMinor = referralSummary.signupBonusMinor ?? 0;
  const minDepositMinor = referralSummary.qualifyingDepositMinor ?? 0;

  const referralUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/register?ref=${referralSummary.code}`;
    }
    return `http://localhost:3000/register?ref=${referralSummary.code}`;
  }, [referralSummary.code]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message={locale === 'bn' ? 'রেফারেল পরিসংখ্যান লোড হচ্ছে…' : 'Loading referral stats…'} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PlayerPageHeader
        title={locale === 'bn' ? 'রেফারেল ডেস্ক' : 'Referral Desk'}
        subtitle={locale === 'bn' ? 'আপনার বন্ধুদের রেজিস্টার করতে আমন্ত্রণ জানান এবং ক্যাশ বোনাস অর্জন করুন' : 'Invite your friends to register and earn cash bonuses'}
        icon={Users}
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="bg-surface">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
              <Users className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="text-sm text-muted">{locale === 'bn' ? 'রেফার করা বন্ধু' : 'Referred Friends'}</p>
              <p className="text-2xl font-extrabold text-primary">{referralSummary.count}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Award className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted">{locale === 'bn' ? 'রেফারেল আয়' : 'Referral Earned'}</p>
              <p className="text-2xl font-extrabold text-success">
                {formatCurrency(referralSummary.rewardMinor, referralSummary.currency)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
              <HelpCircle className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted">{locale === 'bn' ? 'প্রতি রেফারেলে পুরস্কার' : 'Reward Per Referral'}</p>
              <p className="text-lg font-bold text-primary">
                {active ? `${formatCurrency(bonusMinor, referralSummary.currency)} ${locale === 'bn' ? 'প্রতি যোগ্য বন্ধু' : 'per qualified friend'}` : (locale === 'bn' ? 'বর্তমানে স্থগিত' : 'Currently paused')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Code card */}
      <Card className="border-brand/20 bg-brand/5 mb-6">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-brand">{locale === 'bn' ? 'বন্ধুদের আমন্ত্রণ জানান, পুরস্কার অর্জন করুন' : 'Invite Friends, Earn Rewards'}</h2>
            <p className="mt-1 text-sm text-muted leading-relaxed">
              {active
                ? (locale === 'bn'
                    ? `নিচে আপনার ব্যক্তিগত লিঙ্কটি কপি করুন। কোনো বন্ধু এর মাধ্যমে রেজিস্টার করে${minDepositMinor > 0 ? ` কমপক্ষে ${formatCurrency(minDepositMinor, referralSummary.currency)}` : ''} প্রথম ডিপোজিট করলে, স্বয়ংক্রিয়ভাবে আপনার ওয়ালেটে ${formatCurrency(bonusMinor, referralSummary.currency)} জমা হবে।`
                    : `Copy your personal link below. When a friend registers through it and makes a first deposit${minDepositMinor > 0 ? ` of at least ${formatCurrency(minDepositMinor, referralSummary.currency)}` : ''}, ${formatCurrency(bonusMinor, referralSummary.currency)} is credited to your wallet automatically.`)
                : (locale === 'bn'
                    ? 'নিচে আপনার ব্যক্তিগত লিঙ্কটি কপি করে বন্ধুদের আমন্ত্রণ জানান। রেফারেল পুরস্কার বর্তমানে স্থগিত — তবুও আপনার আমন্ত্রণগুলো ট্র্যাক করা হচ্ছে এবং কোনো ক্যাম্পেইন সক্রিয় হলে আপনি পুরস্কার পাবেন।'
                    : 'Copy your personal link below and invite friends. Referral rewards are currently paused — your invites are still tracked and will reward you once a campaign is active.')}
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2 shrink-0 md:min-w-[340px]">
            <label className="text-xs font-bold text-muted uppercase">{locale === 'bn' ? 'আপনার রেফারেল URL' : 'Your Referral URL'}</label>
            <div className="flex items-center gap-2 rounded-lg bg-surface border border-border p-1">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full bg-transparent pl-3 text-sm font-semibold outline-none truncate text-primary"
              />
              <Button
                onClick={handleCopy}
                size="sm"
                className="h-9 gap-1.5 font-bold shrink-0 text-xs px-3"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    {locale === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {locale === 'bn' ? 'কপি' : 'Copy'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms Info box */}
      <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted leading-relaxed">
        <h3 className="font-bold text-primary text-base flex items-center gap-2 mb-2">
          <Info className="h-5 w-5 text-brand" />
          {locale === 'bn' ? 'রেফারেল নিয়ম ও শর্তাবলী' : 'Referral Rules & Conditions'}
        </h3>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>{locale === 'bn' ? 'রেফার করা খেলোয়াড়দের অবশ্যই একদম নতুন সাইনআপ হতে হবে যারা আপনার রেফারেল লিঙ্ক বা কোড ব্যবহার করে রেজিস্টার করেন।' : 'Referred players must be brand-new signups who register using your referral link or code.'}</li>
          {active ? (
            <li>{locale === 'bn'
              ? <>আপনার বন্ধু তাদের প্রথম ডিপোজিট{minDepositMinor > 0 ? ` কমপক্ষে ${formatCurrency(minDepositMinor, referralSummary.currency)}` : ''} করলেই আপনি {formatCurrency(bonusMinor, referralSummary.currency)} অর্জন করবেন, যা স্বয়ংক্রিয়ভাবে আপনার ওয়ালেটে জমা হবে।</>
              : <>You earn {formatCurrency(bonusMinor, referralSummary.currency)} once your friend makes their first deposit{minDepositMinor > 0 ? ` of at least ${formatCurrency(minDepositMinor, referralSummary.currency)}` : ''}, credited automatically to your wallet.</>}</li>
          ) : (
            <li>{locale === 'bn' ? 'রেফারেল পুরস্কার বর্তমানে স্থগিত। আপনার আমন্ত্রণগুলো এখনও রেকর্ড করা হচ্ছে এবং কোনো ক্যাম্পেইন সক্রিয় হলে পরিশোধ করা হবে।' : 'Referral rewards are currently paused. Your invites are still recorded and will pay out when a campaign is live.'}</li>
          )}
          <li>{locale === 'bn' ? 'নিজের রেফারেল বা ডুপ্লিকেট/প্রক্সি অ্যাকাউন্ট পর্যবেক্ষণ করা হয় এবং অযোগ্য ঘোষণা করা হবে।' : 'Self-referrals or duplicate/proxy accounts are monitored and will be disqualified.'}</li>
          <li>{locale === 'bn' ? 'পুরস্কারের শর্তাবলী সক্রিয় রেফারেল ক্যাম্পেইন অনুসরণ করে এবং সময়ের সাথে পরিবর্তিত হতে পারে।' : 'Reward terms follow the active referral campaign and may change over time.'}</li>
        </ul>
      </div>
    </PageContainer>
  );
}
