import { useState } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/lib/theme';
import { initialsOf } from '@/core/utils';

import { Text } from './Text';

type AvatarProps = {
  name: string;
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
};

/** Image when available, initials otherwise. Falls back if the image 404s. */
export function Avatar({ name, uri, size = 44, style }: AvatarProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);

  const showImage = Boolean(uri) && !failed;

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
          backgroundColor: theme.colors.bgSurfaceRaised,
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
          tone="muted"
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
