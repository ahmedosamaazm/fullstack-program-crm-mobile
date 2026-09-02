# Story 23 — In-app notification centre (Story: SCRUM-45)

> Intake: `.squad/stories/notifications/SCRUM-45/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:3066` ("Notifications - List").
> First story in `features/notifications/` — the sixth and **last unbuilt phase-1 feature folder**.

## Read this before anything else

Three facts change how this story is sequenced. Establish all three before writing a line of UI.

**1. `notifications` is not in the generated database types.** `src/core/types/database.ts` contains
exactly eleven tables — `access_tokens`, `attachments`, `branches`, `categories`, `csat_responses`,
`customers`, `departments`, `profiles`, `ticket_events`, `ticket_messages`, `tickets` (`:17`, `:49`,
`:117`, `:144`, `:179`, `:211`, `:272`, `:296`, `:347`, `:392`, `:434`). `notifications` is absent, so
`supabase.from('notifications')` is a **type error**, not a runtime one. Hard rule 6 says the file is
generated and never hand-edited. **Task 0 regenerates it, and nothing else in this story compiles until
it has run.**

**2. `docs/phase1_api_reference.md` §9 is stale and will mislead you.** It says at `:456`
*"Requires §9 of the backend plan. No table exists yet."* That is wrong.
`docs/phase1_backend_plan.md:235-323` is the current truth: the table, its index, RLS and **three of
five triggers are live and verified** (`:305-314` records the Postman two-JWT proof). Task 6 fixes §9.

**3. One acceptance criterion cannot be closed by this repository.** BRD `:849` —
*"Given a ticket is assigned to me, when it saves, then a **push** notification is sent"*. There is no
`expo-notifications` in `package.json`, no device-token table, and no sender. What the assignment
trigger sends today is a **row**, not an APNs/FCM push. This is the same shape as stories 21 and 22,
each of which carries a criterion outside this repo's reach. **Do not install `expo-notifications` to
close it** — see open question 1 and task 6.

**Do not build a notifications tab.** Figma's frame draws `BottomNav` beneath the list (node `60:267`)
*and* a Back arrow in its header (`128:1071`). Those two are contradictory; the Back arrow is the
unambiguous one, and the app has four tabs by `src/app/(tabs)/_layout.tsx`'s `TAB_META`. This is a
pushed route. See open question 6.

---

## Prerequisites

- **Backend §9 complete** — `docs/phase1_backend_plan.md:235-323`. Table, `idx_notifications_recipient`, both RLS policies, and `trg_notify_assignment` / `trg_notify_reply` / `trg_notify_status`. **`:267`: there is deliberately no INSERT policy for `authenticated`.** Clients cannot create notifications; nothing in this story may try.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md). It built `HomeHeader` with the bell already in place (`HomeHeader.tsx:58-63`) and an `onNotificationsPress` prop wired to **`() => {}`** at `HomeScreen.tsx:118`. Task 4 is filling that hole, not adding a control.
- **Story 04 completed** — [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md). `groupTicketsByDay` (`tickets/grouping.ts`) is the day-bucketing precedent task 2 copies, and `TicketsScreen.tsx:130-147` is the `SectionList` + `SectionHeader variant="rule"` precedent task 3 copies.
- **Story 07 completed** — [`../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`](../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md). `/tickets/[id]` is the push target every alert row navigates to.
- **Story 06 completed** — [`../profile/06-story-profile-and-settings-SCRUM-46.md`](../profile/06-story-profile-and-settings-SCRUM-46.md). It shipped `features/profile/notification-prefs.ts`, whose `:19-21` comment (*"There is no notifications table yet (API §9) and no push/email sender — this stores a local preference nothing currently reads"*) is **half wrong as of this story** and is corrected in task 6.
- **Supabase CLI authenticated**, and a **second agent account** plus the ability to reassign a ticket. A recipient with zero notifications exercises the empty state and nothing else; three of the five row types can only be produced by a real assignment, a real customer reply, and a real status change.

---

## Story Goal

An agent has one place that answers *"what happened while I was on a call?"*, and a bell on Home that
says how much of it they have not read. Concretely:

1. **A pushed Notifications screen** listing the signed-in agent's alerts, newest first, in two
   sections — **Today** and **Earlier**.
2. **A row that renders all five types** — `assigned`, `reply`, `status`, `unassigned`, `rating` — of
   which only the first three can fire today (`phase1_backend_plan.md:316-323`), and that **degrades
   safely on a sixth**, because `notifications.type` is `text` with no CHECK constraint.
3. **An unread badge on Home's bell** that counts unread rows and caps at "99+".
4. **Tap opens the ticket and marks the alert read**, so the badge falls by one.
5. **Mark all read** from the screen header.

**Not in scope**: OS push delivery (open question 1 — SCRUM-40/41 own the sender); Supabase Realtime
subscriptions (open question 4); pagination or infinite scroll (open question 5); creating
notifications from the client (impossible by policy, `phase1_backend_plan.md:267`); the two dormant
triggers, `unassigned` (needs `pg_cron`) and `rating` (needs the CSAT flow) — this story renders both
and tests neither; and any change to `features/profile`'s stored push/email preference beyond
correcting its comment.

---

## Context — Read These Files First

1. `docs/phase1_backend_plan.md:235-323` — **the contract**. The DDL at `:242-265` is the column list `types.ts` mirrors: `id`, `recipient_id`, `ticket_id` (**nullable**), `type` (**`text`, not an enum**), `title`, `body` (**nullable**), `is_read`, `created_at`. `:267` on the missing INSERT policy. `:273-277` for which trigger writes which type. `:316-323` for the two types that never fire yet.
2. `docs/phase1_api_reference.md:454-465` — §9. **Read `:456` and then disregard it** (see "Read this before anything else", point 2). The three request shapes at `:459-461` are still correct.
3. `docs/phase1_brd_1.md:841-853` — US-028 and its five criteria. `## Done Criteria` mirrors them verbatim. `:849` is the one this repo cannot close.
4. `src/features/tickets/api.ts` — the data-layer template, copied nearly line for line:
   - `:1-2` the two imports every `api.ts` opens with (`supabase`, `toAppError`).
   - `:19` `LIST_SELECT` and `:30-50` `TicketListRow` → `toListItem`: **the snake_case row type is local to `api.ts` and never leaves it**; `types.ts` holds only the camelCased shape.
   - **`:199-208` `fetchMyOpenCount`** — the exact `select('*', { count: 'exact', head: true })` + `return count ?? 0` form task 1c copies for the badge.
   - `:272-281` `claimTicket` — the `.update(payload, { count: 'exact' })` form task 1d copies.
5. `src/features/tickets/hooks.ts:38-51` — `ticketKeys`. Task 1e's `notificationKeys` copies its shape and its doc comment's reasoning about a single invalidation root. Then `:82-90` (`useMyOpenCount`) for the `enabled: Boolean(userId)` gate, and `:129-140` (`useClaimTicket`) for the mutation + `onSuccess` invalidate form.
6. `src/features/tickets/grouping.ts` — **all 55 lines**. `:35-36` builds midnight boundaries from **local** `getFullYear/getMonth/getDate`, `:38-47` buckets, `:54` drops empty groups because *"`SectionList` renders a header for an empty section"*. Task 2 reproduces the technique with **two** buckets instead of three. Read `:12-23`'s comment before writing it — the reasoning is the valuable part.
7. `src/features/tickets/screens/TicketsScreen.tsx:130-147` — the `SectionList`: `stickySectionHeadersEnabled={false}` (`:133`), `renderSectionHeader` → `<SectionHeader variant="rule" …>` (`:134-136`), `refreshControl` (`:142-144`), and the `contentContainerStyle` bottom padding (`:145`). Also `:113-128` — the `isPending` / `isError` / empty branch order every list screen in this repo uses.
8. `src/features/tickets/components/TicketRow.tsx` — the row template. `:24-30` builds a composed `accessibilityLabel` for the whole `Pressable`; `:57-59` is the comment that matters most to this story: *"priority needs a non-colour cue; the coloured bar alone fails for colour-blind users."* Task 3b faces the identical problem and open question 3 is that comment coming due again.
9. `src/features/home/components/HomeHeader.tsx` — **all 71 lines**. `:7-14` `HomeHeaderProps`; **`:58-63` the bell**, an `IconButton icon="bell" variant="subtle"`. Task 4 adds one prop and wraps this control; nothing else in the file changes.
10. `src/features/home/screens/HomeScreen.tsx` — **`:118` `onNotificationsPress={() => {}}`** is this story's single most important line. Also `:78-81` `handleRefresh`, which task 4c extends, and `:30-32`/`:38-43` for the `router.push` object form (`typedRoutes` is on).
11. `src/core/components/IconButton.tsx` — **all 76 lines**. It has **no badge affordance** and task 4 does not add one; see task 4a for why the overlay lives in `HomeHeader`.
12. `src/core/components/Icon.tsx:20-58` — the `IconName` union. `user`, `message`, `clock`, `star`, `alert`, `arrowBack` all already exist; **task 3 adds no icon name**. `:110-111` `DEFAULT_MIRRORED` — `arrowBack` is already in it.
13. `src/core/lib/theme/colors.ts:9-60` — the semantic tokens. `:16-19` (`bgPrimarySubtle`, `bgSuccessSubtle`, `bgWarningSubtle`), `:41-44` (`statusInfo`/`statusSuccess`/`statusWarning`), `:52-54` (`bgTabActive`), and **`:56-59`** — `bgInternalSubtle`/`textInternal` with the comment *"Internal notes only — not a general-purpose purple (story 07)."* Task 3a uses them anyway; open question 2 is why that comment has to change.
14. `src/core/lib/theme/primitives.ts:36`, `:41`, `:44`, `:46`, `:50`, `:52`, `:65`, `:67` — the eight literals behind those tokens. Needed to check the Figma values in task 3a against what the repo actually has. **Hard rule 2: this is the only file that may hold a hex literal. Do not paste a Figma hex anywhere else.**
15. `src/core/utils/format.ts:76-88` — `formatRelativeShort`, which produces exactly Figma's `8m` / `14m` / `1h` / `3h` / `1d`. Then **`:94-97` `formatCount`** — *"Caps a count for badges: 100 renders as '99+'"*. It was written for this badge and has had no caller until now.
16. `src/core/lib/query-client.ts` — `staleTime: 30_000` and, critically, **`refetchOnWindowFocus: false`**. That single line is why the badge cannot refresh itself when the agent returns to the app, and is the substance of open question 4.
17. `src/app/_layout.tsx:65-72` — the authenticated `Stack.Protected` block. Task 5 adds one `Stack.Screen` inside it, between `:68` and `:69`. **A screen registered outside this block leaks to a signed-out deep link.**
18. `src/core/lib/i18n/locales/en.json:126-129` and `ar.json:130-133` — `tickets.groups`, which already holds translated **"Today"** and **"Earlier"**. Task 2 reuses them; see its note.

---

## Product rules (from story)

| | Today | After this story |
|---|---|---|
| Home bell | Renders, `onPress` is `() => {}` (`HomeScreen.tsx:118`) | Pushes `/notifications`, carries an unread badge |
| Alerts written by the three live triggers | Reach the database; no client ever reads them | Listed newest first under Today / Earlier |
| `is_read` | Never written by any client | Written on row tap and by **Mark all read** |
| `features/profile`'s push/email switches | *"stores a local preference nothing currently reads"* (`notification-prefs.ts:19-21`) | Still stores a preference nothing reads — **the comment's claim that no table exists is corrected** |
| `docs/phase1_api_reference.md` §9 | *"No table exists yet"* (`:456`) | Marked ✅ with the live shape |

---

## Backend Tasks

**No backend code is written by this story.** This repo is the Expo client and holds no migrations;
§9's table, policies and triggers are already deployed and verified
(`phase1_backend_plan.md:305-314`).

Two backend *facts* must nonetheless be established, and both are verification steps, not tasks:

- **Verification step 1** proves the client cannot INSERT a notification. `phase1_backend_plan.md:267` says no policy exists; that is an assertion about a deployment, and no one has fired a client INSERT at it. Same class of gap as story 17's `ticket_events` immutability check — **and story 17 left the DELETE half of that check unrun**, which is why this one is scheduled first rather than last.
- **Verification step 2** proves an agent cannot PATCH *another* agent's notification. `update_own`'s `with check` (`:262-264`) is the only thing standing between "mark my alert read" and "mark anyone's alert read", and **Mark all read is the first bulk write this app has ever issued**.

---

## Frontend Tasks

### 0 — Regenerate the database types (blocking, run first)

**File: `src/core/types/database.ts`** — regenerated, never edited.

```bash
npm run gen:types
```

Requires Supabase auth; run it yourself. Then confirm the new table landed:

```bash
grep -n "notifications: {" src/core/types/database.ts
```

The `Row` block must carry `recipient_id: string`, `ticket_id: string | null`, `type: string`,
`title: string`, `body: string | null`, `is_read: boolean`, `created_at: string`.

**Two things to check in the diff before committing it.** First, that `type` really is `string` and
not a generated enum — the DDL at `phase1_backend_plan.md:247` declares plain `text`, and task 3's
whole default-branch design depends on that. Second, that **no unrelated table changed shape**; this
is the first regeneration since the file was created, and a silent column drift elsewhere would
surface as a type error in a feature this story never touched. If one does, fix it in this commit and
say so — do not work around it.

---

### 1 — The data layer

#### 1a — `Create file: src/features/notifications/types.ts`

```ts
import type { Database } from '@/core/types/database';

/**
 * `notifications.type` is `text` in the schema, not an enum
 * (`docs/phase1_backend_plan.md:247`) — so this union is the FIVE types the
 * product defines, and `NotificationRow` deliberately types the field as the
 * raw `string` the database can actually return. Narrowing happens once, at the
 * render boundary, with a default branch. Typing this as the union at the API
 * layer would be a lie the compiler cannot catch.
 */
export type NotificationType = 'assigned' | 'reply' | 'status' | 'unassigned' | 'rating';

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'assigned',
  'reply',
  'status',
  'unassigned',
  'rating',
];

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

/** One alert, camelCased. Mirrors the §9 projection. */
export type NotificationItem = {
  id: string;
  /** `null` when the alert is not about a ticket — the column is nullable. */
  ticketId: string | null;
  /** Raw. Compare with `isNotificationType` before keying a style off it. */
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

/** Not exported from the barrel — proves at compile time that the row shape tracks the schema. */
type _SchemaCheck = Database['public']['Tables']['notifications']['Row'];
```

Delete `_SchemaCheck` if `npm run typecheck` objects to an unused type alias under the repo's ESLint
config; its only job is to fail loudly if task 0 was skipped.

#### 1b — `Create file: src/features/notifications/api.ts`

Follow `tickets/api.ts` exactly: local snake_case row type, a `to…` mapper, `toAppError` at every
boundary.

```ts
import { supabase } from '@/core/lib/supabase';
import { toAppError } from '@/core/utils';

import type { NotificationItem } from './types';

const LIST_SELECT = 'id, ticket_id, type, title, body, is_read, created_at';

type NotificationRow = {
  id: string;
  ticket_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

function toItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}
```

Then the four functions. **Every one filters `recipient_id` explicitly**, even though `select_own`
(`phase1_backend_plan.md:259-260`) already scopes it — the intake asks for this, and the reason is
that a query whose correctness is invisible in the query text is a query nobody can review.

```ts
export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(LIST_SELECT)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw toAppError(error);
  return (data ?? []).map(toItem);
}

/** The Home bell's badge — BRD `:851`. `head: true` sends no rows over the wire. */
export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw toAppError(error);
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw toAppError(error);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw toAppError(error);
}
```

**`markNotificationRead` deliberately does not use `{ count: 'exact' }`.** `claimTicket`
(`api.ts:272-281`) counts rows because a zero-row result is a *meaningful race* — someone else took
the ticket. Marking an already-read alert read is idempotent and a zero-row result means nothing went
wrong. Do not copy the compare-and-set there; it would produce an error for a double tap.

**`markAllNotificationsRead` keeps `.eq('is_read', false)`** even though setting `true` on an
already-`true` row is harmless: it bounds the write to rows that actually change, which matters the
day an agent has 400 alerts.

**Do not write an insert function.** There is no INSERT policy (`phase1_backend_plan.md:267`); a
client-side create would fail at runtime and, worse, imply the app is allowed to fabricate alerts.

#### 1c–1e — `Create file: src/features/notifications/hooks.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth';

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './api';

/**
 * One `'notifications'` root, so a single
 * `invalidateQueries({ queryKey: notificationKeys.all })` after either mutation
 * refetches the list AND the Home badge together. Same reasoning as
 * `ticketKeys` (tickets/hooks.ts:30-37). Both keys carry the user id: an
 * involuntary sign-out that leaves the previous agent's cache resident is the
 * exact defect story 18 was written to close.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (userId: string) => ['notifications', 'list', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'count', 'unread', userId] as const,
};

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: notificationKeys.list(userId ?? ''),
    queryFn: () => fetchNotifications(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUnreadNotificationCount() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId ?? ''),
    queryFn: () => fetchUnreadNotificationCount(userId as string),
    enabled: Boolean(userId),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
```

**Plain invalidation, no `onMutate` optimistic write.** Every mutation in this repo invalidates
(`useClaimTicket` `hooks.ts:136-139`, `useAssignTicket` `:205-211`, `useChangeTicketStatus`
`:223-234`), and none rolls back. Tapping a row navigates away from the list in the same tick, so an
optimistic list write buys nothing visible; the badge is one `head: true` request that resolves in
well under the time the push animation takes. Introducing this repo's first optimistic-rollback
mutation to save one round trip is the wrong place to spend that complexity — but see open question 5
for the case that changes the answer.

#### 1f — `Create file: src/features/notifications/index.ts`

The **only** import surface (hard rule 4):

```ts
export { NotificationRow } from './components/NotificationRow';
export { groupNotificationsByRecency, type NotificationGroup, type NotificationGroupKey } from './grouping';
export { NotificationsScreen } from './screens/NotificationsScreen';
export {
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from './hooks';
export {
  isNotificationType,
  NOTIFICATION_TYPES,
  type NotificationItem,
  type NotificationType,
} from './types';
```

`features/home` will import `useUnreadNotificationCount` from here (task 4). **That is a new
one-directional edge, home → notifications, not a cycle** — `features/notifications` must never import
from `features/home`. The customers ↔ tickets cycle documented in `AGENTS.md` hard rule 4 is the
repo's only one; do not make this a second.

---

### 2 — Grouping

**Create file: `src/features/notifications/grouping.ts`**

Two buckets, not three. BRD `:850` says *"grouped by Today and Earlier"*, and Figma's frame has exactly
two `Section /` frames (`129:1073`, `129:1164`). **Yesterday is part of Earlier here** — that is the
one substantive difference from `groupTicketsByDay`, and it is why this cannot call it.

```ts
import type { NotificationItem } from './types';

export type NotificationGroupKey = 'today' | 'earlier';

export type NotificationGroup = {
  key: NotificationGroupKey;
  /** i18n key — reuses `tickets.groups.*`; see the note below. */
  titleKey: string;
  data: NotificationItem[];
};

/**
 * Buckets by the DEVICE's calendar day, exactly as `tickets/grouping.ts:35-47`
 * does and for the same reason: an agent at +03:00 reading at 01:00 must see the
 * alert from ten minutes ago under "Today". Compare midnight-normalised dates
 * rather than subtracting milliseconds, so a DST shift cannot move an alert a
 * day.
 *
 * Only TWO buckets — BRD `:850` and Figma `7:3066` both say Today and Earlier,
 * so yesterday's alerts fall under Earlier. Do not reuse `groupTicketsByDay`:
 * its third bucket would render a "YESTERDAY" header this screen has no design
 * for, and its item type is a ticket.
 *
 * Incoming order is preserved — the fetcher already sorted `created_at` desc, so
 * "newest first" (BRD `:850`) is the fetcher's job, not this function's.
 * Unparseable timestamps land in `earlier` rather than throwing. Empty groups
 * are omitted, because `SectionList` renders a header for an empty section.
 */
export function groupNotificationsByRecency(
  items: NotificationItem[],
  now = new Date(),
): NotificationGroup[] {
  const buckets: Record<NotificationGroupKey, NotificationItem[]> = { today: [], earlier: [] };
  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const item of items) {
    const created = new Date(item.createdAt);
    const day = Number.isNaN(created.getTime())
      ? null
      : new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();

    if (day !== null && day >= midnightToday) buckets.today.push(item);
    else buckets.earlier.push(item);
  }

  return (
    [
      { key: 'today', titleKey: 'tickets.groups.today', data: buckets.today },
      { key: 'earlier', titleKey: 'tickets.groups.earlier', data: buckets.earlier },
    ] as NotificationGroup[]
  ).filter((group) => group.data.length > 0);
}
```

**On reusing `tickets.groups.today` / `tickets.groups.earlier`.** Both keys already exist and are
already translated in both locales (`en.json:126-129`, `ar.json:130-133`), with exactly the copy this
screen needs. A `notifications.groups` block would be two more Arabic strings that mean the same thing
and can drift apart at the next copy review. i18n keys are not module imports, so no layering rule is
involved. **The reuse is deliberate — do not "fix" it by duplicating the block.**

---

### 3 — The row

**Create file: `src/features/notifications/components/NotificationRow.tsx`**

Figma instance `129:1131`, whose structure is: a hidden-by-default **`Unread tint`** rounded rect at
row level; a **`Chip`** 34×34 at inset 16 holding an 18px icon; a **`Content`** column at x=62
(so a 12px gap) with a **`TitleRow`** (Title + a `Meta` group of Time and a hidden 8×8 **`Unread dot`**)
and a two-line **`Body`**. Row height 82.

**One component, five type values, one `unread` boolean — not ten variants.** The intake is explicit
about this and the Figma component agrees: unread is a hidden layer toggle inside a single instance,
not a variant axis.

#### 3a — The type → style map

```tsx
type TypeStyle = { icon: IconName; tint: ColorToken; ink: ColorToken };

/**
 * The five types from `docs/phase1_backend_plan.md:273-277` and `:316-321`.
 * `unassigned` and `rating` cannot fire yet (no `pg_cron`, no CSAT flow) and are
 * built blind against Figma `129:1131` / `129:1149`.
 *
 * This map IS acceptance criterion `:853` — "the alert row accommodates a
 * severity indicator for future SLA alerts". Adding one is an entry here, never
 * a change to the layout below.
 */
const TYPE_STYLE: Record<NotificationType, TypeStyle> = {
  assigned:   { icon: 'user',    tint: 'bgTabActive',       ink: 'statusInfo' },
  reply:      { icon: 'message', tint: 'bgSuccessSubtle',   ink: 'statusSuccess' },
  status:     { icon: 'clock',   tint: 'bgInternalSubtle',  ink: 'textInternal' },
  unassigned: { icon: 'alert',   tint: 'bgWarningSubtle',   ink: 'statusWarning' },
  rating:     { icon: 'star',    tint: 'bgWarningSubtle',   ink: 'statusWarning' },
};

/** An unrecognised `type` — the column is `text` with no CHECK. Never crash on one. */
const FALLBACK_STYLE: TypeStyle = { icon: 'bell', tint: 'bgSurfaceSunken', ink: 'iconDefault' };

function styleFor(type: string): TypeStyle {
  return isNotificationType(type) ? TYPE_STYLE[type] : FALLBACK_STYLE;
}
```

Resolve `tint`/`ink` through `theme.colors[token]`. **Hard rule 2 — no hex anywhere in this file.**

Four of the ten token choices above are exact matches for Figma's bound variables; **three are not,
and all three are open questions, not decisions to make quietly**:

| Figma variable | Value | Repo token used | Repo value | |
|---|---|---|---|---|
| `colors.successSubtle` / `colors.success` | `#e8f5e9` / `#2e7d32` | `bgSuccessSubtle` / `statusSuccess` | same | exact |
| `palette.purple50` / `palette.purple500` | `#f3eef9` / `#6750a4` | `bgInternalSubtle` / `textInternal` | same | exact value, **wrong name** — open question 2 |
| `colors.warningSubtle` | `#fff4ec` | `bgWarningSubtle` | same | exact |
| `colors.primarySubtle` (unread tint) | `#f4f7ff` | `bgPrimarySubtle` | same | exact |
| `palette.blue100` (assigned chip) | `#dbeafe` | `bgTabActive` | `#e3ebfb` | **no exact token** — open question 2 |
| `palette.amber500` (unassigned/rating ink) | `#c75b00` | `statusWarning` | `#c2410c` | **drifts** — open question 2 |

Use the repo tokens named above and file the three flags. **Do not add a primitive to close the gap** —
that is a design decision, and `primitives.ts` growing a `blue100` on an implementer's judgement is
exactly what §15's ten open flags exist to prevent.

#### 3b — Unread

Per the intake: **row tint AND title weight together, never colour alone.**

- Row background: `theme.colors.bgPrimarySubtle` when unread, `theme.colors.bgSurface` when read.
- Title `weight`: `"semibold"` when unread, `"medium"` when read (Figma's `font weight/600` vs `500`).
- The 8×8 dot after the time: `theme.colors.bgPrimary`, `borderRadius: theme.radius.full`, rendered
  only when unread.

`bgPrimarySubtle` is `#f4f7ff` against a `#ffffff` surface — a 3-value difference that is
**invisible to a substantial fraction of readers and on a sunlit phone**, which is precisely why the
title weight is not optional. The dot is the third cue. Do not drop any of the three.

#### 3c — Structure

```tsx
export type NotificationRowProps = {
  item: NotificationItem;
  /** Called with the row's own id and its `ticketId` — the screen decides both effects. */
  onPress: (item: NotificationItem) => void;
};
```

A single `Pressable` wrapping chip + content, `paddingVertical: theme.spacing.md`,
`paddingHorizontal: theme.spacing.lg`, `gap: theme.spacing.md`, `flexDirection: 'row'`. Chip is
34×34, `borderRadius: theme.radius.full`, centred, `<Icon size={18} />`. Content is
`{ flex: 1, minWidth: 0 }` with the title row (`Text variant="body"`, `numberOfLines={1}`,
`style={{ flexShrink: 1 }}`) beside a trailing `Text variant="caption" tone="muted"` carrying
`formatRelativeShort(item.createdAt)` and the dot. Body is
`Text variant="caption" tone="muted" numberOfLines={2}`.

`accessibilityLabel` composes title, body and age the way `TicketRow.tsx:24-30` does, **and states
unread explicitly** — the tint and weight are both invisible to a screen reader:

```tsx
const accessibilityLabel = t('notifications.rowLabel', {
  title: item.title,
  body: item.body ?? '',
  age: formatRelativeShort(item.createdAt),
  state: t(item.isRead ? 'notifications.state.read' : 'notifications.state.unread'),
});
```

**Hard rule 5**: no `marginLeft`/`marginRight`/`left`/`right`. The row is `flexDirection: 'row'` with
`gap`; RTL is handled by the layout engine, and nothing here needs a directional prop.

---

### 4 — Home: the bell badge and the navigation

#### 4a — `File: src/features/home/components/HomeHeader.tsx`

Add one prop to `HomeHeaderProps` (`:7-14`):

```tsx
  /** Unread alert count for the bell badge. `undefined` while the query is pending. */
  unreadCount: number | undefined;
```

Wrap the existing `IconButton` at `:58-63` — **do not modify it, and do not add a `badge` prop to
`core/components/IconButton.tsx`.** One caller needs this, the badge is domain data, and a generic
36px icon button is not the right home for a notification count. `AGENTS.md`'s architecture section
puts domain components under their feature; this is the same principle one level down.

```tsx
<View>
  <IconButton
    icon="bell"
    variant="subtle"
    accessibilityLabel={
      unreadCount && unreadCount > 0
        ? t('home.notificationsWithCount', { count: unreadCount })
        : t('home.notifications')
    }
    onPress={onNotificationsPress}
  />
  {unreadCount !== undefined && unreadCount > 0 ? (
    <View
      pointerEvents="none"
      style={[
        styles.badge,
        {
          top: -theme.spacing.xxs,
          end: -theme.spacing.xxs,
          backgroundColor: theme.colors.bgPrimary,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.xxs,
          borderWidth: theme.spacing.xxs / 2,
          borderColor: theme.colors.bgSurface,
        },
      ]}
    >
      <Text variant="overline" weight="semibold" tone="onPrimary">
        {formatCount(unreadCount)}
      </Text>
    </View>
  ) : null}
</View>
```

with `badge: { position: 'absolute', minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }`
in the `StyleSheet` at `:68-71`.

Four things here are load-bearing:

- **`end`, not `right`.** Hard rule 5 bans `left`/`right` and `eslint.config.js` enforces it. In RTL the badge must sit on the trailing corner, which is the *left* on screen — `end` is what does that.
- **`formatCount`** (`core/utils/format.ts:94-97`) caps at "99+" and renders digits in the active locale. It was written for this and has had no caller until now. Import it from `@/core/utils`.
- **`unreadCount !== undefined && unreadCount > 0`**, not a truthiness check. A pending query and a genuine zero must both render nothing, and they must do so for the same visible reason, but conflating them makes the loading state indistinguishable in code review.
- **`pointerEvents="none"`** — the badge overlaps the button's tap target and must not eat the press.
- **`variant="overline"`** is the smallest of the seven (`core/lib/theme/typography.ts:84-91`, `:103` → `fontSize.xs2`/`lineHeight.xs2`). Its line height is 16, exactly the badge's height, so `formatCount`'s two- and three-character strings fit without the box growing vertically — but confirm the "99+" case does not clip on Android, where a line box and its container agreeing exactly is the usual place descenders are lost. If it clips, raise the badge to 18 rather than dropping to a smaller size.

#### 4b — `File: src/features/home/screens/HomeScreen.tsx`

Import from the barrel (hard rule 4) and fill in `:118`:

```tsx
import { notificationKeys, useUnreadNotificationCount } from '@/features/notifications';
// …
const unread = useUnreadNotificationCount();
// …
<HomeHeader
  …
  unreadCount={unread.data}
  onNotificationsPress={() => router.push('/notifications')}
/>
```

**If `unread` errors, render no badge and no error state.** Home already has two `ErrorState` branches
for the ticket lists; a failed count is not worth a third, and a bell with no badge is a correct
rendering of "we do not know", where an error banner over the greeting is not.

#### 4c — Extend `handleRefresh` (`:78-81`)

```tsx
function handleRefresh() {
  void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['profile'] });
  // The badge has no other refresh path: query-client.ts sets
  // `refetchOnWindowFocus: false`, so returning to the app from a push
  // notification does not refetch it. Pull-to-refresh is it. See open question 4.
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}
```

---

### 5 — The screen and the route

#### 5a — `Create file: src/features/notifications/screens/NotificationsScreen.tsx`

Header first — Figma `128:1069`, a 56px bar: `IconButton icon="arrowBack"` + a title + a **Mark all
read** link on the trailing edge. **`ModalHeader` does not fit** (it centres its title between a
Cancel and an action, and this is a pushed screen with a back arrow, not a modal), and neither does
`ListScreenHeader` (search + filter chips). Build the bar inline in this screen, the way
`TicketDetailHeader` is a feature-local header rather than a core component. `arrowBack` is already in
`Icon.tsx`'s `DEFAULT_MIRRORED` set (`:111`), so it flips under RTL without a prop.

The **Mark all read** control is a `Pressable` + `Text variant="callout" weight="semibold" tone="link"`,
matching `ModalHeader.tsx:69-71`. Disable it when `unreadCount === 0` or the mutation is in flight;
swap in an `ActivityIndicator` while pending, as `ModalHeader.tsx:66-67` does.

Body: the `SectionList` from `TicketsScreen.tsx:130-147`, with the same branch order at `:113-128`:

```tsx
const list = useNotifications();
const sections = useMemo(() => groupNotificationsByRecency(list.data ?? []), [list.data]);
```

- `list.isPending` → `<SkeletonList count={6} />` inside `paddingHorizontal: theme.spacing.lg`.
- `list.isError` → `<ErrorState title={t('states.errorTitle')} body={t(errorMessageKey(list.error))} onRetry={() => list.refetch()} />`.
- `sections.length === 0` → `<EmptyState icon="bell" title={t('notifications.empty')} />`.
- otherwise the `SectionList`: `stickySectionHeadersEnabled={false}`, `renderSectionHeader` →
  `<SectionHeader variant="rule" title={t(section.titleKey)} />`, `refreshControl` bound to
  `list.isRefetching`, and `ItemSeparatorComponent` drawing Figma's `Divider` (`129:1096`) as a
  `StyleSheet.hairlineWidth` line in `theme.colors.borderSubtle`.

**No `FAB`.** Both other list screens have one; this screen has nothing to create.

The tap handler is the story's fourth criterion (BRD `:852`):

```tsx
const markRead = useMarkNotificationRead();

function handlePress(item: NotificationItem) {
  // Fire-and-forget, and navigate in the same tick. Awaiting the PATCH would put
  // a network round trip between the tap and the push animation, and the ticket
  // opening is the thing the agent asked for; the alert going grey is bookkeeping.
  if (!item.isRead) markRead.mutate(item.id);
  if (item.ticketId) router.push({ pathname: '/tickets/[id]', params: { id: item.ticketId } });
}
```

**`ticket_id` is nullable** (`phase1_backend_plan.md:246`). A row without one still marks read and
simply does not navigate — it must not push to `/tickets/undefined`. `typedRoutes` is on: use the
object form, never a template literal.

`markRead.isError` is deliberately not surfaced. The row stays unread, the badge stays high, and the
next tap retries. A toast over a list the agent has already navigated away from would land on the
ticket screen.

#### 5b — `Create file: src/app/notifications.tsx`

```tsx
import { NotificationsScreen } from '@/features/notifications';

export default function Notifications() {
  return <NotificationsScreen />;
}
```

Hard rule 1 — import a screen, render it. Nothing else.

#### 5c — `File: src/app/_layout.tsx`

Add one line **inside** the `status === 'signedIn'` guard (`:65-72`), after `:68`:

```tsx
        <Stack.Screen name="notifications" />
```

Default presentation — a push, matching the Back arrow at Figma `128:1071`. **Not `modal`**, which is
this repo's convention for the create/edit forms only. **Registering it outside `Stack.Protected`
would expose an agent's alerts to a signed-out deep link.**

---

### 6 — i18n and documentation

#### 6a — `File: src/core/lib/i18n/locales/en.json`

A new top-level `notifications` block. Place it after `"tickets"` (which ends before `"ticketDetail"`
at `:138`) so the file's rough screen order holds.

```json
"notifications": {
  "title": "Notifications",
  "markAllRead": "Mark all read",
  "empty": "No alerts yet. You'll see assignments, replies and status changes here.",
  "rowLabel": "{{title}}. {{body}}. {{age}} ago. {{state}}",
  "state": { "read": "Read", "unread": "Unread" }
}
```

Add to the existing `home` block (`:66-92`), beside `"notifications"` at `:83`:

```json
"notificationsWithCount": "Notifications, {{count}} unread",
```

#### 6b — `File: src/core/lib/i18n/locales/ar.json`

The same keys, same order, in the matching positions. **All six Arabic strings are this plan's, not a
translator's, and need copy review** — see open question 7. `rowLabel`'s
`"{{age}} ago"` has no natural Arabic word-order equivalent to the English template, so the Arabic
must be composed as a sentence rather than translated phrase by phrase.

#### 6c — `File: docs/phase1_api_reference.md`

Rewrite `:454-465`. Change the `🔨` at `:454` to `✅`, delete `:456` (*"Requires §9 of the backend plan.
No table exists yet."*) — it is now false — and replace it with the column list, the `select_own` /
`update_own` scoping, the **absent INSERT policy**, and the three live trigger names. Add the count
request the badge uses, which §9 does not currently document:

```
GET {{base_url}}/rest/v1/notifications?select=*&recipient_id=eq.{{user_id}}&is_read=eq.false
    Prefer: count=exact
```

#### 6d — `File: src/features/profile/notification-prefs.ts`

The comment at `:19-21` says *"There is no notifications table yet (API §9) and no push/email sender —
this stores a local preference nothing currently reads."* **The first clause is now false and the rest
is still true.** Correct it: the table exists and this story reads it, but the **push** switch still
governs nothing, because no sender exists (SCRUM-40/41). Leave the code alone.

#### 6e — `File: CLAUDE.md`

Two edits, both required by the file's own instruction that reality and this file must not diverge:

- The "Project status" paragraph says *"**Notifications is the only unbuilt phase-1 area.**"* Replace it with the notification centre as built — the pushed `/notifications` route, the badged Home bell, the five row types of which three fire — and state plainly that **OS push is not built** and that BRD `:849` is therefore open, owned by SCRUM-40/41.
- The `features/` list in "Target architecture" reads *"`notifications` (not built yet)"*. It is built.

#### 6f — `File: docs/phase1_known_issues.md`

Under **Verification gaps** (`:9`), record whichever of verification steps 1 and 2 did not pass, and
record BRD `:849` as unmet with its owner. An acceptance criterion that no story can close must be
discoverable from the repo, not only from a Jira comment.

---

## Edge Cases & Failure Modes

- **`notifications` missing from `database.ts`.** Every `supabase.from('notifications')` fails to compile. Task 0 is the fix and it is first for this reason. If `npm run gen:types` cannot authenticate, **stop** — do not hand-write the table into the generated file (hard rule 6).
- **An unrecognised `type` value.** `type` is `text` with no CHECK (`phase1_backend_plan.md:247`), so a sixth trigger, a manual insert, or a typo yields a string outside the union. `styleFor` returns `FALLBACK_STYLE` — a neutral `bell` chip on `bgSurfaceSunken`. The row still shows its title, body, time and unread state. **Never index `TYPE_STYLE` without `isNotificationType`**; the union lies about the runtime.
- **`ticket_id` is null.** The column is nullable (`:246`). The row marks read and does **not** navigate. Guarded in `handlePress`. Without the guard, `typedRoutes` accepts `id: undefined` at compile time and pushes `/tickets/undefined` at runtime, which renders the detail screen's error state and looks like a backend fault.
- **Body is null.** `body text` with no NOT NULL (`:249`). `Text` renders nothing for `null`; the row is one line shorter than Figma's 82px, which is correct. `rowLabel` interpolates `item.body ?? ''`, producing a double full stop in the screen-reader label — acceptable, and preferable to a second template.
- **Double-tapping a row.** Two `markNotificationRead` calls. Idempotent by design — this is exactly why 1b does *not* copy `claimTicket`'s `{ count: 'exact' }` compare-and-set, which would make the second tap throw.
- **Mark all read with zero unread.** `.eq('is_read', false)` matches nothing, PostgREST returns success with zero rows, `onSuccess` invalidates, nothing changes. The control is disabled in that state anyway; the query is correct without the guard.
- **Mark all read on a large backlog.** One PATCH over every unread row. Unbounded. Fine at phase-1 volumes; noted in open question 5 as the thing that changes if it is not.
- **The badge is stale.** `query-client.ts` sets `staleTime: 30_000` and **`refetchOnWindowFocus: false`**. An alert written while the app is backgrounded does not appear on the bell until Home is pulled to refresh or 30s pass with a remount. BRD `:851` says *"accurate"*. **This is the story's weakest criterion and it is a deliberate, recorded limitation** — open question 4.
- **Sign-out with alerts cached.** Both keys carry the user id (`notificationKeys.list`/`unreadCount`), and story 18's sign-out clears the whole query cache. Neither alone is sufficient — the id namespaces the entry; the clear removes it. **Verify a second agent signing in on the same device sees a zero badge**, not the previous agent's.
- **Offline.** `useNotifications` fails; `ErrorState` with `errorMessageKey`. The badge query fails and Home renders **no badge** — not a zero, which would be a lie. `markNotificationRead` fails silently and the row stays unread, which is the honest state.
- **RTL.** The row is `flexDirection: 'row'` + `gap`, no directional props. The bell badge uses `end`, not `right` — the one place in this story where hard rule 5 is doing real work rather than being satisfied by accident. `arrowBack` mirrors via `Icon.tsx:111`.
- **`unassigned` and `rating` rows are unreachable.** `pg_cron` and the CSAT flow are both outstanding (`phase1_backend_plan.md:316-321`). Both branches are written blind against Figma and **cannot be tested in this story**. Do not delete them; do not claim they were verified.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`) — no Jest, no test files, no `test`
script. This story is the strongest candidate yet for adding one: `groupNotificationsByRecency` and
`styleFor` are both pure functions with real edge cases (local midnight, an unparseable timestamp, an
unknown type string), and `state-machine.ts` has been waiting for a runner since story 09.
**This story does not install one either** — a story whose first two steps are `curl`s against
production RLS is the wrong place to introduce a test harness, and doing it here would bury the
feature diff. **File it as a standalone task**, and note that it now has two callers waiting.

1. **Nothing added here is unit-testable without a runner.** When one lands, the first two suites are `groupNotificationsByRecency` (a 23:59 local timestamp, a 00:01 local timestamp, `"not-a-date"`, an empty array) and `styleFor` (each of the five types, plus `"sla_breach"` → fallback), beside `state-machine.ts`.
2. The matrix below is the test plan. **Rows 1 and 2 are backend gates and run before any code is written.**

| # | Scenario | Expected |
|---|---|---|
| 1 | `POST` a notification row with an **agent** JWT | Rejected — no INSERT policy (verification step 1) |
| 2 | `PATCH` **another agent's** notification with my JWT | Zero rows affected; their `is_read` unchanged (verification step 2) |
| 3 | Reassign a ticket to me from a second account; open Home | Bell shows a badge of **1** after pull-to-refresh |
| 4 | Open Notifications | Alert listed under **TODAY**, blue-tinted, semibold title, blue dot |
| 5 | Tap the alert | The ticket opens; go back — row is untinted, medium weight, no dot; badge is **0** |
| 6 | Post a customer reply and change a status on my tickets | Three distinct chip colours and three distinct glyphs across the three rows |
| 7 | Seed rows dated 3 and 10 days back | Both under **EARLIER**; no "YESTERDAY" header; a yesterday-dated row also lands in Earlier |
| 8 | Seed 5+ unread, tap **Mark all read** | All rows go read in one action; badge disappears; no row is skipped |
| 9 | Seed a row with `type = 'sla_breach'` (service key) | Neutral `bell` chip; **no crash**; title/body/time all render |
| 10 | Seed a row with `ticket_id = null` | Tapping marks it read and **does not navigate** |
| 11 | Seed a row with `body = null` | One-line row, no empty second line, no crash |
| 12 | Agent with zero notifications | `EmptyState`, not a spinner and not an error |
| 13 | Go offline, open Notifications | `ErrorState` with retry; Home's bell shows **no badge** (not a zero) |
| 14 | Sign out, sign in as a **different** agent | Badge reflects the new agent; **no residue** from the previous one |
| 15 | Badge with 150 unread | Renders **"99+"**, does not widen the header or clip |
| 16 | Switch to العربية, **fully restart**, repeat 4, 5, 8, 15 | Badge on the trailing (left) corner of the bell; back arrow mirrored; both section headers and all copy read naturally |
| 17 | Regression: Home's two ticket lists, claim, and the FAB | Unchanged — task 4 touched the header and `handleRefresh` only |
| 18 | Regression: `/tickets/[id]` opened from the Tickets tab | Unchanged |
| 19 | Tablet / large phone | Row does not stretch its chip; title truncates to one line, body to two |

---

## Verification Steps

1. **Backend gate — prove a client cannot INSERT (`phase1_backend_plan.md:267`). Run FIRST.** With an **agent** JWT, never the service key (which bypasses RLS and proves nothing):

   ```bash
   curl -s -w '\n%{http_code}\n' -X POST \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -d '{"recipient_id":"'"$MY_ID"'","type":"assigned","title":"forged"}' \
     "$URL/rest/v1/notifications"
   ```

   **A `401`/`403` is a pass.** A `201` is a fail — stop, file it in `docs/phase1_known_issues.md`, and raise it the same day: a client that can fabricate an alert can phish an agent into opening any ticket. Record the **full body**, not just the code.

2. **Backend gate — prove `update_own`'s `with check` holds. Also FIRST.** Take a notification id belonging to a *different* agent (service key to read it), then PATCH it with **your** JWT:

   ```bash
   curl -s -w '\n%{http_code}\n' -X PATCH \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -H "Prefer: return=representation" \
     -d '{"is_read":true}' "$URL/rest/v1/notifications?id=eq.$OTHER_ID"
   ```

   **The expected pass is `200` with `[]`** — zero rows matched, because `using (recipient_id = auth.uid())` filtered it out. That is the same "silently-successful no-op" shape story 17 flagged as the dangerous middle case, and here it is the *correct* result rather than a worrying one — which is exactly why it must be observed rather than assumed. Then re-read the row with the service key and confirm `is_read` is unchanged. **A response containing the row is a fail.** Do this before task 1's Mark-all-read is written: it is the first bulk write this app has ever issued, and its blast radius is defined by this policy.

3. **Types:** `npm run gen:types`, then `grep -n "notifications: {" src/core/types/database.ts` returns a hit and `git diff --stat src/core/types/database.ts` shows the notifications table added and **nothing else removed**.

4. **Typecheck:** `npm run typecheck` — zero errors. This is what catches a missed `unreadCount` at `HomeHeader`'s one call site.

5. **Lint:** `npm run lint` — zero errors. Specifically: **hard rule 2** (no hex in `NotificationRow.tsx` — every colour through `theme.colors`), **hard rule 5** (`end`, not `right`, on the badge), **hard rule 4** (`@/features/notifications`, never `@/features/notifications/hooks`, in `HomeScreen.tsx`), and the single-font rule (`Text` from `@/core/components`, never `react-native`).

6. **Frontend runs:** `npm start`, then `a` and `i`. Walk matrix rows 3–19. Rows 9, 10 and 11 need seeded rows — insert them with the **service key**, since the client cannot (that is step 1's whole point).

7. **RTL** (matrix row 16): switch to العربية and **fully restart** — not a re-render. Check the badge is on the bell's trailing corner, which is its **left** in Arabic. This is the one visual that a soft reload will get wrong.

8. **Cycle check:** `grep -rn "@/features/home" src/features/notifications/` must return **nothing**. home → notifications is one-directional, and this repo already has one feature-barrel cycle it does not need a second of.

9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:849-853` (US-028).

- [ ] Given a ticket is assigned to me, when it saves, then a **push notification is sent** — **NOT MET by this repository.** The trigger writes a notification *row*, verified by matrix row 3. OS push needs `expo-notifications`, a device-token table and a sender, all owned by SCRUM-40/41. Recorded in `CLAUDE.md`, `docs/phase1_known_issues.md`, and open question 1
- [ ] Given the notification centre, when opened, then alerts list **newest first**, grouped by **Today** and **Earlier**
- [ ] Given unread alerts, when Home renders, then the bell shows an **accurate badge count** — accurate as of the last fetch; see open question 4
- [ ] Given I open an alert, when tapped, then **the related ticket opens and the alert marks read**
- [ ] Given the alert row, when designed, then it **accommodates a severity indicator for future SLA alerts** — `TYPE_STYLE` carries all five types today, and a sixth is one map entry

Plus, from the intake and this plan:

- [ ] `src/core/types/database.ts` **regenerated**, not hand-edited, and its diff reviewed
- [ ] `features/notifications/` follows the standard anatomy; `index.ts` is its **only** import surface
- [ ] No insert path exists in `api.ts` — the client never fabricates an alert
- [ ] Every query filters `recipient_id` explicitly, RLS notwithstanding
- [ ] **One** `NotificationRow` with five type values and an `unread` boolean — **not ten variants**
- [ ] Unread is signalled by **tint, title weight and dot together** — never colour alone
- [ ] An unknown `type` renders the fallback chip and **does not crash**
- [ ] A null `ticket_id` marks read and does not navigate
- [ ] `/notifications` is registered **inside** `Stack.Protected`
- [ ] Home's bell pushes the route and `HomeScreen.tsx:118`'s `() => {}` is gone
- [ ] `handleRefresh` invalidates `notificationKeys.all`
- [ ] The badge uses `formatCount` (its first caller) and `end`, not `right`
- [ ] No `badge` prop was added to `core/components/IconButton.tsx`
- [ ] `grep -rn "@/features/home" src/features/notifications/` is empty
- [ ] All keys added to **both** locale files, in the same order
- [ ] `docs/phase1_api_reference.md` §9 no longer says the table does not exist
- [ ] `notification-prefs.ts:19-21`'s comment corrected
- [ ] `CLAUDE.md` no longer says notifications is unbuilt — **and records that BRD `:849` is open**
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] Verification steps 1 and 2 run, with response bodies recorded

---

## Open questions — raise with design/product, do not resolve silently

1. **"Push notification" (BRD `:849`) is not deliverable here and the criterion should be split.** A push needs `expo-notifications`, a `device_tokens` table with its own RLS, an Edge Function calling APNs/FCM, and — per `core/lib/theme/fonts.ts`'s own analysis of the config-plugin tradeoff — **a development build**, which this project has deliberately avoided so far. `phase1_backend_plan.md:238` already assigns the sender to SCRUM-40/41. US-028 as written cannot be signed off by any client story, and the honest fix is to move `:849` onto SCRUM-40 and leave US-028 with the four criteria this story does meet. **Decide this before sign-off, not during it** — otherwise the story closes with a criterion quietly unticked, which is how `:722` slipped through story 17.

2. **Three colour tokens are wrong, missing, or misnamed for this row.** (a) Figma binds the `assigned` chip to `palette.blue100` `#dbeafe`; the repo has no such token, and the nearest, `bgTabActive` `#e3ebfb`, exists for the active-tab pill. `bgPrimarySubtle` `#f4f7ff` is unusable — near-white on a white surface. (b) Figma binds `unassigned`/`rating` ink to `palette.amber500` `#c75b00`; the repo's `statusWarning` is `#c2410c`. Neither is a rounding error. (c) The `status` chip needs `#f3eef9`/`#6750a4`, which the repo has **at exactly the right values under the wrong names** — `bgInternalSubtle`/`textInternal`, whose comment (`colors.ts:56`) says *"Internal notes only — not a general-purpose purple (story 07)."* Either that constraint is wrong, or the two uses need separate semantic aliases over the same primitives. **All three go on the §15 list; do not add a primitive to close them.**

3. **`status` and `unassigned` are distinguished by colour alone in Figma.** Both draw a clock glyph (`129:1113`, `129:1131`); only the tint differs, purple against amber. That is precisely the failure `TicketRow.tsx:57-59` already documents for priority — *"the coloured bar alone fails for colour-blind users"* — and `:853` calls the SLA affordance a **severity** indicator, which is a strong reason for it not to be a hue. **This plan uses `alert` for `unassigned` rather than shipping the same glyph twice**, which is a deviation from the Figma frame and needs design's confirmation. If they prefer the clock, `unassigned` needs a second non-colour cue instead.

4. **The badge cannot be accurate without a refresh path, and `:851` says "accurate".** `query-client.ts` sets `refetchOnWindowFocus: false`, so an alert arriving while the app is backgrounded is invisible until Home is pulled to refresh. Three fixes, in ascending cost: a `refetchInterval` on the count query alone; a Supabase Realtime subscription on `notifications` filtered to `recipient_id` (the correct answer, and the first Realtime use in the app); or the push notification from question 1, whose arrival is the natural invalidation trigger. **Realtime and push solve the same problem and the choice is architectural**, not an implementation detail — decide before someone adds a 30-second poll on a phone that is also on a call.
   
5. **No pagination, and Mark all read is unbounded.** `fetchNotifications` has no `limit`; `markAllNotificationsRead` PATCHes every unread row. Both are correct for an agent with tens of alerts and neither is for one with thousands, and nothing prunes the table — the design has no "clear" action and the backend has no retention job. **Ask whether notifications expire.** If they do not, this needs a `limit` + infinite scroll and the mark-all needs a server-side function, and the optimistic-update decision in task 1 flips too.

6. **Figma's frame contradicts itself on navigation.** `7:3066` contains both a **Back arrow** (`128:1071`) and the **`BottomNav`** (`60:267`), which cannot both be right: a pushed screen covers the tab bar, and a tab screen has no back arrow. This plan pushes, on the Back arrow's authority and because the app's four tabs are fixed by `(tabs)/_layout.tsx`. **Confirm** — if notifications is meant to be reachable while the tab bar is visible, that is a different route structure, not a styling change.

7. **Six new Arabic strings need copy review.** All are this plan's, not a translator's. Two need particular attention: `notifications.empty` names three event types in a sentence and will not survive a literal translation; and `rowLabel` is a screen-reader-only template whose English word order (`{{title}}. {{body}}. {{age}} ago. {{state}}`) has no Arabic equivalent and must be recomposed rather than translated. **Reusing `tickets.groups.today`/`earlier` is deliberate** (see task 2) and should be confirmed rather than silently duplicated later.

8. **Figma draws an 8×8 mark on Home's bell, and BRD `:851` asks for a count.** Node `7:41`'s badge is a `7.98×7.98` text node — the same size as the row's `Unread dot` ellipse. Nothing two digits wide fits in it, let alone "99+". This plan builds the **count** badge, because `:851` is the signed criterion and `formatCount` (`format.ts:94-97`) was written for exactly this and has never had a caller. **But design drew a dot**, and a dot is a defensible answer to "do I have unread alerts". Confirm which; if it is the dot, `formatCount` loses its only caller again and should be noted as dead code rather than left to look used.

9. **This story reads the notification rows that `features/profile`'s "Push" switch claims to control.** `ProfileScreen.tsx:139-141` offers Push and Email toggles whose stored value nothing reads (`notification-prefs.ts:19-21`), and `profile.notifications.pending` tells the agent *"Notifications aren't sending yet."* After this story that message is **half wrong** — in-app alerts very much are arriving, and the agent has no switch that governs them. Task 6d fixes the code comment; **the user-facing string needs a product decision**: either the copy narrows to push/email specifically, or an "In-app" switch is added and something has to honour it.

**STOP HERE. Report to the user.**
