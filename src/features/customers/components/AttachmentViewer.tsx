import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, IconButton } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import { createAttachmentSignedUrl } from '../api';
import type { CustomerAttachment } from '../types';

export type AttachmentViewerProps = {
  attachment: CustomerAttachment | null;
  onClose: () => void;
};

/**
 * BRD `:589` — "a full-screen viewer opens". The URL is minted per-open and
 * NEVER stored in the query cache: `createAttachmentSignedUrl` expires in 60
 * seconds (`api.ts`), and a cache entry outliving its own contents would be a
 * blank viewer with no error.
 */
export function AttachmentViewer({ attachment, onClose }: AttachmentViewerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!attachment) {
      setUrl(null);
      setFailed(false);
      return;
    }
    let cancelled = false;
    void createAttachmentSignedUrl(attachment.storagePath).then((signed) => {
      if (cancelled) return;
      setUrl(signed);
      setFailed(signed === null);
    });
    return () => {
      cancelled = true;
    };
  }, [attachment]);

  return (
    <Modal
      visible={attachment !== null}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: theme.colors.bgOverlay }]}>
        <View
          style={[
            styles.closeRow,
            { top: insets.top + theme.spacing.sm, end: theme.spacing.lg },
          ]}
        >
          <IconButton
            icon="close"
            variant="subtle"
            onPress={onClose}
            accessibilityLabel={t('customerNotes.viewerClose')}
          />
        </View>

        {failed ? (
          <ErrorState title={t('customerNotes.viewerFailed')} />
        ) : url ? (
          <Image
            source={{ uri: url }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            onError={() => setFailed(true)}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeRow: { position: 'absolute', zIndex: 1 },
});
