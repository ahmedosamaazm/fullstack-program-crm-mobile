# React Native Frontend Roadmap — AZM Support CRM, Phase 1

Build sequence for the Expo app, aligned to the Jira backlog and gated on backend readiness.

**Companions:** `phase1_brd.md` (data model, state machine, permissions) · `DESIGN.md` (tokens, components) · `phase1_backend_plan.md` (what exists server-side) · `phase1_api_reference.md` (endpoints) · `phase1_checklist.md` (verification)

---

## Two rules that govern the whole sequence

**1. Foundation before features.** TF-01 through TF-05 touch every screen built after them. Retrofitting RTL into a laid-out app, or theming into hardcoded components, is a rewrite rather than a change. These are not optional preamble.

**2. Vertical slices, not UI-first.** Build each story end to end — screen, data layer, RLS behaviour, error states — before starting the next. Building ten screens against assumed data shapes and wiring them afterward means discovering RLS and state-machine mismatches ten screens late.

> When instructing Claude Code, state the vertical-slice preference explicitly. Left to its own devices it tends toward UI-first, because visible progress is more gratifying to produce.

---

## Backend readiness gates

Some stories cannot be completed until backend work lands. Check before starting.

| Frontend work | Requires | Status |
|---|---|---|
| Auth, customers, tickets, messages, history | Schema + RLS | ✅ Ready |
| Login with real accounts | Auth provisioning (§6) | 🔨 Manual seeding only |
| Attachments | Storage bucket + policies (§7) | 🔨 Blocked |
| Notification centre | `notifications` table (§9) | 🔨 Blocked |
| Customer status page | Token API (§8) | 🔨 Blocked |
| Full-text search | tsvector columns (§10) | 🔨 `ilike` works meanwhile |

**Consequence for sequencing:** Sprints 1 and 2 are entirely unblocked. Sprint 3 needs Storage and the notifications table to land first. Plan backend work one sprint ahead of the frontend that consumes it.

---

# Stage 0 — Scaffold

*Not a Jira story. Half a day. Nothing else can start without it.*

```bash
npx create-expo-app azm-crm
cd azm-crm
npx expo install expo-router @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill expo-localization i18next react-i18next
npx expo install expo-secure-store expo-image-picker expo-document-picker
```

**Structure:**

```
src/
├── app/                    expo-router file routes
├── components/             TicketRow, StatusDot, PriorityRail, EmptyState…
├── features/               tickets/, customers/, auth/ — hooks + queries per domain
├── lib/
│   ├── supabase.ts         client
│   ├── theme/              tokens from DESIGN.md
│   └── i18n/               en.json, ar.json
└── types/                  generated from the database
```

**Generate types from the schema** rather than hand-writing them:

```bash
npx supabase gen types typescript --project-id svcxmjibmgjtaxuzrquf > src/types/database.ts
```

Re-run after every migration. This is what makes the state machine and enum values compile-time errors instead of runtime surprises.

**Exit:** app boots, Supabase client connects, one authenticated query returns data from the device.

---

# Sprint 1 — Foundation & Auth

**Jira:** SCRUM-12 to SCRUM-16 (TF-01…TF-05), SCRUM-17, SCRUM-18
**~47 points.** Ends with a themed, bilingual shell an agent can log into.

### 1.1 · TF-01 Localisation & RTL — SCRUM-12 *(8 pts)*

The most expensive item to retrofit. Do it first.

- `i18next` + `react-i18next`, with `en.json` and `ar.json` populated as strings are written, never after
- Locale resolved **before first paint** — no LTR flash on cold start in Arabic
- `I18nManager.forceRTL()` handled, including the app reload it requires on some platforms
- **Logical properties only**: `marginStart`, `paddingEnd`. A lint rule banning `marginLeft`/`marginRight` is worth adding now
- IBM Plex Sans Arabic loaded, with `lineHeight × 1.15` for Arabic text
- Locale-aware number and date formatting

**Verify:** every screen built from here on gets checked in both directions. Not at the end.

### 1.2 · TF-02 Theming — SCRUM-13 *(5 pts)*

- `theme/tokens.ts` as the **only** place a colour value is written
- Light and dark, both complete — dark is not derivable by inverting light
- System preference on first launch, manual override persisted
- Status and priority colour maps live here, keyed by the database enum values

**Verify:** a grep for hex literals outside `tokens.ts` returns nothing.

### 1.3 · TF-03 Adaptive layout — SCRUM-14 *(5 pts)*

- `useBreakpoint()` hook branching on **width**, never device type
- Phone <600dp stacked; tablet ≥600dp master–detail on Tickets and Customers
- Rotation preserves scroll position and selection

Building the hook now costs little; adding it after twelve screens means touching all of them.

### 1.4 · TF-05 Screen states — SCRUM-16 *(5 pts)*

`Skeleton`, `EmptyState`, `ErrorState`, and an offline banner, built as components before any list needs them.

Deliberately before the first list screen. Built after, they get retrofitted inconsistently or skipped — which is the most common gap in generated UI, and why this is a tracked task rather than an implicit expectation.

### 1.5 · US-001 Agent login — SCRUM-17 *(5 pts)*

- Email + password against `/auth/v1/token`
- **No registration link** — accounts are admin-created
- Tokens in `expo-secure-store`, never AsyncStorage
- Deactivated account (`is_active = false`) is refused

### 1.6 · US-002 Session persistence — SCRUM-18 *(3 pts)*

- Session resumes across app restart
- Silent refresh before expiry
- Sign out clears session **and** all cached data
- Auth-aware routing: unauthenticated users can't reach app routes

**TF-04 (SCRUM-15) is already satisfied** by the backend work — no frontend component. Close it, or use it to track the client-side verification that scoped queries return scoped results.

### Sprint 1 exit

- [ ] Login works with all four seeded accounts
- [ ] Session survives restart
- [ ] Every screen correct in Arabic RTL and English LTR
- [ ] Every screen correct in light and dark
- [ ] Tab shell renders on phone and tablet
- [ ] Types generated from the live schema

---

# Sprint 2 — Customers & Tickets

**Jira:** SCRUM-21 to SCRUM-23, plus the Ticket Management epic
**~50 points.** The core loop.

**Order matters: customers before tickets**, because a ticket requires a customer to exist.

### 2.1 · Shared components

Built once, from `DESIGN.md`, before the screens that use them:

`TicketRow` · `CustomerRow` · `StatusDot` · `PriorityRail` · `SectionHeader` · `Avatar` · `SegmentedControl` · `BottomSheet` · `FAB`

> **Status is a dot plus plain text. Priority is a rail.** Different shapes so they're distinguishable without colour and never confused with each other. Several design mockups show filled chips and uppercase labels — those are known deviations. `DESIGN.md` is authoritative.

### 2.2 · Customers — SCRUM-21, 22, 23

| Story | Notes |
|---|---|
| US-005 List & search | `ilike` search until §10 lands. Verify Arabic name matching |
| US-006 Create | Duplicate phone within branch → `409`, surfaced as a field error |
| US-007 Edit | |
| US-008 Profile view | |
| US-009 Interaction history | Embedded query returns customer + tickets in one request |

### 2.3 · Tickets

| Story | Notes |
|---|---|
| US-016 List & filters | Mine / Unassigned / All, with counts from `Prefer: count=exact` |
| US-017 Create | `reference` and `status` are server-generated — never send them |
| US-018 Inline customer creation | Preserve entered ticket fields across the detour |
| US-019 Ticket detail | Conversation / Internal notes / History |
| US-020 Public reply | |
| US-021 Internal note | Highest-risk story in Phase 1 |
| US-017 Assign | |
| US-018 Status transitions | |
| US-019 History timeline | |

### 2.4 · Two stories needing particular care

**Internal notes.** `is_internal` is `NOT NULL` with no default — the insert fails if omitted. Type it as required in your client code rather than optional, so the compiler catches it before the database does. The visual distinction needs rail, background wash, icon, and label working together; any one alone is too subtle.

**Status transitions.** The picker must offer only reachable states. Model the transition map client-side from BRD §6 so the UI never presents an illegal option — but understand the database is the actual guarantee. The client map is for UX; the trigger is for correctness.

```ts
const TRANSITIONS = {
  new:      ['open'],
  open:     ['pending', 'resolved'],
  pending:  ['open', 'resolved'],
  resolved: ['closed', 'open'],
  closed:   [],
} as const;
```

Handle the trigger's error messages gracefully — an illegal transition returns a Postgres exception, not a clean validation response.

### Sprint 2 exit

- [ ] Full loop: create customer → create ticket → assign → reply → resolve → close
- [ ] Internal notes absent from the Conversation tab **and** from the API payload
- [ ] Illegal transitions impossible in the UI and rejected by the server
- [ ] History populates automatically from triggers
- [ ] Cross-branch data unreachable, verified from the app

---

# Sprint 3 — Dashboard, notifications, attachments

**Jira:** Agent Dashboard + Customer Notification epics
**~30 points.** Partially gated on backend.

### 3.1 · Home — US-020, US-021, US-022, US-029 ✅ unblocked

Three workload counts, My tickets preview, Unassigned with Claim.

**Claim** is assign-to-self: `PATCH tickets` setting `assigned_to`, then refresh counts. The trigger logs it. Handle the race — two agents claiming simultaneously means the second gets zero rows affected, which should surface as "already assigned" rather than silence.

Reserve the 60dp gap below the stat row for Phase 2 SLA alerts.

### 3.2 · Attachments — US-015 🔨 blocked on §7

Needs the bucket and storage policies first. Client work: `expo-image-picker`, `expo-document-picker`, client-side compression, upload to the scoped path, signed URLs for viewing.

> Storage policies are a **separate** security surface from table RLS. An agent blocked from an `attachments` row can still fetch the object unless storage policies independently enforce branch and department scope. Test this explicitly.

### 3.3 · Notification centre — US-028 🔨 blocked on §9

Needs the `notifications` table. Grouped Today/Earlier, unread badge, tap-to-open, mark-all-read. Expo push tokens stored per profile.

### 3.4 · Customer loop — US-023, 024, 025, 026, 027 🔨 blocked on §8

Notifications and the magic-link status page are backend and web work, not RN. Listed here only so the stories aren't lost — they close Phase 1 but sit outside the mobile app.

---

# Cross-cutting practices

**Data layer.** TanStack Query over raw calls — caching, refetch, optimistic updates, and pull-to-refresh come free, and every list screen needs all four.

**Never trust the client for access control.** RLS is the boundary. Client-side filtering is presentation, not security. Never send `department_id` from client state as a filter believing it protects anything.

**Error handling.** Postgres constraint and trigger errors arrive as exception strings. Map the known ones to human messages: illegal transition, missing resolution note, duplicate phone.

**Every list screen ships four states.** Loading, empty, error, populated. TF-05 built the components; using them is per-screen discipline.

**Definition of Done**, per story, from BRD §10: acceptance criteria pass · Arabic RTL and English LTR · light and dark · phone and tablet · states implemented · RLS verified by API call not UI observation · no hardcoded strings or colour literals.

---

# Design reference caveat

The Stitch and Figma Make outputs are **directional references for layout and hierarchy**, not specifications. Where they conflict with `DESIGN.md`, DESIGN.md wins.

**Known deviations in the mockups — do not reproduce:**

| Deviation | Correct per DESIGN.md |
|---|---|
| Uppercase status labels (`OPEN`, `NEW`) | Sentence case |
| Filled status chips | Dot plus plain text |
| Chat bubbles with avatars in the thread | Full-width message rows with leading rails |
| Short references (`TKT-8924`) | `TKT-202608-0142` |
| Invented statuses (`In Progress`, `Processing`, `Escalated`) | Only the five enum values |
| Coloured subject lines | `on-surface` for all subjects |
| Red badge on the Tickets tab | No tab badges |

**Also absent from the mockups**, and still required: Arabic RTL layouts, dark mode, and loading/empty/error states. All three are tracked as TF tasks and must be built regardless of having no visual reference.

---

# Sequencing summary

| Sprint | Content | Points | Gated? |
|---|---|---|---|
| 0 | Scaffold | — | No |
| 1 | TF-01…TF-05, login, session | ~47 | No |
| 2 | Customers, tickets, messages, history | ~50 | No |
| 3 | Home, attachments, notifications | ~30 | Partially |

**Run backend work one sprint ahead.** While Sprint 1 is in progress, land §6 auth provisioning, §7 storage, and §9's notifications table so Sprint 3 isn't waiting.

**The single highest-risk story is US-021**, the internal note. An internal note reaching a customer is the failure that damages client trust rather than merely annoying an agent. Verify it three ways: absent from the Conversation tab, absent from the API response payload, and absent from the customer status page once §8 lands.
