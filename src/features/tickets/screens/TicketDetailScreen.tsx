import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, SkeletonList, TabBar, Tab as TabItem } from '@/core/components';
import { useKeyboardInset, useLocalisedName } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';
import { useDepartmentAgents } from '@/features/auth';

import { allowedTransitions } from '../state-machine';
import type { MessageKind } from '../types';
import { AiSummaryBar } from '../components/AiSummaryBar';
import { AssignAgentSheet } from '../components/AssignAgentSheet';
import { ChangeStatusSheet } from '../components/ChangeStatusSheet';
import { ContactStrip } from '../components/ContactStrip';
import { HistoryRow } from '../components/HistoryRow';
import { MessageRow } from '../components/MessageRow';
import { ReplyComposer } from '../components/ReplyComposer';
import { TicketDetailHeader } from '../components/TicketDetailHeader';
import { useTicketDetail, useTicketEvents, useTicketMessages, usePostTicketMessage } from '../hooks';

export type TicketDetailScreenProps = { ticketId: string };

type ActiveTab = MessageKind | 'history';

export function TicketDetailScreen({ ticketId }: TicketDetailScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const nameOf = useLocalisedName();
  const keyboardInset = useKeyboardInset();

  const [tab, setTab] = useState<ActiveTab>('public');
  const [assignVisible, setAssignVisible] = useState(false);
  const [statusVisible, setStatusVisible] = useState(false);

  const detail = useTicketDetail(ticketId);
  const messages = useTicketMessages(ticketId, tab === 'history' ? 'public' : tab);
  const events = useTicketEvents(ticketId);
  const post = usePostTicketMessage(ticketId);

  // Gated on the History tab: the roster is only needed to name `assigned`
  // events, and an agent who opens a ticket to read the conversation should
  // not pay for a profiles query. `useDepartmentAgents` already caches under
  // `['agents', …]` with a 60s staleTime, so the Assign sheet and this tab
  // share one fetch.
  const agents = useDepartmentAgents(tab === 'history');

  const resolveAgentName = useCallback(
    (profileId: string) => agents.data?.find((a) => a.id === profileId)?.fullName ?? null,
    [agents.data],
  );

  const isError = detail.isError || detail.data === null;

  if (detail.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
        <View style={{ padding: theme.spacing.lg }}>
          <SkeletonList count={6} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !detail.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
        <ErrorState onRetry={() => detail.refetch()} />
      </SafeAreaView>
    );
  }

  const ticket = detail.data;
  const statusDisabled = allowedTransitions(ticket.status).length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
      {/* `paddingBottom` from a measured keyboard inset, NOT a
          `KeyboardAvoidingView` — see `useKeyboardInset`'s doc comment. Every
          `behavior` that component offers assumes the Android window shrinks
          for the keyboard, which stopped being true when Expo made edge-to-edge
          mandatory (SDK 54+), leaving `ReplyComposer` under the keyboard. */}
      <View style={{ flex: 1, paddingBottom: keyboardInset }}>
        <TicketDetailHeader
          ticket={ticket}
          onBack={() => router.back()}
          onAssignPress={() => setAssignVisible(true)}
          onStatusPress={() => setStatusVisible(true)}
          statusDisabled={statusDisabled}
        />

        {ticket.customer ? (
          <ContactStrip customer={ticket.customer} categoryName={nameOf(ticket.category)} />
        ) : null}

        <TabBar>
          <TabItem
            label={t('ticketDetail.tabs.conversation')}
            selected={tab === 'public'}
            onPress={() => setTab('public')}
          />
          <TabItem
            label={t('ticketDetail.tabs.internal')}
            selected={tab === 'internal'}
            onPress={() => setTab('internal')}
          />
          <TabItem
            label={t('ticketDetail.tabs.history')}
            selected={tab === 'history'}
            onPress={() => setTab('history')}
          />
        </TabBar>

        <AiSummaryBar />

        <View style={{ flex: 1 }}>
          {tab === 'history' ? (
            events.isPending ? (
              <SkeletonList count={4} />
            ) : events.isError ? (
              <ErrorState onRetry={() => events.refetch()} />
            ) : (events.data ?? []).length === 0 ? (
              <EmptyState icon="clock" title={t('ticketDetail.empty.history')} />
            ) : (
              <FlatList
                data={events.data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <HistoryRow event={item} resolveAgentName={resolveAgentName} />
                )}
              />
            )
          ) : messages.isPending ? (
            <SkeletonList count={4} />
          ) : messages.isError ? (
            <ErrorState onRetry={() => messages.refetch()} />
          ) : (messages.data ?? []).length === 0 ? (
            <EmptyState icon="message" title={t(`ticketDetail.empty.${tab}`)} />
          ) : (
            <FlatList
              data={messages.data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageRow message={item} />}
            />
          )}
        </View>

        {tab !== 'history' ? (
          <ReplyComposer
            onSend={(input) => post.mutate(input)}
            sending={post.isPending}
            error={post.isError ? t(errorMessageKey(post.error)) : undefined}
          />
        ) : null}
      </View>

      <AssignAgentSheet
        visible={assignVisible}
        onClose={() => setAssignVisible(false)}
        ticketId={ticketId}
        currentAssigneeId={ticket.assigneeId}
      />

      <ChangeStatusSheet
        visible={statusVisible}
        onClose={() => setStatusVisible(false)}
        ticketId={ticketId}
        currentStatus={ticket.status}
      />
    </SafeAreaView>
  );
}
