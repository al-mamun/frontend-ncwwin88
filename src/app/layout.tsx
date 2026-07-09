import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import SiteLoader from '../components/shared/site-loader';
import { resolveTenantFromRequest } from '../core/tenant/serverTenant';
import { getThemeKey } from '../core/theme/applyTheme';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantFromRequest();
  return {
    title: tenant.seo?.title ?? tenant.name,
    description: tenant.seo?.description ?? 'Rebuilt platform — foundation',
    icons: tenant.faviconUrl ? { icon: tenant.faviconUrl } : undefined,
    openGraph: tenant.seo?.ogImage ? { images: [tenant.seo.ogImage] } : undefined,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await resolveTenantFromRequest();
  const themeKey = getThemeKey(tenant);

  return (
    <html lang={tenant.locale || 'en'} className="dark" data-theme={themeKey}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/flag-icons/7.2.3/css/flag-icons.min.css" />
      </head>
      <body>
        <SiteLoader />
        <Providers tenant={tenant}>{children}</Providers>
      </body>
    </html>
  );
}
