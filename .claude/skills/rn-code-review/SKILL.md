---
name: rn-code-review
description: Read-only completion review for this Expo/React Native repo — runs the three gates, verifies the hard rules eslint cannot enforce, then hands the correctness pass to /code-review. Use before marking any task done, or when the user says "task done", "finished", "review this", "ready for PR".
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git merge-base:*), Bash(npm run lint:*), Bash(npm run typecheck:*), Bash(npm run contrast:*)
---

# Completion Review — AZM CRM (Expo / React Native)

Read-only. **Do not modify code during this step** — fixes come after the report, per the
workflow rule in the global `CLAUDE.md`.

**Process-only by design.** The convention *content* is read fresh from the repo at run time
(`CLAUDE.md`, `AGENTS.md`). **Never review against a memorized or restated checklist** — restated
rules drift from the source and end up approving violations. Where anything below conflicts with
those files, **the files win**.

This skill covers what is specific to *this* repo. It deliberately does **not** restate generic
correctness review — step 5 delegates that.

## 1 — Resolve the review scope

1. `git status`, then `git diff` (staged + unstaged together).
2. **If the working tree is clean, the review target is the branch**: `git merge-base HEAD main`,
   then diff `<merge-base>..HEAD`. **Never report PASS against an empty diff** — an empty
   working-tree diff means the work was committed, not that there is nothing to review.
3. List the changed files. For each, read enough surrounding context to understand intent — a
   diff hunk alone hides broken callers and duplicated logic.

## 2 — Load the conventions (run-time source of truth)

Read `CLAUDE.md` and `AGENTS.md`. Treat **every `##` section as a rule set** the diff must
satisfy, and note that `CLAUDE.md`'s "Project status" section is the spec for what exists — if
the diff and that section diverge, **the diff must update the file in the same change**.

## 3 — Run the gates

There is **no test runner** in this repo. These three commands plus manually exercising the app
are the whole safety net, so all three must run and pass:

```
npm run lint        # eslint — enforces hard rules 2-5 mechanically
npm run typecheck   # tsc --noEmit
npm run contrast    # scripts/contrast-audit.ts — WCAG AA over both palettes
```

`contrast` must end `0 failure(s), 2 figure/ground warning(s), 3 documented exemption(s)`.
Those two warnings are expected and open with design (story 26 / SCRUM-13 open questions 1 and 3).
**A third warning is a finding** — a token change collided something new. A new `EXEMPT` entry
without a written reason is a blocker. If a component introduced a new token pairing, `PAIRS`
should have gained a row.

Do not grep for hex literals, `fontWeight`/`fontFamily`, physical layout props, `textAlign:
left|right`, cross-layer imports or deep feature imports — `eslint.config.js` already enforces all
of those. A clean `npm run lint` *is* that sweep.

## 4 — Judgment pass (the hard rules eslint cannot see)

- **Rule 1 — route files stay thin.** Anything under `src/app/` imports a screen and renders it.
  No data fetching, no layout logic. Check every changed file there.
- **Rule 6 — `src/core/types/database.ts` is generated.** Any hand-edit is a blocker; the fix is
  `npm run gen:types`. A diff that adds a table or column by hand is the failure mode to look for.
- **Rule 7 — locale never enters the data layer.** `api.ts` returns `{ name_en, name_ar }`
  unresolved; components resolve with `useLocalisedName()` and read locale with `useLocale()`.
  **`currentLocale()` or `I18nManager` in a render path is a blocker** — the query cache keys
  carry no locale, so resolving early bakes the language into the cache. Sorting must use
  `sort_order`, never `name_en` while displaying `name_ar`.
- **State management.** Server state → TanStack Query only; auth/theme/locale → Context;
  everything else → local `useState`. **A new global store (Redux, Zustand, any singleton holding
  server data) is a blocker** — it is a deliberate architectural decision, not an oversight.
  Something that looks like it needs global state is nearly always a query belonging in a
  feature's `hooks.ts`.
- **Query keys and invalidation.** New queries follow the existing key shape
  (`['customers', id]`, `['customers', id, 'notes']`). Every mutation invalidates what it actually
  changed — a stale list after a create or edit is the usual miss. Check that data already
  embedded in a parent response is not re-fetched separately.
- **The `tickets` ↔ `customers` barrel cycle.** Both features import each other through their
  barrels. This is a **known, accepted cycle**, safe only because both directions are used inside
  render paths and never at module scope. Do not flag it as a bug. **Do** flag: a new module-scope
  use of either barrel, or a deep import added to dodge it (that violates rule 4).
- **Text rendering.** Every string goes through `core/components/Text` / `TextInput`, which resolve
  a `weight` prop to a concrete `fontFamily`. Android does not synthesise weight for custom
  families, so `fontWeight` beside a custom font must never coexist.
- **RTL beyond the lint rule.** Logical props are linted, but check that new native surfaces
  behave: a direction-changing language switch needs `reloadApp()`, and `settings.restartRequired`
  is the reload-*failed* path only.
- **Routing.** `typedRoutes` is on — navigate with the object form
  (`router.push({ pathname: '/customers/[id]', params: { id } })`), never a template literal.
  New authenticated screens must be registered inside `Stack.Protected`; registering outside it
  leaks the screen to a signed-out deep link.
- **Native dependencies.** A new package must be installed with `npx expo install`, never plain
  `npm install`. Flag whether it needs a development build — `expo-updates` already does, and it
  does not work in Expo Go.
- **Open design questions.** `.squad/plans/design-system/01-*.md` §15 lists flags still open with
  design. A diff that silently resolves one is a finding — they are open questions, not settled.
- **Native config and docs.** New native config belongs in `app.json`, never hand-edited `/ios` or
  `/android`. If the change touches the two `expo-splash-screen` colour literals, `primitives.ts`
  must stay in step by hand — that pair is the one permanent hole in hard rule 2.

## 5 — Delegate the generic pass

Run `/code-review` for correctness bugs and reuse/simplification/efficiency cleanups. Do not
duplicate its work here; fold its findings into the single report below, attributed.

## 6 — Report

```
## Review Summary
[PASS | NEEDS_CHANGES] — one-line verdict (NEEDS_CHANGES iff at least one blocker)

## Gates
lint / typecheck / contrast — PASS, or the failing output

## Findings
- [blocker] file:line — what + the rule violated (cite the CLAUDE.md/AGENTS.md section)
- [warn]    file:line — should fix, doesn't block completion
- [nit]     file:line — optional polish
(or "No findings.")

## Coverage
One line per rule set checked (each CLAUDE.md `##` section + hard rules 1-7): PASS or finding refs.
```

Severity: **blocker** = violates a stated hard rule, or breaks correctness/safety; **warn** =
convention drift or risk without a stated rule; **nit** = style/polish. Only blockers force
NEEDS_CHANGES. Every finding names a specific file and line and a suggested fix.

Manual verification (`npm start`, then `a`/`i`/`w`) is the user's step — state plainly that it has
not been done rather than implying the gates cover it.
