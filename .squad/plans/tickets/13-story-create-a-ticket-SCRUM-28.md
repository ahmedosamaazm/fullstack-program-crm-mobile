# Story 13 — Create a ticket (Story: SCRUM-28)

> Intake: `.squad/stories/tickets/SCRUM-28/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4009` (`Tickets - New Ticket`); the screen body is `7:4014`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). Supplies the token layer, `TextField`, `TextArea`, `ModalHeader`, `BottomSheet`, `SearchField`, `Dropzone`, `Button`, `IconButton`. This story is the **first consumer of `Dropzone`** and the **second of `ModalHeader`** (story 11 is the first).
- **Story 04 completed** — [`04-story-ticket-list-with-filters-SCRUM-27.md`](04-story-ticket-list-with-filters-SCRUM-27.md). It left the Tickets FAB inert (`screens/TicketsScreen.tsx:119-123`, `// TODO(US-022)`), which **this story wires**, and it owns `ticketKeys` and the list queries this story invalidates.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md). Home's FAB currently routes to the Tickets tab as a stand-in (`screens/HomeScreen.tsx:158-162`, `// TODO(US-017)` — a mislabelled id; it is **US-022**). This story retargets it, closing US-022 alongside US-012.
- **Story 07 completed** — [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md). BRD `:618` requires the new ticket to *open*; `/tickets/[id]` is the route it opens, and it does not exist before story 07. Story 07 also owns `priorityColor` (`features/tickets/priority.ts`), which the priority chips reuse.
- **Story 05 completed** — [`../customers/05-story-customer-list-and-search-SCRUM-21.md`](../customers/05-story-customer-list-and-search-SCRUM-21.md). It exported `useCustomerSearch` **specifically for this story** (`features/customers/hooks.ts:39-47` and the "Do not delete as unused" note in `index.ts:8-10`). The customer picker consumes it; it does not write a second customer query.
- **Story 11 completed** — [`../customers/11-story-create-a-customer-SCRUM-22.md`](../customers/11-story-create-a-customer-SCRUM-22.md). Figma's `+ New customer` link (`102:987`) needs somewhere to go, and `/customers/new` is it. It also lands `PHONE_PATTERN`/`EMAIL_PATTERN` in `core/utils/validation.ts` and the `CustomerForm` pattern this screen's structure echoes.
- **`.env` populated**, and **seeded data**: at least five `categories` rows — some with `department_id` matching the agent's department, at least one with `department_id: null`, and at least one `is_active: false` — plus customers in the agent's branch to pick from. Without the null-department and inactive rows, task 2's scoping cannot be verified at all.

---

## Story Goal

An agent can capture a request while the customer is still on the line. Concretely:

1. **A modal-presented route** — `src/app/tickets/new.tsx` — reached from the FAB on **both** Home and the Tickets tab, closing US-022 as well as US-012.
2. **A customer picker** that searches live customers through story 05's existing hook and shares its cache, so a search already run on the Customers tab is served instantly.
3. **A category select driven by the `categories` table**, scoped to the agent's department, ordered by `sort_order`, filtered to active rows — not a hardcoded list. The intake is explicit: "an admin adding a sixth category should not require a code change".
4. **Priority chips from the `ticket_priority` enum**, defaulting to **medium** when the agent chooses nothing.
5. **Validation that blocks submission** on a missing customer, subject or category, each reported on its own control.
6. **An insert that omits `reference` and `status`** — both are server-generated — and a redirect that opens the created ticket.
7. **`['tickets']` invalidated on success**, so the new ticket appears in Mine and All without a manual refetch.

**Not in scope**: attachments (API §8 is still 🔨 and no picker package is installed — the Dropzone renders disabled, see flag 3), inline customer creation that returns to this form with the new customer selected (US-013 / SCRUM-29 — the `+ New customer` link navigates away and does not come back with a selection, see flag 2), assigning the ticket at creation time (US-017 is story 08's sheet, reached from the detail screen), and setting an initial status (the server writes `new`).

---

## Context — Read These Files First

1. `src/features/customers/screens/CreateCustomerScreen.tsx` and `components/CustomerForm.tsx` **as stories 11 and 12 leave them** — the repo's modal-form pattern: `ModalHeader` with `onCancel`/`onAction`/`actionDisabled`, `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"`, `useForm({ mode: 'onSubmit' })`, a `Controller` per field, a form-level `caption`/`danger` line, and `router.replace` on success. This screen is the same shape with different fields; **read it before writing, and diverge only where this story's controls genuinely differ.**
2. `src/features/tickets/api.ts:1-16` and `:401-421` — the imports and `postTicketMessage`. The insert shape (`.insert({...}).select(SELECT).single<Row>()`), `toAppError` at the boundary, and the file's own warning (lines 395-400) about never building an insert payload through `Partial<>` or a `Record<string, unknown>` — the same discipline applies to `status` and `reference` here, for the same reason.
3. `src/features/tickets/hooks.ts:35-48` — `ticketKeys`. `ticketKeys.all` is the single invalidation root; `useClaimTicket` (lines 126-137) and `useChangeTicketStatus` (lines 215-228) both use it, and the comment at 221-225 explains why a wide invalidation is right for anything that moves a ticket between lists. Creation moves one *into* a list, so it is the same case.
4. `src/features/customers/hooks.ts:39-47` — `useCustomerSearch(search)`, which is `useCustomers('all', search)` and therefore **shares `customerKeys.list('all', term)` with the Customers tab**. Consume it through the `@/features/customers` barrel (hard rule 4); `features/tickets/hooks.ts:3` already imports from `@/features/auth` the same way.
5. `src/features/customers/components/CustomerRow.tsx` — exported from the customers barrel (`index.ts:2`). The picker sheet renders these rather than inventing a row.
6. `src/features/tickets/priority.ts` — all 16 lines. `priorityColor(priority, theme)` returns the rail colour `TicketRow` uses. The four priority chips reuse it, so a chip and a row can never disagree about what "high" looks like.
7. `src/features/tickets/components/ChangeStatusSheet.tsx` — all 125 lines. The `BottomSheet` + options + `Button` + error-line pattern the customer picker and the category sheet both copy, including the `useEffect` that resets local state when `visible` goes false (lines 40-45).
8. `src/core/types/database.ts:144-178` — the `categories` row. `department_id: string | null`, `is_active: boolean`, `name_ar`/`name_en`, `sort_order: number`. **`department_id` is nullable**, which is what makes task 2's filter an `or`, not an `eq`.
9. `src/core/types/database.ts:453-471` — the `tickets` `Insert` type. Required: `branch_id`, `category_id`, `created_by`, `customer_id`, `department_id`, `subject`. Optional and **server-generated — do not send**: `id`, `reference`, `status`, `created_at`, `updated_at`. Optional and legitimately ours: `description`, `priority`, `assigned_to`.
10. `src/core/utils/locale-name.ts` (story 10, task 1) — `localisedName(row)`. The category sheet's labels go through it; do not add a fourth private copy.
11. `docs/phase1_api_reference.md:257-277` — §4.7. The example payload, `Prefer: return=representation`, and the explicit line: "`reference` and `status` are generated server-side — don't send them." Note §4.7's prose credits **US-017**, which is wrong — US-017 is assignment. This story is **US-012**; the same class of mislabelling story 04 corrected in passing.
12. `docs/phase1_brd_1.md:613-624` — US-012 and its six acceptance criteria; `:756-766` — US-022, closed here as a side effect. `## Done Criteria` mirrors both.
13. `src/features/home/screens/HomeScreen.tsx:158-162` and `src/features/tickets/screens/TicketsScreen.tsx:119-123` — the two FABs task 7 retargets, and their two TODO comments (one of which cites the wrong id).

---

## Design spec (resolved from Figma node `7:4009`)

Structure, from `get_metadata` on `7:4009`:

```
CreateTicketScreen 7:4014
├── 7:4015  header block
│   ├── 7:4016  StatusBarUI                 — OS chrome, not built
│   └── 102:942 Header (h 42)               — Cancel · "New ticket" · Create
└── 7:4044  form body (h 759.7)
    ├── 7:4045  Customer (h 96) at y=20
    │   ├── 7:4047  "Customer" label (h 18)
    │   ├── 7:4049  Card (h 46) → 7:4050 selected-customer chip + 7:4054 clear button (14×14)
    │   └── 102:987 "+ New customer" link (106 × 20)
    ├── 77:657   Subject     field (h 74)  at y=134
    ├── 102:946  Description field (h 134) at y=226
    ├── 102:950  Category    field (h 74)  at y=378
    ├── 7:4083   Priority (h 66) at y=470
    │   └── 7:4087 → 102:975 Low · 102:978 Medium · 102:981 High · 102:984 Urgent
    │                (82.9 × 40 each, gap 8)
    └── 7:4108   Attachments (h 92) at y=554
        └── 102:959 Attach (355.7 × 68)     — Dropzone, "Tap to attach files"
```

Placeholders and labels, read from the render:

| Field | Label | Placeholder / content |
|---|---|---|
| Customer | `CUSTOMER` | a blue pill reading `Meridian Supplies Ltd` with an `×`, plus `+ New customer` |
| Subject | `SUBJECT` | `Brief description of the issue` |
| Description | `DESCRIPTION` | `Full details, steps to reproduce, impact…` |
| Category | `CATEGORY` | `Select a category`, chevron-down |
| Priority | `PRIORITY` | `Low` · `Medium` · `High` · `Urgent`, each with a leading colour rail |
| Attachments | `ATTACHMENTS` | `Tap to attach files`, dashed border, paperclip |

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Header | 42h | `<ModalHeader actionLabel={t('createTicket.create')} />` |
| Horizontal inset | 16 | `spacing.lg` |
| Section label | 18h uppercase muted | `<Text variant="caption" weight="semibold" tone="muted">` with `textTransform: 'uppercase'` and `letterSpacing: theme.tracking.wide` — matching `TextField.tsx:71-80, 140` |
| Customer card | 46h, radius, hairline | `radius.md`, `colors.bgSurface`, `borderColor: colors.borderDefault` |
| Customer chip | 26h pill, tinted | `radius.full`, `colors.bgPrimarySubtle`, `<Text tone="link">` |
| Chip clear button | 14×14 | `<IconButton icon="close" size={24} variant="ghost" />` — 14px is below the 44px touch target (`layout.ts:41`); the glyph is 14, the control is not |
| `+ New customer` | 20h brand blue | `<Button variant="link" />` |
| Subject | 48h input | `<TextField />` — `FIELD_HEIGHT = 48`, exact |
| Description | 110h box | `<TextArea />` — `BOX_HEIGHT = 108`, 2px drift, accepted |
| Category | 48h select, chevron-down | `<TextField>`-shaped trigger, see task 4 |
| Priority chip | 82.9 × 40, gap 8 | see task 5 — **not** `FilterChip` |
| Attachments | 68h dashed | `<Dropzone />` — `HEIGHT = 68`, exact |
| Block → block gap | 20 | `spacing.xl` (24), the same 4px drift story 11 accepted |

Three things the render does **not** show, all invented here: the empty state of the customer card (Figma draws it populated), the selected state of a priority chip (all four render identically unselected, even though BRD `:617` mandates a `medium` default), and any error, loading or disabled treatment. Flags 4 and 5.

---

## Implementation tasks

### 1 — Types

**File: `src/features/tickets/types.ts`**

```ts
/** A selectable category — the `categories` projection, localised and camelCased. */
export type TicketCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

/**
 * What the create form collects. `departmentId`, `branchId` and `createdBy` are
 * NOT here — they come from the signed-in agent inside the mutation. Neither are
 * `reference` or `status`: both are server-generated (API §4.7), and a field for
 * either would be a field an agent could get wrong.
 */
export type CreateTicketInput = {
  customerId: string;
  subject: string;
  description: string;
  categoryId: string;
  priority: TicketPriority;
};
```

### 2 — The category query

**File: `src/features/tickets/api.ts`**

```ts
const CATEGORY_SELECT = 'id, name_en, name_ar, sort_order';

/**
 * `department_id` is NULLABLE (`database.ts:146`), and a null means "available
 * to every department" — so this is an `or`, not an `eq`. An `eq` would hide
 * every shared category, which looks like an empty picker rather than a bug.
 *
 * `is_active` is filtered here rather than in the UI: an admin deactivating a
 * category must stop it being *chosen*, while tickets already carrying it keep
 * rendering its name through the detail screen's own join.
 */
export async function fetchCategories(departmentId: string): Promise<TicketCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('is_active', true)
    .or(`department_id.is.null,department_id.eq.${departmentId}`)
    .order('sort_order', { ascending: true })
    .returns<{ id: string; name_en: string; name_ar: string; sort_order: number }[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: localisedName(row) ?? '',
    sortOrder: row.sort_order,
  }));
}
```

`departmentId` is interpolated into the `or` string, which is the one place in this file where a value reaches PostgREST's filter grammar unescaped. It is a UUID read from the agent's own profile, not user input, so it cannot contain a separator — **but do not extend this pattern to a search term.** `sanitizeSearchTerm` (`core/utils/search.ts`) exists for exactly that reason, and its doc comment explains the failure mode.

`localisedName` comes from `@/core/utils` (story 10, task 1).

**File: `src/features/tickets/hooks.ts`**

```ts
export const categoryKeys = {
  all: ['categories'] as const,
  list: (departmentId: string) => ['categories', 'list', departmentId] as const,
};

/**
 * Reference data, keyed under its OWN root — not `['tickets', …]`. Creating a
 * ticket must not refetch the category list, and Home's every-refresh
 * `ticketKeys.all` invalidation must not either. Same reasoning as
 * `agentKeys` (`features/auth/hooks.ts:34-37`).
 */
export function useCategories(enabled = true) {
  const profile = useAgentProfile();
  const departmentId = profile.data?.departmentId;
  return useQuery({
    queryKey: categoryKeys.list(departmentId ?? ''),
    queryFn: () => fetchCategories(departmentId as string),
    enabled: enabled && Boolean(departmentId),
    staleTime: 5 * 60_000,
  });
}
```

The five-minute `staleTime` matches `useAgentProfile`'s — categories change when an admin edits them, which is roughly never during a shift.

### 3 — The insert

**File: `src/features/tickets/api.ts`**

```ts
export type CreateTicketParams = CreateTicketInput & {
  departmentId: string;
  branchId: string;
  createdBy: string;
};

/**
 * §4.7. `reference` and `status` are ABSENT from this payload on purpose: both
 * are generated server-side, `status` defaults to `new` (BRD `:615`), and
 * `reference` is the `TKT-YYYYMM-NNNNN` sequence (BRD `:616`). Sending either
 * would at best be ignored and at worst overwrite a generated value.
 *
 * Written as a fully-typed object literal, never a `Partial<>` or a spread —
 * the same discipline `postTicketMessage` documents at lines 395-400, and for
 * the same reason: the `Insert` type makes every one of these optional, so a
 * dropped key is a runtime bug, not a compile error.
 *
 * `priority` is always sent, defaulting to `'medium'` in the form's own state
 * rather than relying on the column default — BRD `:617` is a UI requirement
 * ("no priority chosen → medium is applied") and the agent must SEE which one
 * is applied before they save.
 */
export async function createTicket(params: CreateTicketParams): Promise<TicketDetail> {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      customer_id: params.customerId,
      subject: params.subject.trim(),
      description: params.description.trim() || null,
      category_id: params.categoryId,
      priority: params.priority,
      department_id: params.departmentId,
      branch_id: params.branchId,
      created_by: params.createdBy,
    })
    .select(DETAIL_SELECT)
    .single<TicketDetailRow>();

  if (error) throw toAppError(error);
  return toTicketDetail(data);
}
```

As in story 11 task 3, **extract `toTicketDetail(row): TicketDetail` out of `fetchTicketDetail`** (`api.ts:317-348`) so the create and read paths share one mapper. `DETAIL_SELECT` (`api.ts:286-287`) is reused verbatim, which is what lets the mutation seed `ticketKeys.detail(id)`.

**File: `src/features/tickets/hooks.ts`**

```ts
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const profile = useAgentProfile();

  return useMutation({
    mutationFn: (input: CreateTicketInput) =>
      createTicket({
        ...input,
        departmentId: profile.data?.departmentId as string,
        branchId: profile.data?.branchId as string,
        createdBy: session?.user.id as string,
      }),
    onSuccess: (ticket) => {
      // Every list and every chip count: an unassigned `new` ticket lands in
      // "Unassigned" and "All", and both counts move.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.setQueryData(ticketKeys.detail(ticket.id), ticket);
    },
  });
}
```

Invalidate first, seed second — the same ordering constraint story 11 documents, and for the same reason (`ticketKeys.all` matches `['tickets', id]`).

### 4 — The two pickers

**Create file: `src/features/tickets/components/CustomerPickerSheet.tsx`**

```tsx
export type CustomerPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerListItem) => void;
};
```

A `BottomSheet` titled `t('createTicket.customerPicker.title')` holding a `SearchField` (debounced 300ms with `useDebounce`, as `CustomersScreen.tsx:44`) over a `FlatList` of `CustomerRow`s.

```tsx
const [query, setQuery] = useState('');
const search = useDebounce(query, 300);
const list = useCustomerSearch(search);
const customers = useMemo(() => list.data?.pages.flat() ?? [], [list.data]);
```

`useCustomerSearch` and `CustomerRow` and `CustomerListItem` all come from `@/features/customers` — the barrel, hard rule 4. This is the seam story 05 built and left unused; **do not** write a second customer query here.

It is an infinite query, so keep `onEndReached` + `hasNextPage`/`isFetchingNextPage` wired exactly as `CustomersScreen.tsx:65-67, 124-132`. A picker that silently caps at 50 customers is worse than one that paginates.

Reset `query` when `visible` goes false, as `ChangeStatusSheet.tsx:40-45` does — reopening onto a stale search is confusing and costs a refetch.

`+ New customer` is **not** in this sheet; it sits under the customer card on the form (Figma `102:987`), and it routes to `/customers/new` (story 11). See flag 2 for what it does not do.

**Create file: `src/features/tickets/components/CategoryPickerSheet.tsx`**

```tsx
export type CategoryPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  selectedId: string | null;
  onSelect: (category: TicketCategory) => void;
};
```

A `BottomSheet` over `useCategories()`, rendering `RowGroup` + `SettingsRow type="link"` with `icon={category.id === selectedId ? 'check' : undefined}` — the `LanguageSheet` pattern (`features/profile/components/LanguageSheet.tsx:37-47`) verbatim, which is the established way this app presents a short single-select list.

Three states, all explicit: `isPending` → `SkeletonList count={5}`; `isError` → `ErrorState` with retry; empty → `EmptyState` with `t('createTicket.category.empty')`. The empty case is real — a department with no categories and no shared ones makes the form unsubmittable, and an empty sheet with no explanation is indistinguishable from a broken query.

The form's trigger is a `Pressable` styled as a 48px `TextField` (`bgSurface`, `radius.md`, hairline `borderDefault`, `paddingHorizontal: spacing.md`) holding the selected name — or `t('createTicket.category.placeholder')` in `tone="muted"` — and a trailing `<Icon name="chevronDown" size={16} />`. It carries `accessibilityRole="button"` and an `accessibilityState={{ expanded }}`. **It is not a `TextField`** — an editable-looking control that opens a sheet on tap is a worse lie than a button that looks like a field.

### 5 — Priority chips

**Create file: `src/features/tickets/components/PriorityChip.tsx`**

```tsx
export type PriorityChipProps = {
  priority: TicketPriority;
  selected: boolean;
  onPress: (priority: TicketPriority) => void;
  disabled?: boolean;
};
```

Not `FilterChip`. Three reasons, in order: `FilterChip` is a `radius.full` pill and Figma's priority control is a 40h rounded **rectangle**; `FilterChip` has no leading colour rail, and the rail is this control's whole point; and `FilterChip`'s own doc comment (`core/components/FilterChip.tsx:18-26`) records that it is built against substituted tokens because its Figma source is corrupt — inheriting that here would spread a known-wrong component. This is a domain component and belongs in `features/tickets/components/` (CLAUDE.md, "Target architecture").

Structure: a `Pressable`, `flex: 1`, `height: 40`, `radius.md`, hairline border, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: spacing.sm`, `paddingHorizontal: spacing.md`. Inside, a 3×16 rail — `width: 3`, `borderRadius: theme.radius.full`, `backgroundColor: priorityColor(priority, theme)` — then `<Text variant="callout">{t(`ticket.priority.${priority}`)}</Text>`.

`ticket.priority.*` already exists in both locale files (`en.json:101-106`); **do not add a second set of priority labels.**

Selected state — **this plan's invention**, since Figma renders all four identically (flag 4). Follow the pattern story 09 used for the same gap on `StatusOption`: `borderColor: theme.colors.borderFocus` and `backgroundColor: theme.colors.bgPrimarySubtle`, plus `weight="semibold"` on the label. Colour alone is not the cue — the weight change is what satisfies the non-colour-cue discipline BRD `:610` established for the ticket list.

`accessibilityRole="radio"`, `accessibilityState={{ checked: selected }}`, wrapped in a `View` with `accessibilityRole="radiogroup"` — this is a single-select group, not four independent toggles.

### 6 — `CreateTicketScreen`

**Create file: `src/features/tickets/screens/CreateTicketScreen.tsx`**

```tsx
const {
  control, handleSubmit, watch, setValue,
  formState: { errors },
} = useForm<CreateTicketInput>({
  defaultValues: {
    customerId: '',
    subject: '',
    description: '',
    categoryId: '',
    // BRD `:617` — medium is the default, and it is SELECTED in the UI from
    // the first frame, not applied silently by the column default on save.
    priority: 'medium',
  },
  mode: 'onSubmit',
});
```

`customerId` and `categoryId` live in the form so validation and submission stay in one place, but their **display** values do not — a chip needs the customer's name and the trigger needs the category's name, neither of which is an id. Hold those in two pieces of local `useState`, set together with `setValue` when a sheet resolves:

```tsx
const [customer, setCustomer] = useState<CustomerListItem | null>(null);
const [category, setCategory] = useState<TicketCategory | null>(null);

function handleCustomerSelect(next: CustomerListItem) {
  setCustomer(next);
  setValue('customerId', next.id, { shouldValidate: true });
  setCustomerPickerVisible(false);
}
```

`shouldValidate: true` is what clears a "choose a customer" error the moment one is chosen, rather than leaving it on screen until the next save attempt.

**Validation:**

| Field | Rule |
|---|---|
| `customerId` | `required: t('createTicket.errors.customerRequired')` |
| `subject` | `required` + `validate: (v) => v.trim().length > 0 \|\| t('createTicket.errors.subjectRequired')` |
| `categoryId` | `required: t('createTicket.errors.categoryRequired')` |
| `description` | none — `description` is nullable (`database.ts:445`) |
| `priority` | none — always set |

The customer and category errors render as `<Text variant="caption" tone="danger">` beneath their controls, since neither is a `TextField` with a built-in error slot.

**Layout**, top to bottom: `ModalHeader` (`title={t('createTicket.title')}`, `actionLabel={t('createTicket.create')}`, `actionDisabled={create.isPending || !profile.data}`) → `KeyboardAvoidingView` → `ScrollView` with `keyboardShouldPersistTaps="handled"` → the six sections in Figma's order → the form-level error line. Then the two sheets, rendered as siblings after the scroll view, exactly as `TicketDetailScreen.tsx:137-149` renders its two.

**The customer card**: when `customer` is null, render the card with `t('createTicket.customer.placeholder')` in `tone="muted"` and the whole card as the picker trigger. When set, render the pill with the name and a clear button that resets both the state and the form value. Figma only draws the populated case; the empty one is flag 5.

**Attachments**: `<Dropzone label={t('createTicket.attachments.label')} hint={t('createTicket.attachments.unavailable')} disabled onPress={() => {}} />`. Rendered, visibly disabled, and wired to nothing — API §8 is 🔨 and no picker package is installed. Deleting the section would be the cleaner code and the worse handoff: the design shows it, and a disabled control with an explanatory hint tells the agent it is coming. Flag 3.

**Submit:**

```tsx
function onSubmit(values: CreateTicketInput) {
  create.mutate(values, {
    onSuccess: (ticket) => router.replace(`/tickets/${ticket.id}`),
  });
}
```

`router.replace`, so backing out of the new ticket lands on whatever the agent was doing, not on a form for a ticket that already exists.

**File: `src/features/tickets/index.ts`** — export `CreateTicketScreen`, `useCreateTicket`, `useCategories`, `categoryKeys`, and the `CreateTicketInput` / `TicketCategory` types.

### 7 — The route, and the two FABs it closes

**Create file: `src/app/tickets/new.tsx`**

```tsx
import { CreateTicketScreen } from '@/features/tickets';

export default function NewTicket() {
  return <CreateTicketScreen />;
}
```

**File: `src/app/_layout.tsx`** — register inside `Stack.Protected`:

```tsx
<Stack.Screen name="tickets/new" options={{ presentation: 'modal' }} />
```

The static `tickets/new` segment resolves ahead of the dynamic `tickets/[id]`, so `/tickets/new` never lands on the detail screen.

**File: `src/features/tickets/screens/TicketsScreen.tsx:119-123`** — `onPress={() => router.push('/tickets/new')}`; delete the `// TODO(US-022)` comment.

**File: `src/features/home/screens/HomeScreen.tsx:158-162`** — same target; delete the `// TODO(US-017)` comment, which cites the wrong id (US-017 is assignment, shipped in story 08 — the FAB is **US-022**). Home's FAB currently routes to `/(tabs)/tickets` as a stand-in; that line goes.

Both FABs already read `t('home.newTicket')` for their accessible label. That key lives in the `home` namespace and is now used by two features; move it to `ticket.new` and update both call sites, so the Tickets tab is not reaching into `home` for its own control's name.

### 8 — Copy

**Files: `src/core/lib/i18n/locales/en.json` and `ar.json`** — add `createTicket` after `ticketDetail`, and move `home.newTicket` → `ticket.new`.

```json
"createTicket": {
  "title": "New ticket",
  "create": "Create",
  "customer": {
    "label": "Customer",
    "placeholder": "Choose a customer",
    "clear": "Clear selected customer",
    "newCustomer": "+ New customer"
  },
  "customerPicker": {
    "title": "Choose a customer",
    "searchPlaceholder": "Search customers, phone…",
    "empty": "No customers match \"{{query}}\"."
  },
  "subject": { "label": "Subject", "placeholder": "Brief description of the issue" },
  "description": { "label": "Description", "placeholder": "Full details, steps to reproduce, impact…" },
  "category": {
    "label": "Category",
    "placeholder": "Select a category",
    "title": "Select a category",
    "empty": "No categories are available for your department."
  },
  "priority": { "label": "Priority" },
  "attachments": {
    "label": "Attachments",
    "unavailable": "Attachments aren't available yet."
  },
  "errors": {
    "customerRequired": "Choose a customer.",
    "subjectRequired": "Enter a subject.",
    "categoryRequired": "Choose a category."
  }
}
```

Arabic values in the same shape. The four priority labels are **not** here — `ticket.priority.*` already exists (`en.json:101-106`).

### 9 — Update the instruction files

**File: `CLAUDE.md`** — "Project status": ticket creation is no longer open; **notifications become the only unbuilt phase-1 area**. Add `src/app/tickets/new.tsx` to the route list. **File: `AGENTS.md`** needs no change.

---

## Edge Cases & Failure Modes

- **`reference` or `status` in the payload.** The `Insert` type makes both optional, so adding them is not a compile error — it is a silent overwrite of a server-generated value. Task 3's payload is a fixed object literal with a comment naming both; the invariant is enforced by review and by test 1, not by the type system.
- **The agent's profile has not loaded.** `actionDisabled={… || !profile.data}` blocks Create, and `useCategories`'s `enabled` guard keeps the category query from firing with an empty department id. Without both, the insert sends `undefined as string` and returns an opaque foreign-key violation.
- **No categories for the department.** Real whenever `categories` has no matching or shared row. The sheet shows an explanatory empty state (task 4) and `categoryId` stays empty, so Create is blocked with a field-level reason. Silently rendering an empty list is the failure this guards against.
- **A category deactivated between the sheet opening and the save.** The insert still succeeds — `is_active` is a picker filter, not a foreign-key constraint. Accepted: the ticket carries a valid `category_id`, and the detail screen resolves its name through its own join.
- **`department_id.is.null` categories.** Shared across departments. The `or` in task 2 is what includes them; an `eq` would hide them and the picker would look broken rather than empty. Verification step 2.
- **Selecting a customer, then clearing it.** Both the local `customer` state **and** the form's `customerId` must reset; resetting only the first leaves a submittable form with no visible selection.
- **Selecting a customer outside the agent's branch.** Not reachable — `useCustomerSearch` reads through the same RLS-scoped query the Customers tab uses, so the picker cannot show one. If RLS ever loosened, the insert would still be rejected server-side.
- **A whitespace-only subject.** `required` alone passes on `'   '`; the explicit `validate` rejects it and `.trim()` in task 3 is the second line of defence.
- **An empty description.** Written as `null`, not `''` — `description` is `string | null` (`database.ts:445`).
- **Double-tap on Create.** `actionDisabled={create.isPending}` blocks the second tap. Without it two tickets are created, each with its own `TKT-…` reference, and only the second is opened — a duplicate an agent will not notice until the customer mentions it.
- **The `created` event.** Written by a database trigger, not by this story (BRD `:619`). Verification step 3 proves it; there is no client code to review.
- **`or()` and interpolation.** `departmentId` reaches PostgREST's filter grammar unescaped (task 2). It is a UUID from the agent's own profile and is safe, but the pattern must not spread to any user-typed value — `sanitizeSearchTerm` exists for that, and the picker's search goes through `useCustomerSearch`, which already applies it.
- **Cancel with a filled form.** Dismisses with no confirmation, matching Figma and matching story 11's create-customer form. This one is worse — a ticket form holds a customer's whole description of their problem. Flag 6.
- **Arabic layout.** The category trigger's `chevronDown` is non-directional and must not mirror; the priority rail sits at the *start* of the chip, so it moves to the right under RTL, which is correct and will look wrong to anyone reviewing against the LTR mock.

---

## Test Plan

**There is no test runner in this repo** (AGENTS.md). The list below is what to write when one is installed; the manual matrix underneath is the gate today.

### Manual test matrix

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Any | Tap the FAB on the Tickets tab | The New ticket modal presents |
| 2 | Any | Tap the FAB on Home | The **same** modal — not the Tickets tab (BRD `:764`) |
| 3 | Empty form | Tap Create | Errors on Customer, Subject and Category; nothing is sent (BRD `:617`) |
| 4 | Any | Tap the customer card | The picker sheet opens with a search field |
| 5 | Picker open | Type a partial name | Matching customers after ~300ms |
| 6 | Picker open, 60+ customers | Scroll to the bottom | More rows load — the picker paginates |
| 7 | Picker open | Tap a customer | The sheet closes; the chip shows their name; any customer error clears |
| 8 | Customer selected | Tap the chip's × | The chip clears; Create is blocked again |
| 9 | Any | Tap `+ New customer` | The New customer modal opens (see flag 2 for what happens next) |
| 10 | Any | Tap the category trigger | A sheet listing categories in `sort_order` |
| 11 | A category with `department_id: null` seeded | Open the sheet | It is listed |
| 12 | A category with another department's id | Open the sheet | It is **not** listed |
| 13 | A category with `is_active: false` | Open the sheet | It is **not** listed |
| 14 | Category selected | Reopen the sheet | A check mark sits on the selected row |
| 15 | Any | Read the priority row on open | **Medium** is visibly selected (BRD `:617`) |
| 16 | Any | Tap High | High becomes selected; Medium does not stay selected |
| 17 | Any | Read the priority chips | Each carries its colour rail, matching the ticket-list rail |
| 18 | Customer + subject + category | Tap Create | The ticket is created and **opens** (BRD `:614`, `:618`) |
| 19 | After row 18 | Read the detail header | Status is **New** (BRD `:614`) |
| 20 | After row 18 | Read the reference | Matches `TKT-YYYYMM-NNNNN` (BRD `:616`) |
| 21 | After row 18 | Open the History tab | A **created** event is present (BRD `:619`) |
| 22 | After row 18 | Press back | Not the form — `replace`, not `push` |
| 23 | After row 18 | Open the Tickets tab | The ticket appears under **Unassigned** and **All** with no manual refresh |
| 24 | After row 18 | Read the chip counts | Unassigned and All have incremented |
| 25 | Subject = `"   "` | Tap Create | The subject error; nothing is sent |
| 26 | Description empty | Create | Succeeds; the stored `description` is `null` |
| 27 | Any | Double-tap Create fast | Exactly **one** ticket is created |
| 28 | Any | Read the Attachments section | Present, visibly disabled, with the "not available yet" hint |
| 29 | Airplane mode | Tap Create | The form-level error; every value is kept |
| 30 | Department with no categories | Open the category sheet | An explanatory empty state, not a blank sheet |
| 31 | Cold start → straight to the FAB | Tap Create immediately | Blocked until the profile loads; no foreign-key error |
| 32 | العربية, restarted | Open the form | Layout mirrors; the priority rail sits at the start of each chip; the chevron does not mirror |
| 33 | Toggle system dark mode | Open the form | Card, chip, sheets, rails and errors all legible |
| 34 | Signed out | Deep-link `/tickets/new` | The login screen |
| 35 | Any | Open the Customers tab and search | Still works — the `useCustomerSearch` shared-cache check |

### To write when a runner exists

1. **Unit — `src/features/tickets/api.test.ts`** · `createTicket`'s payload has exactly the eight expected keys and **no** `reference`, `status`, `id`, `created_at` or `updated_at`. The single most important test in this story.
2. **Unit — `src/features/tickets/api.test.ts`** · an empty `description` is sent as `null`; a whitespace subject is trimmed.
3. **Unit — `src/features/tickets/api.test.ts`** · `fetchCategories` builds `or=(department_id.is.null,department_id.eq.<id>)`, filters `is_active`, and orders by `sort_order` ascending.
4. **Unit — `src/features/tickets/api.test.ts`** · `fetchCategories` maps `name_ar` under `ar` and `name_en` under `en`, via `localisedName`.
5. **Unit — `src/features/tickets/hooks.test.ts`** · `categoryKeys.list(id)` does not collide with `ticketKeys.all`; invalidating `ticketKeys.all` leaves the category cache untouched.
6. **Integration — `src/features/tickets/hooks.test.tsx`** · `useCreateTicket` invalidates `ticketKeys.all` **before** seeding `ticketKeys.detail(id)`.
7. **Integration — `src/features/tickets/hooks.test.tsx`** · `createTicket` receives `departmentId`/`branchId`/`createdBy` from the session and profile, never from the input.
8. **Unit — `src/features/tickets/screens/CreateTicketScreen.test.tsx`** · `priority` defaults to `'medium'` and the Medium chip renders `accessibilityState={{ checked: true }}` on first paint.
9. **Unit — `src/features/tickets/screens/CreateTicketScreen.test.tsx`** · clearing the customer resets **both** the local state and `customerId`, and Create becomes blocked.
10. **Unit — `src/features/tickets/components/PriorityChip.test.tsx`** · exactly one chip is `checked` at a time, and the rail colour equals `priorityColor(priority, theme)`.
11. **Integration — `src/features/tickets/components/CustomerPickerSheet.test.tsx`** · it resolves to the **same** cache entry as `useCustomers('all', term)` — the seam story 05 built.

---

## Verification Steps

1. **Prove the server generates `reference` and `status` before writing the screen.** Insert without either and read the response:
   ```bash
   curl -s -X POST -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" -H "Prefer: return=representation" \
     -d '{"subject":"probe","customer_id":"'$CUSTOMER'","category_id":"'$CATEGORY'","department_id":"'$DEPT'","branch_id":"'$BRANCH'","created_by":"'$USER'"}' \
     "$URL/rest/v1/tickets"
   ```
   Confirm `status` comes back `"new"` and `reference` matches `^TKT-\d{6}-\d{5}$`. **If `reference` is null, BRD `:616` is unmet by backend work this story cannot do** — stop and raise it before building the form.
2. **Prove the category scoping.** Run `fetchCategories`'s query for the agent's department and confirm the result includes shared (`department_id: null`) rows, excludes other departments' rows, and excludes inactive ones. This needs all three seeded (see Prerequisites); without them the query is untested, not passing.
3. **Prove the `created` event.** After step 1, `GET /rest/v1/ticket_events?ticket_id=eq.<id>` and confirm one row with `event_type: "created"`. BRD `:619` is satisfied by a trigger, so this is the only evidence there will be.
4. **Typecheck:** `npm run typecheck` — zero errors. Note the limit: the `Insert` type makes every column optional, so it will **not** catch an extra `status` key. Read task 3's payload by eye against `database.ts:453-471`.
5. **Lint:** `npm run lint` — zero errors. The gate for hard rules 2-5, and specifically for hard rule 4 on the three `@/features/customers` imports in the picker sheet: they must come from the barrel, never from `@/features/customers/hooks`.
6. **Frontend runs:** `npm start`, `a` and `i`. Walk the matrix.
7. **Regression — ticket detail:** open a ticket created before this story. Task 3 extracted `toTicketDetail` out of `fetchTicketDetail`; a wrong extraction shows as blank header fields, not an error.
8. **Regression — Home and the Tickets tab:** confirm both still render, and that Home's FAB no longer routes to the Tickets tab. Task 7 rewrote both call sites and moved `home.newTicket` to `ticket.new`; a missed rename shows as a raw key string in the accessibility label, which is invisible on screen.
9. **Regression — the Customers tab:** search there, then open this form's picker and search the same term. The second must be instant. Matrix row 35.
10. **RTL:** switch to العربية and **fully restart**. Matrix row 32.
11. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:614-619` (US-012) and `:764-765` (US-022).

- [ ] Given I select a customer and complete required fields, when I save, then a ticket is created **with status `new`**
- [ ] Given a ticket is created, when saved, then a unique reference in format **`TKT-YYYYMM-NNNNN`** is generated
- [ ] Given a required field is empty, when I save, then validation **blocks submission**
- [ ] Given no priority is chosen, when I save, then **medium** is applied
- [ ] Given a ticket is created, when written, then a **created event** is recorded
- [ ] Given creation succeeds, when complete, then **the new ticket opens**
- [ ] Given Home or the Tickets tab, when displayed, then a New Ticket action is visible
- [ ] Given the action, when tapped, then the **ticket creation screen** opens

Plus, from the intake and the design:

- [ ] The insert payload contains **neither `reference` nor `status`**
- [ ] The customer picker consumes `useCustomerSearch` and shares its cache with the Customers tab
- [ ] Categories come from the `categories` table, scoped to the department, `is_active`-filtered, `sort_order`-ordered — no hardcoded list
- [ ] Categories are keyed under `['categories', …]`, not under `['tickets', …]`
- [ ] Medium is **visibly selected** from the first frame, not applied silently on save
- [ ] Priority chips carry a colour rail from `priorityColor`, so a chip and a ticket row never disagree
- [ ] A successful save invalidates `ticketKeys.all` and seeds `ticketKeys.detail(id)`, in that order
- [ ] The redirect is `router.replace`
- [ ] Both FABs are wired; both TODO comments are gone; `home.newTicket` has become `ticket.new`
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" lists ticket creation as built and **notifications as the only remaining phase-1 area**

---

## Open questions — raise with design/product, do not resolve silently

1. **The reference format is unverified from the client.** BRD `:616` requires `TKT-YYYYMM-NNNNN`, and nothing in this repo generates it — it is a database default or trigger. `docs/phase1_backend_plan.md` should be checked for the sequence's reset behaviour: a `NNNNN` that is global rather than per-month makes the `YYYYMM` segment decorative, and one that resets monthly needs a plan for the 100,000th ticket in a month. Verification step 1 confirms the format exists; it cannot confirm the semantics.
2. **`+ New customer` navigates away and does not come back.** Figma's `102:987` sits inside the customer section, implying inline creation — which is **US-013 (SCRUM-29)**, a separate story whose entire point is "without leaving the form so that I do not lose my input" (BRD `:633`). This story routes to `/customers/new`, and returning leaves the ticket form reset with nothing selected. That is strictly worse than the current no-op for an agent mid-call. **Consider hiding the link until SCRUM-29 lands**, or accept the round trip; either way it is a product call, not an implementation detail.
3. **Attachments are drawn but cannot work.** Figma gives the section a full `Dropzone` (`102:959`), API §8 is marked 🔨, and no picker package (`expo-document-picker`, `expo-image-picker`) is installed. This story renders it **disabled with an explanatory hint**. The alternatives are to delete the section (cleaner code, and design would see it disappear) or to install a picker and stage files locally against an upload endpoint that does not exist (worse). Confirm the disabled treatment, and note it is the third area now waiting on Storage — with the customer Notes tab (SCRUM-26) and CSAT (§7).
4. **Priority chips have no selected state in Figma.** All four of `102:975`/`978`/`981`/`984` render identically, while BRD `:617` requires medium to be the default — so the mock cannot be showing a resting state correctly. This plan invents `borderFocus` + `bgPrimarySubtle` + `weight="semibold"`, the same treatment story 09 invented for `StatusOption`'s missing selected state (its flag 3). **Two components have now needed the same invention**; a real selected-state variant in the Figma component set would settle both.
5. **The customer card has no empty state.** `7:4049` is drawn populated. This plan renders a muted "Choose a customer" placeholder in the same card, with the whole card as the tap target. Also unspecified: what the card does when a name is too long for one line, and whether the `×` clears the selection or opens the picker.
6. **Cancel discards the form silently.** Story 11 raised this for the customer form (its flag 7); it is sharper here, because this form holds a customer's whole account of their problem, typed while they are on the line. A confirmation on `formState.isDirty` is ~15 lines and would reuse `ProfileScreen`'s sign-out `BottomSheet` pattern. **The second story to file this**; it should be decided once, for both forms.
7. **API §4.7 credits the wrong story.** `docs/phase1_api_reference.md:277` says the create endpoint "Supports **US-017**". US-017 is *assign a ticket* (BRD `:681`, shipped in story 08); creation is **US-012**. Corrected here in passing, as story 04 corrected two other mislabelled ids — worth fixing in the doc so the next planner does not follow it.

**STOP HERE. This is the last of the four customer/ticket-creation stories. Report to the user.**
