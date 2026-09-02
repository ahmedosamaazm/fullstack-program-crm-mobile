> **Fetched from jira:** [SCRUM-21](https://azm-crm.atlassian.net/browse/SCRUM-21)  
> *Fetched 2026-08-29T19:02:16.717Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-005 Customer list and search  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.1_S11

### Description

As an agent, I want to find a customer quickly so that I can act during a live call.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/customers/SCRUM-21/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `customers`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-21` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.1_S11`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-005 Customer list and search
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to find a customer quickly so that I can act during a live call.
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
Endpoints: `docs/phase1_api_reference.md` §3.1 (list), §3.2 (search).

Use the supabase-js client. Search uses ilike across full_name, phone, and email —
full-text search is deferred to a later phase, this is the interim approach.

Key queries under ['customers', ...]. This is a new namespace, separate from
['tickets', ...] — the customer picker in Create Ticket (SCRUM-28) should reuse
this same query, not duplicate it.

Confirm Arabic name search works correctly — ilike is encoding-agnostic but
worth verifying against the seeded Arabic customer names.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-1920&t=hh59hMhEvs4UoarE-4

## Out of scope

- What this story explicitly does **not** cover:
