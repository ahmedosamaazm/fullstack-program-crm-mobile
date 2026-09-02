# Auth — Reset Password — design audit

**Figma:** `7:4687` ("Auth - Reset Password") · **Code:** `src/app/(auth)/forgot-password.tsx`
**Verdict:** blocked

## Summary

The screen is not implemented. `src/app/(auth)/forgot-password.tsx` is a 21-line placeholder that
centres the generic `placeholder.screenBody` string on a `bgCanvas` background — none of the five
elements the Figma frame specifies (back button, "Reset password" title, explanatory paragraph,
EMAIL field, "Send reset link" button) exist in code. This is **deliberate and documented**:
`.squad/plans/auth/02-story-agent-login-SCRUM-17.md:518` explicitly creates this route as a
placeholder so the login screen's "Forgot password?" link is not dead, and defers the real flow to
US-003, which has **no story and no plan file** in `.squad/plans/00-index.md` or
`.squad/plans/auth/00-overview.md`. So there is no token drift or component drift to report — there
is nothing to compare. The single most important thing is not a fix but a scheduling decision:
**US-003 needs a story before this frame can be audited for fidelity at all.** The one genuine
code-side defect that exists today is the architecture violation in the route file (finding 2).

Because the audit cannot proceed past "not built", the per-axis checklist below is recorded as a
**spec for whoever implements US-003** rather than as a defect list: the exact Figma-bound tokens
are captured so the implementation has them, and two open questions the frame raises are flagged.

## Findings

### 1. The whole screen is unimplemented — `intentional`
- **Axis:** structure & order
- **Figma:** `7:4687` specifies, top to bottom: a circular `BackButton` (`7:4712`, 34×34 at
  `spacing.lg` inset, `corner radius/44`, `arrowBack` glyph), a "Reset password" title
  (`7:4717`, 36px line box), a one-line paragraph "Enter your account email and we'll send a reset
  link." (`7:4720`), an `Email` field instance (`77:651`, label `EMAIL` + placeholder
  `you@company.com`, `radius.md`, `colors.surface`, `colors.borderDefault` at `stroke weight/1`),
  and a full-width primary `SendResetLink` button (`77:655`, 56px tall, `colors.primary` /
  `colors.onPrimary`).
- **Code:** `src/app/(auth)/forgot-password.tsx:12-20` — a `SafeAreaView` wrapping one centred
  `<Text variant="body" tone="muted">{t('placeholder.screenBody')}</Text>`. No back button, no
  title, no paragraph, no field, no button. `src/features/auth/index.ts:1` exports only
  `LoginScreen`; there is no `ResetPasswordScreen` in `src/features/auth/screens/`.
- **Fix:** None — this is the state story 02 intended
  (`.squad/plans/auth/02-story-agent-login-SCRUM-17.md:518`, "US-003 replaces the body; keep it to
  the existing `placeholder.screenBody` string and do **not** build the reset flow here", and
  `:26`, which names US-003 as out of scope). Write the US-003 story; do not treat this as a bug.

### 2. Route file contains the screen inline instead of importing one from the feature barrel — `major`
- **Axis:** component identity (hard rule 1)
- **Figma:** n/a — architecture rule, not a design rule.
- **Code:** `src/app/(auth)/forgot-password.tsx:1-21` — the route file imports `View`,
  `SafeAreaView`, `useTranslation`, `Text` and `useTheme`, and does its own layout
  (`flex: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.xl` at line 14). Hard rule
  1 (CLAUDE.md, AGENTS.md) says a route file imports a screen from a feature barrel and renders it —
  which is exactly what the sibling `src/app/(auth)/login.tsx:1-5` does. This rule is **not**
  eslint-enforced (no route-layout rule in `eslint.config.js`), so nothing caught it.
- **Fix:** When US-003 lands, move the body into
  `src/features/auth/screens/ResetPasswordScreen.tsx`, export it from `src/features/auth/index.ts`,
  and reduce the route file to `import { ResetPasswordScreen } from '@/features/auth';` plus a
  render — matching `login.tsx`.

### 3. `paddingHorizontal` is a physical-ish shorthand where the codebase uses logical props — `minor`
- **Axis:** RTL
- **Figma:** Frame is `spacing.lg` (16) inset on both sides; the app's page gutter convention is
  `spacing.xl`.
- **Code:** `src/app/(auth)/forgot-password.tsx:14` — `paddingHorizontal: theme.spacing.xl`.
  `paddingHorizontal` is symmetric so it mirrors correctly and `eslint.config.js` does not ban it;
  it is not a correctness bug. Noted only because the value (`xl` = 24) does not match the frame's
  `spacing.lg` (16) horizontal inset — irrelevant while the body is a placeholder, but the real
  screen must use the Figma value.
- **Fix:** Use `spacing.lg` for the reset screen's horizontal gutter when US-003 builds it, and keep
  to `paddingStart`/`paddingEnd` if the padding ever becomes asymmetric.

### 4. The frame binds two off-scale type values that the token layer has no step for — `flag`
- **Axis:** token fidelity
- **Figma:** `get_variable_defs` on `7:4687` returns `font size/13` = 13 and `line height/19_5` =
  19.5 (the `EMAIL` label / paragraph), plus `fontFamily.sans` = "IBM Plex Sans" (not "IBM Plex Sans
  Arabic") and `corner radius/44` = 44.
- **Code:** `src/core/lib/theme/typography.ts:5-22` — the size scale is 10/12/14/16/18/22/28 and the
  line-height scale 16/18/20/24/26/28/34. There is no 13 and no 19.5; `radius` in
  `src/core/lib/theme/layout.ts:14-22` tops out at `xl` = 20 then `full` = 999, with no 44.
  `src/core/lib/theme/typography.ts:49-54` uses the Arabic family exclusively.
- **Fix:** Do not silently pick a nearest step. These are the same class of legacy/off-scale binding
  §15 flag 7 raises for `FilterChip` — ask design whether `13/19.5` should snap to `fontSize.sm` /
  `lineHeight.sm` (14/20) and whether the back button is `radius.full`, before US-003 codes a value.

### 5. Back button glyph is a physical `ArrowLeft` (§15 flag 1) — `flag`
- **Axis:** RTL
- **Figma:** `7:4713` is the arrow glyph inside `BackButton` `7:4712`, drawn pointing left.
- **Code:** `src/core/components/Icon.tsx:27` names it `arrowBack` (logical), and `:111` puts it in
  `DEFAULT_MIRRORED`, so it auto-flips under RTL — the app already resolves this correctly.
- **Fix:** None in code. This is §15 flag 1 ("`ArrowLeft` is a physical name … request the rename in
  Figma"), still open. Recorded, not resolved.

### 6. No error, loading, or success state is designed — `flag`
- **Axis:** states
- **Figma:** `7:4687` shows only the resting state. There is no sibling frame for a validation error
  on EMAIL, no loading state on `SendResetLink`, and — most significantly — **no confirmation state**
  ("we've sent a link to …"), which every reset flow needs as its terminal screen.
- **Code:** n/a — nothing implemented. Note that `src/core/components/TextField.tsx` and
  `Button.tsx` already carry `error`/`loading` props, added by the design-system pass precisely
  because Figma omits them.
- **Fix:** §15 flag 6 already asks design for the missing TextField/Button states; this frame adds a
  second, larger request — the post-submit confirmation screen. Both are design decisions, not code
  fixes. Also note the security constraint recorded at
  `.squad/plans/auth/02-story-agent-login-SCRUM-17.md:572`: the reset response must not let an
  attacker enumerate accounts, so the confirmation copy must be identical for a known and an unknown
  email.

### 7. The `(auth)` stack hides the header, so the back affordance must be in-screen — `flag`
- **Axis:** structure & order
- **Figma:** `7:4712` draws the back button as part of the screen body, which is consistent with a
  headerless stack.
- **Code:** `src/app/(auth)/_layout.tsx:4` — `<Stack screenOptions={{ headerShown: false }} />`.
  Correct as-is, and it matches the frame. Called out only so the US-003 implementer builds the back
  button as an `IconButton` inside the screen (`src/core/components/IconButton.tsx:7`, `variant="subtle"`
  gives the frame's tinted circle) rather than re-enabling the native header for this one route.
- **Fix:** No change to `_layout.tsx`.

## Verified correct

- `src/app/(auth)/_layout.tsx:4` — headerless auth stack, consistent with the frame drawing its own
  back button. No changes needed for US-003.
- The placeholder itself is token-clean: `theme.colors.bgCanvas` (`:13`), `theme.spacing.xl` (`:14`),
  and `<Text variant="body" tone="muted">` (`:15`) all resolve through the semantic layer. No hex
  literal, no `fontWeight`/`fontFamily` style key, no `Text` imported from `react-native`, no
  physical `left`/`right`/`marginLeft`. Dark theme resolves correctly because `bgCanvas` and the
  `muted` tone are read through `useTheme()`.
- Every primitive the real screen will need already exists and needs no new component:
  `src/core/components/IconButton.tsx` (back button), `TextField.tsx` (EMAIL, with an `error` prop),
  `Button.tsx` (full-width primary, `HEIGHT = 56` matches the frame's 56px `SendResetLink`),
  `Text.tsx` (title + paragraph). Nothing here should be hand-rolled.
- `src/core/components/Icon.tsx:69,111` — `arrowBack` maps to `arrow-left` and is RTL-mirrored by
  default, so the frame's back arrow is already handled.
- The Figma-bound colours all exist as semantic tokens with dark counterparts:
  `colors.textMuted` → `src/core/lib/theme/colors.ts:34` (light) / `:88` (dark),
  `colors.borderDefault` → `:27` / `:81`. `colors.primary`, `colors.onPrimary` and `colors.surface`
  likewise. No new colour token is required.
- `spacing.sm` (8), `spacing.lg` (16), `spacing.xl` (24) and `radius.md` (12) — all bound by the
  frame — map 1:1 onto `src/core/lib/theme/layout.ts:2-22`.
- `src/features/auth/index.ts` is barrel-clean; adding `ResetPasswordScreen` to it is the only
  export change US-003 needs.

## Needs a visual check

Nothing runtime-dependent to check — there is no implementation to render. Once US-003 is built,
the items worth eyes-on are the Arabic rendering of the title and paragraph at the frame's
line-height (the frame's `fontFamily.sans` is the Latin "IBM Plex Sans", not the Arabic family the
app actually loads), and the back button's mirrored position under RTL.
