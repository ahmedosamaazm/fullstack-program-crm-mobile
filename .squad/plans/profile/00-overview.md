# profile — plan overview

Entry point for the **profile** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 06 | [06-story-profile-and-settings-SCRUM-46.md](06-story-profile-and-settings-SCRUM-46.md) | Profile and settings | SCRUM-46 | `design-system` 01, `auth` 02, `home` 03 |

## Dependency notes

Story 06 depends on [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md)
and is the **first consumer of five components** that story built and nothing has used since:
`SettingsRow`, `RowGroup`, `BottomSheet`, `SheetHeader` and `Avatar`. It is the second consumer of
`SegmentedControl`. It needs **no new icons** — `globe`, `theme`, `bell`, `info` and `signOut`
already match Figma's five glyphs one-for-one, the first story where that is true.

It depends on [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md)
for `useAuth()`, `signOut()` and the `Stack.Protected` guard that carries the agent back to the login
screen — sign-out needs no navigation call of its own.

It depends on [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md)
for the `src/app/(tabs)/` shell and for `useAgentProfile`, which the intake explicitly says to reuse
rather than writing a second query against `['profile', …]`.

**It does not depend on stories 04 or 05 and touches none of their files** — it can run in parallel
with either. It is also the only screen story so far whose Figma subtree resolves entirely to real
scale tokens: `get_variable_defs` on node `83:675` returns no legacy `font size/13_5`-style values at
all, so nothing needs snapping.

Story 06 reaches outside the profile folder in three deliberate ways:

- **It adds a `dividerInset` option to `core/components/SettingsRow.tsx`'s `RowGroup`.** Figma insets
  card dividers to 48 — under the label, past the leading icon — while `RowGroup` hardcodes 16.
  Additive and defaulted to today's behaviour; `RowGroup` has zero consumers.
- **It adds `isDirectionRestartPending()` to `core/lib/i18n/index.ts`.** `bootstrap()` already
  computes `directionChangePending` and documents it as "Surface a 'restart required' notice", but
  `src/app/_layout.tsx:36` reads only `themeMode` and `fontsLoaded` and drops it. Rather than plumb
  it through the root layout, the check is exposed where the direction rules already live.
- **It wraps `signOut` in `features/auth/session-context.tsx` in `try`/`finally`.** `signOutAgent`
  throws on any Supabase error, which currently skips `queryClient.clear()` — so a sign-out that
  fails on a flaky network leaves the previous agent's tickets and customers in the cache. That is
  exactly the leak the intake asks this story to prevent, so the clear becomes unconditional.

It deliberately stops short of three neighbouring concerns:

- **US-028 notification centre** — not built; §9 of the API reference is marked 🔨 with "No table
  exists yet".
- **Delivering push or email** — no sender, no `expo-notifications` dependency. The Notifications row
  stores a local preference nothing reads, and says so in the UI.
- **Editing the agent's own profile** — no story exists; the identity card is read-only.

Seven open questions are recorded at the end of story 06. The first is unusual and load-bearing:
**this story has no acceptance criteria and no BRD entry.** The intake's criteria block is empty and
`docs/phase1_brd_1.md` ends at US-028 — there is no US-030 — so `## Done Criteria` is derived from a
one-sentence description and a Figma frame rather than transcribed. The remaining six are the
unbacked Notifications row, Figma's "Arabic · English" language value, the sign-out confirmation the
design does not show, the missing build number in `app.json`, whether the version string should use
Arabic-Indic digits, and the read-only identity card.
