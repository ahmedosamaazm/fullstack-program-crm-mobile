import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/core/components';
import { bootstrap, hideSplash, type BootstrapResult } from '@/core/lib/bootstrap';
import { queryClient } from '@/core/lib/query-client';
import { ThemeProvider } from '@/core/lib/theme';
import { AuthProvider, useAuth } from '@/features/auth';

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

  if (!result) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialMode={result.themeMode} fontsLoaded={result.fontsLoaded}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RootNavigator />
              <OfflineBanner />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Guards the authenticated root behind the session status. Splash stays up
 * until the session read resolves — otherwise an already-signed-in agent
 * would see a flash of the login screen on every cold start.
 */
function RootNavigator() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') void hideSplash();
  }, [status]);

  if (status === 'loading') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
