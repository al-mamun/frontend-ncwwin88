import type { MetadataRoute } from 'next';
import { resolveTenantFromRequest } from '../core/tenant/serverTenant';

/**
 * Per-tenant installable PWA manifest.
 *
 * App icon source, in priority order:
 *   1. Dashboard "App logo (home-screen icon)"  -> tenant.pwaIconUrl
 *   2. Tenant branding Logo                      -> tenant.logoUrl
 *   3. Favicon                                   -> tenant.faviconUrl
 *
 * The tenant's own image IS the installed app icon, declared with `sizes: 'any'`
 * so the browser accepts it at whatever pixel dimensions it really is.
 *
 * WHY 'any' and not '512x512': declaring a small/non-square logo as '512x512' is
 * a lie Chrome catches — it rejects the mismatched icon and falls back to the
 * next valid one. Previously that fallback was a generic local /icon-512.png, so
 * EVERY brand installed with the SAME placeholder icon. The local /icon-*.png
 * files are now used ONLY when a tenant configured no image at all, purely to
 * keep the app installable. Each icon is also declared `maskable` so Android
 * renders it edge-to-edge instead of shrinking it onto a white plate.
 *
 * For a crisp home-screen icon, upload a square 512x512 PNG in the dashboard
 * under "App logo (home-screen icon)". If left empty, the branding Logo is used.
 *
 * NOTE: Next 14's manifest type only accepts a SINGLE purpose per entry, so the
 * `any` and `maskable` variants are listed as separate entries (never 'any maskable').
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await resolveTenantFromRequest();
  const brandIcon = tenant.pwaIconUrl || tenant.logoUrl || tenant.faviconUrl || null;

  const icons: MetadataRoute.Manifest['icons'] = [];
  if (brandIcon) {
    // Tenant's own image IS the app icon. `sizes: 'any'` = honest about unknown
    // pixel size; `type` omitted so png / jpg / webp logos are all accepted.
    icons.push({ src: brandIcon, sizes: 'any', purpose: 'any' });
    icons.push({ src: brandIcon, sizes: 'any', purpose: 'maskable' });
  } else {
    // No brand image configured at all — guaranteed-valid local PNGs keep the
    // app installable (Chrome still offers its native install prompt).
    icons.push(
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    );
  }

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
