import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DirectionRoot, OfflineBanner, ThemedStatusBar } from '@/core/components';
import { bootstrap, hideSplash, type BootstrapResult } from '@/core/lib/bootstrap';
import { LocaleProvider } from '@/core/lib/i18n';
import { queryClient } from '@/core/lib/query-client';
import { ThemeProvider, useTheme } from '@/core/lib/theme';
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
      <LocaleProvider initialLocale={result.locale}>
        <DirectionRoot>
          <SafeAreaProvider>
            <ThemeProvider initialMode={result.themeMode} fontsLoaded={result.fontsLoaded}>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <RootNavigator />
                  <ThemedStatusBar />
                  <OfflineBanner />
                </AuthProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </DirectionRoot>
      </LocaleProvider>
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
  const theme = useTheme();

  useEffect(() => {
    if (status !== 'loading') void hideSplash();
  }, [status]);

  if (status === 'loading') return null;

  return (
    // `contentStyle` is what stops React Navigation's `DefaultTheme` (white
    // `background`/`card`) painting a wipe behind every push, and behind the
    // three `presentation: 'modal'` screens below (story 26, SCRUM-13).
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bgCanvas },
      }}
    >
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tickets/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="customers/[id]" />
        <Stack.Screen name="customers/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="customers/edit/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tickets/new" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
