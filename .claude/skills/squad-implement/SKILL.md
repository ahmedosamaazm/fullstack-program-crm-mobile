---
name: squad-implement
description: Implement a squad-kit story plan (.squad/plans/<feature>/NN-story-*.md) end to end in this repo — the third step of the loop after /squad-new-story and /squad-plan. "implement story 27", "build SCRUM-45 from the plan", "execute this plan". Drives the plan through the gates and the completion review; never edits the plan.
argument-hint: "<path to NN-story-*.md, or a SCRUM id>"
user-invocable: true
---

# Implement a squad-kit story

`CLAUDE.md` describes the loop: `squad new-story` → `/squad-plan` → **implement the generated
`NN-story-*.md` in a fresh, scoped session**. This skill is that third step. The plan is the
contract; this skill is the discipline for executing it.

## 0 — Resolve the plan

- `$ARGUMENTS` is a path → read it. A `SCRUM-nn` id → `Glob .squad/plans/**/*-SCRUM-nn.md`. Empty
  → ask; do not guess from `00-index.md`.
- **The plan file is read-only.** Never edit it, and never touch a first line starting with
  `<!-- squad-kit:`. If the plan is wrong, say so and stop — revising it is `/squad-plan`'s job
  and the user's call.
- Read the story's `intake.md` under `.squad/stories/<feature>/<id>/` for the acceptance criteria
  the plan was derived from.

## 1 — Read the plan the way it asks to be read

Every plan here has the same sections; honour them in order:

1. **"Read this before anything else"** and **"Prerequisites"** — these are gates, not context.
   If a prerequisite (a table, a bucket, an RLS policy, a regenerated `database.ts`) is not met,
   stop and report; do not build against a schema that isn't there.
2. **"Context — Read These Files First"** — read every file listed, fully, before writing.
3. **"Product rules (from story)"** — binding. Quote them back in your final report.
4. **"Backend Tasks"** — usually not yours. If any are unfinished, say which and whether the
   frontend can proceed without them.
5. **"Frontend Tasks"** — the work. Execute in the given order; each task names files and shapes.
6. **"Edge Cases & Failure Modes"** — each one must be visibly handled in code, not assumed.
7. **"Test Plan"** and **"Verification Steps"** — there is no test runner; these are manual
   steps plus the three gates. Run what can be run; list the rest for the user verbatim.
8. **"Done Criteria"** — the checklist for your final report.
9. **"Open questions — do not resolve silently"** — carry every one into your report untouched.

## 2 — Execute

- Scaffold new anatomy with `/rn-feature` conventions; strings with `/rn-l10n`; screens from a
  frame with `/rn-screen-from-figma`. The plan's file list wins over any skill's default layout.
- Work task by task. After each task that touches `.ts/.tsx`, the post-edit hook has already
  run prettier + eslint; fix anything it surfaced before the next task.
- `npm run typecheck` after any route or type change — `typedRoutes` regenerates on it.
- When the plan and the repo disagree (a file moved, a hook renamed), **follow the repo** and
  note the drift in your report — do not silently do either.

## 3 — Finish (all mandatory)

1. `/gates` — lint, typecheck, contrast.
2. Walk **"Done Criteria"** item by item: met / not met / needs manual check.
3. Update `CLAUDE.md` "Project status" (and `AGENTS.md` if the change is architectural) — the
   plan probably lists this as a task; do it even if it doesn't.
4. `/rn-code-review`.
5. Report: what was built, drift from the plan, done-criteria table, manual verification steps
   for the user, and the open questions copied verbatim. Then hand off to `/close-story` — do
   **not** commit, transition Jira, or open a PR from here.

## Never

- Resolve an "Open questions" item because it seemed obvious.
- Skip a prerequisite by stubbing data.
- Widen scope to an adjacent story because you were "already in the file".
