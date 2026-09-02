## TF-02 (SCRUM-13) — open with design

Both of these were put to design as a pair with the measured numbers attached, and **both have a
fallback that has already shipped**. Neither criterion is ticked on the strength of its fallback:
`:390` is met by the *shape* and *glyph* cues below, not by the colour half.

- [ ] **`pending` has no status colour token, and `closed` used to share its surface.** Figma
      renders `pending` lavender. The palette does now carry a purple —
      `bgInternalSubtle`/`textInternal`, which measure **5.65 light / 8.97 dark** and would do the
      job — but `core/lib/theme/colors.ts` reserves them in writing for internal notes, so reusing
      them is a **design decision, not an implementation shortcut**. Do not do it unilaterally.
      **Shipped fallback:** `pending` stays on `bgSurfaceSunken`; `closed` became an **outlined**
      pill (`bgSurface` + a `borderInteractive` hairline). That separates the two by shape, which
      survives dark mode, greyscale and colour-blindness alike. It matters most in dark, where
      `bgSurfaceSunken` **is** `bgCanvas` (`#0c1014`, ratio 1.00): both badges were previously a
      geometrically invisible rectangle on any screen background. **Design still owes `pending` a
      hue.**
- [ ] **Dark `statusDanger` and `statusWarning` have identical relative luminance** (ratio 1.00 —
      two pale pastels). A dark palette cannot separate them by luminance without a new hue.
      Options measured, all keeping ≥ 8:1 against the dark card: warning → `ffd88a` (1.25 vs
      danger) or `ffe08a` (1.32), or danger → `ff8a80` (1.34). **None reaches 3:1.**
      **Shipped fallback:** `urgent` and `high` now differ by **glyph** in `TicketRow` — a triangle
      (`alert`) vs a circle (`info`) — which satisfies WCAG 1.4.1 without a new hue. The two
      colours remain indistinguishable in greyscale and to a deuteranope. **Design picks, or the
      glyph stands alone.**
- [ ] **Dark `bgTabActive` is 1.08 against the bar it sits on** — the pill is invisible.
      `colors.ts` already flagged the dark value as a placeholder (Figma specifies the pill in
      light mode only); the measurement is now attached to that flag. **Design owes a dark pill
      value or an explicit "no pill in dark".**
- [ ] **Light `bgSurfaceRaised` is identical to `bgSurface`** (both `neutral0`), so
      `SegmentedControl`'s track and `Avatar`'s neutral variant have no ground on a white card.
      This is story 01's Figma mapping, **not a contrast failure** — raised is meant to read by
      elevation, and `elevation.ts` supplies it. `npm run contrast` emits it as a warning.
      **Confirm with design that elevation alone is the intended separation** before anyone
      re-points the alias.

**Two token pairs are structurally impossible to fix by re-pointing an alias — do not try.**
Dark `bgSurfaceSunken` cannot be pulled off `bgCanvas` because "sunken" must be darker than
`bgSurface` (`neutral900`) and `neutral1000` is the bottom of the ramp. Moving dark `bgCanvas` to
`black` was evaluated and **rejected**: `bgOverlay` is already `black`, so `BottomSheet`'s backdrop
and `AttachmentViewer` would vanish into the canvas. `scripts/contrast-audit.ts`'s figure/ground
block asserts both invariants as warnings so this is caught in CI rather than on a device.

- [ ] **The eslint hex rule has a hole: it does not fire on an interpolated or wrapped colour.**
      `eslint.config.js`'s `HEX_LITERAL` anchors `^#…$` on a **whole string literal**, so
      `` `#${shade}` `` and `'rgba(26,86,219,0.5)'` both pass unflagged. Not currently exploited —
      the only non-hex colour string in `src/` today is `'transparent'` (six sites: `Button`,
      `FilterChip`, `IconButton`, `SegmentedControl`, `Tab`, `ReplyComposer`), which is
      theme-neutral and correct. **Deliberately not fixed by SCRUM-13** — tightening the selector
      is a lint change with repo-wide blast radius. The plain-hex path *is* verified: a probe
      `const x = '#ff0000';` in `Button.tsx` fires the rule (re-run before trusting it).

## Documentation debt
- [ ] TF-04 point total wrong in remaining-stories snapshot (23 vs 28)
- [ ] SCRUM-46 missing from backend-readiness classification

## Deferred defects
- [ ] SegmentedControl needs explicit width, not shrink-wrap — fixed in
      LanguageToggle, check other usages

## Verification gaps
- [ ] **TF-02 (SCRUM-13) — the automated half is done; every device check is still OPEN.**
      `npm run contrast` passes (0 failures, the 2 expected figure/ground warnings, 3 documented
      exemptions), `npm run lint` and `npm run typecheck` pass, and the hex rule is confirmed to
      **fire**. None of the following has been observed on hardware, and none may be ticked until
      it is. **A development build is required, not Expo Go** — story 25's `expo-updates` already
      forces one, and the splash frame is invisible in Expo Go regardless.
      **(a) BRD `:386`, system preference on first launch.** Clear app data (`adb shell pm clear`,
      or delete/reinstall on iOS), set the OS dark, cold start: must open dark with no light frame.
      Read-verified only — `ThemeProvider` seeds `systemScheme` from `Appearance.getColorScheme()`
      and `bootstrap()` resolves the persisted mode before first paint, so this is *structurally*
      correct. **A hot reload does not test it.**
      **(b) BRD `:387`, manual override survives a restart.** Profile → Theme → Light while the OS
      is dark, force-kill, cold start: must reopen light.
      **(c) BRD `:388`, instant switch, plus mode pinning.** All three modes must re-colour on the
      same frame with the sheet still open; and with the mode pinned to `light`, flipping the OS to
      dark must change **nothing**.
      **(d) BRD `:390` greyscale check.** Open the Tickets tab in both themes with a ticket in each
      of the five statuses and each of the four priorities, screenshot, convert to greyscale, and
      confirm `pending` vs `closed` and `urgent` vs `high` both survive. This is the only check
      that catches a hue-only fix.
      **(e) The dark-mode visual sweep — never run.** Every route in dark, mode pinned to `dark`:
      `(auth)/login`, `(auth)/forgot-password`, `(tabs)/index`, `(tabs)/tickets`,
      `(tabs)/customers`, `(tabs)/profile`, `tickets/[id]` (all three segments), `tickets/new`,
      `customers/[id]` (Info, Tickets, Notes), `customers/new`, `customers/edit/[id]`,
      `notifications` — each in all four states (loading/empty/error/populated) plus every sheet
      reachable from it. **A screen that passes gets a written line saying it passed**; an
      unwritten pass is indistinguishable from a pass that never happened, which is the state this
      story inherited. Six things to look at specifically: `LoginScreen`'s fixed-colour brand PNG
      on a `neutral1000` canvas; the `bgTabActive` pill (expect invisible, 1.08); the
      `SegmentedControl` track; `Skeleton`'s shimmer on a dark card; **elevation** — dark shadows
      are built off `black`, so on a `neutral1000` canvas raised surfaces may lose separation
      (check `FAB`, `BottomNav`, any `e3`+ card); and `OfflineBanner` (airplane mode, both themes).
      **(f) The three chrome surfaces SCRUM-13 added.** Pin `dark` while the **OS is light** and
      confirm the status-bar glyphs go light — that is the exact case `userInterfaceStyle:
      "automatic"` gets wrong and the only reason `ThemedStatusBar` exists. Push `tickets/[id]` and
      present `tickets/new` in dark and confirm **no white wipe**. Rebuild, set the OS dark, cold
      start, and watch the splash. A half-applied task 6b — `app.json` edited, no rebuild — shows
      the *old* light splash with no error: it looks fixed and is not. **Rebuild before judging.**
      **(g) Light-mode and RTL regression.** Every token change except the dark pressed state
      touches **both** schemes. Walk the Tickets tab, a ticket detail and the customer form in
      **light** and confirm the heavier input outline and the outlined `closed` pill still read as
      designed rather than turning `TextField` into a boxed control no Figma frame shows. Then run
      the Tickets tab in Arabic, both themes, and confirm the new badge outline and the priority
      glyph land on the correct side.
- [ ] **TF-01 (SCRUM-12) — four criteria need a device and have never been run.** The code work is
      done (see Resolved); these are observations nobody has made:
      **(a) BRD `:373`, no LTR flash on cold start in Arabic.** `core/lib/bootstrap.ts:28-41` is
      built to guarantee it and is *structurally* correct — `src/app/_layout.tsx` renders `null`
      until bootstrap resolves — but it needs a real cold kill (task-switcher swipe, or
      `adb shell am force-stop`) with Arabic persisted, plus the same with English, plus a
      no-stored-preference launch on an Arabic-locale device. **A hot reload does not test this.**
      **(b) BRD `:377`, `Intl` present on device.** Every formatter in `core/utils/format.ts` and
      i18next's Arabic plural selection depend on `Intl.NumberFormat` / `DateTimeFormat` /
      `RelativeTimeFormat` / `PluralRules` existing in Hermes. `ar.json` carries **18** plural-form
      keys (`_zero`/`_two`/`_few`/`_many`) that fall back silently to `_other` — grammatically
      wrong Arabic, no error — if `Intl.PluralRules` is absent. **Verify on a native build; the web
      target uses the browser's `Intl` and passes regardless.** Also check `isolateLtr`
      (`format.ts:142-144`) keeps phone numbers LTR inside Arabic rows.
      **(c) BRD `:376`, Arabic strings do not clip or overflow.** No automated check exists and no
      pass has been made. Every screen, smallest supported width, both themes. Watch `FilterChip`
      rows, `StatusBadge`/`PriorityChip` pills, `Button` labels, `SegmentedControl` (already one
      documented width failure of this kind, above), `SettingsRow` label+value, and `TicketRow`'s
      reference+age line.
      **(d) BRD `:375`, icon mirroring — verified statically, not visually.** See the design
      question below.
- [ ] **TF-01 (SCRUM-12) — four icons are arguably directional and are not mirrored. Design
      decision needed.** `core/components/Icon.tsx:227`'s `DEFAULT_MIRRORED` is
      `['chevronForward', 'arrowBack', 'signOut', 'send']`. Audited against all 34 names in the
      `IconName` union (`:21-58`): those four are correct, `chevronDown` is correctly absent
      (vertical), and BRD `:375`'s two named must-not-mirror icons are correctly absent — though
      note **there is no `attachment` name; the paperclip is `paperclip`** (`:113`), and neither it
      nor `camera` (`:134`) is in the set. **Open:** `search` (`:188`) and `edit` (`:198`) are
      conventionally mirrored in RTL (magnifier handle, pencil tip); `message` (`:176`) has a
      directional tail; `paperclip`'s diagonal is directional. `phone` (`:94`) is conventionally
      *not* mirrored and is correctly absent. Left unchanged deliberately — this is a design call,
      not a bug, and belongs with the ten flags already open in
      `.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md` §15.
- [ ] **TF-01 (SCRUM-12) — two components format numbers without subscribing to locale.**
      `features/home/components/StatCard.tsx:51` (`formatNumber`) and
      `core/components/FilterChip.tsx:60` (`formatCount`) call a formatter but use neither
      `useTranslation` nor `useLocale`, so nothing in them reacts to a language change. **Not an
      active bug** — both are re-rendered by parent screens that do subscribe, and every ar↔en
      switch reloads the app anyway (both supported locales differ in direction). It is latent
      fragility: a future memoised parent, or a third locale sharing a direction with an existing
      one, would surface stale digits. Fix by passing the locale in or subscribing, if it ever bites.
- [ ] BRD `:722` (US-019, SCRUM-35) — `ticket_events` must reject UPDATE and DELETE for an agent
      JWT. PATCH is confirmed: RLS returns `200`/`204` with zero rows affected (no UPDATE policy
      exists on the table, so the row is invisible to the write — the correct outcome, just not a
      hard 403). **DELETE has not been run against a live agent JWT.** Run it and record the
      status code and row count before closing SCRUM-35.
- [ ] BRD `:849` (US-028, SCRUM-45) — **not met by this repository, and cannot be.** The first
      acceptance criterion asks for a **push** notification on ticket assignment. There is no
      `expo-notifications` dependency, no device-token table, and no sender in this client; the
      assignment trigger writes a `notifications` **row**, which the in-app centre reads, but no
      OS push is sent. Delivery is owned by SCRUM-40/41 (email notifications;
      `docs/phase1_backend_plan.md:238`). Recommend splitting `:849` off US-028 onto SCRUM-40/41
      rather than leaving it silently unchecked against a closed US-028.
- [ ] US-028 (SCRUM-45) — the client cannot INSERT/PATCH-cross-recipient against `notifications`
      per `docs/phase1_backend_plan.md:267` (no INSERT policy) and `:262-264` (`update_own`'s
      `with check`), but **neither has been fired at a live agent JWT from this repo** — the
      curl verification in `23-story-in-app-notification-centre-SCRUM-45.md`'s Verification
      Steps 1–2 needs a project URL, anon key and a real agent JWT this session did not have.
      Run both before closing SCRUM-45 and record the response bodies here.
- [ ] US-010 (SCRUM-26) gate (2), **download half** — BRD `:590`'s cross-branch **signed-URL**
      denial is still unproven. The **upload** half of this gate now passes (see Resolved), but
      signing is a separate policy path and has never returned a meaningful result: the earlier
      attempt got a `404`, which is **inconclusive** — there was no object at Alexandria's path,
      so nothing distinguishes "policy refused" from "file absent". **Put a real file in
      Alexandria's path with the service key first, then request a signed URL as Omar** and
      record the status and body. Until that runs, `:590` rests on the upload result and the
      policy text alone.
- [ ] US-010 (SCRUM-26) — iOS's camera/photo-library permission prompts are configured with
      English-only strings (`app.json`'s `expo-image-picker` plugin config), in an app that is
      Arabic-first everywhere else. `app.json` has no mechanism to localise them (that needs
      per-language `InfoPlist.strings`, which this project does not generate). Needs a product
      decision on whether this is accepted for phase 1.

## Schema drift
- [ ] **`trg_assignee_scope` exists in the database and in no document.** A trigger now rejects
      assigning a ticket to an agent outside that ticket's department or branch, raising
      *"Assignee is outside this ticket's department or branch"*. **Verified:** the invalid
      cross-branch case raises; the valid case passes. It is **not** in the original schema, not
      in `supabase_setup_guide.md`, and was not in `phase1_backend_plan.md` §1 until this entry
      was filed (§1 now lists it).
      **Found the hard way** — a cross-branch assignment produced a ticket its assignee could not
      read (RLS filtered it out of every list) plus an orphaned `notifications` row pointing at
      it. That is the pairing worth remembering: the assignment succeeded, the notification fired,
      and the target of both was invisible to the person notified.
      **The residual issue is process, not behaviour.** A trigger reached production without
      appearing in any schema document, which is exactly the failure mode
      `phase1_backend_plan.md` §11 (*Migrations & environments — 🔨 Not started*) predicts. Until
      migrations are tracked, this file cannot be trusted as a complete picture of what the
      database enforces. **Audit for other out-of-band objects** — `pg_trigger` and `pg_policies`
      against the documented set — rather than assuming this was the only one.

## Resolved
- [x] **TF-02 (SCRUM-13) — the contrast criterion is now a command, and the three real AA
      failures are fixed.** BRD `:389` had never been measured; it now runs as
      `npm run contrast` (`scripts/contrast-audit.ts`), a third gate beside `lint` and
      `typecheck` that reads the real `lightColors`/`darkColors` and exits `1` on any
      below-threshold pair (4.5 text, 3.0 UI). The pre-fix run reproduced exactly three distinct
      failures, and all three are closed:
      **(1) Dark primary-pressed.** `textOnPrimary` on `bgPrimaryPressed` measured **3.09** in
      dark. Dark `bgPrimaryPressed` now points at a new `blueLighter` primitive — **7.57**. This
      also corrects the *direction*: on a dark ground a press must brighten, not darken. Light is
      unchanged (6.70, already passing). Three consumers picked it up with no edit: `Button`,
      `FAB`, `IconButton`. **This is the only primitive the story added.**
      **(2) The input outline.** `borderDefault` measured **1.26 light / 1.84 dark** — the resting
      outline of `TextField`, `TextArea`, `SearchField` and `Dropzone` was effectively not there.
      All four moved to `borderInteractive` (**4.48 / 6.46**). **No token value changed** — this
      gave a token with *zero* consumers its first ones, and leaves `borderDefault` as the
      decorative alias it should always have been. `borderDefault` was deliberately **not**
      raised: `Button`'s secondary outline and six other components render it as trim, so
      repointing four call sites was the smaller change.
      **(3) The unselected chip outline.** `FilterChip`'s `borderStrong` border measured **1.69 /
      2.68** and is the only thing identifying an unselected chip as a control, so 1.4.11 applies.
      Now `borderInteractive`. `SheetHeader`'s grabber **keeps** `borderStrong` and carries a
      comment saying why: it is an affordance, not a control boundary, and the sheet is
      dismissible by tap and gesture without it. **Do not re-open it.**
      Also fixed alongside: `low` priority's rail moved off `borderDefault` (1.26/1.84 — no
      visible rail) onto `borderInteractive`, picked up by `TicketRow`, `PriorityChip` and
      `TicketDetailHeader`; and the three chrome surfaces the token layer could not reach —
      `ThemedStatusBar` (`expo-status-bar` was a dependency with **no importer**, so OS glyphs
      never followed the theme), `contentStyle`/`sceneStyle` on all three navigators (React
      Navigation's `DefaultTheme` was painting white behind every push and modal), and a `dark`
      splash frame in `app.json`.
      **Deliberately deferred, with reasons, above:** `pending`'s hue, the two identical dark
      pastels, the invisible dark tab pill, light `bgSurfaceRaised`, and the eslint hex-regex
      hole. **The whole device half of this story is still open** — see Verification gaps.
      Plan: `.squad/plans/foundation/26-story-theming-light-and-dark-SCRUM-13.md`.
- [x] **TF-01 (SCRUM-12) — "language switches instantly with no app restart" is now MET, with a
      note.** This entry previously sat under Deferred defects claiming the criterion could not be
      met and that there was no `expo-updates` in the project. Both halves are now false.
      **The decision (2026-09-01): meet BRD `:371` rather than reword or waive it**, via two layers.
      **Layer 1 — the visible half.** Direction is React state. `core/lib/i18n/locale-context.tsx`
      owns locale and direction and exposes `useLocale()`; `core/lib/i18n/direction.tsx`'s
      `useDirection()` now resolves `DirectionScope` → `LocaleProvider` → the latched native
      direction, in that order; and `core/components/DirectionRoot.tsx` puts Yoga's `direction`
      style on the root view. RN 0.86 is on Fabric, so every `start`/`end` inset and row order
      resolves against it. `Text` and `Icon` needed **no change** — both already called
      `useDirection()`, and both now react to a switch instead of reading a process-start constant.
      **Layer 2 — the guarantee.** Native surfaces that read `I18nManager.isRTL` directly (React
      Navigation transitions and gestures, `Modal`, `TextInput` writing direction, `ScrollView` RTL
      content offset) cannot see layer 1. `applyDirection()` already scheduled the native flip for
      the next launch; `core/lib/i18n/reload.ts`'s `reloadApp()` makes "next launch" happen now —
      `Updates.reloadAsync()` in production, `DevSettings.reload()` under `__DEV__`.
      **The agent restarts nothing**: they tap a language and the app is correct. The sub-second
      reload is an implementation detail of layer 2, not a restart they perform. This is recorded as
      met-with-a-note rather than silently ticked, as the previous entry demanded.
      **`settings.restartRequired` still exists and is now the FAILURE path only** — a reload that
      could not run (Expo Go, or `expo-updates` disabled). Both strings were reworded from
      *"Restart the app to apply the new text direction"* to say the language is applied and a
      manual restart finishes the layout, because layer 1 has already mirrored it.
      **Cost: `expo-updates` is the first dependency in this repo that requires a development
      build** and does not work in Expo Go. Under Expo Go `reloadApp()` takes the `__DEV__` branch,
      which exercises the flow but not `Updates.reloadAsync()`.
      Plan: `.squad/plans/foundation/25-story-localisation-and-rtl-SCRUM-12.md`.
- [x] **TF-01 (SCRUM-12) — the query cache no longer carries a language.** `localisedName` used to
      resolve department, branch and category names **inside** `api.ts`, baking the active language
      into every cached row while the query keys carried no locale — so a switch left every cached
      name in the old language. It is now a pure function taking an explicit locale
      (`core/utils/locale-name.ts`), wrapped by `core/hooks/useLocalisedName.ts` for the render
      layer. `api.ts` returns the raw `{ name_en, name_ar }` pair (exported as `LocalisedName`), so
      the cache is locale-independent and a switch needs **no invalidation and no refetch**.
      Changed contracts: `AgentProfileWithOrg.department`/`.branch`, `CustomerDetail.department`/
      `.branch`, `TicketDetail.category`, `TicketCategory.name` — each was a resolved
      `string | null` and is now the pair. `fetchCategories` still orders by `sort_order`, never by
      `name_en` (sorting by one language while displaying the other is the trap the intake names).
- [x] **TF-01 (SCRUM-12) — BRD `:378` (logical properties only) is VERIFIED, not just configured.**
      The lint rule was known to exist; nobody had confirmed it fires. A probe file containing
      `marginLeft`, `paddingRight`, `left`, `fontWeight` and `#ff0000` produced five errors — three
      physical-layout, one font-weight, one hex literal — from `eslint.config.js`'s
      `no-restricted-syntax` block. `npm run lint` is clean across `src/`.
- [x] **TF-05 (SCRUM-16) — `ProfileScreen`'s missing error state is FIXED.** A failed
      `useAgentProfile` previously fell back to a generic greeting, making it indistinguishable
      from a signed-in agent with no name. `IdentityCard` now renders an explicit error with an
      alert chip, and **distinguishes two failures**: `transient` (fetch failed → message +
      **Retry**, wired to `profile.refetch()`) and `unavailable` (query resolved with no row —
      RLS-hidden or absent → message, **no retry**, because retrying cannot help). Same split
      `CustomerDetailScreen.tsx:44-61` draws.
      **Deliberately not a full-screen `ErrorState`:** language, theme, notifications, app info
      and sign-out all work without a profile, and covering the screen would lock the agent out of
      signing out — the one action they may most need when their session is misbehaving.
      This was the last open gap in TF-05's per-screen coverage.
- [x] **TF-05 — the `tickets/[id]` crash-on-null is FIXED.** This entry previously read *"crashes
      rather than rendering an error state… Build the `null` branch."* That branch now exists:
      `features/tickets/screens/TicketDetailScreen.tsx:55` computes
      `detail.isError || detail.data === null` and `:67` renders `ErrorState` with a retry, so a
      ticket the agent cannot read shows an error state instead of taking the screen down.
      **One residual nit, not a defect:** unlike `CustomerDetailScreen.tsx:44-61`, which separates a
      permanent `null` (RLS-filtered or deleted — `ErrorState` with **no** retry) from a transient
      failure (retry offered), the ticket screen offers retry in both cases. Retrying a
      permanently-unreadable ticket can never succeed. Worth aligning with the customer screen's
      pattern, which is the better one.
- [x] **US-010 notes half — built.** `customer_notes` is in the generated types and the Notes tab
      now lists notes newest-first with author name and timestamp, plus a composer
      (`useCustomerNotes` / `useCreateCustomerNote`, keyed `['customers', id, 'notes']`).
      **One deviation from story 24 task 0's DDL:** the deployed `author_id` is **NOT NULL**,
      where the plan specified it nullable to leave room for a future system-written note.
      `CustomerNote.authorId` is typed `string` to match. `authorName` stays nullable — it comes
      from a `profiles` embed, which RLS can legitimately return empty for an author outside the
      reader's department.
- [x] **`src/core/types/database.ts` was UTF-16LE and broke `npm run lint`** (*"Parsing error:
      File appears to be binary"*). Introduced when the file was regenerated through a PowerShell
      redirect, which defaults to UTF-16LE on Windows PowerShell 5.1. Regenerated as UTF-8 —
      content byte-identical apart from the BOM, verified by diff. **Run `npm run gen:types` from
      a shell that writes UTF-8** (the Git Bash shell does; `powershell.exe`'s `>` does not), or
      the next regeneration silently breaks lint again and also defeats `grep` on the file.
- [x] **`customer_notes` table — now exists.** Deployed with the DDL specified in
      `.squad/plans/customers/24-story-customer-notes-and-attachments-SCRUM-26.md` task 0:
      `id`, `customer_id`, `author_id`, `body`, `created_at`, plus `select_notes` and
      `insert_notes` policies scoping through the parent customer's department and branch. **Both
      policies confirmed present.** No UPDATE or DELETE policy, so a note is immutable by
      omission — the `ticket_events` pattern. **The notes half of US-010 (BRD `:586`) is now
      buildable**; it was blocked on this table and nothing else. Regenerate
      `src/core/types/database.ts` (`npm run gen:types`) before building it — the notes code does
      not compile until `customer_notes` is in the generated types.
- [x] **SCRUM-26 gate (1) — `attachments` INSERT scoping. The finding was real, not a
      documentation gap.** `insert_attachments` carried `with_check: true` — meaning **any
      authenticated agent could create an `attachments` row pointing at any ticket or customer,
      including ones outside their own department and branch.** The `attachments` table has no
      `department_id`/`branch_id` of its own, so `true` was not merely permissive, it was the
      absence of any scoping at all. The policy has been **replaced with the same predicate as
      `select_attachments`**, so write scope now matches read scope. **Confirmed via
      `pg_policies`.** Worth keeping visible: this was found by asking where a documented
      guarantee (BRD `:256`, *CRU — own dept*) was actually enforced, and the answer was
      nowhere — the guarantee existed only in the BRD.
- [x] **SCRUM-26 gate (2), upload half — cross-branch upload is refused.** Run as Omar (Cairo)
      against Alexandria's storage path: **`403 AccessDenied`, *"new row violates row-level
      security policy"***. The `storage.objects` policies in `phase1_backend_plan.md:118-146` do
      enforce the branch/department path scoping they claim to. **The signing/download half of
      this gate is still open** — see Verification gaps.
