import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, Button, EmptyState, Text, TextArea } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';

import { TicketStatusChangedError } from '../api';
import { useChangeTicketStatus } from '../hooks';
import { allowedTransitions, requiresResolutionNote } from '../state-machine';
import type { TicketStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { StatusOption } from './StatusOption';

export type ChangeStatusSheetProps = {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  currentStatus: TicketStatus;
};

function statusErrorMessageKey(error: unknown): string {
  if (error instanceof TicketStatusChangedError) return 'ticketDetail.status.errors.changed';
  return errorMessageKey(error);
}

export function ChangeStatusSheet({ visible, onClose, ticketId, currentStatus }: ChangeStatusSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const options = useMemo(() => allowedTransitions(currentStatus), [currentStatus]);
  const [target, setTarget] = useState<TicketStatus | null>(null);
  const [note, setNote] = useState('');
  const change = useChangeTicketStatus(ticketId);

  // Reset selection and note whenever the sheet closes — otherwise reopening
  // after a cancelled resolve shows a stale note, or after a successful change
  // shows a target no longer reachable from the new status.
  useEffect(() => {
    if (!visible) {
      setTarget(null);
      setNote('');
    }
  }, [visible]);

  const noteRequired = target !== null && requiresResolutionNote(target);
  const canSubmit = target !== null && (!noteRequired || note.trim().length > 0);

  function handleSubmit() {
    if (!canSubmit || target === null) return;
    change.mutate(
      { to: target, expectedCurrentStatus: currentStatus, resolutionNote: note },
      { onSuccess: onClose },
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('ticketDetail.status.title')}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }]}>
        <Text variant="caption" tone="muted">
          {t('ticketDetail.status.current')}
        </Text>
        <StatusBadge status={currentStatus} />
      </View>

      {options.length === 0 ? (
        <EmptyState icon="lock" title={t('ticketDetail.status.terminal')} />
      ) : (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            {options.map((status) => (
              <StatusOption
                key={status}
                status={status}
                description={t(`ticketDetail.status.description.${status}`)}
                selected={target === status}
                onPress={setTarget}
                disabled={change.isPending}
              />
            ))}
          </View>

          {noteRequired ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <TextArea
                label={t('ticketDetail.status.noteLabel')}
                value={note}
                onChangeText={setNote}
                required
                placeholder={t('ticketDetail.status.notePlaceholder')}
                maxLength={500}
                showCounter
                disabled={change.isPending}
              />
            </View>
          ) : null}

          <View style={{ marginTop: theme.spacing.lg }}>
            <Button
              variant="primary"
              fullWidth
              label={t('ticketDetail.status.submit')}
              disabled={!canSubmit}
              loading={change.isPending}
              onPress={handleSubmit}
            />
          </View>

          {change.isError ? (
            <Text
              variant="caption"
              tone="danger"
              align="center"
              accessibilityLiveRegion="polite"
              style={{ marginTop: theme.spacing.sm }}
            >
              {t(statusErrorMessageKey(change.error))}
            </Text>
          ) : null}
        </>
      )}
    </BottomSheet>
  );
}
