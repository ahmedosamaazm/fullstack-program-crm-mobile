# Story 08 — Assign a ticket (Story: SCRUM-33)

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md).
  This story is the **second consumer of `BottomSheet` + `SheetHeader`** (story 06's three
  settings sheets were the first) and the **third of `SearchField`** (stories 04 and 05).
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md).
  `useAgentProfile()` (`src/features/auth/hooks.ts:23-31`) is the **only** source of the signed-in
  agent's `departmentId`; `useAuth().session.user.id` identifies "me" in the sheet.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md).
  It built `claimTicket` (`src/features/tickets/api.ts:238-247`) — the compare-and-set PATCH this
  story generalises — and `ticketKeys` (`hooks.ts:20-34`).
- **Story 07 must be implemented before this one.** ⚠️ **Read this bullet before starting.**
  [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md)
  is **planned but not yet in the tree** — `ls src/features/tickets/` returns `api.ts`,
  `components/` (`StatusBadge.tsx`, `TicketRow.tsx` only), `grouping.ts`, `hooks.ts`, `index.ts`,
  `screens/` (`TicketsScreen.tsx` only), `types.ts`. This story's **only entry point** is the
  **Assign** button that story 07 task 6 puts on `TicketDetailHeader` and wires to a
  `// TODO(US-017)` no-op. It also depends on story 07's `TicketDetail`, `useTicketDetail`,
  `ticketKeys.detail(...)` and the `ticketDetail` i18n namespace. **Do not start story 08 until
  story 07 is merged.** If the order has to change, say so before writing code — the sheet would
  need a different host and a different invalidation target.
- **Coordination:** none outside the repo. API §4.8 is ✅ (implemented server-side) and the
  `log_ticket_assignment` trigger already writes the history row — this story writes **no**
  `ticket_events` insert.

---

## Story Goal

Give the agent a way to hand a ticket to a named colleague, or take it back off the board, from
the ticket detail screen — so that ownership is explicit rather than implied by whoever happens
to reply.

1. Tapping **Assign** in the detail header opens a bottom sheet titled "Assign to".
2. The sheet lists **the agents in my department**, each with their name, initials avatar and
   current open-ticket workload, so the choice is informed rather than blind.
3. A search field filters that list by name.
4. The agent the ticket is **currently** assigned to is marked `CURRENT` with a trailing check.
5. Selecting an agent assigns the ticket and closes the sheet; the header, both list tabs and
   every workload count reflect the change without a manual refresh.
6. A destructive **Unassign ticket** action in the footer returns the ticket to the unassigned
   pool.
7. Every assignment change is recorded as an `assigned` event — **by the database trigger**, not
   by this client.

**Not in scope.** Status transitions (US-018, API §4.9 — story 07 left the header's **Status**
button inert and it stays inert here); notifying the new assignee (US-030, push, unbuilt);
assigning from the list rows on Tickets or Home (Home keeps its inline **Claim**, the Tickets
list stays read-only — story 04's cut is unchanged); assigning across departments (RLS forbids
it, and BRD `:689` forbids even offering it).

---

## Context — Read These Files First

1. `docs/phase1_api_reference.md` **§4.8, lines 279-291** — the entire endpoint. One `PATCH`
   with `{"assigned_to": "<uuid>"}`; unassign is the same PATCH with `null`. Note the sentence
   *"The `log_ticket_assignment` trigger writes the history entry automatically."* — that single
   line is what satisfies BRD `:693`, and it is why task 3 inserts nothing into `ticket_events`.
2. `docs/phase1_api_reference.md` **§2 "Current agent's profile", lines 133-139**, and **§6, lines
   363-376**. Read both. §2 documents exactly **one** `profiles` read, keyed `id=eq.{{user_id}}`
   — **there is no documented agent-list endpoint** — and §6's isolation matrix tests `customers`,
   `tickets`, `ticket_messages` and `access_tokens` but **never `profiles`**. Task 2 is therefore
   the first `profiles` list query in the app and its RLS behaviour is unverified — see
   **Verification step 1**, which is a real gate, not a formality.
3. `docs/phase1_brd_1.md` **lines 681-693** — US-017's five acceptance criteria verbatim. Each
   maps to a numbered task below and to a line in `## Done Criteria`.
4. `src/features/auth/api.ts` — **whole file (129 lines)**. Two `profiles` reads, at lines 38-57
   (`fetchAgentProfile`) and 78-101 (`fetchAgentProfileWithOrg`), both `.eq('id', userId)`.
   Match their shape: `.select(...)`, `if (error) throw toAppError(error)`, then an explicit
   snake→camel mapping at the boundary. `localisedName` (lines 60-64) is the precedent for
   picking `name_en`/`name_ar`; task 2 does **not** need it.
5. `src/features/auth/hooks.ts:17-31` — `useAgentProfile`. Read the header comment: it explains
   why the profile lives under the `['profile', userId]` key and **not** under `['tickets', …]`.
   Task 2's new hook follows the same reasoning in reverse — an agent's *workload* does change
   when a ticket is assigned, so its key must be invalidated by the assign mutation.
6. `src/features/tickets/api.ts:225-247` — `TicketAlreadyClaimedError` and `claimTicket`. This is
   the compare-and-set pattern task 3 generalises: `update(..., { count: 'exact' })`, a predicate
   that narrows the row to the state the UI last saw, and `if (!count) throw`. Read the header
   comment above `claimTicket` — the rationale carries over exactly.
7. `src/features/tickets/hooks.ts:20-34` (`ticketKeys`) and `:110-121` (`useClaimTicket`).
   `ticketKeys.all` is `['tickets']`, so one `invalidateQueries` refetches both lists, all four
   chip/stat counts and (after story 07) the detail. Task 4's mutation reuses it and adds one
   more key.
8. `src/features/customers/api.ts:7-8` and `:41-75` — `fetchCustomers`. The `tickets(count)`
   embedded aggregate plus `.in('tickets.status', OPEN_STATUSES)` is **the** precedent for
   task 2's per-agent workload number. Read the comment at lines 48-50 explaining why the embed
   must be filtered, and the "PostgREST returns an aggregate embed as a one-element array" note
   at line 27 — `row.tickets?.[0]?.count ?? 0`.
9. `src/features/customers/components/CustomerRow.tsx` — **whole file**. `AgentRow` is this row
   with a different trailing slot. Copy its `Avatar` + `tintForName` usage (line 58), its
   `minWidth: 0` guard on the flexible body (line 60), and its `styles` block shape.
10. `src/core/components/BottomSheet.tsx` and `src/core/components/SheetHeader.tsx` — whole
    files, both small. `BottomSheet` renders `SheetHeader` itself when given `title` (line 122),
    applies `paddingHorizontal: theme.spacing.xl` to its children (line 133), and caps itself at
    `screenHeight * 0.9` (line 121). All three facts constrain task 5 — see the note there about
    full-bleed rows.
11. `src/features/profile/components/LanguageSheet.tsx` — **whole file (59 lines)**. The
    `{ visible, onClose }` prop shape, the `check` icon marking the current selection, and the
    "do not close on every outcome" discipline. The nearest existing sheet to this one.
12. `src/core/types/database.ts:296-346` (`profiles`) and `:434-540` (`tickets`). Two facts do
    the work: `tickets.assigned_to` is `string | null` (`:436`), and `tickets` references
    `profiles` **twice** — `tickets_assigned_to_fkey` (`:494`) and `tickets_created_by_fkey`
    (`:515`). The second fact makes the FK hint in task 2 **mandatory**, not stylistic.
    `user_role` is `"agent" | "manager" | "admin"` (`:554`). **Generated; never hand-edit.**
13. [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md)
    — sections **"4 — api.ts"**, **"6 — Header and contact strip"**, **"9 — The screen"** and
    **"10 — Barrel, i18n, docs"**. You are editing what that story built; know its shapes
    (`TicketDetail`, `useTicketDetail`, `ticketKeys.detail`) before you touch them.
14. Figma `mdfP8RPdkUsKcJb0wFdkME`, node **`7:4118`** (`Tickets - Assign Agent (Sheet)`). Fetch
    it during implementation. The measured structure is transcribed in task 1 below; re-fetch
    only to check something the transcription does not answer.

---

## Product rules (from story)

| BRD `:681-693` criterion | Where it is met |
|---|---|
| "only agents in my department are listed" | Task 2 — `department_id=eq.<mine>` **and** RLS. Verification step 1. |
| "I select an agent … the ticket is assigned and the sheet closes" | Task 5 — `onSuccess` closes; not `onSettled`, not optimistically. |
| "when I reassign, then the new assignee replaces the previous" | Task 3 — the PATCH sets `assigned_to` on a row matched by its **previous** assignee. |
| "Given I unassign … the ticket returns to the unassigned pool" | Task 3 (`assigneeId: null`) + task 5's footer. |
| "any assignment change … an `assigned` event is recorded" | **The `log_ticket_assignment` trigger** (API §4.8). This client writes nothing to `ticket_events`. |

**One correction to the intake.** The intake says: *"Reuse the agent-list query and RLS scoping
already proven in Home's Claim flow (SCRUM-36)."* `grep -rn "from('profiles')" src/` returns
exactly two hits, both in `src/features/auth/api.ts` (lines 41 and 82), both `.eq('id', userId)`.
**No agent-list query exists anywhere in the repo, and none is documented in the API reference.**
Home's claim flow is a single-button PATCH against `tickets` with no `profiles` read at all. What
*is* proven and genuinely reusable is (a) the `assigned_to` PATCH itself and (b) `claimTicket`'s
compare-and-set discipline — both are reused in task 3. The agent list is **new work**, built in
task 2, and its RLS scoping is **unverified**, not proven. Plan accordingly; do not assume a
`profiles` SELECT policy for same-department peers exists until step 1 says so.

---

## Implementation tasks

### 1 — The Figma sheet, measured

Node `7:4118` → `124:996` `Sheet`. Structure and measured values, so the executor does not have
to re-derive them:

```
124:996  Sheet                      radius.xl top corners, colors.bgSurface
├── 124:997  SheetHeader            title "Assign to", handle, bottom hairline (borderSubtle)
├── 124:1002 Search                 pt spacing.md, pb spacing.sm, px spacing.lg
│   └── 124:1003 SearchField        44h, radius.md, bgSurfaceSunken, "Search agents…"
├── 124:1009 Agents                 7 × AgentRow, 64h each
│   └── 124:1010 AgentRow           px spacing.lg, py spacing.md, gap spacing.md, bottom hairline
│       ├── Avatar 36×36            radius.full, tinted, initials at fontSize.sm / semibold
│       ├── Text (flex 1, gap xxs)
│       │   ├── NameRow             name callout/semibold + "CURRENT" overline / uppercase /
│       │   │                       tracking.wide / textMuted
│       │   └── workload            caption / textMuted — "7 open tickets"
│       └── Check 20×20             end edge, State=Current only
└── 124:1063 Footer                 px spacing.lg, py spacing.md
    └── 124:1064 Unassign           text action, body/semibold, colors.danger
```

Every value above is a token already in `src/core/lib/theme/layout.ts` / `typography.ts`. **No
new token is needed and no hex literal may be written** (hard rule 2). Two notes:

- **Avatar is 36px here** — not `CustomerRow`'s 38 and not `Avatar`'s default 44. Pass `size={36}`.
- Figma tints the avatars with raw palette values (`yellow100`/`amber700`, `green100`/`green600`,
  `purple100`/`purple600`, `pink50`/`pink700`). Those are **not** in `primitives.ts`. Use
  `tintForName(fullName)` (`src/core/components/Avatar.tsx:36-40`) exactly as `CustomerRow` does
  — the same four-tint cycle, stable per name. Flag 3 records the divergence.

### 2 — The agent list query

**Ownership decision, stated once so it is not re-litigated in review:** `profiles` is owned by
`src/features/auth/`. Both existing `profiles` reads live in `auth/api.ts`; adding a third to
`features/tickets/api.ts` would give one table two owners in two features. The agent list and its
hook go in **`auth`**, and `tickets` consumes them through the barrel (`@/features/auth`), which
`tickets/hooks.ts:3` already imports from. Hard rule 4 is satisfied; hard rule 3 is untouched
(nothing moves into `core/`).

**File: `src/features/auth/types.ts`** — append:

```ts
/** One selectable agent in the assign sheet. Not an `AgentProfile` — this is a *peer*. */
export type DepartmentAgent = {
  id: string;
  fullName: string;
  /** Open tickets (`new`, `open`, `pending`) currently assigned to this agent. */
  openTicketCount: number;
};
```

**File: `src/features/auth/api.ts`** — append below `fetchAgentProfileWithOrg`:

```ts
const AGENT_LIST_SELECT = 'id, full_name, tickets!tickets_assigned_to_fkey(count)';

const OPEN_STATUSES = ['new', 'open', 'pending'] as const; // API §4.4 — the set `fetchMyTickets` uses.

type DepartmentAgentRow = {
  id: string;
  full_name: string;
  /** PostgREST returns an aggregate embed as a one-element array. */
  tickets: { count: number }[] | null;
};

export async function fetchDepartmentAgents(departmentId: string): Promise<DepartmentAgent[]>;
```

Build the query as:

```ts
const { data, error } = await supabase
  .from('profiles')
  .select(AGENT_LIST_SELECT)
  .eq('department_id', departmentId)
  .eq('is_active', true)
  .in('tickets.status', OPEN_STATUSES)
  .order('full_name', { ascending: true })
  .returns<DepartmentAgentRow[]>();
```

Four things about that query, each load-bearing:

- **`tickets!tickets_assigned_to_fkey` is mandatory.** `tickets` references `profiles` twice
  (`database.ts:494` and `:515`). An unhinted `tickets(count)` is a PostgREST ambiguity error,
  not a silent wrong join. Same trap API §4.6 documents for `profiles!assigned_to` in the other
  direction.
- **`.in('tickets.status', OPEN_STATUSES)` filters the *embed*, not the parent.** Without it the
  badge counts every ticket that agent ever touched. `customers/api.ts:48-50` documents exactly
  this. It is an **outer** embed (no `!inner`), so an agent with zero open tickets still appears
  — which is the agent you most want to see in an assign sheet. **Do not add `!inner`.**
- **`.eq('department_id', departmentId)` is belt *and* braces.** RLS should already scope it; §6
  never tests that it does. The explicit filter makes BRD `:689` true in the client regardless,
  and §6's test 4 guarantees a filter can only narrow, never widen.
- **No `role` filter.** `user_role` is `"agent" | "manager" | "admin"` (`database.ts:554`), and a
  manager in the department is a legitimate assignee. `role=eq.agent` would hide them. Recorded
  as flag 2 — confirm with product.

Map the row the way the rest of the file does:

```ts
// → { id: row.id, fullName: row.full_name, openTicketCount: row.tickets?.[0]?.count ?? 0 }
```

**File: `src/features/auth/hooks.ts`** — append:

```ts
export const agentKeys = {
  all: ['agents'] as const,
  list: (departmentId: string) => ['agents', 'list', departmentId] as const,
};

/**
 * Agents in the signed-in agent's department, for the assign sheet. Keyed under
 * `['agents', …]` — NOT under `['profile', …]` (a peer list is not my identity)
 * and NOT under `['tickets', …]` (Home's every-refresh invalidation must not
 * refetch it). The assign mutation invalidates this key explicitly, because
 * assigning does change the workload numbers it renders.
 */
export function useDepartmentAgents(enabled = true) {
  const profile = useAgentProfile();
  const departmentId = profile.data?.departmentId;
  return useQuery({
    queryKey: agentKeys.list(departmentId ?? ''),
    queryFn: () => fetchDepartmentAgents(departmentId as string),
    enabled: enabled && Boolean(departmentId),
    staleTime: 60_000,
  });
}
```

The `enabled` parameter exists so the screen can pass `visible` and **not fetch seven profiles
plus seven aggregates every time a ticket detail opens** — only when the sheet is actually
opened. Wire it in task 5; do not drop it.

**File: `src/features/auth/index.ts`** — add:

```ts
export { agentKeys, useDepartmentAgents } from './hooks';
export type { DepartmentAgent } from './types';
```

### 3 — The assign / unassign mutation (data)

**File: `src/features/tickets/api.ts`** — append below `claimTicket`; **change nothing above it.**

```ts
/**
 * Thrown when the ticket's assignee changed between the sheet rendering and
 * the PATCH landing — or when RLS refuses the row. Both surface as zero rows
 * affected and are indistinguishable from the client; the message is worded
 * for the common case.
 */
export class TicketAssignmentChangedError extends Error {
  constructor() {
    super('Ticket assignment changed before this update was applied');
  }
}

/**
 * Compare-and-set reassignment. `expectedCurrentAssigneeId` is the assignee the
 * sheet was rendered against; the predicate narrows the update to a row still
 * in that state, so two agents reassigning the same ticket at once produces one
 * winner and one explicit error rather than a silent last-write-wins. Same
 * discipline as `claimTicket`, generalised from "must be null" to "must be what
 * I last saw".
 */
export async function assignTicket(
  ticketId: string,
  assigneeId: string | null,
  expectedCurrentAssigneeId: string | null,
): Promise<void> {
  let query = supabase
    .from('tickets')
    .update({ assigned_to: assigneeId }, { count: 'exact' })
    .eq('id', ticketId);

  query =
    expectedCurrentAssigneeId === null
      ? query.is('assigned_to', null)
      : query.eq('assigned_to', expectedCurrentAssigneeId);

  const { count, error } = await query;
  if (error) throw toAppError(error);
  if (!count) throw new TicketAssignmentChangedError();
}
```

**Unassign is not a second function.** `assignTicket(id, null, currentId)` *is* the unassign call
(API §4.8: *"Unassign: send `{"assigned_to": null}`"*). Do not add `unassignTicket`.

**Write nothing to `ticket_events`.** The `log_ticket_assignment` trigger does it (API §4.8), and
`ticket_events` grants agents no INSERT policy anyway (§4.10's immutability note) — a client-side
insert would fail, and if it ever stopped failing that would be the bug.

### 4 — The mutation hook

**File: `src/features/tickets/hooks.ts`** — append below `useClaimTicket`. `ticketKeys` needs no
change; story 07 already added `detail`.

```ts
export type AssignTicketInput = {
  ticketId: string;
  /** `null` unassigns. */
  assigneeId: string | null;
  /** The assignee the sheet was rendered against — the compare-and-set guard. */
  expectedCurrentAssigneeId: string | null;
};

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, assigneeId, expectedCurrentAssigneeId }: AssignTicketInput) =>
      assignTicket(ticketId, assigneeId, expectedCurrentAssigneeId),
    onSuccess: () => {
      // Lists, chip counts and Home's stats all move when ownership moves.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      // …and so do the workload numbers inside the sheet itself.
      void queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}
```

`ticketKeys.all` already covers `ticketKeys.detail(ticketId)` — both start `['tickets']`, so the
header's assignee name refetches with everything else. **Do not add a third, narrower
invalidation**; it would be a no-op that reads like it matters.

Import `assignTicket` from `./api` and `agentKeys` from `@/features/auth` (hard rule 4 — the
barrel, never `@/features/auth/hooks`).

### 5 — `AgentRow` and `AssignAgentSheet`

**Create file: `src/features/tickets/components/AgentRow.tsx`**

```tsx
export type AgentRowProps = {
  agent: DepartmentAgent;
  /** Renders the CURRENT tag and the trailing check (Figma State=Current). */
  isCurrent: boolean;
  onPress: (agentId: string) => void;
  disabled?: boolean;
};
```

`Pressable` → `Avatar` (`size={36}`, `tint={tintForName(agent.fullName)}`) → a `flex: 1`,
`minWidth: 0` body → the trailing `Icon name="check" size={20}` when `isCurrent`.

- **Name row:** `<Text variant="callout" weight="semibold" numberOfLines={1}>` plus, when
  `isCurrent`, `<Text variant="overline" tone="muted" style={{ letterSpacing: theme.tracking.wide }}>`
  carrying `t('ticketDetail.assign.current')`. **Do not call `.toUpperCase()` in code** — story 01
  §15 flags Arabic uppercase + tracking as an open design question, and the `ar.json` value is
  written already-cased. Let the string decide.
- **Workload line:** `<Text variant="caption" tone="muted">{t('ticketDetail.assign.openTickets', { count: agent.openTicketCount })}</Text>`
  — i18next plural selection, matching `customers.rowLabel_*` (`en.json:154-156`,
  `ar.json:158-164`).
- **`accessibilityLabel`** = `t('ticketDetail.assign.rowLabel', { name, count })`, and
  **`accessibilityState={{ selected: isCurrent, disabled }}`** — the check glyph is the only
  visual cue that this agent already owns the ticket, and a glyph is not an accessible state.
- Bottom hairline: `borderBottomWidth: StyleSheet.hairlineWidth`,
  `borderBottomColor: theme.colors.borderSubtle`.
- **`paddingHorizontal: theme.spacing.lg`** per Figma — but see the full-bleed note in the sheet.

**Create file: `src/features/tickets/components/AssignAgentSheet.tsx`**

```tsx
export type AssignAgentSheetProps = {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  /** The current assignee's profile id — the compare-and-set guard. `null` when unassigned. */
  currentAssigneeId: string | null;
};
```

Body:

```tsx
const agents = useDepartmentAgents(visible);   // gated — see task 2
const assign = useAssignTicket();
const [query, setQuery] = useState('');

const results = useMemo(() => {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return agents.data ?? [];
  return (agents.data ?? []).filter((a) => a.fullName.toLocaleLowerCase().includes(term));
}, [agents.data, query]);
```

**Search is client-side, and that is deliberate.** Tickets (story 04) and Customers (story 05)
debounce and re-query because their lists are unbounded. A department's agent roster is tens of
rows, already in memory, and refetching seven profiles plus seven aggregates per keystroke would
be strictly worse. Filtering in a `useMemo` is instant and needs no `useDebounce` and no
`sanitizeSearchTerm` (nothing reaches PostgREST). **Say so in a comment** — the next reader will
otherwise "fix" it into a server query.

Wiring:

- `<BottomSheet visible={visible} onClose={onClose} title={t('ticketDetail.assign.title')}>` —
  `BottomSheet` renders `SheetHeader` itself (line 122); do **not** render a second one.
- `<SearchField value={query} onChangeText={setQuery} placeholder={t('ticketDetail.assign.searchPlaceholder')} onClear={() => setQuery('')} />`.
- **Full-bleed rows.** `BottomSheet` wraps its children in `paddingHorizontal: theme.spacing.xl`
  (`BottomSheet.tsx:133`). Figma's `AgentRow` bleeds to the sheet's edges with its own
  `spacing.lg` inset and a full-width hairline. Cancel the wrapper's inset on the list container
  with `marginHorizontal: -theme.spacing.xl` and let `AgentRow` own its
  `paddingHorizontal: theme.spacing.lg`. **`marginHorizontal`, never `marginLeft`/`marginRight`**
  — hard rule 5; ESLint fails the build on the physical props.
- **`ScrollView`, not `FlatList`.** The sheet is already inside a `Modal` and capped at
  `screenHeight * 0.9` (`BottomSheet.tsx:121`); a virtualised list nested in a sheet that
  measures itself is a known source of zero-height rows, and a department roster does not need
  virtualisation.
- States, four branches: `agents.isPending` → `<SkeletonList count={5} />`; `agents.isError` →
  `<ErrorState … onRetry={() => agents.refetch()} />`; `results.length === 0` →
  `<EmptyState icon={query ? 'search' : 'user'} title={t(query ? 'ticketDetail.assign.empty.search' : 'ticketDetail.assign.empty.none', { query })} />`;
  otherwise the rows. **Do not collapse the empty-because-searched case into the empty-roster
  case** — they mean different things, and stories 04 and 05 both keep them apart.
- Row press:

```tsx
function handleSelect(agentId: string) {
  if (agentId === currentAssigneeId) { onClose(); return; }   // already theirs — no PATCH, no event
  assign.mutate(
    { ticketId, assigneeId: agentId, expectedCurrentAssigneeId: currentAssigneeId },
    { onSuccess: onClose },
  );
}
```

  Closing in the mutation's own `onSuccess` (not `onSettled`, not before the call) is what BRD
  `:690` asks for: *assigned **and** the sheet closes*. A failure keeps the sheet open with the
  error visible.
- **Footer**, rendered only when `currentAssigneeId !== null` — "Unassign ticket" on an
  already-unassigned ticket is a button that cannot do anything. A `Pressable` wrapping
  `<Text variant="body" weight="semibold" tone="danger">{t('ticketDetail.assign.unassign')}</Text>`,
  calling
  `assign.mutate({ ticketId, assigneeId: null, expectedCurrentAssigneeId: currentAssigneeId }, { onSuccess: onClose })`.
  It is **not** `Button variant="link"` — that variant hard-codes `tone="link"`
  (`Button.tsx:73-76`) and Figma paints this action `colors.danger`. See flag 4 for why the core
  component is not widened for one consumer.
- **Disable the whole list while a mutation is in flight**: pass `disabled={assign.isPending}`
  down to every `AgentRow` and to the footer, so a double-tap cannot fire two PATCHes.
- **Error line**, below the list, copying `HomeScreen.tsx:139-149` exactly:

```tsx
{assign.isError ? (
  <Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite"
        style={{ marginTop: theme.spacing.sm }}>
    {t(assignErrorMessageKey(assign.error))}
  </Text>
) : null}
```

  with a local helper mirroring `HomeScreen.tsx:33-36`:

```ts
function assignErrorMessageKey(error: unknown): string {
  if (error instanceof TicketAssignmentChangedError) return 'ticketDetail.assign.changed';
  return errorMessageKey(error);
}
```

### 6 — Hosting the sheet on the detail screen

**File: `src/features/tickets/screens/TicketDetailScreen.tsx`** (created by story 07).

Add `const [assignVisible, setAssignVisible] = useState(false);`, replace story 07's
`// TODO(US-017): open the assign sheet once it exists.` no-op with
`onAssignPress={() => setAssignVisible(true)}`, and render the sheet as a sibling of the screen
content:

```tsx
<AssignAgentSheet
  visible={assignVisible}
  onClose={() => setAssignVisible(false)}
  ticketId={ticketId}
  currentAssigneeId={detail.data?.assigneeId ?? null}
/>
```

**`TicketDetail` has no `assigneeId`.** Story 07's type carries `assigneeName: string | null`
only — a name cannot be a compare-and-set guard and cannot mark the `CURRENT` row. **Add the id:**

- **`src/features/tickets/types.ts`** — add `assigneeId: string | null;` to `TicketDetail`,
  beside `assigneeName`.
- **`src/features/tickets/api.ts`** — story 07's `DETAIL_SELECT` already begins with `*`, so
  `tickets.assigned_to` is **already in the response**; only the mapper needs
  `assigneeId: row.assigned_to`. Do not touch the select string, and in particular do not
  disturb its `profiles!assigned_to(full_name)` hint.

Leave the header's **Status** button exactly as story 07 left it — inert, `disabled` on a
`closed` ticket. US-018 is not this story.

### 7 — Barrel and i18n

**File: `src/features/tickets/index.ts`** — add:

```ts
export { TicketAssignmentChangedError } from './api';
export { useAssignTicket, type AssignTicketInput } from './hooks';
```

`AgentRow` and `AssignAgentSheet` stay **internal** — only `TicketDetailScreen` renders them, and
it lives in the same feature. This matches story 07's treatment of `MessageRow`, `ContactStrip`
and `TicketDetailHeader`.

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`** — add an `assign` block **inside**
the `ticketDetail` namespace story 07 created. Do not create a new top-level namespace, and do not
duplicate `ticket.status.*` / `ticket.priority.*`.

```jsonc
// en.json → ticketDetail.assign
{
  "title": "Assign to",
  "searchPlaceholder": "Search agents…",
  "current": "CURRENT",
  "unassign": "Unassign ticket",
  "changed": "This ticket's assignee changed. Reopen the sheet and try again.",
  "openTickets_zero": "No open tickets",
  "openTickets_one": "{{count}} open ticket",
  "openTickets_other": "{{count}} open tickets",
  "rowLabel_one": "{{name}}, {{count}} open ticket",
  "rowLabel_other": "{{name}}, {{count}} open tickets",
  "empty": {
    "none": "No other agents in your department.",
    "search": "No agents match \"{{query}}\"."
  }
}
```

`ar.json` needs the **full Arabic plural set** — `_zero`, `_one`, `_two`, `_few`, `_many`,
`_other` — for both `openTickets` and `rowLabel`, exactly as `customers.rowLabel_*` does at
`ar.json:158-164`. An Arabic key with only `_one`/`_other` falls back silently and reads wrong for
3–10 items. `"current"` in Arabic is `"الحالي"` — **not** uppercased and **not** tracked; see the
`AgentRow` note and story 01 §15.

### 8 — Docs

**File: `CLAUDE.md`** — "Project status" lists ticket creation, detail and assignment among the
open stories (story 07 updates the detail half). Move **assignment** out of the open list and
name this plan beside the others, so the "when reality and this file diverge, fix this file in
the same change" rule holds.

**File: `AGENTS.md`** — no change required. Nothing in its architecture, hard-rule or
state-management sections moves.

---

## Edge Cases & Failure Modes

- **Two agents reassign the same ticket at once.** The second PATCH matches zero rows because
  `assigned_to` is no longer `expectedCurrentAssigneeId`; `assignTicket` throws
  `TicketAssignmentChangedError` (task 3) and the sheet renders `ticketDetail.assign.changed`
  instead of closing on a change that did not happen.
- **RLS refuses the row** (§6 test 5 — a ticket in another branch). Also zero rows, also
  `TicketAssignmentChangedError`. The two are **indistinguishable from the client**; the message
  is worded for the common case. Recorded as flag 5.
- **`profiles` has no same-department SELECT policy.** The list comes back **empty**, not
  erroring — RLS filters, it does not throw. The sheet then shows `empty.none` and US-017 is
  unshippable. This is why **verification step 1 runs before any UI work**, not after.
- **An agent with zero open tickets.** The outer embed yields `tickets: []` → `?.[0]?.count ?? 0`
  → the `openTickets_zero` string. If someone adds `!inner` to `AGENT_LIST_SELECT`, that agent
  **disappears from the sheet** — the exact opposite of useful. Task 2 says so; keep it.
- **The signed-in agent appears in their own list.** Correct and intended: self-assignment is a
  legitimate reassignment, and it is what marks the `CURRENT` row after a claim. Do not filter
  `id != me`.
- **Tapping the agent who already owns the ticket.** `handleSelect` returns early — no PATCH, so
  no spurious `assigned` row in the history timeline. Do not rely on the trigger to no-op an
  unchanged value.
- **Sheet opened on an unassigned ticket.** `currentAssigneeId` is `null`: no row is `CURRENT`, no
  check renders, the footer is hidden, and the guard predicate is `.is('assigned_to', null)` —
  which is `claimTicket`'s exact semantics, reached by a different route.
- **The sheet opens before `useAgentProfile` resolves.** `departmentId` is `undefined`, the query
  is `enabled: false`, and TanStack Query reports `isPending` — the skeleton branch, not an error.
  Do **not** `throw` on a missing department id inside `queryFn`; the `enabled` gate is the guard.
- **Search term containing `%` or `_`.** Harmless — the filter never reaches PostgREST (task 5).
  A second reason the client-side choice is right, and a reason not to reach for
  `sanitizeSearchTerm` out of habit.
- **Arabic names in search.** `toLocaleLowerCase()` is a no-op for Arabic (no case), and
  `String.includes` is code-point based, so substring matching works. Arabic **diacritics** are
  not normalised — "محمّد" will not match a query of "محمد". The same limitation `ilike` has on
  the other screens; not new, not fixed here.
- **Offline.** `toAppError` maps a fetch failure to `kind: 'network'` →
  `messageKey: 'states.offline'` (`errors.ts:27-33`), which `errorMessageKey` returns and the
  error line renders. `OfflineBanner` is already mounted globally by `src/app/_layout.tsx`.
- **A very long name** ("Priya Ramachandran" is Figma's longest). `numberOfLines={1}` on the name
  plus `minWidth: 0` on the flex body — without `minWidth: 0` the flex child refuses to shrink and
  pushes the check glyph off the end edge. `CustomerRow.tsx:60` has the same guard for the same
  reason.
- **Double-tap on a row.** Every row and the footer take `disabled={assign.isPending}` (task 5),
  so the second tap is inert rather than firing a second PATCH whose guard would then fail with a
  confusing "assignee changed" message caused by the agent's own first tap.

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, no `test`
script (`AGENTS.md`, "Commands"). Stories 02 through 07 each reached this conclusion and deferred;
this story does not install one either. Nothing it adds is a pure module of the kind story 07
identified `state-machine.ts` to be — `assignTicket` is I/O, `AssignAgentSheet` is UI.

When a runner exists, these are the tests this story owes, in priority order:

1. **Unit — `src/features/tickets/api.test.ts`** · `assignTicket` builds `.is('assigned_to', null)`
   when `expectedCurrentAssigneeId` is `null` and `.eq('assigned_to', <id>)` otherwise. The
   `null`-vs-id branch is the single most breakable line in the story.
2. **Unit — `src/features/tickets/api.test.ts`** · a zero-`count` result throws
   `TicketAssignmentChangedError`; a `count` of 1 resolves. Mirrors the `claimTicket` /
   `TicketAlreadyClaimedError` pair.
3. **Unit — `src/features/auth/api.test.ts`** · `fetchDepartmentAgents` maps
   `tickets: [{ count: 4 }]` → `openTicketCount: 4`, and both `tickets: []` and `tickets: null` →
   `0`. Three cases, one behaviour each.
4. **Integration — `src/features/tickets/hooks.test.ts`** · `useAssignTicket`'s `onSuccess`
   invalidates **both** `['tickets']` and `['agents']`. Dropping the second is invisible until an
   agent reopens the sheet and reads a stale workload number.
5. **Component — `AgentRow.test.tsx`** · `isCurrent` renders the check **and** sets
   `accessibilityState.selected`; `isCurrent={false}` renders neither.
6. **Component — `AssignAgentSheet.test.tsx`** · tapping the current assignee closes the sheet
   without calling the mutation (the no-spurious-event case above).

---

## Verification Steps

1. **API first — run this before writing any UI.** With a real agent's access token, from any
   REST client:

   ```
   GET {{base_url}}/rest/v1/profiles?select=id,full_name,tickets!tickets_assigned_to_fkey(count)&department_id=eq.{{my_department_id}}&is_active=eq.true&tickets.status=in.(new,open,pending)&order=full_name
   ```

   **Three things must hold**, and the story is blocked if any fails:
   (a) it returns **more than the caller's own row** — that is the proof a same-department SELECT
   policy on `profiles` exists;
   (b) `tickets` is a one-element `[{ "count": n }]` array, and `n` matches
   `GET /tickets?assigned_to=eq.<that id>&status=in.(new,open,pending)` with `Prefer: count=exact`;
   (c) dropping the `!tickets_assigned_to_fkey` hint produces a PostgREST **ambiguity error** —
   confirming the hint is load-bearing, not decoration.
   Then repeat as an agent in a **different** department and confirm the first agent's peers are
   absent. Record the outcome in the PR; story 05 set this precedent for an unverified query.
2. **API second:** `PATCH {{base_url}}/rest/v1/tickets?id=eq.{{ticket_id}}&assigned_to=is.null`
   with `{"assigned_to": "{{other_agent_id}}"}` and `Prefer: count=exact`. Expect
   `Content-Range: */1`. Re-send the identical request: expect `*/0` — that is the compare-and-set
   guard working. Then
   `GET {{base_url}}/rest/v1/ticket_events?ticket_id=eq.{{ticket_id}}&event_type=eq.assigned`
   and confirm **the trigger wrote a row the client never sent** (BRD `:693`).
3. **Lint:** `npm run lint` in the repo root. Zero errors. It is the gate for hard rules 2–5 —
   in this story specifically the negative `marginHorizontal` inset (rule 5) and the absence of
   any hex (rule 2), since Figma's avatar tints are raw palette values that must not be typed in.
4. **Typecheck:** `npm run typecheck` in the repo root. Zero errors. The `assigneeId` addition to
   `TicketDetail` (task 6) will surface anywhere story 07's mapper is incomplete.
5. **Frontend runs:** `npm start` in the repo root, then `i` or `a`. Sign in as an agent who has
   department peers.
6. **Manual — the five BRD criteria, in order:**

| # | Do this | Expect |
|---|---|---|
| 1 | Open a ticket, tap **Assign** | Sheet titled "Assign to"; only same-department agents (BRD `:689`) |
| 2 | Read a row | Avatar, name, "N open tickets"; a zero-workload agent reads "No open tickets" |
| 3 | Type a partial name | List narrows instantly — no spinner, no network request |
| 4 | Type nonsense | `empty.search` with the query quoted — not `empty.none` |
| 5 | Tap an agent | Sheet closes; the detail header's assignee updates without a pull-to-refresh (BRD `:690`) |
| 6 | Reopen the sheet | That agent now carries `CURRENT` + the check, and their workload is one higher (BRD `:691`) |
| 7 | Tap the `CURRENT` agent | Sheet closes; **no** new `assigned` row in the History tab |
| 8 | Tap **Unassign ticket** | Sheet closes; the ticket leaves "Mine" and appears under "Unassigned" (BRD `:692`) |
| 9 | Reopen the sheet | No `CURRENT` row; footer action gone |
| 10 | History tab | Exactly one `assigned` event per real change (BRD `:693`) |
| 11 | Airplane mode, tap an agent | Sheet stays open, `states.offline` on the error line, no crash |

7. **Regression — the screens this story can break:**
   - **Home** (`src/features/home/screens/HomeScreen.tsx`) — inline **Claim** still works; "My
     open" and "Unassigned" stats move after an assign, because `ticketKeys.all` covers them.
   - **Tickets** (`.../screens/TicketsScreen.tsx`) — the three chip counts move after an assign;
     search and day grouping untouched.
   - **Ticket detail** (story 07) — the **Status** button is still present and still inert;
     Conversation, Internal notes and History all still render.
   - **Profile / Login** — `auth/api.ts` and `auth/hooks.ts` gained appended exports only;
     `fetchAgentProfile`, `fetchAgentProfileWithOrg` and `useAgentProfile` are byte-identical.
8. **RTL:** relaunch in Arabic (Profile → Language → العربية → restart). The avatar leads the
   start edge, the check sits on the end edge, the search icon leads, and the negative
   `marginHorizontal` bleeds symmetrically. Arabic plurals read correctly at 0, 1, 2, 3 and 11
   open tickets.

---

## Done Criteria

- [ ] Given the assign sheet, when it opens, then **only agents in my department** are listed (BRD `:689`)
- [ ] Given I select an agent, when confirmed, then **the ticket is assigned and the sheet closes** (BRD `:690`)
- [ ] Given an assigned ticket, when I reassign, then **the new assignee replaces the previous** (BRD `:691`)
- [ ] Given I unassign, when confirmed, then **the ticket returns to the unassigned pool** (BRD `:692`)
- [ ] Given any assignment change, when saved, then **an `assigned` event is recorded** — by the trigger, with no client-side `ticket_events` insert (BRD `:693`)
- [ ] Each row shows the agent's initials avatar, name and open-ticket workload (Figma `124:1010`)
- [ ] The current assignee is marked with the `CURRENT` tag **and** `accessibilityState.selected`, not the glyph alone
- [ ] Search filters the roster client-side, with a comment saying why it is not a server query
- [ ] Concurrent reassignment produces `TicketAssignmentChangedError` and a visible message, never a silent overwrite
- [ ] `fetchDepartmentAgents` lives in `features/auth/` (the `profiles` owner) and reaches `tickets` only through `@/features/auth`'s barrel (hard rule 4)
- [ ] `useAssignTicket` invalidates **both** `ticketKeys.all` and `agentKeys.all`
- [ ] No hex literal, no physical layout prop, no `fontWeight` — `npm run lint` clean (hard rules 2, 5)
- [ ] `npm run typecheck` clean
- [ ] Both locales carry the new `ticketDetail.assign.*` keys, Arabic with its full plural set
- [ ] `CLAUDE.md` "Project status" no longer lists assignment as open
- [ ] Verification step 1's three results are recorded in the PR

---

## Open questions

1. **`profiles` RLS for same-department peers is unverified, and the whole story rests on it.**
   API §2 documents one `profiles` read (`id=eq.{{user_id}}`); §6's isolation matrix never tests
   the table. If no peer-SELECT policy exists, the sheet is empty and US-017 cannot ship without
   a backend change. **Verification step 1 answers this in five minutes — run it first.**
   Highest-priority question.
2. **Should managers appear in the assign sheet?** `user_role` is `agent | manager | admin`
   (`database.ts:554`). Task 2 filters on `department_id` and `is_active` but **not** `role`, so a
   manager in the department is assignable. That reads correct to us — a manager who takes a
   ticket is a normal escalation — but BRD `:689` says "agents", and if that word is literal the
   query needs `.eq('role', 'agent')`. One line either way; confirm before shipping.
3. **Figma's avatar tints are off-palette.** Nodes `I124:1010;122:991` and siblings use
   `yellow100`/`amber700`, `green100`/`green600`, `purple100`/`purple600`, `pink50`/`pink700` —
   none of which exist in `primitives.ts` (story 07 adds the first purple, and only two shades of
   it). This story uses `tintForName`'s existing four-tint cycle, so the sheet will not match the
   Figma render colour-for-colour. Either design blesses the four, or `primitives.ts` gains a
   named avatar-tint ramp — the second is a design-system change, not a story-08 one.
4. **The unassign action's colour contradicts the component it resembles.** Figma paints node
   `124:1064` `colors.danger`, but `Button`'s `link` variant is hard-coded to `tone="link"`
   (`Button.tsx:73-76`) and its `danger` variant is a filled, full-width control. Task 5 renders a
   local `Pressable` + danger `Text` rather than widening a core component for one consumer. If a
   text-danger action recurs (a "Delete customer" is the obvious next one), `Button` should gain
   `variant="linkDanger"` instead.
5. **"Assignment changed" and "RLS said no" are the same error to this client.** Both are zero
   rows affected. The message is worded for the first because it is overwhelmingly the likelier
   one, but an agent who somehow reaches a ticket outside their branch gets a misleading string.
   Distinguishing them needs a re-read after the failed PATCH — one extra round trip, on the error
   path only. Deferred; say so if you want it.
6. **There is no confirmation on unassign, and none in Figma.** Story 06 put a confirm on sign-out;
   this footer action is equally destructive to ownership and fires on a single tap. Figma shows no
   confirm step, so the plan follows Figma — but flag it rather than silently diverge either way.
7. **No notification reaches the new assignee.** BRD `:849` requires a push when a ticket is
   assigned to you (US-030); the `notifications` feature does not exist. The assignment is silent
   until then, which for a P0 ownership story is worth stating out loud to product.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 09.**
