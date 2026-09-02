import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { supabase } from '@/core/lib/supabase';
import type { Json } from '@/core/types/database';
import { sanitizeSearchTerm } from '@/core/utils';
import { toAppError } from '@/core/utils';
import type { TicketPriority, TicketStatus } from '@/features/tickets';

import type {
  CreateCustomerInput,
  CustomerAttachment,
  CustomerDetail,
  CustomerFilter,
  CustomerListItem,
  CustomerNote,
  CustomerTicket,
  PickedFile,
  SecondaryContact,
  SecondaryContactInput,
} from './types';

const LIST_SELECT = 'id, full_name, phone, email, created_at, tickets(count)';
const LIST_SELECT_INNER = 'id, full_name, phone, email, created_at, tickets!inner(count)';

const OPEN_STATUSES = ['new', 'open', 'pending'] as const; // API §3.1
export const PAGE_SIZE = 50;                               // API §3.1's `limit=50`
const RECENT_WINDOW_DAYS = 30;                             // interim — see the story's open question 3

export type CustomerListParams = {
  filter: CustomerFilter;
  search?: string;
  /** Zero-based page index. `range(page * PAGE_SIZE, …)`. */
  page?: number;
};

type CustomerListRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
  /** PostgREST returns an aggregate embed as a one-element array. */
  tickets: { count: number }[] | null;
};

function toListItem(row: CustomerListRow): CustomerListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    createdAt: row.created_at,
    openTicketCount: row.tickets?.[0]?.count ?? 0,
  };
}

/**
 * Narrows a freshly created customer to the list-row shape the Create Ticket
 * picker holds. `openTicketCount` is 0 by construction, not by assumption: the
 * row was inserted seconds ago and the ticket that prompted it has not been
 * saved yet.
 *
 * Deliberately NOT a widening of `CustomerListItem` to accept `CustomerDetail`,
 * and NOT a union on the picker's props — the picker's contract is one row
 * shape, and it should stay one.
 */
export function toListItemFromDetail(detail: CustomerDetail): CustomerListItem {
  return {
    id: detail.id,
    fullName: detail.fullName,
    phone: detail.phone,
    email: detail.email,
    createdAt: detail.createdAt,
    openTicketCount: 0,
  };
}

/** The list fetcher. The one structural difference from tickets' fetcher is `range`. */
export async function fetchCustomers(params: CustomerListParams): Promise<CustomerListItem[]> {
  const term = params.search ? sanitizeSearchTerm(params.search) : '';
  const page = params.page ?? 0;

  let query = supabase
    .from('customers')
    .select(params.filter === 'withOpenTickets' ? LIST_SELECT_INNER : LIST_SELECT)
    // Always filter the embedded count — without it the badge would count every
    // ticket ever, not the open ones, and the chip count would disagree with the rows.
    .in('tickets.status', OPEN_STATUSES)
    // The `id` tiebreaker is not optional: two customers with the same
    // `full_name` have no defined relative order, and an undefined order across
    // `range()` calls silently duplicates one row and skips the next.
    .order('full_name', { ascending: true })
    .order('id', { ascending: true })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (params.filter === 'recent') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_WINDOW_DAYS);
    query = query.gte('created_at', cutoff.toISOString());
  }

  if (term) {
    query = query.or(
      `full_name.ilike.*${term}*,phone.ilike.*${term}*,email.ilike.*${term}*`,
    );
  }

  const { data, error } = await query.returns<CustomerListRow[]>();
  if (error) throw toAppError(error);
  return (data ?? []).map(toListItem);
}

export async function fetchCustomersCount(): Promise<number> {
  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  if (error) throw toAppError(error);
  return count ?? 0;
}

/**
 * The "With open tickets" chip count. An embed does NOT flatten the parent
 * here — each qualifying customer is counted once. Verified against the real
 * project by reading `Content-Range` (see the plan's verification step 1);
 * do not re-collapse this into a `tickets` count without that check.
 */
export async function fetchWithOpenTicketsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('customers')
    .select('*, tickets!inner(id)', { count: 'exact', head: true })
    .in('tickets.status', OPEN_STATUSES);

  if (error) throw toAppError(error);
  return count ?? 0;
}

/** The "Recent" chip count — customers created in the last `RECENT_WINDOW_DAYS`. */
export async function fetchRecentCustomersCount(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_WINDOW_DAYS);

  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', cutoff.toISOString());

  if (error) throw toAppError(error);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Customer detail (story 10 — SCRUM-24)
// ---------------------------------------------------------------------------

// `tickets(...)` is shared by all three consumers below (read, create, update)
// — a freshly created customer legitimately returns `tickets: []`, and an
// edited one keeps its history. Widening this constant is what story 14 does;
// splitting it into a second select is what story 14 explicitly avoids.
const DETAIL_SELECT =
  'id, full_name, phone, email, secondary_contacts, created_at, ' +
  'departments(name_en, name_ar), branches(name_en, name_ar), ' +
  'tickets(id, reference, subject, status, priority, created_at)';

type CustomerDetailRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  secondary_contacts: Json;
  created_at: string;
  departments: { name_en: string; name_ar: string } | null;
  branches: { name_en: string; name_ar: string } | null;
  tickets:
    | {
        id: string;
        reference: string;
        subject: string;
        status: TicketStatus;
        priority: TicketPriority;
        created_at: string;
      }[]
    | null;
};

/**
 * `secondary_contacts` is `Json` in the schema, not a typed array. Anything that
 * is not an array of objects carrying a non-empty string `value` is dropped
 * rather than rendered — a malformed row must not blank the whole profile.
 */
export function parseSecondaryContacts(value: Json): SecondaryContact[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, Json>;
    if (typeof record.value !== 'string' || record.value.trim() === '') return [];
    return [
      {
        type: typeof record.type === 'string' ? record.type : 'phone',
        value: record.value,
        label: typeof record.label === 'string' && record.label ? record.label : null,
      },
    ];
  });
}

/**
 * `?? []` is not defensive padding: PostgREST returns `null` rather than `[]`
 * for an embed with no rows on some builds, and a `null` reaching `.map` in
 * `CustomerTicketsTab` is a white screen on exactly the customer who most
 * needs the empty state.
 */
function toCustomerTicket(ticket: NonNullable<CustomerDetailRow['tickets']>[number]): CustomerTicket {
  return {
    id: ticket.id,
    reference: ticket.reference,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.created_at,
  };
}

function toCustomerDetail(row: CustomerDetailRow): CustomerDetail {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    secondaryContacts: parseSecondaryContacts(row.secondary_contacts),
    department: row.departments,
    branch: row.branches,
    createdAt: row.created_at,
    tickets: (row.tickets ?? []).map(toCustomerTicket),
  };
}

/**
 * One request for the whole Info tab — the intake is explicit that name, phone,
 * email, secondary contacts, department, branch and created_at must not cost a
 * call each. `departments` and `branches` are each referenced once from
 * `customers` (`database.ts:250-269`), so neither embed needs an `!fkey` hint —
 * unlike `tickets` → `profiles`, which does.
 *
 * Returns `null` on no row rather than throwing: RLS refusing a customer from
 * another branch and a deleted id are indistinguishable here, and both are a
 * not-found state to the agent, not an error banner.
 */
export async function fetchCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const { data, error } = await supabase
    .from('customers')
    .select(DETAIL_SELECT)
    .eq('id', customerId)
    // API §3.5's `tickets.order=created_at.desc`. `referencedTable` is what
    // orders the EMBED — a bare `.order('created_at')` would order the
    // customers result set, which is one row, and silently do nothing.
    .order('created_at', { referencedTable: 'tickets', ascending: false })
    .maybeSingle<CustomerDetailRow>();

  if (error) throw toAppError(error);
  if (!data) return null;

  return toCustomerDetail(data);
}

// ---------------------------------------------------------------------------
// Create a customer (story 11 — SCRUM-22)
// ---------------------------------------------------------------------------

/**
 * Thrown when the phone already exists for this branch — the
 * `unique (branch_id, phone)` constraint (API §3.3). Surfaced as a field error
 * on `phone`, never as a banner, per the intake.
 */
export class CustomerPhoneConflictError extends Error {
  constructor() {
    super('A customer with this phone already exists in this branch');
  }
}

/**
 * `toAppError` CANNOT be used to detect this. `core/utils/errors.ts:53` coerces
 * an all-digit `code` string into a status, and Postgres reports a unique
 * violation as `code: "23505"` — all digits. The mapped error therefore comes
 * back as `status: 23505`, `kind: 'server'`, indistinguishable from a 500.
 * Match on the raw error instead, and only then map.
 *
 * `customers` has exactly one unique constraint, so a `23505` on these writes
 * can only be that one. If a second is ever added, this narrowing becomes wrong.
 */
export function isPhoneConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const record = error as Record<string, unknown>;
  if (record.code === '23505') return true;
  if (record.status === 409) return true;
  // Least reliable of the three, and last on purpose — it exists only because
  // `code` is not guaranteed on every transport path.
  return typeof record.message === 'string' && /duplicate key|already exists/i.test(record.message);
}

/**
 * Strips spacing and punctuation so the stored value matches API §3.3's
 * `+201001234567` form. Keeps a leading `+`. The `unique (branch_id, phone)`
 * constraint compares stored values verbatim, so normalising here is what makes
 * the duplicate check work at all — `+20 100 123 4567` and `+201001234567` are
 * two different rows to Postgres.
 */
export function normalisePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

/**
 * Form rows → the stored JSON array. Blank rows are dropped rather than stored:
 * `useFieldArray` leaves an empty row behind whenever an agent taps
 * "+ Add contact" and then changes their mind, and `{"type":"phone","value":""}`
 * is a row `parseSecondaryContacts` would drop on the way out anyway.
 *
 * The `{ type, value, label }` shape is API §3.3's, NOT Figma's `{ name, phone }`
 * — see story 10's open question 3. If a live row says otherwise, change this
 * function and `parseSecondaryContacts` together.
 */
export function toSecondaryContactsJson(contacts: SecondaryContactInput[]): Json {
  return contacts
    .filter((contact) => contact.value.trim() !== '')
    .map((contact) => ({
      type: 'phone',
      value: normalisePhone(contact.value),
      label: contact.label.trim() || null,
    }));
}

export type CreateCustomerParams = CreateCustomerInput & {
  departmentId: string;
  branchId: string;
  createdBy: string;
};

/**
 * `.select(DETAIL_SELECT).single()` is `Prefer: return=representation` (API §3.3)
 * — it returns the created row in the exact shape `fetchCustomerDetail` returns,
 * so `useCreateCustomer` can seed `customerKeys.detail(id)` and the detail
 * screen paints without a second round trip.
 *
 * `id`, `created_at` and `updated_at` are omitted deliberately: all three are
 * server-generated.
 */
export async function createCustomer(params: CreateCustomerParams): Promise<CustomerDetail> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      full_name: params.fullName.trim(),
      phone: normalisePhone(params.phone),
      email: params.email.trim() || null,
      secondary_contacts: toSecondaryContactsJson(params.secondaryContacts),
      department_id: params.departmentId,
      branch_id: params.branchId,
      created_by: params.createdBy,
    })
    .select(DETAIL_SELECT)
    .order('created_at', { referencedTable: 'tickets', ascending: false })
    .single<CustomerDetailRow>();

  if (error) {
    if (isPhoneConflict(error)) throw new CustomerPhoneConflictError();
    throw toAppError(error);
  }
  return toCustomerDetail(data);
}

// ---------------------------------------------------------------------------
// Edit a customer (story 12 — SCRUM-23)
// ---------------------------------------------------------------------------

/** Thrown when the update matched no row — RLS refused it, or the id is gone. */
export class CustomerNotEditableError extends Error {
  constructor() {
    super('This customer cannot be edited from your branch');
  }
}

/**
 * `CustomerDetail` (what the profile shows) → `CreateCustomerInput` (what the
 * form edits). The two shapes differ deliberately: the detail carries resolved
 * department and branch NAMES, which the form neither edits nor sends.
 *
 * The two `?? ''` fallbacks are load-bearing — a `null` into a `TextField`'s
 * `value` makes it uncontrolled on first render, and React then drops the
 * agent's first keystroke.
 */
export function toCustomerInput(customer: CustomerDetail): CreateCustomerInput {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email ?? '',
    secondaryContacts: customer.secondaryContacts.map((contact) => ({
      label: contact.label ?? '',
      value: contact.value,
    })),
  };
}

/**
 * §3.4. Reuses create's normalisation, JSON mapping and conflict detection
 * verbatim — the `unique (branch_id, phone)` constraint does not care which
 * verb touched the row, and a second copy of `isPhoneConflict` would be the
 * start of two error contracts for one constraint.
 *
 * `department_id` and `branch_id` are NOT in the payload. They are immutable
 * from the client; sending them unchanged would be harmless and sending them
 * changed would be rejected, so sending them at all only invites the second.
 *
 * Deliberately NOT compare-and-set, unlike `assignTicket`. That guard exists
 * because two agents racing for one ticket is a real workflow; two agents
 * editing one customer's phone at the same moment is not, and a false "someone
 * changed this" on a slow connection would be worse than a last-write-wins.
 */
export async function updateCustomer(
  customerId: string,
  input: CreateCustomerInput,
): Promise<CustomerDetail> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      full_name: input.fullName.trim(),
      phone: normalisePhone(input.phone),
      email: input.email.trim() || null,
      secondary_contacts: toSecondaryContactsJson(input.secondaryContacts),
    })
    .eq('id', customerId)
    .select(DETAIL_SELECT)
    .order('created_at', { referencedTable: 'tickets', ascending: false })
    .maybeSingle<CustomerDetailRow>();

  if (error) {
    if (isPhoneConflict(error)) throw new CustomerPhoneConflictError();
    throw toAppError(error);
  }
  // Zero rows means RLS refused the row — BRD `:548`'s cross-branch case, and
  // the reason this is `maybeSingle` rather than create's `single`: `single`
  // reports that as PGRST116 and `toAppError` cannot tell it from a 404.
  // Reporting success on a write that changed nothing is the failure that
  // acceptance criterion exists to catch.
  if (!data) throw new CustomerNotEditableError();
  return toCustomerDetail(data);
}

// ---------------------------------------------------------------------------
// Notes (story 24 — SCRUM-26)
// ---------------------------------------------------------------------------

const NOTE_SELECT = 'id, body, created_at, author_id, profiles(full_name)';

type CustomerNoteRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
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

/**
 * NEWEST FIRST — the opposite of `fetchTicketMessages`
 * (`tickets/api.ts:384`, ascending). A ticket thread is a conversation read top
 * to bottom; a note list is a reference read most-recent first. Do not "fix"
 * one to match the other.
 */
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
 * `:586` is "it saves with my name", the column is NOT NULL, and the deployed
 * `insert_notes` policy scopes the write through the parent customer's
 * department and branch — so a payload without it fails at the database rather
 * than being silently attributed to nobody.
 *
 * The `profiles(full_name)` embed on the way back out is what turns the id into
 * the name the row renders, so the new note paints with its author without a
 * second round trip.
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

// ---------------------------------------------------------------------------
// Attachments (story 24 — SCRUM-26)
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
 * out of positions [1] and [2] — the upload would then not match any policy and
 * would be refused, per `phase1_backend_plan.md:112-116`.
 *
 * Arabic file names survive: this strips separators and control characters, not
 * non-ASCII. A name that reduces to nothing falls back to 'file'.
 */
export function sanitiseFileName(name: string): string {
  const cleaned = name
    .replace(/[/\\]+/g, '-')
    .replace(/[ -]/g, '')
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
 * `DETAIL_SELECT`, `:155-158`). Separate query, separate cache entry, fetched
 * when the tab is.
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
 * 60 seconds. The URL is minted on tap and consumed immediately by one `Image`;
 * a longer window is a longer period in which a URL that has escaped a log or a
 * screenshot still resolves.
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
 * The path's uuid comes from `expo-crypto`, not from the row's own id.
 * Borrowing the id would force the insert to happen first and invert exactly
 * this tradeoff.
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
  // `Uint8Array` is an `ArrayBufferView` and is accepted directly.
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
    // and this is the one legitimate use of it in the app — there is no
    // user-facing delete anywhere in this feature. A failure here is
    // swallowed deliberately: the insert error is the one worth reporting.
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
    throw toAppError(error);
  }

  return toAttachment(data);
}
