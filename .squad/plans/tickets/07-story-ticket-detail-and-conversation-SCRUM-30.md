# Story 07 — Ticket detail and conversation thread (Story: SCRUM-30)

> Intake: `.squad/stories/tickets/SCRUM-30/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:1638` (`Tickets - Detail`); the screen body is `7:1643`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). Supplies the token layer, `Text`/`Icon`/`TextInput`, `Tab`/`TabBar`, `Avatar`, `IconButton`, `EmptyState`, `ErrorState`, `SkeletonList`. This story is the **first consumer of `Tab`/`TabBar`** — they have none today (`grep -rn '<TabBar' src/` → no hits).
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md). `useAuth().session.user.id` is the `author_id` on every message this story posts.
- **Story 04 completed** — [`04-story-ticket-list-with-filters-SCRUM-27.md`](04-story-ticket-list-with-filters-SCRUM-27.md). It owns `src/features/tickets/`, `ticketKeys`, `StatusBadge` and `TicketRow`. This story adds to all of them and **wires the `handleTicketPress` no-op** that story left at `TicketsScreen.tsx:27-29`.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md). Its `HomeScreen.tsx:29-31` carries the **same** `handleTicketPress` no-op, and this story wires that one too.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Seeded data**: one ticket with **all three message kinds** on it — at least one customer-authored message, one agent-authored public reply, and one internal note — plus several `ticket_events` rows, a customer with a phone and an email, and a ticket in each of `new` / `open` / `pending` / `resolved` / `closed` so the status-dot and the state machine can both be exercised.

**This story does not depend on stories 05 or 06** and touches none of their files.

---

## Two corrections to the intake's premises

Both were checked against the real tree before this plan was written. Neither is a reason not to proceed; both change what the executor does.

**1. `src/features/tickets/state-machine.ts` does not exist.** The intake says "reuse `src/features/tickets/state-machine.ts` rather than re-deriving the transition map". `ls src/features/tickets/` returns `api.ts`, `components`, `grouping.ts`, `hooks.ts`, `index.ts`, `screens`, `types.ts` — no `state-machine.ts`. **This story creates it** (task 3), from `docs/phase1_brd_1.md:216-247`. The intake's instruction still holds in spirit: derive it **once**, in that file, and never inline a second copy.

**2. The `is_internal` typing requirement is already satisfied by the generated types.** The intake asks that `is_internal` be "a required field in the mutation payload, never optional". `src/core/types/database.ts:406` already declares it `is_internal: boolean` in `Insert` — **no `?`** — while every other insertable column on that table is optional. The executor's job is therefore **not** to add a guard but to avoid destroying one: do not type the mutation input as `Partial<…>`, do not spread through a `Record<string, unknown>`, and do not give the payload builder a default. Task 4 states the shape that keeps the compile error reachable.

---

## Story Goal

An agent opens a ticket from Home or the Tickets tab and works it without leaving the screen. Concretely:

1. **A header** carrying reference, subject, status and priority, with a back affordance.
2. **A customer strip** showing name, company · department, and phone/email actions.
3. **Three segments** — **Conversation**, **Internal notes**, **History** — behind a tab bar.
4. **A reserved, collapsible AI-summary slot** above the thread. This is an explicit acceptance criterion (`docs/phase1_brd_1.md:650`), not decoration.
5. **A composer** that posts either a public reply or an internal note, with the mode carried by colour, icon **and** label together.
6. **An internal-note row that is unmistakably a different class of row** — its own rail colour, a wash across the whole row, a lock icon and an `INTERNAL` label. The intake is emphatic about this; §"Design spec" records that the fetched Figma frame agrees.

**Not in scope** — see the BRD-mapping note below and **Open questions** flag 1: assigning a ticket (US-017, API §4.8), committing a status change (US-018, API §4.9), attachments (§8 is 🔨), and the customer profile the contact strip should open (US-008, unbuilt — flag 3).

---

## Which BRD stories this covers, and which it does not

This screen is where four BRD stories meet. Being explicit about the split is the whole of flag 1.

| BRD story | Line | Covered here? |
|---|---|---|
| **US-014** Ticket detail and conversation thread | `:641-650` | **Yes** — this is the story. |
| **US-015** Post a public reply | `:652-661` | **Yes** — the intake names API §5.3. |
| **US-016** Post an internal note | `:667-677` | **Yes** — the intake names API §5.4 and the `is_internal` constraint. |
| **US-019** Ticket history timeline | `:710-718` | **Yes** — the intake names API §4.10, and Figma puts History in the tab bar. |
| **US-017** Assign a ticket | `:681-691` | **No.** API §4.8 is absent from the intake's endpoint list. The header's **Assign** button renders inert (task 6). |
| **US-018** Ticket status transitions | `:695-707` | **Partly.** `state-machine.ts` is created here (task 3) because the intake names it; the **PATCH is not**. API §4.9 is absent from the intake's endpoint list. The header's **Status** button renders inert (task 6). |

The intake's API section lists exactly **§4.6, §5.1–5.4, §4.10** — detail, messages both directions, history. §4.8 and §4.9 are not there. The plan follows the endpoint list, not the passing mention of a status picker in the prose.

---

## Context — Read These Files First

1. `src/features/tickets/api.ts` — the whole file (~230 lines after story 04). Copy its shape: a `*_SELECT` constant per projection, a private `…Row` type, a `to…` mapper, `toAppError` at every boundary. Note `LIST_SELECT_INNER` and `searchTickets` (the two-query search fallback) — **unrelated to this story, do not touch them.**
2. `src/features/tickets/hooks.ts` — the whole file (125 lines). `ticketKeys` (lines 25-35) is the object task 5 extends. Read the comment above it: everything hangs off the `'tickets'` root so one invalidation refreshes lists and counts. The new detail keys hang off the **same** root but under `['tickets', <id>]`, so `invalidateQueries({ queryKey: ['tickets', id] })` refreshes one ticket's detail, messages and events **without** refetching every list.
3. `src/features/tickets/components/TicketRow.tsx` — the whole file. `priorityColor` (lines 19-30) maps priority → `statusDanger`/`statusWarning`/`statusInfo`/`borderDefault`. The detail header needs the same mapping, so task 2 **extracts it** rather than copying it (hard rule 2). `borderStartWidth: 3` (line 51) is the logical-property precedent every rail in this story follows.
4. `src/features/tickets/components/StatusBadge.tsx` — the whole file. Its header comment records that `pending` has **no colour token** and ships neutral as an interim (story 03 open question 1, story 04 flag 2). The detail header's status **dot** inherits that gap — task 6 reuses the same `styleFor` decision rather than inventing a second one.
5. `src/core/components/Tab.tsx` — the whole file (~100 lines). `Tab` takes `label`/`selected`/`onPress` and renders a `tabActive`/`tabInactive` label over a 2px indicator; `TabBar` wraps children with `accessibilityRole="tablist"` and `gap: spacing.lg`, and has a `scrollable` variant. **Three tabs fit; use the non-scrollable form.**
6. `src/core/lib/theme/primitives.ts` — all 60 lines. **There is no purple anywhere in it.** Figma's internal-note rail and wash resolve to `palette.purple500` `#6750a4` and `palette.purple50` `#f3eef9` (verified via `get_variable_defs` on node `91:989`). Task 1 adds them; this is the one file where a colour literal is legal (hard rule 2).
7. `src/core/lib/theme/colors.ts` — the 35 semantic keys and the `ThemeColors`/`ColorToken` derivation. `darkColors` is exhaustiveness-checked against `lightColors`, so a key added to one **must** be added to the other or `npm run typecheck` fails. That is the safety net for task 1.
8. `src/core/types/database.ts:392-432` (`ticket_messages`) and `:347-390` (`ticket_events`). Note `ticket_messages.Insert.is_internal: boolean` — required, per the correction above. `ticket_events.event_type` is the enum `"created" | "status_changed" | "assigned" | "priority_changed"` (`:551`), which is exactly the set task 8's history rows must render. **Generated; never hand-edit.**
9. `docs/phase1_api_reference.md` §4.6 (lines 249-255), §4.10 (lines 315-323), §5.1-5.4 (lines 327-357). §4.6's `profiles!assigned_to` disambiguates a double FK — `tickets` references `profiles` twice, as assignee and as creator; omitting the hint is a PostgREST error, not a silent wrong join. §5's closing note explains why `is_internal` is `NOT NULL` with no default.
10. `docs/phase1_brd_1.md:216-247` — **§6 Ticket State Machine**, the transition table task 3 transcribes. Read the four rules under it too: transitions are rejected at the **database** layer, every transition writes a `ticket_events` row, `resolved_at`/`closed_at` are set on entry, and "the status picker only offers reachable states".
11. `docs/phase1_brd_1.md:641-650` (US-014), `:652-661` (US-015), `:667-677` (US-016), `:710-718` (US-019) — the four criteria lists `## Done Criteria` mirrors.
12. `src/app/_layout.tsx:54-73` — `RootNavigator`. The protected block declares only `<Stack.Screen name="(tabs)" />`; task 9 adds the detail route as a **sibling** of `(tabs)`, so it pushes over the tab bar with its own back affordance — which is what Figma shows (node `7:1643` has no `BottomNav`).
13. `app.json` — `experiments.typedRoutes` is `true`. Creating `src/app/tickets/[id].tsx` generates the route type, so `router.push(\`/tickets/${id}\`)` typechecks. Until the file exists it does **not**, which is why stories 03 and 04 left no-ops rather than dead pushes.
14. `src/core/utils/format.ts` — `formatDate`, `formatDateTime`, `formatRelative`, `formatRelativeShort`, `formatNumber`, `formatCount`, `initialsOf`. **There is no time-only formatter**; Figma's message rows show `08:26`. Task 2 adds `formatTime`.
15. `src/features/customers/index.ts` — the barrel. This story does **not** import from it; the contact strip renders the customer fields the §4.6 join already returns. Reaching into `@/features/customers` for a detail query would be a second round trip for data already in hand.

---

## Design spec (resolved from Figma node `7:1638`)

Structure, from `get_metadata` on `7:1638`:

```
TicketDetailScreen 7:1643
├── 91:896  Header (124h)
│   ├── 91:897  back IconButton (36) + 91:902 reference text
│   ├── 91:903  subject (26h)
│   └── 91:904  Meta → 91:906 StatusDot · 91:909 separator · 91:910 PriorityTag
│                    → 91:913 Actions → 91:914 "Assign" / 91:916 "Status"
├── 91:918  ContactStrip (66h)
├── 91:934  TabBar (38h) → 91:935 / 91:939 / 91:943  Tab ×3
├── 91:947  AISummaryBar (40h)
├── 91:956  Thread → 91:957 … 91:1003  MessageRow ×6
└── 91:1011 ReplyComposer (102h)
```

**The rail colours, verified one node at a time** (`get_variable_defs`):

| Row kind | Node | Figma variable | Token |
|---|---|---|---|
| Customer message | `91:957` | `palette.blue500` `#1a56db` | `colors.statusInfo` |
| Agent public reply | `91:965` | `palette.green500` `#2e7d32` | `colors.statusSuccess` |
| **Internal note** | `91:989` | `palette.purple500` `#6750a4` + wash `palette.purple50` `#f3eef9` | **new — task 1** |

| Element | Figma | Token / component |
|---|---|---|
| Screen background | surface | `colors.bgSurface` |
| Horizontal inset | 16 | `spacing.lg` |
| Back button | 36 | `<IconButton icon="arrowBack" size={36} variant="ghost" />` |
| Reference | 12/18 muted | `<Text variant="caption" tone="muted">` |
| Subject | 18/26 semibold, `tracking.tight` | `<Text variant="heading" weight="semibold">` |
| Status dot | 8 circle + 12/18 label | `radius.full`; colour from `StatusBadge`'s existing map |
| Meta separator | 3×3 dot | `radius.full`, `colors.borderDefault` |
| Priority tag | 3px rail + 12/18 label | `borderStartWidth: 3`, colour from the extracted `priorityColor` |
| Assign / Status buttons | 26h outline pills | `radius.full`, `borderDefault`, `<Text variant="caption">` |
| Contact strip | 66h, avatar 40, `borderSubtle` bottom | `<Avatar size={40} tint="info" />` |
| Contact name | 14/20 | `<Text variant="callout" weight="medium">` |
| Contact subtitle | 12/18 muted | `<Text variant="caption" tone="muted">` |
| Phone / mail actions | 2 icon buttons | `<IconButton icon="phone" />` / `"mail"` |
| Tab bar | 38h, 3 tabs | `<TabBar>` + `<Tab>` ×3 |
| AI summary bar | 40h; `star` icon in `colors.info`, chevron | `<Icon name="sparkle" />`, `chevronDown` |
| Message rail | 3px full height | `borderStartWidth: 3` — **logical property** |
| Message author | 14/20 semibold | `<Text variant="callout" weight="semibold">` |
| Message time | 12/18 muted | `<Text variant="caption" tone="muted">` — `formatTime`, task 2 |
| Message body | 14/20 | `<Text variant="callout">` |
| `INTERNAL` pill | 10/16, `radius.full`, lock icon | `<Text variant="overline">` + `<Icon name="lock" size={10} />` |
| Composer mode chips | filled / outline pills | `<FilterChip>`; see task 7 |
| Composer input | 44h, `surfaceSunken`, `radius.lg` | `colors.bgSurfaceSunken`, `radius.lg` |
| Send button | 40 circle, `colors.primary` | `radius.full`, `colors.bgPrimary`, `<Icon name="send" />` |

**Every icon this screen needs already exists** in `IconName`: `arrowBack`, `phone`, `mail`, `sparkle`, `chevronDown`, `lock`, `paperclip`, `send`, `message`, `clock`, `check`, `user`. No additions. `arrowBack` and `send` are both in `DEFAULT_MIRRORED` (`Icon.tsx:106`), so they flip correctly in Arabic.

**The fetched frame satisfies the intake's internal-note requirement.** The intake warns that "several design iterations rendered this as chat bubbles with subtle colour differences only". Node `91:989` does not: it has its own rail (`purple500`), a full-row wash (`purple50`), a lock glyph and an `INTERNAL` label — all four cues the intake demands. Build it as fetched; no override needed.

**The contact-strip avatar is one step off.** Figma tints it `palette.blue800` `#1a3f8f` on `colors.primarySubtle`. `blue800` is not in `primitives.ts` and story 05's `Avatar` `tint="info"` resolves to `blue500` on `bgTabActive`. Use `tint="info"`; the difference is one ramp step on a 40px circle. **Do not add a second blue primitive for it.**

---

## Implementation tasks

### 1 — Add the purple the internal-note treatment needs

**File: `src/core/lib/theme/primitives.ts`**

There is no purple in the palette. Figma's internal rail and wash are `#6750a4` and `#f3eef9`, read off node `91:989`. Add them beside the other status hues, in the same shape:

```ts
  // Internal notes — the only non-status use of a hue. Figma `palette.purple500`
  // / `palette.purple50` (node 91:989). No dark counterparts are specified in
  // the file; the two below follow the same derivation as the green/orange/red
  // Subtle-dark values — see the story's open question 2.
  purple500: '#6750a4',
  purple300: '#c9b8ee',
  purpleSubtleLight: '#f3eef9',
  purpleSubtleDark: '#241a3d',
```

**File: `src/core/lib/theme/colors.ts`**

Add three semantic keys to **both** `lightColors` and `darkColors`. `ThemeColors` is derived from `lightColors` and `darkColors` is exhaustiveness-checked against it, so adding to one alone is a typecheck failure — that is the intended guard, not an obstacle.

```ts
// light
bgInternalSubtle: primitives.purpleSubtleLight,
borderInternal: primitives.purple500,
textInternal: primitives.purple500,

// dark
bgInternalSubtle: primitives.purpleSubtleDark,
borderInternal: primitives.purple300,
textInternal: primitives.purple300,
```

Add `internal` to `TextTone` and `TONE_TOKEN` in `src/core/components/Text.tsx` (the `TextTone` union and its `Record<TextTone, ColorToken>` map), mapping to `textInternal`. That is what lets the `INTERNAL` label be written as `<Text tone="internal">` instead of reaching for a raw colour.

**Do not touch `StatusBadge`.** The same `purple500` would resolve story 03's `statusPending` flag, but that is a design decision about *status*, not about internal notes — see **Open questions** flag 2.

### 2 — Two small shared extractions

**Create file: `src/features/tickets/priority.ts`**

`priorityColor` currently lives inside `TicketRow.tsx` (lines 19-30). The detail header's priority tag is a second consumer, so it moves (hard rule 2 — but it stays in `features/tickets/`, not `core/`, because it is domain vocabulary):

```ts
import type { Theme } from '@/core/lib/theme';
import type { TicketPriority } from './types';

export function priorityColor(priority: TicketPriority, theme: Theme): string;
```

Move the body verbatim, import it in `TicketRow.tsx`, and delete the local copy. `TicketRow`'s rendering must not change — story 04's manual matrix row 17 (the urgent/high glyph) is the regression check.

**File: `src/core/utils/format.ts`**

Figma's message rows show `08:26` — time only. `formatDateTime` returns day + month + time, which is wrong for a thread where every message is from the same day. Add beside it:

```ts
/** Time only, for message rows within a day's thread: "08:26" / "٠٨:٢٦". */
export function formatTime(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(tag(locale), { hour: '2-digit', minute: '2-digit' }).format(date);
}
```

Export it from `src/core/utils/index.ts`. **Leave `formatDateTime` alone** — the history timeline (task 8) wants the day, so both are needed.

### 3 — The state machine

**Create file: `src/features/tickets/state-machine.ts`**

The intake names this file as though it exists; it does not. Transcribe `docs/phase1_brd_1.md:220-247` and nothing else:

```ts
import type { TicketStatus } from './types';

/**
 * BRD §6 (`docs/phase1_brd_1.md:216-247`), transcribed once.
 *
 * This map is NOT the guarantee — the database trigger is, and API §4.9's
 * negative tests are what prove it. This exists so the picker never offers an
 * illegal option in the first place. If the two ever disagree, the database is
 * right and this file is wrong.
 */
const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  new: ['open'],
  open: ['pending', 'resolved'],
  pending: ['open', 'resolved'],
  resolved: ['closed', 'open'],
  closed: [], // terminal
};

export function allowedTransitions(from: TicketStatus): readonly TicketStatus[];
export function canTransition(from: TicketStatus, to: TicketStatus): boolean;
/** `resolved` requires a resolution note (BRD §6, API §4.9). */
export function requiresResolutionNote(to: TicketStatus): boolean;
```

`Record<TicketStatus, …>` makes a forgotten status a compile error if the enum ever grows.

**Its only consumer in this story** is the header's **Status** button, which is `disabled` when `allowedTransitions(status).length === 0` — i.e. on a `closed` ticket. That is a real use, and it means US-018 inherits a module that is already correct rather than writing one under deadline. Everything else in US-018 (the picker sheet, the resolution-note field, the PATCH) is out of scope here.

### 4 — The data layer

**File: `src/features/tickets/types.ts`**

```ts
/** The §4.6 projection, camelCased. Wider than `TicketListItem` — this is one ticket. */
export type TicketDetail = {
  id: string;
  reference: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  resolutionNote: string | null;
  customer: { id: string; fullName: string; phone: string; email: string | null } | null;
  categoryName: string | null;
  assigneeName: string | null;
};

/** Which thread a message belongs to. The two are fetched separately, never filtered client-side. */
export type MessageKind = 'public' | 'internal';

export type TicketMessage = {
  id: string;
  body: string;
  createdAt: string;
  isInternal: boolean;
  authorName: string | null;
  /** null when the row has no `author_id` — a customer-authored message. */
  authorId: string | null;
};

export type TicketEventType = Database['public']['Enums']['event_type'];

export type TicketEvent = {
  id: string;
  eventType: TicketEventType;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actorName: string | null;
};
```

**File: `src/features/tickets/api.ts`** — append; touch nothing above.

**4a. Detail** (§4.6). The `profiles!assigned_to` hint is mandatory — `tickets` references `profiles` twice, so an unhinted `profiles(full_name)` is a PostgREST error:

```ts
const DETAIL_SELECT =
  '*, customers(id, full_name, phone, email), categories(name_en, name_ar), profiles!assigned_to(full_name)';

export async function fetchTicketDetail(ticketId: string): Promise<TicketDetail | null>;
```

Use `.eq('id', ticketId).maybeSingle()` — a ticket RLS hides resolves `null`, which is **not** an error, exactly as `fetchAgentProfile` does (`features/auth/api.ts`). Pick the localised category name with the same `currentLocale()`-aware helper `auth/api.ts`'s `localisedName` uses; if that helper is still private there, duplicate the three lines locally rather than exporting from another feature's internals (hard rule 4).

**4b. Messages** (§5.1 / §5.2) — **two queries, one per kind.** The intake's reason is a security one and it is correct: fetching both and filtering client-side puts internal notes in the public thread's memory, where a rendering bug can leak them.

```ts
const MESSAGE_SELECT = 'id, body, created_at, is_internal, author_id, profiles(full_name)';

export async function fetchTicketMessages(
  ticketId: string,
  kind: MessageKind,
): Promise<TicketMessage[]>;
```

`.eq('is_internal', kind === 'internal')` and `.order('created_at', { ascending: true })` — §5.1's `order=created_at` is ascending, oldest first, which is what a thread wants.

**4c. Posting** (§5.3 / §5.4). This is the signature the intake's `is_internal` requirement hangs on:

```ts
/**
 * `isInternal` is REQUIRED, not optional, and there is no default anywhere in
 * this function. `ticket_messages.is_internal` is NOT NULL with no default
 * (`database.ts:406` types it `is_internal: boolean` in Insert — the only
 * non-optional insertable column besides `body` and `ticket_id`). API §5's
 * closing note is explicit that this is deliberate: if a payload without it
 * ever succeeds, internal notes can silently become public. Do not add a
 * default, do not widen this to Partial, do not build the payload through a
 * Record<string, unknown> — each of those turns a compile error into a
 * runtime leak.
 */
export async function postTicketMessage(input: {
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
}): Promise<TicketMessage>;
```

`.insert({ ticket_id, author_id, body, is_internal })`, then `.select(MESSAGE_SELECT).single()` so the mutation returns the row the optimistic UI would otherwise have to fabricate.

**4d. History** (§4.10):

```ts
const EVENT_SELECT = 'id, event_type, from_value, to_value, created_at, profiles(full_name)';

export async function fetchTicketEvents(ticketId: string): Promise<TicketEvent[]>;
```

`.order('created_at', { ascending: false })` — §4.10 is `desc`, newest first, which is what a timeline wants. Note the opposite direction from messages; both match their endpoints.

**No update or delete function for `ticket_events`.** BRD `:717` requires that no edit or delete affordance exists, and §4.10's immutability test expects the API to reject both. Not writing one is the implementation.

### 5 — Hooks

**File: `src/features/tickets/hooks.ts`**

**5a. Extend `ticketKeys`** (lines 25-35). The detail keys sit under `['tickets', <id>]`, so `invalidateQueries({ queryKey: ticketKeys.detail(id) })` refreshes one ticket's detail, both threads and its events **without** touching the lists or counts:

```ts
  detail: (ticketId: string) => ['tickets', ticketId] as const,
  messages: (ticketId: string, kind: MessageKind) =>
    ['tickets', ticketId, 'messages', kind] as const,
  events: (ticketId: string) => ['tickets', ticketId, 'events'] as const,
```

The existing list keys are `['tickets', 'list', …]` and counts are `['tickets', 'count', …]`; ids are UUIDs, so a ticket id can never collide with the `'list'`/`'count'` segments. `ticketKeys.all` still prefixes everything, so story 04's claim invalidation is unaffected.

**5b. Queries** — `useTicketDetail(ticketId)`, `useTicketMessages(ticketId, kind)`, `useTicketEvents(ticketId)`. All three take `enabled: Boolean(ticketId)`.

**5c. The post mutation:**

```ts
export function usePostTicketMessage(ticketId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: (input: { body: string; isInternal: boolean }) =>
      postTicketMessage({ ticketId, authorId: userId as string, ...input }),
    onSuccess: (_message, input) => {
      // Only the thread that was posted to — the other kind cannot have changed,
      // and the lists don't show message counts.
      void queryClient.invalidateQueries({
        queryKey: ticketKeys.messages(ticketId, input.isInternal ? 'internal' : 'public'),
      });
    },
  });
}
```

**Do not invalidate `ticketKeys.all`** here. Posting a message changes neither the ticket row nor any list or count, and a blanket invalidation would refetch five list queries per reply.

### 6 — Header and contact strip

**Create file: `src/features/tickets/components/TicketDetailHeader.tsx`**

```tsx
export type TicketDetailHeaderProps = {
  ticket: TicketDetail;
  onBack: () => void;
  onAssignPress: () => void;
  onStatusPress: () => void;
  statusDisabled: boolean;
};
```

Back `IconButton` + reference on one row; subject below; then the meta row — status dot, a 3px separator dot, the priority tag, and the two outline buttons pushed to the trailing edge with `flex: 1` on the left group.

- **Status dot** — an 8px `radius.full` circle plus the status label. Derive the colour from the **same** decision `StatusBadge` already made rather than inventing a second map: export `styleFor` from `StatusBadge.tsx` (renaming it `statusStyle`) and read its `tone`. `pending` therefore stays neutral here too — one flagged gap, not two.
- **Priority tag** — `borderStartWidth: 3` with `priorityColor(...)` from task 2, plus the `ticket.priority.*` label story 04 added to both locales. Never `borderLeftWidth`.
- **Assign** — `onPress={onAssignPress}`; the screen passes a no-op with `// TODO(US-017): open the assign sheet once it exists.`
- **Status** — `onPress={onStatusPress}`, and `disabled={statusDisabled}` where the screen computes `allowedTransitions(ticket.status).length === 0`. Its handler is `// TODO(US-018): open the status picker once it exists.`

Both buttons render because Figma shows them and hiding them would misrepresent the screen; both are inert because their endpoints are out of scope. This is the same treatment stories 04 and 05 gave the FAB.

**Create file: `src/features/tickets/components/ContactStrip.tsx`**

Avatar + name + `[companyOrCategory, department].filter(Boolean).join(' · ')` + phone and mail `IconButton`s, with a `borderSubtle` bottom hairline. **Filter before joining** — the `· undefined` failure mode story 03 documented on Home.

The strip is a `Pressable` whose `onPress` is `// TODO(US-008): open the customer profile once the route exists.` BRD `:648` requires the tap to open the customer profile and **this story cannot satisfy that** — flag 3.

The phone and mail buttons use `Linking.openURL(\`tel:${phone}\`)` / `mailto:`. Guard the mail one: `email` is `string | null` (`database.ts:217`), so render it `disabled` when null rather than opening `mailto:null`.

### 7 — The thread, the composer, and the AI slot

**Create file: `src/features/tickets/components/MessageRow.tsx`**

```tsx
export type MessageRowProps = { message: TicketMessage; currentUserId?: string };
```

Three visual kinds, decided in one place:

```ts
type RowKind = 'customer' | 'agent' | 'internal';

// `is_internal` wins over authorship: an internal note is an internal note
// regardless of who wrote it.
function rowKind(message: TicketMessage): RowKind {
  if (message.isInternal) return 'internal';
  return message.authorId === null ? 'customer' : 'agent';
}
```

| Kind | Rail | Background | Extra |
|---|---|---|---|
| `customer` | `statusInfo` | `bgSurface` | — |
| `agent` | `statusSuccess` | `bgSurface` | — |
| `internal` | `borderInternal` | `bgInternalSubtle` | lock icon + `INTERNAL` pill |

The internal row carries **all four** cues the intake demands — rail, full-row wash, `lock` glyph, and the literal label. Do not reduce it to a tint difference; that is the exact failure the intake calls out, and three of the four cues survive greyscale and colour-blindness.

Layout: `borderStartWidth: 3`, `paddingVertical: spacing.md`, `paddingHorizontal: spacing.lg`; a header line with the author name (`callout`/semibold), the `INTERNAL` pill when applicable, and `formatTime(createdAt)` pushed trailing; then the body as `<Text variant="callout">`. The body is **not** `numberOfLines`-clamped — a thread row must show the whole message.

Give the row an `accessibilityLabel` that names the kind: `t('ticketDetail.message.labelInternal', { author, time })` for internal notes, so the distinction survives for a screen-reader user who cannot see the wash at all.

**Create file: `src/features/tickets/components/AiSummaryBar.tsx`**

BRD `:650` requires "a collapsible slot reserved above the thread for a future AI summary". Ship exactly that: a 40h `Pressable` row — `sparkle` icon in `statusInfo`, the `ticketDetail.aiSummary` label, and a `chevronDown` that rotates on expand — over a body that renders `t('ticketDetail.aiSummaryPending')` ("Summaries aren't available yet."). Collapsed by default.

`accessibilityRole="button"` with `accessibilityState={{ expanded }}`. There is no AI backend in phase 1 — see flag 4.

**Create file: `src/features/tickets/components/ReplyComposer.tsx`**

```tsx
export type ReplyComposerProps = {
  onSend: (input: { body: string; isInternal: boolean }) => void;
  sending: boolean;
  error?: string;
};
```

Two `FilterChip`s — `ticketDetail.composer.public` / `.internal` — then a row of attach button, `TextInput`, send button.

- Mode state is local: `const [mode, setMode] = useState<MessageKind>('public')`.
- **BRD `:674` requires the internal mode be indicated "by color, icon and label together."** The selected chip gives colour and label; add the `lock` glyph to the internal chip so all three are present. When `mode === 'internal'`, also tint the input container's border `borderInternal` — the agent must not be able to mistake which thread they are typing into.
- **Send is disabled when `body.trim()` is empty** (BRD `:660`), and while `sending`.
- `onSend({ body: body.trim(), isInternal: mode === 'internal' })`, then clear the input **only after the mutation resolves** — clearing optimistically loses the text if the post fails.
- The attach button is `disabled` with `// TODO(US-???): attachments — API §8 is 🔨, no storage bucket yet.`
- Wrap the screen in `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`; without it the composer sits under the keyboard on iOS.

### 8 — History rows

**Create file: `src/features/tickets/components/HistoryRow.tsx`**

One row per `TicketEvent`: a small `clock`/`check`/`user` glyph by `eventType`, a sentence, and `formatDateTime(createdAt)` — the **day-and-time** form, since history spans days (BRD `:715` requires device-local time, which `Intl` gives by default).

The sentence comes from i18n, one key per `event_type`, interpolating `from`/`to`/`actor`:

```
ticketDetail.event.created          "{{actor}} created the ticket"
ticketDetail.event.status_changed   "{{actor}} changed status from {{from}} to {{to}}"
ticketDetail.event.assigned         "{{actor}} assigned the ticket to {{to}}"
ticketDetail.event.priority_changed "{{actor}} changed priority from {{from}} to {{to}}"
```

`from_value`/`to_value` are `string | null` raw enum values (`database.ts:352-355`) — run status and priority values back through `t(\`ticket.status.${v}\`)` / `t(\`ticket.priority.${v}\`)` so the timeline reads "from Open to Pending", not "from open to pending". `assigned`'s `to_value` is a **profile id**, not an enum: render it as-is and flag it (flag 5). A null `actorName` falls back to `t('ticketDetail.event.system')`.

**No edit or delete affordance** — BRD `:717`. The row is a plain `View`, not a `Pressable`. Do not add a long-press menu.

### 9 — The route and the screen

**Create file: `src/app/tickets/[id].tsx`**

```tsx
import { useLocalSearchParams } from 'expo-router';

import { TicketDetailScreen } from '@/features/tickets';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TicketDetailScreen ticketId={id} />;
}
```

Reading the param and passing it down is the one piece of work a route file may do beyond rendering (hard rule 1) — the alternative is the screen importing `expo-router` to read its own route, which couples a feature screen to the router.

**File: `src/app/_layout.tsx`** — add one line inside the existing signed-in `Stack.Protected` block (lines 65-67), as a **sibling** of `(tabs)` so the detail pushes over the tab bar:

```tsx
<Stack.Screen name="tickets/[id]" />
```

Leave both guards, the `hideSplash` effect and `screenOptions` untouched.

**Create file: `src/features/tickets/screens/TicketDetailScreen.tsx`**

```tsx
export type TicketDetailScreenProps = { ticketId: string };

const [tab, setTab] = useState<MessageKind | 'history'>('public');
const detail = useTicketDetail(ticketId);
const messages = useTicketMessages(ticketId, tab === 'history' ? 'public' : tab);
const events = useTicketEvents(ticketId);
const post = usePostTicketMessage(ticketId);
```

- `SafeAreaView` with `edges={['top']}` on `colors.bgSurface`.
- Detail `isPending` → a `SkeletonList`; `isError` **or** `detail.data === null` → `ErrorState` with `onRetry`. A `null` from `maybeSingle` is an RLS-hidden or deleted ticket, not a crash — the same branch story 06 needed for `useAgentProfile`.
- Header, contact strip, `TabBar` with three `Tab`s, `AiSummaryBar`, then the active segment.
- Conversation and Internal notes both render a `FlatList` of `MessageRow`; History renders `HistoryRow`. Each has its own empty state (`ticketDetail.empty.public` / `.internal` / `.history`).
- **The composer renders on the Conversation and Internal-notes tabs only** — there is nothing to post to History. Switching to the internal tab should not silently change the composer's mode; the two are independent, and the composer's own chips are the only thing that decides `is_internal`. Say so in a comment, because coupling them looks like a helpful idea and would make an agent post an internal note believing it was public.
- `post.isError` → pass `t(errorMessageKey(post.error))` into the composer's `error` prop.

**Files: `src/features/home/screens/HomeScreen.tsx` and `src/features/tickets/screens/TicketsScreen.tsx`** — replace the two identical no-ops (`HomeScreen.tsx:29-31`, `TicketsScreen.tsx:27-29`) with the real push, and delete the `eslint-disable` line above each:

```tsx
function handleTicketPress(id: string) {
  router.push(`/tickets/${id}`);
}
```

`HomeScreen` already imports `router` from `expo-router` (line 2); `TicketsScreen` does not and needs the import added.

### 10 — Barrel, i18n, docs

**File: `src/features/tickets/index.ts`** — add:

```ts
export { priorityColor } from './priority';
export { allowedTransitions, canTransition, requiresResolutionNote } from './state-machine';
export { TicketDetailScreen } from './screens/TicketDetailScreen';
export {
  useTicketDetail,
  useTicketEvents,
  useTicketMessages,
  usePostTicketMessage,
} from './hooks';
export type { MessageKind, TicketDetail, TicketEvent, TicketEventType, TicketMessage } from './types';
```

`MessageRow`, `ContactStrip`, `AiSummaryBar`, `ReplyComposer`, `HistoryRow` and `TicketDetailHeader` stay internal — nothing outside the feature renders them.

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`** — add a `ticketDetail` namespace beside the existing `tickets` one. Reuse `ticket.status.*` and `ticket.priority.*`, which story 04 already added to both locales; **do not duplicate them.**

```json
"ticketDetail": {
  "back": "Back",
  "assign": "Assign",
  "status": "Status",
  "call": "Call",
  "email": "Email",
  "aiSummary": "AI summary",
  "aiSummaryPending": "Summaries aren't available yet.",
  "tabs": { "conversation": "Conversation", "internal": "Internal notes", "history": "History" },
  "internalBadge": "Internal",
  "message": {
    "label": "{{author}}, {{time}}",
    "labelInternal": "Internal note from {{author}}, {{time}}"
  },
  "composer": {
    "public": "Public reply",
    "internal": "Internal note",
    "placeholder": "Write a reply...",
    "send": "Send",
    "attach": "Add attachment"
  },
  "event": {
    "created": "{{actor}} created the ticket",
    "status_changed": "{{actor}} changed status from {{from}} to {{to}}",
    "assigned": "{{actor}} assigned the ticket to {{to}}",
    "priority_changed": "{{actor}} changed priority from {{from}} to {{to}}",
    "system": "System"
  },
  "empty": {
    "public": "No messages yet.",
    "internal": "No internal notes on this ticket.",
    "history": "No events recorded yet."
  }
}
```

Arabic: `"رجوع"`, `"إسناد"`, `"الحالة"`, `"اتصال"`, `"بريد إلكتروني"`, `"ملخص الذكاء الاصطناعي"`, `"لم تتوفر الملخصات بعد."`; tabs `"المحادثة"` / `"ملاحظات داخلية"` / `"السجل"`; `internalBadge` `"داخلية"`; composer `"رد عام"` / `"ملاحظة داخلية"` / `"اكتب ردًا..."` / `"إرسال"` / `"إضافة مرفق"`; events `"{{actor}} أنشأ التذكرة"` / `"{{actor}} غيّر الحالة من {{from}} إلى {{to}}"` / `"{{actor}} أسند التذكرة إلى {{to}}"` / `"{{actor}} غيّر الأولوية من {{from}} إلى {{to}}"` / `"النظام"`; empties `"لا توجد رسائل بعد."` / `"لا توجد ملاحظات داخلية على هذه التذكرة."` / `"لم تُسجَّل أحداث بعد."`.

**File: `CLAUDE.md`** — the "Target architecture" component list names `MessageRow` as a domain component belonging under `features/<domain>/components/`; this story is where that prediction lands, so no edit is needed there. Do update "Project status" to say ticket detail is built and that ticket **creation**, **assignment** and **status transitions** remain open.

---

## Edge Cases & Failure Modes

- **A message posted without `is_internal`** — impossible by construction: `database.ts:406` types it required in `Insert`, and task 4c's input type restates it. The failure mode to guard is *reintroducing* optionality — a `Partial<>`, a default parameter, or a payload built through an index signature. API §5's negative test (omit the field → expect failure) is the server-side proof; the type is the client-side one.
- **Fetching both message kinds in one query and filtering client-side** — the intake forbids it and the reason is real: internal notes would sit in the public thread's cache entry, one rendering bug away from the customer-visible surface. Two queries, two cache keys (task 5a). This is also why `usePostTicketMessage` invalidates only the kind that was posted.
- **A customer-authored message has `author_id: null`** — `database.ts:394` types it nullable, and the embedded `profiles(full_name)` therefore resolves `null` too. `rowKind` uses exactly that to distinguish customer from agent (task 7). Render `t('ticketDetail.event.system')`-style fallback for the name rather than an empty header line.
- **An internal note authored by the current agent** — still an internal note. `rowKind` checks `isInternal` **before** authorship, or an agent's own note would render as a green public reply and read as customer-visible.
- **`profiles!assigned_to` omitted from the detail select** — `tickets` references `profiles` twice (assignee, creator), so PostgREST rejects the ambiguous embed rather than guessing. API §4.6 says so explicitly.
- **`fetchTicketDetail` resolves `null`** — an RLS-hidden or deleted ticket. `maybeSingle()` gives `null` with no error, so an `isError`-only check renders an empty header over a blank screen. Treat `data === null` as the error branch (task 9), the same shape story 06 needed for the profile card.
- **A deep link to a ticket in another department** — RLS returns nothing, so the above `null` branch is the whole handling. Do not add a client-side department check; access control is never implemented in the client (BRD `:262`).
- **`closed` ticket** — `allowedTransitions('closed')` is `[]`, so the Status button disables (task 3). Without that, the button would open a picker with nothing in it.
- **Sending while offline** — mutations do not retry (`query-client.ts:23`). The error surfaces in the composer and **the typed body is preserved**, because the input clears only after the mutation resolves (task 7). Clearing on submit loses an agent's paragraph on a dropped connection.
- **Double-tap send** — `sending` disables the button, but a fast double-tap can still queue two mutations. Guard on `post.isPending` in the screen as well as on the composer's own `sending` prop.
- **A very long message body** — no `numberOfLines` on the body (task 7), so the row grows. Verify the `FlatList` still scrolls to the newest message; do not clamp, an unreadable thread is worse than a tall row.
- **History `assigned` events carry a profile id, not a name** — `to_value` is `string | null` with no join. The row renders the raw id until US-017 gives it something better (flag 5). Do not silently drop the event.
- **`ticket_events` is immutable** — no update or delete API is written (task 4d) and the history row is a plain `View`, not a `Pressable` (task 8). BRD `:717` and §4.10's immutability test are the requirements.
- **Query-key collision between `['tickets', <id>]` and `['tickets', 'list', …]`** — impossible: ids are UUIDs, and `'list'`/`'count'` are not. Worth the one-line comment in `ticketKeys` so a future non-UUID key does not get added carelessly.
- **RTL** — every rail is `borderStartWidth`; `eslint.config.js:72-75` catches `borderLeftWidth`. `arrowBack` and `send` are already in `DEFAULT_MIRRORED`, so both flip. The `INTERNAL` pill sits after the author name via `gap`, so it mirrors for free. **Verify the composer's mode chips start at the trailing edge in Arabic.**
- **Arabic digits** — message times go through `formatTime` and history through `formatDateTime`, both `Intl`-backed, so both render Arabic-Indic. That is wanted here: unlike story 05's phone numbers, a timestamp is read, not dialled.
- **Dark mode on the new purple** — `purpleSubtleDark` and `purple300` are **not specified by Figma** (task 1). Check the wash is distinguishable from `bgSurface` and the `INTERNAL` label clears WCAG AA against it. This is the most likely place the story looks wrong on a device.

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, no `test` script. Stories 02 through 06 all reached this conclusion and deferred. This story does not install one. It does, however, add `state-machine.ts` — a pure, five-line-table module with no React, no Supabase and no I/O, whose correctness the BRD specifies exhaustively and whose failure mode is an illegal transition offered to an agent. If a runner is ever installed for one file, it is that one.

### Runnable today — manual matrix

`npm start`, then `a`/`i`. Sign in as a seeded agent.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Any | Tap a row on **Home** | Ticket detail opens over the tab bar |
| 2 | Any | Tap a row on the **Tickets** tab | Same screen, same ticket |
| 3 | Detail open | Read the header | Reference, subject, status dot, priority tag (BRD `:645`) |
| 4 | Detail open | Read the contact strip | Customer name and phone (BRD `:646`) |
| 5 | Detail open | Tap the contact strip | **Nothing happens** — US-008 unbuilt; BRD `:647` unmet (flag 3) |
| 6 | Customer with a phone | Tap the call icon | The dialler opens with the number |
| 7 | Customer with `email` null | Read the mail icon | Disabled, not opening `mailto:null` |
| 8 | Detail open | Read the tab bar | Conversation / Internal notes / History all present (BRD `:649`) |
| 9 | Detail open | Read above the thread | Collapsed AI summary bar (BRD `:650`) |
| 10 | AI bar | Tap it | Expands to the "not available yet" line; chevron rotates |
| 11 | Ticket with all three kinds | Read Conversation | Customer rows blue-railed, agent rows green-railed, **no internal notes present** |
| 12 | Same ticket | Open Internal notes | Only internal notes; each has a purple rail, a full-row wash, a lock glyph **and** an `INTERNAL` label |
| 13 | Same ticket | Compare the two tabs | No message appears in both |
| 14 | Composer, Public mode | Type and send | Row appears in Conversation with a green rail; `is_internal` false |
| 15 | Composer, Internal mode | Type and send | Row appears in **Internal notes**, not Conversation |
| 16 | Composer | Switch to Internal | Colour, lock icon **and** label all change together (BRD `:674`) |
| 17 | Composer | Leave it empty | Send is disabled (BRD `:660`) |
| 18 | Composer | Type only spaces | Send stays disabled |
| 19 | Airplane mode | Send | Error shows **and the typed text is still there** |
| 20 | Airplane mode → online | Send again | Posts once, not twice |
| 21 | Composer | Double-tap send fast | One message, not two |
| 22 | Any | Open History | Events newest-first, each with actor, action and local time (BRD `:713-715`) |
| 23 | History | Long-press an event | **No** edit or delete affordance (BRD `:716`) |
| 24 | Ticket with a status change | Read that history row | "changed status from Open to Pending" — **translated**, not raw enum values |
| 25 | `closed` ticket | Read the header | **Status** button disabled |
| 26 | `new`/`open`/`pending` ticket | Read the header | Status button enabled but inert (US-018) |
| 27 | Any | Tap **Assign** | Nothing happens (US-017, flag 1) |
| 28 | Ticket in another department | Deep-link to its id | Error state with retry, no crash, no data |
| 29 | Any | Tap back | Returns to the tab you came from |
| 30 | iOS | Focus the composer | Keyboard does not cover the input |
| 31 | Very long message | Open the thread | Row grows, thread still scrolls |
| 32 | Switch to العربية, restart | Open a ticket | Layout mirrors; every rail sits on the **right**; back arrow flips |
| 33 | العربية | Read times and history | Arabic-Indic digits |
| 34 | العربية | Read the composer | Mode chips start at the trailing edge |
| 35 | Toggle system dark mode | Open Internal notes | Purple wash distinguishable from the surface; `INTERNAL` label legible |
| 36 | Any | Open Home and the Tickets tab | Both still render — the task 2 `priorityColor` extraction touched `TicketRow` |

Rows 11–13 are the story's security property, and row 35 is where the unspecified dark purple will show. Run both properly.

### To write when a runner exists

1. **Unit — `src/features/tickets/state-machine.test.ts`** · every cell of BRD `:222-227`: `new`→`open` only; `open`→`pending`/`resolved`; `pending`→`open`/`resolved`; `resolved`→`closed`/`open`; `closed`→ nothing.
2. **Unit — `src/features/tickets/state-machine.test.ts`** · `canTransition('new','closed')` is false, `canTransition('closed', <anything>)` is false, and `requiresResolutionNote('resolved')` is true while every other target is false.
3. **Unit — `src/features/tickets/api.test.ts`** · `postTicketMessage` sends `is_internal` for both `true` and `false`, and the key is present in the payload in **both** cases — the leak guard.
4. **Unit — `src/features/tickets/api.test.ts`** · `fetchTicketMessages(id, 'public')` filters `is_internal = false` and `'internal'` filters `true`; neither returns the other's rows.
5. **Unit — `src/features/tickets/api.test.ts`** · `fetchTicketDetail` maps a `null` `customers` embed to `customer: null` and does not throw; `maybeSingle`'s `null` returns `null`, not an error.
6. **Unit — `src/features/tickets/components/MessageRow.test.tsx`** · `rowKind` returns `internal` for an internal note **authored by the current agent** — authorship must not override `isInternal`.
7. **Unit — `src/core/utils/format.test.ts`** · `formatTime` at midnight and noon; an invalid date yields `''`; the Arabic locale yields Arabic-Indic digits.
8. **Integration — `src/features/tickets/hooks.test.tsx`** · posting a public reply invalidates `['tickets', id, 'messages', 'public']` and **not** `['tickets', id, 'messages', 'internal']`, and **not** any list key.
9. **Unit — `src/core/lib/theme/colors.test.ts`** · `lightColors` and `darkColors` have identical key sets — the guard that makes task 1's three-key addition safe.
10. **Unit — `src/core/lib/i18n/locales.test.ts`** (proposed in story 02, still unwritten) · `en.json` / `ar.json` key parity. This story is the **sixth** that would have benefited.

---

## Verification Steps

1. **Typecheck:** `npm run typecheck` — zero errors. Three things fail here if done wrong: a semantic colour added to `lightColors` but not `darkColors`, a `TicketStatus` missing from the transition `Record`, and a `postTicketMessage` payload without `is_internal`.
2. **Lint:** `npm run lint` — zero errors. The gate for hard rules 2-5: the new purple **must** be in `primitives.ts` and nowhere else, every rail must be `borderStartWidth`, and the route file must not reach past a feature barrel.
3. **Frontend runs:** `npm start`, press `a` and `i`. Walk the manual matrix.
4. **The internal/public split:** matrix rows 11-13, on a ticket seeded with all three message kinds. This is the story's security property and it has no automated cover.
5. **RTL:** switch to العربية, **fully restart**, and confirm every message rail sits on the right and the back arrow flips.
6. **Dark mode on the new tokens:** matrix row 35. `purpleSubtleDark`/`purple300` are this plan's invention, not Figma's — they need eyes on a device.
7. **Regression — the lists:** open Home and the Tickets tab and confirm rows, priority glyphs and the claim button all still render. Task 2 moved `priorityColor` out of `TicketRow`.
8. **Regression — navigation:** confirm the tab bar is still reachable after backing out of a detail screen, and that signing out from Profile still lands on login (task 9 added a screen inside the same `Stack.Protected` block).
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:645-650` (US-014), `:657-660` (US-015), `:673-677` (US-016) and `:714-718` (US-019). See the BRD-mapping table above for what is deliberately excluded.

**US-014**

- [ ] Given a ticket, when I open it, then **reference, subject, status and priority** display in the header
- [ ] Given a ticket, when opened, then the customer strip shows **name and phone**
- [ ] ~~Given the customer strip, when tapped, then the customer profile opens~~ — **not met; US-008 is unbuilt (flag 3)**
- [ ] Given the detail screen, when rendered, then **Conversation, Internal Notes and History** segments are present
- [ ] Given the screen layout, when built, then a **collapsible slot is reserved** above the thread for a future AI summary

**US-015**

- [ ] Given the composer in public mode, when I send, then the message saves with `is_internal` **false**
- [ ] Given a public reply, when it renders, then it is **visually distinct** from internal notes
- [ ] Given an empty composer, when I attempt to send, then the action is **blocked**

**US-016**

- [ ] Given the composer in internal mode, when I send, then the message saves with `is_internal` **true**
- [ ] Given the composer in internal mode, then the mode is indicated by **colour, icon and label together**
- [ ] Given an internal note, when a colleague in my department opens the ticket, then it is visible
- [ ] Given the messages table, when a row is inserted, then `is_internal` **must be supplied explicitly**

**US-019**

- [ ] Given a ticket, when I open History, then all events display **chronologically**
- [ ] Given an event, when rendered, then **actor, action and timestamp** display
- [ ] Given a timestamp, when displayed, then it renders in **device local time**
- [ ] Given the history, when displayed, then **no edit or delete affordance exists**

**Plus, from the intake and the design**

- [ ] Conversation and Internal notes are **two separate queries**; neither payload contains the other's rows
- [ ] `state-machine.ts` exists, transcribes BRD §6 once, and disables the Status button on a `closed` ticket
- [ ] Detail, messages and events are keyed under `['tickets', id, …]`; posting invalidates one thread and **no list**
- [ ] The internal-note row carries **all four** cues: rail, full-row wash, lock icon, `INTERNAL` label
- [ ] Row taps on Home **and** the Tickets tab both open the detail screen
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" reflects ticket detail as built

---

## Open questions — raise with design/product, do not resolve silently

1. **This screen is where four BRD stories meet, and the intake's endpoint list decides the cut.** US-014, US-015, US-016 and US-019 are built; US-017 (assign, §4.8) and US-018 (status transitions, §4.9) are not, because neither endpoint appears in the intake's API section — yet the intake's prose discusses the status picker. The header's **Assign** and **Status** buttons therefore render inert. Confirm that split, or move §4.9 into this story and add the picker sheet, the resolution-note field and the PATCH. **Highest-priority question** — it is roughly 8 points of difference.
2. **This story adds the first purple to the palette.** Figma's internal rail and wash are `palette.purple500` `#6750a4` and `palette.purple50` `#f3eef9`; `primitives.ts` had no purple at all. Task 1 adds them plus **two values Figma does not specify** — `purple300` and `purpleSubtleDark` for dark mode — derived the way the green/orange/red pairs were. Design should confirm both. Note this same primitive would finally resolve story 03's `statusPending` flag (Figma renders `pending` lavender), but that is a **status** decision and this story deliberately leaves `StatusBadge` alone.
3. **BRD `:648` cannot be met: "Given the customer strip, when tapped, then the customer profile opens."** US-008 (customer detail) is unbuilt — story 05 left `CustomerRow` taps as a documented no-op for the same reason. The strip renders and is inert. Either accept the criterion as deferred, or schedule US-008 before this story is signed off.
4. **The AI summary slot has nothing behind it.** BRD `:650` asks only for a *reserved collapsible slot*, which task 7 ships honestly ("Summaries aren't available yet"). There is no AI service in phase 1 and no story for one. Confirm the placeholder text is acceptable to show an agent, or hide the bar until the feature exists.
5. **History `assigned` events render a raw profile id.** `ticket_events.to_value` is an untyped `string` with no join to `profiles` (`database.ts:355`), and API §4.10's select does not resolve it. Until US-017 lands, "Amara assigned the ticket to 7f3a…" is what an agent sees. The fix is a second embed or a client-side profile lookup — both belong with US-017, not here.
6. **Attachments are unreachable.** The composer's paperclip renders disabled; API §8 (Storage) is marked 🔨 with no bucket. Confirm the button should render at all before its feature exists, or drop it from the composer for now.
7. **`pending` still has no colour**, so the header's status dot is neutral for that state exactly as `StatusBadge` is. Third story to inherit this (03, 04, now 07). See flag 2 — the purple added here is a candidate, but only design should make that call.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 08.**
