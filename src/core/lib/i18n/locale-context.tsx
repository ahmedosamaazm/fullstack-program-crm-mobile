import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import i18n, {
  currentLocale,
  directionOf,
  nativeDirection,
  setLocale as persistLocale,
  type Direction,
  type Locale,
} from './config';
import { reloadApp } from './reload';

export type LocaleContextValue = {
  locale: Locale;
  /** Direction for the locale that is active *now*, not the latched native one. */
  direction: Direction;
  isRtl: boolean;
  /**
   * True when the native layer is still running the previous direction — i.e.
   * a switch happened and the reload has not landed. Screens use it to keep a
   * "restart to finish applying" notice up.
   */
  restartPending: boolean;
  /**
   * Switches language, persists it, and flips the Yoga direction immediately.
   * When the direction changes it also reloads the app so the native layer
   * follows; resolves false if the reload could not run, leaving
   * `restartPending` true.
   */
  changeLocale: (next: Locale) => Promise<boolean>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Owns locale and direction as React state so a language switch re-renders the
 * tree, rather than every consumer reading `i18n.language` / `I18nManager`
 * imperatively and re-rendering only by accident.
 *
 * `initialLocale` comes from `bootstrap()`, which resolved it before first
 * paint — this provider must never do that resolution itself, or a cold start
 * in Arabic flashes LTR.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: PropsWithChildren<{ initialLocale: Locale }>): ReactElement {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // i18next can change language from outside this provider (a `t` call with an
  // explicit lng, a future deep link). Mirror it rather than letting the two
  // drift apart.
  useEffect(() => {
    function handleLanguageChanged() {
      setLocaleState(currentLocale());
    }
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const changeLocale = useCallback(
    async (next: Locale) => {
      if (next === currentLocale()) return true;

      // `persistLocale` writes the preference, changes i18next, and schedules
      // the native direction flip; it returns whether that flip needs a reload.
      const needsReload = await persistLocale(next);
      setLocaleState(next);
      if (!needsReload) return true;

      return reloadApp();
    },
    [],
  );

  const value = useMemo<LocaleContextValue>(() => {
    const direction = directionOf(locale);
    return {
      locale,
      direction,
      isRtl: direction === 'rtl',
      restartPending: direction !== nativeDirection(),
      changeLocale,
    };
  }, [locale, changeLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Throws outside `LocaleProvider` rather than falling back to `i18n.language`:
 * a silent fallback would render correctly once and then never update, which is
 * exactly the bug this provider exists to remove.
 */
export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used within a LocaleProvider');
  return value;
}

/** Internal — lets `useDirection()` fall back to the app-wide direction. */
export function useAppDirection(): Direction | null {
  return useContext(LocaleContext)?.direction ?? null;
}
