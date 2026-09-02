> **Fetched from jira:** [SCRUM-45](https://azm-crm.atlassian.net/browse/SCRUM-45)  
> *Fetched 2026-08-31T23:44:56.467Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-028 In-app notification centre  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-5.4a_S15b

### Description

As an agent, I want a list of my alerts so that I do not miss assignments.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/notifications/SCRUM-45/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `notifications`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-45` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-5.4a_S15b`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-028 In-app notification centre
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want a list of my alerts so that I do not miss assignments.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given a ticket is assigned to me, when it saves, then a push notification is sent
- Given the notification centre, when opened, then alerts list newest first grouped by Today and Earlier
- Given unread alerts, when Home renders, then the bell icon shows an accurate badge count
- Given I open an alert, when tapped, then the related ticket opens and the alert marks read
- Given the alert row, when designed, then it accommodates a severity indicator for future SLA alerts
```

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |
| *(e.g. `attachments/flow.png`)* | *(e.g. UX flow)* |

*(Add rows per file. If none, write "None.")*

---

## Dependencies

- **Blocked by / related ids:** (tracker ids only; optional short note)
- **Depends on code areas or other stories:**

## Extra notes (optional)

- Anything not captured above (e.g. chat context) — keep short.

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## API
Endpoints: `docs/phase1_api_reference.md` §9 (notifications), and the
`08 Notifications` folder in the Postman collection for working examples.

Backend is complete and verified — table, RLS, and three triggers.

Use the supabase-js client. Key under ['notifications', ...].

List: filter by recipient_id = current user, order created_at desc.
RLS already scopes this, but filter explicitly anyway so the query is
readable and the intent is obvious.

Unread count for the Home bell badge: select with count — the count comes
back in the response body as [{ count: n }], and the SDK exposes it via
the `count` property using
`supabase.from('notifications').select('*', { count: 'exact', head: true })`.

Mark read is a PATCH setting is_read: true. Mark-all-read patches every
row where recipient_id = me and is_read = false. Invalidate
['notifications'] after either so the badge updates.

Clients cannot insert — there is deliberately no insert policy. Rows come
only from triggers. Do not attempt to create notifications from the app.

Five types must render: assigned, reply, status, unassigned, rating.
Only the first three currently fire — `unassigned` needs pg_cron and
`rating` needs the CSAT flow, both still outstanding. Build for all five;
expect to see three in testing.

Tapping a row opens the related ticket and marks it read.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-3066&t=fcoAOt40Etpn8q5X-4
Fetch via Figma MCP.

Rows group under "Today" and "Earlier" section headers, using the same
section header treatment as Tickets' date grouping.

Unread state is a boolean on the row, not a separate variant — one
NotificationRow component with five type values and an unread flag,
not ten variants. Unread is signalled by row tint AND title weight
together, not colour alone.

## Out of scope

- What this story explicitly does **not** cover:
