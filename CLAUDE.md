# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project status — read this first

**AZM** is a customer support CRM for support agents on phones and tablets: agents create
customers, open tickets, work them through a lifecycle, and resolve them. Arabic-first with
English support, light and dark themes.

The repository has moved past the bare `create-expo-app` template: `src/app/`, `src/core/`, and
the theme/component layer described in "Target architecture" below exist and boot. `src/features/`
has five built domains: `auth` (login, session context, the route guard —
`.squad/plans/auth/02-story-agent-login-SCRUM-17.md`), `home` (workload summary with inline
claim — `.squad/plans/home/03-story-home-workload-summary-SCRUM-37.md`), `tickets` (list with
search, filters, and day-grouped rows —
`.squad/plans/tickets/04-story-ticket-list-with-filters-SCRUM-27.md`), `customers` (paginated,
alphabetically grouped list with search and open-ticket counts —
`.squad/plans/customers/05-story-customer-list-and-search-SCRUM-21.md`), and `profile` (identity
card, language/theme/notification pickers, and a confirmed sign-out that clears the whole query
cache — `.squad/plans/profile/06-story-profile-and-settings-SCRUM-46.md`). The four-tab shell in
`src/app/(tabs)/` is now fully real. Tapping a ticket row on Home or the Tickets tab now pushes
`src/app/tickets/[id].tsx` — the ticket detail screen (header, contact strip, Conversation /
Internal notes / History segments, a reserved AI-summary slot, and a composer that posts both
message kinds — `.squad/plans/tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`), whose
header's **Assign** button opens a department-agent roster with compare-and-set reassignment and
unassign (`.squad/plans/tickets/08-story-assign-a-ticket-SCRUM-33.md`), and whose **Status** button
opens a picker driven by `state-machine.ts` with a required resolution note on `resolved`
(`.squad/plans/tickets/09-story-ticket-status-transitions-SCRUM-34.md`).

The customer record is complete apart from free-text notes. `src/app/customers/[id].tsx`
is the customer profile — identity header with Call / Email / History / Edit, an Info / Tickets / Notes
tab bar, a fully built Info tab
(`.squad/plans/customers/10-story-customer-profile-view-SCRUM-24.md`), and a Tickets tab that
renders the customer's full ticket history — every status including `resolved`/`closed`, newest
first — embedded in the same `['customers', id]` response the Info tab already reads, with no
second request (`.squad/plans/customers/14-story-customer-interaction-history-SCRUM-25.md`). Its
Notes tab (US-010, SCRUM-26) is **fully built**. Attachments: upload via camera/gallery/file,
a 10 MB + four-MIME-type client-side guard, a full-screen viewer for images through a 60-second
signed URL, all scoped to the agent's own branch and department in the storage path. Notes:
a newest-first list keyed `['customers', id, 'notes']`, each row carrying its author's name (via a
`profiles` embed) and a full date-and-time stamp, with a composer beneath the list
(`.squad/plans/customers/24-story-customer-notes-and-attachments-SCRUM-26.md`). Both live in one
`SectionList` — attachments section omitted entirely when empty, notes section always present.
The `customer_notes` table carries `select_notes` / `insert_notes` policies scoped through the
parent customer and **no UPDATE or DELETE policy, so a note is immutable by omission** — the
`ticket_events` pattern. Its `author_id` is **NOT NULL**, unlike `ticket_messages.author_id`:
a customer note always has a human author and there is no system-note case.
`customers/new`
and `customers/edit/[id]` are modal routes over one shared `CustomerForm`, with department and branch
inherited from the signed-in agent and the duplicate-phone `23505` surfaced as a field error on phone
(`.squad/plans/customers/11-story-create-a-customer-SCRUM-22.md`,
`.squad/plans/customers/12-story-edit-customer-details-SCRUM-23.md`). `tickets/new` is the
create-ticket modal — a customer picker that reuses the Customers tab's own query, a
`categories`-driven select, priority chips defaulting to `medium`, and an insert that omits the
server-generated `reference` and `status`
(`.squad/plans/tickets/13-story-create-a-ticket-SCRUM-28.md`). Both FABs — Home and the Tickets tab —
open it, which closes US-022 as well. That picker's `+ New customer` link, and a matching action on
the picker's empty state, now open a `CreateCustomerSheet` — story 11's `CustomerForm` presented as a
full-screen modal over the ticket form, so a customer can be created mid-call without losing the
half-typed ticket (`.squad/plans/tickets/16-story-create-a-customer-inline-SCRUM-29.md`). The ticket
detail screen's History segment — already built by story 07 — now resolves `assigned` events to the
agent's name (via `useDepartmentAgents`, falling back to "another agent" for anyone outside the
current roster) instead of a raw profile id, and renders unassignment as its own sentence rather than
a trailing blank (`.squad/plans/tickets/17-story-ticket-history-timeline-SCRUM-35.md`). That story's
one open finding: `ticket_events` PATCH is confirmed rejected (RLS returns `200`/`204` with zero rows
affected — no UPDATE policy exists) but **DELETE has not yet been tested against a live agent JWT**;
BRD `:722` is unverified for the delete path until that test runs.

**`features/customers` and `features/tickets` now import each other through their barrels** — the
customer Tickets tab renders `TicketRow` from `@/features/tickets`, and the create-ticket screen's
customer picker already rendered `CustomerRow` from `@/features/customers`. This is a known cycle
between two feature barrels, the first in the repo; it survives because both directions are used
inside render paths, never at module scope. Do not deep-import around it — that violates hard rule
4. See story 14's open question 1 before changing either direction.

**`features/notifications` (story 23, SCRUM-45) is built** — a pushed `/notifications` route listing
the signed-in agent's alerts newest-first, grouped into Today / Earlier, with a single
`NotificationRow` covering all five alert types (`assigned`, `reply`, `status`, `unassigned`,
`rating` — only the first three fire yet; `unassigned` needs `pg_cron`, `rating` needs the CSAT
flow) and unread signalled by tint, title weight and a dot together. Home's bell
(`HomeHeader.tsx`) carries the unread badge and pushes the route; tapping a row marks it read and
opens the ticket. **US-028's push-notification criterion (BRD `:849`) is not met by this client and
cannot be** — there is no `expo-notifications`, no device-token table and no sender; the trigger
writes a row, not an OS push. Delivery is owned by SCRUM-40/41. See
`.squad/plans/notifications/23-story-in-app-notification-centre-SCRUM-45.md` open question 1 and
`docs/phase1_known_issues.md`.

**Storage is no longer a blocker for anything** — `docs/phase1_backend_plan.md:93` has marked it
`✅ COMPLETE` since before story 24 shipped, and story 24 (SCRUM-26) is the proof: a private
bucket, a 10 MB cap, a four-MIME-type allowlist, and branch/department-scoped `storage.objects`
policies, all live and now exercised by customer attachments. What remains unbuilt in
phase 1 is narrower and has different blockers: **ticket
and ticket-message attachments** (Storage is ready; this is unbuilt scope, not a block —
`ReplyComposer.tsx` and `CreateTicketScreen.tsx` still render their upload controls disabled),
and **CSAT (§7 of the BRD)**, whose actual blocker should be checked against
`docs/phase1_backend_plan.md` rather than assumed from this sentence.

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

`npm run lint`, `npm run typecheck` and `npm run contrast` are all real gates now —
`eslint.config.js` enforces hard rules 2–5 below (see "Hard rules"), and `contrast`
(`scripts/contrast-audit.ts`, added by story 26/SCRUM-13) exits `1` if any token pair the
components actually render falls below its WCAG AA threshold in either theme. It compiles with
the installed `typescript` and runs on plain Node; there is no `tsx`/`ts-node` here. There is
still **no test runner** — no Jest setup, no test files. Those three commands plus manually
exercising the app (`npm start`, then the `a`/`i`/`w` keys) are the whole safety net until one
is added.

Database types are generated, never hand-written:

```bash
npx supabase gen types typescript --project-id svcxmjibmgjtaxuzrquf > src/core/types/database.ts
```

Story 24 (SCRUM-26) needs this run again once the `customer_notes` table (see the customers
paragraph above) is deployed — the notes half of the feature does not compile until then. It
also added the repo's first native dependencies since the font work: `expo-image-picker`,
`expo-document-picker`, `expo-file-system` and `expo-crypto`, all installed with
`npx expo install` (never plain `npm install`) so the SDK-57-compatible version resolves. None
of the four requires a development build.

Story 25 (SCRUM-12) added a fifth, `expo-updates`, the same way — and it **does** require a
development build. It is the first dependency here that does not work in Expo Go. `reloadApp()`
(`core/lib/i18n/reload.ts`) falls back to `DevSettings.reload()` under `__DEV__`, so the language
switch still works in Expo Go; `Updates.reloadAsync()` is only exercised in a real build.

Requires Supabase auth; run it yourself rather than expecting it to work unattended.

## Target architecture

Three top-level concepts: **routes, core, features**.

```
src/
├── app/        expo-router routes ONLY — a route file imports a screen from a
│               feature and renders it. Nothing else.
├── core/       infrastructure and generic, domain-free code
│   ├── components/   Text, TextInput, Icon (font + SVG primitives) — Button, IconButton,
│   │                 TextField, TextArea, SearchField, Tab/TabBar, SectionHeader,
│   │                 ModalHeader, SheetHeader, DetailRow, SettingsRow/RowGroup, ActionRow,
│   │                 FilterChip, Dropzone, LanguageToggle — plus the original EmptyState,
│   │                 ErrorState, Skeleton, OfflineBanner, ThemedStatusBar, BottomSheet,
│   │                 SegmentedControl, Avatar, FAB
│   ├── hooks/        useBreakpoint, useDebounce
│   ├── lib/          supabase.ts, query-client.ts, theme/, i18n/ (incl. useDirection/DirectionScope)
│   ├── utils/        format.ts, errors.ts
│   └── types/        database.ts (generated)
└── features/   one folder per business domain
```

Features: `auth`, `home`, `tickets`, `customers`, `profile`, `notifications` — all six built.
Domain-specific components (`TicketRow`, `StatusBadge`, `CustomerRow`, `MessageRow`,
`AgentRow`, `StatCard`, `BottomNav`, etc.) belong under `features/<domain>/components/`, not
`core/components/` — they ship with their feature, not the design-system pass.

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
   values are banned everywhere else — `colors.ts` aliases the 39 semantic tokens onto it.
3. **`features/` imports from `core/`. `core/` never imports from `features/`.** This direction
   is one-way and non-negotiable.
4. **Features import each other only through barrels** — `@/features/tickets`, never
   `@/features/tickets/api`.
5. **Logical layout properties only** — `marginStart`/`paddingEnd`, never `marginLeft`/
   `marginRight`. The app must work in RTL.
6. **`src/core/types/database.ts` is generated. Never hand-edit it.** Regenerate instead.
7. **Locale never enters the data layer.** `api.ts` returns `{ name_en, name_ar }` pairs
   unresolved; components resolve them with `useLocalisedName()`, and read locale with
   `useLocale()` — never `currentLocale()` or `I18nManager` in a render path. See "RTL and
   locale".

Rules 2–5 are enforced by `eslint.config.js` (`no-restricted-syntax` for hex literals,
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
This is still the binding constraint — `LocaleProvider` below is seeded from `bootstrap()`'s
already-resolved locale and **must never resolve it itself**.

**Direction is React state, not a process-start constant** (story 25, SCRUM-12).
`core/lib/i18n/locale-context.tsx` owns locale and direction and exposes `useLocale()`;
`core/components/DirectionRoot.tsx` puts Yoga's `direction` style on the root view, so on Fabric
every `start`/`end` inset and row order mirrors the moment the language changes.
`useDirection()` resolves `DirectionScope` → `LocaleProvider` → the latched native direction, in
that order. **Read locale through `useLocale()`, never `currentLocale()` or `I18nManager`, in a
render path** — the imperative reads re-render only by accident, when the component happens to
call `t()` as well.

That covers app-owned UI. Native surfaces that read `I18nManager.isRTL` directly — React
Navigation transitions and gestures, `Modal`, `TextInput` writing direction, `ScrollView` RTL
content offset — cannot see it, so `core/lib/i18n/reload.ts`'s `reloadApp()` restarts the JS
runtime after a direction-changing switch (`Updates.reloadAsync()`, or `DevSettings.reload()`
under `__DEV__`). `settings.restartRequired` is the **failure** path only, for when that reload
cannot run. **`expo-updates` is the first dependency here that requires a development build** —
it does not work in Expo Go, where `reloadApp()` falls to the `__DEV__` branch.

**Localised DB names resolve at render, never in `api.ts`.** `departments`, `branches` and
`categories` each carry a `{ name_en, name_ar }` pair (exported as `LocalisedName` from
`core/utils`), and every query returns the pair unresolved. Call `useLocalisedName()` in the
component. Resolving in the data layer bakes the language into the TanStack Query cache, whose
keys carry no locale — every cached name then stays in the old language after a switch. Sort by
`sort_order`, never by `name_en` while displaying `name_ar`.

Theme reads the system preference on first launch and persists a manual override thereafter.

## Entry and fonts

`package.json` `main` is `expo-router/entry`; `app.json` sets `"expo-router"` with an explicit
`{ "root": "./src/app" }` since routes live under `src/app/`, not the package default. `app.json`
`userInterfaceStyle` is `"automatic"` (light/dark both supported).

`src/app/_layout.tsx` awaits `bootstrap()` before rendering anything — that's what prevents an
LTR flash on a cold start in Arabic — then mounts `ThemeProvider`, `QueryClientProvider`,
`AuthProvider` and `OfflineBanner`. The splash screen stays up until both bootstrap resolves and
the session read completes, so an already-signed-in agent never sees a flash of the login screen.

**Routing convention:** authenticated routes live in the `src/app/(tabs)/` group (the group maps
to the URL root — `src/app/(tabs)/index.tsx` is `/`); unauthenticated routes live under
`src/app/(auth)/`. The guard is `Stack.Protected` in `src/app/_layout.tsx`'s `RootNavigator`,
driven by `useAuth().status` from `@/features/auth` — not an imperative `router.replace`.

Authenticated routes that are **not** tabs are siblings of `(tabs)` inside the same
`Stack.Protected`: `tickets/[id]` and `customers/[id]` push over the tab bar, and `customers/new`,
`customers/edit/[id]` and `tickets/new` do the same with `presentation: 'modal'`. Registering a
screen outside the guard would leak it to a signed-out deep link. `typedRoutes` is on
(`app.json` `experiments`), so navigate with the object form —
`router.push({ pathname: '/customers/[id]', params: { id } })` — never a template literal.

The Tickets **tab** (`src/app/(tabs)/tickets.tsx`) accepts optional `filter` and `nonce` search
params — the app's first parameterised tab route. Home's two "View all" links are its only
callers (`features/home/screens/HomeScreen.tsx`'s `openTicketsFiltered`); a tab screen stays
mounted, so a plain `useState` default only applies on the first visit, and `nonce` exists so the
sync effect re-fires even when the same filter is requested twice in a row.

The app's only font is IBM Plex Sans Arabic (`@expo-google-fonts/ibm-plex-sans-arabic`), loaded
via `Font.loadAsync()` inside `bootstrap()` — not the `useFonts` hook (can't run before first
paint) and not the Expo config plugin (requires a dev build, and forces a `Platform.select` into
the weight→family map). See `core/lib/theme/fonts.ts` for the tradeoffs and the migration path if
the team later adopts dev builds.

`/ios` and `/android` are gitignored. Native config goes in `app.json`, never in hand-edited
native folders.

**`app.json` carries the only two colour literals hard rule 2 structurally cannot reach** — the
`expo-splash-screen` plugin's `backgroundColor` (light) and its `dark.backgroundColor`, added by
story 26 (SCRUM-13). JSON cannot import TypeScript, so there is no way to source them from
`primitives.ts`; they are hand-copies of `neutral50` and `neutral1000` and **must be kept in step
by hand** if either primitive moves. This is a permanent hole, recorded rather than fixed —
`.squad/audits/design/00-index.md` reaches the same conclusion. Everything else colour-related is
covered by `npm run contrast` (`scripts/contrast-audit.ts`), a third gate beside `lint` and
`typecheck`: it fails the build if any token pair the components actually render drops below its
WCAG AA threshold.

The OS status bar follows the app's theme, not the system's, via
`core/components/ThemedStatusBar.tsx` rendered inside `ThemeProvider` — `userInterfaceStyle:
"automatic"` alone binds the bar to the *system* scheme, which diverges the moment an agent picks
a manual theme override. The three navigators (`_layout.tsx`, `(auth)/_layout.tsx`,
`(tabs)/_layout.tsx`) set `contentStyle`/`sceneStyle` to `bgCanvas` for the same reason: React
Navigation's `DefaultTheme` is white and otherwise wipes white behind every push and modal.

## Working in this repo

`.squad/` is a [squad-kit](https://github.com/AzmSquad/squad-kit) workspace (Jira tracker,
project `azm-crm`). The intended loop is: `squad new-story <slug>` scaffolds an intake file →
`/squad-plan <intake-path>` generates a plan → implement the generated `NN-story-*.md` in a
fresh, scoped session. Plans are indexed in `.squad/plans/00-index.md`.
`.squad/secrets.yaml` is gitignored — never read it into context or echo it.

When implementing a `NN-story-*.md`, the plan is the contract and these rules govern how it is
read — a plan cannot enforce them about itself:

- **The plan file is read-only.** Never edit it to match what got built, and never touch a first
  line starting `<!-- squad-kit:`. If the plan is wrong, stop and say so — revising it is
  `/squad-plan`'s job and the user's call.
- **`## Prerequisites` are gates, not context.** An undeployed table, policy or bucket, or a stale
  `database.ts`, means stop and report — never build against a schema that isn't there.
- **When the plan and the repo disagree, follow the repo** and report the drift. Plans are written
  before implementation; drift is expected, silently picking either side is not.
- **Never resolve an `## Open questions` item.** They are decisions parked for a human. Carry every
  one into the final report, the PR body and the Jira comment verbatim — a resolved open question
  produces code that passes every gate and is wrong.
- **Finish in order:** `/rn-code-review` (which runs the three gates), walk `## Done Criteria`,
  update this file's "Project status", then `/create-pr`. One plan per session; story 14's
  `STOP HERE … before proceeding to Story 15` is the rule, not an exception.

`.claude/settings.json` enables the official Expo plugin and wires two repo-scoped hooks from
`.claude/hooks/`: `rn-guard.cjs` blocks hand-edits to `database.ts`, any access to
`.squad/secrets.yaml`, and writes into `/ios` or `/android`; `rn-post-edit.cjs` runs `eslint
--fix` on every touched `.ts`/`.tsx` and feeds surviving errors back, asserts `en.json` and
`ar.json` carry the same key tree (plural-aware — a missing Arabic plural *form* is still a
human check), and reports Expo SDK version drift on `package.json` as an advisory. Repo-scoped
skills live in `.claude/skills/` (`rn-code-review`, `rn-feature`, `rn-l10n`,
`rn-screen-from-figma`), commands in `.claude/commands/` (`/gates`, `/gen-types`, the two
`squad-*`), and the read-only `rn-design-fidelity-auditor` agent in `.claude/agents/`.
Prettier is **not** run by the hook: the repo has no prettier config and was never formatted
with it, so `npm run format` is currently a ~145-file rewrite — treat it as such until a
`.prettierrc` and a one-time format commit land.

Expo 57 changed significantly. Per `AGENTS.md`, check the versioned docs at
https://docs.expo.dev/versions/v57.0.0/ before writing code against an Expo API — do not rely
on recalled Expo patterns.
