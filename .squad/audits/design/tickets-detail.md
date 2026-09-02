# Tickets — Detail — design audit

**Figma:** `7:1638` · **Code:** `src/features/tickets/screens/TicketDetailScreen.tsx`
**Verdict:** major drift

## Summary

Structure, hierarchy and the whole internal-note treatment are faithful — the header, contact
strip, tab bar, AI slot, thread and composer are all present, in Figma's order, and every colour
resolves through a semantic token with a dark counterpart. The drift is concentrated in two
places. First, **every horizontal hairline in the frame is missing**: Figma binds
`border-b: colors.border` on the header, the tab bar, the AI summary bar and each `MessageRow`,
and none of them exist in code, so the screen reads as one undivided sheet instead of five stacked
bands. Second, the **composer's attach and send affordances are hand-rolled `Pressable`s** where
Figma uses the `IconButton` primitive in its documented `Subtle` and `Primary` variants — the
attach button loses its `bgSurfaceSunken` fill entirely. The single most important fix is the
missing `MessageRow` bottom divider plus the thread-row body colour (`textSecondary`, not
`textPrimary`) — together they are what makes the thread look like a wall of text rather than
the designed list.

## Findings

### 1. Every designed hairline divider is missing — `major`
- **Axis:** structure & order / token fidelity
- **Figma:** `Header` (`91:896`), `TabBar` (`91:934`), `AISummaryBar` (`91:947`) and every
  `MessageRow` (`91:981`, `91:989`) each carry `border-b` bound to `colors.border` (`#e8ebf0`
  = `borderSubtle`).
- **Code:** `TicketDetailHeader.tsx:52` — container has no border; `core/components/Tab.tsx:66`
  — `TabBar` renders a bare row with no border; `AiSummaryBar.tsx:26-33` — no border;
  `MessageRow.tsx:41-51` — no bottom border, and `TicketDetailScreen.tsx:135-139`'s `FlatList`
  supplies no `ItemSeparatorComponent`. Only `ContactStrip.tsx:35-36` and
  `ReplyComposer.tsx:38-39` have their hairlines.
- **Fix:** add `borderBottomWidth: StyleSheet.hairlineWidth` / `borderBottomColor:
  theme.colors.borderSubtle` to the header container, `TabBar`, `AiSummaryBar` and `MessageRow`.

### 2. `TabBar` has no horizontal padding and the wrong inter-tab gap — `major`
- **Axis:** token fidelity / component identity
- **Figma:** `91:934` — `px: spacing.lg` (16) and `gap: spacing.xl` (24); the first tab starts at
  x=16 and the tabs sit at x=16 / 126 / 241. The `Tab` component description states outright:
  *"the bar supplies its own padding and divider."*
- **Code:** `core/components/Tab.tsx:66` — `<View style={[styles.bar, { gap: theme.spacing.lg }]}>`
  with no `paddingHorizontal`, so "Conversation" sits flush against the screen edge and out of
  alignment with the header title and every row below it.
- **Fix:** give `TabBar` `paddingHorizontal: theme.spacing.lg` and `gap: theme.spacing.xl` (both
  the row and the `scrollable` `contentContainerStyle`). Note this is a `core/` component — the
  customer-detail tab bar inherits the same fix.

### 3. Message body renders at `textPrimary`, Figma binds `textSecondary` — `major`
- **Axis:** token fidelity
- **Figma:** `I91:981;89:764` / `I91:989;89:778` — body text `fontSize.sm` / `lineHeight.sm`,
  regular, `colors.textSecondary` (`#44474f`). The author name above it is the only
  `colors.text` string in the row, which is what creates the name/body contrast step.
- **Code:** `MessageRow.tsx:69` — `<Text variant="callout">{message.body}</Text>` with no `tone`,
  so it falls through to `textPrimary`; author and body render at the same colour.
- **Fix:** `<Text variant="callout" tone="secondary">`.

### 4. Composer attach and send are hand-rolled instead of `IconButton` — `major`
- **Axis:** component identity
- **Figma:** `I91:1011;91:761` (Attach) — 36×36, `radius.full`, `bg: colors.surfaceSunken`, 20px
  icon; `I91:1011;91:767` (Send) — 36×36, `radius.full`, `bg: colors.primary`, 20px icon. The
  `IconButton` component description names these exactly: *"Subtle for the composer attach button,
  Primary for the active send button."* `core/components/IconButton.tsx` already implements both.
- **Code:** `ReplyComposer.tsx:58-66` — a bare `Pressable` (`styles.attachButton`, `:118`, 36×44,
  **no background fill at all**, off-scale height) wrapping a 20px `Icon`; `ReplyComposer.tsx:86-103`
  — a second bare `Pressable` at `SEND_BUTTON_SIZE = 40` (`:16`) with an 18px icon.
- **Fix:** replace both with `<IconButton variant="subtle" icon="paperclip" disabled … />` and
  `<IconButton variant="primary" icon="send" … />` at the default `size={36}`; drop
  `SEND_BUTTON_SIZE` and `styles.attachButton`.

### 5. Contact strip drops the customer's company from the subtitle — `major`
- **Axis:** structure & order
- **Figma:** `I91:918;88:742` — subtitle reads `Meridian Supplies Ltd · Finance`, i.e. company ·
  department/category. The story plan agrees:
  `.squad/plans/tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md:34` ("name, company ·
  department") and `:418` (`[companyOrCategory, department].filter(Boolean).join(' · ')`).
- **Code:** `ContactStrip.tsx:23` — `const subtitle = [categoryName].filter(Boolean).join(' · ')`,
  a one-element join that can never produce the separator; `types.ts:36` — `TicketDetail.customer`
  carries only `id`/`fullName`/`phone`/`email`, no company, so the data is not fetched either.
- **Fix:** add the company/organisation field to the `§4.6` projection in `api.ts` and the
  `TicketDetail['customer']` type, then join `[company, categoryName]`.

### 6. AI summary label is one type step too large and the wrong tone — `major`
- **Axis:** token fidelity
- **Figma:** `I91:947;88:762` — `fontSize.xs` (12) / `lineHeight.xs` (18), medium,
  `colors.textSecondary`.
- **Code:** `AiSummaryBar.tsx:36` — `<Text variant="callout" weight="medium">` (14/20) with no
  `tone`, so it renders `textPrimary` at 14px and out-weighs the tab labels beside it.
- **Fix:** `<Text variant="caption" weight="medium" tone="secondary">`.

### 7. Header status word is rendered muted grey, Figma colours it with the status — `major`
- **Axis:** token fidelity
- **Figma:** `I91:906;87:736` (`StatusDot`) — the *label* is `colors.warning` medium, the same
  token as the dot beside it; the dot and word read as one coloured unit.
- **Code:** `TicketDetailHeader.tsx:78-80` — the dot gets `toneColor(statusTone, theme)` (`:75`)
  but the label is `<Text variant="caption" tone="muted">`, regular weight.
- **Fix:** drive the label's colour from the same `toneColor(statusTone, theme)` value and set
  `weight="medium"`.

### 8. Assign / Status pill padding and label tokens are one step off — `minor`
- **Axis:** token fidelity
- **Figma:** `91:914` / `91:916` — `px: spacing.md` (12), `py: spacing.xs` (4), 26px tall, label
  `fontSize.xs` **medium** `colors.textSecondary`, `radius.full`, `border: colors.borderDefault`.
- **Code:** `TicketDetailHeader.tsx:105-106` and `:124-125` — `paddingHorizontal: theme.spacing.sm`
  (8), `paddingVertical: theme.spacing.xxs` (2); labels at `:110` / `:130` are
  `<Text variant="caption">` with no `weight` and no `tone` (→ `textPrimary`).
- **Fix:** `spacing.md` / `spacing.xs`, and `weight="medium" tone="secondary"` on both labels.

### 9. Header vertical padding is symmetric; Figma is 8 top / 12 bottom — `minor`
- **Axis:** token fidelity
- **Figma:** `91:896` — `pt: spacing.sm` (8), `pb: spacing.md` (12), `px: spacing.lg`.
- **Code:** `TicketDetailHeader.tsx:52` — `paddingVertical: theme.spacing.md` on both edges.
- **Fix:** split into `paddingTop: theme.spacing.sm` / `paddingBottom: theme.spacing.md`.

### 10. Message rail is a flush square border, not an inset rounded bar — `minor`
- **Axis:** structure & order
- **Figma:** `I91:981;89:758` — the rail is a discrete child: 3px wide, `radius.full`,
  `self-stretch`, sitting **inside** the row's `px: spacing.lg` with `gap: spacing.md` (12) before
  the text — so the rail starts 16px in and the body starts at ~31px.
- **Code:** `MessageRow.tsx:44-48` — `borderStartWidth: 3` on the padded container, so the rail is
  square-ended, flush against the screen edge, and the body starts 16px from the rail. (The
  `borderStartWidth` *technique* is plan-directed —
  `07-story-ticket-detail-and-conversation-SCRUM-30.md:124` — and correct for RTL; only the inset,
  the rounding and the gap are the drift.)
- **Fix:** render the rail as a `<View style={{ width: 3, borderRadius: radius.full,
  alignSelf: 'stretch' }} />` inside a `flexDirection: 'row'` row with `gap: spacing.md`.

### 11. Composer padding and row gap are one step short — `minor`
- **Axis:** token fidelity
- **Figma:** `91:1011` — `pt: spacing.md` (12), `pb: spacing.lg` (16), `gap: spacing.md` (12)
  between the chip row and the input row.
- **Code:** `ReplyComposer.tsx:36-37` — `paddingVertical: theme.spacing.md` (both edges) and
  `gap: theme.spacing.sm` (8).
- **Fix:** `paddingTop: spacing.md` / `paddingBottom: spacing.lg`, container `gap: spacing.md`.

### 12. AI summary bar is a fixed 40px block with a 16px chevron — `minor`
- **Axis:** token fidelity
- **Figma:** `91:947` — height comes from `py: spacing.sm` (8) around an 18px label line; the
  trailing chevron is a 20px `Icon`, the leading sparkle 16px.
- **Code:** `AiSummaryBar.tsx:8,30` — `BAR_HEIGHT = 40` hard-coded rather than derived from the
  padding scale; `:40` — `<Icon name="chevronDown" size={16} />`.
- **Fix:** drop `BAR_HEIGHT` for `paddingVertical: theme.spacing.sm`, and set the chevron to
  `size={20}`.

### 13. Header meta separator and priority label use adjacent-but-wrong tokens — `minor`
- **Axis:** token fidelity
- **Figma:** `91:909` separator dot is `palette.neutral400` (`#c4c7cf` = `borderStrong`) at 3×3;
  `I91:906;87:735` status dot is **7px**; `I91:910;87:749` priority label is
  `colors.textSecondary`.
- **Code:** `TicketDetailHeader.tsx:85` — separator `theme.colors.borderDefault` (`#e3e5ea` =
  `borderDefault`, one step lighter); `:19` — `DOT_SIZE = 8`; `:90` — priority label
  `tone="muted"`.
- **Fix:** separator → `borderStrong`; priority label → `tone="secondary"`. (`DOT_SIZE` 8 vs 7 is
  off-scale in Figma too — leave at 8.)

### 14. Contact-strip avatar is 40px; Figma is 36px — `minor`
- **Axis:** token fidelity
- **Figma:** `I91:918;88:738` — `size-[36px]`, `bg: colors.primarySubtle`, initials
  `palette.blue800` semibold `fontSize.sm`.
- **Code:** `ContactStrip.tsx:15` — `AVATAR_SIZE = 40`, `:40` — `tint="info"` (→ `bgTabActive` +
  `statusInfo` text). The 40 was specified by the plan
  (`07-story-ticket-detail-and-conversation-SCRUM-30.md:118`), which mis-read the frame; the tint
  substitution is `Avatar.tsx:11-18`'s documented hex-ban workaround and is fine.
- **Fix:** set `AVATAR_SIZE = 36` to match `91:918` and the 36px `IconButton`s beside it.

### 15. Internal mode outlines the input but does not tint it — `minor`
- **Axis:** states
- **Figma:** the `ReplyComposer` component description (`91:798`) specifies *"Mode=Internal turns
  the accent purple **and tints the field** so a private note can never be sent by mistake."*
- **Code:** `ReplyComposer.tsx:76,80-81` — background stays `bgSurfaceSunken` in both modes; only
  a 1px `borderInternal` outline is added.
- **Fix:** swap the field background to `theme.colors.bgInternalSubtle` while
  `mode === 'internal'`. (The internal variant is not rendered in frame `7:1638`, so the exact
  fill is a design call — see the flag below.)

### 16. `FilterChip` is built on substituted tokens — `flag`
- **Axis:** open design flags (design-system plan §15 flag 7)
- **Figma:** the composer chips (`I91:1011;91:756` / `:758`) are `px: spacing.md`,
  `py: spacing.xs`, `fontSize.xs` medium; selected = `bg colors.primary` **with a
  `colors.primary` border**, text `colors.onPrimary`; unselected = `border colors.borderDefault`,
  text `colors.textMuted`.
- **Code:** `core/components/FilterChip.tsx:19-27` (its own doc comment) — built against
  `borderStrong` / `textSecondary` unselected, `paddingVertical: spacing.sm` (8, not 4), and no
  border at all when selected, because the Figma `FilterChip` component sits on the corrupt legacy
  import collection. The composer's chips therefore sit ~8px taller and a shade darker in their
  unselected border than frame `7:1638` shows.
- **Do not resolve here** — flag 7 needs the Figma component repaired first.

### 17. `pending` status still has no colour token — `flag`
- **Axis:** open design flags (story 03 open question 1, carried by story 07)
- **Figma:** renders `pending` lavender; the 35-token semantic palette has no purple status token
  (the purple added by story 07 is scoped to internal notes only).
- **Code:** `StatusBadge.tsx:11-16,23-24` — ships `bgSurfaceSunken` / `secondary` as an interim,
  and `TicketDetailHeader.tsx:48,75` inherits it for the header dot.
- **Do not resolve here** — needs a design decision on a status purple.

### 18. AI summary renders an expanded "not available yet" body — `intentional`
- **Axis:** structure & order
- **Figma:** `91:947` designs the bar as live content: a chevron with no designed expanded panel.
- **Code:** `AiSummaryBar.tsx:43-49` — expanding shows `ticketDetail.aiSummaryPending`.
- **Justified by:** `07-story-ticket-detail-and-conversation-SCRUM-30.md:459` and open question 4
  — BRD `:650` asks only for a reserved collapsible slot; there is no AI backend in phase 1.

### 19. Attach button is permanently disabled — `intentional`
- **Axis:** states
- **Code:** `ReplyComposer.tsx:59-63` — `disabled` with a `TODO`, dimmed to `opacity.disabled`.
- **Justified by:** `07-…SCRUM-30.md:479` and open question 6 — API §8 (Storage) is 🔨.

### 20. Internal-note chip carries a lock glyph Figma does not show — `intentional`
- **Axis:** component identity
- **Figma:** `I91:1011;91:758` — label only, no icon.
- **Code:** `ReplyComposer.tsx:53` — `icon="lock"`.
- **Justified by:** `07-…SCRUM-30.md:476` and `22-story-post-an-internal-note-SCRUM-32.md:20` —
  BRD `:674`/`:676` require colour **and** icon **and** label together.

### 21. Composer renders an inline error line — `intentional`
- **Axis:** states
- **Figma:** no error slot in `91:1011`.
- **Code:** `ReplyComposer.tsx:106-110`, fed from `TicketDetailScreen.tsx:147`.
- **Justified by:** stories 21/22 — a send failure must be surfaced; Figma omits error states
  across the board (design-system plan §15 flag 6).

## Verified correct

- Section order matches `7:1638` exactly: header → contact strip → tab bar → AI summary → thread →
  composer (`TicketDetailScreen.tsx:79-149`).
- Header composition: back `IconButton` (36, ghost) + reference `caption`/`textMuted` on one row,
  subject `heading`/`semibold` with `tracking.tight` — Figma's `fontSize.lg`/`lineHeight.lg`/600/
  `-0.3` resolves to exactly `variant="heading"` (`typography.ts:99`).
- Message rail colours are the right tokens in both palettes: customer `statusInfo` (= `blue500`),
  agent `statusSuccess` (= `green500` `#2e7d32`, Figma `palette.green500`), internal
  `borderInternal` (= `purple500` `#6750a4`, Figma `palette.purple500`); internal wash
  `bgInternalSubtle` (= `purpleSubtleLight` `#f3eef9`, Figma `palette.purple50`)
  (`MessageRow.tsx:29-31`, `colors.ts:56-59`, `primitives.ts:64-68`).
- `INTERNAL` pill matches `I91:989;89:771` — `radius.full`, `borderInternal` outline, `px xs`/
  `py xxs`, 10/16 semibold `textInternal`, lock glyph (`MessageRow.tsx:57-64`; `overline` =
  `fontSize.xs2`/`lineHeight.xs2`).
- Author name (`callout`/semibold/`textPrimary`) and timestamp (`caption`/`textMuted`) and the
  `spacing.xs` gap to the body all match `91:981`.
- Composer input field: `bgSurfaceSunken`, `radius.lg` (16), `px md` / `py sm` — exact match to
  `I91:1011;91:765` (`ReplyComposer.tsx:76-79`).
- Contact strip: `px lg` / `py md`, `gap md`, `borderSubtle` bottom hairline (Figma `colors.border`
  `#e8ebf0` = `borderSubtle` per `primitives.ts:20`), name `callout`/medium, subtitle
  `caption`/muted, two 36px ghost `IconButton`s with `gap xs` — all match `91:918`.
- `Tab` itself is faithful: `pt sm`, `gap sm`, 14/20 semibold-active / medium-inactive,
  `tabActive`/`tabInactive`, 2px full-width `radius.full` indicator (`Tab.tsx:14-42` vs
  `I91:935;87:774`). Only the *bar* is wrong (finding 2) — the three-segment control itself is
  correct, so nothing about the History segment's presence is a defect here.
- **RTL:** no physical layout props anywhere in the audited files — every rail is
  `borderStartWidth`/`borderStartColor` (`MessageRow.tsx:44-45`,
  `TicketDetailHeader.tsx:89`), all other spacing is `gap` / `paddingHorizontal`; `arrowBack` and
  `send` are in `Icon.tsx:111`'s `DEFAULT_MIRRORED`.
- **Dark theme:** zero hex literals outside `primitives.ts`; every colour reads through
  `theme.colors.*`, and each token used here has a `darkColors` counterpart (`colors.ts:65-113`).
  The only non-token colour strings are `'transparent'`.
- **States:** loading (`SkeletonList`), error (`ErrorState` + retry) and empty (`EmptyState`) paths
  all exist for both the detail query and the message list
  (`TicketDetailScreen.tsx:55-71,128-140`) even though `7:1638` designs none of them.

## Needs a visual check

- The composer's **Mode=Internal** variant is not rendered in frame `7:1638` (only the default
  state is), so finding 15's exact fill/accent treatment needs the internal variant of `91:798`
  pulled up in Figma before it can be specified precisely.
- Whether the thread scrolls under a sticky header/tab bar or the whole page scrolls: the frame is
  a static composition, and `TicketDetailScreen.tsx:111` fixes the chrome and scrolls only the
  `FlatList`. That reads as the right call but is not decidable from the frame.
- `KeyboardAvoidingView` behaviour with the composer (`TicketDetailScreen.tsx:78`) — runtime only.
