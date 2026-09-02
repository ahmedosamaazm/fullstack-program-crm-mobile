import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { Avatar, IconButton, Text, tintForName } from '@/core/components';
import { useLocalisedName } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';

import type { CustomerDetail } from '../types';

export type CustomerDetailHeaderProps = {
  customer: CustomerDetail;
  onBack: () => void;
  onHistoryPress: () => void;
  onEditPress: () => void;
};

const AVATAR_SIZE = 44; // Figma 67:618 — off-scale, matched exactly.
const ACTION_SIZE = 36; // Figma 91:1045 / 91:1049 / 91:1053.
const BACK_SIZE = 32; // Figma 91:1040.

export function CustomerDetailHeader({
  customer,
  onBack,
  onHistoryPress,
  onEditPress,
}: CustomerDetailHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const nameOf = useLocalisedName();

  // Filter before joining — a bare `undefined` segment would otherwise leak a
  // `· undefined` into the subtitle (the same guard `ContactStrip` carries).
  const org = [nameOf(customer.department), nameOf(customer.branch)]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.bgSurface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.borderSubtle,
      }}
    >
      <View style={[styles.row, { gap: theme.spacing.sm }]}>
        <IconButton
          icon="arrowBack"
          size={BACK_SIZE}
          variant="ghost"
          onPress={onBack}
          accessibilityLabel={t('common.back')}
        />
        <Text variant="title" weight="semibold" numberOfLines={1}>
          {t('customerDetail.title')}
        </Text>
      </View>

      <View style={[styles.row, { gap: theme.spacing.md, paddingTop: theme.spacing.md }]}>
        <Avatar
          name={customer.fullName}
          size={AVATAR_SIZE}
          tint={tintForName(customer.fullName)}
        />

        {/* `minWidth: 0` is not optional — without it a long name pushes the
            three action buttons off the trailing edge instead of ellipsising. */}
        <View style={[styles.body, { minWidth: 0 }]}>
          <Text variant="body" weight="semibold" numberOfLines={1}>
            {customer.fullName}
          </Text>
          {org ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {org}
            </Text>
          ) : null}
        </View>

        <View style={[styles.row, { gap: theme.spacing.sm }]}>
          <IconButton
            icon="phone"
            size={ACTION_SIZE}
            variant="ghost"
            onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
            accessibilityLabel={t('customerDetail.call')}
          />
          <IconButton
            icon="mail"
            size={ACTION_SIZE}
            variant="ghost"
            disabled={!customer.email}
            onPress={() => void Linking.openURL(`mailto:${customer.email}`)}
            accessibilityLabel={t('customerDetail.email')}
          />
          <IconButton
            icon="clock"
            size={ACTION_SIZE}
            variant="ghost"
            onPress={onHistoryPress}
            accessibilityLabel={t('customerDetail.history')}
          />
          {/* Not in Figma — the file has no Edit affordance at all.
              Story 12 open question 1. */}
          <IconButton
            icon="edit"
            size={ACTION_SIZE}
            variant="ghost"
            onPress={onEditPress}
            accessibilityLabel={t('editCustomer.action')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
});
