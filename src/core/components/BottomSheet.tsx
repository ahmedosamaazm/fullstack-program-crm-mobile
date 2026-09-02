import { type PropsWithChildren, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/lib/theme';

import { SheetHeader } from './SheetHeader';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
}>;

const DISMISS_VELOCITY = 0.5;
const DISMISS_DISTANCE = 120;

/**
 * Modal sheet with backdrop tap and drag-to-dismiss.
 *
 * Deliberately built on React Native's `Animated` + `PanResponder` rather than
 * Reanimated: Reanimated is present only as an expo-router peer, and keeping it
 * out of the component layer avoids depending on its Babel/worklets setup.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }),
        // `bgOverlay` is opaque per Figma — alpha lives in this animation
        // (to `opacity.medium`, matching the frame's #181c2266 = 0.4), not baked
        // into the token, or the sheet would open behind solid black.
        Animated.timing(backdrop, {
          toValue: theme.opacity.medium,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(backdrop, { toValue: 0, duration: 140, useNativeDriver: true }).start();
    }
  }, [visible, screenHeight, translateY, backdrop, theme.opacity.medium]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          close();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 220,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={close}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bgOverlay }]}
          />
        </Animated.View>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              backgroundColor: theme.colors.bgSurface,
              borderTopStartRadius: theme.radius.xl,
              borderTopEndRadius: theme.radius.xl,
              paddingBottom: insets.bottom + theme.spacing.lg,
              maxHeight: screenHeight * 0.9,
            },
          ]}
        >
          {title ? (
            <SheetHeader title={title} />
          ) : (
            <View
              style={[
                styles.handleRow,
                { marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
              ]}
            >
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.borderDefault, borderRadius: theme.radius.full },
                ]}
              />
            </View>
          )}
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: title ? theme.spacing.lg : 0,
            }}
          >
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { width: '100%', alignItems: 'stretch' },
  handleRow: { alignItems: 'center' },
  handle: { width: 36, height: 4 },
});
