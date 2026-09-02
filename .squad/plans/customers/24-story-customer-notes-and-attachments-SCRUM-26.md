# Story 24 — Customer notes and attachments (Story: SCRUM-26)

> Intake: `.squad/stories/customers/SCRUM-26/intake.md`
> Figma: file `mdfP8RPdkUsKcJb0wFdkME`. **There is no Notes-tab content frame** — see "Read this
> before anything else", point 4.
> The **last** story in `features/customers/`, and the last of the two areas `CLAUDE.md` still
> records as unbuilt.

## Read this before anything else

Five facts decide how this story is sequenced. Establish all five before writing a line of UI.

**1. The Storage backend is done, and two docs say otherwise.**
`docs/phase1_backend_plan.md:93` — `# ✅ Section 7: Storage & attachment security — COMPLETE`, and
`:95` says in as many words: **"Unblocks: SCRUM-26 (US-010 Customer notes and attachments)."** A
private `attachments` bucket exists with a 10 MB cap, a four-type MIME allowlist and three
branch+department-scoped policies on `storage.objects` (`:118-146`), all verified (`:148-157`).
Two other documents contradict this and are stale: `docs/phase1_api_reference.md:424` still marks
`# 8. Storage 🔨` with *"No bucket exists yet"* at `:426`, and
`docs/phase1_remaining_stories_status.md:92` still lists US-010 as *Blocked — §7 Storage bucket +
policies*. **The backend plan is authoritative** (it documents the deployed policies); task 8 fixes
the other two. Three source files in this repo carry the same stale claim and are also task 8's:
`CustomerDetailScreen.tsx:101`, `ReplyComposer.tsx:59`, `CreateTicketScreen.tsx:334-336`.

**2. The attachments *table* exists; the notes *table* does not.**
`src/core/types/database.ts:49-116` has `attachments` with exactly the columns this story needs —
`customer_id` is a nullable FK to `customers` (`:88-93`), beside `storage_path`, `file_name`,
`mime_type`, `size_bytes` and `uploaded_by`. Files are representable today.
**Free-text notes are not.** There is no `customer_notes` table, no `notes` table, and nothing of
the sort in `database.ts`'s eleven tables, in BRD §5's eleven-table list
(`docs/phase1_brd_1.md:98-213`), or anywhere in `docs/phase1_backend_plan.md`. US-010's first
acceptance criterion (`docs/phase1_brd_1.md:586`) has **no table to write to**. Task 0 is that
table, it is backend work this repo cannot perform, and **the notes half of this story does not
compile until it lands**. The attachments half is unblocked and can ship independently — see
"Story Goal" for the split.

**3. Do not reuse `attachments` for note text.** It is the obvious shortcut and it is wrong:
`storage_path`, `file_name`, `mime_type` and `size_bytes` are all **NOT NULL** in the generated
`Insert` type (`database.ts:62-73` — only `customer_id`, `ticket_id`, `message_id`, `id`,
`created_at` and `uploaded_by` are optional). A note would have to fabricate four values to
satisfy a shape that means "a file lives at this path". Every later query for real attachments
would then need a sentinel filter. Task 0's table is the correct answer; open question 1 is the
decision that must be confirmed rather than assumed.

**4. Figma has a Notes tab but no Notes tab *content*.**
`.squad/audits/design/customers-detail-info.md:108-113` records it: *"the Notes tab is present in
the tab bar (`91:885`); its content is not part of this frame."* Every pixel below the tab bar in
this story is composed from existing design-system components against existing precedent — it is
**not** traced from a frame. That is a deviation from how every other screen in this repo was
built, and open question 2 is the design review it needs.

**5. Agents cannot delete an attachment row, but can delete the object.**
`docs/phase1_backend_plan.md:44` — *"No delete policies for agents anywhere"* on the table side;
BRD `:256` grants agents `CRU — own dept` on `attachments`, with no D. Yet
`phase1_backend_plan.md:140-146` deploys **"attachments delete own scope"** on `storage.objects`.
A delete affordance would therefore remove the file and leave the row pointing at nothing.
**This story ships no delete control** — open question 4.

---

## Prerequisites

- **Backend §7 complete** — `docs/phase1_backend_plan.md:93-161`. The bucket, its limits and its three `storage.objects` policies. Read `:110-116` — the path convention is not advisory: *"the policies below read the first two segments via `storage.foldername(name)`, so **the client must construct paths exactly this way** or nothing will match and uploads will silently fail."*
- **Task 0 merged and deployed** — the `customer_notes` table and its RLS. **Blocks tasks 2, 4 and 6 only.** Tasks 1, 3 and 5 (attachments) do not depend on it.
- **Story 10 completed** — [`10-story-customer-profile-view-SCRUM-24.md`](10-story-customer-profile-view-SCRUM-24.md). It built `CustomerDetailScreen` and its three-tab bar; `CustomerDetailScreen.tsx:100-103` is the placeholder this story replaces.
- **Story 14 completed** — [`14-story-customer-interaction-history-SCRUM-25.md`](14-story-customer-interaction-history-SCRUM-25.md). `CustomerTicketsTab.tsx` is the sibling-tab template task 5 and task 6 copy, including its "no loading and no error branch here" reasoning at `:60-62` — **which this story deliberately breaks**, because notes and attachments are their own queries, not embeds.
- **Story 07 completed** — [`../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md`](../tickets/07-story-ticket-detail-and-conversation-SCRUM-30.md). `postTicketMessage` (`tickets/api.ts:402-421`) and `MessageRow.tsx` are the author+timestamp precedents tasks 2 and 6 copy almost verbatim.
- **A second agent account in a different branch**, plus the ability to read another branch's `storage_path` with the service key. Acceptance criterion `docs/phase1_brd_1.md:590` is a cross-branch denial and **cannot be exercised with one account**.
- **Supabase CLI authenticated** — `npm run gen:types` runs twice in this story (task 0 and its verification).

---

## Story Goal

An agent working a customer record can leave written context for the next agent, and attach the
photo of the damaged unit, the signed delivery note or the PDF invoice that the call was about.
Concretely:

1. **A Notes tab that is no longer a placeholder** — a chronological list of notes, each stamped
   with its author's name and time, and a composer to add one.
2. **An attachment list in the same tab**, showing file name, type and size.
3. **An upload sheet offering camera, gallery and file**, per `docs/phase1_brd_1.md:587`.
4. **A 10 MB ceiling enforced on the client with a clear message**, per `:588` and NFR-07 (`:279`).
5. **A full-screen viewer for images**, per `:589`, opened through a **short-lived signed URL** —
   the bucket is private, so there is no public URL to fall back on.
6. **Cross-branch access denied**, per `:590` — enforced by `storage.objects` policies, proved by
   verification step 2, not by any code this story writes.

**The story splits cleanly in two, and the halves have different blockers.** Attachments (goals
2–6) are unblocked today. Notes (goal 1) are blocked on task 0's table. If task 0 slips,
**ship the attachments half and leave the notes composer out** — do not stall the whole story, and
do not fake a table.

**Not in scope**: attachments on **tickets** or on **ticket messages** — `attachments.ticket_id`
and `.message_id` exist and stay unused here; `ReplyComposer.tsx:59`'s disabled paperclip and
`CreateTicketScreen.tsx:346`'s disabled `Dropzone` both stay disabled, with only their comments
corrected (task 8). Deleting an attachment (point 5 above; open question 4). Editing or deleting a
note. Image *resizing* via `expo-image-manipulator` (task 3c explains what is done instead).
Orphaned-object cleanup (`phase1_backend_plan.md:161`; open question 5). Offline queueing of an
upload.

---

## Context — Read These Files First

1. `docs/phase1_backend_plan.md:93-161` — **the contract for the whole attachments half.** `:100-108` the bucket settings (10 MB; `image/jpeg`, `image/png`, `image/webp`, `application/pdf` — **four types, nothing else**). `:110-116` the path convention and its silent-failure warning. `:118-146` the three policies, all keyed on `(storage.foldername(name))[1]` = branch and `[2]` = department. `:159-161` **"Still to do on the client side"** — signed URLs with short expiry, client-side image compression, orphan cleanup. Two of those three are this story's tasks 3 and 5.
2. `docs/phase1_brd_1.md:578-590` — US-010. `:586-590` are the five criteria; `## Done Criteria` mirrors them verbatim. Then `:187-195` (schema §5.9, *"exactly one required"* across the three FKs, *"size_bytes int max 10 MB"*), `:256` (agents get **CRU**, no D), and **`:279` NFR-07** — *"Attachments capped at 10 MB; images compressed client-side before upload."*
3. `src/core/types/database.ts:49-116` — the `attachments` table. **`:62-73` the `Insert` type is the one to read**: `file_name`, `mime_type`, `size_bytes` and `storage_path` are required; `customer_id`, `ticket_id`, `message_id` and `uploaded_by` are all optional. `:86-114` the four foreign keys — `attachments_customer_id_fkey` and `attachments_uploaded_by_fkey` are the two this story uses. **Confirm `customer_notes` is absent** before starting; if it is present, task 0 has already run.
4. `src/features/customers/api.ts` — the file tasks 1 and 2 extend:
   - `:1-4` the imports every `api.ts` opens with, and `:104` the `if (error) throw toAppError(error)` boundary repeated at every call.
   - **`:155-158` `DETAIL_SELECT`** and its comment at `:151-154`: *"`tickets(...)` is shared by all three consumers below"*. **Do not widen it again.** Task 1 explains why notes and attachments are separate queries where story 14's tickets were an embed.
   - `:244-259` `fetchCustomerDetail` — the `.maybeSingle()` + *"Returns `null` on no row rather than throwing"* pattern.
   - `:344-365` `createCustomer` — the insert + `.select(...).single()` shape task 2 copies.
5. `src/features/tickets/api.ts:351-421` — **the closest precedent in the repo to what task 2 builds.** `:351` `MESSAGE_SELECT` embeds `profiles(full_name)`; `:353-371` the local snake_case row type and `toMessage` mapper, with `authorName: row.profiles?.full_name ?? null`; **`:402-421` `postTicketMessage`** — insert, `.select(MESSAGE_SELECT).single()`, map. A customer note is this function with `is_internal` and `ticket_id` removed and `customer_id` added.
6. `src/features/tickets/hooks.ts:154-186` — `useTicketMessages` and **`:170-186` `usePostTicketMessage`**, which reads `session?.user.id` from `useAuth()` and passes it as `authorId`. `:178-184`'s narrow invalidation comment is the model for task 4's.
7. `src/features/customers/hooks.ts:17-38` — `customerKeys`. Task 4 adds two members and **must not** disturb `detail` (`:31-37`): *"This is the ONE cache entry story 11's create redirect lands on… Do not add a second detail query."* Note that `all` (`:27`) is `['customers']`, so it matches the new keys too — which is why task 4's invalidations are deliberately narrow.
8. `src/features/customers/screens/CustomerDetailScreen.tsx` — **all 107 lines.** `:24` `ActiveTab`, `:33-60` the four-branch state ladder, `:87-91` the Notes tab button, and **`:100-103` the placeholder this story replaces**, comment and all.
9. `src/features/customers/components/CustomerTicketsTab.tsx` — the sibling tab. `:56-102` the whole component. **`:60-62` — "No loading and no error branch here"** is true for tickets and false for this tab; task 6 must add both back. `:74-92` is the card treatment (`bgCanvas` ground, `bgSurface` card, `elevation.e1`) tasks 5 and 6 reuse.
10. `src/features/tickets/components/MessageRow.tsx` — **all 83 lines.** `:26` `message.authorName ?? t('ticketDetail.event.system')`, `:27` `formatTime`, `:33-36` the composed `accessibilityLabel`, `:57-72` the author / time header row. Task 6a is this row minus the internal-note branch.
11. `src/features/tickets/components/ReplyComposer.tsx` — **all 121 lines.** `:24-30` `canSend` + clear-on-send; `:57-104` the input row. **`:58-66` is the disabled paperclip, and `:59` is the comment task 8 corrects.** Task 6b is a simpler composer — one mode, no chips.
12. `src/core/components/ActionRow.tsx` — **all 92 lines.** `icon` + `title` + `description` + `tone`, a 40px chip and a 64px row. Task 3a's sheet is three of these; **no new component is needed.**
13. `src/core/components/BottomSheet.tsx:34-153` — `visible` / `onClose` / `title`, `SheetHeader` when titled, `maxHeight: screenHeight * 0.9` (`:120`), and `paddingHorizontal: theme.spacing.lg` on its child container (`:143`) — so sheet content must not add its own horizontal padding.
14. `src/core/components/Dropzone.tsx` — **all 77 lines.** It already defaults to `icon="paperclip"` (`:31`) and carries an `error` prop (`:66-70`). **Its only consumer today is `CreateTicketScreen.tsx:346`, disabled.** Task 5 gives it its first live caller.
15. `src/core/components/Icon.tsx:20-58` — the `IconName` union. **`camera`, `image`, `file` and `paperclip` all already exist** (`:33`, `:39-41`). Task 3 adds no icon name. There is deliberately **no** `trash`/`delete` glyph — see fact 5 above.
16. `src/core/utils/format.ts` — `:35-39` `formatTime` (task 6a), `:90-92` `formatNumber` (task 1c's `formatFileSize`). **There is no file-size formatter; task 1c adds one.**
17. `src/core/utils/errors.ts:59-86` `toAppError` and `:99-102` `errorMessageKey`. Note `:53` — an all-digit `code` string is coerced into a status. Storage errors surface with a `statusCode` **string**, which `readStatus` (`:48-57`) does not read; task 1e handles that explicitly.
18. `docs/phase1_api_reference.md:424-450` — §8. **Read it, then treat `:426` as false** (fact 1). `:431` and `:439` still give the correct upload and sign request shapes. `:450` is the sentence that matters most: *"table RLS on `attachments` does **not** protect the files. Storage policies are a separate surface and must enforce the same scope independently."*
19. `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts:218` — *"For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Upload file using `ArrayBuffer` from base64 file data instead."* `:42-43` shows `ArrayBuffer | ArrayBufferView` in the accepted body union. **This is why task 3b does not call `fetch(uri).blob()`.**
20. `app.json:25-39` — the `plugins` array task 3d appends to.

---

## Product rules (from story)

| | Today | After this story |
|---|---|---|
| Customer Notes tab | `EmptyState icon="file"`, *"Notes aren't available yet."* (`CustomerDetailScreen.tsx:100-103`) | Attachment list + note thread + composer + upload control |
| Free-text customer notes | **No table exists** | `customer_notes`, written with the agent's id, read back with their name |
| `attachments` rows with `customer_id` | Table exists; no client has ever written one | Created on every successful upload |
| The `attachments` bucket | Live and policied; no client has ever touched it | Read and written under `{branch}/{department}/{customer}/…` |
| Viewing a file | No path at all | Short-lived signed URL; images open full-screen |
| `docs/phase1_api_reference.md` §8 | `🔨`, *"No bucket exists yet"* (`:424`, `:426`) | `✅` with the live bucket, limits and policy scope |
| `docs/phase1_remaining_stories_status.md:92` | US-010 *Blocked* | Removed from the Blocked table |
| `ReplyComposer` paperclip / `CreateTicketScreen` Dropzone | Disabled, commented *"no storage bucket yet"* | **Still disabled** — comments corrected to name the real reason (out of scope, not blocked) |

---

## Backend Tasks

### 0 — `customer_notes` (blocking for the notes half; NOT written in this repo)

This repository is the Expo client and holds no migrations — `docs/phase1_backend_plan.md` is
where schema work is tracked and `supabase_setup_guide.md` is where its SQL lives. **Hand this
task to whoever owns those, and do not proceed to tasks 2, 4 or 6 until it is deployed.**

The table mirrors `ticket_messages` (`database.ts:392-400`) with `ticket_id` and `is_internal`
dropped and `customer_id` added. Nothing about it is novel; that is the point.

```sql
create table public.customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  author_id   uuid references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index idx_customer_notes_customer on public.customer_notes (customer_id, created_at desc);

alter table public.customer_notes enable row level security;

-- Scoped through the parent customer, which already carries department_id and
-- branch_id and is already policied (backend plan §3, `:43-46`). The note table
-- deliberately does NOT duplicate those columns — one source of truth for scope.
create policy "customer_notes select own scope"
on public.customer_notes for select to authenticated
using (
  exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.department_id = current_department()
      and c.branch_id = current_branch()
  )
);

create policy "customer_notes insert own scope"
on public.customer_notes for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.customers c
    where c.id = customer_id
      and c.department_id = current_department()
      and c.branch_id = current_branch()
  )
);
```

Four properties are deliberate and must survive review:

- **`author_id` is nullable but `with check (author_id = auth.uid())` on insert.** Nullable so a
  future system-written note is representable, exactly as `ticket_messages.author_id` is
  (`database.ts:394`) and `MessageRow.tsx:26` already handles. The `with check` is what makes
  criterion `:586` — *"it saves with my name"* — enforceable rather than merely conventional: an
  agent cannot attribute a note to someone else.
- **No UPDATE and no DELETE policy.** Consistent with `phase1_backend_plan.md:44` (*"No delete
  policies for agents anywhere"*) and with `ticket_messages`. A note is a record, not a draft.
- **`on delete cascade`** on `customer_id` only. Deleting a profile must not delete their notes —
  hence no cascade on `author_id`, and hence the nullable column.
- **`current_department()` / `current_branch()`** are the existing `SECURITY DEFINER` helpers
  (`phase1_backend_plan.md:44`). **No new function is needed**, and writing the scope check
  inline against `profiles` instead would reintroduce the policy recursion those helpers exist to
  avoid.

Then, in this repo:

```bash
npm run gen:types
grep -n "customer_notes: {" src/core/types/database.ts
```

The `Row` block must carry `customer_id: string`, `author_id: string | null`, `body: string`,
`created_at: string`. **Review the whole diff** — `git diff --stat src/core/types/database.ts`
should show `customer_notes` added and **nothing else changed**. This is the second regeneration
in the repo's life (story 23 was the first); a silent column drift elsewhere would surface as a
type error in a feature this story never touched. Fix it in this commit if it appears, and say so.

**No other backend work.** The bucket, its limits and its policies are deployed and verified
(`phase1_backend_plan.md:148-157`). Two backend *facts* nonetheless remain unproven and are
verification steps, not tasks:

- **Verification step 1** proves an agent can INSERT an `attachments` row scoped to a customer. §3
  (`:43-46`) names only `customers` and `tickets` as scoped by department and branch; the
  `attachments` table has **no** `department_id`/`branch_id` column of its own (`database.ts:50-61`),
  so its policy must reach through a FK. **BRD `:256` asserts agents have `CRU — own dept`; no
  document in this repo shows the policy that delivers it, and no client has ever tried.**
- **Verification step 2** proves `docs/phase1_brd_1.md:590` — the cross-branch denial. It is the
  one acceptance criterion satisfied entirely by deployed policy rather than by any line this
  story writes, and `phase1_api_reference.md:450` is explicit that the table and the objects are
  two independent surfaces. **Both halves must be tested.**

---

## Frontend Tasks

### 1 — Dependencies, types, and the data layer for attachments

#### 1a — Install the pickers

```bash
npx expo install expo-image-picker expo-document-picker expo-file-system expo-crypto
```

**Use `npx expo install`, never `npm install`** — it resolves the SDK-57-compatible version of
each. All four ship native code that is already bundled in Expo Go on SDK 57, so **none of them
forces a development build**; this repo has deliberately avoided one (see
`core/lib/theme/fonts.ts`'s analysis of the same tradeoff for the font plugin), and this story
does not change that.

**`expo-file-system` is not the API you remember.** SDK 54 replaced it with an object-oriented
`File` / `Directory` / `Paths` API and moved the old function-style surface to
`expo-file-system/legacy`. In SDK 57 the legacy names are still exported from the main entry point
but **throw at runtime** with a "import this method from `expo-file-system/legacy`" notice. Task 3b
uses the new API. Per `AGENTS.md`, check
<https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/> rather than recalling a pattern.

**`expo-crypto` is here only for `Crypto.randomUUID()`.** React Native has no global
`crypto.randomUUID`, and `react-native-url-polyfill/auto` (`core/lib/supabase.ts:4`) does not add
one. The alternative — inserting the `attachments` row first to borrow its server-generated `id`
for the path — is rejected in task 3b for a concrete reason stated there.

**Do not install `expo-image-manipulator`.** Task 3c explains what satisfies NFR-07 instead.

#### 1b — `File: src/features/customers/types.ts`

Append. Keep the existing exports untouched.

```ts
/** One free-text note on a customer — the `customer_notes` projection, camelCased. */
export type CustomerNote = {
  id: string;
  body: string;
  createdAt: string;
  /** `null` for a system-written note; renders as the same fallback `MessageRow.tsx:26` uses. */
  authorName: string | null;
  authorId: string | null;
};

/**
 * One row of `attachments` scoped to a customer. `storagePath` is deliberately
 * carried into the presentation layer — the viewer needs it to mint a signed
 * URL, and there is no public URL to fall back on because the bucket is private
 * (`docs/phase1_backend_plan.md:104`).
 */
export type CustomerAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
  uploadedByName: string | null;
};

/** What a picker hands the upload mutation, whichever of the three sources produced it. */
export type PickedFile = {
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};
```

#### 1c — `File: src/core/utils/format.ts`

Add one function, after `formatCount` (`:94-97`):

```ts
const SIZE_UNIT_KEY = ['file.size.b', 'file.size.kb', 'file.size.mb'] as const;

/**
 * "412 KB" / "١٫٤ م.ب". Binary units (1024), because that is what
 * `attachments.size_bytes` counts and what the bucket's 10 MB limit is measured
 * in — a decimal-MB label beside a binary-MB rejection is how a 10.4 MB file
 * comes to display as "10.4 MB" and be refused by a "10 MB" limit.
 *
 * Digits and the decimal separator follow the active locale via `formatNumber`;
 * the unit itself is an i18n key, because "KB" is "ك.ب" in Arabic.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNIT_KEY.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatNumber(rounded, locale)} ${i18n.t(SIZE_UNIT_KEY[unit])}`;
}
```

Export it from `src/core/utils/index.ts` beside the other `format.ts` re-exports. It goes in
`core/` and not in the feature because a second consumer is already visible — `ReplyComposer`'s
paperclip and `CreateTicketScreen`'s `Dropzone` both become live the day ticket attachments are
built, and CLAUDE.md §2 makes two call sites the threshold.

#### 1d — `File: src/features/customers/api.ts` — constants and the storage path

Add below the `DETAIL_SELECT` block (`:155-158`), and **do not touch `DETAIL_SELECT` itself**.

```ts
// ---------------------------------------------------------------------------
// Notes and attachments (story 24 — SCRUM-26)
// ---------------------------------------------------------------------------

/** The bucket from `docs/phase1_backend_plan.md:103`. Private — never a public URL. */
const ATTACHMENTS_BUCKET = 'attachments';

/**
 * `docs/phase1_backend_plan.md:105` and BRD `:279` (NFR-07). Enforced HERE as
 * well as by the bucket, because a rejection that arrives after a 9-second
 * upload on a 3G connection is not "a clear message" (BRD `:588`) — it is a
 * clear message nine seconds too late.
 */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * `docs/phase1_backend_plan.md:106`. FOUR types, and the bucket rejects anything
 * else regardless of what the picker offered. Keep this list and the bucket's
 * setting in step; they are two enforcement points for one rule.
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Images get a viewer (BRD `:589`); PDFs do not. */
export function isViewableImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Strips everything the path convention cannot carry. The object key is parsed
 * by `storage.foldername(name)` on the server, so an unescaped `/` in a file
 * name would invent a fifth path segment and shift the branch and department
 * out of positions [1] and [2) — the upload would then not match any policy and
 * would be refused, per `phase1_backend_plan.md:112-116`.
 *
 * Arabic file names survive: this strips separators and control characters, not
 * non-ASCII. A name that reduces to nothing falls back to 'file'.
 */
export function sanitiseFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\]+/g, '-')
    .replace(/[ -]/g, '')
    .trim();
  return cleaned || 'file';
}

/**
 * `{branch_id}/{department_id}/{customer_id}/{uuid}-{filename}` — exactly
 * `docs/phase1_backend_plan.md:112`. The first two segments are what the three
 * `storage.objects` policies read (`:118-146`); getting either wrong does not
 * error, it silently matches no policy and the upload is refused.
 *
 * The third segment is the CUSTOMER id. The backend plan writes that segment as
 * `{ticket_id|customer_id}` (`:112`) — either is in scope. `api_reference.md:431`
 * shows only the ticket form; it is the narrower, staler of the two.
 */
export function buildAttachmentPath(params: {
  branchId: string;
  departmentId: string;
  customerId: string;
  fileName: string;
  uuid: string;
}): string {
  return [
    params.branchId,
    params.departmentId,
    params.customerId,
    `${params.uuid}-${sanitiseFileName(params.fileName)}`,
  ].join('/');
}
```

#### 1e — `File: src/features/customers/api.ts` — the fetchers

```ts
const ATTACHMENT_SELECT =
  'id, file_name, mime_type, size_bytes, storage_path, created_at, profiles(full_name)';

type CustomerAttachmentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
  profiles: { full_name: string } | null;
};

function toAttachment(row: CustomerAttachmentRow): CustomerAttachment {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    createdAt: row.created_at,
    uploadedByName: row.profiles?.full_name ?? null,
  };
}

/**
 * NOT an embed on `DETAIL_SELECT`, unlike story 14's ticket history — and the
 * difference is deliberate. That embed was free because the tab renders the
 * moment the profile does. This one is not: the Notes tab is the third of three
 * and is frequently never opened, so embedding would put an attachment join on
 * every profile open, every create and every edit (all three share
 * `DETAIL_SELECT`, `api.ts:151-154`). Separate query, separate cache entry,
 * fetched when the tab is.
 */
export async function fetchCustomerAttachments(customerId: string): Promise<CustomerAttachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select(ATTACHMENT_SELECT)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .returns<CustomerAttachmentRow[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map(toAttachment);
}

/**
 * A short-lived URL for a private object. `getPublicUrl` is NOT an option — the
 * bucket is private by design (`phase1_backend_plan.md:104`: *"A public bucket
 * makes every file URL guessable regardless of any policy written afterward"*).
 *
 * 60 seconds, not the hour `api_reference.md:441` shows. The URL is minted on
 * tap and consumed immediately by one `Image`; a longer window is a longer
 * period in which a URL that has escaped a log or a screenshot still resolves.
 * `:159` calls for "short expiry" without naming a number.
 *
 * Returns `null` rather than throwing when the sign is refused: a cross-branch
 * path (BRD `:590`) and a deleted object are indistinguishable here, and both
 * are "you cannot see this", not an error banner.
 */
export async function createAttachmentSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error) return null;
  return data?.signedUrl ?? null;
}
```

**On error mapping for Storage calls.** `toAppError` (`core/utils/errors.ts:59-86`) reads
`status` as a number or an all-digit `code` string (`:48-57`). `storage-js` reports
`statusCode` — a *string*, under a different key — so a 413 or a 403 from the bucket lands as
`kind: 'unknown'`. That is acceptable for the generic banner, and it is exactly why task 3b
validates size and MIME **before** uploading rather than relying on the server's rejection to
produce a good message. **Do not widen `readStatus` to chase this**; that function is shared by
every feature and story 11 already documents (`api.ts:276-285`) what happens when it over-reaches.

#### 1f — `File: src/features/customers/api.ts` — the notes fetchers

**Blocked on task 0.** Copies `tickets/api.ts:351-421` almost line for line.

```ts
const NOTE_SELECT = 'id, body, created_at, author_id, profiles(full_name)';

type CustomerNoteRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  profiles: { full_name: string } | null;
};

function toNote(row: CustomerNoteRow): CustomerNote {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    authorName: row.profiles?.full_name ?? null,
    authorId: row.author_id,
  };
}

export async function fetchCustomerNotes(customerId: string): Promise<CustomerNote[]> {
  const { data, error } = await supabase
    .from('customer_notes')
    .select(NOTE_SELECT)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .returns<CustomerNoteRow[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map(toNote);
}

/**
 * `authorId` is a REQUIRED parameter, never defaulted and never omitted. BRD
 * `:586` is "it saves with my name", and task 0's insert policy carries
 * `with check (author_id = auth.uid())` — so a payload without it is rejected
 * by the database rather than silently attributed to nobody. The `.select()`
 * embed is what turns the id back into the name the row renders.
 *
 * NEWEST FIRST here and in the fetcher, which is the opposite of
 * `fetchTicketMessages` (`tickets/api.ts:384`, ascending). A ticket thread is a
 * conversation read top to bottom; a note list is a reference read most-recent
 * first. Do not "fix" one to match the other.
 */
export async function createCustomerNote(input: {
  customerId: string;
  authorId: string;
  body: string;
}): Promise<CustomerNote> {
  const { data, error } = await supabase
    .from('customer_notes')
    .insert({
      customer_id: input.customerId,
      author_id: input.authorId,
      body: input.body.trim(),
    })
    .select(NOTE_SELECT)
    .single<CustomerNoteRow>();

  if (error) throw toAppError(error);
  return toNote(data);
}
```

---

### 2 — The upload path

#### 2a — `Create file: src/features/customers/pick.ts`

The three sources of `PickedFile`, isolated in one module so the sheet stays a sheet and the
mutation never learns which button was pressed.

```ts
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import type { PickedFile } from './types';

/**
 * SDK 54+ takes an ARRAY OF STRINGS, not the deprecated `MediaTypeOptions`
 * enum. Verified against https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/
 * — do not substitute a recalled `ImagePicker.MediaTypeOptions.Images`.
 */
const IMAGE_MEDIA_TYPES: ImagePicker.MediaType[] = ['images'];

/**
 * NFR-07 (`docs/phase1_brd_1.md:279`) — "images compressed client-side before
 * upload". This is that compression: the picker re-encodes at 70% JPEG quality
 * before handing back a URI, which takes a 12-megapixel phone photo from ~4 MB
 * to well under 1 MB. See task 3c for why `expo-image-manipulator` is not here.
 */
const IMAGE_QUALITY = 0.7;

function toPickedFile(asset: ImagePicker.ImagePickerAsset): PickedFile {
  return {
    uri: asset.uri,
    // `fileName` is null for a freshly captured photo on both platforms.
    fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    // `mimeType` is documented as present, but a camera asset on Android has
    // been observed without one; the bucket allowlist has no room for a guess,
    // so fall back to the type the quality setting above actually produces.
    mimeType: asset.mimeType ?? 'image/jpeg',
    sizeBytes: asset.fileSize ?? 0,
  };
}

export async function pickFromCamera(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: IMAGE_MEDIA_TYPES,
    quality: IMAGE_QUALITY,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return toPickedFile(result.assets[0]);
}

export async function pickFromGallery(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: IMAGE_MEDIA_TYPES,
    quality: IMAGE_QUALITY,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return toPickedFile(result.assets[0]);
}

/**
 * `type` is the bucket's allowlist, so the OS file browser greys out everything
 * the server would refuse. `copyToCacheDirectory` defaults to true and is left
 * so ON PURPOSE — without it, a content:// URI on Android is not readable by
 * `expo-file-system`, and the upload fails at the read rather than at the pick.
 */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...ALLOWED_MIME_TYPES],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    sizeBytes: asset.size ?? 0,
  };
}
```

**Permission denial returns `null`, not an error.** An agent who declines the camera prompt has
made a choice, not hit a fault; the sheet closes and nothing happens. Two consecutive `null`s
from `requestCameraPermissionsAsync` mean the OS is no longer prompting because permission was
permanently denied — open question 6 is whether that deserves a "open Settings" path.

#### 2b — `File: src/features/customers/api.ts` — the upload

```ts
export class AttachmentTooLargeError extends Error {
  constructor(readonly sizeBytes: number) {
    super(`Attachment is ${sizeBytes} bytes, over the ${MAX_ATTACHMENT_BYTES} limit`);
  }
}

export class AttachmentTypeNotAllowedError extends Error {
  constructor(readonly mimeType: string) {
    super(`Attachment type ${mimeType} is not one of the four allowed types`);
  }
}

export type UploadAttachmentParams = {
  customerId: string;
  branchId: string;
  departmentId: string;
  uploadedBy: string;
  file: PickedFile;
};

/**
 * Upload the object, THEN insert the row. The order is not arbitrary: the
 * reverse leaves a row pointing at a file that does not exist, which every
 * later render must defend against, whereas this order leaves at worst an
 * unreferenced object — invisible to the app and cleanable in one sweep
 * (`phase1_backend_plan.md:161`, open question 5).
 *
 * The path's uuid comes from `expo-crypto`, not from the row's own id. Borrowing
 * the id would force the insert to happen first and invert exactly this
 * tradeoff.
 *
 * `upsert` is left at its default (false) so a uuid collision surfaces rather
 * than silently overwriting someone else's file.
 */
export async function uploadCustomerAttachment(
  params: UploadAttachmentParams,
): Promise<CustomerAttachment> {
  const { file } = params;

  // Both guards run BEFORE a single byte moves. BRD `:588` asks for a clear
  // message; the clearest one is the one that arrives instantly.
  if (file.sizeBytes > MAX_ATTACHMENT_BYTES) throw new AttachmentTooLargeError(file.sizeBytes);
  if (!isAllowedMimeType(file.mimeType)) throw new AttachmentTypeNotAllowedError(file.mimeType);

  const storagePath = buildAttachmentPath({
    branchId: params.branchId,
    departmentId: params.departmentId,
    customerId: params.customerId,
    fileName: file.fileName,
    uuid: Crypto.randomUUID(),
  });

  // The new SDK 54+ API. `fetch(uri).then(r => r.blob())` does NOT work for a
  // file:// URI in React Native, and `storage-js` says so itself at
  // `StorageFileApi.ts:218`: pass an ArrayBuffer/ArrayBufferView instead.
  // `Uint8Array` is an `ArrayBufferView` and is accepted directly (`:42-43`).
  const bytes = await new File(file.uri).bytes();

  const upload = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, bytes, { contentType: file.mimeType });

  // `contentType` is explicit because Storage otherwise infers it from the
  // extension, and a cache-directory URI frequently has none.
  if (upload.error) throw toAppError(upload.error);

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      customer_id: params.customerId,
      file_name: sanitiseFileName(file.fileName),
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
      storage_path: storagePath,
      uploaded_by: params.uploadedBy,
    })
    .select(ATTACHMENT_SELECT)
    .single<CustomerAttachmentRow>();

  if (error) {
    // Best-effort: do not leave an object with no row when we can help it.
    // `phase1_backend_plan.md:140-146` grants the delete on `storage.objects`,
    // and this is the one legitimate use of it in the app (see fact 5 — there
    // is no user-facing delete). A failure here is swallowed deliberately: the
    // insert error is the one worth reporting.
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
    throw toAppError(error);
  }

  return toAttachment(data);
}
```

Import `* as Crypto from 'expo-crypto'` and `{ File } from 'expo-file-system'` at the top of
`api.ts`. **`File` is the new object-oriented export** — importing `readAsStringAsync` from
`expo-file-system` instead would throw at runtime under SDK 57 (task 1a).

**`ticket_id` and `message_id` are omitted, not set to `null`.** Both are optional in the
generated `Insert` (`database.ts:64-72`), and BRD `:189` says of the three FKs *"exactly one
required"*. Sending explicit nulls would be harmless today and misleading the day a CHECK
constraint enforces that sentence.

#### 2c — On NFR-07 and `expo-image-manipulator`

BRD `:279` requires *"images compressed client-side before upload"*. `IMAGE_QUALITY = 0.7` on both
image pickers is that compression, and it is applied by the same native code that decodes the
photo — no second decode, no extra dependency, no `Paths.cache` temp file to clean up.

`expo-image-manipulator` would add *resizing* (capping the long edge at, say, 2048px), which
compresses harder. **It is not installed here** for two reasons: its SDK 54+ API is a
context-object chain (`ImageManipulator.manipulate(uri).resize(…).renderAsync()`, with the
familiar `manipulateAsync` deprecated), so it is not the one-line addition it looks like; and
`quality: 0.7` alone already clears the 10 MB ceiling for every phone camera in use, which is what
the requirement is protecting. **If a real device produces a photo over 10 MB, install it** — that
is the trigger, and open question 3 records it.

---

### 3 — The upload sheet, the size guard, and permissions config

#### 3a — `Create file: src/features/customers/components/UploadSourceSheet.tsx`

BRD `:587` — *"camera, gallery and file options are offered"*. Three `ActionRow`s in a
`BottomSheet`. **No new core component.**

```tsx
export type UploadSource = 'camera' | 'gallery' | 'file';

export type UploadSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: UploadSource) => void;
};
```

```tsx
<BottomSheet visible={visible} onClose={onClose} title={t('customerNotes.upload.title')}>
  <ActionRow icon="camera" title={t('customerNotes.upload.camera')}
    description={t('customerNotes.upload.cameraHint')} divider
    onPress={() => { onClose(); onSelect('camera'); }} />
  <ActionRow icon="image" title={t('customerNotes.upload.gallery')}
    description={t('customerNotes.upload.galleryHint')} divider
    onPress={() => { onClose(); onSelect('gallery'); }} />
  <ActionRow icon="file" title={t('customerNotes.upload.file')}
    description={t('customerNotes.upload.fileHint')}
    onPress={() => { onClose(); onSelect('file'); }} />
</BottomSheet>
```

Three details are load-bearing:

- **`onClose()` before `onSelect()`.** The picker presents its own native modal. Opening it while
  this `Modal` is still mounted stacks two modals; on iOS the second frequently does not appear at
  all, and the agent taps "Camera" to no visible effect.
- **`divider` on the first two only** — `ActionRow.tsx:45-46` draws a hairline bottom border, and
  a trailing one above the sheet's own bottom padding reads as a broken edge.
- **No horizontal padding on the rows' container.** `BottomSheet.tsx:141-146` already applies
  `paddingHorizontal: theme.spacing.lg` to its children.
- The third row's hint names the accepted types in words — *"JPG, PNG, WEBP or PDF, up to 10 MB"*.
  That is the only place an agent learns the allowlist before hitting it, and it is why
  `fileHint` interpolates neither a constant nor a formatted size: it is copy, and it must read
  naturally in Arabic too.

#### 3b — The size guard's message

`AttachmentTooLargeError` (task 2b) carries the actual size. The tab renders:

```tsx
t('customerNotes.errors.tooLarge', {
  size: formatFileSize(error.sizeBytes),
  max: formatFileSize(MAX_ATTACHMENT_BYTES),
})
```

→ *"That file is 14.2 MB. The limit is 10 MB."* BRD `:588` asks for *"a clear message"*, and a
message that names both numbers is the difference between an agent retrying with a smaller file
and an agent retrying with the same one. Render it with
`accessibilityLiveRegion="polite"`, as `ReplyComposer.tsx:106-110` does — the error appears
without any focus change, and a screen reader would otherwise never announce it.

`AttachmentTypeNotAllowedError` gets its own key naming the four types. It is close to
unreachable — `pickDocument` filters by the same list and the image pickers only return images —
but "close to unreachable" is not "unreachable", and a `heic` from an iOS library is the live
counterexample. See open question 3.

#### 3c — `File: app.json`

Add the picker's config plugin to `plugins` (`:25-39`), after `"expo-font"`:

```json
[
  "expo-image-picker",
  {
    "photosPermission": "AZM needs access to your photos so you can attach them to a customer.",
    "cameraPermission": "AZM needs access to your camera so you can photograph documents for a customer."
  }
]
```

Both strings are shown to the agent by iOS in the permission dialog. **They are English-only and
that is a defect**, not a decision — `Info.plist` permission strings are localised through
`InfoPlist.strings`, which this project has no mechanism for, in an **Arabic-first** app. Recorded
as open question 7; do not attempt to solve it inside `app.json`.

**Adding this plugin does not require a development build.** The plugin customises the permission
strings of native code Expo Go already bundles; without it the app falls back to Expo's generic
strings, which are worse but not broken.

---

### 4 — Query keys and hooks

#### 4a — `File: src/features/customers/hooks.ts`

Add two members to `customerKeys` (`:26-38`), leaving `all`, `list`, `count` and `detail`
untouched:

```ts
  /** `['customers', <uuid>, 'notes']` — its own entry, NOT part of `detail`. */
  notes: (customerId: string) => ['customers', customerId, 'notes'] as const,
  /** `['customers', <uuid>, 'attachments']` — likewise. */
  attachments: (customerId: string) => ['customers', customerId, 'attachments'] as const,
```

And extend the block comment at `:31-36`. Its current sentence — *"This is the ONE cache entry
story 11's create redirect lands on… Do not add a second detail query"* — stays true and must not
be read as forbidding these: they are **sibling** entries under the same customer id, not a second
copy of the profile. Say so, or the next reader will delete them.

Both keys nest **under** `customerKeys.all` (`['customers']`), so `useCreateCustomer`'s and
`useUpdateCustomer`'s existing `invalidateQueries({ queryKey: customerKeys.all })`
(`hooks.ts:117`, `:138`) now also invalidate notes and attachments. That is harmless — both are
`enabled`-gated on a mounted tab — and it is the reason task 4c's own invalidations are narrow
rather than reaching for `all`.

#### 4b — The three read hooks

```ts
/**
 * `enabled` is the tab's visibility, not just a truthy id. The Notes tab is the
 * third of three and is often never opened; firing this on every profile open
 * is the cost story 14's embed was right to avoid and this query would
 * reintroduce.
 */
export function useCustomerNotes(customerId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.notes(customerId),
    queryFn: () => fetchCustomerNotes(customerId),
    enabled: enabled && Boolean(customerId),
  });
}

export function useCustomerAttachments(customerId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.attachments(customerId),
    queryFn: () => fetchCustomerAttachments(customerId),
    enabled: enabled && Boolean(customerId),
  });
}
```

#### 4c — The two mutations

```ts
export function useCreateCustomerNote(customerId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: (body: string) =>
      createCustomerNote({ customerId, authorId: userId as string, body }),
    onSuccess: () => {
      // Only this customer's notes. A note changes no list, no count, and
      // nothing on the Info or Tickets tabs — the same narrow reasoning as
      // `usePostTicketMessage` (tickets/hooks.ts:178-184).
      void queryClient.invalidateQueries({ queryKey: customerKeys.notes(customerId) });
    },
  });
}

/**
 * `branchId` and `departmentId` come from the signed-in AGENT, never from the
 * customer being viewed — exactly as `useCreateCustomer` (`:102-125`) does, and
 * for a sharper reason here: those two values are the first two segments of the
 * storage path, and the `storage.objects` policies compare them against
 * `current_branch()` and `current_department()` (`phase1_backend_plan.md:121-146`).
 * A path built from the customer's org would be refused for any customer outside
 * the agent's own scope — and would *appear* to work for every customer inside
 * it, which is how this becomes a bug found in production rather than in review.
 */
export function useUploadCustomerAttachment(customerId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const profile = useAgentProfile();

  return useMutation({
    mutationFn: (file: PickedFile) =>
      uploadCustomerAttachment({
        customerId,
        branchId: profile.data?.branchId as string,
        departmentId: profile.data?.departmentId as string,
        uploadedBy: session?.user.id as string,
        file,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.attachments(customerId) });
    },
  });
}
```

**Gate the upload control on `profile.isSuccess`.** `useCreateCustomer` disables Save until the
profile loads (`hooks.ts:96-101`) rather than sending an empty string; here an empty `branchId`
would produce the path `/{dept}/{customer}/…` — a leading empty segment, which shifts branch into
position [2] and matches no policy. Same failure, less legible.

#### 4d — `File: src/features/customers/index.ts`

Export the new hooks, the two error classes, `MAX_ATTACHMENT_BYTES`, `isViewableImage`,
`createAttachmentSignedUrl`, and the three new types, keeping the file's alphabetical grouping.
**`pick.ts` is not exported** — it is an implementation detail of this feature's own tab, and the
barrel is the import surface for *other* features (hard rule 4), not a dumping ground.

---

### 5 — The attachment list, the viewer, and the Dropzone's first live caller

#### 5a — `Create file: src/features/customers/components/AttachmentRow.tsx`

One `Pressable` row: a 40×40 chip (`radius.md`, `bgSurfaceSunken`) carrying `image` or `file` by
`isViewableImage(mimeType)`, then a two-line content column — file name
(`variant="callout" weight="semibold" numberOfLines={1}`) over
`formatFileSize(sizeBytes)` · `formatDate(createdAt)` (`variant="caption" tone="muted"`).

```tsx
export type AttachmentRowProps = {
  attachment: CustomerAttachment;
  /** Only images are tappable — BRD `:589` promises a viewer for images alone. */
  onPress?: (attachment: CustomerAttachment) => void;
};
```

- **A PDF row is not pressable and must not look pressable.** `onPress` is undefined for
  non-images and the row renders no chevron. Opening a PDF is open question 8.
- `accessibilityLabel` composes name, size and uploader the way `TicketRow.tsx:24-30` and
  `MessageRow.tsx:33-36` do, and **states that images open** — "tappable" is invisible to a
  screen reader.
- `uploadedByName` falls back to `t('ticketDetail.event.system')`, reusing the existing key
  exactly as `MessageRow.tsx:26` does.
- Hard rule 5: `flexDirection: 'row'` + `gap`, no `marginLeft`/`marginRight`.

#### 5b — `Create file: src/features/customers/components/AttachmentViewer.tsx`

BRD `:589` — *"Given an uploaded image, when I tap it, then a full-screen viewer opens"*.

```tsx
export type AttachmentViewerProps = {
  attachment: CustomerAttachment | null;
  onClose: () => void;
};
```

A React Native `Modal` (`presentationStyle="fullScreen"`, `onRequestClose={onClose}` for the
Android back button) over `theme.colors.bgOverlay`, with a close `IconButton icon="close"` at the
top trailing corner inside `useSafeAreaInsets()`, and a React Native `Image` with
`resizeMode="contain"` filling the rest.

The URL is minted per-open, not stored:

```tsx
const [url, setUrl] = useState<string | null>(null);
const [failed, setFailed] = useState(false);

useEffect(() => {
  if (!attachment) { setUrl(null); setFailed(false); return; }
  let cancelled = false;
  void createAttachmentSignedUrl(attachment.storagePath).then((signed) => {
    if (cancelled) return;
    setUrl(signed);
    setFailed(signed === null);
  });
  return () => { cancelled = true; };
}, [attachment]);
```

Five things here are deliberate:

- **The `cancelled` flag is not ceremony.** Tapping two rows quickly fires two signs; without it
  the slower response wins and the viewer shows the wrong image.
- **A signed URL is never cached in the query cache.** It expires in 60 seconds (task 1e), and a
  cache entry outliving its own contents is a blank viewer with no error. This is the one piece of
  server state in the feature that deliberately does **not** go through TanStack Query.
- **`failed === true` renders `ErrorState`, not a spinner.** A refused sign is BRD `:590` working
  correctly; the viewer must say "you cannot see this", not hang.
- **RN's `Image`, not `expo-image`.** `expo-image` is not a dependency and this story does not add
  one for a single full-screen view. It would buy caching that a 60-second URL cannot use anyway.
- **No zoom or pan.** `react-native-gesture-handler` is present, but "a full-screen viewer opens"
  is the criterion, and pinch-zoom is a separate design decision — open question 8.

#### 5c — The upload control

`Dropzone` (`core/components/Dropzone.tsx`) gets its **first live caller**. It already defaults to
`icon="paperclip"` (`:31`) and already renders an `error` beneath itself (`:66-70`), which is
where task 3b's size message goes.

```tsx
<Dropzone
  label={t('customerNotes.attach.label')}
  hint={t('customerNotes.attach.hint')}
  disabled={upload.isPending || !profile.isSuccess}
  error={uploadErrorMessage}
  onPress={() => setUploadSheetVisible(true)}
/>
```

Its doc comment (`:20-24`) flags that `borderStyle: 'dashed'` with a `borderRadius` renders solid
on Android (§15 flag 8). **This story is the first chance anyone has had to see that on a real
screen** — check it on an Android device and record the result against that flag rather than
silently accepting it.

---

### 6 — The Notes tab

#### 6a — `Create file: src/features/customers/components/NoteRow.tsx`

`MessageRow.tsx` minus the internal-note branch and minus the rail. Author name
(`variant="callout" weight="semibold" numberOfLines={1}`, `flex: 1`) and `formatTime(createdAt)`
(`variant="caption" tone="muted"`) on one row, body (`variant="callout"`) below, a hairline bottom
border in `borderSubtle`.

**Use `formatDateTime` (`format.ts:23-32`), not `formatTime`.** `MessageRow` can use bare time
because a ticket thread is read in one sitting; a note list spans months, and "08:26" on a note
from March is worse than no timestamp. This is the one place task 6a departs from its template,
and criterion `:586` — *"it saves with my name and timestamp"* — is the reason.

`authorName ?? t('ticketDetail.event.system')`, exactly as `MessageRow.tsx:26`.

#### 6b — `Create file: src/features/customers/components/NoteComposer.tsx`

`ReplyComposer.tsx:57-104` with the mode chips (`:43-55`) and the paperclip (`:58-66`) removed —
the attachment control is `Dropzone` above the list, not a button in the composer.

```tsx
export type NoteComposerProps = {
  onSubmit: (body: string) => void;
  submitting: boolean;
  error?: string;
};
```

Keep `ReplyComposer`'s three behaviours verbatim: `canSend = body.trim().length > 0 && !submitting`
(`:24`), clear the field immediately on submit (`:29`), and the round 40px send button at
`opacity.disabled` when it cannot fire (`:86-103`). Keep the top hairline and `bgSurface`
background (`:38-40`) — it is what separates the composer from the scrolling list above it.

#### 6c — `Create file: src/features/customers/components/CustomerNotesTab.tsx`

```tsx
export type CustomerNotesTabProps = { customerId: string };
```

**This tab breaks `CustomerTicketsTab`'s rule and must say so.** That component's comment at
`:60-62` — *"No loading and no error branch here… a tab-level spinner could never fire"* — is true
because its data rides in the profile's own response. These two queries are the tab's own, so the
state ladder comes back. Copy the branch order from
`CustomerDetailScreen.tsx:33-60`.

Layout, top to bottom, on a `theme.colors.bgCanvas` ground (`CustomerTicketsTab.tsx:75`):

1. `Dropzone` (task 5c), inside `padding: theme.spacing.lg`.
2. A `SectionHeader variant="rule"` for attachments, then the `AttachmentRow` list — rendered only
   when `attachments.data.length > 0`. **No empty state for the attachments section**; the
   `Dropzone` directly above it already says what to do, and an "no attachments yet" panel between
   the control and the notes is noise.
3. A `SectionHeader variant="rule"` for notes, then the `NoteRow` list, or
   `EmptyState icon="file"` when there are none.
4. `NoteComposer`, pinned below the scroll area.

**One `FlatList`, not two.** Nesting two scrollables inside a `ScrollView` produces the
`VirtualizedLists should never be nested` warning and breaks momentum on Android. Build one
`SectionList` over two sections — `attachments` and `notes` — with `renderItem` branching on the
section key, matching `TicketsScreen.tsx:130-147`'s configuration
(`stickySectionHeadersEnabled={false}`, `renderSectionHeader` → `SectionHeader variant="rule"`).
The `Dropzone` is the `ListHeaderComponent`; the composer sits **outside** the list, as a sibling,
so the keyboard does not push it through the content.

`isPending` on **either** query renders `SkeletonList count={4}`; `isError` on either renders
`ErrorState` with `errorMessageKey` and a retry that refetches both. Two independent spinners in
one tab is worse than one.

#### 6d — `File: src/features/customers/screens/CustomerDetailScreen.tsx`

Replace `:100-103` — the `EmptyState` and its `SCRUM-26` comment — with
`<CustomerNotesTab customerId={customerId} />`, and add the import beside the other two
(`:10-12`).

Nothing else in this file changes. `ActiveTab` (`:24`) already has `'notes'`, the tab button
(`:87-91`) already exists, and `CustomerDetailHeader` is untouched.

**Pass the tab's visibility down** so tasks 4b's `enabled` gates do real work:
`<CustomerNotesTab customerId={customerId} />` mounts only when `tab === 'notes'`, which the
existing ternary already guarantees — so the hooks' `enabled` default of `true` is correct and no
extra prop is needed. Verify that by confirming no `customer_notes` request fires on a profile
open; if one does, the ternary has been replaced by a hidden-but-mounted branch.

---

### 7 — i18n

#### 7a — `File: src/core/lib/i18n/locales/en.json`

Add `size` under the existing `field` block (which holds `attach` at `:15`), for
`formatFileSize`:

```json
"file": { "size": { "b": "B", "kb": "KB", "mb": "MB" } },
```

Place it as a new top-level block. Then a `customerNotes` block immediately after `customerDetail`
(which ends at `:314`), keeping the file's screen order:

```json
"customerNotes": {
  "notesLabel": "Notes",
  "attachmentsLabel": "Attachments",
  "empty": "No notes yet. Add the first one below.",
  "composerPlaceholder": "Add a note about this customer…",
  "send": "Save note",
  "attach": {
    "label": "Attach a file",
    "hint": "JPG, PNG, WEBP or PDF, up to 10 MB"
  },
  "upload": {
    "title": "Add an attachment",
    "camera": "Take a photo",
    "cameraHint": "Photograph a document or a damaged item",
    "gallery": "Choose from gallery",
    "galleryHint": "Pick an existing photo",
    "file": "Choose a file",
    "fileHint": "JPG, PNG, WEBP or PDF"
  },
  "rowLabel": "{{name}}, {{size}}, added by {{author}}",
  "imageRowLabel": "{{name}}, {{size}}, added by {{author}}. Opens full screen.",
  "noteLabel": "Note by {{author}}, {{time}}",
  "viewerClose": "Close image",
  "viewerFailed": "This file isn't available.",
  "errors": {
    "tooLarge": "That file is {{size}}. The limit is {{max}}.",
    "typeNotAllowed": "Only JPG, PNG, WEBP and PDF files can be attached."
  }
}
```

#### 7b — `File: src/core/lib/i18n/locales/ar.json`

The same keys, same order, in the matching positions (`customerDetail` ends at `:332`).
**All twenty-one Arabic strings are this plan's, not a translator's, and need copy review** —
open question 7. Three need particular care: `attach.hint` and `upload.fileHint` list Latin file
extensions inside an Arabic sentence and need explicit LTR isolation or rephrasing;
`errors.tooLarge` interpolates two `formatFileSize` outputs that are already Arabic-Indic
numerals with an Arabic unit, so the sentence must be composed around them rather than translated
around the English word order; and `file.size.*` are unit abbreviations
(`ب` / `ك.ب` / `م.ب`) whose conventional forms should be confirmed rather than guessed.

---

### 8 — Documentation and the stale comments

#### 8a — `File: docs/phase1_api_reference.md`

Rewrite `:424-450`. Change `🔨` to `✅` at `:424`, `:428` and `:436`, and **delete `:426`** —
*"Requires §7 of the backend plan. No bucket exists yet."* is false and has been since §7 shipped.
Replace it with the bucket's real settings (private, 10 MB, the four MIME types), the path
convention from `phase1_backend_plan.md:112`, and the note that the third segment may be a
customer id as well as a ticket id — `:431` currently shows only the ticket form. **Keep `:450`
verbatim**; it is the most important sentence in the section and this story's verification step 2
exists to honour it.

#### 8b — `File: docs/phase1_remaining_stories_status.md`

Remove the US-010 row from the Blocked table (`:87-92`) and correct the subtotal at `:95`. Also
correct `:134` — *"US-010 (attachments) and US-028 (in-app alerts) could unblock before the full
token API (§8) lands"* — both have now done exactly that, so the sentence should record the
outcome rather than predict it.

#### 8c — `File: src/features/tickets/components/ReplyComposer.tsx`

`:59` reads `// TODO(US-???): attachments — API §8 is 🔨, no storage bucket yet.` **Both clauses
are now false.** The bucket exists and this story uses it. Replace it with the real reason the
control is still disabled — ticket-message attachments are a separate story, not a blocked one —
and give the TODO a real id instead of `US-???`. **Leave the `disabled` prop alone.**

#### 8d — `File: src/features/tickets/screens/CreateTicketScreen.tsx`

Same correction at `:334-336`, which says *"API §8 is still 🔨 and no picker package is
installed."* The second clause is also now false — task 1a installs three. The `Dropzone` stays
disabled; only the comment changes. Story 13's open question 3 can be marked answered.

#### 8e — `File: CLAUDE.md`

Three edits, required by the file's own rule that reality and this file must not diverge:

- The customers paragraph says the record *"is now complete apart from its notes tab"* and that
  the Notes tab *"(US-010, SCRUM-26, blocked on Storage) still renders a placeholder."* Both are
  now wrong. Describe the tab as built, and state plainly that it required a **new
  `customer_notes` table** that did not exist in phase 1's schema.
- The sentence *"Attachments (API §8), the customer Notes tab and CSAT (§7) all remain blocked on
  Storage — these are now the only unbuilt phase-1 areas."* (added when story 23 shipped) is wrong
  in three ways after this story and needs rewriting, not patching. **Storage is not a blocker at
  all** — `phase1_backend_plan.md:93` has said so since §7 shipped, and this story proves it. The
  customer Notes tab is built. Attachments are built **for customers**; ticket and message
  attachments are merely unbuilt, which is a scope boundary rather than a block. **CSAT is the
  one item that genuinely remains**, and its blocker should be named accurately rather than
  inherited from this sentence — check it before repeating the claim.
- The Commands section should note that `npm run gen:types` has now run for a second reason, and
  that four Expo packages were added — the first native additions since the font work.

**Re-read `CLAUDE.md` before editing it.** It changed under story 23 while this plan was being
written, and the three passages above are quoted from the version current at that moment. If the
wording has moved again, fix the *claims*, not the strings.

#### 8f — `File: docs/phase1_known_issues.md`

Under **Verification gaps** (`:9`), record whichever of verification steps 1 and 2 did not pass.
Also record the two documentation defects this story found and fixed (§8's stale 🔨, the stale
Blocked row), and the Arabic permission-string gap from open question 7. That gap is a
user-visible, Arabic-first defect with no owner; a Jira comment is not where it will be found.

---

## Edge Cases & Failure Modes

- **`customer_notes` missing from `database.ts`.** Every `supabase.from('customer_notes')` is a *type* error, not a runtime one. Task 0 is the fix. **Do not hand-write the table into the generated file** (hard rule 6), and do not stub the notes half against a local type — ship the attachments half alone instead.
- **A file over 10 MB.** Caught in `uploadCustomerAttachment` before any byte moves (task 2b), surfaced through `Dropzone`'s `error` prop with both numbers named (task 3b). The bucket would also refuse it (`phase1_backend_plan.md:105`) — two enforcement points, deliberately. **The client guard is the one the agent experiences.**
- **`fileSize` is `undefined` on the picked asset.** `pickDocument` falls back to `0` and `pickFromCamera` to `0`, which passes the size guard and defers the rejection to the bucket. Rare, and the honest failure: the client cannot invent a size it was not told. The bucket's 413 then surfaces as the generic banner (see the note in task 1e). **Do not `stat` the file to fill the gap** — `new File(uri).size` is available and would work, but it costs a filesystem round trip on every pick to improve an error message in a case the server already handles.
- **A `heic` from an iOS photo library.** `mediaTypes: ['images']` accepts it; `quality: 0.7` re-encodes to JPEG on iOS, so the delivered `mimeType` is `image/jpeg` and the allowlist passes. **This is behaviour, not guarantee** — if a device delivers `image/heic`, `AttachmentTypeNotAllowedError` fires with a clear message rather than a silent bucket refusal. Test it on real hardware (matrix row 9).
- **An Arabic or emoji file name.** `sanitiseFileName` strips only separators and control characters, so both survive into `storage_path` and into `file_name`. A `/` in a name would otherwise invent a path segment and shift branch and department out of positions [1] and [2], which does not error — it matches no policy and the upload is refused (`phase1_backend_plan.md:112-116`).
- **The upload succeeds and the row insert fails.** Best-effort `remove()` in task 2b, then throw. If the remove *also* fails, an unreferenced object remains: invisible to the app, and the reason open question 5 exists.
- **The row insert succeeds and the tab is closed before the invalidation lands.** Nothing breaks; the query refetches on next mount. `staleTime` is 30s (`query-client.ts:13`).
- **Two agents upload the same file name at the same second.** Different `Crypto.randomUUID()` prefixes, different object keys, two rows. Correct. `upsert` is left false so a genuine uuid collision would surface rather than overwrite.
- **A signed URL expires while the viewer is open.** The `Image` keeps rendering the bytes it already fetched; reopening mints a new URL. **Do not add a refresh timer.**
- **An image fails to load in the viewer.** `createAttachmentSignedUrl` returning `null` renders `ErrorState`. An `Image` that gets a URL but fails to decode needs `onError` → the same state; without it the viewer is a black rectangle with a close button.
- **A cross-branch `storage_path`.** The sign is refused by `"attachments read own scope"` (`phase1_backend_plan.md:121-128`), `createAttachmentSignedUrl` returns `null`, the viewer says so. **This is BRD `:590` and it is enforced by policy, not by this code** — which is exactly why verification step 2 exists and why the criterion cannot be ticked from a code review.
- **Permission permanently denied.** `requestCameraPermissionsAsync` stops prompting and returns `granted: false` every time; `pickFromCamera` returns `null`; the sheet closes and nothing visible happens. **This is the worst UX in the story** — see open question 6.
- **Offline.** Both queries fail into `ErrorState` with retry. The upload throws a network `AppError`, surfaced through `Dropzone`'s `error`. **Nothing is queued** — an agent who attaches a photo on a lift with no signal loses the attempt, not the photo.
- **A note of only whitespace.** `canSend` uses `body.trim().length > 0` (`ReplyComposer.tsx:24`) and `createCustomerNote` trims again before insert. Two guards for one rule, matching the repo's existing pattern.
- **`author_id` null on an existing note.** Renders `t('ticketDetail.event.system')`, exactly as `MessageRow.tsx:26`. Unreachable today (task 0's `with check` forbids it on insert) and deliberately still handled.
- **RTL.** Every new row is `flexDirection: 'row'` + `gap`; no directional props anywhere. The viewer's close button uses `end`, never `right` (hard rule 5, eslint-enforced). File names and sizes contain Latin runs inside Arabic lines — **wrap the file name in `isolateLtr` (`format.ts:120-122`)**, the same treatment `CustomerRow` gives a phone number, or a name ending in `.pdf` renders its extension at the wrong end of the line.
- **Tablet.** The `Dropzone` stretches to full width, which is correct; `AttachmentRow`'s chip must not (fixed 40×40).

---

## Test Plan

**There is no test runner in this repository** (`AGENTS.md`) — no Jest, no test files, no `test`
script. Story 23 already made the case for adding one and deferred it; this story adds a **third**
and **fourth** caller to that queue and still does not install it, for the same reason: a story
whose first step is a schema migration and whose second is a `curl` against production Storage
policies is the wrong place to introduce a harness.

1. **Four pure functions here are unit-testable the day a runner lands**, and they are the best candidates the repo has produced so far: `sanitiseFileName` (a `/`, a `\`, a control character, an Arabic name, a name that reduces to empty), `buildAttachmentPath` (segment order and count), `formatFileSize` (0, 1023, 1024, 10 MB exactly, 10.4 MB, both locales), and `isAllowedMimeType`. They join `groupNotificationsByRecency`, `styleFor` and `state-machine.ts`. **File it as a standalone task and note it now has six callers waiting.**
2. The matrix below is the test plan. **Rows 1 and 2 are backend gates and run before any client code is written.**

| # | Scenario | Expected |
|---|---|---|
| 1 | `POST` an `attachments` row with `customer_id` using an **agent** JWT | `201` — proves BRD `:256`'s CRU (verification step 1) |
| 2 | Sign a `storage_path` under **another branch's** prefix with my JWT | Refused (verification step 2) — this is BRD `:590` |
| 3 | Open a customer → Notes tab | Attachments and notes both load; **no request fires before the tab is opened** |
| 4 | Type a note, save it | Appears at the **top** with my full name and a date-and-time stamp |
| 5 | Sign in as a second agent, open the same customer | Note 4 shows the **first** agent's name, not the reader's |
| 6 | Tap the `Dropzone` | Sheet offers **camera, gallery and file** (BRD `:587`) |
| 7 | Take a photo | Uploads; row shows name, size, date; object lands under `{branch}/{dept}/{customer}/` |
| 8 | Pick a PDF over 10 MB | **Rejected instantly**, message names both the file's size and the limit; **no network request** |
| 9 | Pick a HEIC photo from an iOS library | Uploads as `image/jpeg`, or is rejected with the type message — **not** a silent bucket refusal |
| 10 | Pick a file named `report/2026 نهائي.pdf` | Uploads; `storage_path` has **four** segments, not five |
| 11 | Tap an image row | Full-screen viewer opens (BRD `:589`); close returns to the tab |
| 12 | Tap a PDF row | **Nothing happens**; the row does not look pressable |
| 13 | Tap two image rows in quick succession | The **second** image is shown, not the first |
| 14 | Wait 90s in the viewer, close, reopen | Image loads — a fresh URL is minted |
| 15 | Service-key-insert an attachment row under another branch's path, then tap it | Viewer shows "this file isn't available", **not** a spinner or a black screen |
| 16 | Deny the camera permission, tap Camera again | Documented behaviour (open question 6) — record what actually happens |
| 17 | Go offline, open the tab | `ErrorState` with retry; go offline mid-upload → error under the `Dropzone`, nothing half-written |
| 18 | Customer with no notes and no attachments | `EmptyState` for notes; **no** empty panel for attachments |
| 19 | Switch to العربية, **fully restart**, repeat 4, 6, 8, 11 | Sheet rows, sizes and the error sentence all read naturally; file names keep their extensions on the correct side |
| 20 | Android: the `Dropzone`'s dashed border | Record whether it renders dashed or solid (§15 flag 8) |
| 21 | Regression: Info and Tickets tabs | Unchanged — `DETAIL_SELECT` was not touched |
| 22 | Regression: create and edit a customer | Unchanged — `customerKeys.all` still invalidates both |
| 23 | Regression: `/tickets/new`'s `Dropzone` and `/tickets/[id]`'s paperclip | **Still disabled** |
| 24 | Tablet | `Dropzone` full width; attachment chips stay 40×40; the viewer fills the screen |

---

## Verification Steps

1. **Backend gate — prove an agent can write an `attachments` row (BRD `:256`). Run FIRST.** With an **agent** JWT, never the service key (which bypasses RLS and proves nothing), against a customer in that agent's own branch:

   ```bash
   curl -s -w '\n%{http_code}\n' -X POST \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -H "Prefer: return=representation" \
     -d '{"customer_id":"'"$MY_CUSTOMER"'","file_name":"probe.pdf","mime_type":"application/pdf","size_bytes":1024,"storage_path":"probe","uploaded_by":"'"$MY_ID"'"}' \
     "$URL/rest/v1/attachments"
   ```

   **A `201` with the row is a pass.** A `401`/`403` means the `attachments` table has **no INSERT policy for agents** — the table has no `department_id`/`branch_id` of its own (`database.ts:50-61`) and §3 (`phase1_backend_plan.md:43-46`) names only `customers` and `tickets` as scoped, so this is a live possibility, not a formality. **If it fails, stop**: the attachments half needs a backend policy and belongs with task 0, not after it. Repeat with a customer from **another branch** and confirm that one is refused. Record both bodies, then delete the probe row with the service key.

2. **Backend gate — prove the cross-branch denial (BRD `:590`). Also FIRST.** Read another branch's `storage_path` with the service key, then sign it with **your** agent JWT:

   ```bash
   curl -s -w '\n%{http_code}\n' -X POST \
     -H "apikey: $KEY" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -d '{"expiresIn":60}' \
     "$URL/storage/v1/object/sign/attachments/$OTHER_BRANCH_PATH"
   ```

   **A `4xx` with no `signedURL` is a pass.** A `200` carrying a URL is a **security failure** — stop, file it in `docs/phase1_known_issues.md`, and raise it the same day: `phase1_api_reference.md:450` warns in as many words that the table and the objects are two independent surfaces, and this is the surface nobody has tested. Then repeat the same call for a path in **your own** branch and confirm it succeeds — a policy that refuses everything is not a passing test. Also attempt an **upload** to another branch's prefix; `phase1_backend_plan.md`'s own note (`:157`) says both directions must be refused.

3. **Types:** after task 0 deploys, `npm run gen:types`, then `grep -n "customer_notes: {" src/core/types/database.ts` returns a hit, and `git diff --stat src/core/types/database.ts` shows `customer_notes` added and **nothing else changed**.

4. **Typecheck:** `npm run typecheck` — zero errors. This is what catches an `expo-file-system` import taken from the legacy surface and a `mediaTypes` still written as the deprecated enum.

5. **Lint:** `npm run lint` — zero errors. Specifically: **hard rule 2** (no hex in any new component — every colour through `theme.colors`), **hard rule 5** (`end`, not `right`, on the viewer's close button), **hard rule 4** (`pick.ts` is imported within the feature, never across a barrel), and the single-font rule (`Text` from `@/core/components`, never `react-native`).

6. **Frontend runs:** `npm start`, then `a` and `i`. Walk matrix rows 3–24. **Rows 7, 9, 16 and 20 require real hardware** — the simulator's camera, its photo library's HEIC handling, its permission model and its dashed-border rendering are all different from a device's.

7. **Path check.** After row 7, read the object key from the Supabase dashboard (Storage → attachments) and confirm it is exactly `{branch_id}/{department_id}/{customer_id}/{uuid}-{filename}` with **four** segments. `phase1_backend_plan.md:114-116` is explicit that a wrong path does not error — it silently matches no policy — so a passing upload is not by itself proof the path is right.

8. **RTL** (matrix row 19): switch to العربية and **fully restart**, not a re-render. Check that `formatFileSize`'s output reads naturally mid-sentence in `errors.tooLarge`, and that a `.pdf` extension sits at the correct end of an Arabic file name.

9. **Cycle check:** `grep -rn "@/features/tickets" src/features/customers/components/AttachmentRow.tsx src/features/customers/components/CustomerNotesTab.tsx` must return **nothing**. The customers ↔ tickets barrel cycle already exists (`AGENTS.md` hard rule 4); this story must not add an edge to it.

10. **Code review:** run the `/code-review` skill before marking the story done, per CLAUDE.md §8.

---

## Done Criteria

Mirrors `docs/phase1_brd_1.md:586-590` (US-010).

- [ ] Given a customer, when I add a note, then it **saves with my name and timestamp** — matrix rows 4 and 5
- [ ] Given I choose upload, when the sheet opens, then **camera, gallery and file options are offered** — matrix row 6
- [ ] Given a file over 10MB, when I upload, then it is **rejected with a clear message** — matrix row 8; the message names the file's size *and* the limit
- [ ] Given an uploaded image, when I tap it, then a **full-screen viewer opens** — matrix row 11
- [ ] Given an attachment from another branch, when its URL is requested directly, then **access is denied** — **satisfied by deployed policy, not by this story's code**; verification step 2 is the proof and matrix row 15 is the in-app rendering

Plus, from the intake, NFR-07 and this plan:

- [ ] **Task 0's `customer_notes` table is deployed** with both policies, and `src/core/types/database.ts` **regenerated**, not hand-edited, with its diff reviewed
- [ ] `attachments` is **not** reused to store note text
- [ ] `DETAIL_SELECT` (`api.ts:155-158`) is **unchanged** — notes and attachments are their own queries
- [ ] Storage paths are exactly `{branch}/{department}/{customer}/{uuid}-{name}`, verified against a real object (verification step 7)
- [ ] `branchId`/`departmentId` in the path come from the **signed-in agent**, never from the customer
- [ ] Upload happens **before** the row insert, with a best-effort object removal on insert failure
- [ ] The 10 MB and MIME guards run **client-side, before any byte moves**
- [ ] NFR-07 is met by `quality: 0.7` on both image pickers, and `expo-image-manipulator` is **not** installed
- [ ] Every file view goes through a **60-second signed URL**; `getPublicUrl` appears nowhere
- [ ] A signed URL is never written to the query cache
- [ ] PDFs are **not** tappable and do not look tappable
- [ ] No delete affordance exists anywhere (fact 5)
- [ ] `Dropzone` has its first live caller, and §15 flag 8 has a recorded Android result
- [ ] `pick.ts` is **not** exported from the feature barrel
- [ ] All new packages installed with `npx expo install`, and none forces a development build
- [ ] `expo-file-system`'s **new** `File` API is used; nothing imports a legacy method from the main entry point
- [ ] File names are wrapped in `isolateLtr` wherever they render
- [ ] All keys added to **both** locale files, in the same order
- [ ] `docs/phase1_api_reference.md` §8 no longer says the bucket does not exist
- [ ] `docs/phase1_remaining_stories_status.md` no longer lists US-010 as blocked
- [ ] `ReplyComposer.tsx:59` and `CreateTicketScreen.tsx:334-336` comments corrected; **both controls still disabled**
- [ ] `CLAUDE.md` records the notes tab as built **and** that it required a new table
- [ ] `npm run typecheck` and `npm run lint` both clean
- [ ] Verification steps 1, 2 and 7 run, with response bodies and the real object key recorded

---

## Open questions — raise with design/product, do not resolve silently

1. **US-010 assumes a notes table that phase 1 never designed, and this plan invents one.** BRD §5 lists eleven tables (`docs/phase1_brd_1.md:98-213`) and none of them stores free text against a customer; `database.ts` agrees. Criterion `:586` is therefore unimplementable as specified, and task 0's `customer_notes` is **this plan's proposal, not a decision anyone has signed off**. Two things need confirming before it is deployed: that a note is genuinely a *record* (no edit, no delete — the plan writes no UPDATE or DELETE policy, matching `ticket_messages` and `phase1_backend_plan.md:44`), and that notes are **not** customer-visible, ever. The second matters more than it looks: the magic-link status page (US-025/US-026) reads customer-scoped data, and a table added now with a permissive future policy is how an internal note reaches a customer. **Decide before the migration, not after.**

2. **The Notes tab has no design.** `.squad/audits/design/customers-detail-info.md:110-111` records that Figma's frame has the tab but not its content. Everything in task 5 and task 6 is composed from existing components against `CustomerTicketsTab` and `ReplyComposer` — defensible, and still the first screen in this repo built without a frame. Three choices in particular are the plan's own and should be looked at: the `Dropzone` sitting **above** both lists rather than in the composer; attachments and notes as **two sections of one list** rather than a nested tab or a segmented control; and **no empty state** for the attachments section. If design would rather this were a fourth tab, or attachments lived on the Info tab, that is a restructure, not a restyle.

3. **`quality: 0.7` is the whole of NFR-07, and nobody has measured it.** BRD `:279` says *"images compressed client-side before upload"* without naming a target. Re-encoding at 70% takes a 12MP phone photo well under 10 MB, so the ceiling is not the risk; the risk is **agents on metered connections** uploading 2–3 MB photos where 400 KB would do. Adding `expo-image-manipulator` and capping the long edge at 2048px would fix that, at the cost of a fifth dependency and a second decode. **Ask what the real constraint is** — file size, upload time, or storage cost — because the three have different answers. Related: if any real device produces an `image/heic` that survives `quality: 0.7` (matrix row 9), the manipulator stops being optional.

4. **An agent can delete the file but not the record, and this plan ships neither.** `phase1_backend_plan.md:44` says *"No delete policies for agents anywhere"* on the table; BRD `:256` grants `CRU` with no D; yet `:140-146` deploys a **delete** policy on `storage.objects`. So the two surfaces disagree, and a delete button built on the permissions as they stand would remove the object and leave a row pointing at nothing. **This is a contradiction in the deployed permissions, not a missing feature** — resolve which way it goes (agents cannot delete at all, or a soft-delete column plus a table policy) before anyone adds the button. Note there is also no `trash` glyph in `Icon.tsx:20-58`, so the omission is currently enforced by accident.

5. **Nothing cleans up orphaned objects, and this story creates the first ones.** `phase1_backend_plan.md:161` assigns cleanup to the client, which is the one place it cannot be done reliably: the app is not running when it matters. Task 2b's best-effort `remove()` covers the common case and nothing covers a process killed mid-upload, or a customer deleted while their files remain (`on delete cascade` reaches the rows, never the objects). **This needs a scheduled server-side sweep** — the same `pg_cron` that story 23's `unassigned` notification is waiting on. Ask whether that is being stood up; if it is, this is one more job on it rather than a new piece of infrastructure.

6. **A permanently denied camera permission is a dead button.** After a second denial the OS stops prompting, `requestCameraPermissionsAsync` returns `granted: false` immediately, and the sheet closes with nothing visible happening — indistinguishable from a bug. The fix is a dialog offering `Linking.openSettings()`, which is a new pattern for this app and needs copy in both languages. **This plan does not build it** (matrix row 16 records what actually happens instead). It is small, and it is the most likely support ticket this story generates.

7. **iOS permission strings are English-only in an Arabic-first app.** Task 3c writes `photosPermission` and `cameraPermission` into `app.json`, and those are exactly what iOS shows the agent. Localising them needs `InfoPlist.strings` per language, which this project has no mechanism for and which `app.json` cannot express. Every other user-facing string in the app goes through i18next; these two cannot. **This is a real defect with no owner** — task 8f files it, and it needs a decision on whether it is accepted for phase 1 or blocks it. The same question will recur for `expo-notifications` (SCRUM-40/41).

8. **Two viewer behaviours were decided by omission and should be decided on purpose.** (a) **PDFs do not open.** `:589` promises a viewer for *images*, so a PDF row is inert — but an agent who attached an invoice will tap it. `Linking.openURL(signedUrl)` hands it to the system viewer and is one line; whether a private, 60-second URL should leave the app is the actual question. (b) **The image viewer has no pinch-zoom.** `react-native-gesture-handler` is already a dependency, so the capability is present; a photograph of a serial number is the case where its absence is the difference between the attachment being useful and not.
