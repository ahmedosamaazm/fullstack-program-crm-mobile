# Tickets — Change Status (Sheet) — design audit

**Figma:** `7:4232` (sheet subtree `126:1024`) · **Code:** `src/features/tickets/components/ChangeStatusSheet.tsx`
**Verdict:** minor drift

## Summary

The sheet's own composition is faithful: structure, order, gaps, radii and the option-row
treatment all map onto the tokens Figma bound, and every deviation the story plan predicted
(no note field in Figma, no `Selected` variant on `StatusOption`, missing descriptions for
`open`/`closed`) is present exactly as planned. The real drift is inherited from two shared
primitives rather than authored here — `StatusBadge` renders at `caption` (12px, sentence case)
where Figma specifies a 10px uppercase tracked pill, and `BottomSheet`/`SheetHeader` pad their
content to `spacing.xl` (24) where every Figma child of the sheet is `spacing.lg` (16). The single
most important fix is the badge typography, because it is wrong on every screen that shows a
status, not just this one. The sheet's status colours are consistent with the badge everywhere
(it renders the component, adds no second map), so the inconsistency this audit was asked to hunt
for does not exist.

## Findings

### 1. `StatusBadge` type ramp is one step too large and drops uppercase + tracking — `major`
- **Axis:** token fidelity
- **Figma:** `35:18` — every variant's label is `10px` / SemiBold / `uppercase` / `tracking 0.25px`;
  pill padding `px 6` / `py 2`, `radius 999`.
- **Code:** `StatusBadge.tsx:45-47` uses `variant="caption"` (12/18 per `typography.ts:98`) with no
  `textTransform` and no `letterSpacing`; `StatusBadge.tsx:41` uses `paddingHorizontal: theme.spacing.sm`
  (8, vs Figma 6). `paddingVertical: theme.spacing.xxs` (2) and `radius.full` are correct.
- **Fix:** switch the label to `variant="overline"` (10/16, `typography.ts:99` — currently unused
  anywhere) and add `textTransform: 'uppercase'`; leave tracking off or route it through a token —
  `0.25` is off the `tracking` scale (`normal 0` / `wide 0.6`) and uppercase+tracking in Arabic is
  §15 flag 3, so do not hard-code it.

### 2. `new` status pill resolves to a near-white surface, not Figma's tinted blue — `major`
- **Axis:** token fidelity
- **Figma:** `Status=New` → bg `#d6e4ff`, text `#1a3f8f` — a clearly tinted blue chip.
- **Code:** `StatusBadge.tsx:21` returns `bg: theme.colors.bgPrimarySubtle`, which is
  `bluePrimarySubtleLight` = `#f4f7ff` (`primitives.ts:36`) — visually white against
  `bgSurface` `#ffffff`. `colors.ts:52-54` already records this exact problem for the tab pill
  ("near-white and leaves the pill invisible") and solved it with a dedicated primitive.
- **Fix:** add a `bgInfoSubtle`-style primitive at Figma's `#d6e4ff` (with a dark counterpart) and
  point `new` at it, the way `blueTabPillLight` was added, rather than reusing `bgPrimarySubtle`.
- **Note:** this badge does not appear in frame `7:4232` itself (current status is `open`), but the
  sheet renders it whenever the ticket is `new`.

### 3. Sheet content is padded to 24 where Figma pads to 16 — `major`
- **Axis:** token fidelity / structure
- **Figma:** every child of `126:1024` sits on `px spacing.lg` (16) — `Titlebar`
  (`I126:1025;121:990`), `CurrentStatus` `126:1030`, `Options` `126:1034`, `Footer` `126:1045`.
- **Code:** `BottomSheet.tsx:141` wraps children in `paddingHorizontal: theme.spacing.xl` (24), and
  `SheetHeader.tsx:39` pads the titlebar to `theme.spacing.xl` (24). The option rows are therefore
  16px narrower than designed and the title is inset 8px too far.
- **Fix:** change both to `theme.spacing.lg`. Shared primitive — check the other two sheets
  (Assign agent, Language) in the same change.

### 4. Backdrop opacity is `0.6`; Figma binds `colors.overlay` at alpha `0.4` — `minor`
- **Axis:** token fidelity / dark theme
- **Figma:** `colors.overlay` = `#181c2266` on `SheetBackdrop` `126:1023` — `#181c22` (= `neutral900`)
  at `0x66` ≈ **0.40**.
- **Code:** `BottomSheet.tsx:57` animates the backdrop to `theme.opacity.strong` (0.6,
  `layout.ts:34`). The base colour is right (`bgOverlay` = `neutral900`); only the alpha is off, and
  `opacity.medium` (0.4) is the exact match already on the scale.
- **Fix:** animate to `theme.opacity.medium`.

### 5. Grabber is 40px wide on `borderStrong`; Figma is 36px on `borderDefault` — `minor`
- **Axis:** token fidelity
- **Figma:** `Grip` `I126:1025;121:989` — `w 36`, `h 4`, `radius.full`, fill
  `colors.borderDefault` `#e3e5ea` (= `neutral300`).
- **Code:** `SheetHeader.tsx:68` (`styles.handle`) is `width: 40`, and `SheetHeader.tsx:28` fills it
  with `theme.colors.borderStrong` (`neutral400` `#c4c7cf`) — one step darker. `BottomSheet.tsx:154`
  duplicates the same 40/`borderStrong` handle for the untitled case.
- **Fix:** 36 wide, `theme.colors.borderDefault`, in both places.

### 6. `closed` badge sits one neutral step off Figma in both fill and text — `minor`
- **Axis:** token fidelity
- **Figma:** `Status=Closed` → bg `#e8ebf0` (= `neutral200` = `borderSubtle`), text `#44474f`
  (= `neutral700` = `textSecondary`).
- **Code:** `StatusBadge.tsx:29` returns `bg: theme.colors.bgSurfaceSunken` (`neutral100` `#f0f3f8`)
  and `tone: 'muted'` (`textMuted` = `neutral550` `#6b6e76`) — a paler chip with lighter text.
- **Fix:** either accept (both are legitimate semantic tokens and nothing else fills a chip at
  `neutral200`) or move `closed` to `tone: 'secondary'`, which costs nothing and matches Figma
  exactly. Low stakes — but note `pending` already uses `tone: 'secondary'` on the same fill, so the
  two are currently distinguished only by text colour.

### 7. Option-row border is a hairline where Figma specifies 1px — `minor`
- **Axis:** token fidelity
- **Figma:** `StatusOption` `126:1035` — `border 1px solid colors.border` (`#e8ebf0` = `borderSubtle`),
  `radius.md`, `p spacing.md`, `gap spacing.md`, `bg colors.surface`. Every other value matches.
- **Code:** `StatusOption.tsx:39` uses `StyleSheet.hairlineWidth` (≈0.33–0.5px) when unselected.
  Same pattern in `TextArea.tsx:103` for the note box, which Figma does not design at all (see
  finding 10).
- **Fix:** `borderWidth: selected ? 1.5 : 1`. Cosmetic, but the rows read fainter than designed on
  3x screens.

### 8. `TextArea`'s footer gap is a raw `8` — `minor`
- **Axis:** token fidelity
- **Figma:** n/a (the note field is not in this frame) — but the value shadows `spacing.sm`.
- **Code:** `TextArea.tsx:104` — `footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }`
  inside a `StyleSheet.create`, so it cannot read the theme.
- **Fix:** move the gap onto the inline style object with `theme.spacing.sm`.

### 9. `pending` still ships neutral although a purple pair now exists — `flag`
- **Axis:** token fidelity / open design flag
- **Figma:** `Status=Pending` → bg `#ede7f6`, text `#4a3580` — lavender.
- **Code:** `StatusBadge.tsx:29`/`:14-19` ship `bgSurfaceSunken` + `tone: 'secondary'`, and the header
  comment justifies it with *"the 35-token semantic palette has no purple"*. That premise is now
  stale: story 07 added `bgInternalSubtle` (`purpleSubtleLight` `#f3eef9`), `textInternal`
  (`purple500` `#6750a4`) and dark counterparts (`colors.ts:56-59`, `:111-113`) — visually within a
  few percent of Figma's pending pair.
- **Action:** this is story 09 open question 1 and `colors.ts:56` explicitly scopes the purple to
  internal notes ("not a general-purpose purple"), so **do not** silently repoint `pending` at it.
  Take it back to design as one question: does `pending` get its own purple status pair, or does the
  existing internal-notes purple become a shared hue? Until then the neutral interim stands, and
  `pending` and `closed` remain visually near-identical in the picker.

### 10. Disabled / loading states on the option rows and the note field are invented — `flag`
- **Axis:** states / open design flag (§15 flag 6)
- **Figma:** `StatusOption` `123:1020` has a single variant axis, `Status`; there is no `Disabled`
  and no `Selected`. `Button`, `TextArea` and `TextField` likewise have no error/disabled/loading
  variants in the file — that is §15 flag 6 verbatim.
- **Code:** `StatusOption.tsx:44` dims the row to `theme.opacity.disabled` while the mutation is in
  flight; `TextArea.tsx:82` and `Button.tsx:101` do the same. Consistent with each other and with the
  rest of the app, but not read off Figma.
- **Action:** send the disabled/loading treatment back so Figma gains the variants. Not a defect.

### 11. Illegal transitions are hidden, not shown disabled — `intentional`
- **Axis:** states
- **Figma:** frame `7:4232` is drawn with `Current status: OPEN` and exactly two options —
  `PENDING` and `RESOLVED`. It designs **no** disabled/unavailable row for `new` or `closed`, i.e.
  the design itself only ever renders reachable states.
- **Code:** `ChangeStatusSheet.tsx:32` derives options from `allowedTransitions(currentStatus)`
  (`state-machine.ts:17-19`), which returns `['pending', 'resolved']` for `open` — the frame's two
  rows exactly. Nothing is rendered disabled-but-visible.
- **Note:** design and code agree; the story plan's rule ("only legally reachable states are
  offered") is the same rule. Recorded so the next audit does not re-open it.

### 12. Resolution-note `TextArea` has no counterpart in Figma — `intentional`
- **Axis:** structure / states
- **Figma:** the sheet is 288px tall with exactly four children (`SheetHeader`, `CurrentStatus`,
  `Options`, `Footer`). No input of any kind.
- **Code:** `ChangeStatusSheet.tsx:84-97` inserts a required `TextArea` (`maxLength 500`,
  `showCounter`) between Options and Footer whenever the target is `resolved`, growing the sheet by
  roughly 150px.
- **Note:** required by BRD `:703` and API §4.9; story plan task 1 "Missing thing 1" / flag 1 owns it.
  The grown layout is still a layout the designer has not seen — see *Needs a visual check*.

### 13. Selected treatment on `StatusOption` is invented — `intentional`
- **Axis:** states
- **Figma:** no `Selected` axis on `123:1020`.
- **Code:** `StatusOption.tsx:39-42` — `borderWidth 1.5` + `borderColor: borderFocus` +
  `backgroundColor: bgPrimarySubtle`, plus `accessibilityRole="radio"` and
  `accessibilityState={{ checked }}` (`:31-32`).
- **Note:** story plan task 6 / flag 2. The component's own header comment records it honestly.

### 14. Terminal (`closed`) empty state is not in Figma — `intentional`
- **Axis:** states
- **Code:** `ChangeStatusSheet.tsx:67-68` renders `<EmptyState icon="lock" …>` and hides the footer
  when `allowedTransitions` is empty.
- **Note:** story plan task 7 requires it ("must not crash… not an empty white sheet with a dead
  button"). Unreachable from the UI because the header button is already disabled there.

## Verified correct

- **Sheet colours match the badge exactly** — the audit's headline question. `ChangeStatusSheet` and
  `StatusOption` contain **no** status→colour map; both render `<StatusBadge>` (`ChangeStatusSheet.tsx:64`,
  `StatusOption.tsx:46`), which is the single source (`StatusBadge.tsx:17-31`). Findings 1/2/6/9 are
  badge-wide, not sheet-vs-badge inconsistencies.
- **Structure and order** match `126:1024` child-for-child: header → current-status row → options →
  (note) → footer → error line.
- **Spacing tokens** in the sheet body: current-status `gap spacing.sm` + `marginBottom spacing.md`
  (`ChangeStatusSheet.tsx:60`) vs Figma `gap sm`, `pt md`/`pb sm`; options `gap spacing.sm`
  (`:71`) vs Figma `gap sm`; option `p spacing.md` / `gap spacing.md` / `radius.md`
  (`StatusOption.tsx:36-38`) — all exact.
- **Sheet chrome geometry:** `borderTopStartRadius`/`borderTopEndRadius` = `theme.radius.xl` (20)
  (`BottomSheet.tsx:117-118`) matches Figma `radius.xl`; `bgSurface` fill matches `colors.surface`;
  `SheetHeader`'s bottom hairline uses `borderSubtle` = `neutral200` = Figma `colors.border #e8ebf0`
  (`SheetHeader.tsx:41`); title is `variant="heading"` (18/26) SemiBold with `tracking.tight` (-0.3)
  (`SheetHeader.tsx:46-51`) — matches `fontSize.lg`/`lineHeight.lg`/`tracking.tight` exactly.
- **Footer button:** `Button variant="primary" fullWidth` (`ChangeStatusSheet.tsx:100-107`) →
  `HEIGHT 56`, `radius.md`, `px spacing.xl`, `bgPrimary`, label `body`(16/24) SemiBold `textOnPrimary`
  (`Button.tsx:34,96-111`) — matches `126:1046` on every bound value.
- **Row copy tokens:** description is `caption` (12/18) `tone="secondary"` with `flex: 1`
  (`StatusOption.tsx:47-49`, `:56`) vs Figma `fontSize.xs`/`lineHeight.xs`/`colors.textSecondary`
  flex-1; "Current status:" is `caption`/`tone="muted"` (`ChangeStatusSheet.tsx:61`) vs Figma
  `fontSize.xs`/`textMuted`. Exact.
- **RTL:** no physical props anywhere in `ChangeStatusSheet.tsx`, `StatusOption.tsx`,
  `StatusBadge.tsx`, `SheetHeader.tsx`; only `gap`, `padding`, `paddingHorizontal` and
  `borderTopStart/EndRadius`. No directional icon in the sheet.
- **Dark theme:** every colour is read via `useTheme()`; no hex outside `primitives.ts`; no
  light-only branch. One caveat under *Needs a visual check*.
- **State machine:** `TRANSITIONS` (`state-machine.ts:12-18`) matches BRD §6 row-for-row
  (`new→[open]`, `open→[pending,resolved]`, `pending→[open,resolved]`, `resolved→[closed,open]`,
  `closed→[]`), and the sheet consumes it without adding a list (`ChangeStatusSheet.tsx:32`).
  `requiresResolutionNote` gates both the field (`:47`) and submit (`:48`).

## Needs a visual check

- **The grown sheet.** With the note field visible the content is header + status row + 2 options +
  108px box + label + counter + 56px button. `BottomSheet` caps at `screenHeight * 0.9`
  (`BottomSheet.tsx:120`) but renders children in a plain `View` (`:141`) — there is no `ScrollView`
  and no `KeyboardAvoidingView`. On a small device with the keyboard up, the **Update status** button
  may be pushed off-screen and unreachable. Cannot be determined statically; exercise
  `resolved` on the smallest supported device before closing this out. Related to story plan flag 1.
- **Dark-mode `pending`/`closed` pills.** Both resolve to `bgSurfaceSunken`, which in dark is
  `neutral1000` — *darker* than the sheet's `bgSurface` (`neutral900`). The pills will read as
  punched-out holes rather than tinted chips. Needs an eye on a dark build; folds into finding 9's
  question to design.
