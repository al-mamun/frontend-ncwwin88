/**
 * IosInstallHint — a small token-branded modal that tells iOS Safari users how to
 * install the site as an app (iOS has no native install prompt). Shown by the
 * useGetApp() 'ios' path. Colours come from the theme design tokens.
 */
'use client';

import { Share, Plus, X } from 'lucide-react';

export function IosInstallHint({ open, onClose, appName }: { open: boolean; onClose: () => void; appName?: string }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install app"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,.55)', padding: 'env(safe-area-inset-top) 12px calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: 'var(--surface, #16181d)', color: 'var(--text, #fff)',
          border: '1px solid var(--line, rgba(255,255,255,.12))', borderRadius: 16, padding: 18,
          boxShadow: '0 12px 40px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <strong style={{ fontSize: 15 }}>Install {appName || 'the app'}</strong>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-dim, #9aa)', cursor: 'pointer', padding: 4 }}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim, #cbd)', marginBottom: 12 }}>
          Add this site to your Home Screen for a full-screen, app-like experience:
        </p>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--elevated, #1f232b)', color: 'var(--lux, var(--gold, #d4af37))' }}>
              <Share className="h-4 w-4" aria-hidden />
            </span>
            Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--elevated, #1f232b)', color: 'var(--lux, var(--gold, #d4af37))' }}>
              <Plus className="h-4 w-4" aria-hidden />
            </span>
            Choose <strong>Add to Home Screen</strong>.
          </li>
        </ol>
        <button
          onClick={onClose}
          style={{
            marginTop: 16, width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, color: 'var(--brand-fg, var(--brand-foreground, #2a1e00))',
            background: 'var(--brand, var(--lux, var(--gold, #d4af37)))',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default IosInstallHint;
