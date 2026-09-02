# Story 06 — Profile and settings (Story: SCRUM-46)

> Intake: `.squad/stories/profile/SCRUM-46/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4492` (`Profile - Home`); the screen body is `7:4497`.

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). This story is the **first consumer of five components** that story built and nothing has used since: `SettingsRow`, `RowGroup`, `BottomSheet`, `SheetHeader` and `Avatar` (`grep -rn 'RowGroup\|SettingsRow\|BottomSheet\|SheetHeader' src/ --include=*.tsx | grep -v core/components/` → no hits). It is the **second** consumer of `SegmentedControl`.
- **Story 02 completed** — [`../auth/02-story-agent-login-SCRUM-17.md`](../auth/02-story-agent-login-SCRUM-17.md). It built `useAuth()`, `signOut()` and the `Stack.Protected` guard this screen relies on to leave the app when the agent signs out.
- **Story 03 completed** — [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md). It built `src/app/(tabs)/`, the `profile.tsx` route this story fills in, and `useAgentProfile` — the hook the intake explicitly says to reuse rather than write a second query against `['profile', …]`.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **A second seeded agent account.** The intake's central sign-out requirement — that a different agent signing in on the same device does not see the previous agent's cached data — cannot be verified with one login.

**This story does not depend on stories 04 or 05** and touches none of their files. It can run in parallel with either.

---

## Story Goal

The Profile tab stops being a placeholder and becomes the agent's identity and control panel. Concretely:

1. **An identity card** — avatar, full name, and "department · branch", read from the profile query Home already uses.
2. **A Settings group** — **Language**, **Theme** and **Notifications**, each a row showing its current value and opening a picker sheet.
3. **An Account group** — **App information**, showing the app version.
4. **Sign out** — behind a confirmation, clearing the Supabase session *and* the entire TanStack Query cache so the next agent on this device starts clean.

**Not in scope** — each has its own story or has no backend yet: editing the agent's own profile (no story exists; the identity card is read-only), the notification *centre* (US-028, `docs/phase1_brd_1.md:841`), and actually delivering push or email (§9 of the API reference is marked 🔨, "No table exists yet"). The Notifications row stores a preference nothing consumes yet — see **Open questions** flag 2 before building it.

---

## A note on acceptance criteria

**There is no US-030 in the BRD.** `docs/phase1_brd_1.md` runs to US-028 (`:841`), and `grep -n '^### US-' docs/phase1_brd_1.md | tail` confirms nothing follows it. The intake's "Acceptance criteria" block is also empty. Every prior story in this repo mirrored a numbered BRD criteria list into `## Done Criteria`; this one cannot.

`## Done Criteria` below is therefore derived from **the intake's one-sentence description** and **the Figma render**, and is the weakest-sourced criteria list of any story so far. Read it as a proposal to confirm, not as a transcription — see **Open questions** flag 1.

---

## Context — Read These Files First

1. `src/features/auth/session-context.tsx` — the whole file (88 lines). `signOut` (lines 71-74) already does what the intake asks: `await signOutAgent()` then `queryClient.clear()`. **That requirement is already met by story 02** — do not re-implement it. What is *not* handled is a throwing `signOutAgent`; see task 6 and the edge cases.
2. `src/features/auth/api.ts:129-132` — `signOutAgent`. Three lines: `supabase.auth.signOut()`, and `throw toAuthError(error)` on failure. The throw is what skips `queryClient.clear()` in the caller.
3. `src/features/auth/hooks.ts:17-32` — `useAgentProfile`. Keyed `['profile', userId]` with a 5-minute `staleTime`, returning `AgentProfileWithOrg` (`fullName`, `departmentName`, `branchName`, plus the base profile). **This is the hook the intake names.** Do not add a second one.
4. `src/core/components/SettingsRow.tsx` — the whole file (97 lines). The three-way union on `type` (lines 14-17) maps exactly onto this screen: `link` for the three settings rows, `static` for App information, `destructive` for Sign out. `ROW_HEIGHT = 48` (line 19) matches Figma's 48h rows exactly. **`RowGroup`'s divider is `marginStart: theme.spacing.lg` (line 81) — Figma's is inset to 48**, aligned with the label rather than the card edge. Task 1 fixes that.
5. `src/core/lib/theme/ThemeProvider.tsx` — `ThemeMode` is `'light' | 'dark' | 'system'` (line 28), `theme.mode` is the stored preference and `theme.scheme` the resolved one (lines 43-46), and `setMode` (lines 113-117) persists to AsyncStorage fire-and-forget. The Theme picker is `theme.mode` in, `theme.setMode` out — nothing else.
6. `src/core/lib/i18n/index.ts` — `setLocale` (lines 95-103) changes the language, persists it, and **returns `true` when a restart is required** for the direction to flip. `applyDirection` (lines 54-59) explains why. `SUPPORTED_LOCALES`, `Locale`, `currentLocale` and `isRtlLocale` are all exported here.
7. `src/core/lib/bootstrap.ts:9-13` — `BootstrapResult.directionChangePending`, computed at every launch and documented as "Surface a 'restart required' notice". **`src/app/_layout.tsx:36` consumes only `themeMode` and `fontsLoaded`; `locale` and `directionChangePending` are dropped on the floor.** Task 4 closes that.
8. `src/core/components/LanguageToggle.tsx` — the whole file (51 lines). It already wraps `setLocale` + the restart notice in a `SegmentedControl`. Its only consumer is `LoginScreen.tsx:147`. **Leave it alone** — Figma's Profile uses a row + sheet, not a segmented control, and the login footer still wants the toggle.
9. `src/core/components/BottomSheet.tsx` — the whole file (155 lines). `visible` / `onClose` / optional `title`; passing `title` renders a `SheetHeader` with a grab handle, and the body gets `paddingHorizontal: spacing.xl`. Drag-to-dismiss and backdrop tap both call `onClose` **after** the close animation (line 73), so `visible` must stay `true` until then.
10. `src/core/components/Icon.tsx` — the `IconName` union. `globe`, `theme`, `bell`, `info` and `signOut` all exist and match Figma's five glyphs one-for-one; **no new icons are needed**, the first story where that is true. Note `DEFAULT_MIRRORED` (line 106) already includes `signOut`, so the arrow flips correctly in Arabic.
11. `src/core/lib/i18n/locales/en.json:31-40` and `ar.json:35-44` — the `settings` namespace. `theme`, `themeLight`, `themeDark`, `themeSystem`, `language`, `languageEnglish`, `languageArabic` and `restartRequired` **already exist in both locales**. Task 8 adds a `profile` namespace and reuses these rather than duplicating them.
12. `src/app/_layout.tsx:54-73` — `RootNavigator`. Sign-out needs **no navigation call**: `useAuth().status` flips to `signedOut` and `Stack.Protected` (line 68) swaps the stack. A `router.replace` here would fight the guard.
13. `app.json` — `expo.version` is `"1.0.0"`. There is **no** `ios.buildNumber` and **no** `android.versionCode`, so the "(build 308)" half of Figma's App information row has no source. See task 7.
14. `docs/phase1_api_reference.md` §9 (lines 454-465) — Notifications, marked 🔨 with "**Requires §9 of the backend plan. No table exists yet.**" This is the evidence behind flag 2.

---

## Design spec (resolved from Figma node `7:4492`)

Structure, from `get_metadata` on `7:4492`:

```
ProfileScreen 7:4497
├── 7:4498  header
│   └── 7:4517  TitleRow (42h) → "Profile"
├── 7:4520  Content
│   ├── 83:668  Identity           x=16 y=16   355.69 × 84
│   ├── 83:675  SettingsGroup      x=16 y=124  355.69 × 184
│   │   ├── 83:676  SectionHeader ("SETTINGS", 38h)
│   │   └── 83:679  Card (146h) → Language / Divider / Theme / Divider / Notifications
│   ├── 83:723  AccountGroup       x=16 y=332  355.69 × 86
│   │   ├── 83:724  SectionHeader ("ACCOUNT", 38h)
│   │   └── 83:727  Card (48h) → App information
│   └── 83:740  SignOutCard        x=16 y=442  355.69 × 48   (no section header)
└── 60:363 BottomNav   (already built — src/app/(tabs)/_layout.tsx)
```

**Every value on this screen resolves to a real scale token.** `get_variable_defs` on `83:675` returns `fontSize.xs`/`lineHeight.xs`/`tracking.wide`/`textSecondary`, `fontSize.md`/`lineHeight.md`/`colors.text`, `fontSize.sm`/`lineHeight.sm`/`textMuted`, `spacing.md`/`spacing.lg`/`spacing.xxxl`, `radius.md`, `colors.surface`, `colors.border` (#e8ebf0 = `neutral200` = `borderSubtle`) and `colors.icon`. **No legacy `font size/13_5`-style values appear anywhere in this subtree** — the first screen in the project where that is true. Do not snap anything; the tokens are already correct.

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Screen title "Profile" | 28h text at x=16 | `<Text variant="title" weight="semibold">` |
| Content horizontal inset | 16 | `spacing.lg` on a wrapper |
| Title → identity gap | 16 | `spacing.lg` |
| Group → group gap | 24 | `spacing.xl` |
| Identity card | 84h, surface, radius 12 | `radius.md`, `colors.bgSurface` |
| Identity avatar | 40 circle, tinted | `<Avatar size={40} />` |
| Identity name | 16/24 semibold | `<Text variant="body" weight="semibold">` |
| Identity subtitle | 14/20 muted | `<Text variant="callout" tone="muted">` |
| Section header | 38h; label `xs`/`lh xs`/semibold/UPPER/`tracking wide`/`textSecondary` | `<SectionHeader />` (default `variant="none"`) |
| Card | radius 12, `colors.surface` | `<RowGroup>` |
| Row | 48h, pad `md`/`lg`, gap `md`, icon 20 | `<SettingsRow>` as built |
| Row label | 16/24, `colors.text` | `SettingsRow`'s `variant="body"` |
| Row value | 14/20, `textMuted` | `SettingsRow`'s `variant="callout" tone="muted"` |
| Row divider | 1px, inset **48** from the card edge | task 1 — `RowGroup` currently insets 16 |
| Sign out row | destructive, own card, no header | `<RowGroup><SettingsRow type="destructive" …/></RowGroup>` |

`SectionHeader` renders 34h (pad-y `spacing.sm` × 2 + `lineHeight.xs`) against Figma's 38h — the documented 2px-per-side shift story 01 recorded when it snapped Figma's off-scale pad-y 10 to 8. **Do not reintroduce the 10.**

The section headers sit *inside* the 16px-inset container (`83:676` is at x=0 within `83:675`, which is at x=16), and `SectionHeader` adds its own `paddingHorizontal: spacing.lg`. The label therefore lands 32 from the screen edge while the card edge is at 16 — which is what the render shows. **Nest them normally; no padding gymnastics.**

**One value in the render has no source:** App information reads "AZM 2.4.1 (build 308)". `app.json` says `1.0.0` and defines no build number. Task 7 renders what actually exists.

---

## Implementation tasks

### 1 — Let `RowGroup` inset its dividers to the label

**File: `src/core/components/SettingsRow.tsx`**

Figma's dividers (`83:697`, `83:710`) start at x=48 within the card — `spacing.lg` (16) + icon (20) + `spacing.md` (12) — so they align under the label, not under the icon. `RowGroup` hardcodes `marginStart: theme.spacing.lg` (line 81). Add an opt-in, defaulting to today's behaviour so nothing can regress:

```tsx
export type RowGroupProps = {
  children: ReactNode;
  /**
   * `edge` (default) insets dividers by `spacing.lg`. `label` insets them past
   * the leading icon too — Figma node 83:697 — for groups whose rows all carry
   * one. A group with mixed icon/no-icon rows should stay on `edge`.
   */
  dividerInset?: 'edge' | 'label';
};
```

```tsx
const ICON_SIZE = 20; // SettingsRow.tsx:39
const insetStart =
  dividerInset === 'label'
    ? theme.spacing.lg + ICON_SIZE + theme.spacing.md
    : theme.spacing.lg;
```

Use `insetStart` in place of the literal on line 81. `RowGroup` has zero consumers today, so this is free.

### 2 — The identity card

**Create file: `src/features/profile/components/IdentityCard.tsx`**

```tsx
export type IdentityCardProps = {
  fullName?: string;
  departmentName?: string | null;
  branchName?: string | null;
  loading: boolean;
  error: boolean;
};
```

A `View` on `colors.bgSurface` / `radius.md`, `flexDirection: 'row'`, `alignItems: 'center'`, `gap: theme.spacing.md`, `padding: theme.spacing.lg`:

- `<Avatar name={fullName ?? ''} size={40} />`. If story 05 has landed, pass `tint={tintForName(fullName ?? '')}` to match its Customers rows; if not, leave it neutral. Do **not** add story 05's tint work here — say which you did in a comment.
- Name — `<Text variant="body" weight="semibold" numberOfLines={1}>`.
- Subtitle — `[departmentName, branchName].filter(Boolean).join(' · ')` as `<Text variant="callout" tone="muted" numberOfLines={1}>`. **Filter before joining**: RLS can hide a department or branch row, and `"Customer Support · undefined"` is the failure mode story 03 already hit and documented on Home.
- `loading` → two `<Skeleton>` lines beside a circular one, inside the same card shell, so the card does not resize when data arrives.
- `error` → the name line falls back to `t('home.greeting.generic')` ("Welcome back") and the subtitle is omitted. A profile fetch failure must not blank out the whole screen; Language, Theme and Sign out are all still usable.

### 3 — The theme picker

**Create file: `src/features/profile/components/ThemeSheet.tsx`**

```tsx
export type ThemeSheetProps = { visible: boolean; onClose: () => void };
```

`<BottomSheet visible={visible} onClose={onClose} title={t('settings.theme')}>` containing three `SettingsRow type="link"` rows — `settings.themeSystem`, `settings.themeLight`, `settings.themeDark` — inside a `RowGroup`. The selected one gets `icon="check"`; use `accessibilityState={{ selected }}` via the row's `Pressable`, which `SettingsRow` already supplies for `link`.

`onPress` → `theme.setMode(mode)` then `onClose()`. `setMode` persists and re-renders every consumer synchronously (`ThemeProvider.tsx:113-127`), so **the sheet itself re-themes while open** — that is correct and worth watching for in the manual matrix.

The row value shown on the Profile screen is `t(\`settings.theme${capitalise(theme.mode)}\`)` → "System default" / "Light" / "Dark". `theme.mode`, **not** `theme.scheme`: the row must say what the agent chose, not what the OS resolved it to.

### 4 — The language picker, and the restart notice nobody surfaces

**File: `src/core/lib/i18n/index.ts`**

`bootstrap()` computes `directionChangePending` (`bootstrap.ts:9-13`) and `src/app/_layout.tsx:36` never reads it — so the "restart required" state that survives a relaunch is currently invisible. Rather than plumb it through the root layout, expose the same check where the direction rules already live:

```ts
/**
 * True when the native views were created with a direction that no longer
 * matches the active locale — i.e. a language switch is staged but needs a
 * relaunch. `applyDirection` returns the same fact at switch time; this
 * reports it for any later render, including after a cold start.
 */
export function isDirectionRestartPending(): boolean {
  return I18nManager.isRTL !== isRtlLocale(currentLocale());
}
```

`I18nManager` is already imported in this file (line 5). Profile must call this rather than reading `I18nManager` directly — outside `direction.tsx` and this file, nothing does.

**Create file: `src/features/profile/components/LanguageSheet.tsx`**

Same shape as `ThemeSheet`: two rows, `settings.languageArabic` and `settings.languageEnglish`, check on the current one from `currentLocale()`.

`onPress` → `await setLocale(locale)`. **Do not close the sheet on the result being `true`** — render `t('settings.restartRequired')` inside the sheet as a `<Text variant="caption" tone="muted">` and let the agent dismiss it, exactly as `LanguageToggle.tsx:153-157` does. Closing immediately hides the one message that explains why the layout did not flip.

On the Profile screen the row's value is the current language's own name (`settings.languageArabic` / `settings.languageEnglish`), and a `t('settings.restartRequired')` caption renders under the Settings card whenever `isDirectionRestartPending()` is true — including on a fresh launch, which is the case `_layout.tsx` currently drops.

**Figma's Language row reads "Arabic · English"** — both languages, not the current one. That is a placeholder rather than a value; see **Open questions** flag 3.

### 5 — The notifications preference

**Read flag 2 before building this.** There is no notifications table (API §9: "No table exists yet"), `expo-notifications` is not a dependency, and nothing in the app will read what this stores.

**Create file: `src/features/profile/notification-prefs.ts`**

```ts
const KEY = 'azm.notifications.prefs';

export type NotificationPrefs = { push: boolean; email: boolean };

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { push: true, email: true };

export async function loadNotificationPrefs(): Promise<NotificationPrefs>;
export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void>;
```

Both wrap `AsyncStorage` in `try`/`catch` and fall back to the defaults, matching `loadPersistedThemeMode` (`ThemeProvider.tsx:84-91`) — a storage failure costs a preference, never a crash.

**Create file: `src/features/profile/components/NotificationsSheet.tsx`**

Two rows, each a label plus React Native's built-in `Switch` (**no new dependency**), inside a `RowGroup`. Drive `trackColor={{ true: theme.colors.bgPrimary, false: theme.colors.borderDefault }}` and `thumbColor={theme.colors.bgSurface}` from tokens — `Switch`'s platform defaults ignore the palette entirely and read as un-themed in dark mode.

Below the rows, a `<Text variant="caption" tone="muted">{t('profile.notifications.pending')}</Text>` — "Notifications aren't sending yet. Your choice is saved for when they are." **Ship the honesty in the UI**, not only in a code comment; an agent who toggles Push on and never receives one has been misled.

The Profile row's value is the enabled set joined with `, ` — "Push, Email" / "Push" / `t('profile.notifications.none')`.

### 6 — Sign out

**File: `src/features/auth/session-context.tsx`**

`signOut` (lines 71-74) awaits `signOutAgent()` and then clears the cache. `signOutAgent` throws on any Supabase error (`api.ts:131`), which **skips `queryClient.clear()`**. A sign-out that fails on a flaky network therefore leaves the previous agent's tickets and customers in the cache — precisely the leak the intake asks this story to prevent. Make the clear unconditional:

```ts
signOut: async () => {
  try {
    await signOutAgent();
  } finally {
    // Clear regardless: a network failure must not leave the previous
    // agent's tickets and customers in the cache for the next sign-in.
    queryClient.clear();
  }
},
```

The `throw` still propagates, so the screen can surface it.

**In `ProfileScreen`** — the destructive row opens a confirm `BottomSheet` (`title: t('profile.signOutConfirm.title')`) with a `<Button variant="danger">` and a `<Button variant="secondary">`. On confirm, `await signOut()`; on throw, keep the sheet open and render the error via the `errorMessageKey` helper story 04 moved into `src/core/utils/errors.ts` (or `isAppError(e) ? e.messageKey : 'states.errorBody'` if 04 has not landed).

**No navigation call.** `useAuth().status` flips to `signedOut` and `_layout.tsx:68`'s `Stack.Protected` swaps the stack. A `router.replace('/(auth)/login')` here races the guard.

**Figma shows no confirmation step** — the row signs out directly. It is added because a mis-tap mid-call costs the agent a re-login and their in-flight context; see **Open questions** flag 4.

### 7 — App information

**File: `src/features/profile/screens/ProfileScreen.tsx`** (the row itself)

`expo-constants` is already a dependency (`package.json:12`) and unused anywhere in `src/`.

```ts
import Constants from 'expo-constants';

const version = Constants.expoConfig?.version ?? '—';
const build =
  Constants.expoConfig?.ios?.buildNumber ??
  Constants.expoConfig?.android?.versionCode?.toString();
```

Render `<SettingsRow type="static" icon="info" label={t('profile.appInformation')} value={...} />` — `t('profile.appVersion', { version })` when there is no build, `t('profile.appVersionBuild', { version, build })` when there is.

`app.json` currently defines **neither** `ios.buildNumber` nor `android.versionCode`, so today this renders "AZM 1.0.0". **Do not hardcode a build number to match Figma's "(build 308)".** Adding them to `app.json` is a release-process decision, not a screen decision; flag 5 raises it.

### 8 — The screen

**File: `src/features/profile/screens/ProfileScreen.tsx`** — replace all 17 lines.

```tsx
const profile = useAgentProfile();
const theme = useTheme();
const [sheet, setSheet] = useState<'language' | 'theme' | 'notifications' | 'signOut' | null>(null);
const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
```

A single `null`-able `sheet` value rather than four booleans — four independent flags make "two sheets open at once" representable, and `BottomSheet` renders a `Modal`, so that state is a stuck screen.

Composition, top to bottom, inside a `SafeAreaView` (`edges={['top']}`, `backgroundColor: theme.colors.bgCanvas`) wrapping a `ScrollView` with `contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}`:

1. The `Profile` title — `<Text variant="title" weight="semibold">`.
2. `<IdentityCard … loading={profile.isPending} error={profile.isError} />`.
3. `<SectionHeader title={t('profile.sections.settings')} />` then a `<RowGroup dividerInset="label">` of three `SettingsRow type="link"` rows — Language (`icon="globe"`), Theme (`icon="theme"`), Notifications (`icon="bell"`) — each with its computed `value` and `onPress={() => setSheet('…')}`.
4. The `settings.restartRequired` caption when `isDirectionRestartPending()`.
5. `<SectionHeader title={t('profile.sections.account')} />` then a `<RowGroup>` with the single static App information row. **`dividerInset` is irrelevant for a one-row group** — leave it off.
6. A `<RowGroup>` holding one `SettingsRow type="destructive" icon="signOut" label={t('profile.signOut')} onPress={() => setSheet('signOut')} />`.
7. The four sheets, rendered unconditionally with `visible={sheet === '…'}` and `onClose={() => setSheet(null)}`. **Do not conditionally mount them** — `BottomSheet` runs its close animation before calling `onClose` (line 73), and unmounting on the state change cuts that animation off mid-flight.

Load the notification prefs once in a `useEffect` on mount, not on every sheet open.

**File: `src/app/(tabs)/profile.tsx`** — no change. It already imports `ProfileScreen` from the barrel and renders it, which is all a route file may do (hard rule 1).

### 9 — Barrel and i18n

**File: `src/features/profile/index.ts`** — currently one line.

```ts
export { ProfileScreen } from './screens/ProfileScreen';
export {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from './notification-prefs';
```

The sheets and `IdentityCard` stay internal — nothing outside the feature renders them.

**Files: `src/core/lib/i18n/locales/en.json` and `.../ar.json`**

The `settings` namespace already holds every theme and language string in both locales (`en.json:31-40`, `ar.json:35-44`). **Reuse them.** Add only:

```json
"profile": {
  "title": "Profile",
  "sections": { "settings": "Settings", "account": "Account" },
  "appInformation": "App information",
  "appVersion": "AZM {{version}}",
  "appVersionBuild": "AZM {{version}} (build {{build}})",
  "notifications": {
    "label": "Notifications",
    "push": "Push",
    "email": "Email",
    "none": "Off",
    "pending": "Notifications aren't sending yet. Your choice is saved for when they are."
  },
  "signOut": "Sign out",
  "signOutConfirm": {
    "title": "Sign out?",
    "body": "You'll need to sign in again to see your tickets.",
    "confirm": "Sign out"
  }
}
```

Arabic: `"الملف الشخصي"`; sections `"الإعدادات"` / `"الحساب"`; `"معلومات التطبيق"`; `"AZM {{version}}"` and `"AZM {{version}} (إصدار {{build}})"`; notifications `"الإشعارات"` / `"إشعارات فورية"` / `"البريد الإلكتروني"` / `"معطّلة"` / `"لم تبدأ الإشعارات بعد. سيُحفظ اختيارك حتى تبدأ."`; `"تسجيل الخروج"`; confirm `"تسجيل الخروج؟"` / `"ستحتاج إلى تسجيل الدخول مرة أخرى لعرض تذاكرك."` / `"تسجيل الخروج"`.

**`SectionHeader` uppercases its title** (`SectionHeader.tsx:58`), so pass "Settings" and "Account" title-case and let the component render "SETTINGS" / "ACCOUNT". Arabic has no case, so the transform is a no-op there — story 01 §15 already flags the Arabic uppercase+tracking question and this story does not settle it.

### 10 — Update the project docs

**File: `CLAUDE.md`** — add `profile` to the built features in "Project status" and drop it from the "not built yet" list in "Target architecture". If stories 04 and 05 have already landed, `notifications` is then the only unbuilt feature in that list.

---

## Edge Cases & Failure Modes

- **Sign-out fails on a flaky network** — `signOutAgent` throws (`api.ts:131`) and, before task 6, `queryClient.clear()` never runs. The agent stays signed in with the cache intact; if they retry on a better connection it recovers, but if they hand the device over first, the next agent inherits the cache. The `try`/`finally` in task 6 is the fix, and it is the intake's stated requirement.
- **A second agent signs in on the same device** — the whole point of `queryClient.clear()`. Verify it by signing in as agent B and checking Home shows **B's** counts immediately, not A's stale ones for a beat. A `staleTime` of 30s (`query-client.ts:13`) would otherwise serve A's data to B on first paint.
- **Sign-out while a query is in flight** — `queryClient.clear()` removes the observers; the in-flight promise resolves into nothing. Harmless, but do not add a `cancelQueries` — it races the stack swap.
- **`useAgentProfile` returns `null`** — `fetchAgentProfileWithOrg` resolves `null` for a missing or RLS-hidden row, which is **not** an error. `profile.data` is then `null` with `isError` false, so an `isError`-only check renders an empty card. Treat `!profile.data && !profile.isPending` as the error branch too.
- **Department or branch is null** — RLS can hide the joined row. `[dept, branch].filter(Boolean).join(' · ')` yields the one that survived, or `''`. Never render a bare `·`.
- **Theme changes while a sheet is open** — `setMode` re-renders every `useTheme` consumer, including the open `BottomSheet` and its backdrop. Correct and intended, but it must not look like a flicker; matrix row 8 checks it.
- **Language changes while a sheet is open** — i18next re-renders the strings but `I18nManager` cannot flip until relaunch. The sheet's contents change language while staying LTR (or RTL). This is why the restart notice renders *inside* the sheet rather than after closing it.
- **A cold start with a staged direction change** — the agent switched language, never relaunched, then force-quit. On the next launch `applyDirection` sets the correct direction and `directionChangePending` is `false`, so the notice correctly disappears. But if the OS restored the process without re-creating native views, `isDirectionRestartPending()` still reports `true` and the notice persists — which is honest.
- **`AsyncStorage` unavailable** — both `loadNotificationPrefs` and `ThemeProvider`'s write are wrapped and fall back. The screen renders defaults; nothing throws.
- **Two sheets at once** — impossible by construction: `sheet` is a single nullable value (task 8). Four booleans would allow it, and two stacked `Modal`s on Android is a stuck screen with no back-out.
- **`BottomSheet` unmounted mid-animation** — rendering the sheets conditionally (`{sheet === 'theme' && <ThemeSheet …/>}`) cuts the close animation and, on Android, can leave the `Modal` believing it is still visible. Mount them unconditionally and drive `visible`.
- **`expoConfig` is `null`** — possible in a bare or ejected runtime. `Constants.expoConfig?.version ?? '—'` covers it; `Constants.expoConfig!.version` crashes the tab.
- **`android.versionCode` is a number, not a string** — `SettingsRow`'s `value` is typed `string`. `.toString()` it, or the row silently renders nothing under a `string | undefined` widening.
- **RTL** — every row uses `gap` and `paddingHorizontal`, so it mirrors for free. The two directional glyphs are handled: `chevronForward` and `signOut` are both in `DEFAULT_MIRRORED` (`Icon.tsx:106`). The **divider inset** from task 1 must use `marginStart`, not `marginLeft` — `eslint.config.js:72-75` catches the latter.
- **Long Arabic department + branch** — `"دعم العملاء · فرع القاهرة الكبرى"` overflows 355px at `callout`. `numberOfLines={1}` on the subtitle; the card must not grow past 84h.
- **Offline** — `useAgentProfile` retries twice on non-4xx (`query-client.ts:15-19`), then the identity card shows its error fallback while Language, Theme, App information and Sign out all stay fully usable. This screen is the one place in the app that must work offline, because signing out is how an agent hands over a device.

---

## Test Plan

**There is still no test runner in this repo** — no Jest, no `jest-expo`, no test files, no `test` script in `package.json`. Stories 02 through 05 all reached this conclusion and deferred. This story does not install one. It is, however, the story whose central requirement — that sign-out leaves no data behind for the next agent — is **only** verifiable by hand today, and is a data-isolation property rather than a cosmetic one. That is worth saying out loud in the review.

### Runnable today — manual matrix

`npm start`, then `a`/`i`. Sign in as a seeded agent and open the Profile tab.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Seeded agent | Open the Profile tab | Title, identity card with name + "dept · branch", both groups, sign-out card |
| 2 | Agent whose branch RLS hides | Open the tab | Name renders alone; no trailing "·" |
| 3 | Airplane mode, cold start | Open the tab | Identity card shows its fallback; every other row still works |
| 4 | Any | Tap **Language** | Sheet with Arabic / English; the current one is checked |
| 5 | English active | Choose العربية | Strings switch to Arabic; **restart notice appears inside the sheet** |
| 6 | Restart notice shown | Close the sheet | The notice also renders under the Settings card |
| 7 | Restart notice shown | Fully quit and relaunch | Layout is now RTL; the notice is **gone** |
| 8 | Any | Tap **Theme**, choose Dark | Sheet and screen re-theme immediately; no flicker or stuck backdrop |
| 9 | Theme = Dark | Read the Theme row | Value reads "Dark", not the resolved scheme |
| 10 | Theme = System, OS in dark | Read the Theme row | Value reads "System default" while the screen renders dark |
| 11 | Theme = System | Change the OS theme with the app open | Screen follows; the row still reads "System default" |
| 12 | Any | Tap **Notifications** | Two switches, both on by default, plus the "not sending yet" note |
| 13 | Notifications sheet | Toggle Email off, close, reopen | Email is still off |
| 14 | Notifications sheet | Toggle both off | Profile row value reads "Off" |
| 15 | Notifications, dark mode | Read the switches | Track and thumb follow the palette, not the platform default |
| 16 | Any | Read **App information** | "AZM 1.0.0" — matches `app.json`, **not** Figma's "2.4.1 (build 308)" |
| 17 | Any | Tap **Sign out**, then cancel | Sheet closes; still signed in; nothing cleared |
| 18 | Any | Tap **Sign out**, confirm | Login screen appears with no navigation flash |
| 19 | **Two seeded agents** | Sign out as A, sign in as B, open Home | B's counts and lists from the first paint — **no flash of A's data** |
| 20 | Airplane mode | Confirm sign out | Error renders in the sheet; **and** the cache is cleared (task 6's `finally`) |
| 21 | After row 20, back online | Sign in as B | No trace of A's tickets or customers anywhere |
| 22 | Any | Read the card dividers | Inset to **48**, aligned under the labels, not under the icons |
| 23 | العربية | Open the tab | Layout mirrors; the sign-out arrow and both chevrons point the correct way |
| 24 | العربية | Read App information | Version digits — confirm whether Arabic-Indic is wanted (flag 6) |
| 25 | Long Arabic dept + branch | Read the identity card | Subtitle ellipsises; the card stays 84h |
| 26 | Any | Open a sheet, drag it down | Closes with its animation intact; reopening works |
| 27 | Any | Open a sheet, tap the backdrop | Same |
| 28 | Android | Open a sheet, press the system back button | Sheet closes; the tab does not pop |
| 29 | Any | Tap each tab | All four open; Profile is now real |

Rows 19, 20 and 21 are the story's actual point. Run them last and run them properly — row 19 needs two real accounts, not two sessions of the same one.

### To write when a runner exists

1. **Unit — `src/features/profile/notification-prefs.test.ts`** · a round-trip saves and loads; a missing key returns `DEFAULT_NOTIFICATION_PREFS`; a corrupt JSON value returns the defaults rather than throwing.
2. **Unit — `src/core/lib/i18n/index.test.ts`** · `isDirectionRestartPending()` is `false` when `I18nManager.isRTL` agrees with the locale and `true` when it does not, for both `ar` and `en`.
3. **Integration — `src/features/auth/session-context.test.tsx`** · `signOut()` calls `queryClient.clear()` **even when `signOutAgent` rejects**, and still rethrows. This is task 6's regression guard and the highest-value test in the story.
4. **Integration — `src/features/auth/session-context.test.tsx`** · after `signOut()`, `queryClient.getQueryCache().getAll()` is empty.
5. **Unit — `src/features/profile/components/IdentityCard.test.tsx`** · a null `branchName` renders the department alone with no separator; both null renders no subtitle; `error` renders the generic greeting.
6. **Unit — `src/core/components/SettingsRow.test.tsx`** · `RowGroup` with `dividerInset="label"` offsets by 48 and the default by 16; a one-child group renders no divider at all.
7. **Unit — `src/core/lib/i18n/locales.test.ts`** (proposed in story 02, still unwritten) · `en.json` and `ar.json` key sets are identical. This story adds a namespace to both files and is the **fifth** that would have benefited.

---

## Verification Steps

1. **Typecheck:** `npm run typecheck` in the repo root — zero errors. `ThemeMode`, `Locale` and `SettingsRowProps`'s three-way union all make a wrong value fail here.
2. **Lint:** `npm run lint` — zero errors. This is the gate for hard rules 2-5: a hex literal in the `Switch` colours, a `marginLeft` on the divider inset, a `fontWeight` style key, a deep `@/features/auth/session-context` import, or any `core/` → `features/` import fails the build.
3. **Frontend runs:** `npm start`, press `a` (Android) and `i` (iOS). Sign in and walk the manual matrix above.
4. **RTL:** switch to العربية inside the app, confirm the restart notice, then **fully quit and relaunch**. Confirm the layout mirrors and the notice disappears — that round trip is the whole of task 4.
5. **The sign-out isolation check:** matrix rows 19-21, with two real seeded agents. This is the story's core requirement and it has no automated cover.
6. **Regression — login:** sign out, then confirm `LanguageToggle` still works in the login footer (`LoginScreen.tsx:147`). Task 4 added to the module it imports from.
7. **Regression — every other tab:** open Home, Tickets and Customers. Task 1 changed a shared core component and task 6 changed the auth context both of them sit under.
8. **Regression:** `grep -rn 'placeholder.screenBody' src/` — **zero hits** once stories 04, 05 and 06 have all landed. If 04 or 05 has not, only their tab should remain.
9. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

**Derived, not transcribed** — there is no US-030 in `docs/phase1_brd_1.md` and the intake's criteria block is empty. Confirm this list before treating it as the contract (flag 1).

- [ ] The identity card shows the agent's name and "department · branch", from `useAgentProfile` — **no second profile query**
- [ ] Language, Theme and Notifications each show their current value and open a picker
- [ ] Choosing a theme persists it and applies immediately, including `system`
- [ ] Choosing a language persists it, switches strings immediately, and surfaces the restart notice
- [ ] The restart notice also renders on a fresh launch while a direction change is staged
- [ ] Notification preferences persist locally, and the UI says plainly that nothing sends yet
- [ ] App information shows the version from `app.json`, with no hardcoded build number
- [ ] Sign out is confirmed, ends the Supabase session, and clears the **entire** query cache
- [ ] Sign out clears the cache **even when the Supabase call fails**
- [ ] A second agent signing in on the same device sees none of the first agent's data
- [ ] Sign out navigates via `Stack.Protected`, with no `router.replace`
- [ ] Card dividers are inset to the label (48), matching Figma
- [ ] Loading and error states render for the identity card without disabling the rest of the screen
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] CLAUDE.md lists `profile` as built

---

## Open questions — raise with design/product, do not resolve silently

1. **This story has no acceptance criteria and no BRD entry.** The intake's criteria block is empty and `docs/phase1_brd_1.md` ends at US-028 — there is no US-030. Every prior story mirrored a numbered BRD list; this one's `## Done Criteria` is inferred from one sentence and a Figma frame. Either add US-030 to the BRD or confirm the list above is the contract. **Highest-priority question**, because it decides whether the story is done.
2. **Notifications cannot do anything yet.** API §9 says "No table exists yet"; `expo-notifications` is not installed; there is no server-side sender. Task 5 stores a local preference nothing reads and labels it as such in the UI. The alternatives are to drop the row until US-023/US-024/US-028 land, or to render it disabled. Shipping a switch that silently does nothing is the one option that should not happen — confirm which of the other two.
3. **Figma's Language row reads "Arabic · English"** — both languages, not the selected one, while Theme and Notifications both show a current value. Task 4 renders the current language. Confirm, or say what "Arabic · English" was meant to convey.
4. **Figma has no sign-out confirmation.** The row signs out directly. Task 6 adds a confirm sheet because a mis-tap mid-call costs a re-login and the agent's in-flight context. Confirm the extra step is wanted.
5. **App information has no build number.** Figma shows "AZM 2.4.1 (build 308)"; `app.json` has `version: "1.0.0"` and defines neither `ios.buildNumber` nor `android.versionCode`. Task 7 renders "AZM 1.0.0". Whether to add and maintain those fields is a release-process decision — assign it, or accept a version-only row.
6. **Should the version number use Arabic-Indic digits?** Every other number in the app goes through `formatNumber`. A version string is an identifier read aloud to support, like the customer phone numbers story 05 deliberately left in Latin digits. Task 7 leaves it as `app.json` holds it; matrix row 24 records how it looks.
7. **The identity card is read-only and there is no story to change that.** An agent cannot update their own name, email or avatar anywhere in phase 1 — `profiles` rows are administrator-managed, consistent with `auth.helper` ("Accounts are created by your administrator"). Confirm that is intended for phase 1 rather than an omission.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 07.**


## **[Corrected 2026-09-01 — design audit]**

The identity-card row of this plan's spec table was mis-transcribed from the live frame.
Corrected values, re-read on 2026-09-01:

| Element | Plan said | Figma actually binds |
|---|---|---|
| Identity avatar | 40 | **52** |
| Identity name | `variant="body"` 16/24 | **`fontSize.lg`/`lineHeight.lg` 18/26** |
| Identity name → subtitle gap | `spacing.md` | **`spacing.lg`** |

These were recorded as deliberate deviations; they were not. Also missing from the table:
Figma binds `elevation.e2` + `e1` to the identity card AND to all three `RowGroup` cards
(now implemented), and strokes the destructive row's ICON `colors.danger` — the label was
already `tone="danger"`, only the icon was left grey.

Unresolved and left for design: **Figma designs no picker sheets at all.** The frame carries
only the tab's home state, so presenting Language/Theme/Notifications as bottom sheets is an
implementation decision this plan made, not a design one. It needs sign-off.
