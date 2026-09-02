import { Pressable, StyleSheet } from 'react-native';

import { hitSlop, useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';

type FABProps = {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: IconName;
  /**
   * Clearance the screen's own layout does NOT already provide beneath the FAB —
   * e.g. `useSafeAreaInsets().bottom` on a full-height screen with no bar. Inside
   * the tab shell pass nothing: `BottomNav` is not absolutely positioned, so each
   * scene already ends at the bar's top edge and the bar already absorbs the
   * safe-area inset. Adding either here counts it twice.
   */
  bottomOffset?: number;
};

/**
 * Anchored to the bottom-end corner, so it lands bottom-right in English and
 * bottom-left in Arabic without a direction check. Rests `spacing.md` (12px)
 * above whatever is beneath it — Figma `50:35`'s gap to `BottomNav`.
 */
export function FAB({ onPress, accessibilityLabel, icon = 'plus', bottomOffset = 0 }: FABProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.root,
        theme.elevation.e3,
        {
          bottom: theme.spacing.md + bottomOffset,
          end: theme.spacing.xl,
          width: hitSlop + theme.spacing.md,
          height: hitSlop + theme.spacing.md,
          borderRadius: theme.radius.full,
          backgroundColor: pressed ? theme.colors.bgPrimaryPressed : theme.colors.bgPrimary,
        },
      ]}
    >
      <Icon name={icon} size={26} color={theme.colors.iconOnPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
