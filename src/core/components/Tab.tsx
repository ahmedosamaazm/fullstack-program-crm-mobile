import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Text } from './Text';

export type TabProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Tab({ label, selected, onPress }: TabProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={[styles.root, { gap: theme.spacing.sm, paddingTop: theme.spacing.sm }]}
    >
      <Text
        variant="callout"
        weight={selected ? 'semibold' : 'medium'}
        style={{ color: selected ? theme.colors.tabActive : theme.colors.tabInactive }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.indicator,
          {
            borderRadius: theme.radius.full,
            backgroundColor: selected ? theme.colors.tabActive : 'transparent',
          },
        ]}
      />
    </Pressable>
  );
}

export type TabBarProps = {
  children: ReactNode;
  scrollable?: boolean;
};

export function TabBar({ children, scrollable = false }: TabBarProps) {
  const theme = useTheme();

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        contentContainerStyle={{
          flexDirection: 'row',
          gap: theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          gap: theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  indicator: { width: '100%', height: 2 },
  bar: { flexDirection: 'row' },
});
