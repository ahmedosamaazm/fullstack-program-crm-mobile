# Reflect the AZM design system in React Native

> Story: `.squad/stories/design-system/reflect-azm-design-system-in-react-native/intake.md`
> Authored outside the squad-kit planner (`new-plan`) and placed here for tracking; treat as
> authoritative for this feature. Implement by opening a fresh, scoped session on this file per
> `.squad/README.md`'s step 3.

## Context

The Figma file (`mdfP8RPdkUsKcJb0wFdkME`) is the source of truth for AZM's design system: 8 variable
collections and 34 components. The RN app has a `src/core/lib/theme/` layer that looks like a design
system but was **hand-written independently of Figma** — it shares no values with it:

| | Code today | Figma |
|---|---|---|
| Primary blue | `#2F6FED` | `#1a56db` |
| Neutral ramp | `grey0…grey9` (`#F7F8FA`…`#0E1116`) | `neutral/0…1000` (`#ffffff`…`#0c1014`) |
| Radius | `sm 6, md 10, lg 16, xl 24, pill 999` | `none 0, xs 4, sm 8, md 12, lg 16, xl 20, full 999` |
| Spacing | 7 steps, no `none`/`xxs` | 9 steps incl. `none 0`, `xxs 2` |
| Font size | 6 steps, min 12 | 7 steps, min 10 |
| Semantic colours | 20 flat keys | 35 grouped keys |
| Font family | **none — system font** | IBM Plex Sans |

So this is a **replacement of the token layer**, not a patch, and it necessarily rewrites the 8
components that consume the old names.

Three further gaps make the work urgent:

1. **No font at all.** `expo-font` is installed and registered in `app.json` plugins but never
   imported; there are zero font files in the repo; `fontFamily` appears nowhere in `src/`. An
   Arabic-first app is currently rendering on Roboto/San Francisco.
2. **The app cannot boot.** `main` is `expo-router/entry`, `App.tsx`/`index.ts` are deleted, and
   `src/app/` is empty. `bootstrap()`, `ThemeProvider` and `queryClient` are never mounted.
3. **`eslint.config.js` does not exist**, though `tokens.ts:4` and `CLAUDE.md:108` both claim the
   hex-literal ban is enforced by it.

**Intended outcome:** a token layer that is a faithful, traceable reflection of the Figma variables;
IBM Plex Sans Arabic as the app's only font, enforced at lint time; the 16 domain-free Figma
components built and the 8 existing ones re-themed; and a bootable app with a gallery route so all
of it can actually be seen.

## Decisions taken

| Decision | Choice |
|---|---|
| Component scope this pass | **Generic core only (~16)** — the 18 domain components ship with their features |
| Colour API shape | **Flat camelCase**, one key per Figma path (`color/bg/canvas` → `bgCanvas`) |
| Single-font enforcement | **`Text`/`TextInput` primitives + ESLint `no-restricted-imports` ban** |
| App entry | **Yes** — minimal root layout + component gallery, so the work is verifiable |
| Icon renderer | **MaterialCommunityIcons** via the already-installed `@expo/vector-icons` |

**On the icon choice:** MCI covers all 23 Figma glyphs *and* the four the components need that the
Figma set lacks (Search, Close, Plus, Alert) — 27/27, zero new dependencies. Material is drawn on a
24dp grid with a 2dp stroke, so at a 20px render the effective stroke is **~1.67px against the 1.6
spec (~4% off)**; Ionicons would have been ~1.25px, a visible 22% lighter. Use
MaterialCommunityIcons specifically, not MaterialIcons — the official set in `@expo/vector-icons` is
predominantly filled (only 32 of 2,234 glyphs are outline variants) while MCI has 1,940.

Accepted trade: these are a different draftsman's shapes, not the Figma paths — `Sparkle` and `Theme`
will differ in form — and stroke width is baked into the glyph font rather than a per-instance prop.
`Icon.tsx` keeps a renderer-agnostic API (`name`, `size`, `color`, `mirrorInRtl`) behind a strict
`IconName` union, so switching to exact SVG paths later touches exactly one file. **`IconName` must
never widen to `string`** — the union is what makes the swap safe.

The one thing this doesn't solve: `Dropzone`'s dashed border, which RN renders as solid on Android
when combined with `borderRadius` (see §15 flag 8).

### Deferred (not this pass)

The 18 domain components stay in Figma until their features exist: TicketRow, StatusBadge, StatusDot,
StatusOption, PriorityRail, PriorityTag, PriorityOption, MessageRow, ReplyComposer, AISummaryBar,
ContactStrip, IdentityCard, AgentRow, NotificationRow, StatCard, BottomNav, plus the two sheet-only
rows. They belong under `src/features/<domain>/components/` per CLAUDE.md rule 3.

## Authoritative token values (from Figma, resolved)

### Colours — 35 semantic keys, light / dark

```
bgCanvas            #f8f9fb / #0c1014      textPrimary      #181c22 / #f8f9fb
bgSurface           #ffffff / #181c22      textSecondary    #44474f / #c4c7cf
bgSurfaceRaised     #ffffff / #2a2d35      textMuted        #6b6e76 / #9c9fa7
bgSurfaceSunken     #f0f3f8 / #0c1014      textDisabled     #9c9fa7 / #74777f
bgPrimary           #1a56db / #4e80e8      textInverse      #ffffff / #181c22
bgPrimaryPressed    #1d4ed8 / #1a56db      textLink         #1a56db / #8baee8
bgPrimarySubtle     #f4f7ff / #071130      textOnPrimary    #ffffff / #0c1014
bgSuccessSubtle     #e8f5e9 / #0c2e12      textOnDanger     #ffffff / #0c1014
bgWarningSubtle     #fff4ec / #7a3600
bgDangerSubtle      #ffdad6 / #410002      statusInfo       #1a56db / #4e80e8
bgSkeleton          #e8ebf0 / #2a2d35      statusSuccess    #2e7d32 / #6fd48a
bgSkeletonHighlight #e3e5ea / #44474f      statusWarning    #c2410c / #ffb77c
bgOverlay           #181c22 / #000000      statusDanger     #ba1a1a / #ffb4ab

borderSubtle        #e8ebf0 / #2a2d35      iconDefault      #74777f / #c4c7cf
borderDefault       #e3e5ea / #44474f      iconStrong       #181c22 / #f8f9fb
borderStrong        #c4c7cf / #5c5f67      iconOnPrimary    #ffffff / #0c1014
borderFocus         #1a56db / #4e80e8
borderInteractive   #74777f / #9c9fa7      tabActive        #1a56db / #4e80e8
                                           tabInactive      #6b6e76 / #9c9fa7
```

`bgOverlay` is the only pair that is a literal in Figma rather than a primitive alias — it needs an
alpha treatment in RN (today's code uses `rgba(14,17,22,0.45)` / `rgba(0,0,0,0.6)`).

### Scales

```
spacing     none 0, xxs 2, xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48
radius      none 0, xs 4, sm 8, md 12, lg 16, xl 20, full 999
fontSize    xs2 10, xs 12, sm 14, md 16, lg 18, xl 22, xl2 28
lineHeight  xs2 16, xs 18, sm 20, md 24, lg 26, xl 28, xl2 34
tracking    tight -0.3, normal 0, wide 0.6
fontWeight  regular 400, medium 500, semibold 600, bold 700
opacity     none 0, subtle .06, muted .1, soft .3, disabled .38, medium .4, strong .6, full 1
elevation   1: y1 blur3 spread0 op.06   2: y2 blur8 spread0 op.04   3: y4 blur16 spread0 op.05
            4: y25 blur50 spread-12 op.25   5: y32 blur80 spread0 op.6
```

Figma names the extreme font steps `2xs`/`2xl`; those aren't valid JS identifiers, so they become
`xs2`/`xl2`.

## Font

`@expo-google-fonts/ibm-plex-sans-arabic@0.4.2` — confirmed to export `IBMPlexSansArabic_400Regular`,
`_500Medium`, `_600SemiBold`, `_700Bold`, matching Figma's four weight tokens exactly.

**The constraint that shapes the API:** on Android, custom fonts do not synthesize weight. Setting
`fontFamily` to a custom family alongside `fontWeight: '600'` silently renders Regular. So the theme
must map weight → concrete family name and must **never** emit `fontWeight` next to a custom
`fontFamily`. This is why today's `theme.fontWeight` (`'600'`) cannot simply gain a `fontFamily`
sibling — it changes shape.

## Component specs pulled from Figma (exact)

All padding/gap/radius/colour below are the **bound token names**, read straight off the components.

| Component | Variants | Geometry | Type |
|---|---|---|---|
| **Button** | Primary, Secondary, Danger, Link, Icon, IconTonal | Primary/Secondary/Danger 56h, `radius/md`, pad `lg`/`xl`, gap `sm`. Icon 32×32 `radius/full` no fill. IconTonal 36×36 `radius/full` `bgSurfaceSunken` | label `md`/`lh md`/SemiBold. Primary→`textOnPrimary`; Secondary→`textSecondary` + `bgSurface` + `borderDefault` 1px; Danger→`statusDanger` no fill; Link `sm`/SemiBold/`textLink` |
| **TextField** | Trailing=None\|Icon | VERTICAL gap `sm`; Field 48h | Label `xs`/`lh xs`/SemiBold/UPPER/`tracking wide`/`textMuted`; Value `md`/`lh md`/Regular |
| **TextArea** | — | VERTICAL gap `sm`; Box 108h, value top-anchored | same label treatment as TextField |
| **SearchField** | — | 44h, `radius/md`, `bgSurfaceSunken`, `borderDefault` 1px, gap `sm`, pad-x `md`, icon 16×16 | `sm`/Regular/`textMuted` |
| **IconButton** | Ghost, Subtle, Primary | 36×36 `radius/full`; Ghost no fill, Subtle `bgSurfaceSunken`, Primary `bgPrimary`; nested icon 20×20 | — |
| **Tab** | Selected=True\|False | VERTICAL gap `sm`, pad-top `sm`, full-width 2px indicator | True SemiBold/`tabActive`; False Medium/`tabInactive`; both `sm`/`lh sm` |
| **SectionHeader** | Link, None, Rule | HORIZONTAL, pad `10`/`lg`; Rule adds gap `md` + 1px rule | Label `xs`/`lh xs`/SemiBold/UPPER/`tracking wide`/`textSecondary` |
| **ModalHeader** | Action=Enabled\|Disabled | HORIZONTAL space-between, pad `6`/`lg`/`12`/`lg`, `bgSurface` + `borderSubtle` bottom | Cancel `sm`/Medium/`textSecondary`; Title `md`/SemiBold/`textPrimary`; Action `sm`/SemiBold → `textLink` / `textDisabled` |
| **SheetHeader** | Action=None\|Link | VERTICAL; 24h grab handle + 38h titlebar; `bgSurface` + `borderSubtle` | Title `lg`/`lh lg`/SemiBold/`tracking tight`; Action `sm`/SemiBold/`textLink` |
| **Dropzone** | — | 68h, `radius/md`, `bgSurface`, `borderDefault` 1px **dashed**, VERTICAL gap `xs`, pad `lg`, icon 20 | `sm`/Regular/`textMuted` |
| **DetailRow** | Inline, Stacked | Inline HORIZONTAL gap `lg` 44h; Stacked VERTICAL gap `xxs` 66h; both pad `md`/`lg`, `bgSurface` | both `sm`/Regular; Label `textMuted`, Value `textPrimary` |
| **SettingsRow** | Link, Static, Destructive | 48h HORIZONTAL gap `md`, pad `md`/`lg`, `bgSurface`; leading icon 20, Link adds trailing chevron 20 | Label `md`/Regular/`textPrimary` (Destructive→`statusDanger`, no value/chevron); Value `sm`/Regular/`textMuted` |
| **ActionRow** | Divider=True\|False | 64h HORIZONTAL gap `md`, pad `md`, 40×40 icon chip, `bgSurface`, Divider=True adds `borderSubtle` | Title `sm`/SemiBold/`textPrimary`; Subtitle `xs`/Regular/`textMuted` |
| **FilterChip** | Selected=True\|False | ⚠️ **see below** | ⚠️ |

### Two corrections to earlier assumptions

**Button has 6 variants, not 4.** `Secondary` and `Danger` were added to the Figma set after the
inventory I took earlier this session — presumably by the same concurrent editor who added the sheet
components. Build all six.

**`ActionRow` has a `Divider` axis** that wasn't in its description.

### ⚠️ FilterChip is not portable as-is — needs a decision

`FilterChip` is the one component still entirely on the legacy imported `www.figma.com` collection.
It resolves to none of the real tokens:

```
fill        color/azure/48          (not a Colors token)
text        color/white/solid, color/grey/29
stroke      #1a56db literal, 1.148px
fontSize    font size/12_5 (12.5), 11.5
lineHeight  12.5, 11
radius      38534000        ← the corrupt import artifact
padding     0/12/0/12 raw, gap 5 raw
```

This is the same component the tokenization audit flagged with 11 off-scale values. Porting it
faithfully would import junk into the RN theme. **Recommended:** build it against the nearest real
tokens — `radius/full`, `bgPrimary`/`textOnPrimary` when selected, `borderStrong`/`textSecondary`
when not, `fontSize.xs` (12), `lineHeight.xs` (18), pad `sm`/`md`, gap `xs` — and raise a separate
task to fix the Figma component. Flagging rather than silently snapping, because it will not match
the Figma render pixel-for-pixel.

`SectionHeader`'s `Action=Link` variant has the same problem in miniature — it sits on `font size/12`
/ `line height/18` / raw `0.7` tracking while its `None` and `Rule` siblings use the proper
`font/size/xs` / `font/line-height/xs` / `font/tracking/wide`. Build all three off the real tokens.

Also note `SectionHeader` pad-y `10` and `ModalHeader` pad-y `6`/`12` are off-scale (audit findings);
snap to `spacing.sm` (8) / `spacing.md` (12) and note the 2px shift.

## Implementation

### 1. Split the theme folder (delete `tokens.ts`)

`src/core/lib/theme/tokens.ts` (167 lines) becomes six focused modules. The split exists so the
ESLint hex rule has exactly one allow-listed path.

```
src/core/lib/theme/
├── primitives.ts   58 raw colour vars — the ONLY file in the repo with hex literals
├── colors.ts       ThemeColors + lightColors + darkColors (alias onto primitives)
├── typography.ts   fontSize, lineHeight, tracking, fontWeight, fontFamily,
│                   the type ramp, resolveFontFace(), resolveTextStyle()
├── layout.ts       spacing, radius, opacity, hitSlop
├── elevation.ts    elevation → RN shadow objects, per scheme
├── fonts.ts        FONT_ASSETS + loadFonts()
├── ThemeProvider.tsx
└── index.ts        the only import surface for the rest of the app
```

Derive the colour type from the light palette so the 35 keys are written once:

```ts
export const lightColors = { bgCanvas: primitives.neutral50, /* …35… */ } as const;
export type ThemeColors = Record<keyof typeof lightColors, string>;
export type ColorToken = keyof ThemeColors;
export const darkColors: ThemeColors = { /* …35… */ };
```

That annotation gives both exhaustiveness (missing key errors) and excess-property checking
(typo'd key errors).

### 2. Fonts — `Font.loadAsync()` inside `bootstrap()`

Install with `npx expo install @expo-google-fonts/ibm-plex-sans-arabic` (not `npm i`, for SDK-57
version alignment).

**Not the config plugin, and not `useFonts`.** The SDK 57 docs do recommend the config plugin as
more efficient, but it costs two things here: it requires a dev build (Expo Go stops working), and
it forces `Platform.select` into the weight→family map because Android keys on filename while iOS
keys on PostScript name. This project's whole Android-weight problem is solved by *one* map from
weight token to family string; branching that map by platform doubles the surface where a wrong
string silently degrades to Regular. `useFonts` is rejected for a different reason — it's a hook, so
it can only run inside a component, which contradicts the existing architecture where everything
settled before first paint happens in `bootstrap()` *before React mounts*. That would reintroduce
exactly the flash the bootstrap design exists to prevent.

`loadAsync` is the same call `useFonts` makes internally, returns a promise that composes with the
existing `Promise.all`, works in Expo Go, and lets us choose the key — so the family string is
byte-identical on every platform.

*Tradeoff:* a one-time async font decode on cold start, roughly 50–150 ms of extra splash, and the
fonts ride in the JS asset graph rather than the native bundle. Migrating to the plugin later is a
two-file change; leave a comment in `fonts.ts` recording that path and the `Platform.select` caveat.
Leave `"expo-font"` in `app.json` as the bare string — it's a no-op without a `fonts` key and is the
exact line that changes on the day the team adopts dev builds.

**Slot in `bootstrap.ts:26-35`** — fonts have no dependency on locale/direction, so they join the
existing parallel step rather than serialising behind it:

```ts
const locale = await resolveInitialLocale();               // unchanged
const directionChangePending = applyDirection(locale);      // unchanged — must stay first
const [, themeMode, fontsLoaded] = await Promise.all([
  initI18n(locale),
  loadPersistedThemeMode(),
  loadFonts(),                                              // NEW
]);
return { locale, themeMode, directionChangePending, fontsLoaded };
```

`loadFonts()` must **never reject** — wrap in try/catch, return `false`. A font failure blocking the
splash forever is worse than a system-font fallback.

### 3. The weight→family resolver (the crux of the single-font rule)

Android does not synthesise weight for custom families, and if fonts fail to load a `fontFamily`
pointing at nothing renders everything at default weight. So resolution is a function of
*(weight, fontsLoaded)* returning a union that makes the bad combination unrepresentable:

```ts
export const fontFamily = {
  regular:  'IBMPlexSansArabic_400Regular',
  medium:   'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold:     'IBMPlexSansArabic_700Bold',
} as const;

export type FontFace =
  | { fontFamily: string; fontWeight?: never }
  | { fontFamily?: never; fontWeight: '400' | '500' | '600' | '700' };

export function resolveFontFace(weight: FontWeightToken, fontsLoaded: boolean): FontFace;
export function resolveTextStyle(
  variant: TextVariant, fontsLoaded: boolean, weightOverride?: FontWeightToken,
): TextStyle;
```

Family strings are the `@expo-google-fonts` export names verbatim, and double as the `loadAsync`
keys — which is why no `Platform.select` is needed.

### 4. Typography ramp + `Text` / `TextInput` primitives

A named ramp is the primary API. The evidence for this is in the current code: all 8 components
hand-assemble `{color, fontSize, fontWeight}` at every call site, not one sets `lineHeight`, and two
work around that with a hardcoded `lineHeight: 20` buried in a StyleSheet. Raw primitives alone
guarantee leading keeps getting forgotten — and Arabic is what suffers.

**Three orthogonal axes, not a combined ramp** — `variant` carries size + leading only, with `weight`
and `tone` independent. This matches how the Figma components actually specify type (a `sm` label
appears at both Medium and SemiBold across Tab, ActionRow and SettingsRow), and it keeps the variant
list at seven, mapping 1:1 onto the seven `fontSize`/`lineHeight` steps. Full signature in §12.

```ts
type TextVariant = 'display'|'title'|'heading'|'body'|'callout'|'caption'|'overline';
//                  28/34    22/28   18/26     16/24  14/20     12/18     10/16
```

Two details carry real weight. The `Omit<TextStyle, 'fontFamily' | 'fontWeight'>` on `style` makes it
a **compile error** for any call site to set either — the primary defence against the Android bug,
applied exactly where a developer would reintroduce it. And `align` takes `start`/`end`, resolved
through `useDirection()` (§13), because RN's `textAlign` has no logical values and CLAUDE.md rule 5
bans physical ones. **`Text` is the single sanctioned file permitted to emit `left`/`right`** — with
a matching ESLint exemption — and it must not use `textAlign: 'auto'`, which follows the *script of
the string* rather than the layout, so an English name inside an Arabic screen would left-align.

`TextInput` mirrors this and additionally defaults `placeholderTextColor` to `colors.textMuted` — an
unstyled RN placeholder is illegible in dark mode.

### 5. `ThemeProvider` — new fields and two real bug fixes

`Theme` gains `lineHeight`, `tracking`, `fontFamily`, `typography`, `opacity`, `elevation`,
`fontsLoaded`. Props gain a required `fontsLoaded: boolean` alongside `initialMode`.

Wrap `setMode` in `useCallback(…, [])` and the context value in `useMemo(…, [scheme, mode, setMode,
fontsLoaded])`. This is not just tidiness: today `Appearance.addChangeListener` fires on every OS
theme change and rebuilds the value object, re-rendering **every consumer in the app even when the
user has pinned `mode: 'light'`** and nothing visible changed.

### 6. Three latent bugs this migration must fix (verified in the source)

| Bug | Where | Fix |
|---|---|---|
| **Backdrop would go fully opaque** — `bgOverlay` is now an *opaque* hex (`#181c22`/`#000000`) where the old `overlay` was `rgba(14,17,22,0.45)`. The backdrop animates opacity `0→1`, so a straight token swap hides the sheet behind solid black. | `BottomSheet.tsx:52` (`toValue: 1`), `:98` | animate to `opacity.strong` (0.6), keeping alpha in the animation and the token pure |
| **FAB casts a white shadow in dark mode** — `shadowColor: theme.colors.text`, which is near-white on dark. | `FAB.tsx:39` | delete the line; use `theme.elevation.e3` |
| **Hardcoded skeleton opacity** | `Skeleton.tsx:37` (`0.45`) | `opacity.medium` (0.4) |

`FAB.tsx:48-57` also hardcodes a full shadow spec; replacing it with `elevation.e3` is a visible
lightening (opacity .05 vs .2) — the design system is authoritative, but expect the diff.

### 7. Elevation → RN shadows

Emit classic `shadow*` + Android `elevation` (not `boxShadow`; its Android support isn't safe to bet
a design system on yet). Mapping: `shadowOffset.height` = Figma y, `shadowRadius` = blur / 2,
`shadowOpacity` = Figma opacity, Android `elevation` ← `[1, 2, 4, 12, 24]`. **Spread is dropped** —
`e4`'s `-12` has no `shadow*` equivalent; compensate with a smaller `shadowRadius` and document it.
`shadowColor` is scheme-dependent, so `elevation.ts` reads primitives directly. Both scales are
computed at module scope so the provider allocates nothing per render.

### 8. Token migration table

| old | new | breaking? |
|---|---|---|
| `background` | `bgCanvas` | rename |
| `surface` / `surfaceRaised` | `bgSurface` / `bgSurfaceRaised` | rename |
| `overlay` | `bgOverlay` | **rename + now opaque** (see §6) |
| `border` | `borderSubtle` | rename; use `borderDefault` for control outlines |
| `text` / `textMuted` | `textPrimary` / `textSecondary` *or* `textMuted` | old `textMuted` sat between the two — decide per site |
| `primary` | `bgPrimary` / `textLink` / `statusInfo` | one key → three roles |
| `onPrimary` | `textOnPrimary` / `iconOnPrimary` | split by role |
| `success`/`warning`/`danger` | `statusSuccess`/`statusWarning`/`statusDanger` | rename |
| `tabBarActive`/`tabBarInactive` | `tabActive`/`tabInactive` | rename |
| `radius.pill` | `radius.full` | rename |
| `radius.sm` 6 → 8, `radius.md` 10 → 12, `radius.xl` 24 → 20 | | **value changes — visible** |
| `fontSize.xxl` | `fontSize.xl2` | rename |
| `spacing.*` | unchanged | additive only (`none`, `xxs`) |
| `fontWeight.*` | unchanged names/values, **must never reach a style** | semantic break |

15 colour keys are new: `bgSurfaceSunken`, `bgPrimarySubtle`, `bgSuccessSubtle`, `bgWarningSubtle`,
`bgDangerSubtle`, `borderDefault`, `borderFocus`, `borderInteractive`, `textDisabled`, `textLink`,
`statusInfo`, `iconDefault`, `iconStrong`, `iconOnPrimary`, plus `borderSubtle`.

**Migration surface is exactly 8 files** — `Avatar`, `BottomSheet`, `EmptyState`, `ErrorState`,
`FAB`, `OfflineBanner`, `SegmentedControl`, `Skeleton`. Six of them import `Text` straight from
`react-native` and must switch to the core primitive.

### 9. `eslint.config.js` (new)

Flat config, **CommonJS** — `package.json` has no `"type": "module"`. The `typescript-eslint`
meta-package is **not** installed (only the plugin + parser), so compose by hand rather than using
`tseslint.config()`.

Five rule groups — four of which CLAUDE.md already promises exist:

1. `no-restricted-imports` — ban `Text`/`TextInput` from `react-native`, with an override for the
   two primitive files themselves.
2. `no-restricted-syntax` — ban hex literals, allow only `theme/primitives.ts` (**CLAUDE.md rule 2
   currently names `tokens.ts` and must be reworded in the same change**).
3. `no-restricted-syntax` — ban `fontWeight`/`fontFamily` as style keys outside `theme/**`. Catches
   what the `Omit`'d type can't reach inside `StyleSheet.create`.
4. `no-restricted-syntax` — ban physical layout props (rule 5).
5. `no-restricted-imports` patterns — `@/features/*` banned inside `src/core/**` (rule 3);
   `@/features/*/*` banned everywhere (rule 4, barrel-only).

Plus `ignores: ['node_modules/**', '.expo/**', 'dist/**', 'android/**', 'ios/**']` so `eslint .`
terminates.

### 10. App entry (prerequisite for verifying any of the above)

- `app.json`: `"expo-router"` → `["expo-router", { "root": "./src/app" }]` (confirmed in the SDK 57
  router docs as the supported way to move the routes directory).
- `src/app/_layout.tsx`: await `bootstrap()`, render `ThemeProvider initialMode fontsLoaded` +
  `QueryClientProvider` + `OfflineBanner`, then `hideSplash()`.
- `src/app/index.tsx`: the component gallery (see below).

### 11. Sequencing

The tree will not typecheck between steps 1 and 4 — the 8 components reference deleted names. Do
1→5 as one commit, or accept a red tree in between.

0. `npx expo install @expo-google-fonts/ibm-plex-sans-arabic` — the **only** new dependency
1. New theme modules; delete `tokens.ts`; rewrite the barrel
2. `bootstrap.ts` — add `loadFonts()` + `fontsLoaded`
3. `ThemeProvider.tsx` — new fields, `useCallback`/`useMemo`, plus `ThemeScope`;
   `useDirection()` / `DirectionScope` in `core/lib/i18n`
4. `Text.tsx`, `TextInput.tsx`, `Icon.tsx` (the three primitives everything else composes)
5. `IconButton` → `Button` (Button delegates its icon variants to IconButton)
6. The remaining 11 — form group (`TextField`, `TextArea`, `SearchField`), header group
   (`SectionHeader`, `ModalHeader`, `SheetHeader`, `Tab`+`TabBar`), row group (`DetailRow`,
   `SettingsRow`+`RowGroup`, `ActionRow`, `FilterChip`, `Dropzone`). These three groups are mutually
   independent and can run in parallel once step 5 lands. Add the 4 i18n keys.
7. Migrate the 8 existing components (incl. the three bug fixes in §6). Fold `ErrorState`'s
   hand-rolled retry button into `Button`, and `BottomSheet`'s inline handle+title into `SheetHeader`
   — that's five token references and a whole `styles` entry deleted from each.
8. `eslint.config.js`, then `npm run lint` + `npm run typecheck` clean
9. `app.json` router root, `src/app/_layout.tsx`, `features/dev` gallery, `src/app/index.tsx`
10. Update CLAUDE.md — rule 2 wording (`tokens.ts` → `primitives.ts`), the "no ESLint config / no
    lint script / no test runner" paragraph, and the wholly stale "the repository is currently a bare
    create-expo-app template" section. File the §15 Figma change requests.

### 12. The 16 new components

House conventions apply to every one: named export, props type declared above the component and not
exported (except unions consumers need), one `StyleSheet.create` named `styles` at the bottom holding
only token-free layout, every token-derived value inline via array syntax, **logical props only**,
`useTheme()`, `useTranslation()` for defaults, a11y props on every interactive element. Use `gap` /
`columnGap` (present in RN 0.86) rather than `marginStart` on children — inherently direction-agnostic.

**`Text`** — the font primitive. Three orthogonal axes rather than baking weight into the variant:

```ts
type TextVariant = 'display'|'title'|'heading'|'body'|'callout'|'caption'|'overline';
//                  28/34    22/28   18/26     16/24  14/20     12/18     10/16
type TextWeight = 'regular'|'medium'|'semibold'|'bold';
type TextTone   = 'primary'|'secondary'|'muted'|'disabled'|'inverse'|'link'
                | 'onPrimary'|'onDanger'|'success'|'warning'|'danger'|'info';

type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant;   // default 'body'
  weight?: TextWeight;     // default 'regular' → resolves to a FAMILY, never fontWeight
  tone?: TextTone;         // default 'primary'
  align?: 'start' | 'center' | 'end';
  style?: StyleProp<Omit<TextStyle, 'fontFamily' | 'fontWeight'>>;
};
```

The variants map 1:1 onto the seven `fontSize`/`lineHeight` steps. `tone` (not `color`) avoids
colliding with the style prop and can reach status colours, which `ErrorState` needs.

**`Icon`** — MaterialCommunityIcons behind a strict union. `IconName` is the 23 Figma names plus
`search`/`close`/`plus`/`alert`; `Icon.tsx` holds the name→MCI map. Keep the API renderer-agnostic
(`name`, `size`, `color`, `mirrorInRtl`) so swapping to exact SVG paths later touches one file.
Default-mirrored in RTL: `chevronForward`, `arrowBack`, `signOut`, `send`. Never mirrored: `check`,
`clock`, `star`, `globe`, `theme`, `phone`, `user`. Icons are decorative —
`importantForAccessibility="no-hide-descendants"`, never a label; the wrapping control owns it.

The other 14, with their Figma geometry already captured in the spec table above:

| Component | Props |
|---|---|
| `Button` | discriminated union — `primary`/`secondary`/`danger` take `label`; `icon`/`iconTonal` require `icon` + `accessibilityLabel`. Plus `loading`, `disabled`, `fullWidth`. Icon variants delegate to `IconButton` internally |
| `TextField` | `label`, `value`, `onChangeText`, `showLabel`, `placeholder`, `trailingIcon`, `onTrailingIconPress`, `error`, `helper`, `disabled`, `required` |
| `TextArea` | as TextField, plus `maxLength`, `showCounter`; 108h, top-anchored |
| `SearchField` | `value`, `onChangeText`, `placeholder`, `onSubmit`, `onClear`, `autoFocus` |
| `IconButton` | `icon`, `onPress`, `accessibilityLabel` (required), `variant` ghost/subtle/primary, `size`, `disabled`, `selected` |
| `Tab` + `TabBar` | `label`, `selected`, `onPress`; TabBar takes `scrollable` |
| `SectionHeader` | `title` + union on `variant`: `none` \| `link` (needs `action`, `onActionPress`) \| `rule` |
| `ModalHeader` | `title`, `onCancel`, `cancelLabel`, `actionLabel`, `onAction`, `actionDisabled` |
| `SheetHeader` | `title`, `actionLabel`, `onActionPress`, `showHandle` |
| `Dropzone` | `label`, `onPress`, `icon`, `hint`, `disabled`, `error` |
| `DetailRow` | `label`, `value`, `layout` inline/stacked, `valueSlot` |
| `SettingsRow` + `RowGroup` | union on `type` link/static/destructive; RowGroup owns `bgSurface`, `radius.md`, `overflow:hidden` and the inset dividers |
| `ActionRow` | `icon`, `title`, `description`, `onPress`, `tone`, `disabled` |
| `FilterChip` | `label`, `selected`, `onPress`, `count`, `disabled` |

**Four new i18n keys** — everything else is caller-supplied:
`common.clear`, `field.required`, `field.attach`, `field.charactersLeft`.
`charactersLeft` interpolates a count; Arabic has six plural categories, so either author all six
i18next forms (`_zero`/`_one`/`_two`/`_few`/`_many`/`_other`) or reword to avoid count agreement.

**Counts must go through the existing helpers** — `formatCount` for `FilterChip` (already caps at
99+ and is locale-aware) and `formatNumber` for `TextArea`'s counter. Passing a raw number renders
Western digits inside Arabic. This is the single most likely bug in this batch.

### 13. `useDirection()` / `DirectionScope` — required, not optional

Two places read direction imperatively: `Icon`'s RTL mirror and `Text`'s `align="end"`. If they read
`I18nManager.isRTL` directly they cannot follow a per-subtree override, and the gallery's RTL preview
would lie about exactly the two things most likely to be wrong. Add to `core/lib/i18n`:

```ts
export function useDirection(): 'ltr' | 'rtl';
export function DirectionScope(props: PropsWithChildren<{ direction: Direction }>): ReactElement;
```

Worth doing regardless of the gallery — it removes scattered `I18nManager` reads from the component
layer, which is what makes RN RTL bugs untestable.

### 14. Component gallery — in `features/dev`, not the route file

CLAUDE.md rule 1 says route files import a screen and render it. So:

```
src/features/dev/screens/GalleryScreen.tsx   + components/, gallery-entries.tsx, index.ts
src/app/index.tsx                            4 lines: import + render <GalleryScreen />
```

A sticky control bar (rendered *outside* every theme scope so it never restyles) with three
`SegmentedControl`s: scheme `light|dark|both`, locale `ar|en`, direction `rtl|ltr`. Then ~20
sections, one per component plus swatch strips for colours, spacing, radius, type and elevation.

- **Both themes at once** needs a `ThemeScope` — do *not* nest the existing `ThemeProvider`, because
  its `setMode` writes to AsyncStorage and would clobber the user's real preference. `ThemeScope`
  pushes a forced palette onto the same context with a no-op `setMode`.
- **Locale** flips live via `setLocale` — i18next re-renders every `t()`.
- **Direction** cannot flip live through `I18nManager` (RN latches it at startup, which is why
  `applyDirection` returns a restart-required flag). Instead wrap the specimen tree in
  `<View style={{ direction: 'rtl' }}>` — RN 0.86 exposes `direction` on `FlexStyle` and Yoga honours
  it per subtree, so every `marginStart`/`start:`/`end:` mirrors with no restart. The gallery is
  where the logical-props rule finally pays off.

### 15. Flags to resolve with design

1. **`ArrowLeft` is a physical name** in a codebase with zero physical props. Use `arrowBack` in
   `IconName` and request the rename in Figma, or code and design diverge on day one. Same for
   `Chevron` → `chevronForward`.
2. **Four glyphs are missing from the Figma set** — Search, Close, Plus, Alert. Covered by Material
   for now; request them in Figma so the set matches what the app actually uses.
3. **`SectionHeader`'s uppercase + `tracking wide` is a no-op or harmful in Arabic.** Arabic has no
   case, and letter-spacing pulls apart *joined* letterforms. AR headers will read looser and lighter
   than EN. Needs a locale-aware tracking token or an explicit accept.
4. **`OfflineBanner` cannot migrate mechanically** — the new palette has no solid warning fill.
   `statusWarning` is a foreground token, `bgWarningSubtle` a tinted surface. Proposed: tinted
   background + `textPrimary` + a `statusWarning` hairline. A real visual change, and worth making
   because `textInverse` on `statusWarning` is borderline for contrast in both themes today.
5. **`Button` variant `Icon` (32×32) overlaps `IconButton` (36×36)** — two components, one concept,
   4px apart. Confirm the difference is intentional or collapse them.
6. **Figma omits error / disabled / loading states** for TextField, TextArea, Dropzone and Button.
   The app uses React Hook Form, so error state isn't optional — this plan adds those props. Send
   them back so Figma gains the variants rather than drifting.
7. **`FilterChip` selected is solid blue in Figma**, which reads identically to a selected
   `SegmentedControl` segment. Building it faithfully (solid `bgPrimary` / `textOnPrimary`); worth a
   design look in a real filter bar.
8. **`Dropzone`'s dashed border renders solid on Android** when combined with `borderRadius` — a
   long-standing RN issue that the SVG option would have fixed. Accept the platform difference or
   drop to `radius.none`; verify on a real device.
9. **`TextArea` top-anchoring is platform-split** — `textAlignVertical: 'top'` is Android-only; iOS
   needs explicit `paddingTop` and its own inset zeroed. Looks fine in the simulator, wrong on
   hardware.
10. **`bgSkeletonHighlight` has no consumer** — the shimmer it implies was never built.

## Verification

There is **no test runner** in this project, so `typecheck` + `lint` + the gallery are the entire
safety net. All four gates must pass:

1. **`npm run typecheck`** — clean. This is the primary gate: the `Omit<TextStyle, 'fontFamily' |
   'fontWeight'>` on `Text`, the `FontFace` union, and `darkColors: ThemeColors` mean most of the
   single-font and token-completeness rules fail at compile time rather than at runtime.
2. **`npm run lint`** — clean against the new `eslint.config.js`. Specifically confirm it *catches*
   each rule by temporarily introducing a violation: a raw `#fff`, a `marginLeft`, a `Text` imported
   from `react-native`, and a deep `@/features/x/y` import.
3. **`npm start`** and open the gallery. This is the only way to confirm the font actually loaded —
   a failed load silently falls back to system fonts, which is easy to miss on Latin text. Check:
   - Arabic renders in IBM Plex Sans Arabic, not the system font. Compare a `weight="bold"` and a
     `weight="regular"` specimen side by side — **if they look identical, the weight→family map is
     broken**, which is precisely the Android failure this design exists to prevent.
   - Toggle scheme `both` — every component legible in both palettes, no invisible text.
   - Toggle direction `rtl` — chevrons flip, `align="end"` follows, rows mirror.
   - Toggle locale `ar` — `formatCount` shows Arabic-Indic digits, `٩٩+` caps correctly.
4. **Physically verify the three bug fixes** — open a `BottomSheet` (backdrop translucent, sheet
   visible), view the `FAB` in dark mode (shadow dark, not white), and watch a `Skeleton` pulse.

Run on **both** an Android device and iOS: the weight-synthesis bug, the dashed border, and
`TextArea` top-anchoring are all platform-specific and all invisible on the other platform.

Finally, `git status` should show `tokens.ts` deleted and `App.tsx`/`index.ts` staged as deleted —
the repo currently has those two deletions unstaged from a previous session.


## **[Updated 2026-09-01 — icon layer now renders Figma's own paths]**

The `Icon renderer = MaterialCommunityIcons` decision above is SUPERSEDED. `Icon.tsx` now
renders the vector paths exported from Figma's `Icon` component set (`81:699`) through
`react-native-svg@15.15.4`, so the glyphs are the design's own drawings rather than a
different draftsman's lookalikes. The API (`name`, `size`, `color`, `mirrorInRtl`) and the
strict `IconName` union are unchanged — that union is exactly what made the swap a one-file
change, as this plan predicted.

Two consequences worth recording:

1. **Stroke width is now a real value, not baked into a glyph font.** Every path renders at
   the design's 1.6 on a 20x20 canvas and scales with `size`. The "accepted trade" recorded
   in the decision table no longer applies.
2. **`@expo/vector-icons` stays a dependency** even though nothing in `src/` imports it —
   `expo-router` imports it internally (`native-tabs`, `primitives`). It is an undeclared
   peer; do not remove it. The MaterialSymbols font in the bundle is expo-router's.

### Flags resolved by the Figma icon-set completion

**Flag 2 (four glyphs missing from the Figma set) is CLOSED.** The set went 23 → 34 on
2026-09-01. Seven glyphs (Home, Tickets, Customers, Search, Plus, Inbox, CheckCircle) already
existed as inline artwork inside BottomNav, SearchField, FAB and StatCard and were promoted
into the set unchanged in shape, normalised from their native 14/16/24px and 1.166–2.0 strokes
onto 20×20 / 1.6. Four (Close, Alert, Edit, EyeOff) existed nowhere in the file and were drawn
to spec — **these four still need a design review.**

**Flag 1 (ArrowLeft / Chevron are physical names) stays OPEN, and is now sharper:** Figma
draws `ArrowLeft` as a CHEVRON, not an arrow with a shaft. The app previously rendered
Material's `arrow-left`, so that icon was wrong on every screen regardless of the naming
question. It now matches the design. The naming question itself is unchanged.

### New findings raised to design, not resolved here

1. The source components still carry inline copies of the seven promoted glyphs rather than
   instances of the new symbols. Swapping them is a separate change.
2. `BottomNav Active=Profile` draws its icons at 22px; the other three variants use 24px.
3. **There are no filled icons in the design.** Active tabs are the same glyph in `tabActive`
   blue — verified across all four BottomNav variants: geometry is byte-identical, only the
   stroke colour differs. The app's `homeFilled` / `ticketsFilled` / `customersFilled` /
   `userFilled` names were an invention and have been removed; `IconName` is 38 → 34.
   `(tabs)/_layout.tsx` now renders one glyph per tab and swaps colour only.
