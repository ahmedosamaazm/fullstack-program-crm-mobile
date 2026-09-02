# Story 11 — Create a customer (Story: SCRUM-22)

> Intake: `.squad/stories/customers/SCRUM-22/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:2799` (`Customers - New Customer`); the screen body is `7:2804`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). Supplies the token layer, `Text`/`TextInput`, `TextField`, `ModalHeader`, `Button`, `IconButton`, `DetailRow`. This story is the **first consumer of `ModalHeader`** — `grep -rn '<ModalHeader' src/` returns no hits today.
- **Story 05 completed** — [`05-story-customer-list-and-search-SCRUM-21.md`](05-story-customer-list-and-search-SCRUM-21.md). It created `src/features/customers/`, the `customerKeys` root, and the inert FAB (`screens/CustomersScreen.tsx:143-148`, `// TODO(US-006)`) **this story wires**. Its open question 7 — "nothing invalidates `customerKeys.all` yet" — is closed here.
- **Story 10 completed** — [`10-story-customer-profile-view-SCRUM-24.md`](10-story-customer-profile-view-SCRUM-24.md). **This is a hard dependency, not a courtesy.** BRD `:531` requires that a successful save *opens* the new customer, and `/customers/[id]` does not exist before story 10. Story 10 also lands `customerKeys.detail`, `CustomerDetail`, `fetchCustomerDetail`, `parseSecondaryContacts` and the `SecondaryContact` type, all of which this story writes to.
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md). Supplies `useAgentProfile()` → `AgentProfileWithOrg`, whose `departmentId` / `branchId` / `departmentName` / `branchName` are the only source of the inherited org fields (task 4), and `LoginScreen.tsx` — the repo's **only** existing React Hook Form screen, and therefore the pattern this story extends.
- **Story 10's open question 3 answered** — the real shape of `customers.secondary_contacts`. Verification step 1 of story 10 reads it off a live row. **This story writes that array**; guessing wrong writes malformed data that story 10's reader will silently drop. If the answer has not come back, run verification step 1 here before writing task 3.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **Seeded data**: the signed-in agent's `profiles` row must have valid `department_id` and `branch_id` (every seeded agent does), and at least one existing customer **in the agent's own branch** whose phone can be re-used to trigger the duplicate path (BRD `:530`).

---

## Story Goal

The Customers tab's FAB stops being inert and opens a form that writes a real customer. Concretely:

1. **A modal-presented route** — `src/app/customers/new.tsx` — with Figma's Cancel / New customer / Save header.
2. **A validated form**: full name and phone required, email optional but format-checked, each failure reported **on its field**, never as a banner.
3. **A repeatable secondary-contacts section** — add and remove rows, with the array written as one JSON column.
4. **Department and branch inherited from the signed-in agent**, displayed read-only rather than chosen. RLS rejects any other value (API §3.3), so offering a picker would only manufacture a 403.
5. **The duplicate-phone conflict surfaced as a field error on phone** — the intake is explicit that this must not become a generic toast, and the plumbing needed to do that is more than it looks (task 2).
6. **A successful save invalidates `['customers']` and opens the new customer**, seeding `['customers', id]` from the insert's own response so the detail screen paints without a second round trip.

**Not in scope**: editing (US-007, story 12), inline creation from the ticket form (US-013 — story 13 renders a `+ New customer` affordance that routes **here**, and this story does not build the return-value plumbing that story needs), avatar upload (there is no `avatar_url` column), and attachments.

---

## Context — Read These Files First

1. `src/features/auth/screens/LoginScreen.tsx` — all 151 lines. **The repo's only React Hook Form precedent**, and this story copies it exactly: `useForm<T>({ defaultValues, mode: 'onSubmit' })` (line 30), a `<Controller>` per field with `rules` carrying **translated** messages (lines 67-70), `error={errors.<field>?.message}` fed straight into `TextField`, `useRef` + `onSubmitEditing` to chain focus (lines 22, 85), and `handleSubmit(onSubmit)` on the submit control (line 131). Note `mode: 'onSubmit'` — validation fires on save, which is exactly what BRD `:528` describes.
2. `src/core/components/TextField.tsx` — all 143 lines. `error?: string` (line 21) drives both the red border (line 92) and the caption below (lines 130-134); `required?: boolean` (line 24) appends `` * (Required) `` to the label (line 79). `inputRef` (line 34) is what the focus chain uses.
3. `src/core/components/ModalHeader.tsx` — all 77 lines. `title`, `onCancel`, `actionLabel`, `onAction`, `actionDisabled` — Figma's `Cancel` / `New customer` / `Save` header verbatim. `actionDisabled` renders the action `tone="disabled"` (line 64), which is why Figma's `Save` is grey.
4. `src/features/tickets/api.ts:259-281` — `TicketAlreadyClaimedError` and `claimTicket`. The **typed-error-class-at-the-boundary** pattern task 2 copies: a named `Error` subclass thrown from `api.ts`, caught by `instanceof` in the component. `src/features/tickets/api.ts:508-519` (`STATUS_ERROR_PATTERNS` / `toStatusChangeError`) is the second precedent — a feature-local error mapper layered on `toAppError`, because `core/` may not know what a customer is (hard rule 3).
5. `src/core/utils/errors.ts:48-57` — `readStatus`. **Read this carefully before writing task 2.** It coerces an all-digit `code` string into a status. Postgres reports a unique-constraint violation as `code: "23505"`, which *is* all digits, so `toAppError` yields `status: 23505` → `kindFromStatus` → `>= 500` → `kind: 'server'`. The duplicate phone is therefore **indistinguishable from a server error** after `toAppError` has run. Detect it on the raw error, before mapping.
6. `src/features/customers/api.ts` and `hooks.ts` **as they stand after story 10** — `DETAIL_SELECT`, `CustomerDetailRow`, `parseSecondaryContacts`, `fetchCustomerDetail`, `customerKeys.detail`. Task 3 reuses `DETAIL_SELECT` on the insert's `.select()` so the created row comes back in the exact shape the detail screen expects.
7. `src/features/customers/screens/CustomersScreen.tsx:143-148` — the inert FAB and its `// TODO(US-006)`. Task 6 replaces the body with a `router.push`.
8. `src/features/auth/hooks.ts:23-32` and `src/features/auth/types.ts:8-22` — `useAgentProfile()` and `AgentProfileWithOrg`. `departmentId` and `branchId` are the insert payload; `departmentName` and `branchName` are what the read-only rows display. `staleTime: 5 * 60_000` means this is usually already warm.
9. `src/core/types/database.ts:211-247` — the `customers` `Insert` type. **`branch_id`, `department_id`, `full_name` and `phone` are required; everything else is optional.** `created_by` is `string | null` and optional — see flag 4. `id`, `created_at` and `updated_at` are all optional and server-generated; do **not** send them.
10. `docs/phase1_api_reference.md:165-186` — §3.3. The example payload, `Prefer: return=representation`, the RLS note ("rejects any `department_id`/`branch_id` that isn't the caller's own"), and the explicit duplicate-phone test ("expect `409 Conflict` from the `unique (branch_id, phone)` constraint").
11. `docs/phase1_brd_1.md:525-531` — US-006 and its five acceptance criteria. `## Done Criteria` mirrors them verbatim.
12. `src/app/_layout.tsx:63-73` and `src/app/customers/[id].tsx` (story 10) — where task 6 registers the new route, and why its `presentation: 'modal'` option matters.
13. `eslint.config.js` — hard rules 2-5. The `+ Add contact` link and the read-only org rows are where a physical `marginLeft` is most likely to creep in.

---

## Design spec (resolved from Figma node `7:2799`)

Structure, from `get_metadata` on `7:2799`:

```
CreateCustomerScreen 7:2804
├── 7:2805  StatusBar                       — OS chrome, not built
├── 99:918  Header (h 42)                   — Cancel · "New customer" · Save
└── 7:2833  form body (h 706)
    ├── 77:663  FullName   field (h 74) at y=20
    ├── 77:667  Phone      field (h 74) at y=114
    ├── 77:671  Email      field (h 74) at y=208
    ├── 7:2853  Secondary contacts (h 184) at y=302
    │   ├── 7:2855  "Secondary contacts" label (h 18)
    │   ├── 7:2857  card (h 130, 1px inset border, radius)
    │   │   ├── 99:942  "Contact name"  input (h 48)
    │   │   └── 99:946  "Phone number"  input (h 48)
    │   └── 99:950  "+ Add contact" link (90 × 20)
    ├── 99:922  Department field (h 74) at y=506   — rendered as a select in the mock
    └── 99:933  Branch     field (h 74) at y=600   — rendered as a select in the mock
```

Field spacing is uniform: each 74px block is a 18px uppercase label + 8px gap + 48px input, and consecutive blocks sit 94px apart — a **20px** gap, which snaps to `spacing.xl` (24) or `spacing.lg` + `spacing.xs`. Use `gap: theme.spacing.xl` on the form column and accept the 4px drift, the same call stories 01 and 05 made on comparable off-scale gaps.

Placeholders, read from the render:

| Field | Label | Placeholder |
|---|---|---|
| Full name | `FULL NAME` | `First and last name` |
| Phone | `PHONE` | `+20 10 0000 0000` |
| Email | `EMAIL` | `name@company.com` |
| Secondary contact name | *(none — inside the card)* | `Contact name` |
| Secondary contact phone | *(none)* | `Phone number` |
| Department | `DEPARTMENT` | `Select department` |
| Branch | `BRANCH` | `Select branch` |

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Header | 42h, Cancel / title / Save | `<ModalHeader />` as built |
| `Save` when the form is invalid | grey | `actionDisabled` → `tone="disabled"` |
| Horizontal inset | 16 | `spacing.lg` |
| Field label | 18h, uppercase, muted, tracked | `TextField`'s own label — do not re-implement |
| Input | 48h, radius, hairline border | `TextField`'s `FIELD_HEIGHT = 48` — already exact |
| Block → block gap | 20 | `spacing.xl` (24) — 4px drift, accepted |
| Contacts card | 1px border, radius, 12px inset | `borderWidth: StyleSheet.hairlineWidth`, `colors.borderDefault`, `radius.md`, `padding: spacing.md` |
| Card row gap | 8 | `spacing.sm` |
| `+ Add contact` | 20h, brand blue | `<Button variant="link" />` |
| Card → link gap | 8 | `spacing.sm` |
| Department / Branch | select, chevron-down | **read-only** rows — see task 4 and flag 1 |

The mock has **no error state, no loading state and no scroll affordance**: the form is drawn resting, valid and short enough to fit. All three are this plan's invention, built to the `LoginScreen` precedent (a `caption`/`danger` line for form-level failures, `TextField`'s `error` for field-level ones, `Button`'s `loading` for the pending save). Flag 5.

---

## Implementation tasks

### 1 — The input type

**File: `src/features/customers/types.ts`**

```ts
/** One editable secondary contact. `label` is Figma's "Contact name". */
export type SecondaryContactInput = {
  label: string;
  value: string;
};

/**
 * What the form collects. `departmentId` and `branchId` are NOT here — they are
 * read from the signed-in agent inside the mutation (API §3.3: RLS rejects any
 * other value), so a screen can neither set them nor forget them.
 */
export type CreateCustomerInput = {
  fullName: string;
  phone: string;
  email: string;
  secondaryContacts: SecondaryContactInput[];
};
```

`email` is `string`, not `string | null` — React Hook Form's controlled inputs need `''`, and the empty-to-null conversion is the data layer's job (task 3). A `null` default would make `TextField` uncontrolled on first render.

### 2 — Detecting the duplicate phone

**File: `src/features/customers/api.ts`**

The intake requires a **field-level** error on phone. That requires distinguishing this one failure from every other, and `toAppError` actively destroys the distinction — see Context item 5. So detect it on the **raw** PostgREST error, before mapping:

```ts
/**
 * Thrown when the phone already exists for this branch — the
 * `unique (branch_id, phone)` constraint (API §3.3). Surfaced as a field error
 * on `phone`, never as a banner, per the intake.
 */
export class CustomerPhoneConflictError extends Error {
  constructor() {
    super('A customer with this phone already exists in this branch');
  }
}

/**
 * `toAppError` CANNOT be used to detect this. `core/utils/errors.ts:53` coerces
 * an all-digit `code` string into a status, and Postgres reports a unique
 * violation as `code: "23505"` — all digits. The mapped error therefore comes
 * back as `status: 23505`, `kind: 'server'`, indistinguishable from a 500.
 * Match on the raw error instead, and only then map.
 */
function isPhoneConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const record = error as Record<string, unknown>;
  if (record.code === '23505') return true;
  if (record.status === 409) return true;
  return typeof record.message === 'string' && /duplicate key|already exists/i.test(record.message);
}
```

The `message` fallback is third, not first — it is the least reliable of the three and exists only because `code` is not guaranteed on every transport path. **Do not** reorder it to the front, and do not add a `phone`-specific regex: `customers` has exactly one unique constraint, so a `23505` on this insert can only be that one. If a second unique constraint is ever added, this narrowing becomes wrong — noted in flag 3.

### 3 — The insert

**File: `src/features/customers/api.ts`**

```ts
/**
 * Strips spacing and punctuation so the stored value matches API §3.3's
 * `+201001234567` form. Keeps a leading `+`. The `unique (branch_id, phone)`
 * constraint compares stored values verbatim, so normalising here is what makes
 * the duplicate check work at all — `+20 100 123 4567` and `+201001234567` are
 * two different rows to Postgres.
 */
export function normalisePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

export type CreateCustomerParams = CreateCustomerInput & {
  departmentId: string;
  branchId: string;
  createdBy: string;
};

/**
 * `.select(DETAIL_SELECT).single()` is `Prefer: return=representation` (API §3.3)
 * — it returns the created row in the exact shape `fetchCustomerDetail` returns,
 * so `useCreateCustomer` can seed `customerKeys.detail(id)` and the detail
 * screen paints without a second round trip.
 *
 * `id`, `created_at` and `updated_at` are omitted deliberately: all three are
 * server-generated (`database.ts:225, 219, 231`).
 */
export async function createCustomer(params: CreateCustomerParams): Promise<CustomerDetail> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name: params.fullName.trim(),
      phone: normalisePhone(params.phone),
      email: params.email.trim() || null,
      secondary_contacts: toSecondaryContactsJson(params.secondaryContacts),
      department_id: params.departmentId,
      branch_id: params.branchId,
      created_by: params.createdBy,
    })
    .select(DETAIL_SELECT)
    .single<CustomerDetailRow>();

  if (error) {
    if (isPhoneConflict(error)) throw new CustomerPhoneConflictError();
    throw toAppError(error);
  }
  return toCustomerDetail(data);
}
```

Two supporting changes in the same file:

- **Extract `toCustomerDetail(row: CustomerDetailRow): CustomerDetail`** out of story 10's `fetchCustomerDetail`, and have both functions call it. Two mappers for one shape is exactly how a create path and a read path drift apart.
- **Add `toSecondaryContactsJson`** — the inverse of story 10's `parseSecondaryContacts`:

```ts
/**
 * Form rows → the stored JSON array. Blank rows are dropped rather than stored:
 * `useFieldArray` leaves an empty row behind whenever an agent taps
 * "+ Add contact" and then changes their mind, and `{"type":"phone","value":""}`
 * is a row story 10's reader would drop on the way out anyway.
 *
 * The `{ type, value, label }` shape is API §3.3's, NOT Figma's `{ name, phone }`
 * — see story 10's open question 3. If verification step 1 says otherwise,
 * change this function and `parseSecondaryContacts` together.
 */
function toSecondaryContactsJson(contacts: SecondaryContactInput[]): Json {
  return contacts
    .filter((contact) => contact.value.trim() !== '')
    .map((contact) => ({
      type: 'phone',
      value: normalisePhone(contact.value),
      label: contact.label.trim() || null,
    }));
}
```

### 4 — The mutation hook

**File: `src/features/customers/hooks.ts`**

```ts
/**
 * The org fields come from the signed-in agent, never from the form — API §3.3:
 * "RLS rejects any department_id/branch_id that isn't the caller's own". The
 * mutation is DISABLED until the profile has loaded rather than sending an empty
 * string, which would surface as an opaque foreign-key error instead of a
 * disabled Save button.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const profile = useAgentProfile();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      createCustomer({
        ...input,
        departmentId: profile.data?.departmentId as string,
        branchId: profile.data?.branchId as string,
        createdBy: session?.user.id as string,
      }),
    onSuccess: (customer) => {
      // The list, all three chip counts, and any cached detail entry.
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      // …and seed the detail entry the redirect is about to read, so the
      // profile screen paints from the insert's own response.
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    },
  });
}
```

`useAgentProfile` and `useAuth` both come from `@/features/auth` — the barrel, per hard rule 4. `features/customers/hooks.ts` does not import from `@/features/auth/hooks`.

**The `setQueryData` call must come after the invalidation, not before.** `invalidateQueries({ queryKey: customerKeys.all })` matches `['customers', id]` too; seeding first would mark the fresh entry stale immediately and the detail screen would refetch on mount anyway.

### 5 — `CreateCustomerScreen`

**Create file: `src/features/customers/screens/CreateCustomerScreen.tsx`**

```tsx
const {
  control,
  handleSubmit,
  setError,
  formState: { errors, isValid },
} = useForm<CreateCustomerInput>({
  defaultValues: { fullName: '', phone: '', email: '', secondaryContacts: [] },
  mode: 'onSubmit',
});

const { fields, append, remove } = useFieldArray({ control, name: 'secondaryContacts' });
```

`useFieldArray` is `react-hook-form@7.86`'s (already a dependency — `package.json`); no new package.

**Validation rules**, each message a translated string exactly as `LoginScreen.tsx:67-70`:

| Field | Rules |
|---|---|
| `fullName` | `required: t('createCustomer.errors.nameRequired')`, `validate: (v) => v.trim().length > 0 \|\| t('createCustomer.errors.nameRequired')` |
| `phone` | `required: t('createCustomer.errors.phoneRequired')`, `pattern: { value: PHONE_PATTERN, message: t('createCustomer.errors.phoneInvalid') }` |
| `email` | no `required`; `validate: (v) => v.trim() === '' \|\| EMAIL_PATTERN.test(v) \|\| t('createCustomer.errors.emailInvalid')` |
| `secondaryContacts.<i>.value` | `validate: (v) => v.trim() === '' \|\| PHONE_PATTERN.test(v) \|\| t('createCustomer.errors.phoneInvalid')` |

```ts
// Accepts an optional leading '+' then 7-15 digits, ignoring spaces, dashes and
// parentheses so an agent can type the number the way they read it. Deliberately
// NOT a strict E.164 check — see open question 2.
const PHONE_PATTERN = /^\+?[\d\s\-()]{7,20}$/;
```

`EMAIL_PATTERN` is `LoginScreen.tsx:17`'s regex. **It is now used in two features.** Two copies is the threshold hard rule 2 names, so move it to `src/core/utils/validation.ts` alongside `PHONE_PATTERN`, export both from `src/core/utils/index.ts`, and update `LoginScreen.tsx:17` to import rather than declare. These are format constants, not business rules — `core/` is the right home and no `features/` import is created.

**Layout**, top to bottom inside a `SafeAreaView` on `bgCanvas`:

1. `<ModalHeader title={t('createCustomer.title')} onCancel={() => router.back()} actionLabel={t('createCustomer.save')} onAction={handleSubmit(onSubmit)} actionDisabled={create.isPending || !profile.data} />`
2. A `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"` — as `LoginScreen.tsx:44`. The mock fits on one screen; a soft keyboard over eight fields does not.
3. The three `<Controller>` + `<TextField>` blocks, chained with `useRef` + `onSubmitEditing` in the order name → phone → email (`LoginScreen.tsx:22, 85`).
4. The secondary-contacts section (task 5b).
5. The two read-only org rows (task 5c).
6. A form-level error line — `<Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite">` — rendered only when `create.isError` **and** the error is not a `CustomerPhoneConflictError`. `LoginScreen.tsx:134-138` is the pattern.

**5b. Secondary contacts.** A labelled section, `<Text variant="caption" weight="semibold" tone="muted">` uppercased to match `TextField`'s own label treatment, then a bordered card holding one block per `fields` entry:

- `label` → `<TextField showLabel={false} label={t('createCustomer.contactNameLabel')} placeholder={t('createCustomer.contactNamePlaceholder')} />`
- `value` → the same, with `keyboardType="phone-pad"`
- a trailing `<IconButton icon="close" size={32} variant="ghost" onPress={() => remove(index)} accessibilityLabel={t('createCustomer.removeContact')} />`

`showLabel={false}` keeps the accessible name while hiding it visually (`TextField.tsx:70-81, 104`) — Figma's card has no per-input labels, and an unlabelled input is not acceptable. **The remove control is this plan's addition**: Figma draws only `+ Add contact`, and an agent who adds a row by mistake would otherwise have no way back. Flag 6.

Then `<Button variant="link" label={t('createCustomer.addContact')} onPress={() => append({ label: '', value: '' })} />`.

When `fields.length === 0` the card is not rendered at all — an empty bordered box is noise. Figma shows one pre-populated pair; **this plan starts with zero** (`defaultValues.secondaryContacts: []`), because a blank pair on a form where the field is optional reads as required. Flag 6.

**5c. Department and branch.** Two `<DetailRow layout="inline" />` rows showing `profile.data?.departmentName` and `profile.data?.branchName`, each with `t('createCustomer.inherited')` as a helper caption beneath the pair. **Not `TextField`, not a picker** — they are not editable (task 4), and rendering an input the agent cannot change is worse than rendering a value they can read. While `profile.isPending`, render a `<Skeleton />` in each value slot rather than an empty row.

**5d. Submit.**

```tsx
function onSubmit(values: CreateCustomerInput) {
  create.mutate(values, {
    onSuccess: (customer) => router.replace(`/customers/${customer.id}`),
    onError: (error) => {
      if (error instanceof CustomerPhoneConflictError) {
        setError('phone', { type: 'conflict', message: t('createCustomer.errors.phoneDuplicate') });
      }
    },
  });
}
```

`router.replace`, **not** `router.push` — the form must not sit in the back stack behind the profile it just created; backing out of the new customer should land on the Customers list.

Anything that is not a `CustomerPhoneConflictError` falls through to the form-level line in step 6 — `setError` is not called, so the phone field is not falsely blamed for a network failure.

**File: `src/features/customers/index.ts`** — export `CreateCustomerScreen`, `useCreateCustomer`, `CustomerPhoneConflictError`, `normalisePhone`, and the `CreateCustomerInput` / `SecondaryContactInput` types.

### 6 — The route, and the FAB it closes

**Create file: `src/app/customers/new.tsx`**

```tsx
import { CreateCustomerScreen } from '@/features/customers';

export default function NewCustomer() {
  return <CreateCustomerScreen />;
}
```

**File: `src/app/_layout.tsx`** — register it inside `Stack.Protected`, beside story 10's line:

```tsx
<Stack.Screen name="customers/[id]" />
<Stack.Screen name="customers/new" options={{ presentation: 'modal' }} />
```

`presentation: 'modal'` is what makes Figma's Cancel/Save header the right affordance rather than a back chevron. Expo Router resolves the **static** `customers/new` segment ahead of the dynamic `customers/[id]`, so `/customers/new` never lands on the detail screen — but the two files must not be reordered into `customers/[id]/new.tsx`, which would change that.

**File: `src/features/customers/screens/CustomersScreen.tsx`** — replace the FAB's no-op at lines 143-148:

```tsx
<FAB
  onPress={() => router.push('/customers/new')}
  accessibilityLabel={t('customers.newCustomer')}
  bottomOffset={theme.spacing.xxxl}
/>
```

Delete the `// TODO(US-006)` comment. If story 10 already added `import { router } from 'expo-router'` to this file, reuse it.

### 7 — Copy

**Files: `src/core/lib/i18n/locales/en.json` and `ar.json`** — add a `createCustomer` namespace after `customerDetail`.

```json
"createCustomer": {
  "title": "New customer",
  "save": "Save",
  "nameLabel": "Full name",
  "namePlaceholder": "First and last name",
  "phoneLabel": "Phone",
  "phonePlaceholder": "+20 10 0000 0000",
  "emailLabel": "Email",
  "emailPlaceholder": "name@company.com",
  "secondaryContacts": "Secondary contacts",
  "contactNameLabel": "Contact name",
  "contactNamePlaceholder": "Contact name",
  "contactPhoneLabel": "Contact phone number",
  "contactPhonePlaceholder": "Phone number",
  "addContact": "+ Add contact",
  "removeContact": "Remove contact",
  "departmentLabel": "Department",
  "branchLabel": "Branch",
  "inherited": "Inherited from your account",
  "errors": {
    "nameRequired": "Enter the customer's full name.",
    "phoneRequired": "Enter a phone number.",
    "phoneInvalid": "Enter a valid phone number.",
    "phoneDuplicate": "A customer with this phone already exists in your branch.",
    "emailInvalid": "Enter a valid email address."
  }
}
```

Arabic values in the same shape in `ar.json`. `createCustomer.addContact` keeps its literal `+` — it is Figma's label, not an icon. `inherited` is **this plan's copy**, describing behaviour Figma does not show; flag 1.

### 8 — Update the instruction files

**File: `CLAUDE.md`** — "Project status": customer creation is no longer open; add `src/app/customers/new.tsx` to the route list. Note that `customers` now owns the app's first write path. **File: `AGENTS.md`** needs no change.

---

## Edge Cases & Failure Modes

- **Duplicate phone in the same branch.** `23505` from `unique (branch_id, phone)`. `isPhoneConflict` (task 2) catches it on the raw error — **before** `toAppError` flattens it into `kind: 'server'` — and `onError` turns it into a `setError('phone', …)`. This is the intake's central requirement and the one most likely to be silently broken by refactoring the error path.
- **The same phone in a *different* branch.** Not a conflict; the constraint is composite. The insert succeeds. Expected — an agent must not be blocked by a record they cannot see.
- **A differently-formatted duplicate.** `+20 100 123 4567` and `+201001234567` are the same customer to a human and two rows to Postgres. `normalisePhone` (task 3) is what collapses them, and it runs on **both** the create path and any future edit path. Without it the duplicate check is decorative.
- **The profile has not loaded.** `useAgentProfile` is a query; on a cold start it can be pending when the form mounts. `actionDisabled={… || !profile.data}` (task 5) blocks the save, and the org rows show skeletons. Sending `undefined as string` would produce an opaque foreign-key violation instead.
- **The profile fails to load.** Save stays disabled indefinitely. Render `t('states.errorBody')` in the org section with a retry that calls `profile.refetch()` — an indefinitely disabled button with no explanation is the worse failure.
- **An empty secondary-contact row.** `useFieldArray`'s `append` creates `{ label: '', value: '' }`; an agent who adds and abandons a row leaves it behind. `toSecondaryContactsJson` (task 3) drops rows with a blank `value`. A row with a label but no value is also dropped — a name with no number is not a contact.
- **A secondary contact with an invalid phone.** Validated per row (task 5); the array is not written until every non-blank row passes. Field-level, on the row's own input.
- **Empty email.** Written as `null`, not `''` — `email` is `string | null` in the schema (`database.ts:216`) and `''` would defeat every `email is null` query downstream.
- **Whitespace-only full name.** `required` alone passes on `'   '`. The explicit `validate` in task 5 is what rejects it, and `.trim()` in task 3 is the second line of defence.
- **Double-tap on Save.** `actionDisabled={create.isPending}` blocks the second tap. Without it, two inserts race and the second returns the duplicate conflict — which would then be shown to the agent as *their* mistake.
- **Cancel with a dirty form.** Dismisses immediately with no confirmation, because Figma shows none. Data loss is silent. Flag 7.
- **RLS refuses the insert.** Only reachable if the agent's own `department_id`/`branch_id` are stale relative to the server. Falls through to `toAppError` → `kind: 'auth'` → the form-level line. Not a field error.
- **Arabic layout.** The phone placeholder `+20 10 0000 0000` is a Latin-digit string inside an RTL field. `TextField` does not bidi-isolate placeholders and `isolateLtr` (story 10) applies to rendered values, not placeholder text. Verify the placeholder is legible; matrix row 24.
- **The back stack after a save.** `router.replace` (task 5d) is what stops "back" from reopening a form for a customer that already exists.

---

## Test Plan

**There is no test runner in this repo** (AGENTS.md). The list below is what to write when one is installed; the manual matrix underneath is the gate today.

### Manual test matrix

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Any | Tap the FAB on Customers | The New customer modal presents |
| 2 | Any | Read the header | `Cancel` · `New customer` · `Save`; Save renders disabled-grey while pending |
| 3 | Empty form | Tap Save | Field errors under **Full name** and **Phone**; nothing is sent (BRD `:528`) |
| 4 | Name = `"   "` | Tap Save | The name error fires |
| 5 | Phone = `abc` | Tap Save | "Enter a valid phone number." on the phone field (BRD `:529`) |
| 6 | Phone = `+20 10 1234 5678` | Tap Save | Accepted; the stored value is `+201012345678` |
| 7 | Email = `nope` | Tap Save | The email error fires |
| 8 | Email empty | Tap Save | Accepted; the row's `email` is `null`, not `''` |
| 9 | Name + phone only | Tap Save | The customer is created and their profile opens (BRD `:527`, `:531`) |
| 10 | After row 9 | Read the profile | Department and branch match the signed-in agent (BRD `:530`) |
| 11 | After row 9 | Press back | The **Customers list**, not the form |
| 12 | After row 9 | Read the Customers list | The new customer is present with no manual refresh |
| 13 | After row 9 | Read the chip counts | **All** has incremented |
| 14 | Phone of an existing customer in your branch | Tap Save | A **field error on phone**, not a banner or toast (BRD `:530`) |
| 15 | After row 14 | Change the phone, tap Save | The error clears and the save succeeds |
| 16 | Phone of a customer in **another** branch | Tap Save | Succeeds — the constraint is composite |
| 17 | Any | Tap `+ Add contact` | An empty contact card row appears |
| 18 | Two contact rows | Tap remove on the first | Only that row goes; the second keeps its values |
| 19 | One blank contact row | Save | The customer is created with `secondary_contacts: []` |
| 20 | One filled contact row | Save, then read the profile | The contact renders on the Info tab (story 10's row) |
| 21 | Contact phone = `abc` | Save | A field error on that row; nothing is sent |
| 22 | Any | Double-tap Save fast | Exactly one customer is created |
| 23 | Airplane mode | Tap Save | The form-level error line; the form keeps every value |
| 24 | العربية, restarted | Open the form | Layout mirrors; labels lead on the right; the phone placeholder is legible |
| 25 | العربية | Enter an Arabic name and save | The name persists and renders correctly on the profile |
| 26 | Toggle system dark mode | Open the form | Inputs, card border, link and error text all legible |
| 27 | Cold start → straight to the FAB | Tap Save immediately | Save is disabled until the profile loads; no foreign-key error |
| 28 | Profile query failed | Open the form | An explanatory error with retry — not a permanently dead Save button |
| 29 | Any | Tap Cancel with a filled form | The modal dismisses (no confirmation — see flag 7) |
| 30 | Signed out | Deep-link `/customers/new` | The login screen |
| 31 | Any | Sign in, open the Login screen again after this change | Email validation still works — the task 5 `EMAIL_PATTERN` move |

### To write when a runner exists

1. **Unit — `src/features/customers/api.test.ts`** · `normalisePhone('+20 10 1234-5678')` → `'+201012345678'`; `'010 1234'` → `'0101234'`; a leading `+` is kept and never duplicated; `'  '` → `''`.
2. **Unit — `src/features/customers/api.test.ts`** · `isPhoneConflict` is true for `{ code: '23505' }`, `{ status: 409 }` and `{ message: 'duplicate key value violates…' }`; false for `{ code: '23503' }`, `{ status: 500 }` and `null`.
3. **Unit — `src/features/customers/api.test.ts`** · the regression guard for the `readStatus` trap: `toAppError({ code: '23505' })` yields `kind: 'server'`, proving `isPhoneConflict` must run first.
4. **Unit — `src/features/customers/api.test.ts`** · `toSecondaryContactsJson` drops blank-`value` rows, normalises each phone, maps an empty label to `null`, and returns `[]` for `[]`.
5. **Round-trip — `src/features/customers/api.test.ts`** · `parseSecondaryContacts(toSecondaryContactsJson(rows))` returns the non-blank rows unchanged. This is the test that catches the story-10 flag 3 shape mismatch.
6. **Unit — `src/core/utils/validation.test.ts`** · `PHONE_PATTERN` accepts `+201001234567`, `+20 10 0000 0000`, `01001234567`; rejects `''`, `abc`, `+`, and a 30-digit string.
7. **Unit — `src/core/utils/validation.test.ts`** · `EMAIL_PATTERN` keeps the behaviour `LoginScreen` relied on — the regression guard for the move.
8. **Integration — `src/features/customers/hooks.test.tsx`** · `useCreateCustomer` invalidates `customerKeys.all` **before** it seeds `customerKeys.detail(id)`, and the seeded entry survives.
9. **Integration — `src/features/customers/hooks.test.tsx`** · `createCustomer` receives `departmentId`/`branchId` from the profile, never from the input, even when the input carries them.
10. **Unit — `src/features/customers/screens/CreateCustomerScreen.test.tsx`** · a `CustomerPhoneConflictError` sets a `phone` field error and leaves the form-level line empty; an `AppError` does the opposite.

---

## Verification Steps

1. **Prove the conflict's real shape before writing task 2.** Insert a customer, then insert the same phone again in the same branch and record the **full** error body:
   ```bash
   curl -s -X POST -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" -H "Prefer: return=representation" \
     -d '{"full_name":"Dup Test","phone":"+201001234567","department_id":"'$DEPT'","branch_id":"'$BRANCH'"}' \
     "$URL/rest/v1/customers"
   ```
   Confirm the `code` is `23505` and note the HTTP status. **`isPhoneConflict`'s three branches are written from this output, not from memory.** Do the same for the other-branch case (row 16) to confirm it succeeds.
2. **Confirm RLS rejects a foreign org.** Repeat the insert with another branch's `branch_id` and record the failure. This is what justifies task 4's decision not to offer a picker; if it *succeeds*, flag 1 becomes urgent rather than cosmetic.
3. **Typecheck:** `npm run typecheck` — zero errors. The `Insert` type is what proves `department_id` and `branch_id` are non-optional and that no server-generated column is being sent.
4. **Lint:** `npm run lint` — zero errors. The gate for hard rules 2-5.
5. **Frontend runs:** `npm start`, `a` and `i`. Walk the manual matrix, rows 1-31.
6. **Regression — Login:** sign out and sign in with a malformed email. Task 5 moved `EMAIL_PATTERN` out of `LoginScreen.tsx`; matrix row 31.
7. **Regression — customer detail:** open a customer created *before* this story. Task 3 extracted `toCustomerDetail` out of `fetchCustomerDetail`; a wrong extraction shows as blank fields, not an error.
8. **Regression — Customers list:** confirm the list, the three chips and pagination still work after the FAB change.
9. **RTL:** switch to العربية and **fully restart**. Matrix rows 24-25.
10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:527-531`.

- [ ] Given required fields are complete, when I save, then the customer is **created and opened**
- [ ] Given a required field is empty, when I save, then validation blocks with a **field-level** message
- [ ] Given an invalid phone format, when I save, then it is rejected
- [ ] Given a phone already used in my branch, when I save, then a **duplicate warning** appears
- [ ] Given a save succeeds, when the record is written, then **department and branch are inherited from me**

Plus, from the intake and the design:

- [ ] The duplicate warning is a **field error on phone**, never a toast or a banner
- [ ] `isPhoneConflict` runs on the raw error, **before** `toAppError` — with a comment saying why
- [ ] Phones are normalised on write, so the unique constraint actually catches re-typed duplicates
- [ ] Secondary contacts can be added and removed; blank rows are never stored
- [ ] The stored array shape round-trips through story 10's `parseSecondaryContacts`
- [ ] Department and branch are read-only and come from `useAgentProfile`, never from the form
- [ ] Save is disabled while the profile is loading and while the mutation is pending
- [ ] A successful save invalidates `customerKeys.all` and seeds `customerKeys.detail(id)`, in that order
- [ ] The redirect is `router.replace`, so back lands on the Customers list
- [ ] The FAB's `TODO(US-006)` is gone; story 05's open question 7 is closed
- [ ] `EMAIL_PATTERN` has exactly one definition in the tree
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" lists customer creation as built

---

## Open questions — raise with design/product, do not resolve silently

1. **Figma offers Department and Branch as pickers; the API forbids it.** Nodes `99:922` and `99:933` are `Select department` / `Select branch` dropdowns with chevrons, but API §3.3 states RLS "rejects any `department_id`/`branch_id` that isn't the caller's own" and BRD `:530` requires both to be *inherited*. A picker whose only valid option is the agent's own value is a control that can only produce an error. Task 4 renders them read-only with an "Inherited from your account" caption — **this plan's copy, not the designer's**. The alternatives are (a) delete both rows from the screen, or (b) keep the pickers because managers will eventually create across branches, in which case the RLS policy is what needs changing, not the form. Verification step 2 produces the evidence.
2. **The phone format is undefined.** The mock's placeholder is `+20 10 0000 0000`; the API's example value is `+201001234567`. `PHONE_PATTERN` accepts an optional `+` then 7-20 characters of digits and separators, and `normalisePhone` strips to `+`-plus-digits on write. That is deliberately loose — an agent on a call types what the customer says. If Egypt-only E.164 is the real rule, it should be stated, and it should be enforced by a `check` constraint as well as by the client.
3. **The duplicate detection assumes exactly one unique constraint on `customers`.** `23505` is narrowed to "phone conflict" because `unique (branch_id, phone)` is the only one API §3.3 documents. If a unique index is later added on, say, `email`, this mapping starts blaming the wrong field. The durable fix is a `SQLSTATE`-plus-constraint-name check, which needs the constraint name in the error body — the same request story 09 filed for the status trigger (its flag 6).
4. **`created_by` is nullable and nothing depends on it.** `database.ts:214` types it `string | null`; task 3 sends `session.user.id` anyway, because "who added this customer" is the kind of thing an audit asks for later and cannot reconstruct. Confirm that is wanted — no screen reads it today.
5. **The form has no error, loading or scroll design.** Figma draws one resting state. Field errors, the form-level failure line, `Save`'s pending state and the scroll behaviour under a soft keyboard are all built to the `LoginScreen` precedent, which story 02 already flagged as unreviewed (its flag 2). This is the **second** form to ship on an unreviewed error pattern; the third should not.
6. **Two secondary-contact decisions are this plan's, not the design's.** Figma shows one pre-populated contact pair and no way to remove it. This plan starts with **zero** rows (a blank pair on an optional field reads as required) and adds a **remove** control per row. Both are reversible one-liners; both need a look.
7. **Cancel discards a filled form silently.** Figma shows no confirmation. Losing a customer's details mid-call because of a mistapped Cancel is a real cost. A "Discard changes?" confirmation on `formState.isDirty` is ~15 lines and would reuse the `BottomSheet` pattern `ProfileScreen`'s sign-out already uses. Not built here because the design does not show it.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 12.**
