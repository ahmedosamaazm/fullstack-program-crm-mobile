# AGENTS.md

> Expo 57 changed significantly. Before writing code against any Expo API, read
> the versioned docs at **https://docs.expo.dev/versions/v57.0.0/** — do not
> rely on recalled Expo patterns. (This is the note `CLAUDE.md` defers to.)

## Project

**AZM** — customer support CRM for agents on phones/tablets. Arabic-first with
English support, light + dark themes. Expo 57 + React Native 0.86 + Expo Router,
TypeScript (strict), TanStack Query, Supabase, i18next, React Hook Form.

**There is no test runner** — no Jest, no test files, no `test` script. The whole
safety net is `npm run lint` + `npm run typecheck` + `npm run contrast` + manually
exercising the app (`npm start`, then `a`/`i`/`w`). Do not assume a test command
exists — `contrast` is an audit script, not a test runner.

When reality and this file (or `CLAUDE.md`) diverge, fix the file in the same
change. A previous instruction file here described a completely different app.

## Commands

```bash
npm install
npm start          # expo start (Metro; press a/i/w)
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
npm run lint       # eslint .  — a real gate (see Hard rules)
npm run typecheck  # tsc --noEmit — a real gate
npm run contrast   # scripts/contrast-audit.ts — a real gate; WCAG AA over both palettes
npm run format     # prettier --write "src/**/*.{ts,tsx,json}"
```

Run order when verifying: **lint -> typecheck -> contrast -> manual run**.

`contrast` reads the real `lightColors`/`darkColors` and exits `1` if any pair the components
actually render falls under its threshold (4.5 text, 3.0 UI). Add a `PAIRS` row when a component
introduces a new pairing; its three `EXEMPT` entries each carry a written reason and must be
re-justified if a consumer ever appears. Its two figure/ground **warnings** are expected and are
open with design (story 26/SCRUM-13 open questions 1 and 3) — a third warning means a token
change collided something new. There is no `tsx`/`ts-node`: it compiles with the installed
`typescript` and runs on Node.

Database types are generated, never hand-written:

```bash
npm run gen:types   # = supabase gen types ... --project-id svcxmjibmgjtaxuzrquf > src/core/types/database.ts
```

Requires Supabase auth; run it yourself, don't expect it unattended.

## Architecture

Three top-level dirs under `src/`:

- **`app/`** — Expo Router routes ONLY. A route file imports a screen from a
  feature barrel and renders it. No data fetching, no layout logic here.
- **`core/`** — infrastructure and domain-free code: `components/`, `hooks/`,
  `lib/` (supabase, query-client, theme/, i18n/), `utils/`, `types/`.
- **`features/`** — one folder per business domain.

Path aliases (in `tsconfig.json`): `@/core/*`, `@/features/*`.

Every feature has the same anatomy, and `index.ts` is its **only** entry point:

```
features/<feature>/
├── api.ts               Supabase queries + mutations
├── hooks.ts             TanStack Query hooks wrapping api.ts
├── session-context.tsx  only if the feature owns React Context (e.g. auth)
├── types.ts
├── components/          domain components live here, NOT in core/components/
├── screens/
└── index.ts             barrel — the only import surface
```

Tabs: Home, Tickets, Customers, Profile.

The token layer in `core/lib/theme/` is a traceable reflection of the Figma file
`mdfP8RPdkUsKcJb0wFdkME`. `.squad/plans/design-system/01-...md` §15 lists ten
flags still open with design (e.g. `FilterChip` off-scale tokens, Arabic
uppercase+tracking on `SectionHeader`). Do **not** silently resolve those — they
are open questions.

## State management — do not add a store

- **Server state** (tickets, customers, messages, counts) → TanStack Query only.
- **Auth session, theme, locale** → React Context.
- **Everything else** → local `useState`.

Do **not** install Redux, Zustand, or any other global store. If a task seems to
need global state, it is nearly always a query that belongs in a feature's
`hooks.ts`. Forms use React Hook Form; localisation is i18next + react-i18next.

## Hard rules (1–6; 2–5 eslint-enforced)

1. **Route files stay thin** — import a screen, render it. No fetching/layout in `src/app/`.
2. **`core/lib/theme/primitives.ts` is the only file that may contain a colour literal.** Hex is banned everywhere else.
3. **`features/` imports from `core/`; `core/` never imports from `features/`.** One-way, non-negotiable.
4. **Features import each other only through barrels** — `@/features/tickets`, never `@/features/tickets/api`.
   `features/customers` and `features/tickets` import each other this way (the customer ticket-history
   tab renders `TicketRow`; the create-ticket customer picker renders `CustomerRow`) — a known cycle,
   safe only because both directions are used inside render paths, never at module scope. Don't deep-import
   to avoid it.
5. **Logical layout props only** — `marginStart`/`paddingEnd`, never `marginLeft`/`marginRight` (nor `left`/`right`). The app must work in RTL.
6. **`src/core/types/database.ts` is generated.** Never hand-edit; regenerate.
7. **Locale never enters the data layer.** `api.ts` returns `{ name_en, name_ar }` pairs unresolved;
   components resolve with `useLocalisedName()` and read locale with `useLocale()` — never
   `currentLocale()`/`I18nManager` in a render path. See "RTL, locale, entry, fonts".

`eslint.config.js` enforces 2–5 via `no-restricted-syntax` (hex literals,
`fontWeight`/`fontFamily` style keys, physical layout props incl. `left`/`right`)
and `no-restricted-imports` (the layering + deep-import bans). It also bans
importing `Text`/`TextInput` from `react-native` anywhere except
`core/components/Text.tsx` / `TextInput.tsx` — the **single-font rule**: every
piece of text goes through those two primitives, which resolve a `weight` prop to
a concrete `fontFamily`. Android does not synthesise weight for custom families,
so `fontWeight` next to a custom font must never coexist.

## RTL, locale, entry, fonts

Arabic is primary. The locale must be resolved and RTL applied **before first
paint** — a cold start in Arabic must not flash LTR. `src/app/_layout.tsx` awaits
`bootstrap()` (which reads the persisted locale, calls `I18nManager`, and
`Font.loadAsync`s the font) before rendering anything; the splash stays up until
bootstrap resolves **and** the session read completes. Do not move this work into
an effect or a provider that renders first — `LocaleProvider` is *seeded* from
bootstrap's result and must never resolve the locale itself.

**Direction is React state.** `core/lib/i18n/locale-context.tsx` owns locale and
direction (`useLocale()`); `core/components/DirectionRoot.tsx` puts Yoga's
`direction` on the root view, so on Fabric every `start`/`end` inset and row
order mirrors the instant the language changes. `useDirection()` resolves
`DirectionScope` → `LocaleProvider` → latched native direction. **Never read
`currentLocale()` or `I18nManager` in a render path** — use `useLocale()`.
Native surfaces (React Navigation, `Modal`, `TextInput`, `ScrollView` RTL offset)
ignore Yoga direction, so `core/lib/i18n/reload.ts`'s `reloadApp()` restarts the
runtime after a direction-changing switch. `settings.restartRequired` is the
reload-failed path only. **`expo-updates` requires a development build** — the
first dependency here that does; it does not work in Expo Go.

**Localised DB names resolve at render, never in `api.ts`.** Queries return the
raw `{ name_en, name_ar }` pair (`LocalisedName` in `core/utils`); components
call `useLocalisedName()`. Resolving in the data layer bakes the language into
the query cache, whose keys carry no locale. Sort by `sort_order`, never by
`name_en` while displaying `name_ar`.

- `package.json` `main` = `expo-router/entry`; `app.json` sets `expo-router`
  with `{ "root": "./src/app" }` (routes live under `src/app/`, not the default).
- `userInterfaceStyle` = `"automatic"` (light/dark both supported).
- **Routing convention:** authenticated tab routes live in `src/app/(tabs)/`; non-tab authenticated routes are its siblings inside the same `Stack.Protected` (`tickets/[id]`, `customers/[id]`, and the `presentation: 'modal'` routes `customers/new`, `customers/edit/[id]`, `tickets/new`); unauthenticated under `src/app/(auth)/`. The guard is `Stack.Protected` in `_layout.tsx`'s `RootNavigator`, driven by `useAuth().status` — **not** an imperative `router.replace`. Registering a screen outside the guard leaks it to a signed-out deep link.
- **`typedRoutes` is on** (`app.json` `experiments`). Navigate with the object form — `router.push({ pathname: '/customers/[id]', params: { id } })` — never a template literal.
- The only font is IBM Plex Sans Arabic, loaded via `Font.loadAsync()` in
  `bootstrap()` — not `useFonts` (can't run before first paint) and not the
  config plugin (requires a dev build). See `core/lib/theme/fonts.ts` for the
  migration path if dev builds are adopted.
- `/ios` and `/android` are gitignored. Native config goes in `app.json`, never
  hand-edited native folders.
- **`app.json` holds the only two colour literals hard rule 2 cannot reach** — the
  `expo-splash-screen` plugin's `backgroundColor` and its `dark.backgroundColor`
  (story 26/SCRUM-13). JSON cannot import `primitives.ts`, so these are hand-copies
  of `neutral50`/`neutral1000` and must be kept in step by hand. Permanent hole,
  recorded not fixed. The splash `dark` frame needs a **native rebuild** to appear —
  Expo Go substitutes its own splash.
- The OS status bar follows the **app's** theme, not the system's, via
  `core/components/ThemedStatusBar.tsx` inside `ThemeProvider`;
  `userInterfaceStyle: "automatic"` alone binds it to the system scheme, which
  diverges under a manual override. All three navigators set
  `contentStyle`/`sceneStyle` to `bgCanvas` — React Navigation's `DefaultTheme` is
  white and otherwise wipes white behind every push and modal.

## Working in this repo

`.squad/` is a [squad-kit](https://github.com/AzmSquad/squad-kit) workspace (Jira
project `azm-crm`). Intended loop: `squad new-story <slug>` scaffolds an intake →
`/squad-plan <intake-path>` generates a plan → implement the generated
`NN-story-*.md` in a fresh, scoped session. Plans are indexed in
`.squad/plans/00-index.md`.

**`.squad/secrets.yaml` is gitignored — never read it into context or echo it.**

`.claude/settings.json` enables the official Expo plugin.
