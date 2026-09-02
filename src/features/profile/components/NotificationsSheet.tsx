import { StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet, RowGroup, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import type { NotificationPrefs } from '../notification-prefs';

export type NotificationsSheetProps = {
  visible: boolean;
  onClose: () => void;
  prefs: NotificationPrefs;
  onChange: (next: NotificationPrefs) => void;
};

const ROW_HEIGHT = 48;

/**
 * Plain rows rather than `SettingsRow` — a `Switch` trailing element isn't one
 * of `SettingsRow`'s three types. `Switch`'s platform defaults ignore the
 * palette entirely, so `trackColor`/`thumbColor` are driven from tokens.
 */
function NotificationRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          minHeight: ROW_HEIGHT,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.bgPrimary, false: theme.colors.borderDefault }}
        thumbColor={theme.colors.bgSurface}
      />
    </View>
  );
}

export function NotificationsSheet({
  visible,
  onClose,
  prefs,
  onChange,
}: NotificationsSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('profile.notifications.label')}>
      <RowGroup>
        <NotificationRow
          label={t('profile.notifications.push')}
          value={prefs.push}
          onValueChange={(push) => onChange({ ...prefs, push })}
        />
        <NotificationRow
          label={t('profile.notifications.email')}
          value={prefs.email}
          onValueChange={(email) => onChange({ ...prefs, email })}
        />
      </RowGroup>
      <Text
        variant="caption"
        tone="muted"
        style={{ marginTop: theme.spacing.md }}
      >
        {t('profile.notifications.pending')}
      </Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1 },
});
