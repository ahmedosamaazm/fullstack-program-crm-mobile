> **Fetched from jira:** [SCRUM-23](https://azm-crm.atlassian.net/browse/SCRUM-23)  
> *Fetched 2026-08-30T07:41:57.592Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-007 Edit customer details  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.2_S13

### Description

As an agent, I want to update customer details so that records stay accurate.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/customers/SCRUM-23/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `customers`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-23` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.2_S13`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-007 Edit customer details
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to update customer details so that records stay accurate.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given an existing customer, when I edit and save, then changes persist
- Given I add a secondary contact, when saved, then it appears on the profile
- Given I remove a secondary contact, when saved, then it no longer appears
- Given I edit a customer from another branch via API, when the call executes, then it is rejected
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
Endpoint: `docs/phase1_api_reference.md` §3.4 (update).

Reuse the same form fields and validation as Create Customer (SCRUM-22) —
this is the same shape, pre-populated, with Save instead of Create.

Same duplicate-phone constraint applies on update as on create — a 409
if the edited phone collides with another customer in the same branch.

Invalidate both ['customers'] (the list) and ['customers', id] (this
customer's detail) on success, so changes are visible immediately in
both places without a manual refetch.

## Design
Figma: [reuses the Create Customer frame, or a distinct Edit frame if
one exists — check before assuming they're identical]

## Out of scope

- What this story explicitly does **not** cover:
