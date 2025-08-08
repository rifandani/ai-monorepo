import { Link } from '@/core/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="font-bold text-8xl text-primary">404</h1>
          <h2 className="font-semibold text-2xl">Not Found</h2>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link className="flex items-center" href={'/chat'} intent="primary">
            Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
