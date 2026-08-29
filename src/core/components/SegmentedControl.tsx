import { Pressable, StyleSheet, View } from 'react-native';

import { hitSlop, useTheme } from '@/core/lib/theme';

import { Text } from './Text';

export type Segment<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Used for ticket status filters and any two-to-four-way switch. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.bgSurfaceRaised,
          borderRadius: theme.radius.md,
          padding: theme.spacing.xs,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={4}
            onPress={() => onChange(segment.value)}
            style={[
              styles.segment,
              {
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.sm,
                minHeight: hitSlop - theme.spacing.sm,
                backgroundColor: selected ? theme.colors.bgPrimary : 'transparent',
              },
            ]}
          >
            <Text
              variant="callout"
              weight={selected ? 'semibold' : 'medium'}
              tone={selected ? 'onPrimary' : 'muted'}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
