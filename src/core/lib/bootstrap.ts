import * as SplashScreen from 'expo-splash-screen';

import { applyDirection, initI18n, resolveInitialLocale, type Locale } from './i18n';
import { loadFonts, loadPersistedThemeMode, type ThemeMode } from './theme';

export type BootstrapResult = {
  locale: Locale;
  themeMode: ThemeMode;
  /**
   * True when the stored locale's direction doesn't match the direction the
   * native views were created with. Surface a "restart required" notice.
   */
  directionChangePending: boolean;
  /** Whether IBM Plex Sans Arabic finished loading — see `theme/fonts.ts`. */
  fontsLoaded: boolean;
};

/**
 * Holds the splash screen up until the app knows its locale, direction and
 * theme. This is what prevents an LTR flash on a cold start in Arabic: nothing
 * renders until `bootstrap()` resolves.
 *
 * Called at module scope so it runs before React mounts. It rejects if the
 * splash screen is already hidden, which is harmless.
 */
void SplashScreen.preventAutoHideAsync().catch(() => {});

export async function bootstrap(): Promise<BootstrapResult> {
  const locale = await resolveInitialLocale();

  // Direction must be applied before i18next renders anything.
  const directionChangePending = applyDirection(locale);

  const [, themeMode, fontsLoaded] = await Promise.all([
    initI18n(locale),
    loadPersistedThemeMode(),
    loadFonts(),
  ]);

  return { locale, themeMode, directionChangePending, fontsLoaded };
}

export async function hideSplash(): Promise<void> {
  try {
    await SplashScreen.hideAsync();
  } catch {
    // Already hidden.
  }
}
