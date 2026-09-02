/**
 * The ONLY file in this codebase permitted to contain colour literals.
 * `colors.ts` aliases the 39 semantic keys onto these — everything else consumes
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
  /** Dark-mode pressed state for `bgPrimary`. On a dark ground a press must
   *  brighten, not darken: pointing dark `bgPrimaryPressed` at `blue500` put
   *  `textOnPrimary` (`neutral1000`) at 3.09:1, under AA. 7.57:1 here.
   *  Not a Figma value — derived by story 26 (SCRUM-13); see `npm run contrast`. */
  blueLighter: '#79a3f1',
  blueLinkDark: '#8baee8',
  bluePrimarySubtleLight: '#f4f7ff',
  bluePrimarySubtleDark: '#071130',
  /** The active-tab pill in Figma's `BottomNav` (node 49:134). Distinctly more
   *  saturated than `bluePrimarySubtleLight`, which is near-white and leaves the
   *  pill invisible. Figma specifies no dark-mode counterpart — see `colors.ts`. */
  blueTabPillLight: '#e3ebfb',

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

  // Internal notes — the only non-status use of a hue. Figma `palette.purple500`
  // / `palette.purple50` (node 91:989). No dark counterparts are specified in
  // the file; the two below follow the same derivation as the green/orange/red
  // Subtle-dark values — see story 07's open question 2.
  purple500: '#6750a4',
  purple300: '#c9b8ee',
  purpleSubtleLight: '#f3eef9',
  purpleSubtleDark: '#241a3d',
} as const;
