> **Fetched from jira:** [SCRUM-30](https://azm-crm.atlassian.net/browse/SCRUM-30)  
> *Fetched 2026-08-29T20:51:13.112Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-014 Ticket detail and conversation thread  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-2.1_feat-4.2_S07

### Description

As an agent, I want all ticket context in one screen so that I can work it efficiently.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/tickets/SCRUM-30/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `tickets`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-30` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-2.1_feat-4.2_S07`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-014 Ticket detail and conversation thread
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want all ticket context in one screen so that I can work it efficiently.
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
Endpoint: `docs/phase1_api_reference.md` §4.6 (detail), §5.1–5.4 (messages),
§4.10 (history).

Use the supabase-js client. Messages split into two independent queries filtered
by is_internal — do not fetch all messages and filter client-side, since that
means internal notes pass through client memory unnecessarily and a rendering
bug could expose them.

is_internal is NOT NULL with no default in the schema — type it as a required
field in the mutation payload, never optional, so a missing value is a
compile error rather than a runtime failure that silently defaults wrong.

Status transitions must only offer states reachable from BRD §6's state
machine — reuse src/features/tickets/state-machine.ts rather than
re-deriving the transition map. The database trigger is the actual
guarantee; the client map exists so the picker never shows an illegal
option in the first place.

Key queries under ['tickets', id] and ['tickets', id, 'messages'] so that
posting a reply or changing status invalidates correctly without refetching
the entire ticket list.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-1638&t=hh59hMhEvs4UoarE-4
Fetch via Figma MCP during implementation.

The internal-note treatment must be unmistakably a different class of row,
not a styled variant — its own leading rail colour, a background wash across
the full row, a lock icon, and a label. Several design iterations rendered
this as chat bubbles with subtle colour differences only; that's not
sufficient here regardless of what the fetched frame shows.

## Out of scope

- What this story explicitly does **not** cover:
