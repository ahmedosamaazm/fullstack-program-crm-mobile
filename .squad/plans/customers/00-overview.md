# customers — plan overview

Entry point for the **customers** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 05 | [05-story-customer-list-and-search-SCRUM-21.md](05-story-customer-list-and-search-SCRUM-21.md) | Customer list and search | SCRUM-21 | `design-system` 01, `home` 03, `tickets` 04 |
| 10 | [10-story-customer-profile-view-SCRUM-24.md](10-story-customer-profile-view-SCRUM-24.md) | Customer profile view | SCRUM-24 | `design-system` 01, `auth` 02, `customers` 05, `tickets` 07 |
| 11 | [11-story-create-a-customer-SCRUM-22.md](11-story-create-a-customer-SCRUM-22.md) | Create a customer | SCRUM-22 | `design-system` 01, `auth` 02, `customers` 05, `customers` 10 |
| 12 | [12-story-edit-customer-details-SCRUM-23.md](12-story-edit-customer-details-SCRUM-23.md) | Edit customer details | SCRUM-23 | `customers` 10, `customers` 11 |
| 14 | [14-story-customer-interaction-history-SCRUM-25.md](14-story-customer-interaction-history-SCRUM-25.md) | Customer interaction history | SCRUM-25 | `customers` 10, `tickets` 04, `tickets` 07, `tickets` 13 |
| 24 | [24-story-customer-notes-and-attachments-SCRUM-26.md](24-story-customer-notes-and-attachments-SCRUM-26.md) | Customer notes and attachments | SCRUM-26 | `customers` 10, `customers` 14, `tickets` 07, **a new `customer_notes` table** |

## Dependency notes

Story 05 is a **near-twin of** [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md)
— the same static header, the same `SectionList` over a grouped list, the same state ladder — and it
depends on story 04 for two concrete artefacts, not just for precedent:

- **`SectionHeader`'s `variant="rule"` fix** (story 04, task 1). The A – F / G – M / N – Z headers are
  that component verbatim.
- **`sanitizeSearch`** (story 04, task 2a), which story 05 promotes from `features/tickets/api.ts` to
  `core/utils/search.ts` because it now has two consumers (hard rule 2).

**Do not run 04 and 05 in parallel.** They edit the same core components and the same tickets file.

It depends on [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md)
for the token layer, and is the **first consumer of `Avatar`** — that component has had none since
story 01 built it.

It depends on [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md)
only for the `src/app/(tabs)/` shell and the `customers.tsx` route it fills in.

Story 05 reaches outside the customers folder in four deliberate ways:

- **It extracts `ListScreenHeader` into `src/core/components/`** and migrates the Tickets screen onto
  it. The Tickets and Customers header blocks are the same Figma structure (`7:372` and `7:1944`);
  hard rule 2 makes that an extraction rather than a copy.
- **It adds a `tint` prop and a `tintForName` helper to `core/components/Avatar.tsx`** — additive,
  defaulting to today's neutral behaviour.
- **It changes `initialsOf` in `core/utils/format.ts`** from first + last to first + second, matching
  every multi-word name in the Figma render. `Avatar` is its only consumer and has no screen
  consumers before this story, so the blast radius is zero today — but it is a core semantic change
  and is flagged as such.
- **It moves `sanitizeSearch` out of `features/tickets/api.ts`** into `core/utils/search.ts`.

This is also the **first story to paginate.** BRD `:519` requires it, so the list uses
`useInfiniteQuery` where the Tickets list used a flat `useQuery` — which brings its own failure
modes (the `id` tiebreaker on the sort, the `onEndReached` guards, `getNextPageParam` returning a
page index rather than a row count), all enumerated in the story's edge cases.

It deliberately stops short of four neighbouring stories:

- **US-006 create customer** — the FAB renders inert.
- **US-007 edit customer** — no write path at all; nothing invalidates `customerKeys.all` yet.
- **US-008 / US-009 customer detail and history** — row taps are a documented no-op.
- **SCRUM-28 Create Ticket's customer picker** — not built here, but `useCustomerSearch` is exported
  for it and shares a cache entry with this screen, per the intake's explicit "should reuse this same
  query, not duplicate it".

Seven open questions are recorded at the end of story 05 and are **not** settled by it. Three of them
are load-bearing enough that the manual test matrix has dedicated *recording* rows to produce
evidence: the A – F / G – M / N – Z buckets have no meaning for Arabic names (highest priority),
phone search matches the stored format rather than the displayed one, and `ilike` does not normalise
Arabic orthography so `احمد` will not find `أحمد`. The remaining four are the `initialsOf` semantic
change, the undefined "Recent" filter, avatar tints that will not match the mock, and the currently
unused `customerKeys.all` invalidation root.

---

## Stories 10, 11 and 12 — the rest of the customer record

Three stories close **US-008**, **US-006** and **US-007**. **They are numbered in dependency
order, not in tracker order**, and the difference matters:

| Tracker | BRD | Story | Why it sits where it does |
|---|---|---|---|
| SCRUM-24 | US-008 | **10** | Nothing else can reach one customer. Story 05 left the row tap a documented no-op and story 07 left the ticket contact strip one; 10 is what both were waiting for. |
| SCRUM-22 | US-006 | **11** | BRD `:531` requires a successful save to *open* the new customer. `/customers/[id]` does not exist before story 10. |
| SCRUM-23 | US-007 | **12** | The intake says edit "reuses the same form fields and validation as Create Customer" and invalidates `['customers', id]`. It needs both 11's form and 10's cache entry, and it has **no entry point at all** until 10 ships a profile to put an Edit button on. |

Running them in tracker order (22 → 23 → 24) means story 22 redirects to a route that does not
exist and story 23 builds an editor nothing can open.

**Story 10** is the first consumer of `DetailRow`, and it reaches outside `customers/` three times:
it promotes `localisedName` into `core/utils/locale-name.ts` (its **third** private copy was about
to be written — `features/auth/api.ts:61` and `features/tickets/api.ts:305` are the first two),
promotes `isolateLtr` out of `CustomerRow.tsx` on its second consumer, and closes the two
`TODO(US-008)` no-ops in `CustomersScreen.tsx:33` and `ContactStrip.tsx:26`. Its load-bearing
open question is **the shape of `secondary_contacts`** — API §3.3 says `{type,value,label}`,
Figma's form collects "Contact name" and "Phone number", and the column is untyped `Json`.
Story 12 is the one that writes that array, so the question must be answered before 12, not after.

**Story 11** is the app's **first write path in `customers/`** and closes story 05's open question 7.
Its hardest detail is not the form: `core/utils/errors.ts:53` coerces an all-digit `code` string
into a status, and Postgres reports the duplicate-phone unique violation as `code: "23505"` — so
`toAppError` flattens the one error the intake insists must be a **field-level** message into
`kind: 'server'`, indistinguishable from a 500. The conflict must be detected on the raw error,
before mapping. Its other flag is that **Figma offers Department and Branch as pickers while API
§3.3 says RLS rejects anything but the caller's own** — the plan renders them read-only and asks.

**Story 12** answers the intake's "check before assuming": **there is no Edit frame in the Figma
file.** It reuses the create frame, extracts a shared `CustomerForm` out of story 11's screen, and
invents the entry point (a fourth header icon and a new `pencil-outline` glyph — `Icon.tsx` has
none). Two of its four acceptance criteria are about secondary contacts, which is why the shape
question above is load-bearing, and one — BRD `:548`, editing across branches via raw API — is
satisfied by RLS rather than by any code this story writes, so it lives in verification step 1.

After 12, the customers feature is complete except for **US-009** (SCRUM-25, the profile's Tickets
tab) and **US-010** (SCRUM-26, Notes — still blocked on Storage, API §8 is 🔨). Story 10 renders
placeholders for both.

---

## Story 14 — customer interaction history

Story 14 fills the **Tickets** tab story 10 left as a placeholder, closing **US-009**. It is the
story node `7:4310` was always describing — story 10 was handed that node, found it rendered the
Tickets tab rather than the Info tab it needed, and filed that as its open question 1. That flag is
now moot.

The whole story is one design decision and its consequences: **the history rides inside the
`['customers', id]` entry** as an embedded array (API §3.5), rather than being a query of its own.
The intake is explicit about it, and it buys the tab a zero-request render. It also costs three
things the plan handles rather than discovers:

- **`DETAIL_SELECT` is shared.** `createCustomer` and `updateCustomer` both use it, so widening it
  changes what those two return as well. That is correct — a new customer comes back with
  `tickets: []` — but the embed's ordering must be added to all three builders, not one.
- **The ordering is `referencedTable: 'tickets'`, not a bare `.order()`.** A bare one sorts the
  single-row customers result and silently leaves the history in insertion order. Nothing throws.
- **Ticket mutations now have to reach `customerKeys`.** `useCreateTicket` and
  `useChangeTicketStatus` gain a second invalidation; `useAssignTicket` deliberately does not,
  because assignment is not rendered on these cards. The `customerKeys` doc comment currently
  claims a ticket invalidation "must never refetch this" — that sentence stops being true and is
  part of the change.

**Story 14 closes the repo's first import cycle between two feature barrels.** `features/tickets`
has imported `@/features/customers` since story 13's customer picker; this story adds the return
edge for `TicketRow`, because hard rule 4 forbids the deep import that would dodge it and copying
the row is exactly the drift the intake warns against. It survives because both directions are used
inside render paths rather than at module scope — a property nothing currently enforces.
`eslint-plugin-import` is already a devDependency that `eslint.config.js` never loads, so
`import/no-cycle` is one config block away and would fail today. That decision is the story's
highest-priority open question, and it gets more expensive with every feature that references
another.

Two things in the Figma frame are **deliberately not implemented**, on the intake's instruction:
the muted treatment on resolved/closed rows (it must become a written rule first — and the file the
intake names for that, `DESIGN.md`, does not exist in this repo), and any new behaviour for the
header's clock button. Story 10 already guessed at the clock by wiring it to select this tab; that
guess is more defensible now the tab has content, but it still needs one decision from design —
alongside the fact that the header now carries **four** action buttons where Figma shows three,
since story 12 added Edit.

After story 14, the customers feature is complete except for **US-010** (SCRUM-26, Notes — still
blocked on Storage, API §8 is 🔨). The Notes tab keeps story 10's placeholder: **three** tabs, not
two.

---

## Story 24 — customer notes and attachments

Story 24 fills the **Notes** tab and closes **US-010**, the last story in this feature. It is the
first story in the repo to touch Supabase **Storage**, and the first to need a table that phase 1
never designed.

The premise story 14 recorded above — *"still blocked on Storage, API §8 is 🔨"* — **is false and
has been since backend §7 shipped.** `docs/phase1_backend_plan.md:93` marks Storage `✅ COMPLETE`
and `:95` says in as many words that it *"Unblocks: SCRUM-26"*: a private `attachments` bucket
exists with a 10 MB cap, a four-type MIME allowlist, and three branch+department-scoped policies
on `storage.objects`. Two other documents still say otherwise (`phase1_api_reference.md:424`,
`phase1_remaining_stories_status.md:92`), as do three source comments; story 24 task 8 fixes all
five. **The backend plan is authoritative** — it documents the deployed policies.

What is genuinely missing is smaller and more awkward: **there is no table for note text.**
`attachments` exists and its `customer_id` FK makes a customer-scoped file representable today,
but BRD §5's eleven tables include nothing that stores free text against a customer, and
`database.ts` agrees. US-010's first acceptance criterion has nowhere to write. So the story
splits, and the halves have different blockers:

- **Attachments** — unblocked, buildable today, six of the story's seven tasks.
- **Notes** — blocked on **task 0**, a `customer_notes` table this repo cannot create. The plan
  specifies its DDL and RLS in full, modelled on `ticket_messages`, but it is a proposal awaiting
  sign-off, not a decision. **If task 0 slips, ship the attachments half alone.**

Reusing `attachments` for note text is the obvious shortcut and the plan rejects it explicitly:
`storage_path`, `file_name`, `mime_type` and `size_bytes` are all NOT NULL, so a note would have
to fabricate four values, and every later attachment query would need a sentinel filter.

Three other things make this story unlike its five siblings:

- **It is the first screen in the repo built without a Figma frame.** The design audit records it
  (`.squad/audits/design/customers-detail-info.md:110-111`): the Notes tab exists in the tab bar,
  its content does not exist anywhere in the file. Every layout choice in tasks 5 and 6 is
  composed from existing components against `CustomerTicketsTab` and `ReplyComposer` precedent.
- **It adds four Expo packages** — `expo-image-picker`, `expo-document-picker`,
  `expo-file-system`, `expo-crypto` — the first native additions since the font work, and none of
  them forces a development build. `expo-file-system`'s API changed completely in SDK 54; the plan
  uses the new `File` class, because the legacy names now throw at runtime.
- **Two of its acceptance criteria cannot be closed by reading the diff.** The cross-branch denial
  is enforced by deployed `storage.objects` policy, and the `attachments` table's INSERT policy
  for agents is asserted by BRD `:256` but shown by no document in this repo. Both are `curl`
  gates that run **before** any client code is written.

It deliberately ships **no delete affordance**, because the deployed permissions contradict
themselves: agents have a delete policy on `storage.objects` but none on the `attachments` table,
so a delete button would remove the file and orphan the row. That is one of eight open questions,
alongside the notes-table design itself and the fact that iOS permission strings are English-only
in an Arabic-first app.

After story 24, `features/customers` is **complete**, and `Dropzone` — built by story 01 and
inert ever since — finally has a live caller.
