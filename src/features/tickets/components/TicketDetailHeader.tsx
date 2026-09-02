import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconButton, Text, type TextTone } from '@/core/components';
import { useTheme, type Theme } from '@/core/lib/theme';

import { priorityColor } from '../priority';
import type { TicketDetail } from '../types';
import { statusStyle } from './StatusBadge';

export type TicketDetailHeaderProps = {
  ticket: TicketDetail;
  onBack: () => void;
  onAssignPress: () => void;
  onStatusPress: () => void;
  statusDisabled: boolean;
};

const DOT_SIZE = 8;
const SEPARATOR_SIZE = 3;

/** Reuses `StatusBadge`'s status→tone decision rather than inventing a second map. */
function toneColor(tone: TextTone, theme: Theme): string {
  switch (tone) {
    case 'info':
      return theme.colors.statusInfo;
    case 'warning':
      return theme.colors.statusWarning;
    case 'success':
      return theme.colors.statusSuccess;
    case 'secondary':
      return theme.colors.textSecondary;
    default:
      return theme.colors.textMuted;
  }
}

export function TicketDetailHeader({
  ticket,
  onBack,
  onAssignPress,
  onStatusPress,
  statusDisabled,
}: TicketDetailHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const { tone: statusTone } = statusStyle(ticket.status, theme);
  const rail = priorityColor(ticket.priority, theme);

  return (
    // Figma 91:896 closes the header with a `colors.border` bottom hairline.
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        <IconButton
          icon="arrowBack"
          size={36}
          variant="ghost"
          onPress={onBack}
          accessibilityLabel={t('ticketDetail.back')}
        />
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {ticket.reference}
        </Text>
      </View>

      <Text variant="heading" weight="semibold" style={{ letterSpacing: theme.tracking.tight }}>
        {ticket.subject}
      </Text>

      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        <View style={[styles.row, styles.metaGroup, { gap: theme.spacing.xs }]}>
          <View
            style={[
              styles.dot,
              { width: DOT_SIZE, height: DOT_SIZE, borderRadius: theme.radius.full, backgroundColor: toneColor(statusTone, theme) },
            ]}
          />
          <Text variant="caption" tone="muted">
            {t(`ticket.status.${ticket.status}`)}
          </Text>

          <View
            style={[
              styles.dot,
              { width: SEPARATOR_SIZE, height: SEPARATOR_SIZE, borderRadius: theme.radius.full, backgroundColor: theme.colors.borderDefault },
            ]}
          />

          <View style={{ borderStartWidth: 3, borderStartColor: rail, paddingStart: theme.spacing.xs }}>
            <Text variant="caption" tone="muted">
              {t(`ticket.priority.${ticket.priority}`)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onAssignPress}
          accessibilityRole="button"
          style={[
            styles.pill,
            {
              borderRadius: theme.radius.full,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.borderDefault,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
            },
          ]}
        >
          <Text variant="caption">{t('ticketDetail.assignAction')}</Text>
        </Pressable>

        <Pressable
          onPress={onStatusPress}
          disabled={statusDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: statusDisabled }}
          style={[
            styles.pill,
            {
              borderRadius: theme.radius.full,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.borderDefault,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xxs,
              opacity: statusDisabled ? theme.opacity.disabled : theme.opacity.full,
            },
          ]}
        >
          <Text variant="caption">{t('ticketDetail.statusAction')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  metaGroup: { flex: 1 },
  dot: {},
  pill: { alignItems: 'center', justifyContent: 'center' },
});
