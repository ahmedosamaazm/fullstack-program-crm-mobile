# Story 12 — Edit customer details (Story: SCRUM-23)

> Intake: `.squad/stories/customers/SCRUM-23/intake.md`
> Figma: **there is no Edit frame in the file.** The intake says "reuses the Create Customer frame, or a distinct Edit frame if one exists — check before assuming". It was checked: page `0:1` holds `Customers - New Customer` (`7:2799`), `Customers - Detail (Tickets)` (`7:4310`) and the Info-tab detail frame, and no edit variant. This story therefore reuses `7:2799` with a changed title, and **invents the entry point** — see Open questions flag 1.

## Prerequisites

- **Story 11 completed** — [`11-story-create-a-customer-SCRUM-22.md`](11-story-create-a-customer-SCRUM-22.md). **This is a hard dependency.** The intake is explicit: "Reuse the same form fields and validation as Create Customer (SCRUM-22) — this is the same shape, pre-populated, with Save instead of Create." Story 11 lands `CreateCustomerInput`, `SecondaryContactInput`, `PHONE_PATTERN`, `normalisePhone`, `toSecondaryContactsJson`, `isPhoneConflict`, `CustomerPhoneConflictError` and the whole form layout. This story's first task **extracts** that form rather than copying it; running the two stories in parallel guarantees a conflict in `CreateCustomerScreen.tsx`.
- **Story 10 completed** — [`10-story-customer-profile-view-SCRUM-24.md`](10-story-customer-profile-view-SCRUM-24.md). It lands `CustomerDetail`, `customerKeys.detail`, `useCustomerDetail`, `parseSecondaryContacts` and `CustomerDetailHeader` — the screen this story adds an **Edit** control to, and the cache entry it invalidates. It is also the only way to reach a specific customer at all.
- **Story 10's open question 3 answered** — the real stored shape of `secondary_contacts`. This story is the one BRD tests directly (`docs/phase1_brd_1.md:546-547`: add a contact and see it on the profile, remove one and see it gone). A write/read shape mismatch fails those two criteria and nothing else, which makes it easy to miss.
- **`.env` populated**, and **seeded data**: a customer in the agent's branch with at least one existing secondary contact, a second customer in the same branch whose phone can be collided with, and — for BRD `:548` — a customer id from **another** branch plus a way to issue a raw PATCH (curl with the agent's JWT).

---

## Story Goal

A customer record becomes correctable without leaving the app. Concretely:

1. **One form, two screens.** The create form is extracted into a `CustomerForm` component; create and edit render the same fields, the same validation and the same secondary-contacts editor, differing only in title, submit label and initial values.
2. **A modal-presented edit route** — `src/app/customers/edit/[id].tsx` — pre-populated from the customer's cached detail.
3. **Secondary contacts added and removed**, and the change visible on the profile the moment the sheet closes. These are two of the four acceptance criteria and the only ones the create story could not exercise.
4. **The same duplicate-phone conflict handling as create** — a field error on phone, not a banner. The constraint applies identically on update (the intake says so, and `unique (branch_id, phone)` does not care which verb touched the row).
5. **Both cache entries invalidated on success** — `['customers']` for the list and its chip counts, and `['customers', id]` for the profile — so the change is visible in both places without a manual refetch. This is an explicit intake requirement.
6. **The cross-branch rejection proven**, not assumed. BRD `:548` is an RLS criterion, satisfied by code this story does not write; it is a verification step, not a task.

**Not in scope**: changing a customer's department or branch (they are inherited and immutable from the client — story 11 flag 1), deleting a customer (no story, no endpoint), merging duplicates, and edit history/audit (nothing writes a `customer_events` table; none exists).

---

## Context — Read These Files First

1. `src/features/customers/screens/CreateCustomerScreen.tsx` **as story 11 leaves it** — the whole file. Task 1 splits it: everything from the `useForm` call down to the submit handler becomes `CustomerForm`; what remains is a thin screen that supplies a title, a submit label, initial values and an `onSubmit`. Read it before splitting so nothing behavioural moves by accident.
2. `src/features/customers/api.ts` **as story 11 leaves it** — `normalisePhone`, `toSecondaryContactsJson`, `isPhoneConflict`, `CustomerPhoneConflictError`, `toCustomerDetail`, `DETAIL_SELECT`, `CustomerDetailRow`. Task 2's `updateCustomer` reuses **every one of them**; it introduces no new error class and no new mapper.
3. `src/features/customers/hooks.ts` **as story 11 leaves it** — `useCreateCustomer`'s `onSuccess` (invalidate `customerKeys.all`, then `setQueryData(customerKeys.detail(id), …)`). Task 3 differs in exactly one way, and the comment must say why.
4. `src/features/customers/components/CustomerDetailHeader.tsx` (story 10) — the three trailing `IconButton`s. Task 5 adds a fourth. Note the `minWidth: 0` guard on the text block: a fourth 36px button makes the name column ~44px narrower, so that guard stops being theoretical.
5. `src/features/tickets/api.ts:478-500` — `assignTicket`'s compare-and-set update: `.update(payload, { count: 'exact' })`, a narrowing predicate, and `if (!count) throw`. **Task 2 deliberately does not do this** — see its comment and flag 5.
6. `src/core/components/Icon.tsx:21-…` — `IconName` is a strict union and `ICON_MAP` a `Record<IconName, MCIName>`. There is **no pencil/edit glyph today**; task 5 adds one. The file's own comment (lines 7-15) explains why the union is never widened to `string`.
7. `src/core/types/database.ts:250-263` — the `customers` `Update` type. **Every field is optional**, which means a typo'd key is not a type error and a partial payload silently no-ops. That is why task 2 builds a fully-typed payload object rather than spreading.
8. `docs/phase1_api_reference.md:187-191` — §3.4, which is three lines: `PATCH /rest/v1/customers?id=eq.{{customer_id}}`. There is no documented payload and no documented error contract; §3.3's duplicate-phone note (line 186) is the nearest thing, and the intake says it applies here too.
9. `docs/phase1_brd_1.md:539-548` — US-007 and its four acceptance criteria. `## Done Criteria` mirrors them verbatim. Note `:548` is a **security** criterion, not a UI one.
10. `src/app/customers/new.tsx` and `src/app/_layout.tsx` **as story 11 leaves them** — the modal route registration task 6 copies.

---

## Design spec

Reuses Figma node `7:2799` (`Customers - New Customer`) in full — the same three fields, the same secondary-contacts card, the same read-only org rows, the same 48px inputs and 20px block gaps. Story 11's design-spec table applies unchanged.

Two differences, both **this plan's**, because the file has no edit frame:

| Element | Create (Figma) | Edit (this plan) |
|---|---|---|
| Modal title | `New customer` | `Edit customer` |
| Header action | `Save` | `Save` — unchanged |
| Initial values | empty | the customer's current values |
| Entry point | the Customers-tab FAB | a fourth `IconButton` on `CustomerDetailHeader` |

The entry-point button has no Figma component and no glyph in `Icon.tsx`. Task 5 adds `edit: 'pencil-outline'` to `ICON_MAP`, which is the same class of addition the design-system plan already documented for `search`/`close`/`plus`/`alert` (`Icon.tsx:7-11` — "the components need but the Figma set lacks"). Flag 1.

---

## Implementation tasks

### 1 — Extract `CustomerForm`

**Create file: `src/features/customers/components/CustomerForm.tsx`**

```tsx
export type CustomerFormProps = {
  /** Modal title. */
  title: string;
  /** Header action label — "Save" on both screens today. */
  submitLabel: string;
  initialValues: CreateCustomerInput;
  onSubmit: (values: CreateCustomerInput) => void;
  onCancel: () => void;
  submitting: boolean;
  /** Blocks submission while the agent's profile is still loading (story 11 task 4). */
  ready: boolean;
  /** Set by the parent when the server rejects the phone as a duplicate. */
  phoneConflict: boolean;
  /** Rendered under the form when the failure is not field-specific. */
  formError?: string;
};
```

Move, verbatim from `CreateCustomerScreen.tsx`: the `useForm` call, the `useFieldArray` call, the three `Controller`/`TextField` blocks and their focus chain, the secondary-contacts card and its add/remove controls, the two read-only org rows, `ModalHeader`, the `KeyboardAvoidingView`/`ScrollView` wrapper, and the form-level error line. **No behaviour changes in this task** — it is a pure move, and verification step 5 is the gate.

Two adjustments the move requires:

- `defaultValues: initialValues` instead of the hardcoded empties. Add `values: initialValues` as well, so a late-arriving cache read re-seeds the form — `defaultValues` alone is captured once on mount, and the edit screen can render before `useCustomerDetail` resolves.
- The conflict error is now a **prop**, not a local `setError` call. Inside the form:

  ```tsx
  useEffect(() => {
    if (phoneConflict) {
      setError('phone', { type: 'conflict', message: t('createCustomer.errors.phoneDuplicate') });
    }
  }, [phoneConflict, setError, t]);
  ```

  The parent owns the mutation and therefore owns the error; the form owns the fields and therefore owns where the message lands.

**File: `src/features/customers/screens/CreateCustomerScreen.tsx`** — reduce to the mutation, the profile read, and a `<CustomerForm>` with `initialValues={EMPTY_CUSTOMER}` where:

```ts
const EMPTY_CUSTOMER: CreateCustomerInput = {
  fullName: '', phone: '', email: '', secondaryContacts: [],
};
```

A module-level constant, **not** an inline object literal — a new object identity on every render would re-seed the form through the `values` prop and wipe what the agent has typed. This is the single most likely regression in this task.

### 2 — The update

**File: `src/features/customers/api.ts`**

```ts
/**
 * §3.4. Reuses create's normalisation, JSON mapping and conflict detection
 * verbatim — the `unique (branch_id, phone)` constraint does not care which
 * verb touched the row, and a second copy of `isPhoneConflict` would be the
 * start of two error contracts for one constraint.
 *
 * `department_id` and `branch_id` are NOT in the payload. They are immutable
 * from the client (story 11 task 4 / flag 1); sending them unchanged would be
 * harmless and sending them changed would be rejected, so sending them at all
 * only invites the second.
 *
 * Deliberately NOT compare-and-set, unlike `assignTicket` (`tickets/api.ts:478`).
 * That guard exists because two agents racing for one ticket is a real workflow;
 * two agents editing one customer's phone at the same moment is not, and a
 * false "someone changed this" on a slow connection would be worse than a
 * last-write-wins. See open question 5.
 */
export async function updateCustomer(
  customerId: string,
  input: CreateCustomerInput,
): Promise<CustomerDetail> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      full_name: input.fullName.trim(),
      phone: normalisePhone(input.phone),
      email: input.email.trim() || null,
      secondary_contacts: toSecondaryContactsJson(input.secondaryContacts),
    })
    .eq('id', customerId)
    .select(DETAIL_SELECT)
    .maybeSingle<CustomerDetailRow>();

  if (error) {
    if (isPhoneConflict(error)) throw new CustomerPhoneConflictError();
    throw toAppError(error);
  }
  // Zero rows means RLS refused the row — BRD `:548`'s cross-branch case, and
  // the reason this is `maybeSingle` rather than create's `single`: `single`
  // reports that as PGRST116 and `toAppError` cannot tell it from a 404.
  if (!data) throw new CustomerNotEditableError();
  return toCustomerDetail(data);
}

/** Thrown when the update matched no row — RLS refused it, or the id is gone. */
export class CustomerNotEditableError extends Error {
  constructor() {
    super('This customer cannot be edited from your branch');
  }
}
```

`updated_at` is **not** sent — `database.ts:270` types it optional and the column carries a database default; whether a trigger maintains it on update is flag 4.

Add a mapper for the reverse direction, so the edit screen can seed the form from the detail it already has:

```ts
/**
 * `CustomerDetail` (what the profile shows) → `CreateCustomerInput` (what the
 * form edits). The two shapes differ deliberately: the detail carries resolved
 * department and branch NAMES, which the form neither edits nor sends.
 */
export function toCustomerInput(customer: CustomerDetail): CreateCustomerInput {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email ?? '',
    secondaryContacts: customer.secondaryContacts.map((contact) => ({
      label: contact.label ?? '',
      value: contact.value,
    })),
  };
}
```

`email: customer.email ?? ''` and `label: contact.label ?? ''` are load-bearing — a `null` into a `TextField`'s `value` makes it uncontrolled on first render, and React then warns and drops the agent's first keystroke.

### 3 — The mutation hook

**File: `src/features/customers/hooks.ts`**

```ts
export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => updateCustomer(customerId, input),
    onSuccess: (customer) => {
      // BOTH entries, per the intake: `customerKeys.all` covers the list and the
      // three chip counts; it also matches `['customers', id]`, so the detail is
      // refetched too. The explicit seed below is what makes the profile paint
      // with the new values on the very next frame rather than after a round
      // trip — the update's own response is authoritative.
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.setQueryData(customerKeys.detail(customerId), customer);
    },
  });
}
```

Order matters for the same reason it did in story 11 task 4: invalidate first, seed second. Reversing it marks the fresh entry stale the moment it is written.

Unlike `useCreateCustomer`, this hook does **not** read the agent's profile — no org fields are sent (task 2), so there is nothing to wait for and `ready` is always true on this screen.

### 4 — `EditCustomerScreen`

**Create file: `src/features/customers/screens/EditCustomerScreen.tsx`**

Props: `{ customerId: string }`.

```tsx
const detail = useCustomerDetail(customerId);
const update = useUpdateCustomer(customerId);
```

`useCustomerDetail` is the **same query the profile screen already ran**, so opening the editor from the profile is a cache hit and the form is populated on the first frame. That is the whole reason story 10's intake insisted on one shared detail entry.

State ladder before the form renders:

- `detail.isPending` → a `SkeletonList` inside the modal, with `ModalHeader` already present so Cancel works. **Do not render `CustomerForm` with empty values while loading** — an agent who types into a field that is about to be re-seeded loses the keystroke.
- `detail.isError || !detail.data` → `ErrorState`; retry on the error branch, none on not-found. Story 10's distinction, repeated.
- otherwise → `<CustomerForm title={t('editCustomer.title')} submitLabel={t('createCustomer.save')} initialValues={toCustomerInput(detail.data)} … />`

`toCustomerInput(detail.data)` is called inside a `useMemo` keyed on `detail.data` — the `values` prop added in task 1 re-seeds the form on every new object identity, and an unmemoised mapper returns a new object each render.

Submit:

```tsx
function onSubmit(values: CreateCustomerInput) {
  update.mutate(values, { onSuccess: () => router.back() });
}
```

`router.back()`, not `router.replace` — the editor was pushed **over** the profile, and the profile is exactly where the agent should land to see their change. (Create used `replace` because there was nothing worth returning to.)

`phoneConflict={update.error instanceof CustomerPhoneConflictError}`. `formError` is `t('editCustomer.errors.notEditable')` for a `CustomerNotEditableError` and `t(errorMessageKey(update.error))` otherwise; `undefined` when the failure is the phone conflict, so the message never appears twice.

**File: `src/features/customers/index.ts`** — export `EditCustomerScreen`, `useUpdateCustomer`, `CustomerNotEditableError`, `toCustomerInput`, and `CustomerForm` (the last only if a second feature ever needs it — otherwise keep it internal; **do not** export it speculatively).

### 5 — The entry point

**File: `src/core/components/Icon.tsx`** — add one entry to `IconName` and one to `ICON_MAP`:

```ts
edit: 'pencil-outline',
```

Place it beside `close`/`plus`/`alert` — the group whose comment already records that these are names "the components need but the Figma set lacks". It is not directional, so it does **not** join `DEFAULT_MIRRORED`.

**File: `src/features/customers/components/CustomerDetailHeader.tsx`** — add `onEditPress: () => void` to the props and a fourth `IconButton` to the trailing group:

```tsx
<IconButton
  icon="edit"
  size={36}
  variant="ghost"
  onPress={onEditPress}
  accessibilityLabel={t('editCustomer.action')}
/>
```

Four 36px buttons plus three 8px gaps is 168px on a 355px-wide header, leaving ~140px for the name column before the avatar and its gap. The `minWidth: 0` guard story 10 put on that column is what keeps a long name ellipsising instead of shoving the buttons off the trailing edge — re-verify it on the longest seeded name (matrix row 3).

**File: `src/features/customers/screens/CustomerDetailScreen.tsx`** — pass `onEditPress={() => router.push(`/customers/edit/${customerId}`)}`.

### 6 — The route

**Create file: `src/app/customers/edit/[id].tsx`**

```tsx
import { useLocalSearchParams } from 'expo-router';

import { EditCustomerScreen } from '@/features/customers';

export default function EditCustomer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditCustomerScreen customerId={id} />;
}
```

**`customers/edit/[id]`, not `customers/[id]/edit`.** The second form would put a dynamic-segment file and a same-named directory side by side, which is exactly the shape that makes route resolution ambiguous; the first is three unambiguous segments and cannot collide with `customers/[id]` (two segments) or `customers/new` (two segments, static).

**File: `src/app/_layout.tsx`** — register inside `Stack.Protected`, matching story 11's modal:

```tsx
<Stack.Screen name="customers/edit/[id]" options={{ presentation: 'modal' }} />
```

### 7 — Copy

**Files: `src/core/lib/i18n/locales/en.json` and `ar.json`** — a small `editCustomer` namespace. **Everything else is reused from `createCustomer`** — the field labels, placeholders and validation messages are the same strings for the same inputs, and duplicating them is how the two screens drift apart in one language and not the other.

```json
"editCustomer": {
  "title": "Edit customer",
  "action": "Edit customer",
  "errors": {
    "notEditable": "You can't edit this customer."
  }
}
```

Arabic values in the same shape. `editCustomer.action` is the icon button's accessible name; it is deliberately the full phrase rather than "Edit", because a screen reader announces it with no surrounding context.

### 8 — Update the instruction files

**File: `CLAUDE.md`** — "Project status": customer editing is no longer open; add `src/app/customers/edit/[id].tsx` to the route list; note that `customers` now owns `CustomerForm`, shared by the create and edit screens. **File: `AGENTS.md`** needs no change.

---

## Edge Cases & Failure Modes

- **The form re-seeds and wipes typing.** The `values` prop added in task 1 re-runs whenever `initialValues` changes identity. Guarded twice: `EMPTY_CUSTOMER` is a module constant on the create screen (task 1) and `toCustomerInput` is memoised on the edit screen (task 4). Getting either wrong makes a field that silently reverts while an agent types — the hardest failure in this story to spot in review and the easiest to hit.
- **The detail is still loading.** The editor renders a skeleton, not an empty form (task 4). An empty form that fills in a moment later is indistinguishable from a customer whose fields are blank.
- **Editing a customer from another branch.** RLS matches zero rows; PostgREST returns `200` with an empty body and **no error**. `maybeSingle` yields `data: null`, and task 2 throws `CustomerNotEditableError` rather than reporting success on a write that did nothing. This is BRD `:548`, and the silent-success failure mode is the entire reason that criterion exists.
- **The customer was deleted between opening the editor and saving.** Same zero-row path, same error. Correct, if slightly mis-worded — see flag 3.
- **Changing the phone to one already used in the branch.** `23505` → `isPhoneConflict` → `CustomerPhoneConflictError` → a field error on phone. Identical to create, using the same code, because it is the same constraint.
- **Saving with the phone unchanged.** Postgres does not raise a unique violation against a row's own values, so a no-op edit of any other field is safe. Matrix row 12 proves it.
- **Removing every secondary contact.** `toSecondaryContactsJson([])` writes `[]`, and story 10's Info tab renders "None". The column is `Json`, not nullable, so `[]` is the correct empty — **not** `null`. BRD `:547`.
- **A contact that was stored with a `null` label.** `toCustomerInput` maps it to `''` so the input stays controlled; `toSecondaryContactsJson` maps `''` back to `null` on write. The round trip is lossless. Test 4.
- **A contact stored in a shape `parseSecondaryContacts` drops.** It never reaches the form, and saving therefore **deletes it**. A malformed entry is silently discarded by an unrelated edit. Accepted — it was unrenderable anyway — but it is a real data-loss path and is called out in flag 2.
- **Double-tap on Save.** `submitting` disables the header action (task 1, inherited from story 11). Two PATCHes would be idempotent here, but the second's response would arrive after `router.back()` and seed the cache from a stale closure.
- **The agent edits, then pulls to refresh the list before the mutation settles.** The invalidation in task 3 runs on success only; a pending update does not race the refetch. The list shows old values until the save lands, which is honest.
- **Arabic layout.** Inherited wholesale from story 11's form. The one new surface is the fourth header button — confirm the four-button row does not overflow under العربية, where the name may render wider (matrix row 22).

---

## Test Plan

**There is no test runner in this repo** (AGENTS.md). The list below is what to write when one is installed; the manual matrix underneath is the gate today.

### Manual test matrix

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Any customer | Open the profile | A fourth (pencil) button sits beside Call / Email / History |
| 2 | Any | Tap it | The Edit customer modal presents, **already populated** — no flash of empty fields |
| 3 | The longest seeded name | Open the profile | The name ellipsises; all four buttons stay on screen |
| 4 | Any | Type into Full name, wait 3s | The value stays — the re-seed guard |
| 5 | Any | Change the name, Save | The modal closes onto the **profile**, showing the new name (BRD `:545`) |
| 6 | After row 5 | Go back to the Customers list | The row shows the new name with no manual refresh |
| 7 | Any | Change the email, Save | The Info tab shows the new email |
| 8 | Customer with an email | Clear the email, Save | The Info tab shows "No email on file" — stored as `null`, not `''` |
| 9 | Any | Add a secondary contact, Save | It appears on the profile (BRD `:546`) |
| 10 | Customer with two contacts | Remove one, Save | It no longer appears; the other survives (BRD `:547`) |
| 11 | Customer with one contact | Remove it, Save | The Info row reads "None" |
| 12 | Any | Open the editor, change nothing, Save | Succeeds; no duplicate-phone error against the row's own phone |
| 13 | Any | Change the phone to another customer's in this branch | A **field error on phone**; the modal stays open |
| 14 | After row 13 | Fix the phone, Save | Succeeds; the error clears |
| 15 | Any | Change the phone to a customer's in **another** branch | Succeeds — the constraint is composite |
| 16 | Any | Clear Full name, Save | The required error; nothing is sent |
| 17 | Any | Phone = `abc`, Save | The format error; nothing is sent |
| 18 | Any | Tap Cancel after editing | The modal dismisses; the profile is unchanged |
| 19 | Any | Read the org rows in the editor | Department and branch are read-only, matching the customer's |
| 20 | Airplane mode | Save | The form-level error; every value is kept |
| 21 | Airplane mode | Open the editor from a profile you already viewed | It populates from cache and Save fails cleanly |
| 22 | العربية, restarted | Open a profile, then the editor | Both mirror; the four-button row does not overflow |
| 23 | Toggle system dark mode | Open the editor | Inputs, card, link and errors all legible |
| 24 | A raw PATCH from curl with your JWT against another branch's customer | Run it | **Rejected** or zero rows changed (BRD `:548`) — verification step 1 |
| 25 | Deleted customer id | Deep-link `/customers/edit/<id>` | Not-found state; no crash |
| 26 | Signed out | Deep-link `/customers/edit/<id>` | The login screen |
| 27 | Any | Open the **create** form from the Customers FAB | Still empty, still validates, still creates — the task 1 regression gate |

### To write when a runner exists

1. **Unit — `src/features/customers/api.test.ts`** · `toCustomerInput` maps a `null` email to `''` and a `null` contact label to `''`, never to `null` or `undefined`.
2. **Unit — `src/features/customers/api.test.ts`** · `updateCustomer`'s payload contains exactly `full_name`, `phone`, `email`, `secondary_contacts` — **no** `department_id`, `branch_id`, `id`, `created_at` or `updated_at`.
3. **Unit — `src/features/customers/api.test.ts`** · a zero-row result throws `CustomerNotEditableError`, not a success and not a generic `AppError`.
4. **Round-trip — `src/features/customers/api.test.ts`** · `toCustomerInput(toCustomerDetail(row))` → `toSecondaryContactsJson` reproduces the stored array for a contact with a label and for one without.
5. **Unit — `src/features/customers/api.test.ts`** · `updateCustomer` reuses `isPhoneConflict`; a `{ code: '23505' }` error throws `CustomerPhoneConflictError`.
6. **Integration — `src/features/customers/hooks.test.tsx`** · `useUpdateCustomer` invalidates `customerKeys.all` **and** seeds `customerKeys.detail(id)`, in that order.
7. **Unit — `src/features/customers/components/CustomerForm.test.tsx`** · re-rendering with an identical-by-value but new-identity `initialValues` does **not** wipe typed input when the parent memoises, and the create screen's `EMPTY_CUSTOMER` is referentially stable.
8. **Unit — `src/features/customers/components/CustomerForm.test.tsx`** · `phoneConflict` flipping to true sets the phone field error; flipping back does not clear other errors.
9. **Unit — `src/features/customers/screens/EditCustomerScreen.test.tsx`** · while `detail.isPending`, `CustomerForm` is not mounted.
10. **Unit — `src/core/components/Icon.test.tsx`** · every `IconName` has an `ICON_MAP` entry — the guard for task 5's addition and every future one.

---

## Verification Steps

1. **Prove BRD `:548` before writing the screen.** Sign in as an agent, take a `customer_id` from another branch, and issue the raw PATCH:
   ```bash
   curl -s -w '\n%{http_code}\n' -X PATCH -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" -H "Prefer: return=representation" \
     -d '{"full_name":"RLS probe"}' \
     "$URL/rest/v1/customers?id=eq.$OTHER_BRANCH_CUSTOMER_ID"
   ```
   Record the status and body. **A `200` with `[]` is the expected pass** — RLS filters the row rather than raising — and it is precisely why task 2 uses `maybeSingle` and throws on no data. If the row comes back modified, US-007 has a security defect and this story stops until the policy is fixed.
2. **Confirm the update-path conflict.** PATCH a customer's phone to another customer's phone **in the same branch** and record the error body. Confirm `code` is `23505`, so story 11's `isPhoneConflict` genuinely covers this path rather than being assumed to.
3. **Typecheck:** `npm run typecheck` — zero errors. The `Update` type makes **every** column optional, so this step will *not* catch a missing field; it only catches a misspelled one. Read task 2's payload against `database.ts:250-263` by eye as well.
4. **Lint:** `npm run lint` — zero errors.
5. **Regression — create:** open the Customers FAB, fill the form, save. Task 1 moved that entire screen's body; matrix row 27 is the gate, and it must be run **before** the edit path is tested, not after.
6. **Regression — the profile:** open a customer detail and confirm the header still renders and the Info tab is unchanged apart from the new button.
7. **Frontend runs:** `npm start`, `a` and `i`. Walk the matrix.
8. **RTL:** switch to العربية and **fully restart**. Matrix row 22.
9. **Re-seed check:** open the editor, type into Full name, and leave it untouched for several seconds while the app refetches in the background. The value must survive — this is the failure mode tests 7 exists for and the one a quick manual pass usually skips.
10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:545-548`.

- [ ] Given an existing customer, when I edit and save, then **changes persist**
- [ ] Given I add a secondary contact, when saved, then **it appears on the profile**
- [ ] Given I remove a secondary contact, when saved, then **it no longer appears**
- [ ] Given I edit a customer from another branch **via API**, when the call executes, then **it is rejected**

Plus, from the intake and the design:

- [ ] Create and edit render **one** `CustomerForm` — the fields, validation and contacts editor exist once
- [ ] The editor opens pre-populated from the **same** `['customers', id]` entry the profile read
- [ ] The duplicate-phone conflict on update is a **field error on phone**, reusing create's `isPhoneConflict`
- [ ] A successful save invalidates **both** `['customers']` and `['customers', id]`
- [ ] A zero-row update throws rather than reporting success
- [ ] The payload contains only the four editable columns — no org fields, no server-generated ones
- [ ] Typing into the form is never wiped by a re-seed
- [ ] The editor is reached from a labelled control on the customer profile
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md's "Project status" lists customer editing as built

---

## Open questions — raise with design/product, do not resolve silently

1. **There is no Edit design at all.** The intake asked us to check, and the check came back empty: page `0:1` has a create frame and two detail frames, no edit variant. This story reuses the create frame with a changed title and **invents the entry point** — a fourth header icon button on a new `pencil-outline` glyph that is not in the Figma icon set. Design should either add the frame or confirm the reuse. The specific things needing a decision: whether Edit belongs in the header at all (an overflow menu or a row on the Info tab are both plausible), and what the glyph should be.
2. **A malformed secondary contact is silently deleted by an unrelated edit.** Story 10's `parseSecondaryContacts` drops entries it cannot read; they therefore never reach the form, and saving writes the array without them. An agent correcting a typo in a name can destroy a contact they never saw. The fix is to carry unparseable entries through the form untouched, which means the form holds data it cannot render — genuinely worse in most respects. Flagged rather than fixed; confirm the trade.
3. **`CustomerNotEditableError` covers two different failures.** RLS refusing the row and the customer having been deleted both arrive as zero rows with no error, and the copy ("You can't edit this customer.") is worded for the first. Distinguishing them would need a follow-up `select` on failure, which is a second round trip to improve one error message. Confirm the wording is acceptable for both.
4. **Nothing is known to maintain `updated_at`.** The column exists with a default (`database.ts:270`) and this story does not send it, on the assumption a trigger keeps it current. No trigger is documented in `docs/phase1_backend_plan.md` for `customers`. If there is none, `updated_at` silently means "created at" forever, and any future "recently modified" feature is built on sand. Worth one query to check.
5. **No optimistic-concurrency guard.** `assignTicket` compare-and-sets because two agents racing for one ticket is a real workflow. Two agents editing one customer at the same moment is not, so this ships last-write-wins. If customer records turn out to be edited concurrently in practice, the guard is a `.eq('updated_at', expectedUpdatedAt)` on the same update — cheap to add, but it needs flag 4 answered first, since it depends on `updated_at` actually moving.
6. **Department and branch are permanently uneditable.** Story 11 flag 1 asked whether they should be pickers on create. On **edit** the question is sharper: a customer genuinely transferred between branches has no path at all, in the app or in the API (§3.4 documents no payload). If transfers happen, they currently require direct database access.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 13.**
