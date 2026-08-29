import type { ViewStyle } from 'react-native';

import { primitives } from './primitives';

type ElevationLevel = 1 | 2 | 3 | 4 | 5;

type ElevationSpec = {
  /** Figma `y` (px). */
  offsetY: number;
  /** Figma `blur` (px). RN's `shadowRadius` is half of CSS blur. */
  blur: number;
  opacity: number;
  /** Android `elevation` (dp). No 1:1 mapping to Figma's blur/spread exists;
   * these are a visual match, tuned per level. */
  androidElevation: number;
};

/**
 * `spread` is dropped — `e4`'s `-12` has no `shadow*` equivalent on iOS.
 * Compensated with a smaller `shadowRadius` on that level; documented here
 * rather than silently approximated.
 */
const SPECS: Record<ElevationLevel, ElevationSpec> = {
  1: { offsetY: 1, blur: 3, opacity: 0.06, androidElevation: 1 },
  2: { offsetY: 2, blur: 8, opacity: 0.04, androidElevation: 2 },
  3: { offsetY: 4, blur: 16, opacity: 0.05, androidElevation: 4 },
  4: { offsetY: 25, blur: 50, opacity: 0.25, androidElevation: 12 },
  5: { offsetY: 32, blur: 80, opacity: 0.6, androidElevation: 24 },
};

export type Elevation = Record<`e${ElevationLevel}`, ViewStyle>;

function buildElevation(shadowColor: string): Elevation {
  const result = {} as Elevation;
  for (const level of [1, 2, 3, 4, 5] as ElevationLevel[]) {
    const spec = SPECS[level];
    result[`e${level}`] = {
      shadowColor,
      shadowOffset: { width: 0, height: spec.offsetY },
      shadowOpacity: spec.opacity,
      shadowRadius: spec.blur / 2,
      elevation: spec.androidElevation,
    };
  }
  return result;
}

// Computed once at module scope — the provider allocates nothing per render.
export const lightElevation = buildElevation(primitives.neutral900);
export const darkElevation = buildElevation(primitives.black);
