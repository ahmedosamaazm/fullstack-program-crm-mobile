import { primitives } from './primitives';

/**
 * 35 semantic colour keys, resolved from Figma's `color/*` variable collection.
 * Deriving `ThemeColors` from `lightColors` means every key is written once —
 * `darkColors` gets both exhaustiveness (a missing key is a type error) and
 * excess-property checking (a typo'd key is a type error).
 */
export const lightColors = {
  bgCanvas: primitives.neutral50,
  bgSurface: primitives.neutral0,
  bgSurfaceRaised: primitives.neutral0,
  bgSurfaceSunken: primitives.neutral100,
  bgPrimary: primitives.blue500,
  bgPrimaryPressed: primitives.blue600,
  bgPrimarySubtle: primitives.bluePrimarySubtleLight,
  bgSuccessSubtle: primitives.greenSubtleLight,
  bgWarningSubtle: primitives.orangeSubtleLight,
  bgDangerSubtle: primitives.redSubtleLight,
  bgSkeleton: primitives.neutral200,
  bgSkeletonHighlight: primitives.neutral300,
  // Opaque per Figma — BottomSheet animates its own backdrop opacity rather
  // than baking alpha into the token (see ThemeProvider migration notes).
  bgOverlay: primitives.neutral900,

  borderSubtle: primitives.neutral200,
  borderDefault: primitives.neutral300,
  borderStrong: primitives.neutral400,
  borderFocus: primitives.blue500,
  borderInteractive: primitives.neutral500,

  textPrimary: primitives.neutral900,
  textSecondary: primitives.neutral700,
  textMuted: primitives.neutral550,
  textDisabled: primitives.neutral450,
  textInverse: primitives.neutral0,
  textLink: primitives.blue500,
  textOnPrimary: primitives.neutral0,
  textOnDanger: primitives.neutral0,

  statusInfo: primitives.blue500,
  statusSuccess: primitives.green500,
  statusWarning: primitives.orange700,
  statusDanger: primitives.red500,

  iconDefault: primitives.neutral500,
  iconStrong: primitives.neutral900,
  iconOnPrimary: primitives.neutral0,

  tabActive: primitives.blue500,
  tabInactive: primitives.neutral550,
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;
export type ColorToken = keyof ThemeColors;

export const darkColors: ThemeColors = {
  bgCanvas: primitives.neutral1000,
  bgSurface: primitives.neutral900,
  bgSurfaceRaised: primitives.neutral800,
  bgSurfaceSunken: primitives.neutral1000,
  bgPrimary: primitives.blueLight,
  bgPrimaryPressed: primitives.blue500,
  bgPrimarySubtle: primitives.bluePrimarySubtleDark,
  bgSuccessSubtle: primitives.greenSubtleDark,
  bgWarningSubtle: primitives.orangeSubtleDark,
  bgDangerSubtle: primitives.redSubtleDark,
  bgSkeleton: primitives.neutral800,
  bgSkeletonHighlight: primitives.neutral700,
  bgOverlay: primitives.black,

  borderSubtle: primitives.neutral800,
  borderDefault: primitives.neutral700,
  borderStrong: primitives.neutral600,
  borderFocus: primitives.blueLight,
  borderInteractive: primitives.neutral450,

  textPrimary: primitives.neutral50,
  textSecondary: primitives.neutral400,
  textMuted: primitives.neutral450,
  textDisabled: primitives.neutral500,
  textInverse: primitives.neutral900,
  textLink: primitives.blueLinkDark,
  textOnPrimary: primitives.neutral1000,
  textOnDanger: primitives.neutral1000,

  statusInfo: primitives.blueLight,
  statusSuccess: primitives.green400,
  statusWarning: primitives.orange300,
  statusDanger: primitives.red300,

  iconDefault: primitives.neutral400,
  iconStrong: primitives.neutral50,
  iconOnPrimary: primitives.neutral1000,

  tabActive: primitives.blueLight,
  tabInactive: primitives.neutral450,
};
