import { useWindowDimensions } from 'react-native';

/** Agents use phones and tablets; layout decisions branch on these. */
export type Breakpoint = 'compact' | 'medium' | 'expanded';

const MEDIUM_MIN = 600;
const EXPANDED_MIN = 905;

export function useBreakpoint(): {
  breakpoint: Breakpoint;
  isTablet: boolean;
  width: number;
} {
  const { width } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= EXPANDED_MIN ? 'expanded' : width >= MEDIUM_MIN ? 'medium' : 'compact';

  return { breakpoint, isTablet: breakpoint !== 'compact', width };
}
