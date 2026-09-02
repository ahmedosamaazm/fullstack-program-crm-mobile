# Supabase Setup Guide — AZM Support CRM, Phase 1

A record of what was actually done, in order, with the reasoning behind each step. Written to double as a learning reference and as onboarding for anyone new to the project.

Maps to Jira **SCRUM-15 (TF-04 Tenancy scoping)** and **SCRUM-20 (US-004 Department and branch access isolation)**.

---

## 1. Why Supabase, and why the schema comes first

A ticketing system is relational at its core — customers have tickets, tickets have messages and status transitions, agents have assignments, and reports aggregate across all of it. That's a strong fit for Postgres, which is what Supabase gives you underneath auth, storage, and an auto-generated API.

The schema has to come before anything else because every screen in the app queries it. Get the tables, constraints, and security rules wrong here and you're rewriting the data layer after screens already depend on it — which is far more expensive than getting it right once, up front.

**The four ideas this guide keeps coming back to:**
1. **Enforce rules in the database, not the app.** A trigger can't be bypassed by a client bug. A UI check can.
2. **RLS is the only real security boundary.** Anything checked only in the app is not actually secured.
3. **Test with a real user session, not the SQL Editor.** The editor runs as service role and bypasses every policy you write — it will tell you your policies work even when they don't.
4. **A policy on reads is not a policy on writes.** Two gaps in this schema — the permissive `attachments` insert, and unenforced assignment scope — were both cases where the read side was correct and the write side had nothing at all. Check both directions.

---

## 2. Project creation

Created via **New organization → New project**.

**Settings used:**

| Setting | Value | Why |
|---|---|---|
| Project name | `azm-crm` | Avoid a default name baked into URLs and CLI commands later |
| Region | West EU (Ireland) | Closest available region to the target market at setup time |
| Enable automatic RLS | **On** | Every new table gets RLS enabled the moment it's created — the single most important toggle, since a table without RLS is world-readable through the auto-generated API |
| Automatically expose new tables | **Off** | Tables are opted into the public API deliberately, not by default. Safer to add exposure than to remember to remove it |
| Database password | (saved to password manager immediately) | Supabase will not show it again |

**Where things live:**
- **Project URL** and **anon public key** — `Project Settings → API Keys`. Both go in the client app.
- **service_role key** — same location. **Never used in the client.** It bypasses RLS entirely.

---

## 3. Schema — tables, enums, constraints

Run in **SQL Editor → New query**.

### Enums

```sql
create type ticket_status   as enum ('new','open','pending','resolved','closed');
create type ticket_priority as enum ('low','medium','high','urgent');
create type user_role       as enum ('agent','manager','admin');
create type event_type      as enum ('created','status_changed','assigned','priority_changed');
```

Enums instead of free-text columns mean an invalid status like `"In Progress"` can't be inserted at all — it's rejected by the type system before it ever reaches a query.

### Org structure

```sql
create table departments (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table branches (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null,
  name_ar     text not null,
  address     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
```

Bilingual name columns from the start (`name_en` / `name_ar`) rather than a single `name` field, because retrofitting localisation onto a schema built English-only means an awkward migration later — cheap now, expensive after.

### Staff profiles

```sql
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  phone         text,
  role          user_role not null default 'agent',
  department_id uuid not null references departments(id),
  branch_id     uuid not null references branches(id),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
```

`id` references `auth.users(id)` directly rather than having its own separate primary key — this is the standard Supabase pattern for extending the built-in auth user with app-specific fields like role, department, and branch.

### Customers

```sql
create table customers (
  id                 uuid primary key default gen_random_uuid(),
  full_name          text not null check (char_length(full_name) between 2 and 120),
  phone              text not null,
  email              text,
  secondary_contacts jsonb not null default '[]'::jsonb,
  department_id      uuid not null references departments(id),
  branch_id          uuid not null references branches(id),
  created_by         uuid references profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (branch_id, phone)
);
```

The `unique (branch_id, phone)` constraint is deliberately scoped to branch, not global — the same phone number can exist as different customers in different branches, but not twice within one branch.

### Categories

```sql
create table categories (
  id            uuid primary key default gen_random_uuid(),
  name_en       text not null,
  name_ar       text not null,
  department_id uuid references categories(id),  -- nullable = global category
  sort_order    int not null default 0,
  is_active     boolean not null default true
);
```

### Tickets, with auto-generated references

```sql
create sequence ticket_seq;

create or replace function generate_ticket_reference()
returns text language sql as $$
  select 'TKT-' || to_char(now(),'YYYYMM') || '-'
       || lpad(nextval('ticket_seq')::text, 4, '0');
$$;

create table tickets (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique default generate_ticket_reference(),
  subject         text not null check (char_length(subject) between 3 and 200),
  description     text,
  customer_id     uuid not null references customers(id),
  category_id     uuid not null references categories(id),
  priority        ticket_priority not null default 'medium',
  status          ticket_status not null default 'new',
  assigned_to     uuid references profiles(id),
  department_id   uuid not null references departments(id),
  branch_id       uuid not null references branches(id),
  created_by      uuid not null references profiles(id),
  resolution_note text,
  resolved_at     timestamptz,
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
```

The reference format `TKT-YYYYMM-NNNN` is generated server-side by default, so the app never constructs it — one source of truth, and it sorts chronologically as a plain string.

### Messages — the internal/public boundary

```sql
create table ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  author_id   uuid references profiles(id),          -- null = customer
  body        text not null check (char_length(body) between 1 and 5000),
  is_internal boolean not null,
  created_at  timestamptz not null default now()
);
```

**`is_internal` has no default.** This is the single most important design decision in the schema. An insert that omits it fails outright, rather than silently defaulting to `false` and exposing an internal note to a customer. The cost of a mistake here — a leaked internal note — is high enough that "fail loudly" beats "assume the safe value."

### Events — immutable history

```sql
create table ticket_events (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets(id) on delete cascade,
  actor_id   uuid references profiles(id),
  event_type event_type not null,
  from_value text,
  to_value   text,
  created_at timestamptz not null default now()
);
```

No RLS policy grants insert, update, or delete on this table to authenticated users — see §5. Rows only ever appear via the triggers in §4.

### Attachments — exactly one parent

```sql
create table attachments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid references tickets(id) on delete cascade,
  customer_id  uuid references customers(id) on delete cascade,
  message_id   uuid references ticket_messages(id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  mime_type    text not null,
  size_bytes   int not null check (size_bytes <= 10485760),
  uploaded_by  uuid references profiles(id),
  created_at   timestamptz not null default now(),
  check (num_nonnulls(ticket_id, customer_id, message_id) = 1)
);
```

`num_nonnulls(...) = 1` enforces that an attachment belongs to exactly one of a ticket, a customer, or a message — never zero, never more than one. The 10 MB cap (`10485760` bytes) is enforced here at the database level, not just in the upload UI.

### CSAT and access tokens

```sql
create table csat_responses (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null unique references tickets(id) on delete cascade,
  rating       int not null check (rating between 1 and 5),
  comment      text check (char_length(comment) <= 500),
  submitted_at timestamptz not null default now()
);

create table access_tokens (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);
```

`ticket_id unique` on `csat_responses` enforces one rating per ticket at the database level — a second submission attempt fails on the constraint rather than needing an application-level check. `token_hash` stores a hash, never the raw magic-link token.

---

## 4. The state machine — enforced as a trigger

This is the part that turns the state diagram in the BRD into something the database actively defends, rather than something the app is merely supposed to respect.

```sql
create or replace function enforce_ticket_transition()
returns trigger language plpgsql as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
       (old.status = 'new'      and new.status = 'open')
    or (old.status = 'open'     and new.status in ('pending','resolved'))
    or (old.status = 'pending'  and new.status in ('open','resolved'))
    or (old.status = 'resolved' and new.status in ('closed','open'))
  ) then
    raise exception 'Illegal transition: % → %', old.status, new.status;
  end if;

  if new.status = 'resolved' and coalesce(new.resolution_note,'') = '' then
    raise exception 'A resolution note is required when resolving a ticket';
  end if;

  if new.status = 'resolved' then new.resolved_at := now(); end if;
  if new.status = 'closed'   then new.closed_at   := now(); end if;
  new.updated_at := now();

  insert into ticket_events (ticket_id, actor_id, event_type, from_value, to_value)
  values (new.id, auth.uid(), 'status_changed', old.status::text, new.status::text);

  return new;
end $$;

create trigger trg_ticket_transition
  before update of status on tickets
  for each row execute function enforce_ticket_transition();
```

```sql
create or replace function log_ticket_assignment()
returns trigger language plpgsql as $$
begin
  if new.assigned_to is distinct from old.assigned_to then
    insert into ticket_events (ticket_id, actor_id, event_type, from_value, to_value)
    values (new.id, auth.uid(), 'assigned', old.assigned_to::text, new.assigned_to::text);
  end if;
  return new;
end $$;

create trigger trg_ticket_assignment
  before update of assigned_to on tickets
  for each row execute function log_ticket_assignment();
```

**What this buys you:** the Change Status sheet in the app can have a bug, offer an illegal option, or be bypassed entirely by a direct API call — and the ticket still can't move from `closed` back to `open`, or into `resolved` without a note. The guarantee lives in the database, not in UI discipline.

### Verifying it

```sql
-- Should fail
update tickets set status = 'closed' where status = 'new';
-- ERROR: Illegal transition: new → closed

-- Should fail
update tickets set status = 'resolved' where status = 'open';
-- ERROR: A resolution note is required when resolving a ticket

-- Should succeed
update tickets set status = 'resolved', resolution_note = 'Reissued the invoice'
where status = 'open';
```

Then confirm the event was logged **without any application code writing it**:

```sql
select t.reference, e.event_type, e.from_value, e.to_value, e.created_at
from ticket_events e
join tickets t on t.id = e.ticket_id
order by e.created_at desc;
```

---

## 5. Row Level Security

### Why `SECURITY DEFINER` helper functions

A naive RLS policy on `profiles` that queries `profiles` to check the current user's department recurses infinitely — the policy triggers itself. The fix is small helper functions that run with elevated privilege to look up the current user's scope, bypassing RLS for that one lookup only:

```sql
create or replace function current_department()
returns uuid language sql stable security definer set search_path = public as $$
  select department_id from profiles where id = auth.uid();
$$;

create or replace function current_branch()
returns uuid language sql stable security definer set search_path = public as $$
  select branch_id from profiles where id = auth.uid();
$$;

create or replace function current_role_name()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;
```

### Enabling RLS

```sql
alter table departments     enable row level security;
alter table branches        enable row level security;
alter table profiles        enable row level security;
alter table customers       enable row level security;
alter table categories      enable row level security;
alter table tickets         enable row level security;
alter table ticket_messages enable row level security;
alter table ticket_events   enable row level security;
alter table attachments     enable row level security;
alter table csat_responses  enable row level security;
alter table access_tokens   enable row level security;
```

Because **automatic RLS** was turned on at project creation, this step was actually redundant for any table created afterward — but it's included explicitly so the schema file is self-contained and doesn't depend on a dashboard setting someone might not have replicated.

### The core scoping pattern

Every policy on `customers` and `tickets` follows the same shape — the row's `department_id` and `branch_id` must match the current user's:

```sql
create policy select_customers on customers for select to authenticated
  using (department_id = current_department() and branch_id = current_branch()
         or current_role_name() = 'admin');

create policy insert_customers on customers for insert to authenticated
  with check (department_id = current_department() and branch_id = current_branch());

create policy update_customers on customers for update to authenticated
  using (department_id = current_department() and branch_id = current_branch())
  with check (department_id = current_department() and branch_id = current_branch());
```

Admins bypass the scope check with `or current_role_name() = 'admin'`. There is deliberately **no delete policy** for agents on customers or tickets — nothing is destroyed, only deactivated, per the BRD.

### `ticket_events` — read-only by omission

```sql
create policy select_events on ticket_events for select to authenticated
  using (exists (select 1 from tickets t where t.id = ticket_id
                 and t.department_id = current_department()
                 and t.branch_id = current_branch()));
```

No insert, update, or delete policy exists for this table for the `authenticated` role. That's not an oversight — it's the mechanism. Since the triggers in §4 run as the database itself, they can write to `ticket_events` regardless of the RLS policies that block ordinary users. The audit trail is tamper-proof by construction, not by convention.

### `access_tokens` — no policies at all

This table has RLS enabled and zero policies of any kind, which means it's completely unreachable from the client via the anon or authenticated roles. Only the service-role key — used server-side, never in the app — can read or write it. This is what protects the customer magic-link mechanism from being enumerated or forged from the client.

---

## 6. Indexes

Every column an RLS policy filters on needs an index, or every query becomes a sequential scan once the tables have real volume:

```sql
create index idx_profiles_dept        on profiles(department_id);
create index idx_profiles_branch      on profiles(branch_id);
create index idx_customers_scope      on customers(department_id, branch_id);
create index idx_tickets_scope        on tickets(department_id, branch_id);
create index idx_tickets_assigned     on tickets(assigned_to);
create index idx_tickets_status       on tickets(status);
create index idx_messages_ticket      on ticket_messages(ticket_id);
create index idx_events_ticket        on ticket_events(ticket_id);
create index idx_attachments_ticket   on attachments(ticket_id);
```

This is easy to forget because the app works fine without it at 20 seed rows — the cost only shows up once a table has thousands of rows, which is exactly when it's expensive to fix.

---

## 7. Seed data

Two departments, two branches — deliberately overlapping on only one dimension each, so isolation can be tested in both directions independently.

```sql
insert into departments (id, name_en, name_ar) values
  ('11111111-1111-1111-1111-111111111111','Technical Support','الدعم الفني'),
  ('22222222-2222-2222-2222-222222222222','Billing','الحسابات');

insert into branches (id, name_en, name_ar, address) values
  ('33333333-3333-3333-3333-333333333333','Cairo','القاهرة','Nasr City, Cairo'),
  ('44444444-4444-4444-4444-444444444444','Alexandria','الإسكندرية','Smouha, Alexandria');

insert into categories (name_en, name_ar, sort_order) values
  ('Technical Issue','مشكلة فنية',1),
  ('Billing Enquiry','استفسار عن الفاتورة',2),
  ('Account Access','الوصول للحساب',3),
  ('Feature Request','طلب ميزة',4),
  ('Other','أخرى',5);
```

### Users — created via dashboard, not SQL

`profiles` rows require a matching `auth.users` row, which can't be created by plain SQL insert. Four users were created via **Authentication → Users → Add user**, then linked with:

```sql
insert into profiles (id, full_name, email, role, department_id, branch_id) values
  ('cf4e08f4-f352-4bfb-81ac-c15850e1696d','Omar Mansour','omar@azm.test','agent',
   '11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333'),
  ('aad7ba9f-541f-47ff-a6a5-342cff794d4a','Layla Hassan','layla@azm.test','agent',
   '11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444'),
  ('27a730ff-c9a6-4295-a569-6927cff61b6f','Amara Osei','amara@azm.test','agent',
   '22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'),
  ('44abe9e1-a4ec-41c0-8326-65dcaf4af04b','Admin User','admin@azm.test','admin',
   '11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333');
```

**Why this arrangement:** Omar and Layla share a department but differ by branch — proves branch isolation. Omar and Amara share a branch but differ by department — proves department isolation. Testing with users that differ on every dimension at once wouldn't tell you which dimension is actually being enforced.

### Sample customers and tickets

```sql
insert into customers (full_name, phone, email, department_id, branch_id, created_by) values
  ('Ahmed Mahmoud','+201001234567','ahmed@example.com',
   '11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333',
   'cf4e08f4-f352-4bfb-81ac-c15850e1696d'),
  ('ليلى أحمد','+201009876543','layla.a@example.com',
   '11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333',
   'cf4e08f4-f352-4bfb-81ac-c15850e1696d'),
  ('Karim Mostafa','+201112223333','karim@example.com',
   '11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444',
   'aad7ba9f-541f-47ff-a6a5-342cff794d4a'),
  ('Nour El-Din','+201554443333','nour@example.com',
   '22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333',
   '27a730ff-c9a6-4295-a569-6927cff61b6f');
```

Ticket seeding followed the same pattern, one per customer, inheriting `department_id` and `branch_id` from the customer record.

---

## 8. Verification queries — the full set

Every query used to check work across this project, grouped by what it answers. Worth keeping: these are what you run after any schema change, not just the first time.

### Does the structure exist?

```sql
-- All 12 tables
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;

-- Columns on a specific table
select column_name, data_type from information_schema.columns
where table_name = 'notifications' order by ordinal_position;

-- RLS is enabled everywhere
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;
```

### Which policies exist, and what do they actually say?

```sql
-- Policies on one table
select policyname, cmd from pg_policies where tablename = 'customer_notes';

-- The full predicates — this is the one that matters.
-- `qual` is the USING clause (reads); `with_check` is the WITH CHECK clause (writes).
-- A table can have a correctly scoped `qual` and a `with_check` of `true`.
select policyname, cmd, qual, with_check
from pg_policies where tablename = 'attachments';

-- Storage policies live in a different schema
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects';
```

> The second query is how the permissive `attachments` insert policy was found. `select policyname, cmd` alone would have shown an INSERT policy existed and looked reassuring. Reading `with_check` showed it was `true`.

### Which triggers are live?

```sql
-- Custom triggers only. Without `not tgisinternal` you get every
-- foreign-key constraint trigger Postgres generates, which is noise.
select tgname from pg_trigger
where tgrelid = 'tickets'::regclass and not tgisinternal;

-- Across several tables at once
select tgname from pg_trigger
where tgrelid in ('tickets'::regclass, 'ticket_messages'::regclass)
  and not tgisinternal
order by tgname;
```

Expect five on `tickets`: `trg_ticket_transition`, `trg_ticket_assignment`, `trg_assignee_scope`, `trg_notify_assignment`, `trg_notify_status`.

### Is the seed data correct?

```sql
-- Profiles with their scope resolved
select p.full_name, p.role, d.name_en as dept, b.name_en as branch
from profiles p
join departments d on d.id = p.department_id
join branches b on b.id = p.branch_id
order by p.full_name;

-- Reference data
select name_en from departments;
select name_en from branches;
select name_en from categories order by sort_order;

-- Tickets with their scope and assignee
select reference, subject, status, branch_id, assigned_to
from tickets order by created_at;
```

### Do the triggers actually fire?

```sql
-- State machine: all three must behave as commented
update tickets set status = 'closed' where status = 'new';
-- ERROR: Illegal transition: new → closed

update tickets set status = 'resolved' where status = 'open';
-- ERROR: A resolution note is required when resolving a ticket

update tickets set status = 'resolved', resolution_note = 'Reissued the invoice'
where status = 'open';
-- succeeds

-- Assignment scope: cross-branch must be refused
update tickets set assigned_to = '<an agent in another branch>'
where id = '<a ticket>';
-- ERROR: P0001: Assignee is outside this ticket's department or branch

-- History written by triggers, not the app
select t.reference, e.event_type, e.from_value, e.to_value, e.created_at
from ticket_events e
join tickets t on t.id = e.ticket_id
order by e.created_at desc;

-- Notifications written by triggers
select type, title, body, recipient_id, is_read, created_at
from notifications order by created_at desc limit 5;
```

> **Testing a notification trigger needs a real change.** Assigning a ticket to the agent it's already assigned to does nothing — `is distinct from` is false and the trigger correctly skips. Unassign first, then reassign.

### A note on what these queries can't tell you

Everything above runs in the SQL Editor, as `service_role`. That bypasses every policy. These queries prove **structure** — tables exist, policies are attached, triggers fire, predicates read correctly. They prove nothing about **enforcement**.

For that, see §9.

---

## 9. Testing RLS for real — the SQL Editor lies

**The single most important thing in this whole guide:** the SQL Editor runs as the `service_role`, which bypasses RLS by design. Every query above that "worked" in the editor proves the *table* exists and the *trigger* logic is correct — it proves nothing about whether an ordinary agent is actually restricted to their own department and branch.

To test that, you need a real user session — an actual JWT issued to a specific `auth.users` row, not the service role.

### Method used: Postman, two chained requests

**Request 1 — Sign In**

```
POST {{base_url}}/auth/v1/token?grant_type=password
```
Headers: `apikey: {{anon_key}}`, `Content-Type: application/json`
Body: `{"email": "omar@azm.test", "password": "..."}`

A test script on this request captures the token automatically for reuse:
```js
const json = pm.response.json();
pm.collectionVariables.set("access_token", json.access_token);
```

**Request 2 — Get Customers**

```
GET {{base_url}}/rest/v1/customers?select=full_name,branch_id,department_id
```
Headers: `apikey: {{anon_key}}`, `Authorization: Bearer {{access_token}}`

**Expected result as Omar:** exactly 2 rows (Ahmed, ليلى) — both Technical Support / Cairo.
**Expected result as Layla** (same requests, different sign-in credentials): exactly 1 row (Karim) — Technical Support / Alexandria.

If either agent sees rows outside their own department and branch, the RLS policy is wrong and must be fixed before any app screen is built against it — a UI can hide a bug like this, but it can never fix it.

### Every enforcement test run, and its result

This pattern was reused for every table and policy added afterward. All of these ran against the live project with real agent JWTs.

| # | Test | Result |
|---|---|---|
| 1 | Omar lists customers | ✅ 2 rows — his scope only |
| 2 | Layla lists customers | ✅ 1 row — hers only |
| 3 | Omar queries with another department's ID in the filter | ✅ `[]` — you cannot filter your way out of a policy |
| 4 | Any agent reads `access_tokens` | ✅ `[]` — zero policies exist on that table |
| 5 | Agent PATCHes `ticket_events` | ✅ `[]` — no UPDATE policy, so the row is invisible to the write |
| 6 | Agent DELETEs `ticket_events` | ⬜ **Never run** — still open |
| 7 | Layla lists her notifications | ✅ 1 row, correct `recipient_id` |
| 8 | Omar lists notifications with no filter | ✅ `[]` — RLS scopes it regardless |
| 9 | Unread count | ✅ `[{ "count": 1 }]` — returned in the body |
| 10 | Layla marks one read | ✅ `is_read: true`, count drops to 0 |
| 11 | **Agent INSERTs a notification** | ✅ **`403`, code `42501`** — explicit denial |
| 12 | Omar uploads to his own storage path | ✅ Object key returned |
| 13 | Upload with wrong Content-Type | ✅ `415 InvalidMimeType` |
| 14 | **Omar uploads to Alexandria's storage path** | ✅ **`403 AccessDenied`**, RLS violation |
| 15 | Omar signs a URL under Alexandria's path | ⚠️ `404 NoSuchKey` — **inconclusive** |

### Two results worth reading carefully

**Test 5 and test 11 look similar and aren't.** The `ticket_events` PATCH returns an empty array — the write matched nothing because no UPDATE policy makes the row visible to it. The notifications INSERT returns `403` with Postgres error code `42501` — an explicit refusal. Both are correct outcomes, but the second is stronger evidence. An empty array can mean "rejected" or "no row matched," and those are different claims. When a test returns `200` with `[]`, check whether the row you targeted actually exists before recording it as proof.

**Test 15 is not a pass.** It returned 404 because test 14 had already prevented anything from existing at that path. It proves Omar cannot sign a file that isn't there — not that he cannot sign one that is. To close it: place a file at that path with the service key or the dashboard, then retest as Omar. Until then, read protection on storage rests on inference from test 14, since the select and insert policies use an identical predicate.

> Both observations are the same lesson in different clothes: **an absence of data can look exactly like a working policy.** Check what the test would return if the policy were removed entirely. If that answer is also empty, the test proves nothing.

---

## 10. Storage — bucket and object-level policies

Added after the initial schema, to unblock attachments (SCRUM-26).

### The bucket — created in the dashboard

**Storage → New bucket:**

| Setting | Value |
|---|---|
| Name | `attachments` |
| Public | **Off** |
| File size limit | 10 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |

Public was deliberately left off. A public bucket makes every object URL guessable regardless of any policy written afterward — the policies below would be decoration.

### Path convention

```
{branch_id}/{department_id}/{ticket_id|customer_id}/{uuid}-{filename}
```

This is not cosmetic. The policies read the first two segments and compare them to the agent's own scope, so **the client must construct paths exactly this way**. Any other structure fails silently — the upload is refused with a 403 that looks like a permissions bug rather than a path bug.

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

These reuse the `SECURITY DEFINER` helpers from §5 — no new functions needed.

### Verified with real sessions

| Test | Result |
|---|---|
| Omar uploads to his own path | ✅ Object key returned |
| Upload with the wrong Content-Type | ✅ `415 InvalidMimeType` — the bucket's MIME restriction |
| **Omar uploads to Alexandria's path** | ✅ **`403 AccessDenied`, RLS violation** |
| Omar signs a URL under Alexandria's path | ⚠️ `404 NoSuchKey` — inconclusive |

> **The signing result is not proof.** It returned 404 because the upload test had already prevented anything from existing at that path. It shows Omar can't sign a file that isn't there, not that he can't sign one that is. To close it: place a file there with the service key, then retest as Omar.

> **Table RLS does not protect files.** An agent blocked from an `attachments` row can still fetch the object unless these object-level policies independently enforce the same scope. Two separate surfaces, and it is easy to build the first and assume the second.

---

## 11. Two gaps found after the schema shipped

Both were write-side omissions on tables whose reads were correctly scoped. Worth reading as a pair — the same mistake, twice, in different places.

### 11.1 `attachments` could be written across scopes

`insert_attachments` shipped as:

```sql
with check (true)
```

Meaning any authenticated agent could create an attachment row pointing at any ticket, customer, or message — including another branch's. The **file** was protected by §10's object policies; the **row** was not, so an agent could attach records to another branch's tickets.

This wasn't found by a failing test. It was found by asking where the `attachments` scoping described in BRD §7 actually came from — and discovering `select_attachments` had it while the insert policy had nothing.

The fix mirrors the select predicate:

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

### 11.2 A ticket could be assigned to an agent who couldn't read it

RLS scopes tickets by `department_id AND branch_id`. Assignment sets `assigned_to`. Nothing connected the two — so a ticket could be assigned to an agent outside its scope, producing a ticket they could not open and a notification pointing at it.

Found in practice, not by review: a ticket was assigned across branches while testing the notification triggers. The trigger fired correctly, the notification appeared in the recipient's list, and tapping it returned `[]` from the ticket query.

A `check` constraint can't express this — Postgres rejects subqueries in check constraints — so it needs a trigger:

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

**Verified:** the cross-branch case now raises `P0001: Assignee is outside this ticket's department or branch`.

> **The pattern worth taking from both:** a correctly scoped `select` policy creates a false sense of completeness. Reads were right in both cases; writes had no scoping at all. When auditing RLS, check `with_check` separately from `using` — `pg_policies` shows them as distinct columns for a reason.

---

## 12. `notifications` and `customer_notes` — the two tables added later

### `notifications`

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

**No insert policy** — the same technique as `ticket_events` in §5. Rows come only from triggers, which run as `SECURITY DEFINER` and so bypass the policies that block clients. A client cannot fabricate a notification.

Three triggers populate it: `trg_notify_assignment`, `trg_notify_reply` (fires when `author_id is null`, which identifies a customer message), and `trg_notify_status` (excludes self-triggered changes via `auth.uid()`).

**Note on testing the third:** `auth.uid()` is null in the SQL Editor, so the self-exclusion check always passes there. It only behaves correctly through a real session.

**Verified:** insert refused with `403 / 42501` — an explicit denial, not a silent zero-row result. Read isolation confirmed in both directions.

### `customer_notes`

This table did not exist in the original schema, and its absence wasn't noticed until the notes half of SCRUM-26 couldn't be built. US-010's first acceptance criterion — "a note saves with my name and timestamp" — had nowhere to write.

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

Modelled on `ticket_messages`: scope inherited from the parent, no UPDATE or DELETE policy, so a note is immutable once written.

> The lesson isn't about this table specifically. It's that acceptance criteria can quietly assume schema that was never modelled, and nobody notices until the story reaches implementation. Worth reading criteria against the schema when writing them, not when building them.

---

## 13. What this establishes, and what's still open

**Closed by this work:**
- **SCRUM-15** (TF-04 Tenancy scoping) — schema-level department/branch scoping on every relevant table
- **SCRUM-26** (US-010 Notes and attachments) — storage and `customer_notes` both in place
- **SCRUM-45** (US-028 In-app notification centre) — table, RLS, and three triggers, verified end to end

**Nearly closed:**
- **SCRUM-20** (US-004 Access isolation) — four and a half of five criteria proven. The outstanding half is §10's signed-URL denial, which needs a file placed in another branch's path before the test means anything.

**Deliberately not built:**
- No admin UI for managing users, departments, or categories — all seeding via SQL or the dashboard, per Phase 1 scope
- Manager and Admin roles exist in the schema and are checked in policies, but have no app screens this phase
- Auth profile provisioning is still manual — creating a user requires a dashboard step and then an `insert into profiles`

**Still ahead, in order:**

| # | Work | Notes |
|---|---|---|
| 1 | **Migrations** | Everything in this guide was applied through the SQL Editor. Nothing is version-controlled, and the only environment is flagged PRODUCTION. `supabase db pull` captures it all at once |
| 2 | **Choose an email provider** | Not code — a decision, and it gates six items |
| 3 | Auth profile provisioning | A trigger on `auth.users` insert |
| 4 | Customer-facing token API | The magic-link status page and CSAT |
| 5 | Email delivery | Bilingual templates, RTL in email HTML, retries |

> **Item 1 is more urgent now than when this guide was first written.** Storage policies, three notification triggers, two new tables, an assignment-scope trigger, and a replaced attachments policy have all been applied by hand since. Every one of them would need reconstructing from this document if the project were rebuilt from scratch — which is precisely what a migration file exists to prevent.

---

## What went wrong, and what it taught

Three things in this guide were not planned. They're worth keeping visible, because each came from a different kind of failure.

**A permissive write policy on a correctly-read table (§11.1)** — found by asking a documentation question, not by a test. Nothing was failing.

**Assignment that outran its own scope rules (§11.2)** — found by accident, while testing something else, because the resulting bug was visible in the UI.

**A table that acceptance criteria assumed but nobody modelled (§12)** — found at implementation time, when the story couldn't be built.

The common thread is that none of them would have been caught by testing the happy path. They surfaced from a question, an accident, and an implementation attempt respectively — which is a reasonable argument for doing all three.
