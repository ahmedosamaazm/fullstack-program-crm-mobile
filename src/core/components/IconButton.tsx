import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';

export type IconButtonVariant = 'ghost' | 'subtle' | 'primary';

export type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  /** Icons carry no text — this is the only accessible label the control gets. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  selected?: boolean;
};

/** 36×36, `radius.full`. Ghost has no fill, Subtle sits on `bgSurfaceSunken`, Primary on `bgPrimary`. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'ghost',
  size = 36,
  disabled = false,
  selected = false,
}: IconButtonProps) {
  const theme = useTheme();

  const iconColor = variant === 'primary' ? theme.colors.iconOnPrimary : theme.colors.iconDefault;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      hitSlop={theme.spacing.xs}
      style={({ pressed }) => [
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: theme.radius.full,
          backgroundColor: resolveBackground(variant, selected, pressed, theme),
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
      ]}
    >
      <Icon name={icon} size={20} color={iconColor} />
    </Pressable>
  );
}

function resolveBackground(
  variant: IconButtonVariant,
  selected: boolean,
  pressed: boolean,
  theme: ReturnType<typeof useTheme>,
): string {
  if (variant === 'primary') {
    return pressed ? theme.colors.bgPrimaryPressed : theme.colors.bgPrimary;
  }
  if (variant === 'subtle' || selected) {
    return theme.colors.bgSurfaceSunken;
  }
  return pressed ? theme.colors.bgSurfaceSunken : 'transparent';
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
