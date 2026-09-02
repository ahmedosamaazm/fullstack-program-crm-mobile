import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, EmptyState, ErrorState, SearchField, SkeletonList, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';
import { useDepartmentAgents } from '@/features/auth';

import { TicketAssignmentChangedError } from '../api';
import { useAssignTicket } from '../hooks';
import { AgentRow } from './AgentRow';

export type AssignAgentSheetProps = {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  /** The current assignee's profile id — the compare-and-set guard. `null` when unassigned. */
  currentAssigneeId: string | null;
};

function assignErrorMessageKey(error: unknown): string {
  if (error instanceof TicketAssignmentChangedError) return 'ticketDetail.assign.changed';
  return errorMessageKey(error);
}

export function AssignAgentSheet({ visible, onClose, ticketId, currentAssigneeId }: AssignAgentSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Gated on `visible` — otherwise every ticket-detail open fetches the whole
  // department roster and its aggregates for a sheet nobody opened.
  const agents = useDepartmentAgents(visible);
  const assign = useAssignTicket();
  const [query, setQuery] = useState('');

  // Filtered client-side, deliberately: a department roster is tens of rows,
  // already in memory. Refetching profiles + aggregates per keystroke would be
  // strictly worse than an instant local filter, and nothing here reaches
  // PostgREST — no debounce, no `sanitizeSearchTerm` needed.
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return agents.data ?? [];
    return (agents.data ?? []).filter((agent) => agent.fullName.toLocaleLowerCase().includes(term));
  }, [agents.data, query]);

  function handleSelect(agentId: string) {
    if (agentId === currentAssigneeId) {
      onClose();
      return;
    }
    assign.mutate(
      { ticketId, assigneeId: agentId, expectedCurrentAssigneeId: currentAssigneeId },
      { onSuccess: onClose },
    );
  }

  function handleUnassign() {
    assign.mutate(
      { ticketId, assigneeId: null, expectedCurrentAssigneeId: currentAssigneeId },
      { onSuccess: onClose },
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('ticketDetail.assign.title')}>
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t('ticketDetail.assign.searchPlaceholder')}
        onClear={() => setQuery('')}
      />

      <View style={{ marginTop: theme.spacing.md, marginHorizontal: -theme.spacing.xl }}>
        {agents.isPending ? (
          <View style={{ paddingHorizontal: theme.spacing.xl }}>
            <SkeletonList count={5} />
          </View>
        ) : agents.isError ? (
          <ErrorState onRetry={() => agents.refetch()} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={query ? 'search' : 'user'}
            title={t(query ? 'ticketDetail.assign.empty.search' : 'ticketDetail.assign.empty.none', { query })}
          />
        ) : (
          <ScrollView style={styles.list}>
            {results.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                isCurrent={agent.id === currentAssigneeId}
                onPress={handleSelect}
                disabled={assign.isPending}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {currentAssigneeId !== null ? (
        <Pressable
          onPress={handleUnassign}
          disabled={assign.isPending}
          accessibilityRole="button"
          style={{ marginTop: theme.spacing.md, paddingVertical: theme.spacing.md, alignItems: 'center' }}
        >
          <Text variant="body" weight="semibold" tone="danger">
            {t('ticketDetail.assign.unassign')}
          </Text>
        </Pressable>
      ) : null}

      {assign.isError ? (
        <Text
          variant="caption"
          tone="danger"
          align="center"
          accessibilityLiveRegion="polite"
          style={{ marginTop: theme.spacing.sm }}
        >
          {t(assignErrorMessageKey(assign.error))}
        </Text>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 320 },
});
