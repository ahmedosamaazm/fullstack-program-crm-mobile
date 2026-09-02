> **Fetched from jira:** [SCRUM-33](https://azm-crm.atlassian.net/browse/SCRUM-33)  
> *Fetched 2026-08-29T21:07:47.675Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-017 Assign a ticket  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.3_S09

### Description

As an agent, I want to assign a ticket so that ownership is clear.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-33/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-33` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.3_S09`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-017 Assign a ticket
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to assign a ticket so that ownership is clear.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given the assign sheet, when it opens, then only agents in my department are listed
- Given I select an agent, when confirmed, then the ticket is assigned and the sheet closes
- Given an assigned ticket, when I reassign, then the new assignee replaces the previous
- Given I unassign, when confirmed, then the ticket returns to the unassigned pool
- Given any assignment change, when saved, then an assigned event is recorded
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
Endpoint: `docs/phase1_api_reference.md` §4.8 (assign/claim/unassign).

Reuse the agent-list query and RLS scoping already proven in Home's Claim
flow (SCRUM-36) — this is the same PATCH, just from a full sheet with
search rather than a single button.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4118&t=hh59hMhEvs4UoarE-4
Fetch via Figma MCP during implementation.

## Out of scope

- What this story explicitly does **not** cover:
