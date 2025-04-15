'use client';

import { AppQueryProvider } from '@/core/providers/query/provider.client';
import { AppToastProvider } from '@/core/providers/toast/provider.client';
import { WebVitals } from '@/core/providers/web-vitals.client';
import type * as React from 'react';
import { I18nProvider as AriaI18nProvider } from 'react-aria';

export function AppProviders({
  children,
  locale,
}: { children: React.ReactNode; locale: string }) {
  return (
    <>
      <AriaI18nProvider locale={locale}>
        <AppToastProvider>
          <AppQueryProvider>{children}</AppQueryProvider>
        </AppToastProvider>
      </AriaI18nProvider>

      <WebVitals />
    </>
  );
}
