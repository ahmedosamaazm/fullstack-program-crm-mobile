# Story 10 — Customer profile view (Story: SCRUM-24)

> Intake: `.squad/stories/customers/SCRUM-24/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4310` (`Customers - Detail (Tickets)`); the screen body is `7:4315`.
> **The intake's node id points at the *Tickets*-tab variant of this screen, not the Info tab.** The shell it shows — header, identity block, three action buttons, the Info / Tickets / Notes tab bar — is exactly what this story builds and is fully verified below. The Info tab's own field list is read from the sibling `Customer Detail` frame on page `0:1` (row 1, between `Tickets - Detail` `7:1638` and the Notifications screen), whose node id the file did not surface through `get_metadata`. See **Open questions** flag 1.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). Supplies the token layer, `Text`/`Icon`, `Avatar`, `IconButton`, `Tab`/`TabBar`, `DetailRow`, `EmptyState`, `ErrorState`, `SkeletonList`. This story is the **first consumer of `DetailRow`** — `grep -rn '<DetailRow' src/` returns no hits today.
- **Story 05 completed** — [`05-story-customer-list-and-search-SCRUM-21.md`](05-story-customer-list-and-search-SCRUM-21.md). It created `src/features/customers/` and left the row tap as a documented no-op (`screens/CustomersScreen.tsx:33-35`, `// TODO(US-008)`). **This story is what that TODO was waiting for.**
- **Story 07 completed** — [`../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`](../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md). Not a data dependency: it is the **precedent** this story copies for a non-tab authenticated detail route (`src/app/tickets/[id].tsx`, registered at `src/app/_layout.tsx:67`), for the header + strip + `TabBar` + body layout, and for the `tel:`/`mailto:` deep links in `components/ContactStrip.tsx:58, 66`. It also left `ContactStrip.tsx:26-27` with a `// TODO(US-008)` no-op that **this story wires**.
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md), for `useAuth()` and the `AgentProfileWithOrg` shape task 2 mirrors.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/core/lib/supabase.ts` throws at import time otherwise.
- **Seeded data**: at least one customer with a non-null `email` **and** a populated `secondary_contacts` array; at least one with `email: null` and `secondary_contacts: []`; at least one whose `full_name` is Arabic. Without a populated `secondary_contacts` the story's first acceptance criterion (`docs/phase1_brd_1.md:559`) cannot be exercised at all, and the shape question in flag 3 cannot be answered.

---

## Story Goal

Tapping a customer row stops being a no-op and opens the record an agent reads while the customer is on the line. Concretely:

1. **A pushed detail route** — `src/app/customers/[id].tsx` — reached from the Customers list row and from the ticket-detail contact strip.
2. **An identity header**: back control, screen title, tinted initials avatar, the customer's name, their department · branch line, and Call / Email / History actions.
3. **A three-way tab bar** — **Info**, **Tickets**, **Notes** — present on the screen from this story onwards.
4. **The Info tab, fully built**: phone, email, secondary contacts, department, branch, and "customer since", each rendered explicitly rather than skipped when null.
5. **Tap-to-dial and tap-to-mail** on the phone and email values, not only on the header buttons.
6. **One query — `['customers', id]`** — deliberately shaped as the single cache entry story 11's create redirect lands on, story 12's edit form reads and writes, and SCRUM-25's Tickets tab extends. This is an explicit intake requirement, not an optimisation.
7. **Explicit loading, not-found and error states**, plus placeholder states for the two tabs this story does not build.

**Not in scope** — each has its own story: the **Tickets** tab's real content (US-009 / SCRUM-25 — a placeholder renders here), the **Notes** tab (US-010 / SCRUM-26, blocked on Storage, API §8 is still 🔨 — a placeholder renders here), editing (US-007, story 12), and creating (US-006, story 11). This story adds **no write path at all**.

---

## Context — Read These Files First

1. `src/features/tickets/screens/TicketDetailScreen.tsx` — all 152 lines. This is the screen shape to repeat: the `detail.isPending` → `isError || data === null` → content ladder (lines 40-58), `SafeAreaView` on `bgSurface` with `edges={['top']}`, a feature header component, then `TabBar` + `Tab` (lines 78-94), then a `flex: 1` body that branches per tab. **Note line 40** — `detail.isError || detail.data === null` — a `maybeSingle()` miss is not an error, and the not-found path must be handled explicitly.
2. `src/features/tickets/components/TicketDetailHeader.tsx` — the header this story's `CustomerDetailHeader` parallels: a back `IconButton`, a title, and trailing actions.
3. `src/features/tickets/components/ContactStrip.tsx` — all 78 lines. `Linking.openURL('tel:' + phone)` at line 58 and `mailto:` at line 66, with `disabled={!customer.email}` at line 65 guarding the null email. Task 5 reuses that exact discipline. **Lines 26-27 are the `// TODO(US-008)` no-op this story replaces** (task 7).
4. `src/features/tickets/api.ts:286-348` — `DETAIL_SELECT`, the private `TicketDetailRow` type, `localisedCategoryName` (lines 305-311), `.maybeSingle<Row>()`, and the mapper returning `null` on no row. `fetchCustomerDetail` (task 2) is the same shape end to end.
5. `src/features/auth/api.ts:60-102` — `localisedName(nameEn, nameAr)` (lines 61-65) and `fetchAgentProfileWithOrg`'s `departments(name_en, name_ar), branches(name_en, name_ar)` embed (lines 83-85). **This is the second private copy of the same helper in the tree** (the first is `tickets/api.ts:305`); task 1 promotes it to `core/` before adding a third.
6. `src/features/customers/api.ts` — all 114 lines, and `hooks.ts` — all 68 lines. The `customerKeys` object (`hooks.ts:16-21`) is what task 3 extends with `detail`. Note `customerKeys.all = ['customers']` is already the invalidation root, and that `all`, `list` and `count` use string segments — a UUID `id` can never collide with them.
7. `src/features/customers/screens/CustomersScreen.tsx:33-35` and `:120` — the `handleCustomerPress` no-op and its call site. Task 7 replaces the body with a `router.push`.
8. `src/core/components/DetailRow.tsx` — all 57 lines. `layout="inline"` puts the label and value on one line (44px min height); `layout="stacked"` puts the value under the label (66px). `valueSlot` overrides the value with a node — that is how task 5 makes the phone and email tappable without changing `core/`.
9. `src/core/types/database.ts:211-270` — the `customers` row. `phone: string` (**not** nullable), `email: string | null`, `secondary_contacts: Json` (**not** an array type — see flag 3), `department_id: string` and `branch_id: string` (both non-null), `created_at: string`. There is **no** `avatar_url` column, which is why `Avatar` is rendered from initials only.
10. `src/core/types/database.ts:117-143` (`branches`) and `:272-295` (`departments`) — both carry `name_en` / `name_ar`, exactly like `categories`. The `customers` → `branches` and `customers` → `departments` foreign keys are declared at `:250-269`, so the embeds in task 2 are unambiguous — **unlike** `tickets` → `profiles`, they each appear once, so no `!fkey` hint is needed.
11. `docs/phase1_api_reference.md:193-201` — §3.5. It returns `*,tickets(...)` in one request; this story uses the customer half and adds the two org embeds, and leaves the `tickets(...)` half to SCRUM-25.
12. `docs/phase1_brd_1.md:552-563` — US-008 and its four acceptance criteria. `## Done Criteria` mirrors them verbatim.
13. `src/app/_layout.tsx:63-73` — `RootNavigator`. `<Stack.Screen name="tickets/[id]" />` at line 67 is the registration task 7 copies for `customers/[id]`.
14. `eslint.config.js` — the `no-restricted-syntax` bans. The two places this story is most likely to trip them: a physical `marginLeft` in the header row, and importing `Text` from `react-native` in a new component file.

---

## Design spec (resolved from Figma node `7:4310`)

Structure, from `get_metadata` on `7:4310`:

```
CustomerDetailScreen 7:4315
├── 7:4316  header block (static)
│   ├── 7:4317  StatusBarUI                     — OS chrome, not built
│   ├── 7:4335  back row      (h 32)
│   │   ├── 91:1040  Back IconButton  32×32
│   │   └── 7:4339   "Customer Detail" title, 28h box
│   ├── 7:4342  identity row (h 60)
│   │   ├── 67:618  Avatar 44×44 at x=0
│   │   ├── 7:4346  name "Daniel Hartley" (24h) + "Finance · East Branch" (24h)
│   │   └── 7:4353  actions 124×36 → 91:1045 Call · 91:1049 Email · 91:1053 History, 36×36, gap 8
│   └── 7:4380  tab row (h 50.6)
│       └── 7:4365 → 91:1057 Info · 91:1060 Tickets · 91:1063 Notes, 38h, gaps 24 / 24
├── 7:4381  body (the selected tab's content)
└── 60:331  BottomNav
```

Both this frame and `Tickets - Detail` (`7:1638`) draw a `BottomNav`. Story 07 **deliberately did not** — it made the ticket detail a sibling of `(tabs)` so the screen pushes over the tab bar with its own back affordance. This story follows story 07 rather than the render, so the two detail screens behave identically. Recorded as **Open questions** flag 2; do not silently "fix" it in one screen only.

Info-tab content, read from the sibling `Customer Detail` frame's render (values are the mock's, labels are the spec):

| Label | Value in the mock | Layout |
|---|---|---|
| Phone | `+20 10 1234 5678` | inline, tappable |
| Email | `d.hartley@meridian.com` | inline, tappable |
| Secondary contact | `Sarah Hartley` / `+20 11 9988 7766` | **stacked** — the label sits above a two-line value |
| Department | `Finance` | inline |
| Branch | `East Branch` | inline |
| Customer since | `March 2021` | inline |

| Element | Figma | Token / component |
|---|---|---|
| Screen background | surface | `colors.bgSurface` |
| Horizontal inset, everywhere | 16 | `spacing.lg` |
| Back button | 32×32 | `<IconButton icon="arrowBack" size={32} variant="ghost" />` |
| Back → title gap | 10 → snap to 8 | `spacing.sm` |
| "Customer Detail" | 28h box, semibold | `<Text variant="title" weight="semibold">` |
| Title row → identity row gap | 0 (rows abut) | none; identity row carries `paddingTop: spacing.md` |
| Avatar | 44 circle | `<Avatar size={44} tint={tintForName(name)} />` — the list's tint function, so the same customer keeps one colour across both screens |
| Avatar → text gap | 12 | `spacing.md` |
| Customer name | 24h box, semibold | `<Text variant="body" weight="semibold" numberOfLines={1}>` |
| "Finance · East Branch" | 20h, muted | `<Text variant="caption" tone="muted" numberOfLines={1}>` |
| Action buttons | 36×36, gap 8 | `<IconButton size={36} variant="ghost" />` ×3 |
| Action icons | phone / mail / clock | `phone`, `mail`, `clock` — all three already in `Icon.tsx:69, 70, 76` |
| Tab bar | 38h, gap ~24 | `<TabBar>` + three `<Tab>` — as `TicketDetailScreen.tsx:78-94` |
| Tab row top padding | 12 | `spacing.md` |
| Info rows | 44h inline / 66h stacked | `<DetailRow layout="inline" />` / `layout="stacked"` |
| Row divider | hairline | `StyleSheet.hairlineWidth`, `colors.borderSubtle` |
| Header → body separator | hairline | `StyleSheet.hairlineWidth`, `colors.borderSubtle` |

`get_variable_defs` on this subtree returns the same legacy off-scale type values (`font size/13_5`, `line height/17_25`) stories 01, 03, 04 and 05 all flagged. **Snap to the scale tokens tabled above.** The two exceptions are `size={44}` on the avatar and `size={36}` on the action buttons — dimensions, not type tokens, and `IconButton`'s default is already 36.

---

## Implementation tasks

### 1 — Promote `localisedName` to `core/`

Two private copies of this function already exist — `src/features/auth/api.ts:61-65` (`localisedName(nameEn, nameAr)`) and `src/features/tickets/api.ts:305-311` (`localisedCategoryName(row)`). Task 2 needs a third. Hard rule 2 — "any reusable logic … used in 2+ places goes in `core/`" — makes this a promotion, exactly as story 05 promoted `sanitizeSearchTerm` into `core/utils/search.ts`.

**Create file: `src/core/utils/locale-name.ts`**

```ts
import { currentLocale } from '@/core/lib/i18n';

/**
 * Picks the localised half of a `{ name_en, name_ar }` pair, falling back to the
 * other language when the preferred one is empty. Every reference table in the
 * schema — `departments`, `branches`, `categories` — carries this exact shape.
 *
 * Promoted from `features/auth/api.ts` and `features/tickets/api.ts` (plan
 * `10-story-customer-profile-view-SCRUM-24.md` task 1) once
 * `features/customers/api.ts` became a third consumer (hard rule 2).
 */
export function localisedName(row: { name_en: string; name_ar: string } | null): string | null {
  if (!row) return null;
  const preferred = currentLocale() === 'ar' ? row.name_ar : row.name_en;
  const fallback = currentLocale() === 'ar' ? row.name_en : row.name_ar;
  return preferred || fallback || null;
}
```

Note the signature: it takes the **row or null** and returns **string or null**, matching `localisedCategoryName`'s contract rather than `auth`'s two-argument form. That is the shape both remaining call sites want.

Export it from `src/core/utils/index.ts` beside `sanitizeSearchTerm`.

**Then migrate both existing call sites in this same change:**

- `src/features/tickets/api.ts` — delete `localisedCategoryName` (lines 305-311), import `localisedName` from `@/core/utils`, and change line 344 to `categoryName: localisedName(data.categories)`.
- `src/features/auth/api.ts` — delete `localisedName` (lines 60-65), import the core one, and change lines 100-101 to `localisedName(data.departments)` / `localisedName(data.branches)`. **The `? … : null` ternaries wrapping both calls go away** — the new signature already handles null.

Verification steps 5 and 6 are the regression gates for both.

### 2 — The detail query

**File: `src/features/customers/types.ts`**

Add, below `CustomerListItem`:

```ts
/** One entry in a customer's `secondary_contacts` array (API §3.3's shape). */
export type SecondaryContact = {
  /** `'phone'` | `'email'` in the seed data; kept open — this is untyped `Json` in the DB. */
  type: string;
  value: string;
  label: string | null;
};

/** The §3.5 projection, camelCased. Wider than `CustomerListItem` — this is one customer. */
export type CustomerDetail = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  secondaryContacts: SecondaryContact[];
  departmentName: string | null;
  branchName: string | null;
  createdAt: string;
};
```

**File: `src/features/customers/api.ts`**

`secondary_contacts` is typed `Json` (`database.ts:218`), which is `string | number | boolean | null | { [k: string]: Json } | Json[]`. It is **not** an array type, so it cannot be assigned to `SecondaryContact[]` — and it cannot be trusted at runtime either, since a hand-edited row can hold an object, a string, or entries missing `value`. Parse it defensively at the boundary; that is the data layer's job (CLAUDE.md §A.3), not the screen's.

```ts
const DETAIL_SELECT =
  'id, full_name, phone, email, secondary_contacts, created_at, ' +
  'departments(name_en, name_ar), branches(name_en, name_ar)';

type CustomerDetailRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  secondary_contacts: Json;
  created_at: string;
  departments: { name_en: string; name_ar: string } | null;
  branches: { name_en: string; name_ar: string } | null;
};

/**
 * `secondary_contacts` is `Json` in the schema, not a typed array. Anything that
 * is not an array of objects carrying a non-empty string `value` is dropped
 * rather than rendered — a malformed row must not blank the whole profile.
 */
export function parseSecondaryContacts(value: Json): SecondaryContact[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, Json>;
    if (typeof record.value !== 'string' || record.value.trim() === '') return [];
    return [
      {
        type: typeof record.type === 'string' ? record.type : 'phone',
        value: record.value,
        label: typeof record.label === 'string' && record.label ? record.label : null,
      },
    ];
  });
}

/**
 * One request for the whole Info tab — the intake is explicit that name, phone,
 * email, secondary contacts, department, branch and created_at must not cost a
 * call each. `departments` and `branches` are each referenced once from
 * `customers` (`database.ts:250-269`), so neither embed needs an `!fkey` hint —
 * unlike `tickets` → `profiles`, which does (`tickets/api.ts:296-299`).
 *
 * Returns `null` on no row rather than throwing: RLS refusing a customer from
 * another branch and a deleted id are indistinguishable here, and both are a
 * not-found state to the agent, not an error banner.
 */
export async function fetchCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const { data, error } = await supabase
    .from('customers')
    .select(DETAIL_SELECT)
    .eq('id', customerId)
    .maybeSingle<CustomerDetailRow>();

  if (error) throw toAppError(error);
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    email: data.email,
    secondaryContacts: parseSecondaryContacts(data.secondary_contacts),
    departmentName: localisedName(data.departments),
    branchName: localisedName(data.branches),
    createdAt: data.created_at,
  };
}
```

`Json` is imported from `@/core/types/database`; `localisedName` from `@/core/utils` (task 1).

### 3 — The hook and the key

**File: `src/features/customers/hooks.ts`**

Extend `customerKeys` (currently lines 16-21) with one entry, and add the hook:

```ts
export const customerKeys = {
  all: ['customers'] as const,
  list: (filter: CustomerFilter, search: string) =>
    ['customers', 'list', filter, search] as const,
  count: (filter: CustomerFilter) => ['customers', 'count', filter] as const,
  /**
   * `['customers', <uuid>]` — a customer id can never collide with the
   * `'list'` / `'count'` segments above. This is the ONE cache entry story 11's
   * create redirect lands on, story 12's edit form reads and invalidates, and
   * SCRUM-25's Tickets tab extends. Do not add a second detail query.
   */
  detail: (customerId: string) => ['customers', customerId] as const,
};

export function useCustomerDetail(customerId: string) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => fetchCustomerDetail(customerId),
    enabled: Boolean(customerId),
  });
}
```

Mirrors `useTicketDetail` (`features/tickets/hooks.ts:143-149`) exactly, including the `enabled` guard against an empty route param.

### 4 — `CustomerDetailHeader`

**Create file: `src/features/customers/components/CustomerDetailHeader.tsx`**

```tsx
export type CustomerDetailHeaderProps = {
  customer: CustomerDetail;
  onBack: () => void;
  onHistoryPress: () => void;
};
```

Two stacked rows inside a `View` with `paddingHorizontal: theme.spacing.lg`, on `colors.bgSurface`, closed by a hairline `borderBottomColor: theme.colors.borderSubtle`:

1. **Back row** — `<IconButton icon="arrowBack" size={32} variant="ghost" onPress={onBack} accessibilityLabel={t('common.back')} />` then `<Text variant="title" weight="semibold">{t('customerDetail.title')}</Text>`, `gap: theme.spacing.sm`.
2. **Identity row** — `flexDirection: 'row'`, `alignItems: 'center'`, `gap: theme.spacing.md`, `paddingTop: theme.spacing.md`:
   - `<Avatar name={customer.fullName} size={44} tint={tintForName(customer.fullName)} />`
   - a `flex: 1, minWidth: 0` block: name (`variant="body" weight="semibold" numberOfLines={1}`) over the org line.
   - the actions block: `Call` (`icon="phone"`), `Email` (`icon="mail"`, `disabled={!customer.email}`), `History` (`icon="clock"`), `gap: theme.spacing.sm`.

The tab bar is **not** part of the header — the screen owns the selected tab.

The org line is built the way `ContactStrip.tsx:22` builds its subtitle — **filter before joining**, so a null department or branch never leaks a `· undefined` into the UI:

```tsx
const org = [customer.departmentName, customer.branchName].filter(Boolean).join(' · ');
```

`minWidth: 0` on the text block is not optional: without it a long customer name pushes the three action buttons off the trailing edge instead of ellipsising (the same guard `CustomerRow.tsx:58` and `ContactStrip.tsx:42` already carry).

Call and Email use `Linking.openURL` directly, exactly as `ContactStrip.tsx:58, 66`:

```tsx
onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
onPress={() => void Linking.openURL(`mailto:${customer.email}`)}
```

`History` is `onHistoryPress` — the screen passes a handler that selects the **Tickets** tab. See **Open questions** flag 4; the Figma component gives it no defined behaviour.

### 5 — `CustomerInfoTab`

**Create file: `src/features/customers/components/CustomerInfoTab.tsx`**

Props: `{ customer: CustomerDetail }`. A `ScrollView` of `DetailRow`s, each separated by a hairline. Every row renders **explicitly when the value is missing** — no row is silently dropped, because a blank profile field is information an agent needs (CLAUDE.md §A.3: "handle null, empty, loading and error states explicitly").

| Row | `layout` | Value | Missing-value behaviour |
|---|---|---|---|
| `t('customerDetail.info.phone')` | inline | `valueSlot` — a tappable `tel:` link | never missing (`phone` is non-null) |
| `t('customerDetail.info.email')` | inline | `valueSlot` — a tappable `mailto:` link | `t('customerDetail.info.noEmail')`, `tone="muted"`, not tappable |
| `t('customerDetail.info.secondaryContacts')` | stacked | one line per contact | `t('customerDetail.info.noSecondaryContacts')`, `tone="muted"` |
| `t('customerDetail.info.department')` | inline | `customer.departmentName` | `t('customerDetail.info.unknown')` |
| `t('customerDetail.info.branch')` | inline | `customer.branchName` | `t('customerDetail.info.unknown')` |
| `t('customerDetail.info.customerSince')` | inline | `formatDate(customer.createdAt)` | never missing (`created_at` is non-null) |

**The phone value must be bidi-isolated.** `CustomerRow.tsx:20-28` already documents why: `+20 10 1234 5678` inside an Arabic row renders with the `+` and digit groups reordered unless the run is wrapped in U+2066 (LRI) … U+2069 (PDI), and `direction: 'ltr'` is not applied per-node on Android. That helper is currently **private to `CustomerRow.tsx`**. This story is its second consumer, so promote it in the same change:

**File: `src/core/utils/format.ts`** — add, and export from `src/core/utils/index.ts`:

```ts
/**
 * Wraps a value in U+2066 (LRI) … U+2069 (PDI) so a phone number or reference
 * keeps its own left-to-right run inside an RTL line. `direction: 'ltr'` is not
 * an option — React Native does not apply it per-node on Android.
 *
 * Promoted from `features/customers/components/CustomerRow.tsx` (plan
 * `10-story-customer-profile-view-SCRUM-24.md` task 5) on its second consumer.
 */
export function isolateLtr(value: string): string {
  return `⁦${value}⁩`;
}
```

Then delete the local copy from `CustomerRow.tsx:26-28` and import it. It applies to the phone rows and to every secondary contact whose `type` is `'phone'`.

The tappable value slot is a `Pressable` wrapping a `<Text variant="callout" tone="link">`, with `accessibilityRole="link"` and an `accessibilityLabel` naming the action — not just the number:

```tsx
<Pressable
  onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
  accessibilityRole="link"
  accessibilityLabel={t('customerDetail.info.callLabel', { phone: customer.phone })}
>
  <Text variant="callout" tone="link">{isolateLtr(customer.phone)}</Text>
</Pressable>
```

Secondary contacts render one stacked block per entry: the `label` (or `t('customerDetail.info.contactFallbackLabel')` when null) as a muted caption, and the `value` beneath it as a tappable `tel:`/`mailto:` link chosen from `contact.type`. An unrecognised `type` renders as **plain text, not a link** — an unknown scheme handed to `Linking.openURL` throws on iOS.

### 6 — `CustomerDetailScreen`

**Create file: `src/features/customers/screens/CustomerDetailScreen.tsx`**

Props: `{ customerId: string }` — the same shape as `TicketDetailScreenProps` (`tickets/screens/TicketDetailScreen.tsx:23`).

```tsx
type ActiveTab = 'info' | 'tickets' | 'notes';
```

State ladder, copied from `TicketDetailScreen.tsx:40-58` including its subtlety:

```tsx
const detail = useCustomerDetail(customerId);

if (detail.isPending) { /* SkeletonList count={6} inside a padded SafeAreaView */ }
if (detail.isError || !detail.data) { /* see below — two DISTINCT renders */ }
```

`detail.data === null` is the **not-found** case, not a failure — a customer another branch owns, or a deleted id. It renders `ErrorState` with `title={t('customerDetail.notFound')}` and **no** `onRetry`, distinct from the error branch, which keeps `onRetry={() => detail.refetch()}`. Collapsing the two shows an agent a retry button that can never succeed.

Body, per tab:

- `info` → `<CustomerInfoTab customer={detail.data} />`
- `tickets` → `<EmptyState icon="tickets" title={t('customerDetail.empty.tickets')} />` — SCRUM-25 replaces this.
- `notes` → `<EmptyState icon="file" title={t('customerDetail.empty.notes')} />` — SCRUM-26 replaces this; it is blocked on Storage (API §8 is 🔨), so **do not wire anything here.**

`onHistoryPress` on the header is `() => setTab('tickets')`.

**File: `src/features/customers/index.ts`** — export `CustomerDetailScreen`, `useCustomerDetail`, `parseSecondaryContacts`, and the `CustomerDetail` / `SecondaryContact` types. `customerKeys` is already exported. Keep the file's existing grouping and alphabetical order.

### 7 — The route, and the two no-ops it closes

**Create file: `src/app/customers/[id].tsx`**

```tsx
import { useLocalSearchParams } from 'expo-router';

import { CustomerDetailScreen } from '@/features/customers';

export default function CustomerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomerDetailScreen customerId={id} />;
}
```

Byte-for-byte the shape of `src/app/tickets/[id].tsx` — hard rule 1 (route files stay thin).

**File: `src/app/_layout.tsx`** — register it inside the existing `Stack.Protected` guard, beside line 67:

```tsx
<Stack.Screen name="tickets/[id]" />
<Stack.Screen name="customers/[id]" />
```

**File: `src/features/customers/screens/CustomersScreen.tsx`** — replace lines 33-35:

```tsx
function handleCustomerPress(id: string) {
  router.push(`/customers/${id}`);
}
```

Delete the `// TODO(US-008)` comment **and** the `eslint-disable-next-line @typescript-eslint/no-unused-vars` above it; add `import { router } from 'expo-router';`. The disable comment must go — leaving it suppresses a real warning on the next edit.

**File: `src/features/tickets/components/ContactStrip.tsx`** — replace the `// TODO(US-008)` no-op at lines 26-27:

```tsx
onPress={() => router.push(`/customers/${customer.id}`)}
```

`customer.id` is already on the strip's prop (`TicketDetail['customer']` carries `id` — `tickets/types.ts:36`), so no type change is needed. This closes the acceptance criterion story 07 recorded as unmeetable (`docs/phase1_brd_1.md:648`).

### 8 — Copy

**Files: `src/core/lib/i18n/locales/en.json` and `ar.json`** — add a `customerDetail` namespace between `customers` and `profile`, and one `common.back` key.

```json
"customerDetail": {
  "title": "Customer Detail",
  "call": "Call",
  "email": "Email",
  "history": "Ticket history",
  "notFound": "This customer isn't available.",
  "tabs": { "info": "Info", "tickets": "Tickets", "notes": "Notes" },
  "info": {
    "phone": "Phone",
    "email": "Email",
    "secondaryContacts": "Secondary contact",
    "department": "Department",
    "branch": "Branch",
    "customerSince": "Customer since",
    "noEmail": "No email on file",
    "noSecondaryContacts": "None",
    "unknown": "Unknown",
    "contactFallbackLabel": "Contact",
    "callLabel": "Call {{phone}}",
    "emailLabel": "Email {{email}}"
  },
  "empty": {
    "tickets": "Ticket history isn't available yet.",
    "notes": "Notes aren't available yet."
  }
}
```

`common.back` — `"Back"` / `"رجوع"`. `ticketDetail.back` already exists (`en.json:138`) but belongs to the ticket namespace; a shared control gets a shared key. **Do not** reach into `ticketDetail` from a customers component.

Arabic values are required in `ar.json` in the same shape. The two empty-state strings are **this plan's wording, not the designer's** — Figma shows both tabs populated. Flag 5.

### 9 — Update the instruction files

**File: `CLAUDE.md`** — "Project status": customer detail is no longer open. Add `src/app/customers/[id].tsx` to the route list beside `src/app/tickets/[id].tsx`, and note that `customers` now owns a detail screen whose Tickets and Notes tabs are placeholders. **File: `AGENTS.md`** needs no change — its architecture section is already accurate.

---

## Edge Cases & Failure Modes

- **`secondary_contacts` is not an array.** A hand-edited row can hold `{}`, `"[]"` or `null`. `parseSecondaryContacts` (task 2) returns `[]` for anything that is not an array, and drops entries without a non-empty string `value`. Enforced in `features/customers/api.ts`; the screen never sees a malformed entry.
- **A contact with an unknown `type`.** Renders as plain text, not a link (task 5). `Linking.openURL` with an unhandled scheme **throws** on iOS and does nothing on Android — the asymmetry is why the guard lives in `CustomerInfoTab` rather than in a `catch`.
- **`email` is null.** The header's Email button is `disabled` (`ContactStrip.tsx:65`'s pattern) and the Info row renders "No email on file" as muted, non-tappable text. `mailto:null` must never be constructed.
- **The customer is not visible to this agent.** RLS returns zero rows; `.maybeSingle()` resolves `data: null` with **no error**. Handled by the `!detail.data` branch in `CustomerDetailScreen` (task 6) as a not-found state without a retry button.
- **A malformed route param.** `/customers/not-a-uuid` makes PostgREST reject the `eq` filter with `22P02`. `toAppError`'s `readStatus` (`core/utils/errors.ts:48-57`) parses **all-digit** code strings only — `'22P02'` is not one, so `status` is `undefined` and the kind is `unknown`. The error branch renders, which is correct. No extra handling.
- **An empty route param.** `useLocalSearchParams` can yield `undefined` on the first frame; `useCustomerDetail`'s `enabled: Boolean(customerId)` keeps the query from firing, and `isPending` holds the skeleton. Enforced in `hooks.ts` (task 3).
- **A very long customer name.** `numberOfLines={1}` plus `minWidth: 0` on the flex child (task 4) — without the second, the three action buttons are pushed off-screen instead of the name ellipsising.
- **Arabic layout with a Latin phone number.** `isolateLtr` (task 5) is the only thing keeping `+20 10 1234 5678` from rendering with its `+` at the wrong end. It applies to the Info tab's tappable number **and** to every phone-typed secondary contact.
- **The dialler is absent.** On a tablet with no telephony, `tel:` rejects. `void Linking.openURL(...)` swallows it the same way `ContactStrip.tsx:58` already does — accepted, and identical to the behaviour story 07 shipped.
- **The list and the detail disagree.** Both live under `['customers', …]` but in different entries; a customer edited elsewhere shows stale data on one until `staleTime` (30s, `query-client.ts`) elapses or the agent pulls to refresh. Acceptable until story 12 adds a write path that invalidates both.
- **Deep-linking straight to `/customers/<id>` while signed out.** `Stack.Protected` (`_layout.tsx:65`) keeps the route unmounted; the login screen renders. Registering the screen **inside** the guard (task 7) is what makes this true — registering it outside would leak the screen.

---

## Test Plan

**There is no test runner in this repo** — no Jest, no `test` script (AGENTS.md). The list below is what to write when one is installed; the manual matrix underneath is the actual gate today.

### Manual test matrix

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Any customer | Tap a row on the Customers tab | The detail screen pushes; back returns to the list with scroll position kept |
| 2 | Any | Read the header | Avatar, name, `Department · Branch`, three action buttons |
| 3 | Customer whose avatar is green on the list | Compare list and detail | The same tint — `tintForName` is stable |
| 4 | Any | Tap the header Call button | The dialler opens with the number prefilled (BRD `:560`) |
| 5 | Customer with an email | Tap the header Email button | The mail client opens (BRD `:561`) |
| 6 | Customer with `email: null` | Read the header | The Email button is visibly disabled and does nothing |
| 7 | Any | Read the tab bar | **Info**, **Tickets**, **Notes** all present, Info selected (BRD `:562`) |
| 8 | Any | Tap Tickets | Placeholder empty state, no crash |
| 9 | Any | Tap Notes | Placeholder empty state, no crash |
| 10 | Any | Tap the header History button | The Tickets tab is selected |
| 11 | Customer with secondary contacts | Read the Info tab | Every contact renders with its label and value (BRD `:559`) |
| 12 | Customer with `secondary_contacts: []` | Read the Info tab | The row is present and reads "None" — not hidden |
| 13 | A row hand-edited to `secondary_contacts: {}` | Open the profile | "None"; no crash, no blank screen |
| 14 | A contact entry missing `value` | Open the profile | That entry is dropped; the others render |
| 15 | Any | Tap the phone value in the Info tab | The dialler opens |
| 16 | Customer with an email | Tap the email value | The mail client opens |
| 17 | Customer with `email: null` | Read the Info tab | "No email on file", muted, not tappable |
| 18 | Any | Read "Customer since" | A localised date; Arabic-Indic digits under العربية |
| 19 | A ticket whose customer is seeded | Open the ticket, tap the contact strip | The customer profile opens — the story-07 TODO |
| 20 | Any | list → detail → ticket detail → contact strip | No navigation loop; back unwinds cleanly |
| 21 | `/customers/00000000-0000-0000-0000-000000000000` | Deep-link it | Not-found state, **no retry button** |
| 22 | `/customers/nonsense` | Deep-link it | Error state **with** retry; no crash |
| 23 | Airplane mode | Open a profile | `ErrorState` with retry; `OfflineBanner` visible |
| 24 | Airplane mode → online | Tap retry | The profile loads |
| 25 | Switch to العربية, restart | Open a profile | Layout mirrors; avatar leads on the right; the back chevron points the right way |
| 26 | العربية | Read the phone | `+20 10 1234 5678` reads left-to-right, `+` first — the LRI/PDI check |
| 27 | العربية | Read Department / Branch | Arabic names — `localisedName` picks `name_ar` |
| 28 | Toggle system dark mode | Open a profile | Header, rows, dividers and links all legible |
| 29 | Signed out | Deep-link `/customers/<id>` | The login screen, not the profile |
| 30 | Any | Open the Customers list, the Tickets list, Home, a ticket detail | All four still work — the task 1 and task 5 regression gates |

### To write when a runner exists

1. **Unit — `src/features/customers/api.test.ts`** · `parseSecondaryContacts` returns `[]` for `null`, `{}`, `"[]"`, `42` and `[]`.
2. **Unit — `src/features/customers/api.test.ts`** · it drops entries that are not objects, are arrays, or have a non-string / empty `value`, and keeps the rest of the array.
3. **Unit — `src/features/customers/api.test.ts`** · it defaults a missing `type` to `'phone'` and a missing or empty `label` to `null`.
4. **Unit — `src/core/utils/locale-name.test.ts`** · `localisedName` picks `name_ar` under `ar` and `name_en` under `en`; falls back to the other when the preferred is `''`; returns `null` for `null` and for `{ name_en: '', name_ar: '' }`.
5. **Unit — `src/core/utils/format.test.ts`** · `isolateLtr` wraps in U+2066 / U+2069 and leaves an empty string wrapped-but-empty. The regression guard for the task 5 promotion.
6. **Unit — `src/features/customers/hooks.test.ts`** · `customerKeys.detail(id)` is `['customers', id]` and does not collide with `customerKeys.list('all', '')`; `customerKeys.all` invalidates both.
7. **Integration — `src/features/customers/api.test.ts`** · `fetchCustomerDetail` returns `null` (not a throw) when `maybeSingle` resolves `{ data: null, error: null }`, and throws an `AppError` when `error` is set.
8. **Unit — `src/features/customers/components/CustomerInfoTab.test.tsx`** · a `null` email renders the muted fallback and **no** `accessibilityRole="link"` node.
9. **Unit — `src/features/customers/components/CustomerDetailHeader.test.tsx`** · a null `departmentName` yields `"East Branch"`, never `"· East Branch"` — the filter-before-join guard.
10. **Unit — `src/core/lib/i18n/locales.test.ts`** (proposed in story 02, still unwritten) · `en.json` and `ar.json` key sets match, Arabic plural forms exempted. This is the **fifth** story that would have benefited.

---

## Verification Steps

1. **The two embeds resolve without an `!fkey` hint.** Before writing the screen, run the select and confirm PostgREST does not report an ambiguous relationship — `tickets` → `profiles` needed a hint (`tickets/api.ts:296-299`) and this is the same class of query:
   ```bash
   curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/customers?select=id,full_name,phone,email,secondary_contacts,created_at,departments(name_en,name_ar),branches(name_en,name_ar)&id=eq.$CUSTOMER_ID"
   ```
   Also read the real shape of `secondary_contacts` in the response and confirm it against `SecondaryContact` in task 2 — **this is the evidence flag 3 needs**, and it decides whether story 12's editor writes `{type,value,label}` or `{name,phone}`.
2. **Typecheck:** `npm run typecheck` in the repo root — zero errors. The generated `Database` types make a wrong embed shape or a mistyped column fail here, and the `Json` → `SecondaryContact[]` narrowing in task 2 is exactly what `strict` is for.
3. **Lint:** `npm run lint` — zero errors. The gate for hard rules 2-5: a physical `marginLeft` in the header row, a `Text` imported from `react-native` in either new component, a deep `@/features/customers/api` import, or a `core/` → `features/` import all fail here.
4. **Frontend runs:** `npm start`, press `a` (Android) and `i` (iOS). Sign in and walk the manual matrix.
5. **Regression — ticket detail:** open a ticket and confirm the **category name** still renders on the contact strip. Task 1 deleted `localisedCategoryName` and rerouted that value through `core/`; a wrong argument shape shows as a silently blank subtitle, not an error.
6. **Regression — Home:** open Home and confirm the greeting still shows department and branch. Task 1 also rewrote `fetchAgentProfileWithOrg`'s two call sites, including dropping their `? … : null` ternaries.
7. **Regression — Customers list:** confirm rows still render the bidi-isolated phone. Task 5 moved `isolateLtr` out of `CustomerRow.tsx`.
8. **RTL:** switch to العربية, then **fully restart** — `applyDirection` (`src/core/lib/i18n/index.ts`) latches direction at startup. Matrix rows 25-27.
9. **Deep-link:** `npx uri-scheme open azm://customers/<id> --android` (and `--ios`) while signed in, then again after signing out. Matrix rows 21, 22, 29.
10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:559-562`.

- [ ] Given a customer, when I open their profile, then **name, phone, email and secondary contacts** display
- [ ] Given a phone number, when I tap it, then the **dialler** opens
- [ ] Given an email, when I tap it, then the **mail client** opens
- [ ] Given the profile, when displayed, then **Info, Tickets and Notes** tabs are present

Plus, from the intake and the design:

- [ ] The whole Info tab comes from **one** request — no per-field calls
- [ ] The query is keyed `['customers', id]`, the single entry story 11's redirect, story 12's editor and SCRUM-25 all share
- [ ] Department and branch render **localised**, via the promoted `core/utils/locale-name.ts`
- [ ] `localisedName` has exactly one definition in the tree; `features/auth/api.ts` and `features/tickets/api.ts` both consume it
- [ ] `isolateLtr` has exactly one definition in the tree
- [ ] Null email, empty secondary contacts and a malformed `secondary_contacts` each render explicitly and never crash
- [ ] Loading, not-found and error states are three distinct renders — not-found offers **no** retry
- [ ] Tapping a customer row on the Customers tab opens the profile; the `TODO(US-008)` and its eslint-disable are gone
- [ ] Tapping the contact strip on a ticket opens the profile; that `TODO(US-008)` is gone
- [ ] The Tickets and Notes tabs render placeholders and are wired to nothing
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" lists the customer detail route as built

---

## Open questions — raise with design/product, do not resolve silently

1. **The intake's Figma node is the wrong variant.** `7:4310` is `Customers - Detail (Tickets)` — the tab this story explicitly does **not** build. The Info-tab frame exists on page `0:1` but its node id did not surface through `get_metadata`, so the six Info rows in the design spec are read off the page render rather than from a node's own metadata and variable definitions. Ask design for the Info frame's link before sign-off; the row **order** and the stacked-vs-inline choice on "Secondary contact" are the two things most likely to be wrong.
2. **Figma draws the bottom nav on this screen; this story does not.** Both `7:4310` and `Tickets - Detail` (`7:1638`) render `BottomNav`, and story 07 shipped the ticket detail as a sibling of `(tabs)` anyway, pushing over the tab bar. This story follows story 07 so the two detail screens behave alike. If design wants the tab bar retained, **both** screens move inside `(tabs)`, and that is a routing change, not a styling one.
3. **The secondary-contact shape is contradictory.** API §3.3's example payload is `[{"type":"phone","value":"+201112223333","label":"Work"}]`; Figma's create form (`7:2799`, nodes `99:942` / `99:946`) collects **"Contact name"** and **"Phone number"**. Task 2's `SecondaryContact` follows the API, mapping the form's name → `label` and phone → `value`. That is a reasoned guess until verification step 1 reads a real row. **Story 12 cannot be written correctly until this is settled** — it is the story that writes the array.
4. **The History button has no defined behaviour.** `91:1053` (a clock glyph) sits beside Call and Email in the header. Task 4 wires it to select the Tickets tab, which is the only plausible destination in this app. Confirm, or say what it should do — a second control that duplicates a tab is arguably worth deleting.
5. **Two empty states are this plan's wording, not the designer's.** Figma shows the Tickets tab populated and gives no Notes frame at all. "Ticket history isn't available yet." and "Notes aren't available yet." need copy review in both languages, and both are temporary — SCRUM-25 and SCRUM-26 replace them.
6. **"Customer since" has no format spec.** The mock reads `March 2021` — month and year. `formatDate` (`core/utils/format.ts:13`) produces day, month **and** year. Task 5 uses `formatDate` rather than adding a seventh formatter for one label. If design wants month + year, that is a new `formatMonthYear` in `core/utils/format.ts`, and it should be requested rather than invented here.
7. **Nothing invalidates `customerKeys.detail` yet.** The key exists so story 12's edit mutation can invalidate it. Until then a customer changed outside the app is only picked up after `staleTime` or a fresh mount. Flagged so it is not mistaken for a caching bug — the same shape story 05 recorded for `customerKeys.all` (its flag 7), and **story 11 is what closes that one.**

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 11.**


## **[Corrected 2026-09-01 — design audit]**

This plan was written against the **Tickets** frame because the Info frame's node id was not
available at the time — recorded in its own open question 1. Frame `7:3544` has since been
read directly and CONTRADICTS the table in two places:

| Element | Plan said | Figma `7:3544` binds |
|---|---|---|
| Info row value tone | `tone="link"` | **`colors.text`** |
| Info row value type | `caption` 12/18 | **14/20** |

These are design-confirmation questions, not defects — do not "fix" them unilaterally.

Also missing from this plan and now implemented: `91:812 InfoCard` (surface, `radius.md`,
`elevation.e2`) over a `bgSurfaceSunken` body. The plan described the rows but never the card
they sit on, so the tab shipped with no figure/ground at all. And `91:867`/`871`/`875`
(Call / Email / History) are `Button type=IconTonal`, not ghost — the back button `91:862`
is correctly `type=Icon`.
