import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The `paddingBottom` a full-height container should apply so a control pinned
 * to its bottom edge clears the on-screen keyboard — and, when the keyboard is
 * closed, the navigation bar.
 *
 * This exists because `KeyboardAvoidingView` does not work on Android in this
 * app. Every `behavior` it offers assumes the window shrinks when the keyboard
 * opens (`adjustResize`), and Expo made **edge-to-edge mandatory on Android in
 * SDK 54+** — the window keeps its full height and only the IME inset changes.
 * `behavior={undefined}` is a no-op there and `behavior="padding"` computes its
 * offset from a frame that never moved, so a pinned composer stays covered.
 *
 * The keyboard events are accurate, so measure and pad instead. The two
 * platforms report different things and the difference is not cosmetic:
 *
 * - **Android** reports the IME height with the bottom system inset already
 *   subtracted, so the raw value lands the composer a navigation-bar short of
 *   clear. `insets.bottom` is added back.
 * - **iOS** reports a height measured from the physical screen bottom, home
 *   indicator included, so adding the inset would over-lift and leave a gap.
 *
 * With the keyboard closed both platforms fall back to `insets.bottom`, which
 * keeps the composer above the gesture pill instead of under it.
 *
 * Assumes the container reaches the screen bottom — i.e. an ancestor
 * `SafeAreaView` applies no bottom edge. Every current caller satisfies that
 * (`edges={['top']}`).
 */
export function useKeyboardInset(): number {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // Android emits only the `Did` pair; iOS's `Will` pair lets the lift
    // animate with the keyboard rather than snapping after it.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardHeight === 0) return insets.bottom;
  return Platform.OS === 'android' ? keyboardHeight + insets.bottom : keyboardHeight;
}
