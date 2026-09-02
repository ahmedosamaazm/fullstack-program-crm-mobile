> **Fetched from jira:** [SCRUM-18](https://azm-crm.atlassian.net/browse/SCRUM-18)  
> *Fetched 2026-08-30T22:53:52.125Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-002 Session persistence  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-10.1_S01

### Description

As an agent, I want to stay logged in so that I do not re-authenticate constantly.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/auth/SCRUM-18/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `auth`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-18` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-10.1_S01`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-002 Session persistence
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to stay logged in so that I do not re-authenticate constantly.
```

---

## Acceptance criteria

- Given I am logged in, when I close and reopen the app, then my session resumes
- Given a session inactive over 30 days, when I open the app, then I am returned to Login
- Given I sign out, when the action completes, then all session and cached data are cleared

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
No new endpoint. Session handling is entirely client-side, via the
Supabase client's config in src/core/lib/supabase.ts — persistSession
and autoRefreshToken should already be set from Sprint 1's scaffold.

This story has never been explicitly verified. Before planning: check
whether the acceptance criteria are already satisfied by the existing
client config, or whether real work remains.

Acceptance criteria to verify, from docs/phase1_brd.md US-002:
1. Given I am logged in, when I close and reopen the app, then my
   session resumes.
2. Given a session inactive over 30 days, when I open the app, then I
   am returned to Login.
3. Given I sign out, when the action completes, then all session and
   cached data are cleared.

Criterion 3 is the one most likely to be missing, since it depends on
the TanStack Query cache being cleared alongside the auth session —
supabase.auth.signOut() alone does not touch the query cache. If Profile
(SCRUM-46)'s sign-out doesn't call queryClient.clear() (or similar), a
different agent signing into the same device would see the previous
agent's cached data.

## Design
No Figma frame — this is behavioural, not visual. Nothing new to design;
verify against the existing app.

## Out of scope

- What this story explicitly does **not** cover:
