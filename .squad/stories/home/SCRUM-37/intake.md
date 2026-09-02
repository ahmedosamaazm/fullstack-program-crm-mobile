> **Fetched from jira:** [SCRUM-37](https://azm-crm.atlassian.net/browse/SCRUM-37)  
> *Fetched 2026-08-29T18:12:11.421Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-020 Home workload summary  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-4.1_S05

### Description

As an agent, I want my workload at a glance so that I know where to start.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/home/SCRUM-37/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `home`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-37` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-4.1_S05`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-020 Home workload summary
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want my workload at a glance so that I know where to start.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given I open Home, when it loads, then My Open, Unassigned and Resolved Today counts display
- Given I change a ticket status, when I return to Home, then counts reflect the change
- Given an agent with no tickets, when Home loads, then an empty state renders
- Given the stat row, when laid out, then a slot is reserved beneath it for future SLA alerts
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
Endpoints: `docs/phase1_api_reference.md` §2 (agent profile), §4.1–4.2 (My tickets
and Unassigned lists), §4.5 (the three workload counts), §4.8 (claim).

Use the supabase-js client, not raw fetch. For counts use
`supabase.from('tickets').select('*', { count: 'exact', head: true })` — the SDK
exposes `count` directly rather than parsing the Content-Range header.

Key all six queries under `['tickets', ...]` in TanStack Query. Claim must remove
the ticket from Unassigned, add it to My tickets, and update all three counts —
that's one invalidateQueries({ queryKey: ['tickets'] }) after the mutation, but
only if the key structure supports it.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-8&t=hh59hMhEvs4UoarE-4
Fetch via Figma MCP during implementation.

## Out of scope

- What this story explicitly does **not** cover:
