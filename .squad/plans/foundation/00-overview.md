# foundation — plan overview

Entry point for the **foundation** feature. Stories execute in order by their `NN` prefix.

The TF track (TF-01…TF-05, SCRUM-12…SCRUM-16) is the cross-cutting layer every feature story sits
on: localisation and RTL, theming, the component library, navigation, and error/empty/loading
states. The roadmap sequences them first (`docs/phase_1_frontend_roadmap.md:11` — *"Retrofitting RTL
into a laid-out app, or theming into hardcoded components, is a rewrite rather than a change"*), but
in practice they were built incrementally across stories 01–24. Their plans are therefore **closure
stories**: verify what shipped, fix what is actually wrong, and resolve the criteria nobody has run.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 25 | [25-story-localisation-and-rtl-SCRUM-12.md](25-story-localisation-and-rtl-SCRUM-12.md) | Localisation & RTL | SCRUM-12 | Stories 01–24 (verifies their combined output); 02 and 06 own the two language switch points |
| 26 | [26-story-theming-light-and-dark-SCRUM-13.md](26-story-theming-light-and-dark-SCRUM-13.md) | Theming — light & dark | SCRUM-13 | Stories 01–24 (verifies their combined output); 01 owns the token layer being audited; 25 for the development build its splash change needs |

## Dependency notes

- **25 is a closure story, not a build story.** Seven of the nine BRD criteria (`:370-378`) already
  pass from work done in stories 01–24. Its diff is concentrated in `core/lib/i18n/`, `core/utils/`
  and the three `api.ts` files; its weight is in verification.
- **25 resolves an open decision, and must not defer it again.**
  `docs/phase1_known_issues.md:8-17` records BRD `:371` ("switches instantly with no app restart")
  as unmet by design and says it *"should be either reworded or explicitly waived, not silently
  ticked."* Task 0 of story 25 answers it.
- **25 adds `expo-updates`** — the first dependency in this repo that requires a **development
  build** and does not work in Expo Go. Any later story assuming Expo Go must account for that.
- **25 changes a data-layer contract used by three features.** `localisedName` moves out of
  `features/auth`, `features/customers` and `features/tickets` `api.ts` into the render layer;
  `AgentProfileWithOrg`, `CustomerDetail`, `TicketDetail` and `TicketCategory` each lose a resolved
  `*Name: string` field and gain a raw `{ name_en, name_ar }` pair. Plan any story touching those
  types around it.
- **26 is the second closure story, and it is measurement-led.** Four of TF-02's six criteria
  (`docs/phase1_brd_1.md:386-392`) already pass from stories 01–24. The two that never passed had
  never been *measured*: the plan carries a full WCAG pass over every token pair the components
  actually render together, and names three real AA failures, two WCAG-exempt ones and two phantoms
  (tokens with zero consumers). Its diff is four alias moves, one new primitive, and three chrome
  surfaces the token layer cannot reach at all — the OS status bar, the navigator background and the
  splash.
- **26 adds the repo's first `scripts/` directory** and an `npm run contrast` gate that compiles
  `scripts/contrast-audit.ts` with the installed `typescript` and runs it on plain Node. It is the
  third real gate after `lint` and `typecheck`; there is still no test runner.
- **26 changes tokens that stories 01, 04, 07 and 13 all render.** `bgPrimaryPressed` (dark),
  the four input outlines, `FilterChip`'s border, `priorityColor`'s `low` branch, and
  `StatusBadge`'s `closed` case. Any story touching `TicketRow`, `StatusBadge`, `PriorityChip` or a
  form control should sequence around it.
- **26 leaves four questions with design and says so in writing** — `pending` has no hue, dark
  `statusDanger`/`statusWarning` share a luminance exactly, light `bgSurfaceRaised` equals
  `bgSurface`, and the dark active-tab pill is invisible. Each ships with a defined fallback so the
  story is not blocked; none is silently ticked.
- **TF-03…TF-05 (SCRUM-14…SCRUM-16) are not yet planned.** When they are, they belong in this folder
  and follow the same closure shape.
