import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar, Icon, Skeleton, Text, tintForName } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

/**
 * `transient` — the fetch failed and retrying may work (network, 5xx).
 * `unavailable` — the query resolved with no row: RLS hid the profile, or it
 * does not exist. Retrying cannot help, so no retry is offered.
 *
 * Same distinction `CustomerDetailScreen.tsx:44-61` draws, and for the same
 * reason: a retry button on a request that can never succeed is worse than
 * saying plainly that the thing is not available.
 */
export type IdentityErrorKind = 'transient' | 'unavailable';

export type IdentityCardProps = {
  fullName?: string;
  departmentName?: string | null;
  branchName?: string | null;
  loading: boolean;
  error: IdentityErrorKind | null;
  /** Supplied only for a `transient` error. */
  onRetry?: () => void;
};

const AVATAR_SIZE = 40;
const CARD_HEIGHT = 84;

/**
 * `tint={tintForName(...)}` reuses story 05's per-customer avatar tinting
 * (`core/components/Avatar.tsx`) so the agent's own avatar matches the same
 * scheme the Customers rows use.
 */
export function IdentityCard({
  fullName,
  departmentName,
  branchName,
  loading,
  error,
  onRetry,
}: IdentityCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const subtitle = [departmentName, branchName].filter(Boolean).join(' · ');
  const displayName = fullName ?? '';

  return (
    <View
      style={[
        styles.root,
        {
          minHeight: CARD_HEIGHT,
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          // Figma binds e2 + e1 to this card; without it a white card on a
          // near-white canvas has no edge at all.
          ...theme.elevation.e2,
        },
      ]}
    >
      {loading ? (
        <>
          <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius={AVATAR_SIZE / 2} />
          <View style={[styles.body, { gap: theme.spacing.xs }]}>
            <Skeleton width="60%" height={18} />
            <Skeleton width="40%" height={14} />
          </View>
        </>
      ) : error ? (
        // Says plainly that the profile did not load, rather than falling back
        // to a generic greeting — a silent fallback is indistinguishable from a
        // signed-in agent whose name happens to be missing (TF-05, SCRUM-16).
        <>
          <View
            style={[
              styles.errorChip,
              {
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.bgSurfaceSunken,
              },
            ]}
          >
            <Icon name="alert" size={20} color={theme.colors.statusDanger} />
          </View>
          <View style={[styles.body, { minWidth: 0, gap: theme.spacing.xxs }]}>
            <Text variant="body" weight="semibold" numberOfLines={2}>
              {t(
                error === 'transient'
                  ? 'profile.identity.errorTransient'
                  : 'profile.identity.errorUnavailable',
              )}
            </Text>
            {onRetry ? (
              <Pressable onPress={onRetry} accessibilityRole="button">
                <Text variant="callout" weight="semibold" tone="link">
                  {t('common.retry')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : (
        <>
          <Avatar name={displayName} size={AVATAR_SIZE} tint={tintForName(displayName)} />
          <View style={[styles.body, { minWidth: 0 }]}>
            <Text variant="body" weight="semibold" numberOfLines={1}>
              {displayName}
            </Text>
            {subtitle ? (
              <Text variant="callout" tone="muted" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
  errorChip: { alignItems: 'center', justifyContent: 'center' },
});
