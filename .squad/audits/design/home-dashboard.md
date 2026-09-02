# Home - Dashboard — design audit

**Figma:** `7:8` (body `7:13`) · **Code:** `src/features/home/screens/HomeScreen.tsx`
**Verdict:** major drift

## Summary

Structure, order and behaviour are faithful — every section Figma draws is present, in the right
order, built from the right components, with clean logical-layout props and no hex literals. The
drift is almost entirely in the **surface layer**: Figma composes this screen as white bands (a
header block and two list bands, each hairline-bordered) floating on the grey canvas, and the app
renders every one of them directly on `bgCanvas` with no surface, no border and no elevation. That
one omission changes the read of the whole screen and is the single most important fix. Behind it
sits a second cluster: `StatCard` was built against a **stale** Figma spec recorded in story 03's
plan table (radius 12 / 32px circular chip / 24px value), and the live component `36:40` now
specifies radius 16, a 26px rounded-square chip and a 19px value. The notification badge dot
(`7:44`) is designed and not implemented, and `BottomNav` re-introduces the white-shadow-in-dark bug
that story 01's verification list exists to catch.

## Findings

### 1. The two ticket-list bands have no surface — rows sit directly on the canvas — `blocker`
- **Axis:** structure & order / token fidelity
- **Figma:** `7:78` and `7:217` are `bg white` containers with a `1px #e8ebf0` (`borderSubtle`)
  border top **and** bottom; each `TicketRow` inside is itself `bg white`, `rounded-[14px]`,
  `drop-shadow 0 2 4 rgba(15,23,41,0.06)`. Net read: a white list band on a grey canvas.
- **Code:** `src/features/home/screens/HomeScreen.tsx:124` and `:152` — the row wrappers are bare
  `View`s carrying only `paddingHorizontal`. `src/features/tickets/components/TicketRow.tsx:37-46`
  sets no `backgroundColor`, no `borderRadius` and no elevation. Every row therefore renders on
  `bgCanvas` (`#f8f9fb`).
- **Fix:** wrap each section's rows in a `View` with `backgroundColor: theme.colors.bgSurface` plus
  `borderTopWidth`/`borderBottomWidth: StyleSheet.hairlineWidth` in `borderSubtle`, and give
  `TicketRow` `backgroundColor: bgSurface` + `borderRadius: radius.lg` + `theme.elevation.e1`.

### 2. The header block is not a surface either, and `StatCard` has no border or elevation — `major`
- **Axis:** token fidelity
- **Figma:** `7:32` is `bg white`, `px 16 / pt 10 / pb 14`, with a `1px #e8ebf0` bottom border, and
  it contains **both** the greeting and the stats row. Each `StatCard` (`50:2`) is
  `border 1px #eff1f5` + `drop-shadow 0 3 6 rgba(15,23,41,0.1)`, i.e. white-on-white separated by a
  hairline and a shadow.
- **Code:** `src/features/home/components/HomeHeader.tsx:41` and
  `src/features/home/components/StatsRow.tsx:22-27` — neither wrapper sets a background or a border;
  the block inherits `bgCanvas` from `HomeScreen.tsx:84`.
  `src/features/home/components/StatCard.tsx:29-37` sets `bgSurface` but no `borderWidth` and no
  `theme.elevation.*`.
- **Fix:** give the greeting + stats block one `bgSurface` wrapper with a `borderSubtle` bottom
  hairline, and add `borderWidth: StyleSheet.hairlineWidth` in `borderSubtle` plus
  `theme.elevation.e1` to `StatCard`.

### 3. `StatCard` was built against a stale Figma spec — four values now disagree — `major`
- **Axis:** token fidelity
- **Figma** (`50:2` / component `36:40`, read live): card `rounded-[16px]`, `px 8 / py 11`, `gap 5`;
  icon chip `26 x 26`, `rounded-[9px]` (a squircle, **not** a circle), icon `14`; value `19px`
  SemiBold `tracking -0.4`; label `10px` Regular `#74777f`.
- **Code:** `src/features/home/components/StatCard.tsx:35` `borderRadius: theme.radius.md` (12),
  `:35-36` `padding: spacing.md` (12) / `gap: spacing.sm` (8), `:42` chip `32 x 32` with
  `radius.full`, `:45` icon `18`, `:50` `variant="title"` (22/28) `weight="bold"`, `:54`
  `variant="caption"` (12/18).
- **Note:** story 03's design table (`03-story-home-workload-summary-SCRUM-37.md:75-79`) records the
  Figma values as "radius 12 / 32 circle / 24 bold / 11.5" — those numbers no longer match the file,
  so this is drift, not a plan-justified deviation. The plan's *token-snapping policy* still holds.
- **Fix:** `radius.lg` (16), `padding: spacing.sm`/`md` split, `gap: spacing.xs`, chip `26` on
  `radius.sm`/`md` with a 14px icon, value on `variant="heading"` (18/26) SemiBold with
  `tracking.tight`, label on `variant="overline"` (10/16). Confirm the chip-shape change (circle →
  squircle) with design before landing it.

### 4. The notification bell's unread badge dot is designed and absent — `major`
- **Axis:** structure & order / states
- **Figma:** `7:44` — an `8px` `#ba1a1a` (`statusDanger`) dot with a `1px` white ring, absolutely
  positioned at the bell's top-trailing corner. Story 03's own structure diagram names it
  (`03-story-...-SCRUM-37.md:57`, "7:44 badge dot").
- **Code:** `src/features/home/components/HomeHeader.tsx:58-63` renders a bare `IconButton` with no
  badge affordance; `IconButton` (`src/core/components/IconButton.tsx:34-55`) has no badge prop.
- **Fix:** add an optional `badge?: boolean` to `IconButton` (dot in `statusDanger`, ring in
  `bgSurface`, `top`/`end` anchored so it mirrors in RTL) and drive it from the unread count when
  notifications land; until then it is dead design, so file it rather than fake it.

### 5. `BottomNav` casts a white shadow in dark mode — `major`
- **Axis:** dark theme
- **Figma:** `49:34` — `drop-shadow 0 -2 8 rgba(15,23,41,0.08)`, i.e. a dark shadow in both palettes.
- **Code:** `src/app/(tabs)/_layout.tsx:63` — `shadowColor: theme.colors.textPrimary`. In
  `darkColors` that token is `neutral50` (`#f8f9fb`), so the bar gets a light halo. This is the exact
  bug story 01's verification step 4 was written to catch on the FAB
  (`design-system/01-...md`, Verification §4: *"view the FAB in dark mode (shadow dark, not white)"*).
- **Fix:** compose from `theme.elevation.e2` (already `neutral900`/`black`-backed) and override only
  `shadowOffset` to `{ width: 0, height: -2 }`, instead of hand-picking a text token as a shadow.

### 6. The Claim button is a hand-rolled `Pressable`, not a `core/components` primitive — `major`
- **Axis:** component identity
- **Figma:** `I52:164;46:19` — a blue pill, `px 10 / py 4`, `radius 999`, label `10.5px` SemiBold
  white, `tracking 0.2`.
- **Code:** `src/features/tickets/components/TicketRow.tsx:71-95` re-implements a filled pill inline
  (background, radius, padding, disabled opacity, its own `ActivityIndicator`), duplicating what
  `Button variant="primary"` already owns. Story 03's design table
  (`03-story-...-SCRUM-37.md:85`) explicitly prescribes `<Button variant="primary" size="sm">` — but
  `Button` has no `size` prop and is hard-coded to `HEIGHT = 56`
  (`src/core/components/Button.tsx:34`), so the prescription was unimplementable.
- **Fix:** add a `size?: 'sm' | 'md'` (and a `pill` shape) to `Button` and use it here — the same pill
  recurs elsewhere, and a second hand-rolled copy is how the design system starts drifting.
- **Secondary drift, same element:** `paddingVertical: spacing.xxs` (2) vs Figma 4,
  `paddingHorizontal: spacing.md` (12) vs 10, label on `variant="caption"` (12/18) vs 10.5/11.

### 7. `StatusBadge` label is the wrong size and drops Figma's uppercase + tracking — `minor`
- **Axis:** token fidelity
- **Figma:** every badge instance (`I52:63;46:23;35:4` and siblings) — `10px` SemiBold, `uppercase`,
  `tracking 0.25`.
- **Code:** `src/features/tickets/components/StatusBadge.tsx:49` — `variant="caption"` (12/18), no
  `textTransform`, no `letterSpacing`.
- **Fix:** `variant="overline"` (10/16) with `textTransform: 'uppercase'`; leave the tracking to the
  §15 flag 3 decision below, since it is the same Arabic-tracking question.

### 8. `bgPrimarySubtle` is too pale to read as the `NEW` badge fill — `minor`
- **Axis:** token fidelity / dark theme
- **Figma:** `NEW` badge fill `#d6e4ff` on `#1a3f8f`; `OPEN` `#fff0e0` on `#7a3600`; `RESOLVED`
  `#e8f5e9` on `#1b5e20`.
- **Code:** `src/features/tickets/components/StatusBadge.tsx:20` maps `new` to `bgPrimarySubtle`,
  which is `#f4f7ff` (`primitives.ts:36`) — near-white, so the pill effectively disappears. The
  file already contains a correctly-saturated blue tint, `blueTabPillLight` `#e3ebfb`
  (`primitives.ts:41`). `bgWarningSubtle` (`#fff4ec` vs Figma `#fff0e0`) and `bgSuccessSubtle`
  (exact match) are fine.
- **Fix:** either promote a `bgInfoSubtle` semantic token onto `blueTabPillLight`, or re-point
  `bgPrimarySubtle` — the latter has other consumers, so prefer the former.

### 9. Section top spacing is one flat value where Figma uses two — `minor`
- **Axis:** structure & order
- **Figma:** `7:70` (My tickets) `pt 8`; `7:209` (Unassigned) `pt 16`; each `SectionHeader` then adds
  `py 10`.
- **Code:** `src/features/home/screens/HomeScreen.tsx:104` and `:132` — both sections use
  `marginTop: theme.spacing.xl` (24), so the first section sits ~14px lower than designed and the
  second ~8px lower.
- **Fix:** `spacing.sm` on the first section and `spacing.lg` on the second.

### 10. `SectionHeader`'s "View all" is SemiBold where Figma binds Medium — `minor`
- **Axis:** token fidelity
- **Figma:** `36:14` — `font weight/500`, `colors.link`, 12/18.
- **Code:** `src/core/components/SectionHeader.tsx:49` — `weight="semibold"`.
- **Fix:** `weight="medium"`. (The label's own SemiBold/uppercase/`tracking.wide` is correct and
  plan-documented.)

### 11. The greeting drops Figma's `tracking -0.3` — `minor`
- **Axis:** token fidelity
- **Figma:** `7:36` — 22/27.5 SemiBold with `letter spacing/-0_3`, and `tracking.tight` exists in the
  scale (`typography.ts:26`).
- **Code:** `src/features/home/components/HomeHeader.tsx:46` — `variant="title" weight="semibold"`
  with no `letterSpacing`.
- **Fix:** `style={{ letterSpacing: theme.tracking.tight }}`.

### 12. FAB horizontal inset is 24 where Figma places it at 16 — `minor`
- **Axis:** token fidelity
- **Figma:** `50:35` at `x 315.72`, `w 56`, inside a `387.69` container → trailing inset ≈ **16**
  (`spacing.lg`); vertical gap to `BottomNav`'s top edge ≈ **12**.
- **Code:** `src/core/components/FAB.tsx:35` — `end: theme.spacing.xl` (24). The vertical position
  (`HomeScreen.tsx:181` `bottomOffset={spacing.xxxl}` → 8px above the 64px bar) is 4px tight.
- **Fix:** `end: theme.spacing.lg`; bump `bottomOffset` by `spacing.xs`. The 56px diameter
  (`hitSlop + spacing.md`) is exact — leave it.

### 13. Tab labels are 10px and read their colour from text tokens, not the tab tokens — `minor`
- **Axis:** token fidelity / dark theme
- **Figma:** `49:8` / `49:17` — `11px` Medium, active `#1a56db`, inactive `#74777f`.
- **Code:** `src/app/(tabs)/_layout.tsx:100-104` — `variant="overline"` (10px) with
  `tone={isFocused ? 'link' : 'muted'}`. `link` resolves to `textLink`, which in `darkColors` is
  `blueLinkDark` `#8baee8`, while the icon two lines above uses `tabActive` = `blueLight` `#4e80e8`
  — so in dark mode the active tab's icon and label are **two different blues**.
- **Fix:** colour the label with `theme.colors.tabActive` / `theme.colors.tabInactive` (the tokens
  that exist for exactly this) rather than `tone`, and raise the 10-vs-11px gap with design — 11 is
  off-scale, so the current snap is defensible but undocumented.

### 14. The bell is `subtle`/`radius.full`; Figma draws a white, shadowed, `radius 12` square — `minor`
- **Axis:** component identity
- **Figma:** `7:41` — `36 x 36`, `bg white`, `rounded-[12px]`, `drop-shadow 0 3 5 rgba(15,23,41,0.08)`,
  icon `22`.
- **Code:** `src/features/home/components/HomeHeader.tsx:59-60` uses `variant="subtle"`, which is
  `bgSurfaceSunken` (`IconButton.tsx:69`) on a hard-coded `radius.full` (`IconButton.tsx:47`) with a
  20px icon (`:53`) and no elevation.
- **Fix:** either add a `shape`/`elevated` variant to `IconButton`, or accept the primitive's
  contract and get design to align the bell with it — do not fork a bespoke button in `HomeHeader`.

### 15. The `·`-joined meta strings are one bidi string, not separate flex items — `minor`
- **Axis:** RTL
- **Figma:** `I52:63;46:12` renders reference, separator and customer as **three** flex children with
  `gap 5`, and the separator has its own colour (`#c4c7cf` = `borderDefault`), lighter than the two
  labels.
- **Code:** `src/features/tickets/components/TicketRow.tsx:24` and
  `src/features/home/components/HomeHeader.tsx:38` both build `a + ' · ' + b`. Story 03's plan
  explicitly asks for the opposite (`03-story-...-SCRUM-37.md:322`: *"uses `flexDirection: 'row'`
  with `gap` so RTL reverses it automatically"*). A Latin `TKT-…` reference beside an Arabic customer
  name is a mixed-direction run whose visual order the bidi algorithm decides, not the layout.
- **Fix:** render the three parts as sibling `Text`s in a `row` with `gap: spacing.xs`, the separator
  toned to `borderDefault`.

### 16. The loading skeleton is an avatar list, not a ticket list — `minor`
- **Axis:** states
- **Figma:** no loading state is designed for this frame (the app's skeletons are an addition, and a
  correct one).
- **Code:** `HomeScreen.tsx:113` / `:141` render `SkeletonList`, whose row is a 44px **circle** plus
  two lines (`src/core/components/Skeleton.tsx:66-70`) — `TicketRow` has no avatar, so the
  placeholder does not resemble what replaces it and the list visibly reflows on resolve.
- **Fix:** add a ticket-shaped skeleton (3px rail + two lines + a trailing pill) beside
  `SkeletonList`, or accept the mismatch deliberately and note it.

### 17. `SectionHeader`'s uppercase + `tracking.wide` in Arabic — `flag`
- **Axis:** open design flags (§15 flag 3)
- Both section headers on this screen (`HomeScreen.tsx:105-110`, `:133-138`) go through
  `SectionHeader`, which applies `textTransform: 'uppercase'` and `tracking.wide`
  (`SectionHeader.tsx:40`, `:60`). Arabic has no case, and letter-spacing pulls apart joined
  letterforms. Unresolved — needs a locale-aware tracking token or an explicit accept. Finding 7
  above would extend the same question to `StatusBadge`.

### 18. `PENDING` has no colour token — `flag`
- **Axis:** open design flags (story 03 open question 1, joined to §15)
- Figma draws the `pending` badge lavender (`#ede7f6` on `#4a3580`, `I52:104;46:23`); the 35-token
  palette has no purple outside the internal-notes trio, so
  `src/features/tickets/components/StatusBadge.tsx:24` ships `bgSurfaceSunken`/`textSecondary` as a
  documented interim. Visible on this frame (row 3 of My tickets). Design must add a
  `statusPending` pair or re-map the status.

### 19. Deviations the story plans justify — `intentional`
- `SectionHeader` pad-y snapped `10 → spacing.sm` (8), and the `Link` variant rebuilt on real
  `fontSize.xs`/`lineHeight.xs`/`tracking.wide` tokens instead of Figma's off-scale
  `12`/`18`/`0.7` — `design-system/01-...md:184-188`.
- `TicketRow` subject on `variant="body"` (16/24) rather than Figma's off-scale 13.5, and the meta
  line on `caption` (12/18) rather than 11.5 — `03-story-...-SCRUM-37.md:80-82` plus the explicit
  "snap to the nearest scale token; do not introduce off-scale literals" instruction.
- `StatusBadge` `paddingHorizontal: spacing.sm` (8) vs Figma's 6 — `03-story-...-SCRUM-37.md:84`.
- `StatsRow`'s `marginTop: spacing.lg` is the reserved SLA slot from `7:68` / BRD `:742`, not
  incidental spacing — `StatsRow.tsx:19-21`, `03-story-...-SCRUM-37.md:346`. Do not tidy it away.
- The bell's `onNotificationsPress` is a deliberate no-op (`HomeScreen.tsx:95`) —
  `03-story-...-SCRUM-37.md:536`, story 15 §"Not in scope". The **badge dot** (finding 4) is not
  covered by that.
- Unassigned keeps its server-side `limit: 3` while Mine drops its limit to share the Tickets tab's
  cache entry — `HomeScreen.tsx:59-68`, story 15 task 1.
- `BottomNav`'s Android `elevation` cannot cast an upward-only shadow — accepted platform
  approximation, documented at `_layout.tsx:120-123`. (Independent of finding 5, which is a real bug.)
- `BAR_TOP_RADIUS = 22` and `LABEL_LINE_HEIGHT = 11` are off-scale one-offs traced to `49:134` and
  justified inline (`_layout.tsx:11`, `:20-24`); both match Figma exactly.

## Verified correct

- **Section presence and order** match `7:13` exactly: greeting → stats row → MY TICKETS (5 rows) →
  UNASSIGNED (3 rows) → 48px spacer → `BottomNav`, with the FAB overlaid. Row counts match
  `MINE_PREVIEW_LIMIT = 5` / `UNASSIGNED_PREVIEW_LIMIT = 3` (`HomeScreen.tsx:27-28`), and the bottom
  spacer is `spacing.xxxl` = Figma's `7:305` 48px (`HomeScreen.tsx:87`).
- **RTL is clean.** Zero physical layout props across `src/features/home`, `src/app/(tabs)`,
  `TicketRow.tsx` and `StatusBadge.tsx` (grepped). `TicketRow` uses `borderStartWidth`/
  `borderStartColor`/`paddingStart`, `FAB` anchors with `end`, `BottomNav` uses
  `borderTopStartRadius`/`borderTopEndRadius`, `SkeletonList` uses `marginStart`. No directional
  glyphs on this frame.
- **No hex literals** outside `primitives.ts` anywhere in the audited files.
- **Single-font rule** honoured throughout — every string goes through `core/components/Text` with a
  `weight` prop; no `fontFamily`/`fontWeight` style keys.
- **Priority rail colours** map exactly: urgent `#ba1a1a` = `statusDanger`, medium `#1a56db` =
  `statusInfo`, low `#c4c7cf` = `borderDefault` (`priority.ts:5-15`); high is `#c2410c` vs Figma
  `#c75b00`, within the palette's own resolution.
- **`BottomNav` geometry is exact**: 64px content height, `radius 22` top corners, 64x32 active pill
  on `radius.lg` filled with `bgTabActive` `#e3ebfb` (= Figma `#e3ebfb`), 24px icons, `gap 3`,
  `pt 8 / pb 10`, filled icon when focused — all match `49:34`. Safe-area inset correctly added to
  the height as well as the padding.
- **FAB diameter** `hitSlop + spacing.md` = 56 matches `50:35`'s 55.98; `bgPrimary` / `iconOnPrimary`
  / `radius.full` all correct, and it uses `theme.elevation.e3` rather than a hand-rolled shadow.
- **Greeting typography** (`variant="title"` = 22/28) matches Figma's 22/27.5 — story 03's table
  saying "28/34" is stale; the code is right and the plan is wrong.
- **Error and empty paths** exist for both sections with retry (`HomeScreen.tsx:115-122`, `:143-150`),
  and the claim failure surfaces inline with `accessibilityLiveRegion="polite"` (`:162-172`). None of
  these are designed in Figma — they are correct additions, not drift.
- **Dark theme** resolves through semantic tokens everywhere except `BottomNav`'s shadow (finding 5)
  and the tab-label tone (finding 13).

## Needs a visual check

- **Finding 1's severity.** `bgCanvas` (`#f8f9fb`) against `bgSurface` (`#ffffff`) is a 2-3% luminance
  step; the diff is unmistakable in the Figma render but should be confirmed on a real panel before
  the fix is prioritised as a blocker over finding 3.
- **`EmptyState` inside a `ScrollView`.** `EmptyState`'s root is `flex: 1`
  (`src/core/components/EmptyState.tsx:48`), which has no height to fill inside
  `HomeScreen.tsx`'s scroll content container. Whether it collapses to content height or centres
  cannot be settled statically — check the "zero tickets in every panel" case
  (`03-story-...-SCRUM-37.md:475`, BRD `:741`).
- **Row height.** Code computes to ~66px (`spacing.md` x2 + `body` 24 + `caption` 18) against Figma's
  60.7. Font metrics make this approximate; measure before changing `paddingVertical`.
