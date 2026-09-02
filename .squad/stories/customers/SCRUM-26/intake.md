> **Fetched from jira:** [SCRUM-26](https://azm-crm.atlassian.net/browse/SCRUM-26)  
> *Fetched 2026-08-31T23:49:17.195Z. Edit the sections below as needed; the planner reads this file verbatim.*


## Source — work item (from tracker)

**Title:** US-010 Customer notes and attachments  
**Type:** Story  
**Status:** To Do  
**Labels:** phase-1_agent_feat-1.4_S12_S14

### Description

As an agent, I want to attach notes and files to a customer so that context is retained.

### Attachments

None.

---
# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/customers/SCRUM-26/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `customers`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `SCRUM-26` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** `Story`
- **Status:** `To Do`
- **Assignee:** ``
- **Labels:** `phase-1_agent_feat-1.4_S12_S14`

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
US-010 Customer notes and attachments
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
As an agent, I want to attach notes and files to a customer so that context is retained.
```

---

## Acceptance criteria

```
-Given a customer, when I add a note, then it saves with my name and timestamp
-Given I choose upload, when the sheet opens, then camera, gallery and file options are offered
-Given a file over 10MB, when I upload, then it is rejected with a clear message
-Given an uploaded image, when I tap it, then a full-screen viewer opens
-Given an attachment from another branch, when its URL is requested directly, then access is denied

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
Endpoints: `docs/phase1_api_reference.md` §8 (storage), and the
`07 Storage` folder in the Postman collection for working examples.

Backend is complete and verified — private bucket, three policies.

CRITICAL — the upload path convention. Storage policies read the first
two path segments via storage.foldername(name) and compare them against
the agent's branch and department. Paths MUST be constructed exactly as:

  {branch_id}/{department_id}/{customer_id}/{uuid}-{filename}

Any other structure silently fails RLS — the upload is refused with a
403 and it looks like a permissions bug rather than a path bug. Build
the path from the signed-in agent's profile, never from client state
the user could influence.

Bucket is private. Viewing requires a signed URL via
`supabase.storage.from('attachments').createSignedUrl(path, 3600)` —
public URLs will not work.

Compress images client-side before upload (expo-image-manipulator).
Agents photographing documents will otherwise push 8MB files at a
10MB cap.

Bucket restrictions already enforced server-side: 10MB max,
image/jpeg, image/png, image/webp, application/pdf only. Surface
rejections as field errors, don't just let the request fail.

Also writes a row to the `attachments` table (§5.9 in the BRD) —
exactly one of ticket_id, customer_id, or message_id must be set.
This story sets customer_id.

Install: expo-image-picker, expo-document-picker, expo-image-manipulator.

## Design
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=8-4735&t=fcoAOt40Etpn8q5X-4
Figma: https://www.figma.com/design/mdfP8RPdkUsKcJb0wFdkME/AZM---CRM?node-id=8-4847&t=fcoAOt40Etpn8q5X-4
Fetch via Figma MCP.

Two views: a bottom sheet with Camera / Gallery / Files options and a
Cancel action, and a full-screen viewer with back, download, and the
file name and size.

Attachments live in the Notes tab of Customer Detail — the third tab
built as a placeholder in SCRUM-24. This story wires it.

## Out of scope

- What this story explicitly does **not** cover:
