# Story 25 — Localisation & RTL (Story: SCRUM-12)

> Intake: `.squad/stories/foundation/SCRUM-12/intake.md`
> BRD: `docs/phase1_brd_1.md:362-378` (TF-01, source feature 12.1, 8 pts).
> Roadmap: `docs/phase_1_frontend_roadmap.md:79-90`.
> First story in `.squad/plans/foundation/` — the folder has existed since setup with an empty
> story table.

## Read this before anything else

Five facts decide how this story is sequenced. Establish all five before writing a line of code.

**1. TF-01 was planned first and is being closed last.** The roadmap calls it *"The most expensive
item to retrofit. Do it first."* (`phase_1_frontend_roadmap.md:81`). It was not done first as a
story — it was done incrementally across stories 01–24, which is why seven of the nine BRD criteria
already pass. **This is a closure-and-verification story, not a build story**, in the same shape as
19 (SCRUM-36), 20 (SCRUM-39), 21 (SCRUM-31) and 22 (SCRUM-32). Most of the diff is in three files;
most of the *work* is verification.

**2. One criterion is currently unmet and already documented as unmet.**
`docs/phase1_known_issues.md:8-17` records BRD `:371` ("Language switches instantly with no app
restart") as **not met, by design** — text flips via `i18n.changeLanguage`, the direction cannot,
because React Native latches `I18nManager.isRTL` at process start. That entry ends: *"the acceptance
criterion as written is unmet and should be either reworded or explicitly waived, not silently
ticked."* The intake repeats this as its **Open decision**. **This story answers it — see task 0.
Do not leave it ambiguous and do not silently tick it.**

**3. `docs/DESIGN.md` does not exist.** The intake's Design section says *"Verify against
docs/DESIGN.md's RTL section."* There is no such file — `docs/` holds `architecture.md`,
`expo-guide.md`, `phase_1_frontend_roadmap.md`, `phase1_api_reference.md`, `phase1_backend_plan.md`,
`phase1_brd_1.md`, `phase1_known_issues.md`, `phase1_remaining_stories_status.md`,
`remaining-stories.csv`, `squad-kit-workflow.md`, `supabase.md`, `workflow_so_far.md`. The RTL rule
the intake means is **`docs/architecture.md:82`** (hard rule 5, logical properties). Verify against
that and BRD `:370-378`. **Do not create `docs/DESIGN.md` as part of this story.**

**4. The intake's criterion 3 describes a unit that does not exist.** It says relative timestamps
*"currently render '4m', '3d', '2w'"*. There is no week unit: `format.ts:41-47`'s `RELATIVE_UNITS` is
`year, month, day, hour, minute`, and `formatRelativeShort` (`:76-88`) falls through to `second`.
Six units, no week. Their Arabic forms are already present — see task 6b. Correct the intake's claim
rather than adding a week unit.

**5. There is uncommitted work in the tree that partially implements tasks 1–3 and 5.** A prior
session began this work before the plan existed. Affected paths carry a worktree modification on top
of their staged state, plus five untracked files (`src/core/components/DirectionRoot.tsx`,
`src/core/hooks/useLocalisedName.ts`, `src/core/lib/i18n/index.ts`,
`src/core/lib/i18n/locale-context.tsx`, `src/core/lib/i18n/reload.ts`), a `git mv` of
`src/core/lib/i18n/index.ts` → `config.ts`, and `expo-updates` added to `package.json`.
**Every line range cited below is from the state *without* that WIP** (recoverable per file with
`git show :<path>`). Decide first: keep it and reconcile against this plan, or
`git checkout -- <paths>` and start clean. Do not half-merge.

---

## Prerequisites

- **Stories 01–24 completed.** This story verifies their combined output. The design-system pass
  ([`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md))
  is the one that matters most: it added `eslint.config.js` and the `Text`/`Icon` primitives that
  carry RTL behaviour.
- **Story 06 completed** — [`../profile/06-story-profile-and-settings-SCRUM-46.md`](../profile/06-story-profile-and-settings-SCRUM-46.md).
  It shipped `features/profile/components/LanguageSheet.tsx`, one of the two language switch points
  and one of the three places the restart notice is duplicated.
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md).
  `LoginScreen`'s footer renders `core/components/LanguageToggle.tsx`, the other switch point.
- **A physical device or emulator you can cold-start.** Criterion `:373` (no LTR flash) cannot be
  verified from a hot reload — it needs a full process kill with Arabic already persisted.
- **Both languages legible to the verifier.** Criterion `:376` (Arabic strings do not clip) is a
  human visual pass across every screen; there is no automated substitute.

---

## Story Goal

Close TF-01 by making the two things that are still wrong right, and by actually running the four
verifications nobody has run. Concretely:

1. **A language switch flips the layout immediately** — text, alignment, icon mirroring and every
   `start`/`end` inset — instead of leaving Arabic text inside an LTR layout until the agent
   force-kills the app.
2. **The residual native latch is closed by a reload**, not by a caption asking the agent to do it
   by hand.
3. **The query cache stops carrying a language.** `localisedName` currently resolves department,
   branch and category names inside `api.ts`, baking the active language into every cached row.
4. **The four unverified criteria are verified** — cold-start flash, icon mirroring, locale-aware
   numbers and dates, and that the logical-property lint rule fires rather than merely existing.
5. **BRD `:371` is resolved in writing** — met, reworded, or waived, with the decision recorded in
   `docs/phase1_known_issues.md`.

**Not in scope**: adding a third locale (`SUPPORTED_LOCALES` stays `['ar', 'en']`); localising iOS's
camera and photo-library permission prompts (`app.json`'s `expo-image-picker` config is English-only
— that needs per-language `InfoPlist.strings`, which this project does not generate; it is its own
entry in `known_issues.md:44-49` and stays there); localising the customer-facing status-page email
(BRD `:784`, US-025/US-026, outside this repo); server-side locale (no endpoint takes one — the
intake's API section is explicit that this is client-only); and any change to `en.json`/`ar.json`
key *content* beyond what tasks 4 and 6 require.

---

## Context — Read These Files First

1. `src/core/lib/i18n/index.ts` — **all 121 lines.** The whole locale module today.
   - `:12` `LOCALE_KEY = 'azm.locale'`, `:14` `SUPPORTED_LOCALES`, `:18` `DEFAULT_LOCALE = 'ar'`,
     `:20` `RTL_LOCALES`.
   - `:34-44` `resolveInitialLocale()` — stored choice wins, then device language, then Arabic.
   - **`:54-59` `applyDirection()`** — the centre of this story. It calls `I18nManager.allowRTL` /
     `forceRTL`, then returns `I18nManager.isRTL !== shouldBeRtl`. That comparison works *because*
     `I18nManager.isRTL` is a constants snapshot taken at process start and does not move when
     `forceRTL` is called. This is the same range `known_issues.md:10` cites.
   - `:66-89` `initI18n()` — note `:78` `fallbackLng: DEFAULT_LOCALE` and `:85` `returnNull: false`.
   - `:95-103` `setLocale()` — changes language, persists, returns the needs-restart boolean.
   - `:116-118` `isDirectionRestartPending()`.
   - Task 1 splits this file; **`export default i18n` at `:120` must survive**, because
     `core/utils/format.ts:1` imports the instance as a default.
2. `src/core/lib/i18n/direction.tsx` — **all 35 lines.** `:6` the context, **`:18-21`
   `useDirection()`** falling back to `I18nManager.isRTL`, `:30-35` `DirectionScope`. Read the
   `:8-17` comment: it already names the exact two consumers (`Icon`'s mirror, `Text`'s
   `align="end"`) and says they must never read `I18nManager` directly. **`DirectionScope` currently
   has no callers** — grep confirms it is exported and unused, written for a dev gallery that does
   not exist in `src/`. Task 1 keeps it; do not delete it.
3. `src/core/lib/bootstrap.ts` — **all 49 lines.** `:26` holds the splash at module scope,
   **`:32` applies direction before anything renders**, `:34-38` parallelises i18next, theme and
   fonts, `:40` returns `directionChangePending`. This file is **correct as written** and is what
   makes criterion `:373` pass — task 6a verifies it, task 1 must not weaken it.
4. `src/app/_layout.tsx` — **all 79 lines.** `:30` `if (!result) return null` is the no-flash guard.
   `:32-44` the provider tree that task 1c wraps. `:71-73` the `Stack.Protected` group.
5. `src/core/components/Text.tsx:61-89` — `:69` `useDirection()`, `:72-79` resolves logical
   `start`/`end` to physical `left`/`right`, `:86` emits `textAlign`. The `:63-65` comment explains
   why `textAlign: 'auto'` is deliberately never used. This file is the **one** ESLint exemption for
   physical props (`eslint.config.js`, the `src/core/components/Text.tsx` block).
6. `src/core/components/Icon.tsx` — **`:227` `DEFAULT_MIRRORED`**, the whole of criterion `:375`:
   `new Set<IconName>(['chevronForward', 'arrowBack', 'signOut', 'send'])`. Then `:252-253`
   (`mirrorInRtl ?? DEFAULT_MIRRORED.has(name)`) and `:263` (`transform: [{ scaleX: -1 }]`). The
   `IconName` union is at `:21-58`; the glyph map at `:69` lists every name. Task 6c audits that
   set against the union.
7. `src/core/components/LanguageToggle.tsx` — **all 51 lines.** `:19` local `restartRequired` state,
   `:20` `currentLocale()` read during render, `:22-26` `handleChange`, `:44-48` the notice. Read
   `:29-34`'s comment about `SegmentedControl` needing an explicit width — it is the fix
   `known_issues.md:6-7` says to check elsewhere, and it is **not** this story's job.
8. `src/features/profile/components/LanguageSheet.tsx` — **all 60 lines.** `:26-27`, `:29-33`,
   `:48-57` — the same three pieces as `LanguageToggle`, written twice. `:17-22`'s comment explains
   why the sheet deliberately does not close on a restart-required result; task 4 makes that
   reasoning obsolete.
9. `src/features/profile/screens/ProfileScreen.tsx` — `:126` `t(LANGUAGE_VALUE_KEY[currentLocale()])`
   and **`:144` `isDirectionRestartPending()`**, both called imperatively during render. They
   re-render today only because `useTranslation()` at `:47` happens to subscribe to
   `languageChanged`. Task 1 removes that accidental coupling.
10. `src/core/utils/format.ts` — **all 144 lines.** `:9-11` `tag()` defaults every formatter to
    `currentLocale()`; `:13-39` the three `Intl.DateTimeFormat` wrappers; **`:41-47` `RELATIVE_UNITS`
    (no week — see "Read this first", point 4)**; `:66-88` `SHORT_UNIT_KEY` + `formatRelativeShort`;
    `:90-97` `formatNumber`/`formatCount`; `:110-119` `formatFileSize`; **`:142-144` `isolateLtr`**,
    which wraps a value in U+2066…U+2069 so a phone number keeps its own LTR run inside an Arabic
    line. This file needs **no change** — task 6b verifies it.
11. `src/core/utils/locale-name.ts` — **all 17 lines.** `:12-17` `localisedName` reads
    `currentLocale()` twice. Called from **three `api.ts` files**, which is the defect task 5 fixes.
12. `eslint.config.js` — the `no-restricted-syntax` block. The physical-property selector lists
    `marginLeft|marginRight|paddingLeft|paddingRight|border*Radius|left|right`; the `textAlign`
    selector bans `left`/`right` values. Both are **confirmed firing** — see task 6d.
13. `docs/phase1_known_issues.md:1-17` — the "Deferred defects" section. `:8-17` is this story's
    entry; task 7 rewrites it.
14. `docs/phase1_brd_1.md:362-378` — TF-01 and its nine criteria. `## Done Criteria` mirrors
    `:370-378` verbatim.
15. `docs/architecture.md:82` — hard rule 5, the RTL rule the intake's missing `DESIGN.md` meant.

---

## Product rules (from story)

| Today | After this story |
|---|---|
| Switching language changes text immediately; layout keeps the **old** direction until the agent force-kills the app. A muted caption asks them to. | Layout mirrors in the same frame as the text. The native latch is closed by an automatic reload. |
| `localisedName` resolves at fetch time in three `api.ts` files; the language is baked into the TanStack Query cache. | `api.ts` returns the raw `{ name_en, name_ar }` pair; the render layer resolves it. The cache is locale-independent. |
| `currentLocale()` / `isDirectionRestartPending()` are called during render in three components, re-rendering only because `useTranslation()` is also present. | A `useLocale()` hook subscribes properly. |
| The restart notice and its `useState` are written three times. | One notice, owned by the locale layer. |
| BRD `:371` is documented as unmet in `known_issues.md`. | Resolved in writing — met, reworded, or waived. |

---

## Implementation tasks

### 0 — Answer the open decision, before any code

The intake's Design section ends: *"Open decision: the residual native `I18nManager` latch means
some things only flip after restart. Either reword criterion 2 to acknowledge this, or waive it
explicitly. Do not leave it ambiguous."*

**The decision, taken with the product owner on 2026-09-01: neither reword nor waive — meet it, with
a two-layer implementation.**

- **Layer 1 (tasks 1–2), the visible half.** Direction becomes React state, and the root view
  carries Yoga's `direction` style. Every app-owned surface — `start`/`end` margins, padding and
  insets, row order, `Text`'s `align`, `Icon`'s mirror — flips in the same frame as the text, with
  no reload.
- **Layer 2 (task 3), the guarantee.** Native surfaces that read `I18nManager.isRTL` directly rather
  than resolving Yoga direction — React Navigation's transition and gesture directions, `Modal`,
  `TextInput`'s writing direction, `ScrollView`'s RTL content offset — cannot see layer 1.
  `applyDirection()` already schedules the native flip for the next launch; a programmatic reload
  makes "next launch" happen immediately.

The criterion says *"no app restart"*, and the agent performs no restart: they tap a language and
the app is correct. A sub-second automatic reload is an implementation detail of layer 2, not a
restart the agent has to know about. **Record this in `known_issues.md` (task 7a) as met-with-a-note,
not as a silent tick.** If the product owner later rejects the reload, the fallback is to reword
`:371` to *"switches instantly, with no manual restart"* — do not fall back to the current
force-kill behaviour.

---

### 1 — Make direction reactive

The root cause of the half-flipped state: direction is read from a process-start constant, so no
React tree re-renders when it changes.

#### 1a. Split the module

**Rename file:** `src/core/lib/i18n/index.ts` → `src/core/lib/i18n/config.ts` (use `git mv`).
Remove its `export { useDirection, DirectionScope, type Direction } from './direction';` line — the
new barrel owns re-exports. Keep everything else, including `export default i18n`.

Add to `config.ts`, beside `isRtlLocale` (`:21-24` pre-rename):

```ts
export type Direction = 'ltr' | 'rtl';

/** The writing direction a locale should render in. */
export function directionOf(locale: Locale): Direction {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}

/**
 * The direction the *native* views were created with, latched at process start.
 * `LocaleProvider` drives the JS/Yoga direction independently of this, so the
 * two differ only between an in-session switch and the reload that follows it.
 */
export function nativeDirection(): Direction {
  return I18nManager.isRTL ? 'rtl' : 'ltr';
}
```

`Direction` moves here from `direction.tsx:4` so `locale-context.tsx` can import it without
depending on a `.tsx` file. **`direction.tsx` must re-export the type** (`export type { Direction };`)
— `core/components/index.ts` and any consumer importing it from the barrel must keep compiling.

**Create file:** `src/core/lib/i18n/index.ts` — a pure barrel. It re-exports the named symbols from
`config.ts`, `direction.tsx`, `locale-context.tsx` and `reload.ts`, and ends with
`export default i18n;`. **The default export is load-bearing** (`core/utils/format.ts:1`,
`format.ts:84`, `format.ts:118`).

#### 1b. The provider

**Create file:** `src/core/lib/i18n/locale-context.tsx`.

```ts
export type LocaleContextValue = {
  locale: Locale;
  direction: Direction;
  isRtl: boolean;
  restartPending: boolean;
  changeLocale: (next: Locale) => Promise<boolean>;
};
```

- `useState<Locale>(initialLocale)` — seeded from `bootstrap()`'s already-resolved locale.
  **The provider must never resolve the locale itself**; `resolveInitialLocale()` is async and doing
  it here reintroduces the cold-start flash `bootstrap.ts:32` exists to prevent.
- A `useEffect` subscribing to `i18n.on('languageChanged', …)` and `off` on cleanup, mirroring
  `currentLocale()` into state, so an external `changeLanguage` cannot desync the two.
- `changeLocale(next)` — returns early when `next === currentLocale()`; otherwise calls the existing
  `setLocale` from `config.ts`, sets state, and when that returns `true` calls `reloadApp()`
  (task 3) and returns its result.
- `restartPending: directionOf(locale) !== nativeDirection()`.
- `useLocale()` **throws** outside the provider. A silent `i18n.language` fallback would render
  correctly once and never update — the exact bug this provider removes.
- Export an internal `useAppDirection(): Direction | null` returning
  `useContext(LocaleContext)?.direction ?? null`, for 1d.

#### 1c. Mount it

**File:** `src/app/_layout.tsx`. Wrap the tree inside `GestureHandlerRootView` with
`<LocaleProvider initialLocale={result.locale}>`, outside `SafeAreaProvider`.
`result.locale` already exists on `BootstrapResult` (`bootstrap.ts:7`). **Do not move or remove
`:30`'s `if (!result) return null`.**

#### 1d. Rework `useDirection()`

**File:** `src/core/lib/i18n/direction.tsx`. Resolve in three steps: an enclosing `DirectionScope`,
then `useAppDirection()`, then `nativeDirection()`. Keep `DirectionScope` and its context exactly as
they are — it is the per-subtree override and stays the highest-priority source.

This is the whole fix for `Text` and `Icon`: both already call `useDirection()`
(`Text.tsx:69`, `Icon.tsx:250`), so **neither file changes** and both start reacting to a switch.

---

### 2 — Mirror the layout without a reload

**Create file:** `src/core/components/DirectionRoot.tsx`. Reads `useLocale().direction` and renders
`<View style={{ flex: 1, direction }}>{children}</View>`.

RN 0.86 runs Fabric, so Yoga propagates the `direction` style down the tree and resolves every
`start`/`end` property and row order against it. `direction` is a valid `ViewStyle` key and is **not**
on `eslint.config.js`'s banned-property list.

**File:** `src/app/_layout.tsx` — render `DirectionRoot` immediately inside `LocaleProvider`,
wrapping `SafeAreaProvider`.
**File:** `src/core/components/index.ts` — export it, keeping the file's alphabetical order (between
`BottomSheet` and `EmptyState`).

Document in the component's own doc comment that this does **not** replace task 3: native surfaces
reading `I18nManager.isRTL` ignore Yoga direction.

---

### 3 — Close the native latch with a reload

`expo-updates` is the only way to reload the JS runtime in a production build. Install with
**`npx expo install expo-updates`** (never plain `npm install` — the SDK-57-compatible version must
resolve), matching how stories 24 and earlier added native modules.

**Create file:** `src/core/lib/i18n/reload.ts`.

```ts
export async function reloadApp(): Promise<boolean>
```

- `__DEV__` → `DevSettings.reload()` from `react-native`. `Updates.reloadAsync()` is unavailable in
  Expo Go and throws when the updates module is disabled.
- otherwise → `await Updates.reloadAsync()`.
- Both paths in `try`/`catch`, returning `false` on failure. **A failed reload must not throw into
  the caller** — `changeLocale` returns `false`, `restartPending` stays `true`, and the notice
  (task 4) stays up. Layer 1 has already flipped the layout, so a failed reload degrades to
  "correct app, stale native chrome", never to a broken screen.

**`expo-updates` requires a development build** — it does not work in Expo Go. Note this in
`CLAUDE.md` and `AGENTS.md` (task 7c): it is the **first** dependency in this repo to carry that
requirement, and CLAUDE.md currently states of story 24's four packages that *"None of the four
requires a development build."* That sentence stays true; the new one needs its own.

---

### 4 — One restart notice, not three

`LanguageToggle.tsx:19,44-48`, `LanguageSheet.tsx:26,48-57` and `ProfileScreen.tsx:144-153` each
own a copy.

- **File:** `src/core/components/LanguageToggle.tsx` — drop the local `restartRequired` state and
  the `currentLocale()` call at `:20`; use `useLocale()` for `locale`, `changeLocale` and
  `restartPending`. Render the notice from `restartPending`. **Leave the `:29-34` width comment and
  the `width: 200` wrapper alone.**
- **File:** `src/features/profile/components/LanguageSheet.tsx` — same change. Replace the `:17-22`
  doc comment: the sheet now closes normally on success, because there is nothing left for the agent
  to do. Call `onClose()` when `changeLocale` resolves `true`.
- **File:** `src/features/profile/screens/ProfileScreen.tsx` — replace `currentLocale()` at `:126`
  and `isDirectionRestartPending()` at `:144` with `useLocale()`.

Keep the `settings.restartRequired` key in both locale files. It is now a **failure** path
(reload unavailable), not the normal one. Reword both values to say the switch is applied but the
app needs a manual restart to finish; the current strings ("Restart the app to apply the new text
direction." / "أعد تشغيل التطبيق لتطبيق اتجاه النص الجديد.") overstate what is still pending.

---

### 5 — Take the language out of the query cache

`localisedName` is called inside three `api.ts` files, so the active language is baked into every
cached row. The intake is explicit: *"Localised DB names resolve at the render layer, not in
queries — both `name_en` and `name_ar` arrive in every response, so locale belongs in the component,
not the query key."*

**Resolve at render — do not add locale to the query keys.** Keying by locale would double the cache
entries and force a refetch on every switch, for data that already contains both languages.

#### 5a. Make the util pure

**File:** `src/core/utils/locale-name.ts`. Export
`export type LocalisedName = { name_en: string; name_ar: string };` and change the signature to
`localisedName(row: LocalisedName | null, locale: Locale = currentLocale()): string | null`. Keep the
empty-string fallback logic from `:14-16` exactly. The default keeps the few non-render callers
working; the doc comment must say render-layer callers use the hook instead, and why.
**File:** `src/core/utils/index.ts` — export the type alongside the function.

#### 5b. The hook

**Create file:** `src/core/hooks/useLocalisedName.ts`.

```ts
export function useLocalisedName(): (row: LocalisedName | null) => string | null
```

`const { locale } = useLocale();` then a `useCallback` bound to it. Export from
`src/core/hooks/index.ts`.

#### 5c. Return raw pairs from the data layer

| File | Change |
|---|---|
| `src/features/auth/api.ts:92-93` | `departmentName`/`branchName` → `department: data.departments`, `branch: data.branches`. Type the row fields at `:67-68` as `LocalisedName \| null`. Drop `localisedName` from the `:2` import; add `type LocalisedName`. |
| `src/features/auth/types.ts` | `AgentProfileWithOrg` — `departmentName`/`branchName: string \| null` → `department`/`branch: LocalisedName \| null`. |
| `src/features/customers/api.ts:232-233` | Same rename inside `toCustomerDetail` (`:225-238`). Drop `localisedName` from the `:6` import. |
| `src/features/customers/types.ts` | `CustomerDetail` — same two fields. |
| `src/features/tickets/api.ts:327` | `categoryName: localisedName(data.categories)` → `category: data.categories`. Type `:301` as `LocalisedName \| null`. |
| `src/features/tickets/api.ts:562,588-592` | `CategoryRow` → `LocalisedName & { id: string; sort_order: number }`; `fetchCategories` returns `name: { name_en: row.name_en, name_ar: row.name_ar }`. **Leave the `.order('sort_order')` at `:585` alone** — the intake warns never to sort by `name_en` while displaying `name_ar`, and ordering by `sort_order` is already correct. |
| `src/features/tickets/types.ts` | `TicketDetail.categoryName: string \| null` → `category: LocalisedName \| null`. `TicketCategory.name: string` → `LocalisedName`. |

#### 5d. Resolve in the components

Each gets `const nameOf = useLocalisedName();` and swaps the field read:

- `src/features/customers/components/CustomerDetailHeader.tsx` — the `org` join.
  **Keep the filter-before-join guard**; its comment explains the `· undefined` leak it prevents.
- `src/features/customers/components/CustomerForm.tsx` — the two `DetailRow` `valueSlot`s.
- `src/features/customers/components/CustomerInfoTab.tsx` — the department and branch `DetailRow`s.
- `src/features/home/screens/HomeScreen.tsx` — resolve before passing to `HomeHeader`.
- `src/features/profile/screens/ProfileScreen.tsx` — resolve before passing to `IdentityCard`.
- `src/features/tickets/screens/TicketDetailScreen.tsx` — resolve before passing to `ContactStrip`.
- `src/features/tickets/components/CategoryPickerSheet.tsx` — the `SettingsRow` `label`.
- `src/features/tickets/screens/CreateTicketScreen.tsx` — the selected category's
  `accessibilityLabel` and its `Text`. Hoist one `categoryLabel` const; it is read twice.

**`HomeHeader`, `IdentityCard` and `ContactStrip` keep taking resolved `string | null` props.** They
are presentational; pushing the hook into them would couple three leaf components to the locale
layer for no gain.

---

### 6 — Verify the four unverified criteria

This is the story's real weight. Record every result in `known_issues.md` (task 7a).

#### 6a. No LTR flash on cold start in Arabic (BRD `:373`)

`bootstrap.ts:28-41` is built to guarantee this and has never been checked. **Not verifiable by hot
reload.**

1. Launch, set language to Arabic, confirm the preference is written under `azm.locale`
   (`config.ts:12`).
2. **Fully kill the app** — swipe from the task switcher; on Android `adb shell am force-stop`.
3. Cold launch and watch the first painted frame. Record on video if the device allows; the flash,
   if any, is one or two frames.
4. Expected: splash → Arabic, RTL. No LTR frame at any point.
5. Repeat with English persisted, and once with **no** stored preference on an Arabic-locale device
   (exercises `resolveInitialLocale`'s device-language branch at `:42-43`).

If a flash appears, the cause is work moved out of `bootstrap()` — not a missing `await`. Check that
`_layout.tsx:30` still returns `null` and that `LocaleProvider` (task 1c) did not introduce an async
read.

#### 6b. Numbers and dates format per locale (BRD `:377`)

`format.ts` needs no change; confirm it behaves.

- `formatNumber(1234)` → `1,234` (en) / `١٬٢٣٤` (ar).
- `formatDate` / `formatDateTime` / `formatTime` — Arabic-Indic digits and Arabic month names.
- `formatRelative` — `"3 hours ago"` / `"قبل ٣ ساعات"`.
- `formatRelativeShort` — the six `ticket.age.*` suffixes. **Already present in both locale files**:
  en `{minute:"m", hour:"h", day:"d", month:"mo", year:"y", second:"s"}`, ar
  `{minute:"د", hour:"س", day:"ي", month:"شهر", year:"سنة", second:"ث"}`. Confirm they render on
  `TicketRow`.
- `formatFileSize` — `file.size.*` is `{b:"B", kb:"KB", mb:"MB"}` / `{b:"ب", kb:"ك.ب", mb:"م.ب"}`.
- **`isolateLtr` (`:142-144`)** — a phone number inside an Arabic row must keep its own LTR run.
  Check `CustomerRow` and the customer profile header in Arabic; a number reading backwards or with
  a migrated `+` is the failure.

**Confirm `Intl` is present on device, not just in Metro.** Every formatter here and i18next's own
Arabic plural selection depend on `Intl.NumberFormat`, `Intl.DateTimeFormat`,
`Intl.RelativeTimeFormat` and `Intl.PluralRules` existing in Hermes. `ar.json` carries 18 plural-form
keys (`_zero`/`_two`/`_few`/`_many`) that silently fall back to `_other` if `Intl.PluralRules` is
missing. Verify on a real build, not the web target — `expo start --web` uses the browser's `Intl`
and will pass regardless.

#### 6c. Directional icons mirror; non-directional do not (BRD `:375`)

`Icon.tsx:227` is the entire policy: `['chevronForward', 'arrowBack', 'signOut', 'send']`.

1. Read the `IconName` union at `:21-58` and classify **every** name as directional or not.
2. The BRD names `attachment` and `camera` as must-not-mirror. There is no `attachment` name — the
   paperclip is `paperclip` (`:113`). Neither it nor `camera` (`:134`) is in the set. Correct.
3. Check the candidates the set omits: `chevronDown` (`:108`) correctly absent — vertical.
   `search` (`:188`), `edit` (`:198`), `message` (`:176`), `phone` (`:94`) — decide each explicitly
   and record the reasoning. A magnifier and a pencil are conventionally mirrored in RTL; that this
   set omits them is a **design question, not an obvious bug**. Raise it rather than resolving it
   silently — the design-system plan's §15 already holds ten such open flags.
4. Verify visually in Arabic, and verify the override works: `CreateTicketScreen` passes
   `mirrorInRtl={false}` on its `chevronDown`.

#### 6d. Logical properties only (BRD `:378`) — **VERIFIED 2026-09-01**

The intake asks to confirm the rule is *active, not just configured*. **It is.** A probe file
containing `marginLeft`, `paddingRight`, `left`, `fontWeight` and `#ff0000` produced five errors:

```
1:20  error  Use logical layout props ('Start'/'End') instead — this app must work in RTL
1:35  error  Use logical layout props ('Start'/'End') instead — this app must work in RTL
1:52  error  Use logical layout props ('Start'/'End') instead — this app must work in RTL
1:61  error  Don't set 'fontWeight'/'fontFamily' directly — use the `weight` prop on Text/TextInput
1:92  error  Hex colour literals belong only in core/lib/theme/primitives.ts — use a theme token
```

Re-run `npm run lint` at the end and confirm zero errors across `src/`. **Do not re-add a probe
file to the repo.**

#### 6e. Arabic strings do not clip or overflow (BRD `:376`)

The only criterion with no automated check and no prior verification. Walk every screen in Arabic,
on the **smallest** supported width, in both themes:

Login · Home · Tickets list (all filter chips) · Ticket detail (all three segments) · Assign sheet ·
Status sheet · Create ticket · Customers list · Customer profile (Info / Tickets / Notes) · Create
and edit customer · Notifications · Profile and its four sheets.

Watch specifically: `FilterChip` rows, `StatusBadge` and `PriorityChip` (fixed-width pills with the
longest Arabic status words), `Button` labels, `SegmentedControl` (`LanguageToggle.tsx:29-34`
already documents one width failure of exactly this kind), `SettingsRow` label-plus-value rows, and
`TicketRow`'s reference-plus-age line. Record each failure with screen, component and string key.
**Fixes are in scope only where the failure is a missing `flexShrink`, `numberOfLines` or width
constraint** — a copy change needs the product owner.

---

### 7 — Documentation

#### 7a. `docs/phase1_known_issues.md`

Rewrite `:8-17` (the TF-01 entry under "Deferred defects"). It currently says the criterion is unmet
and there is no `expo-updates` in the project. After task 3 both halves are false. State the
decision from task 0, the two-layer implementation, and that the reload needs a development build.
Move it out of "Deferred defects". Add the 6a/6b/6c/6e results — including any icon-mirroring
question raised in 6c and any clipping left unfixed in 6e — under "Verification gaps" if they remain
open.

#### 7b. The intake's own errors

Note in the plan's closing report (not by editing the intake) that: `docs/DESIGN.md` does not exist;
and there is no `2w` relative unit.

#### 7c. `CLAUDE.md` and `AGENTS.md`

- The "RTL and locale" sections in both: direction is now React state driven by `LocaleProvider`, the
  root carries Yoga `direction`, and `reloadApp()` closes the native latch. Keep the
  before-first-paint rule stated as forcefully as it is now — it is still the binding constraint.
- Both dependency notes: `expo-updates` is the **first** package here that requires a development
  build and does not work in Expo Go.
- `CLAUDE.md`'s hard-rule 5 paragraph and `AGENTS.md`'s rule 5: add that `localisedName` resolves at
  render, never in `api.ts`, and why.

---

## Edge Cases & Failure Modes

- **Reload fails or is unavailable** (Expo Go, `expo-updates` disabled, `DevSettings` missing).
  `reloadApp()` returns `false`; `changeLocale` returns `false`; `restartPending` stays `true` and
  the notice renders. Layer 1 has already mirrored the layout, so the app is usable — only native
  chrome is stale. Enforced in `src/core/lib/i18n/reload.ts` and task 4's notice.
- **Agent switches language twice quickly.** The second `changeLocale` may run while the first
  reload is in flight. `changeLocale` returns early when `next === currentLocale()`
  (`locale-context.tsx`), and `setLocale` persists before the reload, so the last write wins and the
  reloaded process reads it. No lock needed; do not add one.
- **Reload discards in-flight work.** A reload drops unsaved form state and pending mutations. The
  two switch points are the **login footer** (no form state to lose) and **Profile's sheet** (no
  form). Neither create-ticket nor create-customer exposes a language control. **Do not add one to
  a screen with a dirty form** without a confirmation step — story 20 already established that an
  abandoned create form must not silently lose input.
- **`AsyncStorage.setItem` fails** in `setLocale` (`config.ts:98-101`). Caught; the session switches
  and the preference is lost at next launch. Existing behaviour, unchanged.
- **`useLocale()` called above `LocaleProvider`.** Throws. `OfflineBanner` renders inside
  `AuthProvider`, well below it. If a future component must render above, give it
  `nativeDirection()`, not a `useLocale()` fallback.
- **Device locale changes while backgrounded.** Ignored by design — `resolveInitialLocale`
  (`config.ts:34-44`) prefers the stored choice, and an explicit choice must outrank the OS.
- **A locale row with an empty `name_ar`.** `localisedName` falls back to the other language, then
  `null` (`locale-name.ts:14-16`); each call site renders
  `t('customerDetail.info.unknown')`. Preserved by task 5 — do not change the fallback chain.
- **`Intl.PluralRules` missing in Hermes.** Arabic's `_zero`/`_two`/`_few`/`_many` forms silently
  fall back to `_other` — grammatically wrong Arabic, no error. Task 6b is the only thing that
  catches it.
- **A sixth locale-bearing table appears later.** `LocalisedName` is exported from `core/utils`;
  reuse it rather than re-declaring the pair inline, as `auth`, `customers` and `tickets` each did
  before task 5.

---

## Test Plan

**There is no test runner in this repository** — no Jest, no test files, no `test` script
(`AGENTS.md`). Do **not** add one as part of this story; that is TF-scope work of its own. The gates
are `npm run lint`, `npm run typecheck`, and the manual matrix below.

1. **Typecheck** — `npm run typecheck`. Task 5 changes seven type declarations; every consumer must
   be updated. Expect roughly a dozen errors on the first run and drive them to zero. This is the
   only mechanical check that task 5 is complete.
2. **Lint** — `npm run lint`. Zero errors. Confirms task 2's `direction` style key is not caught by
   the physical-property ban.
3. **Manual: switch matrix.** From Profile and from the login footer, switch ar→en and en→ar. Each
   time confirm text, alignment, icon mirroring and row order all change together, and that no
   "restart" notice is left on screen.
4. **Manual: cold start.** Task 6a, both languages plus the no-preference case.
5. **Manual: cache locale.** Open a customer profile in Arabic (department and branch visible),
   switch to English **without leaving the screen**, confirm both names re-render in English with no
   network request. Repeat for a ticket's category on the detail screen and for the category picker.
   This is the only check that task 5 worked; before it, the names stay Arabic.
6. **Manual: Arabic visual sweep.** Task 6e, every screen, smallest width, both themes.
7. **Manual: icon audit.** Task 6c, against the full `IconName` union.
8. **Regression: RTL-sensitive absolute positioning.** `FAB` (`end: theme.spacing.xl`),
   `OfflineBanner` (`start: 0, end: 0`), `HomeHeader`'s unread badge (`end: -theme.spacing.xxs`) and
   `AttachmentViewer`'s close button (`end: theme.spacing.lg`) all use logical insets. Confirm each
   sits on the correct side in Arabic **after a switch without a reload** — this is where Yoga
   `direction` and `I18nManager` disagree most visibly, and the sharpest test of task 2.

---

## Verification Steps

1. **Install:** `npx expo install expo-updates` in the repo root. Confirm `package.json` pins a
   `~57.x` version.
2. **Frontend builds:** `npm run typecheck` then `npm run lint` in the repo root. Both zero.
3. **Frontend runs:** `npm start`, then `a` (Android) or `i` (iOS). **A development build is
   required for task 3's reload path** — in Expo Go, `reloadApp()` takes the `__DEV__`
   `DevSettings.reload()` branch, which exercises the flow but not `Updates.reloadAsync()`.
4. **Regression:** walk the full manual matrix in Test Plan 3–8.
5. **Regression:** confirm the four screens in Test Plan 8 in both directions after an in-session
   switch.
6. **Docs:** confirm `known_issues.md`'s TF-01 entry no longer claims there is no `expo-updates`,
   and that `CLAUDE.md` and `AGENTS.md` both carry the development-build note.

---

## Done Criteria

Mirrors BRD `docs/phase1_brd_1.md:370-378` verbatim, plus this story's own work.

- [ ] Every user-facing string sourced from translation files; no hardcoded literals
- [ ] Language switches instantly with no app restart *(per task 0's decision — layer 1 flips the
      layout in-frame, layer 2 reloads for the native chrome; the agent restarts nothing)*
- [ ] Selected locale persists across restarts
- [ ] No LTR flash on cold start in Arabic — locale resolves before first paint *(task 6a, cold kill,
      both languages plus the no-preference case)*
- [ ] Layout mirrors horizontally when Arabic is active *(without a reload — task 2)*
- [ ] Directional icons (back, chevron) mirror; non-directional (attachment, camera) do not
      *(task 6c, audited against the whole `IconName` union, with omissions raised to design)*
- [ ] Arabic strings do not clip or overflow in buttons, pills, or rows *(task 6e, every screen,
      smallest width, both themes)*
- [ ] Numbers and dates format per locale *(task 6b, including `Intl` present on device and
      `isolateLtr` on phone numbers)*
- [ ] Components use logical properties (marginStart) — never marginLeft/marginRight
      *(**verified 2026-09-01** — the ESLint rule fires; task 6d)*
- [ ] `useLocale()` is the only way locale or direction is read in a component; no
      `currentLocale()` or `I18nManager` call remains in a render path
- [ ] `localisedName` is called from no `api.ts`; the query cache holds no resolved name
- [ ] The restart notice exists once, on the reload-failed path only
- [ ] `docs/phase1_known_issues.md`'s TF-01 entry records the task 0 decision and every 6a–6e result
- [ ] `CLAUDE.md` and `AGENTS.md` note that `expo-updates` requires a development build

**STOP HERE. Report to the user and wait for confirmation before proceeding.**
