import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FilterChip, Icon, Text, TextInput } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import type { MessageKind } from '../types';

export type ReplyComposerProps = {
  onSend: (input: { body: string; isInternal: boolean }) => void;
  sending: boolean;
  error?: string;
};

const SEND_BUTTON_SIZE = 40;

export function ReplyComposer({ onSend, sending, error }: ReplyComposerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mode, setMode] = useState<MessageKind>('public');
  const [body, setBody] = useState('');

  const canSend = body.trim().length > 0 && !sending;

  function handleSend() {
    if (!canSend) return;
    onSend({ body: body.trim(), isInternal: mode === 'internal' });
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
      <View style={[styles.chipRow, { gap: theme.spacing.sm }]}>
        <FilterChip
          label={t('ticketDetail.composer.public')}
          selected={mode === 'public'}
          onPress={() => setMode('public')}
        />
        <FilterChip
          label={t('ticketDetail.composer.internal')}
          selected={mode === 'internal'}
          onPress={() => setMode('internal')}
          icon="lock"
        />
      </View>

      <View style={[styles.inputRow, { gap: theme.spacing.sm }]}>
        <Pressable
          // TODO(SCRUM-?): ticket-message attachments — the Storage bucket
          // and its policies are live (`docs/phase1_backend_plan.md:93`) and
          // story 24 (SCRUM-26) already uses them for customer attachments.
          // This control is scoped out of that story, not blocked by it — a
          // ticket-message upload path is its own future story.
          disabled
          accessibilityRole="button"
          accessibilityLabel={t('ticketDetail.composer.attach')}
          style={[styles.attachButton, { opacity: theme.opacity.disabled }]}
        >
          <Icon name="paperclip" size={20} />
        </Pressable>

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('ticketDetail.composer.placeholder')}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bgSurfaceSunken,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderColor: mode === 'internal' ? theme.colors.borderInternal : 'transparent',
              borderWidth: mode === 'internal' ? 1 : 0,
            },
          ]}
        />

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('ticketDetail.composer.send')}
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
  chipRow: { flexDirection: 'row' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  attachButton: { alignItems: 'center', justifyContent: 'center', width: 36, height: 44 },
  input: { flex: 1, minHeight: 44, maxHeight: 100 },
  sendButton: { alignItems: 'center', justifyContent: 'center' },
});
