# Tickets — New Ticket — design audit

**Figma:** `7:4009` (body `7:4044`, header `102:942`) · **Code:** `src/features/tickets/screens/CreateTicketScreen.tsx`
**Verdict:** minor drift

## Summary

Structurally this is one of the most faithful screens in the repo: all six sections are present in
Figma's exact order, the route file is thin, `ModalHeader` / `TextField` / `TextArea` / `Dropzone` /
`Button variant="link"` are the real primitives rather than re-implementations, and every colour goes
through a semantic token so dark mode resolves. The drift is entirely token-level and concentrated in
the two controls the screen hand-rolls (the customer card and the category select) plus `PriorityChip`.
The single most important fix is the **field-value type scale**: Figma binds `fontSize.md`/`lineHeight.md`
(16/24) to every field value, and the two hand-rolled controls use `variant="callout"` (14/20) — so the
Category placeholder renders visibly smaller than the Subject placeholder sitting directly above it.
Attachments are correctly present-but-inert (`Dropzone` rendered `disabled`, not deleted) — `intentional`,
blocked on Storage.

## Findings

### 1. Field value type scale is one step small on the hand-rolled controls — `major`
- **Axis:** token fidelity
- **Figma:** `Field` value text (`I77:657;72:607`, `I102:950;72:611`) binds `fontSize.md` = 16 /
  `lineHeight.md` = 24 — the `body` variant. `TextField`/`TextArea` inherit this correctly via
  `TextInput`'s `variant = 'body'` default (`src/core/components/TextInput.tsx:26`).
- **Code:** `CreateTicketScreen.tsx:291` (category value) and `CreateTicketScreen.tsx:192` (customer-card
  placeholder) use `variant="callout"` = `fontSize.sm` 14 / `lineHeight.sm` 20.
- **Fix:** change both to `variant="body"` so the four field-shaped controls share one type scale.

### 2. `PriorityChip` label drifts on size, weight and tone — `major`
- **Axis:** token fidelity
- **Figma:** `I102:975;97:929` and siblings — `fontSize.xs` 12 / `lineHeight.xs` 18, `font weight/600`
  (semibold), `colors.textSecondary` (#44474f). All four chips, resting state.
- **Code:** `PriorityChip.tsx:63` — `variant="callout"` (14/20), `weight={selected ? 'semibold' : 'regular'}`,
  no `tone` (so `textPrimary`).
- **Fix:** `variant="caption"`, `tone="secondary"`, and make the unselected weight `semibold` (keep the
  selected cue as `bold`, or keep the colour+border cue and drop the weight change — see flag F3 below).

### 3. Customer card renders a hairline stroke; Figma renders a drop shadow and no stroke — `major`
- **Axis:** token fidelity / component identity
- **Figma:** `7:4049` `Card` — `bg colors.surface`, `radius.md`, **no border**, `drop-shadow
  0px 1px 1.5px rgba(15,23,42,0.06), 0px 4px 8px rgba(15,23,42,0.05)` (≈ `elevation.e1` + `e3`).
- **Code:** `CreateTicketScreen.tsx:390` (`styles.card`) `borderWidth: StyleSheet.hairlineWidth` +
  `CreateTicketScreen.tsx:159-160` `borderColor: theme.colors.borderDefault`, and no `theme.elevation.*`.
- **Note:** the story plan's spec table calls this "46h, radius, hairline", so the border is written down —
  but the plan does not mention the shadow at all, so the missing elevation is an unrecorded omission
  rather than a justified deviation. The card is now the only surface on the screen that reads flat where
  Figma raises it.
- **Fix:** apply `theme.elevation.e1` (or `e3`) and drop the stroke, or take an explicit design decision
  to keep the stroke instead; either way record it.

### 4. Field horizontal padding is `spacing.md` where Figma binds `spacing.lg` — `minor`
- **Axis:** token fidelity
- **Figma:** `Field` (`I77:657;72:606`, `I102:950;72:610`) — `px-[var(--spacing.lg,16px)]`.
- **Code:** `src/core/components/TextField.tsx:88` `paddingHorizontal: theme.spacing.md` (12); the same
  12 is repeated on the hand-rolled category select at `CreateTicketScreen.tsx:280` and on the customer
  card at `CreateTicketScreen.tsx:155` (Figma's Card is genuinely `px 12`, so the card alone is correct).
- **Fix:** primitive-level — bump `TextField`'s and the select's inset to `spacing.lg`. Affects every field
  in the app, so it wants one decision, not a per-screen patch.

### 5. Category chevron is 16px bare `Icon`; Figma is a 20px icon in a 32×32 button slot — `minor`
- **Axis:** component identity
- **Figma:** `I102:950;72:612` is a 32×32 `radius.full` Button wrapper containing a 20×20 `Icon`.
- **Code:** `CreateTicketScreen.tsx:298` — `<Icon name="chevronDown" size={16} mirrorInRtl={false} />`,
  no wrapper.
- **Fix:** `size={20}`. The wrapper is arguably unnecessary (the whole select is the tap target), but the
  glyph should still be 20 so it matches `TextField`'s trailing slot and Figma's optical weight.

### 6. Customer-chip clear button: ghost grey glyph vs Figma's filled blue badge — `minor`
- **Axis:** component identity
- **Figma:** `7:4054` — a 14×14 circle filled `colors.primary` (#1a56db, `radius.full`) with a white ×
  glyph inside (`7:4055`, ~8px).
- **Code:** `CreateTicketScreen.tsx:181-187` — `<IconButton icon="close" size={24} variant="ghost" />`,
  which paints no fill and uses `iconDefault` grey. Note `IconButton` hard-codes its glyph at 20px
  (`src/core/components/IconButton.tsx:53`) regardless of `size`, so the × is 20px inside a 24px box.
- **Fix:** `variant="primary"` gets the blue fill and `iconOnPrimary` glyph; the 24px box (over Figma's 14)
  is the plan's deliberate touch-target choice and should stay.

### 7. Customer-chip label weight is `medium`; Figma is `600` — `minor`
- **Axis:** token fidelity
- **Figma:** `7:4052` — `fontSize.xs` 12 / `lineHeight.xs` 18, `font weight/600`, `colors.link`.
- **Code:** `CreateTicketScreen.tsx:178` — `variant="caption" weight="medium" tone="link"`.
- **Fix:** `weight="semibold"`.

### 8. `PriorityChip` border uses `borderDefault`; Figma binds `colors.border` — `minor`
- **Axis:** token fidelity
- **Figma:** `102:975`/`978`/`981`/`984` — `border-[var(--colors.border,#e8ebf0)]`. `#e8ebf0` is
  `primitives.neutral200` → `colors.borderSubtle`, not `#e3e5ea`/`neutral300`.
- **Code:** `PriorityChip.tsx:49` — `theme.colors.borderDefault`.
- **Fix:** `theme.colors.borderSubtle` for the unselected border.

### 9. Priority rail height 16 vs Figma 14 — `minor`
- **Axis:** token fidelity
- **Figma:** `PriorityRail` inside each chip renders at `h-[14px] w-[3px]`.
- **Code:** `PriorityChip.tsx:19` — `const RAIL_HEIGHT = 16;` (width 3 is correct).
- **Fix:** 14. Both are off-scale raw numbers either way; match the design.

### 10. `low` and `high` rail colours resolve to tokens Figma did not bind — `minor`
- **Axis:** token fidelity
- **Figma:** `PriorityRail` fills — Low `#c4c7cf` (= `primitives.neutral400` → `colors.borderStrong`),
  High `#c75b00`, Medium `#1a56db` ✓, Urgent `#ba1a1a` ✓.
- **Code:** `src/features/tickets/priority.ts:14` returns `borderDefault` (`#e3e5ea`, one step too pale)
  for `low`; `:10` returns `statusWarning` = `primitives.orange700` `#c2410c` for `high`, which is close
  to but not `#c75b00` (no primitive matches `#c75b00`).
- **Fix:** `low` → `colors.borderStrong`. `high` is a shared-helper/design-system question — `#c75b00` has
  no token; either accept `statusWarning` or ask design to bind the rail to `statusWarning`.

### 11. Body container padding/gap drift — `minor`
- **Axis:** structure & order
- **Figma:** `7:4044` — `pt 20, pb 32, px 16`, section gap `18`; customer section (`7:4045`) and
  attachments section (`7:4108`) inner gap `6`, priority section (`7:4083`) inner gap `8`.
- **Code:** `CreateTicketScreen.tsx:124-126` — `padding: spacing.lg` (16 all round, so top is 16 not 20),
  `paddingBottom: spacing.xxxl` (48 not 32), `gap: spacing.xl` (24 not 18). Inner section gaps are
  `spacing.sm` (8) at `:130`, `:253`, `:311`, `:336`.
- **Note:** the 24px block gap is explicitly justified by the story plan's spec table ("the same 4px drift
  story 11 accepted") — `intentional`. Figma's `18` and `6` are off-scale values with no spacing token, so
  snapping to 16/24 and 8 is the right call; only the `pt 20 → 16` and `pb 32 → 48` are unrecorded.
- **Fix:** none required; record `pb 48` as a deliberate scroll-tail if it is one.

### 12. Section-label uppercase + `tracking.wide` in Arabic — `flag`
- **Axis:** open design flags (§15 flag 3)
- Figma binds `tracking.wide` 0.6 + `uppercase` on all six section labels (`7:4047`, `7:4085`, `7:4110`,
  and the label slot inside `TextField`/`TextArea`). The code reproduces it faithfully
  (`CreateTicketScreen.tsx:135`, `:258`, `:316`, `:341`; `TextField.tsx:75`; `TextArea.tsx:63`).
  Arabic has no case and letter-spacing pulls joined letterforms apart — six labels on this screen are
  affected. Needs a locale-aware tracking token or an explicit accept. Do not resolve here.

### 13. Figma has no error / disabled / loading variants for these controls — `flag`
- **Axis:** states (§15 flag 6)
- This is a React Hook Form screen, so the states are not optional and the code invents all of them:
  field-level errors via `error` on `TextField` (`CreateTicketScreen.tsx:230`), red border on the
  hand-rolled card and select (`:158-160`, `:284-286`) with a `caption`/`tone="danger"` line below
  (`:200-204`, `:303-307`), a form-level error line (`:353-357`), a disabled `Create` action while the
  mutation is in flight (`:114`), and `disabled` pass-through on `PriorityChip` (`:327`). All of these are
  consistent with how the rest of the app invents them — but none exist in Figma. Send them back so the
  component set gains the variants.
- **Coverage gap worth noting separately:** the `Create` press has **no loading affordance** beyond the
  label greying out — `ModalHeader` has no `loading` prop and `Button`'s `loading` state is unused here.
  A slow insert looks like a dead tap.

### 14. `PriorityChip` selected state is invented — `flag`
- **Axis:** open design flags (story 13 open question 4)
- Figma renders all four chips identically even though BRD `:617` mandates a `medium` default, so the mock
  cannot be showing a correct resting state. `PriorityChip.tsx:49-51, 63` invents `borderFocus` +
  `bgPrimarySubtle` + `weight="semibold"`, mirroring what story 09 invented for `StatusOption`. Two
  components have now needed the same invention — a real selected variant in Figma would settle both.
  Interacts with finding 2: if the unselected weight moves to `semibold` per Figma, the selected cue needs
  to move to `bold` so it stays non-colour-only.

### 15. `Dropzone`'s dashed border renders solid on Android — `flag`
- **Axis:** open design flags (§15 flag 8)
- `src/core/components/Dropzone.tsx:80` — `borderStyle: 'dashed'` + `borderRadius: theme.radius.md`.
  Figma `102:959` is explicitly `border-dashed`. Unresolved; verify on hardware.

### 16. Attachments rendered but inert — `intentional` (blocked)
- **Axis:** states
- **Figma:** `7:4108` — an `ATTACHMENTS` label plus a full `Dropzone` (`102:959`, 68h, dashed,
  paperclip, "Tap to attach files"), fully enabled.
- **Code:** `CreateTicketScreen.tsx:336-351` — the section and the `Dropzone` are **present, not absent**;
  the `Dropzone` is rendered with `disabled`, a no-op `onPress`, and an added `hint`
  (`createTicket.attachments.unavailable`) explaining why. `theme.opacity.disabled` (0.38) greys it.
- **Status:** correct and deliberate — API §8 is still 🔨, no picker package is installed, and the story
  plan's open question 3 records the disabled treatment explicitly. The one visual difference vs Figma is
  the **extra second line of text**: `Dropzone` always renders a hint line (`Dropzone.tsx:71-73`), so the
  box shows label + hint where Figma shows label only. Acceptable while blocked; revisit when Storage lands.

### 17. `+ New customer` opens an inline sheet instead of navigating away — `intentional`
- **Axis:** structure & order
- `CreateTicketScreen.tsx:206-212` and `:378-383` — the link (and the picker's empty-state action) open
  `CreateCustomerSheet` over the form. Figma `102:987` only draws the link. This is story 16 (SCRUM-29)
  landing on top of story 13, and it resolves story 13's own open question 2. `CreateCustomerSheet` reuses
  `CustomerForm` wholesale — no duplicated field, rule or mutation.

### 18. Customer card empty state is invented — `intentional`
- **Axis:** states
- Figma draws `7:4049` populated only. `CreateTicketScreen.tsx:189-195` renders a muted placeholder in the
  same card when no customer is selected, with the comment naming story 13 open question 5.

### 19. Sheets are out of frame — `intentional`
- **Axis:** structure & order
- `CustomerPickerSheet` and `CategoryPickerSheet` have no counterpart in `7:4009` (no sheet is drawn).
  Both are built from real primitives — `BottomSheet` + `SearchField` + `CustomerRow` +
  `SkeletonList`/`ErrorState`/`EmptyState` (`CustomerPickerSheet.tsx:73-116`), and `BottomSheet` +
  `RowGroup`/`SettingsRow` (`CategoryPickerSheet.tsx:41-59`) — with all four of empty/loading/error/selected
  covered. Nothing to audit against; noted so the next pass does not look for a frame.

## Verified correct

- **Modal header.** Figma `102:942` *is* a `ModalHeader` instance (Cancel · centred title · end-edge
  action, with an `Action=Disabled` variant), and the code uses the real primitive
  (`CreateTicketScreen.tsx:109-115`). Cancel = `callout`/`medium`/`textSecondary`, title =
  `body`/`semibold`/`textPrimary`, action = `callout`/`semibold`/`textDisabled` when disabled — all three
  match Figma's bindings exactly (`ModalHeader.tsx:47-70`). The `pt 6 → spacing.sm` snap is documented in
  the component itself. Route is registered `presentation: 'modal'` and `src/app/tickets/new.tsx` is a
  four-line thin route (hard rule 1 ✓).
- **Section order.** Customer → Subject → Description → Category → Priority → Attachments, matching
  `7:4045` → `77:657` → `102:946` → `102:950` → `7:4083` → `7:4108` exactly. Nothing in the frame is
  missing from the app; the only additions are the form-level error line and the two picker sheets.
- **Component identity.** `TextField` for Subject, `TextArea` for Description, `Dropzone` for Attachments,
  `Button variant="link"` for `+ New customer` — all real primitives, none re-implemented. `Button`'s link
  variant renders `callout`/`semibold`/`tone="link"` (`Button.tsx:75`), byte-for-byte Figma's
  `fontSize.sm`/`600`/`colors.link`.
- **`PriorityChip` is correctly *not* `FilterChip`.** Figma's `PriorityOption` (`97:943`) is a 40h
  `radius.md` rectangle with a `PriorityRail`; `FilterChip` is a `radius.full` pill built against
  substituted tokens from a corrupt Figma source. The plan's reasoning holds and the component lives under
  `features/tickets/components/` where a domain component belongs.
- **Exact dimensions.** `TextField` 48h = Figma 48 ✓. `Dropzone` 68h = Figma 68 ✓. `PriorityChip` 40h =
  Figma 40 ✓. Customer card `minHeight: 46` = Figma 46 ✓. `TextArea` 108 vs Figma 108 ✓ (the plan's
  "110h/2px drift" note is stale — `get_design_context` reports `h-[108px]`).
- **Radii and surfaces.** Every rounded control is `radius.md` (Figma `radius.md` 12) and the customer chip
  is `radius.full` (Figma `radius.full` 999) — `CreateTicketScreen.tsx:156, 173, 282`, `PriorityChip.tsx:48, 59`.
  Screen background is `bgCanvas` (`:108`), every card/field is `bgSurface`, chip fill is `bgPrimarySubtle`.
- **RTL.** No physical props anywhere in the audited files. The chip uses `paddingStart`/`paddingEnd`
  (`CreateTicketScreen.tsx:170-171`), the chevron is explicitly `mirrorInRtl={false}` (`:298`, correct —
  a down-chevron must not flip), and both `flexDirection: 'row'` uses (`:394-395`) reverse automatically
  under `I18nManager`. `ModalHeader` uses `justifyContent: 'space-between'` rather than absolute edges.
- **Dark theme.** No hex literal in any audited file; every colour is a `theme.colors.*` semantic token,
  so both palettes resolve. `PriorityChip`'s rail goes through `priorityColor(priority, theme)` rather
  than a literal. `theme.opacity.disabled` is used for both the chip and the `Dropzone` disabled states.
- **Single-font rule.** No `Text`/`TextInput` imported from `react-native` in any audited file; no
  `fontWeight`/`fontFamily` style key. All type goes through `variant` + `weight`.
- **Barrel discipline.** `CreateCustomerSheet` and `CustomerListItem` come from `@/features/customers`
  (`CreateTicketScreen.tsx:21`) and `CustomerRow`/`useCustomerSearch` likewise
  (`CustomerPickerSheet.tsx:18`) — the known tickets↔customers barrel cycle, used inside render paths only.
  No deep imports.

## Needs a visual check

- **Dashed border on Android** (finding 15) — RN renders `borderStyle: 'dashed'` + `borderRadius` as solid
  on some Android versions. Cannot be determined statically.
- **`TextArea` top-anchoring on iOS hardware** (§15 flag 9) — `TextArea.tsx:32, 82` splits
  `textAlignVertical`/`paddingTop` by platform; the simulator hides the difference.
- **Does the 48px `KeyboardAvoidingView` + `paddingBottom: xxxl` tail leave the Attachments Dropzone
  reachable with the keyboard up on a small device?** `CreateTicketScreen.tsx:117-127` — a runtime question.
