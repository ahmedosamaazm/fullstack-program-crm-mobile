import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import ar from './locales/ar.json';
import en from './locales/en.json';

export { useDirection, DirectionScope, type Direction } from './direction';

const LOCALE_KEY = 'azm.locale';

export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Arabic-first: the fallback when the device locale is neither ar nor en. */
export const DEFAULT_LOCALE: Locale = 'ar';

const RTL_LOCALES: readonly Locale[] = ['ar'];

export function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

function isSupported(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/**
 * Resolves the locale to use for this launch: an explicit stored choice wins,
 * otherwise the device's preferred language, otherwise Arabic.
 */
export async function resolveInitialLocale(): Promise<Locale> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    // Storage unavailable — fall through to the device locale.
  }

  const deviceLanguage = Localization.getLocales()[0]?.languageCode;
  return isSupported(deviceLanguage) ? deviceLanguage : DEFAULT_LOCALE;
}

/**
 * Applies the layout direction for `locale`.
 *
 * Returns true when the direction differs from the one the native views were
 * created with. React Native latches direction at startup, so an in-session
 * switch cannot take effect until the app restarts — the caller is expected to
 * surface that to the user rather than silently render a half-flipped UI.
 */
export function applyDirection(locale: Locale): boolean {
  const shouldBeRtl = isRtlLocale(locale);
  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);
  return I18nManager.isRTL !== shouldBeRtl;
}

/**
 * Initialises i18next with an already-resolved locale. Must be awaited during
 * bootstrap, before the first render, so no frame is painted in the wrong
 * language or direction.
 */
export async function initI18n(locale: Locale): Promise<typeof i18n> {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(locale);
    return i18n;
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: 'translation',
    interpolation: {
      // React already escapes rendered values.
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18n;
}

/**
 * Switches language for the running session and persists the choice.
 * Resolves true when a restart is required for the direction to take effect.
 */
export async function setLocale(locale: Locale): Promise<boolean> {
  await i18n.changeLanguage(locale);
  try {
    await AsyncStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // A failed write only costs the preference on next launch.
  }
  return applyDirection(locale);
}

export function currentLocale(): Locale {
  return isSupported(i18n.language) ? i18n.language : DEFAULT_LOCALE;
}

export default i18n;
