import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hitSlop, useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';

type FABProps = {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: IconName;
  /** Extra bottom offset, e.g. to clear a tab bar. */
  bottomOffset?: number;
};

/**
 * Anchored to the bottom-end corner, so it lands bottom-right in English and
 * bottom-left in Arabic without a direction check.
 */
export function FAB({ onPress, accessibilityLabel, icon = 'plus', bottomOffset = 0 }: FABProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
          bottom: insets.bottom + theme.spacing.xl + bottomOffset,
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
