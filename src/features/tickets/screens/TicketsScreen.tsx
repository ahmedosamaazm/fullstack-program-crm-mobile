import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  FAB,
  FilterChip,
  ListScreenHeader,
  SectionHeader,
  SkeletonList,
} from '@/core/components';
import { useDebounce } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';

import { TicketRow } from '../components/TicketRow';
import { groupTicketsByDay } from '../grouping';
import { ticketKeys, useAllTicketsCount, useMyTicketsCount, useTicketList, useUnassignedCount } from '../hooks';
import type { TicketFilter } from '../types';

const FILTERS: TicketFilter[] = ['mine', 'unassigned', 'all'];

export type TicketsScreenProps = {
  /** Raw route param — validated here, because `TicketFilter` is feature knowledge. */
  requestedFilter?: string;
  /**
   * Changes on every navigation, even when `requestedFilter` repeats. This
   * screen stays mounted as a tab, so a plain `useState` default only applies
   * on the very first visit — without this nonce, an agent who taps "View
   * all" (mine), switches the chip to All, goes Home and taps "View all"
   * again sends an unchanged `requestedFilter` and the sync effect below
   * never re-fires, leaving them stuck on All.
   */
  requestedFilterNonce?: string;
};

function isTicketFilter(value: string | undefined): value is TicketFilter {
  return value !== undefined && (FILTERS as string[]).includes(value);
}

function handleTicketPress(id: string) {
  router.push({ pathname: '/tickets/[id]', params: { id } });
}

export function TicketsScreen({ requestedFilter, requestedFilterNonce }: TicketsScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // The default for opening the tab directly from the tab bar. The effect
  // below is a no-op whenever no valid `requestedFilter` is present.
  const [filter, setFilter] = useState<TicketFilter>('mine');
  const [query, setQuery] = useState('');
  const search = useDebounce(query, 300);

  useEffect(() => {
    if (!isTicketFilter(requestedFilter)) return;
    setFilter(requestedFilter);
    // A stale search term would hide the very rows the agent asked to see.
    setQuery('');
    // `requestedFilterNonce` is deliberately in the deps though never read in
    // the body — it exists solely to force this effect to re-run when the
    // same filter is requested twice in a row (see the prop's own comment).
  }, [requestedFilter, requestedFilterNonce]);

  const list = useTicketList(filter, { search });
  const mineCount = useMyTicketsCount();
  const unassignedCount = useUnassignedCount();
  const allCount = useAllTicketsCount();

  function countFor(target: TicketFilter): number | undefined {
    if (target === 'mine') return mineCount.data;
    if (target === 'unassigned') return unassignedCount.data;
    return allCount.data;
  }

  const sections = useMemo(() => groupTicketsByDay(list.data ?? []), [list.data]);

  function handleRefresh() {
    // Same root as Home's refresh — list and all four count keys refetch together.
    void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      {/* Static header — search and filters stay put while the results scroll. */}
      <ListScreenHeader
        title={t('tickets.title')}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('tickets.searchPlaceholder')}
        filters={
          <>
            {FILTERS.map((target) => (
              <FilterChip
                key={target}
                label={t(`tickets.filters.${target}`)}
                selected={filter === target}
                onPress={() => setFilter(target)}
                // undefined while pending reads as "loading" — a literal 0 would not.
                count={countFor(target)}
              />
            ))}
          </>
        }
      />

      {list.isPending ? (
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <SkeletonList count={6} />
        </View>
      ) : list.isError ? (
        <ErrorState
          title={t('states.errorTitle')}
          body={t(errorMessageKey(list.error))}
          onRetry={() => list.refetch()}
        />
      ) : sections.length === 0 ? (
        search ? (
          <EmptyState icon="search" title={t('tickets.empty.search', { query: search })} />
        ) : (
          <EmptyState icon="inbox" title={t(`tickets.empty.${filter}`)} />
        )
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <SectionHeader variant="rule" title={t(section.titleKey) ?? section.titleKey} />
          )}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: theme.spacing.lg }}>
              <TicketRow ticket={item} onPress={handleTicketPress} />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={list.isRefetching} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + theme.spacing.xxl }}
        />
      )}

      <FAB
        onPress={() => router.push('/tickets/new')}
        accessibilityLabel={t('ticket.new')}
      />
    </SafeAreaView>
  );
}
