import { StyleSheet, View } from 'react-native';

import { Icon, Skeleton, Text, type IconName } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatNumber } from '@/core/utils';

export type StatCardProps = {
  icon: IconName;
  tone: 'info' | 'warning' | 'success';
  /** `undefined` renders a loading skeleton in place of the value. */
  value: number | undefined;
  label: string;
};

export function StatCard({ icon, tone, value, label }: StatCardProps) {
  const theme = useTheme();

  const chipBg =
    tone === 'info'
      ? theme.colors.bgPrimarySubtle
      : tone === 'warning'
        ? theme.colors.bgWarningSubtle
        : theme.colors.bgSuccessSubtle;
  const chipFg =
    tone === 'info' ? theme.colors.statusInfo : tone === 'warning' ? theme.colors.statusWarning : theme.colors.statusSuccess;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.bgSurface,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <View
        style={[
          styles.chip,
          { width: 32, height: 32, borderRadius: theme.radius.full, backgroundColor: chipBg },
        ]}
      >
        <Icon name={icon} size={18} color={chipFg} />
      </View>
      {value === undefined ? (
        <Skeleton width={32} height={24} />
      ) : (
        <Text variant="title" weight="bold" align="center">
          {formatNumber(value)}
        </Text>
      )}
      <Text variant="caption" tone="muted" align="center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  chip: { alignItems: 'center', justifyContent: 'center' },
});
