# tickets — plan overview

Entry point for the **tickets** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 04 | [04-story-ticket-list-with-filters-SCRUM-27.md](04-story-ticket-list-with-filters-SCRUM-27.md) | Ticket list with filters | SCRUM-27 | `design-system` 01, `auth` 02, `home` 03 |
| 07 | [07-story-ticket-detail-and-conversation-SCRUM-30.md](07-story-ticket-detail-and-conversation-SCRUM-30.md) | Ticket detail and conversation thread | SCRUM-30 | `design-system` 01, `auth` 02, `home` 03, `tickets` 04 |
| 08 | [08-story-assign-a-ticket-SCRUM-33.md](08-story-assign-a-ticket-SCRUM-33.md) | Assign a ticket | SCRUM-33 | `design-system` 01, `auth` 02, `home` 03, `tickets` 07 |
| 09 | [09-story-ticket-status-transitions-SCRUM-34.md](09-story-ticket-status-transitions-SCRUM-34.md) | Ticket status transitions | SCRUM-34 | `design-system` 01, `tickets` 04, `tickets` 07 |
| 13 | [13-story-create-a-ticket-SCRUM-28.md](13-story-create-a-ticket-SCRUM-28.md) | Create a ticket | SCRUM-28 | `design-system` 01, `home` 03, `tickets` 04, `tickets` 07, `customers` 05, `customers` 11 |
| 16 | [16-story-create-a-customer-inline-SCRUM-29.md](16-story-create-a-customer-inline-SCRUM-29.md) | Create a customer inline during ticket creation | SCRUM-29 | `tickets` 13, `customers` 11, `customers` 12, `customers` 05 |
| 17 | [17-story-ticket-history-timeline-SCRUM-35.md](17-story-ticket-history-timeline-SCRUM-35.md) | Ticket history timeline | SCRUM-35 | `tickets` 07, `tickets` 08, `tickets` 09 |
| 21 | [21-story-post-a-public-reply-SCRUM-31.md](21-story-post-a-public-reply-SCRUM-31.md) | Post a public reply | SCRUM-31 | `tickets` 07 |
| 22 | [22-story-post-an-internal-note-SCRUM-32.md](22-story-post-an-internal-note-SCRUM-32.md) | Post an internal note | SCRUM-32 | `tickets` 07, `tickets` 21 |

## Dependency notes

The `src/features/tickets/` folder itself was **created by** [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md),
not by a story in this folder — Home needed `TicketRow`, `StatusBadge`, the five ticket queries
and the claim mutation before the Tickets tab existed. Story 04 is therefore the first story to
*own* this feature but the second to write to it, and it edits `api.ts`, `hooks.ts`, `types.ts`,
`components/TicketRow.tsx` and `screens/TicketsScreen.tsx` in place.

Story 04 depends on [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md)
for the token layer and is the **first consumer** of three things that story built and nothing has
used since: `SearchField`, `FilterChip`, and `SectionHeader`'s `variant="rule"`. It also fixes that
`rule` variant — it currently renders a bottom border rather than Figma's inline trailing hairline,
which no consumer had exposed.

It depends on [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md)
only for `useAuth().session.user.id`.

Story 04 reaches outside the tickets folder in three deliberate ways:

- **It fixes `src/core/components/SectionHeader.tsx`** — a core change with zero existing consumers,
  so it cannot regress Home.
- **It changes `TicketRow`, which Home renders too** — the priority glyph added for BRD `:610`'s
  non-colour-cue criterion appears on Home's previews as well. Intentional; flagged to design.
- **It reshapes `ticketKeys` and the list hooks** while keeping `useMyTickets(limit)` and
  `useUnassignedTickets(limit)` signature-compatible, so `HomeScreen.tsx` needs no edit. Verifying
  Home still works is an explicit verification step, not an assumption.

It deliberately stops short of four neighbouring stories:

- **US-012 / US-022 ticket creation** — the FAB renders inert, as on Home.
- **US-014 ticket detail** — row taps are a documented no-op.
- **US-017 assignment** — the Unassigned filter is read-only here; inline Claim stays Home-only.
- **Pagination** — the "All" list keeps API §4.3's `limit=50` cap.

Seven open questions are recorded at the end of story 04 and are **not** settled by it: the missing
non-colour priority cue in Figma (the glyph is an interim), the still-missing `PENDING` colour token
inherited from story 03, `FilterChip`'s unparenthesised counts, the uncapped "All" count over a
capped list, the read-only Unassigned filter, `ilike`-only search, and two mislabelled BRD ids
corrected in passing.

---

## Story 07 — ticket detail

Story 07 is the screen where **four BRD stories meet**, and its scope is cut by the intake's
endpoint list rather than by the screen's surface area:

| BRD story | Built in 07? |
|---|---|
| US-014 detail and conversation thread (`:641`) | Yes — the story |
| US-015 post a public reply (`:652`) | Yes — API §5.3 |
| US-016 post an internal note (`:667`) | Yes — API §5.4 |
| US-019 history timeline (`:710`) | Yes — API §4.10 |
| US-017 assign (`:681`) | **No** — §4.8 absent from the intake; the header button renders inert |
| US-018 status transitions (`:695`) | **Partly** — `state-machine.ts` is created; §4.9's PATCH is not |

Two of the intake's premises were checked against the tree and found wrong, and story 07 records
both rather than following them blindly:

- **`src/features/tickets/state-machine.ts` does not exist.** The intake says to "reuse" it. Story 07
  creates it from BRD §6 (`:216-247`) and consumes it in exactly one place — disabling the header's
  Status button on a `closed` ticket — so US-018 inherits a correct module instead of writing one
  under deadline.
- **The `is_internal` typing requirement is already enforced.** `database.ts:406` types it
  `is_internal: boolean` in `Insert`, with no `?`, unlike every other optional column. The executor's
  job is not to add a guard but to avoid destroying one; story 07 task 4c spells out the three ways
  that happens (`Partial<>`, a default, an index-signature payload).

Story 07 reaches outside the tickets folder in four deliberate ways:

- **It adds the first purple to `primitives.ts`** — `purple500` / `purple50`, read off Figma node
  `91:989`, plus three semantic keys and a new `internal` `TextTone`. The palette had no purple at
  all, and the intake is emphatic that internal notes must be *unmistakably a different class of
  row*. Two dark-mode values are this plan's invention, not Figma's, and are flagged.
- **It adds `formatTime` to `core/utils/format.ts`** — message rows show `08:26`; `formatDateTime`
  gives day + month + time, which is wrong inside a single day's thread. The history timeline keeps
  `formatDateTime`, so both are needed.
- **It creates the app's first non-tab authenticated route** — `src/app/tickets/[id].tsx` as a
  sibling of `(tabs)` in `RootNavigator`, so the detail pushes *over* the tab bar with its own back
  affordance, which is what Figma shows.
- **It wires the two `handleTicketPress` no-ops** stories 03 and 04 left behind
  (`HomeScreen.tsx:29-31`, `TicketsScreen.tsx:27-29`) and extracts `priorityColor` out of
  `TicketRow` into `features/tickets/priority.ts` now that the detail header is a second consumer.

Seven open questions close story 07. The load-bearing ones: the US-017/US-018 scope cut above
(~8 points of difference), the new purple's unspecified dark-mode values, and **one acceptance
criterion that cannot be met** — BRD `:648` requires tapping the customer strip to open the customer
profile, and US-008 is unbuilt, so the strip renders inert exactly as story 05 left `CustomerRow`.

---

## Story 08 — assign a ticket

Story 08 closes **US-017**, the first of the two BRD stories story 07 deliberately left open. It
is the smallest story in this folder by surface area and the largest by unverified assumption.

**It depends on story 07 being implemented, not merely planned.** Its only entry point is the
**Assign** button story 07 puts on `TicketDetailHeader` and wires to a `// TODO(US-017)` no-op,
and it consumes story 07's `TicketDetail`, `useTicketDetail` and `ticketDetail` i18n namespace.
Story 07 is not in the tree yet — `src/features/tickets/` still holds only `api.ts`, `grouping.ts`,
`hooks.ts`, `index.ts`, `types.ts`, `components/{StatusBadge,TicketRow}.tsx` and
`screens/TicketsScreen.tsx`. Executing 08 before 07 is not possible.

**The intake's central premise is wrong, and story 08 corrects it rather than following it.** The
intake says to "reuse the agent-list query and RLS scoping already proven in Home's Claim flow
(SCRUM-36)". `grep -rn "from('profiles')" src/` returns two hits, both in `src/features/auth/api.ts`,
both `.eq('id', userId)`; Home's claim flow reads no profiles at all; and API §2 documents exactly
one `profiles` endpoint, keyed to the caller's own id. **The agent list is new work, and its RLS
scoping is unverified** — §6's isolation matrix tests `customers`, `tickets`, `ticket_messages` and
`access_tokens`, never `profiles`. The plan's verification step 1 is a **blocking gate** run before
any UI work: if no same-department SELECT policy on `profiles` exists, the sheet is empty and
US-017 needs a backend change before it can ship. What *is* genuinely reusable from the claim flow
is `claimTicket`'s compare-and-set discipline, generalised in task 3 from "must be null" to "must
be what I last saw".

Story 08 reaches outside `features/tickets/` in three deliberate ways:

- **The agent-list query and its hook go in `features/auth/`, not `features/tickets/`.** `profiles`
  already has one owner; giving it two would be the start of a mess. `tickets` consumes
  `useDepartmentAgents` through `@/features/auth`'s barrel, which `tickets/hooks.ts:3` already
  imports from — hard rule 4 satisfied, hard rule 3 untouched.
- **It widens story 07's `TicketDetail` with `assigneeId`.** `assigneeName` cannot serve as a
  compare-and-set guard or mark the `CURRENT` row, and `DETAIL_SELECT` already returns the column
  (it starts with `*`) — a one-line type and mapper change to a story-07 file.
- **It edits `CLAUDE.md`'s "Project status"** to move assignment out of the open list.

Seven open questions close story 08. The load-bearing ones: **the unverified `profiles` RLS**
(question 1 — answer it before writing code), whether managers belong in the sheet (question 2 —
one line either way), and the fact that "assignment changed" and "RLS refused the row" reach the
client as the same zero-row result (question 5).

**US-018 (status transitions, API §4.9) is still open after story 08.** The header's **Status**
button stays exactly as story 07 left it: present, `disabled` on a `closed` ticket, and inert.

---

## Story 09 — ticket status transitions

Story 09 closes **US-018**, the second of the two BRD stories story 07 deliberately left open, and
with it the last of the four stories that meet on the ticket detail screen. After 07, 08 and 09
the only ticket work still outstanding in phase 1 is **creation** (US-012 / US-022) and
attachments (API §8, still 🔨).

**It depends on story 07 being implemented, not merely planned**, and on four things story 07
builds and nothing else provides: `state-machine.ts`, the header's **Status** button with its
`onStatusPress` / `statusDisabled` props, `TicketDetailScreen` as the sheet's host, and
`useTicketDetail` / `ticketKeys.detail`. It is **independent of story 08** in data terms, but the
two sheets sit behind the two buttons of the same header and both edit `TicketDetailScreen.tsx`;
whichever lands second copies the first's `visible` / `onClose` pattern.

**The intake's three technical instructions were checked and all three hold** — a first for this
folder. `state-machine.ts` really is the right single source (story 09 consumes it and adds
nothing); the trigger really is the enforcement and the sheet really is only UX; and the resolve
path really does need both a client gate and a mapped server rejection. The one place the intake
under-describes the work is error mapping: `toAppError` **cannot** distinguish these failures,
because a `RAISE EXCEPTION` reports `code: "P0001"` and `errors.ts:50-54` only parses all-digit
codes into a status. Story 09 therefore adds a tickets-local `toStatusChangeError` on top of
`toAppError`, exactly as `auth/api.ts` does for GoTrue — `core/utils/errors.ts` is untouched,
because `core/` may not know what a ticket status is (hard rule 3).

**The Figma file is missing three things this story needs**, and it invents all three rather than
pretending otherwise:

- **No resolution-note field.** Node `7:4232` is 288px tall with four children and no input, while
  BRD `:703`, API §4.9 and the intake all require the note. The sheet grows ~150px on the
  `resolved` selection — a layout the designer has not seen.
- **No selected state on `StatusOption`.** The component set's only variant axis is `Status`
  (`123:1020`). A picker needs one; the plan invents `borderFocus` + `bgPrimarySubtle`.
- **Only two of four option descriptions.** Figma supplies `pending` and `resolved` as instance
  text; `open` and `closed` are authored in the plan and need copy review in both languages.

Story 09 reaches outside `features/tickets/` in exactly one way — a `CLAUDE.md` "Project status"
edit. Everything else is additive inside the feature, and `state-machine.ts` is explicitly
**read-only** (except to correct it against BRD `:222-247` if story 07 shipped the table wrong).

**Two of US-018's six acceptance criteria are satisfied by code this story does not write** —
`:706` (the database rejects an illegal transition) and `:707` (the `status_changed` event records
from and to). Both live in `## Verification Steps` rather than the task list, and verification
step 1 — running API §4.9's three negative tests and recording their full error bodies — is what
decides the shape of the error mapper, so it runs **before** the mapper is written.

**This is also the story that changes the test calculus.** Story 07 identified `state-machine.ts`
as the one module in the app worth a test; until now the table only disabled a button. Story 09 is
where a wrong cell becomes an illegal transition offered to an agent, so the plan recommends
installing `jest-expo` here for a one-file suite over a five-line map.

Seven open questions close story 09. The load-bearing ones: the missing note field (question 1),
whether agents should be able to close a ticket manually at all when BRD §6 annotates
`resolved → closed` as *"after CSAT or timeout"* (question 5), and whether the backend can raise
distinct `SQLSTATE`s so the mapper stops matching on English prose (question 6). `pending` still
has no colour token — the **fourth** story to inherit that gap, and the first where the badge is
the main identifier of a choice rather than a label on a row.

---

## Story 13 — create a ticket

Story 13 closes **US-012** and, as a side effect, **US-022** — the two FABs on Home
(`HomeScreen.tsx:158`) and the Tickets tab (`TicketsScreen.tsx:119`) both retarget at the new
`/tickets/new` modal, and both of their TODO comments go. One of them cites the wrong id:
`HomeScreen.tsx:159` says `TODO(US-017)`, but US-017 is *assignment* (shipped in story 08) and
the FAB is US-022. That is the third mislabelled BRD id this folder has corrected in passing.

**It is the story where the two features meet.** `features/tickets/` imports `useCustomerSearch`,
`CustomerRow` and `CustomerListItem` from the `@/features/customers` barrel — the seam story 05
built and explicitly left unused ("Exported for SCRUM-28 … Do not delete as unused",
`customers/index.ts:8-10`). The picker must consume that hook rather than write a second customer
query, so an agent who has already searched on the Customers tab gets an instant picker. Hard rule
4 makes the barrel the only legal import path.

**It depends on `customers` 11, not just on 05.** Figma's customer section carries a
`+ New customer` link (`102:987`), and `/customers/new` does not exist before story 11.

Story 13 reaches outside `features/tickets/` in three ways:

- **A new query root, `['categories', …]`.** Categories are reference data; creating a ticket must
  not refetch them, and Home's every-refresh `ticketKeys.all` invalidation must not either. Same
  reasoning as `agentKeys` in story 08.
- **A new domain component, `PriorityChip`** — deliberately *not* `FilterChip`, whose own doc
  comment records that it is built against substituted tokens because its Figma source is corrupt.
- **It moves `home.newTicket` to `ticket.new`** now that two features render that control.

**The one thing this story must not get wrong** is the insert payload. `reference` and `status`
are server-generated (API §4.7, BRD `:615-616`), and the generated `Insert` type makes **every**
`tickets` column optional — so an extra `status` key is not a compile error, it is a silent
overwrite of a generated value. The payload is written as a fixed, fully-typed object literal with
a comment naming both omissions, exactly as `postTicketMessage` guards `is_internal`
(`api.ts:395-400`). Verification step 1 proves the server really does fill both in **before** the
form is built; if `reference` comes back null, BRD `:616` is unmet by backend work no client story
can fix.

Seven open questions close story 13. The load-bearing ones: **`+ New customer` navigates away and
does not come back** (inline creation is US-013 / SCRUM-29, and the round trip loses the agent's
input mid-call — arguably worse than the current no-op, so hiding the link until SCRUM-29 lands is
a real option); **attachments are drawn but cannot work** (API §8 is 🔨, no picker package is
installed — the `Dropzone` renders disabled with a hint, and this is now the third area waiting on
Storage alongside customer Notes and CSAT); and **the priority chips have no selected state in
Figma** even though BRD `:617` mandates a `medium` default — the plan invents the same
`borderFocus` + `bgPrimarySubtle` treatment story 09 invented for `StatusOption`, which makes two
components now papering over the same missing variant.

**After story 13, ticket creation is done and notifications are the only unbuilt phase-1 area.**

---

## Story 16 — create a customer inline

Story 16 closes **US-013** and, with it, **story 13's own open question 2** — the one flag story 13
filed against itself: `+ New customer` navigates away and does not come back, which is *"strictly
worse than the current no-op for an agent mid-call."*

**The entire story is a change of presentation, not of behaviour.** Story 11 built `CustomerForm`,
`useCreateCustomer`, `createCustomer` and `CustomerPhoneConflictError`; story 12 proved the form
takes a second host. This story adds a third — `CreateCustomerSheet`, a full-screen `Modal` over the
Create Ticket screen — and writes **no field, no validation rule and no mutation of its own**. It
adds **no i18n keys either**: all four strings it renders already exist.

Two decisions in it are not obvious and are argued in the plan rather than assumed:

- **The sheet lives in `features/customers/`, not `features/tickets/`.** Customer creation is the
  customers feature's business in every presentation it has. The alternative — exporting
  `CustomerForm`, `useCreateCustomer` and `CustomerPhoneConflictError` across the barrel and
  reassembling story 11's screen inside `features/tickets` — satisfies hard rule 4 just as well and
  leaks four internals to do it.
- **It is a `Modal`, not a `BottomSheet`.** `CustomerForm` renders its own `ModalHeader` and a
  `flex: 1` `KeyboardAvoidingView`; `BottomSheet.tsx:141-143` puts children in an auto-height padded
  `View` with no `flex` on the path, so the form would measure to zero height.

The one non-obvious type problem: **`createCustomer` returns `CustomerDetail`, and the ticket form's
customer state is `CustomerListItem`.** Task 3 adds `toListItemFromDetail` — a pure narrowing mapper
with `openTicketCount: 0` true by construction — rather than widening `CustomerListItem` or making
the picker's props a union.

It also closes the one US-013 criterion story 13 never touched: **BRD `:636`** requires the picker's
*empty state* to offer the action, so this story adds a second `+ New customer` control there,
prefilled with the search term when it reads like a name. That makes task 5d **the first two-level
modal presentation in the repo** — every existing sheet is single-level — and the plan carries the
iOS present-over-dismiss caveat and its fallback.

Seven open questions close story 16. The load-bearing ones: **there is no Figma frame for any of
this** (question 1 — and *"reuse the form"* and *"show every field"* are not the same instruction; a
name-and-phone-only form is a real option for an agent mid-call), the **two `+ New customer` controls
now on one screen** (question 2), and **silent discard on Cancel — the third story to file it**
(question 4), now sharp enough that an agent can lose a half-typed customer on top of a half-typed
ticket.

---

## Story 17 — ticket history timeline

**Read story 17's opening section before scheduling it.** SCRUM-35 sat in **To Do** while story 07
shipped it: `fetchTicketEvents` (`api.ts:435-451`), `useTicketEvents` (`hooks.ts:162-168`),
`ticketKeys.events` (`hooks.ts:50`), `HistoryRow.tsx` and the History segment
(`TicketDetailScreen.tsx:88-112`) are all on `main`, and story 07's own scope table lists US-019 as
in scope and done. **Four of the five acceptance criteria already pass.** The story is small and it
is mostly not UI.

It closes two real gaps and runs one blocking backend check:

- **`assigned` events render a raw profile UUID** — story 07's flag 5, deferred *"until US-017 gives
  it a resolved name"*. Story 08 shipped US-017, so the debt is due, and it is now visible to agents
  rather than theoretical. `ticket_events.to_value` has **no foreign key**
  (`database.ts:375-390` lists only `actor_id` and `ticket_id`), so PostgREST cannot embed a name;
  resolution is client-side, from story 08's `useDepartmentAgents` roster, gated on the History tab
  and sharing its `agentKeys` cache entry.
- **Unassignment renders "assigned the ticket to "** — i18next interpolates the null `to_value` as an
  empty string, so story 08's unassign path fails silently and reads like a truncation bug.
- **BRD `:722` — that `UPDATE`/`DELETE` on `ticket_events` is rejected — has never been run.** It is
  verification step 1, it runs **before** either frontend task, and it is the one criterion in US-019
  that is a security property rather than a rendering one. The plan is explicit that a `200`/`204`
  with zero rows affected is the dangerous middle case, not a pass.

Seven open questions close story 17. The load-bearing ones: **"chronologically" is ambiguous and the
BRD and the intake disagree in emphasis** (question 1 — the code is newest-first; the signed-off
criterion says chronologically); **events written in one transaction share a `created_at` with no
tiebreaker**, so an audit trail can reorder itself between refetches (question 4 — a client-side sort
would produce a stable order that is not the true order, which is worse); and **department-scoped
name resolution degrades every cross-department or transferred assignment to "another agent"**
(question 3), whose durable fix is a server-side `to_profile_id` with a real foreign key — which
would settle question 4 as well.

**Question 7 is a process finding, not a technical one.** Four tracker items describe shipped code:
**SCRUM-31** and **SCRUM-32** (both closed by story 07's `postTicketMessage`), **SCRUM-36** (closed
by Home's `claimTicket`) and **SCRUM-39** (closed by story 13's FAB wiring), alongside SCRUM-35
itself. `docs/remaining-stories.csv` still exports all of them as **To Do**. That wants one tracker
pass, not four more stories that each rediscover it.

---

## Stories 21 and 22 — the two composer closures

**Read these two together and run them in one session.** They share one composer
(`ReplyComposer.tsx`), one mutation (`postTicketMessage`), one row component (`MessageRow.tsx`) and
one query filter (`getMessages`' `.eq('is_internal', …)`). Their criteria are two halves of the same
boolean. Neither writes application code — story 07 built both paths, and its scope table says so.

**Both stories have an acceptance criterion this repo cannot close.** BRD `:664` (a public reply is
visible on the customer status page) and `:677` (an internal note is absent from its payload) both
name **US-025**, the magic-link status page in Epic E5 — an unbuilt, unauthenticated web surface.
`:677` is then restated verbatim as **US-026**'s own criterion at `:822`, so the same requirement is
written twice, across two epics, and neither is verifiable today. **Neither story may be closed as
fully done.** Each plan marks its criterion struck through and blocked, proves the half that does
live here, and carries the rest forward. Story 21's open question 1 asks for the planning decision
this forces: ship at 3-of-4 and 4-of-5 with the criteria carried to E5, or hold both stories until
E5 lands.

**Story 22 is the designated highest-risk story in Phase 1, and it earns that.** Its intake demands
three *independent* checks, and checks 2 and 3 have never been run: that an internal note is absent
from the Conversation tab's **actual response payload** (not merely unrendered), and that an insert
with `is_internal` omitted is **rejected by the database**. The plan runs the first as a pair of
`curl`s — filtered and unfiltered — because "the note didn't appear" and "the filter removed it"
are different claims, and only the pair distinguishes them. The second is a P0 gate: if a message
can be written without an explicit `is_internal`, then any future writer (E5's notification service
included) can create a row that `getMessages`' `is_internal=eq.false` filter will decide is public.

Both plans are emphatic that **the guard must not be "improved"**. `api.ts:391-401` is a doc comment
whose entire purpose is to stop someone adding a default, widening the payload to `Partial<>`, or
building it through a `Record<string, unknown>`; `database.ts:398` types `is_internal: boolean` with
**no `?`**, unlike every neighbouring column. Story 22's open question 5 notes that this protection
currently rests on a comment, a missing `?` in a **generated** file, and reviewer attention — a
`npm run gen:types` against a schema that gained a default would silently remove the compile-time
guard and leave the comment describing a protection that no longer exists.

Twelve open questions close the two stories. The load-bearing one is shared and is **not** about
`is_internal` at all: **the composer's mode is sticky across sends** (`ReplyComposer.tsx:26-30`
clears `body` but leaves `mode`), so an agent who posts an internal note and then types a reply to
the customer sends it internally unless they notice the chip — silently, with the customer never
receiving an answer. Story 22's open question 3. Story 21's open question 3 is the runner-up: a
**failed send loses the agent's text**, because `setBody('')` runs on tap rather than on success.
