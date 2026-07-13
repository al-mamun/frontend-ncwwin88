/**
 * IosInstallHint — a small token-branded modal with how-to-install steps, shown by
 * useGetApp() when there is no native install prompt to fire (iOS Safari, an already
 * installed app, or a browser that has not offered beforeinstallprompt). It adapts its
 * steps to the visitor's platform (iOS Share sheet vs Android/desktop browser menu).
 */
'use client';

import { useEffect, useState } from 'react';
import { Share, Plus, MoreVertical, Download, X } from 'lucide-react';

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
}

export function IosInstallHint({ open, onClose, appName }: { open: boolean; onClose: () => void; appName?: string }) {
  const [ios, setIos] = useState(false);
  useEffect(() => { setIos(detectIos()); }, []);
  if (!open) return null;

  const chip: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30,
    borderRadius: 8, background: 'var(--elevated, #1f232b)', color: 'var(--lux, var(--gold, #d4af37))',
  };

  const steps = ios
    ? [
        { icon: <Share className="h-4 w-4" aria-hidden />, text: <>Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.</> },
        { icon: <Plus className="h-4 w-4" aria-hidden />, text: <>Choose <strong>Add to Home Screen</strong>.</> },
      ]
    : [
        { icon: <MoreVertical className="h-4 w-4" aria-hidden />, text: <>Open your browser menu (the <strong>&#8942;</strong> icon).</> },
        { icon: <Download className="h-4 w-4" aria-hidden />, text: <>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</> },
      ];

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
          {steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={chip}>{s.icon}</span>
              {s.text}
            </li>
          ))}
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
