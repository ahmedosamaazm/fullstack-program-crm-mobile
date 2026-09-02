> **Fetched from jira:** [SCRUM-36](https://azm-crm.atlassian.net/browse/SCRUM-36)  
> *Fetched 2026-08-30T22:48:55.594Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-029 Claim an unassigned ticket  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.3_S05

### Description

As an agent, I want to claim an unassigned ticket from Home so that I can pick up waiting work without navigating to the queue.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/home/SCRUM-36/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `home`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-36` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.3_S05`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-029 Claim an unassigned ticket
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to claim an unassigned ticket from Home so that I can pick up waiting work without navigating to the queue.
```

---

## Acceptance criteria

- Given an unassigned ticket on Home, when I tap Claim, then the ticket is assigned to me
- Given I claim a ticket, when the action completes, then it moves from the Unassigned list to My tickets
- Given I claim a ticket, when the counts refresh, then My open and Unassigned both update
- Given I claim a ticket, when it is saved, then an assigned event is recorded in the ticket history
- Given another agent claims a ticket first, when I tap Claim, then I am told it is already assigned

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
Endpoint: `docs/phase1_api_reference.md` §4.8 (assign/claim).

Already implemented — claimTicket(ticketId, userId) in api.ts:272, with
race handling: throws when the ticket is already assigned to someone
else by the time the claim executes.

Before planning anything: confirm this exists first. If it does, verify
rather than build. Specifically test the race, since that's the one
part of this story that's easy to implement but hard to prove works:

1. Claim an unassigned ticket normally — confirm it moves from
   Unassigned to My tickets and all three Home counts update.
2. Simulate two near-simultaneous claims on the same ticket (two
   Postman requests fired close together, or two sessions) — confirm
   the second gets an "already assigned" error, not a silent success
   or a second row.
3. Confirm query invalidation covers all six Home queries (['tickets',
   ...] namespace) so the counts and both preview lists update from
   one claim, not just the list the ticket moved out of.

## Design
Figma: node-id 7-8 area — same Home frame already built. No new frame;
this is the existing Claim button on the Unassigned section.

## Out of scope

- What this story explicitly does **not** cover:
