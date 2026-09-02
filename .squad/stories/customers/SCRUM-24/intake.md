> **Fetched from jira:** [SCRUM-24](https://azm-crm.atlassian.net/browse/SCRUM-24)  
> *Fetched 2026-08-30T07:50:43.945Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-008 Customer profile view  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.1_feat-1.2_S12

### Description

As an agent, I want the customer's details in one place so that I have context.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/customers/SCRUM-24/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `customers`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-24` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.1_feat-1.2_S12`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-008 Customer profile view
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want the customer's details in one place so that I have context.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given a customer, when I open their profile, then name, phone, email and secondary contacts display
- Given a phone number, when I tap it, then the dialler opens
- Given an email, when I tap it, then the mail client opens
- Given the profile, when displayed, then Info, Tickets and Notes tabs are present
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
Endpoint: `docs/phase1_api_reference.md` §3.5 (detail with embedded history)
covers the data this screen needs, though this story is Info-tab only —
US-009 (SCRUM-25) builds the Tickets tab on the same screen.

Use the supabase-js client with an embedded select so name, phone, email,
secondary_contacts, department, branch, and created_at come back in one
request — no separate calls per field.

Key under ['customers', id]. This is the same cache entry SCRUM-23's edit
form reads and writes, and SCRUM-25's Tickets tab extends — all three
should share one query rather than each fetching independently.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4310&t=9iRHjUxUG87jVmdc-4
Fetch via Figma MCP.

Segmented control: Info, Tickets, Notes. This story builds the screen
shell and the Info tab. Tickets tab is SCRUM-25. Notes tab is SCRUM-26,
currently blocked on Storage (§7) — render its empty/placeholder state
but don't wire it.

## Out of scope

- What this story explicitly does **not** cover:
