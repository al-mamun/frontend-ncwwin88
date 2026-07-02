/**
 * ThemeProvider (client).
 *
 * Applies the tenant's computed CSS-variable token overrides to
 * document.documentElement, sets a `data-theme` attribute on <html>, and
 * updates the favicon from tenant.faviconUrl. Re-applies whenever the tenant
 * changes. Exposes the active themeKey via useTheme() (always a known key,
 * 'default' fallback).
 *
 * Styling stays token-only: we never inject literal colours into components —
 * we only override the CSS variables the rest of the app already consumes.
 */

'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useTenant } from '../tenant/TenantProvider';
import { computeThemeTokens, getThemeKey } from './applyTheme';

export interface ThemeContextValue {
  /** Active, registry-known themeKey ('default' when unknown/missing). */
  themeKey: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function setFavicon(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const themeKey = getThemeKey(tenant);

  // Recompute only when the inputs that affect tokens change.
  const tokens = useMemo(() => computeThemeTokens(tenant), [tenant]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Apply token overrides.
    const applied = Object.entries(tokens);
    for (const [name, value] of applied) {
      if (value) root.style.setProperty(name, value);
    }

    // Mark the active theme for theme-scoped CSS / debugging.
    root.setAttribute('data-theme', themeKey);

    // Cleanup: remove the overrides we set so a tenant change doesn't leak.
    return () => {
      for (const [name] of applied) root.style.removeProperty(name);
    };
  }, [tokens, themeKey]);

  useEffect(() => {
    if (tenant.faviconUrl) setFavicon(tenant.faviconUrl);
  }, [tenant.faviconUrl]);

  const value = useMemo<ThemeContextValue>(() => ({ themeKey }), [themeKey]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
