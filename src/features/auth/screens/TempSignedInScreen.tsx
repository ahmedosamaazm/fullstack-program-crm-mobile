import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

import { useAuth } from '../session-context';

/**
 * TEMP — stands in for `src/app/index.tsx` until the Home feature exists.
 * Exists only so sign-out (and re-login for the deactivated-account check)
 * can be exercised manually. Delete this file and the barrel export once
 * Home ships.
 */
export function TempSignedInScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg }}>
        <Text variant="title" weight="bold">
          AZM
        </Text>
        <Button variant="secondary" label="Sign out (temp)" onPress={() => void signOut()} />
      </View>
    </SafeAreaView>
  );
}
