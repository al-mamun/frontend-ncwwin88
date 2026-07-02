/**
 * applyTheme — compute the CSS-variable token overrides for a tenant.
 *
 * Two layers, merged (later wins):
 *   1. The static per-themeKey PRESET from the theme registry.
 *   2. The per-tenant colour overrides from TenantPublicConfig.theme.
 */

import type { TenantPublicConfig } from '../../types/tenant';
import {
  DEFAULT_THEME_KEY,
  getThemeDescriptor,
  isKnownThemeKey,
  type ThemeTokenPreset,
} from '../../themes/registry';

/**
 * This is a DEDICATED single-brand build (Mega Casino World). It must ALWAYS
 * render the mcwwin87 theme regardless of the backend tenant record or any
 * Vercel env var, so the brand can never fall back to default. The key is
 * hardcoded; an optional NEXT_PUBLIC_THEME_KEY can still override it for local
 * experimentation, and the tenant key is the final fallback.
 */
const FORCED_THEME_KEY = 'mcwwin87';

export function getThemeKey(tenant: Pick<TenantPublicConfig, 'themeKey'>): string {
  if (isKnownThemeKey(FORCED_THEME_KEY)) return FORCED_THEME_KEY;
  const envKey = process.env.NEXT_PUBLIC_THEME_KEY;
  if (isKnownThemeKey(envKey)) return envKey as string;
  return isKnownThemeKey(tenant.themeKey) ? tenant.themeKey : DEFAULT_THEME_KEY;
}

/** Map TenantPublicConfig.theme colour fields onto CSS-variable tokens. */
function tenantThemeToTokens(theme: TenantPublicConfig['theme']): ThemeTokenPreset {
  if (!theme) return {};
  const tokens: ThemeTokenPreset = {};
  if (theme.primary) tokens['--brand-2'] = theme.primary;
  if (theme.secondary) {
    tokens['--accent'] = theme.secondary;
    tokens['--gold-soft'] = theme.secondary;
  }
  if (theme.background) tokens['--bg-base'] = theme.background;
  if (theme.surface) tokens['--bg-surface'] = theme.surface;
  if (theme.text) tokens['--text-primary'] = theme.text;
  return tokens;
}

/**
 * Compute the final token overrides to apply for a tenant: the theme preset
 * with the per-tenant overrides layered on top.
 */
export function computeThemeTokens(tenant: TenantPublicConfig): ThemeTokenPreset {
  const descriptor = getThemeDescriptor(getThemeKey(tenant));
  return {
    ...descriptor.preset,
    ...tenantThemeToTokens(tenant.theme),
  };
}
