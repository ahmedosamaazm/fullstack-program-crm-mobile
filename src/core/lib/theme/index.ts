/**
 * The only import surface for the theme layer — nothing outside `theme/`
 * should import a sibling module directly.
 */
export {
  ThemeProvider,
  ThemeScope,
  useTheme,
  loadPersistedThemeMode,
  type Theme,
  type ThemeMode,
  type ColorScheme,
} from './ThemeProvider';
export { lightColors, darkColors, type ThemeColors, type ColorToken } from './colors';
export { spacing, radius, opacity, hitSlop, type Spacing, type Radius, type Opacity } from './layout';
export {
  fontSize,
  lineHeight,
  tracking,
  fontWeight,
  fontFamily,
  typography,
  resolveFontFace,
  resolveTextStyle,
  type FontWeightToken,
  type FontFace,
  type TextVariant,
} from './typography';
export { lightElevation, darkElevation, type Elevation } from './elevation';
export { loadFonts, FONT_ASSETS } from './fonts';
