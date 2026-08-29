import type { TextStyle } from 'react-native';

/** 7-step font-size scale. Figma names the extremes `2xs`/`2xl`; not valid JS
 * identifiers, so they become `xs2`/`xl2`. */
export const fontSize = {
  xs2: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xl2: 28,
} as const;

export const lineHeight = {
  xs2: 16,
  xs: 18,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 28,
  xl2: 34,
} as const;

export const tracking = {
  tight: -0.3,
  normal: 0,
  wide: 0.6,
} as const;

/**
 * Semantic weight names. Never assign these to a `fontWeight` style key next
 * to a custom `fontFamily` — Android does not synthesise weight for custom
 * families, so `resolveFontFace`/`resolveTextStyle` below are the only
 * sanctioned way to turn a weight into a style.
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontWeightToken = keyof typeof fontWeight;

/**
 * `@expo-google-fonts` export names, verbatim — these double as the
 * `Font.loadAsync()` keys in `fonts.ts`, so the family string is
 * byte-identical on every platform and no `Platform.select` is needed.
 */
export const fontFamily = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

/**
 * Makes the bad combination (custom `fontFamily` + `fontWeight`) unrepresentable
 * in the type system — the two keys are mutually exclusive.
 */
export type FontFace =
  | { fontFamily: string; fontWeight?: never }
  | { fontFamily?: never; fontWeight: (typeof fontWeight)[FontWeightToken] };

/**
 * Resolves a weight token to a concrete style fragment. Before the fonts have
 * loaded (or if they failed to), falls back to `fontWeight` against the
 * system font rather than pointing `fontFamily` at nothing.
 */
export function resolveFontFace(weight: FontWeightToken, fontsLoaded: boolean): FontFace {
  if (fontsLoaded) {
    return { fontFamily: fontFamily[weight] };
  }
  return { fontWeight: fontWeight[weight] };
}

/**
 * Three orthogonal axes — size/leading (`variant`), `weight`, and colour
 * (owned by `Text.tsx` via `tone`) — rather than a combined ramp. A `sm`
 * label appears at both Medium and SemiBold across Tab, ActionRow and
 * SettingsRow, so weight cannot be baked into the variant.
 */
export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'callout'
  | 'caption'
  | 'overline';

type VariantMetrics = { fontSize: number; lineHeight: number };

/** Maps 1:1 onto the seven `fontSize`/`lineHeight` steps. */
export const typography: Record<TextVariant, VariantMetrics> = {
  display: { fontSize: fontSize.xl2, lineHeight: lineHeight.xl2 },
  title: { fontSize: fontSize.xl, lineHeight: lineHeight.xl },
  heading: { fontSize: fontSize.lg, lineHeight: lineHeight.lg },
  body: { fontSize: fontSize.md, lineHeight: lineHeight.md },
  callout: { fontSize: fontSize.sm, lineHeight: lineHeight.sm },
  caption: { fontSize: fontSize.xs, lineHeight: lineHeight.xs },
  overline: { fontSize: fontSize.xs2, lineHeight: lineHeight.xs2 },
};

export function resolveTextStyle(
  variant: TextVariant,
  fontsLoaded: boolean,
  weightOverride?: FontWeightToken,
): TextStyle {
  const metrics = typography[variant];
  const weight = weightOverride ?? 'regular';

  return {
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight,
    ...resolveFontFace(weight, fontsLoaded),
  };
}
