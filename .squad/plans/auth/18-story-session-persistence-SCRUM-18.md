# Story 18 — Session persistence (Story: SCRUM-18)

> Intake: `.squad/stories/auth/SCRUM-18/intake.md`
> Figma: **none.** The intake says so outright — this story is behavioural, not visual.

## Read this before anything else

The intake's central prediction is **wrong, and in the app's favour**. It says:

> *"Criterion 3 is the one most likely to be missing … If Profile (SCRUM-46)'s sign-out doesn't call
> `queryClient.clear()` (or similar), a different agent signing into the same device would see the
> previous agent's cached data."*

It does call it. `src/features/auth/session-context.tsx:71-79` wraps `signOutAgent()` in a
`try`/`finally` and calls `queryClient.clear()` in the `finally`, with a comment explaining that a
network failure must not leave the previous agent's data cached. Story 06 built that correctly.

**But the same criterion has a second path that nobody wired**, and it is the one that actually
matters for this story: an **involuntary** sign-out. When the refresh token is rejected — which is
exactly what criterion 2's 30-day inactivity produces — `supabase-js` signs out locally and emits
`SIGNED_OUT` through `onAuthStateChange`. That handler (`session-context.tsx:53-59`) flips `status`
to `signedOut` and **never touches the query cache**. The agent is returned to Login with the
previous session's tickets, customers and counts still resident, ready to be served to whoever
signs in next.

Verified state of the three criteria:

| US-002 criterion (`docs/phase1_brd_1.md:474-476`) | Status | Evidence |
|---|---|---|
| `:474` Session resumes on reopen | **Met** | `core/lib/supabase.ts:18-26` — `storage: AsyncStorage`, `persistSession: true`, `autoRefreshToken: true`; `session-context.tsx:35-51` reads it on mount; `app/_layout.tsx:55-61` holds the splash until `status !== 'loading'` |
| `:475` Inactive over 30 days → Login | **Not met** | Nothing in this repo or (as far as the client can tell) the Supabase project enforces it. See task 2 — this is a **project config change**, not client code |
| `:476` Sign out clears session and cached data | **Partly** | Met on the explicit path (`session-context.tsx:71-79`); **not met** on the involuntary path. Task 1 |

**So this story is one small code change, one Supabase dashboard change, and the verification that
has never been run.** It is the only one of the five stories in this batch with real code in it.

---

## Prerequisites

- **Story 02 completed** — [`02-story-agent-login-SCRUM-17.md`](02-story-agent-login-SCRUM-17.md). It built `session-context.tsx`, `getCurrentSession`, `signOutAgent`, and the `Stack.Protected` guard. Its overview explicitly defers this story: *"US-002 session persistence — cold-start restore beyond the first `getSession()` read, the 30-day inactivity rule, and full sign-out cache-clearing semantics."* **This story is that deferral, come due.**
- **Story 06 completed** — [`../profile/06-story-profile-and-settings-SCRUM-46.md`](../profile/06-story-profile-and-settings-SCRUM-46.md). It built the confirmed sign-out that calls `useAuth().signOut()` (`profile/screens/ProfileScreen.tsx:73`), which is the path that already clears the cache.
- **Supabase dashboard access** with permission to change **Authentication → Sessions**. Task 2 cannot be done from this repo, and criterion `:475` cannot be closed without it. If you do not have that access, stop and get it before starting — the rest of the story is 20 minutes and this is the part that gates it.
- **Two agent accounts** in the same department. Verification step 4 (the one that proves the actual leak) needs a second identity to sign in as.

---

## Story Goal

An agent stays signed in across app restarts, is returned to Login after a long absence, and leaves
**nothing** behind for the next person to use the device. Concretely:

1. **A rejected refresh token clears the query cache**, not just the session — closing the half of criterion `:476` that only the involuntary path exercises.
2. **A 30-day inactivity timeout is configured on the Supabase project**, so criterion `:475` is enforced by the auth server rather than aspirationally documented.
3. **All three criteria are actually verified**, including the cold-start and cross-agent cases that have never been run.

**Not in scope**: a client-side "last active" timestamp or any client-enforced expiry (the auth
server owns session lifetime — a client-side clock is bypassable and would drift from the real
token state); biometric or PIN re-auth on resume (no story asks for it); password reset (US-003,
still a placeholder route per story 02); and any change to the splash/bootstrap sequence, which is
already correct and is load-bearing for the Arabic-first requirement.

---

## Context — Read These Files First

1. `src/features/auth/session-context.tsx` — all 94 lines, and read it twice. Specifically:
   - `:30-51` — the one-shot `getCurrentSession()` read, and the `prev.status === 'loading'` guard at `:39` and `:47` whose comment explains it must never clobber a newer value from the listener.
   - **`:53-59` — the `onAuthStateChange` handler. This is the function task 1 changes**, and the only place an involuntary sign-out is observable.
   - `:67-82` — the memoised context value, and the `signOut` at `:71-79` with its `finally { queryClient.clear() }`. **Task 1 must not duplicate or relocate this** — it stays exactly as it is.
2. `src/core/lib/supabase.ts:18-26` — the client config. `storage: AsyncStorage`, `autoRefreshToken: true`, `persistSession: true`, and `detectSessionInUrl: Platform.OS === 'web'`. **All four are already correct; this story changes none of them.** Read them so you can say so with evidence rather than assumption.
3. `src/features/auth/api.ts:151-160` — `getCurrentSession()` and `signOutAgent()`. Note `signOutAgent` calls `supabase.auth.signOut()` with **no `scope` argument**, so it uses the library default. That matters for open question 3.
4. `src/app/_layout.tsx:50-75` — `RootNavigator`. `:55` reads `useAuth().status`; `:58` hides the splash once status leaves `loading`; `:61` returns `null` while loading; `:65-75` are the two `Stack.Protected` blocks. **This is what makes criterion `:474` work and criterion `:475` visible** — a signed-out status re-parents the whole tree to `(auth)` with no imperative navigation.
5. `src/features/profile/screens/ProfileScreen.tsx:49`, `:73`, `:192-215` — the sign-out sheet and its `await signOut()`. The already-correct path; verification step 3 exercises it.
6. `src/core/lib/query-client.ts` — the `queryClient` singleton that `session-context.tsx:10` imports. Confirm `clear()` is being called on the same instance the providers use; a second instance would make the whole thing a no-op.
7. `docs/phase1_brd_1.md:466-476` — US-002 and its three criteria. `## Done Criteria` mirrors them verbatim.

---

## Product rules (from story)

| | Current behaviour | New behaviour |
|---|---|---|
| Explicit sign-out (Profile → Sign out) | Session cleared, **query cache cleared** | Unchanged |
| Refresh token rejected / session expired | Session cleared, returned to Login, **query cache retained** | Query cache **cleared** |
| Session inactive 30 days | Nothing enforces it — the session refreshes indefinitely | Auth server rejects the refresh; the app lands on Login with a clean cache |
| Cold start with a valid session | Splash held, session restored, no Login flash | Unchanged |

---

## Frontend Tasks

### 1 — Clear the query cache on an involuntary sign-out

**File: `src/features/auth/session-context.tsx`**

Replace the `onAuthStateChange` handler at `:53-59`:

```tsx
const { data } = supabase.auth.onAuthStateChange((_event, session) => {
  setState((prev) => {
    // An involuntary sign-out — a rejected refresh token, a session expired
    // by the server's inactivity timeout, or a sign-out from another device.
    // `signOut()` below clears the cache on the path an agent takes
    // deliberately; this is the path they don't, and BRD `:476` does not
    // distinguish between them. Without it, an expired session returns the
    // agent to Login with the previous session's tickets and customers still
    // resident for whoever signs in next.
    //
    // Guarded on the TRANSITION, not on `!session`: this listener also fires
    // with a null session on first subscribe, and clearing an empty cache on
    // every cold start is wasted work that also races the first queries.
    if (prev.status === 'signedIn' && !session) {
      queryClient.clear();
    }

    return {
      status: session ? 'signedIn' : 'signedOut',
      session,
      profile: session ? prev.profile : null,
    };
  });
});
```

**Two things this must not become:**

- **Do not clear on every `!session`.** The listener fires once on subscribe, and on a signed-out cold start that would call `clear()` before the first query is even registered — harmless today, but it makes the intent unreadable and it races the `getCurrentSession()` read above it.
- **Do not move `queryClient.clear()` out of `signOut` at `:77`.** The explicit path must clear even when `signOutAgent()` throws (that is what the `finally` is for), and this listener does not fire at all if the network call fails before the local session is dropped. **Both paths are needed; they are not redundant.**

A side effect worth naming: calling `clear()` inside a `setState` updater makes the updater
impure. React may invoke it twice in StrictMode. `queryClient.clear()` is idempotent, so this is
safe — but if that ever stops being true, hoist the transition check above `setState` by reading
a ref. It is written this way because `prev.status` is the only reliable source for "were we
signed in a moment ago", and reading it outside the updater reintroduces the stale-closure bug
that the `prev`-based pattern at `:38-42` exists to avoid.

---

## Backend Tasks

### 2 — Configure the 30-day inactivity timeout

**This is a Supabase dashboard change. No file in this repo implements it, and none should** — a
client-side expiry check is bypassable, drifts from the real token state, and would need its own
"last active" write on every app open.

In the Supabase dashboard for project `svcxmjibmgjtaxuzrquf`:

**Authentication → Sessions** → enable **"Inactivity timeout"** and set it to **30 days**
(`2592000` seconds). Leave "Time-box user sessions" off unless product asks for an absolute cap —
it is a different rule (see open question 2) and enabling both silently applies whichever is
shorter.

Then confirm the effect reaches the client: with the timeout enabled, a refresh attempt on a stale
session returns `400` with `invalid_grant` / `refresh_token_not_found`, `supabase-js` drops the
local session, and `onAuthStateChange` fires with `null` — which is precisely the transition task 1
now hooks. **Task 1 and task 2 are the same criterion from two ends; neither closes it alone.**

Record the setting's before/after value in the PR description. A dashboard change is invisible in
the diff, and the next person to read this plan needs to know whether it was actually applied.

---

## Edge Cases & Failure Modes

- **Cold start, signed out.** `onAuthStateChange` fires with `null` while `prev.status` is `'loading'`, so the transition guard is false and nothing is cleared. Correct — there is nothing to clear.
- **Cold start, valid session.** `getCurrentSession()` resolves first and sets `signedIn`; the listener then fires with the same session. `prev.status === 'signedIn'` but `session` is truthy, so no clear. Correct.
- **Sign-out from another device** (if `scope: 'global'` is in play — see open question 3). Reaches this client as a rejected refresh, i.e. the same transition. Cache cleared. Correct, and the reason the guard is on the transition rather than on an event name.
- **Explicit sign-out.** `signOut()` clears the cache at `:77`, *then* `signOutAgent()`'s local session drop fires the listener, which clears it again. Idempotent, and cheap. **Do not "optimise" one of them away** — see task 1's note.
- **`signOutAgent()` throws on a network failure.** The `finally` still clears (`:75-78`). The listener may not fire at all. This is the case the explicit clear exists for.
- **Token refresh fails transiently** (offline, 500). `supabase-js` retries and does **not** emit a sign-out for a recoverable failure, so the cache survives a tunnel. Only a genuine rejection triggers the transition.
- **StrictMode double-invocation of the `setState` updater.** `queryClient.clear()` runs twice. Idempotent. Noted in task 1.
- **An in-flight query resolves after `clear()`.** TanStack Query writes it back into the now-empty cache. The agent is already on Login and no authenticated screen is mounted to read it, and the next `clear()` or sign-in removes it. **Not worth a cancellation pass** — but it is why verification step 4 checks the cache after the *next* sign-in rather than immediately after the expiry.

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`) — no Jest, no test files, no `test`
script. This story does not add one: it is a four-line change plus a dashboard setting, and the
things worth proving here are cross-restart and cross-identity behaviours that a unit test cannot
reach anyway.

1. **Nothing this story adds is unit-testable in isolation.** The change is a branch inside a subscription callback that depends on `supabase-js` emitting a real auth event.
2. If a runner is ever added, the honest target here is an **integration** test with a mocked `onAuthStateChange`, asserting `queryClient.clear()` is called on `signedIn → null` and **not** on `loading → null`. That is a genuinely valuable test and it is exactly the assertion the transition guard encodes.
3. The matrix below is the test plan.

| # | Scenario | Expected |
|---|---|---|
| 1 | Sign in, force-quit the app, reopen | Lands on Home. **No Login flash**, no splash flicker |
| 2 | Sign in, background the app 10 minutes, resume | Still signed in; no re-auth |
| 3 | Profile → Sign out → confirm | Lands on Login; signing back in shows **fresh** data |
| 4 | Expire the session (step 5 below), reopen, sign in as a **second agent** | Second agent sees **only their own** tickets/customers — no flash of the first agent's data |
| 5 | Same as 4, but *without* task 1's change | First agent's data **is** briefly visible — this is the bug; confirm it reproduces before fixing, or you have not proven the fix does anything |
| 6 | Airplane mode, reopen a signed-in app | Stays signed in; queries show error/cached state; **not** bounced to Login |
| 7 | Switch to العربية, restart, repeat 1 | Session resumes, RTL correct, no LTR flash |

---

## Verification Steps

1. **Read the client config and state the finding.** `src/core/lib/supabase.ts:18-26` — confirm `persistSession`, `autoRefreshToken` and the `AsyncStorage` adapter. **This is the whole of criterion `:474`'s mechanism**; the intake asks whether it "should already be set from Sprint 1's scaffold", and the answer is yes. Record it rather than re-deriving it later.
2. **Prove criterion `:474` by force-quit, not by backgrounding** (matrix row 1). Backgrounding does not unload the JS context and proves nothing about `AsyncStorage`. Swipe the app away on iOS / `adb shell am force-stop` on Android.
3. **Prove the explicit sign-out already clears** (matrix row 3). Sign in as agent A, open Home and the Customers tab so both caches are populated, sign out, sign in as agent B, and watch the **first frame** of Home. If A's counts appear at all, `queryClient.clear()` is not reaching the instance the providers use — check context file 6.
4. **Reproduce the involuntary-path leak before fixing it** (matrix row 5). This is the step that makes the story worth doing, and skipping it means shipping a fix for a bug nobody saw. To force the expiry without waiting 30 days, either:
   - set the inactivity timeout to a short value (60 seconds) in the dashboard, idle past it, and reopen; **or**
   - delete the refresh token from the persisted session in `AsyncStorage` and trigger a refresh.

   Then re-run with task 1 applied and confirm the leak is gone.
5. **Apply and confirm task 2**, then **set the timeout back to 30 days** if you shortened it for step 4. Leaving a 60-second timeout in the project would be a far worse defect than the one this story fixes. Record the final value.
6. **Typecheck:** `npm run typecheck` — zero errors.
7. **Lint:** `npm run lint` — zero errors.
8. **Frontend runs:** `npm start`, `a` and `i`. Walk matrix rows 1–4, 6, 7.
9. **Regression — the bootstrap sequence** (matrix row 7). Task 1 touches the auth listener, which runs alongside `bootstrap()`. Confirm a cold start in Arabic still applies RTL before first paint; an LTR flash means the provider ordering in `_layout.tsx` moved.
10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:474-476` (US-002).

- [ ] Given I am logged in, when I close and reopen the app, then **my session resumes**
- [ ] Given a session inactive over 30 days, when I open the app, then **I am returned to Login**
- [ ] Given I sign out, when the action completes, then **all session and cached data are cleared**

Plus, from the intake and this plan:

- [ ] The **involuntary** sign-out path clears the query cache, not only the explicit one
- [ ] The clear is guarded on the `signedIn → null` **transition**, not on `!session`
- [ ] `queryClient.clear()` in `signOut`'s `finally` (`session-context.tsx:77`) is **still there** — both paths are needed
- [ ] The Supabase **inactivity timeout is set to 30 days**, and the before/after value is recorded in the PR description
- [ ] `supabase.ts`'s four auth options are **unchanged** — verified as already correct, not modified
- [ ] The leak was **reproduced before it was fixed** (verification step 4)
- [ ] Any temporary short timeout used for testing has been **reset to 30 days**
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] `CLAUDE.md` records session persistence as verified, and names the dashboard setting as the enforcement point for the 30-day rule

---

## Open questions — raise with design/product, do not resolve silently

1. **The agent is returned to Login with no explanation.** An expired session and a deliberate sign-out land on the identical screen. BRD `:475` only requires the return, but an agent who was signed in yesterday and is now at Login will assume the app broke. A one-line banner ("Your session expired — please sign in again") costs a param on the `(auth)` route and an i18n key. **Product call**, and worth making now because the routing change is cheap today and awkward once notifications land on the same screen.
2. **Inactivity timeout and absolute session cap are different rules, and only one is specified.** BRD `:475` describes *inactivity*. Supabase also offers "time-box user sessions" (an absolute maximum regardless of activity), which is the control most security reviews actually ask for. This story configures inactivity only, because that is what the criterion says. **Confirm whether an absolute cap is also wanted** — if both are enabled, the shorter one wins silently and the 30-day number becomes misleading.
3. **`signOutAgent()` does not pass a `scope`, so it uses `supabase-js`'s default.** In v2 that default signs the user out **everywhere**, not just on this device — an agent signing out on their phone is also signed out on a tablet mid-ticket. That may well be the desired security posture, but it is currently inherited rather than chosen, and it is invisible at the call site (`auth/api.ts:157-160`). **Decide it explicitly and pass the scope**, so the next reader does not have to know the library default to know the behaviour.
4. **30 days is asserted by the BRD with no stated rationale**, and it interacts with a detail nobody has checked: Supabase refresh tokens rotate on every use, so an agent who opens the app daily is never near the limit, while one returning from a month's leave is bounced. That is the intended behaviour — but confirm 30 days is a real policy number and not a placeholder, because changing it later is a dashboard toggle and changing the *rule* is not.
5. **Nothing clears `AsyncStorage` beyond the Supabase session.** `queryClient.clear()` is in-memory only; the persisted locale and theme survive a sign-out, which is correct (they are device preferences, not session data). But if any story later persists something agent-specific — a draft ticket, a last-read marker — it will **not** be covered by either clear path, and this criterion will silently regress. Worth a note in `CLAUDE.md`'s state-management section rather than a code change now.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 19.**
