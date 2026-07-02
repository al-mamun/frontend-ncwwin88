/**
 * Tenant resolution.
 *
 * Resolves the public configuration for the current tenant. The backend is the
 * real enforcement boundary — it determines the tenant from the request host or
 * the authenticated session. The client NEVER sends a tenantId.
 *
 * MODE (env):
 *   NEXT_PUBLIC_TENANT_MODE  'host' | 'slug'   (default 'host')
 *   NEXT_PUBLIC_TENANT_SLUG  used when mode === 'slug'
 *   NEXT_PUBLIC_THEME_KEY    fallback theme key for the safe fallback config
 *
 * BACKEND CONTRACT: GET /public/tenant/resolve — see
 *   NEXTJS_TENANT_WEBSITE_ARCHITECTURE.md
 * Expected (within the standard {success,message,data} envelope):
 *   ?host={host}  (host mode)  OR  ?slug={slug}  (slug mode)
 *   -> data: TenantPublicConfig
 *
 * IMPORTANT: this endpoint does NOT exist on the backend yet. Any failure
 * (404, network error, bad shape) is handled GRACEFULLY by returning a safe
 * fallback config built from env so the app keeps running. It never throws.
 */

import { apiFetch } from '../../lib/api';
import type { TenantPublicConfig } from '../../types/tenant';
import { DEFAULT_THEME_KEY } from '../../themes/registry';

export type TenantMode = 'host' | 'slug';

export function getTenantMode(): TenantMode {
  const mode = process.env.NEXT_PUBLIC_TENANT_MODE;
  return mode === 'slug' ? 'slug' : 'host';
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Build a safe fallback TenantPublicConfig from env. Used whenever the backend
 * resolve endpoint is unavailable. Keeps the app fully functional (UX-only).
 */
export function buildFallbackTenant(host?: string): TenantPublicConfig {
  const themeKey = process.env.NEXT_PUBLIC_THEME_KEY || DEFAULT_THEME_KEY;
  const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en';
  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG || 'default';

  return {
    // No real tenantId on the client — '' signals "resolved by backend".
    tenantId: '',
    name: 'Casino',
    slug,
    domain: host ?? '',
    status: 'ACTIVE',
    logoUrl: null,
    faviconUrl: null,
    themeKey,
    currency,
    locale,
    enabledModules: [],
    paymentMethodLogos: [],
  };
}

/**
 * Resolve the tenant for the current request.
 *
 * @param host  The request host (server-supplied via next/headers). Used in
 *              'host' mode. In 'slug' mode the env slug is used instead.
 *
 * Always resolves; never rejects. On any failure, returns the env fallback.
 */
export async function resolveTenant(
  opts: { host?: string } = {},
): Promise<TenantPublicConfig> {
  const mode = getTenantMode();
  const { host } = opts;

  const query =
    mode === 'slug'
      ? `slug=${encodeURIComponent(process.env.NEXT_PUBLIC_TENANT_SLUG || '')}`
      : `host=${encodeURIComponent(host ?? '')}`;

  try {
    const config = await apiFetch<TenantPublicConfig>(
      `/public/tenant/resolve?${query}`,
    );
    // Defensive: ensure a usable themeKey even if backend omits it.
    if (!config.themeKey) {
      return { ...config, themeKey: process.env.NEXT_PUBLIC_THEME_KEY || DEFAULT_THEME_KEY };
    }
    return config;
  } catch (err) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(
        '[resolveTenant] GET /public/tenant/resolve unavailable — using env fallback. ' +
          'This endpoint is not yet implemented on the backend ' +
          '(BACKEND CONTRACT: see NEXTJS_TENANT_WEBSITE_ARCHITECTURE.md).',
        err instanceof Error ? err.message : err,
      );
    }
    return buildFallbackTenant(host);
  }
}
