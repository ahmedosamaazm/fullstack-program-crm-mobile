# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status — read this first

**AZM** is a customer support CRM for support agents on phones and tablets: agents create
customers, open tickets, work them through a lifecycle, and resolve them. Arabic-first with
English support, light and dark themes.

The repository has moved past the bare `create-expo-app` template: `src/app/`, `src/core/`, and
the theme/component layer described in "Target architecture" below exist and boot. `src/features/`
now has its first folder, `auth` (login, session context, the route guard) — see
`.squad/plans/auth/02-story-agent-login-SCRUM-17.md`. No other domain screens (tickets, customers,
home, notifications, profile) have been built yet. `src/app/index.tsx` currently renders a
placeholder rather than a real screen; it is the authenticated root the login guard routes to,
and will be replaced by the Home screen once that feature work starts.

The token layer in `core/lib/theme/` is a faithful, traceable reflection of the Figma design
system (file `mdfP8RPdkUsKcJb0wFdkME`) — see
`.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md` for the resolved
values, the component-by-component spec, and ten flags raised back to design (§15) that still
need a design decision (e.g. `FilterChip`'s off-scale legacy tokens, Arabic uppercase+tracking on
`SectionHeader`). Don't silently resolve those flags — they're open questions, not settled ones.

When you add a piece of the target architecture that doesn't exist yet (a feature folder, a
domain component), treat this file as the spec — and when reality and this file diverge, fix
this file in the same change. A previous CLAUDE.md here described a completely different app; do
not let that happen again.

## Commands

```bash
npm install
npm start          # expo start (Metro; press a/i/w)
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```

`npm run lint` and `npm run typecheck` are both real gates now — `eslint.config.js` enforces
hard rules 2–5 below (see "Hard rules"). There is still **no test runner** — no Jest setup, no
test files. `typecheck` + `lint` + manually exercising the app (`npm start`, then the `a`/
`i`/`w` keys) are the whole safety net until one is added.

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
│   ├── components/   Text, TextInput, Icon (font/icon primitives) — Button, IconButton,
│   │                 TextField, TextArea, SearchField, Tab/TabBar, SectionHeader,
│   │                 ModalHeader, SheetHeader, DetailRow, SettingsRow/RowGroup, ActionRow,
│   │                 FilterChip, Dropzone, LanguageToggle — plus the original EmptyState,
│   │                 ErrorState, Skeleton, OfflineBanner, BottomSheet, SegmentedControl,
│   │                 Avatar, FAB
│   ├── hooks/        useBreakpoint, useDebounce
│   ├── lib/          supabase.ts, query-client.ts, theme/, i18n/ (incl. useDirection/DirectionScope)
│   ├── utils/        format.ts, errors.ts
│   └── types/        database.ts (generated)
└── features/   one folder per business domain
```

Features: `auth` (built), `tickets`, `customers`, `home`, `notifications`, `profile` (not built
yet). Domain-specific components (`TicketRow`, `StatusBadge`, `MessageRow`, `AgentRow`, `StatCard`,
`BottomNav`, etc.) belong under `features/<domain>/components/`, not `core/components/` — they
ship with their feature, not the design-system pass.

Every feature has the same anatomy, and `index.ts` is its **only** entry point:

```
features/<feature>/
├── api.ts               Supabase queries and mutations
├── hooks.ts             TanStack Query hooks wrapping api.ts
├── session-context.tsx  only for a feature that owns React Context state (e.g. `auth`)
├── types.ts
├── components/
├── screens/
└── index.ts             barrel
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
2. **`core/lib/theme/primitives.ts` is the only file that may contain a colour literal.** Hex
   values are banned everywhere else — `colors.ts` aliases the 35 semantic tokens onto it.
3. **`features/` imports from `core/`. `core/` never imports from `features/`.** This direction
   is one-way and non-negotiable.
4. **Features import each other only through barrels** — `@/features/tickets`, never
   `@/features/tickets/api`.
5. **Logical layout properties only** — `marginStart`/`paddingEnd`, never `marginLeft`/
   `marginRight`. The app must work in RTL.
6. **`src/core/types/database.ts` is generated. Never hand-edit it.** Regenerate instead.

Rules 2, 3, 4, and 5 are enforced by `eslint.config.js` (`no-restricted-syntax` for hex literals,
`fontWeight`/`fontFamily` style keys, and physical layout props; `no-restricted-imports` with
path patterns for the layering and deep-import bans). It also bans importing `Text`/`TextInput`
from `react-native` anywhere except `core/components/Text.tsx`/`TextInput.tsx` themselves — the
single-font rule: every piece of text must go through those two primitives, which resolve a
`weight` prop to a concrete `fontFamily` rather than ever emitting `fontWeight` next to a custom
font (Android doesn't synthesise weight for custom families, so the two must never coexist).

## RTL and locale

Arabic is the primary language. The locale must be resolved and RTL applied **before first
paint** — a cold start in Arabic must not flash LTR. That means reading the persisted locale
and calling `I18nManager` during the splash/bootstrap phase, before the root layout renders its
tree, rather than in an effect. Any provider wiring that defers this reintroduces the flash.

Theme reads the system preference on first launch and persists a manual override thereafter.

## Entry and fonts

`package.json` `main` is `expo-router/entry`; `app.json` sets `"expo-router"` with an explicit
`{ "root": "./src/app" }` since routes live under `src/app/`, not the package default. `app.json`
`userInterfaceStyle` is `"automatic"` (light/dark both supported).

`src/app/_layout.tsx` awaits `bootstrap()` before rendering anything — that's what prevents an
LTR flash on a cold start in Arabic — then mounts `ThemeProvider`, `QueryClientProvider`,
`AuthProvider` and `OfflineBanner`. The splash screen stays up until both bootstrap resolves and
the session read completes, so an already-signed-in agent never sees a flash of the login screen.

**Routing convention:** authenticated routes live at the router root (`src/app/index.tsx` and
siblings); unauthenticated routes live under `src/app/(auth)/`. The guard is `Stack.Protected` in
`src/app/_layout.tsx`'s `RootNavigator`, driven by `useAuth().status` from `@/features/auth` — not
an imperative `router.replace`.

The app's only font is IBM Plex Sans Arabic (`@expo-google-fonts/ibm-plex-sans-arabic`), loaded
via `Font.loadAsync()` inside `bootstrap()` — not the `useFonts` hook (can't run before first
paint) and not the Expo config plugin (requires a dev build, and forces a `Platform.select` into
the weight→family map). See `core/lib/theme/fonts.ts` for the tradeoffs and the migration path if
the team later adopts dev builds.

`/ios` and `/android` are gitignored. Native config goes in `app.json`, never in hand-edited
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
