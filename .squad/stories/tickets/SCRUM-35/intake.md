> **Fetched from jira:** [SCRUM-35](https://azm-crm.atlassian.net/browse/SCRUM-35)  
> *Fetched 2026-08-30T21:21:31.416Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-019 Ticket history timeline  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.5_S07

### Description

As an agent, I want to see everything that happened to a ticket so that I can audit its handling.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-35/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-35` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.5_S07`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-019 Ticket history timeline
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to see everything that happened to a ticket so that I can audit its handling.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*
- Given a ticket, when I open the History segment, then all events display chronologically
- Given an event, when rendered, then actor, action and timestamp display
- Given a timestamp, when displayed, then it renders in device local time
- Given the history, when displayed, then no edit or delete affordance exists
- Given an update or delete attempted on ticket_events via API, when executed, then it is rejected



```

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
Endpoint: `docs/phase1_api_reference.md` §4.10 (history).

Read-only. All events come from the ticket_events table, populated
automatically by the database triggers from state transitions and
assignment changes — no write path in this story, purely rendering.

Order chronologically, most recent first. Include actor name via the
embedded profiles join already shown in the reference.

Key under ['tickets', id, 'events'] or similar, scoped alongside the
other per-ticket queries.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=187-1192&t=OcR5i3hQ78ZXvpXT-4
Fetch via Figma MCP.

This is the third tab in the same segmented control already built for
SCRUM-30/31/32 — Conversation, Internal notes, History. Confirm the
tab exists and is currently empty/unwired before building, rather than
assuming it needs to be added from scratch.

## Out of scope

- What this story explicitly does **not** cover:
