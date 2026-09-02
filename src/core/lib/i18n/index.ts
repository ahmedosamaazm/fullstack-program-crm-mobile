import i18n from './config';

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isRtlLocale,
  directionOf,
  nativeDirection,
  resolveInitialLocale,
  applyDirection,
  initI18n,
  setLocale,
  currentLocale,
  type Locale,
  type Direction,
} from './config';

export { useDirection, DirectionScope } from './direction';
export { LocaleProvider, useLocale, type LocaleContextValue } from './locale-context';
export { reloadApp } from './reload';

export default i18n;
