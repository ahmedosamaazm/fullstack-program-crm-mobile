# Customers — New / Edit customer — design audit

**Figma:** `7:2799` ("Customers - New Customer") · **Code:** `src/features/customers/components/CustomerForm.tsx`
**Verdict:** minor drift

## Summary

The shared `CustomerForm` is a close, token-clean reflection of frame `7:2799`: field order,
labels, placeholders, the uppercase/tracked label treatment, the 48h field, `radius.md`, the
bordered secondary-contacts card, the `+ Add contact` link and the `ModalHeader` chrome all
resolve to the exact tokens Figma bound, and every colour in the frame (`#f8f9fb`, `#ffffff`,
`#e8ebf0`, `#e3e5ea`, `#6b6e76`, `#9c9fa7`, `#1a56db`) matches its semantic token 1:1. Three
findings are graded `major` — a wrong padding token inside `TextField`, a `Save` action that is
never greyed for an invalid form (the frame's default rendering shows it grey), and a
duplicate-phone error that fails to re-appear on a second identical submit — but each is a
localized fix; nothing about the screen's structure, ordering, typography or palette deviates
from the frame. The single most important thing to fix is `TextField`'s horizontal padding,
because it is 4px off on every input in the app, not just here.

## Findings

### 1. `Save` is never greyed for an invalid form — `major`
- **Axis:** states / component identity
- **Figma:** `ModalHeader` (`96:940`) is documented "Action=Disabled greys the action until the
  form is valid", and the frame renders the empty form with `Save` in `colors.textDisabled`
  (`#9c9fa7`) — node `I99:918;96:937`. Story 11's element table repeats it: "`Save` when the form
  is invalid | grey | `actionDisabled` → `tone="disabled"`".
- **Code:** `src/features/customers/components/CustomerForm.tsx:95` —
  `actionDisabled={submitting || !ready}`. Form validity is never consulted, so on first paint of
  an empty form `Save` renders in `textLink` blue, not grey. `mode: 'onSubmit'`
  (`CustomerForm.tsx:77`) means `formState.isValid` is also not tracked as designed.
- **Fix:** switch the form to `mode: 'onTouched'` (or read `formState.isValid` under
  `mode: 'onChange'`) and add `|| !isValid` to `actionDisabled`.

### 2. `TextField` inner padding uses `spacing.md`, Figma bound `spacing.lg` — `major`
- **Axis:** token fidelity
- **Figma:** every Field node on this frame — `I77:663;72:606`, `I77:667;72:606`,
  `I77:671;72:606`, `I99:942;72:606`, `I99:946;72:606` — is
  `px-[var(--spacing.lg,16px)] py-[var(--spacing.sm,8px)]`. `get_variable_defs` confirms
  `spacing.lg = 16` is bound to this screen.
- **Code:** `src/core/components/TextField.tsx:87` — `paddingHorizontal: theme.spacing.md` (12).
  A 4px inset error on all five inputs on this screen, and on every `TextField` in the app.
  Story 01's spec table (`design-system/01-…md:140`) never recorded the field's pad-x, so this
  was never a deliberate call.
- **Fix:** change `TextField.tsx:87` to `paddingHorizontal: theme.spacing.lg`.

### 3. A repeated duplicate-phone conflict shows no error — `major`
- **Axis:** states
- **Figma:** n/a (error states are §15 flag 6), but story 11 makes the duplicate-phone field error
  "the intake's central requirement and the one most likely to be silently broken".
- **Code:** `src/features/customers/components/CustomerForm.tsx:82-86` — the `setError('phone', …)`
  effect is keyed on the *boolean* `phoneConflict`. `handleSubmit` clears field errors before each
  submit; if the agent resubmits the same duplicate phone, `phoneConflict` is still `true`, the
  dependency array does not change, the effect does not re-run, and the field error is gone with
  no replacement (the parent suppresses `formError` for conflicts —
  `CreateCustomerScreen.tsx:57`, `EditCustomerScreen.tsx:96`, `CreateCustomerSheet.tsx:105`).
- **Fix:** key the effect on the mutation's error identity (e.g. pass `create.error` down, or add a
  `conflictNonce` incremented per failed submit) so an identical second failure re-sets the error.

### 4. Required marker is appended to the label; the frame has none — `minor`
- **Axis:** structure / component identity
- **Figma:** labels read exactly `FULL NAME`, `PHONE`, `EMAIL` (nodes `I77:663;72:605`,
  `I77:667;72:605`, `I77:671;72:605`). No asterisk, no "(required)", and no visual distinction
  between the required (name, phone) and optional (email) fields.
- **Code:** `src/core/components/TextField.tsx:78-81` appends `` * (${t('field.required')}) `` and
  `styles.label` (`TextField.tsx:132`) uppercases the whole string, so `required` fields render
  `FULL NAME * (REQUIRED)` / `PHONE * (REQUIRED)`. Passed at
  `CustomerForm.tsx:126` and `CustomerForm.tsx:149`.
- **Fix:** design decision — either add a required treatment to the Figma `TextField` component, or
  move the marker to `accessibilityLabel` only so the visible label matches the frame.

### 5. Form column vertical padding is off the frame's values — `minor`
- **Axis:** token fidelity
- **Figma:** the form container `7:2834` is `pt-[20px] pb-[32px] px-[16px]`.
- **Code:** `src/features/customers/components/CustomerForm.tsx:105-106` — `padding: theme.spacing.lg`
  (16 on all edges, so top is 16 not 20) and `paddingBottom: theme.spacing.xxxl` (48 not 32).
- **Fix:** `paddingTop: theme.spacing.xl` (24, the same 4px snap story 11 already accepted for the
  block gap) and `paddingBottom: theme.spacing.xxl` (32) — or record the 48 as deliberate keyboard
  clearance in the story plan.

### 6. Field/card borders are `hairlineWidth`, Figma specifies 1px — `minor`
- **Axis:** token fidelity
- **Figma:** `stroke weight/1` is bound to this frame; the Field and the contacts card both carry a
  1px `colors.borderDefault` stroke.
- **Code:** `src/core/components/TextField.tsx:132` and
  `src/features/customers/components/CustomerForm.tsx:202` use `StyleSheet.hairlineWidth`
  (0.5 at @2x, 0.33 at @3x). Story 11's element table explicitly sanctions the hairline for the
  contacts card, so this is only reported for the app-wide convention, not as a screen defect.
- **Fix:** none for this screen — confirm once, project-wide, that hairline is the accepted
  reading of Figma's `stroke weight/1`.

### 7. §15 flag 6 — Figma has no error / disabled / loading variants — `flag`
- **Axis:** states / open design flags
- **Figma:** frame `7:2799` draws the form resting, empty and valid. `TextField` (`72:618`),
  `Button` (`71:615`) and `ModalHeader` (`96:940`, apart from Action=Disabled) ship no error,
  disabled or loading variant.
- **Code:** because this is a React Hook Form screen the states are real and are implemented —
  field error via `statusDanger` border + `caption`/`danger` line (`TextField.tsx:95, 128-134`),
  form-level error (`CustomerForm.tsx:317-321`), profile-load error with retry
  (`CustomerForm.tsx:304-315`), pending profile skeletons (`CustomerForm.tsx:279, 292`), edit-screen
  loading/not-found/error (`EditCustomerScreen.tsx:62-88`). Coverage is good; the one gap is
  finding 3, and there is no busy indicator on `Save` while `submitting` — only the greyed label
  (`CustomerForm.tsx:95`). Figma should gain these variants rather than let the app drift.
- **Fix:** design decision, not a code fix — send the error/disabled/loading variants back to Figma.

### 8. §15 flag 3 — Arabic uppercase + `tracking.wide` on every field label — `flag`
- **Axis:** open design flags
- **Figma:** all labels are `uppercase` with `tracking.wide` (0.6).
- **Code:** applied unconditionally in `src/core/components/TextField.tsx:75, 132` and again on the
  section label at `CustomerForm.tsx:191, 329`. Arabic has no case and letter-spacing pulls joined
  letterforms apart, so in `ar` these seven labels render looser and with no case effect.
- **Fix:** design decision — locale-aware tracking token, or an explicit accept.

### 9. §15 flag 5 — `IconButton size={32}` for the remove-contact affordance — `flag`
- **Axis:** open design flags
- **Code:** `src/features/customers/components/CustomerForm.tsx:251-257` renders `IconButton` at
  size 32 (the `Button` `icon` geometry) rather than the standalone `IconButton` 36. The control
  does not exist in Figma at all, so nothing binds it either way — it lands squarely on the open
  "two components, one concept, 4px apart" question.
- **Fix:** resolve flag 5 first; this call follows whatever it decides.

### 10. Department and branch are read-only rows, not selects — `intentional`
- **Axis:** structure
- **Figma:** `99:922` / `99:933` are `TextField` selects with a chevron and
  `Select department` / `Select branch` placeholders.
- **Code:** `src/features/customers/components/CustomerForm.tsx:274-302` — two `DetailRow`s fed by
  `useAgentProfile()`, plus an `inherited` caption. Story 11 task 4 / open question 1: RLS rejects
  any other value (API §3.3), so a picker would only manufacture a 403.

### 11. Block gap is `spacing.xl` (24) where Figma is 20 — `intentional`
- **Axis:** token fidelity
- **Code:** `src/features/customers/components/CustomerForm.tsx:107`. Story 11's element table:
  "Block → block gap | 20 | `spacing.xl` (24) — 4px drift, accepted".

### 12. The contacts card is absent on a fresh form — `intentional`
- **Axis:** structure
- **Figma:** `7:2857` shows one pre-populated empty contact pair.
- **Code:** `src/features/customers/components/CustomerForm.tsx:196` renders the card only when
  `fields.length > 0`, and `secondaryContacts` starts `[]` (`CreateCustomerScreen.tsx:22`,
  `CreateCustomerSheet.tsx:88`). Story 11 §5b: "a blank pair on a form where the field is optional
  reads as required".

### 13. Remove-contact `×` button not in Figma — `intentional`
- **Axis:** structure — `CustomerForm.tsx:249-257`, story 11 open question 6.

### 14. `CreateCustomerSheet` uses `Modal` + `ModalHeader`, not `BottomSheet` + `SheetHeader` — `intentional`
- **Axis:** component identity
- **Code:** `src/features/customers/components/CreateCustomerSheet.tsx:48-56`. Documented in the
  file and in story 16: `CustomerForm` renders its own `ModalHeader` and a `flex: 1`
  `KeyboardAvoidingView`, which measures to zero inside `BottomSheet`'s auto-height padded `View`.
  The result is the correct chrome — the inline path renders the *same* frame `7:2799` header, so
  all three presentations are chrome-identical. `SheetHeader` and `TextArea` are correctly not used
  by this screen; the frame implies neither.

### 15. Duplicate phone surfaces as a field error on phone — `intentional`
- **Axis:** states — `CustomerForm.tsx:82-86` + `CustomerPhoneConflictError`; story 11 task 2
  (Postgres `23505` on `unique (branch_id, phone)`).

## Verified correct

- **Field order and copy** match `7:2799` exactly: Full name → Phone → Email → Secondary contacts →
  Department → Branch, with placeholders `First and last name` / `+20 10 0000 0000` /
  `name@company.com` / `Contact name` / `Phone number` (`en.json:314-333`).
- **Label treatment** — `fontSize.xs` / `lineHeight.xs` / semibold / uppercase / `tracking.wide` /
  `textMuted` — matches `I77:663;72:605` on both `TextField` (`TextField.tsx:70-82`) and the
  hand-rolled "Secondary contacts" label (`CustomerForm.tsx:187-194`).
- **Field geometry** — 48h (`TextField.tsx:36`), `radius.md`, `bgSurface`, `borderDefault`, inner
  `gap: spacing.sm`, value `fontSize.md`/`lineHeight.md`/regular — all match.
- **Contacts card** — `radius.md`, `padding: spacing.md` (12, = Figma's `p-[12px]`), row
  `gap: spacing.sm`, `borderDefault`, `bgSurface`, and `spacing.sm` from the section label and to
  the link (`CustomerForm.tsx:186, 198-206`).
- **`+ Add contact`** is the real `Button variant="link"` (`CustomerForm.tsx:264-268`) →
  `callout`/semibold/`textLink` (`Button.tsx:66-79`), matching `I99:950;71:607`. The `+` is part of
  the translated label, as in the frame.
- **`ModalHeader`** is the real primitive in all three presentations, with Figma's
  `sm`/Medium/`textSecondary` Cancel, `md`/SemiBold/`textPrimary` title and
  `sm`/SemiBold/`textLink`→`textDisabled` action (`ModalHeader.tsx:52-71`); the documented 6/12 →
  `sm`/`md` pad-y snap is recorded in its own docblock.
- **Colour fidelity, both themes** — every value Figma bound resolves through a semantic token with
  a byte-exact light-palette match: `bgCanvas`=`#f8f9fb`, `bgSurface`=`#ffffff`,
  `borderSubtle`=`#e8ebf0`, `borderDefault`=`#e3e5ea`, `textMuted`=`#6b6e76`,
  `textDisabled`=`#9c9fa7`, `textLink`=`#1a56db` (`colors.ts:10, 26-27, 34-35, 37`;
  `primitives.ts:16-32`). No hex literal anywhere in the six audited files; all three screens set
  `backgroundColor: theme.colors.bgCanvas` and dark resolves through the same aliases.
- **RTL** — no physical layout props in any of the six files; only `flexDirection: 'row'`,
  `gap`, and symmetric `padding` (`CustomerForm.tsx:328-332`, `TextField.tsx:130-134`,
  `ModalHeader.tsx:74-78`). No direction-implying icons on this screen.
- **Single-font rule** — every string goes through `core/components/Text`; `TextInput` is the core
  primitive, imported via the barrel (`CustomerForm.tsx:6-15`).
- **Shared form across three hosts** — `CreateCustomerScreen`, `EditCustomerScreen` and
  `CreateCustomerSheet` all pass the same props into one `CustomerForm`, so the fields, validation
  and contacts editor exist exactly once; the only per-host differences are `title`,
  `initialValues` and the success navigation.

## Needs a visual check

- **iOS `pageSheet` + `SafeAreaView edges={['top']}`** — `CreateCustomerSheet.tsx:48` presents a
  `pageSheet` whose body already sits below the status bar, while
  `CreateCustomerSheetBody` (`:96`) still applies a top safe-area inset. On a notched device this
  may double the gap above `ModalHeader` relative to the `customers/new` route. Cannot be settled
  statically.
- **Android keyboard behaviour** — `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`
  (`CustomerForm.tsx:100`) makes `KeyboardAvoidingView` a no-op on Android; whether Department /
  Branch stay reachable with the keyboard up depends on the window soft-input mode.
- **`ModalHeader` title truncation in Arabic** — `numberOfLines={1}` with `minWidth: 44` side slots
  (`ModalHeader.tsx:63, 76`); the Arabic title plus a longer Cancel/Save pair may clip.
