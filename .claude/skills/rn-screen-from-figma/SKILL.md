---
name: rn-screen-from-figma
description: Build or restyle a screen in this repo from a Figma frame — "implement this Figma", "build the X screen from design", a figma.com URL, or a node id from file mdfP8RPdkUsKcJb0wFdkME. Maps Figma values onto core/lib/theme tokens and core/components primitives, never raw values; RTL and dark theme by construction.
argument-hint: "<figma node url or id> <feature>/<ScreenName>"
user-invocable: true
---

# Screen from Figma — AZM CRM

The Figma file `mdfP8RPdkUsKcJb0wFdkME` and `src/core/lib/theme/` are a traceable pair: every
value design bound has a token. This skill exists so a screen is built *through* that pair and
never around it. **Load `figma:figma-design-to-code` first** — it is the mandatory prerequisite for
`get_design_context`. This skill adds what that generic skill cannot know about this repo.

## 1 — Read the design the right way (in this order)

1. `get_screenshot` on the frame — look at it. Both light and dark variants if the file has them.
2. `get_variable_defs` on the frame — the **exact tokens** design bound. This, not the visual, is
   the source of truth for colours, spacing, radii and type.
3. `get_design_context` — structure only. **Treat its emitted code as a description of the design,
   never as code to paste.** It emits hex, pixel gaps and `fontWeight`; all three are eslint
   errors here.
4. Read the existing design audit for this screen if one exists in `.squad/audits/design/` — it
   records deliberate deviations that are NOT to be "fixed".

## 2 — Map, don't copy

| Figma gives you | Write this | Never this |
|---|---|---|
| a colour variable | `theme.colors.<semanticToken>` from `colors.ts` | hex, a primitive name, a near-miss token |
| a spacing number | `theme.spacing.*` / `layout.ts` scale value | `padding: 12` |
| a radius | `theme.radius.*` | a number |
| a text style | `<Text variant="…" weight="…">` from `@/core/components` | `fontWeight`, `fontFamily`, RN `Text` |
| a shadow | `elevation.ts` token | inline shadow props |
| left/right anything | `Start`/`End`, `useDirection()` for icons that imply direction | `marginLeft`, `textAlign: 'left'` |

If a value is **off-scale** (Figma says 10, the scale has 8 and 12), do not invent a token and do
not hardcode. Check `.squad/plans/design-system/01-*.md` §15 — it may be one of the ten open
flags. If it is, use the nearest token and record the flag in your report. If it isn't, use the
nearest token and raise it as a **new question for design** — never silently resolve.

## 3 — Compose from primitives before writing a `View`

Look for the real component first — this is the highest-value failure to avoid. A row of label +
value is `DetailRow`; a tappable row with chevron is `SettingsRow`/`ActionRow`; a pill is
`FilterChip`; a header with back is `ModalHeader`/`SheetHeader`; a search box is `SearchField`;
a segmented switch is `SegmentedControl`/`TabBar`. Re-implementing one inline is a `major`
finding in the design audit. If no primitive fits and the piece is domain-specific, it goes in
`features/<domain>/components/`; if it is generic and reusable, it goes in `core/components/`
**and** into the `PAIRS` list of `scripts/contrast-audit.ts` if it introduces a new token pairing.

## 4 — States the frame shows are states the screen ships

Empty, loading, error, disabled — if the frame (or a sibling frame) designs it, render it with
`EmptyState` / `Skeleton` / `ErrorState`. A designed empty state with no render path is a finding.

## 5 — Both directions, both themes, before you say done

- RTL: read `useDirection()`; never `I18nManager`. Row order, chevrons, and leading icons mirror
  by construction if you used `Start`/`End`. Check anything with an explicit `flexDirection`.
- Dark: every colour goes through a semantic token, so it resolves in both palettes. `npm run
  contrast` must still end with exactly two figure/ground warnings.
- Strings: every literal goes through `/rn-l10n` — both files, feature namespace.

## 6 — Finish

`/gates` → then dispatch the **`rn-design-fidelity-auditor`** agent with the frame node id and the
screen path, and fix what it reports before the user's own visual check → `/rn-code-review`.
