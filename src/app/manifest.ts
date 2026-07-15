import type { MetadataRoute } from 'next';
import { resolveTenantFromRequest } from '../core/tenant/serverTenant';

/**
 * Per-tenant installable PWA manifest.
 *
 * Icon preference: dashboard PWA icon → SITE LOGO → favicon. The local
 * /icon-512.png and /icon-192.png are ALWAYS included as guaranteed-valid,
 * maskable PNG icons — so:
 *   • the PWA is ALWAYS installable (Chrome offers its native install prompt)
 *     even when a tenant configured no image (the old '/icon.png' fallback 404'd,
 *     which made the whole manifest invalid and killed installability), and
 *   • Android renders the icon edge-to-edge instead of shrinking it onto a white
 *     plate (the "white border around the logo").
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await resolveTenantFromRequest();
  const brandIcon = tenant.pwaIconUrl || tenant.logoUrl || tenant.faviconUrl || null;

  const icons: MetadataRoute.Manifest['icons'] = [];
  if (brandIcon) {
    // Real brand image first. `type` omitted so png / jpg / webp logos are all
    // accepted; marked maskable so it isn't shrunk onto a white plate.
    icons.push({ src: brandIcon, sizes: '512x512', purpose: 'any maskable' });
    icons.push({ src: brandIcon, sizes: '192x192', purpose: 'any' });
  }
  icons.push(
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
  );

  return {
    name: tenant.name,
    short_name: tenant.name,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1015',
    theme_color: '#0f1015',
    icons,
  };
}
