import {
  Text as RNText,
  type StyleProp,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useDirection } from '@/core/lib/i18n';
import { resolveTextStyle, useTheme, type ColorToken, type FontWeightToken, type TextVariant } from '@/core/lib/theme';

export type TextWeight = FontWeightToken;

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'inverse'
  | 'link'
  | 'onPrimary'
  | 'onDanger'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'internal';

const TONE_TOKEN: Record<TextTone, ColorToken> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  muted: 'textMuted',
  disabled: 'textDisabled',
  inverse: 'textInverse',
  link: 'textLink',
  onPrimary: 'textOnPrimary',
  onDanger: 'textOnDanger',
  success: 'statusSuccess',
  warning: 'statusWarning',
  danger: 'statusDanger',
  info: 'statusInfo',
  internal: 'textInternal',
};

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  align?: 'start' | 'center' | 'end';
  /**
   * `fontFamily`/`fontWeight` are omitted deliberately — this is the
   * compile-time defence against the Android weight-synthesis bug. Set
   * `weight` instead; it resolves to a family, never a style-level weight.
   */
  style?: StyleProp<Omit<TextStyle, 'fontFamily' | 'fontWeight'>>;
};

/**
 * The single sanctioned font primitive. `Text` is the one file in the repo
 * permitted to emit physical `left`/`right` (matching ESLint exemption in
 * eslint.config.js) — `align` takes logical `start`/`end` and resolves them
 * through `useDirection()`, since RN's `textAlign` has no logical values.
 *
 * Deliberately never sets `textAlign: 'auto'`, which follows the script of
 * the string rather than the layout — an English name inside an Arabic
 * screen would otherwise left-align.
 */
export function Text({ variant = 'body', weight = 'regular', tone = 'primary', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  const direction = useDirection();

  const textStyle = resolveTextStyle(variant, theme.fontsLoaded, weight);
  const color = theme.colors[TONE_TOKEN[tone]];

  const resolvedAlign =
    align === undefined
      ? undefined
      : align === 'center'
        ? 'center'
        : (align === 'start') === (direction === 'ltr')
          ? 'left'
          : 'right';

  return (
    <RNText
      {...rest}
      style={[{ ...textStyle, color }, resolvedAlign ? { textAlign: resolvedAlign } : null, style]}
    />
  );
}
