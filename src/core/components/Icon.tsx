import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useDirection } from '@/core/lib/i18n';
import { useTheme } from '@/core/lib/theme';

/**
 * Renderer-agnostic icon names — the 23 names in Figma's `Icon` component set
 * (`mdfP8RPdkUsKcJb0wFdkME`, verified live via `get_metadata`/`get_variable_defs`)
 * plus `search`/`close`/`plus`/`alert`, which the components need but the
 * Figma set lacks (plan §15 flag 2). Deliberately a strict union, never
 * widened to `string` — that's what makes swapping the renderer
 * (MaterialCommunityIcons today) for exact Figma SVG paths later a one-file
 * change.
 *
 * `arrowBack`/`chevronForward` are logical names for what Figma calls
 * `ArrowLeft`/`Chevron` — physical names in a codebase with zero physical
 * props (plan §15 flag 1); the rename is requested back to design.
 */
export type IconName =
  | 'globe'
  | 'theme'
  | 'bell'
  | 'info'
  | 'signOut'
  | 'chevronForward'
  | 'arrowBack'
  | 'phone'
  | 'mail'
  | 'sparkle'
  | 'chevronDown'
  | 'lock'
  | 'paperclip'
  | 'send'
  | 'clock'
  | 'eye'
  | 'eyeOff'
  | 'check'
  | 'camera'
  | 'image'
  | 'file'
  | 'user'
  | 'message'
  | 'star'
  | 'search'
  | 'close'
  | 'plus'
  | 'alert';

type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICON_MAP: Record<IconName, MCIName> = {
  globe: 'earth',
  theme: 'theme-light-dark',
  bell: 'bell-outline',
  info: 'information-outline',
  signOut: 'logout',
  chevronForward: 'chevron-right',
  arrowBack: 'arrow-left',
  phone: 'phone-outline',
  mail: 'email-outline',
  sparkle: 'star-four-points-outline',
  chevronDown: 'chevron-down',
  lock: 'lock-outline',
  paperclip: 'paperclip',
  send: 'send-outline',
  clock: 'clock-outline',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  check: 'check',
  camera: 'camera-outline',
  image: 'image-outline',
  file: 'file-outline',
  user: 'account-outline',
  message: 'message-text-outline',
  star: 'star-outline',
  search: 'magnify',
  close: 'close',
  plus: 'plus',
  alert: 'alert-circle-outline',
};

/** Icons whose glyph implies a direction and so flip by default under RTL. */
const DEFAULT_MIRRORED = new Set<IconName>(['chevronForward', 'arrowBack', 'signOut', 'send']);

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Overrides the default RTL-mirror behaviour for this instance. */
  mirrorInRtl?: boolean;
};

/**
 * Icons are decorative — the wrapping control owns the accessibility label,
 * so this is always hidden from the accessibility tree.
 */
export function Icon({ name, size = 20, color, mirrorInRtl }: IconProps) {
  const theme = useTheme();
  const direction = useDirection();

  const shouldMirror = mirrorInRtl ?? DEFAULT_MIRRORED.has(name);
  const mirrored = direction === 'rtl' && shouldMirror;

  return (
    <MaterialCommunityIcons
      name={ICON_MAP[name]}
      size={size}
      color={color ?? theme.colors.iconDefault}
      importantForAccessibility="no-hide-descendants"
      style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
    />
  );
}
