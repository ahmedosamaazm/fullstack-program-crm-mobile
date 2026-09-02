> **Fetched from jira:** [SCRUM-13](https://azm-crm.atlassian.net/browse/SCRUM-13)  
> *Fetched 2026-09-01T06:57:14.755Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** TF-02 Theming — light & dark  
**Type:** Task  
**Status:** To Do  
**Labels:** phase-1_foundation

### Description

Both themes available across the app, driven by semantic tokens.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/foundation/SCRUM-13/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `foundation`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-13` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Task`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_foundation`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
TF-02 Theming — light & dark
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
Both themes available across the app, driven by semantic tokens.
```

---

## Acceptance criteria

- System preference applied on first launch
- Manual override persists across restart
- Theme switches instantly with no restart
- All text and interactive elements meet WCAG AA contrast in both themes
- Status and priority colors remain distinguishable in both themes
- No hardcoded color literals anywhere in component code

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
No endpoints. Theme is local device state via ThemeProvider, persisted
locally — not server data.

## Design
No single frame — this applies across every screen. Every generated
mockup was light, so dark mode has no visual reference and must be
verified against the implemented token sets directly.

Four of six criteria are already met: both full token sets exist,
switching is instant, system preference is read on first launch, and
hex literals are eslint-banned. The remaining scope is:

1. WCAG AA contrast — never measured by anything. All text and
   interactive elements must meet AA in both themes. Check the token
   pairs that actually get used together, not every possible
   combination.

2. Status and priority colours must remain distinguishable in both
   themes. Known collision: pending and closed currently share
   bgSurfaceSunken. Two statuses sharing a background means they're
   distinguishable by dot colour alone. Either separate the
   backgrounds or confirm the dot plus label text is sufficient.

3. Dark mode has never been visually verified on any screen. Confirm
   the full screen set renders correctly in dark before closing.

## Out of scope

- What this story explicitly does **not** cover:
