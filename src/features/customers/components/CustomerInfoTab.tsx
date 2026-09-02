import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DetailRow, Text } from '@/core/components';
import { useLocalisedName } from '@/core/hooks';
import { useTheme } from '@/core/lib/theme';
import { formatDate, isolateLtr } from '@/core/utils';

import type { CustomerDetail, SecondaryContact } from '../types';

export type CustomerInfoTabProps = {
  customer: CustomerDetail;
};

/** The two schemes `Linking.openURL` is allowed to be handed. */
const LINKABLE_TYPES = new Set(['phone', 'email']);

function urlFor(contact: SecondaryContact): string | null {
  if (contact.type === 'phone') return `tel:${contact.value}`;
  if (contact.type === 'email') return `mailto:${contact.value}`;
  return null;
}

/**
 * A tappable value. `accessibilityLabel` names the ACTION, not just the value —
 * a screen reader announcing a bare phone number gives no clue it is a link.
 */
function LinkValue({
  label,
  url,
  children,
}: {
  label: string;
  url: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      {children}
    </Pressable>
  );
}

export function CustomerInfoTab({ customer }: CustomerInfoTabProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const nameOf = useLocalisedName();

  const divider = {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  };

  return (
    // Figma 7:3662 `InfoList` pads 16 on top and both sides over a SUNKEN body;
    // 91:812 `InfoCard` is the white surface the rows actually sit on. Without
    // the card the rows ran edge-to-edge on the same white as the header and the
    // tab lost its figure/ground entirely.
    <ScrollView
      style={{ backgroundColor: theme.colors.bgSurfaceSunken }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
    >
      <View
        style={{
          backgroundColor: theme.colors.bgSurface,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          ...theme.elevation.e2,
        }}
      >
        <View style={divider}>
          <DetailRow
            label={t('customerDetail.info.phone')}
            valueSlot={
              <LinkValue
                label={t('customerDetail.info.callLabel', { phone: customer.phone })}
                url={`tel:${customer.phone}`}
              >
                <Text variant="callout" tone="link">
                  {isolateLtr(customer.phone)}
                </Text>
              </LinkValue>
            }
          />
        </View>

        <View style={divider}>
          <DetailRow
            label={t('customerDetail.info.email')}
            valueSlot={
              customer.email ? (
                <LinkValue
                  label={t('customerDetail.info.emailLabel', { email: customer.email })}
                  url={`mailto:${customer.email}`}
                >
                  <Text variant="callout" tone="link">
                    {customer.email}
                  </Text>
                </LinkValue>
              ) : (
                <Text variant="callout" tone="muted">
                  {t('customerDetail.info.noEmail')}
                </Text>
              )
            }
          />
        </View>

        <View style={divider}>
          <DetailRow
            label={t('customerDetail.info.secondaryContacts')}
            layout="stacked"
            valueSlot={
              customer.secondaryContacts.length === 0 ? (
                <Text variant="callout" tone="muted">
                  {t('customerDetail.info.noSecondaryContacts')}
                </Text>
              ) : (
                <View style={{ gap: theme.spacing.sm }}>
                  {customer.secondaryContacts.map((contact, index) => {
                    const url = LINKABLE_TYPES.has(contact.type) ? urlFor(contact) : null;
                    const display =
                      contact.type === 'phone' ? isolateLtr(contact.value) : contact.value;

                    return (
                      <View key={`${contact.type}-${contact.value}-${index}`}>
                        <Text variant="caption" tone="muted">
                          {contact.label ?? t('customerDetail.info.contactFallbackLabel')}
                        </Text>
                        {url ? (
                          <LinkValue label={`${contact.label ?? ''} ${contact.value}`.trim()} url={url}>
                            <Text variant="callout" tone="link">
                              {display}
                            </Text>
                          </LinkValue>
                        ) : (
                          // An unrecognised scheme handed to `Linking.openURL`
                          // throws on iOS — render it as plain text instead.
                          <Text variant="callout">{display}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )
            }
          />
        </View>

        <View style={divider}>
          <DetailRow
            label={t('customerDetail.info.department')}
            value={nameOf(customer.department) ?? t('customerDetail.info.unknown')}
          />
        </View>

        <View style={divider}>
          <DetailRow
            label={t('customerDetail.info.branch')}
            value={nameOf(customer.branch) ?? t('customerDetail.info.unknown')}
          />
        </View>

          <DetailRow
            label={t('customerDetail.info.customerSince')}
            value={formatDate(customer.createdAt)}
          />
      </View>
    </ScrollView>
  );
}
