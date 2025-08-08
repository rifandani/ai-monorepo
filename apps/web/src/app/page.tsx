import { getTranslations } from 'next-intl/server';
import { LanguageToggle } from '@/core/components/language-toggle.client';
import { ProfileMenu } from '@/core/components/profile-menu.client';
import { ThemeToggle } from '@/core/components/theme-toggle.client';
import { createMetadata } from '@/core/utils/seo';

export const metadata = createMetadata({
  title: 'Home',
  description:
    'Welcome to our Next.js application. Explore our modern, feature-rich web platform with theme customization, multi-language support, and user profiles.',
});

export default async function HomePage() {
  const tHome = await getTranslations('home');

  return (
    <div className="container mx-auto flex flex-col items-center gap-y-2 py-24 duration-300">
      <h1 className="text-3xl sm:text-4xl">{tHome('title')}</h1>

      <div className="flex items-center gap-x-2">
        <ThemeToggle />
        <LanguageToggle />
        <ProfileMenu username="Get From Cookies" />
      </div>
    </div>
  );
}
