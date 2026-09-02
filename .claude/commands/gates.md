---
description: Run the three gates in order — lint → typecheck → contrast — and stop at the first failure.
---

Run this repo's whole automated safety net. There is **no test runner** here; these three
commands are it (see `AGENTS.md` "Commands" — run order is fixed).

## Steps

1. `npm run lint`. If it exits non-zero, **stop** and report the violations with file:line —
   these are hard rules 2–5 (`eslint.config.js`), not style nits.
2. `npm run typecheck`. If it exits non-zero, **stop** and report the errors.
3. `npm run contrast`. Read the final line. It must be exactly:

   `0 failure(s), 2 figure/ground warning(s), 3 documented exemption(s).`

   - Any `failure(s) > 0` → a token pair the components render fell under WCAG AA. Report the `FAIL` rows.
   - `warning(s) > 2` → a token change collided something new. Report the extra `WARN` block.
     The two expected warnings are story 26 / SCRUM-13 open questions 1 and 3 — do not "fix" them.
   - `exemption(s) != 3` → an `EXEMPT` row was added or removed; check `scripts/contrast-audit.ts` for its written reason.

## Report

One line per gate — `lint PASS` / `typecheck PASS` / `contrast PASS (2 expected warnings)` — or the
failing output. If `$ARGUMENTS` contains `--fix`, run `npm run lint:fix` before step 1 and say what
it changed.

Do not modify source to make a gate pass unless asked; report and stop.
