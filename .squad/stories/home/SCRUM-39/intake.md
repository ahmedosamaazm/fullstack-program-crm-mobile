> **Fetched from jira:** [SCRUM-39](https://azm-crm.atlassian.net/browse/SCRUM-39)  
> *Fetched 2026-08-30T22:51:08.159Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-022 New ticket quick action  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-4.1_S05

### Description

As an agent, I want to start a ticket from anywhere so that I can capture a request during a call.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/home/SCRUM-39/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `home`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-39` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-4.1_S05`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-022 New ticket quick action
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to start a ticket from anywhere so that I can capture a request during a call.
```

---

## Acceptance criteria

- Given Home or the Tickets tab, when displayed, then a New Ticket action is visible
- Given the action, when tapped, then the ticket creation screen opens

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
No new endpoint — this triggers the create-ticket flow already covered
by `docs/phase1_api_reference.md` §4.7.

Already implemented, but via a different story than SCRUM-30/Home: per
SCRUM-28's plan overview, "the two FABs on Home and the Tickets tab both
retarget at the new /tickets/new modal" — this was a side effect of
building Create Ticket, not something SCRUM-30 or the Home stories
touched directly.

Before planning anything: confirm this exists first. If it does, verify
rather than build. Specifically confirm BOTH entry points work, since
the story covers two FABs, not one:

1. Home screen FAB → opens /tickets/new
2. Tickets tab FAB → opens /tickets/new
3. Both land on the same screen with an empty form — no leftover state
   from wherever the FAB was tapped.

## Design
Figma: no distinct frame for this story — it's the FAB already present
on both the Home (node-id 7-8) and Tickets (node-id 7-2799, or wherever
that frame is) frames, routing to the Create Ticket frame already built.

## Out of scope

- What this story explicitly does **not** cover:
