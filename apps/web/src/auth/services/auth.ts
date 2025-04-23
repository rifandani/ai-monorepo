import { ENV } from '@/core/constants/env';
import { http } from '@/core/services/http';
import { loggerBrowser } from '@workspace/core/utils/logger';
import { createAuthClient } from 'better-auth/react';
import { toast } from 'sonner';

export const authClient = createAuthClient({
  baseURL: ENV.NEXT_PUBLIC_API_BASE_URL,
  fetchOptions: {
    customFetchImpl: (url, options) => {
      return http.instance(url, options);
    },
    onError(e) {
      if (e.error.status === 429) {
        toast.error('Too many requests. Please try again later.');
      }
    },
  },
});

authClient.$store.listen('$sessionSignal', (ctx) => {
  loggerBrowser.info('$sessionSignal', ctx);
});

export type AuthSession = typeof authClient.$Infer.Session;
