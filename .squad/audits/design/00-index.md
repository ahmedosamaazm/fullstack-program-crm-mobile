# Design audit — AZM CRM vs Figma `mdfP8RPdkUsKcJb0wFdkME`

Read-only audit run 2026-09-01 against the Screens page (`0:1`). Fifteen built screens,
one agent per frame, all following `AUDIT-GUIDE.md`. **No source file was changed.**

Three frames were deliberately excluded as not built: `Tickets - Add Attachment (Sheet)`
(`8:4735`), `Tickets - Attachment Preview` (`8:4847`) — both blocked on Supabase Storage —
and `Notifications - List` (`7:3066`), not started.

## Scoreboard

| Screen | Figma | Verdict | B | M | m | flag | int. |
|---|---|---|--:|--:|--:|--:|--:|
| [Home - Dashboard](home-dashboard.md) | `7:8` | major drift | 1 | 5 | 10 | 2 | 1 |
| [Tickets - Detail](tickets-detail.md) | `7:1638` | major drift | 0 | 7 | 8 | 2 | 4 |
| [Tickets - Detail (History)](tickets-detail-history.md) | `187:1192` | major drift | 1 | 4 | 5 | 0 | 1 |
| [Customers - Detail (Info)](customers-detail-info.md) | `7:3544` | major drift | 2 | 1 | 5 | 0 | 3 |
| [Customers - Detail (Tickets)](customers-detail-tickets.md) | `7:4310` | major drift | 1 | 2 | 4 | 4 | 3 |
| [Profile - Home](profile-home.md) | `7:4492` | major drift | 0 | 5 | 4 | 2 | 7 |
| [Auth - Login](auth-login.md) | `7:4614` | major drift | 1 | 1 | 5 | 3 | 2 |
| [Auth - Splash](auth-splash.md) | `7:1891` | major drift | 1 | 2 | 4 | 0 | 1 |
| [Tickets - New Ticket](tickets-new.md) | `7:4009` | minor drift | 0 | 3 | 8 | 4 | 4 |
| [Tickets - Assign Agent (Sheet)](tickets-assign-sheet.md) | `7:4118` | minor drift | 0 | 3 | 6 | 1 | 2 |
| [Tickets - Change Status (Sheet)](tickets-status-sheet.md) | `7:4232` | minor drift | 0 | 3 | 5 | 2 | 4 |
| [Tickets - List](tickets-list.md) | `7:348` | minor drift | 0 | 2 | 5 | 3 | 3 |
| [Customers - List](customers-list.md) | `7:1920` | minor drift | 0 | 2 | 6 | 2 | 3 |
| [Customers - New Customer](customers-new.md) | `7:2799` | minor drift | 0 | 3 | 3 | 3 | 6 |
| [Auth - Reset Password](auth-reset-password.md) | `7:4687` | **blocked** | 0 | 1 | 1 | 4 | 1 |
| **Total** | | | **7** | **44** | **79** | **32** | **45** |

`Auth - Reset Password` is not implemented at all — a 21-line placeholder. Story 02 created
it as such and deferred the flow to **US-003, which has no story file and no plan entry**.
That is a scheduling gap, not a code gap, and it is the only screen in the file with nothing
to audit.

## The headline: the figure/ground layer was never implemented

**Six independent agents, auditing six unrelated frames, converged on one root cause.**
Figma composes this app as white `bgSurface` cards and rows, separated by hairlines and
lifted by `e1`/`e2` elevation, on a grey `bgCanvas`. The app renders most of that as flat,
undifferentiated sheets.

| Screen | Symptom |
|---|---|
| Home - Dashboard | Both ticket bands render on `bgCanvas` with no surface, border or elevation |
| Customers - List | `CustomerRow` sets no background — white-on-grey becomes grey-on-grey |
| Tickets - List | `TicketRow` has the same omission |
| Customers - Detail (Info) | The `InfoCard` wrapper does not exist; rows are edge-to-edge on white |
| Customers - Detail (Tickets) | Tab body is `bgSurface` — inverted, so white cards vanish |
| Tickets - Detail | Every designed hairline missing: header, tab bar, AI bar, message rows |
| Tickets - Detail (History) | Missing row divider |
| Profile - Home | No elevation on the identity card or any of the three `RowGroup`s |

Fix this as one coordinated change, not eight screen fixes. It is the highest-value item in
the audit and accounts for 5 of the 7 blockers. No single per-screen file could have named
it — it only exists as a finding at the roll-up level.

## Cross-screen primitive fixes — one line, many screens

Ordered by reach. "Found by" is the number of agents that reported it independently, from
different frames.

| # | Primitive | Defect | Screens | Found by |
|--:|---|---|--:|--:|
| 1 | `TextField.tsx:84,87` | Inset `spacing.md` (12); Figma binds `spacing.lg` (16) | every form | 3 |
| 2 | `BottomSheet.tsx:141` + `SheetHeader.tsx:39` | Content pad `spacing.xl` (24); Figma 16. Rows correctly bleed back to 16, so content sits 8px out of line | all 3 sheets | 2 |
| 3 | `Tab.tsx:66` | `TabBar` has no `paddingHorizontal`, gap `lg` not `xl` — tabs flush to screen edge | ticket + customer detail | 2 |
| 4 | `StatusBadge` | Renders `caption` 12px sentence-case; Figma is 10px uppercase + 0.25 tracking. The correct `overline` ramp already exists and is unused | 5 screens | 2 |
| 5 | `SectionHeader.tsx:39` | `tone="secondary"` `#44474f`; Figma binds `#74777f` (→ `textMuted`) | tickets + customers lists | 2 |
| 6 | `TicketRow.tsx:40-41` | Priority is a full-height `borderStartWidth`; Figma is an inset 3×41 `radius.full` pill, so bars merge across adjacent rows | 4 screens | 2 |
| 7 | `ListScreenHeader.tsx:57` | Zero gap between `SearchField` and chip row; Figma and the story plan both say `spacing.sm` | tickets + customers lists | 1 |
| 8 | Sheet grabber | 40px/`borderStrong`; Figma 36px/`borderDefault` | all 3 sheets | 2 |
| 9 | Sheet backdrop | Animates to `opacity.strong` (0.6); Figma overlay alpha is 0.4 (`opacity.medium`) | all 3 sheets | 2 |
| 10 | `Button` | No `size` prop, hard-coded 56px height — so small pills get hand-rolled instead | Home claim pill | 1 |

**Component identity (axis 2) came out well.** Screens overwhelmingly use the real primitives.
The only genuine re-implementations found were the composer's attach/send buttons
(`ReplyComposer.tsx:58-66,86-103`, where Figma names `IconButton` variants) and Home's claim
pill — and the latter exists only because `Button` lacks the `size` prop its plan assumed.

## Defects surfaced that are not styling

The audit was scoped to design fidelity; these came out of it anyway and are worth routing
to their owners.

1. **`CustomerForm.tsx:82-86`** — duplicate-phone `setError` is keyed on a boolean, so a
   second identical duplicate submit clears the error and shows nothing. Breaks story 22's
   acceptance path.
2. ~~**`(tabs)/_layout.tsx:63`** — `BottomNav` sets `shadowColor: theme.colors.textPrimary`,
   producing a **white halo in dark mode**.~~ **Fixed** — verified by story 26 (SCRUM-13):
   that line is `...theme.elevation.e2`, and `core/lib/theme/elevation.ts:49-50` already
   builds the light and dark shadows off `neutral900`/`black`. Do not re-fix working code.
3. ~~**`app.json:30`** — `expo-splash-screen` registered as a bare string with no props, so
   `image` is `undefined` on both platforms. The splash mark never renders.~~ **Fixed** —
   verified by story 26: the plugin is registered in the full array form with `image`,
   `imageWidth`, `resizeMode`, `backgroundColor` and (as of that story) `dark`.
4. **`LoginScreen.tsx:145-147`** — the footer `LanguageToggle` is commented out. In an
   Arabic-first app there is currently no way to reach Arabic before signing in.
5. **`ContactStrip.tsx:23`** — drops the customer's company. Figma and the story plan both
   specify `company · department`, and `TicketDetail` carries no company field at all, so
   this needs a data-layer change, not a style fix.
6. **`HistoryRow`** — reassignment never reads `event.fromValue`, so "Reassigned from X to Y"
   renders identically to "Assigned to X".
7. **`CreateTicketScreen`** — `Create` has no loading affordance beyond the label greying, so
   a slow insert looks like a dead tap.

## The story plans are a second source of drift

**Six plan-level errors across five audits** — in the plan files, not the code. Fixing only
the code lets these regenerate on the next story that reads them.

- `plans/home/03-…SCRUM-37.md` — the `StatCard` spec table is **stale**: live Figma `36:40`
  is radius 16 / 26px squircle / 19px value / 10px label; the table says 12 / 32px circle / 22 / 12.
- `plans/home/03-…SCRUM-37.md` — prescribes `<Button variant="primary" size="sm">`, an API
  that does not exist. `Button` has no `size` prop.
- `plans/profile/06-…SCRUM-46.md` — identity card recorded as avatar 40 / name 16/24; the
  live frame is 52 and 18/26. A transcription error, not a justified deviation.
- `plans/auth/02-…SCRUM-17.md` — two Login token drifts (tagline tone, wordmark weight)
  originate in the plan's own spec table.
- `plans/customers/10-…SCRUM-24.md` — written against the *Tickets* frame because the Info
  frame's node id was unavailable (its own open question 1). Frame `7:3544` now contradicts it,
  so two "findings" against this screen are really design-confirmation questions.
- `plans/customers/14-…SCRUM-25.md` — the spec table already names `bgCanvas` for the tab
  body; it was simply never implemented. It also claims the priority rail is "already exact",
  which is not the case.

## Questions for design — do not resolve these in code

The ten open §15 flags stand. This audit adds evidence to four and raises four new ones.

**Reinforced:**
- **§15 flag 3** (`SectionHeader` uppercase + `tracking.wide` in Arabic) — now touched by
  7 screens. Customers List renders the first *translated* section label (`"أخرى"`), and
  Profile is its first real Arabic consumer. This needs a decision, not more evidence.
- **§15 flag 6** (Figma omits error/disabled/loading) — scoped to form controls, but the audit
  found it at screen level across the file: six screens implement state paths Figma never drew.
  Figma should gain the variants or explicitly cede the territory.
- **§15 flags 5 and 7** — confirmed live on Login, Profile, both lists and New Ticket.

**New:**
1. **No dark splash frame exists** in the file, under `userInterfaceStyle: "automatic"`.
   Story 26 (SCRUM-13) added a `dark.backgroundColor` to the plugin config so the native
   splash at least matches dark `bgCanvas`; **the Figma frame is still owed.**
2. **`pending` has no status colour token.** The code comment saying "no purple exists" is
   stale — story 07 added `bgInternalSubtle`/`textInternal`. Most visible on Tickets List.
   Story 26 replaced that stale comment and separated `pending` from `closed` **by shape**
   (`closed` is now an outlined pill), which closes the accessibility half. **The hue is
   still a design decision** — `bgInternalSubtle`/`textInternal` measure well for the job
   (5.65 light / 8.97 dark) but `colors.ts` reserves them for internal notes.
3. **No sheet is designed for the Language / Theme pickers** — the frame has only the tab's
   home state, so the sheet presentation is an implementation decision needing sign-off.
4. **Off-scale values bound in frames.** Reset Password binds `font size/13`,
   `line height/19_5`, `corner radius/44`; Tickets List binds a 13.5 subject size. None have
   a step in the token scales, so the code snaps and silently drifts.

Additionally, `app.json` cannot import `primitives.ts`, so the splash background hex must be
duplicated outside the token layer. That is a permanent, unavoidable hole in hard rule 2 —
worth documenting in `CLAUDE.md` rather than treating as a fixable defect.

## Needs a running app

Static analysis could not settle these. Deliberately short — a visual-check list, not a
re-audit.

- **Splash** — requires a prebuild; Expo Go substitutes its own. Blocks 4 splash findings.
- **Change Status sheet** — note-expanded, it has no `ScrollView`/`KeyboardAvoidingView`,
  so the submit button may be unreachable on a small device.
- **Login** — keyboard occlusion, and the fixed-colour brand PNG on a dark canvas.
- **Dropzone on Android** — §15 flag 8's dashed-border-renders-solid issue, on hardware.
- **Tickets List** — possible header hairline, FAB shadow weight, trailing-column baselines.

## Suggested order

1. **The figure/ground layer** — one coordinated change; clears 5 of 7 blockers.
2. **Primitive fixes 1–6** — highest reach per line changed, all multiply corroborated.
3. **The seven non-styling defects** — real bugs, independent of any design decision.
4. **Correct the six plan files** — before they regenerate the drift.
5. **Take the design questions to design as one batch**, with this document as the evidence.
6. **Primitive fixes 7–10 and the per-screen minors** — by this point most will already be
   resolved or made trivial.

Steps 1–3 are unambiguous and can start immediately. Step 5 gates a meaningful share of the
remaining `flag` items, so it is worth opening early even though it sits late in the order.
