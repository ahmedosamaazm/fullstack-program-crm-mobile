import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet, Button, RowGroup, SectionHeader, SettingsRow, Text } from '@/core/components';
import { useLocalisedName } from '@/core/hooks';
import { useLocale } from '@/core/lib/i18n';
import { useTheme, type ThemeMode } from '@/core/lib/theme';
import { errorMessageKey, isAppError } from '@/core/utils';
import { useAgentProfile, useAuth } from '@/features/auth';

import { IdentityCard, type IdentityErrorKind } from '../components/IdentityCard';
import { LanguageSheet } from '../components/LanguageSheet';
import { NotificationsSheet } from '../components/NotificationsSheet';
import { ThemeSheet } from '../components/ThemeSheet';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../notification-prefs';

type SheetKey = 'language' | 'theme' | 'notifications' | 'signOut';

const THEME_VALUE_KEY: Record<ThemeMode, string> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

const LANGUAGE_VALUE_KEY = {
  ar: 'settings.languageArabic',
  en: 'settings.languageEnglish',
} as const;

function notificationsValue(prefs: NotificationPrefs, t: (key: string) => string): string {
  const enabled = [
    prefs.push ? t('profile.notifications.push') : null,
    prefs.email ? t('profile.notifications.email') : null,
  ].filter((label): label is string => label !== null);
  return enabled.length > 0 ? enabled.join(', ') : t('profile.notifications.none');
}

export function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { locale, restartPending } = useLocale();
  const nameOf = useLocalisedName();
  const profile = useAgentProfile();
  const { signOut } = useAuth();

  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [signOutError, setSignOutError] = useState<unknown>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    void loadNotificationPrefs().then(setPrefs);
  }, []);

  function closeSheet() {
    setSheet(null);
  }

  function handleNotificationPrefsChange(next: NotificationPrefs) {
    setPrefs(next);
    void saveNotificationPrefs(next);
  }

  async function handleConfirmSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      // No navigation call on success — `useAuth().status` flips to
      // `signedOut` and `Stack.Protected` swaps the stack on its own. The
      // sheet is only left open on the throw path below.
    } catch (error) {
      setSignOutError(error);
    } finally {
      setSigningOut(false);
    }
  }

  const version = Constants.expoConfig?.version ?? '—';
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString();
  const appInfoValue = build
    ? t('profile.appVersionBuild', { version, build })
    : t('profile.appVersion', { version });

  // Two distinct failures, deliberately not collapsed into one boolean:
  // `isError` is a fetch that failed and may succeed on retry, while a
  // resolved-but-missing profile (RLS-hidden row, or none) is permanent and
  // retrying it can only fail again. Same split `CustomerDetailScreen.tsx:44-61`
  // draws. The card offers Retry for the first and not the second.
  //
  // Neither takes the whole screen: language, theme, notifications, app info
  // and sign-out all work without a profile, and an `ErrorState` over the lot
  // would lock the agent out of signing out — the one thing they may most need
  // when their session is misbehaving.
  const identityError: IdentityErrorKind | null = profile.isError
    ? 'transient'
    : !profile.data && !profile.isPending
      ? 'unavailable'
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        <View style={{ paddingVertical: theme.spacing.lg }}>
          <Text variant="title" weight="semibold">
            {t('profile.title')}
          </Text>
        </View>

        <IdentityCard
          fullName={profile.data?.fullName}
          departmentName={nameOf(profile.data?.department ?? null)}
          branchName={nameOf(profile.data?.branch ?? null)}
          loading={profile.isPending}
          error={identityError}
          onRetry={identityError === 'transient' ? () => void profile.refetch() : undefined}
        />

        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionHeader title={t('profile.sections.settings')} />
          <RowGroup dividerInset="label">
            <SettingsRow
              type="link"
              icon="globe"
              label={t('settings.language')}
              value={t(LANGUAGE_VALUE_KEY[locale])}
              onPress={() => setSheet('language')}
            />
            <SettingsRow
              type="link"
              icon="theme"
              label={t('settings.theme')}
              value={t(THEME_VALUE_KEY[theme.mode])}
              onPress={() => setSheet('theme')}
            />
            <SettingsRow
              type="link"
              icon="bell"
              label={t('profile.notifications.label')}
              value={notificationsValue(prefs, t)}
              onPress={() => setSheet('notifications')}
            />
          </RowGroup>
          {restartPending ? (
            <Text
              variant="caption"
              tone="muted"
              align="center"
              style={{ marginTop: theme.spacing.sm }}
            >
              {t('settings.restartRequired')}
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionHeader title={t('profile.sections.account')} />
          <RowGroup>
            <SettingsRow
              type="static"
              icon="info"
              label={t('profile.appInformation')}
              value={appInfoValue}
            />
          </RowGroup>
        </View>

        <View style={{ marginTop: theme.spacing.xl }}>
          <RowGroup>
            <SettingsRow
              type="destructive"
              icon="signOut"
              label={t('profile.signOut')}
              onPress={() => setSheet('signOut')}
            />
          </RowGroup>
        </View>
      </ScrollView>

      {/* Rendered unconditionally — BottomSheet runs its close animation
          before calling onClose; unmounting on the state change would cut
          that animation off mid-flight. */}
      <LanguageSheet visible={sheet === 'language'} onClose={closeSheet} />
      <ThemeSheet visible={sheet === 'theme'} onClose={closeSheet} />
      <NotificationsSheet
        visible={sheet === 'notifications'}
        onClose={closeSheet}
        prefs={prefs}
        onChange={handleNotificationPrefsChange}
      />
      <BottomSheet
        visible={sheet === 'signOut'}
        onClose={closeSheet}
        title={t('profile.signOutConfirm.title')}
      >
        <Text variant="callout" tone="muted">
          {t('profile.signOutConfirm.body')}
        </Text>
        {signOutError ? (
          <Text
            variant="caption"
            tone="danger"
            accessibilityLiveRegion="polite"
            style={{ marginTop: theme.spacing.sm }}
          >
            {t(isAppError(signOutError) ? errorMessageKey(signOutError) : 'states.errorBody')}
          </Text>
        ) : null}
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Button
            variant="danger"
            label={t('profile.signOutConfirm.confirm')}
            loading={signingOut}
            onPress={() => void handleConfirmSignOut()}
          />
          <Button variant="secondary" label={t('common.cancel')} onPress={closeSheet} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
