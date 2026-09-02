import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

const BAR_HEIGHT = 40;

/**
 * BRD `:650` asks only for a reserved, collapsible slot — there is no AI
 * backend in phase 1. Collapsed by default; expanding shows the "not
 * available yet" placeholder honestly rather than fabricating a summary.
 */
export function AiSummaryBar() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    // Figma 91:947 closes the bar with a `colors.border` bottom hairline.
    <View
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <Pressable
        onPress={() => setExpanded((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={[
          styles.bar,
          {
            height: BAR_HEIGHT,
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Icon name="sparkle" size={16} color={theme.colors.statusInfo} />
        <Text variant="callout" weight="medium" style={styles.label}>
          {t('ticketDetail.aiSummary')}
        </Text>
        <View style={expanded ? styles.chevronExpanded : undefined}>
          <Icon name="chevronDown" size={16} />
        </View>
      </Pressable>
      {expanded ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
          <Text variant="caption" tone="muted">
            {t('ticketDetail.aiSummaryPending')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1 },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
});
