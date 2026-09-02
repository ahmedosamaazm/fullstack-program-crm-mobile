> **Fetched from jira:** [SCRUM-29](https://azm-crm.atlassian.net/browse/SCRUM-29)  
> *Fetched 2026-08-30T21:31:32.210Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-013 Create a customer inline during ticket creation  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.1_feat-2.1_S08

### Description

As an agent on a call with a new customer, I want to add them without leaving the form so that I do not lose my input.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-29/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-29` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.1_feat-2.1_S08`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-013 Create a customer inline during ticket creation
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent on a call with a new customer, I want to add them without leaving the form so that I do not lose my input.
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
Same endpoint as SCRUM-22: `docs/phase1_api_reference.md` §3.3 (create).
Reuse the create-customer form and mutation from SCRUM-22 as a component —
do not duplicate the form fields or validation logic here.

On successful creation, the new customer becomes the selected value in
Create Ticket's customer picker, and control returns to the ticket form
with subject, description, category, and priority all still populated
exactly as the agent left them.

## Design
No distinct Figma frame — this is SCRUM-22's Create Customer form presented
as a modal/sheet over Create Ticket rather than as its own full screen.
Confirm the modal presentation (not a full navigation push) preserves the
underlying Create Ticket screen's state when it closes.

Trigger: the "+ New customer" option inside the customer picker on Create
Ticket (already built in SCRUM-28).

## Out of scope

- What this story explicitly does **not** cover:
