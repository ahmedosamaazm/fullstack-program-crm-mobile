import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, FAB, SectionHeader, SkeletonList, Text } from '@/core/components';
import { useLocalisedName } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';
import { useAgentProfile } from '@/features/auth';
import { notificationKeys, useUnreadNotificationCount } from '@/features/notifications';
import {
  TicketAlreadyClaimedError,
  ticketKeys,
  TicketRow,
  useClaimTicket,
  useMyOpenCount,
  useMyTickets,
  useResolvedTodayCount,
  useUnassignedCount,
  useUnassignedTickets,
  type TicketFilter,
} from '@/features/tickets';

import { HomeHeader } from '../components/HomeHeader';
import { StatsRow } from '../components/StatsRow';

const MINE_PREVIEW_LIMIT = 5;
const UNASSIGNED_PREVIEW_LIMIT = 3;

function handleTicketPress(id: string) {
  router.push({ pathname: '/tickets/[id]', params: { id } });
}

/**
 * `nonce` forces the Tickets screen's sync effect to re-run even when the
 * agent asks for the same filter twice in a row — see `TicketsScreenProps`.
 */
function openTicketsFiltered(filter: TicketFilter) {
  router.push({
    pathname: '/(tabs)/tickets',
    params: { filter, nonce: String(Date.now()) },
  });
}

function claimErrorMessageKey(error: unknown): string {
  if (error instanceof TicketAlreadyClaimedError) return 'home.claim.taken';
  return errorMessageKey(error);
}

export function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const nameOf = useLocalisedName();
  const queryClient = useQueryClient();
  // Applied by hand rather than through `SafeAreaView edges={['top']}`: that
  // paints the inset with the SCREEN's background, which put a grey
  // `bgCanvas` band behind the status bar above a white header. Padding the
  // surface block instead lets the header's own white run edge to edge under
  // the status bar, which is what Android's mandatory edge-to-edge (SDK 54+)
  // already assumes. `expo-status-bar` in SDK 57 has no `backgroundColor` or
  // `translucent` prop to do this with — the bar IS transparent; what shows
  // through it is whatever the app paints there.
  const insets = useSafeAreaInsets();

  const profile = useAgentProfile();
  const unread = useUnreadNotificationCount();
  const myOpenCount = useMyOpenCount();
  const unassignedCount = useUnassignedCount();
  const resolvedTodayCount = useResolvedTodayCount();
  // NO limit argument. `ticketKeys.list` puts `options.limit ?? null` in the
  // key (tickets/hooks.ts), so passing MINE_PREVIEW_LIMIT here would build a
  // SECOND cache entry and fire a SECOND request for a list the Tickets tab
  // already holds. Dropping it resolves to ['tickets','list','mine',<uid>,null,'']
  // — the same entry that screen reads. Sliced client-side below (story 15).
  const myTickets = useMyTickets();
  // Unassigned deliberately KEEPS its server-side limit — that list is the
  // whole department's backlog, not one agent's workload, and fetching all of
  // it to show three rows is a real cost the intake does not ask for.
  const unassignedTickets = useUnassignedTickets(UNASSIGNED_PREVIEW_LIMIT);
  const claim = useClaimTicket();

  const refreshing =
    myTickets.isRefetching ||
    unassignedTickets.isRefetching ||
    myOpenCount.isRefetching ||
    unassignedCount.isRefetching ||
    resolvedTodayCount.isRefetching;

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    // The badge has no other refresh path: query-client.ts sets
    // `refetchOnWindowFocus: false`, so returning to the app from a push
    // notification does not refetch it. Pull-to-refresh is it.
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }

  // Figma 7:78 / 7:217 — each ticket list is a white band on the grey canvas,
  // closed top and bottom by a hairline. The ROWS stay unfilled: the band is the
  // surface. Confirmed against the frame's bound variables, which carry
  // `color/white/solid` + `color/grey/93` at band level only.
  const bandStyle = {
    backgroundColor: theme.colors.bgSurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
    borderBottomColor: theme.colors.borderSubtle,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
      >
        {/* Figma 7:32 — greeting and stats are ONE white block on the canvas,
            closed by a bottom hairline. Rendered bare, both inherited bgCanvas,
            which is what flattened the top of this screen. */}
        <View
          style={{
            backgroundColor: theme.colors.bgSurface,
            paddingTop: insets.top,
            paddingBottom: theme.spacing.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.borderSubtle,
          }}
        >
          <HomeHeader
            fullName={profile.data?.fullName}
            departmentName={nameOf(profile.data?.department ?? null)}
            branchName={nameOf(profile.data?.branch ?? null)}
            loading={profile.isPending}
            error={profile.isError}
            unreadCount={unread.data}
            onNotificationsPress={() => router.push('/notifications')}
          />

          <StatsRow
            myOpen={myOpenCount.data}
            unassigned={unassignedCount.data}
            resolvedToday={resolvedTodayCount.data}
          />
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionHeader
            variant="link"
            title={t('home.sections.mine')}
            action={t('home.viewAll')}
            onActionPress={() => openTicketsFiltered('mine')}
          />
          {myTickets.isPending ? (
            <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
              <SkeletonList count={MINE_PREVIEW_LIMIT} />
            </View>
          ) : myTickets.isError ? (
            <ErrorState
              title={t('states.errorTitle')}
              body={t('states.errorBody')}
              onRetry={() => myTickets.refetch()}
            />
          ) : myTickets.data.length === 0 ? (
            <EmptyState title={t('home.empty.mine')} icon="inbox" />
          ) : (
            <View style={[bandStyle, { paddingHorizontal: theme.spacing.lg }]}>
              {myTickets.data.slice(0, MINE_PREVIEW_LIMIT).map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} onPress={handleTicketPress} />
              ))}
            </View>
          )}
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionHeader
            variant="link"
            title={t('home.sections.unassigned')}
            action={t('home.viewAll')}
            onActionPress={() => openTicketsFiltered('unassigned')}
          />
          {unassignedTickets.isPending ? (
            <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
              <SkeletonList count={UNASSIGNED_PREVIEW_LIMIT} />
            </View>
          ) : unassignedTickets.isError ? (
            <ErrorState
              title={t('states.errorTitle')}
              body={t('states.errorBody')}
              onRetry={() => unassignedTickets.refetch()}
            />
          ) : unassignedTickets.data.length === 0 ? (
            <EmptyState title={t('home.empty.unassigned')} icon="inbox" />
          ) : (
            <View style={[bandStyle, { paddingHorizontal: theme.spacing.lg }]}>
              {unassignedTickets.data.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  onPress={handleTicketPress}
                  onClaim={claim.mutate}
                  claiming={claim.isPending && claim.variables === ticket.id}
                />
              ))}
              {claim.isError ? (
                <Text
                  variant="caption"
                  tone="danger"
                  align="center"
                  accessibilityLiveRegion="polite"
                  style={{ marginTop: theme.spacing.sm }}
                >
                  {t(claimErrorMessageKey(claim.error))}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <FAB
        onPress={() => router.push('/tickets/new')}
        accessibilityLabel={t('ticket.new')}
      />
    </View>
  );
}
