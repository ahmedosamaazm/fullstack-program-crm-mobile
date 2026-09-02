# Story 19 — Claim an unassigned ticket (Story: SCRUM-36)

> Intake: `.squad/stories/home/SCRUM-36/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:8` (Home). **No new frame** — this is the Claim
> button story 03 already built on the Unassigned section.

## Read this before anything else

The intake is right, and it says so itself: *"Already implemented — `claimTicket(ticketId, userId)`
in `api.ts:272` … Before planning anything: confirm this exists first. If it does, verify rather
than build."*

Confirmed. **All five acceptance criteria are satisfied by code on `main`**, built by story 03
(`../home/03-story-home-workload-summary-SCRUM-37.md`), which created `src/features/tickets/`
including the claim mutation before the Tickets tab existed:

| Criterion (intake `:73-77`) | Status | Evidence |
|---|---|---|
| Tap Claim → ticket assigned to me | **Met** | `tickets/api.ts:272-281` — `claimTicket` updates `assigned_to`; `tickets/hooks.ts:129-140` — `useClaimTicket` supplies `session.user.id` |
| Moves from Unassigned to My tickets | **Met** | `hooks.ts:137` invalidates `ticketKeys.all`, which both preview lists read |
| My open and Unassigned counts update | **Met** | Same invalidation — `ticketKeys.all` is the prefix of all five count keys (`hooks.ts:39-47`) |
| An `assigned` event is recorded | **Met (server-side)** | The `log_ticket_assignment` trigger, per `docs/phase1_api_reference.md:289`. No client code writes it |
| Another agent claims first → I am told | **Met** | `api.ts:274-280` — compare-and-set `.is('assigned_to', null)` with `count: 'exact'`, throwing `TicketAlreadyClaimedError` on zero rows; `home/screens/HomeScreen.tsx:45-47` maps it to `home.claim.taken` ("Someone else claimed this ticket.", `en.json:86`) and renders it at `:162-171` |

**So this story builds nothing.** It is the verification the intake asks for — and specifically the
race, which the intake correctly identifies as *"the one part of this story that's easy to
implement but hard to prove works."* The compare-and-set is written and commented; **nobody has
ever fired two concurrent claims at it.**

If you find yourself editing `claimTicket`, `useClaimTicket` or `HomeScreen`'s claim block, stop —
the work is a Postman/`curl` race and a two-device walkthrough, not a diff.

---

## Prerequisites

- **Story 03 completed** — [`03-story-home-workload-summary-SCRUM-37.md`](03-story-home-workload-summary-SCRUM-37.md). It built every line in the table above. Its own open questions note *"the absence of a BRD acceptance criterion for claiming from Home"* — see open question 1, which this story resolves.
- **Story 15 completed** — [`15-story-my-tickets-preview-SCRUM-38.md`](15-story-my-tickets-preview-SCRUM-38.md). It changed which cache entry Home's My-tickets preview reads (dropping the `limit` argument so Home and the Tickets tab share `['tickets','list','mine',<uid>,null,'']`). **That change is upstream of criterion 2** — the "moves from Unassigned to My tickets" behaviour now depends on a shared entry, so verify after 15, not before.
- **Story 08 completed** — [`../tickets/08-story-assign-a-ticket-SCRUM-33.md`](../tickets/08-story-assign-a-ticket-SCRUM-33.md). Not a dependency of the claim itself, but it generalised the same compare-and-set discipline into `assignTicket`, and its open question 5 records the ambiguity this story's verification step 3 has to work around: *"'assignment changed' and 'RLS refused the row' reach the client as the same zero-row result."*
- **Two agent accounts in the same department**, and **at least three unassigned tickets** in that department. The race cannot be tested with one identity, and a single unassigned ticket leaves nothing to claim after the first attempt.
- **A Postman collection or `curl` with two agent JWTs.** Verification step 3 needs two near-simultaneous requests; two humans tapping phones is not tight enough to prove anything.

---

## Story Goal

Prove — not implement — that an agent can pick up waiting work from Home, that the numbers move
with it, and that two agents racing for the same ticket produce one winner and one clear message.
Concretely:

1. **The happy path is walked end to end**, with all three Home counts and both preview lists confirmed to update from a single claim.
2. **The race is fired for real** and the loser is confirmed to get `TicketAlreadyClaimedError` — not a silent success, not a second row, not a reassignment.
3. **The `assigned` event is confirmed present** in `ticket_events` after a claim, since no client code writes it and the trigger is the only evidence.
4. **Any gap found is filed, not quietly patched.**

**Not in scope**: claiming from the Tickets tab (story 04 left the Unassigned filter read-only and
said so; reassignment from the detail screen is story 08's sheet), optimistic UI on the claim
button (see open question 3), and any change to the invalidation breadth (see open question 2).

---

## Context — Read These Files First

1. `src/features/tickets/api.ts:259-281` — `TicketAlreadyClaimedError` and `claimTicket`. Read the doc comment at `:266-270`: *"the `assigned_to is null` predicate means a ticket someone else already took updates zero rows instead of being silently reassigned."* **`{ count: 'exact' }` at `:275` is what makes the zero-row case detectable** — without it `count` is `null` and `if (!count)` would throw on every successful claim. Verification step 3 is what proves that pairing works.
2. `src/features/tickets/hooks.ts:129-140` — `useClaimTicket`. Note `:135` casts `session?.user.id` with `as string`; a claim fired while signed out sends `undefined` and fails at the database rather than in the client. Not a defect this story fixes, but know it before reading an error.
3. `src/features/tickets/hooks.ts:38-51` — `ticketKeys`. **`ticketKeys.all` is `['tickets']`**, and every list and count key starts with it, so the single invalidation at `hooks.ts:137` reaches all six Home queries. The intake's step 3 asks you to confirm exactly this; the key shape is the proof, and verification step 2 is the demonstration.
4. `src/features/home/screens/HomeScreen.tsx:45-47` — `claimErrorMessageKey`, which special-cases `TicketAlreadyClaimedError` to `home.claim.taken` before falling through to the generic `errorMessageKey`. **This is criterion 5's entire implementation.**
5. `src/features/home/screens/HomeScreen.tsx:155-171` — the Unassigned rows, `onClaim={claim.mutate}`, the per-row `claiming` flag at `:159` (`claim.variables === ticket.id`, so only the tapped row shows a spinner), and the error line at `:162-171`.
6. `src/core/lib/i18n/locales/en.json:84-86` and the Arabic counterpart — `home.claim.taken` = "Someone else claimed this ticket."
7. `docs/phase1_api_reference.md:289` — §4.8, and the sentence that closes criterion 4: *"Supports **US-017 (assign)** and **US-029 (claim)**. The `log_ticket_assignment` trigger writes the history entry automatically."*
8. `docs/phase1_api_reference.md:373` — §6's isolation matrix row 7. Read it before step 3 so you can distinguish an RLS refusal from a lost race; both are zero rows.

---

## Implementation tasks

**None. This story writes no application code.**

State that explicitly in the PR description rather than leaving an empty diff to be interpreted.
If verification turns up a real defect, it gets its own task here — and the plan gets edited to
say what it was, rather than the fix landing silently under a "verification" heading.

**No backend changes required.** The trigger already exists; §4.8 is marked ✅.

---

## Edge Cases & Failure Modes

- **Two agents claim within milliseconds.** One `UPDATE … WHERE assigned_to IS NULL` matches, one matches zero rows. The loser gets `TicketAlreadyClaimedError` → "Someone else claimed this ticket." **This is the story**; verification step 3 is the only thing that proves it.
- **An agent claims a ticket they already own.** `assigned_to` is not null, so zero rows, so they are told someone else claimed it — which is wrong copy for that case. **Unreachable from Home** (the Unassigned list only renders `assigned_to IS NULL` rows) but reachable via a stale list after a background refetch. See open question 4.
- **RLS refuses the row** (a ticket in another department that leaked into a stale list). Zero rows, identical to a lost race, same message. Story 08 filed this as its open question 5; it is unchanged here and the copy is worded for the common case.
- **The claim succeeds but the invalidation is missed.** Would show as a ticket that stays in Unassigned until a manual pull-to-refresh. Verification step 2 is what catches it, and it must be checked on **all six** queries — the ticket disappearing from Unassigned while "My open" stays stale is the exact partial failure the intake's step 3 is worried about.
- **Offline claim.** `claimTicket` throws a network `AppError`; `claimErrorMessageKey` falls through to `errorMessageKey` and renders the generic offline copy. The ticket stays in the list. Correct.
- **Claim fired while the session is expiring.** `userId` is `undefined`, the update sends `assigned_to: null` — which would *unassign* rather than claim, except the `.is('assigned_to', null)` predicate means it matches the row and writes null over null. Harmless, but it reports success for a no-op. Not reachable in practice (the guard re-parents the tree on `signedOut`), and story 18 tightens that path.
- **Rapid double-tap on Claim.** The second `mutate` fires while the first is in flight; the row's `claiming` flag disables the button (`HomeScreen.tsx:159`), so this needs a deliberate race. If it lands, the second is a lost race against yourself and shows "Someone else claimed this ticket." Cosmetically wrong, functionally safe. Open question 4.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`). This story does not add one — it
writes no code, and the behaviour it proves is a database race that a unit test cannot exercise
without a real Postgres.

1. **The compare-and-set is the one thing here that would repay an integration test**, against a real Supabase instance with two concurrent clients. That is a test-infrastructure story, not this one. Note it and move on.
2. The matrix below is the test plan. **Row 3 is the story.**

| # | Scenario | Expected |
|---|---|---|
| 1 | Home → Unassigned → tap Claim on a ticket | Row leaves Unassigned, appears under My tickets |
| 2 | Same, watching the three counts | **My open +1**, **Unassigned −1**, All unchanged — all without a manual refresh |
| 3 | Two JWTs, two `POST`s at the same ticket, fired together | One `200` with 1 row; one `200` with **0 rows** → client throws `TicketAlreadyClaimedError` |
| 4 | In-app: agent A claims, then agent B taps Claim on the same stale row | B sees "Someone else claimed this ticket."; the row does **not** move to B's list |
| 5 | After a successful claim, `GET /ticket_events?ticket_id=eq.<id>` | An `assigned` row exists with `to_value` = the claimer's id |
| 6 | Open the ticket detail after claiming | Header shows the claimer as assignee; History tab shows the `assigned` event **by name** (story 17) |
| 7 | Airplane mode, tap Claim | Generic offline error; ticket stays in Unassigned |
| 8 | Switch to العربية, restart, repeat 1 and 4 | Both work; the "already claimed" message reads correctly in Arabic |
| 9 | Regression: Tickets tab → Unassigned filter | Still read-only, no Claim affordance (story 04's documented scope) |

---

## Verification Steps

1. **Confirm the implementation exists before testing it**, as the intake instructs. `grep -n "claimTicket" src/features/tickets/api.ts src/features/tickets/hooks.ts src/features/tickets/index.ts` — expect the definition at `api.ts:272`, the hook at `hooks.ts:129`, and the barrel export. Record that this story found it already built; that finding is the story's main output.
2. **Prove the invalidation covers all six Home queries** (matrix row 2), which is the intake's step 3. Claim a ticket and watch, in one frame: the three `StatCard` counts, the My-tickets preview, and the Unassigned preview. **Do not accept "the ticket disappeared" as a pass** — that only proves the list the ticket left was refetched. The counts are the part that silently goes stale if the invalidation were narrower.
3. **Fire the race for real** (matrix row 3) — the intake's step 2, and the reason this story exists. With two agent JWTs and one unassigned ticket id:

   ```bash
   curl -s -o /dev/null -w 'A:%{http_code} ' -X PATCH \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT_A" \
     -H "Content-Type: application/json" -H "Prefer: return=representation" \
     -d '{"assigned_to":"'$AGENT_A'"}' \
     "$URL/rest/v1/tickets?id=eq.$TICKET&assigned_to=is.null" &
   curl -s -o /dev/null -w 'B:%{http_code}\n' -X PATCH \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT_B" \
     -H "Content-Type: application/json" -H "Prefer: return=representation" \
     -d '{"assigned_to":"'$AGENT_B'"}' \
     "$URL/rest/v1/tickets?id=eq.$TICKET&assigned_to=is.null" &
   wait
   ```

   **Record both response bodies.** The pass condition is *one* body with a ticket row and *one*
   empty array `[]` — both with `200`. Then `GET` the ticket and confirm `assigned_to` is whichever
   agent won and that it has **not** been overwritten. A result where both bodies contain a row is
   a serious defect: it means the `assigned_to=is.null` predicate is not being applied and the
   client's compare-and-set is decorative.
4. **Confirm the client surfaces the loss** (matrix row 4). The `curl` race proves the database; this proves `HomeScreen.tsx:45-47`. Claim as A on one device, then tap Claim on B's stale row before it refetches.
5. **Confirm the `assigned` event** (matrix row 5) — criterion 4, which no client code implements. If the row is absent, the `log_ticket_assignment` trigger is not firing on this path and **that is a backend defect to file**, not something to work around client-side.
6. **Typecheck and lint:** `npm run typecheck` and `npm run lint` — both zero errors. Expected to be trivially clean since nothing changed; run them anyway so the PR has a clean gate.
7. **Frontend runs:** `npm start`, `a` and `i`. Walk matrix rows 1, 2, 4, 6–9.
8. **Regression — story 15's shared cache entry.** Home's My-tickets preview and the Tickets tab now resolve to the same key. After claiming from Home, switch to the Tickets tab on Mine and confirm the ticket is there **without a refetch spinner** — that is what proves the shared entry actually got the invalidation.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8. Even on a zero-diff story — the review output is the record that the verification happened.

---

## Done Criteria

Mirrors the intake's acceptance criteria (`:73-77`). **US-029 does not appear in
`docs/phase1_brd_1.md`** — see open question 1 — so the intake and
`docs/remaining-stories.csv:176` are the only sources.

- [ ] Given an unassigned ticket on Home, when I tap Claim, then **the ticket is assigned to me**
- [ ] Given I claim a ticket, when the action completes, then **it moves from the Unassigned list to My tickets**
- [ ] Given I claim a ticket, when the counts refresh, then **My open and Unassigned both update**
- [ ] Given I claim a ticket, when it is saved, then **an `assigned` event is recorded in the ticket history**
- [ ] Given another agent claims a ticket first, when I tap Claim, then **I am told it is already assigned**

Plus, from the intake and this plan:

- [ ] The race was **fired concurrently with two JWTs**, and both response bodies are recorded in the PR
- [ ] Exactly one of the two racing requests returned a row; the other returned `[]`
- [ ] `assigned_to` after the race is the winner's id and was **not** overwritten
- [ ] All **six** Home queries were observed updating from one claim — counts included, not just the list the ticket left
- [ ] The `assigned` event was confirmed by querying `ticket_events` directly, not inferred from the UI
- [ ] **No application code was changed**, and the PR description says so
- [ ] Any defect found was **filed**, not silently patched under this story

---

## Open questions — raise with design/product, do not resolve silently

1. **US-029 is not in the BRD.** `grep -rn "US-029" docs/` returns hits in `phase_1_frontend_roadmap.md:214`, `phase1_api_reference.md:289` and `phase1_remaining_stories_status.md:80` — but **not** in `docs/phase1_brd_1.md`, which is where every other story's acceptance criteria live and which this repo's plans have treated as authoritative throughout. Story 03 already flagged this as *"the absence of a BRD acceptance criterion for claiming from Home."* The criteria in this plan come from the intake and the CSV export. **Either the BRD is missing a section or US-029 is a tracker-only story**; whichever it is, the BRD should say so, because the next planner will look there first and find nothing.
2. **`ticketKeys.all` is the widest possible invalidation, and it is used for a one-row change.** A claim refetches all five counts and both preview lists — six or seven requests for one `UPDATE`. That is deliberate (`hooks.ts:221-225` explains the reasoning for the status-change case) and it is why criterion 3 passes for free. But on a slow connection it is visibly wasteful, and a targeted invalidation plus a `setQueryData` on the two affected lists would be tighter. **Not worth changing without a measurement** — raise it only if claim latency is reported as a problem.
3. **There is no optimistic update.** The row sits with a spinner until the round trip completes, then vanishes. For the primary "pick up waiting work" gesture on the home screen, an optimistic removal would feel markedly better — but it would also need a rollback path for the lost-race case, which is precisely the case that must not be papered over. **Product call on whether the latency is worth the complexity**; the current behaviour is correct, just not fast.
4. **"Someone else claimed this ticket" is shown for three different failures.** A genuine lost race, an RLS refusal, and claiming a ticket you already own all produce zero rows and the same copy. The first is the common case and the copy is right for it. Story 08 filed the RLS half as its open question 5; this story adds the self-claim case. **The durable fix is server-side** — a `RETURNING`-based distinction or a dedicated RPC that reports *why* it refused. Worth raising with the backend once, for both stories.
5. **Nothing proves the trigger writes the actor.** Criterion 4 says "an `assigned` event is recorded"; verification step 5 confirms the row exists and carries `to_value`. Whether `actor_id` is the claiming agent (rather than null, or the service role) is **not** checked by any criterion — and story 17's History tab renders `actor_id` as the sentence's subject, so a null there reads as "System assigned the ticket to Omar". Check it while you are in `ticket_events` and file it if it is null.
