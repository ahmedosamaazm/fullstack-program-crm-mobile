# Squad-kit workflow — case study: SCRUM-17 (Agent login)

Personal running notes on the squad-kit loop, written up from the first feature actually taken
through it end to end. `.squad/README.md` has the three-line summary; this doc is the worked
example — the exact commands, what went into each file, and what broke along the way — so the
next feature can copy the shape instead of rediscovering it.

## Contents

- [1. Scaffold the intake](#1-scaffold-the-intake)
- [2. Fill in the technical hints before planning](#2-fill-in-the-technical-hints-before-planning)
- [3. Generate the plan](#3-generate-the-plan)
- [4. Execute the plan in a fresh session](#4-execute-the-plan-in-a-fresh-session)
- [5. Verify — typecheck, lint, then a real device](#5-verify--typecheck-lint-then-a-real-device)
- [6. Close the feedback loop](#6-close-the-feedback-loop)
- [7. Check the story's acceptance criteria, not the plan's](#7-check-the-storys-acceptance-criteria-not-the-plans)
- [8. Definition of Done — the cross-cutting gates](#8-definition-of-done--the-cross-cutting-gates)
- [9. Resolve or rehome the open questions](#9-resolve-or-rehome-the-open-questions)
- [10. Branch, commit, and update the tracker](#10-branch-commit-and-update-the-tracker)
- [Lessons for the next feature](#lessons-for-the-next-feature)
- [The closing checklist, condensed](#the-closing-checklist-condensed)

---

## 1. Scaffold the intake

```bash
squad new-story auth --id SCRUM-17
```

This fetched the Jira work item (`US-001 Agent login`, title/description/acceptance criteria) and
wrote `.squad/stories/auth/SCRUM-17/intake.md` from the `intake.md` template shipped in the
squad-kit package. The tracker fields (`Work item id`, `Status`, `Labels`) came prefilled; the
`Title`/`Description` blocks came prefilled from Jira too. Everything else in the template —
Feature name, Dependencies, Extra notes, **Technical hints**, **Out of scope** — starts blank and
is the human's job to fill before planning, because the planner (§2 below) reads this file
**verbatim** and never follows a link.

## 2. Fill in the technical hints before planning

The intake template has an `## API` and `## Design` slot under "Technical hints." For SCRUM-17
these were filled in by hand, before ever running `/squad-plan`:

```md
## API
Endpoints: `docs/phase1_api_reference.md` §1 (Authentication).
Use `supabase.auth.signInWithPassword()` from supabase-js — the reference
documents raw HTTP because that's what Postman needs, but the SDK wraps it
and handles session persistence and refresh.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4614&t=hh59hMhEvs4UoarE-4
Fetch via Figma MCP during implementation.
```

Two things matter here that are easy to get wrong:

- **The API note names the SDK method, not just the endpoint.** `phase1_api_reference.md` documents
  raw `POST /auth/v1/token?grant_type=password` because that's what a Postman collection needs —
  pointing the planner at the endpoint alone would have produced a plan that hand-rolled `fetch()`
  calls instead of using the already-configured `supabase.auth` client. Naming the SDK method
  explicitly is what kept the plan aligned with `src/core/lib/supabase.ts`.
- **The Figma link carries a `node-id`.** `/squad-plan` doesn't call the Figma MCP tools itself (see
  §3) — the link is there so whoever implements the plan (§4) can call `get_metadata` /
  `get_screenshot` / `download_assets` against that exact node instead of guessing which frame in a
  34-component file is the right one.

Both `docs/phase1_api_reference.md` and `docs/phase1_brd_1.md` (the BRD with the five acceptance
criteria the plan's Done Criteria mirror) were already checked into `docs/` before this story
started — the intake just points at them rather than re-pasting their content.

## 3. Generate the plan

```
/squad-plan .squad/stories/auth/SCRUM-17/intake.md
```

This runs `generate-plan.md` (the meta-prompt shipped inside the installed `squad-kit` npm
package, not checked into this repo — `npm root -g`, then
`squad-kit/templates/prompts/generate-plan.md`) against the intake file. The meta-prompt enforces a
discovery pass before writing anything: `list_dir` the areas the intake mentions, `grep` for the
symbols it names, ranged-`read_file` the exact lines it will cite, and read at least one sibling
plan for tone. For SCRUM-17 that meant reading `TextField.tsx`, `Button.tsx`, `Icon.tsx`,
`errors.ts`, `supabase.ts`, the existing `.squad/plans/design-system/01-*.md` (the only prior
plan in the repo), the Figma node via `get_metadata`/`get_screenshot`, and the relevant
`@supabase/auth-js` and `expo-router` type declarations directly in `node_modules` — because the
meta-prompt's anti-hallucination rule is explicit: **no invented paths, line numbers, or symbols.**
A claim like "`Stack.Protected` takes a `guard` prop" had to be verified against
`node_modules/expo-router/build/views/Protected.d.ts` before it went in the plan, not recalled from
training.

Output: `.squad/plans/auth/02-story-agent-login-SCRUM-17.md` (14 implementation tasks, edge cases,
a manual test matrix, verification steps, done criteria, and four open questions), plus the new
`.squad/plans/auth/00-overview.md` and a new row in `.squad/plans/00-index.md` — this was the
first story in the `auth` feature folder, so both files were created rather than appended to.

**Planning only** — no application code changed in this step. Two open questions were flagged back
rather than silently resolved: whether `profiles.is_active` is (or should be) enforced in RLS
rather than just checked client-side, and whether the design has an error state at all (Figma
`7:4614` only shows the resting screen).

## 4. Execute the plan in a fresh session

```
implement this plan
```

Per `.squad/README.md` step 3, this ran in a fresh session with the plan file as the only story
context (plus the repo's `CLAUDE.md`/`AGENTS.md`, which always load). The plan's 14 tasks were
implemented roughly in order — core component extensions first (`TextField`, `Icon`,
`LanguageToggle`), then the brand asset (pulled straight from the Figma node named in the intake's
`## Design` line via `download_assets`), then the `src/features/auth/` folder itself (the repo's
first `features/` folder — `types.ts` → `api.ts` → `session-context.tsx` → `hooks.ts` →
`screens/LoginScreen.tsx` → `index.ts`), then the routes and the root-layout guard, then
`CLAUDE.md`, per the plan's own task 14 ("when reality and this file diverge, fix this file in the
same change").

The plan is treated as **read-only** during execution — when a lint rule caught something the plan
hadn't anticipated (see §5), the fix went into the source file, not into a plan-file rewrite.

## 5. Verify — typecheck, lint, then a real device

```bash
npm run typecheck
npm run lint
```

Both are real gates (`eslint.config.js` enforces the hex/font/layout/import rules), and both caught
real things on the first pass:

- `TextField.tsx` and `LoginScreen.tsx` imported `TextInput`'s *type* from `react-native` for ref
  typing — `no-restricted-imports` flags that even as a type-only import, since the rule matches on
  import name regardless of `import type`. Fixed by typing refs with React's `ComponentRef<typeof
  TextInput>` against the *wrapped* `@/core/components` `TextInput`, never the raw RN one.
- The brand-mark `<Image source={require('...')} />` tripped
  `@typescript-eslint/no-require-imports` — `require()` is the idiomatic way to load a static image
  asset in Metro, so this got a single targeted `eslint-disable-next-line` with a comment saying
  why, not a rule change.

With both green, the app was launched on a real Android emulator (`npm start`, deep-linked into an
already-running Expo Go via `adb shell am start -a android.intent.action.VIEW -d
"exp://<lan-ip>:8081"`) and driven end to end against the **live** Supabase project — not mocked:
empty-field validation blocking the network call, a real `signInWithPassword()` round trip
returning `invalid_credentials` and rendering it as "Incorrect email or password.", the password
reveal toggle, and the Arabic switch. Two adb quirks worth remembering for next time: `adb shell
screencap`/`uiautomator dump` need `MSYS_NO_PATHCONV=1` in Git Bash on Windows or `/sdcard/...`
paths get mangled into `C:/Program Files/Git/sdcard/...`; and with two emulators attached, every
`adb` call needs an explicit `-s <serial>` or it's ambiguous which device it's talking to.

## 6. Close the feedback loop

Manual testing by a human caught two things a `git diff` read-through hadn't:

1. **A real bug** — the language switcher's two segments rendered with no visible labels. Root
   cause: `SegmentedControl`'s segments are `flex: 1` inside a row, which only resolves against a
   parent with a *definite* width; `LanguageToggle` wrapped it in a shrink-to-content
   `alignSelf: 'center'` view with no width, so Yoga had nothing to distribute the flex against and
   the segments collapsed too narrow to fit "English"/"Arabic". Confirmed by cropping and
   zooming the actual screenshot pixel-for-pixel (the label text was present in the accessibility
   tree the whole time — Android's node-merging for focusable/tab-role views hides child text nodes
   from `uiautomator dump` even when the text is genuinely invisible on screen, which is what made
   this one non-obvious). Fixed by giving the wrapper an explicit `width: 200` instead of relying on
   shrink-wrap, with a comment on the fix explaining the constraint so a later "cleanup" doesn't
   silently regress it.
2. **Expected behaviour, not a bug** — Arabic field labels rendering left-aligned until the app is
   reloaded. React Native latches `I18nManager`'s RTL flag at native startup; `setLocale()` already
   returns a "restart required" flag for exactly this reason, and `LanguageToggle` already surfaces
   the notice. This was flagged as understood-and-documented rather than "fixed."

Neither of these was speculative — both were confirmed on-device before being called done or
not-a-bug.

## 7. Check the story's acceptance criteria, not the plan's

The plan file carries its own **Done Criteria**, and §5–6 verified those. That is not the same list
as the story's acceptance criteria, and conflating the two is the easiest way to close a feature
that does not actually meet its spec. The plan describes what *this implementation* set out to do;
`docs/phase1_brd_1.md` US-001 describes what the *story* requires. A plan can be fully executed and
still miss a criterion nobody translated into a task.

So this pass is deliberately separate: open the BRD, walk the five criteria one at a time, and note
where each is satisfied. Fill the table from what was **observed**, never from what the test plan
intended to cover — every row starts at "not verified" and is promoted only when it can name a
specific observation.

| # | Acceptance criterion | Status | Evidence |
|---|---|---|---|
| 1 | Valid credentials authenticate and route to Home | **Not verified** | No test-account password was available; the success path was never exercised. Also blocked in principle — `src/app/index.tsx` is still a placeholder, so there is no Home to route to yet |
| 2 | Invalid credentials show a clear error, no session created | Verified | On-device, live Supabase: `invalid_credentials` → "Incorrect email or password." |
| 3 | A deactivated account (`is_active = false`) is refused | **Not verified** | Never exercised — see below |
| 4 | No self-registration option is present | Verified (weak evidence) | Source inspection of `LoginScreen.tsx`, not on-device observation — a different, weaker class of evidence than rows 2 and 5 |
| 5 | An empty required field blocks submission | Verified | On-device, validation fires before any network call |

**Two of five criteria are unverified, not one.** Criteria 1 and 3 are both untested, and for the
same mundane reason: the plan's own Prerequisites section called for "a test account and its
password," nobody secured one before implementation started, and by verification time a third of the
manual test matrix was simply unrunnable. That is a prerequisite failure, not a testing failure.

Criterion 3 has a second cause worth separating out: it is also the subject of open question 1 from
§3. The planner flagged uncertainty about whether `profiles.is_active` is enforced in RLS or only
checked client-side; that uncertainty went into the plan, survived implementation, and then went
untested — so the honest status is "unknown," not "passing." Testing it is cheap once a password
exists: flip `is_active` to `false` for `omar@azm.test` in Supabase, attempt a login, and see what
happens. Do that before closing, because "the criterion is probably fine" and "the criterion holds"
are different claims.

Two shapes of failure are worth naming:

- **An open question in the plan is a criterion at risk.** Anything the planner was unsure about
  should be the first thing on the manual test list, not the last.
- **A verification table filled from intent will overclaim.** The first draft of this very table
  marked criterion 1 as verified on-device, which never happened — the exact error §7 exists to
  prevent, made inside §7. Default to unchecked; promote on evidence.

## 8. Definition of Done — the cross-cutting gates

BRD §10 applies the five Technical Foundation tasks to *every* story, which means a story is not
done when its own criteria pass — it is done when its criteria pass **and** the app still holds up
across locale, theme, and form factor. These are easy to skip because they are not in the story text
and nothing fails loudly when they are missed.

- [ ] Acceptance criteria — §7 above (criteria 1 and 3 outstanding)
- [x] **TF-01** Arabic RTL and English LTR — tested on-device; the RTL-restart behaviour in §6 is
      understood and surfaced to the user rather than silently broken
- [ ] **TF-02** Light and dark theme — **not tested.** Every screenshot taken during verification was
      light. Dark is not derivable by inverting light values, and the login screen has a brand asset
      that may not survive a dark background
- [x] **TF-03** Phone layout — tested on a phone-sized emulator
- [ ] **TF-03** Tablet layout — **not tested.** BRD TF-03 asks for master–detail at ≥600pt, both
      orientations, and rotation preserving scroll position and selection. Login is a single-pane
      screen so master–detail does not apply, but nothing confirmed the form does not stretch
      full-bleed at tablet width
- [ ] **TF-04** Tenancy scoping by direct API call — **N/A for this story.** Login establishes the
      identity that scoping keys off, but this story renders no department- or branch-scoped list to
      verify. It becomes live on the first story that lists tickets or customers
- [x] **TF-05** Loading and error states — the submitting state and the credential error were both
      exercised on-device
- [ ] No hardcoded strings — **manual check, not enforced.** `eslint.config.js` has no i18n rule;
      it bans hex literals, `fontWeight`/`fontFamily` keys, physical layout props, physical
      `textAlign`, and the layering/deep-import patterns. Nothing stops a bare string reaching a
      component, so this needs eyes on the diff or a new rule
- [x] No colour literals outside `src/core/lib/theme/primitives.ts` — enforced by lint

Three gaps, all cheap to close: relaunch the emulator in dark mode, resize (or use a tablet AVD) to
check the form does not stretch, and read the diff for bare strings. None needs new code if the
tokens and breakpoint hook were used correctly — which is the point of checking, since "correct by
construction" is a hypothesis until observed.

> The `tokens.ts` / `primitives.ts` distinction matters: the design-system story **deleted**
> `tokens.ts` when it split the theme folder. A DoD checklist that names a deleted file is a gate
> nobody can check — when copying this list forward, verify the paths still exist.

## 9. Resolve or rehome the open questions

`/squad-plan` surfaced four open questions and correctly refused to invent answers to them. That is
the right behaviour, but it creates a disposal problem: once the plan file has served its purpose,
nobody opens it again, and an unresolved question dies there quietly.

Each one needs a destination before the story closes:

**Open question 1 — is `profiles.is_active` enforced in RLS?**
This is a security gap, not a nicety. Right now a deactivated agent may still be able to
authenticate, because Supabase Auth does not know about a column in `public.profiles`. The fix
belongs in the backend — either an RLS predicate, or a check in the session bootstrap that signs the
user out if their profile is inactive. Raise it as a Jira issue against the Authentication epic and
link it to SCRUM-17, rather than leaving it in a plan file.

**Open question 2 — does the design have an error state?**
Figma node `7:4614` shows only the resting screen. The implementation invented an error treatment,
which is reasonable but undocumented. Either add the state to Figma, or write the treatment into a
spec doc the next screen can consult. Note there is **no `DESIGN.md` in this repo today** — the
design-system spec currently lives in
`.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md`, whose §15 already holds
ten open flags raised back to design. Adding an eleventh there, or creating `DESIGN.md` as a real
home for resolved decisions, are both fine; leaving it in a story plan is not. Undocumented invention
is how two screens end up with different error styling.

The other two questions get the same treatment: resolved, ticketed, or written into a spec doc.
"Mentioned in a plan" is not a resting place.

> This is the step most likely to be skipped, because nothing breaks if it is. The cost shows up
> three stories later, when the same question is rediscovered from scratch.

## 10. Branch, commit, and update the tracker

```bash
git checkout -b feature/scrum-17-agent-login
```

Branch created from `main` after implementation and verification, everything already staged. A
commit message was drafted (Conventional Commits style, `feat(auth): ...`, naming the acceptance gap
called out in open question 1) and offered for approval rather than committed automatically —
commits happen only when the human says so, per this repo's working agreement.

**Then update Jira, which is the step the first run forgot entirely.** SCRUM-17 sat in *To Do* through
planning, implementation, and verification. No Jira MCP was connected in that session, so this could
not have been done from the agent even if anyone had remembered — connecting one is a prerequisite,
not something to assume. Once it is, the update is a single prompt:

```
Move SCRUM-17 to In Review. Add a comment recording which acceptance criteria
were verified and how, and note that criteria 1 and 3 (valid login, deactivated
account) are outstanding pending a test-account password, with criterion 3 also
blocked on the RLS question raised as <new issue key>.
```

The comment matters more than the transition. Six weeks from now, "Done" alone will not say whether
RTL was actually checked or merely assumed — and the whole point of writing verification notes onto
the ticket is that the backlog stays auditable after the memory fades.

With two of five criteria unverified, *Done* is not the honest transition here. The options are to
leave the story in progress until they are closed, or to close it and immediately raise each gap as
its own issue. What should not happen is closing it silently — and note that the gap is a missing
password, not missing code, so it is closeable in minutes once someone hands over a credential.

---

## Lessons for the next feature

- **Name the SDK method in the intake's `## API` note, not just the endpoint.** The reference doc
  is written for Postman; the plan needs to consume the already-wired client.
- **Paste a `node-id`-bearing Figma link, not a bare file link**, and expect the implementer to
  call the Figma MCP tools directly rather than trust dimensions recalled from memory.
- **Read `node_modules` type declarations for anything version-sensitive** (this Expo SDK, this
  supabase-js version) before writing it into a plan — `AGENTS.md`'s "Expo has changed" warning is
  not a suggestion.
- **`npm run typecheck && npm run lint` passing is necessary, not sufficient.** Both bugs in §6 sat
  on the far side of a clean lint/typecheck pass; only driving the app on a real device — and
  looking closely at a *zoomed-in* screenshot when a widget looked "off" — caught them.
- **For layout bugs, presence-checks are the wrong instrument.** The switcher bug in §6 survived two
  rounds of screenshotting: a blue pill on the left pattern-matches as a correct selected state, and
  `uiautomator dump` showed the label text present the whole time because Android merges child text
  into focusable tab-role nodes. Anything whose correctness is about *size* rather than *existence*
  needs crop-and-zoom, or a side-by-side against the design at matching scale. The accessibility tree
  answers "is it rendered," never "is it visible."
- **When something looks broken and the platform surface (Expo Go, `adb`, an emulator) is unusual,
  isolate before diagnosing the app.** Two Android emulators attached to the same host produced
  most of the confusing intermediate readings during verification, not the app itself.
- **The plan's Done Criteria are not the story's acceptance criteria.** Check both, separately, and
  check the second against `docs/phase1_brd_1.md` rather than the plan file. A plan can be executed
  to the letter and still miss a criterion nobody turned into a task — criteria 1 and 3 here are
  exactly that.
- **Default every verification row to "not verified"; promote only on a named observation.** The
  first draft of §7's table marked criterion 1 as tested on-device when it never was — filled in from
  the intent of the test plan rather than from what actually ran. A table written from memory will
  overclaim, and it will overclaim in exactly the place nobody re-checks.
- **Tick off the plan's manual test matrix; don't skim it.** The plan shipped a 12-row matrix and
  rows 4, 5, 6 and 12 (valid login, cold-start persistence, sign-out, deactivated account) were never
  run, with nothing tracking that. "I tested it" quietly came to mean "I tested the rows that were
  cheap."
- **Prerequisites are gates, not FYI.** The plan's Prerequisites section asked for a test account
  *and its password*. Nobody secured one before starting, so a third of the matrix was unrunnable by
  the time anyone looked — and two acceptance criteria are still open over a missing credential
  rather than missing code. Confirm you can satisfy every prerequisite before implementation, not
  during verification.
- **An open question in the plan is a criterion at risk.** The planner's uncertainty about
  `profiles.is_active` and the untested deactivated-account criterion were the same gap wearing two
  hats. Put anything the planner flagged at the *top* of the manual test list.
- **The Definition of Done gates are invisible unless deliberately checked.** Nothing fails loudly
  when dark mode is never opened or a tablet width is never tried. Light-mode-phone-only is the
  default path of least resistance, and it will stay that way for 28 more stories unless it becomes
  a checklist item.
- **Decide where open questions go before closing the story.** A plan file is a working document,
  not a backlog. Anything unresolved needs a Jira issue or a line in a spec doc, or it evaporates.
- **Update the tracker in the same session as the work.** It is the cheapest step and the first one
  dropped, and a backlog that lags reality stops being worth consulting.

---

## The closing checklist, condensed

For copying into the next feature's notes. Steps 1–6 are the build; 7–10 are what actually closes it.

**Build**
- [ ] `squad new-story <feature> --id <KEY>`
- [ ] Fill `## API` (name the SDK method) and `## Design` (`node-id` link) before planning
- [ ] `/squad-plan <path to intake.md>`
- [ ] **Satisfy the plan's Prerequisites before writing code** — credentials, seeded rows, access.
      Anything unobtainable makes part of the test matrix unrunnable, and you want to know now
- [ ] Implement in a fresh session, plan as the only story context
- [ ] `npm run typecheck && npm run lint`
- [ ] Drive it on a real device against live Supabase, ticking off the plan's test matrix row by row

**Close**
- [ ] Walk the story's acceptance criteria one by one, from the BRD — not the plan. Every row starts
      unverified; promote only on a named observation
- [ ] Test anything the plan flagged as an open question first
- [ ] Definition of Done: Arabic **and** English, light **and** dark, phone **and** tablet, states built
- [ ] Confirm the DoD list's own paths still exist before trusting it (`tokens.ts` was already stale)
- [ ] Rehome every open question into a Jira issue or a spec doc
- [ ] Branch, draft the commit, get approval
- [ ] Move the ticket and comment with what was verified and how

The asymmetry is deliberate: the build half is mostly mechanical and the tooling carries it, while
the closing half is judgement and is entirely on the human. Typecheck and lint passing is necessary
and not sufficient — both bugs in §6, and both gaps in §8, sat on the far side of a clean run.