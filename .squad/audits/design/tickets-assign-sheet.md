# Tickets — Assign Agent (Sheet) — design audit

**Figma:** `7:4118` (sheet body `124:996`) · **Code:** `src/features/tickets/components/AssignAgentSheet.tsx`
**Verdict:** minor drift

## Summary

The sheet is structurally faithful: header → search → scrolling agent list → danger footer, in
that order, with the row anatomy (36px tinted avatar, name + `CURRENT` tag, workload caption,
trailing check, bottom hairline, `px lg` / `py md` / `gap md`) matching Figma value-for-value.
Every colour resolves through a semantic token; there is no hex, no physical layout prop, and no
re-implemented primitive except the one the story plan deliberately authorised. The single most
important fix is the trailing check: Figma strokes it `colors.primary` (`#1A56DB`, verified from
the exported SVG) and the code paints it `iconDefault` grey — the "which agent owns this ticket"
signal is the whole point of the current-assignee state, and it currently reads as a decoration.
Second is horizontal alignment: all sheet chrome (title, search field, footer) sits at
`spacing.xl` (24) where Figma puts it at `spacing.lg` (16), while the rows correctly full-bleed
back to 16 — so the search field is inset 8px further than the avatars beneath it.

## Findings

### 1. Current-assignee check is grey, not primary blue — `major`
- **Axis:** token fidelity
- **Figma:** `I124:1010;122:998` Check 20×20, stroke `#1A56DB` = `colors.primary` (confirmed by
  fetching the node's exported SVG; `colors.primary` also appears in this frame's variable defs).
- **Code:** `src/features/tickets/components/AgentRow.tsx:66` — `<Icon name="check" size={20} color={theme.colors.iconDefault} />`
  (`iconDefault` = `neutral500`, a mid grey in light and `neutral400` in dark).
- **Fix:** use the blue semantic token the palette already has — `theme.colors.tabActive` (or
  `statusInfo`; both alias `blue500`/`blueLight`) — for the `isCurrent` check.

### 2. Sheet chrome is inset 24px where Figma insets 16px — `major`
- **Axis:** token fidelity / structure
- **Figma:** `SheetHeader` titlebar `px spacing.lg` (16), `Search` frame `px spacing.lg` (16),
  `Footer` `px spacing.lg` (16). All chrome shares the row's 16px inset, so the title, the search
  field's leading icon and the avatar column line up.
- **Code:** `src/core/components/SheetHeader.tsx:39` — `paddingHorizontal: theme.spacing.xl` (24);
  `src/core/components/BottomSheet.tsx:141` — children wrapped in `paddingHorizontal: theme.spacing.xl`,
  which is what forces `AssignAgentSheet.tsx:74`'s `marginHorizontal: -theme.spacing.xl` for the
  rows. Net result: rows at 16 (correct), title/search/footer at 24 (8px off).
- **Fix:** move both to `theme.spacing.lg`; the negative-margin escape at `AssignAgentSheet.tsx:74`
  must change with them (`-theme.spacing.lg`). Touches every sheet in the app, so treat as a
  design-system change, not a story-08 one.

### 3. Agent list capped at a raw `320` — `major`
- **Axis:** token fidelity / structure
- **Figma:** `124:1009 Agents` is 448 tall — 7 rows × 64 — inside a 654-tall sheet on an 842
  viewport (~78%). The list is the sheet's flexible region; the sheet, not the list, is capped.
- **Code:** `src/features/tickets/components/AssignAgentSheet.tsx:130` — `list: { maxHeight: 320 }`,
  a magic number on no scale (~5 rows), applied regardless of device height, while
  `BottomSheet.tsx:120` already caps the sheet at `screenHeight * 0.9`.
- **Fix:** drop the fixed `maxHeight` and let the `ScrollView` flex inside the sheet's own 90% cap
  (or derive the cap from `useWindowDimensions()`), so a tall phone shows the seven rows Figma shows.

### 4. Grab handle: wrong width and wrong border token — `minor`
- **Axis:** token fidelity
- **Figma:** `I124:997;121:989` Grip — 36×4, `radius.full`, fill `colors.borderDefault` (`#e3e5ea`
  = `primitives.neutral300`).
- **Code:** `src/core/components/SheetHeader.tsx:68` — `width: 40`; `:28` —
  `backgroundColor: theme.colors.borderStrong` (`neutral400` `#c4c7cf`, one step darker).
- **Fix:** `width: 36` and `theme.colors.borderDefault`.

### 5. Vertical rhythm around the search field — `minor`
- **Axis:** token fidelity
- **Figma:** `124:1002 Search` — `pt spacing.md` (12), `pb spacing.sm` (8), i.e. 12 above the
  field and 8 between field and first row.
- **Code:** `src/core/components/BottomSheet.tsx:141` — `paddingTop: theme.spacing.lg` (16) above
  the field; `AssignAgentSheet.tsx:74` — `marginTop: theme.spacing.md` (12) below it.
- **Fix:** `paddingTop: theme.spacing.md` on the sheet body and `marginTop: theme.spacing.sm` on
  the list container.

### 6. Backdrop opacity is 0.6 where Figma binds 0.4 — `minor`
- **Axis:** token fidelity / dark theme
- **Figma:** `colors.overlay` = `#181c2266` on this frame — `#181c22` at **40%** alpha.
- **Code:** `src/core/components/BottomSheet.tsx:57` — animates to `theme.opacity.strong` (0.6)
  over the opaque `bgOverlay` token. The opaque-token + animated-alpha split is correct and
  deliberate (design-system plan §6, `:334`); only the chosen ramp step is off — `opacity.medium`
  is exactly 0.4.
- **Fix:** animate to `theme.opacity.medium`, and correct the design-system plan's `:334` note.

### 7. Footer action's box does not match the designed control — `minor`
- **Axis:** structure / token fidelity
- **Figma:** `124:1063 Footer` `px lg` / `py md`, containing `124:1064 Unassign` — a full-width
  text action at `px spacing.xl`, `py spacing.lg`, `radius.md` (i.e. a ~56-tall, 12-radius hit
  area), label `fontSize.md`/`lineHeight.md`/SemiBold/`colors.danger`.
- **Code:** `src/features/tickets/components/AssignAgentSheet.tsx:101-112` — `paddingVertical: theme.spacing.md`
  (12) only, no `borderRadius`, no pressed feedback. The label itself (`body`/`semibold`/`danger`,
  line 108) is correct.
- **Fix:** give the `Pressable` `paddingVertical: theme.spacing.lg`, `borderRadius: theme.radius.md`
  and a pressed `bgDangerSubtle`, matching what `Button`'s danger variant already does
  (`Button.tsx:124`).

### 8. Avatar initials size is computed, not a scale value — `minor`
- **Axis:** token fidelity
- **Figma:** `I124:1010;122:991;36:3` — initials at `fontSize.sm` (14) / `lineHeight.sm` (20) / SemiBold.
- **Code:** `src/core/components/Avatar.tsx:82` — `fontSize: Math.round(size * 0.36)`, which at
  `size=36` (`AgentRow.tsx:17`) yields **13**, off the 7-step scale. Figma's avatar also carries
  no stroke, while `Avatar.tsx:96` adds a hairline `borderSubtle` ring.
- **Fix:** core-`Avatar` scope — map size to the nearest `fontSize` step rather than a ratio, and
  confirm the hairline ring with design.

### 9. Loading skeleton does not match the row it stands in for — `minor`
- **Axis:** states
- **Figma:** no loading frame is designed for this sheet; the row it replaces is a 36px circle +
  two lines at 14/12, 64 tall, with a 12px inset.
- **Code:** `src/features/tickets/components/AssignAgentSheet.tsx:77` renders the generic
  `SkeletonList count={5}`, whose circle is `44` and whose rows are 16-apart
  (`src/core/components/Skeleton.tsx:66`) — visibly wider and taller than the rows that replace it.
- **Fix:** parameterise `SkeletonList`'s avatar size, or accept the drift explicitly — it is a
  sub-second state.

### 10. `CURRENT` relies on a pre-uppercased string, and Arabic drops both uppercase and tracking — `flag`
- **Axis:** open design flags (design-system plan §15, Arabic uppercase + tracking)
- **Figma:** `I124:1010;122:996` — `fontSize.2xs`/`lineHeight.2xs`, `tracking.wide` 0.6,
  `text-transform: uppercase`, `colors.textMuted`.
- **Code:** `src/features/tickets/components/AgentRow.tsx:57-61` — correct variant, tone and
  `letterSpacing: theme.tracking.wide`, but no `textTransform`; the capitals come from the literal
  `"CURRENT"` in `en.json:180`. `ar.json:184` is `"الحالي"` — Arabic has no case, and 0.6px
  tracking on Arabic breaks joining.
- **Fix:** none until design rules on §15's Arabic uppercase/tracking question. Do not silently
  add `textTransform: 'uppercase'`.

### 11. Unassign is a bespoke `Pressable`, not `Button` — `intentional`
- **Axis:** component identity
- **Figma:** `124:1064` is a `Button` instance painted `colors.danger`.
- **Code:** `src/features/tickets/components/AssignAgentSheet.tsx:101-111`.
- **Why:** story plan `:474-481` and open question 4 — `Button`'s `link` variant hard-codes
  `tone="link"` (`Button.tsx:73-76`) and its `danger` variant is a filled full-width control;
  the plan chose not to widen a core component for one consumer, and records `variant="linkDanger"`
  as the fix if the pattern recurs. (Finding 7 above is the box geometry, which is still a real drift.)

### 12. Avatar tints diverge from Figma's palette — `intentional`
- **Axis:** token fidelity
- **Figma:** rows use raw `yellow100`/`amber700`, `green100`/`green600`, `purple100`/`purple600`,
  `pink50`/`pink700` — none in `primitives.ts`.
- **Code:** `src/features/tickets/components/AgentRow.tsx:47` — `tintForName(agent.fullName)`,
  the existing four-tint semantic cycle (`Avatar.tsx:27-42`).
- **Why:** story plan `:168-171` and open question 3 — hard rule 2 forbids the hex, and a named
  avatar-tint ramp is a design-system change, not a story-08 one.

## Verified correct

- **Sheet chrome:** `radius.xl` top corners only, `bgSurface` fill, `screenHeight * 0.9` cap,
  `SheetHeader` (not an inline re-implementation) rendered by `BottomSheet` — matching Figma's
  24h handle row + 38h titlebar + `borderSubtle` hairline (`SheetHeader.tsx:14-15,41-42`), title
  at `heading`/semibold/`tracking.tight`.
- **Row anatomy, exact:** `px spacing.lg`, `py spacing.md`, `gap spacing.md`, hairline
  `borderSubtle` bottom (`AgentRow.tsx:38-42`); avatar `36` (`:17`); name `callout`/semibold with
  `numberOfLines={1}` + `flexShrink`; workload `caption`/`muted`; body gap `spacing.xxs`. Computed
  row height 12+40+12 = 64, matching Figma's 64.
- **`SearchField`** is the real core primitive — 44h, `radius.md`, `bgSurfaceSunken`,
  `borderDefault`, 16px leading search icon — matching `124:1003` exactly.
- **Full-bleed list** via `marginHorizontal: -theme.spacing.xl` (`AssignAgentSheet.tsx:74`), so the
  hairlines run edge to edge as designed.
- **States:** four distinct branches (pending → skeleton, error → `ErrorState` with retry,
  empty-searched vs empty-roster kept apart, rows), plus a disabled pass-through while the mutation
  is in flight (`opacity.disabled` at `AgentRow.tsx:41`) and a live-region error line. Figma
  designs none of these; the app is ahead of the design here, not behind it.
- **RTL:** no physical props anywhere in the four files — `marginStart`/`marginHorizontal`/
  `paddingHorizontal` only; the check sits on the end edge by flex order, and `check`/`search` are
  direction-neutral glyphs.
- **Dark theme:** every colour is a semantic token (`bgSurface`, `borderSubtle`, `textMuted`,
  `iconDefault`, `bgOverlay`, `bgSkeleton`); no hex, no light-only assumption. Finding 1's fix
  should also use a token, not a literal.
- **Entry point:** `TicketDetailHeader.tsx:96-110` fires `onAssignPress`, and
  `TicketDetailScreen.tsx:152-157` passes `ticket.assigneeId` as `currentAssigneeId` — the sheet
  gets the compare-and-set value it needs, and the header pill is outside this frame's scope.

## Needs a visual check

- Whether the `320` cap in finding 3 truncates mid-row on common device heights (it will show 5
  rows of 64 exactly, so the cut is clean, but the sheet will sit far shorter than Figma's).
- `BottomSheet.tsx:128-140` duplicates `SheetHeader`'s handle inline for the title-less case — not
  exercised by this frame (this sheet always passes `title`), but it is the same 40px/`borderStrong`
  drift as finding 4 and should be fixed with it.
