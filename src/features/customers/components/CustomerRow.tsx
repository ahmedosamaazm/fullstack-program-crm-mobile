import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Text, tintForName } from '@/core/components';
import { useTheme } from '@/core/lib/theme';
import { formatCount, isolateLtr } from '@/core/utils';

import type { CustomerListItem } from '../types';

export type CustomerRowProps = {
  customer: CustomerListItem;
  onPress: (id: string) => void;
  /** Omit on the last row of a section — the SectionHeader's rule takes over. */
  divider?: boolean;
};

const AVATAR_SIZE = 38; // Figma 7:1984 and siblings — off-scale, matched exactly.
const BADGE_SIZE = 18;

export function CustomerRow({ customer, onPress, divider = false }: CustomerRowProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const accessibilityLabel = t('customers.rowLabel', {
    name: customer.fullName,
    phone: customer.phone,
    count: customer.openTicketCount,
  });

  return (
    <Pressable
      onPress={() => onPress(customer.id)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        {
          // Figma 7:1983 and siblings paint the rows solid white while the
          // SectionHeader bands stay on canvas grey — that contrast is the whole
          // figure/ground read of this list. Unlike Home there is no white band
          // wrapper here, so the fill belongs on the row itself.
          backgroundColor: theme.colors.bgSurface,
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <Avatar name={customer.fullName} size={AVATAR_SIZE} tint={tintForName(customer.fullName)} />

      <View style={[styles.body, { minWidth: 0 }]}>
        <Text variant="body" weight="medium" numberOfLines={1}>
          {customer.fullName}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {isolateLtr(customer.phone)}
        </Text>
      </View>

      {customer.openTicketCount > 0 ? (
        <View style={[styles.trailing, { gap: theme.spacing.xs }]}>
          <View
            style={[
              styles.badge,
              {
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.bgPrimary,
              },
            ]}
          >
            <Text variant="overline" weight="semibold" tone="onPrimary">
              {formatCount(customer.openTicketCount)}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            {t('customers.openSuffix')}
          </Text>
        </View>
      ) : (
        <Text variant="caption" tone="muted">
          {t('customers.noOpenTickets')}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center' },
  badge: { alignItems: 'center', justifyContent: 'center' },
});
