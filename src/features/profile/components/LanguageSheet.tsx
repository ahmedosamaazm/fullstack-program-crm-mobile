import { useTranslation } from 'react-i18next';

import { BottomSheet, RowGroup, SettingsRow, Text } from '@/core/components';
import { useLocale, type Locale } from '@/core/lib/i18n';
import { useTheme } from '@/core/lib/theme';

export type LanguageSheetProps = { visible: boolean; onClose: () => void };

const LOCALES: Locale[] = ['ar', 'en'];

const LABEL_KEY: Record<Locale, string> = {
  ar: 'settings.languageArabic',
  en: 'settings.languageEnglish',
};

/**
 * Closes on success — `changeLocale` mirrors the layout in-frame and reloads to
 * bring the native layer with it, so there is nothing left for the agent to do.
 * It stays open only when the reload could not run (Expo Go, or `expo-updates`
 * disabled), where the notice below is the one remaining instruction.
 */
export function LanguageSheet({ visible, onClose }: LanguageSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locale: current, restartPending, changeLocale } = useLocale();

  async function handleSelect(locale: Locale) {
    if (locale === current) return;
    if (await changeLocale(locale)) onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('settings.language')}>
      <RowGroup dividerInset="label">
        {LOCALES.map((locale) => (
          <SettingsRow
            key={locale}
            type="link"
            icon={locale === current ? 'check' : undefined}
            label={t(LABEL_KEY[locale])}
            onPress={() => void handleSelect(locale)}
          />
        ))}
      </RowGroup>
      {restartPending ? (
        <Text
          variant="caption"
          tone="muted"
          align="center"
          style={{ marginTop: theme.spacing.md }}
        >
          {t('settings.restartRequired')}
        </Text>
      ) : null}
    </BottomSheet>
  );
}
