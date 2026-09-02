import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatDate, formatFileSize, isolateLtr } from '@/core/utils';

import { isViewableImage } from '../api';
import type { CustomerAttachment } from '../types';

export type AttachmentRowProps = {
  attachment: CustomerAttachment;
  /** Only images are tappable — BRD `:589` promises a viewer for images alone. */
  onPress?: (attachment: CustomerAttachment) => void;
};

const CHIP_SIZE = 40;

export function AttachmentRow({ attachment, onPress }: AttachmentRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const viewable = isViewableImage(attachment.mimeType);
  const size = formatFileSize(attachment.sizeBytes);
  const uploadedByName = attachment.uploadedByName ?? t('ticketDetail.event.system');

  const accessibilityLabel = t(
    viewable ? 'customerNotes.imageRowLabel' : 'customerNotes.rowLabel',
    { name: attachment.fileName, size, author: uploadedByName },
  );

  const content = (
    <View style={[styles.root, { gap: theme.spacing.md, paddingVertical: theme.spacing.sm }]}>
      <View
        style={[
          styles.chip,
          {
            width: CHIP_SIZE,
            height: CHIP_SIZE,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.bgSurfaceSunken,
          },
        ]}
      >
        <Icon name={viewable ? 'image' : 'file'} size={20} color={theme.colors.iconDefault} />
      </View>
      <View style={[styles.body, { minWidth: 0 }]}>
        <Text variant="callout" weight="semibold" numberOfLines={1}>
          {isolateLtr(attachment.fileName)}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {isolateLtr(size)} · {formatDate(attachment.createdAt)} · {uploadedByName}
        </Text>
      </View>
    </View>
  );

  if (!viewable || !onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={{ paddingHorizontal: theme.spacing.lg }}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(attachment)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ paddingHorizontal: theme.spacing.lg }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  chip: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});
