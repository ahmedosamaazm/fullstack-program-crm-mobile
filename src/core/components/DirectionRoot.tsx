import { View } from 'react-native';
import type { PropsWithChildren, ReactElement } from 'react';

import { useLocale } from '@/core/lib/i18n';

/**
 * Applies the active locale's writing direction to the whole tree via Yoga's
 * `direction` style, so `start`/`end` margins, padding, insets and row order
 * all mirror the moment the language changes — without waiting for the reload
 * that `I18nManager` needs.
 *
 * This does not replace that reload. Native surfaces that read
 * `I18nManager.isRTL` directly (React Navigation transitions, `Modal`,
 * `TextInput` writing direction, `ScrollView` RTL content offset) ignore the
 * Yoga direction; `reloadApp()` is what brings them into line. This is the
 * half that makes the switch feel instant.
 */
export function DirectionRoot({ children }: PropsWithChildren): ReactElement {
  const { direction } = useLocale();
  return <View style={{ flex: 1, direction }}>{children}</View>;
}
