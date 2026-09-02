import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatRelativeShort } from '@/core/utils';

import { priorityColor } from '../priority';
import type { TicketListItem } from '../types';
import { StatusBadge } from './StatusBadge';

export type TicketRowProps = {
  ticket: TicketListItem;
  onPress: (id: string) => void;
  /** Omit to render the row without a Claim button (the My tickets section). */
  onClaim?: (id: string) => void;
  claiming?: boolean;
};

export function TicketRow({ ticket, onPress, onClaim, claiming = false }: TicketRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const meta = [ticket.reference, ticket.customerName].filter(Boolean).join(' · ');
  const accessibilityLabel = t('ticket.rowLabel', {
    subject: ticket.subject,
    priority: t(`ticket.priority.${ticket.priority}`),
    status: t(`ticket.status.${ticket.status}`),
    age: formatRelativeShort(ticket.createdAt),
  });

  return (
    <Pressable
      onPress={() => onPress(ticket.id)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        {
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.rail,
          {
            borderRadius: theme.radius.full,
            backgroundColor: priorityColor(ticket.priority, theme),
          },
        ]}
      />

      <View style={[styles.body, { minWidth: 0 }]}>
        <View style={[styles.subjectLine, { gap: theme.spacing.xs }]}>
          {/* docs/phase1_brd_1.md:610 — priority needs a non-colour cue; the
              coloured bar alone fails for colour-blind users. `urgent` and
              `high` are the pair that collides: in dark, `statusDanger` and
              `statusWarning` have identical relative luminance (ratio 1.00),
              so rail and glyph are the same pale wash for both.
              They now differ by GLYPH — a triangle vs a circle — which survives
              greyscale (story 26, SCRUM-13). `medium` and `low` stay
              colour-only by design: neither collides with anything.
              Story 26 task 4c specified `alertCircle`; that name is not in
              `Icon.tsx`'s `IconName` union, so `info` is substituted per the
              plan's stated fallback — adding a glyph belongs to story 01. */}
          {ticket.priority === 'urgent' || ticket.priority === 'high' ? (
            <Icon
              name={ticket.priority === 'urgent' ? 'alert' : 'info'}
              size={12}
              color={priorityColor(ticket.priority, theme)}
            />
          ) : null}
          <Text variant="body" weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>
            {ticket.subject}
          </Text>
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <View style={[styles.trailing, { gap: theme.spacing.xs }]}>
        <Text variant="caption" tone="muted">
          {formatRelativeShort(ticket.createdAt)}
        </Text>
        <StatusBadge status={ticket.status} />
        {onClaim ? (
          <Pressable
            onPress={() => onClaim(ticket.id)}
            disabled={claiming}
            accessibilityRole="button"
            accessibilityLabel={t('home.claim.action')}
            style={[
              styles.claimButton,
              {
                backgroundColor: theme.colors.bgPrimary,
                borderRadius: theme.radius.full,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xxs,
                opacity: claiming ? theme.opacity.disabled : theme.opacity.full,
              },
            ]}
          >
            {claiming ? (
              <ActivityIndicator size="small" color={theme.colors.iconOnPrimary} />
            ) : (
              <Text variant="caption" weight="semibold" tone="onPrimary">
                {t('home.claim.action')}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  rail: { width: 3, alignSelf: 'stretch' },
  body: { flex: 1 },
  subjectLine: { flexDirection: 'row', alignItems: 'center' },
  trailing: { alignItems: 'flex-end' },
  claimButton: { minWidth: 56, alignItems: 'center', justifyContent: 'center' },
});
