import { supabase } from '@/core/lib/supabase';
import {
  sanitizeSearchTerm,
  toAppError,
  type AppError,
  type LocalisedName,
} from '@/core/utils';

import { canTransition, requiresResolutionNote } from './state-machine';
import type {
  CreateTicketInput,
  MessageKind,
  TicketCategory,
  TicketDetail,
  TicketEvent,
  TicketEventType,
  TicketFilter,
  TicketListItem,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from './types';

const LIST_SELECT = 'id, reference, subject, status, priority, created_at, customers(full_name)';

/**
 * Customer-name search reaches through the embedded resource, which PostgREST
 * only filters on an inner join. Used in the search fallback's second query;
 * the FK (`tickets.customer_id`) is non-nullable, so the inner join changes no
 * row counts.
 */
const LIST_SELECT_INNER =
  'id, reference, subject, status, priority, created_at, customers!inner(full_name)';

type TicketListRow = {
  id: string;
  reference: string;
  subject: string;
  status: TicketListItem['status'];
  priority: TicketListItem['priority'];
  created_at: string;
  customers: { full_name: string } | null;
};

function toListItem(row: TicketListRow): TicketListItem {
  return {
    id: row.id,
    reference: row.reference,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    customerName: row.customers?.full_name ?? null,
  };
}

export type TicketListOptions = {
  limit?: number;
  /** Free-text term; matched with `ilike` against subject, reference and customer name. */
  search?: string;
};

/**
 * Branch shipped: the **two-query fallback** from plan
 * `04-story-ticket-list-with-filters-SCRUM-27.md` task 2b. The primary
 * single-query form (embedded `customers.full_name` inside a top-level `or`)
 * was verified against the real project with the plan's curl and rejected with
 * `PGRST100 / "failed to parse logic tree"` — this PostgREST build does not
 * accept embedded columns in a top-level `or`. The fallback below issues a
 * subject/reference `or` and an inner-joined customer-name `ilike` as separate
 * queries and merges client-side. (Plan curl run 2026-08-29.)
 */
const PRIORITY_RANK: Record<TicketPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Priority desc, then recency desc — identical to the fetchers' server-side `.order` pair. */
function mergeTicketRows(rows: TicketListItem[], limit?: number): TicketListItem[] {
  const byId = new Map<string, TicketListItem>();
  for (const row of rows) byId.set(row.id, row);
  const sorted = [...byId.values()].sort(
    (a, b) =>
      PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
      b.createdAt.localeCompare(a.createdAt),
  );
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

/**
 * Search fallback: subject/reference `or` as one query, embedded customer-name
 * `ilike` on an inner join as a second, merged by `id` and re-sorted client-side.
 * Returns at most `limit` rows from the merged set, exactly as the primary form
 * would server-side.
 */
async function searchTickets(
  filter: TicketFilter,
  userId: string,
  term: string,
  limit?: number,
): Promise<TicketListItem[]> {
  let textQuery = supabase
    .from('tickets')
    .select(LIST_SELECT)
    .or(`subject.ilike.*${term}*,reference.ilike.*${term}*`);
  let customerQuery = supabase
    .from('tickets')
    .select(LIST_SELECT_INNER)
    .ilike('customers.full_name', `%${term}%`);

  if (filter === 'mine') {
    textQuery = textQuery.eq('assigned_to', userId).in('status', ['new', 'open', 'pending']);
    customerQuery = customerQuery.eq('assigned_to', userId).in('status', ['new', 'open', 'pending']);
  } else if (filter === 'unassigned') {
    textQuery = textQuery.is('assigned_to', null).in('status', ['new', 'open']);
    customerQuery = customerQuery.is('assigned_to', null).in('status', ['new', 'open']);
  }

  const [text, customer] = await Promise.all([
    textQuery.returns<TicketListRow[]>(),
    customerQuery.returns<TicketListRow[]>(),
  ]);
  if (text.error) throw toAppError(text.error);
  if (customer.error) throw toAppError(customer.error);

  const rows = [
    ...(text.data ?? []).map(toListItem),
    ...(customer.data ?? []).map(toListItem),
  ];
  return mergeTicketRows(rows, limit);
}

/** Midnight in the device's timezone, as an ISO string — what "today" means to an agent. */
export function startOfTodayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function fetchMyTickets(
  userId: string,
  options: TicketListOptions = {},
): Promise<TicketListItem[]> {
  const term = options.search ? sanitizeSearchTerm(options.search) : '';
  if (term) return searchTickets('mine', userId, term, options.limit);

  let query = supabase
    .from('tickets')
    .select(LIST_SELECT)
    .eq('assigned_to', userId)
    .in('status', ['new', 'open', 'pending'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.limit !== undefined) query = query.limit(options.limit);

  const { data, error } = await query.returns<TicketListRow[]>();
  if (error) throw toAppError(error);
  return (data ?? []).map(toListItem);
}

export async function fetchUnassignedTickets(
  options: TicketListOptions = {},
): Promise<TicketListItem[]> {
  const term = options.search ? sanitizeSearchTerm(options.search) : '';
  if (term) return searchTickets('unassigned', '', term, options.limit);

  let query = supabase
    .from('tickets')
    .select(LIST_SELECT)
    .is('assigned_to', null)
    .in('status', ['new', 'open'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.limit !== undefined) query = query.limit(options.limit);

  const { data, error } = await query.returns<TicketListRow[]>();
  if (error) throw toAppError(error);
  return (data ?? []).map(toListItem);
}

const ALL_LIST_LIMIT = 50; // API §4.3 — the "All" list is capped, not paginated.

/** §4.3: no status and no assignment predicate; capped when the caller gives no limit. */
export async function fetchAllTickets(options: TicketListOptions = {}): Promise<TicketListItem[]> {
  const term = options.search ? sanitizeSearchTerm(options.search) : '';
  if (term) return searchTickets('all', '', term, options.limit ?? ALL_LIST_LIMIT);

  let query = supabase
    .from('tickets')
    .select(LIST_SELECT)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(options.limit ?? ALL_LIST_LIMIT);

  const { data, error } = await query.returns<TicketListRow[]>();
  if (error) throw toAppError(error);
  return (data ?? []).map(toListItem);
}

export async function fetchMyOpenCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', userId)
    .in('status', ['open', 'pending']);

  if (error) throw toAppError(error);
  return count ?? 0;
}

/**
 * The "Mine" chip count — `new, open, pending`, matching `fetchMyTickets`'s own
 * predicate (API §4.4). Deliberately NOT `fetchMyOpenCount`, which is Home's
 * "My open" stat and excludes `new` (API §4.5). The two numbers legitimately
 * differ; do not collapse them.
 */
export async function fetchMyTicketsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', userId)
    .in('status', ['new', 'open', 'pending']);

  if (error) throw toAppError(error);
  return count ?? 0;
}

export async function fetchUnassignedCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .is('assigned_to', null)
    .in('status', ['new', 'open']);

  if (error) throw toAppError(error);
  return count ?? 0;
}

/** The "All" chip count — every ticket RLS lets this agent see. */
export async function fetchAllTicketsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true });

  if (error) throw toAppError(error);
  return count ?? 0;
}

export async function fetchResolvedTodayCount(userId: string, sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', userId)
    .gte('resolved_at', sinceIso);

  if (error) throw toAppError(error);
  return count ?? 0;
}

/** Thrown by `claimTicket` when the ticket was already assigned to someone else. */
export class TicketAlreadyClaimedError extends Error {
  constructor() {
    super('Ticket was already claimed by another agent');
  }
}

/**
 * Compare-and-set claim: the `assigned_to is null` predicate means a ticket
 * someone else already took updates zero rows instead of being silently
 * reassigned. A zero-row result throws `TicketAlreadyClaimedError` rather than
 * resolving as if the claim succeeded.
 */
export async function claimTicket(ticketId: string, userId: string): Promise<void> {
  const { count, error } = await supabase
    .from('tickets')
    .update({ assigned_to: userId }, { count: 'exact' })
    .eq('id', ticketId)
    .is('assigned_to', null);

  if (error) throw toAppError(error);
  if (!count) throw new TicketAlreadyClaimedError();
}

// ---------------------------------------------------------------------------
// Ticket detail, messages and history (story 07 — SCRUM-30)
// ---------------------------------------------------------------------------

const DETAIL_SELECT =
  '*, customers(id, full_name, phone, email), categories(name_en, name_ar), profiles!assigned_to(full_name)';

type TicketDetailRow = {
  id: string;
  reference: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  resolution_note: string | null;
  assigned_to: string | null;
  customers: { id: string; full_name: string; phone: string; email: string | null } | null;
  categories: LocalisedName | null;
  profiles: { full_name: string } | null;
};

/**
 * Shared by the read path (`fetchTicketDetail`) and the create path
 * (`createTicket`) — two mappers for one shape is how they drift apart.
 */
function toTicketDetail(data: TicketDetailRow): TicketDetail {
  return {
    id: data.id,
    reference: data.reference,
    subject: data.subject,
    description: data.description,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
    resolutionNote: data.resolution_note,
    customer: data.customers
      ? {
          id: data.customers.id,
          fullName: data.customers.full_name,
          phone: data.customers.phone,
          email: data.customers.email,
        }
      : null,
    category: data.categories,
    assigneeName: data.profiles?.full_name ?? null,
    assigneeId: data.assigned_to,
  };
}

/**
 * The `profiles!assigned_to` hint is mandatory — `tickets` references
 * `profiles` twice (assignee and creator), so an unhinted `profiles(full_name)`
 * is a PostgREST ambiguity error, not a silent wrong join (API §4.6).
 */
export async function fetchTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select(DETAIL_SELECT)
    .eq('id', ticketId)
    .maybeSingle<TicketDetailRow>();

  if (error) throw toAppError(error);
  if (!data) return null;

  return toTicketDetail(data);
}

const MESSAGE_SELECT = 'id, body, created_at, is_internal, author_id, profiles(full_name)';

type TicketMessageRow = {
  id: string;
  body: string;
  created_at: string;
  is_internal: boolean;
  author_id: string | null;
  profiles: { full_name: string } | null;
};

function toMessage(row: TicketMessageRow): TicketMessage {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    isInternal: row.is_internal,
    authorName: row.profiles?.full_name ?? null,
    authorId: row.author_id,
  };
}

/**
 * One kind per call — never fetched together and filtered client-side.
 * Fetching both would put internal notes in the public thread's cache entry,
 * one rendering bug away from the customer-visible surface (API §5.1/§5.2).
 */
export async function fetchTicketMessages(ticketId: string, kind: MessageKind): Promise<TicketMessage[]> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select(MESSAGE_SELECT)
    .eq('ticket_id', ticketId)
    .eq('is_internal', kind === 'internal')
    .order('created_at', { ascending: true })
    .returns<TicketMessageRow[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map(toMessage);
}

/**
 * `isInternal` is REQUIRED, not optional, and there is no default anywhere in
 * this function. `ticket_messages.is_internal` is NOT NULL with no default
 * (`database.ts` types it `is_internal: boolean` in `Insert` — the only
 * non-optional insertable column besides `body` and `ticket_id`). API §5's
 * closing note is explicit that this is deliberate: if a payload without it
 * ever succeeds, internal notes can silently become public. Do not add a
 * default, do not widen this to `Partial<...>`, do not build the payload
 * through a `Record<string, unknown>` — each of those turns a compile error
 * into a runtime leak.
 */
export async function postTicketMessage(input: {
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
}): Promise<TicketMessage> {
  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: input.ticketId,
      author_id: input.authorId,
      body: input.body,
      is_internal: input.isInternal,
    })
    .select(MESSAGE_SELECT)
    .single<TicketMessageRow>();

  if (error) throw toAppError(error);
  return toMessage(data);
}

const EVENT_SELECT = 'id, event_type, from_value, to_value, created_at, profiles(full_name)';

type TicketEventRow = {
  id: string;
  event_type: TicketEventType;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
};

/** No update or delete function — BRD `:717` and API §4.10's immutability test require none exist. */
export async function fetchTicketEvents(ticketId: string): Promise<TicketEvent[]> {
  const { data, error } = await supabase
    .from('ticket_events')
    .select(EVENT_SELECT)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .returns<TicketEventRow[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    fromValue: row.from_value,
    toValue: row.to_value,
    createdAt: row.created_at,
    actorName: row.profiles?.full_name ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Assignment (story 08 — SCRUM-33)
// ---------------------------------------------------------------------------

/**
 * Thrown when the ticket's assignee changed between the sheet rendering and
 * the PATCH landing — or when RLS refuses the row. Both surface as zero rows
 * affected and are indistinguishable from the client; the message is worded
 * for the common case.
 */
export class TicketAssignmentChangedError extends Error {
  constructor() {
    super('Ticket assignment changed before this update was applied');
  }
}

/**
 * Compare-and-set reassignment. `expectedCurrentAssigneeId` is the assignee the
 * sheet was rendered against; the predicate narrows the update to a row still
 * in that state, so two agents reassigning the same ticket at once produces one
 * winner and one explicit error rather than a silent last-write-wins. Same
 * discipline as `claimTicket`, generalised from "must be null" to "must be
 * what I last saw". Unassign is `assignTicket(id, null, currentId)` — there is
 * no separate `unassignTicket` (API §4.8).
 */
export async function assignTicket(
  ticketId: string,
  assigneeId: string | null,
  expectedCurrentAssigneeId: string | null,
): Promise<void> {
  let query = supabase
    .from('tickets')
    .update({ assigned_to: assigneeId }, { count: 'exact' })
    .eq('id', ticketId);

  query =
    expectedCurrentAssigneeId === null
      ? query.is('assigned_to', null)
      : query.eq('assigned_to', expectedCurrentAssigneeId);

  const { count, error } = await query;
  if (error) throw toAppError(error);
  if (!count) throw new TicketAssignmentChangedError();
}

// ---------------------------------------------------------------------------
// Status transitions (story 09 — SCRUM-34)
// ---------------------------------------------------------------------------

/**
 * The `status` trigger's exceptions, keyed by the message fragments API §4.9
 * documents. Matched on the message rather than on `code`, because a
 * `RAISE EXCEPTION` reports the generic `P0001` for all three — the text is
 * the only thing that distinguishes them.
 */
const STATUS_ERROR_PATTERNS: readonly [RegExp, string][] = [
  [/resolution note is required/i, 'ticketDetail.status.errors.noteRequired'],
  [/illegal transition/i, 'ticketDetail.status.errors.illegalTransition'],
];

export function toStatusChangeError(error: unknown): AppError {
  const base = toAppError(error);
  const match = STATUS_ERROR_PATTERNS.find(([pattern]) => pattern.test(base.message));
  if (match) return { ...base, kind: 'validation', messageKey: match[1] };
  return base;
}

/** Thrown when the ticket's status changed between the sheet rendering and the PATCH landing. */
export class TicketStatusChangedError extends Error {
  constructor() {
    super('Ticket status changed before this update was applied');
  }
}

export type ChangeTicketStatusInput = {
  ticketId: string;
  to: TicketStatus;
  /** The status the sheet was rendered against — the compare-and-set guard. */
  expectedCurrentStatus: TicketStatus;
  /** Required when `to` is `resolved` (BRD §6, API §4.9). */
  resolutionNote?: string;
};

export async function changeTicketStatus(input: ChangeTicketStatusInput): Promise<void> {
  // Defence in depth only. The trigger is the enforcement (BRD §6 rule 1) —
  // this catches a UI bug that offered an illegal option, and must never be
  // presented as the security boundary.
  if (!canTransition(input.expectedCurrentStatus, input.to)) throw new TicketStatusChangedError();

  const payload: { status: TicketStatus; resolution_note?: string } = { status: input.to };
  if (requiresResolutionNote(input.to)) payload.resolution_note = input.resolutionNote?.trim();

  const { count, error } = await supabase
    .from('tickets')
    .update(payload, { count: 'exact' })
    .eq('id', input.ticketId)
    .eq('status', input.expectedCurrentStatus);

  if (error) throw toStatusChangeError(error);
  if (!count) throw new TicketStatusChangedError();
}

// ---------------------------------------------------------------------------
// Categories and ticket creation (story 13 — SCRUM-28)
// ---------------------------------------------------------------------------

const CATEGORY_SELECT = 'id, name_en, name_ar, sort_order';

type CategoryRow = LocalisedName & { id: string; sort_order: number };

/**
 * `department_id` is NULLABLE (`database.ts:146`), and a null means "available
 * to every department" — so this is an `or`, not an `eq`. An `eq` would hide
 * every shared category, which looks like an empty picker rather than a bug.
 *
 * `is_active` is filtered here rather than in the UI: an admin deactivating a
 * category must stop it being *chosen*, while tickets already carrying it keep
 * rendering its name through the detail screen's own join.
 *
 * `departmentId` is interpolated into the `or` grammar — safe because it is a
 * UUID from the agent's own profile, never user input. Do NOT extend this
 * pattern to a search term; `sanitizeSearchTerm` exists for exactly that.
 */
export async function fetchCategories(departmentId: string): Promise<TicketCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_SELECT)
    .eq('is_active', true)
    .or(`department_id.is.null,department_id.eq.${departmentId}`)
    .order('sort_order', { ascending: true })
    .returns<CategoryRow[]>();

  if (error) throw toAppError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: { name_en: row.name_en, name_ar: row.name_ar },
    sortOrder: row.sort_order,
  }));
}

export type CreateTicketParams = CreateTicketInput & {
  departmentId: string;
  branchId: string;
  createdBy: string;
};

/**
 * §4.7. `reference` and `status` are ABSENT from this payload on purpose: both
 * are generated server-side, `status` defaults to `new` (BRD `:615`), and
 * `reference` is the `TKT-YYYYMM-NNNNN` sequence (BRD `:616`). Sending either
 * would at best be ignored and at worst overwrite a generated value.
 *
 * Written as a fully-typed object literal, never a `Partial<>` or a spread —
 * the same discipline `postTicketMessage` documents above, and for the same
 * reason: the `Insert` type makes every one of these optional, so a dropped or
 * an extra key is a runtime bug, not a compile error.
 *
 * `priority` is always sent, defaulting to `'medium'` in the form's own state
 * rather than relying on the column default — BRD `:617` is a UI requirement
 * ("no priority chosen → medium is applied") and the agent must SEE which one
 * is applied before they save.
 */
export async function createTicket(params: CreateTicketParams): Promise<TicketDetail> {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      customer_id: params.customerId,
      subject: params.subject.trim(),
      description: params.description.trim() || null,
      category_id: params.categoryId,
      priority: params.priority,
      department_id: params.departmentId,
      branch_id: params.branchId,
      created_by: params.createdBy,
    })
    .select(DETAIL_SELECT)
    .single<TicketDetailRow>();

  if (error) throw toAppError(error);
  return toTicketDetail(data);
}
