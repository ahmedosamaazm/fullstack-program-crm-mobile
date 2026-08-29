import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/core/components';
import { bootstrap, hideSplash, type BootstrapResult } from '@/core/lib/bootstrap';
import { queryClient } from '@/core/lib/query-client';
import { ThemeProvider } from '@/core/lib/theme';

/**
 * Nothing renders until `bootstrap()` resolves — that's what prevents an LTR
 * flash on a cold start in Arabic. The splash screen stays up (held by
 * `bootstrap.ts` at import time) until then.
 */
export default function RootLayout() {
  const [result, setResult] = useState<BootstrapResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void bootstrap().then((value) => {
      if (!cancelled) setResult(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (result) void hideSplash();
  }, [result]);

  if (!result) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialMode={result.themeMode} fontsLoaded={result.fontsLoaded}>
          <QueryClientProvider client={queryClient}>
            <Slot />
            <OfflineBanner />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
