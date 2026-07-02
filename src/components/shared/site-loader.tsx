'use client';

/**
 * Full-screen intro loader (matches the html-design). Shows the loader.webm
 * video on first paint, then fades out shortly after the app is interactive.
 */
import { useEffect, useState } from 'react';

export default function SiteLoader() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHide(true), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`loader${hide ? ' hide' : ''}`} id="loader" aria-hidden={hide}>
      <video className="loader-video" src="/assets/loader/loader.webm" autoPlay loop muted playsInline />
    </div>
  );
}
