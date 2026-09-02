import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatDateTime } from '@/core/utils';

import type { TicketEvent, TicketEventType } from '../types';

export type HistoryRowProps = {
  event: TicketEvent;
  /**
   * Resolves an `assigned` event's `to_value` (a raw profile id) to a name.
   * Returns `null` when the id is not in the department roster — a historical
   * assignee who has since been deactivated or moved. The row renders a generic
   * label rather than falling back to the UUID: an id the reader cannot resolve
   * is noise in an audit trail, not information.
   */
  resolveAgentName: (profileId: string) => string | null;
};

const EVENT_ICON: Record<TicketEventType, 'user' | 'check' | 'clock'> = {
  created: 'user',
  status_changed: 'check',
  assigned: 'user',
  priority_changed: 'clock',
};

/** Raw enum values need a pass through `ticket.*` so the sentence reads "Open", not "open". */
function localiseValue(value: string | null, kind: 'status' | 'priority'): string | null {
  return value === null ? null : `ticket.${kind}.${value}`;
}

export function HistoryRow({ event, resolveAgentName }: HistoryRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const actor = event.actorName ?? t('ticketDetail.event.system');

  let sentence: string;
  switch (event.eventType) {
    case 'created':
      sentence = t('ticketDetail.event.created', { actor });
      break;
    case 'status_changed':
      sentence = t('ticketDetail.event.status_changed', {
        actor,
        from: event.fromValue ? t(localiseValue(event.fromValue, 'status') as string) : event.fromValue,
        to: event.toValue ? t(localiseValue(event.toValue, 'status') as string) : event.toValue,
      });
      break;
    case 'priority_changed':
      sentence = t('ticketDetail.event.priority_changed', {
        actor,
        from: event.fromValue ? t(localiseValue(event.fromValue, 'priority') as string) : event.fromValue,
        to: event.toValue ? t(localiseValue(event.toValue, 'priority') as string) : event.toValue,
      });
      break;
    case 'assigned': {
      if (event.toValue === null) {
        sentence = t('ticketDetail.event.unassigned', { actor });
        break;
      }
      const to = resolveAgentName(event.toValue) ?? t('ticketDetail.event.unknownAgent');
      const from = event.fromValue
        ? (resolveAgentName(event.fromValue) ?? t('ticketDetail.event.unknownAgent'))
        : null;
      sentence = from
        ? t('ticketDetail.event.reassigned', { actor, from, to })
        : t('ticketDetail.event.assigned', { actor, to });
      break;
    }
  }

  return (
    <View
      style={[
        styles.root,
        {
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          // Without this the timeline reads as one undivided block.
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <Icon name={EVENT_ICON[event.eventType]} size={16} color={theme.colors.iconDefault} />
      <View style={styles.body}>
        <Text variant="callout">{sentence}</Text>
        <Text variant="caption" tone="muted">
          {formatDateTime(event.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start' },
  body: { flex: 1 },
});
