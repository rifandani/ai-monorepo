'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { getQueryClient } from './client';

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (mod) => ({
      default: mod.ReactQueryDevtools,
    })
  )
);

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  const [showRqDevtools, setShowRqDevtools] = React.useState(false);

  const queryClient = getQueryClient();

  React.useEffect(() => {
    window.toggleRqDevtools = () => setShowRqDevtools((prev) => !prev);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* this will only be rendered in development */}
      <ReactQueryDevtools
        client={queryClient}
        buttonPosition="bottom-right"
        initialIsOpen={false}
      />

      {showRqDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsProduction
            client={queryClient}
            buttonPosition="bottom-right"
            initialIsOpen={false}
          />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
}
