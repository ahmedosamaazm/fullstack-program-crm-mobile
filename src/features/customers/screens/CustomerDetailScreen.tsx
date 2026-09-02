import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, SkeletonList, TabBar, Tab as TabItem } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import { CustomerDetailHeader } from '../components/CustomerDetailHeader';
import { CustomerInfoTab } from '../components/CustomerInfoTab';
import { CustomerNotesTab } from '../components/CustomerNotesTab';
import { CustomerTicketsTab, type TicketRowRenderer } from '../components/CustomerTicketsTab';
import { useCustomerDetail } from '../hooks';

export type CustomerDetailScreenProps = {
  customerId: string;
  /**
   * Forwarded to `CustomerTicketsTab`. The screen does not import the real
   * `TicketRow` itself — see `CustomerTicketsTab`'s own doc comment for why.
   */
  ticketRowComponent: TicketRowRenderer;
};

type ActiveTab = 'info' | 'tickets' | 'notes';

export function CustomerDetailScreen({ customerId, ticketRowComponent }: CustomerDetailScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [tab, setTab] = useState<ActiveTab>('info');
  const detail = useCustomerDetail(customerId);

  if (detail.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
        <View style={{ padding: theme.spacing.lg }}>
          <SkeletonList count={6} />
        </View>
      </SafeAreaView>
    );
  }

  // `data === null` is NOT a failure — RLS refusing a customer from another
  // branch and a deleted id both land here. Rendering a retry button for a
  // request that can never succeed is worse than saying so plainly.
  if (!detail.isError && !detail.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
        <ErrorState title={t('customerDetail.notFound')} />
      </SafeAreaView>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
        <ErrorState onRetry={() => detail.refetch()} />
      </SafeAreaView>
    );
  }

  const customer = detail.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgSurface }} edges={['top']}>
      <CustomerDetailHeader
        customer={customer}
        onBack={() => router.back()}
        onHistoryPress={() => setTab('tickets')}
        onEditPress={() =>
          router.push({ pathname: '/customers/edit/[id]', params: { id: customerId } })
        }
      />

      <View style={{ paddingTop: theme.spacing.md }}>
        <TabBar>
          <TabItem
            label={t('customerDetail.tabs.info')}
            selected={tab === 'info'}
            onPress={() => setTab('info')}
          />
          <TabItem
            label={t('customerDetail.tabs.tickets')}
            selected={tab === 'tickets'}
            onPress={() => setTab('tickets')}
          />
          <TabItem
            label={t('customerDetail.tabs.notes')}
            selected={tab === 'notes'}
            onPress={() => setTab('notes')}
          />
        </TabBar>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'info' ? (
          <CustomerInfoTab customer={customer} />
        ) : tab === 'tickets' ? (
          <CustomerTicketsTab customer={customer} TicketRowComponent={ticketRowComponent} />
        ) : (
          <CustomerNotesTab customerId={customerId} />
        )}
      </View>
    </SafeAreaView>
  );
}
