# Phase 1 API Reference — AZM Support CRM

Every endpoint the Phase 1 app uses, structured for building a Postman collection.

**Base URL:** `https://svcxmjibmgjtaxuzrquf.supabase.co`

**Legend:** ✅ works now · 🔨 needs backend work first (see `phase1_backend_plan.md`)

---

## Collection variables

Set these at collection level so requests stay portable across environments.

| Variable | Value | Notes |
|---|---|---|
| `base_url` | `https://svcxmjibmgjtaxuzrquf.supabase.co` | |
| `anon_key` | *(Project Settings → API Keys → anon public)* | Safe in the client |
| `access_token` | *(empty — populated by sign-in script)* | |
| `refresh_token` | *(empty — populated by sign-in script)* | |
| `user_id` | *(empty — populated by sign-in script)* | |
| `ticket_id` | *(empty — set by ticket requests)* | |
| `customer_id` | *(empty — set by customer requests)* | |
| `magic_token` | *(empty — for customer-facing tests)* | |

> **Never put the `service_role` key in a Postman collection you might share or commit.** It bypasses every RLS policy. If you need it for admin scripts, keep it in a Postman *environment* marked secret, not in the collection.

---

## Standard headers

Every REST request needs both. The `apikey` header identifies the project; `Authorization` identifies the user.

```
apikey: {{anon_key}}
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

Requests that should return the created or updated row also need:

```
Prefer: return=representation
```

Without it, PostgREST returns `201 Created` with an empty body, which is a common source of confusion.

---

# 1. Authentication ✅

## 1.1 Sign in

```
POST {{base_url}}/auth/v1/token?grant_type=password
```

Headers: `apikey`, `Content-Type` — **no Authorization header**

```json
{
  "email": "omar@azm.test",
  "password": "..."
}
```

**Post-response script** — captures everything downstream requests need:

```js
const j = pm.response.json();
pm.collectionVariables.set("access_token", j.access_token);
pm.collectionVariables.set("refresh_token", j.refresh_token);
pm.collectionVariables.set("user_id", j.user.id);
```

**Test accounts** — each proves a different isolation dimension:

| Email | Department | Branch | Role |
|---|---|---|---|
| `omar@azm.test` | Technical Support | Cairo | agent |
| `layla@azm.test` | Technical Support | Alexandria | agent |
| `amara@azm.test` | Billing | Cairo | agent |
| `admin@azm.test` | Technical Support | Cairo | admin |

## 1.2 Refresh session ✅

```
POST {{base_url}}/auth/v1/token?grant_type=refresh_token
```

```json
{ "refresh_token": "{{refresh_token}}" }
```

Supports **US-002 session persistence**.

## 1.3 Current user ✅

```
GET {{base_url}}/auth/v1/user
```

## 1.4 Password reset ✅

```
POST {{base_url}}/auth/v1/recover
```

```json
{ "email": "omar@azm.test" }
```

Supports **US-003**. Always returns success regardless of whether the email exists — deliberate, so the endpoint can't be used to enumerate accounts.

## 1.5 Sign out ✅

```
POST {{base_url}}/auth/v1/logout
```

---

# 2. Reference data ✅

Read-only for agents, admin-writable.

```
GET {{base_url}}/rest/v1/departments?select=id,name_en,name_ar&is_active=eq.true
GET {{base_url}}/rest/v1/branches?select=id,name_en,name_ar&is_active=eq.true
GET {{base_url}}/rest/v1/categories?select=id,name_en,name_ar&is_active=eq.true&order=sort_order
```

## Current agent's profile ✅

```
GET {{base_url}}/rest/v1/profiles?select=*,departments(name_en,name_ar),branches(name_en,name_ar)&id=eq.{{user_id}}
```

Returns the agent's identity plus their department and branch names in one round trip — this is what populates the Home greeting and the Profile screen.

---

# 3. Customers ✅

## 3.1 List ✅

```
GET {{base_url}}/rest/v1/customers?select=id,full_name,phone,email,created_at&order=full_name&limit=50
```

**With open ticket counts** — supports the count shown on each Customers row:

```
GET {{base_url}}/rest/v1/customers?select=id,full_name,phone,tickets(count)&tickets.status=in.(new,open,pending)
```

## 3.2 Search ✅ *(basic — full-text pending §10)*

```
GET {{base_url}}/rest/v1/customers?or=(full_name.ilike.*{{q}}*,phone.ilike.*{{q}}*,email.ilike.*{{q}}*)
```

Supports **US-005**. Works for Arabic names too, since `ilike` is encoding-agnostic.

## 3.3 Create ✅

```
POST {{base_url}}/rest/v1/customers
Prefer: return=representation
```

```json
{
  "full_name": "Ahmed Mahmoud",
  "phone": "+201001234567",
  "email": "ahmed@example.com",
  "secondary_contacts": [{"type":"phone","value":"+201112223333","label":"Work"}],
  "department_id": "11111111-1111-1111-1111-111111111111",
  "branch_id": "33333333-3333-3333-3333-333333333333"
}
```

Supports **US-006**. RLS rejects any `department_id`/`branch_id` that isn't the caller's own.

**Duplicate phone test:** repeat with the same phone and branch → expect `409 Conflict` from the `unique (branch_id, phone)` constraint.

## 3.4 Update ✅

```
PATCH {{base_url}}/rest/v1/customers?id=eq.{{customer_id}}
```

## 3.5 Detail with history ✅

```
GET {{base_url}}/rest/v1/customers?select=*,tickets(id,reference,subject,status,priority,created_at)&id=eq.{{customer_id}}&tickets.order=created_at.desc
```

One request returns the customer and their full ticket history — supports **US-008** and **US-009**.

---

# 4. Tickets ✅

## 4.1 List — "Mine" ✅

```
GET {{base_url}}/rest/v1/tickets?select=id,reference,subject,status,priority,created_at,customers(full_name)&assigned_to=eq.{{user_id}}&status=in.(new,open,pending)&order=created_at.desc
```

## 4.2 List — "Unassigned" ✅

```
GET {{base_url}}/rest/v1/tickets?select=id,reference,subject,status,priority,created_at,customers(full_name)&assigned_to=is.null&status=in.(new,open)&order=created_at.desc
```

## 4.3 List — "All" ✅

```
GET {{base_url}}/rest/v1/tickets?select=id,reference,subject,status,priority,created_at,customers(full_name)&order=created_at.desc&limit=50
```

Together these support **US-016**. RLS already restricts all three to the agent's department and branch — no filter needed for that.

## 4.4 Counts for the filter chips ✅

```
GET {{base_url}}/rest/v1/tickets?select=count&assigned_to=eq.{{user_id}}&status=in.(new,open,pending)
Prefer: count=exact
```

Read the total from the `Content-Range` response header.

## 4.5 Home workload counts ✅

Three requests, supporting **US-020**:

```
# My open
GET .../tickets?select=count&assigned_to=eq.{{user_id}}&status=in.(open,pending)

# Unassigned
GET .../tickets?select=count&assigned_to=is.null&status=in.(new,open)

# Resolved today
GET .../tickets?select=count&assigned_to=eq.{{user_id}}&resolved_at=gte.{{today_iso}}
```

## 4.6 Detail ✅

```
GET {{base_url}}/rest/v1/tickets?select=*,customers(id,full_name,phone,email),categories(name_en,name_ar),profiles!assigned_to(full_name)&id=eq.{{ticket_id}}
```

`profiles!assigned_to` disambiguates the join, since `tickets` references `profiles` twice — once as assignee, once as creator.

## 4.7 Create ✅

```
POST {{base_url}}/rest/v1/tickets
Prefer: return=representation
```

```json
{
  "subject": "Payment gateway timeout at checkout",
  "description": "Card declined on retry",
  "customer_id": "{{customer_id}}",
  "category_id": "...",
  "priority": "high",
  "department_id": "11111111-1111-1111-1111-111111111111",
  "branch_id": "33333333-3333-3333-3333-333333333333",
  "created_by": "{{user_id}}"
}
```

Supports **US-017**. `reference` and `status` are generated server-side — don't send them.

## 4.8 Assign / claim ✅

```
PATCH {{base_url}}/rest/v1/tickets?id=eq.{{ticket_id}}
```

```json
{ "assigned_to": "{{user_id}}" }
```

Supports **US-017 (assign)** and **US-029 (claim)**. The `log_ticket_assignment` trigger writes the history entry automatically.

**Unassign:** send `{"assigned_to": null}`.

## 4.9 Change status ✅

```
PATCH {{base_url}}/rest/v1/tickets?id=eq.{{ticket_id}}
```

```json
{ "status": "resolved", "resolution_note": "Reissued the invoice" }
```

Supports **US-018**.

### Negative tests — these must fail

| Request | Expected |
|---|---|
| `{"status":"closed"}` on a `new` ticket | `Illegal transition: new → closed` |
| `{"status":"resolved"}` with no note | `A resolution note is required when resolving a ticket` |
| `{"status":"open"}` on a `closed` ticket | `Illegal transition: closed → open` |

> These are the most valuable requests in the whole collection. They prove the state machine holds at the API layer, where the app actually talks to it — not just in the SQL Editor.

## 4.10 History ✅

```
GET {{base_url}}/rest/v1/ticket_events?select=*,profiles(full_name)&ticket_id=eq.{{ticket_id}}&order=created_at.desc
```

Supports **US-019**.

**Immutability test:** attempt `PATCH` or `DELETE` on this table → expect failure. No policy grants either.

---

# 5. Messages ✅

## 5.1 Conversation — public only ✅

```
GET {{base_url}}/rest/v1/ticket_messages?select=*,profiles(full_name)&ticket_id=eq.{{ticket_id}}&is_internal=eq.false&order=created_at
```

## 5.2 Internal notes only ✅

```
GET {{base_url}}/rest/v1/ticket_messages?select=*,profiles(full_name)&ticket_id=eq.{{ticket_id}}&is_internal=eq.true&order=created_at
```

## 5.3 Post a public reply ✅

```json
{ "ticket_id": "{{ticket_id}}", "author_id": "{{user_id}}", "body": "...", "is_internal": false }
```

## 5.4 Post an internal note ✅

```json
{ "ticket_id": "{{ticket_id}}", "author_id": "{{user_id}}", "body": "...", "is_internal": true }
```

Supports **US-014** and **US-015**.

### Critical negative test

Omit `is_internal` entirely → **expect failure**. The column is `NOT NULL` with no default, deliberately. If this request ever succeeds, the constraint has been weakened and internal notes can silently become public.

---

# 6. RLS isolation tests ✅

The reason this collection exists. Put these in their own folder and re-run after **every** schema change.

| # | Steps | Expected |
|---|---|---|
| 1 | Sign in as Omar → `GET /customers` | 2 rows — Ahmed, ليلى. Cairo/Technical Support only |
| 2 | Sign in as Layla → `GET /customers` | 1 row — Karim. Alexandria only |
| 3 | Sign in as Amara → `GET /customers` | 1 row — Nour. Billing only |
| 4 | As Omar, `GET /tickets?department_id=eq.<Billing UUID>` | Empty. The filter can't widen what RLS allows |
| 5 | As Omar, `PATCH` a ticket belonging to Layla's branch | 0 rows affected |
| 6 | As Omar, `GET /ticket_messages?ticket_id=eq.<Layla's ticket>` | Empty |
| 7 | Any agent, `GET /access_tokens` | Empty — zero policies exist on this table |
| 8 | Sign in as Admin → `GET /customers` | All 4 rows |

> Test 4 is the one people find counterintuitive. Adding a filter for another department doesn't grant access — RLS applies first, then your filter narrows what's left. You cannot filter your way out of a policy.

---

# 7. Customer-facing endpoints 🔨

**Requires §8 of the backend plan.** The customer has no account, so none of the authenticated policies apply.

## 7.1 Get ticket by magic token 🔨

```
POST {{base_url}}/rest/v1/rpc/get_ticket_by_token
```

Headers: `apikey` only — **no Authorization**

```json
{ "p_token": "{{magic_token}}" }
```

Supports **US-025**.

### Isolation tests — these define US-026

| Test | Expected |
|---|---|
| Response body inspected | No `assigned_to`, no agent name, no priority, no department, no branch |
| Messages array | Only `is_internal = false`. Internal notes absent from the payload entirely |
| Expired token | Rejected |
| Malformed or random token | Rejected |
| Valid token for ticket A used to request ticket B | Rejected |

> The point of the restricted function is that these fields are **never selected**, not filtered afterward. A filter is one bug from failing; a function that doesn't query the column cannot leak it.

## 7.2 Submit CSAT 🔨

```
POST {{base_url}}/rest/v1/rpc/submit_csat
```

```json
{ "p_token": "{{magic_token}}", "p_rating": 5, "p_comment": "Quick and helpful" }
```

Supports **US-027**. Submit twice → second attempt must fail on the unique constraint.

---

# 8. Storage ✅

The `attachments` bucket is **private**, capped at **10 MB**, and accepts exactly four MIME types:
`image/jpeg`, `image/png`, `image/webp`, `application/pdf` (`docs/phase1_backend_plan.md:93-108`).
Three `storage.objects` policies (select/insert/delete) scope every object by the first two path
segments, matched against `current_branch()` / `current_department()`.

## 8.1 Upload ✅

```
POST {{base_url}}/storage/v1/object/attachments/{branch_id}/{department_id}/{ticket_id|customer_id}/{uuid}-{filename}
```

Body: binary, `Content-Type` matching the file. **The third path segment may be a ticket id or a
customer id** — both are in scope (`docs/phase1_backend_plan.md:112`); story 24 (SCRUM-26) is the
customer-scoped client of this endpoint, built via `supabase.storage.from('attachments').upload(...)`
with an `ArrayBuffer`/`Uint8Array` body rather than a raw `fetch`.

## 8.2 Signed URL ✅

```
POST {{base_url}}/storage/v1/object/sign/attachments/{path}
```

```json
{ "expiresIn": 60 }
```

Story 24's client mints a 60-second URL per view rather than the 3600s shown historically here —
short enough that a URL that escapes a log or a screenshot has little time left to resolve.

### Storage isolation test

As Omar, request a signed URL for a file under Layla's branch path → must be refused. **Not yet
re-run against a live agent JWT** — story 24 (SCRUM-26) names this its verification step 2 and it
must run before the story is signed off; see `docs/phase1_known_issues.md`.

> Worth stating plainly: table RLS on `attachments` does **not** protect the files. Storage policies are a separate surface and must enforce the same scope independently.

---

# 9. Notifications ✅

Table, RLS and three of five triggers are live and verified — see backend plan §9. Columns:
`id`, `recipient_id`, `ticket_id` (nullable), `type` (`text`, no enum/CHECK), `title`,
`body` (nullable), `is_read`, `created_at`.

`select_own` scopes SELECT/UPDATE to `recipient_id = auth.uid()`; `update_own`'s `with check`
does the same for writes. **There is no INSERT policy for `authenticated`** — a client cannot
fabricate a notification. Rows come only from three triggers: `trg_notify_assignment` (ticket
assigned), `trg_notify_reply` (customer reply), `trg_notify_status` (status change, excluding
self). Two more types — `unassigned` (needs `pg_cron`) and `rating` (needs the CSAT flow from
§8) — are planned but do not fire yet.

```
GET {{base_url}}/rest/v1/notifications?select=*&recipient_id=eq.{{user_id}}&order=created_at.desc
GET {{base_url}}/rest/v1/notifications?select=*&recipient_id=eq.{{user_id}}&is_read=eq.false
    Prefer: count=exact                                  → unread count for the Home bell badge
PATCH {{base_url}}/rest/v1/notifications?id=eq.{{id}}     → {"is_read": true}
PATCH {{base_url}}/rest/v1/notifications?recipient_id=eq.{{user_id}}&is_read=eq.false   → mark all read
```

Supports **US-028** — the in-app notification centre. The OS **push** delivery half of US-028's
first criterion is not covered by this table or this client; it is owned by SCRUM-40/41.

---

# PostgREST syntax reference

The least obvious part of working with Supabase directly. Worth keeping to hand.

| Pattern | Syntax |
|---|---|
| Equals | `?status=eq.open` |
| Not equals | `?status=neq.closed` |
| In list | `?status=in.(new,open,pending)` |
| Is null | `?assigned_to=is.null` |
| Greater / less | `?created_at=gte.2026-08-01` |
| Contains (case-insensitive) | `?full_name=ilike.*ahmed*` |
| OR | `?or=(subject.ilike.*x*,reference.ilike.*x*)` |
| Select columns | `?select=id,subject,status` |
| Embed relation | `?select=*,customers(full_name)` |
| Filter embedded | `&customers.is_active=eq.true` |
| Disambiguate FK | `?select=profiles!assigned_to(full_name)` |
| Order | `?order=created_at.desc` |
| Order embedded | `&tickets.order=created_at.desc` |
| Paginate | `?limit=20&offset=40` |
| Count | `?select=count` + `Prefer: count=exact` |
| Return created row | `Prefer: return=representation` |
| Upsert | `Prefer: resolution=merge-duplicates` |

---

# Suggested folder structure

```
AZM Support CRM/
├── 00 Auth/              Sign in ×4 accounts, refresh, recover, logout
├── 01 Reference/         Departments, branches, categories, my profile
├── 02 Customers/         List, search, create, update, detail
├── 03 Tickets/           Lists, counts, detail, create, assign, status
│   └── Negative tests/   Illegal transitions, missing resolution note
├── 04 Messages/          Conversation, internal, post both
│   └── Negative tests/   Omitted is_internal
├── 05 RLS Isolation/     The 8 tests from §6 — run after every schema change
├── 06 Customer-facing/   🔨 Magic link, CSAT
├── 07 Storage/           🔨 Upload, sign, isolation
└── 08 Notifications/     🔨 List, mark read
```

Folders 05 and the two negative-test folders are the ones with lasting value. The CRUD requests get replaced by app code soon enough; the tests that prove your security model holds stay useful for the life of the project.
