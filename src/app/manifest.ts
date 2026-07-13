import type { MetadataRoute } from 'next';
import { resolveTenantFromRequest } from '../core/tenant/serverTenant';

/**
 * Per-tenant web app manifest (installable PWA). Name/icon come from the tenant
 * config. For the best "Add to home screen" result the tenant should provide a
 * 512×512 (ideally maskable) PNG icon; `faviconUrl` is used as a fallback.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await resolveTenantFromRequest();
  const icon = tenant.faviconUrl || '/icon.png';
  return {
    name: tenant.name,
    short_name: tenant.name,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1015',
    theme_color: '#0f1015',
    icons: [
      { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon, sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
