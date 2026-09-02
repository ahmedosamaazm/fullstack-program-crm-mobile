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
          {/* `borderStrong` stays here deliberately (story 26, SCRUM-13). It
              measures 1.69 light / 2.68 dark, under 1.4.11's 3.0 — but the
              grabber is an affordance, not a control boundary: the sheet is
              dismissible by tap and by gesture without it. Do not re-open. */}
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
            paddingHorizontal: theme.spacing.lg,
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
