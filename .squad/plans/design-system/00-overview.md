# design-system — plan overview

Entry point for the **design-system** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 01 | [01-reflect-azm-design-system-in-react-native.md](01-reflect-azm-design-system-in-react-native.md) | Reflect the AZM design system in React Native | _(unlinked)_ | — |

## Dependency notes

Story 01 replaces the whole `src/core/lib/theme/` token layer, so it must land before any feature
work that consumes theme tokens. Its §11 sequencing is internally ordered: theme modules →
bootstrap → provider → primitives (`Text`/`TextInput`/`Icon`) → `IconButton`/`Button` → the
remaining 11 components → migration of the 8 existing ones → ESLint → app entry + gallery.

The 18 domain components (TicketRow, StatusBadge, MessageRow, …) are explicitly **out of scope**
here — they ship under `src/features/<domain>/components/` with their own feature stories.
