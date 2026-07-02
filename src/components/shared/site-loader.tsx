'use client';

/**
 * Full-screen intro loader for ncwwin88 (Nega Casino World) — player + affiliate
 * sites. A branded CSS animation in the logo's GOLD theme: a gold spinning ring,
 * a shimmering "NEGA CASINO WORLD" wordmark, and a gold progress bar. No video
 * asset. Fades out once the app is interactive.
 */
import { useEffect, useState } from 'react';

export default function SiteLoader() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHide(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`loader${hide ? ' hide' : ''}`} id="loader" aria-hidden={hide}>
      <div className="nc-loader">
        <div className="nc-loader__ring" aria-hidden />
        <div className="nc-loader__brand">
          <span>NEGA</span><span>CASINO</span><span>WORLD</span>
        </div>
        <div className="nc-loader__bar" aria-hidden><span /></div>
      </div>

      <style>{`
        .nc-loader { display: flex; flex-direction: column; align-items: center; gap: 18px; }
        .nc-loader__ring {
          width: 62px; height: 62px; border-radius: 50%;
          border: 4px solid rgba(212,175,55,0.14);
          border-top-color: #f5d67a;      /* light gold */
          border-right-color: #b8860b;    /* deep gold */
          box-shadow: 0 0 18px rgba(212,175,55,0.25);
          animation: nc-spin 0.85s linear infinite;
        }
        .nc-loader__brand {
          display: flex; gap: 10px; font-size: 20px; font-weight: 800;
          letter-spacing: 3px; line-height: 1;
          background: linear-gradient(90deg, #b8860b 0%, #f7e08a 45%, #d4af37 70%, #b8860b 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          animation: nc-shimmer 2.2s linear infinite;
        }
        .nc-loader__bar {
          width: 150px; height: 4px; border-radius: 4px; overflow: hidden;
          background: rgba(212,175,55,0.14);
        }
        .nc-loader__bar > span {
          display: block; height: 100%; width: 40%; border-radius: 4px;
          background: linear-gradient(90deg, #b8860b, #f7e08a, #d4af37);
          box-shadow: 0 0 10px rgba(212,175,55,0.5);
          animation: nc-slide 1.1s ease-in-out infinite;
        }
        @keyframes nc-spin { to { transform: rotate(360deg); } }
        @keyframes nc-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes nc-slide { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
      `}</style>
    </div>
  );
}
