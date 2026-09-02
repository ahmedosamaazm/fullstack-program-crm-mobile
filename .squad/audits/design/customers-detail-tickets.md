# Customers — Detail (Tickets tab) — design audit

**Figma:** `7:4310` (body `7:4381`; cards `7:4382`, `7:4406`, `7:4430`) · **Code:** `src/features/customers/components/CustomerTicketsTab.tsx`
**Verdict:** major drift

## Summary

The tab reproduces the right *content* — a card per ticket, newest first, full history including
`resolved`/`closed`, no second request — and the card wrapper (radius, surface, `e1`, 16 inset,
12 gap) is a faithful, plan-sanctioned reading of Figma. The drift is all inside and around the
card: the tab body is rendered on `bgSurface` (white) instead of Figma's canvas `#f7f9fc`, so the
white cards sit invisibly on a white ground — the single most important thing to fix, and it is
the plan's own spec (`colors.bgCanvas`) simply not implemented. Second, the card has **no
horizontal padding**: Figma's card is `px-14` with a 3px pill-shaped rail inset 14px from the
edge and 12px of gap before the text, whereas `TicketRow`'s rail is a `borderStartWidth` flush on
the card edge and the trailing age/badge column touches the card's end edge with zero inset —
every other `TicketRow` call site wraps it in `paddingHorizontal: spacing.lg`, this one does not.
Everything else is either a token-scale snap the plan already justified, or an open design
question the plan already recorded.

## Findings

### 1. Tab body renders on `bgSurface`, not `bgCanvas` — `blocker`
- **Axis:** token fidelity / dark theme
- **Figma:** the body container `7:4381` sits on the screen canvas — sampled `#f7f9fc` behind and
  below the cards, clearly distinct from the white cards and the white header above.
- **Code:** `CustomerTicketsTab.tsx:68-75` — the `FlatList` sets no `backgroundColor`, and its
  parent `CustomerDetailScreen.tsx:64` / `:88` wraps the whole screen in
  `SafeAreaView … backgroundColor: theme.colors.bgSurface`. Card background is
  `theme.colors.bgSurface` (`CustomerTicketsTab.tsx:80`) — i.e. white cards on a white ground.
  The story plan's own spec table names `colors.bgCanvas` for "Tab body background"
  (`14-story-…-SCRUM-25.md:68`); it was not implemented.
- **Impact is worse on Android:** the comment at `CustomerTicketsTab.tsx:82-86` accepts that
  `overflow: 'hidden'` drops the `elevation` shadow, so on Android the card has *no* shadow *and*
  no background contrast — the card boundary disappears entirely. In dark mode the same collapse
  happens the other way (`bgSurface` = neutral900 card on a neutral900 screen).
- **Fix:** give the `FlatList` (or the tab-content `View` at `CustomerDetailScreen.tsx:88`)
  `backgroundColor: theme.colors.bgCanvas`.

### 2. Card has no horizontal padding — content is flush to both edges — `major`
- **Axis:** structure & order / token fidelity
- **Figma:** `TicketCard` is `px-[14px] py-[13px]` with `gap-[12px]`; the rail sits **inside** that
  padding (measured: card left edge x=97, rail x=111–114 → 14px inset) and the content column
  starts at x=29 from the card edge. The trailing status badge ends 14px before the card's end edge.
- **Code:** `CustomerTicketsTab.tsx:77-90` — the card `View` has `borderRadius`, `backgroundColor`,
  `overflow` and `elevation` but **no padding**. `TicketRow.tsx:41-45` supplies only
  `paddingStart: spacing.md` and `paddingVertical: spacing.md`; there is no `paddingEnd`. Net:
  content starts 15px from the card edge (3px rail + 12px) vs Figma's 29, and the age/`StatusBadge`
  column (`TicketRow.tsx:64-69`) is flush against the card's end edge at 0px vs Figma's 14px.
  Every other `TicketRow` call site compensates with a parent inset —
  `TicketsScreen.tsx:138`, `HomeScreen.tsx:124`, `HomeScreen.tsx:152`
  (`paddingHorizontal: theme.spacing.lg`) — this one is the only one that does not.
- **Fix:** add `paddingEnd: theme.spacing.md` (or `spacing.lg`) to the card `View` in
  `CustomerTicketsTab.tsx:78`; `TicketRow`'s own `paddingStart` then only needs the rail offset.

### 3. Priority rail is a flush square border, not an inset rounded pill — `major`
- **Axis:** component identity / structure
- **Figma:** `PriorityRail` (component `35:27`, instances `61:406`/`61:407`/`61:408`) is a child
  element — `w-[3px] h-[41.2px] rounded-[999px]`, inset 14px from the card edge and vertically
  centred within the card's 13px padding (measured: rail spans y 261–301 in a card spanning
  y 248–315).
- **Code:** `TicketRow.tsx:40-41` — `borderStartWidth: 3` / `borderStartColor:
  priorityColor(...)` on the row root. A border is full-height and square-cornered, and lands flush
  on the card's start edge; `CustomerTicketsTab.tsx:87` adds `overflow: 'hidden'` specifically to
  clip its corners against the card radius, which is a workaround for this mismatch rather than a
  reproduction of the design. The story plan's spec table records this row as
  "already exact" (`14-story-…-SCRUM-25.md:73`) — that claim does not hold against the frame.
- **Fix:** render the rail as a `radius.full` `View` sibling inside the card's padding, rather than
  as a start border. This is a `TicketRow` change shared with the Tickets list and Home, so it needs
  coordinating with those audits.

### 4. Subject text is one size step too large and one weight too light — `minor`
- **Axis:** token fidelity
- **Figma:** subject `7:4387` is `13.5px / 18.225` at weight `600`
  (legacy off-scale `font size/13_5`); nearest scale value is `fontSize.sm` = 14 (`callout`).
- **Code:** `TicketRow.tsx:58` — `<Text variant="body" weight="medium">`, i.e. `fontSize.md` = 16 /
  `lineHeight.md` = 24 at weight `500`. `variant="callout"` + `weight="semibold"` is the closer map.
- **Fix:** shared with the Tickets list / Home audits — change `TicketRow` once, or accept 16/medium
  as the app-wide row subject and record it.

### 5. Relative-age text weight — `minor`
- **Axis:** token fidelity
- **Figma:** `4m` / `3d` / `2w` (`7:4391`, `7:4415`, `7:4439`) is `11.5px` at weight `500`.
- **Code:** `TicketRow.tsx:65-67` — `<Text variant="caption" tone="muted">` with no `weight`, so it
  resolves to `regular` (400). Size 12 vs 11.5 is a correct scale snap; the weight is not.
- **Fix:** add `weight="medium"` to that `Text`.

### 6. `StatusBadge` is not uppercased, untracked, and one size step large — `minor`
- **Axis:** token fidelity
- **Figma:** badge label (`I65:613;35:4` etc.) is `10px` semibold, `uppercase`,
  `tracking 0.25px`, padding `px-6 py-2`.
- **Code:** `StatusBadge.tsx:47-49` — `<Text variant="caption" weight="semibold">` (12px), no
  `textTransform`, no `letterSpacing`; `StatusBadge.tsx:41-42` uses
  `paddingHorizontal: spacing.sm` (8 vs 6) / `paddingVertical: spacing.xxs` (2 ✓).
  `fontSize.xs2` = 10 exists and is unused here; the tracking scale has `wide` = 0.6 but no 0.25.
- **Fix:** `variant`-wise, `fontSize.xs2` is the exact match. Uppercase + tracking should NOT be
  added blind — see flag 8 below.

### 7. Meta separator colour is flattened — `minor`
- **Axis:** token fidelity
- **Figma:** in `7:4394` the reference (`#94a3b8`) and customer name (`#94a3b8`) share a tone but
  the `·` separator (`7:4398`) is deliberately lighter (`#e2e8f0`). The reference is also
  10.5px against the name's 11.5px.
- **Code:** `TicketRow.tsx:24` — `[ticket.reference, ticket.customerName].filter(Boolean).join(' · ')`
  renders all three at one size and one `tone="muted"` in a single `Text`.
- **Fix:** low value on its own; fold into the shared `TicketRow` pass if flags 4–6 are actioned.

### 8. `StatusBadge` uppercase + letter-spacing in Arabic — `flag`
- **Axis:** open design flags
- Design-system §15 flag 3 raises exactly this for `SectionHeader`: Arabic has no case, and
  letter-spacing pulls apart joined letterforms. The Figma `StatusBadge` carries the same
  `uppercase` + `tracking 0.25px` pair, and this screen renders it on every row. Finding 6 above
  should not be "fixed" by adding uppercase/tracking until that flag has a locale-aware answer.

### 9. `pending` status has no colour token — `flag`
- **Axis:** open design flags
- `StatusBadge.tsx:13-19` documents it: Figma renders `pending` lavender, the 35-token palette has
  no purple, and hex outside `primitives.ts` is banned, so it ships on `bgSurfaceSunken`. Recorded
  by story 07's open question 1. Not visible in frame `7:4310` (which shows only `open`,
  `resolved`, `closed`) but reachable on this tab, since it renders the full lifecycle.

### 10. Resolved/closed rows are not visually muted — `flag`
- **Axis:** states / open design flags
- **Figma:** `7:4406` and `7:4430` grey the subject to `#94a3b8` (vs `#0f172a` on the open card
  `7:4382`) and pale the priority rail to `#c4c7cf` (`PriorityRail priority="Low"`). `7:4382`, an
  open ticket, keeps both at full strength.
- **Code:** not implemented — `TicketRow.tsx:58` renders every subject at default tone and
  `TicketRow.tsx:40-41` always uses `priorityColor(ticket.priority, theme)`.
- Recorded verbatim as the story's open question 2 (`14-story-…-SCRUM-25.md:417`): the intake
  forbids implementing it before a written rule exists, and muting the rail specifically discards
  the priority cue. **Do not resolve here** — it needs the design decision the plan asks for.

### 11. `2w` renders as `14d` — `flag`
- **Axis:** token fidelity / open design flags
- Figma's third card reads `2w`; `formatRelativeShort` (`core/utils/format.ts:76-88`) has no week
  unit. Story open question 5 (`14-story-…-SCRUM-25.md:420`) — a one-line change that alters every
  ticket row in the app, so it is a design call.

### 12. No bottom nav on this route — `intentional`
- **Axis:** structure & order
- Figma `7:4310` renders `BottomNav` (`60:331`) beneath the list. `customers/[id]` is a sibling of
  the `(tabs)` group (per `CLAUDE.md` "Routing convention"), so it pushes *over* the tab bar and no
  nav is shown. Deliberate app architecture; the frame is drawn with the nav for context.
  `CustomerTicketsTab.tsx:74`'s `paddingBottom: theme.spacing.xxl` is therefore just scroll slack.

### 13. Card gap 10 → 12 — `intentional`
- **Axis:** token fidelity
- Figma `TicketCard:margin` is `pt-[10px]`; `CustomerTicketsTab.tsx:73` uses
  `gap: theme.spacing.md` (12). Snapped to scale, explicitly justified in the plan's spec table
  ("10 → snap to 12 … the same call stories 01 and 05 made").

### 14. Full lifecycle, newest first, one request — `intentional`
- **Axis:** structure & order
- The tab renders every status including `resolved`/`closed` from `customer.tickets`
  (`CustomerTicketsTab.tsx:69`), embedded in the same `['customers', id]` response with no second
  fetch and no tab-level loading/error branch (`CustomerTicketsTab.tsx:60-62`). Exactly what the
  story specifies.

## Verified correct

- **Card container.** `radius.md` (12) ✓ Figma `rounded-[12px]`; `colors.bgSurface` ✓ white;
  `elevation.e1` ✓ Figma's two-layer soft drop shadow; 16 horizontal inset and 16 first-card top
  offset via `padding: theme.spacing.lg` ✓ (`CustomerTicketsTab.tsx:71-89`).
- **Component identity.** Nothing is re-implemented inline. The row is the real `TicketRow`, the
  badge the real `StatusBadge`, the empty branch the real `core/components/EmptyState` — no
  hand-rolled pill or bespoke `Pressable` anywhere in this tab.
- **Row structure.** Figma's two-line card (subject + trailing age; `ref · name` + trailing badge)
  maps 1:1 onto `TicketRow`'s body/trailing columns. This is the **same** `TicketRow` treatment as
  the Tickets list, not a compact variant — Figma designs no variant here, and the code reuses the
  standard row. Correct on that axis; the only container-level difference (the card) is built.
- **No grouping / section headers.** Figma `7:4381` is a flat stack of three `TicketCard`s with no
  date rule or section label; `CustomerTicketsTab.tsx:68` renders a plain `FlatList` with no
  `SectionHeader`. Matches. (Contrast the Tickets tab, which *is* day-grouped.)
- **Empty state.** `CustomerTicketsTab.tsx:63-65` renders
  `<EmptyState icon="tickets" title={t('customerDetail.empty.tickets')} />`; the icon name is valid
  (`Icon.tsx:53`, `:100`) and both locale strings exist (`en.json:310`, `ar.json:328`). Figma
  `7:4310` designs **no** empty variant of this tab, so there is nothing to diff against — the
  implementation is a reasonable reuse of the app-wide `EmptyState` and is not a finding.
- **Loading / error.** Correctly absent at tab level — the tickets arrive in the same response as
  the header name, so `CustomerDetailScreen.tsx:31-59` (skeleton / not-found / retry) already
  covers both. A tab-level spinner could never fire.
- **RTL.** No physical props anywhere in the audited path: `borderStartWidth`/`borderStartColor`
  (`TicketRow.tsx:40-41`), `paddingStart` (`:43`), `alignItems: 'flex-end'` on the trailing column
  (`TicketRow.tsx:98`, direction-aware in RN), and `padding`/`gap`/`paddingBottom` only in
  `CustomerTicketsTab.tsx:71-74`. No directional icon in this tab.
- **Dark theme.** Every colour resolves through a semantic token — `theme.colors.bgSurface`,
  `theme.elevation.e1`, `priorityColor(...)`, `StatusBadge`'s `statusStyle` map. No hex literal,
  no light-only assumption in the components themselves. The one dark-mode *symptom* is finding 1's
  missing `bgCanvas`, not a hardcoded colour.

## Needs a visual check

- Finding 1's severity assumes the card reads as invisible against the white screen background.
  Confirm on device in **both** themes and on **Android** specifically (where `overflow: 'hidden'`
  also suppresses the `e1` shadow) before deciding whether `bgCanvas` alone is sufficient or the
  card also needs a hairline border.
- Finding 2's flush trailing edge: how bad the `StatusBadge` touching the card edge looks depends
  on the longest status label at the device's text scale (`RESOLVED` in EN, `تم الحل` in AR).
