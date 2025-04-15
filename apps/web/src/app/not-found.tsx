import { AUTH_COOKIE_NAME } from '@/auth/constants/auth';
import { Link } from '@/core/components/ui';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export default async function NotFound() {
  const t = await getTranslations();
  const cookie = await cookies();
  const session = cookie.get(AUTH_COOKIE_NAME)?.value;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="font-bold text-8xl text-primary">404</h1>
          <h2 className="font-semibold text-2xl">{t('auth.notFound')}</h2>
          <p className="text-muted-foreground">{t('auth.gone')}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            intent="primary"
            href={session ? '/' : '/login'}
            className="flex items-center"
          >
            {t('core.backTo', {
              target: session ? t('home.title') : 'Login',
            })}
          </Link>
        </div>
      </div>
    </div>
  );
}
