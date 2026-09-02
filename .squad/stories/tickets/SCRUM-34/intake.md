> **Fetched from jira:** [SCRUM-34](https://azm-crm.atlassian.net/browse/SCRUM-34)  
> *Fetched 2026-08-29T21:03:20.305Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-018 Ticket status transitions  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.4_S10

### Description

As an agent, I want to move a ticket through its lifecycle so that its state is accurate.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-34/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-34` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.4_S10`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-018 Ticket status transitions
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to move a ticket through its lifecycle so that its state is accurate.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given a ticket in any state, when I open the status picker, then only legally reachable states are offered
- Given a transition to resolved, when I confirm, then a resolution note is required
- Given a transition to resolved, when saved, then resolved_at is set
- Given a closed ticket, when any transition is attempted, then it is rejected
- Given an illegal transition submitted directly to the API, when executed, then the database rejects it
- Given any transition, when saved, then a status_changed event records from and to values
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
Endpoint: `docs/phase1_api_reference.md` §4.9 (change status).

Use the shared src/features/tickets/state-machine.ts to determine which
options to show — never hardcode a fresh list here, it must match what
Ticket Detail already imports.

The database trigger is the actual enforcement; this sheet's job is UX,
not security. It will still receive a Postgres exception string if
something inconsistent slips through — map it via the existing
utils/errors.ts rather than showing the raw error text.

Resolving requires a resolution_note in the same request — the sheet must
block submission client-side until the note is filled AND handle the
server rejecting a resolve without one, since both paths exist.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4232&t=hh59hMhEvs4UoarE-4

## Out of scope

- What this story explicitly does **not** cover:
