import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, View } from 'react-native';

import { Dropzone, ErrorState, SectionHeader, SkeletonList, Text } from '@/core/components';
import { useKeyboardInset } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey, formatFileSize } from '@/core/utils';
import { useAgentProfile } from '@/features/auth';

import {
  AttachmentTooLargeError,
  AttachmentTypeNotAllowedError,
  MAX_ATTACHMENT_BYTES,
} from '../api';
import {
  useCreateCustomerNote,
  useCustomerAttachments,
  useCustomerNotes,
  useUploadCustomerAttachment,
} from '../hooks';
import { pickDocument, pickFromCamera, pickFromGallery } from '../pick';
import type { CustomerAttachment, CustomerNote } from '../types';
import { AttachmentRow } from './AttachmentRow';
import { AttachmentViewer } from './AttachmentViewer';
import { NoteComposer } from './NoteComposer';
import { NoteRow } from './NoteRow';
import { UploadSourceSheet, type UploadSource } from './UploadSourceSheet';

export type CustomerNotesTabProps = { customerId: string };

type TabItem = CustomerAttachment | CustomerNote;
type TabSection = { key: 'attachments' | 'notes'; title: string; data: TabItem[] };

/** Structural narrowing — `fileName` exists on an attachment and on nothing else here. */
function isAttachment(item: TabItem): item is CustomerAttachment {
  return 'fileName' in item;
}

/**
 * BRD US-010 (SCRUM-26) — notes and attachments on one customer.
 *
 * This tab breaks `CustomerTicketsTab`'s rule on purpose: that component's "no
 * loading and no error branch here" comment is true because its data rides
 * inside the customer's own detail response (story 14). These two queries are
 * the tab's own — see `api.ts`'s comment on `fetchCustomerAttachments` for why
 * they are not embedded on `DETAIL_SELECT` — so the state ladder comes back.
 *
 * One `SectionList`, not two lists: nesting scrollables produces the
 * `VirtualizedLists should never be nested` warning and breaks momentum on
 * Android. The composer sits OUTSIDE the list as a sibling so the keyboard
 * does not push it through the content.
 */
export function CustomerNotesTab({ customerId }: CustomerNotesTabProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const keyboardInset = useKeyboardInset();

  const attachments = useCustomerAttachments(customerId);
  const notes = useCustomerNotes(customerId);
  const upload = useUploadCustomerAttachment(customerId);
  const createNote = useCreateCustomerNote(customerId);
  const profile = useAgentProfile();

  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState<CustomerAttachment | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | undefined>(undefined);

  async function handleSelectSource(source: UploadSource) {
    setUploadErrorMessage(undefined);
    const file =
      source === 'camera'
        ? await pickFromCamera()
        : source === 'gallery'
          ? await pickFromGallery()
          : await pickDocument();

    if (!file) return;

    try {
      await upload.mutateAsync(file);
    } catch (error) {
      if (error instanceof AttachmentTooLargeError) {
        setUploadErrorMessage(
          t('customerNotes.errors.tooLarge', {
            size: formatFileSize(error.sizeBytes),
            max: formatFileSize(MAX_ATTACHMENT_BYTES),
          }),
        );
      } else if (error instanceof AttachmentTypeNotAllowedError) {
        setUploadErrorMessage(t('customerNotes.errors.typeNotAllowed'));
      } else {
        setUploadErrorMessage(t(errorMessageKey(error)));
      }
    }
  }

  // One spinner and one error state for the tab, not one per query — two
  // independent spinners in a single tab is worse than one.
  if (attachments.isPending || notes.isPending) {
    return (
      <View style={{ padding: theme.spacing.lg }}>
        <SkeletonList count={4} />
      </View>
    );
  }

  if (attachments.isError || notes.isError) {
    return (
      <ErrorState
        title={t('states.errorTitle')}
        body={t(errorMessageKey(attachments.error ?? notes.error))}
        onRetry={() => {
          void attachments.refetch();
          void notes.refetch();
        }}
      />
    );
  }

  const attachmentData = attachments.data ?? [];
  const noteData = notes.data ?? [];

  const sections: TabSection[] = [
    // No empty state for this section — the Dropzone above already says what
    // to do; a second "no attachments yet" panel between the control and the
    // notes is noise. The whole section is omitted instead.
    ...(attachmentData.length > 0
      ? [
          {
            key: 'attachments' as const,
            title: t('customerNotes.attachmentsLabel'),
            data: attachmentData as TabItem[],
          },
        ]
      : []),
    { key: 'notes', title: t('customerNotes.notesLabel'), data: noteData },
  ];

  return (
    // `paddingBottom` from a measured keyboard inset, NOT a
    // `KeyboardAvoidingView`. See `useKeyboardInset`'s doc comment: every
    // `behavior` that component offers assumes the Android window shrinks for
    // the keyboard, which stopped being true when Expo made edge-to-edge
    // mandatory (SDK 54+), so the composer stayed under the keyboard.
    <View style={{ flex: 1, paddingBottom: keyboardInset }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: theme.colors.bgCanvas }}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.sm, padding: theme.spacing.lg }}>
            <Dropzone
              label={t('customerNotes.attach.label')}
              hint={t('customerNotes.attach.hint')}
              disabled={upload.isPending || !profile.isSuccess}
              error={uploadErrorMessage}
              onPress={() => setUploadSheetVisible(true)}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <SectionHeader variant="rule" title={section.title} />
        )}
        renderSectionFooter={({ section }) =>
          section.key === 'notes' && section.data.length === 0 ? (
            <View style={{ padding: theme.spacing.lg }}>
              <Text variant="callout" tone="muted" align="center">
                {t('customerNotes.empty')}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          isAttachment(item) ? (
            <AttachmentRow attachment={item} onPress={setViewerAttachment} />
          ) : (
            <NoteRow note={item} />
          )
        }
      />

      <NoteComposer
        onSubmit={(body) => createNote.mutate(body)}
        submitting={createNote.isPending}
        error={createNote.isError ? t(errorMessageKey(createNote.error)) : undefined}
      />

      <UploadSourceSheet
        visible={uploadSheetVisible}
        onClose={() => setUploadSheetVisible(false)}
        onSelect={handleSelectSource}
      />

      <AttachmentViewer attachment={viewerAttachment} onClose={() => setViewerAttachment(null)} />
    </View>
  );
}
