# Story 02 — Agent login (Story: SCRUM-17)

> Intake: `.squad/stories/auth/SCRUM-17/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`, node `7:4614` (`Auth - Login`).

## Prerequisites

- **Story 01 completed** — [`../design-system/01-reflect-azm-design-system-in-react-native.md`](../design-system/01-reflect-azm-design-system-in-react-native.md). The token layer, the `Text`/`TextInput`/`Icon` primitives, `Button`, `TextField` and `SegmentedControl`, and `eslint.config.js` all exist and are what this story consumes.
- **`.env` populated** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` — `src/core/lib/supabase.ts:11-16` throws at import time otherwise.
- **A test account** from `docs/phase1_api_reference.md:73-80` (`omar@azm.test`, `admin@azm.test`, …) and its password.
- This story creates **`src/features/`** — no feature folder exists in the repo yet. It sets the precedent every later feature copies, so follow CLAUDE.md's "Every feature has the same anatomy" section exactly.

---

## Story Goal

An agent opens the app, sees the AZM login screen, types email and password, and lands on the app's authenticated root. Concretely:

1. **`(auth)/login`** renders the Figma screen: brand mark, "AZM" wordmark and tagline, EMAIL and PASSWORD fields, a "Forgot password?" link, a full-width **Sign in** button, the "Accounts are created by your administrator." helper line, and an English/العربية toggle in the footer.
2. **Valid credentials** authenticate through `supabase.auth.signInWithPassword()` and the app navigates to the authenticated root without an imperative `router.replace` — the route guard reacts to the session change.
3. **Invalid credentials** show a form-level error and create no session.
4. **A deactivated account** (`profiles.is_active = false`, or no visible `profiles` row) is signed straight back out and shown a distinct message.
5. **Empty or malformed fields** are blocked client-side by React Hook Form before any network call.
6. **No self-registration** affordance exists anywhere on the screen.

**Not in scope** — each has its own story: session-restore semantics and the 30-day inactivity rule (US-002), the password-reset flow itself (US-003 — this story creates only a placeholder route so the design's link is not dead), the Home screen and bottom tabs, and RLS-level `is_active` enforcement (US-004 — see **Open questions**, flag 1).

---

## Context — Read These Files First

1. `src/core/lib/supabase.ts` — the whole file (26 lines). Note `persistSession: true` and `storage: AsyncStorage` (lines 18-25): session persistence is already configured, so **do not** hand-roll token storage.
2. `src/core/components/TextField.tsx` — the whole file (109 lines). Note that `TextFieldProps` (lines 11-24) has **no** `secureTextEntry`, `keyboardType`, `autoComplete` or ref pass-through, and that line 86 hands the trailing `IconButton` `accessibilityLabel={label}`. Task 1 fixes both.
3. `src/core/components/Button.tsx` — `LabelVariant` (line 15), the `link` branch (~lines 65-80), and `HEIGHT = 56` (line 34). `variant="primary" fullWidth loading` is the Sign in button; `variant="link"` is "Forgot password?".
4. `src/core/components/Icon.tsx` — the `IconName` union (~lines 20-47) and `ICON_MAP` (~lines 51-79). `eye` exists, `eyeOff` does **not**.
5. `src/core/components/SegmentedControl.tsx` — the whole file (80 lines). It is the language toggle's engine; note `radius.md` on the container (line 34), which is **not** the pill radius Figma draws.
6. `src/core/utils/errors.ts` — `AppError` (lines 8-17), `kindFromStatus` (lines 19-25), `toAppError` (lines 59-86). Auth error mapping in task 7 **wraps** this; it does not replace it.
7. `src/core/lib/i18n/index.ts` — `setLocale` (~lines 95-103) returns `true` when a **restart** is required for the direction flip; `applyDirection` (~lines 54-59) explains why.
8. `src/app/_layout.tsx` — the whole file (48 lines). Task 13 replaces `<Slot />` with a guarded `<Stack>` and moves the `hideSplash()` trigger.
9. `src/core/lib/theme/layout.ts` and `src/core/lib/theme/typography.ts` — the `spacing`/`radius` scales and the `TextVariant` ramp (`typography`, ~lines 96-103). Every number in the **Design spec** table below is one of these tokens.
10. `docs/phase1_api_reference.md` §1 (lines 47-116) — the auth endpoints and the four test accounts. The SDK wraps these; the raw HTTP is for Postman only.
11. `docs/phase1_brd_1.md:452-464` — US-001's five acceptance criteria verbatim. `## Done Criteria` below mirrors them.
12. `src/core/types/database.ts:296-346` — the `profiles` row shape. **Generated; never hand-edit.** `is_active: boolean` (line 304), `role: user_role` (line 306; the enum is `"agent" | "manager" | "admin"` at line 554).
13. Grep for `react-hook-form` across `src/` — **zero hits today**. This story is its first use; the dependency is already in `package.json:23`.

---

## Design spec (resolved from Figma node `7:4614`)

Every measurement below was derived from the frame geometry and lands exactly on an existing token — **no new tokens are needed**.

| Element | Figma | Token / component |
|---|---|---|
| Screen background | canvas | `colors.bgCanvas` |
| Horizontal page padding | 24 | `spacing.xl` |
| Content block | vertically centred between status bar and footer | `ScrollView` with `contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}` |
| Brand mark | 64 × 63 vector, centred | PNG asset, task 4 |
| Mark → wordmark gap | 16 | `spacing.lg` |
| "AZM" wordmark | 28/34 | `<Text variant="display" weight="bold" align="center">` |
| Wordmark → tagline gap | 4 | `spacing.xs` |
| Tagline | 14/20, muted, centred | `<Text variant="callout" tone="muted" align="center">` |
| Brand → form gap | 32 | `spacing.xxl` |
| Field block height | 74 | `TextField` as built (18 label + 8 gap + 48 field) |
| Email → password gap | 16 | `spacing.lg` |
| Password → "Forgot password?" gap | 8 | `spacing.sm` |
| "Forgot password?" | 14/20, link colour, aligned to the **end** | `<Button variant="link">` in a row with `justifyContent: 'flex-end'` |
| Fields → Sign in gap | 16 | `spacing.lg` |
| Sign in button | full width, 56 high | `<Button variant="primary" fullWidth>` |
| Sign in → helper gap | 16 | `spacing.lg` |
| Helper line | 12/18, muted, centred | `<Text variant="caption" tone="muted" align="center">` |
| Footer | 66 high; toggle 150 × 42, centred | `LanguageToggle`, task 3 |

---

## Implementation tasks

### 1 — Make `TextField` usable for credentials

**File: `src/core/components/TextField.tsx`**

A login screen needs an email keyboard and a masked password field; `TextFieldProps` (lines 11-24) exposes neither. Add pass-throughs and fix the trailing-icon label. Keep every existing prop and default — `TextField` is already used by Story 01's gallery and by every form to come.

```tsx
import type { Ref } from 'react';
import type { TextInput as RNTextInputInstance } from 'react-native';

import type { TextInputProps } from './TextInput';

export type TextFieldProps = {
  // …all existing props unchanged…
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onBlur?: TextInputProps['onBlur'];
  inputRef?: Ref<RNTextInputInstance>;
  /** Announced for the trailing icon button. Defaults to `label`. */
  trailingIconLabel?: string;
};
```

- Spread the new input props onto the inner `<TextInput>` (line 73) and pass `ref={inputRef}` — `TextInput.tsx:24` is already a `forwardRef`.
- Line 86: change the `IconButton`'s `accessibilityLabel={label}` to `accessibilityLabel={trailingIconLabel ?? label}`. Today a password reveal button would announce "PASSWORD", which is wrong.
- **Do not** widen the `style` prop or let `fontFamily`/`fontWeight` in — `eslint.config.js:64` bans them outright.

### 2 — Add the `eyeOff` icon

**File: `src/core/components/Icon.tsx`**

Add `| 'eyeOff'` to the `IconName` union (after `'eye'`, ~line 36) and `eyeOff: 'eye-off-outline',` to `ICON_MAP` (after line 67). `ICON_MAP` is typed `Record<IconName, MCIName>`, so both edits are required together or `tsc` fails. **Do not widen `IconName` to `string`** — the file's own comment (lines 12-14) explains why.

### 3 — `LanguageToggle`

**Create file: `src/core/components/LanguageToggle.tsx`**

Domain-free, and reused by the Profile screen later, so it belongs in `core/components/`, not in `features/auth/`. It wraps `SegmentedControl` and owns the restart notice.

```tsx
export function LanguageToggle() {
  const { t } = useTranslation();
  const [restartRequired, setRestartRequired] = useState(false);
  const current = currentLocale();

  async function handleChange(locale: Locale) {
    if (locale === current) return;
    setRestartRequired(await setLocale(locale));
  }

  // <SegmentedControl
  //   segments={[{ value: 'en', label: t('settings.languageEnglish') },
  //              { value: 'ar', label: t('settings.languageArabic') }]}
  //   value={current} onChange={(l) => void handleChange(l)} />
  // plus, when restartRequired:
  // <Text variant="caption" tone="muted" align="center">{t('settings.restartRequired')}</Text>
}
```

- Reuse the **existing** `settings.languageEnglish` / `settings.languageArabic` / `settings.restartRequired` keys (`src/core/lib/i18n/locales/en.json:37-39`). Do not add duplicates.
- Wrap in `<View style={{ alignSelf: 'center' }}>` so the control sizes to its content rather than the full page width; `SegmentedControl`'s segments are `flex: 1` (line 79).
- `setLocale` changes `i18n.language` immediately, so the labels re-render without a restart even when the direction cannot flip until relaunch.
- Export it from `src/core/components/index.ts` in the "Existing generic components" block.

### 4 — Brand mark asset

**Create file: `assets/brand/azm-mark.png`**

Export Figma node `51:4960` (the 64 × 63 vector inside `74:604 Brand`) at 3× via the Figma MCP `download_assets` tool into `assets/brand/`. `react-native-svg` is **not** installed and this story does not add it (CLAUDE.md dependency rule) — a raster export at 3× is sufficient for a 64 × 63 render.

Render it as:

```tsx
<Image
  source={require('../../../../assets/brand/azm-mark.png')}
  style={{ width: 64, height: 63 }}
  accessibilityRole="image"
  accessibilityLabel={t('common.appName')}
/>
```

The mark is brand blue and reads correctly against both light and dark `bgCanvas` values — do **not** tint it per scheme.

### 5 — Translations

**File: `src/core/lib/i18n/locales/en.json`** and **`src/core/lib/i18n/locales/ar.json`**

Add one `auth` block to each, keeping the existing key order and the two files structurally identical.

```json
"auth": {
  "tagline": "Customer support workspace for your team",
  "emailLabel": "Email",
  "emailPlaceholder": "you@company.com",
  "passwordLabel": "Password",
  "showPassword": "Show password",
  "hidePassword": "Hide password",
  "forgotPassword": "Forgot password?",
  "signIn": "Sign in",
  "helper": "Accounts are created by your administrator.",
  "errors": {
    "emailRequired": "Enter your email address.",
    "emailInvalid": "Enter a valid email address.",
    "passwordRequired": "Enter your password.",
    "invalidCredentials": "Incorrect email or password.",
    "deactivated": "This account has been deactivated. Contact your administrator.",
    "rateLimited": "Too many attempts. Try again in a moment.",
    "network": "Couldn't reach the server. Check your connection.",
    "unknown": "Sign-in failed. Try again."
  }
}
```

```json
"auth": {
  "tagline": "مساحة عمل دعم العملاء لفريقك",
  "emailLabel": "البريد الإلكتروني",
  "emailPlaceholder": "you@company.com",
  "passwordLabel": "كلمة المرور",
  "showPassword": "إظهار كلمة المرور",
  "hidePassword": "إخفاء كلمة المرور",
  "forgotPassword": "هل نسيت كلمة المرور؟",
  "signIn": "تسجيل الدخول",
  "helper": "يتم إنشاء الحسابات بواسطة المسؤول.",
  "errors": {
    "emailRequired": "أدخل بريدك الإلكتروني.",
    "emailInvalid": "أدخل بريدًا إلكترونيًا صالحًا.",
    "passwordRequired": "أدخل كلمة المرور.",
    "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "deactivated": "تم تعطيل هذا الحساب. تواصل مع المسؤول.",
    "rateLimited": "محاولات كثيرة. حاول مرة أخرى بعد قليل.",
    "network": "تعذّر الوصول إلى الخادم. تحقق من اتصالك.",
    "unknown": "تعذّر تسجيل الدخول. حاول مرة أخرى."
  }
}
```

`emailPlaceholder` stays Latin in both locales — it is an example address, not prose.

### 6 — `features/auth/types.ts`

**Create file: `src/features/auth/types.ts`**

```ts
import type { AuthSession } from '@supabase/supabase-js';

import type { Database } from '@/core/types/database';

export type UserRole = Database['public']['Enums']['user_role'];

/** The `profiles` row for the signed-in agent, camelCased at the boundary. */
export type AgentProfile = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  departmentId: string;
  branchId: string;
};

export type SignInInput = { email: string; password: string };

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

export type AuthState = {
  status: AuthStatus;
  session: AuthSession | null;
  profile: AgentProfile | null;
};
```

`AuthSession` and `AuthUser` **are** re-exported by `@supabase/supabase-js` (verified in its `dist/index.d.mts`). `AuthError` and `isAuthApiError` are **not** — they live in the transitive `@supabase/auth-js`. Do not import from it; task 7 duck-types the error instead, exactly as `core/utils/errors.ts:48-57` already reads `status`.

### 7 — `features/auth/api.ts`

**Create file: `src/features/auth/api.ts`**

The data boundary: it catches, maps to `AppError`, and throws. No React, no user-facing strings, no `t()`.

```ts
import { supabase } from '@/core/lib/supabase';
import { toAppError, type AppError } from '@/core/utils';

import type { AgentProfile, SignInInput } from './types';

/** GoTrue error codes → i18n keys. Anything unlisted falls through to `unknown`. */
const AUTH_MESSAGE_KEYS: Record<string, string> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.invalidCredentials',
  validation_failed: 'auth.errors.invalidCredentials',
  user_not_found: 'auth.errors.invalidCredentials',
  user_banned: 'auth.errors.deactivated',
  over_request_rate_limit: 'auth.errors.rateLimited',
};

export function toAuthError(error: unknown): AppError {
  const base = toAppError(error);
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined;

  const mapped = code ? AUTH_MESSAGE_KEYS[code] : undefined;
  if (mapped) return { ...base, kind: 'auth', messageKey: mapped };
  if (base.kind === 'network') return { ...base, messageKey: 'auth.errors.network' };
  return { ...base, messageKey: 'auth.errors.unknown' };
}

const DEACTIVATED: AppError = {
  kind: 'auth',
  message: 'Profile is inactive or not visible to this user',
  messageKey: 'auth.errors.deactivated',
};

export async function fetchAgentProfile(userId: string): Promise<AgentProfile | null> { /* … */ }

export async function signIn(input: SignInInput): Promise<AgentProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });
  if (error) throw toAuthError(error);

  const userId = data.user?.id;
  if (!userId) throw toAuthError(new Error('Sign-in returned no user'));

  const profile = await fetchAgentProfile(userId);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    throw DEACTIVATED;
  }
  return profile;
}

export async function getCurrentSession() { /* supabase.auth.getSession() */ }
export async function signOutAgent(): Promise<void> { /* supabase.auth.signOut() */ }
```

- `fetchAgentProfile` selects `id, full_name, email, role, is_active, department_id, branch_id` from `profiles` with `.eq('id', userId).maybeSingle()`, throws `toAppError(error)` on a PostgREST error, returns `null` when there is no row, and camelCases the row on the way out.
- **`.maybeSingle()`, not `.single()`** — `.single()` errors with `PGRST116` on zero rows, and "no row" is a state this flow must distinguish, not an exception.
- **Trim the email, never the password.** Leading and trailing whitespace in a password is significant.
- Do **not** log `input.password`, the access token, or the refresh token anywhere.

### 8 — `features/auth/session-context.tsx`

**Create file: `src/features/auth/session-context.tsx`**

Per CLAUDE.md, the auth session lives in React Context — not TanStack Query, not a store. This file is an addition to the standard feature anatomy; task 14 records it in CLAUDE.md.

```tsx
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
    profile: null,
  });

  useEffect(() => {
    let cancelled = false;

    // The listener is the ongoing source of truth; this one-shot read only
    // resolves the very first frame and must never clobber a newer value.
    void getCurrentSession()
      .then((session) => {
        if (cancelled) return;
        setState((prev) =>
          prev.status === 'loading'
            ? { status: session ? 'signedIn' : 'signedOut', session, profile: null }
            : prev,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) =>
          prev.status === 'loading'
            ? { status: 'signedOut', session: null, profile: null }
            : prev,
        );
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        status: session ? 'signedIn' : 'signedOut',
        session,
        profile: session ? prev.profile : null,
      }));
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  // …
}
```

- **Never `await` another Supabase call inside the `onAuthStateChange` callback** — `@supabase/auth-js`'s `GoTrueClient.d.ts:102` documents the deadlock. Profile loading happens in the mutation (task 9), not in the listener.
- The context value is `AuthState & { setProfile(profile: AgentProfile | null): void; signOut(): Promise<void> }`. Memoise it with `useMemo` so the provider does not re-render the whole tree on every parent render.
- `signOut()` calls `signOutAgent()` then `queryClient.clear()` (`@/core/lib/query-client`), so no previous agent's cached rows survive a re-login on a shared device. The listener flips `status` to `signedOut`, which is what actually navigates.
- Export a `useAuth()` hook that throws a developer-facing `Error` when used outside the provider.

### 9 — `features/auth/hooks.ts`

**Create file: `src/features/auth/hooks.ts`**

```ts
export function useSignIn() {
  const { setProfile } = useAuth();
  return useMutation<AgentProfile, AppError, SignInInput>({
    mutationFn: signIn,
    onSuccess: (profile) => setProfile(profile),
  });
}
```

Mutations already default to `retry: false` (`src/core/lib/query-client.ts:22-24`) — a retried sign-in would burn GoTrue's rate limit. **Do not** override it.

**No `router.replace` anywhere.** `signInWithPassword` triggers a `SIGNED_IN` event, the context flips to `signedIn`, and the guard in task 13 performs the navigation. An imperative push on top of the guard causes a double navigation.

### 10 — `features/auth/screens/LoginScreen.tsx`

**Create file: `src/features/auth/screens/LoginScreen.tsx`**

Structure, outside-in:

```
<SafeAreaView flex:1 bg=colors.bgCanvas>            // react-native-safe-area-context
  <ScrollView
    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center',
                             paddingHorizontal: spacing.xl }}
    keyboardShouldPersistTaps="handled"
    automaticallyAdjustKeyboardInsets>
    <Brand />                                        // mark + AZM + tagline
    <Form />                                         // fields + forgot + button + helper
  </ScrollView>
  <View style={{ paddingBottom: spacing.xl, alignItems: 'center' }}>
    <LanguageToggle />
  </View>
</SafeAreaView>
```

Form state is **React Hook Form** — `useForm<SignInInput>({ defaultValues: { email: '', password: '' }, mode: 'onSubmit' })`. `TextField` is not RHF-aware, so wrap each field in `<Controller>`:

```tsx
<Controller
  control={control}
  name="email"
  rules={{
    required: t('auth.errors.emailRequired'),
    pattern: { value: EMAIL_PATTERN, message: t('auth.errors.emailInvalid') },
  }}
  render={({ field: { value, onChange, onBlur } }) => (
    <TextField
      label={t('auth.emailLabel')}
      placeholder={t('auth.emailPlaceholder')}
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      error={errors.email?.message}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
      textContentType="emailAddress"
      returnKeyType="next"
      onSubmitEditing={() => passwordRef.current?.focus()}
    />
  )}
/>
```

- `const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;` at **module scope**. Deliberately permissive — the server is the authority on whether an address exists.
- `const passwordRef = useRef<RNTextInputInstance>(null);` at component scope, passed as `inputRef` to the password `TextField`. **Never create a ref inside `render`** (CLAUDE.md build-method discipline).
- Password field: `secureTextEntry={!revealed}`, `autoCapitalize="none"`, `autoComplete="password"`, `textContentType="password"`, `returnKeyType="go"`, `onSubmitEditing={handleSubmit(onSubmit)}`, `trailingIcon={revealed ? 'eyeOff' : 'eye'}`, `onTrailingIconPress={() => setRevealed((v) => !v)}`, `trailingIconLabel={t(revealed ? 'auth.hidePassword' : 'auth.showPassword')}`. `revealed` is local `useState` — it is UI state, not business state. No placeholder: a masked field shows dots already.
- Sign in: `<Button variant="primary" fullWidth label={t('auth.signIn')} loading={isPending} disabled={isPending} onPress={handleSubmit(onSubmit)} />`. `Button` already renders an `ActivityIndicator` and sets `accessibilityState.busy` while loading (lines 90, 106).
- Forgot password: `<Button variant="link" label={t('auth.forgotPassword')} onPress={() => router.push('/(auth)/forgot-password')} />` inside `<View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>`. `flex-end` is a flexbox value, not a physical prop — it mirrors correctly under RTL and is not caught by the `no-restricted-syntax` ban in `eslint.config.js:72-75`.
- **Form-level error**, rendered between the button and the helper line:

```tsx
{error ? (
  <Text variant="caption" tone="danger" align="center" accessibilityLiveRegion="polite">
    {t(error.messageKey)}
  </Text>
) : null}
```

  `error` is the mutation's `AppError`; `error.messageKey` is already a full i18n key (task 7). **Never render `error.message`** — it is developer-facing by contract (`core/utils/errors.ts:10-11`).
- `onSubmit` is `(values) => mutate(values)`. Nothing else — no navigation, no analytics.
- Layout uses `gap` on the wrapping `View`s, never `marginLeft`/`marginRight`. Physical props are a lint error.
- There is **no** "Create account" or "Sign up" element anywhere in this file. That is AC 4; the helper line carries the explanation instead.

### 11 — `features/auth/index.ts`

**Create file: `src/features/auth/index.ts`**

The feature's only entry point (CLAUDE.md hard rule 4). Export exactly what other layers need and nothing more:

```ts
export { LoginScreen } from './screens/LoginScreen';
export { AuthProvider, useAuth } from './session-context';
export type { AgentProfile, AuthStatus, AuthState, UserRole } from './types';
```

`api.ts` and `hooks.ts` stay internal. `eslint.config.js:43-49` already errors on `@/features/auth/api`-style deep imports.

### 12 — Routes

Route files import a screen and render it. Nothing else (CLAUDE.md hard rule 1).

**Create file: `src/app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Create file: `src/app/(auth)/login.tsx`**

```tsx
import { LoginScreen } from '@/features/auth';

export default function Login() {
  return <LoginScreen />;
}
```

**Create file: `src/app/(auth)/forgot-password.tsx`** — a placeholder so the design's link is not dead. US-003 replaces the body; keep it to the existing `placeholder.screenBody` string and do **not** build the reset flow here.

**File: `src/app/index.tsx`** — leave the `<Text>AZM</Text>` placeholder as-is. It is the authenticated root this story routes to; the Home story replaces it. `app.json:34` sets `typedRoutes: true`, so the new routes become valid `href` values only after Metro regenerates `.expo/types` — restart the dev server if `/(auth)/forgot-password` fails to typecheck.

### 13 — Root layout: provider, guard, splash

**File: `src/app/_layout.tsx`**

Three changes to the existing 48-line file:

1. Wrap the tree in `<AuthProvider>` **inside** `<QueryClientProvider>` — `signOut()` calls `queryClient.clear()`, so the query client must already be mounted above it.
2. Replace `<Slot />` with an inner `RootNavigator` that reads `useAuth()` and renders guarded screens. This is the pattern in Expo Router's own authentication guide for SDK 54+, verified against the installed `expo-router@57.0.17` (`build/views/Protected.d.ts` — `ProtectedProps = { guard: boolean; children?: ReactNode }`):

```tsx
function RootNavigator() {
  const { status } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
```

   When a guard flips false the router redirects to the anchor route or the first available screen — which is exactly the other branch. Keep `<OfflineBanner />` as a sibling of the navigator, as it is today (line 42).
3. Move the splash hide so it waits for **both** bootstrap and the session read: `hideSplash()` fires only when `result !== null && status !== 'loading'`. Without this, an already-signed-in agent sees a flash of the login screen on every cold start.

Keep `bootstrap()` untouched: locale, direction, theme and fonts only. Folding the session read into it would move an authenticated network call into the pre-paint path.

### 14 — Update `CLAUDE.md`

**File: `CLAUDE.md`**

CLAUDE.md instructs that when reality and the file diverge, the file is fixed in the same change. This story makes four of its statements false:

- "**What does not exist yet is any `src/features/` folder**", and the `auth` entry in the "none built yet" list — `auth` now exists.
- The route tree now has an `(auth)` group and a guard — document it. `src/app/index.tsx` is still a placeholder, so that sentence stays.
- The feature-anatomy block — add `session-context.tsx` as a sanctioned member for features that own React Context state, with `auth` as the example.
- The "Target architecture" `core/components/` list — add `LanguageToggle`.

Also record the routing convention in one sentence: *authenticated routes live at the router root; unauthenticated ones live in `src/app/(auth)/`; the guard is `Stack.Protected` in `src/app/_layout.tsx`, driven by `useAuth().status`.*

**No backend changes required.** Every endpoint this story calls — `/auth/v1/token`, `/auth/v1/logout`, `GET /rest/v1/profiles` — is marked ✅ in `docs/phase1_api_reference.md`.

---

## Edge Cases & Failure Modes

- **Wrong password / unknown email** — GoTrue returns `400` with `code: "invalid_credentials"`; both map to the same message (`auth.errors.invalidCredentials`, task 7). Deliberate: distinct messages would let an attacker enumerate accounts — the same reasoning `docs/phase1_api_reference.md:110` gives for password reset.
- **Deactivated agent** — `signInWithPassword` **succeeds** (GoTrue knows nothing about `profiles.is_active`), so the session must be torn down explicitly. `api.ts` `signIn` signs out and throws `DEACTIVATED`. Verify afterwards that `supabase.auth.getSession()` returns `null`.
- **Profile row invisible to RLS** — a policy that filters out inactive agents returns zero rows rather than `is_active: false`. `signIn` treats a `null` profile and `isActive === false` identically. See **Open questions**, flag 1.
- **Offline / DNS failure** — `fetch` throws a `TypeError` with no status; `toAppError` (`errors.ts:69-71`) classifies it `network` and `toAuthError` maps it to `auth.errors.network`. `OfflineBanner` shows independently.
- **Sign-in succeeds but the profile fetch fails with a 5xx** — `fetchAgentProfile` throws a `server` `AppError` and the session is left **live**. The guard then navigates to the authenticated root with `profile: null`. Acceptable for this story (the profile is re-fetchable), but downstream code must not assume `profile` is non-null.
- **Rate limiting** — repeated failures return `429` / `over_request_rate_limit` → `auth.errors.rateLimited`. Mutation retry is off, so the app never amplifies this.
- **Double submit** — the Sign in button is `disabled={isPending}`, and `onSubmitEditing` on the password field calls the same guarded `handleSubmit`.
- **Whitespace-padded email** — trimmed in `api.ts`. The password is never trimmed.
- **Arabic cold start** — `bootstrap()` applies direction before first paint. The login screen must use `gap` and logical props only; any `marginLeft` fails lint.
- **Language switched at the login screen** — `setLocale` returns `true` when the direction needs a restart, and `LanguageToggle` shows `settings.restartRequired`. Labels re-render immediately; layout does not flip until relaunch. This is existing, documented RN behaviour (`i18n/index.ts:46-53`), not a bug to fix here.
- **Small viewport with the keyboard open** — the centred content sits in a `ScrollView` with `flexGrow: 1`, so it scrolls instead of clipping. Verify at 320 pt width.
- **Fast unmount during sign-in** — the `cancelled` flag in `session-context.tsx` guards the initial `getSession()`, and the `onAuthStateChange` subscription is unsubscribed in the effect cleanup.

---

## Test Plan

**There is no test runner in this repo** — no Jest, no `jest-expo`, no test files, and `package.json:43-53` has no `test` script. Installing one is a separate story and is **not** part of this one. The plan therefore splits into what is runnable today and what to write the moment a runner lands.

### Runnable today — manual matrix

Run `npm start`, press `a`/`i`, and walk every row. Use the accounts in `docs/phase1_api_reference.md:73-80`.

| # | Setup | Action | Expected |
|---|---|---|---|
| 1 | Signed out | Submit with both fields empty | Two field errors; **no** network request (check the Metro network log) |
| 2 | Signed out | Email `omar`, any password | "Enter a valid email address."; no request |
| 3 | Signed out | Valid email, wrong password | "Incorrect email or password."; still on login |
| 4 | Signed out | `omar@azm.test` + correct password | Spinner in the button, then the authenticated root |
| 5 | Signed in | Kill and relaunch | Lands on the authenticated root, **no** login flash |
| 6 | Signed in | Call `signOut()` | Back at login; re-login works |
| 7 | Signed out | Tap the eye icon | Password reveals; VoiceOver/TalkBack announces "Hide password" |
| 8 | Signed out | Airplane mode, submit valid credentials | "Couldn't reach the server…"; `OfflineBanner` visible |
| 9 | Signed out | Switch to العربية | Labels turn Arabic; restart notice appears if the direction must flip |
| 10 | Signed out | Tap "Forgot password?" | Placeholder route opens and can be dismissed |
| 11 | Signed out | Toggle system dark mode | Every element legible; the brand mark still reads |
| 12 | Signed out, deactivated account | Submit correct credentials | "This account has been deactivated…"; `getSession()` returns `null` |

Row 12 needs an agent row with `is_active = false` — create one in Supabase before starting.

### To write when a runner exists

1. **Unit — `src/features/auth/api.test.ts`** · `toAuthError`: one case per `AUTH_MESSAGE_KEYS` entry, one for a `network` `TypeError`, one for an unmapped code falling through to `auth.errors.unknown`. Pure function, no mocks.
2. **Unit — `src/features/auth/api.test.ts`** · `signIn` with a mocked `supabase`: an inactive profile calls `supabase.auth.signOut()` **and** throws with `messageKey === 'auth.errors.deactivated'`; a `null` profile does the same.
3. **Unit — `src/features/auth/api.test.ts`** · `signIn` trims the email and passes the password through byte-for-byte.
4. **Unit — `src/features/auth/session-context.test.tsx`** · a `SIGNED_OUT` event clears `profile`; a late-resolving `getSession()` does not overwrite a `signedIn` state already set by the listener.
5. **Unit — `src/core/lib/i18n/locales.test.ts`** · `en.json` and `ar.json` have identical key sets. Cheap, and it catches the most likely regression in every future story.

Flag adding `jest-expo` + `@testing-library/react-native` as a follow-up story on the auth epic; do not add them here.

---

## Verification Steps

1. **Typecheck:** `npm run typecheck` in the repo root — no errors. Restart Metro first if `typedRoutes` has not regenerated `.expo/types`.
2. **Lint:** `npm run lint` — no errors. This is the real gate for hex literals, `fontWeight`/`fontFamily`, physical layout props, the `core` → `features` import ban, and deep feature imports.
3. **Frontend runs:** `npm start`, then `a` (Android) and `i` (iOS). Walk manual matrix rows 1-12 above.
4. **Regression:** with `bootstrap()` untouched, confirm a cold start in Arabic still paints RTL on the first frame — no LTR flash on the login screen.
5. **Regression:** Story 01's component gallery still renders. `TextField` and `Icon` changed; every existing call site must be unaffected.

---

## Done Criteria

- [ ] Given valid credentials, when I submit, then I am authenticated and routed to the authenticated root (BRD AC 1)
- [ ] Given invalid credentials, when I submit, then a clear error appears and `supabase.auth.getSession()` returns `null` (BRD AC 2)
- [ ] Given a deactivated account, when I attempt login, then access is denied and no session survives (BRD AC 3)
- [ ] Given the login screen, when displayed, then no self-registration affordance is present (BRD AC 4)
- [ ] Given an empty required field, when I submit, then validation blocks the request before any network call (BRD AC 5)
- [ ] The screen matches Figma `7:4614` in both light and dark, in Arabic and English, using only existing tokens
- [ ] `npm run typecheck` and `npm run lint` both pass
- [ ] `src/features/auth/index.ts` is the only import surface; no deep imports of `api.ts`/`hooks.ts` anywhere
- [ ] No password, access token, or refresh token is written to a log
- [ ] `CLAUDE.md` updated per task 14
- [ ] `00-overview.md` updated with this story

---

## Open questions — raise before or during implementation

1. **`is_active` is enforced in the client, not in RLS.** BRD US-004's last criterion is "any permission rule … is enforced in RLS and not in client code", but `signIn` checks `profiles.is_active` in TypeScript and then signs out. A deactivated agent holding a valid refresh token can still call the REST API directly. The durable fix is a policy or an auth hook that rejects inactive users at the database. Confirm with the backend owner whether such a policy already exists; if it does, `fetchAgentProfile` returning `null` is the real signal and the `isActive` check becomes belt-and-braces.
2. **The design has no error state.** Figma `7:4614` shows only the resting screen — no invalid-credentials treatment, and no field-error styling beyond what `TextField` already does. This plan puts a centred `caption`/`danger` line between the button and the helper text. Confirm with design, or accept it as the pattern for every later form.
3. **Language toggle radius.** Figma draws the toggle as a pill; `SegmentedControl` uses `radius.md` (12) outside and `radius.sm` (8) inside. Either the toggle is a `radius.full` variant of `SegmentedControl`, or Figma's toggle is a different component. Same class of question as Story 01 §15 — do not silently pick one.
4. **`TextField`'s uppercase label under Arabic.** `TextField.tsx:106` applies `textTransform: 'uppercase'` plus `tracking.wide` to the label. Uppercase is a no-op for Arabic but the letter-spacing is not, and Story 01 §15 already flagged the same treatment on `SectionHeader`. Inherited here, not resolved here.

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 03.**
