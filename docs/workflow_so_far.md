# How This Project Has Actually Been Built

A running account of the workflow used to build AZM so far: the spec-driven-development (SDD) loop
via squad-kit, how the Jira MCP and Figma MCP were used (and how they weren't), the React Native
conventions that came out of it, and the tooling/skills actually invoked. Written from what
happened in this repo, not from the theoretical squad-kit docs — see `docs/squad-kit-workflow.md`
for the detailed SCRUM-17 case study this summarizes and generalizes.

---

## 1. The core loop: squad-kit (SDD)

Every feature in this repo — before a line of application code is written — goes through the same
four-stage pipeline, defined in `.squad/README.md` and exercised story-by-story in
`docs/squad-kit-workflow.md`:

```
Jira ticket → squad new-story → intake.md → /squad-plan → NN-story-*.md plan → fresh session implements it
```

### 1.1 Intake

```bash
squad new-story <feature-slug> --id SCRUM-<n>
```

This is where the Jira MCP first enters — `squad new-story` fetches the work item (title,
description, labels, status) and scaffolds `.squad/stories/<feature>/<id>/intake.md` from a
template. Acceptance criteria are **not** always auto-populated by the CLI fetch — several stories
in this repo (SCRUM-22, 23, 24, 28, 33) had their intake scaffolded first and the Acceptance
criteria block filled in afterward by a follow-up Jira MCP call (`getJiraIssue` with
`customfield_10079`, the ACF field) once it was noticed the block was empty. That's now a
checked step: **after `squad new-story`, verify the Acceptance criteria section isn't blank.**

The intake template is deliberately not implementation-ready out of the box. Two sections are
always hand-filled before planning:

- **`## API`** — names the actual SDK method to use (e.g. `supabase.auth.signInWithPassword()`),
  not just the REST endpoint from `docs/phase1_api_reference.md`. Pointing the planner at a raw
  endpoint produces a plan that hand-rolls `fetch()` instead of using the already-wired client.
- **`## Design`** — a Figma link that carries a `node-id` (e.g.
  `...?node-id=7-2799&t=...`), never a bare file link. `/squad-plan` does not call Figma itself;
  the node-id is there so whoever *implements* the plan can call the Figma MCP tools against the
  exact frame instead of guessing which one of 30+ components is the right one.

The planner reads only this file and its `attachments/` folder — no external links, no chat
history, nothing implied. Everything that matters has to be pasted in.

### 1.2 Plan

```
/squad-plan .squad/stories/<feature>/<id>/intake.md
```

Runs `generate-plan.md` (shipped inside the installed `squad-kit` npm package, not checked into
this repo) against the intake. It enforces a discovery pass before writing anything: `list_dir`
the areas the intake names, `grep` for the symbols it references, read the exact lines it will
cite, and read at least one sibling plan for tone/format consistency. Its anti-hallucination rule
is explicit — no invented paths, line numbers, or symbols; anything version-sensitive (Expo APIs,
supabase-js) gets checked against the actual `node_modules` type declarations, not recalled from
training (see `AGENTS.md`'s standing warning that Expo 57 changed significantly).

Output per story: `.squad/plans/<feature>/NN-story-<slug>-SCRUM-<id>.md` — implementation tasks,
edge cases, a manual test matrix, Done Criteria, and any open questions the planner refused to
guess the answer to. A new feature also gets `.squad/plans/<feature>/00-overview.md`, and every
plan gets a row in `.squad/plans/00-index.md` (`NN` is a **global** sequence number across all
features, per `config.yaml`'s `naming.globalSequence`).

This step writes zero application code. Two things are notable about how it's been used here:

- **Plans are numbered in dependency order, not tracker order.** The `customers` feature planned
  the profile screen (10, SCRUM-24) before create (11, SCRUM-22) and edit (12, SCRUM-23), because
  the profile shell had to exist before either form made sense to build against.
- **A later story sometimes discovers an earlier one already did the work.** Story 17
  (SCRUM-35, ticket history timeline) was "already shipped by story 07" — its plan ended up being
  two small gaps plus one never-run verification, not a new screen.

### 1.3 Implement

```
implement this plan
```

Run in a **fresh, scoped session** with the generated plan file as the only story-specific
context (the repo's `CLAUDE.md`/`AGENTS.md` always load automatically). The plan is treated as
read-only during execution — a lint rule catching something unanticipated gets fixed in the
source file, not by rewriting the plan.

Implementation order has followed the plan's own task list: shared/core components first, then
the feature's fixed anatomy (`types.ts` → `api.ts` → `session-context.tsx`* → `hooks.ts` →
`screens/*.tsx` → `index.ts`), then routes, then the `CLAUDE.md` update the plan's last task
always asks for ("when reality and this file diverge, fix this file in the same change").

*only for features that own React Context state, e.g. `auth`.

### 1.4 Verify, then close

```bash
npm run typecheck && npm run lint
```

Both are real, rule-enforcing gates (`eslint.config.js`), and both have caught real defects on
first pass in this repo — a `TextInput` type import from raw `react-native` instead of the
wrapped `@/core/components` one, and a bare `require()` image import needing a targeted
`eslint-disable` rather than a rule change. **Passing both is necessary, not sufficient** — every
bug found so far (e.g. the `LanguageToggle` segment-label collapse in SCRUM-17) sat on the far
side of a clean lint/typecheck run and only surfaced from driving the app on a real device against
live Supabase.

Closing a story is a separate, judgement-heavy pass, not a rubber stamp:

1. Walk the **story's** acceptance criteria (from Jira / the BRD), not the plan's Done Criteria —
   they are not the same list. Default every row to "not verified"; promote only on a named,
   observed check.
2. Test anything the plan flagged as an open question *first* — an open question is a criterion at
   risk, not a footnote.
3. Check the cross-cutting Definition of Done gates (§2 below) — nothing fails loudly when these
   are skipped, which is exactly why they get skipped by default.
4. Rehome every open question into a Jira issue or a spec doc. A plan file is a working document; an
   unresolved question left there quietly evaporates.
5. Branch, draft a commit (Conventional Commits style), get explicit approval before committing.
6. **Update Jira in the same session** — the step most likely to be forgotten. A comment recording
   what was verified and how matters more than the status transition itself; "Done" alone doesn't
   say whether RTL was actually checked six weeks later.

This repo also has a dedicated `close-story` skill that walks exactly this closing sequence
(acceptance criteria → cross-cutting gates → branch → commit draft → tracker update) and
deliberately stops short of committing or transitioning without explicit approval.

---

## 2. Cross-cutting gates every story is checked against

Independent of any single story's own acceptance criteria, `docs/phase1_brd_1.md` §10 and the
Technical Foundation tasks (TF-01…TF-05, tracked as SCRUM-12…16) apply to *every* story:

| Gate | What it checks |
|---|---|
| TF-01 | Arabic RTL and English LTR, both tested on-device |
| TF-02 | Light **and** dark theme (dark is not derivable by inverting light) |
| TF-03 | Phone layout **and** tablet (master–detail ≥600pt, rotation preserves scroll/selection) |
| TF-04 | Tenancy scoping verified by a direct API call, not UI observation (N/A until a story lists scoped data) |
| TF-05 | Loading, empty, error, and offline states all implemented and exercised |
| — | No hardcoded strings (manual check — no i18n lint rule exists yet) |
| — | No colour literals outside `core/lib/theme/primitives.ts` (lint-enforced) |

These are easy to under-check because nothing fails loudly when they're skipped — the SCRUM-17
case study explicitly logged three unchecked gates (dark mode, tablet width, bare-string scan) as
"cheap to close, but not yet closed," rather than pretending they'd been covered.

---

## 3. Jira MCP — what it's actually been used for

No custom Jira automation exists in this repo; everything has gone through the `claude_ai_Atlassian`
MCP server's tools, ad hoc, per request. In practice that's covered:

- **Fetching a work item's fields** (`getJiraIssue`, usually with `fields: ["*all"]` to get the
  Acceptance Criteria custom field, `customfield_10079`, which the CLI fetch during
  `squad new-story` doesn't always populate) — used to backfill the Acceptance criteria section in
  several intake files after the fact.
- **Bulk-querying issues** (`searchJiraIssuesUsingJql`) — used to check statuses across a batch of
  story keys at once before deciding what to transition.
- **Transitioning issues** (`getTransitionsForJiraIssue` to find the right transition id, then
  `transitionJiraIssue`) — used repeatedly to move implemented stories from *To Do* straight to
  *Done* once their code was confirmed present against `CLAUDE.md`'s running status notes. In this
  project the "Done" transition has consistently been id `41` and is global/always-available, so
  once discovered it's been reused directly rather than re-queried every time.
- **Resolving the cloud id** (`getAccessibleAtlassianResources`) — a one-time lookup
  (`f76c0127-a3d6-474c-8b58-1cf37ea6feb4` / `azm-crm.atlassian.net`) needed before any other Jira
  MCP call in a fresh session.

What this workflow has **not** done: create issues, edit descriptions, add comments recording
verification evidence (`docs/squad-kit-workflow.md` §10 explicitly calls this out as the more
valuable half of a tracker update — it hasn't consistently been done in practice), or link raised
open questions back as new Jira issues. Those are named next steps, not yet habits.

---

## 4. Figma MCP — mostly fetch, with write passes for the design system and screen gaps

For most of this project, every Figma interaction has been **read-only design consumption**, not
design generation:

- **`get_metadata`** — inspecting a Figma node's structure before generating a plan or writing a
  component.
- **`get_screenshot`** — visual reference for a specific `node-id`, checked against the rendered
  app during verification (the SCRUM-17 login screen, for instance).
- **`download_assets`** — pulling a static brand asset (e.g. the login screen's logo) straight
  from the named Figma node rather than hand-recreating it.

The one large exception is the **design-system reflection** work
(`.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md`) — this replaced the
hand-written theme token layer with a faithful reflection of the actual Figma file
(`mdfP8RPdkUsKcJb0wFdkME`): colours, type scale, IBM Plex Sans Arabic, and the 16 generic
`core/components/`. Even this was a *read* operation at scale (pulling every token and mapping it
to `core/lib/theme/`), not writing anything back into Figma. It also raised ten open flags back to
design (§15 of that plan) rather than silently resolving ambiguous cases — e.g. `FilterChip`'s
off-scale legacy tokens, and whether `SectionHeader` should uppercase+track Arabic text.

**Two kinds of write pass have since happened**, both ahead of code:

- **Filling a gap in an existing screen.** Occasionally a story's `## Design` node-id names a
  screen that doesn't yet have a frame for the state the story needs — a tab that exists in a
  shared component (e.g. a `TabBar`'s `Tab` instances) but has no corresponding screen-level frame
  behind it yet. Rather than build a new frame from scratch, the `figma-create-screen` skill is
  invoked (loading `figma:figma-use` as its required sub-skill), and `use_figma` **clones a sibling
  frame** of the same screen family instead of hand-building the shell — so the status bar, header,
  and any shared chrome come along byte-for-byte. From there: swap the relevant component variant
  (e.g. a `Selected` state) to reflect the new tab/state; remove children that don't belong to it;
  and compose the new content by cloning an existing, structurally-similar component (e.g. a
  message/row component), stripping the one visual element that doesn't apply, and editing its
  text — so spacing, typography and dividers match the rest of the screen exactly rather than being
  redrawn freehand. The new frame is placed on the file's existing screen grid (next free slot) and
  named to match whatever sibling-naming convention the file already uses for other multi-tab
  screens, discovered by inspecting those siblings before building rather than inventing a new one.
- **Building out the design system itself.** The Figma file's **`Foundations` page** (tokens —
  node `24:4`, "Foundations Root") and its **`🧩 Components` page** (node `35:2`) were both created
  through MCP write calls as well — not hand-drawn in the Figma UI — establishing the variable
  collections, styles, and the on-canvas component/variant library (`Tab`, `MessageRow`,
  `TicketCard`, etc.) that every later screen-level write (including the gap-filling above) then
  draws on as its source of truth for tokens and reusable components.

Both are still design-first, not code-first — the frame or component is built in Figma before the
corresponding app code exists, and the implementer then works from that node the same way every
other story's implementer works from a `## Design` node-id. `figma-enhance-screen` and
`create_new_file` remain unexercised; `figma-create-screen` plus direct `use_figma` calls are the
write paths this repo has actually used, for cases where fetch-only wasn't enough — a node-id
that doesn't yet resolve to a buildable frame, or a token/component that doesn't yet exist to
reflect into `core/lib/theme/` or `core/components/`.

The consistent pattern for consuming a design: the intake's `## Design` line carries a `node-id`
link; the implementer fetches against that exact node during implementation, never against
dimensions "recalled" from a prior look at the file. Writing back into Figma has, so far, only
happened when that node-id — or the design system backing it — didn't already have what the story
needed.

---

## 5. React Native / repo conventions that came out of this loop

Nothing here is a generic RN skill invocation (no `flutter-*` skills apply — this is a
TypeScript/Expo repo, not Flutter) — instead, the squad-kit loop has produced and reinforced a
consistent set of repo-specific conventions, documented in `CLAUDE.md`/`AGENTS.md` and enforced by
`eslint.config.js`:

- **Every feature has the same fixed anatomy** — `api.ts` → `hooks.ts` → (`session-context.tsx` if
  it owns Context) → `types.ts` → `components/` → `screens/` → `index.ts` as the *only* import
  surface. `auth` (story 02) was the first feature built and set this shape; every later feature
  copied it.
- **`src/app/` stays thin** — a route file imports a screen from a feature barrel and renders it,
  nothing else. No data fetching or layout logic in `src/app/`.
- **One-way layering**, lint-enforced: `features/` → `core/`, never the reverse; features import
  each other only through barrels (`@/features/tickets`, never `@/features/tickets/api`) — with one
  known, accepted exception (the `customers`↔`tickets` barrel cycle, safe because both directions
  are used only inside render paths, never at module scope).
- **Single-font, no-hex, logical-layout-only rules** are lint-enforced (`no-restricted-syntax` /
  `no-restricted-imports`), not just documented conventions — so violations fail `npm run lint`
  rather than relying on review to catch them.
- **No code generation** for state — Cubit/Bloc isn't the relevant comparison here (this is RN, not
  Flutter); the equivalent repo rule is TanStack Query for all server state, React Context for
  auth/theme/locale, and local `useState` for everything else. No Redux/Zustand/GetX-equivalent
  store has been introduced.
- **Types are generated, never hand-written** —
  `npx supabase gen types typescript --project-id svcxmjibmgjtaxuzrquf > src/core/types/database.ts`,
  re-run after every schema migration.

---

## 6. Skills and tools actually invoked, end to end

| Category | What's been used |
|---|---|
| SDD / squad-kit | `squad new-story`, `/squad-plan`, `squad-new-story` and `squad-plan` skills |
| Story closing | `close-story` skill (drafts, never auto-commits or auto-transitions) |
| Jira MCP | `getAccessibleAtlassianResources`, `getJiraIssue` (incl. `*all` fields for ACF), `searchJiraIssuesUsingJql`, `getTransitionsForJiraIssue`, `transitionJiraIssue` |
| Figma MCP | `get_metadata`, `get_screenshot`, `download_assets` for fetch; `use_figma` (via the `figma-create-screen` skill, and directly) for writes — filling gaps in existing screens by cloning sibling frames/components, and building out the Design system (tokens) and 🧩 Components pages. `create_new_file`/`figma-enhance-screen` still unexercised |
| Verification | `npm run typecheck`, `npm run lint`, manual on-device testing (Android emulator + live Supabase, no test runner exists yet) |
| Git | Feature branches per story (`feature/scrum-<n>-<slug>`), Conventional Commits, PR/merge — always with explicit approval before committing |
| Docs maintained as part of the loop | `CLAUDE.md` (source of truth, updated in the same change as the feature), `.squad/plans/00-index.md`, `docs/squad-kit-workflow.md` (running lessons-learned) |

---

## 7. Open gaps in the workflow itself (not the app)

Worth naming plainly rather than letting them stay implicit:

1. **Jira comments recording verification evidence are not consistently written** — transitions to
   Done have happened without an accompanying comment stating which acceptance criteria were
   checked and how, which `docs/squad-kit-workflow.md` §10 already flagged as the more important
   half of a tracker update.
2. **Acceptance criteria in intake files aren't always populated by the initial `squad new-story`
   fetch** — several needed a manual follow-up `getJiraIssue` call. Worth checking as a matter of
   course, not by accident.
3. **Open questions raised by `/squad-plan` don't yet have a consistent "next" step** — the workflow
   doc names the two destinations (a new Jira issue, or a line in a spec doc) but doesn't yet track
   whether that actually happens per story.
4. **No dark-mode/tablet verification has been systematically tracked across stories** — the DoD
   table exists per-story but there's no repo-wide rollup of which stories have actually cleared
   TF-02/TF-03 versus which just have unchecked boxes sitting in a plan file nobody reopens.
