'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button type="button" aria-label="Scroll to top" className="scrolltop-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <ChevronUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
