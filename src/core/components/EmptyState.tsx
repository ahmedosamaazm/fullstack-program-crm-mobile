import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type EmptyStateProps = {
  title: string;
  body?: string;
  icon?: IconName;
  /** Usually a primary action button. */
  action?: ReactNode;
};

export function EmptyState({ title, body, icon = 'file', action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { padding: theme.spacing.xl }]}>
      <Icon name={icon} size={48} color={theme.colors.textMuted} />
      <Text
        variant="heading"
        weight="semibold"
        tone="primary"
        align="center"
        style={[styles.title, { marginTop: theme.spacing.lg }]}
      >
        {title}
      </Text>
      {body ? (
        <Text
          variant="callout"
          tone="muted"
          align="center"
          style={[styles.body, { marginTop: theme.spacing.sm }]}
        >
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: theme.spacing.xl }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {},
  body: { maxWidth: 320 },
});
