# Story 05 — Customer list and search (Story: SCRUM-21)

> Intake: `.squad/stories/customers/SCRUM-21/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:1920` (`Customers - List`); the screen body is `7:1925`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). Supplies the token layer, `Text`/`Icon`, `SearchField`, `FilterChip`, `SectionHeader`, `Avatar`, `EmptyState`, `ErrorState`, `SkeletonList` and `FAB`. This story is the **first consumer of `Avatar`** — it has none today (`grep -rn '<Avatar' src/` → no hits).
- **Story 04 completed** — [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md). **This story is a near-twin of story 04 and depends on three things it lands:** the `SectionHeader` `variant="rule"` fix (task 1 there), the `sanitizeSearch` helper (task 2a there), and the static-header + `SectionList` + state-ladder screen shape. Do not start this story until 04 is merged; building both against the same components in parallel guarantees a conflict.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md). It built `src/app/(tabs)/` and the `customers.tsx` route this story fills in.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/core/lib/supabase.ts:11-16` throws at import time otherwise.
- **Seeded data**: **more than one page** of customers in the agent's branch (see `PAGE_SIZE` in task 3 — at least 60), a mix of **Arabic and Latin** `full_name` values, at least one customer with several open tickets, at least one with none, and at least one with a `null` `email`. Without the Arabic names the story's central acceptance criterion (`docs/phase1_brd_1.md:521`) cannot be exercised at all.

---

## Story Goal

The Customers tab stops being a placeholder and becomes the record an agent reaches for mid-call. Concretely:

1. **A paginated list** of the customers RLS lets this agent see, ordered by name, loading further pages as the agent scrolls.
2. **Debounced search** across `full_name`, `phone` and `email` with `ilike` — **including Arabic names**, which is a first-class acceptance criterion, not a footnote.
3. **Three filters** — **All**, **With open tickets**, **Recent** — as `FilterChip`s with live counts.
4. **Alphabetical section headers** — A – F, G – M, N – Z — over the accumulated pages.
5. **Rows carrying identity and workload**: a tinted initials avatar, the name, the phone, and either an open-ticket count badge or "No open tickets".
6. **Pull-to-refresh**, plus explicit loading, empty, search-empty and error states.
7. **A query namespace (`['customers', …]`) shaped for reuse** — the customer picker in Create Ticket (SCRUM-28) consumes the same hook rather than duplicating the query. This is an explicit intake requirement.

**Not in scope** — each has its own story: customer detail and ticket history (US-008/US-009; row taps stay a documented no-op), creating a customer (US-006; the FAB is inert), editing (US-007), secondary contacts, and full-text search (the intake defers it explicitly and API §3.2 is labelled "basic — full-text pending §10" — `ilike` only).

---

## Context — Read These Files First

1. `src/features/tickets/api.ts` and `src/features/tickets/hooks.ts` **as they stand after story 04** — this story's `api.ts`/`hooks.ts` are deliberate parallels. Copy the structure: a `LIST_SELECT` constant, a private row type, a `toListItem` mapper, `toAppError` at every boundary, and a `<feature>Keys` object whose every entry hangs off one root.
2. `src/features/tickets/grouping.ts` (created by story 04, task 4) — `groupTicketsByDay` returns `{ key, titleKey, data }[]` and filters empty groups out. `groupCustomersAlpha` (task 5 here) returns the same shape for the same `SectionList` reason.
3. `src/features/tickets/screens/TicketsScreen.tsx` **after story 04** — the screen shape this one repeats: a static header block, a `SectionList`, the `isPending` → `isError` → empty-with-search → empty ladder, `RefreshControl` wired to a `ticketKeys.all` invalidation, and the FAB.
4. `src/core/components/Avatar.tsx` — the whole file (65 lines). `size` defaults to 44 (line 17); Figma's is 38. The initials branch (lines 46-52) is hardcoded `tone="muted"` on `bgSurfaceRaised` — Figma's avatars are **tinted per customer**. Task 2 adds a `tint` prop. `overflow: 'hidden'` and the hairline border (lines 62-63) stay.
5. `src/core/utils/format.ts` — `initialsOf` (line 93 in the current file; the function that takes `parts[0]` + `parts[parts.length - 1]`). **Figma uses the first two words, not the first and last** — see task 2b and **Open questions** flag 2. `formatCount` is what renders the open-ticket badge number in Arabic-Indic digits.
6. `src/core/components/SectionHeader.tsx` **after story 04's fix** — `variant="rule"` renders Figma's inline trailing hairline. Nodes `7:1977`, `7:2055` and `7:2114` are that component verbatim, with the same 16px label inset and 12px label→rule gap as the Tickets screen.
7. `src/core/components/SettingsRow.tsx:63-96` and `src/core/components/ActionRow.tsx:15, 28, 45-46` — the two existing divider conventions. `ActionRow`'s `divider?: boolean` prop plus `borderBottomWidth: StyleSheet.hairlineWidth` / `borderBottomColor: theme.colors.borderSubtle` is the one `CustomerRow` copies (task 6).
8. `docs/phase1_api_reference.md` §3.1 (lines 145-155) and §3.2 (lines 157-163). §3.1's **second** query — `select=id,full_name,phone,tickets(count)&tickets.status=in.(new,open,pending)` — is the one this screen uses; it returns the rows and their open counts in a single request. §3.2 documents the `or=(...)` search and states "Works for Arabic names too, since `ilike` is encoding-agnostic" — task 8's manual matrix is what actually proves that against the seeded data.
9. `docs/phase1_brd_1.md:511-523` — US-005 and its five acceptance criteria. `## Done Criteria` mirrors them verbatim. Line 519 says **"a paginated list renders"** — this is the criterion story 04 did not have, and it is why this story uses `useInfiniteQuery` where the Tickets list used a flat `useQuery`.
10. `src/core/types/database.ts:211-247` — the `customers` row. Note `phone: string` (**not** nullable), `email: string | null`, `secondary_contacts: Json`, and that there is **no** `avatar_url` and **no** `last_contacted_at` column. The absence of the latter is what makes the "Recent" chip an open question (flag 3).
11. `src/core/hooks/useDebounce.ts` — all 13 lines. `useDebounce(value, 300)`, the same 300ms story 04 uses.
12. `src/features/customers/screens/CustomersScreen.tsx` — all 17 lines, and `src/features/customers/index.ts` — 1 line. The placeholder this story replaces, and the barrel it grows.
13. `eslint.config.js` lines 53-81 — the four `no-restricted-syntax` bans. The avatar tint table (task 2a) is the place most likely to tempt a hex literal; rule 2 forbids it outside `primitives.ts`.

---

## Design spec (resolved from Figma node `7:1920`)

Structure, from `get_metadata` on `7:1920`:

```
CustomersScreen 7:1925
├── 7:1944  header block (static — does not scroll)
│   ├── 7:1945  "Customers" title
│   ├── 7:1973  SearchField:margin → 74:661 SearchField (44h)
│   └── 7:1974  Container:margin → 7:1954 chip row → 74:679 / 74:683 / 74:687 FilterChip ×3
├── 7:1975  scrolling list
│   ├── 7:1976  group → 7:1977 SectionHeader ("A – F") + 4 rows
│   ├── 7:2054  group → 7:2055 SectionHeader ("G – M") + 3 rows
│   ├── 7:2113  group → 7:2114 SectionHeader ("N – Z") + 3 rows
│   └── 7:2172  80px bottom spacer
├── 60:235 BottomNav   (already built — src/app/(tabs)/_layout.tsx)
└── 60:399 FAB
```

The header block (`7:1944`) is **structurally identical** to the Tickets screen's (`7:372`) — same title box, same `SearchField:margin`, same chip row, same insets. Task 1 extracts it rather than writing it twice.

Chip labels, read from the render: **All (248)**, **With open tickets (34)**, **Recent (12)**.

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Horizontal inset, everywhere | 16 | `spacing.lg` |
| Title "Customers" | 28h text box, semibold | `<Text variant="title" weight="semibold">` |
| Title → search gap | 10 → snap to 8 | `spacing.sm` |
| Search → chip row gap | 10 → snap to 8 | `spacing.sm` |
| Chip row gap | 8 | `spacing.sm` |
| Section header | 31h; label at 16, rule from 57 | `<SectionHeader variant="rule" />` |
| Label → rule gap | 12 | `spacing.md` |
| Row height | ~63.7 | intrinsic; `paddingVertical: spacing.md` |
| Row divider | 1px | `StyleSheet.hairlineWidth`, `colors.borderSubtle` |
| Avatar | 38 circle at x=16 | `<Avatar size={38} />` — off-scale, matched exactly |
| Avatar → text gap | 12 | `spacing.md` |
| Avatar fill | tinted per customer | task 2a — `bgTabActive` / `bgSuccessSubtle` / `bgWarningSubtle` / `bgDangerSubtle` |
| Customer name | 13.5 / 17.25 medium | `<Text variant="body" weight="medium">` |
| Phone line | 11.5 muted | `<Text variant="caption" tone="muted">` |
| Open-count badge | 18 circle, brand blue, 10px numeral | `radius.full`, `colors.bgPrimary`, `<Text variant="overline" tone="onPrimary">` |
| Badge → "open" gap | 5 → snap to 4 | `spacing.xs` |
| "open" / "No open tickets" | 11.5 muted | `<Text variant="caption" tone="muted">` |
| Trailing block inset | ends at 371.7 = width − 16 | `spacing.lg` |
| Bottom spacer | 80 | `spacing.xxxl + spacing.xxl` |
| FAB | 56 × 56 | `<FAB />` as built |

`get_variable_defs` on `7:1983` returns the same legacy off-scale values stories 01, 03 and 04 all flagged (`font size/13_5`, `font size/11_5`, `line height/17_25`). **Snap to the scale tokens tabled above; do not introduce off-scale literals.** The one exception is `size={38}` on the avatar, which is a dimension rather than a type token and has no scale to snap to.

**One thing the render shows that the plan does not reproduce:** Figma's avatars use several unnamed fill colours, one of which (`Noor Al-Khalij`, `7:2120`) is a solid brand blue with white text while its neighbours are pale tints. Task 2a ships a deterministic four-tint scheme built from existing semantic tokens; it will not match the mock swatch-for-swatch. See **Open questions** flag 4.

---

## Implementation tasks

### 1 — Extract the list-screen header to `core/`

**Create file: `src/core/components/ListScreenHeader.tsx`**

Figma nodes `7:372` (Tickets) and `7:1944` (Customers) are the same block. Hard rule 2 — "any reusable logic … used in 2+ places goes in `core/`" — makes this an extraction, not a copy.

```tsx
export type ListScreenHeaderProps = {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** The filter chip row. Rendered inside a horizontal ScrollView. */
  filters: ReactNode;
};
```

It owns the title, the `SearchField` (with `onClear` wired to `onSearchChange('')`), and the horizontal chip `ScrollView` with `showsHorizontalScrollIndicator={false}` and `contentContainerStyle={{ gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}`. It owns **no filter semantics** — the caller passes `FilterChip`s as children, which is what keeps it generic and keeps `core/` ignorant of `features/` (hard rule 3).

Export it from `src/core/components/index.ts` under the "Headers" group, beside `SectionHeader`.

**Then migrate `src/features/tickets/screens/TicketsScreen.tsx` to use it in this same change.** That screen is untouched otherwise; verification step 6 is the regression gate.

### 2 — Tint the avatar and fix its initials

**File: `src/core/components/Avatar.tsx`**

**2a. A `tint` prop.** Additive, defaulting to today's behaviour so the change cannot regress anything:

```tsx
export type AvatarTint = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

// in props
tint?: AvatarTint; // default 'neutral'
```

```tsx
/**
 * Figma tints each customer avatar with an unnamed fill (node 7:1984 and
 * siblings). The semantic palette has no avatar-tint token set, and hex
 * literals are banned outside primitives.ts (hard rule 2), so this maps onto
 * the four subtle surfaces that already exist. `bgTabActive` — not
 * `bgPrimarySubtle` — is the blue: `bgPrimarySubtle` is near-white
 * (primitives.ts:36 and its comment) and disappears behind the initials.
 */
const TINT: Record<AvatarTint, { bg: ColorToken; tone: TextTone }> = {
  neutral: { bg: 'bgSurfaceRaised', tone: 'muted' },
  info: { bg: 'bgTabActive', tone: 'info' },
  success: { bg: 'bgSuccessSubtle', tone: 'success' },
  warning: { bg: 'bgWarningSubtle', tone: 'warning' },
  danger: { bg: 'bgDangerSubtle', tone: 'danger' },
};
```

Replace the hardcoded `backgroundColor: theme.colors.bgSurfaceRaised` (line 33) and `tone="muted"` (line 48) with the table lookup.

Add, in the same file, the deterministic picker — it belongs beside the table it indexes:

```tsx
const TINT_CYCLE: AvatarTint[] = ['info', 'success', 'warning', 'danger'];

/**
 * Stable tint for a name — the same customer is the same colour on every
 * render, every device and every session. Sums code units rather than using a
 * cryptographic hash; collisions are cosmetic.
 */
export function tintForName(name: string): AvatarTint {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return TINT_CYCLE[sum % TINT_CYCLE.length];
}
```

Export `Avatar`, `AvatarTint` and `tintForName` from `src/core/components/index.ts` (line 29 currently exports `Avatar` alone).

**2b. First two words, not first and last.**

**File: `src/core/utils/format.ts`**

`initialsOf` currently returns `parts[0]` + `parts[parts.length - 1]`. Every multi-word name in the Figma render disagrees: `Apex Logistics Group` → **AL** (not AG), `Meridian Supplies Ltd` → **MS** (not ML), `Noor Al-Khalij Trading` → **NA** (not NT), `أحمد محمد السيد` → **أم**, `دينا عبدالرحمن فوزي` → **دع**, `مريم إبراهيم حسن` → **مإ**. Change the two-plus-word branch to `parts[0]` + `parts[1]`; leave the zero-word and one-word branches alone.

`Avatar` is the function's only consumer (`grep -rn 'initialsOf' src/` → `format.ts`, `utils/index.ts`, `Avatar.tsx`) and `Avatar` has no consumers until this story, so the blast radius is zero today. It is still a semantic change to a core utility — see **Open questions** flag 2.

### 3 — The customers data layer

**Create file: `src/features/customers/types.ts`**

```ts
/** A customer as it appears in a list row — the §3.1 projection, camelCased. */
export type CustomerListItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  /** Tickets in `new`, `open` or `pending`. Never null — a customer with none is 0. */
  openTicketCount: number;
};

/** The three chips on the Customers list. */
export type CustomerFilter = 'all' | 'withOpenTickets' | 'recent';
```

**Create file: `src/features/customers/api.ts`**

```ts
const LIST_SELECT = 'id, full_name, phone, email, created_at, tickets(count)';
const LIST_SELECT_INNER = 'id, full_name, phone, email, created_at, tickets!inner(count)';

const OPEN_STATUSES = ['new', 'open', 'pending'] as const; // API §3.1
export const PAGE_SIZE = 50;                               // API §3.1's `limit=50`
const RECENT_WINDOW_DAYS = 30;                             // interim — see open question 3
```

The row type and mapper:

```ts
type CustomerListRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
  /** PostgREST returns an aggregate embed as a one-element array. */
  tickets: { count: number }[] | null;
};

function toListItem(row: CustomerListRow): CustomerListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    openTicketCount: row.tickets?.[0]?.count ?? 0,
  };
}
```

**3a. The list fetcher.**

```ts
export type CustomerListParams = {
  filter: CustomerFilter;
  search?: string;
  /** Zero-based. `range(page * PAGE_SIZE, …)`. */
  page?: number;
};

export async function fetchCustomers(params: CustomerListParams): Promise<CustomerListItem[]>
```

Assembly, in order:

- **Select** — `LIST_SELECT_INNER` when `filter === 'withOpenTickets'`, `LIST_SELECT` otherwise. The only difference between "all customers with their open count" and "only customers who have one" is `!inner`; the status filter below is identical either way.
- **Embedded status filter** — `.in('tickets.status', OPEN_STATUSES)`, always. Without it the count is every ticket ever, not the open ones, and the chip's own count would disagree with the rows'.
- **`recent`** — `.gte('created_at', <now minus RECENT_WINDOW_DAYS, ISO>)`.
- **Search** — reuse story 04's sanitiser (task 4 below), then
  `.or(\`full_name.ilike.*${term}*,phone.ilike.*${term}*,email.ilike.*${term}*\`)`. All three are columns on `customers` itself, so unlike story 04's ticket search there is **no embedded-column question here** — this form is plain PostgREST and needs no verification gate.
- **Order** — `.order('full_name', { ascending: true }).order('id', { ascending: true })`. **The `id` tiebreaker is not optional.** Two customers with the same `full_name` have no defined relative order without it, and an undefined order across `range()` calls silently duplicates one row and skips another.
- **Range** — `.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)`, with `page` defaulting to 0.
- `.returns<CustomerListRow[]>()`, `if (error) throw toAppError(error)`, map.

**3b. Three counts.** All three use `.select('*', { count: 'exact', head: true })` and `return count ?? 0`, mirroring `src/features/tickets/api.ts:69-100`:

```ts
export async function fetchCustomersCount(): Promise<number>          // no predicate
export async function fetchWithOpenTicketsCount(): Promise<number>    // tickets!inner + status filter
export async function fetchRecentCustomersCount(): Promise<number>    // created_at gte window
```

`fetchWithOpenTicketsCount` selects `'*, tickets!inner(id)'` with the same `.in('tickets.status', …)`. An embed does **not** flatten the parent, so each qualifying customer is counted once — but **verify it** (verification step 1) rather than trusting the reasoning: an inflated count here would read as a plausible number and never look wrong.

### 4 — Promote `sanitizeSearch` to `core/`

**Create file: `src/core/utils/search.ts`**

Story 04 put `sanitizeSearch` privately inside `src/features/tickets/api.ts` because it had one consumer. This is the second, so hard rule 2 applies. Move it verbatim — keep its comment about PostgREST's logic-tree parsing intact — and rename to `sanitizeSearchTerm` so the exported name says what it is:

```ts
export function sanitizeSearchTerm(term: string): string;
```

Re-export from `src/core/utils/index.ts` beside the `format` exports, then **update `src/features/tickets/api.ts` to import it** and delete the local copy. That edit is the second reason story 04 must be merged first.

### 5 — Alphabetical grouping

**Create file: `src/features/customers/grouping.ts`**

Same contract as `src/features/tickets/grouping.ts`, for the same `SectionList` reason.

```ts
export type CustomerGroupKey = 'a-f' | 'g-m' | 'n-z' | 'other';

export type CustomerGroup = {
  key: CustomerGroupKey;
  /** i18n key, e.g. `customers.groups.a-f`. */
  titleKey: string;
  data: CustomerListItem[];
};

/**
 * Buckets by the first letter of `fullName`, matching Figma's A – F / G – M /
 * N – Z headers. Names that start with no Latin letter — every Arabic name, and
 * this is an ARABIC-FIRST app — fall into `other`, which sorts last. Figma shows
 * Arabic names inside "A – F", which is placeholder behaviour rather than a
 * decision; see the story's open question 1.
 */
export function groupCustomersAlpha(customers: CustomerListItem[]): CustomerGroup[]
```

Implementation notes for the executor:

- Take the first character of the trimmed name, uppercase it, and test `>= 'A' && <= 'F'` etc. Anything outside `A`–`Z` — Arabic, a digit, a quote, an empty name — goes to `other`.
- **Preserve the incoming order inside each bucket.** The server already sorted by `full_name`; re-sorting client-side would fight the DB collation and reorder rows as pages arrive.
- **Return only non-empty groups**, and always in the fixed order `a-f`, `g-m`, `n-z`, `other`. An empty `data` array still renders its header in `SectionList`.
- The function runs over the **accumulated** pages, so a group legitimately grows as the agent scrolls. It must be cheap and allocation-light; a single pass with four arrays, no `sort`.

### 6 — `CustomerRow`

**Create file: `src/features/customers/components/CustomerRow.tsx`**

```tsx
export type CustomerRowProps = {
  customer: CustomerListItem;
  onPress: (id: string) => void;
  /** Omit on the last row of a section — the SectionHeader's rule takes over. */
  divider?: boolean;
};
```

A `Pressable` with `accessibilityRole="button"`, laid out `flexDirection: 'row'`, `alignItems: 'center'`, `gap: theme.spacing.md`, `paddingVertical: theme.spacing.md`, `paddingHorizontal: theme.spacing.lg`, and the `ActionRow`-style divider (`ActionRow.tsx:45-46`).

- **Leading** — `<Avatar name={customer.fullName} size={38} tint={tintForName(customer.fullName)} />`.
- **Body** — `flex: 1`, `minWidth: 0`; the name as `<Text variant="body" weight="medium" numberOfLines={1}>`, the phone as `<Text variant="caption" tone="muted" numberOfLines={1}>`.
- **Trailing** — when `openTicketCount > 0`, an 18px `radius.full` circle on `colors.bgPrimary` holding `<Text variant="overline" weight="semibold" tone="onPrimary">{formatCount(count)}</Text>`, then `t('customers.openSuffix')` ("open") as `caption`/muted, `gap: theme.spacing.xs`. When it is `0`, a single `<Text variant="caption" tone="muted">{t('customers.noOpenTickets')}</Text>`.
- **Accessibility label** — `t('customers.rowLabel', { name, phone, count })`, so the badge is not a bare numeral to a screen reader. Use i18next pluralisation (`_zero`/`_one`/`_other`), the same mechanism `field.charactersLeft_one`/`_other` already uses in `en.json:15-16`.

**The phone number is a bidi hazard.** `+20 10 1234 5678` inside an Arabic (RTL) row renders with the `+` and the digit groups reordered unless the run is isolated. Wrap the phone value in U+2066 (LRI) … U+2069 (PDI):

```tsx
<Text variant="caption" tone="muted" numberOfLines={1}>{`⁦${customer.phone}⁩`}</Text>
```

Do **not** reach for `direction: 'ltr'` on the `Text` — RN does not apply it per-node on Android.

### 7 — Hooks

**Create file: `src/features/customers/hooks.ts`**

**7a. The key namespace.** A new root, as the intake specifies — `['customers', …]`, separate from `['tickets', …]`:

```ts
export const customerKeys = {
  all: ['customers'] as const,
  list: (filter: CustomerFilter, search: string) =>
    ['customers', 'list', filter, search] as const,
  count: (filter: CustomerFilter) => ['customers', 'count', filter] as const,
};
```

**7b. The paginated list.** `useInfiniteQuery` — BRD `:519` requires pagination, and it is the one structural difference from story 04's flat `useQuery`:

```ts
export function useCustomers(filter: CustomerFilter, search = '') {
  return useInfiniteQuery({
    queryKey: customerKeys.list(filter, search),
    queryFn: ({ pageParam }) => fetchCustomers({ filter, search, page: pageParam }),
    initialPageParam: 0,
    // A short page is the last page. Never return `lastPage.length` as an
    // offset — pageParam is a PAGE index, and conflating the two silently
    // re-fetches page 0 forever once a page comes back short.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
  });
}
```

**7c. The reuse seam the intake asks for.** SCRUM-28's customer picker wants search without chips or grouping:

```ts
/**
 * Search-only view of the same query — SCRUM-28's Create Ticket picker.
 * Shares `customerKeys.list('all', term)` with this screen, so a picker search
 * an agent already ran on the Customers tab is served from cache.
 */
export function useCustomerSearch(search: string) {
  return useCustomers('all', search);
}
```

**7d. Three count hooks** — `useCustomersCount()`, `useWithOpenTicketsCount()`, `useRecentCustomersCount()`, each a plain `useQuery` on `customerKeys.count(<filter>)`.

**No mutations in this story**, so nothing invalidates `customerKeys.all` yet. Creating a customer (US-006) will; that is why the root exists now.

### 8 — The screen

**File: `src/features/customers/screens/CustomersScreen.tsx`** — replace all 17 lines.

```tsx
const [filter, setFilter] = useState<CustomerFilter>('all');
const [query, setQuery] = useState('');
const search = useDebounce(query, 300);
const list = useCustomers(filter, search);
const customers = useMemo(() => list.data?.pages.flat() ?? [], [list.data]);
const sections = useMemo(() => groupCustomersAlpha(customers), [customers]);
```

Composition, top to bottom:

1. `SafeAreaView` with `edges={['top']}` and `backgroundColor: theme.colors.bgCanvas`.
2. `<ListScreenHeader title={t('customers.title')} … filters={<>three FilterChips</>} />` from task 1. Each chip takes `count={<its count query>.data}` — `undefined` while pending, so the chip renders label-only rather than flashing `0`.
3. A `SectionList` over `sections`:
   - `renderSectionHeader={({ section }) => <SectionHeader variant="rule" title={t(section.titleKey)} />}`
   - `renderItem={({ item, index, section }) => <CustomerRow customer={item} onPress={handleCustomerPress} divider={index < section.data.length - 1} />}`
   - `keyExtractor={(item) => item.id}`
   - `onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage(); }}` with `onEndReachedThreshold={0.5}`. **Both guards are required** — without them `SectionList` fires repeatedly near the bottom and stacks duplicate page requests.
   - `ListFooterComponent` — an `ActivityIndicator` while `list.isFetchingNextPage`, `null` otherwise. Without it the agent has no signal that more is coming and pulls again.
   - `refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={handleRefresh} />}`, where `handleRefresh` invalidates `customerKeys.all` so the rows and all three chip counts move together. **The `&& !list.isFetchingNextPage` guard matters** — `isRefetching` is true during a next-page fetch too, and without it the pull-to-refresh spinner appears every time the agent scrolls to the bottom.
   - `contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + theme.spacing.xxl }}` — Figma's 80px spacer.
4. The state ladder, in order — identical in shape to story 04's:
   - `list.isPending` → `<SkeletonList count={8} />` inside a `paddingHorizontal: spacing.lg` wrapper.
   - `list.isError` → `<ErrorState title={t('states.errorTitle')} body={t(errorMessageKey(list.error))} onRetry={() => list.refetch()} />`, using the `errorMessageKey` helper story 04 moved into `src/core/utils/errors.ts`.
   - empty **with** a search term → `<EmptyState icon="search" title={t('customers.empty.search', { query: search })} />`. BRD `:523` names this state specifically.
   - empty **without** one → ``<EmptyState icon="customers" title={t(`customers.empty.${filter}`)} />``.
5. `FAB` — `// TODO(US-006): push the create-customer route once it exists.` with an empty handler, matching how story 04 left the Tickets FAB.
6. Row taps — ``function handleCustomerPress(id: string) {}`` with ``// TODO(US-008): push `/customers/${id}` once the customer detail route exists.``

**File: `src/app/(tabs)/customers.tsx`** — no change. It already imports `CustomersScreen` from the barrel and renders it, which is all a route file may do (hard rule 1).

### 9 — Barrel and i18n

**File: `src/features/customers/index.ts`** — currently one line.

```ts
export { PAGE_SIZE } from './api';
export { groupCustomersAlpha } from './grouping';
export type { CustomerGroup, CustomerGroupKey } from './grouping';
export { CustomerRow } from './components/CustomerRow';
export { customerKeys, useCustomers, useCustomerSearch } from './hooks';
export {
  useCustomersCount,
  useRecentCustomersCount,
  useWithOpenTicketsCount,
} from './hooks';
export { CustomersScreen } from './screens/CustomersScreen';
export type { CustomerFilter, CustomerListItem } from './types';
```

`useCustomerSearch` is exported for SCRUM-28; nothing in this story calls it. That is deliberate — say so in a one-line comment so a later reader does not delete it as dead code.

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`**

```json
"customers": {
  "title": "Customers",
  "searchPlaceholder": "Search customers, phone...",
  "filters": { "all": "All", "withOpenTickets": "With open tickets", "recent": "Recent" },
  "groups": { "a-f": "A – F", "g-m": "G – M", "n-z": "N – Z", "other": "Other" },
  "openSuffix": "open",
  "noOpenTickets": "No open tickets",
  "rowLabel_zero": "{{name}}, {{phone}}, no open tickets",
  "rowLabel_one": "{{name}}, {{phone}}, {{count}} open ticket",
  "rowLabel_other": "{{name}}, {{phone}}, {{count}} open tickets",
  "empty": {
    "all": "No customers yet.",
    "withOpenTickets": "No customers have open tickets.",
    "recent": "No customers added recently.",
    "search": "No customers match \"{{query}}\"."
  }
}
```

Arabic: `"العملاء"`; `"ابحث بالاسم أو رقم الهاتف..."`; filters `"الكل"` / `"لديهم تذاكر مفتوحة"` / `"الأحدث"`; `openSuffix` `"مفتوحة"`; `noOpenTickets` `"لا توجد تذاكر مفتوحة"`; empties `"لا يوجد عملاء بعد."` / `"لا يوجد عملاء لديهم تذاكر مفتوحة."` / `"لم يُضف عملاء مؤخرًا."` / `"لا يوجد عملاء يطابقون \"{{query}}\"."`. Arabic pluralisation needs **six** `rowLabel_*` forms (`_zero`, `_one`, `_two`, `_few`, `_many`, `_other`) — i18next resolves them from the CLDR plural rules for `ar`, and a missing form silently falls back to `_other`, which reads wrong for 3–10.

**Group labels are the open question, not a translation.** `"A – F"` has no Arabic equivalent; ship the Latin ranges untranslated in `ar.json` and `"أخرى"` for `other`, and read flag 1 before assuming that is final.

**`SectionHeader` uppercases its title** (`SectionHeader.tsx:58`), so `"A – F"` is already correct and `"Other"` renders as "OTHER". The en-dash is U+2013, matching Figma's `A – F`, not a hyphen.

### 10 — Update the project docs

**File: `CLAUDE.md`** — the "Project status" section is corrected by story 04 to name `tickets` as the second real screen. Add `customers` as the third, and drop it from the "not built yet" list in the "Target architecture" section.

---

## Edge Cases & Failure Modes

- **A page boundary lands between two customers with the same `full_name`** — without the `id` tiebreaker (task 3a) the DB may return one of them on both pages and neither on the next. This is the single most likely correctness bug in the story, and it is invisible in a 60-row seed unless names are deliberately duplicated. Seed two.
- **`onEndReached` fires repeatedly** — `SectionList` calls it on every scroll event near the threshold. Both the `hasNextPage` and `!isFetchingNextPage` guards (task 8) are load-bearing; without them the agent's scroll fires four identical page-2 requests.
- **`getNextPageParam` returns a row count instead of a page index** — the query re-fetches page 0 forever and the list never grows past `PAGE_SIZE`. `allPages.length` is the page index; `lastPage.length` is not.
- **The last page is exactly `PAGE_SIZE` long** — `getNextPageParam` returns a next page, which comes back empty, and *that* terminates. One wasted request at the end of a perfectly-divisible list; correct, and not worth a `count` round trip to avoid.
- **Pull-to-refresh during a next-page fetch** — `isRefetching` is true for both. The `&& !isFetchingNextPage` guard on `refreshing` (task 8) keeps the spinner off during ordinary scrolling.
- **`tickets(count)` returns an empty array** — supabase-js types the embed as an array, and a customer with no matching tickets can come back as `[]` rather than `[{ count: 0 }]`. `row.tickets?.[0]?.count ?? 0` (task 3) covers both; `row.tickets[0].count` throws.
- **`fetchWithOpenTicketsCount` double-counts** — if `!inner` flattens the parent for the purposes of `count: 'exact'`, a customer with four open tickets counts four times and the chip reads "136" over 34 rows. Verification step 1 is the gate; do not ship on the reasoning alone.
- **The "With open tickets" chip count disagrees with its own list length** — it will, and correctly, once the list is paginated: the count is the total, the list is one page. That is the same relationship the "All" chip has. Do not "fix" it by counting loaded rows.
- **A search term containing `,` `(` `)` or `.`** — PostgREST parses `or=(...)` as a logic tree. `sanitizeSearchTerm` (task 4) strips them. A phone number is `+20 10 1234 5678`; the `+` survives sanitising and is harmless, but an agent pasting `(+20) 10-1234` loses the parens and matches on the digits, which is the desired outcome anyway.
- **Searching a phone number the way it is displayed** — the DB stores `+201001234567` (API §3.3) while the row renders `+20 10 1234 5678`. An agent typing the spaced form matches **nothing**, because `ilike '*+20 10 1234*'` does not match the unspaced column. This is a genuine usability trap; see **Open questions** flag 5.
- **Arabic name search** — `ilike` is byte-wise and encoding-agnostic, so `%مريم%` matches. What it does **not** do is normalise Arabic orthography: أ / إ / آ / ا are distinct code points, so searching `احمد` will not find `أحمد`. BRD `:521` says "matching is correct"; confirm with the seeded names before calling that criterion met, and read flag 6.
- **A customer whose `full_name` is empty or whitespace** — `initialsOf` returns `''` (`format.ts`, the `parts.length === 0` branch) and `groupCustomersAlpha` sends them to `other`. Neither throws. The row renders as an empty circle, which is honest.
- **A name starting with a digit or a quote** (`"3M Egypt"`, `'Al-Noor'`) — outside `A`–`Z`, so it lands in `other` alongside the Arabic names. Correct behaviour for the buckets as specified, and part of why flag 1 matters.
- **`email` is null** — `database.ts:217` types it nullable, and the `or=` search includes it. PostgREST's `ilike` on a `NULL` column yields `NULL`, not `true`, so those rows simply do not match on email. No guard needed; the row itself never renders the email.
- **RTL** — the row uses `gap` and `paddingHorizontal` only, so it mirrors for free. The **phone number needs the LRI/PDI wrap** (task 6) or its `+` and digit groups reorder in Arabic. The avatar and the trailing badge swap sides automatically; verify rather than assume.
- **Arabic digits** — the badge count goes through `formatCount`. The phone number must **not**: it is an identifier the agent reads aloud and dials, so it stays in the Latin digits the DB holds. Do not run it through `formatNumber`.
- **Offline** — queries retry twice on non-4xx (`query-client.ts:15-19`), then `ErrorState` renders with `states.offline`. `OfflineBanner` is already mounted globally in `_layout.tsx`. A failed `fetchNextPage` leaves the loaded pages intact; the footer indicator clears and the agent can scroll again to retry.

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, no `test` script in `package.json`. Stories 02, 03 and 04 all reached this conclusion and deferred. This story does not install one either. It adds a **second** pure, dependency-free function (`groupCustomersAlpha`) alongside story 04's `groupTicketsByDay`, plus `tintForName` and the changed `initialsOf` — four functions that need no Supabase mock, no React and no renderer. The case for a runner is now made by the code rather than by argument.

### Runnable today — manual matrix

`npm start`, then `a`/`i`. Sign in as a seeded agent and open the Customers tab.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | 60+ customers | Open the tab | Title, search, three chips with counts, A – F / G – M / N – Z sections |
| 2 | Any | Read the chips | **All** is selected on open |
| 3 | 60+ customers | Scroll to the bottom | Footer spinner, then more rows; sections grow rather than repeat |
| 4 | 60+ customers | Scroll to the bottom repeatedly | Each pull loads **one** page; no duplicate rows anywhere in the list |
| 5 | Two customers with identical `full_name` across a page boundary | Scroll past it | Both appear, exactly once each |
| 6 | Fewer than `PAGE_SIZE` customers | Scroll | No footer spinner, no further requests |
| 7 | Any | Tap **With open tickets** | Only customers with a badge; the chip count is the total, not the page length |
| 8 | Any | Tap **Recent** | Customers created in the last 30 days |
| 9 | Any | Type a partial Latin name | Matching rows after ~300ms (BRD `:520`) |
| 10 | Arabic customers seeded | Type `مريم` | The Arabic customer matches (BRD `:521`) |
| 11 | Arabic customers seeded | Type `احمد` (bare alif) for `أحمد` | **Records what happens** — see flag 6; not necessarily a pass |
| 12 | Any | Type the stored phone `+201001234567` | The customer matches (BRD `:522`) |
| 13 | Any | Type the *displayed* phone `+20 10 1234 5678` | **Records what happens** — see flag 5 |
| 14 | Any | Type nonsense | Search empty state quoting the term (BRD `:523`) |
| 15 | Any | Type `((( ,,, ...` | Full list, no error |
| 16 | Search active | Tap clear | Full list returns from page 0 |
| 17 | Search active | Switch chip | Search persists and applies to the new filter |
| 18 | Any | Pull down | Rows reset to page 1 and all three counts refresh |
| 19 | Scrolled to page 3 | Scroll to bottom, then pull to refresh | Refresh spinner appears **only** on the pull, not on the scroll |
| 20 | Customer with 4 open tickets | Read the row | Blue badge with `4`, then "open" |
| 21 | Customer with none | Read the row | "No open tickets", no badge |
| 22 | Mixed names | Read the avatars | Initials are the **first two words**; the same customer keeps the same tint across refreshes |
| 23 | Arabic + Latin names | Read the section headers | Arabic names sit under "OTHER"; confirm against flag 1 before signing off |
| 24 | Airplane mode | Open the tab | `ErrorState` with retry; `OfflineBanner` visible |
| 25 | Airplane mode, scrolled | Scroll to bottom | Loaded pages stay; footer clears; scrolling again retries |
| 26 | Switch to العربية | Open the tab, restart | Layout mirrors; avatar leads on the right; chips scroll from the trailing edge |
| 27 | العربية | Read a phone number | Renders `+20 10 1234 5678` left-to-right, `+` first — the LRI/PDI check |
| 28 | العربية | Read a badge | Count is Arabic-Indic; the phone is **not** |
| 29 | Toggle system dark mode | Open the tab | All four avatar tints legible against `bgSurface` |
| 30 | Any | Tap a row | Nothing happens, no crash (US-008 not built) |
| 31 | Any | Open the Tickets tab | Header, search and chips still work — the task 1 regression gate |

Rows 11, 13 and 23 are **recording** rows, not pass/fail rows: they exist to produce the evidence the three open questions need.

### To write when a runner exists

1. **Unit — `src/features/customers/grouping.test.ts`** · `Ahmed` → `a-f`; `Fenix` → `a-f`; `Gamal` → `g-m`; `Meridian` → `g-m`; `Noor` → `n-z`; `Zaki` → `n-z`.
2. **Unit — `src/features/customers/grouping.test.ts`** · `مريم` → `other`; `3M Egypt` → `other`; `''` → `other`; a leading-space name buckets on its first non-space character.
3. **Unit — `src/features/customers/grouping.test.ts`** · empty input → `[]`; empty buckets are omitted; the returned order is always `a-f`, `g-m`, `n-z`, `other`.
4. **Unit — `src/features/customers/grouping.test.ts`** · input order is preserved within each bucket (the DB collation is authoritative, not the client).
5. **Unit — `src/core/utils/format.test.ts`** · `initialsOf('Apex Logistics Group')` → `'AL'`; `initialsOf('أحمد محمد السيد')` → `'أم'`; a one-word name → one letter; `''` → `''`. This is the regression guard for the task 2b change.
6. **Unit — `src/core/components/Avatar.test.ts`** · `tintForName` is stable across calls, returns one of the four tints, and two different names can collide without error.
7. **Unit — `src/core/utils/search.test.ts`** · `sanitizeSearchTerm` strips each of `, ( ) . * % _ \`; an all-punctuation term yields `''`. Moved here from story 04's test list along with the function.
8. **Unit — `src/features/customers/api.test.ts`** · `toListItem` maps `tickets: [{ count: 3 }]` → `3`, `tickets: []` → `0`, and `tickets: null` → `0`.
9. **Unit — `src/features/customers/api.test.ts`** · `fetchCustomers` orders by `full_name` **then `id`**, and `range` is `(page * 50, page * 50 + 49)`.
10. **Unit — `src/features/customers/api.test.ts`** · `filter: 'withOpenTickets'` selects the `!inner` projection; `'all'` does not; both apply the embedded status filter.
11. **Integration — `src/features/customers/hooks.test.tsx`** · `getNextPageParam` returns `undefined` for a short page and `allPages.length` otherwise — the infinite-loop guard.
12. **Integration — `src/features/customers/hooks.test.tsx`** · `useCustomerSearch('x')` and `useCustomers('all', 'x')` resolve to the **same** cache entry, which is the whole point of the SCRUM-28 seam.
13. **Unit — `src/core/lib/i18n/locales.test.ts`** (proposed in story 02, still unwritten) · `en.json` and `ar.json` key sets are identical, **with the Arabic plural forms exempted** — `rowLabel` legitimately has three forms in English and six in Arabic. This story is the **fourth** that would have benefited, and the first where the naive key-equality test would fail on correct data.

---

## Verification Steps

1. **The `!inner` count:** before wiring the chip, confirm `fetchWithOpenTicketsCount` counts customers, not tickets. Pick a seeded customer with several open tickets, then compare:
   ```bash
   curl -sI -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Prefer: count=exact" \
     "$URL/rest/v1/customers?select=id,tickets!inner(id)&tickets.status=in.(new,open,pending)"
   ```
   Read `Content-Range`. It must equal the number of distinct customers with an open ticket. If it is inflated, count via a two-step instead (fetch the distinct `customer_id` set from `tickets`, count it) and note the change in a comment.
2. **Typecheck:** `npm run typecheck` in the repo root — zero errors. The generated `Database` types make a mistyped column or a wrong embed shape fail here.
3. **Lint:** `npm run lint` — zero errors. This is the gate for hard rules 2-5: a hex literal in the avatar tint table, a physical layout prop, a `fontWeight` style key, a deep `@/features/customers/api` import, or any `core/` → `features/` import fails the build.
4. **Frontend runs:** `npm start`, press `a` (Android) and `i` (iOS). Sign in and walk the manual matrix above.
5. **RTL:** switch to العربية, then **fully restart** the app — `applyDirection` (`src/core/lib/i18n/index.ts`) latches direction at startup. Confirm the avatar leads on the right **and** that phone numbers still read `+20 10 …` left to right (matrix row 27).
6. **Regression — Tickets:** open the Tickets tab and exercise its title, search and chips. Task 1 rewrote that screen's header; task 4 rewrote its search helper's import. Both are silent-failure shapes.
7. **Regression — Home:** open Home and confirm both previews and the three counts still render. Nothing in this story touches them, which is exactly why a two-minute check is worth it.
8. **Regression:** `grep -rn 'placeholder.screenBody' src/` — the Customers tab must no longer be a hit. Profile still is; that is correct.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:519-523`.

- [ ] Given customers exist, when I open the Customers tab, then a **paginated** list renders
- [ ] Given I type a partial name, when results return, then matching customers show
- [ ] Given I search an **Arabic** name, when results return, then matching is correct
- [ ] Given I search a **phone number**, when results return, then the matching customer shows
- [ ] Given no matches, when the search completes, then an **empty state** renders

Plus, from the intake and the design:

- [ ] Search covers `full_name`, `phone` **and** `email` via `ilike`, debounced at 300ms
- [ ] Three chips — All / With open tickets / Recent — each with a live count
- [ ] Rows are grouped under A – F / G – M / N – Z section headers
- [ ] Each row shows a tinted initials avatar, name, phone, and either an open-ticket badge or "No open tickets"
- [ ] Every query is keyed under `['customers', …]`, **separate from `['tickets', …]`**
- [ ] `useCustomerSearch` exists and shares a cache entry with the screen's own query, ready for SCRUM-28
- [ ] Scrolling loads exactly one further page at a time, with no duplicate or skipped rows
- [ ] Pull-to-refresh resets to page 1 and refreshes all three counts
- [ ] Loading, empty, search-empty and error states each render explicitly
- [ ] `ListScreenHeader` is shared by the Tickets and Customers screens; neither regressed
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" and "Target architecture" sections list `customers` as built

---

## Open questions — raise with design/product, do not resolve silently

1. **A – F / G – M / N – Z does not work for an Arabic-first app.** Figma places `أحمد محمد السيد` under "A – F" and `مريم إبراهيم حسن` under "G – M", which is placeholder text rather than a rule — Arabic letters are not in the Latin alphabet and the DB collation will not interleave them. Task 5 ships a fourth `other` bucket, sorted last, as the honest interim. The real options are (a) Arabic ranges — `أ – خ` / `د – ض` / `ط – ي` — shown alongside the Latin ones, (b) grouping by script first, or (c) dropping alphabetical grouping entirely, which is defensible given the list is searched far more than it is browsed. **This is the story's highest-priority question**; matrix row 23 produces the evidence.
2. **`initialsOf` changes meaning.** It returns first + last today; Figma's avatars use first + second on every multi-word name, Latin and Arabic alike. Task 2b changes it. `Avatar` is its only consumer and `Avatar` has no consumers before this story, so the change is free now and expensive later — but it is a core utility, and person names conventionally take first + last. Confirm, or add a second exported function and let each caller choose.
3. **"Recent" is undefined.** There is no `last_contacted_at` or `last_ticket_at` column on `customers` (`database.ts:212-223`), and no API endpoint in §3 for it. Task 3 ships `created_at` within 30 days, which means "recently **added**", not "recently **worked with**" — and for an agent on a call the second is far more useful. Getting it would need either a new column maintained on ticket write, or an ordering derived from the tickets table. Confirm the interim, or scope the real one.
4. **The avatar tints will not match the mock.** Figma uses several unnamed fills, one of them a solid brand blue with white text (`7:2120`) beside pale tints on its neighbours. Task 2a ships four tints built from existing semantic tokens, chosen deterministically from the name. Design should either accept that or add a proper `avatarTint` token set to `primitives.ts` + `colors.ts` — the same request story 03 filed for `statusPending`, and it joins the story 01 §15 flag list.
5. **Phone search matches the stored format, not the displayed one.** The DB holds `+201001234567` (API §3.3); the row renders `+20 10 1234 5678`. An agent typing what they see matches nothing. Fixing it properly means normalising both sides — stripping non-digits from the term and searching a normalised column or expression index — which is a schema question, not a screen question. Matrix row 13 records the current behaviour; BRD `:522` says the criterion is met by the stored form.
6. **Arabic search does not normalise orthography.** `ilike` is encoding-agnostic, as API §3.2 says, but أ / إ / آ / ا are distinct code points, so `احمد` will not find `أحمد` and `يوسف` will not find `يوسف` typed with a final `ى`. Agents type quickly on a call and will hit this. The fix is a normalised column or a Postgres `unaccent`-style function, which belongs with the deferred full-text work (§10) rather than here. Matrix row 11 records it; confirm BRD `:521` is satisfied by exact-orthography matching.
7. **Nothing invalidates `customerKeys.all` yet.** The root exists so US-006's create mutation can invalidate it, but until that story lands, a customer created outside the app is only picked up by pull-to-refresh or the 30-second `staleTime` (`query-client.ts:13`). That is acceptable now; flagged so it is not mistaken for a bug.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 06.**
