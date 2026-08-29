import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/core/lib/theme';
import { formatCount } from '@/core/utils';

import { Text } from './Text';

export type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  disabled?: boolean;
};

/**
 * `FilterChip` in Figma sits entirely on the legacy `www.figma.com` import
 * collection — corrupt radius, raw off-scale font sizes, a literal stroke
 * colour (plan §15 flag 7 / the FilterChip section). Built here against the
 * nearest real tokens instead of porting the junk values: `radius.full`,
 * `bgPrimary`/`textOnPrimary` selected, `borderStrong`/`textSecondary`
 * unselected, `fontSize.xs`/`lineHeight.xs`. Will not match the Figma render
 * pixel-for-pixel — flagged as a follow-up to fix the Figma component.
 */
export function FilterChip({ label, selected, onPress, count, disabled = false }: FilterChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.root,
        {
          gap: theme.spacing.xs,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.full,
          borderWidth: selected ? 0 : StyleSheet.hairlineWidth,
          borderColor: theme.colors.borderStrong,
          backgroundColor: selected ? theme.colors.bgPrimary : 'transparent',
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      <Text variant="caption" weight="medium" tone={selected ? 'onPrimary' : 'secondary'}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" weight="medium" tone={selected ? 'onPrimary' : 'secondary'}>
          {formatCount(count)}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
});
