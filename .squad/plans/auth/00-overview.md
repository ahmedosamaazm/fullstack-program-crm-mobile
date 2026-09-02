# auth — plan overview

Entry point for the **auth** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 02 | [02-story-agent-login-SCRUM-17.md](02-story-agent-login-SCRUM-17.md) | Agent login | SCRUM-17 | `design-system` 01 |
| 18 | [18-story-session-persistence-SCRUM-18.md](18-story-session-persistence-SCRUM-18.md) | Session persistence | SCRUM-18 | `auth` 02, `profile` 06 |

## Dependency notes

Story 02 depends on [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md):
it consumes the token layer, the `Text`/`TextInput`/`Icon` primitives, `Button`, `TextField` and
`SegmentedControl`, and it is gated by the `eslint.config.js` rules that story added.

Story 02 is the **first `src/features/` folder in the repo**, so it also establishes the feature
anatomy, the barrel-only import surface, and the `Stack.Protected` route guard in
`src/app/_layout.tsx`. Everything after it inherits those conventions.

It deliberately stops short of three neighbouring stories:

- **US-002 session persistence** — cold-start restore beyond the first `getSession()` read, the
  30-day inactivity rule, and full sign-out cache-clearing semantics. **Story 18 is this deferral,
  come due.**
- **US-003 password reset** — story 02 creates only a placeholder `(auth)/forgot-password` route so
  the design's link is not dead.
- **US-004 department/branch isolation** — story 02 checks `profiles.is_active` in the client and
  flags (open question 1) that the durable enforcement belongs in RLS.

---

## Story 18 — session persistence

Story 18 closes **US-002**, the first of the three stories story 02 deferred. It is the only story
in its verification batch with real code in it, and the code is four lines.

**The intake's central prediction is wrong, in the app's favour.** It expects sign-out to be
missing its cache clear; `session-context.tsx:71-79` already wraps `signOutAgent()` in a
`try`/`finally` and calls `queryClient.clear()` in the `finally`. Story 06 built that correctly.

**But the same criterion has a second path nobody wired.** An *involuntary* sign-out — a rejected
refresh token, which is exactly what the 30-day rule produces — reaches the app through
`onAuthStateChange` (`session-context.tsx:53-59`), which flips `status` to `signedOut` and never
touches the cache. The agent lands on Login with the previous session's tickets and customers still
resident for whoever signs in next. Task 1 clears on the `signedIn → null` **transition** (not on
`!session`, which would fire on every signed-out cold start), and deliberately keeps *both* clears:
the listener does not fire when `signOutAgent()` fails before dropping the local session, and the
`finally` does not fire when the server expires a session the app never asked about.

**Criterion `:475` is not client work at all.** The 30-day inactivity rule is a Supabase dashboard
setting (Authentication → Sessions → Inactivity timeout), and the plan is explicit that a
client-side expiry check would be bypassable and would drift from the real token state. Task 2 is
therefore a config change with its before/after value recorded in the PR, since a dashboard change
is invisible in a diff.

Five open questions close story 18. The load-bearing ones: **the agent is returned to Login with no
explanation** (question 1 — an expired session and a deliberate sign-out land on the identical
screen); **`signOutAgent()` passes no `scope`, so it inherits `supabase-js`'s global default** and
signs the agent out on every device, which may be right but is currently inherited rather than
chosen (question 3); and **inactivity timeout and absolute session cap are different rules**, only
one of which the BRD specifies (question 2).
