import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useLocale, type Locale } from '@/core/lib/i18n';
import { useTheme } from '@/core/lib/theme';

import { SegmentedControl } from './SegmentedControl';
import { Text } from './Text';

/**
 * Wraps `SegmentedControl` with the two supported locales. `changeLocale` flips
 * the layout in-frame and reloads to bring the native layer with it, so the
 * notice below is the *failure* path only — a reload that could not run.
 * Domain-free — reused by the login footer and by Profile.
 */
export function LanguageToggle() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { locale: current, restartPending, changeLocale } = useLocale();

  function handleChange(next: Locale) {
    void changeLocale(next);
  }

  return (
    // `SegmentedControl`'s segments are `flex: 1` inside a row, which only
    // resolves correctly against a parent with a definite width — a
    // shrink-to-content wrapper (e.g. `alignSelf: 'center'` with no width)
    // leaves Yoga nothing to distribute and the segments collapse too narrow
    // to fit "English"/"Arabic". Give it an explicit width instead; the
    // parent (`LoginScreen`'s footer) centers it via `alignItems: 'center'`.
    <View style={{ width: 200, gap: theme.spacing.sm }}>
      <SegmentedControl
        segments={[
          { value: 'en' as const, label: t('settings.languageEnglish') },
          { value: 'ar' as const, label: t('settings.languageArabic') },
        ]}
        value={current}
        onChange={handleChange}
      />
      {restartPending ? (
        <Text variant="caption" tone="muted" align="center">
          {t('settings.restartRequired')}
        </Text>
      ) : null}
    </View>
  );
}
