/**
 * Theme registry — map of themeKey -> theme descriptor.
 *
 * A theme bundles a static token PRESET (CSS-variable overrides keyed to
 * globals.css tokens) plus metadata. Per-tenant colour overrides
 * (TenantPublicConfig.theme) are layered ON TOP of the preset at apply-time
 * (see src/core/theme/applyTheme.ts).
 *
 * This is a DEDICATED single-brand build (Nega Casino World): the registry holds
 * the neutral 'default' fallback and the 'mcwwin87' brand theme only.
 */

/** CSS-variable token names recognised by the theme system (subset of globals.css). */
export type ThemeTokenKey =
  | '--bg-base'
  | '--bg-surface'
  | '--bg-elevated'
  | '--brand'
  | '--brand-fg'
  | '--text-primary'
  | '--text-muted'
  | '--border'
  | '--brand-2'
  | '--brand-2-dark'
  | '--accent'
  | '--gold-soft'
  | '--focus-ring';

/** A partial set of token overrides. Anything omitted falls back to globals.css :root. */
export type ThemeTokenPreset = Partial<Record<ThemeTokenKey, string>>;

export interface ThemeDescriptor {
  /** The registry key (also written to <html data-theme>). */
  key: string;
  /** Human-readable label (tooling / future theme picker). */
  label: string;
  /** Static token preset for this theme. Applied before per-tenant overrides. */
  preset: ThemeTokenPreset;
}

export const DEFAULT_THEME_KEY = 'default' as const;

/** The theme registry. */
export const themeRegistry: Record<string, ThemeDescriptor> = {
  default: {
    key: 'default',
    label: 'Default',
    // No overrides — uses the base :root tokens from globals.css.
    preset: {},
  },
    mcwwin87: {
    key: 'mcwwin87',
    label: 'Nega Casino World',
    // NCW reference palette: dark slate page + navy panels + GOLD brand.
    preset: {
      '--bg-base': '#131728',     // background matching html-design
      '--bg-surface': '#232a48',  // header / sidebar / panels
      '--bg-elevated': '#1c223a', // cards / inputs
      '--border': 'rgba(255,255,255,0.05)',
      '--text-muted': '#8b92a8',
      '--brand': '#e6b940',       // gold brand
      '--brand-fg': '#0d0d0d',    // near-black text on gold
      '--brand-2': '#e6b940',
      '--brand-2-dark': '#b8941f',
      '--accent': '#f4d03f',      
      '--gold-soft': '#e6b940',
      '--focus-ring': '#e6b940',
    },
  },
  affiliate: {
    key: 'affiliate',
    label: 'Affiliate Site',
    // Affiliate palette: dark slate page + navy panels + GREEN/BLUE brand.
    preset: {
      '--bg-base': '#131728',     
      '--bg-surface': '#232a48',  
      '--bg-elevated': '#1c223a', 
      '--border': 'rgba(255,255,255,0.05)',
      '--text-muted': '#8b92a8',
      '--brand': '#23d160',       // green brand
      '--brand-fg': '#ffffff',    // white text on green
      '--brand-2': '#23d160',
      '--brand-2-dark': '#1eac4f',
      '--accent': '#3be877',      
      '--gold-soft': '#23d160',
      '--focus-ring': '#23d160',
    },
  },
};

/** True when a themeKey is a known, registered theme. */
export function isKnownThemeKey(key: string | null | undefined): boolean {
  return !!key && Object.prototype.hasOwnProperty.call(themeRegistry, key);
}

/** Resolve a themeKey to its descriptor, falling back to 'default'. */
export function getThemeDescriptor(key: string | null | undefined): ThemeDescriptor {
  if (isKnownThemeKey(key)) return themeRegistry[key as string];
  return themeRegistry[DEFAULT_THEME_KEY];
}
