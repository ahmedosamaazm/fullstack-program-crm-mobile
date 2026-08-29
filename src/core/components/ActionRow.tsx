import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

export type ActionRowProps = {
  icon: IconName;
  title: string;
  description?: string;
  onPress: () => void;
  tone?: Extract<TextTone, 'primary' | 'danger' | 'info' | 'success' | 'warning'>;
  disabled?: boolean;
  divider?: boolean;
};

const ROW_HEIGHT = 64;
const CHIP_SIZE = 40;

export function ActionRow({
  icon,
  title,
  description,
  onPress,
  tone = 'primary',
  disabled = false,
  divider = false,
}: ActionRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.root,
        {
          minHeight: ROW_HEIGHT,
          gap: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.bgSurface,
          borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.borderSubtle,
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      <View
        style={[
          styles.chip,
          { width: CHIP_SIZE, height: CHIP_SIZE, borderRadius: theme.radius.md, backgroundColor: theme.colors.bgSurfaceSunken },
        ]}
      >
        <Icon name={icon} size={20} color={toneToIconColor(tone, theme)} />
      </View>
      <View style={styles.text}>
        <Text variant="callout" weight="semibold" tone={tone === 'primary' ? 'primary' : tone}>
          {title}
        </Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function toneToIconColor(tone: ActionRowProps['tone'], theme: ReturnType<typeof useTheme>): string {
  switch (tone) {
    case 'danger':
      return theme.colors.statusDanger;
    case 'success':
      return theme.colors.statusSuccess;
    case 'warning':
      return theme.colors.statusWarning;
    case 'info':
      return theme.colors.statusInfo;
    default:
      return theme.colors.iconDefault;
  }
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  chip: { alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, justifyContent: 'center' },
});
