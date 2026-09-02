import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/core/lib/theme';
import { formatCount } from '@/core/utils';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  disabled?: boolean;
  /** Leading glyph — used by the ticket-detail composer's internal-note chip (BRD `:674`). */
  icon?: IconName;
};

/**
 * `FilterChip` in Figma sits entirely on the legacy `www.figma.com` import
 * collection — corrupt radius, raw off-scale font sizes, a literal stroke
 * colour (plan §15 flag 7 / the FilterChip section). Built here against the
 * nearest real tokens instead of porting the junk values: `radius.full`,
 * `bgPrimary`/`textOnPrimary` selected, `borderInteractive`/`textSecondary`
 * unselected, `fontSize.xs`/`lineHeight.xs`. Will not match the Figma render
 * pixel-for-pixel — flagged as a follow-up to fix the Figma component.
 *
 * The unselected border was `borderStrong` until story 26 (SCRUM-13): it is the
 * only thing identifying an unselected chip as a control, so WCAG 1.4.11
 * applies, and `borderStrong` measured 1.69 light / 2.68 dark against the card.
 * `borderInteractive` is 4.48 / 6.46. Run `npm run contrast`.
 */
export function FilterChip({ label, selected, onPress, count, disabled = false, icon }: FilterChipProps) {
  const theme = useTheme();
  const tone = selected ? 'onPrimary' : 'secondary';

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
          borderColor: theme.colors.borderInteractive,
          backgroundColor: selected ? theme.colors.bgPrimary : 'transparent',
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      {icon ? (
        <Icon name={icon} size={14} color={selected ? theme.colors.iconOnPrimary : theme.colors.iconDefault} />
      ) : null}
      <Text variant="caption" weight="medium" tone={tone}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" weight="medium" tone={tone}>
          {formatCount(count)}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
});
