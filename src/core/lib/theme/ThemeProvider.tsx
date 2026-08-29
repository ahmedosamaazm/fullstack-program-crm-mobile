import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';
import { darkElevation, lightElevation, type Elevation } from './elevation';
import { opacity, radius, spacing, hitSlop } from './layout';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  tracking,
  typography,
} from './typography';

const THEME_MODE_KEY = 'azm.theme.mode';

/** `system` follows the OS; the other two are explicit user overrides. */
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  opacity: typeof opacity;
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
  tracking: typeof tracking;
  fontWeight: typeof fontWeight;
  fontFamily: typeof fontFamily;
  typography: typeof typography;
  elevation: Elevation;
  /** The scheme actually being rendered, after resolving `system`. */
  scheme: ColorScheme;
  /** The user's stored preference, which may be `system`. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Whether IBM Plex Sans Arabic finished loading — see `fonts.ts`. */
  fontsLoaded: boolean;
};

const ThemeContext = createContext<Theme | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function toScheme(value: ColorSchemeName | null | undefined): ColorScheme {
  return value === 'dark' ? 'dark' : 'light';
}

function buildTheme(scheme: ColorScheme, fontsLoaded: boolean): Omit<Theme, 'mode' | 'setMode'> {
  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    opacity,
    fontSize,
    lineHeight,
    tracking,
    fontWeight,
    fontFamily,
    typography,
    elevation: scheme === 'dark' ? darkElevation : lightElevation,
    scheme,
    fontsLoaded,
  };
}

/**
 * Reads the persisted override. Called during bootstrap so the very first paint
 * already uses the correct scheme — see `core/lib/bootstrap.ts`.
 */
export async function loadPersistedThemeMode(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

type ThemeProviderProps = PropsWithChildren<{
  /** Resolved during bootstrap. Passing it avoids a light-theme flash on cold start. */
  initialMode: ThemeMode;
  /** Resolved during bootstrap — see `fonts.ts#loadFonts`. */
  fontsLoaded: boolean;
}>;

export function ThemeProvider({ initialMode, fontsLoaded, children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [systemScheme, setSystemScheme] = useState<ColorScheme>(() =>
    toScheme(Appearance.getColorScheme()),
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(toScheme(colorScheme));
    });
    return () => subscription.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    // Fire-and-forget: a failed write only costs the preference next launch.
    void AsyncStorage.setItem(THEME_MODE_KEY, next).catch(() => {});
  }, []);

  const scheme: ColorScheme = mode === 'system' ? systemScheme : mode;

  // `Appearance.addChangeListener` fires on every OS theme change even when
  // the user has pinned a mode — memoising means those changes don't
  // re-render every consumer in the app when nothing visible changed.
  const value = useMemo<Theme>(
    () => ({ ...buildTheme(scheme, fontsLoaded), mode, setMode }),
    [scheme, fontsLoaded, mode, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return theme;
}

type ThemeScopeProps = PropsWithChildren<{
  /** Forces a scheme regardless of the ambient `ThemeProvider`. */
  scheme: ColorScheme;
}>;

/**
 * Pushes a forced palette onto the same context, with a no-op `setMode` —
 * for previewing both schemes side by side (the dev gallery's "both" mode).
 * Deliberately does NOT nest `ThemeProvider`: its `setMode` writes to
 * AsyncStorage and would clobber the user's real preference.
 */
export function ThemeScope({ scheme, children }: ThemeScopeProps) {
  const ambient = useTheme();
  const noopSetMode = useCallback(() => {}, []);

  const value = useMemo<Theme>(
    () => ({ ...buildTheme(scheme, ambient.fontsLoaded), mode: scheme, setMode: noopSetMode }),
    [scheme, ambient.fontsLoaded, noopSetMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { hitSlop };
