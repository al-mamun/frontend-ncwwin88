/**
 * Central type definitions for the player portal.
 * All shapes match the backend response contracts in PLAYER_API_CONTRACT_V1.md.
 */

// ─── Tenant Types (multi-tenant / white-label) ─────────────────
export type {
  TenantStatus,
  TenantTheme,
  TenantSeo,
  TenantPublicConfig,
} from './tenant';

// ─── API Envelope ──────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Auth Types ────────────────────────────────────────────────
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface SafeUserProfile {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  avatar: string | null;
  roleSlug: string;
  status: UserStatus;
  tenantId: string;
  kycStatus: KycStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

// ─── Player Profile (GET/PATCH /player/me) ─────────────────────
export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  language: string;
  timezone: string;
  country: string | null;
  kycStatus: KycStatus;
  isPhoneVerified: boolean;
  createdAt: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    telegram: boolean;
  };
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  language?: string;
  timezone?: string;
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    telegram?: boolean;
  };
}

// ─── KYC (GET/POST /player/kyc) ────────────────────────────────
export type PlayerKycStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

export interface PlayerKyc {
  id?: string;
  status: PlayerKycStatus;
  fullName: string | null;
  docNumber: string | null;
  dob: string | null;
  notes: string | null;
  documentUrl?: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface SubmitKycInput {
  fullName?: string;
  docNumber?: string;
  /** ISO date (YYYY-MM-DD). */
  dob?: string;
  notes?: string;
  /** Uploaded identity-document image URL (from POST /player/upload?purpose=kyc). */
  documentUrl?: string;
  docType?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Wallet (GET /player/wallet) ───────────────────────────────
export interface PlayerWallet {
  walletId: string;
  balanceMinor: number;
  heldMinor: number;
  currency: string;
  status: string;
  updatedAt: string;
}

// ─── Ledger (GET /player/ledger) ───────────────────────────────
export type LedgerEntryType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'BET'
  | 'WIN'
  | 'BONUS'
  | 'FEE'
  | 'ADJUSTMENT'
  | 'REFUND'
  | 'TRANSFER';

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amountMinor: number;
  currency: string;
  status: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
}

// ─── Payment Methods (GET /player/payment-methods) ─────────────
export interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  type: string;
  iconUrl: string | null;
  description: string | null;
  minDepositMinor: number;
  maxDepositMinor: number;
  minWithdrawalMinor: number;
  maxWithdrawalMinor: number;
  currency: string;
  sortOrder: number;
  isDepositEnabled: boolean;
  isWithdrawalEnabled: boolean;
}

export interface PaymentAccount {
  id: string;
  paymentMethodId: string;
  paymentMethodName: string | null;
  displayName: string | null;
  /** Destination account number/address, shown IN FULL (the player must send money to it). */
  accountNumberMasked: string;
  accountHolderName: string | null;
  /** 'personal' | 'agent' (mobile money) — shown as a badge and used to filter accounts. */
  accountType: string | null;
  /** Per-transaction deposit MIN in minor units (0 = no minimum). Shown under the number. */
  minLimitMinor: number;
  /** Per-transaction deposit MAX in minor units (0 = unlimited / Agent). Shown under the number. */
  maxLimitMinor: number;
  instructions: string | null;
  qrCodeUrl: string | null;
  sortOrder: number;
}

export type PaymentFlowType = 'deposit' | 'withdrawal';

// ─── Deposit Request (POST /player/deposits) ───────────────────
export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface DepositRequestInput {
  paymentMethodId: string;
  paymentAccountId: string;
  amount: number;
  currency: string;
  transactionReference?: string;
  /** Account/number the player sent the money FROM (shown to the tenant for verification). */
  senderAccountNumber?: string;
  /** Uploaded payment-proof screenshot URL (from POST /player/upload?purpose=proof). */
  proofAssetId?: string;
}

export interface DepositRequestResponse {
  id: string;
  amount: number;
  currency: string;
  paymentMethodId: string | null;
  paymentAccountId: string | null;
  transactionReference: string | null;
  proofStatus: string;
  status: DepositStatus;
  createdAt: string;
  processedAt: string | null;
  rejectedReason: string | null;
}

/** A player's own deposit request + status (GET /player/deposits). */
export interface PlayerDeposit {
  id: string;
  amount: number;
  currency: string;
  status: DepositStatus;
  transactionReference: string | null;
  createdAt: string;
  processedAt: string | null;
  rejectedReason: string | null;
}

// ─── Notifications ─────────────────────────────────────────────
/** A player's in-app notification (GET /notifications, cookie-scoped). */
export interface PlayerNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  category: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Backend notification list shape ({items,total,page,limit} — no totalPages). */
export interface NotificationPage {
  items: PlayerNotification[];
  total: number;
  page: number;
  limit: number;
}

// ─── Withdrawal Request (POST /player/withdrawals) ─────────────
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface WithdrawalRequestInput {
  amount: number;
  currency: string;
  paymentMethodId: string;
  accountNumber?: string;
}

export interface WithdrawalRequestResponse {
  id: string;
  amount: number;
  currency: string;
  paymentMethodId: string | null;
  maskedAccountNumber: string | null;
  status: WithdrawalStatus;
  heldAmount: number;
  requiresSecondApproval: boolean;
  createdAt: string;
  processedAt: string | null;
  rejectedReason: string | null;
}

// ─── Bootstrap (GET /player/bootstrap) ─────────────────────────
export interface BootstrapData {
  branding: {
    platformName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    supportEmail: string | null;
    supportPhone: string | null;
  };
  localization: {
    defaultCurrency: string;
    defaultLocale: string;
    timezone: string;
  };
  platform: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    kycRequired: boolean;
  };
  features: {
    enabledModules: string[];
    publicFeatureFlags: Record<string, boolean>;
  };
  navigation: {
    publicMenu: unknown[];
  };
  cms: {
    homepageBanners: unknown[];
    announcementBar: string;
    footerLinks: Record<string, unknown>;
  };
}

// ─── Registration & Rebuild Types ──────────────────────────────
export interface RegisterInput {
  username: string;
  password: string;
  phone?: string;
  referralCode?: string;
  /** Slug of the tenant site the player registered on (server validates against active tenants). */
  tenantSlug?: string;
}

export interface Game {
  id: string;
  name: string;
  provider: string;
  category: string;
  imageUrl?: string | null;
  /** Optional provider logo, shown on the fallback poster when imageUrl is absent. */
  providerLogoUrl?: string | null;
  art?: string | null;
  color?: string | null;
  badge?: string | null;
  featured?: boolean;
  popular?: boolean;
  favourite?: boolean;
}

/** One page of the public games catalog (server-side pagination). */
export interface PaginatedGames {
  items: Game[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GameSession {
  gameId: string;
  gameName: string;
  sessionId: string;
  mode: 'live' | 'demo';
  launchUrl: string;
  message?: string | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  code?: string | null;
  bannerUrl?: string | null;
  type?: 'deposit_bonus' | 'cashback' | 'free_spins' | 'free_credit';
  bonusPercent?: number;
  rewardAmountMinor?: number;
  minDepositMinor?: number;
  wagerMultiplier?: number;
  freeSpins?: number;
  currency?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  status: 'active' | 'expired';
}

export interface ReferralSummary {
  code: string;
  count: number;
  rewardMinor: number;
  currency: string;
  /** Active referral-campaign terms (0 / inactive when the tenant hasn't enabled one). */
  active?: boolean;
  campaignName?: string | null;
  signupBonusMinor?: number;
  refereeBonusMinor?: number;
  qualifyingDepositMinor?: number;
}

// ─── Marketing (bonuses / cashback / coupons / VIP / loyalty) ───
export interface PlayerBonus { id: string; promotionName: string | null; type: string | null; amountMinor: number; baseDepositMinor: number; currency: string; createdAt: string | null; }
export interface PlayerCashback { id: string; programName: string | null; periodLabel: string; netLossMinor: number; cashbackMinor: number; cashbackPercent: number; currency: string; createdAt: string | null; }
export interface CouponRedemptionView { id: string; code: string; amountMinor: number; currency: string; createdAt: string | null; }
export interface VipTierView { id?: string; name: string; level: number; minDepositMinor?: number; minTurnoverMinor?: number; cashbackPercent?: number; bonusPercent?: number; withdrawalLimitMinor?: number; dedicatedManager?: boolean; currency?: string; }
export interface PlayerVip { current: VipTierView | null; next: VipTierView | null; cumulativeDepositMinor: number; cumulativeTurnoverMinor: number; tiers: VipTierView[]; }
export interface LoyaltyMissionView { id: string; name: string; description: string | null; missionType: string; target: number; isAmount: boolean; progress: number; completed: boolean; rewardPoints: number; rewardAmountMinor: number; currency: string; }
export interface PlayerLoyalty { points: number; missions: LoyaltyMissionView[]; }

export interface TournamentLeaderRow { rank: number; name: string; metricValue: number; isMe: boolean; }
export interface PlayerTournament { id: string; name: string; description: string | null; metric: string; prizePoolMinor: number; prizePlaces: number; currency: string; startsAt: string | null; endsAt: string | null; myRank: number | null; myMetric: number; leaderboard: TournamentLeaderRow[]; }

export interface PlayerFreeSpin { id: string; campaignName: string | null; spinsCount: number; amountMinor: number; provider: string | null; game: string | null; currency: string; createdAt: string | null; }

export interface PlayerBonusWallet { lockedMinor: number; requiredTurnoverMinor: number; achievedTurnoverMinor: number; remainingTurnoverMinor: number; releasedMinor: number; currency: string; }

// ---- Support tickets (player) ----
export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  messageCount: number;
  lastMessageAt: string | null;
  lastMessageBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}
export interface SupportMessage {
  id: string;
  ticketId: string;
  authorType: string;
  authorName: string | null;
  body: string;
  createdAt: string | null;
}

// ---- Responsible gaming (player self-service) ----
export interface ResponsibleGaming {
  depositDailyMinor: number | null;
  depositWeeklyMinor: number | null;
  depositMonthlyMinor: number | null;
  withdrawalDailyMinor: number | null;
  realityCheckMinutes: number | null;
  coolingOffUntil: string | null;
  selfExclusionUntil: string | null;
  selfExcluded: boolean;
  coolingOff: boolean;
  updatedAt: string | null;
}
export interface ResponsibleGamingInput {
  depositDailyMinor?: number | null;
  depositWeeklyMinor?: number | null;
  depositMonthlyMinor?: number | null;
  withdrawalDailyMinor?: number | null;
  realityCheckMinutes?: number | null;
  coolingOffUntil?: string | null;
  selfExclusionUntil?: string | null;
}

// ---- CMS (public tenant website) ----
export interface CmsPageLink {
  slug: string;
  title: string;
  locale: string;
}
export interface CmsPageDetail {
  id: string;
  slug: string;
  title: string;
  locale: string;
  body: string;
  updatedAt: string | null;
}
export interface CmsBanner {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
  placement: string;
  sortOrder: number;
}

export interface GuestDemoSession {
  gameId: string;
  gameName: string;
  mode: 'demo' | 'unavailable';
  launchUrl: string;
  reason?: string;
}
