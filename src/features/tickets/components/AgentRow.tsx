import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Icon, Text, tintForName } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import type { DepartmentAgent } from '@/features/auth';

export type AgentRowProps = {
  agent: DepartmentAgent;
  /** Renders the CURRENT tag and the trailing check (Figma State=Current). */
  isCurrent: boolean;
  onPress: (agentId: string) => void;
  disabled?: boolean;
};

const AVATAR_SIZE = 36;

export function AgentRow({ agent, isCurrent, onPress, disabled = false }: AgentRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const accessibilityLabel = t(
    isCurrent ? 'ticketDetail.assign.rowLabelCurrent' : 'ticketDetail.assign.rowLabel',
    { name: agent.fullName, count: agent.openTicketCount },
  );

  return (
    <Pressable
      onPress={() => onPress(agent.id)}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected: isCurrent, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        {
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      <Avatar name={agent.fullName} size={AVATAR_SIZE} tint={tintForName(agent.fullName)} />

      <View style={[styles.body, { minWidth: 0, gap: theme.spacing.xxs }]}>
        <View style={[styles.nameRow, { gap: theme.spacing.sm }]}>
          <Text variant="callout" weight="semibold" numberOfLines={1} style={styles.name}>
            {agent.fullName}
          </Text>
          {isCurrent ? (
            <Text variant="overline" tone="muted" style={{ letterSpacing: theme.tracking.wide }}>
              {t('ticketDetail.assign.current')}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" tone="muted">
          {t('ticketDetail.assign.openTickets', { count: agent.openTicketCount })}
        </Text>
      </View>

      {isCurrent ? <Icon name="check" size={20} color={theme.colors.iconDefault} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flexShrink: 1 },
});
