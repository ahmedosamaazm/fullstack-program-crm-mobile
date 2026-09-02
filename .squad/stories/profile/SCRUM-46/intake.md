> **Fetched from jira:** [SCRUM-46](https://azm-crm.atlassian.net/browse/SCRUM-46)  
> *Fetched 2026-08-29T19:13:27.511Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-030 — Profile & Settings  
**Type:** Story  
**Status:** To Do  
**Assignee:** Ahmed Osama  
**Labels:** phase-1_agent_feat-2.1_S07

### Description

As an agent, I want to view my identity and control language, theme, and notifications so that I can work in my preferred setup and sign out securely.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/profile/SCRUM-46/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `profile`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-46` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** `Ahmed Osama`
- **Labels:** `phase-1_agent_feat-2.1_S07`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-030 — Profile & Settings
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to view my identity and control language, theme, and notifications so that I can work in my preferred setup and sign out securely.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Given the Profile screen, when opened, then my name, role, department and branch display, read-only
- Given the language row, when tapped, then I can switch between Arabic and English, and the change applies immediately
- Given the theme row, when tapped, then I can choose light, dark, or system, and the choice persists across restarts
- Given the sign out row, when tapped, then my session ends and the query cache clears, so no data from my session is visible to the next user
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
No ticket or customer endpoints. Profile reads from `docs/phase1_api_reference.md`
§2 (agent profile) — the same query Home already uses for the greeting.

Reuse that existing hook rather than writing a second one against ['profile', ...].

Sign out uses supabase.auth.signOut() and must clear the TanStack Query cache
entirely, not just the auth session — otherwise a different agent signing in
on the same device sees the previous agent's cached data.

Theme (light/dark/system) and language (ar/en) are local device state, not
server data — no API call, these persist via the existing ThemeProvider and
i18n setup from Sprint 1.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=7-4492&t=hh59hMhEvs4UoarE-4

## Out of scope

- What this story explicitly does **not** cover:
