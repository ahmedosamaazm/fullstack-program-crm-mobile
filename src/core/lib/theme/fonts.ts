import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import * as Font from 'expo-font';

/**
 * Keys are the family strings from `typography.ts#fontFamily`, so the
 * weight -> family map and the loaded assets always agree.
 *
 * Loaded via `Font.loadAsync()` rather than the `useFonts` hook or the Expo
 * config plugin — see the plan's "Fonts" section for why: `useFonts` can only
 * run inside a component, which would reintroduce the LTR/system-font flash
 * `bootstrap()` exists to prevent, and the config plugin requires a dev build
 * and forces a `Platform.select` into the weight->family map (Android keys on
 * filename, iOS on PostScript name). Migrating to the plugin later only
 * touches this file and `app.json`.
 */
export const FONT_ASSETS = {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
};

/**
 * Never rejects — a font failure falls back to the system font rather than
 * blocking the splash screen forever.
 */
export async function loadFonts(): Promise<boolean> {
  try {
    await Font.loadAsync(FONT_ASSETS);
    return true;
  } catch {
    return false;
  }
}
