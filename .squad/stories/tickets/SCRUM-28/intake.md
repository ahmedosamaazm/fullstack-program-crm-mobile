> **Fetched from jira:** [SCRUM-28](https://azm-crm.atlassian.net/browse/SCRUM-28)  
> *Fetched 2026-08-30T07:59:17.928Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-012 Create a ticket  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.1_feat-2.2_S08

### Description

As an agent, I want to create a ticket so that a customer request is tracked.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-28/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-28` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.1_feat-2.2_S08`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-012 Create a ticket
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to create a ticket so that a customer request is tracked.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given I select a customer and complete required fields, when I save, then a ticket is created with status new
- Given a ticket is created, when saved, then a unique reference in format TKT-YYYYMM-NNNNN is generated
- Given a required field is empty, when I save, then validation blocks submission
- Given no priority is chosen, when I save, then medium is applied
- Given a ticket is created, when written, then a created event is recorded
- Given creation succeeds, when complete, then the new ticket opens
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
Endpoint: `docs/phase1_api_reference.md` §4.7 (create).

Use the supabase-js client. reference and status are generated
server-side — do not send them in the insert payload. status defaults
to 'new'.

Customer picker, category select, and priority chips read from live
tables (customers, categories) — not hardcoded values, since an admin
adding a sixth category should not require a code change.

Key under ['tickets', ...] and invalidate on success so the new ticket
appears in the relevant lists (Mine, All) without a manual refetch.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4009&t=9iRHjUxUG87jVmdc-4
Fetch via Figma MCP.

## Out of scope

- What this story explicitly does **not** cover:
