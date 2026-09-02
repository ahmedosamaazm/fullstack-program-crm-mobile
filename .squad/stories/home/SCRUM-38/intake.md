> **Fetched from jira:** [SCRUM-38](https://azm-crm.atlassian.net/browse/SCRUM-38)  
> *Fetched 2026-08-30T10:48:42.299Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-021 My tickets preview  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-4.1_S05

### Description

As an agent, I want a preview of my tickets on Home so that I can act without navigating.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/home/SCRUM-38/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `home`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-38` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-4.1_S05`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-021 My tickets preview
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want a preview of my tickets on Home so that I can act without navigating.
```

---

## Acceptance criteria

- Given assigned tickets, when Home loads, then up to five display ordered by priority then age
- Given a preview row, when tapped, then that ticket opens
- Given a View all action, when tapped, then the Tickets tab opens filtered to Mine

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
Endpoint: `docs/phase1_api_reference.md` §4.1 (list — Mine), sliced to the
first 5 client-side.

Reuse the existing ['tickets', 'mine'] query from the Tickets screen
(SCRUM-27) rather than writing a parallel one — Home should read the same
cache entry, just render fewer rows and add the "View all" link.

Ordering: priority first, then age — not just created_at descending. An
urgent ticket from yesterday should outrank a low-priority one from
this morning.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4009&t=9iRHjUxUG87jVmdc-4
Fetch via Figma MCP.

Rows must be structurally identical to the Tickets screen rows: priority
rail on the leading edge, subject with right-aligned relative time on
line one, reference · customer name with right-aligned status dot on
line two. Several design iterations let Home's rows drift from Tickets'
rows — anchor to the Tickets screen's actual implementation, not a
possibly-stale mockup

## Out of scope

- What this story explicitly does **not** cover:
