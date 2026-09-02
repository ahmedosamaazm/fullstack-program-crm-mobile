import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconButton, Skeleton, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatCount } from '@/core/utils';

export type HomeHeaderProps = {
  fullName: string | undefined;
  departmentName: string | null | undefined;
  branchName: string | null | undefined;
  loading: boolean;
  error: boolean;
  /** Unread alert count for the bell badge. `undefined` while the query is pending. */
  unreadCount: number | undefined;
  onNotificationsPress: () => void;
};

function greetingBucket(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function HomeHeader({
  fullName,
  departmentName,
  branchName,
  loading,
  error,
  unreadCount,
  onNotificationsPress,
}: HomeHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const subtitle = [departmentName, branchName].filter(Boolean).join(' · ');

  return (
    // `paddingTop` is the header's own breathing room BELOW the status-bar
    // inset, which its host adds separately (`HomeScreen`'s surface block).
    // Without it the greeting sits flush against the clock.
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          gap: theme.spacing.xxs,
        },
      ]}
    >
      <View style={styles.textColumn}>
        {loading ? (
          <Skeleton width="70%" height={28} />
        ) : (
          <Text variant="title" weight="semibold" numberOfLines={1}>
            {error || !fullName
              ? t('home.greeting.generic')
              : t(`home.greeting.${greetingBucket()}`, { name: firstNameOf(fullName) })}
          </Text>
        )}
        {!loading && !error && subtitle ? (
          <Text variant="callout" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View>
        <IconButton
          icon="bell"
          variant="subtle"
          accessibilityLabel={
            unreadCount && unreadCount > 0
              ? t('home.notificationsWithCount', { count: unreadCount })
              : t('home.notifications')
          }
          onPress={onNotificationsPress}
        />
        {unreadCount !== undefined && unreadCount > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.badge,
              {
                top: -theme.spacing.xxs,
                end: -theme.spacing.xxs,
                backgroundColor: theme.colors.bgPrimary,
                borderRadius: theme.radius.full,
                paddingHorizontal: theme.spacing.xxs,
                borderWidth: theme.spacing.xxs / 2,
                borderColor: theme.colors.bgSurface,
              },
            ]}
          >
            <Text variant="overline" weight="semibold" tone="onPrimary">
              {formatCount(unreadCount)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  textColumn: { flex: 1, minWidth: 0 },
  badge: {
    position: 'absolute',
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
