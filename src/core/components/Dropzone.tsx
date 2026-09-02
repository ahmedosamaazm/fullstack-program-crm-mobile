import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type DropzoneProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  hint?: string;
  disabled?: boolean;
  error?: string;
};

const HEIGHT = 68;

/**
 * `borderStyle: 'dashed'` combined with `borderRadius` renders solid on
 * Android — a long-standing RN issue (plan §15 flag 8). Accepted platform
 * difference rather than dropping to `radius.none`; verify on a real device.
 */
export function Dropzone({
  label,
  onPress,
  icon = 'paperclip',
  hint,
  disabled = false,
  error,
}: DropzoneProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedHint = hint ?? t('field.attach');

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={[
          styles.root,
          {
            minHeight: HEIGHT,
            gap: theme.spacing.xs,
            padding: theme.spacing.lg,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.bgSurface,
            borderColor: error ? theme.colors.statusDanger : theme.colors.borderInteractive,
            opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
          },
        ]}
      >
        <Icon name={icon} size={20} color={theme.colors.iconDefault} />
        <Text variant="callout" tone="muted">
          {label}
        </Text>
        <Text variant="caption" tone="muted">
          {resolvedHint}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
});
