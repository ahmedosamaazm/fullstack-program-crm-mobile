# Customers — Detail (Info) — design audit

**Figma:** `7:3544` · **Code:** `src/features/customers/screens/CustomerDetailScreen.tsx`
**Verdict:** major drift

## Summary

Structure, row order, copy, RTL discipline and the data-state paths are all faithful — every
field is present in the designed order, every colour resolves through a semantic token, and the
screen reads correctly in both themes. The drift is entirely visual surface treatment: Figma's
Info tab is an elevated white **card** (`radius.md`, `e2`+`e1` shadow, 16px inset) floating on a
`surfaceSunken` body, and the three header actions are **IconTonal** — 36×36 circles filled with
`surfaceSunken`. The app renders both flat on white, so the screen loses the card entirely and the
Call/Email/History buttons read as bare glyphs. Fix the InfoCard first — it is the single largest
visible difference. Note that story 10's plan was written against the *Tickets* variant frame
(`7:4310`) with the Info frame's node id unavailable (its open question 1); several of its
specifications are contradicted by `7:3544`, which is now readable.

## Findings

### 1. The Info tab has no card and the body is not sunken — `blocker`
- **Axis:** structure & order / token fidelity
- **Figma:** `7:3662 InfoList` pads `spacing.lg` (16) on the top and both sides; `91:812 InfoCard`
  is `colors.surface` on `radius.md` (12) with `overflow: hidden` and a two-layer shadow
  (`0 2 8 rgba(0,0,0,0.04)` + `0 1 3 rgba(0,0,0,0.06)` — exactly `elevation.e2` + `e1`). The body
  behind it is `colors.surfaceSunken` (`#f0f3f8`).
- **Code:** `CustomerInfoTab.tsx:58` — a bare `ScrollView` with no horizontal padding, no card
  wrapper, no radius and no elevation; `CustomerDetailScreen.tsx:65` sets the whole screen to
  `theme.colors.bgSurface` (white), so the rows sit edge-to-edge on the same white as the header.
- **Fix:** set the tab-body container to `theme.colors.bgSurfaceSunken` and wrap the six
  `DetailRow`s in a `View` with `padding: theme.spacing.lg` outer, `backgroundColor:
  theme.colors.bgSurface`, `borderRadius: theme.radius.md`, `overflow: 'hidden'` and
  `theme.elevation.e2`.

### 2. Call / Email / History are ghost, not tonal — `blocker`
- **Axis:** component identity / token fidelity
- **Figma:** `91:867` / `91:871` / `91:875` are all `Button type=IconTonal` — 36×36, `radius.full`,
  filled `colors.surfaceSunken` (`#f0f3f8`). Visible as three grey circles in the frame render.
  (The back button `91:862` is `type=Icon`, 32×32, unfilled — that one is correct.)
- **Code:** `CustomerDetailHeader.tsx:80, 87, 95` — `variant="ghost"`, which resolves to
  `backgroundColor: 'transparent'` (`IconButton.tsx:260`) until pressed.
- **Fix:** change the three action `IconButton`s (not the back button) to `variant="subtle"` —
  that variant already resolves to `bgSurfaceSunken` (`IconButton.tsx:257-259`).

### 3. The tab bar sits below the header's divider instead of inside the header — `major`
- **Axis:** structure & order
- **Figma:** `7:3568` is one container — title row, identity row **and** the Info/Tickets/Notes row
  — carrying `colors.surface` and a single bottom border in `colors.border` **beneath the tabs**.
  The Tab component's own description confirms the 2px underline "sits flush on the bar's bottom
  edge".
- **Code:** `CustomerDetailHeader.tsx:39-40` closes the surface with the hairline **above** the tab
  bar, and `CustomerDetailScreen.tsx:75-93` renders `TabBar` as a separate block below it. The
  divider therefore separates identity from tabs rather than tabs from body, and the selected tab's
  underline floats mid-screen instead of on a bar edge.
- **Fix:** move the `TabBar` block inside `CustomerDetailHeader` (below the identity row, above the
  `borderBottom`), or drop the header's border and give the tab-bar container the bottom border.

### 4. Tab bar gap is `spacing.lg`, Figma binds `spacing.xl` — `minor`
- **Axis:** token fidelity
- **Figma:** `7:3600` — `gap: var(--spacing.xl, 24px)` between Info / Tickets / Notes (confirmed by
  metadata: Info ends at x=27, Tickets starts at x=51).
- **Code:** `Tab.tsx:66` — `TabBar` hard-codes `gap: theme.spacing.lg` (16) for the non-scrollable
  bar.
- **Fix:** `TabBar` is shared with ticket detail; add a `gap` prop or change the default to
  `spacing.xl` after checking `7:3600`'s sibling on the ticket-detail frame binds the same value.

### 5. Info-card dividers are full-bleed; Figma insets them 16 from the start edge — `minor`
- **Axis:** structure & order
- **Figma:** every `Divider` (`91:816`, `91:821`, `91:826`, `91:831`, `91:836`) is
  `pl-[var(--spacing.lg,16px)]` — the line starts 16px in and runs to the card's end edge.
- **Code:** `CustomerInfoTab.tsx:52-56, 59, 75, 97, 138, 145` — the `divider` style is a
  `borderBottom` on a full-width wrapper `View`, so the hairline spans the whole row.
- **Fix:** render the divider as its own `View` with `marginStart: theme.spacing.lg` (logical prop,
  per hard rule 5) rather than as a border on the row wrapper.

### 6. Header subtitle and secondary-contact labels use `caption` (12/18); Figma binds 14/20 — `minor`
- **Axis:** token fidelity
- **Figma:** `7:3585` ("Finance · East Branch") is `fontSize.sm` (14) / `lineHeight.sm` (20),
  `colors.textMuted`; `I91:823;91:1031` ("Secondary contact") is the same 14/20 muted.
- **Code:** `CustomerDetailHeader.tsx:70` and `CustomerInfoTab.tsx:115` use `variant="caption"`,
  which `typography.ts:102` maps to `fontSize.xs` (12) / `lineHeight.xs` (18).
- **Fix:** use `variant="callout"` in both places. Note story 10's plan (line 98) specifies
  `caption` — it was written before the Info frame's node id was known, so this needs confirming
  rather than assuming the plan is authoritative.

### 7. Phone / email values render `tone="link"`; Figma binds `colors.text` — `minor`
- **Axis:** token fidelity
- **Figma:** the value side of `91:813` (Phone), `91:818` (Email) and the stacked
  `91:823` (Secondary contact) all bind `colors.text` (`#181c22`) — black, not blue, in the render.
  The rows carry no link affordance in the design.
- **Code:** `CustomerInfoTab.tsx:67, 84, 120` — `<Text variant="callout" tone="link">`, i.e.
  `textLink` / `blue500`.
- **Fix:** story 10 §"tappable value slot" (plan lines 361-369) explicitly specifies `tone="link"`
  for the tap affordance, so this is a deliberate call — but it contradicts `7:3544` and is visible.
  Take it back to design: keep the `Pressable` + `accessibilityRole="link"` and drop the colour, or
  have design add the link tone to the InfoCard.

### 8. Header top padding — `minor`
- **Axis:** token fidelity
- **Figma:** `7:3568` is `pt-[6px] pb-[12px] px-[16px]`; the identity and tab rows each add
  `pt-[10px]` (both off-scale).
- **Code:** `CustomerDetailHeader.tsx:36-37` has `paddingHorizontal: spacing.lg` and
  `paddingBottom: spacing.md` but **no** top padding — the title row sits flush against the safe-area
  inset. The two 10px gaps are rendered as `spacing.md` (12), the nearest scale step.
- **Fix:** add `paddingTop: theme.spacing.xs` (4) or `xs`-adjacent; the 10→12 substitutions are the
  correct scale-snapping call and need no change.

### 9. Notes tab is a placeholder — `intentional`
- **Axis:** states
- **Figma:** the Notes tab is present in the tab bar (`91:885`); its content is not part of this
  frame.
- **Code:** `CustomerDetailScreen.tsx:100-103` — `EmptyState icon="file"`, commented as SCRUM-26 /
  blocked on Storage. All three tabs are present and correctly ordered.

### 10. The Edit action is not in Figma — `intentional`
- **Axis:** structure & order
- **Figma:** `7:3588` has exactly three action buttons (Call, Email, History).
- **Code:** `CustomerDetailHeader.tsx:99-107` — a fourth `edit` `IconButton`, commented as story 12
  open question 1. Recorded, not a defect; note that four 36px buttons plus 8px gaps leave the
  identity block ~44px less width than the design assumed.

### 11. No bottom nav on this route — `intentional`
- **Axis:** structure & order
- **Figma:** `60:299 BottomNav` is drawn at the bottom of the frame.
- **Code:** `src/app/customers/[id].tsx` is a sibling of `(tabs)`, so the screen pushes over the tab
  bar. Story 10 open question 2 records this deliberately, following the ticket-detail precedent.

## Verified correct

- **Row set and order** — Phone, Email, Secondary contact, Department, Branch, Customer since,
  matching `91:812`'s six children exactly (`CustomerInfoTab.tsx:59-153`).
- **Stacked vs inline** — only "Secondary contact" is `layout="stacked"` (`CustomerInfoTab.tsx:100`),
  matching `91:823` (66px tall, `gap: spacing.xxs`, label above value) against the other five at 44px
  inline. `DetailRow.tsx:16-17, 29-31` binds `spacing.md`/`spacing.lg`/`spacing.xxs` correctly.
- **Component identity** — real `DetailRow`, `Avatar`, `IconButton`, `Tab`/`TabBar` primitives
  throughout; nothing re-implemented inline. The card in finding 1 is the only missing wrapper and
  no `Card` primitive exists to reuse.
- **Header metrics** — avatar 44 (`67:602`), actions 36 (`91:867`), back 32 (`91:862`), title-row
  gap `spacing.sm`, identity-row gap `spacing.md`, action gap `spacing.sm` — all exact.
- **Divider colour** — `borderSubtle` = `neutral200` = `#e8ebf0` = Figma `colors.border`. ✅
- **Tab colours** — `tabActive`/`tabInactive` = `#1a56db`/`#6b6e76` = Figma
  `colors.tabBarActive`/`tabBarInactive`; semibold selected / medium unselected, 2px `radius.full`
  indicator (`Tab.tsx:26-39`) — all exact.
- **RTL** — no physical layout props anywhere in the four files; `paddingHorizontal`/`gap`/
  `align="end"` only. `arrowBack` is in `Icon.tsx:111`'s `DEFAULT_MIRRORED` set. `isolateLtr` wraps
  both the primary and secondary phone numbers (`CustomerInfoTab.tsx:69, 106`).
- **Dark theme** — every colour reads a semantic token; no hex literal in any of the four files.
- **States** — loading (`SkeletonList`), not-found without retry, error with retry, null email
  fallback, and empty secondary contacts are all implemented (`CustomerDetailScreen.tsx:33-60`,
  `CustomerInfoTab.tsx:87-92, 101-105`); Figma designs none of them.
- **Copy** — `customerDetail.info.secondaryContacts` = "Secondary contact" (singular), matching
  `I91:823;91:1031`.

## Needs a visual check

- Whether the four header action buttons plus the avatar leave enough room for a realistic Arabic
  name before ellipsising (finding 10) — a runtime width question.
- Whether `elevation.e2` alone reads close enough to Figma's stacked two-layer shadow on Android
  (RN supports a single shadow), once finding 1 is applied.

## Open §15 flags touched

None. This screen uses no `FilterChip` and no `SectionHeader`.
