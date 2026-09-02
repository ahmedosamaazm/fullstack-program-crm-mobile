# Tickets — List — design audit

**Figma:** `7:348` ("Tickets - List") · **Code:** `src/features/tickets/screens/TicketsScreen.tsx`
**Verdict:** minor drift

## Summary

The screen is structurally faithful: title → search → chip row as a static block, a
day-grouped `SectionList` with rule headers, an 80px bottom spacer and a bottom-end FAB
all match `7:348` node for node, and every colour, radius and spacing in the audited files
resolves through a `theme.*` token (no hex, no physical layout props, no re-implemented
primitives). The most important thing to fix is `TicketRow`'s priority indicator: Figma
draws a discrete inset rail (`PriorityRail`, 3 × 40.7 inside a 62.7-tall row), the app draws
a full-height `borderStartWidth`, so adjacent rows' bars merge into one continuous stripe.
Second is the missing `spacing.sm` between the search field and the chip row in
`ListScreenHeader` — an explicit line in the story plan's design table that did not ship,
and it affects Customers too. Everything else is one-step token drift or an already-open
design question; `PriorityChip` is not rendered by this screen at all (it belongs to the
create-ticket form), so it is out of scope here.

## Findings

### 1. Priority indicator is a full-height border, not Figma's inset rail — `major`
- **Axis:** structure & order / component identity
- **Figma:** `I65:395;46:22` `PriorityRail` — a separate 3 × 40.731 element at `x=16`,
  vertically inset 11px top and bottom inside a 62.731-tall row, with the row content
  starting at `x=29`. Rails are visibly discrete, with a gap between consecutive rows.
- **Code:** `src/features/tickets/components/TicketRow.tsx:40-41` — `borderStartWidth: 3`
  + `borderStartColor` on the row `Pressable` itself, so the bar spans the row's full
  height (≈66px) and touches the neighbouring rows' bars.
- **Fix:** replace the border with a sibling `View` (`width: 3`, `alignSelf: 'stretch'` with
  `marginVertical`, or a fixed 40 height, `borderRadius: theme.radius.full`) rendered before
  `styles.body`, and move the 12px gap onto the row's `gap` instead of `paddingStart`.

### 2. No gap between the search field and the filter chip row — `major`
- **Axis:** token fidelity / structure
- **Figma:** `7:401` (search container) ends at y=88 and `7:402` places the chip row `7:382`
  at y=+10 inside it — a ~10px gap, which the story plan's design table resolves to
  `spacing.sm` ("Search → chip row gap | 10 → snap to 8").
- **Code:** `src/core/components/ListScreenHeader.tsx:57-67` — the horizontal `ScrollView`
  is a bare sibling of the title/search block with no `marginTop`, and its
  `contentContainerStyle` sets only `gap` and `paddingHorizontal`. Effective gap: 0.
- **Fix:** add `marginTop: theme.spacing.sm` to the `ScrollView` in `ListScreenHeader`
  (fixes Tickets and Customers in one change).

### 3. Status badge labels are title case; Figma renders them uppercase — `minor`
- **Axis:** token fidelity
- **Figma:** the badges in `7:348` read `NEW`, `OPEN`, `PENDING` — uppercase, 11.5/17.25/600.
- **Code:** `src/features/tickets/components/StatusBadge.tsx:49` renders
  `t('ticket.status.<status>')`, whose EN values are `"New"`, `"Open"`, `"Pending"`
  (`src/core/lib/i18n/locales/en.json:95-101`), with no `textTransform`. The badge is also
  ~22 tall vs Figma's 17 (caption 12/18 + `spacing.xxs` padding vs the off-scale 11.5/17.25).
- **Fix:** add `textTransform: 'uppercase'` to the badge label — but see flag 8 below: it is
  a no-op in Arabic, so confirm alongside the `SectionHeader` casing question rather than
  in isolation.

### 4. Subject typography snapped up two steps — `minor`
- **Axis:** token fidelity
- **Figma:** `65:395` binds `font size/13_5` + `font weight/500` on the subject; nearest
  scale step is `fontSize.sm` = 14 (`callout`).
- **Code:** `src/features/tickets/components/TicketRow.tsx:56` — `variant="body"` (16/24).
  With `paddingVertical: theme.spacing.md` (`:42`) the row measures ≈66 against Figma's 62.7.
- **Fix:** none required unless design objects — the story plan accepts "`<TicketRow />` as
  built" and the component is shared with Home, so changing it is a two-screen decision.
  Recorded so the height delta is not re-discovered.

### 5. Section header label and rule are each one token off — `minor`
- **Axis:** token fidelity
- **Figma:** `get_variable_defs` on `7:442` → label `color/grey/48` = `#74777f`, rule
  `color/grey/90` = `#e3e5ea` (= `borderDefault`).
- **Code:** `src/core/components/SectionHeader.tsx:36-43` uses `tone="secondary"`
  (`textSecondary` = `neutral700` `#44474f` — darker than Figma) and `:45` uses
  `colors.borderSubtle` (`neutral200` `#e8ebf0` — lighter than Figma).
- **Fix:** `tone="muted"` (`textMuted` `#6b6e76`, the nearest token to `#74777f`) and
  `borderDefault` for the rule. Core change; check the Home audit before applying.

### 6. FAB trailing inset is 24, Figma's is 16 — `minor`
- **Axis:** token fidelity
- **Figma:** `60:395` at `x=315.72`, 55.98 wide inside a 387.69-wide frame → 16px
  (`spacing.lg`) from the trailing edge; its bottom edge sits 12px above `BottomNav`.
- **Code:** `src/core/components/FAB.tsx:35` — `end: theme.spacing.xl` (24). Size is correct
  (`hitSlop + spacing.md` = 56) and `bgPrimary` matches `color/azure/48`.
- **Fix:** `end: theme.spacing.lg`. Shared with Home — coordinate with that audit.

### 7. Loading skeleton is a person row, not a ticket row — `minor`
- **Axis:** states
- **Figma:** no loading frame is designed; the populated row has no avatar — it is a rail,
  a two-line text block and a trailing age/badge stack.
- **Code:** `src/features/tickets/screens/TicketsScreen.tsx:113-115` renders
  `SkeletonList count={6}`, whose row is a 44px circular avatar plus two lines
  (`src/core/components/Skeleton.tsx:66-71`). The placeholder does not resemble what loads.
- **Fix:** the story plan prescribed `SkeletonList`, so this is not a plan violation — but a
  ticket-shaped skeleton (rail + 60% line + 40% line + trailing pill) would remove the
  layout jump. Low priority.

### 8. `SectionHeader` uppercase + `tracking.wide` in Arabic — `flag`
- **Axis:** open design flags (§15 flag 3)
- This screen renders three group headers ("Today"/"Yesterday"/"Earlier") through
  `SectionHeader.tsx:60` (`textTransform: 'uppercase'`) and `:40` (`tracking.wide`). Arabic
  has no case and letter-spacing pulls joined letterforms apart, so the AR headers read
  looser and lighter than EN. Finding 3 would extend the same question to status badges.
  Needs a locale-aware tracking token or an explicit accept — not resolved here.

### 9. `FilterChip` selected reads as a `SegmentedControl` segment — `flag`
- **Axis:** open design flags (§15 flag 7)
- **Figma:** `74:667` (selected) binds `color/azure/48` + `color/white/solid`;
  `74:671` (unselected) binds `color/grey/29` on a white fill, 12.5/500, corner radius 44.
- **Code:** `src/core/components/FilterChip.tsx:44-56` — `bgPrimary`/`onPrimary` selected,
  `borderStrong` hairline + `transparent` + `textSecondary` unselected, `caption` (12) label,
  `radius.full`, height ≈34 vs Figma's 29.98.
- The colour tokens match Figma exactly; the chip's own header comment records that the
  remaining geometry is built against substituted tokens because its Figma source sits on
  the legacy `www.figma.com` collection. Reported per the audit contract, **not** a defect —
  a design decision is required on whether a solid-blue selected chip should differ from a
  selected segmented-control segment, and on repairing the Figma component.

### 10. `pending` still has no colour token — `flag`
- **Axis:** open design flags (story 03 open q1 / story 04 open q2)
- **Figma:** `PENDING` badges render lavender.
- **Code:** `src/features/tickets/components/StatusBadge.tsx:26` ships `pending` on
  `bgSurfaceSunken`/`secondary`, documented in the component header. `primitives.purple500`
  exists but is reserved for internal notes. This screen shows far more `pending` badges
  than Home ever did, so the interim is now the most visible unresolved colour in the app.

### 11. Alert glyph on `urgent`/`high` subjects — `intentional`
- **Axis:** structure (app has what the frame does not)
- `TicketRow.tsx:52-58` renders a 12px `alert` icon before the subject on `urgent`/`high`.
  Figma shows no such glyph; the story plan task 6b adds it to satisfy
  `docs/phase1_brd_1.md:610` ("each carries a non-colour cue"), and flags it back to design
  as open question 1. Recorded, not a defect.

### 12. Chip counts are unparenthesised — `intentional`
- **Axis:** structure
- Figma renders "Mine (12)"; `FilterChip.tsx:58-62` renders the count as a sibling `Text`
  with `gap: spacing.xs`. Story plan open question 3 — deliberate, more RTL-robust, and not
  to be forked per the plan.

### 13. No inline Claim button on this screen — `intentional`
- **Axis:** states
- `TicketsScreen.tsx:139` passes no `onClaim`, so `TicketRow`'s Claim button never renders —
  matching Figma, where `I65:395;46:19` ("Button") is `hidden="true"` on this frame. The
  plan scopes claiming to Home/US-017.

## Needs a visual check

- **A hairline under the header block.** The render appears to show a faint full-width rule
  between the chip row and the first group header. `get_metadata` on `7:372` exposes no
  border child, so I cannot confirm it statically; if design intends one, the app has no
  such divider (`ListScreenHeader.tsx:42-68`).
- **FAB shadow weight.** `7:348` binds `color/azure/11 35%` and `40%`, but `60:395` itself
  binds no shadow variable, so I cannot attribute them. `FAB.tsx:32` uses `elevation.e3`
  (opacity 0.05), which is far lighter than either — verify against the render.
- **Trailing column alignment.** Figma lays the row out as a 2×2 grid (age on the subject
  line, badge on the meta line); `TicketRow.tsx:65-70` uses a separate trailing column with
  `gap: spacing.xs` and `alignItems: 'flex-end'`. The visual result should be equivalent,
  but the exact baselines are a runtime question.
- **Designed states.** `7:348` supplies only the populated state — Figma has no empty,
  search-empty, loading or error frame for this screen, so those four render paths could
  not be diffed against a design (see "Verified correct" for what they do).

## Verified correct

- **Structure and order** match `7:348` exactly: static title/search/chip block that does not
  scroll (`TicketsScreen.tsx:92-111`), scrolling `SectionList` (`:130`), day groups with rule
  headers (`:134-136`), 80px bottom spacer (`:145` — `spacing.xxxl + spacing.xxl`), FAB last
  (`:149`), `bgCanvas` + `edges={['top']}` (`:90`).
- **All four non-populated states have real render paths** in the plan's prescribed order:
  `isPending` → skeleton (`:113`), `isError` → `ErrorState` with retry (`:117-121`),
  empty-with-search → `EmptyState icon="search"` quoting the term (`:125`), empty-without →
  per-filter `EmptyState icon="inbox"` (`:127`). Pull-to-refresh invalidates `ticketKeys.all`
  (`:84-87, :142-144`).
- **Section header geometry** matches: label at the 16px inset, `spacing.md` gap, inline
  hairline with `flex: 1` running to the trailing inset (`SectionHeader.tsx:32, 45, 61`) —
  Figma `7:442` label 16→54, rule 66→371.7. Only the two colours drift (finding 5).
- **`SearchField` is token-exact** against the frame's own bindings: 44 height, `radius.md`
  (12), `spacing.md` padding, `spacing.sm` gap, `bgSurfaceSunken` (`#f0f3f8`),
  `borderDefault`, `callout` (14/20) input, `iconDefault` (`#74777f`) glyph
  (`SearchField.tsx:19-39`) vs `fontSize.sm`/`lineHeight.sm`/`spacing.sm`/`spacing.md`/
  `radius.md`/`colors.surfaceSunken`/`colors.borderDefault`/`colors.icon` on `7:348`.
- **Component identity:** every element is the real primitive — `ListScreenHeader`,
  `SearchField`, `FilterChip`, `SectionHeader variant="rule"`, `EmptyState`, `ErrorState`,
  `SkeletonList`, `FAB`, `TicketRow`, `StatusBadge`. Nothing is re-implemented inline; the
  only bespoke `Pressable`s are `TicketRow` and `StatusBadge` themselves, which are the
  domain components Figma names.
- **Horizontal inset is `spacing.lg` (16) everywhere** — header (`ListScreenHeader.tsx:44`),
  chip row (`:62`), rows (`TicketsScreen.tsx:138`), section headers (`SectionHeader.tsx:31`).
- **RTL:** no physical layout props or hex literals in any audited file (grep clean).
  `borderStartWidth`/`borderStartColor`/`paddingStart` on the row (`TicketRow.tsx:40-43`),
  `end:` on the FAB (`FAB.tsx:35`), `marginStart` in the skeleton (`Skeleton.tsx:67`),
  `flex: 1` rule rather than an absolute `left: 0`, and a chip `ScrollView` whose
  `paddingHorizontal`/`gap` mirror for free.
- **Dark theme:** every colour goes through a semantic token with a dark counterpart —
  `bgCanvas`, `bgSurfaceSunken`, `bgPrimary`/`textOnPrimary`, `borderStrong`/`borderSubtle`,
  `textSecondary`/`textMuted`, `bgSkeleton`, and the status/priority tokens
  (`statusDanger`/`statusWarning`/`statusInfo`, `bgPrimarySubtle`/`bgWarningSubtle`/
  `bgSuccessSubtle`). No light-only assumption. One note: `priorityColor('low')` resolves to
  `borderDefault`, which in dark (`neutral700`) is nearly invisible against `bgCanvas`
  (`neutral1000`) — consistent with Figma, where `low` has the faintest rail.
- **Grouping** (`grouping.ts`) buckets on local calendar midnight and drops empty groups, so
  Figma's "no bare TODAY rule over nothing" holds.
- **`PriorityChip`** is not rendered on this screen (create-ticket form only) — no finding.
