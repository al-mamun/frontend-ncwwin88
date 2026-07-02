import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-extrabold text-brand">404</h1>
      <h2 className="text-xl font-semibold">Page Not Found</h2>
      <p className="max-w-sm text-muted">
        The page you requested does not exist or may have been moved.
      </p>
      <Link href="/player/wallet">
        <Button variant="default">Back to Wallet</Button>
      </Link>
    </div>
  );
}