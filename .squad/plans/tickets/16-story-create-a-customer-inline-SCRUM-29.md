# Story 16 — Create a customer inline during ticket creation (Story: SCRUM-29)

> Intake: `.squad/stories/tickets/SCRUM-29/intake.md`
> Figma: **no distinct frame.** The intake is explicit — this is story 11's Create Customer form
> presented over Create Ticket instead of as its own route. Node `102:987` (`+ New customer`) is the
> only element in the Create Ticket frame this story touches, and it already renders.

## Prerequisites

- **Story 13 completed** — [`13-story-create-a-ticket-SCRUM-28.md`](13-story-create-a-ticket-SCRUM-28.md). It built `CreateTicketScreen`, `CustomerPickerSheet`, and the `+ New customer` link this story rewires (`screens/CreateTicketScreen.tsx:195-203`). Its **open question 2** is this story's entire brief: *"`+ New customer` navigates away and does not come back … strictly worse than the current no-op for an agent mid-call."*
- **Story 11 completed** — [`../customers/11-story-create-a-customer-SCRUM-22.md`](../customers/11-story-create-a-customer-SCRUM-22.md). It built `CustomerForm` (the shared fields, validation, contacts editor and the inherited department/branch block), `useCreateCustomer`, `createCustomer`, and `CustomerPhoneConflictError`. **This story adds a second presentation of that form and writes no field, no rule and no mutation of its own.**
- **Story 12 completed** — [`../customers/12-story-edit-customer-details-SCRUM-23.md`](../customers/12-story-edit-customer-details-SCRUM-23.md). It is the precedent that `CustomerForm` already has two hosts (`CreateCustomerScreen`, `EditCustomerScreen`) that differ only in title, initial values and what `onSubmit` does. This story adds the third.
- **Story 05 completed** — [`../customers/05-story-customer-list-and-search-SCRUM-21.md`](../customers/05-story-customer-list-and-search-SCRUM-21.md). Owns `useCustomerSearch` and `customerKeys`, which the picker reads and `useCreateCustomer` invalidates.
- **`.env` populated**, and at least one customer in the agent's branch whose phone you can retype verbatim — task 4's duplicate-phone path cannot be exercised without one.

---

## Story Goal

An agent on a call with a customer who is not in the system adds that customer **without losing the
ticket they have already half-typed**. Concretely:

1. **The `+ New customer` link opens a sheet over Create Ticket**, not a navigation push. The ticket form never unmounts, so subject, description, category and priority survive untouched — that is the entire point of BRD `:638`.
2. **The customer picker offers the same action when a search finds nothing** (BRD `:636`), prefilled with what the agent typed.
3. **On save, the new customer becomes the selected value** in the ticket form's customer card (BRD `:637`) — no second search, no re-pick.
4. **The form, its validation, its duplicate-phone handling and its mutation are story 11's, reused as a component.** Not one field is duplicated.
5. **Cancel returns to the ticket form with nothing selected and nothing lost.**

**Not in scope**: editing a customer from inside the ticket form (story 12 owns `/customers/edit/[id]`; there is no path to it from here), attachments (API §8 is still 🔨 — story 13's flag 3 stands unchanged), any change to `CreateCustomerScreen`'s own `/customers/new` route (it keeps its `router.replace` redirect — see task 1's note), and prefilling the **phone** field from the search term (open question 3).

---

## Context — Read These Files First

1. `src/features/tickets/screens/CreateTicketScreen.tsx` — all 377 lines, but especially:
   - `:41-47` — the two picker `visible` flags and the `customer` / `category` display state. **The `customer` state is `CustomerListItem | null`; that type is what task 3's adapter must produce.**
   - `:70-81` — `handleCustomerSelect(next: CustomerListItem)` and `handleClearCustomer`. Task 4 calls the former; do not write a parallel selection path.
   - `:195-203` — the `+ New customer` `Button variant="link"` and its `router.push('/customers/new')`, with the `// Navigates AWAY — inline creation is US-013 (SCRUM-29)` comment. **That comment is this story's marker; it goes.**
   - `:352-363` — the two sheets already rendered as siblings at the bottom of the tree. The new sheet joins them here.
2. `src/features/customers/components/CustomerForm.tsx` — all 333 lines. Note the props contract at `:22-37` (`title`, `submitLabel`, `initialValues`, `onSubmit`, `onCancel`, `submitting`, `ready`, `phoneConflict`, `formError`) and **the comment at `:73-77`**: `values: initialValues` re-seeds the form on a new object identity, *"which is why every caller must pass a **STABLE** object."* Task 1 obeys this with `useMemo`; an inline literal wipes what the agent has typed on every keystroke.
   Note also `:88-96` — the component renders its **own `ModalHeader`** and at `:98-101` its own `KeyboardAvoidingView` with `style={{ flex: 1 }}`. This is why task 1 hosts it in a full-screen `Modal` and **not** in `BottomSheet` (see task 1's rationale).
3. `src/features/customers/screens/CreateCustomerScreen.tsx` — all 61 lines. The exact wiring task 1 copies: `EMPTY_CUSTOMER` as a **module-level** constant (`:19-24`, with the comment explaining why), `conflict = create.error instanceof CustomerPhoneConflictError` (`:33`), `ready={Boolean(profile.data)}` (`:53`), and the `formError` split at `:57` that keeps a network failure from blaming the phone field. **The only line task 1 changes is `:39-41` — the `router.replace` becomes a callback.**
4. `src/features/customers/hooks.ts:96-125` — `useCreateCustomer`. Read the `onSuccess` at `:115-123` and its comment: it invalidates `customerKeys.all` **then** seeds `customerKeys.detail(id)`, in that order, and the comment says why the order is not negotiable. **This story adds nothing to it** — the invalidation already covers the picker's `customerKeys.list('all', term)`.
5. `src/features/customers/api.ts:41-50` — `toListItem(row: CustomerListRow): CustomerListItem`, the existing row→list-item mapper. Task 3's adapter sits beside it and mirrors its field order.
6. `src/features/customers/api.ts:314-336` — `createCustomer`, and the doc comment at `:314-322`: it returns **`CustomerDetail`**, not `CustomerListItem`, because `.select(DETAIL_SELECT).single()` is what lets `useCreateCustomer` seed the detail cache. **This type mismatch is the one non-obvious piece of this story** and is what task 3 exists for.
7. `src/features/customers/types.ts:4-12` (`CustomerListItem`) and `:63-75` (`CustomerDetail`). Diff them by eye: `CustomerDetail` has everything `CustomerListItem` needs **except `openTicketCount`**, and carries `secondaryContacts`, `departmentName`, `branchName` and `tickets` that a list row has no use for.
8. `src/features/tickets/components/CustomerPickerSheet.tsx` — all 95 lines. `:63-67` is the empty branch task 5 extends. Note `:24-29`'s warning not to write a second customer query, and `:39-41`'s reset-on-hide effect.
9. `src/core/components/BottomSheet.tsx:141-143` — the child wrapper: a `View` with `paddingHorizontal` inside an auto-height `Animated.View` capped at `maxHeight: screenHeight * 0.9`. **There is no `flex: 1` anywhere on that path**, which is exactly why `CustomerForm` cannot live here.
10. `src/features/customers/index.ts` — the barrel. Task 2 adds to it. `CustomerForm` is **not** currently exported and must not be: tickets consumes the finished sheet, not the raw form.
11. `docs/phase1_brd_1.md:628-638` — US-013 and its three acceptance criteria. `## Done Criteria` mirrors them verbatim.
12. `docs/phase1_api_reference.md` §3.3 — the create endpoint. **Unchanged by this story**; it is the same call story 11 already makes.

---

## Product rules (from story)

| | Current behaviour (after story 13) | New behaviour |
|---|---|---|
| `+ New customer` on the ticket form | `router.push('/customers/new')` — a full route push; on save it `router.replace`s to `/customers/[id]` and the agent never returns to the ticket | Opens a sheet over the ticket form; on save the sheet closes and the customer is selected |
| Picker finds no match | `EmptyState` only — a dead end | `EmptyState` **plus** a `+ New customer` action, prefilled with the search term |
| Ticket fields after creating a customer | Lost (the screen was replaced) | **Preserved** — the screen never unmounted |
| `/customers/new` route | Reached from the ticket form and elsewhere | Still exists, still `router.replace`s to the profile. **Untouched.** |

---

## Frontend Tasks

### 1 — The inline sheet

**Create file: `src/features/customers/components/CreateCustomerSheet.tsx`**

This lives in **`features/customers`, not `features/tickets`** — customer creation is the customers
feature's business in every presentation it has, and putting it here means `features/tickets` imports
one finished component instead of `CustomerForm` + `useCreateCustomer` + `CustomerPhoneConflictError`
+ `CreateCustomerInput` and then reassembles story 11's screen by hand. Hard rule 4 is satisfied
either way; this is the version that does not leak the customers feature's internals across the seam.

```tsx
export type CreateCustomerSheetProps = {
  visible: boolean;
  /** Cancel, backdrop, or Android back. Does NOT fire after a successful save. */
  onClose: () => void;
  /** The created customer, already narrowed to the shape a list row and a picker need. */
  onCreated: (customer: CustomerListItem) => void;
  /** Prefills Full name — the picker's search term when it found no match. */
  initialFullName?: string;
};
```

**Host it in React Native's `Modal`, not `BottomSheet`.** `CustomerForm` renders its own
`ModalHeader` (`CustomerForm.tsx:90-96`) and a `KeyboardAvoidingView` with `style={{ flex: 1 }}`
wrapping a `ScrollView` (`:98-109`). `BottomSheet` puts its children in a padded, auto-height `View`
(`BottomSheet.tsx:141-143`) under a `maxHeight` cap — a `flex: 1` child on that path measures to
**zero height** and the form renders as an empty strip under the header. Use:

```tsx
<Modal
  visible={visible}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={onClose}   // Android hardware back — without this, back does nothing.
>
  {visible ? <CreateCustomerSheetBody {...} /> : null}
</Modal>
```

**Split the body into an inner component and gate it on `visible`.** The hooks
(`useCreateCustomer`, `useAgentProfile`, `CustomerForm`'s own `useForm`) must live in
`CreateCustomerSheetBody`, so that closing the sheet **unmounts them**. This is not a style
preference: without it, a cancelled draft and a stale `create.isError` both survive into the next
open, and the agent reopens the form to somebody else's half-typed name and a red duplicate-phone
error about a phone they never entered.

The body is `CreateCustomerScreen.tsx:26-60` with two changes and nothing else:

```tsx
const initialValues = useMemo<CreateCustomerInput>(
  // A stable identity per `initialFullName` — CustomerForm.tsx:73-77 re-seeds the
  // form whenever this object's identity changes, so an inline literal would wipe
  // every keystroke.
  () => ({ fullName: initialFullName ?? '', phone: '', email: '', secondaryContacts: [] }),
  [initialFullName],
);

function onSubmit(values: CreateCustomerInput) {
  create.mutate(values, {
    // The one divergence from CreateCustomerScreen, which router.replace()s to
    // /customers/[id] here. Inline creation must return to the ticket form —
    // BRD `:638` — so the caller decides, not this component.
    onSuccess: (customer) => onCreated(toListItemFromDetail(customer)),
  });
}
```

Everything else — `conflict`, `ready`, the `formError` split, the `SafeAreaView` with
`edges={['top']}` and `backgroundColor: theme.colors.bgCanvas` — is copied verbatim from
`CreateCustomerScreen.tsx:33-58`. Pass `title={t('createCustomer.title')}` and
`submitLabel={t('createCustomer.save')}`, the same two keys that screen uses.

**Do not refactor `CreateCustomerScreen` to delegate to this component.** They share `CustomerForm`
and `useCreateCustomer`, which is the reuse the intake asks for; the remaining ~20 lines differ in
what happens on success, and collapsing them would mean a `mode` prop on a component whose two modes
have nothing in common but their fields. Story 13's own picker made the same call about
`useCustomerSearch`.

---

### 2 — Barrel exports

**File: `src/features/customers/index.ts`**

Add, keeping the file's existing alphabetical grouping:

- `export { CreateCustomerSheet } from './components/CreateCustomerSheet';` — beside `CustomerRow` at `:10`.
- `export { toListItemFromDetail } from './api';` — into the `./api` block at `:1-9`, after `toCustomerInput`.

**Do not export `CustomerForm`.** Nothing outside `features/customers` has a reason to hold the raw
form, and exporting it invites a fourth hand-assembled host.

---

### 3 — The `CustomerDetail` → `CustomerListItem` adapter

**File: `src/features/customers/api.ts`**

`createCustomer` returns `CustomerDetail` (`:323`); `CreateTicketScreen`'s `customer` state and
`handleCustomerSelect` take `CustomerListItem` (`CreateTicketScreen.tsx:46,70`). Add a pure mapper
immediately after `toListItem` (`:41-50`):

```ts
/**
 * Narrows a freshly created customer to the list-row shape the Create Ticket
 * picker holds. `openTicketCount` is 0 by construction, not by assumption: the
 * row was inserted seconds ago and the ticket that prompted it has not been
 * saved yet.
 *
 * Deliberately NOT a widening of `CustomerListItem` to accept `CustomerDetail`,
 * and NOT a union on the picker's props — the picker's contract is one row
 * shape, and it should stay one.
 */
export function toListItemFromDetail(detail: CustomerDetail): CustomerListItem {
  return {
    id: detail.id,
    fullName: detail.fullName,
    phone: detail.phone,
    email: detail.email,
    createdAt: detail.createdAt,
    openTicketCount: 0,
  };
}
```

Field order mirrors `toListItem` at `:42-49` so the two read as the same mapper.

---

### 4 — Wire the ticket form's `+ New customer` link

**File: `src/features/tickets/screens/CreateTicketScreen.tsx`**

**a.** Widen the customers import at `:21`:

```ts
import { CreateCustomerSheet, type CustomerListItem } from '@/features/customers';
```

Barrel-only, per hard rule 4 — the same seam `CustomerPickerSheet.tsx:14` already uses.

**b.** Add one piece of state beside the two picker flags at `:41-42`:

```tsx
// `null` = closed. A string (possibly empty) = open, with that name prefilled.
// One state, not two — a boolean plus a name can disagree, and the disagreement
// shows as a sheet that opens blank after the picker prefilled it.
const [newCustomerName, setNewCustomerName] = useState<string | null>(null);
```

**c.** Add the two handlers beside `handleCustomerSelect` at `:70-81`:

```tsx
function handleCustomerCreated(next: CustomerListItem) {
  setNewCustomerName(null);
  // Reuses the picker's own selection path — chip, form value and validation
  // clear all happen in exactly one place.
  handleCustomerSelect(next);
}
```

`handleCustomerSelect` also sets `setCustomerPickerVisible(false)` (`:75`), which is correct here:
if the sheet was reached from the picker's empty state, the picker must not be waiting underneath.

**d.** Replace the link's `onPress` at `:198-202`. The whole comment block at `:196-197` goes with it:

```tsx
<Button
  variant="link"
  label={t('createTicket.customer.newCustomer')}
  onPress={() => setNewCustomerName('')}
/>
```

**e.** Render the sheet as a third sibling after `CategoryPickerSheet` at `:358-363`:

```tsx
<CreateCustomerSheet
  visible={newCustomerName !== null}
  initialFullName={newCustomerName ?? undefined}
  onClose={() => setNewCustomerName(null)}
  onCreated={handleCustomerCreated}
/>
```

---

### 5 — The picker's empty-state action (BRD `:636`)

**File: `src/features/tickets/components/CustomerPickerSheet.tsx`**

BRD `:636` — *"Given the customer picker, when no match is found, then a New customer action is
offered"* — is the one acceptance criterion story 13 did not touch, and the intake names the picker
as the trigger. Story 13 put the link on the **form**; both are needed.

**a.** Add to `CustomerPickerSheetProps` (`:16-20`):

```ts
/** Offered from the empty state. `prefill` is the search term when it reads like a name. */
onRequestCreate: (prefill: string) => void;
```

**b.** Replace the empty branch at `:63-67` with the `EmptyState` plus a link, in a `View` with
`gap: theme.spacing.md` and `alignItems: 'center'`:

```tsx
) : customers.length === 0 ? (
  <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
    <EmptyState icon="search" title={t('createTicket.customerPicker.empty', { query: search })} />
    <Button
      variant="link"
      label={t('createTicket.customer.newCustomer')}
      onPress={() => onRequestCreate(prefillName(search))}
    />
  </View>
) : (
```

Import `Button` into the existing `@/core/components` block at `:5-11`.

**c.** Add the prefill rule as a module-level function above the component:

```ts
/**
 * The search box takes names, phones and emails (story 05's `ilike` over all
 * three), and the form's Full name field takes only the first. A term with a
 * digit in it is almost certainly a partial phone, and a half phone number
 * dropped into Full name is worse than an empty field.
 *
 * The phone case is deliberately NOT routed to the phone field — see open
 * question 3.
 */
function prefillName(search: string): string {
  return /\d/.test(search) ? '' : search.trim();
}
```

**d.** In `CreateTicketScreen`, pass the new prop on the picker at `:352-356`:

```tsx
onRequestCreate={(prefill) => {
  setCustomerPickerVisible(false);
  setNewCustomerName(prefill);
}}
```

Both state updates land in one commit, so the picker's `Modal` unmounts and the sheet's mounts in the
same frame — see **Edge Cases** for the iOS caveat and what to do if it bites.

---

### 6 — i18n

**No i18n changes required.** Every string this story renders already exists:

| Where | Key | en | ar |
|---|---|---|---|
| Both `+ New customer` links | `createTicket.customer.newCustomer` | `en.json:220` | `ar.json:235` |
| Sheet header title | `createCustomer.title` | `en.json:313` | `ar.json:330+` |
| Sheet header action | `createCustomer.save` | `en.json:314` | `ar.json:330+` |
| Duplicate phone | `createCustomer.errors.phoneDuplicate` | `en.json:335` | `ar.json:330+` |

The picker's empty-state link reuses `createTicket.customer.newCustomer` on purpose: two controls
that do the same thing should read the same, and a second key would drift.

---

### 7 — Documentation

**File: `CLAUDE.md`**

In "Project status", the paragraph ending *"Both FABs — Home and the Tickets tab — open it, which
closes US-022 as well."* — append that `/tickets/new`'s `+ New customer` link and its picker's empty
state now open an inline `CreateCustomerSheet` that returns the created customer to the form with
every other field intact (SCRUM-29), and that story 13's open question 2 is thereby closed. Leave the
notifications / Storage sentence untouched — this story changes neither.

**No backend changes required.** API §3.3 is the same endpoint story 11 already calls, with the same
payload, from the same `useCreateCustomer`.

---

## Edge Cases & Failure Modes

- **Duplicate phone entered in the sheet.** `createCustomer` raises `23505`; `api.ts`'s `isPhoneConflict` maps it to `CustomerPhoneConflictError`; the body's `conflict` flag reaches `CustomerForm`'s effect (`CustomerForm.tsx:82-86`) and lands the message on the **phone field**. The sheet stays open, `onCreated` never fires, and the ticket form is untouched. Verified by verification step 4.
- **Agent profile still loading when the sheet opens.** `ready={Boolean(profile.data)}` disables Save (`CustomerForm.tsx:95`), because `useCreateCustomer` reads `departmentId`/`branchId` off the profile (`hooks.ts:111-112`) and sending `undefined` surfaces as an opaque foreign-key error. Same guard as `CreateCustomerScreen.tsx:53`.
- **Cancel with a half-typed customer.** `onClose` sets `newCustomerName` to `null`; the body unmounts; the ticket form — which never unmounted — still holds subject, description, category and priority. **This is the acceptance criterion (`:638`), not an edge case**, and it is the reason the sheet is a `Modal` and not a route push.
- **Android hardware back inside the sheet.** Handled only because task 1 wires `onRequestClose={onClose}`. Omit it and back is silently inert — the one failure mode of this story that will not appear on iOS at all.
- **Reopening the sheet after a cancel.** The body unmounts on close, so `useForm` re-seeds from `initialValues` and `create.error` is gone. Without the `{visible ? … : null}` gate in task 1 both persist.
- **The new customer does not appear in the picker's list.** It does: `useCreateCustomer.onSuccess` invalidates `customerKeys.all` (`hooks.ts:117`), which matches `customerKeys.list('all', term)` — the exact key `useCustomerSearch` reads (`hooks.ts:62-64`). No extra invalidation is needed, and adding one would refetch the customer detail entry the same handler just seeded.
- **`openTicketCount` on a brand-new customer.** `toListItemFromDetail` hardcodes `0`. True by construction — the row is seconds old and the ticket being drafted is unsaved. If that ever stops being true, `CustomerRow`'s badge is the only consumer and it under-reports; it never over-reports.
- **Presenting the sheet from the picker on iOS.** Task 5d dismisses the picker's `Modal` and mounts the sheet's in the same commit. React Native permits one presented modal at a time on iOS; if the sheet fails to appear (a black flash, or nothing), defer the second update — `setCustomerPickerVisible(false)` immediately, then `setNewCustomerName(prefill)` inside a `setTimeout(…, 350)` matched to the dismiss animation, with a comment naming the constraint. **Check this on a real iOS build before assuming it works** — verification step 6, matrix row 3.
- **A search term that is a phone number.** `prefillName` returns `''` rather than dropping digits into Full name. The agent retypes the number into the phone field. Deliberate; see open question 3.
- **RTL.** The new empty-state block is a `View` with `gap` and `alignItems: 'center'` — no directional props, so nothing to get wrong. `CustomerForm` was already exercised in Arabic by stories 11 and 12.
- **Two agents create the same customer simultaneously.** Second insert hits `23505` and lands as a field error, exactly as the single-agent duplicate case. `createCustomer` is deliberately not compare-and-set (`api.ts:388-391` explains why for update; the same reasoning holds).

---

## Test Plan

**There is no test runner in this repository** — no Jest, no test files, no `test` script
(`AGENTS.md`). Story 09 recommended installing `jest-expo` for `state-machine.ts`; that has not
happened, and **this story is not the one to do it** — the recommendation stands where story 09 filed
it. Do not add a runner as a side effect of an inline form.

1. **`toListItemFromDetail` is the only unit-testable unit this story adds** — a pure `CustomerDetail → CustomerListItem` map with no I/O. When a runner lands, it belongs in `src/features/customers/api.test.ts` beside `toListItem`, `normalisePhone` and `parseSecondaryContacts`, which are equally testable and equally untested today.
2. Everything else is manual. The matrix below is the test plan.

| # | Scenario | Expected |
|---|---|---|
| 1 | Open `/tickets/new`, type a subject + description, pick a category, choose **Urgent**, tap `+ New customer` | Sheet slides up; ticket form still mounted underneath |
| 2 | Fill name + phone, Save | Sheet closes; the blue chip shows the new name; **subject, description, category and Urgent are all still there** |
| 3 | Open the picker, search `zzzznomatch`, tap `+ New customer` in the empty state | Picker closes, sheet opens, **Full name prefilled `zzzznomatch`** |
| 4 | Same, but search `0100` | Sheet opens with Full name **empty** (digit rule) |
| 5 | In the sheet, enter a phone that already exists in your branch, Save | Red duplicate message **on the phone field**; sheet stays open; ticket form untouched |
| 6 | In the sheet, tap Cancel after typing a name | Sheet closes, no customer selected, ticket fields intact |
| 7 | Reopen the sheet immediately after 6 | **Blank form, no error** — proves the unmount gate |
| 8 | Android: open the sheet, press hardware back | Sheet closes (proves `onRequestClose`) |
| 9 | Create a customer inline, then open the picker and search their name | They appear (proves the invalidation reaches `customerKeys.list`) |
| 10 | Save the ticket after an inline creation | Ticket created against the new customer; `/tickets/[id]` opens |
| 11 | Switch to العربية, **fully restart**, repeat 1–2 | Sheet, header and fields all RTL; no `marginLeft` artefacts |
| 12 | Regression: Customers tab → FAB → `/customers/new` | Still a full route; still `router.replace`s to the profile |
| 13 | Regression: `/customers/edit/[id]` | Unchanged |

---

## Verification Steps

1. **Typecheck:** `npm run typecheck` from the repo root — zero errors. This catches the story's one real type hazard: passing `CustomerDetail` where `handleCustomerSelect` wants `CustomerListItem` (task 3). If it does **not** error before you add `toListItemFromDetail`, something has widened a type it should not have — stop and re-read `types.ts:4-12`.
2. **Lint:** `npm run lint` — zero errors. Specifically the gate for hard rule 4 on the two `@/features/customers` imports in `CreateTicketScreen.tsx` and `CustomerPickerSheet.tsx`: both must come from the barrel, never from `@/features/customers/components/CreateCustomerSheet`.
3. **Frontend runs:** `npm start`, then `a` and `i`. Walk matrix rows 1–11.
4. **Prove the duplicate-phone path with real data** (matrix row 5). Take a phone from an existing customer in your branch verbatim. If the message lands under the form instead of under the phone field, `conflict` is not being computed with `instanceof CustomerPhoneConflictError` — compare against `CreateCustomerScreen.tsx:33`.
5. **Prove state preservation the hard way** (matrix row 2). Type a *long* description before opening the sheet. A route push would clear it; a `Modal` cannot. This single check is BRD `:638`.
6. **Check iOS modal-over-modal explicitly** (matrix row 3) on a real device or simulator, not web. This is the one behaviour that differs by platform, and the Edge Cases entry gives the fix if it fails.
7. **Regression — `/customers/new` and `/customers/edit/[id]`** (matrix rows 12–13). Task 1 deliberately does not touch `CreateCustomerScreen`, but it copies from it; confirm nothing was moved out from under it.
8. **Regression — the Customers tab list.** `useCreateCustomer` is unchanged, so a customer created inline must appear on the tab exactly as one created from `/customers/new` does.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:636-638` (US-013).

- [ ] Given the customer picker, when no match is found, then a **New customer action is offered**
- [ ] Given I create a customer inline, when saved, then **they are selected on the ticket form**
- [ ] Given I create a customer inline, when I return, then **previously entered ticket fields are preserved**

Plus, from the intake and this plan:

- [ ] The form is **presented as a modal/sheet, not a navigation push** — `CreateTicketScreen` never unmounts
- [ ] `CustomerForm` and `useCreateCustomer` are **reused**; no field, validation rule or mutation is duplicated
- [ ] `CustomerForm` itself is **not** exported from the customers barrel
- [ ] `CreateCustomerSheet` lives in `features/customers/`, and `features/tickets` reaches it **through the barrel only**
- [ ] The sheet's body unmounts on close — a cancelled draft and a stale error never survive into the next open
- [ ] `onRequestClose` is wired, so Android back closes the sheet
- [ ] `initialValues` is memoised on `initialFullName` — no inline literal
- [ ] `toListItemFromDetail` exists as a pure mapper; `CustomerListItem` was **not** widened and the picker's props were **not** made a union
- [ ] Story 13's `// Navigates AWAY — inline creation is US-013 (SCRUM-29)` comment is gone
- [ ] **No new i18n keys** — all four strings already existed
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] `CLAUDE.md`'s "Project status" records inline creation and closes story 13's open question 2

---

## Open questions — raise with design/product, do not resolve silently

1. **There is no Figma frame for this.** The intake says so outright, and this plan renders story 11's form full-screen over the ticket form. Design has not seen: whether it should be a full-height sheet (this plan), a partial-height sheet with a scrolling form, or a reduced form with only name and phone. **A reduced form is a real option worth asking about** — an agent mid-call needs a name and a number, and secondary contacts, email and the inherited department/branch block are all things they can fill in later from the customer profile. This plan reuses the full form because the intake says "do not duplicate the form fields or validation logic", but "reuse the form" and "show every field" are not the same instruction.
2. **Two `+ New customer` controls now exist on one screen.** Figma draws one (`102:987`, under the customer card); BRD `:636` requires one in the picker's empty state. Both are built here. Confirm design wants both, or wants the card link removed now that the picker offers it in the moment it is actually needed.
3. **A phone-shaped search term is discarded, not routed.** `prefillName` returns `''` when the term contains a digit, so an agent who searched `01001234567`, found nothing, and tapped `+ New customer` retypes the number. Routing it to the **phone** field instead is ~3 lines, but the term may be a partial number, and a prefilled phone that fails `PHONE_PATTERN` on save reads as the app's mistake rather than the agent's. **Product call.** Note the same term could equally be an email, which has a third destination.
4. **Cancel still discards silently.** Story 11 filed this (its flag 7) and story 13 filed it again (its flag 6) — **this is the third story to raise it**, and it is sharpest here: an agent can now lose a half-typed *customer* on top of a half-typed *ticket*, from a form opened mid-call. A confirmation on `formState.isDirty` is ~15 lines and would reuse `ProfileScreen`'s sign-out `BottomSheet` pattern. It should be decided once, for all three forms, and this story is a good moment to decide it.
5. **The created customer is never opened.** `/customers/new` redirects to the profile; this sheet does not, by design — returning to the ticket is the point. But an agent who mistypes a name has no path to fix it without abandoning the ticket. **Ask whether the selected-customer chip should become tappable** (to `/customers/[id]`, or to `/customers/edit/[id]`); it is out of scope here, but it is the natural follow-up and touches story 10's screen.
6. **`openTicketCount: 0` is asserted, not fetched.** True for a customer created seconds ago. It is worth confirming that nothing downstream treats a `CustomerListItem` from this path as authoritative for anything but the chip label — today nothing does, because `CreateTicketScreen` only reads `id` and `fullName` from it (`:74`, `:168`).
7. **Modal-over-modal is a platform behaviour this repo has not exercised before.** `BottomSheet`, `CustomerPickerSheet`, `CategoryPickerSheet`, `AssignAgentSheet` and `ChangeStatusSheet` are all single-level. Task 5d is the first two-level presentation. If iOS misbehaves, the fallback (a timed deferral) is in Edge Cases — but the structural alternative is to move the picker's create action **out** of the picker and rely on the card link alone, which costs BRD `:636`. Flag the tradeoff rather than silently dropping the criterion.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 17.**
