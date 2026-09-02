import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Text } from './Text';

export type ModalHeaderProps = {
  title: string;
  onCancel: () => void;
  cancelLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Swaps the action label for a spinner while the submit is in flight. */
  actionLoading?: boolean;
};

/**
 * Pad-y snapped to `spacing.sm` (8, top) / `spacing.md` (12, bottom) from
 * Figma's off-scale `6`/`12` — a documented 2px shift (plan audit findings).
 */
export function ModalHeader({
  title,
  onCancel,
  cancelLabel,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionLoading = false,
}: ModalHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.bgSurface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <Pressable onPress={onCancel} accessibilityRole="button" style={styles.side}>
        <Text variant="callout" weight="medium" tone="secondary">
          {cancelLabel ?? t('common.cancel')}
        </Text>
      </Pressable>

      <Text variant="body" weight="semibold" tone="primary" numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <Pressable
        onPress={onAction}
        disabled={!onAction || actionDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: !onAction || actionDisabled }}
        style={styles.side}
      >
        {actionLoading ? (
          <ActivityIndicator size="small" color={theme.colors.textLink} />
        ) : actionLabel ? (
          <Text variant="callout" weight="semibold" tone={actionDisabled ? 'disabled' : 'link'}>
            {actionLabel}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { minWidth: 44 },
  title: { flex: 1, textAlign: 'center' },
});
