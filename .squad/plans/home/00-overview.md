# home — plan overview

Entry point for the **home** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 03 | [03-story-home-workload-summary-SCRUM-37.md](03-story-home-workload-summary-SCRUM-37.md) | Home workload summary | SCRUM-37 | `design-system` 01, `auth` 02 |
| 15 | [15-story-my-tickets-preview-SCRUM-38.md](15-story-my-tickets-preview-SCRUM-38.md) | My tickets preview | SCRUM-38 | `home` 03, `tickets` 04, `tickets` 07 |
| 19 | [19-story-claim-an-unassigned-ticket-SCRUM-36.md](19-story-claim-an-unassigned-ticket-SCRUM-36.md) | Claim an unassigned ticket | SCRUM-36 | `home` 03, `home` 15, `tickets` 08 |
| 20 | [20-story-new-ticket-quick-action-SCRUM-39.md](20-story-new-ticket-quick-action-SCRUM-39.md) | New ticket quick action | SCRUM-39 | `home` 03, `tickets` 04, `tickets` 13, `tickets` 16 |

## Dependency notes

Story 03 depends on [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md)
for the token layer, `Text`/`Icon`, `SectionHeader` (`variant="link"` is the "View all" header
verbatim), `EmptyState`, `ErrorState`, `Skeleton`, `FAB` and `IconButton`. The `tabActive`/
`tabInactive` colour tokens that story added are consumed here for the first time.

It depends on [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md)
for `src/features/`, the barrel convention, and the `Stack.Protected` guard it re-parents from
`index` to `(tabs)`. It also **retires** story 02's `TempSignedInScreen`, whose own comment names
this story as the trigger.

Story 03 reaches past the `home` folder in three deliberate ways:

- **It creates `src/features/tickets/`** — `TicketRow`, `StatusBadge`, and all five ticket queries
  plus the claim mutation. These are tickets-domain code that Home consumes through the barrel;
  the Tickets list (US-016) inherits them unchanged rather than re-deriving them.
- **It extends `src/features/auth/`** with `fetchAgentProfileWithOrg` + `useAgentProfile`. This
  closes a real gap: `session-context.tsx:40` leaves `profile` as `null` after a cold-start session
  restore, so the greeting cannot read it off the auth context.
- **It builds the tab shell** at `src/app/(tabs)/`, with Home real and Tickets, Customers and
  Profile as placeholder screens on the existing `placeholder.screenBody` key. Those placeholders
  are meant to be replaced wholesale by their own stories, not extended.

It deliberately stops short of four neighbouring stories:

- **US-016 tickets list** — "View all" opens the Tickets tab, which is a placeholder.
- **US-018 ticket detail** — row taps are a documented no-op; no placeholder detail route is added,
  so the tickets story keeps that routing decision.
- **US-022 / US-017 new ticket** — the FAB renders but is routed at the Tickets tab as an interim.
- **Notifications** — the bell renders inert.

Five open questions are recorded at the end of story 03 and are **not** settled by it: the missing
`PENDING` colour token (which joins the story 01 §15 flag list), the inert bell and FAB, the
intake's "six queries" wording, the absence of a BRD acceptance criterion for claiming from Home,
and the BRD-vs-API disagreement on list ordering.

---

## Story 15 — my tickets preview

**Read story 15's "Story Goal" table before estimating it.** US-021's three acceptance criteria all
*render* correctly today: story 03 built the My-tickets section and its five rows, story 07 wired
the row tap, and `TicketsScreen`'s `useState<TicketFilter>('mine')` default makes "View all" land
on Mine. This story is not a build — it is closing the gap between "renders right" and "is right".

Two things are genuinely wrong under that accidental pass:

- **Home issues its own query.** `ticketKeys.list` puts `options.limit ?? null` in the key
  (`tickets/hooks.ts:39-40`), so `useMyTickets(5)` builds a *second* cache entry and fires a
  *second* request for a list the Tickets tab already holds. The intake is explicit that Home
  should "read the same cache entry, just render fewer rows" and slice "client-side". Dropping the
  argument makes both screens resolve to `['tickets','list','mine',<uid>,null,'']`.
- **"View all" relies on a `useState` default that only applies once.** A tab screen stays mounted,
  so the moment an agent switches the Tickets tab to Unassigned or All, "View all" under **My
  tickets** silently lands them on somebody else's list. Story 15 parameterises the tab with
  `filter` and `nonce` search params — the app's first parameterised *tab* route — and the nonce is
  load-bearing: without it the sync effect cannot fire twice for the same filter, which is exactly
  the repeat-navigation case that is broken today.

The **Unassigned** section's "View all" has the identical line of code and the identical defect, so
story 15 fixes both. It deliberately does **not** drop the Unassigned preview's server-side
`limit: 3`: Mine is bounded by one agent's workload, Unassigned is the whole department's backlog,
and the cache-sharing that justifies the change for one does not justify the cost for the other.
That asymmetry is commented in the code so it does not read as an oversight.

Story 15 corrects two intake errors rather than following them: **the Figma link points at
`7:4009`**, which is story 13's create-ticket modal, not Home (`7:8`); and the intake's description
of the row ("right-aligned status dot on line two") does not match `TicketRow`, which renders a
full `StatusBadge` pill in a trailing column beside the relative time. The intake's own closing
instruction — anchor to the Tickets screen's implementation, not a possibly-stale mockup — settles
the second in the code's favour.

Six open questions close story 15. The load-bearing one is that **the priority ordering has no
guard**: `.order('priority', { ascending: false })` is correct only because `ticket_priority` is
declared `low, medium, high, urgent`, and a migration that reorders or inserts a value breaks
"most urgent first" on Home, the Tickets tab and the search merge with no type error and no failing
query. Verification step 1 proves it once, before any code is written; keeping it proven needs
either a note on the migration or an explicit rank expression — and `PRIORITY_RANK`
(`tickets/api.ts:68-73`) already encodes the same knowledge in a second place.

---

## Stories 19 and 20 — two verification closures

**Neither story writes application code.** Both intakes say so themselves ("confirm this exists
first … verify rather than build"), and both are right. Read each plan's opening section before
scheduling it.

**Story 19 (US-029, claim)** was built by story 03, which created `src/features/tickets/` — the
claim mutation included — before the Tickets tab existed. All five criteria pass:
`claimTicket` (`tickets/api.ts:272-281`) is a compare-and-set on `.is('assigned_to', null)` with
`{ count: 'exact' }`, throwing `TicketAlreadyClaimedError` on zero rows; `HomeScreen.tsx:45-47`
maps that to `home.claim.taken`; `ticketKeys.all` invalidation reaches all six Home queries; and
the `assigned` event comes from the `log_ticket_assignment` trigger. **What has never been done is
fire two concurrent claims at it.** The intake names this exactly — *"the one part of this story
that's easy to implement but hard to prove works"* — and verification step 3 is a two-JWT `curl`
race whose pass condition is one body with a row and one empty array. Two rows would mean the
predicate is not being applied and the compare-and-set is decorative.

Story 19 also records a documentation gap: **US-029 is not in `docs/phase1_brd_1.md` at all**. It
appears only in the roadmap, the API reference and the CSV, so its acceptance criteria come from the
intake. Story 03 already flagged *"the absence of a BRD acceptance criterion for claiming from
Home"*; story 19's open question 1 asks for it to be settled rather than rediscovered a third time.

**Story 20 (US-022, the FAB)** was closed by **story 13**, not by any story in this folder — story
03 built the FAB but routed it at the Tickets tab as an interim, and story 13 retargeted both call
sites at `/tickets/new`. Both BRD criteria pass trivially. The story's real content is the intake's
third check, which is **not** in the BRD: *"Both land on the same screen with an empty form — no
leftover state."* That is a genuine question, because `CreateTicketScreen` holds five `useState`s
(`:41-47`) that reset only on unmount, and `category` is separate from the React Hook Form state —
so a form that clears its text fields but keeps the category chip is a plausible partial failure.
Story 20 is sequenced **after story 16**, whose `CreateCustomerSheet` adds the newest and least
exercised state to that screen.

Story 20's open question 2 notes the tension worth settling: this story verifies the form is
**empty** on reopen, while story 16 exists so an agent does **not** lose input. Both are correct,
but "should Cancel offer to keep the draft?" has now been filed by stories 13, 16 and 20 — three
times, unanswered.
