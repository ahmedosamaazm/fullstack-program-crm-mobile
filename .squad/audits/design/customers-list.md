# Customers - List — design audit

**Figma:** `7:1920` · **Code:** `src/features/customers/screens/CustomersScreen.tsx`
**Verdict:** minor drift

## Summary

The screen is a close, deliberate reflection of the frame: the four-section structure, the 16px
insets, the 38px avatar, the 18px brand-blue count badge, the LRI/PDI-isolated phone line, the
80px bottom spacer and the four-branch state ladder are all present and token-driven. Two things
are genuinely off. First, **the list rows have no surface fill** — Figma paints white
(`bgSurface`) rows on the `bgCanvas` grey band that the section headers sit in, and the code
leaves rows transparent, so the whole list reads as one flat grey sheet and the header/row
contrast Figma relies on disappears. Second, `SectionHeader` renders its label on `textSecondary`
(`#44474f`) where Figma binds `grey/48` (`#74777f`) — a visibly darker, heavier alphabetical
header. Everything else is one-step token drift or a plan-justified snap. The single most
important fix is the row surface.

## Findings

### 1. List rows are not on `bgSurface` — `major`
- **Axis:** token fidelity / structure
- **Figma:** rows `7:1983`, `7:2002`, `7:2021`, `7:2035` render on solid white (`color/white/solid`
  `#ffffff` = `bgSurface`), while the `SectionHeader` bands (`7:1977`, `7:2055`, `7:2114`) sit on
  the canvas grey (`color/grey/98` `#f8f9fb` = `bgCanvas`). The screenshot of `7:1976` shows the
  contrast plainly.
- **Code:** `src/features/customers/components/CustomerRow.tsx:36-43` — the `Pressable` sets no
  `backgroundColor`, so it inherits `SafeAreaView`'s `bgCanvas`
  (`CustomersScreen.tsx:71`). There is no surface anywhere between the canvas and the rows.
- **Fix:** give `CustomerRow`'s root `backgroundColor: theme.colors.bgSurface` (and leave the
  `SectionHeader` transparent so it keeps showing `bgCanvas`).
- **Note:** `src/features/tickets/components/TicketRow.tsx` has the same omission, so this is
  likely a repo-wide row-surface decision rather than a one-screen slip — worth fixing together.

### 2. `SectionHeader` label uses `textSecondary`, Figma binds `grey/48` — `major`
- **Axis:** token fidelity
- **Figma:** `7:1977` / `7:2055` / `7:2114` label fill is `color/grey/48` = `#74777f`
  (`get_variable_defs` on `7:1977`). Rendered, "A – F" is a light grey at the same weight as the
  phone line.
- **Code:** `src/core/components/SectionHeader.tsx:39` — `tone="secondary"` → `textSecondary` →
  `primitives.neutral700` = `#44474f`, two steps darker than the bound value.
- **Fix:** use `tone="muted"` (`textMuted` = `neutral550` `#6b6e76`, the nearest text token to
  `#74777f`; `#74777f` itself is `neutral500`, exposed only as `iconDefault`). This is a shared
  core component — the Tickets list's day headers change with it.

### 3. Missing full-width rule between the section header and its first row — `minor`
- **Axis:** structure
- **Figma:** inside each group the first row starts at `y=1.148` (`7:1983` in `7:1982`) and every
  row is `63.711` tall except the last, which is `62.563` — i.e. a 1px rule sits above the first
  row as well as between rows. The `7:1976` render shows a full-width hairline directly under the
  "A – F" band.
- **Code:** `CustomerRow.tsx:41-42` draws a bottom border only, and
  `CustomersScreen.tsx:115-117` renders `SectionHeader` with no bottom rule — so the boundary
  between the header band and the first row is unmarked.
- **Fix:** either add a `borderBottomWidth` hairline to `SectionHeader`'s root, or pass a
  leading-divider flag to the first `CustomerRow` of each section.

### 4. `SectionHeader`'s trailing rule uses `borderSubtle`, Figma binds `grey/90` — `minor`
- **Axis:** token fidelity
- **Figma:** `7:1981` / `7:2059` / `7:2118` stroke is `color/grey/90` = `#e3e5ea` = `borderDefault`
  (the frame's own `get_variable_defs` names `colors.borderDefault: #e3e5ea`).
- **Code:** `src/core/components/SectionHeader.tsx:45` — `theme.colors.borderSubtle` =
  `neutral200` `#e8ebf0`, one step lighter.
- **Fix:** switch the `rule` variant's fill to `borderDefault`. (The *row* divider is correctly
  `borderSubtle` — `grey/93` `#e8ebf0` appears in `7:1983`'s bindings; only the header rule is
  the darker grey.)

### 5. Filter-chip counts drop Figma's parentheses and count tone — `minor`
- **Axis:** component identity
- **Figma:** the chip row renders **All (248)**, **With open tickets (34)**, **Recent (12)** — the
  count is parenthesised and, on the unselected chips, set in the lighter `grey/48` against the
  darker label.
- **Code:** `src/core/components/FilterChip.tsx:57-61` renders `formatCount(count)` as a bare
  numeral in the *same* tone as the label.
- **Fix:** wrap the count in parentheses and drop the unselected count to `tone="muted"`.
  (Component-level; also affects the Tickets list. Related to §15 flag 7 below, but the
  parentheses are a content difference, not one of the flagged legacy tokens.)

### 6. FAB end inset is 24, Figma's is 16 — `minor`
- **Axis:** token fidelity
- **Figma:** `60:399` at `x=315.72`, `w=55.98` in a `387.69`-wide body → end inset `15.99` =
  `spacing.lg`. Size 56 matches.
- **Code:** `src/core/components/FAB.tsx:35` — `end: theme.spacing.xl` (24).
- **Fix:** `spacing.lg`, if the 16 is intended globally (this is the shared FAB, so confirm against
  the other frames that place it before changing).

### 7. The loading skeleton does not mirror the row it replaces — `minor`
- **Axis:** states
- **Figma:** no loading variant is drawn for this frame, but the row it stands in for is a 38px
  circle + two text lines, grouped under section headers.
- **Code:** `CustomersScreen.tsx:94-97` renders `SkeletonList count={8}`, whose avatar block is
  `Skeleton.tsx:66` — a **44px** circle, with no section-header placeholders and a `spacing.lg`
  bottom margin per item rather than the row's `spacing.md` padding. The skeleton is visibly
  taller and wider-lead than the content that lands.
- **Fix:** parameterise `SkeletonList`'s avatar size (or add a customer-specific skeleton) so the
  placeholder is 38px and the rhythm matches.

### 8. Avatar carries a hairline border the design does not draw — `minor`
- **Axis:** token fidelity
- **Figma:** `7:1984` and its siblings bind no stroke colour; the rendered circles are flat tinted
  fills with no ring.
- **Code:** `src/core/components/Avatar.tsx:67, 96` — `borderWidth: StyleSheet.hairlineWidth` with
  `borderColor: theme.colors.borderSubtle`, always on.
- **Fix:** the ring exists to keep a white-ish photo avatar from bleeding into the surface; it is
  near-invisible today on `bgCanvas` but will be visible once finding 1 puts rows on white.
  Restrict it to the image branch, or accept and record it.

### 9. `SectionHeader` uppercase + `tracking.wide` in Arabic — `flag`
- **Axis:** open design flags (§15 flag 3)
- **Figma:** the alphabetical labels are Latin ranges ("A – F"), so the transform is invisible in
  the mock.
- **Code:** `src/core/components/SectionHeader.tsx:40-41, 60` — `textTransform: 'uppercase'` plus
  `letterSpacing: theme.tracking.wide` (0.6). In Arabic the `other` bucket's label (`"أخرى"`) gets
  a no-op uppercase and 0.6 of letter-spacing that pulls apart joined letterforms, reading looser
  and lighter than the Latin headers beside it. This screen is the first to render a *translated*
  section label, so it is where the flag becomes real.
- **Fix:** none — this needs a locale-aware tracking token or an explicit accept from design. Do
  not resolve it here.

### 10. `FilterChip` sits on nearest-real tokens, not Figma's legacy values — `flag`
- **Axis:** open design flags (§15 flag 7 + the FilterChip section of the design-system plan)
- **Figma:** `74:679` / `74:683` / `74:687` are the legacy `www.figma.com` import — corrupt radius,
  raw `font size/12_5`, a literal stroke colour.
- **Code:** `src/core/components/FilterChip.tsx:19-27` documents this and builds against
  `radius.full` / `bgPrimary` / `borderStrong` / `fontSize.xs` instead.
- **Fix:** none here — the Figma component needs fixing. Recorded so the chip row is not re-audited
  as a defect.

### 11. Type scale snapped up from Figma's off-scale sizes — `intentional`
- **Axis:** token fidelity
- **Figma:** name `13.5/17.25` weight 500; phone and "open"/"No open tickets" `11.5`; section header
  pad-y `10`; badge→"open" gap `5`.
- **Code:** `CustomerRow.tsx:49` `variant="body"` (16/24), `:52, :74, :79` `variant="caption"`
  (12/18), `SectionHeader.tsx:30` `spacing.sm` (8), `CustomerRow.tsx:58` `spacing.xs` (4).
- **Fix:** none — the story plan's design-spec table prescribes each of these snaps verbatim
  ("Snap to the scale tokens tabled above; do not introduce off-scale literals"). Consequence to
  know: the row renders ~66px tall against Figma's 63.7.

### 12. Arabic names bucket to "Other", not "A – F" — `intentional`
- **Axis:** structure
- **Figma:** `أحمد محمد السيد` and `دينا عبدالرحمن فوزي` appear under "A – F"; `مريم إبراهيم حسن`
  under "G – M".
- **Code:** `src/features/customers/grouping.ts:30-44` sends any non-`A`–`Z` initial to `other`,
  which sorts last.
- **Fix:** none — the plan calls Figma's placement "placeholder behaviour rather than a decision"
  and carries it as the story's open question 1. Still unresolved; an Arabic-first app grouping
  every Arabic customer under "أخرى" deserves the design answer.

### 13. Avatar tints are a four-token cycle, not Figma's swatches — `intentional`
- **Axis:** token fidelity
- **Figma:** each avatar has an unnamed fill; `Noor Al-Khalij` (`7:2120`) is solid brand blue with
  white initials while its neighbours are pale tints.
- **Code:** `Avatar.tsx:22-40` + `CustomerRow.tsx:46` — a deterministic `tintForName` cycle over
  `bgTabActive` / `bgSuccessSubtle` / `bgWarningSubtle` / `bgDangerSubtle`.
- **Fix:** none — the plan ships this knowingly (its open question 4) because hex literals are
  banned outside `primitives.ts` and the palette has no avatar-tint set.

## Verified correct

- **Row divider on the last row of a section is correctly omitted** — Figma's last row in each
  group is `62.563` tall against `63.711` for the others, i.e. no bottom stroke.
  `CustomersScreen.tsx:122` (`divider={index < section.data.length - 1}`) matches exactly.
- **Avatar geometry** — 38px (`CustomerRow.tsx:17`) against Figma's `37.987`, at a 16px lead
  (`spacing.lg`) with a 12px gap to the text block (`spacing.md`), matching `x=16` → text at
  `x=65.99`.
- **Initials are the first two words** (`format.ts:105-110`), matching `Apex Logistics Group` → AL,
  `Noor Al-Khalij Trading` → NA, `أحمد محمد السيد` → أم.
- **Open-ticket badge** — 18px circle (`CustomerRow.tsx:18`), `radius.full`, `bgPrimary`
  (`#1a56db` = Figma's `color/azure/48`), numeral as `variant="overline" weight="semibold"
  tone="onPrimary"` (10px / 600 / white, matching `7:1997`). `formatCount` gives Arabic-Indic
  digits; the `> 0` / `= 0` branches match the mock's two row variants.
- **Trailing block inset** — ends at `spacing.lg` from the edge, matching Figma's `371.7 = w − 16`.
- **Phone bidi isolation** — `isolateLtr` (U+2066…U+2069) at `CustomerRow.tsx:53`, and the phone
  correctly does *not* go through `formatCount`.
- **All four state paths exist** — `isPending` → `SkeletonList` (`:94`), `isError` → `ErrorState`
  with retry (`:99`), empty-with-search → `EmptyState icon="search"` quoting the term (`:106`),
  empty-without → per-filter `EmptyState` (`:108`). The frame draws no empty/loading/error variant,
  so there is nothing to diff them against beyond the primitives themselves; both `EmptyState` and
  `ErrorState` read every colour through semantic tokens.
- **Pagination affordance** — `onEndReached` + `onEndReachedThreshold={0.5}` with both the
  `hasNextPage` and `!isFetchingNextPage` guards (`:66-68`), an `ActivityIndicator` footer while
  fetching (`:127-133`), and `refreshing` correctly suppressed during a next-page fetch (`:136`).
  Figma has no designed footer spinner; the plain `ActivityIndicator` is untinted but sits on the
  platform default, which is acceptable in both themes.
- **Bottom spacer** — `spacing.xxxl + spacing.xxl` = 80 (`:140`), matching `7:2172`.
- **Header block** — `ListScreenHeader` is the real shared primitive (Figma `7:1944` ≡ `7:372`),
  not re-implemented inline; 44px `SearchField`, 16px insets, 8px chip gap, horizontal scroll.
- **RTL** — no physical layout props anywhere in the screen, the row, `SectionHeader`,
  `ListScreenHeader`, `Avatar` or `FAB`; the row is `gap`/`paddingHorizontal` only, `FAB` anchors
  with `end`, `SkeletonList` uses `marginStart`.
- **Dark theme** — every colour on this screen resolves through a semantic token
  (`bgCanvas`, `borderSubtle`, `bgPrimary`, `textMuted`, `textOnPrimary`, the four avatar tint
  surfaces); no hex literal outside `primitives.ts`, no light-only assumption.
- **Route file** — `src/app/(tabs)/customers.tsx` imports the screen from the barrel and renders
  it, nothing else (hard rule 1).

## Needs a visual check

- Findings 1 and 8 interact: once rows sit on `bgSurface`, confirm on a device whether the avatar's
  hairline ring reads as intentional or as a smudge, in both themes.
- The `ActivityIndicator` footer and the `RefreshControl` spinner are platform-drawn; their colour
  against `bgCanvas` in dark mode cannot be judged statically.
