/** 9-step spacing scale, from Figma's `spacing/*` collection. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

/**
 * Opacity ramp used for disabled/pressed states and non-colour overlays (e.g.
 * `BottomSheet`'s backdrop, which keeps alpha in its animation rather than in
 * `bgOverlay`, which is opaque per Figma).
 */
export const opacity = {
  none: 0,
  subtle: 0.06,
  muted: 0.1,
  soft: 0.3,
  disabled: 0.38,
  medium: 0.4,
  strong: 0.6,
  full: 1,
} as const;

/** Minimum touch target, per platform accessibility guidance. */
export const hitSlop = 44;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Opacity = typeof opacity;
