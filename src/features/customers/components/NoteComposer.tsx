import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text, TextInput } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

export type NoteComposerProps = {
  onSubmit: (body: string) => void;
  submitting: boolean;
  error?: string;
};

const SEND_BUTTON_SIZE = 40;

/**
 * `ReplyComposer` with the public/internal chips and the attachment paperclip
 * removed — a customer note has one kind, and the attachment control is the
 * `Dropzone` above the list rather than a button in here.
 *
 * Keeps three of `ReplyComposer`'s behaviours verbatim: the trimmed `canSend`
 * guard, clearing the field the moment it is submitted, and the send button
 * dropping to `opacity.disabled` when it cannot fire.
 */
export function NoteComposer({ onSubmit, submitting, error }: NoteComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [body, setBody] = useState('');

  const canSend = body.trim().length > 0 && !submitting;

  function handleSubmit() {
    if (!canSend) return;
    onSubmit(body.trim());
    setBody('');
  }

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.borderSubtle,
        backgroundColor: theme.colors.bgSurface,
      }}
    >
      <View style={[styles.inputRow, { gap: theme.spacing.sm }]}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('customerNotes.composerPlaceholder')}
          multiline
          editable={!submitting}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bgSurfaceSunken,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
            },
          ]}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('customerNotes.send')}
          style={[
            styles.sendButton,
            {
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.bgPrimary,
              opacity: canSend ? theme.opacity.full : theme.opacity.disabled,
            },
          ]}
        >
          <Icon name="send" size={18} color={theme.colors.iconOnPrimary} />
        </Pressable>
      </View>

      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, minHeight: 44, maxHeight: 100 },
  sendButton: { alignItems: 'center', justifyContent: 'center' },
});
