import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Text } from './Text';

export type DetailRowProps = {
  label: string;
  value?: string;
  layout?: 'inline' | 'stacked';
  /** Overrides `value` with custom content (e.g. a badge). */
  valueSlot?: ReactNode;
};

const INLINE_HEIGHT = 44;
const STACKED_HEIGHT = 66;

export function DetailRow({ label, value, layout = 'inline', valueSlot }: DetailRowProps) {
  const theme = useTheme();
  const isInline = layout === 'inline';

  return (
    <View
      style={[
        isInline ? styles.inline : styles.stacked,
        {
          minHeight: isInline ? INLINE_HEIGHT : STACKED_HEIGHT,
          gap: isInline ? theme.spacing.lg : theme.spacing.xxs,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.bgSurface,
        },
      ]}
    >
      <Text variant="callout" tone="muted">
        {label}
      </Text>
      {valueSlot ?? (
        <Text
          variant="callout"
          tone="primary"
          align={isInline ? 'end' : undefined}
          style={isInline ? styles.inlineValue : undefined}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stacked: { justifyContent: 'center' },
  inlineValue: { flex: 1 },
});
