import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/lib/theme';

import { Text } from './Text';

export type SheetHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  showHandle?: boolean;
};

const HANDLE_ROW_HEIGHT = 24;
const TITLE_ROW_HEIGHT = 38;

/** Grab handle + titlebar for `BottomSheet` — also usable standalone. */
export function SheetHeader({ title, actionLabel, onActionPress, showHandle = true }: SheetHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.bgSurface }}>
      {showHandle ? (
        <View style={[styles.handleRow, { height: HANDLE_ROW_HEIGHT }]}>
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.borderStrong, borderRadius: theme.radius.full },
            ]}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.titleRow,
          {
            height: TITLE_ROW_HEIGHT,
            paddingHorizontal: theme.spacing.xl,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.borderSubtle,
          },
        ]}
      >
        <Text
          variant="heading"
          weight="semibold"
          tone="primary"
          numberOfLines={1}
          style={[styles.title, { letterSpacing: theme.tracking.tight }]}
        >
          {title}
        </Text>
        {actionLabel && onActionPress ? (
          <Pressable onPress={onActionPress} accessibilityRole="button">
            <Text variant="callout" weight="semibold" tone="link">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  handleRow: { alignItems: 'center', justifyContent: 'center' },
  handle: { width: 40, height: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
});
