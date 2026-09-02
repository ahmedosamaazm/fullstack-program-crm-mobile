# Story 15 — My tickets preview (Story: SCRUM-38)

> Intake: `.squad/stories/home/SCRUM-38/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:8` (`Home - Dashboard`); the screen body is `7:13`.
> **The intake's Figma link points at `7:4009`, which is `Tickets - New Ticket`** — the create-ticket modal story 13 built, not Home. Corrected here from story 03's own header, which resolved Home to `7:8`. Same class of error as SCRUM-24's intake; open question 1.

## Prerequisites

- **Story 03 completed** — [`03-story-home-workload-summary-SCRUM-37.md`](03-story-home-workload-summary-SCRUM-37.md). **It already built most of this story** — see "Story Goal" below. `HomeScreen.tsx` renders the My-tickets section, its five rows, its "View all" header and the `SectionHeader variant="link"` they sit under.
- **Story 04 completed** — [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md). It owns `TicketsScreen`, the `filter` state this story parameterises, and `ticketKeys.list`, whose shape is why Home does not currently share a cache entry with it (task 1).
- **Story 07 completed** — [`../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`](../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md). It wired `handleTicketPress` on Home (`HomeScreen.tsx:29-31`), which is acceptance criterion 2 already satisfied.
- **`.env` populated**, and **seeded data**: the signed-in agent needs **more than five** tickets in `new`/`open`/`pending`, with **at least one `urgent` created several days ago and at least one `low` created today** — without that exact pair, acceptance criterion 1 ("priority then age") passes vacuously against a list that happens to be in date order anyway.

---

## Story Goal

Read this section before estimating: **three of US-021's three acceptance criteria already render correctly today.** Story 03 built the section, story 07 wired the row tap, and `TicketsScreen` happens to default to `mine`. What is *not* built is the intake's technical requirement and one real navigation bug hiding behind an accidental pass.

| AC (`docs/phase1_brd_1.md`) | Today | This story |
|---|---|---|
| `:762` up to five, ordered by priority then age | **Renders correctly** — `useMyTickets(5)`, server-ordered | Verify the ordering is real, not coincidental (verification 1); keep the behaviour, change how it is fetched |
| `:763` a preview row opens that ticket | **Done** (story 07) | Untouched |
| `:764` View all opens the Tickets tab filtered to Mine | **Passes by accident** | Make it true on purpose (task 2) |

So the work is:

1. **Home stops issuing its own query.** The intake is explicit — "reuse the existing `['tickets', 'mine']` query from the Tickets screen rather than writing a parallel one — Home should read the same cache entry, just render fewer rows" and "§4.1 … **sliced to the first 5 client-side**". Home currently passes `limit: 5` to the server, which produces a *different* cache key and therefore a second request. Task 1 fixes that.
2. **"View all" actually selects the filter.** Today it pushes to the Tickets tab and relies on that screen's `useState` default. The moment an agent switches the tab to Unassigned or All, the tab keeps that filter — tab screens stay mounted — and "View all" under **My tickets** silently lands them on somebody else's list.
3. **Both "View all" links, not one.** The Unassigned section has the identical line of code and the identical bug. Fixing one and not the other leaves two links that look the same and behave differently.

**Not in scope**: changing the row layout (the intake's own description of it is stale — open question 2), the Unassigned preview's server-side `limit: 3` (task 1 explains why it stays), notifications (`HomeHeader`'s `onNotificationsPress` remains the no-op story 03 left), and the greeting, stats and claim flow, all of which story 03 finished.

---

## Context — Read These Files First

1. `src/features/home/screens/HomeScreen.tsx` — all 165 lines. `MINE_PREVIEW_LIMIT = 5` (line 26), `useMyTickets(MINE_PREVIEW_LIMIT)` (line 47), the My-tickets section (lines 84-110) and its `onActionPress={() => router.push('/(tabs)/tickets')}` (line 89), and the identical Unassigned one (line 117). Lines 47, 89 and 117 are the three this story changes.
2. `src/features/tickets/hooks.ts:37-50` — `ticketKeys`. **Read `list` closely:** `['tickets', 'list', filter, userId, options.limit ?? null, options.search ?? '']`. The `limit` segment is why Home's `useMyTickets(5)` and the Tickets screen's `useTicketList('mine', { search: '' })` are two different entries and two different requests today. Dropping the argument makes both resolve to `['tickets','list','mine',<uid>,null,'']` — the same entry, byte for byte.
3. `src/features/tickets/hooks.ts:73-79` — `useMyTickets(limit?)` and `useUnassignedTickets(limit?)`. The parameter stays optional; task 1 stops passing it in one of the two call sites.
4. `src/features/tickets/api.ts` — `fetchMyTickets`, specifically `.order('priority', { ascending: false }).order('created_at', { ascending: false })` and the conditional `.limit()`. **The priority ordering is correct only because of how the enum is declared** — see verification 1.
5. `src/core/types/database.ts` — `ticket_priority: "low" | "medium" | "high" | "urgent"`. Postgres orders an enum by **declaration order**, so `ascending: false` yields urgent → high → medium → low. That is the behaviour AC `:762` needs, and it is a property of the migration, not of the query.
6. `src/features/tickets/screens/TicketsScreen.tsx` — all 126 lines. `const [filter, setFilter] = useState<TicketFilter>('mine')` (line 37) and `const FILTERS: TicketFilter[]` (line 26). Task 2 makes that initial state respond to a route param. Note the screen takes **no props today**.
7. `src/app/(tabs)/tickets.tsx` — all 5 lines, and `src/app/tickets/[id].tsx` — all 8. The second is the pattern for the first: a route file reads its params and passes them as props, and nothing else (hard rule 1).
8. `src/features/tickets/components/TicketRow.tsx` — all 99 lines. **This is the row spec**, per the intake's own instruction to "anchor to the Tickets screen's actual implementation, not a possibly-stale mockup". No change; read it so you can confirm the intake's description of it is the stale part (open question 2).
9. `docs/phase1_api_reference.md:205-210` — §4.1. No `limit` in the documented query; the cap is a client concern.
10. `docs/phase1_brd_1.md:758-765` — US-021 and its three acceptance criteria. `## Done Criteria` mirrors them verbatim.
11. `.squad/plans/home/03-story-home-workload-summary-SCRUM-37.md` — the story that built this screen. Its design spec for the My-tickets section still applies unchanged.

---

## Design spec (resolved from Figma node `7:8`)

**No visual change.** The section, its header, its "View all" link and its five rows are exactly as story 03 built them from `7:8`; that plan's design spec remains the reference. This story changes where the data comes from and where the link goes, and touches no style.

Two things the intake asserts about the rows that the built component does not do — both resolved in favour of the code, because the intake itself says to:

| Intake says | `TicketRow.tsx` actually does |
|---|---|
| "subject with right-aligned relative time on line one, reference · customer name with right-aligned **status dot** on line two" | One trailing column (`alignItems: 'flex-end'`, lines 65-69) holding the relative time **above** a full `StatusBadge` pill — not a dot, and not one item per line |
| "priority rail on the leading edge" | Correct — `borderStartWidth: 3` with `priorityColor` (lines 40-41), plus an alert glyph on `urgent`/`high` that the intake does not mention (BRD `:610`'s non-colour cue) |

The intake's closing line — "Several design iterations let Home's rows drift from Tickets' rows — anchor to the Tickets screen's actual implementation" — is the instruction that settles both. Home and the Tickets tab already render the same component, so they cannot drift. Open question 2 records that the description, not the code, is what needs correcting.

---

## Implementation tasks

### 1 — Home shares the Tickets screen's cache entry

**File: `src/features/home/screens/HomeScreen.tsx`**

Line 47 becomes:

```tsx
  // NO limit argument. `ticketKeys.list` puts `options.limit ?? null` in the
  // key (hooks.ts:39-40), so passing 5 here builds a SECOND cache entry and
  // fires a SECOND request for a list the Tickets tab already holds. Dropping
  // it resolves to ['tickets','list','mine',<uid>,null,''] — the same entry
  // that screen reads. The intake is explicit: read the same cache entry and
  // slice client-side.
  const myTickets = useMyTickets();
```

and the render (line 105) slices:

```tsx
              {myTickets.data.slice(0, MINE_PREVIEW_LIMIT).map((ticket) => (
```

`MINE_PREVIEW_LIMIT` stays at 5 and stays the name of the cap. The empty-state and skeleton branches are untouched — `SkeletonList count={MINE_PREVIEW_LIMIT}` still shows five placeholder rows, which is what the section will fill with.

**Do not do the same to `useUnassignedTickets(UNASSIGNED_PREVIEW_LIMIT)` on line 48.** The "Mine" list is bounded by one agent's own workload; the Unassigned list is the whole department's backlog, and fetching all of it on every Home render to show three rows is a real cost for a cache-sharing benefit the intake does not ask for. The asymmetry is deliberate — put a one-line comment on line 48 saying so, or the next reader will "finish the job".

`.slice()` on `myTickets.data` is safe without a null check: the call site is already inside the `myTickets.data.length === 0` / else branch (lines 101-108), so `data` is defined there.

### 2 — Make "View all" select the filter

**File: `src/features/tickets/screens/TicketsScreen.tsx`**

Give the screen props, mirroring how `TicketDetailScreen` takes `ticketId`:

```tsx
export type TicketsScreenProps = {
  /** Raw route param — validated here, because `TicketFilter` is feature knowledge. */
  requestedFilter?: string;
  /**
   * Changes on every navigation, even when `requestedFilter` repeats. Without
   * it the effect below cannot fire twice for the same filter: an agent who
   * taps "View all" (mine), switches the chip to All, goes Home and taps
   * "View all" again sends an unchanged `requestedFilter` and stays on All.
   */
  requestedFilterNonce?: string;
};

const FILTERS: TicketFilter[] = ['mine', 'unassigned', 'all'];

function isTicketFilter(value: string | undefined): value is TicketFilter {
  return value !== undefined && (FILTERS as string[]).includes(value);
}
```

Inside the component, after the existing state:

```tsx
  // A tab screen stays mounted, so `useState`'s initial value only applies to
  // the very first visit. Everything after that arrives through this effect.
  useEffect(() => {
    if (!isTicketFilter(requestedFilter)) return;
    setFilter(requestedFilter);
    // A stale search term would hide the very rows the agent asked to see.
    setQuery('');
  }, [requestedFilter, requestedFilterNonce]);
```

Clearing the search is a judgment call the acceptance criterion does not make; it is recorded as open question 3.

`useState<TicketFilter>('mine')` on line 37 **stays** — it is the default for opening the tab directly, and the effect is a no-op when no param is present.

**File: `src/app/(tabs)/tickets.tsx`**

```tsx
import { useLocalSearchParams } from 'expo-router';

import { TicketsScreen } from '@/features/tickets';

export default function Tickets() {
  const { filter, nonce } = useLocalSearchParams<{ filter?: string; nonce?: string }>();
  return <TicketsScreen requestedFilter={filter} requestedFilterNonce={nonce} />;
}
```

Reading params and passing them down is exactly what `src/app/tickets/[id].tsx` does; hard rule 1 is about fetching and layout, not about params. **No validation here** — the route file must not know what a `TicketFilter` is.

### 3 — Wire both "View all" links

**File: `src/features/home/screens/HomeScreen.tsx`**

Add above the component:

```tsx
/**
 * `nonce` forces the Tickets screen's sync effect to re-run even when the
 * agent asks for the same filter twice in a row. See `TicketsScreenProps`.
 */
function openTicketsFiltered(filter: TicketFilter) {
  router.push({
    pathname: '/(tabs)/tickets',
    params: { filter, nonce: String(Date.now()) },
  });
}
```

Line 89 becomes `onActionPress={() => openTicketsFiltered('mine')}` and line 117 `onActionPress={() => openTicketsFiltered('unassigned')}`.

`TicketFilter` is a **type-only** import from `@/features/tickets`; `HomeScreen` already imports values from that barrel (lines 11-21), so nothing new is created either way.

The Unassigned link is beyond US-021's letter — that story is about My tickets. It is in scope because it is the same line of code with the same defect, and because two adjacent links that look identical and behave differently is worse than either behaviour alone.

### 4 — Update the instruction files

**File: `CLAUDE.md`** — in the routing section, one sentence: the Tickets tab accepts `filter` and `nonce` search params, Home's two "View all" links are their only callers, and the nonce exists because a tab screen's state outlives a navigation. This is the first parameterised **tab** route in the app and the pattern the next one will copy. **File: `AGENTS.md`** — no change; its routing bullet already covers the object-form convention this uses.

---

## Edge Cases & Failure Modes

- **The same filter requested twice in a row.** The whole reason for `nonce`. Reproduce: Home → View all (Mine) → tap the **All** chip → Home → View all (Mine). Without the nonce the second tap leaves the screen on All, because `requestedFilter` never changed and the effect never re-ran. Matrix row 6.
- **An unknown or hand-typed `filter` param.** `/tickets?filter=banana` — `isTicketFilter` returns false, the effect returns early, and the screen keeps whatever filter it had. No crash, no empty list, no thrown route error.
- **No param at all.** Opening the Tickets tab from the tab bar sends nothing; the effect no-ops and `useState('mine')` holds. Unchanged behaviour.
- **A stale search term.** Task 2 clears it. Without that, "View all" on My tickets can land on an empty list because a search from ten minutes ago is still applied — which looks exactly like "you have no tickets". Open question 3.
- **`nonce` appears in the URL on web.** `/tickets?filter=mine&nonce=1724...`. Cosmetic, and the price of the effect firing reliably. It is not read by anything except the effect's dependency array.
- **The priority ordering is a property of the migration, not the query.** `.order('priority', { ascending: false })` sorts by enum *declaration* order. It is correct today because `ticket_priority` is declared `low, medium, high, urgent`. If a later migration inserts a value or reorders them, Home's "most urgent first" silently becomes wrong with no code change and no failing type. Verification 1 is what proves it now; open question 4 is what would keep it proven.
- **Home and the Tickets tab now share one cache entry.** Intended. Two consequences worth knowing: pull-to-refresh on either screen refreshes both, and a stale-time expiry now refetches one list instead of two. Neither is a regression, but a reviewer expecting two requests will think something is missing.
- **The Tickets screen's search is part of its cache key.** Home's entry matches it only while the search is empty (`options.search ?? ''`). The moment an agent types in the Tickets tab, that screen moves to a different entry and Home's stays warm — which is correct, and is why task 1's claim is "shares the entry", not "always shares the entry".
- **Fewer than five assigned tickets.** `.slice(0, 5)` returns what exists. Zero renders the empty state, unchanged from story 03.
- **An agent with a very large Mine list.** Task 1 drops the server-side `limit`, so Home now receives the full list and renders five. `fetchMyTickets` has no cap of its own (unlike `fetchAllTickets`'s `ALL_LIST_LIMIT = 50`). Bounded by one agent's own open workload, which is the same set the Tickets tab already fetches — so this adds no request the app was not already making. Open question 5 if that assumption ever stops holding.

---

## Test Plan

**There is no test runner in this repo** (AGENTS.md). The list below is what to write when one is installed; the manual matrix underneath is the gate today.

### Manual test matrix

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Agent with 8 assigned tickets | Open Home | Exactly **five** rows under My tickets (BRD `:762`) |
| 2 | An `urgent` from 3 days ago + a `low` from today | Read the order | The **urgent** is above the low (BRD `:762`) |
| 3 | Mixed priorities and dates | Read the order | Priority groups first, newest first inside each group |
| 4 | Any | Tap a preview row | That ticket opens (BRD `:763`) |
| 5 | Fresh app start | Home → **View all** under My tickets | Tickets tab, **Mine** chip selected (BRD `:764`) |
| 6 | As above | Tap **All**, go Home, tap **View all** under My tickets again | **Mine** is selected again — the nonce check |
| 7 | As above | Tap **All**, go Home, tap **View all** under **Unassigned** | **Unassigned** is selected |
| 8 | Tickets tab with a search term typed | Go Home, tap **View all** | The tab opens on Mine with the **search cleared** |
| 9 | Any | Open the Tickets tab from the **tab bar** | Whatever filter it last had — no reset |
| 10 | Cold start | Open the Tickets tab from the tab bar first | **Mine**, as before |
| 11 | Any | Deep-link `/tickets?filter=all&nonce=1` | The All chip is selected |
| 12 | Any | Deep-link `/tickets?filter=banana&nonce=1` | No crash; the filter is unchanged |
| 13 | Any | Deep-link `/tickets` with no params | No crash; the filter is unchanged |
| 14 | Network inspector open | Cold start, open Home, then the Tickets tab | **One** `tickets?…assigned_to=eq…` request, not two — task 1 |
| 15 | As above | Pull to refresh on Home, then open the Tickets tab | The tab's list is already fresh; no second fetch |
| 16 | As above | Pull to refresh on the Tickets tab, then go Home | Home's preview reflects it |
| 17 | Agent with 0 assigned tickets | Open Home | The My-tickets empty state, unchanged |
| 18 | Agent with 3 assigned tickets | Open Home | Three rows, no padding, no crash from the slice |
| 19 | Any | Read a preview row against the same ticket on the Tickets tab | Identical — same component |
| 20 | An `urgent` in the preview | Read it | Coloured rail **and** the alert glyph (BRD `:610`) |
| 21 | Unassigned tickets present | Read the Unassigned preview | Still three rows, still with Claim buttons |
| 22 | Any | Claim from the Unassigned preview | Still works; both previews refresh |
| 23 | Airplane mode | Open Home | The section's error state with retry, unchanged |
| 24 | العربية, restarted | Open Home, tap **View all** | Layout mirrors; the filter still applies |
| 25 | Toggle system dark mode | Open Home | Unchanged |
| 26 | Any | Home FAB, then the Tickets tab FAB | Both still open the create-ticket modal (story 13 regression) |

### To write when a runner exists

1. **Unit — `src/features/tickets/hooks.test.ts`** · `ticketKeys.list('mine', 'u1', {})` **deep-equals** `ticketKeys.list('mine', 'u1', { search: '' })`, and both differ from `ticketKeys.list('mine', 'u1', { limit: 5 })`. This is the assertion task 1 rests on.
2. **Unit — `src/features/tickets/screens/TicketsScreen.test.tsx`** · `isTicketFilter` accepts `'mine' | 'unassigned' | 'all'` and rejects `undefined`, `''`, `'banana'` and `'Mine'`.
3. **Unit — `src/features/tickets/screens/TicketsScreen.test.tsx`** · re-rendering with the same `requestedFilter` but a **new** `requestedFilterNonce` re-applies the filter; with both unchanged it does not.
4. **Unit — `src/features/tickets/screens/TicketsScreen.test.tsx`** · applying a requested filter clears the search query.
5. **Unit — `src/features/home/screens/HomeScreen.test.tsx`** · a seven-item Mine list renders exactly five rows, in the order received.
6. **Unit — `src/features/home/screens/HomeScreen.test.tsx`** · `openTicketsFiltered` pushes `pathname: '/(tabs)/tickets'` with the given filter and a nonce that differs between two consecutive calls.
7. **Integration — `src/features/home/screens/HomeScreen.test.tsx`** · mounting Home and then the Tickets screen issues **one** fetch for the Mine list, not two.
8. **Unit — `src/features/tickets/api.test.ts`** · `fetchMyTickets` with no `limit` emits no `.limit()` call — the guard against someone reinstating a default cap.

---

## Verification Steps

1. **Prove the priority ordering before touching anything.** This is the acceptance criterion most likely to be passing by luck:
   ```bash
   curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/tickets?select=reference,priority,created_at&assigned_to=eq.$USER_ID&status=in.(new,open,pending)&order=priority.desc,created_at.desc"
   ```
   The first rows must be `urgent`, then `high`, then `medium`, then `low`. **If they come back low-first, the enum is declared in the opposite order** and `ascending: false` is wrong everywhere it appears — Home, the Tickets tab and the search merge's `PRIORITY_RANK` — which is a much larger fix than this story. Do this first.
2. **Prove the cache entries collide.** After task 1, with the React Query devtools or a `queryClient.getQueryCache().getAll()` log, confirm Home and the Tickets tab list **one** entry keyed `['tickets','list','mine',<uid>,null,'']`, not two. Matrix row 14 is the network-level version of the same check; do both, because a shared key with two observers still fires one request and is easy to misread from the network tab alone.
3. **Typecheck:** `npm run typecheck` — zero errors. `typedRoutes` is on, so the `params` object in `openTicketsFiltered` is checked against the route's known params; an extra or misspelled key fails here.
4. **Lint:** `npm run lint` — zero errors.
5. **Frontend runs:** `npm start`, press `a` and `i`. Walk the matrix — **rows 6, 7 and 8 are the story**; everything above row 5 is confirming story 03 did not regress.
6. **Regression — the Tickets tab standalone.** Open it from the tab bar, switch chips, search, pull to refresh, tap a row. Task 2 gave that screen its first props and its first effect; matrix rows 9-10.
7. **Regression — Home's Unassigned section.** Claim a ticket from it. Task 1 deliberately left that query alone, and task 3 changed its "View all"; matrix rows 21-22.
8. **Regression — both FABs.** Story 13 wired them; task 3 edits the same file. Matrix row 26.
9. **RTL:** switch to العربية and **fully restart**. Matrix row 24.
10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:762-764`.

- [ ] Given assigned tickets, when Home loads, then **up to five** display ordered by **priority then age**
- [ ] Given a preview row, when tapped, then **that ticket opens**
- [ ] Given a **View all** action, when tapped, then the Tickets tab opens **filtered to Mine**

Plus, from the intake and the design:

- [ ] Home reads the **same cache entry** as the Tickets screen's Mine list — one request, not two
- [ ] The five-row cap is applied **client-side**, not as a server `limit`
- [ ] "View all" selects the filter **even when the tab already holds a different one**
- [ ] The Unassigned "View all" selects **Unassigned**, not just "the Tickets tab"
- [ ] An unknown or absent `filter` param leaves the screen unchanged and does not crash
- [ ] The Unassigned preview keeps its server-side `limit: 3`, with a comment saying why the two differ
- [ ] Rows are still `TicketRow` — no Home-local row component was introduced
- [ ] The priority ordering has been **verified against the live enum**, not assumed
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md documents the Tickets tab's `filter`/`nonce` params

---

## Open questions — raise with design/product, do not resolve silently

1. **The intake's Figma link is the wrong screen.** `7:4009` is `Tickets - New Ticket` — story 13's create modal. Home is `7:8` (`Home - Dashboard`), resolved from story 03's header and confirmed via `get_metadata`. Nothing was designed for this story, which is consistent with the finding that most of it already exists. Worth correcting in the tracker so the next planner does not open the create-ticket screen looking for a dashboard.
2. **The intake's row description does not match the built row.** It specifies "a right-aligned status dot on line two"; `TicketRow` renders a full `StatusBadge` pill in a trailing column that also holds the relative time, and adds an alert glyph on `urgent`/`high` that the description omits. The intake's own closing instruction — anchor to the implementation, not the mockup — resolves this in the code's favour, and Home and the Tickets tab already render the same component so they *cannot* drift. But the description came from somewhere, and if a status **dot** is genuinely wanted, that is a change to `TicketRow` affecting three screens, not a Home tweak.
3. **"View all" clears the search; nobody asked for that.** Task 2 clears the Tickets tab's query when a filter arrives from Home, on the reasoning that a stale search term makes "View all" land on an empty list that looks like "you have no tickets". The alternative — preserve the search and change only the chip — is defensible if agents think of the search as sticky. One line either way; it should be a decision rather than a default.
4. **The priority ordering has no guard.** `.order('priority', { ascending: false })` is correct only because `ticket_priority` is declared `low, medium, high, urgent`. A migration that adds `critical` in the wrong position, or reorders the values, silently breaks "most urgent first" on Home, the Tickets tab and the search merge — with no type error and no failing query. Verification 1 proves it once. Keeping it proven needs either a comment on the enum in the migration, or ordering by an explicit rank expression instead of the enum. `PRIORITY_RANK` already exists in `features/tickets/api.ts:68-73` for the client-side merge and encodes the same knowledge in a second place.
5. **Home now fetches the agent's full Mine list to show five rows.** That is what the intake asked for and it costs nothing extra today, because the Tickets tab already fetches exactly that list and the two now share it. It stops being free if `fetchMyTickets` ever gains a cap, or if an agent's open workload grows past what is reasonable to hold in memory — at which point Home would want its own limited query back, and the cache sharing the intake requires becomes impossible. Flagged so the trade is visible rather than rediscovered.
6. **The Unassigned preview is treated differently from Mine, on purpose.** Mine drops its server limit to share a cache entry; Unassigned keeps `limit: 3`, because that list is the whole department's backlog rather than one agent's workload. The asymmetry is deliberate and commented, but it means the two sections on the same screen now fetch by different rules. Confirm that is acceptable, or accept the cost and make them uniform.

**STOP HERE. Report to the user.**
