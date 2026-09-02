# Story 04 — Ticket list with filters (Story: SCRUM-27)

> Intake: `.squad/stories/tickets/SCRUM-27/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:348` (`Tickets - List`); the screen body is `7:353`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). This story is the **first consumer** of three components that story built and nothing has used since: `SearchField`, `FilterChip`, and `SectionHeader`'s `variant="rule"`. It also consumes `EmptyState`, `ErrorState`, `SkeletonList`, `FAB` and the `Text`/`Icon` primitives.
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md). `useAuth().session.user.id` keys the "Mine" queries.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md). It created `src/features/tickets/` in full — `api.ts`, `hooks.ts`, `types.ts`, `TicketRow`, `StatusBadge` — and the `src/app/(tabs)/` shell whose `tickets.tsx` route this story fills in. **This story edits files story 03 wrote; read them before touching them.**
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/core/lib/supabase.ts:11-16` throws at import time otherwise.
- **Seeded data** spanning **at least three calendar days** and all three filters: tickets assigned to the signed-in agent, unassigned tickets in their department/branch, and tickets assigned to somebody else. Without a multi-day spread the Today / Yesterday / Earlier grouping cannot be exercised at all.

---

## Story Goal

The Tickets tab stops being a placeholder and becomes the agent's working queue. Concretely:

1. **Three filters** — **Mine**, **Unassigned**, **All** — as `FilterChip`s, each carrying a live count. Mine is selected on open.
2. **A search field** over subject, reference and customer name, debounced, that narrows whichever filter is active.
3. **A date-grouped list** — rows sit under **Today**, **Yesterday** and **Earlier** headers derived from `created_at` in the device's timezone.
4. **Rows that carry every field the BRD names** — reference, subject, customer, status, priority and time — reusing `TicketRow` from story 03 unchanged in shape.
5. **A non-colour cue on both indicators.** Status already has one (the badge is a text label). Priority does **not** — today it is a coloured bar and nothing else. Task 6 closes that gap.
6. **Pull-to-refresh**, plus explicit loading, empty, search-empty and error states.

**Not in scope** — each has its own story: ticket detail (US-014; row taps stay a documented no-op), ticket creation and the FAB's real destination (US-012 / US-022), assignment and claiming from this screen (US-017 — the Unassigned filter here is **read-only**; the inline Claim button stays a Home-only affordance), status transitions (US-018), pagination and infinite scroll (the "All" list is capped at 50 per API §4.3), and full-text search (the intake defers it explicitly — `ilike` only).

---

## Context — Read These Files First

1. `src/features/tickets/api.ts` — the whole file (124 lines). `LIST_SELECT` (line 6) is the §4.1/§4.2 projection and stays as-is; `TicketListRow` + `toListItem` (lines 8-28) are the row mappers every new fetcher reuses. Note `fetchMyTickets` filters `status in (new, open, pending)` (line 42) while `fetchUnassignedTickets` filters `(new, open)` (line 58) — the chip counts in task 2 must match those two predicates exactly, not approximate them.
2. `src/features/tickets/hooks.ts` — the whole file (91 lines). `ticketKeys` (lines 20-28) and the comment above it explaining why everything hangs off `['tickets']`. `ticketKeys.mine` (line 22) and `ticketKeys.unassigned` (line 23) are **replaced** by a single `list` key in task 3; `ticketKeys.all` and the three count keys are not.
3. `src/features/tickets/screens/TicketsScreen.tsx` — all 17 lines. Its own comment says it is "replaced wholesale by the Tickets list story (US-016)". This is that story. **The BRD id in that comment is wrong** — the tickets list is US-011 (`docs/phase1_brd_1.md:599`); US-016 is "Post an internal note" (`:667`). Fix the reference while replacing the file.
4. `src/features/home/screens/HomeScreen.tsx:44-49` — the five hook call sites this story must not break. `useMyTickets(MINE_PREVIEW_LIMIT)` and `useUnassignedTickets(UNASSIGNED_PREVIEW_LIMIT)` keep their signatures in task 3; only their internals change.
5. `src/core/components/SectionHeader.tsx` — the whole file (59 lines). **Line 32 renders `variant="rule"` as a `borderBottomWidth` under the entire row.** Figma's rule is an inline hairline that starts *after* the label and runs to the trailing inset — node `7:442` holds the label at x=16 (38 wide) and the rule `7:446` at x=66, i.e. `spacing.md` after the label, vertically centred. Task 1 fixes this. `grep -rn 'variant="rule"' src/` returns **zero hits**, so the fix has no existing consumer to regress.
6. `src/core/components/FilterChip.tsx` — the whole file (62 lines). Props are `label`, `selected`, `onPress`, `count`, `disabled`; `count` already goes through `formatCount` (line 114 of the concatenated read — the `count !== undefined` branch), so Arabic-Indic digits are handled. Read the header comment: this component deliberately does **not** match Figma pixel-for-pixel (story 01 §15 flag 7). Do not fork it.
7. `src/core/components/SearchField.tsx` — the whole file (61 lines). `HEIGHT = 44` (line 19) matches Figma instance `74:655` exactly. It takes controlled `value`/`onChangeText` and renders the clear button **only when `onClear` is supplied** (line 51) — pass it.
8. `src/core/hooks/useDebounce.ts` — all 13 lines. `useDebounce(value, 300)`. Built in story 01, unused until now.
9. `src/core/utils/format.ts` — `formatRelativeShort` (the compact `4m` / `1h` / `3d` form `TicketRow` already renders) and `formatCount`. The group headers need neither; they are three fixed i18n strings.
10. `docs/phase1_api_reference.md` §4.1-4.3 (lines 205-223) and §4.4 (lines 225-232) — the three lists and the chip count. §4.3 caps "All" at `limit=50`. The PostgREST syntax table at lines 468-491 is the reference for the `or=(...)` and `ilike` forms task 2 builds.
11. `docs/phase1_brd_1.md:599-611` — US-011 and its five acceptance criteria. `## Done Criteria` mirrors them verbatim. Line 610 ("each carries a non-color cue") is the one the current code fails.
12. `src/features/home/screens/HomeScreen.tsx` — the whole file (167 lines), as the screen-authoring reference: `SafeAreaView` + `bgCanvas` with `edges={['top']}` (line 65), the `isPending` → `isError` → `length === 0` → data ladder (lines 92-110), `claimErrorMessageKey` (lines 33-37) for turning an `AppError` into an i18n key, and the `FAB` placement (lines 159-164).
13. `eslint.config.js` lines 53-81 — the four `no-restricted-syntax` bans. A `SectionList` with an absolutely positioned rule using `left: 0` fails rule 4; use `flex: 1` on the rule instead.

---

## Design spec (resolved from Figma node `7:348`)

Structure, from `get_metadata` on `7:348`:

```
TicketsScreen 7:353
├── 7:372  header block (static — does not scroll)
│   ├── 7:373  "Tickets" title
│   ├── 7:401  Container:margin → 74:655 SearchField (44h)
│   └── 7:402  Container:margin → 7:382 chip row → 74:667 / 74:671 / 74:675 FilterChip ×3
├── 7:440  scrolling list
│   ├── 7:441  group → 7:442 header ("Today" + rule) + 7:447 TicketRow ×8
│   ├── 7:672  group → 7:673 header ("Yesterday" + rule) + 7:678 TicketRow ×3
│   └── 7:763  80px bottom spacer
├── 60:203 BottomNav   (already built — src/app/(tabs)/_layout.tsx)
└── 60:395 FAB
```

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Horizontal inset, everywhere | 16 | `spacing.lg` |
| Title "Tickets" | 28h text box, semibold | `<Text variant="title" weight="semibold">` |
| Title → search gap | 10 → snap to 8 | `spacing.sm` |
| SearchField | 44h | `<SearchField />` as built |
| Search → chip row gap | 10 → snap to 8 | `spacing.sm` |
| Chip row | HORIZONTAL, ~30h, gap 8 | `spacing.sm`, horizontal `ScrollView` |
| Chip row → first group gap | ~10 → snap to 8 | `spacing.sm` |
| Group header | 31h; label at 16, rule from 66 to the trailing inset | `<SectionHeader variant="rule" />` **after task 1** |
| Group header label | 11.5 / 17.25 / 600 / UPPER | `caption` + `weight="semibold"` + `tracking.wide` — already inside `SectionHeader` |
| Group header rule | 1px hairline | `colors.borderSubtle`, as the component ships |
| Label → rule gap | 12 | `spacing.md` |
| TicketRow | ~62.7h, no inter-row gap | `<TicketRow />` as built |
| Bottom spacer | 80 | `spacing.xxxl + spacing.xxl` |
| FAB | 56 × 56 | `<FAB />` as built |

`get_variable_defs` on `7:372` and `7:440` returns the same legacy off-scale values story 01 §15 flagged (`font size/11_5`, `line height/17_25`, `font size/12_5`, `letter spacing/-0_3`). **Snap to the scale tokens tabled above; do not introduce off-scale literals** — `eslint.config.js` will not catch a raw `fontSize: 11.5`, but review will.

**Two deliberate deviations from the render, both inherited rather than introduced:**

- Figma renders the chip counts parenthesised — "Mine (12)". `FilterChip` renders the count as a sibling `Text` with `gap: spacing.xs`. Keep the component as built; see **Open questions** flag 3.
- Figma's chips sit on the legacy `www.figma.com` token collection, so their padding and radius will not match pixel-for-pixel. That is story 01 §15 flag 7, still open.

---

## Implementation tasks

### 1 — Fix `SectionHeader`'s `rule` variant

**File: `src/core/components/SectionHeader.tsx`**

The `rule` variant currently draws a bottom border under the whole header (line 32). Figma draws an inline hairline that fills the space after the label. Replace the border with a sibling `View`:

```tsx
// in the style array on the root View — drop borderBottomWidth / borderBottomColor
gap: variant === 'rule' ? theme.spacing.md : 0,
```

```tsx
{props.variant === 'rule' ? (
  <View style={[styles.rule, { backgroundColor: theme.colors.borderSubtle }]} />
) : null}
```

```ts
// styles
rule: { flex: 1, height: StyleSheet.hairlineWidth },
```

`justifyContent: 'space-between'` on `styles.root` (line 57) stays — with `flex: 1` on the rule it is inert for this variant and still correct for `link`. **Do not** reach for `position: 'absolute'` with `left: 0`; `eslint.config.js:72-75` bans it and it breaks in RTL.

This is a core change with zero existing consumers (`grep -rn 'variant="rule"' src/` → no hits), so it cannot regress Home.

### 2 — Add the "All" list, the search predicate, and the two new counts

**File: `src/features/tickets/api.ts`**

**2a. A shared options type and a search sanitiser.** Add below `toListItem` (line 28):

```ts
export type TicketListOptions = {
  limit?: number;
  /** Free-text term; matched with `ilike` against subject, reference and customer name. */
  search?: string;
};

/**
 * PostgREST parses `or=(...)` as a logic tree, so a term containing `,` `(` `)`
 * or `.` corrupts the filter string rather than failing loudly. `%` and `_` are
 * `ilike` wildcards and `*` is PostgREST's spelling of `%`. Strip all of them
 * instead of escaping — an agent searching for a literal comma is not a case
 * worth the parser risk.
 */
function sanitizeSearch(term: string): string {
  return term.replace(/[,().*%_\\]/g, ' ').trim();
}
```

**2b. Apply search to all three lists.** Replace the `limit` parameter on `fetchMyTickets` (line 37) and `fetchUnassignedTickets` (line 53) with `options: TicketListOptions = {}`, and add `fetchAllTickets`. Each applies the same two clauses, after its own filters and before `.order(...)`:

```ts
const term = options.search ? sanitizeSearch(options.search) : '';
if (term) {
  query = query.or(
    `subject.ilike.*${term}*,reference.ilike.*${term}*,customers.full_name.ilike.*${term}*`,
  );
}
if (options.limit !== undefined) query = query.limit(options.limit);
```

Customer-name search reaches through the embedded resource, which PostgREST only allows on an **inner** join. When `options.search` is present, select with `customers!inner(full_name)` instead of `LIST_SELECT`; the FK is non-nullable (`src/core/types/database.ts:442` — `customer_id: string`), so the inner join changes no row counts:

```ts
const LIST_SELECT_INNER =
  'id, reference, subject, status, priority, created_at, customers!inner(full_name)';
```

**Verify this before building the screen on it.** Run, with a real anon key and a term you know matches a customer but no subject:

```bash
curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
  "$URL/rest/v1/tickets?select=id,subject,customers!inner(full_name)&or=(subject.ilike.*noor*,customers.full_name.ilike.*noor*)"
```

A `400` carrying `"failed to parse logic tree"` means this PostgREST build rejects embedded columns inside a top-level `or`. **Fallback, fully specified:** keep the `or` to `subject` + `reference` only, issue a second query filtered `.ilike('customers.full_name', ...)` with the inner join, then merge by `id` (a `Map` keyed on `id`) and re-apply the priority-then-recency sort client-side. Take the fallback only if the curl above fails; record which branch shipped in a comment on `sanitizeSearch`.

**2c. `fetchAllTickets`** — §4.3: no status and no assignment predicate, capped when the caller gives no limit.

```ts
const ALL_LIST_LIMIT = 50; // API §4.3

export async function fetchAllTickets(options: TicketListOptions = {}): Promise<TicketListItem[]>
```

Order matches its siblings: `.order('priority', { ascending: false }).order('created_at', { ascending: false })`.

**2d. Two new counts.** Add beside the existing three (lines 69-100):

```ts
/**
 * The "Mine" chip count — `new, open, pending`, matching `fetchMyTickets`'s own
 * predicate (API §4.4). Deliberately NOT `fetchMyOpenCount`, which is Home's
 * "My open" stat and excludes `new` (API §4.5). The two numbers legitimately
 * differ; do not collapse them.
 */
export async function fetchMyTicketsCount(userId: string): Promise<number>

/** The "All" chip count — every ticket RLS lets this agent see. */
export async function fetchAllTicketsCount(): Promise<number>
```

Both use `.select('*', { count: 'exact', head: true })` and `return count ?? 0`, exactly as lines 69-89 do. `fetchUnassignedCount` (line 80) already matches the Unassigned chip's predicate — reuse it, add nothing.

### 3 — Reshape the query hooks around a filter

**File: `src/features/tickets/hooks.ts`**

**3a. Replace `ticketKeys.mine`/`.unassigned` with one `list` key.** Neither is referenced outside this file (`grep -rn 'ticketKeys\.' src/` → only `ticketKeys.all` at `HomeScreen.tsx:60`), so this is safe:

```ts
export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filter: TicketFilter, userId: string, options: TicketListOptions = {}) =>
    ['tickets', 'list', filter, userId, options.limit ?? null, options.search ?? ''] as const,
  myOpenCount: (userId: string) => ['tickets', 'count', 'myOpen', userId] as const,
  myTicketsCount: (userId: string) => ['tickets', 'count', 'mine', userId] as const,
  unassignedCount: () => ['tickets', 'count', 'unassigned'] as const,
  allCount: () => ['tickets', 'count', 'all'] as const,
  resolvedTodayCount: (userId: string, day: string) =>
    ['tickets', 'count', 'resolvedToday', userId, day] as const,
};
```

Everything still hangs off `['tickets']`, so `useClaimTicket`'s existing invalidation (line 88) keeps refreshing Home *and* this screen with no change.

**3b. One list hook, two wrappers.** The screen cannot call a different hook per filter — hooks are unconditional — so the filter becomes a parameter:

```ts
export function useTicketList(filter: TicketFilter, options: TicketListOptions = {}) {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ticketKeys.list(filter, userId ?? '', options),
    queryFn: () => {
      if (filter === 'mine') return fetchMyTickets(userId as string, options);
      if (filter === 'unassigned') return fetchUnassignedTickets(options);
      return fetchAllTickets(options);
    },
    // 'unassigned' and 'all' don't need a user id, but the screen can switch to
    // 'mine' at any time — gate uniformly so the key namespace stays consistent.
    enabled: Boolean(userId),
  });
}

export function useMyTickets(limit?: number) { return useTicketList('mine', { limit }); }
export function useUnassignedTickets(limit?: number) { return useTicketList('unassigned', { limit }); }
```

`useMyTickets(5)` and `useUnassignedTickets(3)` keep their exact signatures, so **`HomeScreen.tsx` needs no edit.** This is the intake's "reuse the existing ticket query hooks rather than writing parallel ones", honoured literally.

`TicketFilter` is declared in `types.ts` (task 5), not here.

**3c. Two count hooks** — `useMyTicketsCount()` and `useAllTicketsCount()`, mirroring `useMyOpenCount` (lines 52-60) and `useUnassignedCount` (lines 62-67). `useMyOpenCount` stays untouched; Home is its only caller.

### 4 — Group rows by arrival day

**Create file: `src/features/tickets/grouping.ts`**

Domain logic, so it does not live in the screen. Pure and synchronous — the one piece of this story a future test runner can cover without mocking Supabase.

```ts
import type { TicketListItem } from './types';

export type TicketGroupKey = 'today' | 'yesterday' | 'earlier';

export type TicketGroup = {
  key: TicketGroupKey;
  /** i18n key, e.g. `tickets.groups.today`. */
  titleKey: string;
  data: TicketListItem[];
};

/**
 * Buckets by the DEVICE's calendar day, not UTC — an agent at +03:00 working at
 * 01:00 must see the ticket they filed ten minutes ago under "Today". Compare
 * midnight-normalised dates rather than subtracting milliseconds, so a DST shift
 * cannot move a ticket a day.
 */
export function groupTicketsByDay(tickets: TicketListItem[], now = new Date()): TicketGroup[]
```

Implementation notes for the executor:

- Normalise with `new Date(y, m, d)` built from the local getters, never `toISOString().slice(0, 10)` — that silently converts to UTC. (`hooks.ts:32` uses that form for a cache key, where the drift is harmless; here it is not.)
- Preserve the incoming order inside each bucket; the fetchers already sorted by priority then recency.
- **Return only non-empty groups.** A section with an empty `data` array still renders its header in `SectionList`, so an agent with nothing from today would see a bare "TODAY" rule over a gap.
- A `created_at` that fails `Date.parse` goes to `earlier` rather than throwing.

### 5 — Extend the feature types

**File: `src/features/tickets/types.ts`**

```ts
/** The three chips on the Tickets list (BRD US-011, API §4.1-4.3). */
export type TicketFilter = 'mine' | 'unassigned' | 'all';
```

`TicketListOptions` is declared in `api.ts` beside the fetchers that consume it, and re-exported from the barrel.

### 6 — Give priority a non-colour cue

**File: `src/features/tickets/components/TicketRow.tsx`**

`docs/phase1_brd_1.md:610` requires a non-colour cue on **both** indicators. `StatusBadge` already satisfies it — the badge renders `t('ticket.status.<status>')` as text. Priority does not: `priorityColor` (lines 19-30) drives a `borderStartWidth: 3` bar (lines 51-52) and nothing else. A red bar and an orange bar are the same bar to a protan viewer.

Two changes, both additive:

**6a. Name the priority in the accessibility label.** `ticket.rowLabel` (line 37) currently interpolates subject, status and age. Add `priority`:

```tsx
const accessibilityLabel = t('ticket.rowLabel', {
  subject: ticket.subject,
  priority: t(`ticket.priority.${ticket.priority}`),
  status: t(`ticket.status.${ticket.status}`),
  age: formatRelativeShort(ticket.createdAt),
});
```

**6b. A visual marker for the two priorities that carry urgency.** Render a 12px `alert` icon (already in `IconName` — `Icon.tsx:48`) immediately before the subject when priority is `urgent` or `high`, tinted with the same `priorityColor(...)` the bar uses:

```tsx
<View style={[styles.subjectLine, { gap: theme.spacing.xs }]}>
  {ticket.priority === 'urgent' || ticket.priority === 'high' ? (
    <Icon name="alert" size={12} color={priorityColor(ticket.priority, theme)} />
  ) : null}
  <Text variant="body" weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>
    {ticket.subject}
  </Text>
</View>
```

`styles.subjectLine: { flexDirection: 'row', alignItems: 'center' }`. `flexShrink: 1` on the `Text` keeps the ellipsis working (`minWidth: 0` on `styles.body`, line 59, still applies).

**This is a visual addition Figma does not show, and it changes Home's rows as well as this screen's.** It is here because the BRD requires it and nothing else in the row supplies it — see **Open questions** flag 1. Ship it behind a comment naming `docs/phase1_brd_1.md:610`, so a design decision to remove it has the rationale to argue with.

### 7 — Build the screen

**File: `src/features/tickets/screens/TicketsScreen.tsx`** — replace all 17 lines.

```tsx
const [filter, setFilter] = useState<TicketFilter>('mine');
const [query, setQuery] = useState('');
const search = useDebounce(query, 300);
const list = useTicketList(filter, { search });
```

Composition, top to bottom:

1. `SafeAreaView` with `edges={['top']}` and `backgroundColor: theme.colors.bgCanvas` — copy `HomeScreen.tsx:65`.
2. **A static header block** (outside the list, matching Figma `7:372`): the `Tickets` title, `SearchField`, and the chip row. Search and filters must **not** scroll away with the results.
   - `SearchField` gets `value={query}`, `onChangeText={setQuery}`, `onClear={() => setQuery('')}` and `placeholder={t('tickets.searchPlaceholder')}`.
   - The chip row is a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}` and `contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}` — three chips fit a phone today, but Arabic labels are longer and a fourth filter is plausible.
   - Each `FilterChip` takes `count={<the matching count query>.data}`. Pass `undefined` while a count is pending so the chip renders label-only rather than flashing a `0`.
3. **A `SectionList`** over `useMemo(() => groupTicketsByDay(list.data ?? []), [list.data])`:
   - `renderSectionHeader={({ section }) => <SectionHeader variant="rule" title={t(section.titleKey)} />}`
   - `renderItem={({ item }) => <TicketRow ticket={item} onPress={handleTicketPress} />}` — **no `onClaim`.** Claiming is US-017; `TicketRow` renders the button only when `onClaim` is supplied (`TicketRow.tsx:73`).
   - `keyExtractor={(item) => item.id}`
   - Leave `stickySectionHeadersEnabled` at the platform default rather than forcing it; the static header block above already anchors the screen.
   - `refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={handleRefresh} />}`, where `handleRefresh` invalidates `ticketKeys.all` (the same one-liner as `HomeScreen.tsx:60`), so the chip counts move with the list.
   - `contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + theme.spacing.xxl }}` — Figma's 80px spacer, clearing the FAB and the tab bar.
4. **The state ladder**, in this order:
   - `list.isPending` → `<SkeletonList count={6} />` inside a `paddingHorizontal: spacing.lg` wrapper.
   - `list.isError` → `<ErrorState title={t('states.errorTitle')} body={t(errorMessageKey(list.error))} onRetry={() => list.refetch()} />`. Reuse the `isAppError` → `messageKey` shape from `HomeScreen.tsx:33-37`; since that helper is now needed in a second place, **move it to `src/core/utils/errors.ts`** and import it in both screens (hard rule 2).
   - empty **with** a search term → `<EmptyState icon="search" title={t('tickets.empty.search', { query: search })} />`.
   - empty **without** one → ``<EmptyState icon="inbox" title={t(`tickets.empty.${filter}`)} />``, so "no tickets assigned to you" and "nothing unassigned" read differently.
5. **`FAB`** with the same TODO as `HomeScreen.tsx:159-164` — it belongs to US-022, whose destination is US-012. On this screen the interim `router.push('/(tabs)/tickets')` would be a self-navigation, so give it an empty handler plus the TODO instead.
6. **Row taps** — ``function handleTicketPress(id: string) {}`` with ``// TODO(US-014): push `/tickets/${id}` once the ticket detail route exists.`` `HomeScreen.tsx:29` carries the same stub against the **wrong** id (`US-018` is status transitions); fix that comment too while you are in the file.

**File: `src/app/(tabs)/tickets.tsx`** — no change. It already imports `TicketsScreen` from the barrel and renders it, which is all a route file may do (hard rule 1).

### 8 — Barrel and i18n

**File: `src/features/tickets/index.ts`**

Add to the existing exports, keeping them alphabetised as they are today:

```ts
export type { TicketListOptions } from './api';
export { groupTicketsByDay } from './grouping';
export type { TicketGroup, TicketGroupKey } from './grouping';
export { useAllTicketsCount, useMyTicketsCount, useTicketList } from './hooks';
export type { TicketFilter } from './types';
```

`useMyTickets` and `useUnassignedTickets` stay exported — Home imports them.

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`**

Add a `tickets` namespace beside the existing `ticket` one (singular = row vocabulary, plural = this screen), and two keys to `ticket`:

```json
"tickets": {
  "title": "Tickets",
  "searchPlaceholder": "Search tickets, customers...",
  "filters": { "mine": "Mine", "unassigned": "Unassigned", "all": "All" },
  "groups": { "today": "Today", "yesterday": "Yesterday", "earlier": "Earlier" },
  "empty": {
    "mine": "No tickets assigned to you right now.",
    "unassigned": "Nothing waiting to be claimed.",
    "all": "No tickets in your department yet.",
    "search": "No tickets match \"{{query}}\"."
  }
}
```

```json
"ticket": {
  "priority": { "low": "Low", "medium": "Medium", "high": "High", "urgent": "Urgent" },
  "rowLabel": "{{subject}}, {{priority}}, {{status}}, {{age}}"
}
```

Arabic: `"التذاكر"`; `"ابحث في التذاكر والعملاء..."`; filters `"لي"` / `"غير مُسندة"` / `"الكل"`; groups `"اليوم"` / `"أمس"` / `"أقدم"`; priorities `"منخفضة"` / `"متوسطة"` / `"عالية"` / `"عاجلة"`; and `"{{subject}}، {{priority}}، {{status}}، {{age}}"` — Arabic comma, matching the existing `rowLabel` at `ar.json:113`. Reuse the two Arabic strings already at `home.empty` (`ar.json:92-93`) verbatim for `tickets.empty.mine` and `.unassigned`.

**`SectionHeader` uppercases its title** (`SectionHeader.tsx:58`), so pass "Today", not "TODAY". Arabic has no case, so `textTransform: 'uppercase'` is a no-op there — story 01 §15 already flags the Arabic uppercase+tracking question and this story does not settle it.

### 9 — Update the project docs

**File: `CLAUDE.md`** — the "Project status" section still says `auth` is the only folder under `src/features/` and that `src/app/index.tsx` renders a placeholder. Story 03 already invalidated both statements; this story adds `tickets` as the second real screen. Correct the paragraph in the same change, per that file's own instruction ("when reality and this file diverge, fix this file in the same change").

---

## Edge Cases & Failure Modes

- **A search term containing `,` `(` `)` or `.`** — PostgREST parses `or=(...)` as a logic tree, so an unescaped term produces a `400` or, worse, a silently wrong filter. `sanitizeSearch` (task 2a) strips them. A reference like `TKT-202608-0145` contains no reserved character and searches cleanly; `Noor Al-Khalij, Ltd.` does not.
- **A search term that sanitises to empty** (`"..."`, `"%%%"`) — `term` is `''` after trimming, the `or` clause is skipped, and the unfiltered list returns. Correct: an all-punctuation query is not a filter.
- **Search races the debounce** — the agent types, then switches filter before 300ms elapses. Both `filter` and `search` are in the query key (task 3a), so the in-flight request resolves into its own cache entry and is discarded rather than painting stale rows under the new chip.
- **Customer-name search on a PostgREST build that rejects embedded columns in `or`** — task 2b's curl is the gate; take the documented two-query fallback. Shipping the primary form untested surfaces as a `400` on the first search with no visible cause.
- **The device crosses midnight with the app open** — "Today" would keep its stale meaning. `groupTicketsByDay` takes `now` at call time and the screen recomputes it in a `useMemo` keyed on the list data, so any refetch corrects it. A pull-to-refresh always does.
- **Timezone** — an agent at UTC+03:00 at 01:00 local has a `created_at` whose UTC date is *yesterday*. Grouping compares local-midnight dates (task 4), so the ticket lands under "Today" as the agent experiences it. `toISOString().slice(0, 10)` would put it under "Yesterday".
- **A group with no rows** — `SectionList` renders a header for an empty section. `groupTicketsByDay` filters empty groups out (task 4), so "TODAY" never appears over nothing.
- **`count` comes back `null`** — supabase-js types it `number | null`. Every count function ends `count ?? 0` (`api.ts:77, 88, 99`); a `null` reaching `FilterChip` renders `NaN` through `formatCount`.
- **Counts pending on first paint** — pass `undefined`, not `0`. `FilterChip` omits the count entirely when `count === undefined`, which reads as loading rather than as "no tickets".
- **The "All" list is truncated at 50** (API §4.3) — an agent in a busy department will not see everything, and the "All" chip count will legitimately exceed the number of visible rows. That is the documented contract; do not silently raise the limit.
- **The Mine chip count disagrees with Home's "My open" stat** — by design: §4.4 counts `new, open, pending`; §4.5 counts `open, pending`. `fetchMyTicketsCount` and `fetchMyOpenCount` are separate functions for exactly this reason (task 2d). Merging them breaks one screen or the other.
- **Claiming from Home while this screen is mounted** — `useClaimTicket` invalidates `ticketKeys.all` (`hooks.ts:88`), which is the prefix of every key in task 3a, so the list and all three chips refetch. Verify this rather than assuming it: it is the whole reason for the shared key root.
- **Long Arabic subject with the new priority glyph** — the icon plus `gap` eats 16px of the subject line. `flexShrink: 1` on the `Text` (task 6b) keeps `numberOfLines={1}` ellipsising instead of pushing the status badge off-screen.
- **RTL** — the chip `ScrollView` must start at the trailing edge in Arabic; `gap` and `paddingHorizontal` are direction-agnostic, so no physical prop is needed. The `SectionHeader` rule uses `flex: 1`, which mirrors for free. `TicketRow`'s priority bar is already `borderStartWidth` (`TicketRow.tsx:51`).
- **Arabic digits** — the chip counts go through `formatCount` inside `FilterChip` and the row ages through `formatRelativeShort`. A raw `{count}` anywhere in the new screen renders Latin digits in the Arabic build.
- **Offline** — queries retry twice on non-4xx (`query-client.ts:15-19`), then the `ErrorState` renders with `states.offline` via `toAppError`'s network branch. `OfflineBanner` is already mounted globally in `_layout.tsx`.

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, no `test` script in `package.json`. Stories 02 and 03 both reached this conclusion and deferred. This story does not install one either, but note that task 4 produces the first genuinely unit-testable pure function in `src/features/`: `groupTicketsByDay` needs no Supabase mock, no React, and no renderer. It is the natural first test the day a runner lands.

### Runnable today — manual matrix

`npm start`, then `a`/`i`. Sign in as a seeded agent and open the Tickets tab.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Seeded agent | Open the Tickets tab | Title, search, three chips with counts, date-grouped rows |
| 2 | Any | Read the chips | Mine is selected on open |
| 3 | Any | Tap **Unassigned**, then **All** | List swaps; the selected chip fills; counts do not move |
| 4 | Mine selected | Compare against Home | Every row is assigned to you; the Mine count ≥ Home's "My open" |
| 5 | Tickets across 3+ days | Open the tab | Today / Yesterday / Earlier headers, each with a trailing rule, none empty |
| 6 | Agent with no tickets today | Open the tab | **No** bare "TODAY" header over an empty gap |
| 7 | Any | Type a subject fragment | List narrows after ~300ms; one request, not one per keystroke |
| 8 | Any | Type a customer name | Matching rows appear (the task 2b gate) |
| 9 | Any | Type a full reference `TKT-…` | Exactly that ticket |
| 10 | Any | Type `((( ,,, ...` | Full list, no error |
| 11 | Any | Type nonsense | Search-specific empty state quoting the term |
| 12 | Search active | Tap the clear button | Full list returns |
| 13 | Search active | Switch filter | Search persists and applies to the new filter |
| 14 | Any | Pull down | Rows and all three counts refresh |
| 15 | Airplane mode | Open the tab | `ErrorState` with retry; `OfflineBanner` visible |
| 16 | Airplane mode → online | Tap **Try again** | List loads |
| 17 | Urgent + high tickets | Read the rows | Alert glyph before the subject; medium/low have none |
| 18 | VoiceOver / TalkBack | Focus a row | Subject, priority, status and age all announced |
| 19 | Two devices | Claim from Home on device A | Device B's Unassigned list and chip counts move on next focus/refresh |
| 20 | Switch to العربية | Open the tab, restart | Layout mirrors; chips scroll from the trailing edge; priority bar on the right |
| 21 | العربية | Read chips and ages | Counts and ages are Arabic-Indic |
| 22 | العربية, +03:00, after midnight | Open the tab | A ticket filed at 00:30 local sits under "اليوم" |
| 23 | Toggle system dark mode | Open the tab | Chips, rules, badges and glyphs all legible |
| 24 | Long Arabic subject, urgent | Read the row | Subject ellipsises; glyph and status badge both visible |
| 25 | Any | Tap a row | Nothing happens, no crash (US-014 not built) |
| 26 | Any | Open Home | Both previews still render — task 3 must not have regressed them |

Row 19 needs two sessions; a direct `PATCH` from Postman between loads works as well.

### To write when a runner exists

1. **Unit — `src/features/tickets/grouping.test.ts`** · a ticket at 23:59 local today → `today`; the same instant expressed in UTC → still `today`. This is the timezone bug the function exists to prevent.
2. **Unit — `src/features/tickets/grouping.test.ts`** · midnight boundaries: 00:00 today → `today`; 23:59:59 yesterday → `yesterday`; 00:00 two days ago → `earlier`.
3. **Unit — `src/features/tickets/grouping.test.ts`** · empty input → `[]`; a day with no tickets produces no group; an unparseable `created_at` → `earlier`, not a throw.
4. **Unit — `src/features/tickets/grouping.test.ts`** · input order is preserved within each bucket.
5. **Unit — `src/features/tickets/api.test.ts`** · `sanitizeSearch` strips each of `, ( ) . * % _ \`; an all-punctuation term yields `''`; a normal term round-trips unchanged.
6. **Unit — `src/features/tickets/api.test.ts`** · `fetchAllTickets` applies `limit(50)` when no limit is given, and the caller's limit when one is.
7. **Unit — `src/features/tickets/api.test.ts`** · `fetchMyTicketsCount` filters `new, open, pending` while `fetchMyOpenCount` filters `open, pending` — the regression guard for the merge that looks tempting.
8. **Integration — `src/features/tickets/hooks.test.tsx`** · `ticketKeys.list('mine', id, { search: 'a' })` and `…{ search: 'b' }` are distinct keys, and both are invalidated by `invalidateQueries({ queryKey: ticketKeys.all })`.
9. **Integration — `src/features/tickets/hooks.test.tsx`** · `useMyTickets(5)` produces the same request shape it did before task 3 — the Home regression guard.
10. **Unit — `src/core/lib/i18n/locales.test.ts`** (proposed in story 02, still unwritten) · `en.json` and `ar.json` key sets are identical. This story adds a whole namespace to both files and is now the **third** story that would have benefited from it.

---

## Verification Steps

1. **Search predicate:** run the `curl` from task 2b against the real project **before** building the screen. Record which branch shipped in the `sanitizeSearch` comment.
2. **Typecheck:** `npm run typecheck` in the repo root — zero errors. The `TicketFilter` union and the generated `Database` enums make a mistyped filter or column fail here.
3. **Lint:** `npm run lint` — zero errors. This is the gate for hard rules 2-5: a hex literal, a physical layout prop on the new rule or chip row, a `fontWeight` style key, a deep `@/features/tickets/api` import from the screen, or any `core/` → `features/` import fails the build.
4. **Frontend runs:** `npm start`, press `a` (Android) and `i` (iOS). Sign in and walk the manual matrix above.
5. **RTL:** switch to العربية, then **fully restart** the app — `applyDirection` (`src/core/lib/i18n/index.ts`) latches direction at startup, so an in-session toggle will not flip the layout. Confirm the chip row starts at the trailing edge and the `SectionHeader` rule runs toward the leading edge.
6. **Regression — Home:** open Home and confirm both previews, all three stat counts, and inline Claim still work. Task 3 rewrote the hooks underneath them.
7. **Regression — invalidation:** claim a ticket from Home, then open the Tickets tab. The Unassigned list and all three chip counts must already reflect it.
8. **Regression:** `grep -rn 'placeholder.screenBody' src/` — the Tickets tab must no longer be a hit. Customers and Profile still are; that is correct.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:607-611`.

- [ ] Given the Tickets tab, when it opens, then **Mine, Unassigned and All** filters are available
- [ ] Given the **Mine** filter, when applied, then only tickets assigned to me show
- [ ] Given a ticket row, when rendered, then **reference, subject, customer, status, priority and time** display
- [ ] Given status and priority indicators, when rendered, then **each carries a non-colour cue**
- [ ] Given I pull down, when the gesture completes, then the list refreshes

Plus, from the intake:

- [ ] Search narrows by **subject, reference and customer name**, debounced, within the active filter
- [ ] Rows are grouped under **Today / Yesterday / Earlier** headers derived from the device's calendar day
- [ ] Chip counts come from `count: 'exact', head: true` queries and match their lists' predicates
- [ ] Every ticket query is keyed under `['tickets', …]`; a claim from Home refreshes this screen
- [ ] `useMyTickets` / `useUnassignedTickets` keep their signatures — **Home is untouched**
- [ ] Loading, empty, search-empty and error states each render explicitly
- [ ] `SectionHeader`'s `rule` variant renders Figma's inline hairline
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" section reflects the second real feature screen

---

## Open questions — raise with design/product, do not resolve silently

1. **Priority has no non-colour cue in Figma.** `docs/phase1_brd_1.md:610` requires one; the design supplies a coloured bar alone. Task 6b ships an `alert` glyph on `urgent` and `high` as the smallest addition that satisfies the criterion, and it lands on Home's rows too. Design should either bless the glyph, supply their own treatment (a letter, a shape, a dot count), or amend the criterion.
2. **The `PENDING` status still has no colour token** — story 03's open question 1, unresolved. This screen renders many more `pending` badges than Home ever did, so the neutral interim is now considerably more visible. Joins the story 01 §15 flag list.
3. **Figma parenthesises the chip counts — "Mine (12)" — and `FilterChip` does not.** The component renders the count as a sibling `Text` node, which is the more RTL-robust shape. Confirm the gap is acceptable, or change `FilterChip` once for every consumer rather than forking it here.
4. **"All" is capped at 50 with no pagination** (API §4.3). The chip count is uncapped, so a busy department shows "All (312)" over 50 rows. Confirm the cap is acceptable for phase 1, or schedule pagination as its own story.
5. **The Unassigned filter here is read-only.** Home offers inline Claim on its Unassigned preview; this screen deliberately does not, because assignment is US-017. An agent filtering to Unassigned and finding no way to take a ticket is a plausible complaint — confirm the sequencing.
6. **Search is `ilike` only.** The intake defers full-text search, and API §3.2 marks the customer equivalent "basic — full-text pending §10". `ilike '*term*'` cannot use a B-tree index, so this degrades as the ticket table grows. Confirm the deferral has an owner.
7. **`TicketsScreen`'s existing comment and `HomeScreen.tsx:29`'s TODO both cite the wrong BRD ids** (US-016 and US-018 respectively; the list is US-011 and the detail is US-014). Fixed in passing by tasks 3 and 7 — flagged so the correction is not read as a scope change.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 05.**
