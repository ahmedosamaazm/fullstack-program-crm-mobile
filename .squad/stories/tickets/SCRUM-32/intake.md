> **Fetched from jira:** [SCRUM-32](https://azm-crm.atlassian.net/browse/SCRUM-32)  
> *Fetched 2026-08-30T22:46:22.571Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-016 Post an internal note  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-4.5_S07

### Description

As an agent, I want to leave notes for colleagues so that we collaborate without exposing detail to the customer.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-32/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-32` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-4.5_S07`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-016 Post an internal note
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to leave notes for colleagues so that we collaborate without exposing detail to the customer.
```

---

## Acceptance criteria

- Given the composer in internal mode, when I send, then the message saves with is_internal true
- Given the composer, when in internal mode, then the mode is indicated by color, icon and label together
- Given an internal note, when the customer opens the status page, then it is absent from the response payload
- Given an internal note, when a colleague in my department opens the ticket, then it is visible
- Given the messages table, when a row is inserted, then is_internal must be supplied explicitly

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
Endpoint: `docs/phase1_api_reference.md` §5.4 (post an internal note).

This is likely already implemented — postTicketMessage() sends
isInternal: true for this path, wired to the Internal note toggle mode
of the composer built for SCRUM-30. MessageRow.tsx already has the
distinct treatment (rail colour, background wash, lock icon, label).

Before planning anything: confirm this exists first. If it does, this
intake should verify, not build. This is the highest-risk story in
Phase 1 — verify all three of these independently, not just visually:

1. The note appears in the Conversation tab's rendered UI — must NOT.
2. The Conversation tab's actual API response (getMessages filtered by
   is_internal: false) — the note must be absent from the payload
   itself, not just hidden by the UI.
3. Attempt to insert a message via API with is_internal omitted —
   must fail at the database, since the column is NOT NULL with no
   default.

## Design
Figma: same Ticket Detail frame as SCRUM-30/31 (node-id 7-4614 area).
No new frame — this is the composer's "Internal note" toggle state,
already built.

## Out of scope

- What this story explicitly does **not** cover:
