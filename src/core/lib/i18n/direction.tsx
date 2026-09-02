import { createContext, useContext, type PropsWithChildren, type ReactElement } from 'react';

import { nativeDirection, type Direction } from './config';
import { useAppDirection } from './locale-context';

export type { Direction };

const DirectionContext = createContext<Direction | null>(null);

/**
 * Direction for the current subtree, resolved in priority order:
 *
 * 1. an enclosing `DirectionScope` (the dev gallery's RTL preview),
 * 2. `LocaleProvider`'s live direction — reactive, so an in-session language
 *    switch re-renders every consumer,
 * 3. `I18nManager.isRTL`, the direction latched at process start, for the
 *    handful of trees that render above the provider.
 *
 * Two places read this: `Icon`'s RTL mirror and `Text`'s `align="end"`. Both
 * must go through this hook rather than reading `I18nManager` directly, or
 * they stay stuck on the latched native direction after a switch — the exact
 * half-flipped state (Arabic text, LTR alignment) this replaces.
 */
export function useDirection(): Direction {
  const scoped = useContext(DirectionContext);
  const app = useAppDirection();
  return scoped ?? app ?? nativeDirection();
}

/**
 * Forces `direction` for its subtree, overriding `LocaleProvider`. Callers
 * still need `style={{ direction }}` on the wrapping view for Yoga to mirror
 * layout; this only affects what `useDirection()` reports.
 */
export function DirectionScope({
  direction,
  children,
}: PropsWithChildren<{ direction: Direction }>): ReactElement {
  return <DirectionContext.Provider value={direction}>{children}</DirectionContext.Provider>;
}
