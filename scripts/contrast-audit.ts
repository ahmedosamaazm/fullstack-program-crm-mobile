/**
 * WCAG 2.1 contrast gate for the two semantic palettes.
 *
 * BRD `docs/phase1_brd_1.md:389` asks that "all text and interactive elements
 * meet WCAG AA in both themes". That criterion was never measured before story
 * 26 (SCRUM-13) — this script is what turns it from a claim into a command:
 *
 *     npm run contrast
 *
 * It reads the real `lightColors`/`darkColors`, so a token change that breaks a
 * pair fails here rather than on a device.
 *
 * Thresholds: 4.5 for body text (WCAG 1.4.3 AA), 3.0 for UI boundaries, icons
 * and graphical objects (1.4.11).
 */
import { darkColors, lightColors, type ColorToken } from '../src/core/lib/theme/colors';

/** Declared locally rather than adding `@types/node` for a single call — this is
 *  the only Node-hosted file in the repo, and it is not part of `tsconfig.json`. */
declare const process: { exit(code: number): never };

type Kind = 'text' | 'ui';
type Scheme = 'light' | 'dark';
type Pair = { fg: ColorToken; bg: ColorToken; kind: Kind; where: string };

const THRESHOLD: Record<Kind, number> = { text: 4.5, ui: 3.0 };

/**
 * Pairs the components actually render together. Add a row when a component
 * introduces a new one; do not enumerate the 39x39 matrix.
 *
 * `borderDefault` deliberately has NO row here. Story 26 task 3b moved every
 * control outline that used it (`TextField`, `TextArea`, `SearchField`,
 * `Dropzone`) onto `borderInteractive`; what is left — `Button`'s secondary
 * outline, plus card and sheet trim — is decorative, or is a boundary
 * accompanied by its own text label, so 1.4.11 no longer applies. Same
 * reasoning as the `borderSubtle` exemption below. `borderStrong` likewise
 * survives only on `SheetHeader`'s grabber, an affordance rather than a control
 * boundary. If either token is ever put back on a control outline, add its row.
 */
const PAIRS: Pair[] = [
  // Body text on the two grounds every screen is built from.
  { fg: 'textPrimary', bg: 'bgCanvas', kind: 'text', where: 'body on a screen background' },
  { fg: 'textPrimary', bg: 'bgSurface', kind: 'text', where: 'body on a card' },
  { fg: 'textSecondary', bg: 'bgSurface', kind: 'text', where: 'secondary body on a card' },
  { fg: 'textMuted', bg: 'bgSurface', kind: 'text', where: 'muted meta on a card' },
  { fg: 'textMuted', bg: 'bgCanvas', kind: 'text', where: 'muted meta on a screen background' },
  { fg: 'textMuted', bg: 'bgSurfaceSunken', kind: 'text', where: 'muted label on a sunken surface' },
  { fg: 'textLink', bg: 'bgSurface', kind: 'text', where: 'link on a card' },

  // Filled primary surfaces.
  { fg: 'textOnPrimary', bg: 'bgPrimary', kind: 'text', where: 'primary button label' },
  {
    fg: 'textOnPrimary',
    bg: 'bgPrimaryPressed',
    kind: 'text',
    where: 'primary button label, pressed',
  },
  { fg: 'iconOnPrimary', bg: 'bgPrimary', kind: 'ui', where: 'FAB / IconButton glyph' },
  { fg: 'textOnDanger', bg: 'statusDanger', kind: 'text', where: 'destructive button label' },

  // Status surfaces — StatusBadge, chips, banners.
  { fg: 'statusInfo', bg: 'bgPrimarySubtle', kind: 'text', where: 'StatusBadge `new`' },
  { fg: 'statusWarning', bg: 'bgWarningSubtle', kind: 'text', where: 'StatusBadge `open`' },
  { fg: 'statusSuccess', bg: 'bgSuccessSubtle', kind: 'text', where: 'StatusBadge `resolved`' },
  { fg: 'statusDanger', bg: 'bgDangerSubtle', kind: 'text', where: 'danger banner text' },
  { fg: 'textInternal', bg: 'bgInternalSubtle', kind: 'text', where: 'internal-note body' },
  { fg: 'statusInfo', bg: 'bgSurface', kind: 'text', where: 'info text on a card' },
  { fg: 'statusDanger', bg: 'bgSurface', kind: 'text', where: 'field error under a control' },

  // Icons and boundaries — 1.4.11.
  { fg: 'iconDefault', bg: 'bgSurface', kind: 'ui', where: 'default glyph on a card' },
  { fg: 'iconDefault', bg: 'bgCanvas', kind: 'ui', where: 'default glyph on a screen background' },
  { fg: 'iconStrong', bg: 'bgSurface', kind: 'ui', where: 'emphasised glyph on a card' },
  { fg: 'borderFocus', bg: 'bgSurface', kind: 'ui', where: 'focus ring on a card' },
  {
    fg: 'borderInteractive',
    bg: 'bgSurface',
    kind: 'ui',
    where: 'TextField/TextArea/SearchField/Dropzone outline, FilterChip, `closed` badge',
  },
  {
    fg: 'borderInteractive',
    bg: 'bgCanvas',
    kind: 'ui',
    where: 'the same controls on a screen background',
  },

  // Tab bar.
  { fg: 'tabActive', bg: 'bgTabActive', kind: 'text', where: 'active tab label inside its pill' },
  { fg: 'tabInactive', bg: 'bgSurface', kind: 'text', where: 'inactive tab label' },
];

/**
 * Pairs that fail a threshold but are exempt or unreachable. Each needs a
 * reason and must be re-justified if a consumer ever appears.
 */
const EXEMPT: { fg: ColorToken; bg: ColorToken; reason: string }[] = [
  { fg: 'borderSubtle', bg: 'bgSurface', reason: 'decorative divider — WCAG 1.4.11 excludes' },
  {
    fg: 'textDisabled',
    bg: 'bgSurface',
    reason: 'inactive control — 1.4.3 excludes; zero consumers',
  },
  {
    fg: 'textInverse',
    bg: 'bgOverlay',
    reason: 'zero consumers — nothing renders text on the backdrop',
  },
];

/**
 * Figure/ground invariants. These are not contrast ratios — two backgrounds
 * that must simply not be the same swatch. Both are known-broken and owned by
 * design (story 26 open questions 1 and 3), so they warn rather than fail:
 * turning either into an exit-1 would block the build on a design decision.
 */
const DISTINCT: { scheme: Scheme; a: ColorToken; b: ColorToken; note: string }[] = [
  {
    scheme: 'dark',
    a: 'bgSurfaceSunken',
    b: 'bgCanvas',
    note:
      'a `pending`/`closed` StatusBadge on a screen background is a 1.00-contrast rectangle. ' +
      '`bgSurfaceSunken` cannot be pulled off `bgCanvas` (neutral1000 is the bottom of the ramp) ' +
      'and `bgCanvas` cannot move to `black` (`bgOverlay` is already black — the BottomSheet ' +
      'backdrop would vanish). Story 26 open question 1.',
  },
  {
    scheme: 'light',
    a: 'bgSurfaceRaised',
    b: 'bgSurface',
    note:
      "SegmentedControl's track and Avatar's neutral variant have no ground on a white card. " +
      'Raised is meant to read by elevation instead — confirm with design before re-pointing the ' +
      'alias. Story 26 open question 3.',
  },
];

const SCHEMES: Record<Scheme, Record<ColorToken, string>> = {
  light: lightColors,
  dark: darkColors,
};

/** sRGB relative luminance, per WCAG 2.1. */
function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** (L1 + 0.05) / (L2 + 0.05), lighter over darker. */
function contrast(a: string, b: string): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const fmt = (n: number) => n.toFixed(2).padStart(6);

let failures = 0;
let warnings = 0;

for (const scheme of ['light', 'dark'] as const) {
  const colors = SCHEMES[scheme];
  console.log(`\n${scheme.toUpperCase()}`);

  for (const pair of PAIRS) {
    const ratio = contrast(colors[pair.fg], colors[pair.bg]);
    const min = THRESHOLD[pair.kind];
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'} ${fmt(ratio)} (min ${min.toFixed(1)})  ` +
        `${pair.fg} on ${pair.bg} — ${pair.where}`,
    );
  }

  for (const pair of EXEMPT) {
    const ratio = contrast(colors[pair.fg], colors[pair.bg]);
    console.log(`  EXMT ${fmt(ratio)}             ${pair.fg} on ${pair.bg} — ${pair.reason}`);
  }
}

console.log('\nFIGURE/GROUND');
for (const rule of DISTINCT) {
  const colors = SCHEMES[rule.scheme];
  if (colors[rule.a] === colors[rule.b]) {
    warnings += 1;
    console.log(
      `  WARN  ${rule.scheme} ${rule.a} === ${rule.b} (${colors[rule.a]})\n        ${rule.note}`,
    );
  } else {
    console.log(`  OK    ${rule.scheme} ${rule.a} !== ${rule.b}`);
  }
}

console.log(
  `\n${failures} failure(s), ${warnings} figure/ground warning(s), ` +
    `${EXEMPT.length} documented exemption(s).`,
);
process.exit(failures > 0 ? 1 : 0);
