# Auth — Splash — design audit

**Figma:** `7:1891` ("Auth - Splash", inner `7:1896` = `SplashScreen`) · **Code:** `app.json:25-31` + `src/core/lib/bootstrap.ts` + `src/app/_layout.tsx`
**Verdict:** major drift

## Summary

This screen has no React implementation by design — it is the native splash, driven entirely by
the `expo-splash-screen` config plugin. The *timing* half is correct and matches the auth story
plans exactly: the splash is held at module scope and released only after `bootstrap()` resolves
**and** the session read leaves `loading`. The *visual* half is essentially unimplemented:
`app.json:30` registers `"expo-splash-screen"` as a bare string with no props, so the plugin's
defaults apply — `backgroundColor: '#ffffff'` and **no image at all**. Figma designs a
`colors.background` (`#f8f9fb`) field with the 123×122 AZM mark centred in it; what ships is a
blank white screen. The single most important fix is to give the plugin a real config block
(image + background + dark variant) and export the AZM mark at splash resolution.

## Findings

### 1. No splash image — the AZM mark never appears — `blocker`
- **Axis:** structure & order / component identity
- **Figma:** `7:1896` is a centre-aligned flex column whose only child is vector `51:5101`, the AZM
  mark at 123×122, filled `colors.primary` `#1a56db`. It is the entire content of the frame.
- **Code:** `app.json:30` — `"expo-splash-screen"` is registered as a bare plugin string with no
  props object. `node_modules/expo-splash-screen/plugin/build/getAndroidSplashConfig.js:14` and
  `getIosSplashConfig.js:12-13` show `image` resolves to `undefined` when unset, so no drawable /
  storyboard image is generated on either platform. There is no top-level `expo.splash` key either
  (`app.json:1-37`), and no `app.config.js`.
- **Fix:** replace the bare string with
  `["expo-splash-screen", { "image": "./assets/brand/azm-mark@splash.png", "imageWidth": 123, "resizeMode": "contain", "backgroundColor": "#f8f9fb", "dark": { … } }]`.

### 2. Splash background is `#ffffff`, Figma binds `colors.background` `#f8f9fb` — `major`
- **Axis:** token fidelity
- **Figma:** `get_variable_defs` on `7:1891` returns `"colors.background": "#f8f9fb"`; the
  `SplashScreen` frame's fill is that variable. In the app's token layer that is
  `primitives.neutral50` (`src/core/lib/theme/primitives.ts:16`) → `lightColors.bgCanvas`
  (`src/core/lib/theme/colors.ts:10`) — the same token `LoginScreen.tsx:35` paints behind the
  login form.
- **Code:** `app.json:30` — unset, so the plugin default `backgroundColor: '#ffffff'`
  (`getAndroidSplashConfig.js:12`, `getIosSplashConfig.js:13`) applies. The splash is
  `neutral0`, the login screen it hands off to is `neutral50` — a visible one-step tonal jump at
  the exact moment of the handoff.
- **Fix:** set `backgroundColor: "#f8f9fb"` in the plugin props.
- **Architecture note:** `app.json` is static JSON and cannot read `primitives.ts`, so this hex
  *must* be duplicated as a literal outside `primitives.ts`. Hard rule 2 is eslint-scoped to `src/`
  so this does not trip the gate, but it is a genuine token-drift hazard: add a comment in
  `primitives.ts` pointing at `app.json` so the two are changed together.

### 3. No dark splash variant under `userInterfaceStyle: "automatic"` — `major`
- **Axis:** dark theme
- **Figma:** the file contains exactly one splash frame — a scan of every frame name on the Screens
  page (`0:1`) returns only `Auth - Splash` / `SplashScreen`, no dark counterpart. So design has
  **not** specified a dark splash; this needs a design decision as well as a code fix.
- **Code:** `app.json:8` sets `"userInterfaceStyle": "automatic"` and `colors.ts:64-110` ships a
  full dark palette (`darkColors.bgCanvas` = `primitives.neutral1000`). `app.json:30` supplies no
  `dark` block, and `getAndroidSplashConfig.js:19-27` leaves `dark.backgroundColor` /
  `dark.image` undefined, so a device in dark mode gets the same white splash and then flashes
  straight into a near-black `bgCanvas`.
- **Fix:** add `"dark": { "backgroundColor": "<darkColors.bgCanvas hex>", "image": … }` once design
  confirms the dark mark treatment (the `#1a56db` mark on a near-black field is low-contrast; the
  dark palette's `bgPrimary` is `blueLight`, which is the likely answer).

### 4. `assets/splash-icon.png` is the untouched create-expo-app placeholder — `minor`
- **Axis:** structure & order
- **Figma:** n/a.
- **Code:** `assets/splash-icon.png` — a 1024×1024 grey grid-and-concentric-circles template image.
  Nothing references it (`grep` across `src/`, `app.json`, `assets/` returns no hit; the only brand
  asset reference in the repo is `src/features/auth/screens/LoginScreen.tsx:16` →
  `assets/brand/azm-mark.png`).
- **Fix:** delete it, or replace it with the real splash export so that anyone wiring finding 1 by
  its obvious filename gets the right image rather than the placeholder.

### 5. `azm-mark.png` is too small to serve as the splash asset — `minor`
- **Axis:** token fidelity (asset resolution)
- **Figma:** vector `51:5101` at 123×122 logical px.
- **Code:** `assets/brand/azm-mark.png` is **192×189** (PNG IHDR). Rendered at 123pt that is only
  ~1.56×; @3x needs ~369×366, and the plugin generates all five Android densities from one `image`
  when per-density keys are absent (`getAndroidSplashConfig.js:15-19`). Using it as-is would ship a
  soft mark on every modern device. It is also fine at its current use — `LoginScreen.tsx:47`
  renders it at 64×63, i.e. exactly @3x.
- **Fix:** export a dedicated splash-resolution PNG (≥ 384px, transparent background) from the
  Figma vector rather than reusing the login asset.

### 6. `adaptiveIcon.backgroundColor: "#E6F4FE"` is a template leftover — `minor`
- **Axis:** token fidelity
- **Figma:** not part of frame `7:1891`, but the same brand surface.
- **Code:** `app.json:14` — `#E6F4FE` is the create-expo-app default pale-cyan, and appears nowhere
  in `src/core/lib/theme/primitives.ts`. It is the colour a user sees behind the app icon that
  launches this splash.
- **Fix:** set it to an AZM palette value (`#f8f9fb` to match the splash field, or a brand blue),
  and note the duplication alongside finding 2.

### 7. `bootstrap()` rejection would hold the splash forever — `minor`
- **Axis:** states
- **Figma:** n/a — no error state designed for this frame (correctly; a native splash has none).
- **Code:** `src/app/_layout.tsx:23` — `void bootstrap().then((value) => …)` has no `.catch()`, and
  `_layout.tsx:31` returns `null` while `result` is null, so an unexpected rejection leaves the
  splash up with no recovery path. In practice every dependency is individually guarded
  (`i18n/index.ts:38`, `i18n/index.ts:99`, `ThemeProvider.tsx:88`, `fonts.ts:36`, and
  `session-context.tsx:44` on the session read), so this is defence-in-depth rather than a live
  bug — but the failure mode is the worst possible one (a permanently frozen launch).
- **Fix:** add a `.catch()` that logs and resolves with safe defaults so the app always reaches
  first paint.

### 8. The bootstrap hold and the two-condition splash release — `intentional`
- **Axis:** states
- **Plan:** `.squad/plans/auth/02-story-agent-login-SCRUM-17.md:522-549` task 13 ("Move the splash
  hide so it waits for **both** bootstrap and the session read"), and
  `.squad/plans/auth/18-story-session-persistence-SCRUM-18.md:30,73,87`.
- **Code:** `src/core/lib/bootstrap.ts:26` holds the splash at module scope (before React mounts);
  `_layout.tsx:31` gates the whole tree on `result`; `_layout.tsx:57-61` calls `hideSplash()` only
  once `status !== 'loading'` and returns `null` until then. Because `RootNavigator` cannot mount
  before `result !== null`, the "both conditions" requirement is satisfied structurally rather than
  by an explicit `&&`. Correct, and matches the plans.

## Verified correct

- Splash hold/release sequencing matches auth plans 02 and 18 exactly — no LTR flash window, no
  login-screen flash for an already-signed-in agent.
- `SplashScreen.preventAutoHideAsync()` is called at module scope (`bootstrap.ts:26`), not in an
  effect, with the harmless already-hidden rejection swallowed.
- `hideSplash()` (`bootstrap.ts:43-49`) is idempotent — the already-hidden throw is caught.
- The session read cannot hang the splash: `session-context.tsx:43-51` catches and falls back to
  `signedOut`.
- **RTL:** nothing to check — the frame is a single centred mark with no directional content, and
  the native splash has no layout props at all. Not a risk on this screen.
- **Component identity:** n/a — there is no React screen and correctly should not be one; a JS-drawn
  splash would reintroduce the pre-first-paint flash the whole bootstrap design exists to prevent.
- **Structure:** the design is one centred element; nothing in the frame is missing from the intended
  config beyond finding 1.
- **Open §15 flags:** this screen touches none of the ten flags in
  `.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md:532-566`.
- Figma's frame-level `stroke weight/1`, `corner radius/44`, `color/white/ 8%`, `color/blue/12` and
  `color/white/solid` variables belong to the device-mock chrome (`7:1892` "App" / `7:1895`
  "Container"), not the screen — correctly absent from the app.

## Needs a visual check

Everything visual on this screen is native config that only a **prebuild + device/simulator run**
can confirm. `npm start` in Expo Go will **not** show it — Expo Go renders its own splash. To verify:

1. `npx expo prebuild --clean` then `npm run ios` / `npm run android` on a real build, and watch the
   cold-start frames: background colour, whether the mark appears, and its rendered size vs Figma's
   123pt.
2. The **handoff seam** — whether the transition from native splash to the first React frame is
   seamless or shows a flash. Statically the colours differ (finding 2), so a flash is likely, but
   only a run confirms the magnitude.
3. **Dark mode cold start** (finding 3) — set the device to dark and cold-start; confirm whether the
   white→near-black jump is as jarring as predicted.
4. **Arabic cold start** — the whole point of the bootstrap hold. Confirm no LTR frame is visible
   before the login screen paints RTL.
5. **Web** (`npm run web`) — `expo-splash-screen` has no native splash there, and `_layout.tsx:31`
   returns `null`, so the bootstrap window is a blank page rather than a branded one. Whether that
   window is perceptible depends on bundle load time; Figma does not design a web splash.
