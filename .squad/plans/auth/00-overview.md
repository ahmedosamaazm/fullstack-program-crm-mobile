# auth — plan overview

Entry point for the **auth** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 02 | [02-story-agent-login-SCRUM-17.md](02-story-agent-login-SCRUM-17.md) | Agent login | SCRUM-17 | `design-system` 01 |

## Dependency notes

Story 02 depends on [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md):
it consumes the token layer, the `Text`/`TextInput`/`Icon` primitives, `Button`, `TextField` and
`SegmentedControl`, and it is gated by the `eslint.config.js` rules that story added.

Story 02 is the **first `src/features/` folder in the repo**, so it also establishes the feature
anatomy, the barrel-only import surface, and the `Stack.Protected` route guard in
`src/app/_layout.tsx`. Everything after it inherits those conventions.

It deliberately stops short of three neighbouring stories:

- **US-002 session persistence** — cold-start restore beyond the first `getSession()` read, the
  30-day inactivity rule, and full sign-out cache-clearing semantics.
- **US-003 password reset** — story 02 creates only a placeholder `(auth)/forgot-password` route so
  the design's link is not dead.
- **US-004 department/branch isolation** — story 02 checks `profiles.is_active` in the client and
  flags (open question 1) that the durable enforcement belongs in RLS.
