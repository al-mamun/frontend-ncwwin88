/**
 * Player API service.
 * All endpoints consume httpOnly cookies for auth — no manual Authorization header.
 */

import { apiFetch, apiSend, apiUpload, ApiRequestError } from '../lib/api';
import type {
  BootstrapData,
  ChangePasswordInput,
  DepositRequestInput,
  DepositRequestResponse,
  PlayerDeposit,
  Paginated,
  PaymentAccount,
  PaymentFlowType,
  PaymentMethod,
  PlayerProfile,
  PlayerWallet,
  LedgerEntry,
  UpdateProfileInput,
  WithdrawalRequestInput,
  WithdrawalRequestResponse,
  Game,
  GameSession,
  PaginatedGames,
  Promotion,
  ReferralSummary,
  PlayerKyc,
  SubmitKycInput,
  NotificationPage,
  GuestDemoSession,
  SupportTicket,
  SupportMessage,
  ResponsibleGaming,
  ResponsibleGamingInput,
  PlayerBonus,
  PlayerCashback,
  CouponRedemptionView,
  PlayerVip,
  PlayerLoyalty,
  PlayerTournament,
  PlayerFreeSpin,
  PlayerBonusWallet,
} from '../types';

export interface GamesPageParams {
  page?: number;
  limit?: number;
  category?: string;
  provider?: string;
  search?: string;
  /** Tenant slug — applies that tenant's hidden games/providers + custom order. */
  tenant?: string;
  /** Flag filters (owner global game flags) for the home Favourites / Featured rows. */
  favourite?: boolean;
  featured?: boolean;
  popular?: boolean;
}

export interface PlayerApi {
  bootstrap(): Promise<BootstrapData>;
  getProfile(): Promise<PlayerProfile>;
  updateProfile(input: UpdateProfileInput): Promise<PlayerProfile>;
  changePassword(input: ChangePasswordInput): Promise<{ message: string }>;
  getWallet(): Promise<PlayerWallet>;
  getLedger(params: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<Paginated<LedgerEntry>>;
  getPaymentMethods(type: PaymentFlowType): Promise<PaymentMethod[]>;
  getPaymentAccounts(params: {
    type?: PaymentFlowType;
    methodId?: string;
  }): Promise<PaymentAccount[]>;
  getDeposits(params?: { page?: number; limit?: number }): Promise<Paginated<PlayerDeposit>>;
  createDeposit(
    input: DepositRequestInput,
    idempotencyKey: string,
  ): Promise<DepositRequestResponse>;
  createWithdrawal(
    input: WithdrawalRequestInput,
    idempotencyKey: string,
  ): Promise<WithdrawalRequestResponse>;
  getGames(params?: {
    category?: string;
    provider?: string;
    search?: string;
  }): Promise<Game[]>;
  /**
   * Fetch ONE PAGE of the public catalog (server-side category/provider/search +
   * pagination). Resilient: 401 (visitor) / 404 (endpoint missing) resolve to an
   * empty page so the public home degrades gracefully (then the demo fallback
   * can fill in client-side).
   */
  getGamesPage(params?: GamesPageParams): Promise<PaginatedGames>;
  /** Distinct provider list for the filter strip. Resilient -> [] on 401/404. */
  getGameProviders(tenant?: string): Promise<string[]>;
  getFeaturedProviders(tenant?: string): Promise<string[]>;
  getProvidersDetailed(tenant?: string, category?: string): Promise<Array<{ key: string; name: string | null; logoUrl: string | null }>>;
  /** Distinct category slugs (tenant order + hidden applied). Resilient -> [] on 401/404. */
  getGameCategories(tenant?: string): Promise<string[]>;
  /** Operator-defined custom category menu (key/label/icon). Resilient -> [] . */
  getGameMenu(tenant?: string): Promise<Array<{ key: string; label: string; icon: string | null; baseCategory?: string | null; popular?: boolean; favourite?: boolean; featured?: boolean; megaMenuType?: 'providers' | 'games'; megaMenuImageUrl?: string | null }>>;
  launchGame(gameId: string): Promise<GameSession>;
  /** Best-effort no-login demo launch for a visitor. Resilient: resolves to mode 'unavailable' if the provider has no demo. */
  launchGameDemo(gameId: string, tenant: string): Promise<GuestDemoSession>;
  /** Warm the demo launch (call on hover) so the click opens the game instantly. */
  prefetchGameDemo(gameId: string, tenant: string): void;
  getPromotions(): Promise<Promotion[]>;
  getReferralSummary(): Promise<ReferralSummary>;
  getKyc(): Promise<PlayerKyc>;
  submitKyc(input: SubmitKycInput): Promise<{ id: string; status: string; submittedAt: string | null }>;
  uploadImage(file: File, purpose?: 'kyc' | 'avatar' | 'proof'): Promise<{ url: string }>;
  getBonuses(): Promise<PlayerBonus[]>;
  getCashback(): Promise<PlayerCashback[]>;
  getCoupons(): Promise<CouponRedemptionView[]>;
  redeemCoupon(code: string): Promise<{ ok: boolean; amountMinor: number; currency: string; code: string }>;
  getVip(): Promise<PlayerVip>;
  getLoyalty(): Promise<PlayerLoyalty>;
  getTournaments(): Promise<PlayerTournament[]>;
  getFreeSpins(): Promise<PlayerFreeSpin[]>;
  getBonusWallet(): Promise<PlayerBonusWallet>;
  // Notifications (cookie-scoped to the player via the shared /notifications API).
  getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationPage>;
  getUnreadCount(): Promise<{ count: number }>;
  markNotificationRead(id: string): Promise<{ updated: number }>;
  markAllNotificationsRead(): Promise<{ updated: number }>;
  // Support tickets (player)
  getSupportTickets(params?: { page?: number; limit?: number }): Promise<Paginated<SupportTicket>>;
  getSupportTicket(id: string): Promise<{ ticket: SupportTicket; messages: SupportMessage[] }>;
  createSupportTicket(input: { subject: string; body: string; category?: string }): Promise<SupportTicket>;
  replySupportTicket(id: string, body: string): Promise<SupportMessage>;
  // Responsible gaming (player self-service)
  getResponsibleGaming(): Promise<ResponsibleGaming | null>;
  setResponsibleGaming(input: ResponsibleGamingInput): Promise<ResponsibleGaming>;
}

// In-flight/short-lived cache of guest demo launches, keyed by tenant+game. Lets a
// hover prefetch and the actual click share one provider round-trip. Entries expire
// so a (possibly single-use) launch URL isn't reused for too long.
const _demoCache = new Map<string, Promise<GuestDemoSession>>();
function _demoKey(gameId: string, tenant: string) { return `${tenant}:${gameId}`; }
const _preconnected = new Set<string>();
/** Warm DNS+TLS to the game host so the iframe download skips connection setup. */
function _preconnect(launchUrl: string) {
  if (typeof document === 'undefined' || !launchUrl) return;
  let origin = '';
  try { origin = new URL(launchUrl).origin; } catch { return; }
  if (!origin || _preconnected.has(origin)) return;
  _preconnected.add(origin);
  for (const rel of ['preconnect', 'dns-prefetch']) {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}
function _runDemo(gameId: string, tenant: string): Promise<GuestDemoSession> {
  const key = _demoKey(gameId, tenant);
  const hit = _demoCache.get(key);
  if (hit) return hit;
  const qs = new URLSearchParams({ tenant }).toString();
  const p = apiFetch<GuestDemoSession>(`/public/games/${gameId}/demo?${qs}`)
    .then((r) => {
      // Only KEEP successful launches in the cache (short window for hover→click).
      // A failure/unavailable is dropped immediately so the next click retries
      // fresh instead of being stuck on a one-off provider hiccup.
      if (r?.mode === 'demo' && r.launchUrl) {
        _preconnect(r.launchUrl);
        setTimeout(() => { if (_demoCache.get(key) === p) _demoCache.delete(key); }, 20_000);
      } else {
        _demoCache.delete(key);
      }
      return r;
    })
    .catch(() => {
      _demoCache.delete(key);
      return { gameId, gameName: '', mode: 'unavailable' as const, launchUrl: '' };
    });
  _demoCache.set(key, p);
  return p;
}

/**
 * Build the query string for a PUBLIC catalog GET (providers/categories/menu),
 * with the tenant slug plus a cache-buster. An edge cache in front of the API
 * caches these GETs by URL and ignores no-store, so without the token an
 * operator's catalog changes could keep showing stale until the cache expires.
 */
function publicCatalogQuery(tenant?: string): string {
  const qs = new URLSearchParams();
  if (tenant && tenant.trim()) qs.set('tenant', tenant.trim());
  qs.set('_', String(Date.now()));
  return `?${qs.toString()}`;
}

export const playerApi: PlayerApi = {
  async bootstrap() {
    return apiFetch<BootstrapData>('/player/bootstrap');
  },

  async getProfile() {
    return apiFetch<PlayerProfile>('/player/me');
  },

  async updateProfile(input) {
    return apiFetch<PlayerProfile>('/player/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async changePassword(input) {
    return apiFetch<{ message: string }>('/player/change-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getWallet() {
    return apiFetch<PlayerWallet>('/player/wallet');
  },

  async getLedger({ page = 1, limit = 10, type }) {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(type ? { type } : {}),
    });
    return apiFetch<Paginated<LedgerEntry>>(`/player/ledger?${qs.toString()}`);
  },

  async getPaymentMethods(type: PaymentFlowType) {
    const qs = new URLSearchParams({ type });
    return apiFetch<PaymentMethod[]>(`/player/payment-methods?${qs.toString()}`);
  },

  async getPaymentAccounts({ type, methodId }) {
    const qs = new URLSearchParams();
    if (type) qs.set('type', type);
    if (methodId) qs.set('methodId', methodId);
    return apiFetch<PaymentAccount[]>(`/player/payment-accounts?${qs.toString()}`);
  },

  async getDeposits({ page = 1, limit = 10 } = {}) {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiFetch<Paginated<PlayerDeposit>>(`/player/deposits?${qs.toString()}`);
  },

  async createDeposit(input, idempotencyKey) {
    return apiFetch<DepositRequestResponse>('/player/deposits', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    });
  },

  async createWithdrawal(input, idempotencyKey) {
    return apiFetch<WithdrawalRequestResponse>('/player/withdrawals', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    });
  },

  async getGames(params) {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.provider) qs.set('provider', params.provider);
    if (params?.search) qs.set('search', params.search);
    return apiFetch<Game[]>(`/player/games?${qs.toString()}`);
  },

  async getGamesPage(params = {}) {
    const { page, limit, category, provider, search, tenant, favourite, featured, popular } = params;
    const qs = new URLSearchParams();
    if (page) qs.set('page', String(page));
    if (limit) qs.set('limit', String(limit));
    // 'hot'/'ALL' are virtual (server treats them as no-filter); omit to keep URLs clean.
    if (category && category.toLowerCase() !== 'hot') qs.set('category', category);
    if (provider && provider.toUpperCase() !== 'ALL') qs.set('provider', provider);
    if (search && search.trim()) qs.set('search', search.trim());
    if (tenant && tenant.trim()) qs.set('tenant', tenant.trim());
    qs.set('_', String(Date.now())); // cache-buster: edge cache ignores no-store
    if (favourite) qs.set('favourite', 'true');
    if (featured) qs.set('featured', 'true');
    if (popular) qs.set('popular', 'true');

    const empty: PaginatedGames = { items: [], total: 0, page: page ?? 1, limit: limit ?? 60, hasMore: false };
    try {
      // PUBLIC catalog (no auth) so visitors and players both see games.
      const res = await apiFetch<PaginatedGames>(`/public/games?${qs.toString()}`);
      return res && Array.isArray(res.items) ? res : empty;
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) {
        return empty;
      }
      throw err;
    }
  },

  async getGameProviders(tenant?: string) {
    try {
      const q = publicCatalogQuery(tenant);
      const res = await apiFetch<string[]>(`/public/games/providers${q}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  },

  async getFeaturedProviders(tenant?: string) {
    try {
      const q = publicCatalogQuery(tenant);
      const res = await apiFetch<string[]>(`/public/games/featured-providers${q}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  },

  async getProvidersDetailed(tenant?: string, category?: string) {
    try {
      const sp = new URLSearchParams();
      if (tenant && tenant.trim()) sp.set('tenant', tenant.trim());
      if (category && category.trim() && category.toLowerCase() !== 'hot' && category.toLowerCase() !== 'all') sp.set('category', category.trim());
      const q = sp.toString() ? `?${sp.toString()}` : '';
      const res = await apiFetch<Array<{ key: string; name: string | null; logoUrl: string | null }>>(`/public/games/providers-detailed${q}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  },

  async getGameCategories(tenant) {
    try {
      const q = publicCatalogQuery(tenant);
      const res = await apiFetch<string[]>(`/public/games/categories${q}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) return [];
      throw err;
    }
  },

  async getGameMenu(tenant) {
    try {
      const q = publicCatalogQuery(tenant);
      const res = await apiFetch<Array<{ key: string; label: string; icon: string | null; baseCategory?: string | null; popular?: boolean; favourite?: boolean; featured?: boolean }>>(`/public/games/menu${q}`);
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 404)) return [];
      throw err;
    }
  },

  async launchGame(gameId) {
    return apiFetch<GameSession>(`/player/games/${gameId}/launch`, {
      method: 'POST',
      body: JSON.stringify({ surface: 'public' }),
    });
  },

  async launchGameDemo(gameId, tenant) {
    return _runDemo(gameId, tenant);
  },

  prefetchGameDemo(gameId, tenant) {
    if (gameId && tenant) void _runDemo(gameId, tenant);
  },

  async getPromotions() {
    return apiFetch<Promotion[]>('/player/promotions');
  },

  async getBonuses() {
    return apiFetch<PlayerBonus[]>('/player/bonuses');
  },
  async getCashback() {
    return apiFetch<PlayerCashback[]>('/player/cashback');
  },
  async getCoupons() {
    return apiFetch<CouponRedemptionView[]>('/player/coupons');
  },
  async redeemCoupon(code: string) {
    return apiFetch<{ ok: boolean; amountMinor: number; currency: string; code: string }>('/player/coupons/redeem', { method: 'POST', body: JSON.stringify({ code }) });
  },
  async getVip() {
    return apiFetch<PlayerVip>('/player/vip');
  },
  async getLoyalty() {
    return apiFetch<PlayerLoyalty>('/player/loyalty');
  },
  async getTournaments() {
    return apiFetch<PlayerTournament[]>('/player/tournaments');
  },
  async getFreeSpins() {
    return apiFetch<PlayerFreeSpin[]>('/player/free-spins');
  },
  async getBonusWallet() {
    return apiFetch<PlayerBonusWallet>('/player/bonus-wallet');
  },

  async getReferralSummary() {
    return apiFetch<ReferralSummary>('/player/referrals/summary');
  },

  async getKyc() {
    return apiFetch<PlayerKyc>('/player/kyc');
  },

  async uploadImage(file: File, purpose?: 'kyc' | 'avatar' | 'proof') {
    const form = new FormData();
    form.append('file', file);
    const q = purpose ? `?purpose=${purpose}` : '';
    return apiUpload<{ url: string }>(`/player/upload${q}`, form);
  },

  async submitKyc(input) {
    return apiFetch<{ id: string; status: string; submittedAt: string | null }>('/player/kyc', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getNotifications({ page = 1, limit = 10, unreadOnly = false } = {}) {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (unreadOnly) qs.set('unreadOnly', 'true');
    // The notifications endpoint returns raw documents keyed by `_id` (no id
    // serialization), so normalise `_id -> id` for the UI + mark-read calls.
    const raw = await apiFetch<{
      items: Array<Record<string, unknown>>;
      total: number;
      page: number;
      limit: number;
    }>(`/notifications?${qs.toString()}`);
    return {
      ...raw,
      items: (raw.items ?? []).map((n) => ({
        id: String(n._id ?? n.id ?? ''),
        title: String(n.title ?? ''),
        message: (n.message as string | null) ?? null,
        type: String(n.type ?? 'INFO'),
        category: String(n.category ?? 'SYSTEM'),
        link: (n.link as string | null) ?? null,
        isRead: Boolean(n.isRead),
        createdAt: String(n.createdAt ?? ''),
      })),
    } as NotificationPage;
  },

  async getUnreadCount() {
    return apiFetch<{ count: number }>('/notifications/unread-count');
  },

  async markNotificationRead(id) {
    return apiFetch<{ updated: number }>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllNotificationsRead() {
    return apiFetch<{ updated: number }>('/notifications/read-all', { method: 'PATCH' });
  },
  // ---- Support tickets (player) ----
  async getSupportTickets(params: { page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<Paginated<SupportTicket>>(`/player/support/tickets${suffix}`);
  },
  async getSupportTicket(id: string) {
    type TicketDetail = { ticket: SupportTicket; messages: SupportMessage[] };
    return apiFetch<TicketDetail>(`/player/support/tickets/${id}`);
  },
  async createSupportTicket(input: { subject: string; body: string; category?: string }) {
    return apiFetch<SupportTicket>('/player/support/tickets', { method: 'POST', body: JSON.stringify(input) });
  },
  async replySupportTicket(id: string, body: string) {
    return apiFetch<SupportMessage>(`/player/support/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) });
  },

  // ---- Responsible gaming (player self-service) ----
  async getResponsibleGaming() {
    return apiFetch<ResponsibleGaming | null>('/player/responsible-gaming');
  },
  async setResponsibleGaming(input: ResponsibleGamingInput) {
    return apiFetch<ResponsibleGaming>('/player/responsible-gaming', { method: 'PUT', body: JSON.stringify(input) });
  },
};

// Re-export apiSend so consumers importing from this module still resolve.
export { apiSend };
