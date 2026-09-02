> **Fetched from jira:** [SCRUM-22](https://azm-crm.atlassian.net/browse/SCRUM-22)  
> *Fetched 2026-08-30T07:35:39.368Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-006 Create a customer  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.1_feat-1.2_S13

### Description

As an agent, I want to add a new customer so that I can log their request.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/customers/SCRUM-22/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `customers`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-22` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.1_feat-1.2_S13`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-006 Create a customer
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to add a new customer so that I can log their request.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given required fields are complete, when I save, then the customer is created and opened
- Given a required field is empty, when I save, then validation blocks with a field-level message
- Given an invalid phone format, when I save, then it is rejected
- Given a phone already used in my branch, when I save, then a duplicate warning appears
- Given a save succeeds, when the record is written, then department and branch are inherited from me
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
Endpoint: `docs/phase1_api_reference.md` §3.3 (create).

Duplicate phone within the same branch returns 409 from the unique
constraint — surface it as a field-level error on phone, not a generic
toast.

Key under ['customers', ...], reusing the existing list query's cache
so a successful create appears immediately without a manual refetch —
invalidate ['customers'] on success.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-2799&t=9iRHjUxUG87jVmdc-4
Fetch via Figma MCP.

## Out of scope

- What this story explicitly does **not** cover:
