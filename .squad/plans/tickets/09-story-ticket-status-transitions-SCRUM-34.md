# Story 09 — Ticket status transitions (Story: SCRUM-34)

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md).
  This story is the **first consumer of `TextArea` outside a form screen** and the third of
  `BottomSheet` + `SheetHeader`.
- **Story 04 completed** — [`04-story-ticket-list-with-filters-SCRUM-27.md`](04-story-ticket-list-with-filters-SCRUM-27.md).
  It owns `src/features/tickets/`, `ticketKeys`, `StatusBadge` and the `ticket.status.*` locale
  keys this story reuses rather than duplicating.
- **Story 07 must be implemented before this one.** ⚠️ **Read this bullet before starting.**
  [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md)
  is **planned but not yet in the tree** — `ls src/features/tickets/` returns `api.ts`,
  `components/` (`StatusBadge.tsx`, `TicketRow.tsx` only), `grouping.ts`, `hooks.ts`, `index.ts`,
  `screens/` (`TicketsScreen.tsx` only), `types.ts`. **Four** things this story needs come from
  story 07 and exist nowhere else: `state-machine.ts` (task 2 depends on it and **must not
  rewrite it**), the **Status** button on `TicketDetailHeader` with its `onStatusPress` /
  `statusDisabled` props, `TicketDetailScreen` (the sheet's host), and `useTicketDetail` /
  `ticketKeys.detail`. **Do not start story 09 until story 07 is merged.**
- **Story 08 is not a dependency, but read its task 5 first.**
  [`08-story-assign-a-ticket-SCRUM-33.md`](08-story-assign-a-ticket-SCRUM-33.md) builds the
  sibling sheet behind the header's *other* button. The two are independent in data terms and
  **both edit `TicketDetailScreen.tsx`**; whichever lands second follows the first's `visible` /
  `onClose` state pattern rather than inventing a second one. If 08 has landed, copy its shape.
- **Coordination:** none outside the repo. API §4.9 is ✅ and its three negative tests are already
  written; the trigger and the `status_changed` event are server-side and this story adds no
  `ticket_events` insert.

---

## Story Goal

Let an agent move a ticket through its lifecycle from the ticket detail screen, offering only the
transitions the state machine actually permits.

1. Tapping **Status** in the detail header opens a bottom sheet titled "Change status".
2. The sheet shows the ticket's **current** status, then one selectable option per **legally
   reachable** target state — read from `state-machine.ts`, never from a fresh list.
3. Choosing **Resolved** reveals a required resolution-note field. The submit button stays
   disabled until the note is non-empty.
4. **Update status** issues API §4.9's single PATCH and closes the sheet.
5. A `closed` ticket cannot be transitioned at all — the header's button is already `disabled`
   there, and the sheet has no options to offer.
6. When the database rejects a transition anyway, the Postgres exception is **mapped to a
   localised message**, never rendered raw.
7. `resolved_at`, `closed_at` and the `status_changed` event are written **server-side**. This
   client sends `status` and, when resolving, `resolution_note` — nothing else.

**Not in scope.** CSAT capture (US-027, unbuilt — and it is what BRD §6 says should normally drive
`resolved → closed`; see flag 5); notifying the customer of a status change (US-024/US-030,
unbuilt); bulk status changes; editing a resolution note after the fact; changing **priority**
(`priority_changed` exists in the `event_type` enum and Figma has a `PriorityOption` sibling
component, but no BRD story covers it in phase 1).

---

## Context — Read These Files First

1. `docs/phase1_api_reference.md` **§4.9, lines 293-313** — the whole section, **including the
   negative-test table**. One `PATCH` with `{"status": "resolved", "resolution_note": "…"}`. The
   three rejections it lists are the exact strings task 3 maps:
   `Illegal transition: new → closed`, `A resolution note is required when resolving a ticket`,
   `Illegal transition: closed → open`. Read the closing note — *"These are the most valuable
   requests in the whole collection"* — it is the reason verification step 1 exists.
2. `docs/phase1_brd_1.md` **lines 216-247** — §6, the state machine, with the transition table and
   the four rules beneath it. Rules 1 and 3 (*"rejected at the database layer, not just hidden in
   the UI"*, *"`resolved_at` and `closed_at` set on entry"*) define the whole division of labour
   in this story: the sheet is UX, the trigger is enforcement.
3. `docs/phase1_brd_1.md` **lines 695-707** — US-018's six acceptance criteria verbatim. Two of
   the six (`:706` illegal transition rejected by the API, `:707` the `status_changed` event) are
   satisfied by code this story does not write; they appear in `## Verification Steps`, not in the
   task list. That is intentional, not an omission.
4. `src/features/tickets/state-machine.ts` — created by story 07 task 3, **whole file**.
   `allowedTransitions`, `canTransition`, `requiresResolutionNote`, and the `TRANSITIONS` record
   transcribed from BRD `:220-247`. Read its header comment: *"If the two ever disagree, the
   database is right and this file is wrong."* **This story consumes it and adds nothing to it.**
   The intake is emphatic on this point and it is correct.
5. `src/features/auth/api.ts:9-30` — `AUTH_MESSAGE_KEYS` and `toAuthError`. This is **the**
   precedent for task 3: a domain-specific error mapper that reads the provider's `code`,
   falls back to `toAppError`, and returns an `AppError` with a better `messageKey`. Copy the
   shape, including the `typeof error === 'object' && 'code' in error` narrowing at lines 20-27.
6. `src/core/utils/errors.ts` — **whole file (103 lines)**. Two functions decide task 3's design:
   `readStatus` (lines 47-56) parses a `code` only when it is **all digits** (`/^\d+$/`), and
   `messageKeyFor` (lines 27-33) collapses everything non-network onto `states.errorBody`. A
   PostgREST trigger exception carries `code: "P0001"` — not digits — so `toAppError` alone yields
   `kind: 'unknown'` and the generic string. Task 3 exists precisely because of that.
7. `src/features/tickets/api.ts:225-247` — `TicketAlreadyClaimedError` and `claimTicket`. The
   compare-and-set shape task 4 reuses: `update(..., { count: 'exact' })`, a predicate narrowing
   the row to the state the UI last saw, `if (!count) throw`. Story 08 generalises the same
   pattern for `assigned_to`; task 4 does it for `status`.
8. `src/features/tickets/components/StatusBadge.tsx` — **whole file**. `styleFor` (lines 17-30)
   already resolved Figma's off-palette status hexes onto semantic tokens, and its header comment
   records that `pending` ships neutral because the palette has no purple. Task 6 renders
   `StatusBadge` and inherits that decision; **do not add a second status→colour map.**
9. `src/features/tickets/hooks.ts:20-34` — `ticketKeys` as story 04 left it, plus story 07's
   `detail` / `messages` / `events` additions. `ticketKeys.all` is `['tickets']` and prefixes all
   of them, which is why task 5 invalidates exactly one key and gets the detail, the history
   timeline, both lists and all five counts.
10. `src/core/components/TextArea.tsx` — **whole file (105 lines)**. `label`, `value`,
    `onChangeText`, `error`, `required`, `maxLength`, `showCounter`, and a `BOX_HEIGHT` of 108.
    Note `styles.label` applies `textTransform: 'uppercase'` — see the Arabic note in task 7.
11. `src/features/profile/components/LanguageSheet.tsx` — **whole file (59 lines)**. The
    `{ visible, onClose }` sheet shape and the "do not close on every outcome" discipline.
12. `src/features/home/screens/HomeScreen.tsx:33-36` and `:139-149` — `claimErrorMessageKey` and
    the `accessibilityLiveRegion="polite"` error line. Task 7's error surface copies both.
13. [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md),
    sections **"3 — The state machine"**, **"5 — Hooks"**, **"6 — Header and contact strip"** and
    **"9 — The screen"**. You are editing what that story built.
14. Figma `mdfP8RPdkUsKcJb0wFdkME`, nodes **`7:4232`** (the sheet) and **`123:1020`** (the
    `StatusOption` component set). Both are transcribed in task 1 — including **two things they
    do not contain**, which is the more important half.

---

## Product rules (from story)

| BRD `:695-707` criterion | Where it is met |
|---|---|
| "only legally reachable states are offered" | Task 7 — options come from `allowedTransitions(ticket.status)`. |
| "a transition to resolved … a resolution note is required" | Task 7 (client gate) **and** task 3 (server rejection mapped). Both paths, per the intake. |
| "when saved, then `resolved_at` is set" | **Server-side** (BRD §6 rule 3). Verification step 2. |
| "a closed ticket … any transition is rejected" | Story 07's `statusDisabled` on the header button, plus `TRANSITIONS.closed === []`. Verification 6, row 9. |
| "an illegal transition submitted directly to the API … the database rejects it" | **Not client code.** Verification step 1 runs §4.9's three negative tests. |
| "any transition … a `status_changed` event records from and to" | **The trigger.** Verification step 2 reads it back. |

**Three notes on the intake, all confirmed against the tree:**

- *"Use the shared `src/features/tickets/state-machine.ts` … never hardcode a fresh list here."*
  **Correct and binding** — but note that the file does not exist yet; story 07 creates it (its
  task 3). Story 09 is its **second** consumer and its first real one: story 07 uses only
  `allowedTransitions(...).length === 0` to disable a button.
- *"The database trigger is the actual enforcement; this sheet's job is UX, not security."*
  **Correct.** BRD §6 rule 1 says the same. Task 7 hides illegal options; task 3 assumes it will
  sometimes fail anyway and maps the failure.
- *"map it via the existing `utils/errors.ts` rather than showing the raw error text."*
  **Correct in intent, and it needs one more step than it sounds like.** `toAppError` cannot
  distinguish these failures — see context item 6. Task 3 adds a tickets-local mapper *on top of*
  `toAppError`, exactly as `auth/api.ts` does for GoTrue. Nothing in `core/utils/errors.ts`
  changes (hard rule 3 — `core/` must not learn about ticket statuses).

---

## Implementation tasks

### 1 — The Figma sheet, measured — and the two things it is missing

Node `7:4232` → `126:1024` `Sheet`:

```
126:1024 Sheet                      radius.xl top corners, colors.bgSurface, 288h total
├── 126:1025 SheetHeader            title "Change status", handle, bottom hairline
├── 126:1030 CurrentStatus          38h · pt spacing.md, pb spacing.sm, px spacing.lg, gap spacing.sm
│   ├── 126:1031 Label              "Current status:" — caption / textMuted
│   └── 126:1032 StatusBadge        the ticket's own status
├── 126:1034 Options                px spacing.lg, py spacing.xs, gap spacing.sm
│   └── 126:1035 StatusOption ×N    42h · p spacing.md, gap spacing.md, radius.md,
│                                   borderWidth 1 / borderSubtle, bgSurface
│       ├── StatusBadge (target state)
│       └── description             caption / textSecondary, flex 1
└── 126:1045 Footer                 p spacing.lg
    └── 126:1046 UpdateStatus       56h · Button variant="primary" fullWidth, radius.md
```

**Missing thing 1 — there is no resolution-note field in Figma.** The sheet is 288px tall with
exactly four children, none of them an input. The intake nonetheless requires the note, BRD `:703`
requires it, and API §4.9 rejects a resolve without one. Task 7 adds a `TextArea` between
**Options** and **Footer**, shown only when `resolved` is the selection. **Flag 1** — the sheet
grows by roughly 150px when it appears, which is a layout the designer has not seen.

**Missing thing 2 — `StatusOption` has no selected state.** Node `123:1020`'s variant axis is
`Status` only (`Status=New`, `=Open`, `=Pending`, `=Resolved`, `=Closed`); there is no
`Selected=true`. A picker whose options cannot look chosen is unusable, so task 6 invents one:
`borderColor: theme.colors.borderFocus` + `borderWidth: 1.5` + `backgroundColor:
theme.colors.bgPrimarySubtle`, plus `accessibilityState={{ selected }}`. **Flag 2** — invented,
not read off the file.

**Missing thing 3 — descriptions exist for only two states.** The sheet instance carries
"Waiting on the customer or a third party." (`pending`) and "Issue has been fixed and
communicated." (`resolved`). `description` is a free text property with no per-variant default, so
`open` and `closed` have none. Task 9 authors both. **Flag 3.**

Everything else maps onto existing tokens. Figma's `StatusBadge` hexes (`#fff0e0`/`#7a3600`,
`#ede7f6`/`#4a3580`, …) are **already resolved** by `StatusBadge.tsx:17-30` — render the component,
do not re-read the file's colours, and write no hex (hard rule 2).

### 2 — The state machine: consume, do not touch

**File: `src/features/tickets/state-machine.ts`** — **read only.** Story 07 transcribed
BRD `:220-247` into it. This story imports three functions and adds nothing:

```ts
allowedTransitions(from: TicketStatus): readonly TicketStatus[]
canTransition(from: TicketStatus, to: TicketStatus): boolean
requiresResolutionNote(to: TicketStatus): boolean
```

**Before writing anything else, verify the file matches the BRD table** — `new → [open]`,
`open → [pending, resolved]`, `pending → [open, resolved]`, `resolved → [closed, open]`,
`closed → []`. If story 07 shipped it wrong, fix it **there**, in that one file, and say so in the
PR. Do not paper over a wrong table with a second list in the sheet; that is precisely the failure
the intake is warning about.

`canTransition` is used in task 4 as a **pre-flight assertion**, not as a security control — see
the comment required there.

### 3 — Mapping the trigger's exception

**File: `src/features/tickets/api.ts`** — append, above the mutation in task 4.

A trigger's `RAISE EXCEPTION` reaches supabase-js as a `PostgrestError`: `{ message, details,
hint, code }`. There is **no `status` field on the error object**, and `code` is `"P0001"`, which
`readStatus` (`errors.ts:50-54`) rejects because it is not all digits. So `toAppError` returns
`kind: 'unknown'` / `messageKey: 'states.errorBody'` — a generic string for an error the agent can
actually act on. Map it, the way `auth/api.ts:17-30` maps GoTrue codes:

```ts
/**
 * The `status` trigger's exceptions, keyed by the message fragments API §4.9
 * documents (lines 303-311). Matched on the message rather than on `code`,
 * because a `RAISE EXCEPTION` reports the generic `P0001` for all three — the
 * text is the only thing that distinguishes them. Verification step 1 captures
 * the real payloads; if `code` turns out to be specific, prefer it and keep
 * these as the fallback.
 */
const STATUS_ERROR_PATTERNS: readonly [RegExp, string][] = [
  [/resolution note is required/i, 'ticketDetail.status.errors.noteRequired'],
  [/illegal transition/i, 'ticketDetail.status.errors.illegalTransition'],
];

export function toStatusChangeError(error: unknown): AppError {
  const base = toAppError(error);
  const match = STATUS_ERROR_PATTERNS.find(([pattern]) => pattern.test(base.message));
  if (match) return { ...base, kind: 'validation', messageKey: match[1] };
  return base;
}
```

Import `type AppError` alongside the existing `toAppError` from `@/core/utils`.

**Do not touch `src/core/utils/errors.ts`.** `core/` cannot know what a ticket status is
(hard rule 3), and `AUTH_MESSAGE_KEYS` set the precedent that domain error vocabularies live in
the feature that owns them. **Never render `base.message`** — it is developer-facing English
straight from Postgres and `AppError.message`'s own doc comment says so (`errors.ts:11`).

### 4 — The mutation (data)

**File: `src/features/tickets/api.ts`** — append.

```ts
/** Thrown when the ticket's status changed between the sheet rendering and the PATCH landing. */
export class TicketStatusChangedError extends Error {
  constructor() {
    super('Ticket status changed before this update was applied');
  }
}

export type ChangeTicketStatusInput = {
  ticketId: string;
  to: TicketStatus;
  /** The status the sheet was rendered against — the compare-and-set guard. */
  expectedCurrentStatus: TicketStatus;
  /** Required when `to` is `resolved` (BRD §6, API §4.9). */
  resolutionNote?: string;
};

export async function changeTicketStatus(input: ChangeTicketStatusInput): Promise<void> {
  const payload: { status: TicketStatus; resolution_note?: string } = { status: input.to };
  if (requiresResolutionNote(input.to)) payload.resolution_note = input.resolutionNote?.trim();

  const { count, error } = await supabase
    .from('tickets')
    .update(payload, { count: 'exact' })
    .eq('id', input.ticketId)
    .eq('status', input.expectedCurrentStatus);

  if (error) throw toStatusChangeError(error);
  if (!count) throw new TicketStatusChangedError();
}
```

Five constraints on that function, each of which has a way of being got wrong:

- **Send `status` and, when resolving, `resolution_note` — nothing else.** No `resolved_at`, no
  `closed_at`, no `updated_at`. BRD §6 rule 3 puts those server-side, and API §4.7's *"generated
  server-side — don't send them"* note is the same discipline one section up. A client-set
  `resolved_at` would make Home's "Resolved today" count lie.
- **`.eq('status', expectedCurrentStatus)` is the compare-and-set guard**, the same shape as
  `claimTicket`'s `.is('assigned_to', null)`. Two agents resolving the same ticket at once
  produces one winner and one `TicketStatusChangedError` rather than a silent second write.
- **Only attach `resolution_note` when `requiresResolutionNote(to)`.** Sending it on a
  `open → pending` transition writes a note against a non-resolution, and sending
  `resolution_note: undefined` inside the object literal at all is the kind of thing that turns
  into an explicit `null` after one refactor.
- **`.trim()` the note.** A field containing only spaces passes a `length > 0` check in the UI and
  is not a resolution note. Trim at the boundary so the server never stores it.
- **Errors go through `toStatusChangeError`, not `toAppError`.** That is the entire point of
  task 3; a plain `toAppError` here silently reverts this story's error handling to generic.

Add a pre-flight assertion at the top, and comment it honestly:

```ts
// Defence in depth only. The trigger is the enforcement (BRD §6 rule 1) — this
// catches a UI bug that offered an illegal option, and must never be presented
// as the security boundary.
if (!canTransition(input.expectedCurrentStatus, input.to)) throw new TicketStatusChangedError();
```

### 5 — The mutation hook

**File: `src/features/tickets/hooks.ts`** — append below `useClaimTicket`. `ticketKeys` needs no
change.

```ts
export function useChangeTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ChangeTicketStatusInput, 'ticketId'>) =>
      changeTicketStatus({ ticketId, ...input }),
    onSuccess: () => {
      // One key covers everything a status change moves: the detail row, the
      // history timeline (`['tickets', id, 'events']` — the trigger just wrote
      // to it), both lists, the three chip counts, and Home's "Resolved today".
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}
```

**`ticketKeys.all` is the right blast radius here, unlike `usePostTicketMessage`.** Story 07
deliberately narrowed *that* mutation to a single thread key because a message changes no list and
no count. A status change moves the Mine/Unassigned/All counts, the day-grouped lists, Home's
three stats **and** the history timeline. Narrowing this one would leave stale numbers on two
screens. Say so in the comment; the asymmetry looks like an oversight otherwise.

### 6 — `StatusOption`

**Create file: `src/features/tickets/components/StatusOption.tsx`**

```tsx
export type StatusOptionProps = {
  status: TicketStatus;
  description: string;
  selected: boolean;
  onPress: (status: TicketStatus) => void;
  disabled?: boolean;
};
```

A `Pressable` with `flexDirection: 'row'`, `alignItems: 'center'`, `gap: theme.spacing.md`,
`padding: theme.spacing.md`, `borderRadius: theme.radius.md`, `borderWidth: StyleSheet.hairlineWidth`,
containing `<StatusBadge status={status} />` and `<Text variant="caption" tone="secondary" style={{ flex: 1 }}>{description}</Text>`.

- **Selected treatment (invented — flag 2):** `borderColor: theme.colors.borderFocus`,
  `borderWidth: 1.5`, `backgroundColor: theme.colors.bgPrimarySubtle`. Unselected:
  `borderColor: theme.colors.borderSubtle`, `backgroundColor: theme.colors.bgSurface`.
- **`accessibilityRole="radio"`** with `accessibilityState={{ checked: selected, disabled }}`.
  These are mutually exclusive choices, not buttons, and the invented border is otherwise the only
  cue that one is chosen — a colour cue alone fails the same test BRD `:610` applies to priority.
- **`accessibilityLabel`** = `` `${t(`ticket.status.${status}`)}. ${description}` `` so a screen
  reader announces the badge, which renders as an unlabelled `View` otherwise.
- **No colour map.** Render `StatusBadge`; it owns the status→token decision
  (`StatusBadge.tsx:17-30`), including `pending`'s neutral interim.

### 7 — `ChangeStatusSheet`

**Create file: `src/features/tickets/components/ChangeStatusSheet.tsx`**

```tsx
export type ChangeStatusSheetProps = {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  currentStatus: TicketStatus;
};
```

State and derivation:

```tsx
const options = useMemo(() => allowedTransitions(currentStatus), [currentStatus]);
const [target, setTarget] = useState<TicketStatus | null>(null);
const [note, setNote] = useState('');
const change = useChangeTicketStatus(ticketId);

const noteRequired = target !== null && requiresResolutionNote(target);
const canSubmit = target !== null && (!noteRequired || note.trim().length > 0);
```

**Reset `target` and `note` when the sheet closes** — an effect on `visible` going false, or the
same reset inside `onClose`. Without it, reopening the sheet after a cancelled resolve shows a
stale note, and after a *successful* change shows a target that is no longer reachable from the
new status. This is the single most likely bug in the story.

Layout, top to bottom inside `<BottomSheet visible onClose title={t('ticketDetail.status.title')}>`:

1. **Current status row** — `<Text variant="caption" tone="muted">{t('ticketDetail.status.current')}</Text>`
   + `<StatusBadge status={currentStatus} />`, `flexDirection: 'row'`, `alignItems: 'center'`,
   `gap: theme.spacing.sm`.
2. **Options** — `options.map(...)` → `<StatusOption … description={t(`ticketDetail.status.description.${s}`)} selected={target === s} disabled={change.isPending} />`,
   in a `View` with `gap: theme.spacing.sm`. `allowedTransitions` is the **only** source; there is
   no literal status array in this file.
3. **Resolution note**, rendered only when `noteRequired`:

```tsx
<TextArea
  label={t('ticketDetail.status.noteLabel')}
  value={note}
  onChangeText={setNote}
  required
  placeholder={t('ticketDetail.status.notePlaceholder')}
  maxLength={500}
  showCounter
  disabled={change.isPending}
/>
```

   `TextArea` renders its label through `styles.label`'s `textTransform: 'uppercase'`
   (`TextArea.tsx:100`) — an Arabic label is unaffected by `toUpperCase`, so this is safe, but it
   is the same open design question story 01 §15 raised for `SectionHeader`. Do not add a second
   uppercase call.
4. **Footer** — `<Button variant="primary" fullWidth label={t('ticketDetail.status.submit')} disabled={!canSubmit} loading={change.isPending} onPress={handleSubmit} />`.
   `Button` already treats `loading` as disabling (`Button.tsx:63`), so a double-tap cannot fire
   twice.
5. **Error line**, below the footer, copying `HomeScreen.tsx:139-149`:

```tsx
{change.isError ? (
  <Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite"
        style={{ marginTop: theme.spacing.sm }}>
    {t(statusErrorMessageKey(change.error))}
  </Text>
) : null}
```

   with a local helper mirroring `HomeScreen.tsx:33-36`:

```ts
function statusErrorMessageKey(error: unknown): string {
  if (error instanceof TicketStatusChangedError) return 'ticketDetail.status.errors.changed';
  return errorMessageKey(error);   // already mapped by `toStatusChangeError` at the boundary
}
```

Submit:

```tsx
function handleSubmit() {
  if (!canSubmit || target === null) return;
  change.mutate(
    { to: target, expectedCurrentStatus: currentStatus, resolutionNote: note },
    { onSuccess: onClose },
  );
}
```

**Both note paths must exist, per the intake.** `canSubmit` is the client gate (BRD `:703`); the
server's *"A resolution note is required when resolving a ticket"* rejection is mapped by task 3
to `errors.noteRequired` and shown on the error line. Keeping only the client gate is the common
shortcut and it fails the moment the note is whitespace the server trims differently, or the
button's disabled state is bypassed by a fast double-tap on a slow device.

**The empty case cannot happen from the UI but must not crash.** `options.length === 0` only
occurs on a `closed` ticket, whose header button story 07 already renders `disabled`. If the sheet
is somehow opened anyway, render `<EmptyState icon="lock" title={t('ticketDetail.status.terminal')} />`
and hide the footer — not an empty white sheet with a dead button.

### 8 — Hosting the sheet

**File: `src/features/tickets/screens/TicketDetailScreen.tsx`** (created by story 07).

Add `const [statusVisible, setStatusVisible] = useState(false);`, replace story 07's
`// TODO(US-018): open the status picker once it exists.` no-op with
`onStatusPress={() => setStatusVisible(true)}`, and render:

```tsx
{detail.data ? (
  <ChangeStatusSheet
    visible={statusVisible}
    onClose={() => setStatusVisible(false)}
    ticketId={ticketId}
    currentStatus={detail.data.status}
  />
) : null}
```

The `detail.data` guard is not ceremony — `currentStatus` is the compare-and-set value and there
is no safe default for it. Leave `statusDisabled={allowedTransitions(detail.data.status).length === 0}`
exactly as story 07 wrote it.

**Nothing else on the screen changes.** In particular the History tab needs no edit: it already
reads `ticketKeys.events(ticketId)`, which task 5's invalidation refreshes, so the new
`status_changed` row appears without a manual refetch.

### 9 — Barrel, i18n, docs

**File: `src/features/tickets/index.ts`** — add:

```ts
export { TicketStatusChangedError, type ChangeTicketStatusInput } from './api';
export { useChangeTicketStatus } from './hooks';
```

`StatusOption` and `ChangeStatusSheet` stay **internal** — only `TicketDetailScreen` renders them,
and it lives in the same feature. Same treatment story 07 gave `MessageRow` and story 08 gave
`AgentRow`.

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`** — add a `status` block **inside**
story 07's `ticketDetail` namespace. **Reuse `ticket.status.*`** for the state names themselves
(story 04 added all five to both locales); these keys are only the sheet's own copy.

```jsonc
// en.json → ticketDetail.status
{
  "title": "Change status",
  "current": "Current status:",
  "submit": "Update status",
  "noteLabel": "Resolution note",
  "notePlaceholder": "What resolved this ticket?",
  "terminal": "This ticket is closed. No further transitions are possible.",
  "description": {
    "open": "Work is active on this ticket.",
    "pending": "Waiting on the customer or a third party.",
    "resolved": "Issue has been fixed and communicated.",
    "closed": "Finished and archived. This cannot be undone."
  },
  "errors": {
    "noteRequired": "A resolution note is required to resolve a ticket.",
    "illegalTransition": "That status change isn't allowed from the current state.",
    "changed": "This ticket's status changed. Reopen the sheet and try again."
  }
}
```

`description.pending` and `description.resolved` are **Figma's own strings** (nodes `I124:…;123:1011`
and `;123:1015`) — keep them verbatim. `description.open` and `description.closed` are authored
here (flag 3). There is **no `description.new`**: nothing in the transition table targets `new`,
and adding a key for an unreachable option invites someone to render it.

`ar.json` needs the same tree. No plurals in this block.

**File: `CLAUDE.md`** — "Project status" lists ticket creation, detail, assignment and status
transitions among the open items. Move **status transitions** out (story 07 handles detail, story
08 assignment) and name this plan beside the others.

**File: `AGENTS.md`** — no change required.

---

## Edge Cases & Failure Modes

- **A `closed` ticket.** `TRANSITIONS.closed === []`, so the header button is `disabled` (story 07)
  and the sheet — if reached — renders the terminal empty state with no footer (task 7). BRD `:705`.
- **Two agents change the same ticket at once.** The second PATCH matches zero rows because
  `status` is no longer `expectedCurrentStatus`; `changeTicketStatus` throws
  `TicketStatusChangedError` and the sheet shows `errors.changed` instead of closing on a change
  that did not happen.
- **A whitespace-only resolution note.** `canSubmit` uses `note.trim().length > 0`, and task 4
  trims again before sending. Checking `note.length` instead lets `"   "` through the client and
  relies on the server's own trimming, which is not specified.
- **The server rejects a resolve without a note anyway.** Task 3 maps
  `/resolution note is required/i` to `errors.noteRequired`, which renders on the error line. The
  intake requires both paths; this is the second.
- **An illegal transition reaches the API.** Mapped to `errors.illegalTransition`. If this ever
  fires from the UI it is a **bug in `state-machine.ts`**, not a user error — the sheet should
  never have offered the option. Worth a `console.warn` in dev; do not silence it.
- **The trigger's `code` is not `P0001`.** The patterns in task 3 match on message text precisely
  so the code does not matter. Verification step 1 captures the real payloads; if `code` turns
  out to be specific, prefer it and keep the patterns as the fallback.
- **A Postgres message reaching the UI raw.** The failure mode the intake calls out by name.
  `AppError.message` is developer-facing (`errors.ts:11`); the error line renders
  `t(messageKey)`, never `error.message`. Review this line specifically.
- **The sheet reopened after a successful change.** Without the reset in task 7, `target` still
  holds the *previous* target — which, after `open → resolved`, is no longer in
  `allowedTransitions('resolved')`, so a stale selection highlights nothing and the button is
  enabled for a transition the sheet is not offering. Reset on close.
- **`detail.data` is `null`** (an RLS-hidden or deleted ticket — story 07's `maybeSingle` branch).
  The sheet is not rendered at all (task 8's guard); the screen is already showing its
  `ErrorState`.
- **Offline.** `toStatusChangeError` falls through to `toAppError`, which maps a fetch failure to
  `kind: 'network'` → `states.offline` (`errors.ts:27-33`). `OfflineBanner` is mounted globally.
- **A very long resolution note.** `maxLength={500}` with `showCounter` — `TextArea` renders
  `field.charactersLeft` with its existing plural handling. 500 is this plan's choice; the column
  is unbounded `text` (`database.ts`), so nothing server-side enforces it. Say so if 500 is wrong.
- **RTL.** The current-status row, the option rows and the counter all use `gap` and logical
  props; no `marginLeft`/`marginRight` anywhere (hard rule 5, ESLint-enforced).

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, no `test`
script (`AGENTS.md`, "Commands"). Stories 02 through 08 each reached this conclusion and deferred.

**This is the story that changes the calculus.** Story 07 already identified `state-machine.ts` as
the one module in the app worth a test — *"a pure, five-line-table module with no React, no
Supabase and no I/O, whose correctness the BRD specifies exhaustively and whose failure mode is an
illegal transition offered to an agent."* Story 09 is where that failure mode becomes reachable:
until now the table only disabled a button. **Recommend installing `jest-expo` with this story**
and writing tests 1–3 below. It is a one-file test suite over a five-line map, and the alternative
is that the app's only encoding of the ticket lifecycle is verified by clicking.

If the runner still is not installed, these are the tests this story owes:

1. **Unit — `src/features/tickets/state-machine.test.ts`** · every cell of BRD `:222-227`:
   `new`→`open` only; `open`→`pending`/`resolved`; `pending`→`open`/`resolved`;
   `resolved`→`closed`/`open`; `closed`→ nothing.
2. **Unit — `src/features/tickets/state-machine.test.ts`** · `canTransition('new','closed')` is
   false, `canTransition('closed', <anything>)` is false, `requiresResolutionNote('resolved')` is
   true and false for every other target.
3. **Unit — `src/features/tickets/api.test.ts`** · `toStatusChangeError` maps each of API §4.9's
   three documented messages to the right key, and passes an unrecognised message through
   unchanged. One case per message.
4. **Unit — `src/features/tickets/api.test.ts`** · `changeTicketStatus` includes
   `resolution_note` **only** when `to === 'resolved'`, trims it, and never sends `resolved_at`.
5. **Unit — `src/features/tickets/api.test.ts`** · a zero-`count` result throws
   `TicketStatusChangedError`.
6. **Integration — `src/features/tickets/hooks.test.ts`** · `useChangeTicketStatus`'s `onSuccess`
   invalidates `['tickets']` — the whole root, not a narrower key.
7. **Component — `ChangeStatusSheet.test.tsx`** · with `currentStatus="open"` exactly two options
   render; selecting `resolved` reveals the note field and leaves submit disabled until the note
   is non-whitespace; closing and reopening clears both.

---

## Verification Steps

1. **Run API §4.9's three negative tests first** — they are the story's specification, and their
   exact response payloads decide task 3. With a real agent token:

   | Request | Expected |
   |---|---|
   | `PATCH /tickets?id=eq.<a `new` ticket>` `{"status":"closed"}` | rejected, `Illegal transition: new → closed` |
   | `PATCH /tickets?id=eq.<an `open` ticket>` `{"status":"resolved"}` | rejected, `A resolution note is required when resolving a ticket` |
   | `PATCH /tickets?id=eq.<a `closed` ticket>` `{"status":"open"}` | rejected, `Illegal transition: closed → open` |

   **Record the full error body of each** — `code`, `message`, `details`, `hint`. Confirm `code`
   is the generic `P0001` (or note what it actually is) and that the `message` fragments task 3
   matches on are present verbatim. This satisfies BRD `:706` and is the only proof the mapper
   will fire. Paste the three bodies into the PR.
2. **Then the positive path:**
   `PATCH /tickets?id=eq.<an `open` ticket>&status=eq.open` with
   `{"status":"resolved","resolution_note":"Reissued the invoice"}` and `Prefer: count=exact`.
   Expect `Content-Range: */1`. Then `GET /tickets?id=eq.<same>&select=status,resolved_at` and
   confirm **`resolved_at` is set by the server** (BRD `:704`), and
   `GET /ticket_events?ticket_id=eq.<same>&event_type=eq.status_changed&select=from_value,to_value`
   and confirm `from_value: "open"`, `to_value: "resolved"` (BRD `:707`) — **written by the trigger,
   not by this client**. Re-send the identical PATCH: expect `*/0`, the compare-and-set guard.
3. **Lint:** `npm run lint` in the repo root. Zero errors. Hard rules 2 and 5 — in this story the
   temptation is Figma's `StatusBadge` hexes, which must not be typed in.
4. **Typecheck:** `npm run typecheck` in the repo root. Zero errors. `Record<TicketStatus, …>` in
   `state-machine.ts` and the `description.*` keys should both be exhaustive.
5. **Frontend runs:** `npm start` in the repo root, then `i` or `a`.
6. **Manual — the lifecycle, end to end:**

| # | Do this | Expect |
|---|---|---|
| 1 | Open a `new` ticket, tap **Status** | Exactly one option: **Open** (BRD `:701`) |
| 2 | Select it, tap **Update status** | Sheet closes; header badge reads Open; no note field ever appeared |
| 3 | Tap **Status** again | Two options: Pending, Resolved |
| 4 | Select **Pending**, submit | Header reads Pending; the ticket stays under "Mine" |
| 5 | Tap **Status**, select **Resolved** | The note field appears; **Update status** is disabled |
| 6 | Type three spaces | Still disabled |
| 7 | Type a real note, submit | Sheet closes; header reads Resolved; Home's "Resolved today" is one higher |
| 8 | History tab | A `status_changed` row for every transition above, with from and to (BRD `:707`) |
| 9 | Tap **Status**, select **Closed**, submit; tap **Status** again | Button is **disabled** — terminal (BRD `:705`) |
| 10 | Reopen a resolved ticket (`resolved → open`) | Offered, and it works — reopen is legal (BRD §6) |
| 11 | Select a target, dismiss the sheet by dragging, reopen | Nothing selected, note empty |
| 12 | Airplane mode, submit | Sheet stays open, `states.offline` on the error line, no crash |

7. **Manual — the mapped errors.** Temporarily point `expectedCurrentStatus` at a stale value (or
   change the ticket from a second device between opening and submitting) and confirm
   `errors.changed` renders. Then, with the client gate bypassed in a scratch build, submit a
   resolve with an empty note and confirm **`errors.noteRequired`** renders — **not** the raw
   Postgres sentence. Revert the scratch change. This is the one behaviour the intake singles out
   and the one a code reader cannot confirm.
8. **Regression:**
   - **Home** — "Resolved today" moves after a resolve; "My open" drops (`fetchMyOpenCount`
     counts `open`/`pending` only). Claim still works.
   - **Tickets** — the Mine/Unassigned/All counts and the day-grouped lists refresh after a
     transition, because task 5 invalidates the whole `['tickets']` root.
   - **Ticket detail** (story 07) — Conversation, Internal notes and History all still render;
     the composer is unaffected.
   - **Assign sheet** (story 08, if merged) — still opens from the *other* header button; the two
     `visible` states do not interfere.
9. **RTL:** relaunch in Arabic. The current-status row reads label-then-badge from the start edge,
   the option badge leads, the character counter sits on the end edge, and the note field's text
   is right-aligned.

---

## Done Criteria

- [ ] Given a ticket in any state, when I open the status picker, then **only legally reachable states are offered** — sourced from `state-machine.ts`, with no literal status list in the sheet (BRD `:701`)
- [ ] Given a transition to resolved, when I confirm, then **a resolution note is required** — blocked client-side **and** handled when the server rejects it (BRD `:703`)
- [ ] Given a transition to resolved, when saved, then **`resolved_at` is set** — by the server; this client never sends it (BRD `:704`)
- [ ] Given a closed ticket, when any transition is attempted, then **it is rejected** — the header button is disabled and the sheet has no options (BRD `:705`)
- [ ] Given an illegal transition submitted directly to the API, when executed, then **the database rejects it** — verification step 1, three payloads recorded in the PR (BRD `:706`)
- [ ] Given any transition, when saved, then **a `status_changed` event records from and to** — verification step 2 (BRD `:707`)
- [ ] `state-machine.ts` is **unchanged** by this story, except to correct it against BRD `:222-227` if story 07 shipped it wrong
- [ ] A trigger exception renders a **localised** message; `AppError.message` is never rendered
- [ ] `core/utils/errors.ts` is untouched — the status vocabulary lives in `features/tickets/` (hard rule 3)
- [ ] `useChangeTicketStatus` invalidates `ticketKeys.all`, and the comment explains why it is wider than `usePostTicketMessage`'s
- [ ] Selecting an option is announced accessibly (`accessibilityRole="radio"` + `checked`), not by border colour alone
- [ ] Closing the sheet resets both the selected target and the note
- [ ] No hex literal, no physical layout prop, no `fontWeight` — `npm run lint` clean (hard rules 2, 5)
- [ ] `npm run typecheck` clean
- [ ] Both locales carry the new `ticketDetail.status.*` keys, with Figma's two description strings verbatim
- [ ] `CLAUDE.md` "Project status" no longer lists status transitions as open

---

## Open questions

1. **Figma has no resolution-note field.** Node `7:4232` is 288px tall with four children and no
   input, yet BRD `:703`, API §4.9 and the intake all require the note. Task 7 adds a `TextArea`
   between the options and the footer, growing the sheet by roughly 150px on the `resolved`
   selection. The designer has not seen that layout. **Highest-priority question** — it is the
   most visible thing in the story.
2. **`StatusOption` has no selected state in Figma.** The component set's only variant axis is
   `Status` (node `123:1020`: `Status=New` … `Status=Closed`). A picker needs one, so this plan
   invents `borderFocus` + `bgPrimarySubtle` + a 1.5px border. Design should either bless it or
   add a `Selected` variant.
3. **Two of the four option descriptions are authored here.** Figma supplies `pending` ("Waiting
   on the customer or a third party.") and `resolved` ("Issue has been fixed and communicated.")
   as instance text; `description` has no per-variant default, so `open` and `closed` have none.
   This plan writes "Work is active on this ticket." and "Finished and archived. This cannot be
   undone." Copy review needed, in both languages.
4. **`pending` still has no colour token.** Figma renders it lavender (`#ede7f6`/`#4a3580`); the
   35-token semantic palette has no purple, so `StatusBadge` ships it neutral. This is the
   **fourth** story to inherit the gap (03, 04, 07, now 09) — and here it matters more, because
   `pending` is one of exactly two options an agent sees on an open ticket and the badge is the
   option's main identifier. Story 07 adds `purple500`/`purple50` for internal notes; whether
   `pending` should reuse them is a design call, not an engineering one.
5. **Should agents be able to close a ticket manually at all?** BRD §6's table allows
   `resolved → closed` but annotates it *"`closed` after CSAT or timeout"* — a process, not a
   button. This plan offers **Closed** as an option because the transition table permits it and
   hiding a legal transition would contradict criterion `:701`. If product intends closure to be
   automatic, `closed` should be filtered out of the options **in the sheet**, not removed from
   `state-machine.ts` — the table must stay a faithful transcription. One line either way.
6. **The trigger's error `code` is unverified.** Task 3 matches on message text because a
   `RAISE EXCEPTION` reports the generic `P0001`, and because `errors.ts:50-54` cannot parse a
   non-numeric code into a status anyway. Verification step 1 captures the real bodies. If the
   backend can be persuaded to raise **distinct `SQLSTATE`s** for the two failure classes, matching
   on `code` would be sturdier than matching on English prose that a future migration may reword.
   Worth asking before this ships.
7. **`maxLength={500}` on the resolution note is this plan's number.** `resolution_note` is an
   unbounded `text` column and neither the BRD nor the API reference caps it. 500 is long enough
   for a real resolution and short enough that the counter means something. Change it if product
   has a figure.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 10.**
