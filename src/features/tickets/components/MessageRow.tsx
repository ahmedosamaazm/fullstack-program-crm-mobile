import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatTime } from '@/core/utils';

import type { TicketMessage } from '../types';

export type MessageRowProps = { message: TicketMessage };

type RowKind = 'customer' | 'agent' | 'internal';

// `is_internal` wins over authorship: an internal note is an internal note
// regardless of who wrote it.
function rowKind(message: TicketMessage): RowKind {
  if (message.isInternal) return 'internal';
  return message.authorId === null ? 'customer' : 'agent';
}

export function MessageRow({ message }: MessageRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const kind = rowKind(message);
  const authorName = message.authorName ?? t('ticketDetail.event.system');
  const time = formatTime(message.createdAt);

  const rail =
    kind === 'internal' ? theme.colors.borderInternal : kind === 'agent' ? theme.colors.statusSuccess : theme.colors.statusInfo;
  const background = kind === 'internal' ? theme.colors.bgInternalSubtle : theme.colors.bgSurface;

  const accessibilityLabel =
    kind === 'internal'
      ? t('ticketDetail.message.labelInternal', { author: authorName, time })
      : t('ticketDetail.message.label', { author: authorName, time });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        {
          borderStartWidth: 3,
          borderStartColor: rail,
          backgroundColor: background,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.xs,
          // Figma 91:981 / 91:989 — each message row carries its own bottom
          // hairline; the thread FlatList supplies no separator.
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
        <Text variant="callout" weight="semibold" numberOfLines={1} style={styles.author}>
          {authorName}
        </Text>
        {kind === 'internal' ? (
          <View style={[styles.internalPill, { gap: theme.spacing.xxs }]}>
            <Icon name="lock" size={10} color={theme.colors.textInternal} />
            <Text variant="overline" tone="internal">
              {t('ticketDetail.internalBadge')}
            </Text>
          </View>
        ) : null}
        <Text variant="caption" tone="muted">
          {time}
        </Text>
      </View>
      <Text variant="callout">{message.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  author: { flex: 1 },
  internalPill: { flexDirection: 'row', alignItems: 'center' },
});
