# Phase 1 Remaining Stories — Backend Readiness

Classification of 40 remaining user stories against `phase1_backend_plan.md`'s completion status and the gating table in `phase_1_frontend_roadmap.md`.

**Legend:** ✅ Ready now · 🔨 Blocked · ⚠️ High-risk

---

## ✅ Ready now (sorted by epic, in roadmap sequence)

### Technical Foundation (SCRUM-6)

No backend dependency. Must land first per the roadmap's "foundation before features" rule.

| Story | Key | Priority | Notes |
|---|---|---|---|
| TF-01 Localisation & RTL | SCRUM-12 | Highest | Do first — most expensive to retrofit |
| TF-02 Theming — light & dark | SCRUM-13 | Highest | |
| TF-03 Adaptive layout — phone & tablet | SCRUM-14 | Highest | |
| TF-04 Tenancy scoping — department & branch | SCRUM-15 | Highest | Backend already satisfied (§3/§4 complete). Close or use to track verification pass. |
| TF-05 Screen state coverage | SCRUM-16 | Highest | Build Skeleton, EmptyState, ErrorState, OfflineBanner before lists need them |

**Subtotal:** 5 stories, 23 points

---

### Authentication & Access Control (SCRUM-7)

Schema + RLS complete (§1–4). Login already shipped in Sprint 1 (SCRUM-17).

| Story | Key | Priority | Notes |
|---|---|---|---|
| US-002 Session persistence | SCRUM-18 | Highest | Part of Sprint 1 |
| US-003 Password reset | SCRUM-19 | High | Standard Supabase auth flow |
| US-004 Department and branch access isolation | SCRUM-20 | Highest | Verify RLS enforcement by direct API call, not UI observation |

**Subtotal:** 3 stories, 14 points

---

### Customer Management (SCRUM-8)

Sprint 2. Sequence per roadmap §2.2.

| Story | Key | Priority | Notes |
|---|---|---|---|
| US-006 Create a customer | SCRUM-22 | Highest | Duplicate phone within branch → 409 (field error) |
| US-007 Edit customer details | SCRUM-23 | High | |
| US-008 Customer profile view | SCRUM-24 | Highest | Info, Tickets, Notes tabs |
| US-009 Customer interaction history | SCRUM-25 | High | |

**Subtotal:** 4 stories, 14 points

---

### Ticket Management (SCRUM-9)

Sprint 2. Sequence per roadmap §2.3. Includes core conversation loop, assignment, status transitions, and history.

| Story | Key | Priority | Notes |
|---|---|---|---|
| US-012 Create a ticket | SCRUM-28 | Highest | Reference and status are server-generated |
| US-013 Create a customer inline during ticket creation | SCRUM-29 | High | Preserve entered fields across detour |
| US-015 Post a public reply | SCRUM-31 | Highest | Visually distinct from internal notes |
| US-016 Post an internal note | SCRUM-32 | Highest | ⚠️ **Highest-risk story in Phase 1** — must be absent from Conversation tab, API payload, and customer status page. Verify three ways. `is_internal` has no default; omitting it fails at the database. |
| US-019 Ticket history timeline | SCRUM-35 | High | All events chronological, read-only, populated by triggers |

**Subtotal:** 5 stories, 26 points

---

### Agent Dashboard (SCRUM-10)

Sprint 3.1. Explicitly called "✅ unblocked" in the roadmap despite being Sprint 3.

| Story | Key | Priority | Notes |
|---|---|---|---|
| US-021 My tickets preview | SCRUM-38 | High | Up to five assigned tickets, ordered by priority then age |
| US-022 New ticket quick action | SCRUM-39 | High | FAB on Home and Tickets tab |
| US-029 Claim an unassigned ticket | SCRUM-36 | High | Jira parents under Ticket Management; roadmap §3.1 groups with Home. Handle the race — second agent gets zero rows, surfaces as "already assigned". |

**Subtotal:** 3 stories, 8 points

---

## 🔨 Blocked

### Customer Management (SCRUM-8)

| Story | Key | Priority | Blocked on | Status |
|---|---|---|---|---|
Nothing blocked. **US-010 (SCRUM-26) is built** — attachments (upload, list, full-screen viewer,
10 MB + MIME guards) and free-text notes (newest-first list with author and timestamp, plus a
composer). Its original blocker (§7 Storage) shipped, and the `customer_notes` table the notes
half turned out to need was deployed afterwards.

**Subtotal:** 0 stories, 0 points

---

### Customer Notification Loop (SCRUM-11)

Entire epic blocked. Six stories waiting on backend work.

| Story | Key | Priority | Blocked on | Status |
|---|---|---|---|---|
| US-023 Ticket confirmation notification | SCRUM-40 | Highest | §9 Email delivery (provider undecided) | Not started |
| US-024 Status change notification | SCRUM-41 | High | §9 Email delivery | Not started |
| US-025 Magic-link status page | SCRUM-42 | Highest | §8 Token API | Not started |
| US-026 Status page data isolation | SCRUM-43 | Highest | §8 Token API | Not started |
| US-027 Submit a satisfaction rating | SCRUM-44 | High | §8 Token API | Not started |
| US-028 In-app notification centre | SCRUM-45 | High | §9 `notifications` table | Not started |

**Subtotal:** 6 stories, 26 points

---

## Summary

| Category | Count | Points |
|---|---|---|
| ✅ Ready to start | **20** | **85** |
| 🔨 Blocked | **6** | **26** |
| **Total remaining** | **26** | **111** |

> Blocked is down one story / 5 points: US-010 (SCRUM-26) is built and has left the table.
> **This summary is still stale in one place** — US-028 (SCRUM-45) is listed above as blocked on
> the §9 `notifications` table, but that table shipped and the in-app notification centre was
> built by story 23. Whoever next touches this file should re-check that row and the counts
> around it; it was not corrected here because it is outside SCRUM-26's scope.

---

## Sequencing notes

### Backend read-ahead
The backend plan's recommended order (§11–12) suggests doing:
1. Migrations (§11)
2. Auth provisioning (§6)
3. Storage (§7)
4. Notifications table (§9)

**This prediction has been borne out**: US-010 (attachments half) and US-028 (in-app alerts) both unblocked before the token API (§8) landed — Storage (§7) and the notifications table (§9) both shipped ahead of it. US-028 is fully built (story 23, SCRUM-45). US-010's attachments are built (story 24, SCRUM-26); its free-text notes are not — that gap turned out to be a missing table (`customer_notes`), not the token API, and remains open.

### Definition of Done
Per the roadmap, every story ships with:
- Acceptance criteria pass
- Arabic RTL and English LTR verified
- Light and dark themes
- Phone and tablet layouts
- All four states (loading, empty, error, populated)
- RLS verified by direct API call, not UI observation
- No hardcoded strings or colour literals

---

## Related documents
- `phase1_backend_plan.md` — backend readiness gates and what blocks each story
- `phase_1_frontend_roadmap.md` — build sequence, sprint grouping, and cross-cutting practices
- `phase1_api_reference.md` — endpoint contracts
- `phase1_brd.md` — data model, state machine, acceptance criteria
