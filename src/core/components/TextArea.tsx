import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/lib/theme';
import { formatNumber } from '@/core/utils';

import { Text } from './Text';
import { TextInput } from './TextInput';

export type TextAreaProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  showLabel?: boolean;
  placeholder?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  showCounter?: boolean;
};

const BOX_HEIGHT = 108;
/**
 * `textAlignVertical: 'top'` is Android-only; iOS needs explicit padding and
 * a zeroed top inset to anchor the value at the top of the box (plan §15
 * flag 9 — verify on real hardware, this looks fine in the simulator either way).
 */
const IOS_TOP_PADDING = 10;

export function TextArea({
  label,
  value,
  onChangeText,
  showLabel = true,
  placeholder,
  error,
  helper,
  disabled = false,
  required = false,
  maxLength,
  showCounter = false,
}: TextAreaProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const remaining = maxLength !== undefined ? maxLength - value.length : undefined;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {showLabel ? (
        <Text
          variant="caption"
          weight="semibold"
          tone="muted"
          style={[styles.label, { letterSpacing: theme.tracking.wide }]}
        >
          {label}
          {required ? ` * (${t('field.required')})` : ''}
        </Text>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        multiline
        maxLength={maxLength}
        accessibilityLabel={showLabel ? undefined : label}
        textAlignVertical={Platform.OS === 'android' ? 'top' : undefined}
        style={[
          styles.box,
          {
            height: BOX_HEIGHT,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            paddingTop: Platform.OS === 'ios' ? IOS_TOP_PADDING : theme.spacing.md,
            backgroundColor: theme.colors.bgSurface,
            borderColor: error ? theme.colors.statusDanger : theme.colors.borderInteractive,
            opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
          },
        ]}
      />

      <View style={styles.footer}>
        <Text variant="caption" tone={error ? 'danger' : 'muted'} style={styles.footerText}>
          {error ?? helper ?? ''}
        </Text>
        {showCounter && remaining !== undefined ? (
          <Text variant="caption" tone="muted">
            {t('field.charactersLeft', { count: remaining, formattedCount: formatNumber(remaining) })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase' },
  box: { borderWidth: StyleSheet.hairlineWidth },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  footerText: { flex: 1 },
});
