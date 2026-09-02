# Story 17 — Ticket history timeline (Story: SCRUM-35)

> Intake: `.squad/stories/tickets/SCRUM-35/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `187:1192`. **No new frame work** — the segmented
> control and its History segment were built to this node by story 07.

## Read this before anything else

**Four of US-019's five acceptance criteria are already met, in code, on `main`.** The intake asks
you to *"confirm the tab exists and is currently empty/unwired before building, rather than assuming
it needs to be added from scratch."* That confirmation was done, and the answer is that the tab is
neither empty nor unwired — story 07 built the whole read path
([`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md),
whose own scope table lists *"US-019 history timeline (`:710`) — **Yes**, API §4.10"*).

Verified against the tree:

| US-019 criterion | Status | Where |
|---|---|---|
| `:718` All events display chronologically | **Met** | `api.ts:435-451` — `fetchTicketEvents` selects `ticket_events` filtered by `ticket_id`, `.order('created_at', { ascending: false })` |
| `:719` Actor, action and timestamp display | **Partly** | `components/HistoryRow.tsx:24-67` renders all three — but see gap 1 |
| `:720` Timestamp in device local time | **Met** | `HistoryRow.tsx:62` → `formatDateTime` (`core/utils/format.ts:23-32`) is `Intl.DateTimeFormat` with **no `timeZone` option**, so it resolves to the device zone |
| `:721` No edit or delete affordance | **Met** | `HistoryRow.tsx` renders an `Icon` and two `Text`s — no `Pressable`, no swipe. `api.ts:434` carries the deliberate comment *"No update or delete function — BRD `:717` and API §4.10's immutability test require none exist."* |
| `:722` Update/delete via API is rejected | **Unverified** | Server-side RLS. Nothing in this repo can assert it, and nobody has run the test |

Also already in place: the query hook (`hooks.ts:162-168`), the key
`['tickets', <id>, 'events']` exactly as the intake specifies (`hooks.ts:50`), the segment
(`TicketDetailScreen.tsx:88-93`), and the pending / error / empty branches
(`TicketDetailScreen.tsx:99-112`).

**So this story is small and it is mostly not UI.** It closes two real gaps and runs one blocking
backend verification. **Do not rebuild the timeline.** If you find yourself creating
`HistoryRow.tsx` or `fetchTicketEvents`, stop — you are on the wrong branch or the wrong repo.

---

## Prerequisites

- **Story 07 completed** — [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md). It built everything in the table above, and filed **its flag 5**: *"`to_value` is a raw profile id, not an enum — rendered as-is until US-017 gives it a resolved name."* Gap 1 below is that flag, come due.
- **Story 08 completed** — [`08-story-assign-a-ticket-SCRUM-33.md`](08-story-assign-a-ticket-SCRUM-33.md). It is what makes gap 1 **visible in production rather than theoretical**: before story 08 nothing in the app could write an `assigned` event from a user action, so no agent had ever seen the raw UUID. It also built `useDepartmentAgents` / `agentKeys` in `features/auth`, which is the lookup gap 1 uses, and it built **unassign**, which is what surfaces gap 2.
- **Story 09 completed** — [`09-story-ticket-status-transitions-SCRUM-34.md`](09-story-ticket-status-transitions-SCRUM-34.md). It writes `status_changed` events through the trigger; without it the History tab has one row per ticket and nothing to order.
- **`.env` populated**, a **service-role key or a second agent account**, and a ticket that has been **assigned, reassigned, unassigned and status-changed at least once** — a timeline with a single `created` row proves nothing about ordering, and gaps 1 and 2 are invisible on it.

---

## Story Goal

An agent auditing a ticket reads a timeline that says **who** did **what**, **when** — in words, not
identifiers. Concretely:

1. **`assigned` events name the agent** rather than printing a UUID (BRD `:719` — *"actor, action and timestamp display"*; a 36-character hex string is not an actor to the person reading it).
2. **Unassignment reads as unassignment** instead of "assigned the ticket to " with a hole where the name should be.
3. **`ticket_events` is proven immutable from the client** (BRD `:722`) — a `PATCH` and a `DELETE` are executed against the live API with an agent JWT and both are recorded as rejected.

**Not in scope**: any change to `fetchTicketEvents`' query, key or ordering (it already matches the
intake); any change to the segmented control; resolving `from_value`/`to_value` for
`status_changed` and `priority_changed` (already localised through `ticket.status.*` /
`ticket.priority.*`, `HistoryRow.tsx:20-22`); a `priority_changed` write path (no screen changes
priority yet — the enum member exists, nothing emits it); and pagination or a date-grouped timeline
(no story asks for either, and `:718` says *all* events).

---

## Context — Read These Files First

1. `src/features/tickets/components/HistoryRow.tsx` — **all 73 lines**. This is the story's one UI file. `:12-17` (`EVENT_ICON`), `:20-22` (`localiseValue`, the enum→i18n-key pass), the `switch` at `:31-54`, and specifically **`:49-53`** — the `assigned` case, its `event.toValue` passed raw, and story 07's comment above it naming this exact debt.
2. `src/features/tickets/api.ts:423-451` — `EVENT_SELECT`, `TicketEventRow`, and `fetchTicketEvents`. Note `:423`: the embed is `profiles(full_name)`, which resolves the **actor** through `ticket_events_actor_id_fkey`. **Read `:434`'s comment before touching this file — the absence of an update/delete function is a feature.**
3. `src/core/types/database.ts:347-391` — the `ticket_events` table. `to_value: string | null`, and the `Relationships` block at `:375-390` lists **exactly two** foreign keys: `actor_id → profiles` and `ticket_id → tickets`. **`to_value` has none**, which is why gap 1 cannot be solved with a second PostgREST embed and must be resolved client-side.
4. `src/features/auth/hooks.ts:34-55` — `agentKeys` and `useDepartmentAgents(enabled = true)`. It returns `DepartmentAgent[]` (`auth/types.ts:35-40`: `id`, `fullName`, `openTicketCount`), is keyed under `['agents', 'list', departmentId]`, and carries `staleTime: 60_000`. Exported from the `@/features/auth` barrel (`auth/index.ts:2`), which `features/tickets/hooks.ts:3` already imports from — hard rule 4 is satisfied by the existing seam.
5. `src/features/auth/api.ts:115-131` — `fetchDepartmentAgents`. **Note `:120`: `.eq('is_active', true)`.** A deactivated agent is not in this list, so gap 1 needs a fallback for a historical assignee who has since left — this is not hypothetical, it is the normal case for an audit trail.
6. `src/features/tickets/screens/TicketDetailScreen.tsx:88-112` — the History segment: the `SegmentedControl` option at `:88-93`, and the `isPending` / `isError` / empty / `FlatList` chain at `:99-112`. **`:110` is the single `<HistoryRow event={item} />` call site** and the only place task 1's new prop is threaded.
7. `src/core/lib/i18n/locales/en.json:163-169` and `ar.json:167-173` — the `ticketDetail.event` block. Four sentence templates plus `system`. Task 2 adds two keys to each file; nothing existing changes.
8. `src/core/utils/format.ts:23-32` — `formatDateTime`. Confirm for yourself that there is no `timeZone` key before signing off criterion `:720`; that is the whole verification for it.
9. `docs/phase1_api_reference.md` §4.10 — the history endpoint and **its immutability test**. Verification step 1 runs that test; read what §4.10 says the expected rejection looks like before you run it, so you can tell a real refusal from a silently-successful no-op.
10. `docs/phase1_brd_1.md:710-722` — US-019 and its five criteria. `## Done Criteria` mirrors them verbatim.

---

## Product rules (from story)

| | Current behaviour (after stories 07–09) | New behaviour |
|---|---|---|
| `assigned` event with an assignee | "Sara assigned the ticket to `a3f1c8e2-…`" | "Sara assigned the ticket to **Omar Khalil**" |
| `assigned` event by an agent no longer in the department | Raw UUID | "Sara assigned the ticket to **another agent**" |
| `assigned` event with `to_value` null (unassign) | "Sara assigned the ticket to " — a sentence with a hole | "Sara **unassigned the ticket**" |
| Everything else on the tab | Correct | **Unchanged** |

---

## Frontend Tasks

### 1 — Resolve `assigned` events to agent names

`ticket_events.to_value` is plain `text` with no foreign key (`database.ts:355`, `:375-390`), so
PostgREST cannot embed a name the way `EVENT_SELECT` embeds the actor's. The resolution happens on
the client, from the roster story 08 already fetches and caches.

**File: `src/features/tickets/components/HistoryRow.tsx`**

**a.** Widen the props at `:10`:

```tsx
export type HistoryRowProps = {
  event: TicketEvent;
  /**
   * Resolves an `assigned` event's `to_value` (a raw profile id) to a name.
   * Returns `null` when the id is not in the department roster — a historical
   * assignee who has since been deactivated or moved. The row renders a generic
   * label rather than falling back to the UUID: an id the reader cannot resolve
   * is noise in an audit trail, not information.
   */
  resolveAgentName: (profileId: string) => string | null;
};
```

**Required, not optional.** An optional prop with a UUID default is the same bug with a longer
lifetime, and there is exactly one call site to update.

**b.** Replace the `assigned` case at `:49-53`, and let it carry the unassign branch from task 1c:

```tsx
case 'assigned':
  sentence =
    event.toValue === null
      ? t('ticketDetail.event.unassigned', { actor })
      : t('ticketDetail.event.assigned', {
          actor,
          to: resolveAgentName(event.toValue) ?? t('ticketDetail.event.unknownAgent'),
        });
  break;
```

Story 07's `// to_value is a raw profile id … until US-017 gives it a resolved name` comment at
`:50-51` goes with it.

**Change nothing else in this file.** `EVENT_ICON`, `localiseValue`, the other three cases, the
`actorName ?? system` fallback at `:28`, `formatDateTime` at `:62` and the layout at `:56-72` are all
correct and all covered by criteria that already pass.

**File: `src/features/tickets/screens/TicketDetailScreen.tsx`**

**c.** Build the lookup and thread it into `:110`. Add beside the existing queries at `:36-37`:

```tsx
// Gated on the History tab: the roster is only needed to name `assigned`
// events, and an agent who opens a ticket to read the conversation should not
// pay for a profiles query. `useDepartmentAgents` already caches under
// `['agents', …]` with a 60s staleTime, so the Assign sheet and this tab share
// one fetch.
const agents = useDepartmentAgents(tab === 'history');

const resolveAgentName = useCallback(
  (profileId: string) => agents.data?.find((a) => a.id === profileId)?.fullName ?? null,
  [agents.data],
);
```

Import `useDepartmentAgents` from `@/features/auth` (the barrel — hard rule 4) and `useCallback` from
`react`. Then at `:110`:

```tsx
renderItem={({ item }) => <HistoryRow event={item} resolveAgentName={resolveAgentName} />}
```

**Do not block the timeline on the roster.** The history query's own `isPending` / `isError` chain
(`:100-104`) stays exactly as it is: if `useDepartmentAgents` is still loading or has failed, every
row still renders, and the `assigned` rows read "another agent" until it resolves. A timeline that
refuses to display because a *name lookup* is slow is a worse audit tool than one with a generic
label in it.

---

### 2 — i18n

**File: `src/core/lib/i18n/locales/en.json`** — add two keys to the `ticketDetail.event` block
(`:163-169`), after `"assigned"` at `:166`:

```json
"unassigned": "{{actor}} unassigned the ticket",
"unknownAgent": "another agent",
```

**File: `src/core/lib/i18n/locales/ar.json`** — the same two keys in the matching block
(`:167-173`), after `"assigned"` at `:170`:

```json
"unassigned": "{{actor}} ألغى إسناد التذكرة",
"unknownAgent": "موظف آخر",
```

Both Arabic strings need **copy review** — see open question 2. Keep the key order identical across
the two files, as the rest of the block already is.

---

### 3 — Documentation

**File: `CLAUDE.md`**

The "Project status" paragraph already describes the ticket detail screen's *"Conversation / Internal
notes / History segments"*. Append that the History timeline is US-019 / SCRUM-35, and that
`assigned` events now resolve to agent names via `useDepartmentAgents`. If verification step 1 shows
the immutability policy is **missing**, say so here too — an unenforced `:722` is a security
statement about the product, not a client TODO, and it must not be discoverable only from a Jira
comment.

**No frontend changes beyond tasks 1 and 2. No query, key, ordering or component is created.**

---

## Backend Tasks

**No backend code is written by this story** — this repo is the Expo client and holds no migrations.

But **one backend fact must be established**, and it is verification step 1 below, not a task here:
BRD `:722` requires that `UPDATE` and `DELETE` on `ticket_events` be rejected for an agent JWT. If
they are not, US-019 is unmet by work no client story can do, and the finding belongs in
`docs/phase1_known_issues.md` and back on the tracker the same day. **Run that test before writing
either frontend task** — it is the only part of this story that can change its outcome.

---

## Edge Cases & Failure Modes

- **`assigned` event whose `to_value` names a deactivated or transferred agent.** `fetchDepartmentAgents` filters `.eq('is_active', true)` and `.eq('department_id', …)` (`auth/api.ts:119-120`), so they are absent from the roster. `resolveAgentName` returns `null`; the row reads "another agent". **This is the common case on an old ticket, not a rare one.**
- **The roster query is still loading when the History tab paints.** `agents.data` is `undefined`, `resolveAgentName` returns `null` for everything, and `assigned` rows read "another agent" until the fetch lands, then re-render with names. Deliberate — task 1c explains why the timeline is not gated on it.
- **The roster query fails outright** (offline, RLS refusal on `profiles` — story 08's open question 1 records that the `profiles` SELECT policy was never in §6's isolation matrix). Same behaviour as loading: generic label, timeline intact, **no error banner on the History tab**. The Assign sheet is where an agent-roster failure is worth surfacing; a timeline is not.
- **`to_value` null on an `assigned` event.** Story 08's unassign path. Handled by task 1b's branch. Before this story it rendered *"Sara assigned the ticket to "* — i18next interpolates a null as an empty string, so it fails silently and looks like a truncation bug rather than a missing branch.
- **Two events with an identical `created_at`.** `.order('created_at', { ascending: false })` alone leaves their relative order undefined, and PostgREST may return them in either order across refetches. In practice a trigger-written pair (a status change and its assignment) can share a transaction timestamp. **Not fixed here** — see open question 4; the fix is a secondary sort key on the server side, and inventing one client-side would only hide it.
- **A ticket with no events at all.** `EmptyState` with `ticketDetail.empty.history` (`TicketDetailScreen.tsx:104-106`). Unreachable in practice — the `created` trigger fires on insert (story 13's verification step 3 proved it) — but correct if a trigger is ever disabled.
- **A very long timeline.** `fetchTicketEvents` has no `limit` and no pagination. Correct per `:718` (*all* events), and the row count is bounded by the ticket's own lifecycle. Do not add a cap.
- **RTL.** `HistoryRow`'s layout is `flexDirection: 'row'` with `gap` and no directional props (`:69-72`); the sentences are interpolated templates that Arabic already reorders correctly. The two new strings are the only RTL surface, and neither carries an id, a number or a Latin fragment.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`) — no Jest, no test files, no `test`
script. Story 09 recommended `jest-expo` for `state-machine.ts`; that recommendation still stands
where it was filed, and **this story does not act on it**: two i18n keys and a `find` do not justify
installing a runner, and a story that ends in a `curl` against production RLS is the wrong place to
introduce one.

1. **Nothing this story adds is unit-testable in isolation.** `resolveAgentName` is a closure over query data; `HistoryRow`'s `switch` is a render. When a runner lands, `HistoryRow`'s four-case `switch` — including the new null branch — is a reasonable render test, and belongs beside `state-machine.ts`'s suite.
2. The matrix below is the test plan, and **row 1 is the story**.

| # | Scenario | Expected |
|---|---|---|
| 1 | `PATCH` and `DELETE` a `ticket_events` row with an **agent** JWT | Both rejected (verification step 1) |
| 2 | Open a ticket that was assigned via the Assign sheet, tap **History** | The `assigned` row reads a **name**, not a UUID |
| 3 | Unassign a ticket, reopen History | Top row reads "… unassigned the ticket" — **no trailing gap** |
| 4 | Assign to an agent, then deactivate that profile (or use a ticket assigned by a transferred agent), reopen History | Row reads "another agent"; **no UUID, no blank** |
| 5 | Go offline, open History on a cached ticket | Timeline renders; `assigned` rows read "another agent"; **no error state** |
| 6 | Change status twice, reopen History | Both `status_changed` rows present, **newest first**, both with localised status words |
| 7 | Scroll a timeline of 10+ events | All present, chronological, **no edit/delete affordance, no swipe action** |
| 8 | Switch to العربية, **fully restart**, repeat 2 and 3 | Both sentences read naturally in Arabic; RTL correct |
| 9 | Open History, then Conversation, then History again | No refetch storm; the roster is served from `agentKeys` cache |
| 10 | Regression: open the **Assign** sheet on the same ticket | Roster still renders (shared cache entry, `staleTime: 60_000`) |
| 11 | Regression: Conversation and Internal notes tabs | Unchanged |

---

## Verification Steps

1. **Backend gate — prove `ticket_events` immutability (BRD `:722`). Run this FIRST, before writing any code.** With an **agent-role** JWT (not the service key — the service key bypasses RLS and proves nothing):

   ```bash
   EVENT=$(curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/ticket_events?ticket_id=eq.$TICKET&select=id&limit=1" | head -c 200)
   echo "$EVENT"

   curl -s -o /dev/null -w '%{http_code}\n' -X PATCH \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -d '{"to_value":"tampered"}' "$URL/rest/v1/ticket_events?id=eq.$EVENT_ID"

   curl -s -o /dev/null -w '%{http_code}\n' -X DELETE \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/ticket_events?id=eq.$EVENT_ID"
   ```

   **Record the full response bodies, not just the codes.** A `403`/`401` is a pass. A `204` is a
   fail. **A `200`/`204` with zero rows affected is the dangerous middle case** — it means no
   permissive policy matched rather than that a restrictive one refused, which is the same outcome
   today and a different one the moment a policy is widened. Then re-`GET` the row and confirm
   `to_value` is unchanged and the row still exists. If either write succeeded, **stop, file it in
   `docs/phase1_known_issues.md`, and raise it before continuing** — this is the one criterion in
   US-019 that is a security property.

2. **Confirm criterion `:720` by reading, not clicking.** Open `src/core/utils/format.ts:23-32` and confirm `Intl.DateTimeFormat` is called with `day`/`month`/`hour`/`minute` and **no `timeZone`**. That is the entire proof that timestamps render in device local time; a screenshot cannot distinguish local from UTC unless you happen to be in a non-UTC zone.
3. **Confirm criterion `:721` by reading, not clicking.** `HistoryRow.tsx:56-66` contains no `Pressable`, no `onPress`, no `Swipeable`. `api.ts` contains no `.update(` or `.delete(` against `ticket_events` — grep it: `grep -n "ticket_events" src/features/tickets/api.ts` must return exactly the four lines in `fetchTicketEvents` and its comment.
4. **Typecheck:** `npm run typecheck` — zero errors. This is what catches a missed `resolveAgentName` at the one call site: making the prop **required** (task 1a) is what turns that omission into a compile error instead of a runtime UUID.
5. **Lint:** `npm run lint` — zero errors. Specifically hard rule 4 on the new `@/features/auth` import in `TicketDetailScreen.tsx`.
6. **Frontend runs:** `npm start`, then `a` and `i`. Walk matrix rows 2–11 on a ticket with a **full** lifecycle — created, assigned, reassigned, unassigned, status-changed. A ticket with one `created` row exercises none of this story.
7. **Regression — the Assign sheet** (matrix row 10). Task 1c adds a second consumer of `useDepartmentAgents` with a different `enabled` value; confirm the sheet still populates, and that opening History does not leave the sheet's copy stale.
8. **RTL** (matrix row 8): switch to العربية and **fully restart**.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:718-722` (US-019).

- [ ] Given a ticket, when I open the History segment, then **all events display chronologically**
- [ ] Given an event, when rendered, then **actor, action and timestamp display** — with the assignee as a **name**, never a UUID
- [ ] Given a timestamp, when displayed, then it renders in **device local time**
- [ ] Given the history, when displayed, then **no edit or delete affordance exists**
- [ ] Given an update or delete attempted on `ticket_events` via API, when executed, then **it is rejected** — proven by verification step 1, with the response bodies recorded

Plus, from the intake and this plan:

- [ ] `fetchTicketEvents`, `useTicketEvents`, `ticketKeys.events` and the segmented control are **unchanged** — this story rebuilt nothing story 07 already shipped
- [ ] Story 07's `// to_value is a raw profile id … until US-017 gives it a resolved name` comment is gone
- [ ] `resolveAgentName` is a **required** prop, so the one call site cannot be missed
- [ ] An unresolvable assignee reads "another agent"; it **never** falls back to the UUID
- [ ] Unassignment renders its own sentence, not "assigned to " with an empty interpolation
- [ ] The timeline **still renders** when the roster query is loading or failed — no gate, no error banner
- [ ] `useDepartmentAgents` is gated on the History tab and shares story 08's `agentKeys` cache entry
- [ ] Two keys added to **both** locale files, in the same order
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] `CLAUDE.md` records US-019 as built — **and records the `:722` finding if the policy is missing**

---

## Open questions — raise with design/product, do not resolve silently

1. **"Chronologically" is ambiguous and the two sources disagree in emphasis.** BRD `:718` says *"chronologically"*, which reads oldest-first; the intake says *"most recent first"*; the code does most-recent-first (`api.ts:440`). This plan keeps the code's behaviour because the intake is the later and more specific instruction, and because a support timeline is read from the top. **But an audit trail is conventionally read forward**, and "chronologically" is the word in the signed-off acceptance criterion. One line either way — confirm which before sign-off rather than after.
2. **Two new Arabic strings need copy review.** `"{{actor}} ألغى إسناد التذكرة"` and `"موظف آخر"` are this plan's, not a translator's. The second is doing quiet work: it is what an agent sees where a colleague's name should be, and it should read as "the record is older than the roster", not as "the system does not know". This is now the pattern established by `ticketDetail.event.system` ("النظام") for a null actor.
3. **A resolvable-name lookup that is scoped to one department will miss cross-department assignments.** `fetchDepartmentAgents` filters `department_id` (`auth/api.ts:119`), matching story 08's sheet, which only ever offers same-department agents. If assignment is ever widened across departments — or if a ticket is transferred with its history — every such row degrades to "another agent". The durable fix is a **server-side name on the event**: either `to_value` populated with a name at trigger time, or a companion `to_profile_id` column with a real foreign key so PostgREST can embed it. **Worth raising with the backend now**, because it also fixes question 4.
4. **Events written in one transaction share a `created_at` and have no tiebreaker.** `.order('created_at', { ascending: false })` is the only sort. A status change that also triggers an assignment writes two rows at the same timestamp, and their displayed order is whatever the planner returns — potentially different between two refetches of the same ticket. An audit trail that reorders itself is a real defect. **Ask the backend for a monotonic tiebreaker** (a sequence column, or `id` if it is time-sortable — it is a UUID today, which is not). Adding a client-side secondary sort on `id` would produce a *stable* order that is not the *true* order, which is worse.
5. **`priority_changed` is a dead branch.** `HistoryRow.tsx:42-48` handles it and `EVENT_ICON` maps it to `clock`, but no screen in the app changes a ticket's priority after creation — story 13 sets it once on the create form and story 09's sheet only moves status. So the branch is untested and unreachable. Confirm whether editing a ticket's priority is a phase-1 story that was missed, or genuinely deferred; if deferred, the branch stays (the trigger and the enum both exist and an admin could write one).
6. **The `system` actor label is now doing two jobs.** `ticketDetail.event.system` renders when `actor_id` is null (`HistoryRow.tsx:28`) — i.e. a trigger-written event with no user. With `unknownAgent` added, the timeline has two different "we cannot name this person" strings for two genuinely different reasons. Confirm the copy distinguishes them clearly enough in both languages; if not, they should be merged deliberately rather than by accident.
7. **This story exists because SCRUM-35 was never closed after SCRUM-30 shipped it.** Story 07's plan says plainly that US-019 was in its scope, and the code confirms it — yet SCRUM-35 sat in **To Do**, and `docs/remaining-stories.csv` still exports it that way. **SCRUM-31 and SCRUM-32 have the same problem** (both closed by story 07's `postTicketMessage`), and **SCRUM-36** (closed by Home's `claimTicket`) and **SCRUM-39** (closed by story 13's FAB wiring) do too. Four tracker items describe shipped code. Worth a single tracker pass rather than four more stories that discover the same thing.

**STOP HERE. Report to the user.**
