import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { SearchField } from './SearchField';
import { Text } from './Text';

export type ListScreenHeaderProps = {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /**
   * The filter chip row, rendered inside a horizontal ScrollView. The caller
   * passes `FilterChip`s as `filters`; this component owns no filter semantics,
   * which is what keeps `core/` ignorant of `features/` (hard rule 3).
   */
  filters: ReactNode;
};

/**
 * The static title + search + chip-row block Figma draws identically over both
 * the Tickets (`7:372`) and Customers (`7:1944`) list screens. Extracted to
 * `core/` because it is used in two features (hard rule 2): title box,
 * `height={44}` `SearchField`, and the horizontal chip row.
 *
 * - Title inset and chip row inset are `spacing.lg` themselves — the caller
 *   should not wrap farther.
 * - The chip row scrolls its own `paddingHorizontal`, so in RTL the leading
 *   chip sits at the trailing edge for free.
 */
export function ListScreenHeader({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
}: ListScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ paddingTop: theme.spacing.sm }}>
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Text variant="title" weight="semibold">
          {title}
        </Text>
        <View style={{ marginTop: theme.spacing.sm }}>
          <SearchField
            value={searchValue}
            onChangeText={onSearchChange}
            onClear={() => onSearchChange('')}
            placeholder={searchPlaceholder}
          />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        }}
        style={[styles.scroll, { marginTop: theme.spacing.sm }]}
      >
        {filters}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
});
