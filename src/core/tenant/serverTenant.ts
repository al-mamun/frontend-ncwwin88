/**
 * Server-only tenant helper.
 *
 * Reads the request host from Next.js `headers()` (Server Component / RSC) and
 * resolves the tenant config. Call this from the root layout and pass the
 * result down to the client <TenantProvider> as a prop. The host header is
 * never trusted for access control — it only drives which public config /
 * theme is presented; the backend resolves the authoritative tenant.
 */

// NOTE: this module is server-only by construction — it imports next/headers,
// which is unavailable in Client Components. (We avoid the optional
// 'server-only' package to keep dependencies unchanged.)
import { headers } from 'next/headers';
import { resolveTenant } from './resolveTenant';
import type { TenantPublicConfig } from '../../types/tenant';

/** Read the incoming request host (prefers x-forwarded-host behind proxies). */
export function getRequestHost(): string | undefined {
  const h = headers();
  return h.get('x-forwarded-host') ?? h.get('host') ?? undefined;
}

/** Resolve the tenant config on the server using the request host. */
export async function resolveTenantFromRequest(): Promise<TenantPublicConfig> {
  const host = getRequestHost();
  return resolveTenant({ host });
}
