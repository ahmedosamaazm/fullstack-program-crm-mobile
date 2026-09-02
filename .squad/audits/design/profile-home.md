# Profile - Home — design audit

**Figma:** `7:4492` (body `7:4497`) · **Code:** `src/features/profile/screens/ProfileScreen.tsx`
**Verdict:** major drift

## Summary

Structurally this screen is a faithful build: every section is present in the right order, every
gap and inset lands on the token Figma bound, and — the thing this audit went looking for — every
settings row on the screen itself goes through the real `SettingsRow`/`RowGroup` primitives, with
the label-inset divider (48) implemented exactly as designed. The drift is concentrated in the
identity card and in two colour/elevation details: the avatar is 40 where Figma is 52, the name is
`body` (16/24) where Figma binds `fontSize.lg`/`lineHeight.lg` (18/26), and none of the four cards
carries the two-layer shadow Figma puts on every card in the frame, so they sit flat on the canvas.
The single most important fix is the identity card: avatar 52 and name at `heading`, which together
are what make Figma's 84h card fill correctly. Note that the story plan's design-spec table
records "avatar 40" and "name 16/24" — that is a transcription error in the plan, not a justified
deviation; live Figma says otherwise.

## Findings

### 1. Identity avatar is 40, Figma is 52 — `major`
- **Axis:** token fidelity / structure
- **Figma:** `I83:668;81:731` — `size-[52px]`, `radius.full`. The card is 84h with `spacing.lg`
  padding, so 52 is exactly what fills it (16 + 52 + 16 = 84).
- **Code:** `src/features/profile/components/IdentityCard.tsx:15` — `const AVATAR_SIZE = 40`, used
  at `:51` and `:59`.
- **Fix:** Set `AVATAR_SIZE = 52`; the card then reaches its 84h naturally and `CARD_HEIGHT` can
  stay as the floor. (The story plan says 40 at its design-spec table — that line is wrong against
  the live frame; treat this as a defect, not an intentional deviation.)

### 2. Identity name renders one type step small — `major`
- **Axis:** token fidelity
- **Figma:** `I83:668;81:734` — `fontSize.lg` 18 / `lineHeight.lg` 26 / SemiBold / `colors.text`.
- **Code:** `src/features/profile/components/IdentityCard.tsx:61` — `<Text variant="body"
  weight="semibold">`, i.e. `fontSize.md` 16 / `lineHeight.md` 24.
- **Fix:** `variant="heading"` (`typography.ts:99` maps it to 18/26 exactly).

### 3. No card elevation anywhere on the screen — `major`
- **Axis:** token fidelity / dark theme
- **Figma:** every card in the frame — Identity `83:668`, Settings `83:679`, Account `83:727`,
  SignOut card — carries `shadow-[0px_2px_8px_0px_rgba(0,0,0,0.04),0px_1px_3px_0px_rgba(0,0,0,0.06)]`,
  which is `elevation.e2` + `elevation.e1` in `core/lib/theme/elevation.ts:24-25`.
- **Code:** `src/features/profile/components/IdentityCard.tsx:37-47` and
  `src/core/components/SettingsRow.tsx:82-88` (`RowGroup`) both set only `borderRadius` +
  `backgroundColor`. `grep -rn 'elevation\.' src --include=*.tsx` returns two hits, neither on
  this screen.
- **Fix:** Spread `theme.elevation.e1` (or `e2`) into the `IdentityCard` root and the `RowGroup`
  surface — RN can render only one shadow, so pick one level and note the choice; the tokens
  already resolve per-theme (`lightElevation`/`darkElevation`).

### 4. Sign-out leading icon is grey, Figma strokes it danger — `major`
- **Axis:** token fidelity
- **Figma:** `I83:741;81:720` sits in the row whose label is `colors.danger` (#ba1a1a); the `Icon`
  component doc for `81:699` says explicitly "override the stroke on an instance for danger or
  on-primary contexts", and the render shows a red glyph.
- **Code:** `src/core/components/SettingsRow.tsx:39` — `<Icon name={props.icon} size={20} />` with
  no `color`, so `Icon.tsx:135` falls back to `theme.colors.iconDefault` (neutral 500) even when
  `props.type === 'destructive'` (the label at `:40` does switch to `tone="danger"`).
- **Fix:** In `SettingsRow`, pass `color={destructive ? theme.colors.statusDanger : undefined}` to
  the leading `Icon`.

### 5. Picker-sheet option rows use a leading `check` and a trailing chevron — `major`
- **Axis:** component identity / structure
- **Figma:** the frame designs no picker sheet (see *Needs a visual check*), but `SettingsRow`'s
  own component doc (`81:729`) defines `Type=Link` as "shows a value and chevron (**opens a
  picker**)" — it is the row that opens a sheet, not a row inside one.
- **Code:** `src/features/profile/components/LanguageSheet.tsx:39-45` and
  `src/features/profile/components/ThemeSheet.tsx:29-38` — `type="link"` with
  `icon={selected ? 'check' : undefined}`. Two consequences: every option row gets a trailing
  `chevronForward` (a push-navigation affordance on a row that dismisses a sheet), and because the
  check occupies the *leading* slot, unselected options lose their icon and their labels shift 32px
  (`icon 20 + gap 12`) relative to the selected one — visibly ragged with 2 and 3 options.
- **Fix:** Either give `SettingsRow` a `selected` prop that puts a `check` in the *trailing* slot
  and suppresses the chevron, or render the option rows with `type="static"` plus a trailing check
  so the labels stay aligned. Raise the missing "picker option row" variant with design.

### 6. Identity card gap is `spacing.md`, Figma binds `spacing.lg` — `minor`
- **Axis:** token fidelity
- **Figma:** `83:668` — `gap-[var(--spacing.lg,16px)]` between avatar and text block.
- **Code:** `src/features/profile/components/IdentityCard.tsx:42` — `gap: theme.spacing.md` (12).
- **Fix:** `gap: theme.spacing.lg`. (The plan's task-2 snippet also says `md`; same transcription
  slip as finding 1.)

### 7. Title block padding differs above and below — `minor`
- **Axis:** structure
- **Figma:** `7:4517` TitleRow is 42h with the 28h text at `y=0` — nothing above the title, 14 below
  it, then `Content` adds 16 before the identity card (title baseline box → card = 30).
- **Code:** `src/features/profile/screens/ProfileScreen.tsx:105` — `paddingVertical:
  theme.spacing.lg` gives 16 above the title and 16 below, so the title sits 16 lower than designed
  and the card sits 14 closer to it.
- **Fix:** `paddingTop: theme.spacing.none`/`xs` and `paddingBottom: theme.spacing.xl` (24, the
  nearest scale step to 30) on that wrapper, or state the deviation.

### 8. Dividers render at hairline, Figma strokes 1px — `minor`
- **Axis:** token fidelity
- **Figma:** `83:697`/`83:710` — `h-px` on `colors.border`; the frame's variable set includes
  `stroke weight/1`.
- **Code:** `src/core/components/SettingsRow.tsx:110` — `divider: { height:
  StyleSheet.hairlineWidth }` (0.5 on @2x, 0.33 on @3x).
- **Fix:** Design decision more than a bug — either accept hairline as the platform-native
  treatment across the app (it is used identically elsewhere) or set `height: 1`. Worth deciding
  once, globally, not on this screen.

### 9. Identity skeleton uses raw pixel heights — `minor`
- **Axis:** token fidelity
- **Figma:** no skeleton is designed; the placeholder should mirror the real line boxes (26 and 20
  once finding 2 lands).
- **Code:** `src/features/profile/components/IdentityCard.tsx:53-54` — `height={18}` and
  `height={14}`; 14 is not a value on the `lineHeight` scale.
- **Fix:** Drive both from `lineHeight.lg` / `lineHeight.sm` so the card does not jump when data
  arrives.

### 10. `SectionHeader` uppercase + `tracking.wide` in Arabic — `flag`
- **Axis:** open design flags (§15 flag 3)
- **Figma:** `I83:676;81:739` — `uppercase` + `tracking.wide` 0.6 on both "SETTINGS" and "ACCOUNT".
- **Code:** `src/core/components/SectionHeader.tsx:40` (`letterSpacing: theme.tracking.wide`) and
  `:60` (`textTransform: 'uppercase'`), rendered twice at
  `src/features/profile/screens/ProfileScreen.tsx:120` and `:157`.
- **Fix:** Not a fix — this screen is the first real consumer of the flag. Arabic has no case, and
  0.6px tracking pulls apart joined letterforms, so `الإعدادات` / `الحساب` will read looser and
  lighter than their English counterparts. Needs a locale-aware tracking token or an explicit
  accept from design.

### 11. `Chevron` / `ArrowLeft` physical naming — `flag`
- **Axis:** open design flags (§15 flag 1)
- **Figma:** the trailing glyph on all three settings rows is the component named `Chevron`.
- **Code:** `src/core/components/Icon.tsx:33` exposes it as `chevronForward`, consumed at
  `SettingsRow.tsx:48`.
- **Fix:** None here; the rename request back to Figma is still open. (§15 flag 5 — `Button` Icon
  32×32 vs `IconButton` 36×36 — is **not** touched by this screen: it renders no icon-only button.)

### 12. `SectionHeader` vertical padding 8 vs Figma's off-scale 10 — `intentional`
- **Axis:** token fidelity
- **Figma:** `83:676` — `py-[10px]`, an off-scale raw value; the header frame is 38h.
- **Code:** `src/core/components/SectionHeader.tsx:30` — `paddingVertical: theme.spacing.sm` (8),
  rendering 34h.
- **Fix:** None. Story 01 snapped this deliberately and the story-06 plan repeats "Do not
  reintroduce the 10."

### 13. Sign-out confirmation sheet — `intentional`
- **Axis:** structure / states
- **Figma:** the row signs out directly; no confirmation is designed anywhere in the frame.
- **Code:** `src/features/profile/screens/ProfileScreen.tsx:191-218` — a `BottomSheet` with a
  `danger` and a `secondary` `Button`, plus an inline error path at `:199-208`.
- **Fix:** None. Story plan task 6 + open question 4 add it deliberately (a mis-tap mid-call costs
  a re-login) and flag it back to design for confirmation.

### 14. App information reads "AZM 1.0.0", Figma reads "AZM 2.4.1 (build 308)" — `intentional`
- **Axis:** structure
- **Figma:** `83:728` value text "AZM 2.4.1 (build 308)".
- **Code:** `src/features/profile/screens/ProfileScreen.tsx:84-90` — reads
  `Constants.expoConfig.version` and only appends a build when `ios.buildNumber` /
  `android.versionCode` exist; `app.json` defines neither.
- **Fix:** None. Plan task 7 forbids hardcoding to match the mock; open question 5 assigns the
  build-number decision to release process.

### 15. Language row shows the current language, Figma shows "Arabic · English" — `intentional`
- **Axis:** structure
- **Figma:** `I83:680;81:707` — "Arabic · English" (both languages, unlike Theme and Notifications
  which show a current value).
- **Code:** `src/features/profile/screens/ProfileScreen.tsx:126` — `t(LANGUAGE_VALUE_KEY[currentLocale()])`.
- **Fix:** None. Plan open question 3 treats the Figma string as a placeholder and asks design what
  it meant.

### 16. Notifications rows are hand-rolled, not `SettingsRow` — `intentional`
- **Axis:** component identity
- **Figma:** no notifications sheet is designed; Figma's `SettingsRow` (`81:729`) has exactly three
  types — link, static, destructive — none with a switch.
- **Code:** `src/features/profile/components/NotificationsSheet.tsx:23-56` — a local
  `NotificationRow` (`Pressable`-less `View` + `Switch`) that re-states `SettingsRow`'s metrics
  (`ROW_HEIGHT = 48`, `paddingVertical: md`, `paddingHorizontal: lg`, label `variant="body"`).
- **Fix:** None required — plan task 5 specifies exactly this, and the file documents why. Worth
  raising with design as a fourth `SettingsRow` type (`toggle`) so the metrics stop being
  duplicated; today a change to row height must be made in two places.

### 17. Restart-required caption and the "not sending yet" note — `intentional`
- **Axis:** structure
- **Figma:** neither string exists in the frame.
- **Code:** `src/features/profile/screens/ProfileScreen.tsx:144-153` (under the Settings card) and
  `src/features/profile/components/NotificationsSheet.tsx:81-87`.
- **Fix:** None. Plan tasks 4 and 5 add both deliberately.

### 18. Avatar tint cycles per name; Figma paints one blue — `intentional`
- **Axis:** token fidelity
- **Figma:** `I83:668;81:731` — a flat `#dbeafe` fill with `colors.link` initials.
- **Code:** `src/features/profile/components/IdentityCard.tsx:59` — `tint={tintForName(displayName)}`,
  which cycles info/success/warning/danger (`Avatar.tsx:27`).
- **Fix:** None. Plan task 2 explicitly permits reusing story 05's tinting, and the file comments
  say which option was taken. (Worth confirming with design that the agent's *own* avatar should
  cycle rather than being fixed blue.)

## Verified correct

- **Every row on the screen goes through `SettingsRow`/`RowGroup`** — `ProfileScreen.tsx:121-143`,
  `:158-165`, `:169-176`. No bespoke `Pressable` + `View` row anywhere on the screen itself; the
  only hand-rolled row in the feature is the documented `Switch` one inside the sheet (finding 16).
- Row metrics: 48 min-height, `paddingVertical: md` / `paddingHorizontal: lg`, `gap: md`, icon 20 —
  `SettingsRow.tsx:19,32-36,39` — all match `83:680`/`83:699`/`83:712` exactly.
- Row label `variant="body"` (16/24, `textPrimary`) and value `variant="callout" tone="muted"`
  (14/20, `textMuted`) — `SettingsRow.tsx:40,44` — match `I83:680;81:706` / `81:707`.
- Divider inset 48 (`spacing.lg + 20 + spacing.md`) on `dividerInset="label"` and colour
  `borderSubtle` = neutral200 = Figma's `colors.border` #e8ebf0 — `SettingsRow.tsx:77-95`,
  matching `83:697`.
- Group corner radius `radius.md` (12) and surface `bgSurface` on all four cards —
  `SettingsRow.tsx:86`, `IdentityCard.tsx:44-45` — matching `radius.md` / `colors.surface`.
- **Sign-out card background is `bgSurface`, not `bgDangerSubtle`** — Figma `83:741` is
  `colors.surface` with only the label (and icon, per finding 4) in danger. The code is right here;
  a tinted danger surface would have been wrong.
- Vertical rhythm: content inset 16 (`spacing.lg`), title→card 16, and 24 (`spacing.xl`) between
  every group — `ProfileScreen.tsx:101,119,156,168` — matching Figma's y=16 / 124 / 332 / 442.
- Screen title `variant="title" weight="semibold"` = 22/28 = `fontSize.xl`/`lineHeight.xl`
  (`ProfileScreen.tsx:106`), and section headers `caption`/semibold/`textSecondary`/`tracking.wide`
  (`SectionHeader.tsx:36-43`) = `fontSize.xs`/`lineHeight.xs`/`colors.textSecondary`.
- Section order and presence: title → identity → SETTINGS group (Language/Theme/Notifications) →
  ACCOUNT group (App information) → headerless sign-out card. Nothing in the frame is missing and
  nothing extra is added beyond the intentional items above.
- **States:** loading skeleton inside the same card shell (`IdentityCard.tsx:49-56`), an error
  fallback that keeps every other row usable (`:34`, `ProfileScreen.tsx:95`), and a sign-out
  failure surfaced in-sheet with `accessibilityLiveRegion` (`ProfileScreen.tsx:199-208`). Figma
  designs none of these; all three are correct additions.
- **RTL:** no physical props anywhere in the audited files — `marginStart` on the divider
  (`SettingsRow.tsx:95`), `paddingHorizontal`/`paddingVertical` and `gap` throughout; both
  directional glyphs (`chevronForward`, `signOut`) are in `Icon.tsx:111`'s `DEFAULT_MIRRORED`.
- **Dark theme:** every colour is read through a semantic token off `theme.colors` (including the
  `Switch` `trackColor`/`thumbColor` at `NotificationsSheet.tsx:51-52`); no hex literal appears in
  any audited file.
- Route file is thin (`src/app/(tabs)/profile.tsx`, 5 lines, imports the screen from the barrel).

## Needs a visual check

- **Figma designs no Language, Theme or Notifications picker.** Frame `7:4492` contains only the
  home state of the tab; there is no sheet, inline-expansion, or sub-screen node for any of the
  three pickers in this frame's subtree. The bottom-sheet presentation is a story-plan decision
  (tasks 3-5), so findings 5 and 16 are measured against `SettingsRow`'s own component
  documentation rather than a design. **Ask design whether the pickers are sheets, inline
  radio rows, or pushed screens before hardening them.**
- Whether the identity card still lands on exactly 84h once the avatar goes to 52 and the name to
  18/26 (16 + max(52, 26+2+20) + 16 = 84 on paper, but line-box rounding on device may differ).
- Whether `ScrollView`'s `paddingBottom: spacing.xxxl` clears the floating `BottomNav` on a device
  with a home indicator — that is a runtime measurement, not a static one.
