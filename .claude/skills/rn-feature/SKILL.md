---
name: rn-feature
description: Scaffold or extend a feature in this Expo Router + TanStack Query repo — "new feature X", "add a screen to <feature>", "add a pushed/modal route", "wire a new query/mutation". Produces the exact anatomy CLAUDE.md prescribes (api/hooks/types/components/screens/index + thin route + Stack.Protected registration + locale namespaces in both files) and nothing else.
argument-hint: "<feature-slug> [screen or route to add]"
user-invocable: true
---

# Feature scaffold — AZM CRM

Six features were built to one anatomy; the seventh must match it exactly. Read `CLAUDE.md`
"Target architecture" and the most recently built feature (`src/features/notifications/`) before
writing a file — the repo wins over anything restated here.

## 0 — Before touching code

- Is there a plan? `.squad/plans/<feature>/NN-story-*.md`. If yes, **the plan's file list wins**
  over this skill's default layout — see `CLAUDE.md` "Working in this repo" for how a plan is
  read. This skill is for the mechanical scaffold when no plan exists yet or the plan says
  "scaffold per rn-feature".
- Does the data already exist? Check `src/core/types/database.ts` for the tables. If a table is
  missing, stop: that is backend scope (`docs/phase1_backend_plan.md`), then `/gen-types`.
- Is it really a new feature, or a screen inside an existing one? A ticket-shaped thing belongs
  under `features/tickets/`, not a new folder.

## 1 — Anatomy (create exactly these; nothing more)

```
src/features/<slug>/
├── api.ts          Supabase calls. Returns rows + { name_en, name_ar } pairs UNRESOLVED (rule 7).
│                   Catches at the boundary → toAppError(). No locale, no React.
├── hooks.ts        <slug>Keys factory + useQuery/useMutation wrappers. Every mutation
│                   invalidates exactly what it changed. Key shape: ['<slug>', id, 'sub'].
├── types.ts        Row aliases from Database['public']['Tables'], view models, type guards.
├── components/     Domain components (Row, Badge, Sheet…). Import ONLY @/core/* and this
│                   feature. Another feature's component → via its barrel, render-path only.
├── screens/        One file per screen. Composes components; reads hooks; zero Supabase.
└── index.ts        THE ONLY IMPORT SURFACE. Export screens, hooks, keys, types, and any
                    component another feature is allowed to render.
```

Empty folders are not created; a feature with no components has no `components/`.

## 2 — Routes (thin, registered, typed)

- **Tab**: `src/app/(tabs)/<slug>.tsx` — only if it is one of the four tabs. It isn't.
- **Pushed**: `src/app/<slug>/[id].tsx` or `src/app/<slug>.tsx`.
- **Modal**: `src/app/<slug>/new.tsx` with `options={{ presentation: 'modal' }}` at registration.

Every route file is three lines: import the screen from the barrel, export a default component
that renders it. **No params parsing, no data, no layout** (rule 1) — the screen reads
`useLocalSearchParams` itself.

Register every new authenticated screen inside `Stack.Protected guard={status === 'signedIn'}`
in `src/app/_layout.tsx`. Outside it, the screen leaks to a signed-out deep link. `typedRoutes`
is on: navigate with `router.push({ pathname: '/<slug>/[id]', params: { id } })`, never a
template string, and run `npm run typecheck` — it regenerates the route types.

## 3 — Locale

Add a `<slug>` namespace to **both** `src/core/lib/i18n/locales/{ar,en}.json` (Arabic first).
Include at minimum: screen title, empty-state title + body, error title. Count keys get Arabic's
six plural forms. Use `/rn-l10n` for the rules; the post-edit hook enforces key parity.

## 4 — State — do not reach for anything else

Server data → the hooks in `hooks.ts`. Signed-in agent → `useAuth()` from `@/features/auth`.
Locale/direction → `useLocale()` / `useDirection()`. Theme → `useTheme()`. Everything else →
`useState` in the smallest component that needs it. **No store.** If it feels like it needs one,
it is a query.

## 5 — Every screen ships four states

Loading (`Skeleton`/`SkeletonList`), empty (`EmptyState`), error (`ErrorState` with retry
calling `refetch`), data. All four from `@/core/components`. Text only via `Text` from
`@/core/components` (single-font rule). Logical layout props only (`marginStart`, `paddingEnd`).

## 6 — Finish

1. `/gates` — lint, typecheck, contrast must all pass.
2. Update **`CLAUDE.md` "Project status"** and the `core/components` list if you added one —
   "when reality and this file diverge, fix this file in the same change."
3. Add the feature to the plan index if it came from a story.
4. `/rn-code-review` before calling it done.

## Never

- `@/features/<x>/api` deep imports (rule 4) — barrels only.
- `core/` importing anything from `features/` (rule 3).
- A hex literal, `fontWeight`, `marginLeft`, or `textAlign: 'left'` — eslint blocks all four.
- Resolving `name_ar`/`name_en` in `api.ts` or sorting by `name_en` (rule 7).
- `npm install <pkg>` — always `npx expo install <pkg>`, and say whether it needs a dev build.
