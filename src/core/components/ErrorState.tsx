import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

type ErrorStateProps = {
  title?: string;
  body?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, body, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { padding: theme.spacing.xl }]}>
      <Icon name="alert" size={48} color={theme.colors.statusDanger} />
      <Text
        variant="heading"
        weight="semibold"
        tone="primary"
        align="center"
        style={{ marginTop: theme.spacing.lg }}
      >
        {title ?? t('states.errorTitle')}
      </Text>
      <Text
        variant="callout"
        tone="muted"
        align="center"
        style={[styles.body, { marginTop: theme.spacing.sm }]}
      >
        {body ?? t('states.errorBody')}
      </Text>

      {onRetry ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <Button variant="primary" label={t('common.retry')} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { maxWidth: 320 },
});
