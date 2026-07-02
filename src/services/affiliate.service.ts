/**
 * Affiliate portal service — auth (affiliate surface) + onboarding/dashboard data.
 * All calls go through the affiliate-surface client (cookie auth, no JWT in JS).
 */
import { affiliateFetch, affiliateUpload, affiliateSend } from '../lib/affiliate-api';

export interface AffiliateProfile {
  id: string;
  code: string;
  displayName: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  currency: string;
  programId: string | null;
  clicks: number;
  signups: number;
  ftdCount: number;
  pendingCommissionMinor: number;
  availableCommissionMinor: number;
  paidCommissionMinor: number;
  lifetimeCommissionMinor: number;
  payoutMethod: string;
  payoutDetails: string | null;
  createdAt: string | null;
}

export interface AffiliateVerification {
  email: { value: string | null; verified: boolean; required?: boolean };
  phone: { value: string | null; verified: boolean; required?: boolean };
  kyc: {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    docType: string | null;
    fileUrl: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    required?: boolean;
  };
  onboardingComplete: boolean;
  accountStatus: string;
}

export interface AffiliateProgramView {
  id: string;
  name: string;
  model: string;
  revenueSharePercent: number | null;
  cpaAmountMinor: number | null;
  qualifyingDepositMinor: number | null;
  minPayoutMinor: number | null;
  currency: string;
}

export interface AffiliateMe {
  affiliate: AffiliateProfile;
  verification: AffiliateVerification;
}

export interface AffiliateStats {
  currency: string;
  income: { availableMinor: number; paidMinor: number; lifetimeMinor: number; pendingMinor: number };
  commissionByType: { type: string; amountMinor: number; count: number }[];
  monthly: { period: string; amountMinor: number }[];
  players: { total: number; ftd: number; signups: number; clicks: number };
  finance: { depositsMinor: number; depositCount: number; withdrawalsMinor: number; withdrawalCount: number; netMinor: number };
  betting: { available: boolean };
  recentCommissions: { id: string; type: string; amountMinor: number; currency: string; status: string; note: string | null; createdAt: string | null }[];
}

export interface AffiliateDashboard extends AffiliateMe {
  program: AffiliateProgramView | null;
  stats?: AffiliateStats;
}

export interface AffiliateRegisterInput {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName?: string;
  country?: string;
  tenantSlug?: string;
}

export interface AffiliateReferredPlayer {
  id: string;
  name: string;
  joinedAt: string | null;
  ftd: boolean;
  depositsMinor: number;
  depositCount: number;
}
export interface AffiliateReferredPlayers { currency: string; items: AffiliateReferredPlayer[]; }

export const affiliateApi = {
  /* ── auth ── */
  async login(identifier: string, password: string): Promise<{ id: string; username: string }> {
    const res = await affiliateFetch<{ user: { id: string; username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, surface: 'affiliate' }),
    });
    return res.user;
  },

  async register(input: AffiliateRegisterInput): Promise<{ id: string; username: string }> {
    const res = await affiliateFetch<{ user: { id: string; username: string } }>('/auth/affiliate/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.user;
  },

  async logout(): Promise<void> {
    await affiliateSend('/auth/logout', { method: 'POST', body: JSON.stringify({ surface: 'affiliate' }) });
  },

  /* ── portal data ── */
  async me(): Promise<AffiliateMe | null> {
    try {
      return await affiliateFetch<AffiliateMe>('/affiliate/me');
    } catch {
      return null;
    }
  },

  dashboard(): Promise<AffiliateDashboard> {
    return affiliateFetch<AffiliateDashboard>('/affiliate/dashboard');
  },

  stats(): Promise<AffiliateStats> {
    return affiliateFetch<AffiliateStats>('/affiliate/stats');
  },

  players(): Promise<AffiliateReferredPlayers> {
    return affiliateFetch<AffiliateReferredPlayers>('/affiliate/players');
  },

  updatePayoutMethod(method: string, payoutDetails: string): Promise<{ affiliate: AffiliateProfile }> {
    return affiliateFetch<{ affiliate: AffiliateProfile }>('/affiliate/payout-method', { method: 'PATCH', body: JSON.stringify({ method, payoutDetails }) });
  },

  verificationStatus(): Promise<AffiliateVerification> {
    return affiliateFetch<AffiliateVerification>('/affiliate/verification-status');
  },

  /* ── onboarding ── */
  requestEmailOtp(): Promise<{ ok: boolean; delivered?: boolean; target?: string | null; alreadyVerified?: boolean }> {
    return affiliateFetch('/affiliate/verify/email/request', { method: 'POST', body: '{}' });
  },
  confirmEmailOtp(code: string): Promise<{ ok: boolean; verification: AffiliateVerification }> {
    return affiliateFetch('/affiliate/verify/email/confirm', { method: 'POST', body: JSON.stringify({ code }) });
  },
  requestPhoneOtp(): Promise<{ ok: boolean; delivered?: boolean; target?: string | null; alreadyVerified?: boolean }> {
    return affiliateFetch('/affiliate/verify/phone/request', { method: 'POST', body: '{}' });
  },
  confirmPhoneOtp(code: string): Promise<{ ok: boolean; verification: AffiliateVerification }> {
    return affiliateFetch('/affiliate/verify/phone/confirm', { method: 'POST', body: JSON.stringify({ code }) });
  },
  uploadKyc(file: File, docType: string): Promise<{ ok: boolean; verification: AffiliateVerification }> {
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    return affiliateUpload('/affiliate/kyc', form);
  },
};
