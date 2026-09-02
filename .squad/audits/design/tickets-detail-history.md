# Tickets — Detail (History timeline) — design audit

**Figma:** `187:1192` (list `187:1347`, row `187:1356`) · **Code:** `src/features/tickets/components/HistoryRow.tsx`
**Verdict:** major drift

## Summary

The data is right and the event coverage is complete — all four `event_type` members have a code
path, ordering is newest-first, and the story-17 agent-name resolution landed as planned. The
*visual* row, however, is a different component from the one designed. Figma's `HistoryRow` is a
two-line block — a header line with the actor's name (semibold, leading) and the timestamp (muted,
trailing, **same line**), and the event sentence underneath in `textSecondary` — separated from its
neighbours by a 1px bottom border. The code renders a leading event-type icon (which does not exist
anywhere in the Figma frame), folds the actor into the sentence string, drops the timestamp to a
third line, and draws no divider. The single most important fix is to rebuild `HistoryRow`'s layout
to the designed header/body anatomy and drop the icon; the token drift (padding, body tone, divider)
falls out of that same rewrite.

There is **no connector line, rail, or timeline spine in the Figma design** — the frame is a plain
bordered list, not a vertical timeline. Neither design nor code has one, so nothing is missing there.

## Findings

### 1. Row anatomy is inverted — no actor/timestamp header line — `blocker`
- **Axis:** structure & order / component identity
- **Figma:** `187:1356` → `Container` (col, `gap spacing.xs`) containing `Header` (row,
  `justify-between`, `gap spacing.sm`) with `Author` leading and `Time` trailing on the **same
  line**, then `Body` (the sentence) on the line below. Author = `fontSize.sm`/`lineHeight.sm`,
  weight 600, `colors.text`. Time = `fontSize.xs`/`lineHeight.xs`, regular, `colors.textMuted`.
  Body = `fontSize.sm`/`lineHeight.sm`, regular, `colors.textSecondary`.
- **Code:** `HistoryRow.tsx:70-79` — a horizontal row of `Icon` + a single flex column holding
  sentence then timestamp, i.e. three stacked lines with no header. The actor is not a separate
  element at all: it is interpolated into the sentence via `{{actor}}`
  (`HistoryRow.tsx:38`, `en.json:163-171`), so `Amara Osei` renders at body weight inside the
  sentence rather than as the bold row header the design leads with.
- **Fix:** Restructure to `<View column gap=xs>` → `<View row justifyContent="space-between">
  <Text variant="callout" weight="semibold">{actor}</Text><Text variant="caption" tone="muted">
  {time}</Text></View>` + `<Text variant="callout" tone="secondary">{sentence}</Text>`, and strip
  `{{actor}}` from all six `ticketDetail.event.*` templates so the sentence starts at the verb
  ("Changed status from New to In Progress.").

### 2. Leading event-type icon is not in the design — `major`
- **Axis:** structure & order
- **Figma:** `187:1356`'s child tree (see `get_metadata`) is `Container > Header{Author, Time} +
  Body`. There is **no icon node** in any of the six `HistoryRow` instances (`187:1356`, `:1372`,
  `:1388`, `:1404`, `:1420`, `:1436`), and none is visible in the render.
- **Code:** `HistoryRow.tsx:22-27` defines `EVENT_ICON` and `:72` renders
  `<Icon name={EVENT_ICON[event.eventType]} size={16} color={theme.colors.iconDefault} />`,
  consuming the row's leading `spacing.md` gap (`:71`). `size={16}` is also a raw literal.
- **Fix:** Remove `EVENT_ICON` and the `Icon` render, or take the icon column back to design as a
  proposal — do not keep an undesigned element in the row.

### 3. No divider between rows — `major`
- **Axis:** token fidelity / structure
- **Figma:** every `HistoryRow` carries `border-b border-solid` at `stroke weight/1` in
  `colors.border` = `#e8ebf0` (= app `borderSubtle` / `primitives.neutral200`), on
  `colors.surface` (`#ffffff`, = `bgSurface`).
- **Code:** `HistoryRow.tsx:83-86` — `styles.root` has no border; `TicketDetailScreen.tsx:120-126`
  renders the `FlatList` with no `ItemSeparatorComponent`. Rows run together with no separation.
- **Fix:** Add `borderBottomWidth: StyleSheet.hairlineWidth`-or-`1` with
  `borderBottomColor: theme.colors.borderSubtle` to `HistoryRow`'s root (matching the design's
  per-row border, including on the last row).

### 4. Body sentence uses the wrong text token — `major`
- **Axis:** token fidelity
- **Figma:** `187:1363` Body → `colors.textSecondary` (`#44474f`).
- **Code:** `HistoryRow.tsx:74` — `<Text variant="callout">{sentence}</Text>`; `Text`'s default
  `tone` is `primary` (`Text.tsx:74`), resolving to `textPrimary` / `#181c22`. The sentence renders
  at full-strength body colour, which also flattens the intended contrast against the (currently
  missing) bold actor header.
- **Fix:** `<Text variant="callout" tone="secondary">`.

### 5. Reassignment does not render its `from` value — `major`
- **Axis:** structure & order (content)
- **Figma:** row `187:1372` reads "Reassigned from Kofi Mensah to Amara Osei." — a distinct
  from→to sentence — while `187:1420` reads "Assigned to Kofi Mensah." for a first assignment.
- **Code:** `HistoryRow.tsx:59-67` has one non-null branch, `ticketDetail.event.assigned` =
  `"{{actor}} assigned the ticket to {{to}}"` (`en.json:166`). `event.fromValue` exists on the
  type (`types.ts:82`) and is used for `status_changed`/`priority_changed` (`:46-57`) but is never
  read for `assigned`, so a reassignment is indistinguishable from a first assignment.
- **Fix:** Branch on `event.fromValue` in the `assigned` case and add a `reassigned` key resolving
  both ids through `resolveAgentName`. Note the story-17 plan scopes out `from_value` resolution
  only for `status_changed`/`priority_changed` — it does not cover this case.

### 6. Timestamp format is absolute where design shows relative-day — `minor`
- **Axis:** structure & order (content) / token fidelity
- **Figma:** `Today, 10:24`, `Today, 08:02`, `Yesterday, 16:52`, `Yesterday, 09:15` — relative day
  label + `HH:mm`.
- **Code:** `HistoryRow.tsx:76` → `formatDateTime` (`core/utils/format.ts:23-32`) =
  `{ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }` → "12 Sep, 10:24". No
  helper in `format.ts` produces the Figma pattern (`formatRelative` at `:49-64` is "3 hours ago",
  a different shape).
- **Fix:** Add a `formatDayTime` helper to `core/utils/format.ts` that emits localised
  Today/Yesterday + `formatTime`, falling back to `formatDateTime` beyond two days.

### 7. Row vertical padding one spacing step short — `minor`
- **Axis:** token fidelity
- **Figma:** `px-[spacing.lg]` (16) `py-[spacing.md]` (12) → designed row height 68 for a two-line
  body (12 + 20 + 4 + 20 + 12).
- **Code:** `HistoryRow.tsx:71` — `paddingVertical: theme.spacing.sm` (8), `paddingHorizontal:
  theme.spacing.lg` (16). Horizontal is right; vertical is 8 where Figma binds 12.
- **Fix:** `paddingVertical: theme.spacing.md`.

### 8. Missing 4px gap between header and body — `minor`
- **Axis:** token fidelity
- **Figma:** `187:1358` Container `gap-[spacing.xs]` (4) between `Header` and `Body`.
- **Code:** `HistoryRow.tsx:73-78` — `styles.body` is `{ flex: 1 }` (`:85`) with no `gap`; the two
  `Text`s stack at 0.
- **Fix:** `gap: theme.spacing.xs` on the body column. (The `gap: theme.spacing.md` at `:71` is the
  icon↔body gap and disappears with finding 2; the header's own internal gap is `spacing.sm`.)

### 9. List area does not sit on the canvas colour — `minor`
- **Axis:** token fidelity / dark theme
- **Figma:** the `HistoryList` region resolves `colors.background` `#f8f9fb` (= `bgCanvas` /
  `primitives.neutral50`) behind white (`colors.surface`) rows, so the space below the last row
  reads as the end of the list.
- **Code:** `TicketDetailScreen.tsx:77` sets the whole screen to `theme.colors.bgSurface` (white)
  and neither the `FlatList` (`:120-126`) nor `HistoryRow` sets a background, so the list and the
  empty space below it are the same white — no visual list terminus.
- **Fix:** Give the History list container `backgroundColor: theme.colors.bgCanvas` and the row
  `backgroundColor: theme.colors.bgSurface`. (Scoped to the list container only — the screen-level
  `SafeAreaView` background belongs to the `7:1638` header audit.)

### 10. Loading / error / empty have no designed counterpart — `minor`
- **Axis:** states
- **Figma:** frame `187:1192` shows only the populated list. There is no empty, skeleton, or error
  variant of the History segment anywhere in the frame.
- **Code:** `TicketDetailScreen.tsx:113-119` implements all three — `SkeletonList count={4}`,
  `ErrorState onRetry`, and `EmptyState icon="clock" title={t('ticketDetail.empty.history')}`
  ("No events recorded yet.", `en.json:175`). All three use the real `core/components` primitives.
- **Fix:** Nothing to change in code — raise the three missing variants back to design so the app's
  invented copy and icon choice get a decision rather than staying undesigned.

### 11. Agent-name resolution and the unassign sentence — `intentional`
- **Axis:** structure & order (content)
- **Plan:** `.squad/plans/tickets/17-story-ticket-history-timeline-SCRUM-35.md`, tasks 1 and 2.
- **Code:** `HistoryRow.tsx:10-20`/`:59-67` (`resolveAgentName`, `"another agent"` fallback,
  the separate `unassigned` sentence) and `TicketDetailScreen.tsx:45-50` (roster gated on the
  History tab). Figma has no unassign or unknown-agent row to compare against; the plan justifies
  both. Recorded, no action.

## Verified correct

- **Event-type coverage is complete.** All four `event_type` members (`created`, `status_changed`,
  `assigned` incl. the null/unassign branch, `priority_changed`) have a code path
  (`HistoryRow.tsx:41-68`), and every event kind the Figma frame renders — creation, status change,
  assignment, reassignment — maps onto one of them. No designed event type is unreachable.
- **No connector line/rail in either design or code.** The Figma list is a bordered list, not a
  spine-and-node timeline; the code's absence of a rail is faithful, not a gap.
- **Segmented control's History state renders correctly.** `TicketDetailScreen.tsx:87-105` renders
  the three tabs in Figma's order (Conversation / Internal notes / History) via the real
  `TabBar`/`Tab` primitives; `Tab.tsx:24-38` gives the selected tab `tabActive` colour, semibold
  weight, and a 2px full-radius underline — matching `187:1229-1232`. (Not re-audited further; the
  bar's own `paddingHorizontal` belongs to the `7:1638` audit.)
- **Timestamp typography and tone are right** even though its placement is not:
  `HistoryRow.tsx:75-77` `variant="caption"` = 12/18 with `tone="muted"` → `textMuted` `#6b6e76`,
  exactly Figma's `fontSize.xs`/`lineHeight.xs`/`colors.textMuted`.
- **Body sentence metrics are right:** `variant="callout"` = 14/20 = Figma's
  `fontSize.sm`/`lineHeight.sm`. Only the colour token is wrong (finding 4).
- **No hex literals, no raw colours** — every colour in `HistoryRow.tsx` reads
  `theme.colors.*` (`:72`) or a `Text` `tone`, so both palettes resolve. Hard rule 2 clean.
- **RTL clean.** `HistoryRow.tsx:71,84` uses `paddingVertical`/`paddingHorizontal`/`flexDirection:
  'row'` only — no `marginLeft`/`marginRight`, no `left`/`right`. Hard rule 5 clean. The designed
  header uses `justify-between`, which mirrors correctly under RTL when implemented.
- **Single-font rule clean.** All text goes through `@/core/components` `Text` with `variant`/
  `weight`; no `fontWeight`/`fontFamily` style keys anywhere in the file.
- **No edit/delete affordance** on a row (`HistoryRow.tsx:70-80` has no `Pressable`), matching both
  the design and BRD `:721`.
- **None of the ten open §15 design-system flags** are touched by this segment.

## Needs a visual check

- **Long-sentence wrapping.** Figma pins every `Body` at a single 20px line and every `Time` at a
  fixed 78–104px width. Whether a long Arabic reassignment sentence wraps to two lines, and whether
  the timestamp shrinks or truncates when it does, cannot be settled statically — check on device
  in `ar` once the header/body layout of finding 1 is in.
- **`ticket_events` DELETE rejection (BRD `:722`)** remains unverified per the story plan's own open
  finding; that is a backend test, not a design question, and is out of this audit's scope.
