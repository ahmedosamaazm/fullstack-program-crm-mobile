> **Fetched from jira:** [SCRUM-12](https://azm-crm.atlassian.net/browse/SCRUM-12)  
> *Fetched 2026-09-01T01:47:45.100Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** TF-01 Localisation & RTL  
**Type:** Task  
**Status:** To Do  
**Labels:** phase-1_foundation_feat-12.1

### Description

Arabic and English throughout, with full right-to-left layout. RTL is delivered as part of localisation, not separately — a locale switch that does not mirror the layout is an incomplete implementation.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/foundation/SCRUM-12/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `foundation`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-12` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Task`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_foundation_feat-12.1`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
TF-01 Localisation & RTL
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
Arabic and English throughout, with full right-to-left layout. RTL is delivered as part of localisation, not separately — a locale switch that does not mirror the layout is an incomplete implementation.
```

---

## Acceptance criteria

- Every user-facing string sourced from translation files; no hardcoded literals
- Language switches instantly with no app restart
- Selected locale persists across restarts
- No LTR flash on cold start in Arabic — locale resolves before first paint
- Layout mirrors horizontally when Arabic is active
- Directional icons (back, chevron) mirror; non-directional (attachment, camera) do not
- Arabic strings do not clip or overflow in buttons, pills, or rows
- Numbers and dates format per locale
- Components use logical properties (marginStart) — never marginLeft/marginRight

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
No endpoints. This is client-only.

Localised DB names (departments, branches, categories) resolve at the
render layer, not in queries — both name_en and name_ar arrive in every
response, so locale belongs in the component, not the query key. Sorting
must use sort_order or sort client-side after resolution, never name_en
while displaying name_ar.

## Design
No single frame — this applies across every screen. Verify against
docs/DESIGN.md's RTL section, not against any mockup, since only LTR
frames were ever generated.

Four criteria remain unverified and are the actual scope of this story:
1. No LTR flash on cold start in Arabic — set locale to Arabic, kill the
   app fully, watch the first frame
2. Directional icons mirror (back, chevrons), non-directional do not
   (attachment, camera, lock, bell)
3. Numbers and dates format per locale — relative timestamps currently
   render "4m", "3d", "2w"; confirm Arabic equivalents
4. Logical properties only — confirm the eslint rule banning
   marginLeft/marginRight is active, not just configured

Open decision: the residual native I18nManager latch means some things
only flip after restart. Either reword criterion 2 to acknowledge this,
or waive it explicitly. Do not leave it ambiguous.

## Out of scope

- What this story explicitly does **not** cover:
