import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import { priorityColor } from '../priority';
import type { TicketPriority } from '../types';

export type PriorityChipProps = {
  priority: TicketPriority;
  selected: boolean;
  onPress: (priority: TicketPriority) => void;
  disabled?: boolean;
};

const HEIGHT = 40; // Figma 102:975 and siblings.
const RAIL_WIDTH = 3;
const RAIL_HEIGHT = 16;

/**
 * Deliberately NOT `FilterChip`: that is a `radius.full` pill with no leading
 * rail, and its own doc comment records that it is built against substituted
 * tokens because its Figma source is corrupt. This is a domain control, so it
 * lives with its feature.
 *
 * The selected treatment is this plan's invention — Figma renders all four
 * chips identically even though BRD `:617` mandates a `medium` default. Follows
 * the pattern story 09 used for `StatusOption`'s missing selected state, and
 * changes the label WEIGHT as well as the colour, so the cue is not colour-only.
 */
export function PriorityChip({ priority, selected, onPress, disabled = false }: PriorityChipProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onPress(priority)}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      style={[
        styles.root,
        {
          height: HEIGHT,
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderColor: selected ? theme.colors.borderFocus : theme.colors.borderDefault,
          backgroundColor: selected ? theme.colors.bgPrimarySubtle : theme.colors.bgSurface,
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      <View
        style={{
          width: RAIL_WIDTH,
          height: RAIL_HEIGHT,
          borderRadius: theme.radius.full,
          backgroundColor: priorityColor(priority, theme),
        }}
      />
      <Text variant="callout" weight={selected ? 'semibold' : 'regular'} numberOfLines={1}>
        {t(`ticket.priority.${priority}`)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
