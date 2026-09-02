# Story 21 — Post a public reply (Story: SCRUM-31)

> Intake: `.squad/stories/tickets/SCRUM-31/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4614` area — the same Ticket Detail frame as story
> 07. **No separate frame**; this is the composer's default, non-toggled state.

## Read this before anything else

The intake's suspicion is correct: *"This is likely already implemented … Before planning anything:
confirm whether this exists first. If it does, this intake should verify rather than build."*

It exists. Story 07 built the whole path
([`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md)),
whose own scope table lists *"US-015 post a public reply (`:652`) — **Yes**, API §5.3"*.

| US-015 criterion (`docs/phase1_brd_1.md:662-665`) | Status | Evidence |
|---|---|---|
| `:662` Public mode saves with `is_internal` false | **Met** | `components/ReplyComposer.tsx:21` defaults `mode` to `'public'`; `:28` sends `isInternal: mode === 'internal'`; `api.ts:402-420` writes it through |
| `:663` Visually distinct from internal notes | **Met** | `components/MessageRow.tsx:29-31` — rail is `statusSuccess` (agent) or `statusInfo` (customer) vs `borderInternal`; background `bgSurface` vs `bgInternalSubtle`; `:57-64` adds the lock pill only for internal |
| `:664` Visible on the customer status page | **CANNOT BE VERIFIED HERE** | The status page is **US-025** (`docs/phase1_brd_1.md:800-808`), Epic E5 — a separate unauthenticated web surface that does not exist. See "The criterion this repo cannot close" |
| `:665` Empty composer blocks send | **Met** | `ReplyComposer.tsx:24` — `canSend = body.trim().length > 0 && !sending`; `:27` early-returns; `:88` disables the button; `:98` dims it |

**Three of four criteria pass. The fourth is not this repo's to close** — and pretending otherwise
by ticking it off a manual walkthrough of the agent app would be the single most misleading thing
this story could do.

If you find yourself editing `ReplyComposer`, `MessageRow`, `postTicketMessage` or `getMessages`,
stop. The work here is a walkthrough, one payload inspection, and an honest finding about `:664`.

---

## The criterion this repo cannot close

BRD `:664` — *"Given a public reply, when the customer opens the status page, then it is visible"* —
depends on a surface that is out of scope for the agent app entirely:

- `docs/phase1_brd_1.md:768-770` — Epic E5, *"Outbound notifications, magic-link status page, and CSAT capture. No customer login."*
- `docs/phase1_brd_1.md:800-808` — **US-025 · Magic-link status page**, whose own first criterion is *"Given a valid magic link, when opened, then the status page loads without authentication"*.
- `docs/phase1_brd_1.md:80` — *"The status page is the only web surface, and it is unauthenticated by token."*
- `CLAUDE.md` — *"Notifications is the only unbuilt phase-1 area."*

**What this story CAN prove** is the half that lives here: that a public reply is written with
`is_internal = false` and is therefore *eligible* to appear on that page when it is built. That is
verification step 3 — a direct read of the row, not a UI screenshot.

**What it cannot prove** is that the page renders it. Do not mark `:664` done. Record it as
blocked on US-025 and carry it forward — see open question 1.

---

## Prerequisites

- **Story 07 completed** — [`07-story-ticket-detail-and-conversation-SCRUM-30.md`](07-story-ticket-detail-and-conversation-SCRUM-30.md). Built `ReplyComposer`, `MessageRow`, `postTicketMessage`, `getMessages`, `usePostTicketMessage` and the Conversation/Internal segments. Everything in the table above.
- **Story 22 is the sibling of this one** — [`22-story-post-an-internal-note-SCRUM-32.md`](22-story-post-an-internal-note-SCRUM-32.md). They share one composer, one mutation and one row component, and their criteria are two halves of the same `is_internal` boolean. **Verify them in one session**; splitting them means walking the same screen twice.
- **A ticket with at least one message of each kind**, posted by two different agents, so `MessageRow`'s three `RowKind` branches (`customer`, `agent`, `internal`) are all on screen at once. `MessageRow.tsx:16-19` picks the branch from `isInternal` and `authorId`; with only your own messages you will never see the `customer` rail and cannot judge `:663`.
- **An agent JWT** for verification step 3's payload read.

---

## Story Goal

Prove the public-reply path end to end, and be precise about the one criterion that leaves this
repo. Concretely:

1. **A public reply is confirmed written with `is_internal = false`** by reading the row, not by trusting the UI.
2. **The visual distinction is judged with all three row kinds on screen**, which is the only way `:663` means anything.
3. **The empty-composer guard is exercised**, including the whitespace-only case the `.trim()` at `ReplyComposer.tsx:24` exists for.
4. **`:664` is recorded as blocked on US-025**, with the eligibility half proven and the rendering half explicitly not claimed.

**Not in scope**: attachments (`ReplyComposer.tsx:59-66` renders the paperclip disabled with a
`TODO`; API §8 is still 🔨 — the third area blocked on Storage), edit or delete of a sent message
(no story asks for it), read receipts, and the internal-note path (story 22).

---

## Context — Read These Files First

1. `src/features/tickets/components/ReplyComposer.tsx` — all 122 lines. Specifically `:21` (mode defaults to `'public'` — that default *is* criterion `:662`'s happy path), `:24` (`canSend`, with the `.trim()`), `:26-30` (`handleSend`, its early return, and `setBody('')` which is the "composer clears" behaviour the intake asks about), and `:86-103` (the send button's `disabled` and `opacity` treatment).
2. `src/features/tickets/components/MessageRow.tsx` — all 80 lines. `:12-19` — `RowKind` and `rowKind()`, with the comment at `:14-15`: *"`is_internal` wins over authorship: an internal note is an internal note regardless of who wrote it."* Then `:29-31`, the rail/background selection that is criterion `:663`'s entire implementation.
3. `src/features/tickets/api.ts:388-420` — `postTicketMessage` and, above it, the doc comment at `:391-401`. **Read that comment in full.** It is the load-bearing safety note for story 22 and it explains why `isInternal` is a required parameter with no default.
4. `src/features/tickets/api.ts:378-386` — `getMessages` and its `.eq('is_internal', kind === 'internal')`. **This single line is what separates the two tabs at the query level**, and it is what verification step 4 inspects.
5. `src/features/tickets/hooks.ts:170-186` — `usePostTicketMessage`. Note the narrow invalidation at `:181-183` and its comment: only the thread posted to, *"the other kind cannot have changed, and the lists don't show message counts."* That is why a sent reply appears without a full-screen refetch.
6. `src/features/tickets/screens/TicketDetailScreen.tsx:128-134` — the composer is rendered only when `tab !== 'history'`, so posting is impossible from the History tab. Correct and worth confirming.
7. `docs/phase1_api_reference.md:341` — §5.3, marked ✅.
8. `docs/phase1_brd_1.md:654-665` — US-015. `## Done Criteria` mirrors it, **with `:664` marked blocked**.

---

## Implementation tasks

**None. This story writes no application code.**

State that in the PR description. If verification finds a real defect it gets its own task here,
with the plan edited to say what was found.

**No backend changes required.** §5.3 is ✅ and this story does not change the endpoint. The one
backend-shaped item is **US-025's non-existence**, which is a scope fact rather than a task.

---

## Edge Cases & Failure Modes

- **Whitespace-only body.** `body.trim().length > 0` (`ReplyComposer.tsx:24`) is false, so the button stays disabled. **Test with spaces and with a newline** — a guard written as `body.length` would pass the spaces case and this one would not catch it. Matrix row 4.
- **Send while a send is in flight.** `canSend` includes `!sending` (`:24`), and `sending` is `post.isPending` (`TicketDetailScreen.tsx:131`). No double-post. Matrix row 5.
- **The composer clears optimistically.** `setBody('')` at `:29` runs immediately, before the mutation resolves. **If the post then fails, the agent's text is gone** and only the error line at `:106-110` remains. This is a real usability defect, not a hypothetical — see open question 3. Matrix row 6.
- **Very long body.** No `maxLength` on the `TextInput` (`:68-84`) and no length cap in `postTicketMessage`. The column is `text`, so it will store it; the row renders it in full with no truncation (`MessageRow.tsx:69`). Not a defect, but confirm a long reply does not break the layout.
- **Message posted by an agent whose profile is gone.** `MESSAGE_SELECT` embeds `profiles(full_name)`; a null embed falls back to `t('ticketDetail.event.system')` (`MessageRow.tsx:26`) — the same string the History tab uses for a null actor. Renders "System" for a departed colleague's reply, which is misleading. Story 17's open question 6 raised the same overloaded key.
- **Posting from the History tab.** Impossible — the composer is not rendered (`TicketDetailScreen.tsx:128`).
- **Offline send.** `toAppError` maps it; the error line renders; the body is **already cleared**. Same defect as above.
- **RTL.** The composer's chip row and input row use `gap` and `flexDirection: 'row'` with no directional props (`ReplyComposer.tsx:116-120`); `MessageRow` uses `borderStartWidth`/`borderStartColor` (`:44-45`), which is the logical property hard rule 5 requires — **the rail must appear on the right in Arabic**. Matrix row 8.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`). This story adds no code and no tests.

1. **`rowKind()` (`MessageRow.tsx:16-19`) is the one genuinely unit-testable function in this story** — a pure three-branch map over `(isInternal, authorId)`. It is also the function whose correctness matters most, because it is what keeps an internal note from rendering as a public reply. When a runner lands, this is a three-line test worth having. **Do not install one for this story.**
2. The matrix below is the test plan. Run it **jointly with story 22's** — same screen, same composer.

| # | Scenario | Expected |
|---|---|---|
| 1 | Open a ticket, Conversation tab, type a reply, Send | Appears at once; composer clears |
| 2 | Read the row back via API | `is_internal` is **`false`** |
| 3 | With a customer message, an agent reply and an internal note all visible | Three visibly different rows — rail colour **and** background **and** (internal only) lock pill |
| 4 | Type only spaces, then only a newline | Send **disabled** in both cases |
| 5 | Tap Send twice rapidly | One message, not two |
| 6 | Airplane mode, type, Send | Error line shows — **note whether the typed text is lost** |
| 7 | Send, then switch to Internal notes tab | The public reply is **not** there |
| 8 | Switch to العربية, restart, repeat 1 and 3 | Rail on the **right**; layout correct |
| 9 | Regression: History tab | No composer rendered |

---

## Verification Steps

1. **Confirm the implementation exists before testing it**, as the intake instructs. Read context files 1–4 and record that the path was found already built. That finding is this story's main output.
2. **Walk the happy path** (matrix rows 1, 7) and confirm the two behaviours the intake names: *"the composer clears and the list refreshes after send."* Both are visible in one action.
3. **Prove `is_internal = false` from the payload, not the UI** — this is the half of `:664` that this repo *can* close:

   ```bash
   curl -s -H "apikey: $KEY" -H "Authorization: Bearer $JWT" \
     "$URL/rest/v1/ticket_messages?ticket_id=eq.$TICKET&select=id,body,is_internal,created_at&order=created_at.desc&limit=5"
   ```

   The reply you just sent must show `"is_internal": false`. **Record the response.** A public
   reply that is eligible for the status page is exactly a row with this flag false; that is the
   strongest statement this repo can make about `:664`, and it should be made explicitly rather
   than left implied.
4. **Inspect the Conversation tab's own query filter.** Confirm `getMessages` (`api.ts:378-386`) sends `is_internal=eq.false` for the public kind. This is shared with story 22, where it carries far more weight — verify it once, here, and reference it there.
5. **Judge `:663` with all three row kinds on screen at once** (matrix row 3). Judging "visually distinct" from a screen of your own replies is not a judgement. If a seeded customer message is unavailable, insert one directly with `author_id: null` — `rowKind` treats a null author as `customer` (`MessageRow.tsx:18`).
6. **Exercise the empty guard properly** (matrix row 4): spaces **and** a newline, not just an untouched field. An empty field passing tells you nothing the `.trim()` was written for.
7. **Note the lost-text-on-failure behaviour** (matrix row 6) without fixing it. It is open question 3 and it belongs to story 07's component; a drive-by fix here would be a scope violation on a zero-diff story.
8. **Typecheck and lint:** `npm run typecheck` and `npm run lint` — both zero errors. Expected clean; run them for the gate.
9. **Frontend runs:** `npm start`, `a` and `i`. Walk the matrix.
10. **RTL** (matrix row 8): العربية, **full restart**, and specifically check the rail is on the trailing edge. `borderStartColor` should handle it; this is the check that proves it.
11. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:662-665` (US-015).

- [ ] Given the composer in public mode, when I send, then **the message saves with `is_internal` false**
- [ ] Given a public reply, when it renders, then **it is visually distinct from internal notes**
- [ ] ~~Given a public reply, when the customer opens the status page, then it is visible~~ — **BLOCKED on US-025 (magic-link status page, Epic E5). Not closeable by this repo.** The eligibility half is proven by verification step 3; the rendering half carries forward
- [ ] Given an empty composer, when I attempt to send, then **the action is blocked**

Plus, from the intake and this plan:

- [ ] `is_internal: false` was confirmed **by reading the row**, not inferred from which tab it appeared in
- [ ] The visual distinction was judged with **customer, agent and internal rows on screen together**
- [ ] The empty guard was tested with **whitespace and a newline**, not just an untouched field
- [ ] The composer **clears** and the thread **refreshes** after a successful send
- [ ] The reply does **not** appear in the Internal notes tab
- [ ] RTL: the message rail renders on the **trailing** edge
- [ ] **No application code was changed**, and the PR description says so
- [ ] `:664`'s blocked status is recorded on the tracker — **the story is not closed as fully done**

---

## Open questions — raise with design/product, do not resolve silently

1. **US-015 cannot be fully closed, and neither can US-016.** Both have a status-page criterion (`:664` and `:677`) that depends on **US-025**, an unbuilt web surface in Epic E5. US-026 (`:822`) then re-states the internal-notes half as its *own* criterion — *"Given the status page response, when inspected, then internal notes are absent from the payload"* — so the same requirement is written twice, in two epics, and neither is verifiable today. **Decide how these stories close**: either they ship at 3-of-4 with the criterion carried to US-025, or they stay open until E5 lands and block the sprint. This is a planning decision, and it affects two stories and two epics.
2. **"Visually distinct" has no defined threshold.** `:663` is satisfied here by three simultaneous signals (rail colour, background wash, lock pill). That is generous and clearly passes — but nothing says what the *minimum* is, so a future restyle could drop the background and still claim the criterion. Given that this distinction is the guard against an internal note being mistaken for a customer-visible reply, **it deserves a stated minimum** rather than a judgement call per reviewer. Story 22 depends on the same answer.
3. **A failed send loses the agent's text.** `ReplyComposer.tsx:29` clears `body` immediately on `handleSend`, before the mutation settles. On a failure the error renders and the typed reply is gone — on a screen an agent uses while a customer waits. The fix is to clear in the mutation's `onSuccess` instead, which is a ~5-line change to story 07's component. **This is the most user-visible defect found while verifying either composer story**, and it is not in scope here. File it.
4. **A departed colleague's reply renders as "System".** `MessageRow.tsx:26` falls back to `ticketDetail.event.system` when the `profiles` embed is null. That key is also the History tab's null-actor label. Story 17's open question 6 raised the overloading; this is a second site. A dedicated `ticketDetail.message.unknownAuthor` would fix both, and "System" on a customer-visible-adjacent surface is actively misleading.
5. **There is no message length cap anywhere.** No `maxLength` on the input, no validation in `postTicketMessage`, and the column is `text`. Not a defect today, but the status page will render these to customers, and the notification email in E5 will too. Worth deciding a limit before the surface that renders it exists.
