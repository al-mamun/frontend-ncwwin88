/**
 * Theme component loader.
 *
 * Maps a registry themeKey -> the React components that drive the PUBLIC
 * surface for that theme. Unknown keys fall back to the 'default' (neutral
 * white-label) theme so a misconfigured tenant always renders a sane site.
 *
 * This is a DEDICATED single-brand build (Nega Casino World): only 'default'
 * and 'mcwwin87' are registered.
 */

import type { ComponentType, ReactNode } from 'react';
import { DEFAULT_THEME_KEY, isKnownThemeKey } from './registry';

import DefaultPublicLayout from './default/PublicLayout';
import DefaultHomePage from './default/HomePage';
import Mcwwin87PublicLayout from './mcwwin87/PublicLayout';
import Mcwwin87HomePage from './mcwwin87/HomePage';

/** The component contract every theme must satisfy for the public surface. */
export interface ThemeComponents {
  /** Wraps the public surface (header/footer/nav chrome). */
  PublicLayout: ComponentType<{ children: ReactNode }>;
  /** The public landing page content rendered inside PublicLayout. */
  HomePage: ComponentType;
}

const themeComponents: Record<string, ThemeComponents> = {
  default: {
    PublicLayout: DefaultPublicLayout,
    HomePage: DefaultHomePage,
  },
  mcwwin87: {
    PublicLayout: Mcwwin87PublicLayout,
    HomePage: Mcwwin87HomePage,
  },
  affiliate: {
    PublicLayout: Mcwwin87PublicLayout,
    HomePage: Mcwwin87HomePage,
  },
};

/**
 * Resolve the components for a themeKey, falling back to 'default' for unknown
 * or missing keys.
 */
export function getThemeComponents(key: string | null | undefined): ThemeComponents {
  if (isKnownThemeKey(key) && themeComponents[key as string]) {
    return themeComponents[key as string];
  }
  return themeComponents[DEFAULT_THEME_KEY];
}
