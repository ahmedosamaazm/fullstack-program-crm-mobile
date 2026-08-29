> **Source:** manual entry (tracker skipped via `--no-tracker`).
> Active tracker for this workspace: `jira` — this story is not linked. 
> Run `squad tracker link <story-path> <tracker-id>` later if you want to attach one.

# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/design-system/reflect-azm-design-system-in-react-native/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** Reflect AZM design system in React Native
- **Feature slug (folder under `plans/`):** `design-system`

## Tracker (metadata only)

- **Tracker type:** `jira`
- **Work item id:** `` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** ``
- **Status:** ``
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Reflect AZM design system in React Native
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
The Figma file (mdfP8RPdkUsKcJb0wFdkME) is the source of truth for AZM's design system: 8
variable collections and 34 components. src/core/lib/theme/ was hand-written independently of
Figma and shares no values with it (colours, radius, spacing, font size all diverge; there is no
font family at all). This is a replacement of the token layer, not a patch, and it rewrites the 8
existing components that consume the old token names.

Three further gaps: (1) no font is loaded anywhere in the app despite expo-font being installed;
(2) the app cannot boot — App.tsx/index.ts are deleted, src/app/ is empty, bootstrap()/
ThemeProvider/queryClient are never mounted; (3) eslint.config.js does not exist even though
tokens.ts and CLAUDE.md both claim the hex-literal ban is enforced by it.

A full implementation plan already exists (authored outside squad-kit) at
`plans/design-system/01-reflect-azm-design-system-in-react-native.md` in this feature folder —
it carries the resolved Figma token values, the 14 new component specs, the eslint rule design,
and a 10-step sequencing. Treat that file as the authoritative plan; this intake exists for
traceability only.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- Token layer (src/core/lib/theme/) is a faithful, traceable reflection of the Figma variables —
  35 semantic colour keys (light + dark), spacing/radius/fontSize/lineHeight/tracking/fontWeight/
  opacity/elevation scales matching Figma exactly.
- IBM Plex Sans Arabic is the app's only font, loaded via Font.loadAsync() in bootstrap(), with a
  weight -> family resolver that never emits fontWeight next to a custom fontFamily.
- eslint.config.js exists and enforces: no react-native Text/TextInput imports outside the
  primitives, no hex literals outside theme/primitives.ts, no fontWeight/fontFamily style keys
  outside theme/**, no physical layout props, and the features/core layering + barrel-only rules.
- The 16 generic core components (Text, Icon, Button, TextField, TextArea, SearchField,
  IconButton, Tab/TabBar, SectionHeader, ModalHeader, SheetHeader, Dropzone, DetailRow,
  SettingsRow/RowGroup, ActionRow, FilterChip) exist per the spec table in the plan.
- The 8 existing components (Avatar, BottomSheet, EmptyState, ErrorState, FAB, OfflineBanner,
  SegmentedControl, Skeleton) are migrated to the new tokens, including the 3 latent bug fixes
  (BottomSheet backdrop opacity, FAB dark-mode shadow, Skeleton hardcoded opacity).
- App boots: app.json router root, src/app/_layout.tsx, and a component gallery at
  src/features/dev + src/app/index.tsx so the whole system is visually verifiable.
- npm run typecheck and npm run lint both pass clean.
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

## Out of scope

- What this story explicitly does **not** cover:
  - The 18 domain components (TicketRow, StatusBadge, StatusDot, StatusOption, PriorityRail,
    PriorityTag, PriorityOption, MessageRow, ReplyComposer, AISummaryBar, ContactStrip,
    IdentityCard, AgentRow, NotificationRow, StatCard, BottomNav, and the two sheet-only rows) —
    these ship under `src/features/<domain>/components/` alongside their features, not here.
  - Any actual feature screens (tickets, customers, home, notifications, profile) beyond the dev
    component gallery.
  - The 10 design flags in the plan's §15 that need a designer decision (FilterChip token drift,
    ArrowLeft/Chevron physical naming, Arabic uppercase+tracking, OfflineBanner fill, etc.) — the
    plan takes a documented default for each and files them as follow-ups.
