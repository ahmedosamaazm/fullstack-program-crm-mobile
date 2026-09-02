import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';

/**
 * Restarts the JS runtime so a staged direction change takes effect.
 *
 * React Native latches `I18nManager.isRTL` at process start, and the native
 * layer — React Navigation's gesture/animation directions, `Modal`,
 * `TextInput`'s writing direction, `ScrollView`'s RTL content offset — reads
 * that latched value rather than the Yoga `direction` style `LocaleProvider`
 * drives. `applyDirection()` schedules the native flip; only a reload makes
 * those surfaces agree with it.
 *
 * `Updates.reloadAsync()` is unavailable in Expo Go and throws when the
 * updates module is disabled, so development goes through `DevSettings`.
 * Resolves false when neither path is available — the caller keeps the
 * "restart required" notice up rather than pretending the flip happened.
 */
export async function reloadApp(): Promise<boolean> {
  if (__DEV__) {
    try {
      DevSettings.reload();
      return true;
    } catch {
      return false;
    }
  }

  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
