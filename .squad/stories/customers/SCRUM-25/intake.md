> **Fetched from jira:** [SCRUM-25](https://azm-crm.atlassian.net/browse/SCRUM-25)  
> *Fetched 2026-08-30T10:53:48.418Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-009 Customer interaction history  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.3_S12

### Description

As an agent, I want to see a customer's past tickets so that I understand their situation.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/customers/SCRUM-25/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `customers`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-25` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.3_S12`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-009 Customer interaction history
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to see a customer's past tickets so that I understand their situation.
```

---

## Acceptance criteria

- Given a customer with tickets, when I open the Tickets tab, then all their tickets list newest first
- Given a closed ticket, when history renders, then it is still included
- Given a customer with no tickets, when the tab opens, then an empty state renders
- Given a history row, when I tap it, then that ticket opens

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
Endpoint: `docs/phase1_api_reference.md` §3.5 (detail with embedded history).

Reuse the same ['customers', id] query SCRUM-24 already reads — this tab
renders the tickets array from that same response, it does not fetch
separately.

Order tickets newest first. All statuses shown, including resolved and
closed — this is a full history, not a filtered active-only view.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4310&t=9iRHjUxUG87jVmdc-4
Fetch via Figma MCP.

Ticket rows are structurally identical to the Tickets screen rows.

Two things in the fetched frame are NOT yet decided spec — do not
implement them silently:
1. Resolved/closed rows appear visually muted in this frame. This
   treatment is not in DESIGN.md. If implemented, it must be added to
   DESIGN.md as a rule first so it applies consistently wherever
   ticket history appears, not only here.
2. A clock icon appears in the header next to call/email with no
   defined function. Confirm with the user whether it does something
   (flag as an open question) or remove it — do not implement a
   click handler that guesses at its purpose.

The Notes tab (blocked, SCRUM-26) must still render as a reachable but
empty/placeholder tab — three tabs total, not two.

## Out of scope

- What this story explicitly does **not** cover:
