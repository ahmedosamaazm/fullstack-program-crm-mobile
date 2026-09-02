# notifications — plan overview

Entry point for the **notifications** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 23 | [23-story-in-app-notification-centre-SCRUM-45.md](23-story-in-app-notification-centre-SCRUM-45.md) | In-app notification centre | SCRUM-45 | Stories 03, 04, 06, 07 · backend §9 |

## Dependency notes

**This is the sixth and last unbuilt phase-1 feature folder.** Story 23 creates
`src/features/notifications/` with the standard anatomy and adds `/notifications` as a pushed route
inside `_layout.tsx`'s authenticated `Stack.Protected` block.

**It is gated on a type regeneration, not on another story.** `notifications` is absent from
`src/core/types/database.ts` — the generated file predates the table — so
`supabase.from('notifications')` does not compile until `npm run gen:types` has run. That is task 0
and nothing else in the story builds before it.

**Cross-feature dependencies:**

- [`../home/03-story-home-workload-summary-SCRUM-37.md`](../home/03-story-home-workload-summary-SCRUM-37.md) — built the bell (`HomeHeader.tsx:58-63`) with `onNotificationsPress` wired to `() => {}`. Story 23 fills that hole and adds the unread badge, creating a new **one-directional** `home → notifications` barrel edge. `features/notifications` must never import from `features/home`; the customers ↔ tickets pair is the repo's only intentional cycle.
- [`../tickets/04-story-ticket-list-with-filters-SCRUM-27.md`](../tickets/04-story-ticket-list-with-filters-SCRUM-27.md) — `groupTicketsByDay` and the `SectionList` + `SectionHeader variant="rule"` pattern. Story 23 copies the technique into a **two-bucket** grouping (Today / Earlier — yesterday falls under Earlier) rather than reusing the function.
- [`../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`](../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md) — `/tickets/[id]`, the push target of every alert row.
- [`../profile/06-story-profile-and-settings-SCRUM-46.md`](../profile/06-story-profile-and-settings-SCRUM-46.md) — its stored push/email preference, whose "no notifications table yet" comment story 23 corrects and whose user-facing "not sending yet" copy story 23 leaves as an open product question.

**One acceptance criterion cannot be closed here.** BRD `:849` asks for a **push** notification on
assignment. There is no `expo-notifications`, no device-token table and no sender; the trigger writes
a row, not a push. `docs/phase1_backend_plan.md:238` assigns the sender to **SCRUM-40 / SCRUM-41**
(email notifications), which is where `:849` belongs. Same shape as stories 21 and 22, each of which
carries a criterion outside this repo's reach.

**Still blocked after story 23:** SCRUM-40 / SCRUM-41 (email + push delivery — provider decision
open), and any Realtime or polling refresh of the badge, which story 23 records as its weakest
criterion rather than solving.
