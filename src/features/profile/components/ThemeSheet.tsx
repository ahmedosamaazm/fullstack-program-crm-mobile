import { useTranslation } from 'react-i18next';

import { BottomSheet, RowGroup, SettingsRow } from '@/core/components';
import { useTheme, type ThemeMode } from '@/core/lib/theme';

export type ThemeSheetProps = { visible: boolean; onClose: () => void };

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

const LABEL_KEY: Record<ThemeMode, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

/**
 * `theme.setMode` re-renders every `useTheme` consumer synchronously
 * (`ThemeProvider.tsx`), so the sheet itself re-themes while still open —
 * intentional, not a flicker to fix.
 */
export function ThemeSheet({ visible, onClose }: ThemeSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('settings.theme')}>
      <RowGroup dividerInset="label">
        {MODES.map((mode) => (
          <SettingsRow
            key={mode}
            type="link"
            icon={mode === theme.mode ? 'check' : undefined}
            label={t(LABEL_KEY[mode])}
            onPress={() => {
              theme.setMode(mode);
              onClose();
            }}
          />
        ))}
      </RowGroup>
    </BottomSheet>
  );
}
