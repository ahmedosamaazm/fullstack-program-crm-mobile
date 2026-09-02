import { Stack } from 'expo-router';

import { useTheme } from '@/core/lib/theme';

export default function AuthLayout() {
  const theme = useTheme();

  return (
    // Same reason as the root stack: without `contentStyle` React Navigation's
    // `DefaultTheme` paints white behind every transition (story 26, SCRUM-13).
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bgCanvas },
      }}
    />
  );
}
