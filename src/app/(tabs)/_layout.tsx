import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/core/components';
import { useTheme } from '@/core/lib/theme';

/** Figma node 49:134's rounded-top corner — a one-off shape value, not on the radius scale. */
const BAR_TOP_RADIUS = 22;

/** Figma's bar height, excluding the safe-area inset added beneath it. */
const BAR_CONTENT_HEIGHT = 64;

/**
 * Figma's label block is 11px tall. `overline`'s own `lineHeight.xs2` of 16
 * would make the column 8+32+3+16+10 = 69px inside a 64px bar, clipping the
 * label; 11 restores Figma's exact 64px sum.
 */
const LABEL_LINE_HEIGHT = 11;

/** Derived from `Tabs`'s own public prop type — avoids importing from the vendored, unversioned `expo-router/build/react-navigation/bottom-tabs` path. */
type BottomNavProps = NonNullable<ComponentProps<typeof Tabs>['tabBar']> extends (props: infer P) => unknown
  ? P
  : never;

// Figma draws ONE glyph per tab — the active state is a colour change
// (tabActive vs tabInactive) plus the tinted pill, NOT a filled variant.
// Verified against BottomNav 49:134: every variant's icon geometry is
// identical across active and inactive; only the stroke colour differs.
const TAB_META: Record<string, { icon: IconName; labelKey: string }> = {
  index: { icon: 'home', labelKey: 'tabs.home' },
  tickets: { icon: 'tickets', labelKey: 'tabs.tickets' },
  customers: { icon: 'customers', labelKey: 'tabs.customers' },
  profile: { icon: 'user', labelKey: 'tabs.profile' },
};

/**
 * Custom tab bar matching Figma's `BottomNav` (node 49:134) exactly — the
 * platform-default renderer (Material 3 on Android) doesn't. Colocated here
 * rather than under a feature folder: it is app-shell chrome shared by all
 * four tabs, not domain-specific to any one of them.
 */
function BottomNav({ state, navigation }: BottomNavProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.bgSurface,
          borderTopStartRadius: BAR_TOP_RADIUS,
          borderTopEndRadius: BAR_TOP_RADIUS,
          // RN `height` is border-box, so the inset must be added to it as well
          // as applied as padding — otherwise the safe area eats into the 64px
          // content column and clips the buttons' top padding.
          height: BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          ...theme.elevation.e2,
          shadowOffset: { width: 0, height: -2 },
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;

        const isFocused = state.index === index;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={t(meta.labelKey)}
            style={[styles.button, { gap: 3 }]}
          >
            <View
              style={[
                styles.pill,
                isFocused ? { backgroundColor: theme.colors.bgTabActive, borderRadius: theme.radius.lg } : null,
              ]}
            >
              <Icon
                name={meta.icon}
                size={24}
                color={isFocused ? theme.colors.tabActive : theme.colors.tabInactive}
              />
            </View>
            <Text
              variant="overline"
              weight="medium"
              tone={isFocused ? 'link' : 'muted'}
              style={{ lineHeight: LABEL_LINE_HEIGHT }}
            >
              {t(meta.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      // Without this the scene container falls back to React Navigation's own
      // `DefaultTheme`, whose background is white — a white flash behind every
      // tab switch in dark mode (story 26, SCRUM-13).
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.bgCanvas },
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tickets" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    // Approximates Figma's `0px -2px 8px rgba(15,23,41,0.08)`. Android's
    // `elevation` cannot cast an upward-only shadow — it renders a generic
    // surrounding shadow there instead, an accepted platform approximation.
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 10 },
  pill: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
});
