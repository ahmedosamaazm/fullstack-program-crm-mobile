import { createContext, useContext, type PropsWithChildren, type ReactElement } from 'react';
import { I18nManager } from 'react-native';

export type Direction = 'ltr' | 'rtl';

const DirectionContext = createContext<Direction | null>(null);

/**
 * Direction for the current subtree. Falls back to `I18nManager.isRTL` (the
 * app-wide direction latched at startup) when no `DirectionScope` is above —
 * which is the normal case everywhere except the dev gallery's RTL preview.
 *
 * Two places read this: `Icon`'s RTL mirror and `Text`'s `align="end"`. Both
 * must go through this hook rather than reading `I18nManager` directly, or
 * they can't follow a per-subtree override and the gallery's preview would
 * lie about exactly the two things most likely to be wrong.
 */
export function useDirection(): Direction {
  const scoped = useContext(DirectionContext);
  return scoped ?? (I18nManager.isRTL ? 'rtl' : 'ltr');
}

/**
 * Forces `direction` for its subtree without touching `I18nManager` — RN
 * latches direction at startup, so an in-session flip there needs a restart
 * (see `applyDirection`). Callers still need `style={{ direction }}` on the
 * wrapping view for Yoga to actually mirror layout; this only affects what
 * `useDirection()` reports.
 */
export function DirectionScope({
  direction,
  children,
}: PropsWithChildren<{ direction: Direction }>): ReactElement {
  return <DirectionContext.Provider value={direction}>{children}</DirectionContext.Provider>;
}
