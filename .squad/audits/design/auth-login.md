# Auth — Login — design audit

**Figma:** `7:4614` (`Auth - Login`, file `mdfP8RPdkUsKcJb0wFdkME`) · **Code:** `src/features/auth/screens/LoginScreen.tsx`
**Verdict:** major drift

## Summary

Structurally the screen is a close, token-clean reproduction of the frame: every vertical gap
(16 / 4 / 32 / 16 / 8 / 16 / 16), the 24 page padding, the 74-high field block, the 56-high
full-width primary button and the end-aligned link all land exactly on the tokens Figma bound.
The screen also uses the real `core/components` primitives throughout — no re-implemented
button, field or row anywhere — so axis 2 is essentially clean at the screen level. The single
most important defect is that the **footer `LanguageToggle` is commented out**
(`LoginScreen.tsx:145-147`): the Figma frame has it, the story plan's design spec and structure
sketch both require it, and it is the only way to reach Arabic before signing in. Secondary
issues are all inside `TextField` — a 12 instead of 16 horizontal field inset, and a 24 instead
of 32 reveal-button target — plus two one-step typographic drifts on the brand block.

## Findings

### 1. Footer `LanguageToggle` is commented out — `blocker`
- **Axis:** structure & order
- **Figma:** `7:4679` `Footer`, 66 high, containing instance `74:632` `LanguageToggle`
  (150 × 42, horizontally centred). Visible in the frame render as the
  `English` / `العربية` segmented control.
- **Code:** `src/features/auth/screens/LoginScreen.tsx:145-147` — the entire footer `View` and
  its `<LanguageToggle />` are inside a JSX comment. The screen renders no footer at all.
- **Fix:** Uncomment the footer block (it already matches the plan's
  `paddingBottom: spacing.xl` + `alignItems: 'center'`); if it was disabled for a reason, record
  that reason in the story plan instead of leaving dead JSX.

### 2. `TextField` horizontal inset is `spacing.md` (12) where Figma binds `spacing.lg` (16) — `major`
- **Axis:** token fidelity
- **Figma:** field node `I74:610;72:606` — `px-[var(--spacing.lg,16px)] py-[var(--spacing.sm,8px)]`,
  `h-[48px]`, `radius.md`, `colors.surface` fill, `colors.borderDefault` 1px stroke.
- **Code:** `src/core/components/TextField.tsx:84` — `paddingHorizontal: theme.spacing.md`.
  Height (48, line 82), radius, fill and border colour are all correct; only the inset is one
  scale step short, so the email placeholder and the password dots sit 4px closer to the edge
  than designed.
- **Fix:** Change `TextField.tsx:84` to `paddingHorizontal: theme.spacing.lg`. Note this is a
  core-component fix and will move every field in the app — worth confirming against the other
  screens' audits before landing.

### 3. Password-reveal button is a 24 target where Figma specifies the 32 `Button/Icon` — `minor`
- **Axis:** component identity
- **Figma:** the trailing slot of `I74:615;72:610` is a `Button` instance with
  `type="Icon"` — `size-[32px]`, `radius.full`, containing a 20 × 20 `Icon`. The component
  description for `Button` (`71:615`) confirms "Icon is a 32x32 icon-only affordance".
- **Code:** `src/core/components/TextField.tsx:117-123` renders `IconButton … size={24}`.
  The glyph itself is right (`IconButton.tsx:52` renders `Icon size={20}`) and `hitSlop`
  (`IconButton.tsx:41`, `spacing.xs`) brings the effective target back to 32, but the pressed
  background circle is 24, not 32.
- **Fix:** Pass `size={32}` from `TextField`'s trailing-icon branch (or route it through
  `Button variant="icon"`, which already resolves to 32) — but see finding 8 first, this
  touches §15 flag 5.

### 4. Tagline uses `textMuted` where Figma bound `colors.textSecondary` — `minor`
- **Axis:** token fidelity
- **Figma:** `74:607` `Tagline` — `text-[color:var(--colors.textSecondary,#44474f)]`,
  `fontSize.sm` / `lineHeight.sm`. (`#44474f` = `primitives.neutral700`.)
- **Code:** `src/features/auth/screens/LoginScreen.tsx:56` — `tone="muted"`, which
  `Text.tsx:32` maps to `textMuted` → `primitives.neutral550` (`#6b6e76`, `colors.ts:34`).
  One step lighter than designed, in both palettes.
- **Fix:** `tone="secondary"` on line 56. The story plan's design-spec table (line 61) records
  "muted" too, so fix the plan row in the same change rather than treating the plan as authority.

### 5. Wordmark renders `bold` where Figma specifies SemiBold — `minor`
- **Axis:** token fidelity
- **Figma:** `74:606` `Heading` — `font-semibold`, `IBM_Plex_Sans:SemiBold`, 28/34,
  `tracking.tight`.
- **Code:** `src/features/auth/screens/LoginScreen.tsx:53` — `weight="bold"`, which resolves to
  `IBMPlexSansArabic_700Bold` (`typography.ts:50`). Size/leading are correct (`display` =
  28/34). The story plan (line 59) prescribes `weight="bold"`, so this is a plan-level drift,
  not a coding slip.
- **Fix:** `weight="semibold"` on line 53, and correct the plan's design-spec row.

### 6. `tracking.tight` on the wordmark is never applied — `minor`
- **Axis:** token fidelity
- **Figma:** `74:606` — `tracking-[var(--tracking.tight,-0.3px)]` on the 28/34 display text.
- **Code:** `src/core/lib/theme/typography.ts:104-118` — `resolveTextStyle` emits only
  `fontSize`, `lineHeight` and the font face; it never reads the `tracking` scale
  (`typography.ts:25-29`), and `LoginScreen.tsx:53` adds no `letterSpacing` override.
  `TextField`'s label is the only place in this screen that applies tracking at all
  (`TextField.tsx:73`, `tracking.wide` — correct per `I74:610;72:605`).
- **Fix:** Either add `style={{ letterSpacing: theme.tracking.tight }}` at
  `LoginScreen.tsx:53`, or (better, since `display` always carries it) fold tracking into the
  `typography` variant map so every `display` gets it.

### 7. `automaticallyAdjustKeyboardInsets` dropped from the `ScrollView` — `minor`
- **Axis:** states
- **Figma:** n/a — this comes from the story plan's structure sketch
  (`.squad/plans/auth/02-story-agent-login-SCRUM-17.md:414-417`), which lists the prop.
- **Code:** `src/features/auth/screens/LoginScreen.tsx:37-44` sets `flexGrow`,
  `justifyContent`, `paddingHorizontal` and `keyboardShouldPersistTaps` but not
  `automaticallyAdjustKeyboardInsets`. With the content vertically centred, an iOS keyboard over
  the password field may occlude the Sign in button.
- **Fix:** Add `automaticallyAdjustKeyboardInsets` to the `ScrollView` on line 37, then verify
  on an iOS device (see **Needs a visual check**).

### 8. `Button` variant `icon` (32) vs standalone `IconButton` (36) — `flag`
- **Axis:** open design flags (§15 flag 5)
- The password reveal is the first real consumer of the 32-vs-36 overlap. `Button.tsx:56-66`
  bridges the two by passing `size={32}` for `icon`; `TextField.tsx:120` bypasses both with 24.
  Finding 3 cannot be resolved cleanly until design says whether the two components collapse.

### 9. Figma has no error / disabled / loading variants for this screen — `flag`
- **Axis:** states (§15 flag 6)
- Frame `7:4614` shows only the resting state. The implementation supplies all three and they
  are internally consistent, so there is nothing to diff against — but nothing to validate
  against either:
  - **Field error** — `TextField.tsx:86` swaps the border to `statusDanger` and
    `TextField.tsx:126-130` renders a `caption`/`danger` line below the field. Undesigned.
  - **Form-level error** — `LoginScreen.tsx:133-137`, a centred `caption`/`danger` line between
    the button and the helper, with `accessibilityLiveRegion="polite"`. Undesigned; the story
    plan (line 465, open question 2) explicitly asks design to confirm this placement.
  - **Loading** — `LoginScreen.tsx:128-129` sets `loading` and `disabled`; `Button.tsx:110`
    replaces the label with an `ActivityIndicator` and `Button.tsx:100` drops opacity to
    `opacity.disabled`. Undesigned — in particular, "label disappears entirely while pending"
    is a decision no one signed off on.
- Do not resolve these here; send them back with the §15 flag 6 batch.

### 10. `TextField`'s uppercase + `tracking.wide` label under Arabic — `flag`
- **Axis:** open design flags (§15 flag 3)
- **Figma:** `I74:610;72:605` binds `uppercase` + `tracking.wide` on the field label, and
  `TextField.tsx:73` + `TextField.tsx:135` implement it faithfully.
- Arabic has no case, so `textTransform` is a no-op there while the 0.6 letter-spacing still
  pulls joined letterforms apart — the same objection §15 flag 3 raises for `SectionHeader`.
  Inherited by this screen, not resolvable in it. The story plan records it as open question 4.

### 11. Content is vertically centred rather than positioned as in the frame — `intentional`
- **Axis:** structure & order
- **Figma:** the `Content` frame (`7:4638`) places `Brand` at y≈134 with ≈174 of slack below
  the helper line — i.e. optically high, not centred.
- **Code:** `LoginScreen.tsx:38-40` centres via `flexGrow: 1` + `justifyContent: 'center'`.
- The story plan's design-spec table (line 56) prescribes exactly this ("vertically centred
  between status bar and footer, `ScrollView` with `flexGrow: 1, justifyContent: 'center'`)".
  Recorded, not a defect.

### 12. `LanguageToggle` is 200 wide where Figma draws 150 — `intentional`
- **Axis:** token fidelity
- **Figma:** instance `74:632`, 150 × 42.
- **Code:** `src/core/components/LanguageToggle.tsx:32` — `width: 200`, with a nine-line comment
  explaining that `SegmentedControl`'s `flex: 1` segments collapse below the width needed for
  the "English"/"Arabic" labels. A deliberate, documented widening. (Moot until finding 1 is
  fixed.)

## Verified correct

- **Spacing, end to end.** Mark→wordmark 16 (`spacing.lg`, `LoginScreen.tsx:45`), wordmark→tagline
  4 (`spacing.xs`, line 52), brand→form 32 (`spacing.xxl`, line 45), email→password 16 (line 62),
  password→forgot 8 (`spacing.sm`, line 89), fields→button and button→helper 16 (line 62), page
  padding 24 (`spacing.xl`, line 41). All match the frame geometry exactly.
- **Component identity at the screen level.** `Button variant="primary" fullWidth` for Sign in
  (line 124), `Button variant="link"` for Forgot password (line 116), `TextField` for both
  credentials, `Text` for every string. No hand-rolled `Pressable`, no inline field, no bespoke
  pill anywhere in the file.
- **Sign in button box.** `Button.tsx:37` `HEIGHT = 56` equals Figma's `py-16 + lineHeight.md 24
  + py-16`; `radius.md`, `paddingHorizontal: spacing.xl`, `bgPrimary` (`#1a56db`) and
  `textOnPrimary` all match `74:629`.
- **Forgot-password link.** `callout`/`semibold`/`textLink` (`Button.tsx:78-80`) matches
  `I74:627;71:607` (14/20 SemiBold `colors.link`), end-aligned via `justifyContent: 'flex-end'`
  (`LoginScreen.tsx:115`) — a flexbox value, so it mirrors under RTL.
- **Helper line.** `caption`/`muted`/centred (`LoginScreen.tsx:139-141`) matches `74:631`
  (12/18, `colors.textMuted`, centred, full width).
- **Field label.** `caption`/`semibold`/`muted` + uppercase + `tracking.wide`
  (`TextField.tsx:69-79`) matches `I74:610;72:605` exactly (see flag 10 for the Arabic caveat).
- **Field chrome.** 48 height, `radius.md`, `bgSurface`, hairline `borderDefault`, `spacing.sm`
  internal gap (`TextField.tsx:80-90`) — all match `I74:610;72:606`.
- **Placeholder treatment.** Email carries `auth.emailPlaceholder` (line 73) per Figma's
  "you@company.com"; password carries none (Figma shows dots only) — and `TextInput.tsx:31`
  defaults `placeholderTextColor` to `textMuted`, the token Figma bound.
- **Screen background** is `colors.bgCanvas` (`LoginScreen.tsx:36`) = `#f8f9fb` =
  Figma's `colors.background`.
- **RTL (axis 5).** No physical props anywhere in `LoginScreen.tsx`, `TextField.tsx`,
  `Button.tsx` or `IconButton.tsx` — only `paddingHorizontal`, `gap`, `marginBottom`,
  `alignItems` and `justifyContent`. `Text.tsx:79-86` resolves logical `start`/`end` through
  `useDirection()`. The `eye`/`eyeOff` glyphs are direction-neutral.
- **Dark theme (axis 6).** Every colour on the screen goes through a semantic token; the only
  literals are `'transparent'` (`Button.tsx:126`, `IconButton.tsx:68`), which is palette-neutral.
  No hex outside `primitives.ts`.
- **No self-registration affordance** anywhere in the file — BRD AC 4 holds.
- **Route files are thin.** `src/app/(auth)/login.tsx` imports the screen and renders it;
  `src/app/(auth)/_layout.tsx` is a bare headerless `Stack`. The `forgot-password` route the
  link targets exists.

## Needs a visual check

- **Keyboard occlusion.** Whether the Sign in button stays reachable with the iOS keyboard up
  (finding 7) is a runtime question — the centred `ScrollView` cannot be judged statically.
- **Brand mark in dark theme.** `assets/brand/azm-mark.png` is a fixed-colour raster
  (`LoginScreen.tsx:46-51`); its blue is presumably `#1a56db`, which should hold on
  `bgCanvas` dark (`neutral1000`), but only a device render confirms the contrast and that the
  PNG has no baked light background.
- **Arabic layout.** The label letter-spacing objection in flag 10 and the wordmark tracking in
  finding 6 both need an Arabic render side by side with the English one.
