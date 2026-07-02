# Next.js Tenant Website — Architecture (Phase C.1)

**App:** `frontend-nextjs` (the public, per-tenant player website). Separate deployment from the backend API (`api.platform.com`) and the owner/admin dashboard (`admin.platform.com`). Built in this phase **frontend-only** — no backend or dashboard changes.

## Core principle
**Separate design from functionality.** Functionality (API client, auth, wallet, payments, games, tenant resolution) is shared and reusable in `src/core`. Design is swappable per tenant via `src/themes/<key>`. No single website design is hardcoded into business logic; the backend API integration is identical for every tenant.

---

## 1. Tenant resolution strategy

The frontend never trusts a client-supplied `tenantId`. The tenant is resolved by **host or slug** and verified by the backend; the backend remains the security boundary (it also identifies the tenant from the session/host on every authenticated call).

Two deployment modes, selected by `NEXT_PUBLIC_TENANT_MODE`:

- **Mode A — single shared deployment (`host`)**: all tenant domains point at one Next.js deployment. The root layout reads the request `Host` header (via `next/headers`) and calls `GET /public/tenant/resolve?host={host}`.
- **Mode B — per-tenant deployment (`slug`)**: each tenant has its own deployment; `NEXT_PUBLIC_TENANT_SLUG` is set, and the app calls `GET /public/tenant/resolve?slug={slug}`. Even here the identity is **verified by the backend** — the env slug alone is not trusted for security.

Resolution happens **server-side** in the root layout (`src/app/layout.tsx` → `src/core/tenant/serverTenant.ts` → `src/core/tenant/resolveTenant.ts`), then the resolved `TenantPublicConfig` is passed into client providers. If the tenant is `SUSPENDED`/`DISABLED`, the app renders a safe "site unavailable" screen (`TenantUnavailable`) — but the backend still independently blocks login/payments/game-launch.

### Current fallback (backend endpoint not yet present)
`GET /public/tenant/resolve` **does not exist in the backend yet**. `resolveTenant` catches the failure, logs a dev-only warning, and returns a **safe fallback** `TenantPublicConfig` built from env (`themeKey = NEXT_PUBLIC_THEME_KEY || 'default'`, status `ACTIVE`, currency/locale from env). This keeps the site fully renderable during development. The feature becomes fully multi-tenant once the backend endpoint is added (see §6).

---

## 2. Implemented structure

```
src/
  core/
    tenant/   resolveTenant.ts · serverTenant.ts · TenantProvider.tsx (useTenant)
    theme/    applyTheme.ts (token mapping) · ThemeProvider.tsx (useTheme)
    wallet/   WalletProvider.tsx (useWalletContext — balance always from backend)
  themes/
    registry.ts        token presets + DEFAULT_THEME_KEY/getThemeDescriptor/isKnownThemeKey
    components.ts       getThemeComponents(themeKey) -> { PublicLayout, HomePage } (default fallback)
    default/            PublicLayout.tsx · HomePage.tsx
    bdbet21/            PublicLayout.tsx · HomePage.tsx · nav.ts · components/*
  lib/api.ts            apiFetch (cookies, no client tenantId, 401→refresh retry, {success,data})
  providers/auth-provider.tsx   AuthProvider/useAuth
  services/ + hooks/    player.service.ts + player-hooks.ts (wallet, ledger, payments, games, promos)
  components/           ui/* · shared/* · layout/player-layout.tsx
  types/                index.ts + tenant.ts (TenantPublicConfig)
```

Provider tree (root layout → `providers.tsx`): `QueryClientProvider > TenantProvider(tenant) > ThemeProvider > AuthProvider > WalletProvider > children`.

Active theme: `ThemeProvider` reads `tenant.themeKey` (fallback `default`); `app/page.tsx` renders `getThemeComponents(themeKey)` → `<PublicLayout><HomePage/></PublicLayout>`. Themes currently drive the **public** surface; the authenticated `(player)` area keeps `player-layout.tsx` (theming authenticated pages is a documented follow-up).

---

## 3. What connects to the backend (all via `apiFetch`, cookies, no client tenantId)
- **Auth:** `POST /auth/login` · `/auth/register` (player under resolved tenant) · `/auth/logout` · `/auth/refresh` · `GET /auth/me`.
- **Account/Wallet:** `GET /player/me` · `PATCH /player/me` · `GET /player/wallet` (available/held; balance never computed client-side) · `GET /player/ledger`.
- **Payments:** `GET /player/payment-methods` (tenant effective list) · `GET /player/payment-accounts` · `POST /player/deposits` · `POST /player/withdrawals`.
- **Games:** `GET /public/games` (public, safe-field catalog — visitors and players both see the full active list; the UI filters by category/provider/search client-side) · `POST /player/games/:id/launch` → backend returns a safe launch URL/token (frontend opens it; never sees provider secrets). Launch is still authenticated/deferred — the UI degrades to "coming soon" until provider integration is authorized.
- **Tenant config:** `GET /public/tenant/resolve` (public, safe fields only).

## 4. What must never be in the frontend
Provider secret/API keys, payment-gateway secrets, backend service keys, signature secrets, admin credentials, tenant private metadata, or any client-supplied `tenantId` override. The frontend only receives **safe public config** and opens **backend-minted** launch URLs.

## 5. Environment configuration (`.env.example` — no secrets)
```
NEXT_PUBLIC_API_BASE_URL=https://api.platform.com/api/v1
NEXT_PUBLIC_TENANT_MODE=host        # 'host' (shared) | 'slug' (per-tenant deploy)
NEXT_PUBLIC_TENANT_SLUG=            # set in slug mode, e.g. bdbet21
NEXT_PUBLIC_THEME_KEY=              # optional theme override / fallback (e.g. bdbet21)
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_DEFAULT_CURRENCY=BDT
```
`.env` holds deployment-level values only — never secrets.

---

## 6. Required backend contract (NOT yet implemented — awaiting authorization)

Add a **public, safe** endpoint:

```
GET /public/tenant/resolve?host={host}      # or ?slug={slug}
```

Response (safe fields only — MUST NOT include secrets):
```json
{
  "tenantId": "public-safe-id-or-slug",
  "name": "Tenant Name",
  "slug": "tenant-slug",
  "domain": "tenantdomain.com",
  "status": "ACTIVE",
  "logoUrl": "",
  "faviconUrl": "",
  "themeKey": "bdbet21",
  "theme": { "primary": "#e63946", "secondary": "#ffd60a", "background": "#0d0d0d", "surface": "#111111", "text": "#ffffff" },
  "currency": "BDT",
  "locale": "bn",
  "enabledModules": [],
  "seo": { "title": "", "description": "", "ogImage": "" }
}
```
- Resolve by `host` (match a tenant's primary/custom domain) or `slug`.
- For a suspended/disabled/unknown tenant: return a safe blocked state (e.g. `status: 'SUSPENDED'` or 404). The frontend shows an unavailable page; login/payment/game-launch must also be blocked backend-side.
- This is the **only** new backend work C.1 needs. It is documented here and **not implemented** — see the deployment note below.

---

## 7. Token mapping (per-tenant theming)
`tenant.theme` → CSS variables (overridden at runtime by `ThemeProvider`): `primary → --brand-2`, `secondary → --accent`/`--gold-soft`, `background → --bg-base`, `surface → --bg-surface`, `text → --text-primary`. A static per-`themeKey` preset is applied first, then per-tenant overrides. Components reference token classes only (no hardcoded brand hex), so a single component set restyles per tenant.

## 8. Design source
The `bdbet21` theme reproduces the look of the provided reference (dark premium, red/gold accents, fixed sidebar, sticky header, banner slider, 8-col game grid, promotions, mobile header + bottom nav, floating rail, footer) — rebuilt as token-driven React components wired to **real** backend data. Deliberately excluded (no fake data): top winners, live matches, animated jackpot timers, fake balances/games/auth, and inline string handlers.

## Validation
`cd frontend-nextjs && npm run typecheck && npm run lint && npm run build`.
