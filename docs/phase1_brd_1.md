# Business Requirements Document — Phase 1

**Product:** Customer Support CRM (Mobile)
**Phase:** 1 — Operational Core
**Stack:** React Native (Expo) + Supabase
**Source:** `azm_squad_customer_support_crm.md`
**Companions:** `crm_phased_roadmap.md` · `crm_screen_inventory.md` · `phase1_checklist.md` · `feature_phase_matrix.md`

---

# 1. Purpose & Business Context

A support team currently handling requests by phone, walk-in, and ad-hoc channels has no single record of customer issues. Requests are lost, ownership is unclear, and there is no history to learn from.

Phase 1 delivers the **operational core**: a mobile app where an agent captures a customer, opens a ticket, works it to resolution, and the customer is kept informed automatically.

### Objectives

| # | Objective | Measure |
|---|---|---|
| O1 | Every support request becomes a tracked record | 100% of handled requests have a ticket |
| O2 | Ownership of every request is unambiguous | 0 tickets unassigned >24h |
| O3 | Customers receive confirmation and closure | ≥95% notification delivery |
| O4 | Full customer history available at point of contact | History visible within 2 taps |
| O5 | Foundation supports Arabic-first operation | 100% screens pass RTL review |

### Success criteria for the pilot

3–5 agents run real tickets for two weeks with no fallback to spreadsheets or paper.

---

# 2. Scope

### In scope

Agent mobile app (phone + tablet) · customer records · ticket lifecycle · manual assignment · internal notes · attachments · outbound customer notifications · magic-link status page · CSAT capture · Arabic/English · light/dark · department and branch isolation.

### Out of scope — and where it lands

| Excluded | Phase |
|---|---|
| SLA targets, auto-assignment, escalation | 2 |
| Reports and dashboards | 2 |
| Admin UI (users seeded via SQL) | 2 |
| Knowledge base | 2 |
| Inbound email, WhatsApp, SMS, live chat, web forms | 3 |
| Customer portal with login | 3 |
| AI features | 4 |
| ERP and external integrations | 4 |

> **Intake constraint:** every Phase 1 ticket is agent-created. There is no inbound channel. This suits phone, walk-in, branch, and internal-helpdesk operations. If the majority of requests currently arrive by email, pull §3.5 web forms and §3.1b inbound email forward from Phase 3.

---

# 3. Personas

| Persona | Phase 1 role | Access |
|---|---|---|
| **Agent** | Primary user. Creates and resolves tickets | Full app, scoped to own department + branch |
| **Administrator** | Seeds users and reference data | Database only — no UI this phase |
| **Customer** | Receives notifications, tracks via link, rates | Magic-link page only. No account |
| **Manager** | Defined in schema, dormant | — (Phase 2) |
| **System** | No automation this phase | — (Phase 2) |

---

# 4. Assumptions & Constraints

**Assumptions**
- Agents have company-issued smartphones or tablets with data connectivity
- Departments, branches, categories, and agent accounts are seeded before launch
- Customers have a valid email address for notifications
- Arabic is the primary operating language; English is secondary

**Constraints**
- Mobile only. No web build for staff this phase
- Single Supabase project; no separate backend service
- Notification delivery depends on a third-party email provider
- The status page is the only web surface, and it is unauthenticated by token

---

# 5. Data Model

```
departments ─┐
             ├─> profiles ─┐
branches ────┘             │ assigned_to / created_by
                           │
customers ──────────> tickets ──────> ticket_messages
     │                  │  │               │
attachments ────────────┘  ├─> ticket_events
                           ├─> csat_responses
                           └─> access_tokens
```

### 5.1 `departments`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name_en, name_ar | text | required |
| is_active | boolean | default true |

### 5.2 `branches`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name_en, name_ar | text | required |
| address | text | optional |
| is_active | boolean | default true |

### 5.3 `profiles` *(staff)*
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK, FK → `auth.users` |
| full_name | text | required |
| email | text | required, unique |
| phone | text | optional |
| role | enum | `agent` \| `manager` \| `admin` |
| department_id | uuid | FK, required |
| branch_id | uuid | FK, required |
| is_active | boolean | default true |

### 5.4 `customers`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| full_name | text | required, 2–120 chars |
| phone | text | required, unique per branch, E.164 |
| email | text | optional, valid format |
| secondary_contacts | jsonb | array of `{type, value, label}` |
| department_id, branch_id | uuid | FK, required |
| created_by | uuid | FK → profiles |
| created_at, updated_at | timestamptz | auto |

### 5.5 `categories`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| name_en, name_ar | text | required |
| department_id | uuid | FK, nullable = global |
| sort_order | int | default 0 |
| is_active | boolean | default true |

### 5.6 `tickets`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| reference | text | unique, generated `TKT-YYYYMM-NNNNN` |
| subject | text | required, 3–200 chars |
| description | text | optional |
| customer_id | uuid | FK, required |
| category_id | uuid | FK, required |
| priority | enum | `low` \| `medium` \| `high` \| `urgent`, default `medium` |
| status | enum | `new` \| `open` \| `pending` \| `resolved` \| `closed`, default `new` |
| assigned_to | uuid | FK → profiles, nullable |
| department_id, branch_id | uuid | FK, required, inherited from creator |
| created_by | uuid | FK → profiles, required |
| resolution_note | text | required when status → `resolved` |
| resolved_at, closed_at | timestamptz | nullable |
| created_at, updated_at | timestamptz | auto |

### 5.7 `ticket_messages`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| ticket_id | uuid | FK, required |
| author_id | uuid | FK → profiles, nullable (null = customer) |
| body | text | required, 1–5000 chars |
| **is_internal** | boolean | **NOT NULL, no default** |

> **`is_internal` deliberately has no default.** Every insert must state it explicitly. A default is a silent failure waiting to happen — an internal note defaulting to public is the worst outcome in this product.

### 5.8 `ticket_events` *(immutable history)*
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| ticket_id | uuid | FK, required |
| actor_id | uuid | FK → profiles |
| event_type | enum | `created` \| `status_changed` \| `assigned` \| `priority_changed` |
| from_value, to_value | text | nullable |
| created_at | timestamptz | auto |

No UPDATE or DELETE permitted on this table by any role.

### 5.9 `attachments`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| ticket_id, customer_id, message_id | uuid | FK, exactly one required |
| storage_path | text | required |
| file_name, mime_type | text | required |
| size_bytes | int | max 10 MB |
| uploaded_by | uuid | FK → profiles |

### 5.10 `csat_responses`
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| ticket_id | uuid | FK, **unique** — one response per ticket |
| rating | int | 1–5, required |
| comment | text | optional, max 500 |
| submitted_at | timestamptz | auto |

### 5.11 `access_tokens` *(magic link)*
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| ticket_id | uuid | FK, required |
| token_hash | text | required — store hash, never the raw token |
| expires_at | timestamptz | required, default +30 days |

---

# 6. Ticket State Machine

```
      ┌──────────────────────────┐
      ▼                          │
    new ──> open ──> pending ────┘
             │  ▲       │
             │  └───────┘
             ▼
         resolved ──> closed
             │
             └──> open   (reopen)
```

| From | Allowed to | Rule |
|---|---|---|
| `new` | `open` | On assignment or first agent action |
| `open` | `pending`, `resolved` | `resolved` requires a resolution note |
| `pending` | `open`, `resolved` | Awaiting customer or third party |
| `resolved` | `closed`, `open` | Reopen allowed; `closed` after CSAT or timeout |
| `closed` | — | **Terminal.** No transition out |

**Rules**
- Transitions not in this table must be rejected at the **database layer**, not just hidden in the UI
- Every transition writes a `ticket_events` row
- `resolved_at` and `closed_at` set on entry to those states
- The status picker only offers reachable states

---

# 7. Permissions Matrix

Phase 1 roles. Enforced by Supabase RLS.

| Entity | Agent | Admin | Customer (token) |
|---|---|---|---|
| customers | CRU — own dept + branch | CRUD all | — |
| tickets | CRU — own dept + branch | CRUD all | R — single ticket, restricted view |
| ticket_messages | CR — own dept | CRUD | R — `is_internal = false` only |
| ticket_events | R — own dept | R all | — |
| attachments | CRU — own dept | CRUD | — |
| csat_responses | R | R | C — own ticket, once |
| profiles | R — own dept | CRUD | — |
| departments / branches / categories | R | CRUD | — |

**Rules**
- No DELETE for agents on any entity. Deactivate, don't destroy
- Customer access is via a **restricted Postgres view**, not the base tables
- Every RLS-filtered column must be indexed
- Access control is never implemented in the client

---

# 8. Non-Functional Requirements

| # | Requirement |
|---|---|
| NFR-01 | Ticket list renders in <1.5s on a mid-range Android device over 4G |
| NFR-02 | All screens function in Arabic RTL and English LTR with no layout breakage |
| NFR-03 | All screens function in light and dark themes at WCAG AA contrast |
| NFR-04 | Adaptive layout by width: phone <600pt stacked, tablet ≥600pt master–detail |
| NFR-05 | Session persists across app restart; expires after 30 days inactivity |
| NFR-06 | All timestamps stored UTC, displayed in device local time |
| NFR-07 | Attachments capped at 10 MB; images compressed client-side before upload |
| NFR-08 | Failed notification sends logged and retried up to 3 times |
| NFR-09 | Every list screen implements loading, empty, error, and populated states |
| NFR-10 | No secrets, API keys, or service tokens in the client bundle |
| NFR-11 | Magic-link tokens are single-ticket scoped, hashed at rest, and expire |
| NFR-12 | App usable one-handed on phone: primary actions within thumb reach |

---

# 9. Design System Specification

Required input for the UI/UX generation pass.

### Visual direction
**Utilitarian and dense**, closer to Linear than Intercom. Agents scan long ticket lists all day, so information density beats whitespace. Restrained color — reserve saturation for status and priority signals so they carry meaning.

### Tokens

| Group | Requirement |
|---|---|
| Color | Semantic names only: `surface`, `surfaceRaised`, `textPrimary`, `textMuted`, `border`, `accent`. Full light + dark sets. **No literals in components** |
| Status | 5 states, each with a distinct color **and** icon: `new`, `open`, `pending`, `resolved`, `closed` |
| Priority | 4 levels with a non-color cue (bar weight or icon), not color alone |
| Type | Latin + Arabic pairing. Arabic needs ~1.15× line-height. Scale: 12 / 14 / 16 / 20 / 24 / 32 |
| Spacing | 4pt base scale. **Logical properties only** — `marginStart`, never `marginLeft` |
| Radius | 3 steps: control, card, sheet |
| Elevation | 2 levels max. Prefer borders over shadows in dark mode |

### Core components
`TicketRow` · `CustomerRow` · `StatusPill` · `PriorityIndicator` · `MessageBubble` (internal/public variants) · `EmptyState` · `LoadingSkeleton` · `ErrorState` · `BottomSheet` · `FAB` · `StatCard` · `SegmentedControl` · `Avatar`

### Sample content for design
Use realistic bilingual data — Arabic names run longer than Latin placeholders and will break tight buttons. Examples: `أحمد عبد الرحمن المصري`, `Fatima Al-Sayed`, subject `لم يتم تفعيل الخدمة بعد الدفع`.

---

# 10. Definition of Done

A story is done when:

- [ ] Acceptance criteria pass
- [ ] **TF-01** — works in Arabic RTL and English LTR
- [ ] **TF-02** — works in light and dark theme
- [ ] **TF-03** — works on phone and tablet layout
- [ ] **TF-04** — department and branch scoping verified by direct API call, not UI behaviour
- [ ] **TF-05** — loading, empty, and error states implemented where applicable
- [ ] No hardcoded strings or color literals
- [ ] Reviewed and merged

> The five TF checks appear here because they apply to every story. That is precisely why they are not stories themselves — see §12.

---

# 11. Jira Import Guide

`phase1_jira_import.csv` maps to a standard Jira Software project.

| CSV column | Jira field |
|---|---|
| Issue Type | Epic / Story |
| Summary | Summary |
| Description | Description |
| Epic Name | Epic Name *(epics only)* |
| Epic Link | Epic Link *(stories only)* |
| Priority | Priority |
| Story Points | Story Points *(custom field)* |
| Labels | Labels |
| Acceptance Criteria | Custom text field |

**Setup:** create the Story Points and Acceptance Criteria custom fields before import, then map columns during the import wizard.

**Labels** carry the traceability: `phase-1`, persona (`agent`, `customer`, `admin`), screen (`S07`), and source feature (`feat-2.4`). That gives you a direct line from any Jira ticket back to the original requirement — which is what makes spec-driven development auditable.

---

# 12. Technical Foundation Requirements

These are **not user stories.** They describe no standalone user function — they are conditions that every screen and every story must satisfy. Written as stories they would be perpetually half-done, and their acceptance criteria would duplicate across the whole backlog.

Track them as **Tasks** in the Foundation epic, and enforce them through the Definition of Done in §10. All five must be scaffolded before feature work begins; each is expensive to retrofit.

**Total: 28 points across 5 tasks.**

### TF-01 · Localisation & RTL

Source feature 12.1 · 8 pts

Arabic and English throughout, with full right-to-left layout. RTL is delivered as part of localisation, not separately — a locale switch that does not mirror the layout is an incomplete implementation.

**Verification**

- [ ] Every user-facing string sourced from translation files; no hardcoded literals
- [ ] Language switches instantly with no app restart
- [ ] Selected locale persists across restarts
- [ ] No LTR flash on cold start in Arabic — locale resolves before first paint
- [ ] Layout mirrors horizontally when Arabic is active
- [ ] Directional icons (back, chevron) mirror; non-directional (attachment, camera) do not
- [ ] Arabic strings do not clip or overflow in buttons, pills, or rows
- [ ] Numbers and dates format per locale
- [ ] Components use logical properties (marginStart) — never marginLeft/marginRight

### TF-02 · Theming — light & dark

Source feature — · 5 pts

Both themes available across the app, driven by semantic tokens.

**Verification**

- [ ] System preference applied on first launch
- [ ] Manual override persists across restart
- [ ] Theme switches instantly with no restart
- [ ] All text and interactive elements meet WCAG AA contrast in both themes
- [ ] Status and priority colors remain distinguishable in both themes
- [ ] No hardcoded color literals anywhere in component code

### TF-03 · Adaptive layout — phone & tablet

Source feature 12.2 · 5 pts

One codebase serving both form factors, branching on viewport width.

**Verification**

- [ ] Viewport <600pt renders stacked single-pane navigation
- [ ] Viewport ≥600pt renders master–detail on Tickets and Customers
- [ ] Both orientations supported
- [ ] Rotation preserves scroll position and selection
- [ ] Layout branches on width, never on device type detection
- [ ] Primary actions remain within thumb reach on phone

### TF-04 · Tenancy scoping — department & branch

Source feature 12.3, 12.4 · 5 pts

Every scoped record carries a department and branch, and every query filters on both. Retrofitting this is a rewrite of the data layer.

**Verification**

- [ ] department_id and branch_id present and NOT NULL on all scoped tables
- [ ] Scope inherited from the creating agent's profile on insert
- [ ] Every scoped column covered by an index
- [ ] Two seeded departments verified isolated
- [ ] Two seeded branches verified isolated
- [ ] Isolation verified by direct API call, not UI observation

### TF-05 · Screen state coverage

Source feature — · 5 pts

Every data-bearing screen handles all four states. The most common gap in generated UI.

**Verification**

- [ ] Loading skeleton renders while data is pending
- [ ] Contextual empty state with guidance renders when no records exist
- [ ] Error state with a retry action renders on failure
- [ ] Offline banner displays when connectivity is lost
- [ ] Each state verified in both themes and both locales

> **RTL is folded into TF-01, not tracked separately.** Localisation that does not mirror the layout is simply incomplete localisation — splitting them invites shipping a language toggle that leaves Arabic reading left-to-right.

---

# 13. User Stories


## Epic E1 — Authentication & Access Control

*Agent login, session handling, and RLS-based department and branch isolation.*

**Source features:** 10.1, 10.2

### US-001 · Agent login

> As an agent, I want to log in with email and password so that I can access my tickets.

`Agent` · Feature 10.1 · Screen S02 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given valid credentials, when I submit, then I am authenticated and routed to Home
- [ ] Given invalid credentials, when I submit, then a clear error appears and no session is created
- [ ] Given a deactivated account, when I attempt login, then access is denied
- [ ] Given the login screen, when displayed, then no self-registration option is present
- [ ] Given an empty required field, when I submit, then validation blocks the request

### US-002 · Session persistence

> As an agent, I want to stay logged in so that I do not re-authenticate constantly.

`Agent` · Feature 10.1 · Screen S01 · **P0** · 3 pts

**Acceptance criteria**

- [ ] Given I am logged in, when I close and reopen the app, then my session resumes
- [ ] Given a session inactive over 30 days, when I open the app, then I am returned to Login
- [ ] Given I sign out, when the action completes, then all session and cached data are cleared

### US-003 · Password reset

> As an agent, I want to reset a forgotten password so that I can regain access.

`Agent` · Feature 10.1 · Screen S03 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given I submit a registered email, when the request succeeds, then a reset email is sent
- [ ] Given I submit an unregistered email, when the request completes, then the same generic confirmation shows
- [ ] Given a reset link, when opened after expiry, then it is rejected

### US-004 · Department and branch access isolation

> As an administrator, I want access enforced in the database so that agents cannot reach another unit's data.

`Admin` · Feature 10.2 · Screen — · **P0** · 8 pts

**Acceptance criteria**

- [ ] Given an agent in department A, when they list tickets, then only department A tickets return
- [ ] Given an agent in branch X, when they list customers, then only branch X customers return
- [ ] Given a direct API call carrying another department's ID, when executed, then an empty set returns
- [ ] Given a storage object from another branch, when its URL is requested, then access is denied
- [ ] Given any permission rule, when traced, then it is enforced in RLS and not in client code


## Epic E2 — Customer Management

*Create, find, and maintain customer records with history, notes, and attachments.*

**Source features:** 1.1-1.4

### US-005 · Customer list and search

> As an agent, I want to find a customer quickly so that I can act during a live call.

`Agent` · Feature 1.1 · Screen S11 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given customers exist, when I open the Customers tab, then a paginated list renders
- [ ] Given I type a partial name, when results return, then matching customers show
- [ ] Given I search an Arabic name, when results return, then matching is correct
- [ ] Given I search a phone number, when results return, then the matching customer shows
- [ ] Given no matches, when the search completes, then an empty state renders

### US-006 · Create a customer

> As an agent, I want to add a new customer so that I can log their request.

`Agent` · Feature 1.1, 1.2 · Screen S13 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given required fields are complete, when I save, then the customer is created and opened
- [ ] Given a required field is empty, when I save, then validation blocks with a field-level message
- [ ] Given an invalid phone format, when I save, then it is rejected
- [ ] Given a phone already used in my branch, when I save, then a duplicate warning appears
- [ ] Given a save succeeds, when the record is written, then department and branch are inherited from me

### US-007 · Edit customer details

> As an agent, I want to update customer details so that records stay accurate.

`Agent` · Feature 1.2 · Screen S13 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given an existing customer, when I edit and save, then changes persist
- [ ] Given I add a secondary contact, when saved, then it appears on the profile
- [ ] Given I remove a secondary contact, when saved, then it no longer appears
- [ ] Given I edit a customer from another branch via API, when the call executes, then it is rejected

### US-008 · Customer profile view

> As an agent, I want the customer's details in one place so that I have context.

`Agent` · Feature 1.1, 1.2 · Screen S12 · **P0** · 3 pts

**Acceptance criteria**

- [ ] Given a customer, when I open their profile, then name, phone, email and secondary contacts display
- [ ] Given a phone number, when I tap it, then the dialler opens
- [ ] Given an email, when I tap it, then the mail client opens
- [ ] Given the profile, when displayed, then Info, Tickets and Notes tabs are present

### US-009 · Customer interaction history

> As an agent, I want to see a customer's past tickets so that I understand their situation.

`Agent` · Feature 1.3 · Screen S12 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given a customer with tickets, when I open the Tickets tab, then all their tickets list newest first
- [ ] Given a closed ticket, when history renders, then it is still included
- [ ] Given a customer with no tickets, when the tab opens, then an empty state renders
- [ ] Given a history row, when I tap it, then that ticket opens

### US-010 · Customer notes and attachments

> As an agent, I want to attach notes and files to a customer so that context is retained.

`Agent` · Feature 1.4 · Screen S12, S14 · **P1** · 5 pts

**Acceptance criteria**

- [ ] Given a customer, when I add a note, then it saves with my name and timestamp
- [ ] Given I choose upload, when the sheet opens, then camera, gallery and file options are offered
- [ ] Given a file over 10MB, when I upload, then it is rejected with a clear message
- [ ] Given an uploaded image, when I tap it, then a full-screen viewer opens
- [ ] Given an attachment from another branch, when its URL is requested directly, then access is denied


## Epic E3 — Ticket Management

*Full ticket lifecycle: creation, categorisation, assignment, conversation, status transitions, history.*

**Source features:** 2.1-2.5

### US-011 · Ticket list with filters

> As an agent, I want to filter my ticket queue so that I can focus on what matters.

`Agent` · Feature 2.1, 4.1 · Screen S06 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given the Tickets tab, when it opens, then Mine, Unassigned and All filters are available
- [ ] Given the Mine filter, when applied, then only tickets assigned to me show
- [ ] Given a ticket row, when rendered, then reference, subject, customer, status, priority and time display
- [ ] Given status and priority indicators, when rendered, then each carries a non-color cue
- [ ] Given I pull down, when the gesture completes, then the list refreshes

### US-012 · Create a ticket

> As an agent, I want to create a ticket so that a customer request is tracked.

`Agent` · Feature 2.1, 2.2 · Screen S08 · **P0** · 8 pts

**Acceptance criteria**

- [ ] Given I select a customer and complete required fields, when I save, then a ticket is created with status new
- [ ] Given a ticket is created, when saved, then a unique reference in format TKT-YYYYMM-NNNNN is generated
- [ ] Given a required field is empty, when I save, then validation blocks submission
- [ ] Given no priority is chosen, when I save, then medium is applied
- [ ] Given a ticket is created, when written, then a created event is recorded
- [ ] Given creation succeeds, when complete, then the new ticket opens

### US-013 · Create a customer inline during ticket creation

> As an agent on a call with a new customer, I want to add them without leaving the form so that I do not lose my input.

`Agent` · Feature 1.1, 2.1 · Screen S08 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given the customer picker, when no match is found, then a New customer action is offered
- [ ] Given I create a customer inline, when saved, then they are selected on the ticket form
- [ ] Given I create a customer inline, when I return, then previously entered ticket fields are preserved

### US-014 · Ticket detail and conversation thread

> As an agent, I want all ticket context in one screen so that I can work it efficiently.

`Agent` · Feature 2.1, 4.2 · Screen S07 · **P0** · 8 pts

**Acceptance criteria**

- [ ] Given a ticket, when I open it, then reference, subject, status and priority display in the header
- [ ] Given a ticket, when opened, then the customer strip shows name and phone
- [ ] Given the customer strip, when tapped, then the customer profile opens
- [ ] Given the detail screen, when rendered, then Conversation, Internal Notes and History segments are present
- [ ] Given the screen layout, when built, then a collapsible slot is reserved above the thread for a future AI summary

### US-015 · Post a public reply

> As an agent, I want to reply to the customer so that they receive an answer.

`Agent` · Feature 2.1 · Screen S07 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given the composer in public mode, when I send, then the message saves with is_internal false
- [ ] Given a public reply, when it renders, then it is visually distinct from internal notes
- [ ] Given a public reply, when the customer opens the status page, then it is visible
- [ ] Given an empty composer, when I attempt to send, then the action is blocked

### US-016 · Post an internal note

> As an agent, I want to leave notes for colleagues so that we collaborate without exposing detail to the customer.

`Agent` · Feature 4.5 · Screen S07 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given the composer in internal mode, when I send, then the message saves with is_internal true
- [ ] Given the composer, when in internal mode, then the mode is indicated by color, icon and label together
- [ ] Given an internal note, when the customer opens the status page, then it is absent from the response payload
- [ ] Given an internal note, when a colleague in my department opens the ticket, then it is visible
- [ ] Given the messages table, when a row is inserted, then is_internal must be supplied explicitly

### US-017 · Assign a ticket

> As an agent, I want to assign a ticket so that ownership is clear.

`Agent` · Feature 2.3 · Screen S09 · **P0** · 3 pts

**Acceptance criteria**

- [ ] Given the assign sheet, when it opens, then only agents in my department are listed
- [ ] Given I select an agent, when confirmed, then the ticket is assigned and the sheet closes
- [ ] Given an assigned ticket, when I reassign, then the new assignee replaces the previous
- [ ] Given I unassign, when confirmed, then the ticket returns to the unassigned pool
- [ ] Given any assignment change, when saved, then an assigned event is recorded

### US-018 · Ticket status transitions

> As an agent, I want to move a ticket through its lifecycle so that its state is accurate.

`Agent` · Feature 2.4 · Screen S10 · **P0** · 8 pts

**Acceptance criteria**

- [ ] Given a ticket in any state, when I open the status picker, then only legally reachable states are offered
- [ ] Given a transition to resolved, when I confirm, then a resolution note is required
- [ ] Given a transition to resolved, when saved, then resolved_at is set
- [ ] Given a closed ticket, when any transition is attempted, then it is rejected
- [ ] Given an illegal transition submitted directly to the API, when executed, then the database rejects it
- [ ] Given any transition, when saved, then a status_changed event records from and to values

### US-019 · Ticket history timeline

> As an agent, I want to see everything that happened to a ticket so that I can audit its handling.

`Agent` · Feature 2.5 · Screen S07 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given a ticket, when I open the History segment, then all events display chronologically
- [ ] Given an event, when rendered, then actor, action and timestamp display
- [ ] Given a timestamp, when displayed, then it renders in device local time
- [ ] Given the history, when displayed, then no edit or delete affordance exists
- [ ] Given an update or delete attempted on ticket_events via API, when executed, then it is rejected


## Epic E4 — Agent Dashboard

*Agent home surface: workload at a glance and customer context in-ticket.*

**Source features:** 4.1, 4.2, 4.5

### US-020 · Home workload summary

> As an agent, I want my workload at a glance so that I know where to start.

`Agent` · Feature 4.1 · Screen S05 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given I open Home, when it loads, then My Open, Unassigned and Resolved Today counts display
- [ ] Given I change a ticket status, when I return to Home, then counts reflect the change
- [ ] Given an agent with no tickets, when Home loads, then an empty state renders
- [ ] Given the stat row, when laid out, then a slot is reserved beneath it for future SLA alerts

### US-021 · My tickets preview

> As an agent, I want a preview of my tickets on Home so that I can act without navigating.

`Agent` · Feature 4.1 · Screen S05 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given assigned tickets, when Home loads, then up to five display ordered by priority then age
- [ ] Given a preview row, when tapped, then that ticket opens
- [ ] Given a View all action, when tapped, then the Tickets tab opens filtered to Mine

### US-022 · New ticket quick action

> As an agent, I want to start a ticket from anywhere so that I can capture a request during a call.

`Agent` · Feature 4.1 · Screen S05 · **P1** · 2 pts

**Acceptance criteria**

- [ ] Given Home or the Tickets tab, when displayed, then a New Ticket action is visible
- [ ] Given the action, when tapped, then the ticket creation screen opens


## Epic E5 — Customer Notification Loop

*Outbound notifications, magic-link status page, and CSAT capture. No customer login.*

**Source features:** 3.1a, 5.4a, 8.2a, 8.5a

### US-023 · Ticket confirmation notification

> As a customer, I want confirmation that my issue was logged so that I know it was received.

`Customer` · Feature 3.1a · Screen — · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given a ticket is created, when the transaction commits, then a confirmation email is queued
- [ ] Given the email, when rendered, then it contains the reference number and a status link
- [ ] Given the customer locale is Arabic, when the email renders, then it displays correctly in RTL
- [ ] Given a send failure, when it occurs, then it is logged and retried up to three times
- [ ] Given a customer with no email, when a ticket is created, then creation still succeeds

### US-024 · Status change notification

> As a customer, I want to be told when my issue is resolved so that I am not left waiting.

`Customer` · Feature 3.1a, 5.4a · Screen — · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given a ticket moves to resolved, when saved, then a notification is sent to the customer
- [ ] Given a ticket moves to closed, when saved, then a closure message with a rating link is sent
- [ ] Given internal status changes such as new to open, when saved, then no customer notification is sent

### US-025 · Magic-link status page

> As a customer, I want to check my request status without an account so that tracking is effortless.

`Customer` · Feature 8.2a · Screen S16 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given a valid magic link, when opened, then the status page loads without authentication
- [ ] Given the page, when rendered, then reference, current status and public replies display
- [ ] Given an expired token, when the link is opened, then access is refused
- [ ] Given a tampered or invalid token, when submitted, then access is refused
- [ ] Given a token for ticket A, when used to request ticket B, then access is refused

### US-026 · Status page data isolation

> As a business, I want the status page to expose nothing internal so that customer trust is protected.

`Customer` · Feature 8.2a · Screen S16 · **P0** · 5 pts

**Acceptance criteria**

- [ ] Given the status page response, when inspected, then internal notes are absent from the payload
- [ ] Given the response, when inspected, then agent name and assignment are absent
- [ ] Given the response, when inspected, then internal priority and escalation data are absent
- [ ] Given the customer view, when queried, then it reads from a restricted view not base tables
- [ ] Given any other customer's ticket, when requested with a valid token, then access is refused

### US-027 · Submit a satisfaction rating

> As a customer, I want to rate the service so that the team knows how they performed.

`Customer` · Feature 8.5a · Screen S16 · **P1** · 3 pts

**Acceptance criteria**

- [ ] Given a closed ticket, when I open the status page, then a rating prompt displays
- [ ] Given I select a rating, when I submit, then it saves against the ticket
- [ ] Given I have already rated, when I return, then my rating displays and resubmission is blocked
- [ ] Given an open ticket, when the page renders, then no rating prompt appears

### US-028 · In-app notification centre

> As an agent, I want a list of my alerts so that I do not miss assignments.

`Agent` · Feature 5.4a · Screen S15b · **P1** · 5 pts

**Acceptance criteria**

- [ ] Given a ticket is assigned to me, when it saves, then a push notification is sent
- [ ] Given the notification centre, when opened, then alerts list newest first grouped by Today and Earlier
- [ ] Given unread alerts, when Home renders, then the bell icon shows an accurate badge count
- [ ] Given I open an alert, when tapped, then the related ticket opens and the alert marks read
- [ ] Given the alert row, when designed, then it accommodates a severity indicator for future SLA alerts


---

# 14. Phase 1 Summary

| Metric | Value |
|---|---|
| Foundation tasks | 5 (28 pts) |
| Epics | 5 |
| User stories | 28 (127 pts) |
| **Total points** | **155** |
| Acceptance criteria | 123 |
| P0 stories | 17 |
| P1 stories | 11 |

**Sequence:** Foundation tasks → E1 → E2 → E3 → E4 → E5. E2 precedes E3 because a ticket requires a customer.
