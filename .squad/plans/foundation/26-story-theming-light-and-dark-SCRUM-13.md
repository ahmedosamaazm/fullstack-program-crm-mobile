# Story 26 — Theming: light & dark (Story: SCRUM-13)

> Intake: `.squad/stories/foundation/SCRUM-13/intake.md`
> BRD: `docs/phase1_brd_1.md:380-392` (TF-02, 5 pts).
> Roadmap: `docs/phase_1_frontend_roadmap.md:92-99`.
> Second story in `.squad/plans/foundation/`, after 25 (SCRUM-12).

## Read this before anything else

Six facts decide how this story is sequenced. Establish all six before writing a line of code.

**1. This is a closure story, not a build story.** Four of the six BRD criteria (`:386-392`)
already pass: both full token sets exist (`colors.ts:9-60` light, `:65-114` dark), `setMode`
switches synchronously with no restart (`ThemeProvider.tsx:113-130`), the system preference is read
on first launch (`ThemeProvider.tsx:102-104` seeded by `loadPersistedThemeMode()` at `:84-91`), and
hex literals are eslint-banned outside `primitives.ts` (`eslint.config.js:8`, `:145-162`). The
remaining work is the two criteria nobody has ever measured, plus the dark-mode visual pass nobody
has ever run. Same shape as stories 19, 20, 21, 22 and 25.

**2. The contrast criterion has been measured, and this plan carries the numbers.** §"Measured
contrast" below is the real output of a WCAG 2.1 relative-luminance pass over every token pair the
components actually use, computed from `primitives.ts`'s 39 literals. **Do not re-derive it by
eye.** Six pairs fail; two of the six are WCAG-exempt and one is a phantom (no consumer). The three
real failures are named in task 3. Task 2 turns the throwaway script that produced this table into
a checked-in gate so the criterion never goes unmeasured again.

**3. The `pending`/`closed` collision the intake names is worse in dark than in light.**
`StatusBadge.tsx:23-24` and `:27-28` both return `bgSurfaceSunken`. In **light** that is
`neutral100` `#f0f3f8` and the badge is at least visible (1.11 against `bgSurface`, 1.06 against
`bgCanvas`). In **dark** `bgSurfaceSunken` is `neutral1000` `#0c1014` — the **exact same value as
`bgCanvas`** (`colors.ts:66` and `:69`). A `pending` or `closed` badge rendered on a screen
background in dark mode is a 1.00-contrast rectangle: geometrically invisible. Task 4 fixes this
with a shape cue, not a colour; the colour half stays a design question (§Open questions 1).

**4. Two token pairs are structurally impossible to fix by re-pointing an alias.** Dark
`bgSurfaceSunken` cannot be pulled off `bgCanvas` because "sunken" must be darker than
`bgSurface` (`neutral900`) and `neutral1000` is the bottom of the ramp. Moving dark `bgCanvas` to
`black` was evaluated and rejected: `bgOverlay` is already `black` (`colors.ts:78`), so the
`BottomSheet` backdrop (`BottomSheet.tsx:106`) and `AttachmentViewer` (`AttachmentViewer.tsx:56`)
would vanish into the canvas. **Do not attempt either.** Likewise dark `statusDanger` `#ffb4ab` and
`statusWarning` `#ffb77c` have *identical* relative luminance (ratio 1.00) — two pale pastels
cannot be separated by luminance inside a dark palette without a new hue from design.

**5. Three dark-mode chrome surfaces are outside the token layer entirely and are all wrong.**
`expo-status-bar` is installed (`package.json:24`) and **imported nowhere** — grep for `StatusBar`
across `src/` returns zero hits, so OS status-bar glyphs never follow the theme. The splash
declares a single light `backgroundColor` `#f8f9fb` (`app.json:43`) with no dark frame. And the
`Stack` at `_layout.tsx:69` sets no `contentStyle` background, so React Navigation's own
`DefaultTheme` white paints every push and modal transition. Tasks 5 and 6 close all three. None of
them is reachable from `useTheme()`.

**6. Two claims in `.squad/audits/design/00-index.md` are stale — do not act on them.** Its defect
2 says `(tabs)/_layout.tsx:63` sets `shadowColor: theme.colors.textPrimary` (a white halo in dark);
line 63 today is `...theme.elevation.e2`, and `elevation.ts:49-50` already builds the light and dark
shadows off `neutral900`/`black`. Its defect 3 says `app.json:30` registers `expo-splash-screen` as
a bare string; `app.json:37-45` is the full array form. **Both were fixed after that audit was
written.** Task 8 corrects the audit file rather than re-fixing working code. Its other dark-mode
findings (no dark splash frame, `pending` has no colour token, the fixed-colour brand PNG on a dark
canvas) are still live and are tasks 6, 4 and 7 here.

---

## Prerequisites

- **Stories 01–25 completed.** This story verifies their combined output across every screen. The
  design-system pass
  ([`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md))
  owns the token layer being audited; its §15 flags 4 and 8 overlap with tasks 4 and 8 here.
- **Story 25 completed** — [`25-story-localisation-and-rtl-SCRUM-12.md`](25-story-localisation-and-rtl-SCRUM-12.md).
  It is the sibling closure story in this folder and set the shape this one follows. It also added
  `expo-updates`, so **a development build already exists** — task 6's splash change needs one.
- **A development build, not Expo Go.** The splash frame (task 6) is a native config change: Expo Go
  substitutes its own splash and cannot show it. `.squad/audits/design/00-index.md` records this as
  blocking four splash findings.
- **A device or emulator whose OS theme you can flip while the app is running.** Criterion `:386`
  (system preference on first launch) and the `Appearance.addChangeListener` path
  (`ThemeProvider.tsx:106-111`) cannot be exercised from a hot reload.
- **Node 22.16 or newer** for task 2's audit script — verified against the local toolchain.

---

## Story Goal

Close TF-02 by measuring the two criteria that were never measured, fixing what the measurement
found, and running the dark-mode visual pass that has never been run. Concretely:

1. **The contrast criterion becomes a repeatable command**, not a claim. A checked-in
   `scripts/contrast-audit.ts` reads the real `lightColors`/`darkColors` and fails on any used pair
   below its WCAG threshold.
2. **The three genuine AA failures are fixed** — the dark primary-pressed button label, and the
   input outline in both themes.
3. **`pending` and `closed` stop being the same rectangle**, and stop being invisible on a dark
   canvas.
4. **Priority stops depending on colour alone**, in the one place where it currently does.
5. **The OS status bar, the navigator background and the splash follow the theme**, closing the
   three chrome surfaces the token layer cannot reach.
6. **Every screen is looked at in dark mode**, once, deliberately, with a written result.

**Not in scope**: adding a third theme or a high-contrast mode (`ThemeMode` stays
`'light' | 'dark' | 'system'`, `ThemeProvider.tsx:28`); per-screen theme overrides (`ThemeScope` at
`ThemeProvider.tsx:151-161` stays a dev-gallery affordance with no production caller); WCAG AAA;
re-deriving the Figma token values (story 01 owns that mapping and this story changes only the four
aliases task 3 and 4 name); the ten §15 design flags that are not colour-contrast flags; and
`docs/DESIGN.md`, which **does not exist** (story 25 fact 3) — do not create it.

---

## Context — Read These Files First

1. `src/core/lib/theme/primitives.ts` — **all 69 lines.** The only file in the repo permitted to
   hold a colour literal. `:15-29` the neutral ramp, `:32-41` blue, `:44-59` the three status hues,
   `:65-68` purple. Task 3 adds **one** primitive here; nothing else in this story may.
2. `src/core/lib/theme/colors.ts` — **all 114 lines.** `:9-60` `lightColors`, `:62` the derived
   `ThemeColors` type, `:65-114` `darkColors`.
   - **`:4`'s comment says "35 semantic colour keys". There are 39.** `Object.keys(lightColors).length`
     returns 39. `CLAUDE.md` and `AGENTS.md` repeat the same wrong number. Task 8 corrects all three.
   - **`:66` and `:69`** — `bgCanvas` and `bgSurfaceSunken` are both `neutral1000` in dark. Fact 3.
   - **`:106-109`** already flags dark `bgTabActive` as an open question. The measurement confirms
     it: the pill is 1.08 against the bar it sits on. Task 8 attaches the number to the flag.
   - **`:30` `borderInteractive`** — light `neutral500`, dark `neutral450`. **Grep confirms it has
     zero consumers.** Task 3 gives it its first ones.
3. `src/core/lib/theme/ThemeProvider.tsx` — **all 163 lines.** `:84-91` `loadPersistedThemeMode`,
   `:100-130` the provider, **`:119`** the `mode === 'system' ? systemScheme : mode` resolution,
   `:124-127` the memo. This file is **correct as written** — criteria `:386`, `:387` and `:388` all
   pass because of it. Task 1 verifies it; nothing in this story modifies it.
4. `src/core/lib/bootstrap.ts` — **all 49 lines.** `:34-38` loads the persisted mode in parallel with
   i18next and the font; `:40` returns it. Read with `src/app/_layout.tsx:32` (`if (!result) return null`)
   and `:39` (`initialMode={result.themeMode}`) — together these are why a persisted `dark` never
   flashes light. Do not weaken.
5. `src/app/_layout.tsx` — **all 84 lines.** **`:69`** `<Stack screenOptions={{ headerShown: false }}>`
   — no `contentStyle`. `:75-77` the three `presentation: 'modal'` screens, which are where the white
   flash is most visible. Task 5 edits `:69`.
6. `src/features/tickets/components/StatusBadge.tsx` — **all 58 lines.** `:11-16`'s comment is
   **stale**: it says "the 35-token semantic palette has no purple", but `colors.ts:57-59` /
   `:111-113` added `bgInternalSubtle`/`borderInternal`/`textInternal` in story 07. `:17-30`
   `statusStyle` is the function task 4 changes; `:38-52` the render.
7. `src/features/tickets/priority.ts` — **all 16 lines.** `:5-15` `priorityColor`. `:14` `low`
   returns `borderDefault` — 1.26 against a card in light, 1.84 in dark. Task 4 changes this line.
8. `src/features/tickets/components/TicketRow.tsx:45-65` — `:50` the rail fill,
   **`:57-59`'s comment** already names the problem (*"the coloured bar alone fails for colour-blind
   users"*, citing `docs/phase1_brd_1.md:610`), and `:60-62` renders `alert` for **both** `urgent`
   and `high` — so the interim non-colour cue does not distinguish the two colours that collide.
   Task 4 fixes that.
9. `src/core/components/Button.tsx:96-137` — `:100` `pressed ? background.pressed : background.idle`,
   `:101` the `opacity.disabled` blanket, `:118-125` `resolveBackground`, `:127-132`
   `resolveBorder` (the `borderDefault` outline task 3 repoints), `:134-138` `resolveTextTone`.
10. `src/core/components/Text.tsx:13-42` — the `TextTone` union and `TONE_TOKEN` map. Every text
    colour in the app resolves through `:72`. **`disabled` and `inverse` have zero consumers** —
    grep confirms it; that is why two of the six measured failures are phantoms.
11. `eslint.config.js` — `:8` `HEX_LITERAL`, `:53-59` and `:122-127` the two ban blocks,
    `:144-156` the theme-dir carve-out, `:157-162` the `primitives.ts` exemption. **The regex
    anchors on a whole string literal** (`^#…$`), so a hex inside a template literal or an
    `rgba(...)` string is not caught. Task 2 verifies the rule fires; §Edge cases records the hole.
12. `app.json:37-45` — the `expo-splash-screen` plugin block. `:43` `"backgroundColor": "#f8f9fb"`
    is `primitives.neutral50` duplicated outside the token layer. `app.json` cannot import
    TypeScript; `.squad/audits/design/00-index.md` correctly calls this *"a permanent, unavoidable
    hole in hard rule 2"*. Task 6 adds a `dark` sibling, doubling the hole to two literals — record,
    do not fight.
13. `.squad/audits/design/00-index.md:85-100` (the non-styling defect list, two entries of which are
    stale per fact 6) and `:136-148` (the "New" dark-mode findings). Read both before task 8.
14. `docs/phase1_known_issues.md:1-8` (the two open lists this story appends to) and `:24-28`
    (the never-run both-themes visual pass, which task 7 performs).
15. Grep `theme.colors.` across `src/` before task 7 — it is the inventory of every surface the
    visual pass must look at.

---

## Measured contrast

WCAG 2.1 relative luminance over every token pair the components actually pair. Thresholds: **4.5**
for body text (1.4.3), **3.0** for UI boundaries and icons (1.4.11). Reproduced by task 2's script.

### Failures

| Pair | Light | Dark | Verdict |
|---|---|---|---|
| `textOnPrimary` on `bgPrimaryPressed` | 6.70 | **3.09** | **Real failure, dark only.** Task 3a. |
| `borderDefault` on `bgSurface` | **1.26** | **1.84** | **Real failure, both themes** — this is the `TextField`/`TextArea`/`SearchField`/`Dropzone` outline. Task 3b. |
| `borderDefault` on `bgCanvas` | **1.20** | **2.05** | Same control, on a screen background. Task 3b. |
| `borderStrong` on `bgSurface` | **1.69** | **2.68** | **Real failure** — `FilterChip.tsx:46`'s unselected outline and `SheetHeader.tsx:28`'s grabber. Task 3c. |
| `borderSubtle` on `bgSurface` | 1.20 | 1.24 | **Exempt.** Dividers are decorative (1.4.11 excludes purely decorative boundaries). No change. |
| `textDisabled` on `bgSurface` | 2.65 | 3.82 | **Exempt and phantom.** 1.4.3 excludes inactive components, and `textDisabled` has **zero consumers** (`Button.tsx:101` dims with `opacity.disabled` instead). No change. |
| `textInverse` on `bgOverlay` | 17.10 | 1.23 | **Phantom.** Nothing renders text on the overlay — `bgOverlay`'s only consumers are `BottomSheet.tsx:106` and `AttachmentViewer.tsx:56`, both bare backdrops. `textInverse` has zero consumers. No change. |

### Passing, but thin enough to name

`textMuted` on `bgSurfaceSunken` 4.59 light · `statusSuccess` on `bgSuccessSubtle` 4.56 light ·
`statusWarning` on `bgWarningSubtle` 4.78 light · `statusInfo` on `bgSurface` 4.54 dark ·
`tabActive` on `bgTabActive` 4.93 dark · `textOnPrimary` on `bgPrimary` 5.07 dark. All ≥ 4.5. **Do
not "improve" these** — they are inside the Figma mapping story 01 owns.

### Figure/ground, where contrast is not the test

| Observation | Light | Dark |
|---|---|---|
| `bgSurfaceSunken` vs `bgCanvas` | 1.06 | **1.00 — identical value** (`#0c1014`) |
| `bgSurfaceRaised` vs `bgSurface` | **1.00 — identical value** (`#ffffff`) | 1.24 |
| `bgTabActive` pill vs the bar it sits on | 1.16 | **1.08** |
| Every `StatusBadge` background against every other | 1.01–1.05 | 1.03–2.14 |
| `pending` vs `closed` background | **identical** | **identical** |
| priority `urgent` vs `high` | 1.25 | **1.00 — identical luminance** |
| priority `low` vs `bgSurface` | **1.26** | **1.84** |

`bgSurfaceRaised == bgSurface` in light means `SegmentedControl.tsx:32`'s track and `Avatar.tsx:20`'s
neutral variant have no visible ground on a white card. That is story 01's Figma mapping, not a
contrast failure — §Open questions 3.

---

## Product rules (from story)

| | Current behaviour | New behaviour |
|---|---|---|
| Status badge, `pending` | Filled pill, `bgSurfaceSunken`, `secondary` label | Filled pill, `bgSurfaceSunken`, `secondary` label — **unchanged** |
| Status badge, `closed` | Filled pill, `bgSurfaceSunken`, `muted` label — pixel-identical to `pending` | **Outlined** pill: `bgSurface` fill + a `borderInteractive` hairline, `muted` label. Distinguished by shape in both themes and by monochrome. |
| Ticket row rail, `low` | `borderDefault` — 1.26 / 1.84 against the card, effectively no rail | `borderInteractive` — 4.48 / 6.46, a visible neutral rail |
| Ticket row glyph | `alert` for **both** `urgent` and `high` | `alert` for `urgent`, `alertCircle` for `high` — the two colours that collide in dark now differ by glyph |
| Primary button, pressed, dark | `blue500`, label at 3.09 | new `blueLighter` primitive, label at 7.57 — and pressing now *brightens* rather than darkens, which is the correct direction on a dark ground |
| Input outline | `borderDefault` | `borderInteractive` |
| OS status bar | never set; follows the OS, not the app | follows `theme.scheme` |
| Navigator background | React Navigation `DefaultTheme` white | `theme.colors.bgCanvas` |
| Splash | one light frame | light + dark frames |

---

## Implementation tasks

### 0 — Decide the two questions this story cannot answer alone

Before touching code, put §Open questions 1 and 2 to design **as a pair**, with the measured table
above attached. Both have a defined fallback that ships if design does not answer:

- **`pending` has no status colour token.** Fallback: ship task 4's shape fix and leave `pending` on
  `bgSurfaceSunken`. **Do not** reuse `bgInternalSubtle`/`textInternal` — `colors.ts:56` says in
  writing they are *"Internal notes only — not a general-purpose purple"*.
- **Dark `statusDanger` and `statusWarning` have identical luminance.** Fallback: ship task 4's
  glyph fix, which satisfies 1.4.1 without a new hue.

Record both in `docs/phase1_known_issues.md` under a new `## TF-02 (SCRUM-13) — open with design`
heading, following the shape of the existing TF-01 entries at `:24-32`. **Do not silently tick
either criterion.**

---

### 1 — Verify the four criteria that already pass

No code change. Run these and write the results into the story's Done Criteria.

**File: none.** Read `ThemeProvider.tsx:84-130` and `bootstrap.ts:34-40` first so you know what you
are confirming.

1. **`:386` system preference on first launch.** Clear app data (`adb shell pm clear <pkg>`, or
   delete and reinstall on iOS). Set the OS to dark. Cold start. The app must open dark, with no
   light frame — `loadPersistedThemeMode()` returns `'system'` (`ThemeProvider.tsx:87`) and
   `Appearance.getColorScheme()` seeds `systemScheme` at `:102-104`.
2. **`:387` manual override persists across restart.** Profile → Theme → Light while the OS is dark
   (`ThemeSheet.tsx:34-38`). Force-kill. Cold start. Must reopen light.
3. **`:388` switches instantly with no restart.** In the same sheet, tap each of the three modes.
   Every surface must re-colour on the same frame. `ThemeSheet.tsx:16-20`'s comment is correct: the
   sheet re-themes while still open, and that is intended.
4. **OS theme change while a mode is pinned.** With mode pinned to `light`, flip the OS to dark. The
   app must **not** change — `ThemeProvider.tsx:119` ignores `systemScheme` unless mode is
   `'system'`, and `:124-127` memoises so the listener at `:106-111` does not re-render consumers.

---

### 2 — Make the contrast criterion a command

**Create file: `scripts/contrast-audit.ts`**

`scripts/` does not exist — create it. There is no test runner and no `tsx`/`ts-node`, so this
compiles with the installed `typescript` devDependency and runs on plain Node. Both the compile and
the run below were executed against this repo and work.

```ts
import { darkColors, lightColors, type ColorToken } from '../src/core/lib/theme/colors';

type Kind = 'text' | 'ui';
type Pair = { fg: ColorToken; bg: ColorToken; kind: Kind; where: string };

/** Pairs the components actually render together. Add a row when a component
 *  introduces a new one; do not enumerate the 39x39 matrix. */
const PAIRS: Pair[] = [
  { fg: 'textPrimary', bg: 'bgCanvas', kind: 'text', where: 'body on a screen background' },
  // ... the full list is the "Measured contrast" table in this plan
];

/** Pairs that fail a threshold but are exempt or unreachable. Each needs a reason
 *  and must be re-justified if a consumer ever appears. */
const EXEMPT: { fg: ColorToken; bg: ColorToken; reason: string }[] = [
  { fg: 'borderSubtle', bg: 'bgSurface', reason: 'decorative divider — WCAG 1.4.11 excludes' },
  { fg: 'textDisabled', bg: 'bgSurface', reason: 'inactive control — 1.4.3 excludes; zero consumers' },
  { fg: 'textInverse', bg: 'bgOverlay', reason: 'zero consumers — nothing renders text on the backdrop' },
];

function relativeLuminance(hex: string): number { /* sRGB, per WCAG 2.1 */ }
function contrast(a: string, b: string): number { /* (L1 + .05) / (L2 + .05) */ }
```

The script prints one line per pair per scheme and **exits `1`** if any non-exempt pair is under its
threshold (`4.5` for `text`, `3.0` for `ui`). Populate `PAIRS` from the §Measured contrast table —
every row there, both the failures and the thin passes.

Add a second block that asserts the **figure/ground** invariants, since those are not contrast
ratios:

- `darkColors.bgSurfaceSunken !== darkColors.bgCanvas` — **currently false**; this assertion is
  expected to fail and is the executable record of fact 4. Emit it as a **warning**, not an exit-1,
  with a comment pointing at fact 4 and §Open questions 1.
- `lightColors.bgSurfaceRaised !== lightColors.bgSurface` — same treatment, §Open questions 3.

**File: `package.json`** — add to `scripts`, beside `lint` and `typecheck`:

```json
"contrast": "tsc scripts/contrast-audit.ts --ignoreConfig --rootDir . --outDir .contrast-out --module commonjs --moduleResolution bundler --target es2022 --skipLibCheck && node .contrast-out/scripts/contrast-audit.js"
```

`--ignoreConfig` is **required**: `tsc` errors `TS5112` when a `tsconfig.json` is present and files
are named on the command line. `--moduleResolution bundler` is **required**: `colors.ts:1` imports
`'./primitives'` extensionless, which `nodenext` rejects and Node's own
`--experimental-strip-types` cannot resolve either. `--rootDir .` fixes the emit layout at
`.contrast-out/scripts/contrast-audit.js`; without it the path shifts with the input set.

**File: `.gitignore`** — add `.contrast-out/` under the `# typescript` block at `:31-32`.

---

### 3 — Fix the three real AA failures

#### 3a — Dark primary-pressed

**File: `src/core/lib/theme/primitives.ts`** — add one entry to the blue group (after `:34`
`blueLight`), the **only** primitive this story adds:

```ts
/** Dark-mode pressed state for `bgPrimary`. On a dark ground a press must
 *  brighten, not darken: pointing dark `bgPrimaryPressed` at `blue500` put
 *  `textOnPrimary` (`neutral1000`) at 3.09:1, under AA. 7.57:1 here. */
blueLighter: '#79a3f1',
```

**File: `src/core/lib/theme/colors.ts:71`** — change dark `bgPrimaryPressed` from
`primitives.blue500` to `primitives.blueLighter`. **Light `:15` is unchanged** — `blue600` at 6.70
already passes.

Three consumers pick this up with no edit: `Button.tsx:119`, `FAB.tsx:39`, `IconButton.tsx:65`.

#### 3b — Input outline

**Files:** `src/core/components/TextField.tsx`, `src/core/components/TextArea.tsx`,
`src/core/components/SearchField.tsx`, `src/core/components/Dropzone.tsx`.

In each, replace `theme.colors.borderDefault` with `theme.colors.borderInteractive` **only where the
value is the control's own resting outline**. Grep each file first — `borderDefault` may also appear
on a decorative divider inside the same component, and those stay.

`borderInteractive` is already light `neutral500` / dark `neutral450` (`colors.ts:30`, `:84`) —
4.48 and 6.46 against a card. **No token value changes.** This gives a dead token its first
consumers and leaves `borderDefault` as the decorative alias it should have been.

**Do not** raise `borderDefault` itself: `Button.tsx:130` uses it for the secondary button's outline
and `BottomSheet`/`CustomerForm`/`NotificationsSheet`/`PriorityChip`/`TicketDetailHeader`/
`CreateTicketScreen` all render it as trim. Repointing four call sites is the smaller change.

#### 3c — Chip and grabber outline

**File: `src/core/components/FilterChip.tsx:46`** — `borderStrong` → `borderInteractive`. The
unselected chip's border is the only thing identifying it as a control (`:24`'s comment describes
the pair), so 1.4.11 applies: 1.69/2.68 today, 4.48/6.46 after.

**File: `src/core/components/SheetHeader.tsx:28`** — leave `borderStrong`. The grabber is an
affordance, not a control boundary; the sheet is dismissible by tap and gesture without it. Add a
one-line comment saying so, so the next audit does not re-open it.

---

### 4 — Status and priority distinguishable in both themes

#### 4a — `closed` becomes an outlined pill

**File: `src/features/tickets/components/StatusBadge.tsx`**

Widen `statusStyle`'s return (`:17`) from `{ bg, tone }` to `{ bg, tone, outlined? }`:

```ts
export function statusStyle(
  status: TicketStatus,
  theme: Theme,
): { bg: string; tone: TextTone; outlined?: boolean } {
```

Change `:27-28` (`closed`) to:

```ts
case 'closed':
  // `pending` and `closed` both sit on `bgSurfaceSunken`, and in dark that
  // token IS `bgCanvas` — the two badges were the same invisible rectangle.
  // An outline separates them by shape, so it survives dark mode, greyscale
  // and colour-blindness alike. The colour half is with design (SCRUM-13
  // open question 1).
  return { bg: theme.colors.bgSurface, tone: 'muted', outlined: true };
```

`:23-24` (`pending`) is **unchanged**. In the render at `:38-47`, add when `outlined`:

```ts
borderWidth: StyleSheet.hairlineWidth,
borderColor: theme.colors.borderInteractive,
```

`textMuted` on `bgSurface` measures 5.10 light / 6.46 dark — both pass.

Replace `:11-16`'s doc comment: it claims *"the 35-token semantic palette has no purple"*, which
`colors.ts:57-59` and `:111-113` made false in story 07. State the real reason `pending` still has
no hue (design has not assigned one; the internal purple is reserved) and point at open question 1.

#### 4b — `low` priority gets a visible rail

**File: `src/features/tickets/priority.ts:14`** — `theme.colors.borderDefault` →
`theme.colors.borderInteractive`. 1.26/1.84 becomes 4.48/6.46. All three consumers
(`TicketRow.tsx:50`, `PriorityChip.tsx:60`, `TicketDetailHeader.tsx:49`) follow.

#### 4c — `urgent` and `high` get different glyphs

**File: `src/features/tickets/components/TicketRow.tsx:60-62`** — the ternary currently renders
`alert` for both. Dark `statusDanger` `#ffb4ab` and `statusWarning` `#ffb77c` are a 1.00 luminance
ratio, so in dark the rail and the glyph are the same pale wash for both priorities. Split them:

```tsx
{ticket.priority === 'urgent' || ticket.priority === 'high' ? (
  <Icon
    name={ticket.priority === 'urgent' ? 'alert' : 'alertCircle'}
    size={12}
    color={priorityColor(ticket.priority, theme)}
  />
) : null}
```

**Confirm `alertCircle` is in `Icon.tsx`'s `IconName` union (`:21-58`) and its glyph map (`:69`)
before writing it.** If it is absent, pick a present name that reads as a lesser alert and say which
in the commit message — **do not add an icon**, that is story 01's territory.

Update `:57-59`'s comment: it cites `docs/phase1_brd_1.md:610` and calls the single glyph an
interim. It now distinguishes the two colours that collide; say so, and say the third and fourth
priorities remain colour-only by design (they do not collide).

---

### 5 — The navigator stops painting white

**File: `src/app/_layout.tsx:69`**

`RootNavigator` is inside `ThemeProvider` (`:39` wraps `:42`), so it may call `useTheme()`. Add the
hook beside `useAuth()` at `:60` and set the background:

```tsx
<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.bgCanvas } }}>
```

Without it React Navigation falls back to its own `DefaultTheme`, whose `background` and `card` are
white — visible as a white wipe behind every push and, worst, behind the three
`presentation: 'modal'` screens at `:75-77`.

**File: `src/app/(auth)/_layout.tsx:4`** — the same `contentStyle` on the auth stack.

**File: `src/app/(tabs)/_layout.tsx:117`** — add `sceneStyle: { backgroundColor: theme.colors.bgCanvas }`
to the `Tabs` `screenOptions`. `TabsLayout` does **not** currently call `useTheme()` (only `BottomNav`
does at `:46`) — add the hook. **Check the Expo 57 bottom-tabs option name against
https://docs.expo.dev/versions/v57.0.0/ before writing it** (`sceneStyle` replaced the older
`sceneContainerStyle`); per `AGENTS.md`, do not rely on recall here.

---

### 6 — Status bar and splash

#### 6a — Status bar

**Create file: `src/core/components/ThemedStatusBar.tsx`**

`expo-status-bar` is a dependency (`package.json:24`) with no importer. A one-line component keeps
`app/` thin (hard rule 1) and keeps the theme read in `core/`:

```tsx
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/core/lib/theme';

/**
 * `app.json`'s `userInterfaceStyle: "automatic"` makes the OS bar follow the
 * *system*, not the app. With a manual override the two diverge — dark glyphs
 * on a dark surface, unreadable. This binds the bar to `theme.scheme` instead.
 */
export function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
```

Export it from `src/core/components/index.ts` alongside `OfflineBanner`, and render it in
`src/app/_layout.tsx` next to `<OfflineBanner />` at `:43` — inside `ThemeProvider`, so it re-renders
on every mode change.

#### 6b — Dark splash

**File: `app.json:37-45`** — add a `dark` sibling to the plugin's options object:

```json
[
  "expo-splash-screen",
  {
    "image": "./assets/brand/azm-mark.png",
    "imageWidth": 123,
    "resizeMode": "contain",
    "backgroundColor": "#f8f9fb",
    "dark": { "backgroundColor": "#0c1014" }
  }
]
```

`#0c1014` is `primitives.neutral1000`, matching dark `bgCanvas`. **Verify the `dark` key's exact
shape against https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/ before writing it.**

This is the second colour literal outside `primitives.ts`. `app.json` cannot import TypeScript, so
hard rule 2 has no reach here — `.squad/audits/design/00-index.md:146-148` already calls it a
permanent hole. Task 8 documents it in `CLAUDE.md` rather than pretending it is fixable. **Requires
a native rebuild** — Expo Go substitutes its own splash.

---

### 7 — The dark-mode visual pass

No code change unless it finds something. This is criterion 3 of the intake's design note, and
`docs/phase1_known_issues.md:24-28` records that the equivalent pass has never been made.

Walk **every** route in dark mode, on a device, with the mode pinned to `dark` (not `system`) so an
OS flip cannot mask a bug. The full set, from `src/app/`:

`(auth)/login` · `(auth)/forgot-password` · `(tabs)/index` · `(tabs)/tickets` · `(tabs)/customers` ·
`(tabs)/profile` · `tickets/[id]` (all three segments) · `tickets/new` · `customers/[id]` (Info,
Tickets, Notes) · `customers/new` · `customers/edit/[id]` · `notifications`

For each, check the four states story 01's `TF-05` components cover — loading (`Skeleton`), empty
(`EmptyState`), error (`ErrorState`), populated — plus every sheet reachable from it
(`ThemeSheet`, `LanguageSheet`, `NotificationsSheet`, the assign and status sheets, `BottomSheet`
backdrops, `AttachmentViewer`).

Six things the measurement says to look at specifically:

1. **`LoginScreen.tsx:46-47`'s brand PNG.** `assets/brand/azm-mark.png` is a fixed-colour raster on
   what is now a `neutral1000` canvas. If it is dark-on-transparent it disappears. Already flagged
   in `.squad/audits/design/00-index.md:159`.
2. **The `bgTabActive` pill** (`(tabs)/_layout.tsx:91`) — 1.08 against the bar. Expect it to be
   invisible; confirm, and attach the number to `colors.ts:106-109`'s existing flag.
3. **`SegmentedControl.tsx:32`'s track** — `bgSurfaceRaised` is 1.24 against `bgSurface` in dark and
   *identical* in light. Note which theme reads worse.
4. **`Skeleton.tsx:47`'s shimmer** — `bgSkeleton` `neutral800` to `bgSkeletonHighlight` `neutral700`.
   Confirm the sweep is perceptible on a dark card.
5. **Elevation.** `elevation.ts:50` builds dark shadows off `black`; a black shadow on a
   `neutral1000` canvas is nearly invisible, so raised surfaces may lose their separation. Check
   `FAB`, `BottomNav`, and any card using `e3`+.
6. **`OfflineBanner`** — `:15-18`'s comment says it deliberately avoids `textInverse` on
   `statusWarning`. Trigger it (airplane mode) in both themes and confirm the tinted-background
   choice still reads.

Write the result as a checklist in `docs/phase1_known_issues.md`. **A screen that passes gets a
line saying it passed** — an unwritten pass is indistinguishable from a pass that never happened,
which is exactly the state this story inherited.

---

### 8 — Correct the record

**File: `src/core/lib/theme/colors.ts:4`** — "35 semantic colour keys" → **39**.

**File: `CLAUDE.md`** — the "Hard rules" section, rule 2: *"`colors.ts` aliases the 35 semantic
tokens onto it"* → 39.

**File: `AGENTS.md`** — same correction wherever the count appears.

**File: `src/core/lib/theme/colors.ts:106-109`** — append the measured 1.08 to the existing
`bgTabActive` flag.

**File: `src/features/tickets/components/StatusBadge.tsx:11-16`** — replace the stale
"no purple exists" comment (task 4a).

**File: `.squad/audits/design/00-index.md`** — strike defects 2 and 3 from the `:85-100` list, or
annotate them `**Fixed** — see `(tabs)/_layout.tsx:63` (now `theme.elevation.e2`) and `app.json:37-45``.
Leaving them standing means the next reader re-fixes working code (fact 6).

**File: `docs/phase1_known_issues.md`** — add the `## TF-02 (SCRUM-13)` section from task 0, the
task 7 checklist, and one entry for the eslint hex-regex hole: the `^#…$` anchor at
`eslint.config.js:8` does not see a hex inside a template literal or an `rgba(...)` string.

**File: `CLAUDE.md`** — one sentence in "Entry and fonts" recording that `app.json` now carries
**two** colour literals (`:43` light, the new `dark.backgroundColor`) that hard rule 2 structurally
cannot reach, and that they must be kept in step with `primitives.neutral50`/`neutral1000` by hand.

---

## Edge Cases & Failure Modes

- **`Appearance.getColorScheme()` returns `null`** on a platform with no preference, and on web
  before hydration. `toScheme` (`ThemeProvider.tsx:58-60`) coerces anything that is not `'dark'` to
  `'light'`, so the app defaults light rather than crashing. Verified by reading; no change.
- **AsyncStorage read fails on first launch** (corrupt store, no permission).
  `loadPersistedThemeMode` (`:84-91`) catches and returns `'system'`. The write at `:116` is
  fire-and-forget: a failed persist costs the preference next launch and nothing else. Do not add a
  retry.
- **A stored value that is no longer a valid mode** (a downgrade, or hand-edited storage).
  `isThemeMode` (`:54-56`) rejects it and `:87` falls back to `'system'`. If task 0's fallback ever
  introduces a fourth mode, this guard is the one place to update.
- **OS theme flips mid-gesture, during a sheet animation.** `ThemeProvider`'s memo (`:124-127`)
  re-renders every consumer synchronously. `BottomSheet`'s backdrop opacity is an `Animated.Value`
  and is unaffected; the *colour* under it changes instantly. `ThemeSheet.tsx:16-20` documents this
  as intended. Confirm during task 7 that no sheet flashes its old palette for a frame.
- **`bgOverlay` equals dark `bgCanvas` if anyone "fixes" the sunken collision by moving the canvas
  to black.** Fact 4. `BottomSheet.tsx:106` and `AttachmentViewer.tsx:56` would render an invisible
  backdrop and the sheet would appear to float on nothing. Task 2's warning assertion exists so this
  is caught in CI rather than on a device.
- **The eslint hex rule does not fire on an interpolated colour.** `HEX_LITERAL`
  (`eslint.config.js:8`) anchors `^#…$` on a whole string literal, so `` `#${shade}` `` and
  `'rgba(26,86,219,0.5)'` both pass. Grep confirms the only non-hex colour string in `src/` today is
  `'transparent'` (six sites: `Button.tsx:125`, `FilterChip.tsx:47`, `IconButton.tsx:70`,
  `SegmentedControl.tsx:55`, `Tab.tsx:36`, `ReplyComposer.tsx:84`), which is theme-neutral and
  correct. Recorded in task 8; **not** fixed here — tightening the selector is a lint change with
  repo-wide blast radius.
- **`alertCircle` may not exist in the icon set.** Task 4c's fallback is explicit: pick a name
  already in `Icon.tsx:21-58` and record the substitution. Adding a glyph belongs to story 01.
- **Task 6b changes native config.** A half-applied state — `app.json` edited, no rebuild — shows
  the *old* splash while the JS reports the new theme. There is no runtime error; it just looks
  fixed and is not. Rebuild before judging.
- **`ThemeScope` (`ThemeProvider.tsx:151-161`) has no production caller.** Grep before task 3 to
  confirm that is still true. If a screen has started using it, every token change in this story
  needs checking inside that scope too, since its `setMode` is a no-op (`:153`).

---

## Test Plan

There is **no test runner in this repo** (`AGENTS.md`) — no Jest, no test files, no `test` script.
Do not add one for this story. The executable checks are the audit script and the two existing
gates; everything else is a written manual pass.

1. **`npm run contrast` (new, task 2)** — the automated half of criterion `:389`. Must exit `0` with
   every non-exempt pair at or above its threshold. Run it **before** task 3 to reproduce the three
   failures in §Measured contrast, and **after** to confirm they clear. If the before-run does not
   reproduce exactly those three, the `PAIRS` list is wrong — fix the list, not the tokens.
2. **`npm run contrast`, figure/ground block** — must emit exactly two warnings (dark
   `bgSurfaceSunken == bgCanvas`, light `bgSurfaceRaised == bgSurface`) and exit `0`. A third
   warning means a token change in task 3 or 4 collided something new.
3. **`npm run lint`** — must pass. Specifically it must **not** flag `primitives.ts:35`'s new
   `blueLighter`: `eslint.config.js:157-162` exempts that file. Then, as a positive control, paste
   `const x = '#ff0000';` into `src/core/components/Button.tsx`, confirm the rule **fires**, and
   remove it. Story 25 established this pattern — a lint rule that exists is not a lint rule that
   works.
4. **`npm run typecheck`** — must pass. `statusStyle`'s widened return (task 4a) is the only
   signature change; `ThemeColors` is derived from `lightColors` (`colors.ts:62`), so if task 3a
   mistyped the new key, `darkColors` fails to compile. That is the intended safety net.
5. **Manual, criterion `:386`** — task 1, step 1. Fresh install, OS dark, cold start opens dark.
6. **Manual, criterion `:387`** — task 1, step 2. Override to light, force-kill, reopens light.
7. **Manual, criterion `:388`** — task 1, step 3. All three modes switch on the frame.
8. **Manual, mode pinning** — task 1, step 4. OS flip with a pinned mode changes nothing.
9. **Manual, criterion `:390`** — open the Tickets tab in **both** themes with at least one ticket
   in each of the five statuses and each of the four priorities. `pending` and `closed` must be
   tellable apart; `urgent` and `high` must be tellable apart in dark. Screenshot both, convert to
   greyscale, and confirm both distinctions survive — that is the 1.4.1 check, and it is the only
   one that catches a hue-only fix.
10. **Manual, criterion `:391`** — `npm run lint` (test 3) plus `grep -rnE "#[0-9a-fA-F]{3,8}" src/ --include=*.ts --include=*.tsx | grep -v primitives.ts`, which must return nothing.
11. **Manual, task 7** — the full route sweep. Its output is a written checklist, not a pass/fail.
12. **Manual, task 5** — push `tickets/[id]` and present `tickets/new` in dark and watch the
    transition. No white wipe at any point.
13. **Manual, task 6a** — pin `dark` while the **OS is light**, and confirm the status-bar glyphs are
    light. This is the exact case `userInterfaceStyle: "automatic"` gets wrong and the only reason
    `ThemedStatusBar` exists.
14. **Manual, task 6b** — rebuild, set the OS dark, cold start, watch the splash. Requires a
    development build; **not** verifiable in Expo Go.

---

## Migration / Rollback

- **Token changes (3a, 3b, 3c, 4b) are alias moves plus one new primitive.** Rollback is reverting
  `colors.ts:71`, the four component files, `FilterChip.tsx:46` and `priority.ts:14`. No persisted
  data encodes a colour, so nothing on device needs migrating.
- **`ThemeMode`'s persisted values are unchanged.** `'light' | 'dark' | 'system'` under
  `azm.theme.mode` (`ThemeProvider.tsx:25`) is untouched, so a downgrade to a pre-story build reads
  the same store correctly. **Keep it that way** — task 0's fallback must not introduce a fourth
  mode without a migration.
- **Task 6b is the only change needing a rebuild.** Half-applied state: `app.json` edited without a
  rebuild shows the old light splash with no error. It is cosmetic and self-heals on the next build.
- **Task 2 adds a `scripts/` directory and a `.contrast-out/` ignore.** Both are additive. If the
  compile line proves brittle on another machine, delete the `contrast` script — nothing imports it.

---

## Verification Steps

1. **Gates run, in order, from the repo root:**
   ```bash
   npm run lint
   npm run typecheck
   npm run contrast
   ```
   All three must exit `0`. Run `npm run contrast` once **before** task 3 as well, to reproduce the
   three failures this plan claims.
2. **App runs:** `npm start`, then `a` (Android) or `i` (iOS). **Use the development build, not Expo
   Go** — story 25's `expo-updates` already requires one, and task 6b's splash is invisible in Expo
   Go regardless.
3. **Regression — the four already-passing criteria:** run task 1's four checks. These are what a
   token change is most likely to break silently.
4. **Regression — light mode.** Every token change in tasks 3 and 4 except 3a touches **both**
   schemes. Walk the Tickets tab, a ticket detail, and the customer form in **light** and confirm
   the heavier input outline and the outlined `closed` pill still read as designed, rather than
   turning `TextField` into a boxed control that no Figma frame shows.
5. **Regression — RTL.** Task 4a adds a border to `StatusBadge` and task 4c changes a glyph inside a
   row that mirrors. Run the Tickets tab in Arabic, both themes, and confirm the badge outline and
   the alert glyph land on the correct side. Story 25 owns the direction machinery; this is only
   checking that the new pixels respect it.
6. **The dark sweep:** task 7, written up in `docs/phase1_known_issues.md`.

---

## Done Criteria

- [ ] **`:386`** System preference applied on first launch — verified on a fresh install with the OS
      in dark (task 1, step 1).
- [ ] **`:387`** Manual override persists across restart — verified by force-kill (task 1, step 2).
- [ ] **`:388`** Theme switches instantly with no restart — all three modes, same frame (task 1,
      step 3); and a pinned mode ignores an OS flip (task 1, step 4).
- [ ] **`:389`** All text and interactive elements meet WCAG AA in both themes — `npm run contrast`
      exits `0`, with the three exemptions justified in the script and the three real failures fixed
      by task 3.
- [ ] **`:390`** Status and priority colours remain distinguishable in both themes — `pending` and
      `closed` differ by shape (task 4a), `urgent` and `high` differ by glyph (task 4c), `low` has a
      visible rail (task 4b), and the greyscale screenshot check (test 9) passes.
- [ ] **`:391`** No hardcoded colour literals in component code — `npm run lint` passes, the hex grep
      returns nothing, and the rule is confirmed to **fire** (test 3). The two `app.json` literals
      are documented as out of reach, not silently ignored.
- [ ] `scripts/contrast-audit.ts` is checked in, wired to `npm run contrast`, and covers every pair
      in §Measured contrast.
- [ ] The OS status bar, the three navigators and the splash all follow the theme (tasks 5, 6).
- [ ] Every route in task 7's list has been opened in dark mode and has a written line saying what
      was found — including the ones that passed.
- [ ] Task 0's two design questions are recorded in `docs/phase1_known_issues.md` with the measured
      numbers attached, and neither criterion is ticked on the strength of a fallback alone.
- [ ] The stale record is corrected: the 35→39 count in three files, the `StatusBadge` purple
      comment, and the two already-fixed defects in `.squad/audits/design/00-index.md`.

---

## Open questions

1. **`pending` has no status colour token, and `closed` shares its surface.** Task 4a separates them
   by shape; that closes the accessibility criterion but not the design one. Design owns whether
   `pending` gets a hue. `bgInternalSubtle`/`textInternal` measure well for the job (5.65 light /
   8.97 dark) but `colors.ts:56` reserves them for internal notes — **reusing them is a design
   decision, not an implementation shortcut.** Already logged as a design-audit finding.
2. **Dark `statusDanger` `#ffb4ab` and `statusWarning` `#ffb77c` have identical relative luminance**
   (ratio 1.00). Task 4c satisfies 1.4.1 with a glyph, but the two pale pastels remain
   indistinguishable in greyscale and to a deuteranope. Options measured, all keeping ≥ 8:1 against
   the dark card: warning → `#ffd88a` (1.25 vs danger), `#ffe08a` (1.32), or danger → `#ff8a80`
   (1.34). None reaches 3:1; a dark palette cannot separate two light pastels that far. **Design
   picks, or the glyph stands alone.**
3. **Light `bgSurfaceRaised` is identical to `bgSurface`** (both `neutral0` `#ffffff`,
   `colors.ts:11-12`), so `SegmentedControl.tsx:32`'s track and `Avatar.tsx:20`'s neutral variant
   have no ground on a white card. This is the Figma mapping story 01 owns, not a contrast failure —
   raised is meant to read by elevation, and `elevation.ts` supplies it. Task 2's second warning
   records it. **Confirm with design that elevation alone is the intended separation** before anyone
   changes the alias.
4. **Dark `bgTabActive` is 1.08 against the bar.** `colors.ts:106-109` already says Figma specifies
   the pill in light mode only and that the dark value is a placeholder. The measurement now says
   the placeholder is invisible. Design owes a dark pill value or an explicit "no pill in dark".

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 27.**
