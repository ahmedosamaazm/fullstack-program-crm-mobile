import { QueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/utils/errors';

/**
 * Single source of server state. Defaults are tuned for a support agent moving
 * between screens quickly on a phone: data stays warm briefly, and auth or
 * permission failures are never retried.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        const { status } = toAppError(error);
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
