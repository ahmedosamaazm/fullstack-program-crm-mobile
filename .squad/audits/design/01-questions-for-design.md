# Questions for design — AZM CRM

Raised by the design audit of 2026-09-01 (`00-index.md`), which compared all fifteen built
screens against Figma `mdfP8RPdkUsKcJb0wFdkME`. Every item here is a **decision we are not
authorised to make in code**. Nothing below has been resolved unilaterally.

Grouped by what a decision unblocks. Items marked **`blocking`** are holding up work now.

---

## A. The ten §15 flags — four now have hard evidence

These were raised when the design system was first reflected in React Native
(`.squad/plans/design-system/01-...md` §15) and have stayed open. The audit did not
re-litigate them; it found out how much they now cost.

### A1. `SectionHeader` uppercase + `tracking.wide` in Arabic — **`blocking`**

*(§15 flag 3. Touched by 7 of 15 screens.)*

Arabic has no letter case, and letter-spacing pulls apart *joined* letterforms. Arabic
headers therefore read looser and lighter than their English counterparts, from the same
component.

What changed since the flag was raised:

- **Customers List renders the first *translated* section label** — `"أخرى"` (Other). This is
  no longer hypothetical.
- **Profile is the first screen with real Arabic section headers** — two of them.
- The same treatment also lands on `StatusBadge` (see B1) and the Assign sheet's `CURRENT` tag.

**Decision needed:** a locale-aware tracking token (tracking drops to `0` and casing to
`none` under `ar`), or an explicit written accept that Arabic headers look different.
We need one or the other before more screens inherit it.

### A2. Figma omits error / disabled / loading states — **`blocking`**

*(§15 flag 6. Scoped to form controls; the audit found it at screen level across the file.)*

Six screens implement state paths that **exist nowhere in the design file**: Login's field and
form-level errors, Tickets List's four non-populated states, History's loading/error/empty,
New Ticket's full error coverage, New Customer's, and the Change Status sheet's in-flight
dimming. All were invented by implementers, consistently, but unsigned-off.

The app uses React Hook Form; error state is not optional. The design file cannot stay silent
on it.

**Decision needed:** either Figma gains the variants (preferred — they are real UI), or design
explicitly cedes this territory and we document the app's own conventions as authoritative.

### A3. `Button` variant `Icon` (32) vs `IconButton` (36)

*(§15 flag 5. Confirmed live on Login, Profile, New Customer, Customer Detail.)*

Two components, one concept, 4px apart. Login's password reveal renders the 24px `IconButton`
where Figma specifies the 32px `Button/Icon`.

**Decision needed:** confirm the two sizes are intentional, or collapse them.

### A4. `FilterChip` selected is solid blue

*(§15 flag 7. Confirmed on both lists, New Ticket, Ticket Detail.)*

Selected `FilterChip` and a selected `SegmentedControl` segment are visually identical. Built
faithfully; still worth a look now that both appear in real filter bars.

---

## B. New questions raised by this audit

### B1. `pending` has no status colour token — **`blocking`**

Figma renders `pending` lavender. The 35-token semantic palette has no purple, and hex
literals are banned outside `primitives.ts`, so it ships on a neutral surface tone and is
currently indistinguishable from `closed`.

**The code comment saying "no purple exists" is now stale** — story 07 added
`bgInternalSubtle` / `textInternal` for internal notes. Whether those are the right tokens to
reuse for `pending`, or whether `pending` needs its own pair, is a design call.

Most visible on Tickets List, where `pending` and `closed` sit adjacent.

### B2. There is no dark splash frame

`app.json` sets `userInterfaceStyle: "automatic"`, so the app supports both palettes — but the
file contains exactly one splash frame (verified: `7:1891` is the only one). A light splash
will flash white ahead of a dark app.

**Decision needed:** a dark splash frame, or an explicit accept.

Related, and **not** a design question: `app.json` cannot import `primitives.ts`, so the splash
background hex must be duplicated outside the token layer. That is a permanent, unavoidable
hole in hard rule 2 and has been documented rather than fixed.

### B3. No sheet is designed for the Language / Theme / Notification pickers

The Profile frame carries only the tab's home state. Presenting these as bottom sheets was an
implementation decision, not a design one. Within those sheets, the check currently sits in the
row's *leading* slot on `type="link"` rows, so unselected options shift 32px and every option
carries a stray chevron — which design has never seen.

**Decision needed:** sign off the sheet pattern (and its selected-row treatment), or design the
real thing.

### B4. Off-scale values are bound in several frames

Frames bind values with no step on the token scales, so the code snaps and silently drifts:

| Frame | Bound | Nearest token |
|---|---|---|
| Auth - Reset Password | `font size/13` | `fontSize.sm` (14) |
| Auth - Reset Password | `line height/19_5` | `lineHeight.sm` (20) |
| Auth - Reset Password | `corner radius/44` | `radius.xl` (20) / `full` |
| Tickets - List | subject `13.5` | `callout` (14) |
| Home | claim pill `10.5` | `overline` (10) |

**Decision needed:** either these snap to the scale in Figma too, or the scales gain the steps.
Right now every implementer makes the same judgement call independently.

### B5. Is a pill/tag primitive missing from the system?

Home's claim button is the only hand-rolled interactive control left in the app. Story 03
prescribed `<Button variant="primary" size="sm">` — but `Button` has no `size` prop and is
hard-coded to 56px, while Figma's pill is **~24px tall** (px 10 / py 4, 10.5px semibold).

That is a badge, not a small button. Forcing a 24px variant into `Button` would distort it, so
the pill has been left hand-rolled.

**Decision needed:** does the design system want a proper pill/tag primitive? Several places
would use it — the claim pill, `StatusBadge`, `PriorityChip`, the Assign sheet's `CURRENT` tag.

### B6. Are Home's ticket rows cards, or flat rows on a band?

The audit read Home's rows as white `rounded-[14px]` cards with a drop shadow. Checking the
frame's bound variables directly, `color/white/solid` + `color/grey/93` appear at **band**
level only (`7:78` / `7:217`); the row itself binds neither, and the Tickets List row binds
`stroke weight/1` — a flat row with a separator.

Implemented as: the band carries the surface, rows stay flat. This keeps Home and Tickets List
consistent and avoids double-carding the Customer Detail tab, which already wraps the row.

**Please confirm.** If rows really are cards on Home only, it is a one-line change — but then
Home and Tickets List diverge deliberately, which is worth stating.

### B7. Two Customer Info values contradict their own story plan

Story 10 was written against the *Tickets* frame because the Info frame's node id was
unavailable (its own open question 1). Frame `7:3544` now disagrees:

| Element | Plan / code | Figma `7:3544` |
|---|---|---|
| Info row value tone | `tone="link"` | `colors.text` |
| Info row value type | `caption` 12/18 | 14/20 |

Deliberately **not** changed — the plan may reflect a later decision the frame has not caught
up with. Which is authoritative?

---

## C. Blocked on something other than design

Listed so they are not mistaken for design questions.

- **Ticket Detail's contact strip cannot show `company`.** Figma and story 07 both specify
  `company · department`, but the `customers` table **has no `company` column**. This needs a
  schema decision, not a design one. (The strip currently shows *category*; whether it should
  show department instead is a product call.)
- **Attachments, the customer Notes tab, and CSAT** remain blocked on Supabase Storage.
- **Notifications** is unbuilt; frame `7:3066` is designed and waiting.
- **Auth - Reset Password** is designed (`7:4687`) but has no story and no plan entry. US-003
  is unscheduled.
- **`ticket_events` DELETE has never been tested against a live agent JWT.** PATCH is confirmed
  rejected by RLS; BRD `:722` is unverified for the delete path until that test runs.

---

## What we changed on our own authority

For completeness, so design knows what moved without being asked. All of it is
implementing what the file already specifies, never resolving a question above:

- The **figure/ground layer** — surfaces, hairlines and elevation the app had simply never
  implemented across 8 screens.
- **Nine primitive corrections** — field inset, sheet padding, tab bar inset and gap,
  `StatusBadge` size ramp, `SectionHeader` tone, priority rail geometry, list header gap, sheet
  grabber, sheet backdrop alpha.
- **Six defects** — the dark-mode white halo, the silently-vanishing duplicate-phone error, the
  missing splash image, the commented-out pre-login language toggle, reassignment rendering as
  first assignment, and the missing submit spinner.

`StatusBadge` moved to the correct 10/16 ramp but **not** to uppercase + tracking — that half
is A1's decision, not ours.
