import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, SectionList, View } from 'react-native';
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

import { CustomerRow } from '../components/CustomerRow';
import { groupCustomersAlpha } from '../grouping';
import {
  customerKeys,
  useCustomers,
  useCustomersCount,
  useRecentCustomersCount,
  useWithOpenTicketsCount,
} from '../hooks';
import type { CustomerFilter } from '../types';

const FILTERS: CustomerFilter[] = ['all', 'withOpenTickets', 'recent'];

function handleCustomerPress(id: string) {
  router.push({ pathname: '/customers/[id]', params: { id } });
}

export function CustomersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [query, setQuery] = useState('');
  const search = useDebounce(query, 300);

  const list = useCustomers(filter, search);
  const allCount = useCustomersCount();
  const withOpenTicketsCount = useWithOpenTicketsCount();
  const recentCount = useRecentCustomersCount();

  function countFor(target: CustomerFilter): number | undefined {
    if (target === 'all') return allCount.data;
    if (target === 'withOpenTickets') return withOpenTicketsCount.data;
    return recentCount.data;
  }

  const customers = useMemo(() => list.data?.pages.flat() ?? [], [list.data]);
  const sections = useMemo(() => groupCustomersAlpha(customers), [customers]);

  function handleRefresh() {
    // Resets to page 1 and refetches all three chip counts together.
    void queryClient.invalidateQueries({ queryKey: customerKeys.all });
  }

  function handleEndReached() {
    if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      {/* Static header — search and filters stay put while the results scroll. */}
      <ListScreenHeader
        title={t('customers.title')}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={t('customers.searchPlaceholder')}
        filters={
          <>
            {FILTERS.map((target) => (
              <FilterChip
                key={target}
                label={t(`customers.filters.${target}`)}
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
          <SkeletonList count={8} />
        </View>
      ) : list.isError ? (
        <ErrorState
          title={t('states.errorTitle')}
          body={t(errorMessageKey(list.error))}
          onRetry={() => list.refetch()}
        />
      ) : sections.length === 0 ? (
        search ? (
          <EmptyState icon="search" title={t('customers.empty.search', { query: search })} />
        ) : (
          <EmptyState icon="customers" title={t(`customers.empty.${filter}`)} />
        )
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <SectionHeader variant="rule" title={t(section.titleKey)} />
          )}
          renderItem={({ item, index, section }) => (
            <CustomerRow
              customer={item}
              onPress={handleCustomerPress}
              divider={index < section.data.length - 1}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={{ paddingVertical: theme.spacing.lg }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + theme.spacing.xxl }}
        />
      )}

      <FAB
        onPress={() => router.push('/customers/new')}
        accessibilityLabel={t('customers.newCustomer')}
        bottomOffset={theme.spacing.xxxl}
      />
    </SafeAreaView>
  );
}
