import { useState } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme, type ColorToken } from '@/core/lib/theme';
import { initialsOf } from '@/core/utils';

import { Text, type TextTone } from './Text';

export type AvatarTint = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * Figma tints each customer avatar with an unnamed fill (node 7:1984 and
 * siblings). The semantic palette has no avatar-tint token set, and hex
 * literals are banned outside primitives.ts (hard rule 2), so this maps onto
 * the four subtle surfaces that already exist. `bgTabActive` — not
 * `bgPrimarySubtle` — is the blue: `bgPrimarySubtle` is near-white
 * (primitives.ts:36 and its comment) and disappears behind the initials.
 */
const TINT: Record<AvatarTint, { bg: ColorToken; tone: TextTone }> = {
  neutral: { bg: 'bgSurfaceRaised', tone: 'muted' },
  info: { bg: 'bgTabActive', tone: 'info' },
  success: { bg: 'bgSuccessSubtle', tone: 'success' },
  warning: { bg: 'bgWarningSubtle', tone: 'warning' },
  danger: { bg: 'bgDangerSubtle', tone: 'danger' },
};

const TINT_CYCLE: AvatarTint[] = ['info', 'success', 'warning', 'danger'];

/**
 * Stable tint for a name — the same customer is the same colour on every
 * render, every device and every session. Sums code units rather than using a
 * cryptographic hash; collisions are cosmetic.
 */
export function tintForName(name: string): AvatarTint {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return TINT_CYCLE[sum % TINT_CYCLE.length];
}

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
  tint?: AvatarTint;
  style?: ViewStyle;
};

/** Image when available, initials otherwise. Falls back if the image 404s. */
export function Avatar({ name, uri, size = 44, tint = 'neutral', style }: AvatarProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  const showImage = Boolean(uri) && !failed;
  const { bg, tone } = TINT[tint];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors[bg],
          borderColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text
          weight="semibold"
          tone={tone}
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
