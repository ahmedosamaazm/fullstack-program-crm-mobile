> **Fetched from jira:** [SCRUM-27](https://azm-crm.atlassian.net/browse/SCRUM-27)  
> *Fetched 2026-08-29T18:51:08.878Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-011 Ticket list with filters  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.1_feat-4.1_S06

### Description

As an agent, I want to filter my ticket queue so that I can focus on what matters.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-27/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-27` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.1_feat-4.1_S06`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-011 Ticket list with filters
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to filter my ticket queue so that I can focus on what matters.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

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
Endpoints: `docs/phase1_api_reference.md` §4.1–4.3 (Mine, Unassigned, All lists),
§4.4 (filter chip counts).

Use the supabase-js client. For the chip counts use
`supabase.from('tickets').select('*', { count: 'exact', head: true })`.

Key all queries under `['tickets', ...]` — the same key namespace Home already uses,
so a mutation from either screen invalidates both. Reuse the existing ticket query
hooks from `src/features/tickets/hooks.ts` rather than writing parallel ones.

Rows are grouped by arrival date under Today / Yesterday / Earlier headers.
Search filters by subject, reference, and customer name — use ilike for now,
full-text search is deferred.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-348&t=hh59hMhEvs4UoarE-4

## Out of scope

- What this story explicitly does **not** cover:
