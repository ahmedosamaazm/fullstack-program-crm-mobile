/**
 * The ONLY file in this codebase permitted to contain colour literals.
 * `colors.ts` aliases the 35 semantic keys onto these — everything else consumes
 * colour via `useTheme()`. Enforced by the `no-restricted-syntax` hex rule in
 * eslint.config.js.
 *
 * Values are read directly off the Figma file (`mdfP8RPdkUsKcJb0wFdkME`) — see
 * `.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md`.
 * Names follow the Figma neutral/status/brand grouping, not RN usage, so a
 * value can be traced back to its Figma path.
 */

export const primitives = {
  // Neutral ramp (light -> dark), as it appears across the resolved tokens.
  neutral0: '#ffffff',
  neutral50: '#f8f9fb',
  neutral100: '#f0f3f8',
  neutral200: '#e8ebf0',
  neutral300: '#e3e5ea',
  neutral400: '#c4c7cf',
  neutral450: '#9c9fa7',
  neutral500: '#74777f',
  neutral550: '#6b6e76',
  neutral600: '#5c5f67',
  neutral700: '#44474f',
  neutral800: '#2a2d35',
  neutral900: '#181c22',
  neutral1000: '#0c1014',
  black: '#000000',

  // Brand blue
  blue500: '#1a56db',
  blue600: '#1d4ed8',
  blueLight: '#4e80e8',
  blueLinkDark: '#8baee8',
  bluePrimarySubtleLight: '#f4f7ff',
  bluePrimarySubtleDark: '#071130',

  // Success
  green500: '#2e7d32',
  green400: '#6fd48a',
  greenSubtleLight: '#e8f5e9',
  greenSubtleDark: '#0c2e12',

  // Warning
  orange700: '#c2410c',
  orange300: '#ffb77c',
  orangeSubtleLight: '#fff4ec',
  orangeSubtleDark: '#7a3600',

  // Danger
  red500: '#ba1a1a',
  red300: '#ffb4ab',
  redSubtleLight: '#ffdad6',
  redSubtleDark: '#410002',
} as const;
