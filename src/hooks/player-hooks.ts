/**
 * Centralised React Query hooks for player data.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { playerApi } from '../services/player.service';
import { authApi } from '../services/auth.service';
import type {
  ChangePasswordInput,
  DepositRequestInput,
  DepositRequestResponse,
  PaymentFlowType,
  UpdateProfileInput,
  WithdrawalRequestInput,
  WithdrawalRequestResponse,
  RegisterInput,
  SubmitKycInput,
} from '../types';

export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  profile: ['profile'] as const,
  wallet: ['wallet'] as const,
  ledger: (params: { page?: number; limit?: number; type?: string }) =>
    ['ledger', params] as const,
  deposits: (params: { page?: number; limit?: number }) => ['deposits', params] as const,
  paymentMethods: (type: PaymentFlowType) => ['payment-methods', type] as const,
  paymentAccounts: (params: { type?: PaymentFlowType; methodId?: string }) =>
    ['payment-accounts', params] as const,
  games: (params?: { category?: string; provider?: string; search?: string }) =>
    ['games', params] as const,
  promotions: ['promotions'] as const,
  referralSummary: ['referral-summary'] as const,
  kyc: ['kyc'] as const,
  notifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    ['notifications', params ?? {}] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

// ─── Bootstrap ─────────────────────────────────────────────────
export function useBootstrap() {
  return useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: playerApi.bootstrap,
  });
}

// ─── Profile ───────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: playerApi.getProfile,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => playerApi.updateProfile(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}

// ─── Password ──────────────────────────────────────────────────
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => playerApi.changePassword(input),
  });
}

// ─── Wallet ────────────────────────────────────────────────────
export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: playerApi.getWallet,
    refetchInterval: 5_000, // live balance — auto-refresh every 5s (foreground only)
    refetchOnWindowFocus: true, // and instantly when the player returns to the site
  });
}

// ─── Ledger ────────────────────────────────────────────────────
export function useLedger(params: { page?: number; limit?: number; type?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.ledger(params),
    queryFn: () => playerApi.getLedger(params),
  });
}

// ─── Deposits (status tracking) ────────────────────────────────
/** Polls so a 'PENDING' deposit flips to APPROVED/REJECTED without a manual reload. */
export function usePlayerDeposits(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.deposits(params),
    queryFn: () => playerApi.getDeposits(params),
    refetchInterval: 15000,
  });
}

// ─── Notifications ─────────────────────────────────────────────
/** Unread badge count — polled so new alerts appear without a reload. */
export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: playerApi.getUnreadCount,
    enabled,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}

/** Recent notifications for the bell dropdown / inbox. */
export function useNotifications(
  params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () => playerApi.getNotifications(params),
    enabled,
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playerApi.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => playerApi.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Payment Methods ──────────────────────────────────────────
export function usePaymentMethods(type: PaymentFlowType) {
  return useQuery({
    queryKey: queryKeys.paymentMethods(type),
    queryFn: () => playerApi.getPaymentMethods(type),
  });
}

// ─── Payment Accounts ─────────────────────────────────────────
export function usePaymentAccounts(params: { type?: PaymentFlowType; methodId?: string }) {
  return useQuery({
    queryKey: queryKeys.paymentAccounts(params),
    queryFn: () => playerApi.getPaymentAccounts(params),
  });
}

// ─── Create Deposit ───────────────────────────────────────────
export function useCreateDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: DepositRequestInput; idempotencyKey: string }) =>
      playerApi.createDeposit(input, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}

// ─── Create Withdrawal ────────────────────────────────────────
export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: WithdrawalRequestInput;
      idempotencyKey: string;
    }) => playerApi.createWithdrawal(input, idempotencyKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet });
      qc.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}

// ─── Registration ──────────────────────────────────────────────
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
  });
}

// ─── Games & Play ──────────────────────────────────────────────
export function useGames(params?: { category?: string; provider?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.games(params),
    queryFn: () => playerApi.getGames(params),
  });
}

// The public games feed (server-paginated) lives in core/games/useGameCatalog.ts
// (useGamesFeed / useGameProviders) — it owns the catalog read path.

export function useGameLaunch() {
  return useMutation({
    mutationFn: (gameId: string) => playerApi.launchGame(gameId),
  });
}

// ─── Promotions ────────────────────────────────────────────────
export function usePromotions() {
  return useQuery({
    queryKey: queryKeys.promotions,
    queryFn: playerApi.getPromotions,
  });
}

// ─── Referral Summary ──────────────────────────────────────────
export function useReferralSummary() {
  return useQuery({
    queryKey: queryKeys.referralSummary,
    queryFn: playerApi.getReferralSummary,
  });
}

// ─── KYC ───────────────────────────────────────────────────────
export function useKyc() {
  return useQuery({
    queryKey: queryKeys.kyc,
    queryFn: playerApi.getKyc,
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitKycInput) => playerApi.submitKyc(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.kyc });
      qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
