import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bgCanvas }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>
        <Text variant="body" tone="muted" align="center">
          {t('placeholder.screenBody')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
