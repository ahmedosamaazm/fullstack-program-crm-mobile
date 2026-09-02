import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatDateTime } from '@/core/utils';

import type { CustomerNote } from '../types';

export type NoteRowProps = { note: CustomerNote };

/**
 * `MessageRow.tsx` minus the internal-note branch and minus the rail.
 *
 * Uses `formatDateTime`, NOT `formatTime` as `MessageRow` does. A ticket thread
 * is read in one sitting, so a bare "08:26" is unambiguous there; a note list
 * spans months, and "08:26" on a note from March is worse than no timestamp at
 * all. BRD `:586` asks for a timestamp, and this is the one that means something.
 */
export function NoteRow({ note }: NoteRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const authorName = note.authorName ?? t('ticketDetail.event.system');
  const time = formatDateTime(note.createdAt);

  return (
    <View
      accessibilityLabel={t('customerNotes.noteLabel', { author: authorName, time })}
      style={{
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.bgSurface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <View style={[styles.headerRow, { gap: theme.spacing.sm }]}>
        <Text variant="callout" weight="semibold" numberOfLines={1} style={styles.author}>
          {authorName}
        </Text>
        <Text variant="caption" tone="muted">
          {time}
        </Text>
      </View>
      <Text variant="callout">{note.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  author: { flex: 1 },
});
