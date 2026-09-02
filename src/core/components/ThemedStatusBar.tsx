import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/core/lib/theme';

/**
 * `app.json`'s `userInterfaceStyle: "automatic"` makes the OS bar follow the
 * *system*, not the app. With a manual override the two diverge — dark glyphs
 * on a dark surface, unreadable. This binds the bar to `theme.scheme` instead.
 *
 * Lives in `core/` rather than `src/app/` so the theme read stays out of a
 * route file (hard rule 1). Render it inside `ThemeProvider` so it re-renders
 * on every mode change.
 */
export function ThemedStatusBar() {
  const { scheme } = useTheme();

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
