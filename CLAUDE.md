# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status — read this first

**AZM** is a customer support CRM for support agents on phones and tablets: agents create
customers, open tickets, work them through a lifecycle, and resolve them. Arabic-first with
English support, light and dark themes.

The repository is currently a bare `create-expo-app` blank-TypeScript template — `App.tsx`,
`index.ts`, `tsconfig.json`, and four dependencies (`expo`, `expo-status-bar`, `react`,
`react-native`). **Nothing in the "Target architecture" section below exists yet.** It is the
agreed design, recorded so that scaffolding stories build toward one shape rather than
improvising per-story.

When you add a piece of it, treat this file as the spec — and when reality and this file
diverge, fix this file in the same change. A previous CLAUDE.md here described a completely
different app; do not let that happen again.

## Commands

```bash
npm install
npm start          # expo start (Metro; press a/i/w)
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```

That is the whole script list today. There is **no lint script, no test runner, and no ESLint
config** — `npm run lint` will fail until someone adds `expo lint` plus a config. There are no
test files and no Jest setup.

Database types are generated, never hand-written:

```bash
npx supabase gen types typescript --project-id svcxmjibmgjtaxuzrquf > src/core/types/database.ts
```

Requires Supabase auth; run it yourself rather than expecting it to work unattended.

## Target architecture

Three top-level concepts: **routes, core, features**.

```
src/
├── app/        expo-router routes ONLY — a route file imports a screen from a
│               feature and renders it. Nothing else.
├── core/       infrastructure and generic, domain-free code
│   ├── components/   EmptyState, ErrorState, Skeleton, OfflineBanner,
│   │                 BottomSheet, SegmentedControl, Avatar, FAB
│   ├── hooks/        useBreakpoint, useDebounce
│   ├── lib/          supabase.ts, query-client.ts, theme/, i18n/
│   ├── utils/        format.ts, errors.ts
│   └── types/        database.ts (generated)
└── features/   one folder per business domain
```

Features: `auth`, `tickets`, `customers`, `home`, `notifications`, `profile`.

Every feature has the same anatomy, and `index.ts` is its **only** entry point:

```
features/<feature>/
├── api.ts          Supabase queries and mutations
├── hooks.ts        TanStack Query hooks wrapping api.ts
├── types.ts
├── components/
├── screens/
└── index.ts        barrel
```

Path aliases: `@/core/*` and `@/features/*`.

Tabs: Home, Tickets, Customers, Profile.

## State management — a deliberate decision, do not add to it

- **Server state** (tickets, customers, messages, counts) → TanStack Query, exclusively.
- **Auth session, theme, locale** → React Context.
- **Everything else** → local `useState`.

Do **not** install Redux, Zustand, or any other global store. Almost all state in this app is
server state; a store would mean hand-rolling cache invalidation that TanStack Query already
does correctly. If a task seems to need global state, it is nearly always a query that belongs
in a feature's `hooks.ts`.

Forms use React Hook Form. Localisation is i18next + react-i18next.

## Hard rules

1. **Route files stay thin.** Import a screen, render it. No data fetching, no layout logic in
   `src/app/`.
2. **`core/lib/theme/tokens.ts` is the only file that may contain a colour literal.** Hex values
   are banned everywhere else.
3. **`features/` imports from `core/`. `core/` never imports from `features/`.** This direction
   is one-way and non-negotiable.
4. **Features import each other only through barrels** — `@/features/tickets`, never
   `@/features/tickets/api`.
5. **Logical layout properties only** — `marginStart`/`paddingEnd`, never `marginLeft`/
   `marginRight`. The app must work in RTL.
6. **`src/core/types/database.ts` is generated. Never hand-edit it.** Regenerate instead.

Rules 2, 3, 4, and 5 are meant to be enforced by ESLint (`no-restricted-syntax` for hex
literals and physical layout props, `no-restricted-imports` with path patterns for the layering
and deep-import bans). Until that config exists, they are enforced by review — apply them
anyway.

## RTL and locale

Arabic is the primary language. The locale must be resolved and RTL applied **before first
paint** — a cold start in Arabic must not flash LTR. That means reading the persisted locale
and calling `I18nManager` during the splash/bootstrap phase, before the root layout renders its
tree, rather than in an effect. Any provider wiring that defers this reintroduces the flash.

Theme reads the system preference on first launch and persists a manual override thereafter.

## Wiring notes for whoever scaffolds this

The current entry setup is incompatible with the target and must change together, not piecemeal:

- `package.json` `main` is `index.ts`, which calls `registerRootComponent(App)`. expo-router
  requires `main: "expo-router/entry"`; `App.tsx` and `index.ts` then go away in favour of
  `src/app/_layout.tsx`.
- `src/app/` is a non-default router root — it needs the corresponding expo-router
  configuration, not just the folder.
- `app.json` sets `"userInterfaceStyle": "light"`, which contradicts the light/dark requirement
  and must become `"automatic"`.
- `app.json` declares no `plugins` array; expo-router and any native modules added later belong
  there.
- Supabase session persistence uses AsyncStorage, which is a separate dependency from the
  Supabase client.
- `/ios` and `/android` are gitignored. Native config goes in `app.json`, never in hand-edited
  native folders.

## Working in this repo

`.squad/` is a [squad-kit](https://github.com/AzmSquad/squad-kit) workspace (Jira tracker,
project `azm-crm`). The intended loop is: `squad new-story <slug>` scaffolds an intake file →
`/squad-plan <intake-path>` generates a plan → implement the generated `NN-story-*.md` in a
fresh, scoped session. Plans are indexed in `.squad/plans/00-index.md`.
`.squad/secrets.yaml` is gitignored — never read it into context or echo it.

`.claude/settings.json` enables the official Expo plugin.

Expo 57 changed significantly. Per `AGENTS.md`, check the versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing code against an Expo API — do not rely
on recalled Expo patterns.
