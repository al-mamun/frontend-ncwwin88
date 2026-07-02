import type { Config } from 'tailwindcss';

/**
 * Tailwind config wired to CSS-variable design tokens (see globals.css and
 * docs/23_UI_UX_DESIGN_SYSTEM.md). Tenants override the token values at the
 * root; components reference semantic tokens only — never literal colors.
 *
 * Secondary casino palette tokens (--brand-2, --accent, --gold-soft) are
 * additive; they do not replace the white-label semantic system.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        brand: { DEFAULT: 'var(--brand)', fg: 'var(--brand-fg)' },
        'brand-2': { DEFAULT: 'var(--brand-2)', dark: 'var(--brand-2-dark)' },
        accent: 'var(--accent)',
        'gold-soft': 'var(--gold-soft)',
        muted: 'var(--text-muted)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      keyframes: {
        'casino-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'casino-slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'casino-ticker': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'casino-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'casino-fade-in': 'casino-fade-in 0.3s ease-out',
        'casino-slide-up': 'casino-slide-up 0.3s ease-out',
        'casino-ticker': 'casino-ticker 28s linear infinite',
        'casino-pulse': 'casino-pulse 1.5s infinite',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};

export default config;