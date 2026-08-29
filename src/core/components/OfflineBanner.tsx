import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/lib/theme';

import { Text } from './Text';

/**
 * Slides in while the device has no usable connection. Rendered once, in the
 * root layout — individual screens should not mount their own.
 *
 * The new palette has no solid warning fill (`statusWarning` is a foreground
 * token, `bgWarningSubtle` a tinted surface) — plan §15 flag 4. Uses a tinted
 * background + `textPrimary` + a `statusWarning` hairline rather than
 * `textInverse` on `statusWarning`, which was borderline for contrast.
 */
export function OfflineBanner() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable` is null while unknown — treat only an explicit
      // false, or a disconnected interface, as offline.
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: offline ? 0 : -80,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [offline, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        {
          transform: [{ translateY }],
          paddingTop: insets.top + theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.bgWarningSubtle,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.statusWarning,
        },
      ]}
    >
      <Text variant="callout" weight="medium" tone="primary" align="center">
        {t('states.offline')}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 10,
  },
});
