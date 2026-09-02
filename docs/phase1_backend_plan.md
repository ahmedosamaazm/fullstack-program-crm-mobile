# Phase 1 Backend Work Plan — AZM Support CRM

Supabase-backed. Covers everything the backend must provide for Phase 1, marking what exists and what remains.

**Legend:** ✅ done · 🔨 remaining · ⬜ deferred to a later phase

---

## Status summary

| Area | State |
|---|---|
| 1. Schema & constraints | ✅ Complete — 12 tables |
| 2. State machine | ✅ Complete |
| 3. RLS — staff access | ✅ Complete |
| 4. Indexes | ✅ Complete |
| 5. Seed data | ✅ Complete |
| 6. Auth profile provisioning | 🔨 Partially — manual only |
| 7. Storage & attachment security | ✅ Complete |
| 8. Customer-facing token API | 🔨 Not started |
| 9. Notifications | 🟡 Partial — in-app done, email outstanding |
| 10. Search | 🔨 Not started |
| 11. Migrations & environments | 🔨 Not started |
| 12. Ops — backups, monitoring | 🔨 Not started |

**Roughly 75% of Phase 1 backend work is complete.** Schema, access control, storage, in-app notifications, and customer notes are done and verified. The customer-facing token API and email delivery remain — and the **email provider decision is now the single bottleneck** blocking six items (§8, §9's email half, SCRUM-19's full flow, SCRUM-40, SCRUM-41, and US-031 push).

---

# ✅ Section 1–5: Completed

Documented in full, with all SQL, in `supabase_setup_guide.md`. Summarised here for completeness.

### 1. Schema ✅
**12 tables:** `departments`, `branches`, `profiles`, `customers`, `categories`, `tickets`, `ticket_messages`, `ticket_events`, `attachments`, `csat_responses`, `access_tokens`, `customer_notes`.
Four enums. Bilingual name columns throughout. `is_internal` deliberately has **no default**.

> **`customer_notes` was added mid-project.** US-010's first acceptance criterion — "a note saves with my name and timestamp" — assumed a table that was never modelled in the original schema. Found when the notes half of SCRUM-26 could not be built. Modelled on `ticket_messages`: no UPDATE or DELETE policy, scope inherited from the parent customer.

```sql
create table customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index idx_customer_notes_customer
  on customer_notes(customer_id, created_at desc);

alter table customer_notes enable row level security;

create policy select_notes on customer_notes for select to authenticated
  using (exists (select 1 from customers c where c.id = customer_id
                 and c.department_id = current_department()
                 and c.branch_id = current_branch()));

create policy insert_notes on customer_notes for insert to authenticated
  with check (exists (select 1 from customers c where c.id = customer_id
                      and c.department_id = current_department()
                      and c.branch_id = current_branch()));
```

**Verified:** both policies present via `pg_policies`.

### 2. State machine ✅
`enforce_ticket_transition()` trigger rejects illegal transitions at the database level and requires a resolution note when resolving. `log_ticket_assignment()` records assignment changes. Both write to `ticket_events` automatically.

**Verified:** `new → closed` raises an exception; resolving without a note raises an exception.

### 2b. Assignment scope enforcement ✅ — added mid-project

A ticket could be assigned to an agent outside its department or branch. The assign sheet filters agents by department in the UI, but nothing enforced it in the database — so a direct API call, or a bug in that filter, produced a ticket the assignee could not read and a notification pointing at it.

Found in practice: a ticket was assigned across branches during trigger testing, the notification fired correctly, and the detail screen returned `[]` for the recipient.

```sql
create or replace function enforce_assignee_scope()
returns trigger language plpgsql as $$
declare
  v_dept uuid;
  v_branch uuid;
begin
  if new.assigned_to is null then
    return new;
  end if;

  select department_id, branch_id into v_dept, v_branch
  from profiles where id = new.assigned_to;

  if v_dept is distinct from new.department_id
     or v_branch is distinct from new.branch_id then
    raise exception 'Assignee is outside this ticket''s department or branch';
  end if;

  return new;
end $$;

create trigger trg_assignee_scope
  before insert or update of assigned_to on tickets
  for each row execute function enforce_assignee_scope();
```

**Verified:** a cross-branch assignment raises `P0001: Assignee is outside this ticket's department or branch`.

### 3. RLS — staff ✅
`SECURITY DEFINER` helpers (`current_department()`, `current_branch()`, `current_role_name()`) avoid policy recursion. Every policy on `customers` and `tickets` scopes by `department_id AND branch_id`, with an admin bypass. No delete policies for agents anywhere. `ticket_events` is read-only by omission. `access_tokens` has zero client policies.

**Verified via Postman** with real JWTs: Omar sees 2 customers, Layla sees 1, neither sees the other's.

### 3b. `attachments` insert policy — tightened mid-project ✅

`insert_attachments` shipped with `with check (true)`, meaning any authenticated agent could create an attachment row pointing at **any** ticket, customer, or message — including ones outside their scope. The file itself was protected by the storage policies, but the row was not.

Found by questioning where the `attachments` scoping documented in BRD §7 actually came from. `select_attachments` was correctly scoped; the write side had no scoping at all.

Replaced with the same predicate as the select policy:

```sql
drop policy insert_attachments on attachments;

create policy insert_attachments on attachments for insert to authenticated
with check (
  (ticket_id is not null and exists (
    select 1 from tickets t where t.id = ticket_id
      and t.department_id = current_department()
      and t.branch_id = current_branch()))
  or (customer_id is not null and exists (
    select 1 from customers c where c.id = customer_id
      and c.department_id = current_department()
      and c.branch_id = current_branch()))
  or (message_id is not null and exists (
    select 1 from ticket_messages m
      join tickets t on t.id = m.ticket_id
     where m.id = message_id
       and t.department_id = current_department()
       and t.branch_id = current_branch()))
);
```

**Verified:** `pg_policies` now shows the full scoping expression in `with_check` rather than `true`.

> Worth noting how this was found: not by a test failing, but by a documentation question — "where is the scoping for this table actually defined?" The answer turned out to be "only on reads."

### 5b. Seed data caveat

The seed data now includes one deliberate correction. `TKT-202608-0001` was briefly assigned across branches during trigger testing, which produced an orphaned notification. Both were reverted, and `trg_assignee_scope` (§2b) now prevents a recurrence.

### 4. Indexes ✅
Every RLS-filtered column indexed, plus status, created_at, and lookup columns.

### 5. Seed data ✅
2 departments × 2 branches, 5 categories, 4 users, 4 customers, 4 tickets. Users arranged so isolation is testable in each dimension independently.

---

# 🔨 Section 6: Auth profile provisioning

**Blocks:** US-001 (login), and any real onboarding.

Right now creating a user in the dashboard does **not** create their `profiles` row — that was done manually in SQL. Fine for four seeded agents, not viable beyond that.

### Work needed

A trigger on `auth.users` insert that creates the matching profile, reading department, branch and role from the invite metadata:

```sql
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role, department_id, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'agent'),
    (new.raw_user_meta_data->>'department_id')::uuid,
    (new.raw_user_meta_data->>'branch_id')::uuid
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

**Open decision:** what happens when metadata is missing or the department is invalid. Options are to reject the insert, or create an inactive profile requiring admin completion. The second is friendlier but leaves orphan accounts.

**Also needed:** deactivation. `is_active = false` on a profile should prevent login. Currently nothing enforces this — the RLS policies don't check it, and Supabase auth doesn't know about the column.

---

# ✅ Section 7: Storage & attachment security — COMPLETE

**Unblocks:** SCRUM-26 (US-010 Customer notes and attachments).

### What was built

A **private** bucket created via the dashboard — Storage → New bucket:

| Setting | Value |
|---|---|
| Name | `attachments` |
| Public | **Off** |
| File size limit | 10 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |

Public was deliberately left off. A public bucket makes every file URL guessable regardless of any policy written afterward.

### Path convention

```
{branch_id}/{department_id}/{ticket_id|customer_id}/{uuid}-{filename}
```

The policies below read the first two segments via `storage.foldername(name)`, so **the client must construct paths exactly this way** or nothing will match and uploads will silently fail.

### Policies

```sql
create policy "attachments read own scope"
on storage.objects for select to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = current_branch()::text
  and (storage.foldername(name))[2] = current_department()::text
);

create policy "attachments upload own scope"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = current_branch()::text
  and (storage.foldername(name))[2] = current_department()::text
);

create policy "attachments delete own scope"
on storage.objects for delete to authenticated
using (
  bucket_id = 'attachments'
  and (storage.foldername(name))[1] = current_branch()::text
  and (storage.foldername(name))[2] = current_department()::text
);
```

These reuse the `current_branch()` and `current_department()` helpers from §3 — no new functions needed.

### Verified

```sql
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

Returns three rows: DELETE, SELECT, INSERT. Also visible under **Storage → attachments → Policies** in the dashboard.

**Tested with real JWTs via Postman:**

| Test | Result |
|---|---|
| Omar uploads to his own Cairo/Technical Support path | ✅ Succeeded — object key returned |
| Upload with `Content-Type: application/json` | ✅ Refused — `415 InvalidMimeType`, bucket MIME restriction working |
| **Omar uploads to Alexandria's path** | ✅ **Refused — `403 AccessDenied`, "new row violates row-level security policy"** |
| Omar signs a URL under Alexandria's path | ⚠️ `404 NoSuchKey` — **inconclusive** |

> **The signing test is not yet proof.** It returned 404 because nothing had ever been successfully written to Alexandria's path — the upload test correctly prevented that. So it proves Omar cannot sign a file that does not exist, not that he cannot sign one that does. To close it properly: place a file at that path using the service key or the dashboard, then have Omar attempt to sign it. Until then, read protection is supported by inference — the select policy uses the identical `foldername` predicate as the insert policy, which is proven — rather than by direct evidence.

> **Table RLS does not protect files.** An agent blocked from an `attachments` row can still fetch the object unless these policies independently enforce the same scope. Two separate security surfaces.

### Still to do on the client side

Signed URLs with short expiry for viewing, client-side image compression before upload, and cleanup of orphaned objects when a record is deleted. All client work, not backend.

---

# 🔨 Section 8: Customer-facing token API

**Blocks:** US-025 (magic-link status page), US-026 (status page data isolation), US-027 (CSAT submission).

This is the largest remaining piece and the one with the most security surface. The customer has **no account**, so none of the existing authenticated policies apply.

### What must exist

**1. Token generation** — when a ticket is created, generate a random token, store only its hash, return the raw token once for inclusion in the outbound email.

```sql
create or replace function create_ticket_access_token(p_ticket_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  raw_token text := encode(gen_random_bytes(32), 'hex');
begin
  insert into access_tokens (ticket_id, token_hash)
  values (p_ticket_id, encode(digest(raw_token, 'sha256'), 'hex'));
  return raw_token;
end $$;
```

**2. A restricted read function** — this is what enforces US-026. It must return only what a customer may see, and structurally cannot return internal data:

```sql
create or replace function get_ticket_by_token(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_ticket_id uuid;
  v_result json;
begin
  select ticket_id into v_ticket_id
  from access_tokens
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and expires_at > now();

  if v_ticket_id is null then
    raise exception 'Invalid or expired link';
  end if;

  select json_build_object(
    'reference', t.reference,
    'subject',   t.subject,
    'status',    t.status,
    'created_at', t.created_at,
    'messages', coalesce((
      select json_agg(json_build_object(
        'body', m.body, 'created_at', m.created_at,
        'from_customer', m.author_id is null
      ) order by m.created_at)
      from ticket_messages m
      where m.ticket_id = t.id and m.is_internal = false
    ), '[]'::json)
  ) into v_result
  from tickets t where t.id = v_ticket_id;

  return v_result;
end $$;
```

> **Note what is absent from the returned object:** no assignee, no agent names, no priority, no internal notes, no timestamps of internal activity, no department or branch. US-026's acceptance criteria are satisfied by the shape of this function, not by a client-side filter. A filter can be bypassed; a function that never selects the column cannot leak it.

**3. CSAT submission** — same pattern, token-gated, one submission enforced by the unique constraint already on `csat_responses.ticket_id`.

**4. Rate limiting** — an unauthenticated endpoint accepting a token is enumerable. Needs throttling, either at the edge or by tracking attempts.

**Open decision:** whether these run as Postgres functions exposed via RPC, or as Edge Functions. RPC is simpler and keeps logic in one place; Edge Functions give better control over rate limiting and CORS. Leaning RPC for Phase 1, with an Edge Function wrapper if abuse becomes a concern.

---

# 🟡 Section 9: Notifications — IN-APP COMPLETE, EMAIL OUTSTANDING

**Unblocks:** SCRUM-45 (US-028 In-app notification centre).
**Still blocks:** SCRUM-40, SCRUM-41 (email notifications).

### Table

```sql
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  ticket_id    uuid references tickets(id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_notifications_recipient
  on notifications(recipient_id, is_read, created_at desc);

alter table notifications enable row level security;

create policy select_own on notifications for select to authenticated
  using (recipient_id = auth.uid());

create policy update_own on notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
```

**No insert policy for authenticated users** — same pattern as `ticket_events`. Rows come only from the triggers below, so a client cannot fabricate a notification.

### Triggers

Three of the five planned types are live. All are `SECURITY DEFINER` so they can write to a table clients cannot insert into.

| Trigger | Fires on | Notifies |
|---|---|---|
| `trg_notify_assignment` | `tickets` UPDATE of `assigned_to` | The new assignee |
| `trg_notify_reply` | `ticket_messages` INSERT | The assignee, when `author_id is null` (customer) and the message is public |
| `trg_notify_status` | `tickets` UPDATE of `status` | The assignee, excluding self-triggered changes |

```sql
create or replace function notify_on_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_to is distinct from old.assigned_to
     and new.assigned_to is not null then
    insert into notifications (recipient_id, ticket_id, type, title, body)
    values (new.assigned_to, new.id, 'assigned',
            'Ticket assigned to you',
            new.reference || ' · ' || new.subject);
  end if;
  return new;
end $$;

create trigger trg_notify_assignment
  after update of assigned_to on tickets
  for each row execute function notify_on_assignment();
```

`notify_on_customer_reply()` and `notify_on_status_change()` follow the same shape — see the migration for full text.

**Design choices worth knowing:**
- **Assignee-only scope.** Nobody is notified about tickets they don't own. Simplest correct behaviour for Phase 1.
- **`author_id is null` identifies a customer message.** Agents have a profile ID; customers don't.
- **Status changes exclude self** via `assigned_to is distinct from auth.uid()`. Note this check always passes in the SQL Editor, where `auth.uid()` is null — test it through a real session.

### Verified

Reassigning `TKT-202608-0001` to Layla produced:

```
type      | title                  | body
assigned  | Ticket assigned to you | TKT-202608-0001 · Payment gateway timeout at checkout
```

**Tested with real JWTs via Postman:**

| Test | Result |
|---|---|
| Layla lists her notifications | ✅ One row, correct `recipient_id` |
| Omar lists notifications (no filter in query) | ✅ `[]` — RLS scopes it regardless |
| Unread count | ✅ `[{ "count": 1 }]` — returned in the body, not only the header |
| Layla marks one read | ✅ `is_read: true`, count drops to `0` |
| **Any agent attempts INSERT** | ✅ **Refused — `403`, code `42501`, "new row violates row-level security policy"** |

Both halves of the read test matter. Omar returning `[]` alone doesn't distinguish a working policy from one that blocks everything; Layla returning her own row is what proves it isn't over-blocking.

The insert refusal is a particularly clean result — `42501` is Postgres explicitly denying the write, not a silent no-op returning zero rows. That's the unambiguous version of a distinction that matters elsewhere in this schema: `ticket_events`' PATCH refusal returns an empty array rather than a 403, which is correct but weaker evidence.

### The two remaining types

| Type | Needs |
|---|---|
| `unassigned` — idle over an hour | `pg_cron` scheduled job |
| `rating` — CSAT submitted | The CSAT flow from §8 |

SCRUM-45 should handle five types in its rendering but will only see three in testing until these land.

### Email — still outstanding

Blocks SCRUM-40 and SCRUM-41. Requires:
- A provider decision — Resend, SendGrid, or Postmark. **Still open.**
- An Edge Function that sends, called by a trigger or a queue
- Bilingual templates with correct **RTL rendering in email HTML**, which is materially harder than in-app RTL and is a known trap
- Retry with backoff, up to 3 attempts per US-023
- A delivery log so failures are visible rather than silent

**Open decision:** trigger-driven sending versus a queue table polled by a scheduled function. Triggers are simpler but put a network call inside a transaction, which is generally a bad idea. A queue table is more work and more correct.

---

# 🔨 Section 10: Search

**Blocks:** US-005 (customer search), US-016 (ticket search).

Currently only `ILIKE` prefix matching is possible, which is slow and doesn't handle Arabic well.

### Work needed

```sql
alter table customers add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(email,''))
  ) stored;

create index idx_customers_search on customers using gin(search_vector);
```

Same for tickets across subject, reference, and description.

**Arabic caveat:** Postgres has no Arabic text-search configuration by default. `'simple'` does no stemming, which works acceptably for names and exact terms but not for morphological matching. Adequate for Phase 1; revisit if search quality complaints appear.

---

# 🔨 Section 11: Migrations & environments

**Currently:** all schema changes were applied via the SQL Editor. Nothing is version-controlled. `azm-crm` is the only environment and it is marked PRODUCTION.

This is the most urgent non-feature item on the list.

### Work needed

- Initialise the Supabase CLI and capture the current schema as an initial migration:
  ```bash
  supabase init
  supabase link --project-ref svcxmjibmgjtaxuzrquf
  supabase db pull
  ```
- Commit `supabase/migrations/` to the repo
- Create a **separate staging project** — developing against production is workable for a solo start but becomes untenable the moment a second person or real pilot data is involved
- Add a seed script so any environment can be rebuilt from scratch
- Optionally connect GitHub so migrations deploy on push

---

# 🔨 Section 12: Operations

Not urgent for development, required before a pilot with real customer data.

- **Backups** — free tier has none. Any real pilot needs the paid tier's daily backups, or a scheduled `pg_dump`
- **Point-in-time recovery** — paid tier only
- **Monitoring** — slow query log, error alerting
- **The free tier pauses after 7 days of inactivity**, which is harmless now but must be resolved before agents depend on it
- **Data retention policy** — how long tickets, attachments, and access tokens are kept
- **Expired token cleanup** — a `pg_cron` job deleting `access_tokens` past `expires_at`

---

# ⬜ Explicitly deferred

Not Phase 1 work. Listed so nobody builds them early.

| Item | Phase |
|---|---|
| SLA target tables, breach detection, `pg_cron` escalation | 2 |
| Auto-assignment logic | 2 |
| Reporting views and aggregations | 2 |
| Audit log tables beyond `ticket_events` | 2 |
| Knowledge base tables and full-text search | 2 |
| Inbound email, WhatsApp, SMS webhooks | 3 |
| The Node/Nest ingestion service | 3 |
| Customer accounts and portal auth | 3 |
| AI features and any LLM provider integration | 4 |
| Agent push notifications (US-031) — *if deferred, see open decision 5* | 2? |

---

# Recommended order

Each item unblocks app work that would otherwise stall.

| # | Work | Why now |
|---|---|---|
| 1 | **Migrations (§11)** | Every later change should be version-controlled. Doing this after ten more schema edits means reconstructing them by hand |
| 2 | **Auth provisioning (§6)** | Login can't be built properly without it |
| ~~3~~ | ~~Storage (§7)~~ | ✅ **Done** — bucket, 3 policies, verified |
| ~~4~~ | ~~Notifications table (§9, in-app)~~ | ✅ **Done** — table, RLS, 3 triggers, verified |
| ~~3~~ | ~~`customer_notes` table~~ | ✅ **Done** — table, 2 policies, verified |
| 3 | **Choose an email provider** | Not code. A decision, and it blocks everything below |
| 4 | **Search (§10)** | Small, unblocks two stories |
| 5 | **Token API (§8)** | Largest remaining piece, most security surface. Unblocks 5 stories |
| 6 | **Email delivery (§9)** | Needs the provider decision and RTL template work |
| 7 | **Ops (§12)** | Before pilot, not before development |

### The email provider decision is now the bottleneck

It blocks more than its own section suggests:

| Blocked | Why |
|---|---|
| §8 Token API | The magic link has to be delivered somehow |
| §9 email half | Directly |
| SCRUM-19 Password reset | The full flow needs a real recovery email, and `@azm.test` addresses can't receive one |
| SCRUM-40, SCRUM-41 | Directly |
| US-031 Agent push | Not email, but the same "how does a notification leave the system" question |

Everything else remaining in Phase 1 is either a verification pass or a small client fix. This one decision gates six items.

**Item 1 (migrations) is still the one to do today** — and it now matters more, since §7 and §9 added schema through the SQL Editor that isn't version-controlled either. `supabase db pull` captures all of it at once.

---

# Open decisions

Four things that need a call before the work above can be finished:

1. **Email provider** — Resend, SendGrid, or Postmark. **The critical path.** Affects §8, §9, and four stories. Note that Supabase's built-in SMTP for auth emails is heavily rate-limited and uses generic Supabase branding, so it isn't viable beyond development.
2. **RPC vs Edge Functions** for the customer token API — affects §8's structure and rate-limiting approach.
3. **Trigger vs queue** for notification delivery — correctness versus simplicity.
4. **Staging environment** — whether to run one now or accept production-only until the pilot.
5. **Is agent push (US-031) Phase 1 or Phase 2?** It arrived as a criterion on SCRUM-45 that this codebase can't meet — no `expo-notifications`, no device-token table, no sender. Moved to its own story. Deferring to Phase 2 is defensible: a 3–5 agent pilot will have the app open during working hours, and building a second delivery transport before the first is decided is poor sequencing.
6. **The signed-URL denial gate (§7)** — place a file in Alexandria's path and retest, or accept inference from the proven insert policy.
