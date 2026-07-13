'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Impersonation landing: the dashboard opens this with a one-time ?code=. We redeem
 * it (which sets the player session cookie on this origin) then land on the player
 * home, logged in as the impersonated player. The code is single-use + short-lived.
 */
export default function ImpersonatePage() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) { setError('Missing impersonation code.'); return; }
    let cancelled = false;
    apiFetch('/public/impersonation/redeem', { method: 'POST', body: JSON.stringify({ code }) })
      .then(() => { if (!cancelled) window.location.assign('/player'); })
      .catch(() => { if (!cancelled) setError('This impersonation link is invalid or has expired.'); });
    return () => { cancelled = true; };
  }, []);
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text, #fff)', textAlign: 'center', padding: 24 }}>
      {error ? (
        <>
          <p style={{ fontWeight: 700 }}>{error}</p>
          <a href="/" style={{ color: 'var(--gold-soft, #ffd60a)' }}>Go to home</a>
        </>
      ) : (
        <p>Signing you in…</p>
      )}
    </div>
  );
}
