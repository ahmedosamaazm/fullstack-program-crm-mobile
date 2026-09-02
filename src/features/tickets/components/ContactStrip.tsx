import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, IconButton, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import type { TicketDetail } from '../types';

export type ContactStripProps = {
  customer: NonNullable<TicketDetail['customer']>;
  categoryName: string | null;
};

const AVATAR_SIZE = 40;

export function ContactStrip({ customer, categoryName }: ContactStripProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Filter before joining — a bare `undefined` segment (the `· undefined`
  // failure mode story 03 documented) would otherwise leak into the subtitle.
  const subtitle = [categoryName].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/customers/[id]', params: { id: customer.id } })}
      accessibilityRole="button"
      style={[
        styles.root,
        {
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <Avatar name={customer.fullName} size={AVATAR_SIZE} tint="info" />

      <View style={[styles.body, { minWidth: 0 }]}>
        <Text variant="callout" weight="medium" numberOfLines={1}>
          {customer.fullName}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.row, { gap: theme.spacing.xs }]}>
        <IconButton
          icon="phone"
          size={36}
          variant="ghost"
          onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
          accessibilityLabel={t('ticketDetail.call')}
        />
        <IconButton
          icon="mail"
          size={36}
          variant="ghost"
          disabled={!customer.email}
          onPress={() => void Linking.openURL(`mailto:${customer.email}`)}
          accessibilityLabel={t('ticketDetail.email')}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
