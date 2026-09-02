> **Fetched from jira:** [SCRUM-31](https://azm-crm.atlassian.net/browse/SCRUM-31)  
> *Fetched 2026-08-30T22:32:36.557Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-015 Post a public reply  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.1_S07

### Description

As an agent, I want to reply to the customer so that they receive an answer.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-31/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-31` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.1_S07`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-015 Post a public reply
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to reply to the customer so that they receive an answer.
```

---

## Acceptance criteria

- Given the composer in public mode, when I send, then the message saves with is_internal false
- Given a public reply, when it renders, then it is visually distinct from internal notes
- Given a public reply, when the customer opens the status page, then it is visible
- Given an empty composer, when I attempt to send, then the action is blocked

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
Endpoint: `docs/phase1_api_reference.md` §5.3 (post a public reply).

This is likely already implemented — postTicketMessage() in
src/features/tickets/api.ts sends isInternal: false for this path, wired
to the Public reply mode of the composer already built for SCRUM-30.

Before planning anything: confirm whether this exists first. If it does,
this intake should verify rather than build — check the message appears
in the Conversation tab, uses the correct message row styling (no chat
bubble, leading rail in the customer/agent-reply colour), and that the
composer clears and the list refreshes after send.

## Design
Figma: node-id 7-4614 area — same Ticket Detail frame as SCRUM-30. No
separate frame for this story; it's the composer's default (non-toggled)
state.

## Out of scope

- What this story explicitly does **not** cover:
