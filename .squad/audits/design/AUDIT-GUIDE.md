# Design-fidelity audit — shared contract

Read this before auditing any screen. Every screen audit follows it exactly so the
15 findings files are comparable and roll up into one backlog.

**This audit is READ-ONLY. Change no source file. Your only write is your findings file.**

## Inputs

- Figma file key: `mdfP8RPdkUsKcJb0wFdkME` (Screens page = node `0:1`)
- Your assigned frame node id and the app files that implement it (given in your task)
- Token source of truth: `src/core/lib/theme/` — `primitives.ts`, `colors.ts`,
  `typography.ts`, `layout.ts`, `elevation.ts`
- Design-system spec + the ten open flags:
  `.squad/plans/design-system/01-reflect-azm-design-system-in-react-native.md`
  (tokens §"Authoritative token values", flags §15)
- The story plan for the screen, if one is named in your task — it records
  deliberate deviations that are NOT findings.

## Procedure

1. `mcp__plugin_figma_figma__get_screenshot` on your frame — look at it.
2. `mcp__plugin_figma_figma__get_variable_defs` on your frame — the exact token
   values design bound to this screen.
3. `mcp__plugin_figma_figma__get_design_context` on your frame — reference structure.
   Treat its emitted code as a *description of the design*, never as code to copy.
4. `mcp__plugin_figma_figma__get_metadata` on your frame if you need the child node
   tree to reason about ordering/hierarchy.
5. Read the app screen and every component it renders, plus the core primitives
   those components use.
6. Diff against the checklist below.

## Checklist — audit all seven, report per axis

1. **Token fidelity.** Every colour, spacing, radius, font size/line-height/weight,
   and shadow in the app code must resolve to a `theme.*` token, and that token must
   be the one Figma bound. Flag: raw numbers where a scale value exists, off-scale
   values (e.g. `padding: 10` when spacing has 8 and 12), a token that exists but the
   wrong one (`textSecondary` where Figma bound `textMuted`), any hex literal outside
   `primitives.ts`.
2. **Component identity.** Does the screen use the real `core/components` primitive,
   or has it re-implemented one inline? A hand-rolled row that duplicates `SettingsRow`,
   a bespoke pill that duplicates `FilterChip`, a raw `Pressable` where `Button` belongs.
   This is the highest-value finding class — look for it deliberately.
3. **Structure & order.** Sections present, their vertical order, nesting, what the
   frame has that the app lacks, and what the app has that the frame does not.
4. **States.** Empty, loading, error, and disabled variants — designed vs implemented.
   A screen with a designed empty state and no `EmptyState` render path is a finding.
5. **RTL.** Logical layout props only (`marginStart`/`paddingEnd`), no `left`/`right`,
   no physical margins. Icons that imply direction. Row reversal assumptions.
6. **Dark theme.** Every colour read through the semantic token (so both palettes
   resolve), no light-only assumption baked into a component.
7. **Open design flags.** If the screen touches any of the ten flags in §15, note it
   as `flag` severity — do NOT silently resolve it, and do NOT report it as a defect.

## Severity

- `blocker` — the screen is visibly wrong vs the design in a way a user notices
- `major` — real deviation: wrong token, missing state, duplicated primitive
- `minor` — small drift: one-step spacing difference, a nudged weight
- `flag` — an open §15 question this screen touches; needs a design decision, not a fix
- `intentional` — a deviation the story plan explicitly justifies; record and move on

## Output

Write exactly one file: `.squad/audits/design/<slug>.md` (slug given in your task).

```markdown
# <Screen name> — design audit

**Figma:** `<node-id>` · **Code:** `<primary file>`
**Verdict:** <faithful | minor drift | major drift | blocked>

## Summary
<3-5 sentences: how close is it, and what is the single most important thing to fix.>

## Findings

### 1. <Title> — `major`
- **Axis:** token fidelity
- **Figma:** <exact value/behaviour>
- **Code:** `path/to/file.tsx:NN` — <exact value/behaviour>
- **Fix:** <one concrete sentence>

<...repeat, ordered blocker → major → minor → flag → intentional...>

## Verified correct
<Bullets of what you checked and found faithful. Keep short — this is what stops
the next audit re-checking the same ground.>
```

## Rules

- Cite `file.tsx:line` for every code-side claim. A finding without a line number
  is not a finding.
- Do not report a deviation the story plan justifies as a defect — mark `intentional`.
- If you cannot determine something statically (a runtime-only layout question),
  say so explicitly under a `## Needs a visual check` heading rather than guessing.
- Report honestly. A screen that is genuinely faithful gets a short file saying so.
  Do not manufacture findings to fill the template.
