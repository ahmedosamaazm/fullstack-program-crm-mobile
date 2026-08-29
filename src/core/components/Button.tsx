import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { IconButton } from './IconButton';
import type { IconName } from './Icon';
import { Text } from './Text';

type ButtonBase = {
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

type LabelVariant = 'primary' | 'secondary' | 'danger' | 'link';

type LabelButtonProps = ButtonBase & {
  variant: LabelVariant;
  label: string;
  onPress: () => void;
};

type IconVariant = 'icon' | 'iconTonal';

type IconButtonVariantProps = ButtonBase & {
  variant: IconVariant;
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
};

export type ButtonProps = LabelButtonProps | IconButtonVariantProps;

const HEIGHT = 56;

function isIconButtonVariant(props: ButtonProps): props is IconButtonVariantProps {
  return props.variant === 'icon' || props.variant === 'iconTonal';
}

/**
 * Discriminated on `variant`. `icon`/`iconTonal` delegate to `IconButton`
 * internally — plan §15 flag 5 notes the 32×32 `icon` variant sits 4px from
 * standalone `IconButton` (36×36); built as specified pending a design call.
 */
export function Button(props: ButtonProps) {
  const theme = useTheme();

  if (isIconButtonVariant(props)) {
    const { variant, icon, accessibilityLabel, onPress, disabled } = props;
    return (
      <IconButton
        icon={icon}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        variant={variant === 'iconTonal' ? 'subtle' : 'ghost'}
        size={variant === 'iconTonal' ? 36 : 32}
      />
    );
  }

  const { variant, label, onPress, disabled = false, loading = false, fullWidth = false } = props;
  const isDisabled = disabled || loading;

  if (variant === 'link') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        hitSlop={theme.spacing.xs}
        style={{ opacity: isDisabled ? theme.opacity.disabled : theme.opacity.full }}
      >
        <Text variant="callout" weight="semibold" tone="link">
          {label}
        </Text>
      </Pressable>
    );
  }

  const background = resolveBackground(variant, theme);
  const border = resolveBorder(variant, theme);
  const textTone = resolveTextTone(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.root,
        fullWidth ? styles.fullWidth : null,
        {
          height: HEIGHT,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.sm,
          backgroundColor: pressed ? background.pressed : background.idle,
          opacity: isDisabled ? theme.opacity.disabled : theme.opacity.full,
          ...border,
        } as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors[textTone === 'onPrimary' ? 'iconOnPrimary' : 'iconDefault']} />
      ) : (
        <Text variant="body" weight="semibold" tone={textTone}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function resolveBackground(variant: LabelVariant, theme: ReturnType<typeof useTheme>) {
  if (variant === 'primary') {
    return { idle: theme.colors.bgPrimary, pressed: theme.colors.bgPrimaryPressed };
  }
  if (variant === 'secondary') {
    return { idle: theme.colors.bgSurface, pressed: theme.colors.bgSurfaceSunken };
  }
  // danger — no fill.
  return { idle: 'transparent', pressed: theme.colors.bgDangerSubtle };
}

function resolveBorder(variant: LabelVariant, theme: ReturnType<typeof useTheme>): ViewStyle {
  if (variant === 'secondary') {
    return { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.borderDefault };
  }
  return {};
}

function resolveTextTone(variant: LabelVariant): 'onPrimary' | 'secondary' | 'danger' {
  if (variant === 'primary') return 'onPrimary';
  if (variant === 'secondary') return 'secondary';
  return 'danger';
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
});
