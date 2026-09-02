import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/lib/theme';

import { StatCard } from './StatCard';

export type StatsRowProps = {
  myOpen: number | undefined;
  unassigned: number | undefined;
  resolvedToday: number | undefined;
};

export function StatsRow({ myOpen, unassigned, resolvedToday }: StatsRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    // marginTop here is the slot Figma (`7:68`) reserves beneath the greeting for
    // future SLA alerts — an explicit acceptance criterion (BRD US-020, row 4).
    // Do not remove this gap even though nothing fills it yet.
    <View
      style={[
        styles.root,
        { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg, gap: theme.spacing.sm },
      ]}
    >
      <StatCard icon="inbox" tone="info" value={myOpen} label={t('home.stats.myOpen')} />
      <StatCard icon="clock" tone="warning" value={unassigned} label={t('home.stats.unassigned')} />
      <StatCard icon="checkCircle" tone="success" value={resolvedToday} label={t('home.stats.resolvedToday')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row' },
});
