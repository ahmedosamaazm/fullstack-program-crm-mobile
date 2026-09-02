import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Text } from './Text';

type SectionHeaderBase = { title: string };

export type SectionHeaderProps =
  | (SectionHeaderBase & { variant?: 'none' })
  | (SectionHeaderBase & { variant: 'rule' })
  | (SectionHeaderBase & { variant: 'link'; action: string; onActionPress: () => void });

/**
 * Pad-y snapped to `spacing.sm` (8) from Figma's off-scale `10` — a
 * documented 2px shift (plan audit findings). The `link` variant sits on the
 * real `fontSize.xs`/`lineHeight.xs`/`tracking.wide` tokens rather than
 * Figma's off-scale raw values on that variant. `rule` is Figma's inline
 * hairline after the label (`flex: 1`), not a bottom border under the row.
 */
export function SectionHeader(props: SectionHeaderProps) {
  const theme = useTheme();
  const variant = props.variant ?? 'none';

  return (
    <View
      style={[
        styles.root,
        {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          gap: variant === 'rule' ? theme.spacing.md : 0,
        },
      ]}
    >
      <Text
        variant="caption"
        weight="semibold"
        tone="muted"
        style={[styles.label, { letterSpacing: theme.tracking.wide }]}
      >
        {props.title}
      </Text>
      {props.variant === 'rule' ? (
        <View style={[styles.rule, { backgroundColor: theme.colors.borderSubtle }]} />
      ) : null}
      {props.variant === 'link' ? (
        <Pressable onPress={props.onActionPress} accessibilityRole="button">
          <Text variant="caption" weight="semibold" tone="link">
            {props.action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { textTransform: 'uppercase' },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
});
