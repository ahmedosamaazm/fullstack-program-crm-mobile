# Story 22 — Post an internal note (Story: SCRUM-32)

> Intake: `.squad/stories/tickets/SCRUM-32/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4614` area — the same Ticket Detail frame as stories
> 07 and 21. **No new frame**; this is the composer's "Internal note" toggle state.

## Read this before anything else

The intake is right that this is built, and right that it is **the highest-risk story in Phase 1**.
Both things are true at once, and the second is why this story is worth running even though the
first makes it a zero-diff.

Story 07 built the path
([`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md)),
whose scope table lists *"US-016 post an internal note (`:667`) — **Yes**, API §5.4"*.

| US-016 criterion (`docs/phase1_brd_1.md:675-679`) | Status | Evidence |
|---|---|---|
| `:675` Internal mode saves with `is_internal` true | **Met** | `ReplyComposer.tsx:28` — `isInternal: mode === 'internal'`; `api.ts:414` writes it |
| `:676` Mode shown by colour, icon **and** label together | **Met** | `ReplyComposer.tsx:49-54` — `FilterChip` with `label` ("Internal note"), `icon="lock"`, and `selected` state; plus `:80-81`, the input's `borderInternal` outline while in internal mode |
| `:677` Absent from the customer status page payload | **CANNOT BE VERIFIED HERE** | US-025/US-026, Epic E5 — unbuilt. See "The criterion this repo cannot close" |
| `:678` Visible to a colleague in my department | **Met** | `getMessages` (`api.ts:378-386`) filters only on `is_internal`, not on author; RLS scopes by department |
| `:679` `is_internal` must be supplied explicitly on insert | **Met, and deliberately guarded** | `database.ts:398` types it `is_internal: boolean` in `Insert` — **no `?`**, unlike every other optional column; `api.ts:391-401` is a doc comment whose entire purpose is to stop someone weakening it |

**Four of five pass; the fifth is not this repo's to close.** But do not let "already built" collapse
into "already safe" — the intake asks for three *independent* checks precisely because the failure
mode here is silent:

> *"verify all three of these independently, not just visually: 1. The note appears in the
> Conversation tab's rendered UI — must NOT. 2. The Conversation tab's actual API response … the
> note must be absent from the payload itself, not just hidden by the UI. 3. Attempt to insert a
> message via API with `is_internal` omitted — must fail at the database."*

Checks 2 and 3 have never been run. **They are the story.** A UI that hides an internal note while
the payload still carries it is a leak the moment anything else reads that endpoint — and E5's
status page is exactly that "anything else".

---

## The criterion this repo cannot close

BRD `:677` — *"Given an internal note, when the customer opens the status page, then it is absent
from the response payload"* — names a surface that does not exist:

- `docs/phase1_brd_1.md:800-808` — **US-025 · Magic-link status page** (Epic E5).
- `docs/phase1_brd_1.md:816-822` — **US-026**, whose own criterion restates this one verbatim: *"Given the status page response, when inspected, then internal notes are absent from the payload."*
- `CLAUDE.md` — *"Notifications is the only unbuilt phase-1 area."*

**The same requirement is written twice, in two epics, and neither is verifiable today.**

What this story *can* prove is the precondition that makes `:677` achievable at all: every internal
note carries `is_internal = true`, and the column cannot be written without an explicit value. If
that holds, a correctly-written status page can filter them out. If it does not hold, no amount of
care in E5 will save it. **That is verification steps 3 and 5, and they are worth more than a
screenshot of a tab.**

Do not mark `:677` done. See open question 1.

---

## Prerequisites

- **Story 07 completed** — [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md). Built everything in the table above, including the `is_internal` guard comment and the purple token pair (`borderInternal`, `bgInternalSubtle`, `textInternal`) added specifically so an internal note is *"unmistakably a different class of row"*.
- **Story 21 is the sibling of this one** — [`21-story-post-a-public-reply-SCRUM-31.md`](21-story-post-a-public-reply-SCRUM-31.md). One composer, one mutation, one row component; two halves of one boolean. **Run both matrices in a single session.**
- **A second agent account in the same department** — criterion `:678` cannot be checked with one identity, and "visible to a colleague" is the criterion most likely to be assumed rather than tested.
- **An agent JWT** and a REST client. Verification steps 3 and 5 are the story and neither is doable from the app.
- **An agent from a *different* department**, if one can be seeded. Not required by any criterion, but it is the check that turns `:678` from "my department sees it" into "only my department sees it" — see open question 4.

---

## Story Goal

Prove that an internal note is internal at every layer, not just in the UI. Concretely:

1. **The note is absent from the Conversation tab's actual response payload**, confirmed by reading the wire, not the screen.
2. **An insert with `is_internal` omitted is rejected by the database**, confirming the NOT NULL/no-default contract that `api.ts:391-401` exists to protect.
3. **A colleague in the same department sees the note**, confirmed with a second account.
4. **The composer's three-signal internal indicator is confirmed** — colour, icon and label together, as `:676` requires all three.
5. **`:677` is recorded as blocked on US-025/US-026**, with the precondition proven and the rendering half explicitly not claimed.

**Not in scope**: the status page itself (US-025), attachments on notes (API §8, still 🔨),
editing or deleting a note, and the public-reply path (story 21).

---

## Context — Read These Files First

1. **`src/features/tickets/api.ts:391-401`** — the doc comment above `postTicketMessage`. **Read every line of it before touching anything in this story.** It states the contract: *"`isInternal` is REQUIRED, not optional, and there is no default anywhere in this function … if a payload without it ever succeeds, internal notes can silently become public. Do not add a default, do not widen this to `Partial<...>`, do not build the payload through a `Record<string, unknown>` — each of those turns a compile error into a runtime leak."* This story's job is to confirm that is still true, and to leave it exactly as it is.
2. `src/features/tickets/api.ts:402-420` — `postTicketMessage`'s signature and its fixed object-literal payload at `:409-414`. The literal is the guard; a spread or a `Partial` would defeat it invisibly.
3. `src/core/types/database.ts:392-410` — the `ticket_messages` table. Compare the `Insert` block's `is_internal: boolean` against every neighbouring field's `?`. **That single missing `?` is criterion `:679`'s client-side half**; the database's NOT NULL is the other half, and verification step 5 is the only thing that proves it.
4. `src/features/tickets/api.ts:378-386` — `getMessages` and `.eq('is_internal', kind === 'internal')`. **This one line is the entire separation between the two tabs.** Verification step 3 inspects what it actually sends.
5. `src/features/tickets/components/ReplyComposer.tsx:43-55` — the two `FilterChip`s. The internal one carries `label` + `icon="lock"` + `selected`; `:80-81` adds the input border. That is criterion `:676`'s "colour, icon and label together".
6. `src/features/tickets/components/MessageRow.tsx:12-19` — `rowKind()` and its comment: *"`is_internal` wins over authorship: an internal note is an internal note regardless of who wrote it."* Then `:29-31` and `:57-64` for the rail, wash and lock pill.
7. `src/features/tickets/hooks.ts:178-184` — the narrow invalidation. A note invalidates only the internal thread, so posting one cannot cause a public refetch that might briefly surface it.
8. `docs/phase1_api_reference.md:347` — §5.4, marked ✅, and §5's closing note on the deliberate absence of a default.
9. `docs/phase1_brd_1.md:667-679` — US-016. `## Done Criteria` mirrors it, **with `:677` marked blocked**.

---

## Implementation tasks

**None. This story writes no application code.**

**And it must not.** Every plausible "small improvement" here weakens a deliberate guard: adding a
default to `isInternal`, relaxing the `Insert` type, or making `getMessages` filter client-side
instead of in the query. The intake calls this the highest-risk story in Phase 1; the correct
output is evidence, not a diff.

If verification finds a real defect, it gets its own task here **and a plan edit saying what was
found** — a silent fix on this path is exactly the failure mode the guard comment warns about.

**No backend changes required.** §5.4 is ✅. The one backend-shaped item is US-025/US-026's
non-existence, which is a scope fact rather than a task.

---

## Edge Cases & Failure Modes

- **A note posted while the Conversation tab is open.** The mutation invalidates only `ticketKeys.messages(id, 'internal')` (`hooks.ts:181-183`), so the public thread is not refetched and cannot flicker the note into view. Correct by construction.
- **`is_internal` omitted from an insert.** Must fail at the database (NOT NULL, no default). **Verification step 5 is the only proof**; the TypeScript `Insert` type protects this repo's code but not a hand-rolled request, a future service, or E5.
- **`is_internal` sent as `null`.** Distinct from omitting it, and worth a second probe — a NOT NULL column rejects it, but a column with a default would coerce. Verification step 5b.
- **A note authored by a *customer*.** Impossible through the app (the composer is agent-only), but `rowKind()` handles it: `isInternal` wins over a null `authorId`, so it renders as internal, not as a customer message (`MessageRow.tsx:16-19`). The safe direction.
- **RLS refuses a colleague's note.** Criterion `:678` requires a same-department colleague to see it. If they cannot, that is an **RLS defect, not a client one** — `getMessages` filters only on `is_internal` and `ticket_id`. File it against the backend.
- **A different-department agent sees it.** Not tested by any criterion, and the more dangerous direction. Open question 4.
- **Switching the composer to internal mid-typing.** `mode` and `body` are independent `useState`s (`ReplyComposer.tsx:21-22`), so the text survives the toggle — an agent can start a public reply, realise it should be internal, and switch. Good behaviour, and worth confirming it does not silently send the *previous* mode. Matrix row 6.
- **The mode does not reset after sending.** `handleSend` clears `body` (`:29`) but leaves `mode`. **The next message defaults to whatever the last one was** — so an agent who posts an internal note and then types a customer reply sends it internally unless they notice the chip. **This is the highest-consequence usability finding in either composer story.** Matrix row 7, open question 3.
- **RTL.** The internal pill uses `gap` and `flexDirection: 'row'` (`MessageRow.tsx:78`); the rail uses `borderStartWidth`/`borderStartColor` (`:44-45`). Matrix row 9.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`). This story adds no code and no tests.

1. **`rowKind()` is the single most test-worthy function in the codebase** — it is what keeps an internal note from rendering as a public reply, it is pure, and it is three branches. Story 21 says the same. When a runner is installed, this and `state-machine.ts` (story 09's recommendation) are the two things to cover first. **Do not install one for this story.**
2. The matrix below is the test plan. **Rows 2, 3 and 8 are the story**; the rest is context around them.

| # | Scenario | Expected |
|---|---|---|
| 1 | Composer → tap **Internal note** chip | Chip selected; **lock icon** visible; **label** reads "Internal note"; input gains the internal border — all three signals at once |
| 2 | Send an internal note, then open the **Conversation** tab | Note is **not** rendered |
| 3 | Read the Conversation tab's **API response** for the same ticket | Note is **absent from the payload**, not merely unrendered |
| 4 | Open the **Internal notes** tab | Note present, purple rail, wash, lock pill |
| 5 | `POST` a message with `is_internal` **omitted** | **Rejected by the database** |
| 6 | Type a body, then toggle public → internal, then Send | Sends as **internal**; body preserved across the toggle |
| 7 | Send an internal note, then type a new message without touching the chip | **Still internal** — confirm and record (see open question 3) |
| 8 | Sign in as a **second agent, same department**, open the ticket | Note is **visible** to them |
| 9 | Switch to العربية, restart, repeat 1 and 4 | Three signals still legible; rail on the **trailing** edge |
| 10 | Regression: public replies (story 21's matrix) | Unaffected |

---

## Verification Steps

1. **Confirm the implementation and the guard are both intact** before testing. Read context files 1–3 and confirm `api.ts:391-401`'s comment is present and `database.ts:398` still has **no `?`** on `is_internal`. If either has been weakened since story 07, that is this story's finding and it outranks everything below it.
2. **Walk the UI** (matrix rows 1, 2, 4) — the intake's check 1.
3. **Read the Conversation tab's actual payload** — the intake's check 2, and the one that separates "hidden" from "absent":

   ```bash
   curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/ticket_messages?ticket_id=eq.$TICKET&is_internal=eq.false&select=id,body,is_internal,author_id,created_at&order=created_at.asc"
   ```

   **The internal note's body must not appear anywhere in the response.** Then run it again
   *without* the `is_internal=eq.false` filter and confirm the note **is** returned — that proves
   the filter is doing the work, rather than the note simply not existing. **Record both
   responses.** Two `curl`s, and they are the most valuable thing this story produces.

4. **Confirm the filter is what the app actually sends**, not just what the source says. Either read `getMessages` (`api.ts:378-386`) against the request in a network log, or trust step 3's second call — but do not skip both; "the code says `.eq(...)`" and "the request carried `is_internal=eq.false`" are different claims.
5. **Attempt an insert with `is_internal` omitted** — the intake's check 3, and criterion `:679`:

   ```bash
   # 5a — omitted entirely: must FAIL
   curl -s -w '\n%{http_code}\n' -X POST \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -d '{"ticket_id":"'$TICKET'","author_id":"'$AGENT'","body":"probe-omitted"}' \
     "$URL/rest/v1/ticket_messages"

   # 5b — explicit null: must ALSO fail
   curl -s -w '\n%{http_code}\n' -X POST \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -d '{"ticket_id":"'$TICKET'","author_id":"'$AGENT'","body":"probe-null","is_internal":null}' \
     "$URL/rest/v1/ticket_messages"
   ```

   Both must return a `4xx` with a NOT NULL violation. **If either succeeds, stop everything and
   file it as a P0**: a column that silently defaults means any future writer — E5's notification
   service included — can create a message that is neither clearly public nor clearly internal, and
   `getMessages`' `is_internal=eq.false` filter would then decide it is public. Then **delete any
   probe rows that were created.**
6. **Prove `:678` with a second account** (matrix row 8). Do not infer it from RLS policy text; sign in and look.
7. **Confirm all three signals for `:676`** (matrix row 1). The criterion says colour **and** icon **and** label — check for three, not "it looks different".
8. **Record the sticky-mode behaviour** (matrix row 7) without fixing it. Open question 3.
9. **Typecheck and lint:** `npm run typecheck` and `npm run lint` — both zero errors.
10. **Frontend runs:** `npm start`, `a` and `i`. Walk the matrix.
11. **RTL** (matrix row 9): العربية, full restart.
12. **Clean up every probe row** created in step 5 and step 3. Leaving `probe-omitted` in a real ticket's thread is a small mess that a future verifier will read as data.
13. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:675-679` (US-016).

- [ ] Given the composer in internal mode, when I send, then **the message saves with `is_internal` true**
- [ ] Given the composer, when in internal mode, then **the mode is indicated by colour, icon and label together**
- [ ] ~~Given an internal note, when the customer opens the status page, then it is absent from the response payload~~ — **BLOCKED on US-025/US-026 (Epic E5). Not closeable by this repo.** The precondition is proven by steps 3 and 5; the rendering half carries forward
- [ ] Given an internal note, when a colleague in my department opens the ticket, then **it is visible**
- [ ] Given the messages table, when a row is inserted, then **`is_internal` must be supplied explicitly**

Plus, from the intake's three independent checks and this plan:

- [ ] Check 1 — the note is **not rendered** in the Conversation tab
- [ ] Check 2 — the note is **absent from the Conversation tab's response payload**, proven by `curl`, with **both** responses (filtered and unfiltered) recorded
- [ ] Check 3 — an insert with `is_internal` **omitted** is rejected, **and** an insert with `is_internal: null` is rejected
- [ ] `api.ts:391-401`'s guard comment is **still present and unweakened**
- [ ] `database.ts:398` still types `is_internal: boolean` with **no `?`**
- [ ] `:678` was proven with a **second account**, not inferred from policy text
- [ ] All three `:676` signals were checked individually
- [ ] Every **probe row** created during verification was deleted
- [ ] **No application code was changed**, and the PR description says so
- [ ] `:677`'s blocked status is recorded on the tracker — **the story is not closed as fully done**

---

## Open questions — raise with design/product, do not resolve silently

1. **US-016 and US-015 both hinge on an unbuilt surface, and US-016's criterion is duplicated.** `:677` (US-016) and `:822` (US-026) state the same requirement in two epics, and US-025 — the page itself — does not exist. **Decide once how these close**: ship at 4-of-5 with the criterion carried to E5, or hold both stories until E5 lands. Story 21's open question 1 is the same question; answering it once settles both.
2. **"Colour, icon and label together" is specified for the composer but not for the row.** `:676` governs the *composer's* mode indicator. `MessageRow` happens to carry three signals too (rail, wash, lock pill), but no criterion requires it — so a restyle could reduce the *rendered note* to a single cue without failing any test, on the surface where mistaking an internal note for a customer-visible reply actually costs something. **The row deserves the same explicit three-signal requirement the composer has.** Story 21's open question 2 is the mirror of this.
3. **The composer's mode is sticky across sends, and nothing signals it.** `handleSend` clears the body but leaves `mode` (`ReplyComposer.tsx:26-30`). An agent who posts an internal note and then types a reply to the customer sends it **internally** unless they notice the chip — the failure is silent, and its consequence is a customer never receiving an answer they were promised. The inverse (internal content sent publicly) is not reachable this way, but the visible-to-nobody direction is bad enough. **Options**: reset to `public` after each send, or make the internal state loud enough that it cannot be missed. This is the most consequential finding in either composer story and it should not wait for a redesign.
4. **Cross-department visibility is untested.** `:678` requires a same-department colleague to see the note; **no criterion tests that an agent in another department cannot.** §6's isolation matrix covers `customers`, `tickets`, `ticket_messages` and `access_tokens`, so the policy is presumed present — but "presumed" is what this story exists to eliminate. If a second department can be seeded, check it; if not, raise it as a gap in the isolation matrix's coverage of *internal* messages specifically.
5. **Nothing in CI protects the `is_internal` guard.** It is currently defended by a doc comment (`api.ts:391-401`), a missing `?` in a **generated** file that is regenerated by `npm run gen:types`, and reviewer attention. A regeneration against a schema where someone added a default would silently remove the compile-time guard, and the comment would still be sitting there describing a protection that no longer exists. **An eslint rule or a schema assertion would make this durable**; given it is the designated highest-risk story in Phase 1, that is worth its own ticket.

**STOP HERE. This is the last of the five verification stories in this batch. Report to the user.**
