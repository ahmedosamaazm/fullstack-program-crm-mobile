import { useTranslation } from 'react-i18next';

import { ActionRow, BottomSheet } from '@/core/components';

export type UploadSource = 'camera' | 'gallery' | 'file';

export type UploadSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: UploadSource) => void;
};

/**
 * BRD `:587` — "camera, gallery and file options are offered". Three
 * `ActionRow`s in a `BottomSheet`; no new core component.
 *
 * `onClose()` fires before `onSelect()`: the picker presents its own native
 * modal, and opening it while this one is still mounted stacks two modals —
 * on iOS the second frequently never appears.
 */
export function UploadSourceSheet({ visible, onClose, onSelect }: UploadSourceSheetProps) {
  const { t } = useTranslation();

  function choose(source: UploadSource) {
    onClose();
    onSelect(source);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('customerNotes.upload.title')}>
      <ActionRow
        icon="camera"
        title={t('customerNotes.upload.camera')}
        description={t('customerNotes.upload.cameraHint')}
        divider
        onPress={() => choose('camera')}
      />
      <ActionRow
        icon="image"
        title={t('customerNotes.upload.gallery')}
        description={t('customerNotes.upload.galleryHint')}
        divider
        onPress={() => choose('gallery')}
      />
      <ActionRow
        icon="file"
        title={t('customerNotes.upload.file')}
        description={t('customerNotes.upload.fileHint')}
        onPress={() => choose('file')}
      />
    </BottomSheet>
  );
}
