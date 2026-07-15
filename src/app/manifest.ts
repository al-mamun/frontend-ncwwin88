import type { MetadataRoute } from 'next';
import { resolveTenantFromRequest } from '../core/tenant/serverTenant';

/**
 * Per-tenant installable PWA manifest.
 *
 * Icon preference: dashboard PWA icon → SITE LOGO → favicon. The local
 * /icon-512.png and /icon-192.png are ALWAYS included as guaranteed-valid PNG
 * icons — so the PWA is ALWAYS installable (Chrome offers its native install
 * prompt) even when a tenant configured no image (the old '/icon.png' fallback
 * 404'd, which killed installability). Each icon is also declared `maskable` so
 * Android renders it edge-to-edge instead of shrinking it onto a white plate.
 *
 * NOTE: Next 14's manifest type only accepts a SINGLE purpose per entry, so the
 * `any` and `maskable` variants are listed as separate entries (never 'any maskable').
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await resolveTenantFromRequest();
  const brandIcon = tenant.pwaIconUrl || tenant.logoUrl || tenant.faviconUrl || null;

  const icons: MetadataRoute.Manifest['icons'] = [];
  if (brandIcon) {
    // Real brand image first. `type` omitted so png / jpg / webp logos are all accepted.
    icons.push({ src: brandIcon, sizes: '512x512', purpose: 'any' });
    icons.push({ src: brandIcon, sizes: '512x512', purpose: 'maskable' });
    icons.push({ src: brandIcon, sizes: '192x192', purpose: 'any' });
  }
  // Guaranteed-valid local PNGs — ensure the app is always installable + maskable.
  icons.push(
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
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
