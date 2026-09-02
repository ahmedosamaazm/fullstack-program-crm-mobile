# Story 20 — New ticket quick action (Story: SCRUM-39)

> Intake: `.squad/stories/home/SCRUM-39/intake.md`
> Figma: **no distinct frame.** The intake says so — this is the FAB already present on the Home
> (`7:8`) and Tickets frames, routing to the Create Ticket frame story 13 built.

## Read this before anything else

The intake is right, including about *which* story shipped this:

> *"Already implemented, but via a different story than SCRUM-30/Home: per SCRUM-28's plan overview,
> 'the two FABs on Home and the Tickets tab both retarget at the new /tickets/new modal' — this was
> a side effect of building Create Ticket, not something SCRUM-30 or the Home stories touched
> directly."*

Confirmed, and it matters for the tracker: **SCRUM-39 was closed by SCRUM-28**, not by any story in
this `home` folder. Story 03 built the FAB but routed it at the Tickets tab as an interim (its own
overview: *"US-022 / US-017 new ticket — the FAB renders but is routed at the Tickets tab as an
interim"*), and story 13 retargeted both.

Both acceptance criteria pass on `main`:

| Criterion (`docs/phase1_brd_1.md:764-765`) | Status | Evidence |
|---|---|---|
| `:764` Home or Tickets tab shows a New Ticket action | **Met** | `home/screens/HomeScreen.tsx:178` and `tickets/screens/TicketsScreen.tsx:149` — a `FAB` on each, both from `@/core/components` (`HomeScreen.tsx:7`, `TicketsScreen.tsx:11`) |
| `:765` Tapping it opens the ticket creation screen | **Met** | Both call `router.push('/tickets/new')` (`HomeScreen.tsx:179`, `TicketsScreen.tsx:150`), which resolves to `src/app/tickets/new.tsx` → `CreateTicketScreen` |

**This is the smallest story in the batch: two taps and a state check.** It builds nothing, and its
entire value is the third thing the intake asks for, which is not in the BRD at all —

> *"3. Both land on the same screen with an empty form — no leftover state from wherever the FAB
> was tapped."*

That is a real question with a non-obvious answer, because `/tickets/new` is a **modal route on a
stack**, and a stack screen that is pushed, dismissed and pushed again is not guaranteed to remount.
Verification step 3 is the whole story.

---

## Prerequisites

- **Story 13 completed** — [`../tickets/13-story-create-a-ticket-SCRUM-28.md`](../tickets/13-story-create-a-ticket-SCRUM-28.md). It built `/tickets/new` and retargeted both FABs, closing this story as a side effect. Its overview names the mislabelled comment it fixed in passing: `HomeScreen.tsx:159` had said `TODO(US-017)` when the FAB is **US-022**.
- **Story 03 completed** — [`03-story-home-workload-summary-SCRUM-37.md`](03-story-home-workload-summary-SCRUM-37.md). Built Home's FAB and the interim routing story 13 replaced.
- **Story 04 completed** — [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md). Built the Tickets tab's FAB, also inert until story 13.
- **Story 16 completed** — [`../tickets/16-story-create-a-customer-inline-SCRUM-29.md`](../tickets/16-story-create-a-customer-inline-SCRUM-29.md). It added a `CreateCustomerSheet` **inside** `CreateTicketScreen`, which introduces a second kind of state that must not leak across dismissals. Verify after 16, not before — see verification step 4.
- **A seeded department** with at least one category and one customer, so the create form is usable enough to dirty and then abandon.

---

## Story Goal

Confirm an agent can start a ticket from either place they spend their time, and that the form they
land on is always empty. Concretely:

1. **Both entry points are exercised** — Home's FAB and the Tickets tab's FAB — rather than one being assumed from the other.
2. **The form is proven clean on a second open**, including after a dirtied-then-abandoned first attempt, which is the case the BRD does not cover and the intake does.
3. **Story 16's inline customer sheet is confirmed not to survive a dismissal**, since it is new state inside the same screen.
4. **Any leak found is filed as a defect against story 13's screen**, not patched under this story.

**Not in scope**: a FAB anywhere else (BRD `:764` names exactly two surfaces; Customers and Profile
have none and should not), the create form's own behaviour (story 13 owns it), and draft
persistence across dismissals — which is the *opposite* of criterion 3 and is a real product
question, filed as open question 2.

---

## Context — Read These Files First

1. `src/features/home/screens/HomeScreen.tsx:178-182` — the FAB and its `router.push('/tickets/new')`. Confirm story 13's `TODO(US-017)` comment is gone; its presence would mean story 13 was only partly applied.
2. `src/features/tickets/screens/TicketsScreen.tsx:149-153` — the second FAB, same target. **Read both, not one** — the entire risk in this story is that the two call sites drifted, and reading one and inferring the other is exactly how that goes unnoticed.
3. `src/app/tickets/new.tsx` — the route file. Thin per hard rule 1: it imports `CreateTicketScreen` from the tickets barrel and renders it.
4. `src/app/_layout.tsx` — find the `tickets/new` entry inside the signed-in `Stack.Protected` block and confirm `presentation: 'modal'`. **Registration inside the guard is what stops a signed-out deep link reaching the create form**; a screen declared outside it leaks.
5. `src/features/tickets/screens/CreateTicketScreen.tsx:41-47` — the screen's local state: `customerPickerVisible`, `categoryPickerVisible`, `newCustomerName` (story 16), plus `customer` and `category` at `:46-47`. **These five `useState`s are what criterion 3 is really about** — they reset on unmount and only on unmount.
6. `src/features/tickets/screens/CreateTicketScreen.tsx:53-70` — the `useForm` call and its `defaultValues`. `mode: 'onSubmit'`, and `priority: 'medium'` per BRD `:617`. A remounted screen re-runs this; a reused one does not.
7. `docs/phase1_brd_1.md:756-765` — US-022 and its two criteria. `## Done Criteria` mirrors them, plus the intake's third check.

---

## Implementation tasks

**None. This story writes no application code.**

Say so in the PR description. If verification step 3 or 4 finds leftover state, that is a defect in
`CreateTicketScreen`'s lifecycle and it gets **its own task here**, with the plan edited to record
what was found — rather than a fix appearing under a heading that says nothing changed.

**No backend changes required.** No endpoint is involved; §4.7 is story 13's, and this story does
not submit the form.

---

## Edge Cases & Failure Modes

- **Push, dismiss, push again from the *same* FAB.** Expo Router's modal presentation unmounts the screen on dismiss, so all five `useState`s and the `useForm` re-initialise. **This is the assumption criterion 3 rests on, and verification step 3 is what turns it from an assumption into a fact.**
- **Push from Home, dismiss, push from the Tickets tab.** Two different call sites, one route. If the router reuses the screen instance, the second open shows the first's input — and it would be attributed to the "wrong" FAB, making it hard to diagnose. Matrix row 4.
- **Dismiss by swipe-down rather than the Cancel button.** A different dismissal path on iOS; both must unmount. Story 13's Cancel calls `router.back()`, but a swipe never reaches that handler. Matrix row 5.
- **Story 16's `CreateCustomerSheet` left open on dismissal.** `newCustomerName` is a `useState` on `CreateTicketScreen`, and the sheet is a `Modal` nested inside a modal route. Dismissing the *outer* route while the inner sheet is visible is a two-level teardown that nothing has exercised. Matrix row 6, and the reason this story is sequenced after 16.
- **Successful creation, then FAB again.** Story 13's `onSubmit` uses `router.replace` to `/tickets/[id]`, so the create screen is replaced rather than popped. Tapping the FAB from the detail screen's tab context must still push a **fresh** form. Matrix row 7.
- **FAB tapped twice rapidly.** Two pushes onto the stack, two create screens. Dismissing once leaves a second underneath. Cosmetic and self-correcting, but worth knowing it is possible — `router.push` has no guard. Open question 3.
- **Signed-out deep link to `/tickets/new`.** Blocked by `Stack.Protected` (context file 4). Verification step 5.
- **RTL.** Both FABs are positioned by the shared `FAB` core component, so a directional-offset bug would appear on both at once. Matrix row 8.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`), and this story adds no code, so it
adds no tests. Do not install one for two `router.push` call sites.

1. **Nothing here is unit-testable.** Both criteria are navigation, and the third check is a mount/unmount lifecycle question that needs a real navigator.
2. The matrix below is the test plan. **Rows 3–6 are the story**; rows 1–2 are the BRD criteria and will pass trivially.

| # | Scenario | Expected |
|---|---|---|
| 1 | Home → FAB visible | Present, bottom trailing corner |
| 2 | Tickets tab → FAB visible | Present, same position |
| 3 | Home FAB → type a subject → Cancel → Home FAB again | **Empty subject**, no category, priority back to **Medium** |
| 4 | Home FAB → type → Cancel → **Tickets tab** FAB | Empty form (cross-entry-point check) |
| 5 | Home FAB → type → **swipe down** to dismiss → FAB again | Empty form |
| 6 | Home FAB → open `+ New customer` sheet → dismiss the **whole** modal → FAB again | Empty form, **sheet not open** |
| 7 | Create a ticket successfully → from the detail screen, reach a tab → FAB | Fresh empty form |
| 8 | Switch to العربية, restart, repeat 1–3 | FAB on the correct side; form empty |
| 9 | Regression: both FABs still route to `/tickets/new`, not the Tickets tab | Story 03's interim routing is gone |

---

## Verification Steps

1. **Read both call sites and diff them by eye.** `grep -n "tickets/new" src/features/home/screens/HomeScreen.tsx src/features/tickets/screens/TicketsScreen.tsx` — expect exactly one hit in each, both `router.push('/tickets/new')`. **This is the intake's steps 1 and 2, and it is a 10-second check that is the entire BRD scope of this story.** Record that both were read, not one.
2. **Confirm the object-form navigation rule does not apply here.** `typedRoutes` is on, and `CLAUDE.md` requires `router.push({ pathname, params })` for **parameterised** routes. `/tickets/new` is static, so a bare string is correct and consistent with the rest of the repo. Do not "fix" it into the object form.
3. **Prove the form is clean on reopen** (matrix row 3) — the intake's step 3, and the only part of this story that can fail. Type into **subject**, pick a **category**, and set priority to **Urgent** before cancelling. A form that only clears its text fields but keeps the category chip or the priority selection is a partial pass and a real defect: `category` is a separate `useState` (`CreateTicketScreen.tsx:47`) from the RHF form state, so the two can plausibly diverge.
4. **Prove story 16's sheet does not survive** (matrix row 6). Open `+ New customer`, type a name, then dismiss the **outer** modal without closing the sheet first. Reopen. Both the sheet's visibility and its draft must be gone. This is the newest state in the screen and the least exercised.
5. **Confirm the route is inside the guard** (context file 4). Sign out, then attempt to deep-link `/tickets/new`. It must land on Login, not the create form. This is not a US-022 criterion, but it is a one-minute check on a route this story is auditing anyway.
6. **Typecheck and lint:** `npm run typecheck` and `npm run lint` — both zero errors. Expected clean; run them so the PR has a gate.
7. **Frontend runs:** `npm start`, `a` and `i`. Walk the full matrix. **iOS and Android dismiss modals differently** — row 5's swipe is iOS-specific and row 5's Android equivalent is the hardware back button; do both.
8. **Regression — Home's other navigation.** Story 15 parameterised the Tickets tab with `filter`/`nonce` for Home's two "View all" links. Confirm those still work after tapping the FAB and coming back; a stale `nonce` would show as "View all" silently doing nothing.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8 — the review output is the record that this verification happened on a zero-diff story.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:764-765` (US-022).

- [ ] Given Home or the Tickets tab, when displayed, then **a New Ticket action is visible**
- [ ] Given the action, when tapped, then **the ticket creation screen opens**

Plus, from the intake's third check and this plan:

- [ ] **Both** FABs were tapped and observed — neither was inferred from the other
- [ ] A **dirtied then abandoned** form does not reappear on the next open, including the **category chip** and the **priority selection**, not just the text fields
- [ ] The form is clean across **entry points** (Home → Tickets tab), not only on repeat from the same FAB
- [ ] Dismissal by **swipe (iOS)** and **hardware back (Android)** both clear the form, not only the Cancel button
- [ ] Story 16's `CreateCustomerSheet` does not survive an outer-modal dismissal
- [ ] `/tickets/new` is registered **inside** `Stack.Protected` — a signed-out deep link lands on Login
- [ ] Story 03's interim "FAB routes to the Tickets tab" behaviour is gone from **both** call sites
- [ ] **No application code was changed**, and the PR description says so
- [ ] Any leftover-state leak was **filed as a defect against story 13's screen**, not patched here

---

## Open questions — raise with design/product, do not resolve silently

1. **This story was closed by SCRUM-28 and nobody moved the ticket.** SCRUM-39 is still `To Do` in `docs/remaining-stories.csv:184` while the code has shipped. **It is the fifth tracker item in this repo in that state** — SCRUM-31, SCRUM-32, SCRUM-35 and SCRUM-36 are the others, and story 17's open question 7 lists them. This is a process finding, not a technical one, and it wants one tracker pass rather than five stories that each rediscover it.
2. **Criterion 3 and "do not lose my input" point in opposite directions.** This story verifies the form is **empty** on reopen. Story 16 (US-013) exists because an agent mid-call must **not** lose half-typed input. Both are correct — 16 protects input across an *inner* sheet, this protects against stale input across a *dismissal* — but the boundary is a product decision nobody has stated: should cancelling a half-written ticket offer to keep the draft? Story 13's open question 6 and story 16's open question 4 both filed the "Cancel discards silently" concern. **This is the third story to touch it, and it should be settled once for all three forms.**
3. **A double-tapped FAB pushes two create screens.** `router.push` has no in-flight guard, and the FAB has no disabled state. The second screen sits under the first and appears on dismissal. Cheap to fix (`router.navigate`, or a debounce) but it is a change to story 13's screens, so it needs a decision rather than a drive-by edit. Low severity; note it and let product weigh it.
4. **The BRD names two surfaces, and there are exactly two — for now.** BRD `:764` says "Home or the Tickets tab". Once Customers gains a "new ticket for this customer" action (a natural place for it, and arguably a better one than either FAB), this criterion's wording will be stale and the customer-prefilled path will have no story. Worth confirming whether that is deliberate deferral or an oversight.
