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
  /**
   * `pending` is an address the partner has asked to move to but has not proven
   * yet. Optional because a build of this app can run against an API that
   * predates the field — absent has to read as "no change in flight", never as
   * an empty pending address.
   */
  email: { value: string | null; verified: boolean; required?: boolean; pending?: string | null };
  phone: { value: string | null; verified: boolean; required?: boolean; pending?: string | null };
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

/**
 * Optional portal surfaces this tenant has switched on.
 *
 * Optional all the way down, and read through `portalFeatures()` rather than
 * directly: the affiliate portal is deployed independently of the API, so a
 * build of this app can and does run against a backend that predates the flag.
 * An absent field has to mean "as it was before", never "off" — otherwise
 * shipping the frontend first would take a working page away from every
 * partner until the API caught up.
 */
export interface AffiliateFeatures {
  subAffiliates?: boolean;
}

export interface AffiliateMe {
  affiliate: AffiliateProfile;
  verification: AffiliateVerification;
  features?: AffiliateFeatures;
}

/** Resolved feature switches, with the pre-flag defaults filled in. */
export function portalFeatures(me: { features?: AffiliateFeatures } | null | undefined): {
  subAffiliates: boolean;
} {
  return { subAffiliates: me?.features?.subAffiliates !== false };
}

export interface AffiliateStats {
  currency: string;
  income: { availableMinor: number; paidMinor: number; lifetimeMinor: number; pendingMinor: number };
  commissionByType: { type: string; amountMinor: number; count: number }[];
  monthly: { period: string; amountMinor: number }[];
  players: { total: number; ftd: number; signups: number; clicks: number };
  finance: { depositsMinor: number; depositCount: number; withdrawalsMinor: number; withdrawalCount: number; netMinor: number };
  betting: { available: boolean; roundsCount: number; wageredMinor: number; wonMinor: number; ggrMinor: number };
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
  withdrawalsMinor: number;
  withdrawalCount: number;
  netCashMinor: number;
  wageredMinor: number;
  wonMinor: number;
  ggrMinor: number;
  rounds: number;
}
export interface AffiliateReferredPlayers { currency: string; items: AffiliateReferredPlayer[]; }

export interface AffiliateFinanceRow { id: string; player: string; kind: 'deposit' | 'withdrawal'; amountMinor: number; currency: string; at: string | null }
export interface AffiliateBettingRow { id: string; player: string; game: string; betMinor: number; winMinor: number; netMinor: number; currency: string; at: string | null }
export interface AffiliateHistory<T> { currency: string; items: T[]; total: number; page: number; limit: number; pages: number }
export interface AffiliateHistoryParams { from?: string; to?: string; page?: number; limit?: number }

function historyQuery(p: AffiliateHistoryParams): string {
  const s = new URLSearchParams();
  if (p.from) s.set('from', p.from);
  if (p.to) s.set('to', p.to);
  if (p.page) s.set('page', String(p.page));
  if (p.limit) s.set('limit', String(p.limit));
  const q = s.toString();
  return q ? `?${q}` : '';
}

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
  financeHistory(params: AffiliateHistoryParams = {}): Promise<AffiliateHistory<AffiliateFinanceRow>> {
    return affiliateFetch<AffiliateHistory<AffiliateFinanceRow>>(`/affiliate/finance-history${historyQuery(params)}`);
  },
  bettingHistory(params: AffiliateHistoryParams = {}): Promise<AffiliateHistory<AffiliateBettingRow>> {
    return affiliateFetch<AffiliateHistory<AffiliateBettingRow>>(`/affiliate/betting-history${historyQuery(params)}`);
  },

  updatePayoutMethod(method: string, payoutDetails: string): Promise<{ affiliate: AffiliateProfile }> {
    return affiliateFetch<{ affiliate: AffiliateProfile }>('/affiliate/payout-method', { method: 'PATCH', body: JSON.stringify({ method, payoutDetails }) });
  },
  updateProfile(displayName: string): Promise<{ affiliate: AffiliateProfile }> {
    return affiliateFetch<{ affiliate: AffiliateProfile }>('/affiliate/profile', { method: 'PATCH', body: JSON.stringify({ displayName }) });
  },
  changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
    return affiliateFetch<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
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
  /**
   * Correct a wrong contact address and get a fresh code sent to the new one.
   *
   * One call does both on purpose. Asking a partner to save the corrected value
   * and then separately press "send code" invites them to stop after the first
   * step and wonder why nothing arrived — the whole point of this screen is that
   * the address on file cannot receive anything.
   *
   * `staged` comes back true when the CURRENT address was already verified: the
   * new one is held aside until it is proven, so the partner keeps their access
   * while the code is in flight.
   */
  changeEmail(email: string): Promise<{ ok: boolean; staged: boolean; delivered: boolean; target: string | null; verification: AffiliateVerification }> {
    return affiliateFetch('/affiliate/verify/email', { method: 'PATCH', body: JSON.stringify({ email }) });
  },
  changePhone(phone: string): Promise<{ ok: boolean; staged: boolean; delivered: boolean; target: string | null; verification: AffiliateVerification }> {
    return affiliateFetch('/affiliate/verify/phone', { method: 'PATCH', body: JSON.stringify({ phone }) });
  },

  uploadKyc(file: File, docType: string): Promise<{ ok: boolean; verification: AffiliateVerification }> {
    const form = new FormData();
    form.append('file', file);
    form.append('docType', docType);
    return affiliateUpload('/affiliate/kyc', form);
  },
};
