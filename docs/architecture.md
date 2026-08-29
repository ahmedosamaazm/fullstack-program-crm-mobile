# Project architecture & folder structure

Personal running notes on how this codebase is organized and why. The authoritative source is the project's `CLAUDE.md` — this doc explains the *reasoning* behind it in more beginner-friendly terms, since it's new territory for me. If the two ever disagree, `CLAUDE.md` wins and this file needs updating.

## Contents

- [The three concepts: routes, core, features](#the-three-concepts-routes-core-features)
- [Feature folder anatomy](#feature-folder-anatomy)
- [Path aliases](#path-aliases)
- [State management](#state-management)
- [Hard rules](#hard-rules)
- [Where things go — quick lookup](#where-things-go--quick-lookup)

---

## The three concepts: routes, core, features

```
src/
├── app/        expo-router routes ONLY
├── core/       infrastructure and generic, domain-free code
└── features/   one folder per business domain
```

Think of it as three layers with a strict direction of dependency:

**`app/` → `features/` → `core/`**

- **`app/`** is *only* wiring for [expo-router](https://docs.expo.dev/router/introduction/) (file-based navigation — a file's path in `app/` becomes a URL/screen route, similar in spirit to Next.js routing). A route file's whole job is "import a screen component, render it." No data fetching, no business logic, nothing else lives here.
- **`core/`** is infrastructure and generic code with zero knowledge of the app's business domain — the Supabase client, the TanStack Query client, i18n, theme tokens, generic reusable UI (`Avatar`, `EmptyState`, `Skeleton`...), generic hooks (`useDebounce`, `useBreakpoint`). See [supabase.md](./supabase.md) and [expo-guide.md](./expo-guide.md) for what's in here already.
- **`features/`** is where the actual business logic lives, one folder per domain: `auth`, `tickets`, `customers`, `home`, `notifications`, `profile`.

The dependency direction is non-negotiable: **`features/` may import from `core/`. `core/` may never import from `features/`.** If `core/` needed to know about a `Ticket`, that would mean domain logic leaked into infrastructure — a sign the code belongs in a feature instead.

## Feature folder anatomy

Every feature has the identical shape:

```
features/<feature>/
├── api.ts          Supabase queries and mutations
├── hooks.ts         TanStack Query hooks wrapping api.ts
├── types.ts
├── components/
├── screens/
└── index.ts          barrel — the feature's ONLY public entry point
```

Reading this as layers within a feature:

- **`api.ts`** — the data layer. Talks to Supabase directly (`supabase.from('tickets')...`). This is also where a Supabase error would get caught and passed through `toAppError` (see [supabase.md](./supabase.md#error-normalization)).
- **`hooks.ts`** — wraps `api.ts` calls in TanStack Query's `useQuery`/`useMutation`. This is the layer screens actually call.
- **`screens/`** and **`components/`** — presentation. Call the hooks, render UI, hold local UI state. No business logic and no direct Supabase calls here.
- **`index.ts`** — the barrel. Other features (and `app/`) are only allowed to import from this file, e.g. `@/features/tickets`, never reach into `@/features/tickets/api` directly. This keeps a feature's internals swappable without breaking every importer.

## Path aliases

`@/core/*` and `@/features/*` resolve to `src/core/*` and `src/features/*` — configured in `tsconfig.json`. Always import through these, not relative `../../../` paths that climb out of a feature.

## State management

A deliberate, narrow decision — **do not add a global store (Redux/Zustand/etc.)**:

| Kind of state | Tool |
| --- | --- |
| Server state (tickets, customers, messages, counts) | TanStack Query, exclusively |
| Auth session, theme, locale | React Context |
| Everything else | local `useState` |

Reasoning: almost everything this app deals with is data that lives in the Supabase database — "server state." TanStack Query already solves caching, refetching, and invalidation for that. A separate global store would just mean re-implementing cache invalidation by hand. If something feels like it needs global state, it's almost always actually a query that belongs in a feature's `hooks.ts`.

Forms use React Hook Form. Localization is i18next + react-i18next (see [expo-guide.md](./expo-guide.md)).

## Hard rules

From `CLAUDE.md`, restated with the *why*:

1. **Route files stay thin.** `app/` is navigation wiring only — keeps routing decoupled from feature logic, so a screen's behavior doesn't depend on which route rendered it.
2. **`core/lib/theme/tokens.ts` is the only file allowed a color literal (hex value).** Every other file must reference a token. This is what makes light/dark theming and any future rebrand a one-file change instead of a find-and-replace across the app.
3. **`features/` → `core/` is one-way.** Explained above — keeps infrastructure domain-agnostic and reusable.
4. **Features only talk to each other through barrels** (`@/features/tickets`, never `@/features/tickets/api`). Keeps a feature's internal file layout free to change without breaking other features.
5. **Logical layout properties only** — `marginStart`/`paddingEnd`, never `marginLeft`/`marginRight`. Arabic is the primary language and the app must mirror correctly in RTL; physical (left/right) properties don't flip automatically, logical (start/end) ones do.
6. **`src/core/types/database.ts` is generated, never hand-edited.** See [supabase.md](./supabase.md#generated-database-types) — hand edits drift from the real schema and get silently overwritten next regeneration.

Rules 2–5 are meant to eventually be enforced by ESLint (`no-restricted-syntax` for hex/physical-layout, `no-restricted-imports` for the layering/deep-import bans) — as of now there's no lint config yet, so they're enforced by review discipline only. Apply them anyway even though nothing will flag a violation yet.

## Where things go — quick lookup

| I'm adding... | It goes in... |
| --- | --- |
| A new screen for viewing a ticket | `features/tickets/screens/` |
| A Supabase query for fetching tickets | `features/tickets/api.ts` |
| A `useQuery` hook wrapping that query | `features/tickets/hooks.ts` |
| A button used only within the tickets feature | `features/tickets/components/` |
| A button used across 2+ features (e.g. a generic `Avatar`) | `core/components/` |
| A new route/screen entry (e.g. `/tickets/[id]`) | `src/app/tickets/[id].tsx` — thin, just renders the feature screen |
| A color | Nowhere as a literal — add/use a token in `core/lib/theme/tokens.ts` |
| Reusable formatting logic (dates, numbers) | `core/utils/` — see [expo-guide.md](./expo-guide.md) |
