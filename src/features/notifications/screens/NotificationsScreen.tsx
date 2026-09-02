import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, IconButton, SectionHeader, SkeletonList, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { errorMessageKey } from '@/core/utils';

import { groupNotificationsByRecency } from '../grouping';
import { notificationKeys, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks';
import type { NotificationItem } from '../types';
import { NotificationRow } from '../components/NotificationRow';

function handleBack() {
  router.back();
}

export function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const list = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = (list.data ?? []).filter((item) => !item.isRead).length;
  const sections = useMemo(() => groupNotificationsByRecency(list.data ?? []), [list.data]);

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }

  function handlePress(item: NotificationItem) {
    // Fire-and-forget, and navigate in the same tick. Awaiting the PATCH would
    // put a network round trip between the tap and the push animation, and
    // the ticket opening is the thing the agent asked for; the alert going
    // grey is bookkeeping.
    if (!item.isRead) markRead.mutate(item.id);
    // `ticket_id` is nullable — a row without one still marks read and simply
    // does not navigate; it must not push to `/tickets/undefined`.
    if (item.ticketId) router.push({ pathname: '/tickets/[id]', params: { id: item.ticketId } });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            backgroundColor: theme.colors.bgSurface,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.borderSubtle,
          },
        ]}
      >
        <View style={[styles.leading, { gap: theme.spacing.sm }]}>
          <IconButton icon="arrowBack" accessibilityLabel={t('common.back')} onPress={handleBack} />
          <Text variant="heading" weight="semibold">
            {t('notifications.title')}
          </Text>
        </View>

        <Pressable
          onPress={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: unreadCount === 0 || markAllRead.isPending }}
        >
          {markAllRead.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.textLink} />
          ) : (
            <Text
              variant="callout"
              weight="semibold"
              tone={unreadCount === 0 ? 'disabled' : 'link'}
            >
              {t('notifications.markAllRead')}
            </Text>
          )}
        </Pressable>
      </View>

      {list.isPending ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
          <SkeletonList count={6} />
        </View>
      ) : list.isError ? (
        <ErrorState
          title={t('states.errorTitle')}
          body={t(errorMessageKey(list.error))}
          onRetry={() => list.refetch()}
        />
      ) : sections.length === 0 ? (
        <EmptyState icon="bell" title={t('notifications.empty')} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <SectionHeader variant="rule" title={t(section.titleKey)} />
          )}
          renderItem={({ item }) => <NotificationRow item={item} onPress={handlePress} />}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: theme.colors.borderSubtle,
              }}
            />
          )}
          refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leading: { flexDirection: 'row', alignItems: 'center' },
});
