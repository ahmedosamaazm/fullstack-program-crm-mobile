import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/lib/theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

/** A single pulsing placeholder block. Compose several for list skeletons. */
export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, theme.opacity.medium] });

  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.bgSkeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Convenience: a few stacked lines, the common list-loading shape. */
export function SkeletonList({ count = 4 }: { count?: number }) {
  const theme = useTheme();
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[styles.row, { marginBottom: theme.spacing.lg }]}
        >
          <Skeleton width={44} height={44} radius={theme.radius.full} />
          <View style={[styles.rowText, { marginStart: theme.spacing.md }]}>
            <Skeleton width="60%" height={14} />
            <View style={{ height: theme.spacing.sm }} />
            <Skeleton width="85%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { flex: 1 },
});
