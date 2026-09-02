import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'azm.notifications.prefs';

export type NotificationPrefs = { push: boolean; email: boolean };

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { push: true, email: true };

function isNotificationPrefs(value: unknown): value is NotificationPrefs {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).push === 'boolean' &&
    typeof (value as Record<string, unknown>).email === 'boolean'
  );
}

/**
 * The `notifications` table now exists and the in-app centre reads it
 * (story 23, SCRUM-45) — but there is still no push/email SENDER, so this
 * pair of switches stores a preference nothing currently reads. Wrapped in
 * `try`/`catch` like `loadPersistedThemeMode`: a storage failure costs a
 * preference, never a crash.
 */
export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (!stored) return DEFAULT_NOTIFICATION_PREFS;
    const parsed: unknown = JSON.parse(stored);
    return isNotificationPrefs(parsed) ? parsed : DEFAULT_NOTIFICATION_PREFS;
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // A failed write only costs the preference on next launch.
  }
}
