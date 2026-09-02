# Jira + MCP Workflow — AZM Support CRM, Phase 1

How to run Jira day-to-day while Claude Code (via Jira MCP) drives implementation. Written for a solo or small-team build where the same person is planning, prompting, and reviewing.

**Companions:** `phase1_jira_import_v2.csv` (the backlog itself) · `frontend_roadmap.md` (build sequence) · `phase1_backend_plan.md` (backend readiness) · `phase1_api_reference.md` (endpoints and tests)

---

## 1. The core idea

MCP turns Jira from a place you update *about* your work into a place your work *updates itself*. The risk in that arrangement is exactly its convenience: an agent that can transition issues can also mark something Done because the code compiles, not because it meets its acceptance criteria. The workflow below exists to keep a human decision at the two points that matter — starting a story, and closing one — while letting the agent handle everything mechanical in between.

**One rule underlies all of this: MCP proposes, you dispose.** Claude Code should read tickets, draft comments, create subtasks, and suggest transitions. It should not move a story to Done unsupervised. That transition is a judgement call about whether the acceptance criteria actually hold, and criteria like "verified in Arabic RTL" or "RLS checked by direct API call" are not things a code diff can self-certify.

---

## 2. Backlog structure recap

What already exists, so the workflow below has something concrete to act on:

| Level | Count | Example |
|---|---|---|
| Epics | 6 | Ticket Management, Customer Management, Technical Foundation |
| Stories | 29 | US-001 through US-029 |
| Tasks | 5 | TF-01 through TF-05 |

Every story carries labels for traceability: `phase-1`, a persona (`agent`/`customer`/`admin`), a screen ID (`S07`), and a source feature (`feat-2.4`). That label set is what makes an MCP query like "show me every story touching S07" or "every story tagged feat-2.*" actually work — it's the thing that lets an agent select a meaningful slice of the backlog instead of everything or nothing.

**Backend readiness is tracked separately**, in `phase1_backend_plan.md`, not as a Jira field. Section 7 of this guide covers how the two stay in sync.

---

## 3. Sprint structure

Three sprints, matching `frontend_roadmap.md`:

| Sprint | Content | Gated on backend? |
|---|---|---|
| 1 | TF-01–05, US-001, US-002 | No |
| 2 | Customer Management + Ticket Management epics | No |
| 3 | Agent Dashboard, Notifications, Attachments | Partially — see §7 |

**Before creating Sprint 1 in Jira**, reorder the backlog. It currently sits in reverse-dependency order — the highest US numbers were imported first and now sit at the top. Drag the Foundation tasks and Auth stories to the top before sprint planning, or ask Claude Code to do it via MCP:

```
Reorder the backlog: put SCRUM-12 through SCRUM-20 first, in that order,
then everything else in its current relative order.
```

---

## 4. Story lifecycle — the five stages

Every story moves through the same five stages. MCP's role changes at each one.

### Stage 1 — Pick up

**Human decides which story starts next.** Not Claude Code, because sequencing decisions depend on backend readiness and judgement calls the backlog metadata doesn't capture — the gating table in §7 exists precisely because "next in the backlog" and "next that's actually buildable" aren't always the same story.

```
Move SCRUM-21 (US-005 Customer list and search) to In Progress and assign it to me.
Show me its full description and acceptance criteria.
```

### Stage 2 — Context load

Before writing code, have Claude Code pull everything relevant — this is the step MCP is best at, since it turns a five-minute manual lookup into one prompt:

```
For SCRUM-21: show me the acceptance criteria, then find the matching
section in phase1_api_reference.md and phase1_brd.md. Confirm which
endpoints from the Postman collection this story needs.
```

### Stage 3 — Implementation

Claude Code writes the code. This is where the vertical-slice instruction from the roadmap matters:

```
Implement SCRUM-21 as a full vertical slice: the screen, the data hook,
loading/empty/error states, and RTL + theme correctness. Don't move to
another story until this one's acceptance criteria all pass.
```

**During this stage, Claude Code may comment on the ticket with progress** — that's a good, low-risk use of MCP:

```
Add a comment to SCRUM-21 summarising what's implemented so far and
what's outstanding against its acceptance criteria.
```

### Stage 4 — Verification

**This is the stage that must not be automated away.** Run through the story's acceptance criteria manually — screen in Arabic, screen in dark mode, screen on a tablet width, RLS check via the Postman collection's isolation folder. Only once you've done this yourself does the story move.

### Stage 5 — Close

```
Mark SCRUM-21 as Done. Add a comment noting which acceptance criteria
were verified and how (e.g. "RLS confirmed via Postman: Layla returns
1 customer, Omar returns 2").
```

Keeping that verification note on the ticket is what makes the backlog auditable later — six weeks from now, "Done" alone doesn't tell you whether RTL was actually checked or just assumed.

---

## 5. Prompts worth keeping on hand

A short library of the MCP prompts you'll reach for repeatedly.

**Start of day**
```
What's In Progress right now? For each, show the last comment and
whether it's blocked on anything from phase1_backend_plan.md.
```

**Before starting a story**
```
Is SCRUM-XX blocked by anything? Check its dependencies against the
readiness table in frontend_roadmap.md.
```

**Mid-implementation**
```
Add a comment to SCRUM-XX with a 2-line status update. Don't change
its status.
```

**Weekly progress check**
```
Summarise this sprint: stories Done, In Progress, and To Do, with
their point totals. Flag anything that's been In Progress for more
than 3 days.
```

**Scope discovery** *(see §6)*
```
I need to add a story: agents should be able to [X]. Draft it in the
same format as the existing stories — persona, feature ID, screen,
priority, points, and acceptance criteria in Given/When/Then form.
Show me the draft before creating it.
```

**Bulk relabelling**
```
Add the label "backend-verified" to SCRUM-17, 18, 21, 22, 23 [...list],
matching phase1_backend_plan.md's completed section. Don't touch status.
```

---

## 6. When implementation surfaces new stories

This will happen — a screen turns out to need a state nobody specified, or a claim button surfaces a race condition worth its own acceptance criteria (as happened with US-029). The workflow:

1. **Claude Code drafts, never creates unprompted.** Ask it to draft the story in the existing format — the same structure as your CSV: persona, feature ID, screen, priority, points, Given/When/Then criteria.
2. **You review the draft** for scope creep. A surprising number of "small additions" are actually Phase 2 features arriving early.
3. **You approve creation**, and only then does MCP add it to the backlog, under the correct epic.

```
Draft a story for a race-condition check when two agents claim the
same unassigned ticket simultaneously. Same format as US-029. Show me
before creating anything.
```

---

## 7. Keeping backend readiness in sync

`phase1_backend_plan.md` is the source of truth for what the server can actually do — not a Jira field, and not something MCP should infer from ticket status. The two drift apart the moment backend work lands and nobody tells Jira.

**After finishing a backend section**, update both the plan and the backlog in the same sitting:

```
I've finished backend section 7 (Storage). Add the label
"backend-ready" to any story blocked on it — check
frontend_roadmap.md's gating table for which ones those are.
```

**Before starting a frontend story**, a quick gate check is cheap insurance:

```
Is SCRUM-XX's backend dependency marked backend-ready? If not, tell me
which section of phase1_backend_plan.md it's waiting on.
```

This label is what turns the gating table in `frontend_roadmap.md` from a static document into something the backlog itself reflects — so a glance at the board tells you what's actually buildable today, not just what's next in sequence.

---

## 8. Guardrails — what MCP should never do unsupervised

Worth stating explicitly, since an agentic tool will do whatever it's permitted to do, and permission and prudence aren't the same thing.

- **Never transition a story to Done without a human verification step.** Acceptance criteria involving RTL, theming, or RLS cannot be confirmed by reading a diff.
- **Never bulk-close stories based on "the code looks complete."** Completeness and correctness against the criteria are different claims.
- **Never create new stories without showing a draft first.** Scope grows quietly otherwise, one small addition at a time.
- **Never mark a `[PENDING]`-labelled backend item as ready without an explicit backend readiness update.** The dependency direction only runs one way — frontend depending on backend — and it should stay that way.
- **Never edit or delete `ticket_events`-equivalent history** — this is a database rule, not a Jira one, but the same principle applies to Jira's own history: don't let an agent silently rewrite a ticket's past comments or transitions to make progress look cleaner than it was.

---

## 9. Weekly rhythm

A light structure, not a ceremony:

**Monday** — reorder/confirm sprint scope against the roadmap, check the backend readiness table for anything newly unblocked.

**Daily** — pick up, load context, implement, verify, close. Five stages, one story at a time, vertical slice.

**Friday** — ask MCP for the week's summary (§5), reconcile it against `phase1_backend_plan.md`'s status table, and update both if backend work moved.

The output of that Friday check should be small edits to two files — the backend plan's status table and any new `backend-ready` labels — not a large reconciliation effort. If it's turning into the latter, the gap between what's built and what Jira thinks is built has grown too wide, and it's worth tightening the weekly habit rather than the process itself.
