/**
 * Public landing page (white-label, per-tenant theme).
 *
 * The active themeKey is read from the ThemeProvider (useTheme), resolved to a
 * { PublicLayout, HomePage } pair via getThemeComponents (falls back to
 * 'default' for unknown keys), and rendered. This is a client component because
 * useTheme/useTenant/useAuth are client hooks.
 *
 * NOTE: this drives only the PUBLIC surface. The authenticated (player) layout
 * keeps its own shell — applying themes to authenticated pages is a follow-up.
 */

'use client';

import { useTheme } from '../core/theme/ThemeProvider';
import { getThemeComponents } from '../themes/components';

export default function RootPage() {
  const { themeKey } = useTheme();
  const { PublicLayout, HomePage } = getThemeComponents(themeKey);

  return (
    <PublicLayout>
      <HomePage />
    </PublicLayout>
  );
}
