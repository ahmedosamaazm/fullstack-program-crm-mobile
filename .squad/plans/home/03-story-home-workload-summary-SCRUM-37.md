# Story 03 — Home workload summary (Story: SCRUM-37)

> Intake: `.squad/stories/home/SCRUM-37/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:8` (`Home - Dashboard`); the screen body is `7:13`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). This story consumes the token layer, `Text`/`Icon`, `SectionHeader` (`variant="link"` is the "View all" header verbatim), `EmptyState`, `ErrorState`, `Skeleton`/`SkeletonList`, `FAB` and `IconButton`.
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md). It created `src/features/`, the barrel convention, and the `Stack.Protected` guard this story re-parents. `useAuth()` supplies the `session.user.id` every query below is keyed on.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/core/lib/supabase.ts:11-16` throws at import time otherwise.
- **Seeded data** for the signed-in agent: at least one assigned ticket, one unassigned ticket in the agent's department/branch, and one ticket with `resolved_at` set to today. Without them the screen renders correctly but every panel shows its empty state.

---

## Story Goal

An agent signs in and lands on Home, which answers "where do I start?" before any navigation. Concretely:

1. **A greeting header** — "Good morning, Amara" (time-of-day bucket + first name) over "Customer Support · East Branch" (department · branch), with a notification bell in the trailing corner.
2. **Three workload counts** in a stat row — **My open**, **Unassigned**, **Resolved today** — each an icon, a number, and a label.
3. **A reserved slot beneath the stat row** for the SLA alerts a later story adds. This is an explicit acceptance criterion (`docs/phase1_brd_1.md:742`), not decoration.
4. **A "MY TICKETS" preview** — up to five tickets ordered **priority then age**, each row showing a priority bar, subject, reference · customer, short relative age, and a status badge. "View all" opens the Tickets tab.
5. **An "UNASSIGNED" preview** — up to three claimable tickets, each with an inline **Claim** button. Claiming removes the row from Unassigned, adds it to My tickets, and moves all three counts in one pass.
6. **A bottom tab bar** — Home, Tickets, Customers, Profile — with Home real and the other three scaffolded.
7. **Loading, empty and error states** render explicitly for every panel; the screen pulls to refresh.

**Not in scope** — each has its own story: the Tickets list itself (US-016), ticket detail (row taps route to a not-yet-built detail screen — see task 11), ticket creation and the FAB's real destination (US-022 / US-017), notifications (the bell is inert — see **Open questions**, flag 2), and the Customers and Profile screens (this story ships placeholders only).

---

## Context — Read These Files First

1. `src/features/auth/session-context.tsx` — **read lines 30-65 closely.** Line 40 sets `profile: null` when the one-shot `getCurrentSession()` read resolves, and line 57 preserves `prev.profile` only across listener events. **On a cold start with a restored session, `useAuth().profile` is `null`** — it is populated only by `useSignIn`'s `onSuccess`. Home must therefore fetch the profile itself (task 3), not read it off the context.
2. `src/features/auth/api.ts:38-57` — `fetchAgentProfile` selects seven scalar columns and no joins. Task 3 adds a sibling that joins `departments` and `branches`; **do not** widen this one, `signIn` depends on its shape.
3. `src/features/auth/index.ts` — the whole file (5 lines). Line 3 exports `TempSignedInScreen`, marked "remove alongside … once Home ships". This story is that moment (task 12).
4. `src/app/_layout.tsx:54-73` — `RootNavigator`. `Stack.Screen name="index"` (line 66) becomes `name="(tabs)"`. Leave the `hideSplash()` effect and both `Stack.Protected` guards alone.
5. `src/core/components/SectionHeader.tsx` — the whole file (59 lines). `variant="link"` with `action` + `onActionPress` (line 12) is the "MY TICKETS / View all" header exactly; `styles.label` (line 58) already applies `textTransform: 'uppercase'`, so pass title-case strings and let the component uppercase them.
6. `src/core/components/Icon.tsx` — the `IconName` union (~lines 20-47) and `ICON_MAP` (lines 52-82). `bell`, `clock`, `check`, `user`, `plus` exist. `inbox`, `checkCircle`, `home`, `tickets` and `customers` do **not** — task 1 adds them.
7. `src/core/utils/format.ts:34-56` — `formatRelative` returns `"3 hours ago"` / `"منذ ٣ ساعات"`. Figma's ticket rows show the compact `4m` / `22m` / `1h` form. Task 2 adds `formatRelativeShort` beside it; **do not** change `formatRelative`, ticket detail will want the long form.
8. `src/core/lib/theme/colors.ts:41-51` — `statusInfo`/`statusSuccess`/`statusWarning`/`statusDanger` drive both the priority bar and the status badge; `tabActive`/`tabInactive` (lines 50-51) already exist for the tab bar and were added in anticipation of this screen.
9. `src/core/lib/theme/layout.ts:1-22` — the `spacing` and `radius` scales. Every number in the **Design spec** table lands on one of these.
10. `src/core/types/database.ts` — the `tickets` row shape and, at the `Enums` block, `ticket_status: "new" | "open" | "pending" | "resolved" | "closed"` and `ticket_priority: "low" | "medium" | "high" | "urgent"`. **Generated; never hand-edit.** The priority enum's declaration order is what makes `order('priority', { ascending: false })` sort urgent-first in task 4.
11. `docs/phase1_api_reference.md` §2 (lines 123-140), §4.1-4.2 (lines 205-223), §4.5 (lines 234-247), §4.8 (lines 279-291) — the six endpoints. The raw HTTP is for Postman; use supabase-js as specced in task 4.
12. `docs/phase1_brd_1.md:731-742` (US-020) and `:744-756` (US-021) — the acceptance criteria `## Done Criteria` mirrors. Note US-021's "ordered by **priority then age**", which the API doc's `order=created_at.desc` alone does not satisfy.
13. `src/features/auth/screens/LoginScreen.tsx` — the whole file (151 lines). The screen-authoring conventions to copy: `SafeAreaView` + `theme.colors.bgCanvas` (line 37), `useTranslation()`, inline style objects reading `theme.spacing.*`, and `gap` over margins.
14. Grep for `marginLeft\|marginRight\|paddingLeft\|paddingRight` across `src/` — **zero hits.** `eslint.config.js` bans them (hard rule 5). The priority bar on `TicketRow` is the first component with a directional edge; use `borderStartWidth`, never `borderLeftWidth`.

---

## Design spec (resolved from Figma node `7:13`)

Structure, from `get_metadata` on `7:8`:

```
HomeScreen 7:13
├── 7:32  header block
│   ├── 7:33  greeting (7:36 name line, 7:39 department · branch) + 7:41 bell IconButton (7:44 badge dot)
│   └── 7:68  Container:margin  ← 16px top inset = the reserved SLA slot (BRD :742)
│       └── 23:70 StatsRow → 50:2, 50:9, 50:16  StatCard ×3
├── 7:69  content
│   ├── 7:70   SectionHeader 50:23 ("MY TICKETS" / "View all") + 5× TicketRow
│   ├── 7:209  SectionHeader 50:28 ("UNASSIGNED" / "View all") + 3× TicketRow
│   └── 7:305  48px spacer
├── 50:39 BottomNav
└── 50:35 FAB
```

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Header horizontal padding | 16 | `spacing.lg` |
| Greeting name line | 28/34 semibold | `<Text variant="title" weight="semibold">` |
| Department · branch line | 20 regular, muted | `<Text variant="callout" tone="muted">` |
| Greeting → stat row gap | 16 | `spacing.lg` (the reserved SLA slot, task 7) |
| StatCard | 112.6 × 96, surface, radius **16** | `flex: 1` + `radius.lg`, `colors.bgSurface`, hairline `borderSubtle` + `elevation.e1` |
| StatCard gap | 9 → snap to 8 | `spacing.sm` |
| StatCard icon chip | **26 squircle** (radius 9), tinted, 14px icon | `radius.sm`/`md`, `bgPrimarySubtle` / `bgWarningSubtle` / `bgSuccessSubtle` |
| StatCard value | **19 semibold**, tracking -0.4 | `<Text variant="heading" weight="semibold">` |
| StatCard label | **10** muted | `<Text variant="overline" tone="muted">` |
| TicketRow height | ~60.7 | intrinsic; `paddingVertical: spacing.md` |
| TicketRow priority bar | 3 × ~41 **inset pill**, radius full | a `View` child inside the row padding, NOT `borderStartWidth` |
| TicketRow subject | 13.5/17.25 medium | `<Text variant="body" weight="medium">` |
| TicketRow meta line | 11.5 muted | `<Text variant="caption" tone="muted">` |
| Status badge | radius full, tinted bg | `radius.full`, `paddingHorizontal: spacing.sm` |
| Claim button | blue pill, px10/py4, 10.5 semibold | hand-rolled `Pressable` — see correction note |
| Bottom spacer | 48 | `spacing.xxxl` |

`get_variable_defs` on `50:2` and `52:164` returns raw off-scale values (`font size/13_5`, `font size/11_5`, `line height/17_25`). These are the same legacy tokens flagged in story 01 §15 — **snap to the nearest scale token as tabled above; do not introduce off-scale literals.**

---

## Implementation tasks

### 1 — Add the five missing icon names

**File: `src/core/components/Icon.tsx`**

Add to the `IconName` union (~lines 20-47) and to `ICON_MAP` (lines 52-82):

```ts
inbox: 'inbox-outline',
checkCircle: 'check-circle-outline',
home: 'home-outline',
tickets: 'clipboard-text-outline',
customers: 'account-group-outline',
```

None are directional — leave `DEFAULT_MIRRORED` (line 84) untouched.

### 2 — Add a compact relative formatter

**File: `src/core/utils/format.ts`**

Add below `formatRelative` (line 56). Shared by `TicketRow` today and the Tickets list later, so it belongs in `core/` per hard rule 2:

```ts
/** Compact ticket age for dense rows: "4m", "22m", "1h", "3d". Digits follow the active locale. */
export function formatRelativeShort(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const elapsed = Math.max(0, Date.now() - date.getTime());
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (elapsed >= ms) return `${formatNumber(Math.floor(elapsed / ms), locale)}${SHORT_UNIT[unit]}`;
  }
  return `${formatNumber(Math.floor(elapsed / 1000), locale)}${SHORT_UNIT.second}`;
}
```

Add the suffix map beside `RELATIVE_UNITS` (line 34). **The suffixes are user-visible text and must be translated**, so key them rather than hardcoding `m`/`h`/`d` — read them from `t('ticket.age.minute')` at the call site, or expose `SHORT_UNIT` as an i18n lookup. Do not ship a bare Latin `m` into the Arabic build.

Re-export from `src/core/utils/index.ts` alongside the existing `format` exports.

### 3 — Extend `auth` with the org-joined profile

**File: `src/features/auth/types.ts`** — add beside `AgentProfile` (lines 8-16):

```ts
/** `AgentProfile` plus the localised department and branch names for the Home greeting. */
export type AgentProfileWithOrg = AgentProfile & {
  departmentName: string;
  branchName: string;
};
```

**File: `src/features/auth/api.ts`** — add after `fetchAgentProfile` (line 57). Mirrors §2's single round trip:

```ts
export async function fetchAgentProfileWithOrg(userId: string): Promise<AgentProfileWithOrg | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, department_id, branch_id, departments(name_en, name_ar), branches(name_en, name_ar)')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw toAppError(error);
  if (!data) return null;
  // …camelCase at the boundary, then pick name_ar/name_en by currentLocale().
}
```

Pick the localised name with `currentLocale() === 'ar' ? name_ar : name_en` (`src/core/lib/i18n/index.ts:105-107`), falling back to the other when one is empty.

**File: `src/features/auth/hooks.ts`** — add:

```ts
export function useAgentProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchAgentProfileWithOrg(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}
```

**Key it `['profile', userId]`, deliberately *not* under `['tickets']`** — claiming a ticket cannot change the agent's name, department or branch, so folding it into the ticket invalidation would buy a wasted round trip on every claim. See **Open questions**, flag 3.

Export `useAgentProfile` and the new type from `src/features/auth/index.ts`.

### 4 — Create the `tickets` feature: types and API

`TicketRow` and every ticket query belong to the **tickets** domain, not to `home` — CLAUDE.md places domain components under `features/<domain>/components/`, and the Tickets list (US-016) will consume all of this unchanged. Home reaches them through the barrel (hard rule 4).

**Create file: `src/features/tickets/types.ts`**

```ts
import type { Database } from '@/core/types/database';

export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];

/** A ticket as it appears in a list row — the §4.1/§4.2 projection, camelCased. */
export type TicketListItem = {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  customerName: string | null;
};

export type WorkloadCounts = { myOpen: number; unassigned: number; resolvedToday: number };
```

**Create file: `src/features/tickets/api.ts`**

One shared projection, then six functions. Counts use `head: true` so no rows cross the wire:

```ts
const LIST_SELECT = 'id, reference, subject, status, priority, created_at, customers(full_name)';

export async function fetchMyTickets(userId: string, limit?: number): Promise<TicketListItem[]>
// .select(LIST_SELECT).eq('assigned_to', userId).in('status', ['new', 'open', 'pending'])
// .order('priority', { ascending: false }).order('created_at', { ascending: false })
// ↑ priority-then-age per BRD :753. The enum's declaration order sorts urgent > high > medium > low.

export async function fetchUnassignedTickets(limit?: number): Promise<TicketListItem[]>
// .is('assigned_to', null).in('status', ['new', 'open']) — same ordering.

export async function fetchMyOpenCount(userId: string): Promise<number>
// .select('*', { count: 'exact', head: true }).eq('assigned_to', userId).in('status', ['open', 'pending'])

export async function fetchUnassignedCount(): Promise<number>
// .select('*', { count: 'exact', head: true }).is('assigned_to', null).in('status', ['new', 'open'])

export async function fetchResolvedTodayCount(userId: string, sinceIso: string): Promise<number>
// .select('*', { count: 'exact', head: true }).eq('assigned_to', userId).gte('resolved_at', sinceIso)

export async function claimTicket(ticketId: string, userId: string): Promise<void>
// .update({ assigned_to: userId }).eq('id', ticketId).is('assigned_to', null)
```

Three things the executor must get right:

- **`count` is `number | null`.** Return `count ?? 0`; never `count!`.
- **`.is('assigned_to', null)` on the claim** makes it a compare-and-set: a ticket someone else already took updates zero rows instead of being silently stolen. Request `{ count: 'exact' }` on the update and treat `0` as the "already claimed" branch (task 9).
- **Catch at the boundary** (CLAUDE.md §3): every function maps its error through `toAppError` from `@/core/utils`, exactly as `src/features/auth/api.ts:45` does.

Add a `startOfTodayIso()` helper — `const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString();`. It resolves in the **device's** timezone, which is what "resolved today" means to an agent.

### 5 — `tickets` hooks and the query-key tree

**Create file: `src/features/tickets/hooks.ts`**

The intake requires one `invalidateQueries` after a claim to refresh both lists and all three counts. That only works if every ticket key shares a `'tickets'` root:

```ts
export const ticketKeys = {
  all: ['tickets'] as const,
  mine: (userId: string, limit?: number) => ['tickets', 'list', 'mine', userId, limit] as const,
  unassigned: (limit?: number) => ['tickets', 'list', 'unassigned', limit] as const,
  myOpenCount: (userId: string) => ['tickets', 'count', 'myOpen', userId] as const,
  unassignedCount: () => ['tickets', 'count', 'unassigned'] as const,
  resolvedTodayCount: (userId: string, day: string) =>
    ['tickets', 'count', 'resolvedToday', userId, day] as const,
};
```

`resolvedTodayCount` takes the `YYYY-MM-DD` day as a key segment so the count cannot serve a stale yesterday value to an app left open past midnight.

Export `useMyTickets`, `useUnassignedTickets`, `useMyOpenCount`, `useUnassignedCount`, `useResolvedTodayCount`, each a thin `useQuery` with `enabled: Boolean(userId)`. The global defaults in `src/core/lib/query-client.ts:12-20` (30s `staleTime`, no 4xx retry) are right here — **do not** override them per-hook.

```ts
export function useClaimTicket() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => claimTicket(ticketId, session!.user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}
```

`ticketKeys.all` is a prefix match, so that single call refetches both lists and all three counts — the intake's requirement, satisfied by the key structure rather than by five explicit invalidations.

### 6 — `StatusBadge` and `TicketRow`

**Create file: `src/features/tickets/components/StatusBadge.tsx`**

A pill mapping `TicketStatus` → a `{ bg, fg }` token pair, resolved inside the component from `useTheme()`:

| Status | Background | Foreground |
|---|---|---|
| `new` | `bgPrimarySubtle` | `statusInfo` |
| `open` | `bgWarningSubtle` | `statusWarning` |
| `pending` | `bgSurfaceSunken` | `textSecondary` |
| `resolved` | `bgSuccessSubtle` | `statusSuccess` |
| `closed` | `bgSurfaceSunken` | `textMuted` |

Figma draws `pending` in lavender. **The 35-token semantic palette has no purple, and hard rule 2 forbids a hex literal outside `primitives.ts`** — the neutral above is a deliberate interim. See **Open questions**, flag 1; do not invent the colour.

Label text comes from `t('ticket.status.<status>')`, never from the raw enum.

**Create file: `src/features/tickets/components/TicketRow.tsx`**

```tsx
export type TicketRowProps = {
  ticket: TicketListItem;
  onPress: (id: string) => void;
  onClaim?: (id: string) => void;   // omit → no Claim button
  claiming?: boolean;
};
```

Layout: a `Pressable` row; `borderStartWidth: 3` with the priority colour (`urgent` → `statusDanger`, `high` → `statusWarning`, `medium` → `statusInfo`, `low` → `borderDefault`); then a `flex: 1` column holding the subject (one line, `numberOfLines={1}`) and a `reference · customerName` meta line; then a trailing column with `formatRelativeShort(ticket.createdAt)` and the `StatusBadge`, plus the Claim button when `onClaim` is supplied.

The middle column **must** carry `flex: 1` and `minWidth: 0` — without it a long Arabic subject pushes the badge off-screen instead of ellipsising.

Give the row an `accessibilityLabel` combining subject, status and age; the bare visual row reads as disconnected fragments to a screen reader.

### 7 — `home` feature: header and stat row

**Create file: `src/features/home/components/HomeHeader.tsx`**

Greeting line + `department · branch` line + a trailing `IconButton icon="bell"`. Bucket the greeting from the device clock:

```ts
const hour = new Date().getHours();
const bucket = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
// t(`home.greeting.${bucket}`, { name: firstName })
```

First name is `fullName.trim().split(/\s+/)[0]`. When the profile query is still loading, render a `Skeleton` at the greeting's height rather than a flash of an empty string. When it errors, fall back to `t('home.greeting.generic')` (no name) — a failed profile read must not blank the whole screen.

The `·` separator is a literal middle dot with hair spaces, and the department/branch line uses `flexDirection: 'row'` with `gap` so RTL reverses it automatically.

**Create file: `src/features/home/components/StatCard.tsx`**

```tsx
export type StatCardProps = {
  icon: IconName;
  tone: 'info' | 'warning' | 'success';
  value: number | undefined;   // undefined → loading
  label: string;
};
```

Surface card, `radius.md`, `flex: 1`; a 32pt circular icon chip tinted by `tone`; the value via `formatNumber` (Arabic-Indic digits in the `ar` build — **never** interpolate a raw `number` into JSX here); the label in `caption`/`muted`. When `value` is `undefined`, render a `Skeleton` in the number's place and keep the card's height fixed so the row does not reflow.

**Create file: `src/features/home/components/StatsRow.tsx`**

The three cards in a `flexDirection: 'row'` with `gap: theme.spacing.sm`, wrapped in a `View` whose `marginTop: theme.spacing.lg` **is** the reserved SLA slot from Figma `7:68` and BRD `:742`. Leave a comment naming that criterion so the next reader does not "tidy" the gap away.

Cards, in order: `inbox`/`info`/`home.stats.myOpen`, `clock`/`warning`/`home.stats.unassigned`, `checkCircle`/`success`/`home.stats.resolvedToday`.

### 8 — The Home screen

**Create file: `src/features/home/screens/HomeScreen.tsx`**

A `SafeAreaView` + `ScrollView` (`edges={['top']}`) following `LoginScreen.tsx:37-45`. Composition, top to bottom: `HomeHeader`, `StatsRow`, the My Tickets section, the Unassigned section, and a `spacing.xxxl` bottom spacer so the last row clears the FAB and tab bar.

Each section is `SectionHeader variant="link"` + one of three branches, in this order:

1. `isPending` → `<SkeletonList count={5} />` (3 for Unassigned).
2. `isError` → `<ErrorState title={t('states.errorTitle')} body={t('states.errorBody')} onRetry={refetch} />`.
3. `data.length === 0` → `<EmptyState … />` with a section-specific message (`home.empty.mine` / `home.empty.unassigned`).
4. Otherwise the rows.

Both `SectionHeader`s take `action={t('home.viewAll')}` and push `/(tabs)/tickets`.

Limits live in named constants — `const MINE_PREVIEW_LIMIT = 5;` and `const UNASSIGNED_PREVIEW_LIMIT = 3;` — matching Figma's five and three rows and US-021's "up to five".

**Use plain `.map()` over the arrays, not a `FlatList`.** Both lists are hard-capped at five and three inside a `ScrollView`; nesting a virtualised list inside a scroll view triggers React Native's nesting warning and breaks the outer scroll.

Add pull-to-refresh: a `RefreshControl` on the `ScrollView` whose `onRefresh` awaits `queryClient.invalidateQueries({ queryKey: ticketKeys.all })` and the profile key together.

Render the `FAB` with `bottomOffset` clearing the tab bar. Its real destination is US-022/US-017 and does not exist yet — route it to `/(tabs)/tickets` for now with an explicit `// TODO(US-017): retarget at the create-ticket screen` comment. See **Open questions**, flag 2.

**Create file: `src/features/home/index.ts`** — export `HomeScreen` only. Nothing else in this feature is consumed from outside it.

### 9 — Claim wiring

In `HomeScreen`, `const claim = useClaimTicket();` and pass `onClaim={claim.mutate}` plus `claiming={claim.isPending && claim.variables === ticket.id}` to each Unassigned row, so only the tapped row shows a spinner rather than all three.

On success the `ticketKeys.all` invalidation from task 5 does the visible work: the row leaves Unassigned, appears under My tickets, and all three counts move — one invalidation, no manual cache surgery.

On error, surface `t(error.messageKey)` inline beneath the section with `accessibilityLiveRegion="polite"`, matching `LoginScreen.tsx:134-138`. The zero-rows-updated case (task 4) is not a failure — treat it as "already claimed" and show `t('home.claim.taken')`, then let the invalidation refresh the list.

### 10 — The tab shell

**Create file: `src/app/(tabs)/_layout.tsx`** — the one route file permitted more than a re-export, since the tab bar *is* the route configuration:

```tsx
<Tabs
  screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: theme.colors.tabActive,
    tabBarInactiveTintColor: theme.colors.tabInactive,
  }}
>
  <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: … }} />
  <Tabs.Screen name="tickets" options={{ title: t('tabs.tickets'), … }} />
  <Tabs.Screen name="customers" options={{ title: t('tabs.customers'), … }} />
  <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), … }} />
</Tabs>
```

`tabs.home` / `tabs.tickets` / `tabs.customers` / `tabs.profile` already exist in both locale files — **do not re-add them.** Icons: `home`, `tickets`, `customers`, `user` (added in task 1).

Expo 57's `Tabs` API differs from older releases — **check https://docs.expo.dev/versions/v57.0.0/ before writing this file**, per `AGENTS.md`. Do not carry over a remembered `expo-router` v2/v3 tab signature.

**Create the four route files**, each a thin re-export per hard rule 1:

- `src/app/(tabs)/index.tsx` → `HomeScreen` from `@/features/home`
- `src/app/(tabs)/tickets.tsx` → `TicketsScreen` from `@/features/tickets`
- `src/app/(tabs)/customers.tsx` → `CustomersScreen` from `@/features/customers`
- `src/app/(tabs)/profile.tsx` → `ProfileScreen` from `@/features/profile`

**Create the three placeholder screens** — `src/features/tickets/screens/TicketsScreen.tsx`, `src/features/customers/screens/CustomersScreen.tsx`, `src/features/profile/screens/ProfileScreen.tsx`, each with a barrel. Each renders a centred `EmptyState` using the existing `t('placeholder.screenBody')` key ("This screen is scaffolded. Its feature story will fill it in.") — that key exists in both locale files for exactly this purpose. Keep them to a dozen lines; their real stories replace them wholesale.

**File: `src/app/_layout.tsx`** — change line 66 from `<Stack.Screen name="index" />` to `<Stack.Screen name="(tabs)" />`. Nothing else in this file changes.

### 11 — Row taps

Ticket detail (US-018) does not exist. Give `HomeScreen` a single `onPress` handler that is a **no-op with an explicit TODO** rather than pushing a route that would 404:

```ts
// TODO(US-018): push `/tickets/${id}` once the ticket detail route exists.
function handleTicketPress(_id: string) {}
```

Do not add a placeholder detail route — that pre-empts a routing decision belonging to the tickets story.

### 12 — Remove the temporary signed-in screen

**Delete `src/features/auth/screens/TempSignedInScreen.tsx`** and its export at `src/features/auth/index.ts:2-3` (the comment there names this story as the trigger). **Delete `src/app/index.tsx`** — `(tabs)/index.tsx` replaces it as the authenticated root.

Grep for `TempSignedInScreen` afterwards and confirm zero hits.

### 13 — Translations

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`** — add a `home` namespace and a `ticket` namespace. Both files must gain **identical key sets**; a key present in one and missing from the other renders the raw key path to the user.

```json
"home": {
  "greeting": {
    "morning": "Good morning, {{name}}",
    "afternoon": "Good afternoon, {{name}}",
    "evening": "Good evening, {{name}}",
    "generic": "Welcome back"
  },
  "stats": { "myOpen": "My open", "unassigned": "Unassigned", "resolvedToday": "Resolved today" },
  "sections": { "mine": "My tickets", "unassigned": "Unassigned" },
  "viewAll": "View all",
  "claim": { "action": "Claim", "taken": "Someone else claimed this ticket." },
  "empty": { "mine": "…", "unassigned": "…" },
  "notifications": "Notifications"
},
"ticket": {
  "status": { "new": "New", "open": "Open", "pending": "Pending", "resolved": "Resolved", "closed": "Closed" },
  "age": { "minute": "m", "hour": "h", "day": "d", "month": "mo", "year": "y", "second": "s" }
}
```

`home.sections.*` are title-case because `SectionHeader` uppercases them itself (`SectionHeader.tsx:58`). Story 01 §15 flagged Arabic uppercase + tracking on `SectionHeader` as an open design question — **that flag is still open; do not resolve it here.**

For the Arabic `ticket.age.*` suffixes use Arabic abbreviations (`د` minute, `س` hour, `ي` day), not transliterated Latin.

---

## Edge Cases & Failure Modes

- **Cold start with a restored session** — `useAuth().profile` is `null` (`session-context.tsx:40`), so a greeting read from the context would render "Good morning, undefined". Task 3's `useAgentProfile` query is the fix; the header must never read `useAuth().profile`.
- **Profile loads but department or branch is null** — RLS can hide a row the join points at. Render the name line alone rather than "Customer Support · undefined"; build the subtitle by filtering empties before joining on `·`.
- **`count` comes back `null`** — supabase-js types `count` as `number | null`. `count ?? 0` in every count function (task 4); a `null` reaching `StatCard` renders the skeleton forever.
- **Claim races another agent** — two agents tap Claim on the same row. `.is('assigned_to', null)` on the update (task 4) makes the loser update zero rows; show `home.claim.taken` and let the invalidation refresh. Without that guard the second write silently reassigns the ticket.
- **Claim while offline** — mutations do not retry (`query-client.ts:23`). The error surfaces inline; `OfflineBanner` is already mounted globally in `_layout.tsx:40`.
- **App left open past midnight** — "Resolved today" would serve a stale count. The `YYYY-MM-DD` segment in `resolvedTodayCount`'s key (task 5) forces a new key, and pull-to-refresh recomputes `startOfTodayIso()`.
- **`resolved_at` set but status later reopened** — §4.5's query filters on `resolved_at` alone, so a reopened ticket still counts toward "Resolved today". This matches the documented endpoint; note it in a code comment rather than silently adding a status filter that would diverge from the API contract.
- **Long Arabic subject** — without `flex: 1` + `minWidth: 0` on `TicketRow`'s middle column, the status badge is pushed off-screen. `numberOfLines={1}` on the subject.
- **Zero tickets in every panel** — three empty states stack. Verify the screen still reads as intentional rather than broken; this is BRD `:741`.
- **RTL** — the priority bar must use `borderStartWidth`, so it renders on the right in Arabic. `eslint.config.js` catches `borderLeftWidth`, but only if the executor does not reach for an absolutely-positioned bar with `left: 0` instead. Use the border.
- **Arabic digits** — every number on this screen (three counts, ticket ages) goes through `formatNumber`/`formatRelativeShort`. A raw `{count}` in JSX renders Latin digits in the Arabic build.

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, and `package.json` has no `test` script. Story 02 reached the same conclusion and deferred it. This story does not install one.

### Runnable today — manual matrix

`npm start`, then `a`/`i`. Sign in as a seeded agent.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Agent with tickets | Open Home | Greeting, department · branch, three counts, both lists render |
| 2 | Cold start, already signed in | Kill and relaunch | Greeting shows the **name**, not a blank or "undefined" |
| 3 | Agent with no tickets | Open Home | Counts show 0; both sections show their empty states |
| 4 | Unassigned ticket visible | Tap **Claim** | Row leaves Unassigned, appears under My tickets, all three counts move |
| 5 | Two devices, same ticket | Tap Claim on both | Second shows "Someone else claimed this ticket."; no reassignment |
| 6 | Home loaded | Pull to refresh | Every panel refetches; spinner resolves |
| 7 | Airplane mode | Open Home | Error states with retry; `OfflineBanner` visible |
| 8 | Airplane mode | Tap Claim | Inline error; ticket stays unassigned |
| 9 | Switch to العربية | Open Home | Layout mirrors; priority bar moves to the **right**; digits are Arabic-Indic |
| 10 | العربية | Read the stat row | Counts render as ٧ / ١٢ / ٢٣, not 7 / 12 / 23 |
| 11 | Long Arabic subject | Open Home | Subject ellipsises; status badge stays visible |
| 12 | Toggle system dark mode | Open Home | Cards, badges and priority bars all legible |
| 13 | Any | Tap each tab | All four tabs open; Home stays real, three show the placeholder |
| 14 | Any | Tap **View all** | Tickets tab opens |
| 15 | Ticket resolved today | Open Home | "Resolved today" ≥ 1 |

Row 5 needs two sessions; a second simulator or a direct `PATCH` from Postman between load and tap both work.

### To write when a runner exists

1. **Unit — `src/features/tickets/api.test.ts`** · each list function maps the joined `customers(full_name)` shape to `customerName`, and a `null` join yields `null`, not `undefined`.
2. **Unit — `src/features/tickets/api.test.ts`** · each count function returns `0` when supabase-js resolves `count: null`.
3. **Unit — `src/features/tickets/api.test.ts`** · `claimTicket` includes the `assigned_to is null` predicate, and a zero-row result raises the "already claimed" branch rather than resolving silently.
4. **Unit — `src/core/utils/format.test.ts`** · `formatRelativeShort` at 59s, 60s, 59m, 60m, 23h and 25h boundaries; Arabic locale yields Arabic-Indic digits; an invalid date yields `''`.
5. **Unit — `src/features/home/greeting.test.ts`** · the hour→bucket boundaries at 11:59, 12:00, 17:59, 18:00; a single-word name; a name with leading whitespace.
6. **Integration — `src/features/tickets/hooks.test.tsx`** · a successful `useClaimTicket` invalidates `['tickets']` and therefore refetches all five ticket queries, while `['profile', userId]` is **not** refetched.
7. **Unit — `src/core/lib/i18n/locales.test.ts`** (proposed in story 02, still unwritten) · `en.json` and `ar.json` key sets are identical. This story adds two namespaces to both files and is the second story that would have benefited from it.

---

## Verification Steps

1. **Typecheck:** `npm run typecheck` in the repo root — zero errors. The generated `Database` types make a mistyped column or enum value fail here.
2. **Lint:** `npm run lint` — zero errors. This is the gate for hard rules 2–5: a hex literal, a `marginLeft`, a `fontWeight` style key, a deep `@/features/tickets/api` import, or any `core/` → `features/` import fails the build.
3. **Frontend runs:** `npm start`, press `a` (Android) and `i` (iOS). Sign in and walk the manual matrix above.
4. **RTL:** switch to العربية, then **fully restart** the app — `applyDirection` (`src/core/lib/i18n/index.ts:54-59`) latches direction at startup, so an in-session toggle will not flip the layout. Confirm the priority bar sits on the right.
5. **Regression:** sign out from the placeholder Profile tab (or clear storage) and confirm the login screen still guards correctly through `Stack.Protected` — task 10 re-parented that route from `index` to `(tabs)`.
6. **Regression:** grep for `TempSignedInScreen` — zero hits.
7. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Open questions — raise with design/product, do not resolve silently

1. **`PENDING` has no colour token.** Figma renders it lavender; the semantic palette has no purple and hard rule 2 forbids a hex outside `primitives.ts`. Task 6 ships a neutral interim. Design must either add a `statusPending` token pair to `primitives.ts` + `colors.ts` or re-map the status to an existing tone. Joins the story 01 §15 flag list.
2. **The notification bell and the FAB have no destinations.** Notifications are unbuilt; the FAB belongs to US-022 with its target in US-017. Both render per the design — the bell inert, the FAB routed at the Tickets tab as an interim. Confirm that is acceptable for this story rather than hiding them until their features land.
3. **The intake says "key all six queries under `['tickets', ...]`".** Only five are ticket queries; the sixth is the agent profile (§2), which task 3 keys `['profile', userId]` instead — a claim cannot change the agent's name or department, so including it would add a wasted round trip per claim. Confirm the intent.
4. **Claiming from Home has no BRD acceptance criterion.** `docs/phase1_brd_1.md:731-756` covers the counts (US-020), the My tickets preview (US-021) and the new-ticket action (US-022) — the Unassigned section with its inline Claim appears only in Figma `7:209` and in this intake's API notes (§4.2, §4.8). It is built here on that basis; it may warrant its own tracked story.
5. **Ordering.** US-021 (`:753`) says "priority then age" while API §4.1 shows `order=created_at.desc` alone. Task 4 follows the BRD. Confirm the API doc should be updated to match.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 04.**


## **[Corrected 2026-09-01 — design audit]**

The design table above was transcribed from a Figma state that has since moved on.
Re-read live from `36:40` / `50:2` on 2026-09-01; the four StatCard rows and the two
TicketRow rows are corrected inline above. The token-snapping POLICY this plan set is
unchanged and still correct — only the source numbers were stale.

Two further corrections:

1. **`<Button variant="primary" size="sm">` does not exist.** `Button` has no `size`
   prop and is hard-coded to a 56px height. Figma's claim pill is ~24px tall
   (px 10 / py 4, 10.5px semibold) — that is a BADGE, not a small button, so forcing a
   variant into `Button` would distort it. The pill stays hand-rolled and token-driven
   until design decides whether the system needs a proper pill/tag primitive.
2. **The bands, not the rows, carry the surface.** Frames `7:78` / `7:217` bind
   `color/white/solid` + `color/grey/93` at BAND level; the row binds neither. Rows stay
   unfilled. (An audit reading of "rows are rounded-14 cards with a shadow" is NOT backed
   by the bound variables and would contradict the Tickets list — open with design.)
