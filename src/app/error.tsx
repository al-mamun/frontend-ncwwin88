'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold text-danger">Something went wrong</h1>
      <p className="max-w-md text-muted">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
        <Link href="/player/wallet">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}