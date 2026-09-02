import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import type { TicketStatus } from '../types';
import { StatusBadge } from './StatusBadge';

export type StatusOptionProps = {
  status: TicketStatus;
  description: string;
  selected: boolean;
  onPress: (status: TicketStatus) => void;
  disabled?: boolean;
};

/**
 * `StatusOption` has no `Selected` variant in Figma (node `123:1020`'s only
 * axis is `Status`). The border/background treatment below is invented for
 * this picker — story 09 open question 2.
 */
export function StatusOption({ status, description, selected, onPress, disabled = false }: StatusOptionProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => onPress(status)}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={`${t(`ticket.status.${status}`)}. ${description}`}
      style={[
        styles.root,
        {
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
          borderColor: selected ? theme.colors.borderFocus : theme.colors.borderSubtle,
          backgroundColor: selected ? theme.colors.bgPrimarySubtle : theme.colors.bgSurface,
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      <StatusBadge status={status} />
      <Text variant="caption" tone="secondary" style={styles.description}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  description: { flex: 1 },
});
