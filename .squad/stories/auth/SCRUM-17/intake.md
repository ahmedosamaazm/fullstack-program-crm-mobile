> **Fetched from jira:** [SCRUM-17](https://azm-crm.atlassian.net/browse/SCRUM-17)  
> *Fetched 2026-08-29T16:23:10.137Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-001 Agent login  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-10.1_S02

### Description

As an agent, I want to log in with email and password so that I can access my tickets.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/auth/SCRUM-17/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `auth`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-17` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-10.1_S02`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-001 Agent login
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to log in with email and password so that I can access my tickets.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given valid credentials, when I submit, then I am authenticated and routed to Home
- Given invalid credentials, when I submit, then a clear error appears and no session is created
- Given a deactivated account, when I attempt login, then access is denied
- Given the login screen, when displayed, then no self-registration option is present
- Given an empty required field, when I submit, then validation blocks the request
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
Endpoints: `docs/phase1_api_reference.md` §1 (Authentication).
Use `supabase.auth.signInWithPassword()` from supabase-js — the reference
documents raw HTTP because that's what Postman needs, but the SDK wraps it
and handles session persistence and refresh.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4614&t=hh59hMhEvs4UoarE-4
Fetch via Figma MCP during implementation.

## Out of scope

- What this story explicitly does **not** cover:
