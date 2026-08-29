import { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  type StyleProp,
  type TextInput as RNTextInputInstance,
  type TextInputProps as RNTextInputProps,
  type TextStyle,
} from 'react-native';

import { resolveTextStyle, useTheme, type FontWeightToken, type TextVariant } from '@/core/lib/theme';

export type TextInputProps = Omit<RNTextInputProps, 'style'> & {
  variant?: TextVariant;
  weight?: FontWeightToken;
  /** Same rationale as `Text` — never let a caller reach `fontFamily`/`fontWeight`. */
  style?: StyleProp<Omit<TextStyle, 'fontFamily' | 'fontWeight'>>;
};

/**
 * Mirrors `Text`'s single-font enforcement, and defaults
 * `placeholderTextColor` to `colors.textMuted` — an unstyled RN placeholder
 * is illegible in dark mode.
 */
export const TextInput = forwardRef<RNTextInputInstance, TextInputProps>(function TextInput(
  { variant = 'body', weight = 'regular', style, placeholderTextColor, ...rest },
  ref,
) {
  const theme = useTheme();
  const textStyle = resolveTextStyle(variant, theme.fontsLoaded, weight);

  return (
    <RNTextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? theme.colors.textMuted}
      {...rest}
      style={[{ ...textStyle, color: theme.colors.textPrimary }, style]}
    />
  );
});
