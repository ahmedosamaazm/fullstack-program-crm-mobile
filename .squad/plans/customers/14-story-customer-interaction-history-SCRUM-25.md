# Story 14 — Customer interaction history (Story: SCRUM-25)

> Intake: `.squad/stories/customers/SCRUM-25/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4310` (`Customers - Detail (Tickets)`); the screen body is `7:4315`, the ticket cards are `7:4382`, `7:4406` and `7:4430`.
> **This is the frame story 10 was given but could not use** — it renders the Tickets tab, which story 10 explicitly did not build. Story 10 read its shell from this node and flagged that the Info-tab frame was the one it actually needed (its open question 1). That flag is now moot: this story is the one this node describes.

## Prerequisites

- **Story 10 completed** — [`10-story-customer-profile-view-SCRUM-24.md`](10-story-customer-profile-view-SCRUM-24.md). **Hard dependency.** It built `CustomerDetailScreen`, the three-tab bar, `CustomerDetail`, `fetchCustomerDetail`, `useCustomerDetail` and `customerKeys.detail` — and left `customerDetail.empty.tickets` as the placeholder this story replaces (`screens/CustomerDetailScreen.tsx:88-89`).
- **Story 04 completed** — [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md). Supplies `TicketRow` and `StatusBadge` in their current form. The intake's instruction — "anchor to the Tickets screen's actual implementation, not a possibly-stale mockup" — means `src/features/tickets/components/TicketRow.tsx` is the spec, not the render.
- **Story 07 completed** — [`../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`](../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md), for `/tickets/[id]`. A history row that taps into nothing fails `docs/phase1_brd_1.md:571`.
- **Story 13 completed** — [`../tickets/13-story-create-a-ticket-SCRUM-28.md`](../tickets/13-story-create-a-ticket-SCRUM-28.md). Not for code: it is what makes `features/tickets` → `@/features/customers` a **live** import (`components/CustomerPickerSheet.tsx:14`), and this story adds the return edge. See task 2 and open question 1.
- **`.env` populated**, and **seeded data**: one customer with **at least four** tickets spanning `new`/`open`/`pending` **and** `resolved`/`closed`, created on different days; one customer with **zero** tickets. Without a resolved or closed ticket, `docs/phase1_brd_1.md:570` cannot be exercised, and without a zero-ticket customer neither can `:572`.

---

## Story Goal

The customer profile's **Tickets** tab stops being a placeholder and becomes the context an agent reads before they speak. Concretely:

1. **Every ticket the customer has ever had**, newest first, including `resolved` and `closed` — this is a history, not an active-work view.
2. **No second request.** The tickets come back inside the `['customers', id]` entry story 10 already fetches, as an embedded array. The intake is explicit that this tab "renders the tickets array from that same response, it does not fetch separately".
3. **Rows that are the Tickets screen's rows** — the same `TicketRow` component, so the priority rail, the non-colour urgency glyph, the reference · customer meta line and the status badge can never drift between the two screens.
4. **A row tap opens the ticket**, reaching `/tickets/[id]` exactly as the Tickets tab and Home do.
5. **An explicit empty state** for a customer with no tickets.
6. **The customer cache stays fresh when tickets move.** Putting ticket data inside `['customers', id]` creates a staleness path that did not exist before this story; task 5 closes it.

**Not in scope**: the **Notes** tab (US-010 / SCRUM-26, blocked on Storage — it keeps story 10's placeholder, and there are **three** tabs, not two), filtering or searching this history, pagination (a customer's lifetime ticket count is bounded in a way the Tickets list is not — see open question 4), and the muted treatment for resolved/closed rows, which the intake forbids implementing silently (open question 2).

---

## Context — Read These Files First

1. `src/features/customers/api.ts` — the story-10 block from `DETAIL_SELECT` to the end of `fetchCustomerDetail`, plus `toCustomerDetail` and `parseSecondaryContacts`. Task 1 widens `DETAIL_SELECT`, the row type and the mapper. `updateCustomer` and `createCustomer` (stories 11 and 12) **also** `.select(DETAIL_SELECT)`, so widening it changes what those two return — that is fine and desirable, and it is why task 1 must not fork the constant.
2. `src/features/tickets/components/TicketRow.tsx` — all 99 lines. **This is the row spec.** Note `borderStartWidth: 3` / `borderStartColor: priorityColor(...)` on the root (lines 40-41) — the rail is a border on the row itself, not a child, which is why task 3's card needs `overflow: 'hidden'`. Note also that the trailing column (lines 65-69) stacks the relative time **above** the `StatusBadge` with `alignItems: 'flex-end'` — that is the two-line right edge the Figma cards show, already built.
3. `src/features/tickets/types.ts` — `TicketListItem` (lines 10-18), `TicketStatus`, `TicketPriority`. Task 1 imports the latter two as **types only**; task 3 needs `TicketListItem`. The type/value distinction is load-bearing here — see task 2.
4. `src/features/tickets/components/StatusBadge.tsx:17-30` — `statusStyle`. `resolved` is `bgSuccessSubtle`/`success` and `closed` is `bgSurfaceSunken`/`muted`; both already read as "finished" without any extra muting. Relevant to open question 2.
5. `src/features/customers/screens/CustomerDetailScreen.tsx` — all of it, especially the tab branch (lines 84-93) and `onHistoryPress={() => setTab('tickets')}` (line 68). This story replaces one branch and leaves the rest alone.
6. `src/features/customers/components/CustomerDetailHeader.tsx` — the trailing action group. It now holds **four** buttons (phone, mail, clock, edit); Figma `7:4353` holds three. Relevant to open question 3.
7. `src/features/tickets/hooks.ts:37-50` (`ticketKeys`) and `src/features/customers/hooks.ts:16-29` (`customerKeys`). Task 5 makes three ticket mutations invalidate the second root. Read the comment on `customerKeys` first — it says a ticket invalidation "must never refetch this", which **was** true and stops being true in this story; the comment is part of the change.
8. `src/features/tickets/components/CustomerPickerSheet.tsx:14` — `import { CustomerRow, useCustomerSearch, type CustomerListItem } from '@/features/customers';`. The existing `tickets` → `customers` edge. Task 2 adds the return edge and open question 1 is about the loop that closes.
9. `docs/phase1_api_reference.md:193-201` — §3.5. Its query is exactly this story's: `select=*,tickets(id,reference,subject,status,priority,created_at)&id=eq.{{customer_id}}&tickets.order=created_at.desc`. The `tickets.order=` form is what task 1 expresses as `referencedTable`.
10. `docs/phase1_brd_1.md:565-573` — US-009 and its four acceptance criteria. `## Done Criteria` mirrors them verbatim.
11. `eslint.config.js` — note that `eslint-plugin-import` is a **devDependency that the config never loads** (`plugins` holds only `@typescript-eslint`). `import/no-cycle` is therefore available and unused. Open question 1.
12. `src/core/lib/theme/elevation.ts` — `e1` is `offsetY: 1, blur: 3, opacity: 0.06`. Task 3's card uses `theme.elevation.e1`; `Theme` exposes it (`ThemeProvider.tsx:42, 74`).

---

## Design spec (resolved from Figma node `7:4310`)

Structure of the tab body, from `get_metadata` on `7:4310`:

```
7:4381  body (the Tickets tab's content)
├── 7:4382  TicketCard          at y=16,     h 67.2
│   ├── 61:406  PriorityRail    x=14, w 3, h 41.2
│   └── 7:4384  Container       x=29
│       ├── 7:4385  subject "Payment gateway timeout on checkout"  +  "4m" (trailing)
│       └── 7:4393  "TKT-202608-0142" · "Daniel Hartley"  +  65:613 StatusBadge (trailing)
├── 7:4454  TicketCard:margin   → 7:4406 TicketCard, 10px top margin
└── 7:4455  TicketCard:margin   → 7:4430 TicketCard, 10px top margin
```

The **inside** of each card is `TicketRow` as already built — rail, subject line with trailing relative time, meta line with trailing status badge. The **outside** is not: Figma wraps each row in a white rounded card with a soft shadow and a gap between cards, where the Tickets screen renders flat rows on the canvas with no card and no gap.

That is the one real difference, and it is a container difference, not a row difference — so it does not conflict with the intake's "structurally identical to the Tickets screen rows". Task 3 keeps `TicketRow` verbatim and adds the card around it.

| Element | Figma | Token / component |
|---|---|---|
| Tab body background | canvas | `colors.bgCanvas` |
| Horizontal inset | 16 | `spacing.lg` |
| First card top offset | 16 | `spacing.lg` |
| Card → card gap | 10 → snap to 12 | `spacing.md` (2px drift, the same call stories 01 and 05 made) |
| Card background | surface | `colors.bgSurface` |
| Card radius | ~10 → snap to 12 | `radius.md` |
| Card shadow | soft, low | `theme.elevation.e1` |
| Card height | 67.2 | intrinsic — `TicketRow`'s own padding |
| Priority rail | 3 wide, inset 14 | `TicketRow`'s `borderStartWidth: 3` — already exact |
| Row content inset | 29 − 14 = 15 → 12 | `TicketRow`'s `paddingStart: spacing.md` — already exact |
| Subject | 13.5 medium | `TicketRow`'s `<Text variant="body" weight="medium">` |
| Relative time | 11.5 muted, trailing | `TicketRow`'s `formatRelativeShort` |
| Reference · customer | 11.5 muted | `TicketRow`'s `meta` line |
| Status badge | pill, trailing | `StatusBadge` as built |

Three things the render shows that this story does **not** reproduce, each for a stated reason:

- **Resolved and closed rows are visually muted** — greyed subject text and a pale rather than coloured priority rail. **Not implemented.** The intake forbids it without a written rule first; open question 2.
- **The header carries three action buttons**, not the four the app now has. Story 12 added Edit. Open question 3.
- **A "2w" age.** `formatRelativeShort` (`core/utils/format.ts:76-88`) has no week unit, so a fourteen-day-old ticket renders `14d`. Cosmetic, and shared with the Tickets screen; open question 5.

---

## Implementation tasks

### 1 — Widen the detail query with the embedded history

**File: `src/features/customers/types.ts`**

```ts
import type { TicketPriority, TicketStatus } from '@/features/tickets';

/**
 * One row of a customer's ticket history — API §3.5's embedded `tickets`
 * projection. Deliberately NOT `TicketListItem`: that type carries
 * `customerName`, which is the customer whose profile this is and therefore
 * says nothing here. The tab maps to `TicketListItem` at the render boundary
 * (task 3) because `TicketRow` needs the field, and Figma does show the name.
 */
export type CustomerTicket = {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
};
```

Then add to `CustomerDetail`, below `secondaryContacts`:

```ts
  /** Every ticket, newest first — all statuses, `closed` included (BRD `:570`). */
  tickets: CustomerTicket[];
```

**This import must be `import type`.** It is erased at compile time by both `tsc` and Babel's TypeScript transform, so it emits no `require` and creates no runtime edge to `@/features/tickets`. Task 2's import of `TicketRow` is a *value* import and does not have that property — the distinction is the whole of open question 1.

**File: `src/features/customers/api.ts`**

Widen the shared constant — do **not** add a second select. `createCustomer` and `updateCustomer` both `.select(DETAIL_SELECT)`, so they start returning the array too, which is correct: a freshly created customer has `tickets: []` and an edited one keeps its history.

```ts
const DETAIL_SELECT =
  'id, full_name, phone, email, secondary_contacts, created_at, ' +
  'departments(name_en, name_ar), branches(name_en, name_ar), ' +
  'tickets(id, reference, subject, status, priority, created_at)';
```

Extend `CustomerDetailRow` with:

```ts
  tickets: {
    id: string;
    reference: string;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    created_at: string;
  }[] | null;
```

and `toCustomerDetail` with:

```ts
    tickets: (row.tickets ?? []).map((ticket) => ({
      id: ticket.id,
      reference: ticket.reference,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.created_at,
    })),
```

`?? []` is not defensive padding: PostgREST returns `null` rather than `[]` for an embed with no rows in some builds, and a `null` reaching `.map` in the tab is a white screen on the customer who most needs the empty state.

**The ordering goes on the query, not on the client.** In `fetchCustomerDetail`, between `.select(...)` and `.eq(...)`:

```ts
    // API §3.5's `tickets.order=created_at.desc`. `referencedTable` is what
    // orders the EMBED — a bare `.order('created_at')` would order the
    // customers result set, which is one row, and silently do nothing.
    .order('created_at', { referencedTable: 'tickets', ascending: false })
```

Add the same line to `createCustomer`'s and `updateCustomer`'s builders so all three paths return the array in one order. A create returns an empty array either way, but leaving the ordering off one of the three is how the next person learns the wrong pattern.

### 2 — The cross-feature import, deliberately

**File: `src/features/customers/components/CustomerTicketsTab.tsx`** (created in task 3) imports:

```ts
import { TicketRow, type TicketListItem } from '@/features/tickets';
```

`TicketRow` is a **value**, so this is a real runtime edge, and `@/features/tickets` already reaches back into `@/features/customers` (`components/CustomerPickerSheet.tsx:14`, pulled in through the barrel by `screens/CreateTicketScreen`). **This story closes an import cycle between the two feature barrels.** It is the first one in the repo.

Ship it anyway, for two reasons: hard rule 4 requires the barrel path and forbids the deep import that would dodge the loop, and duplicating `TicketRow` into `customers/` is precisely the drift the intake warns against. But ship it **knowingly**:

- Put the reasoning in a comment at the import site, naming the other direction, so the next reader does not "clean it up" by deep-importing.
- Keep every cross-feature import inside a component body or a render path — never at module scope. Both directions already satisfy this: `CustomerPickerSheet` uses `CustomerRow` in JSX, and this tab will use `TicketRow` in JSX. That is what makes the cycle survivable under Metro's live bindings.
- **Verification step 3 exists specifically to catch this**, cold, from both entry points.

Do **not** enable `import/no-cycle` as part of this story. It would fail the build on a cycle the story is knowingly shipping, and turning it on is a decision about the architecture, not a lint tidy-up. Open question 1.

### 3 — `CustomerTicketsTab`

**Create file: `src/features/customers/components/CustomerTicketsTab.tsx`**

```tsx
export type CustomerTicketsTabProps = {
  customer: CustomerDetail;
};
```

A `FlatList` over `customer.tickets` — not a `ScrollView` with a `.map`, because a long-standing customer's history is unbounded in a way the Info tab's six rows are not.

```tsx
contentContainerStyle={{
  padding: theme.spacing.lg,
  gap: theme.spacing.md,
  paddingBottom: theme.spacing.xxl,
}}
```

Each item is a card wrapping `TicketRow`:

```tsx
<View
  style={{
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bgSurface,
    // `TicketRow` draws its priority rail as a 3px START BORDER on its own
    // root (TicketRow.tsx:40-41). Without this the rail renders as a square
    // corner poking out of the card's radius.
    overflow: 'hidden',
    ...theme.elevation.e1,
  }}
>
  <TicketRow ticket={toRowItem(ticket, customer.fullName)} onPress={handleTicketPress} />
</View>
```

**`overflow: 'hidden'` and `elevation` fight on Android** — a clipped view drops its shadow. Accept the flat card on Android rather than nesting two views to have both; note it in a comment. The rail is the load-bearing cue, the shadow is not.

The mapper, module-scope and pure:

```ts
/**
 * `CustomerTicket` → `TicketListItem`. The only added field is `customerName`,
 * which is this profile's own customer — redundant in context, but Figma
 * `7:4400` prints it on every card and `TicketRow` renders `reference · name`
 * as one meta line. Passing `null` would silently drop the separator too.
 */
function toRowItem(ticket: CustomerTicket, customerName: string): TicketListItem {
  return { ...ticket, customerName };
}
```

`onPress` is `(id) => router.push({ pathname: '/tickets/[id]', params: { id } })` — the object form, per `CLAUDE.md`'s routing convention. **Do not** pass `onClaim`; claiming is Home's flow, and `TicketRow` already omits the button when the prop is absent (`TicketRow.tsx:15, 70`).

Empty state, when `customer.tickets.length === 0`:

```tsx
<EmptyState icon="tickets" title={t('customerDetail.empty.tickets')} />
```

The **key stays**; only its English and Arabic values change (task 6). Story 10 wrote it as "Ticket history isn't available yet." — a not-built message. It now means "this customer has none", which is a different sentence.

There is **no loading and no error branch in this component.** Both belong to `CustomerDetailScreen`, which already renders them for the whole screen (`screens/CustomerDetailScreen.tsx:26-53`) — the tickets arrive in the same response as the name in the header, so a tab-level spinner could never fire.

### 4 — Wire the tab

**File: `src/features/customers/screens/CustomerDetailScreen.tsx`**

Replace the `tickets` branch (lines 88-89) with `<CustomerTicketsTab customer={customer} />`, and add the import. The `notes` branch is untouched and keeps its placeholder — **three tabs, not two**, as the intake requires.

`onHistoryPress={() => setTab('tickets')}` (line 68) now lands on real content. It stays as story 10 wrote it; see open question 3.

**File: `src/features/customers/index.ts`** — export `CustomerTicketsTab` only if a second consumer appears; it has none, so keep it internal. Do export the `CustomerTicket` type, since `CustomerDetail` now references it and the type must be nameable from outside the barrel.

### 5 — Keep the customer cache honest

This story moves ticket data into the `['customers', id]` entry. Three mutations change a ticket's status, assignment or existence, and **none of them currently touches `customerKeys`**:

- `useCreateTicket` (`tickets/hooks.ts`) — a new ticket must appear in its customer's history.
- `useChangeTicketStatus` — BRD `:570` is specifically about `resolved`/`closed` rows; the badge on the history card would otherwise stay stale.
- `useAssignTicket` — assignment is not rendered on these cards, so this one is **not** required. Leave it alone; a wider invalidation than the data justifies is how a cache becomes a refetch-everything reflex.

**File: `src/features/tickets/hooks.ts`** — in `useCreateTicket` and `useChangeTicketStatus` only, add alongside the existing `ticketKeys.all` invalidation:

```ts
      // A customer's ticket history now lives inside `['customers', id]`
      // (story 14). Without this, resolving a ticket leaves a stale badge on
      // the customer's Tickets tab until `staleTime` expires.
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
```

`customerKeys` comes from `@/features/customers` — the barrel. This adds no new cycle direction; `tickets` → `customers` already exists (task 2).

**File: `src/features/customers/hooks.ts`** — the `customerKeys` doc comment currently reads "a claim cannot change a customer's record, so a ticket invalidation must never refetch this." That was true and no longer is. Rewrite it to say the root now carries embedded ticket history, and which two ticket mutations therefore reach it.

### 6 — Copy

**Files: `src/core/lib/i18n/locales/en.json` and `ar.json`** — change one value in each. No new keys.

`customerDetail.empty.tickets`: `"Ticket history isn't available yet."` → `"No tickets for this customer yet."` / `"لا توجد تذاكر لهذا العميل بعد."`

`customerDetail.empty.notes` is **unchanged** — the Notes tab genuinely is still unavailable.

### 7 — Update the instruction files

**File: `CLAUDE.md`** — "Project status": the customer profile's Tickets tab is built; only Notes (SCRUM-26, Storage-blocked) remains a placeholder. Add one line to the "Hard rules" area or its surrounding prose noting that `features/customers` and `features/tickets` now import each other through their barrels, and that this is a known cycle with an open decision. **File: `AGENTS.md`** — the same one-line note beside hard rule 4, because that is where the next agent will look before adding a cross-feature import.

---

## Edge Cases & Failure Modes

- **The embed returns `null`, not `[]`.** PostgREST does this for an empty embed on some builds. `?? []` in `toCustomerDetail` (task 1) is the guard; without it the tab calls `.map` on `null` for exactly the customer whose empty state matters.
- **A bare `.order('created_at')` without `referencedTable`.** Orders the one-row customers result and silently leaves the embed in insertion order. Nothing throws, nothing looks broken, and the history is subtly wrong. Task 1 spells the correct call out for this reason.
- **A customer with no tickets.** `tickets: []` → the empty state (BRD `:572`). Distinct from the screen-level not-found state story 10 built, which is about the *customer* not existing.
- **A customer with a very long history.** The `FlatList` in task 3 windows it. No pagination — see open question 4 for when that stops being enough.
- **`resolved` and `closed` tickets.** Included, because the select carries no status predicate (BRD `:570`). The risk here is a later "helpful" `.in('tickets.status', OPEN_STATUSES)` copied from `fetchCustomers` (`api.ts:52`), which would silently amputate the history. The list query legitimately filters; this one must not.
- **The priority rail against the card radius.** `TicketRow` draws the rail as a border on its own root, so the card needs `overflow: 'hidden'` (task 3) or the rail's corner escapes the radius.
- **`overflow: 'hidden'` kills the Android shadow.** Accepted, documented at the call site. Do not "fix" it by nesting a shadow view around a clipped view — two views per row for a shadow that is not carrying meaning.
- **Stale history after a status change.** Task 5. Reproduce by opening a customer's Tickets tab, resolving one of their tickets from `/tickets/[id]`, and coming back within `staleTime` (30s).
- **The import cycle at module-init.** If it ever bites, it presents as `undefined is not a function` on the *first* screen of whichever barrel loaded second — not as an error at the import. Verification step 3 exercises both orders cold.
- **Arabic layout.** `TicketRow`'s rail is a `borderStart`, so it moves to the right under RTL correctly and will look wrong to anyone diffing against the LTR mock. The reference and the relative time are Latin-digit runs inside an RTL line; `TicketRow` does **not** bidi-isolate them today, and this story does not change that — it is a pre-existing Tickets-screen behaviour, not something this tab introduces.

---

## Test Plan

**There is no test runner in this repo** (AGENTS.md). The list below is what to write when one is installed; the manual matrix underneath is the gate today.

### Manual test matrix

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Customer with 4+ tickets | Open the profile, tap **Tickets** | All their tickets render as cards (BRD `:569`) |
| 2 | As above | Read the order | Newest first, top to bottom |
| 3 | Customer with a `resolved` and a `closed` ticket | Read the tab | **Both are present** (BRD `:570`) |
| 4 | As above | Read their badges | Green `RESOLVED`, grey `CLOSED` |
| 5 | As above | Read the rows | **Not** muted — the treatment is deliberately unimplemented (open question 2) |
| 6 | Customer with zero tickets | Open the tab | "No tickets for this customer yet." — not the old "isn't available yet" copy (BRD `:572`) |
| 7 | Any | Tap a history row | That ticket's detail opens (BRD `:573`) |
| 8 | After row 7 | Press back | Back on the customer's Tickets tab, not the Info tab |
| 9 | Any | Compare a card here with the same ticket's row on the Tickets tab | Identical rail, glyph, subject, meta line, time and badge |
| 10 | An `urgent` ticket in the history | Read its card | Coloured rail **and** the alert glyph — the non-colour cue survives |
| 11 | Any | Read the network traffic on opening the tab | **No new request** — the tickets came with the profile |
| 12 | Any | Tap **Info**, then **Tickets** again | No refetch, no flicker |
| 13 | Any | Tap the header clock button | The Tickets tab is selected (open question 3) |
| 14 | Any | Read the header | Four action buttons; Figma shows three (open question 3) |
| 15 | Open a customer's Tickets tab | From another route, resolve one of their tickets, return within 30s | The badge is **updated** — task 5 |
| 16 | Open a customer's Tickets tab | Create a ticket for them, return | The new ticket is at the top |
| 17 | Any | Pull the app cold, open Home → ticket → contact strip → profile → Tickets | No crash — the cycle check, order A |
| 18 | Any | Pull the app cold, open the Tickets tab → FAB → customer picker | No crash — the cycle check, order B |
| 19 | Airplane mode | Open a profile | The screen-level error state; no tab-level spinner |
| 20 | Customer with a 20+ ticket history | Scroll the tab | Smooth; rows recycle |
| 21 | العربية, restarted | Open the tab | Layout mirrors; the rail sits on the right of each card |
| 22 | Toggle system dark mode | Open the tab | Cards, shadows and badges all legible |
| 23 | Any | Open the **Notes** tab | Still a placeholder, still reachable — three tabs |
| 24 | Any | Open the Customers list, create a customer, edit one | All still work — the `DETAIL_SELECT` widening touched all three paths |

### To write when a runner exists

1. **Unit — `src/features/customers/api.test.ts`** · `toCustomerDetail` maps `tickets: null` → `[]` and `tickets: []` → `[]`.
2. **Unit — `src/features/customers/api.test.ts`** · it camelCases `created_at` → `createdAt` on every embedded ticket and preserves server order.
3. **Unit — `src/features/customers/api.test.ts`** · `DETAIL_SELECT` contains the `tickets(...)` embed, and all three consumers (`fetchCustomerDetail`, `createCustomer`, `updateCustomer`) apply `referencedTable: 'tickets'` ordering.
4. **Unit — `src/features/customers/api.test.ts`** · the select carries **no** status predicate on the embed — the regression guard against someone copying `fetchCustomers`' `OPEN_STATUSES` filter.
5. **Unit — `src/features/customers/components/CustomerTicketsTab.test.tsx`** · `toRowItem` sets `customerName` from the customer and leaves every other field untouched.
6. **Unit — `src/features/customers/components/CustomerTicketsTab.test.tsx`** · an empty array renders the empty state and no `FlatList` rows.
7. **Unit — `src/features/customers/components/CustomerTicketsTab.test.tsx`** · `TicketRow` receives no `onClaim`, so no Claim button appears in the history.
8. **Integration — `src/features/tickets/hooks.test.tsx`** · `useCreateTicket` and `useChangeTicketStatus` invalidate **both** `ticketKeys.all` and `customerKeys.all`; `useAssignTicket` invalidates only the first.
9. **Smoke — `src/features/import-cycle.test.ts`** · importing `@/features/customers` first, then `@/features/tickets`, resolves `TicketRow` and `CustomerRow` to functions — and the same with the order reversed. This is the cheapest possible guard on open question 1.

---

## Verification Steps

1. **Prove the embed and its ordering before writing the tab.** Run §3.5 against a seeded customer with mixed statuses:
   ```bash
   curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/customers?select=id,full_name,tickets(id,reference,subject,status,priority,created_at)&id=eq.$CUSTOMER_ID&tickets.order=created_at.desc"
   ```
   Confirm three things: the array is present and newest-first, `resolved` and `closed` rows **are** included, and what an empty history returns — `[]` or `null`. That last answer is what task 1's `?? []` is defending against, and it is worth knowing rather than assuming.
2. **Typecheck:** `npm run typecheck` — zero errors. The generated `Database` types make a wrong embed shape fail here.
3. **The cycle, cold, both ways.** With Metro restarted (`npm start`, then `r`), walk matrix rows 17 and 18 in separate cold starts. A cycle failure is `undefined is not a function` on the first screen of whichever barrel initialised second — it will not show up as an import error, and it will not show up at all if you only ever test one entry order.
4. **Lint:** `npm run lint` — zero errors. Note this will **not** flag the cycle: `eslint-plugin-import` is installed but the config never loads it (`eslint.config.js`). That is the subject of open question 1, not an oversight to fix in passing.
5. **Frontend runs:** `npm start`, press `a` and `i`. Walk the matrix.
6. **Regression — create and edit a customer.** Task 1 widened `DETAIL_SELECT`, which `createCustomer` and `updateCustomer` both use. A malformed select fails loudly; a missing `?? []` fails only on the create path, where the array is always empty. Matrix row 24.
7. **Regression — the ticket detail and the Tickets tab.** Task 5 edited two mutation hooks. Resolve a ticket and confirm the detail screen, the Tickets list and Home's counts all still update as before.
8. **The no-second-request check.** With the Metro network inspector (or `read_network_requests` against the web build), open a profile and switch to Tickets. Exactly one `customers?select=…` request, no `tickets?…` request. Matrix row 11 — this is the intake's central technical requirement and the easiest one to satisfy accidentally-wrongly by adding a hook.
9. **RTL:** switch to العربية and **fully restart**. Matrix row 21.
10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:569-573`.

- [ ] Given a customer with tickets, when I open the Tickets tab, then **all** their tickets list **newest first**
- [ ] Given a **closed** ticket, when history renders, then it is **still included**
- [ ] Given a customer with **no** tickets, when the tab opens, then an **empty state** renders
- [ ] Given a history row, when I tap it, then **that ticket opens**

Plus, from the intake and the design:

- [ ] The tab renders from the **same `['customers', id]` response** — no second query, no second hook
- [ ] Rows are `TicketRow` itself, not a copy — rail, urgency glyph, meta line and badge cannot drift
- [ ] The embed is ordered server-side with `referencedTable: 'tickets'`, on all three `DETAIL_SELECT` consumers
- [ ] The embed carries **no status filter**
- [ ] Resolved/closed rows are **not** muted, and the reason is recorded as an open question
- [ ] The Notes tab still renders as a reachable placeholder — **three** tabs
- [ ] `useCreateTicket` and `useChangeTicketStatus` invalidate `customerKeys.all`; `useAssignTicket` does not
- [ ] The `customerKeys` doc comment no longer claims ticket invalidations never reach it
- [ ] The cross-feature import cycle is commented at the import site and recorded as an open question
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md and AGENTS.md note the cycle beside hard rule 4

---

## Open questions — raise with design/product, do not resolve silently

1. **This story closes an import cycle between two feature barrels — the first in the repo.** `features/tickets` has imported `@/features/customers` since story 13's customer picker; this story adds `features/customers` → `@/features/tickets` for `TicketRow`. Hard rule 4 forbids the deep import that would avoid it, and duplicating the row is the drift the intake warns against, so the cycle is the least-bad of three bad options. It survives because both directions are used inside render paths, never at module scope — but that is a property nobody is currently enforcing. **`eslint-plugin-import` is already a devDependency and `eslint.config.js` never loads it**, so `import/no-cycle` is one config block away; enabling it today would fail the build. The team should choose: (a) accept the cycle and add the smoke test (test 9) as the guard, (b) relax "domain components live in `features/`" enough to let genuinely cross-domain *presentational* rows — `TicketRow`, `StatusBadge` — sit in `core/components/`, which contradicts CLAUDE.md's "Target architecture" as written, or (c) invert one direction by passing components in as props, which trades a cycle for indirection. **This is the story's highest-priority question**, and it gets more expensive with every feature that references another.
2. **The muted treatment for resolved and closed rows is not implemented.** Figma `7:4406` and `7:4430` grey both the subject text and the priority rail; `7:4382` (an open ticket) does not. The intake is explicit that this must become a written rule before it ships, so it applies everywhere ticket history appears rather than only here — and **the file the intake names, `DESIGN.md`, does not exist in this repo.** The nearest equivalent is the design-system plan's §15 flag list (`.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md`). Two decisions are needed: where the rule lives, and what it says — muting the rail specifically discards the priority cue on exactly the rows an agent skims fastest, which may be right for history and is definitely wrong for the Tickets list. Note also that `StatusBadge` already renders `resolved` green and `closed` grey-on-sunken, so the rows are *already* distinguishable without any new treatment.
3. **The header clock button, and the fourth button beside it.** The intake says to confirm the clock's purpose or remove it, and explicitly not to guess. Story 10 guessed — it wired the clock to select the Tickets tab and recorded that as its own open question 4. That guess is now more defensible than it was, because the Tickets tab has real content, but it is still a control that duplicates a tab. Separately, Figma `7:4353` shows **three** buttons and the app now has **four**: story 12 added Edit, which has no Figma component at all (its open question 1). Both need one decision from design, together, since they share a row that is now 168px of a 355px header.
4. **No pagination on the history.** A customer's lifetime ticket count is bounded by their relationship, not by the branch's volume, so a `FlatList` over the embedded array is right for the seeded data and for most real customers. It stops being right for a high-volume account — and because the array arrives inside the profile response, a long history slows the **Info** tab too, which is the tab that opens by default. If any customer is expected past roughly 200 tickets, this needs a separate paginated query and stops being a free ride on `['customers', id]`.
5. **`formatRelativeShort` has no week unit.** Figma's third card reads `2w`; the app renders `14d`. Shared with the Tickets screen and Home, so fixing it is a one-line change in `core/utils/format.ts` plus two i18n keys — but it changes every ticket row in the app, which makes it a design call rather than a bug fix.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 15.**


## **[Corrected 2026-09-01 — design audit]**

Two items in this plan's spec table were wrong or unimplemented:

1. **`colors.bgCanvas` for the tab body was specified but never implemented.** The tab
   inherited the screen's `bgSurface`, so white cards rendered on white — invisible, and
   worse on Android where the card's `overflow: 'hidden'` also dropped its shadow. Now fixed.
2. **"TicketRow priority rail — already exact" does not hold.** Figma `35:27` is a
   3 × ~41 `radius.full` pill INSET inside the card padding; the code drew a full-height
   square start border. Now fixed as a child `View`, which also let the card drop its
   `overflow: 'hidden'` clip and regain `elevation` on Android.

Confirmed correct and left alone: Figma uses the SAME `TicketRow` here as the Tickets list
(no compact variant), designs NO empty state for this tab, and uses NO section grouping.
