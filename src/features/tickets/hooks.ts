import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { agentKeys, useAgentProfile, useAuth } from '@/features/auth';
import { customerKeys } from '@/features/customers';

import {
  assignTicket,
  changeTicketStatus,
  claimTicket,
  createTicket,
  fetchAllTickets,
  fetchAllTicketsCount,
  fetchCategories,
  fetchMyOpenCount,
  fetchMyTickets,
  fetchMyTicketsCount,
  fetchResolvedTodayCount,
  fetchTicketDetail,
  fetchTicketEvents,
  fetchTicketMessages,
  fetchUnassignedCount,
  fetchUnassignedTickets,
  postTicketMessage,
  startOfTodayIso,
  type ChangeTicketStatusInput,
  type TicketListOptions,
} from './api';
import type { CreateTicketInput, MessageKind, TicketFilter } from './types';

/**
 * All ticket query keys share the `'tickets'` root so a single
 * `invalidateQueries({ queryKey: ticketKeys.all })` after a claim refetches
 * both lists, the chips on the Tickets screen, and all Home counts.
 *
 * The detail keys sit under `['tickets', <id>]` — ticket ids are UUIDs, so
 * they can never collide with the `'list'`/`'count'` segments above.
 */
export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filter: TicketFilter, userId: string, options: TicketListOptions = {}) =>
    ['tickets', 'list', filter, userId, options.limit ?? null, options.search ?? ''] as const,
  myOpenCount: (userId: string) => ['tickets', 'count', 'myOpen', userId] as const,
  myTicketsCount: (userId: string) => ['tickets', 'count', 'mine', userId] as const,
  unassignedCount: () => ['tickets', 'count', 'unassigned'] as const,
  allCount: () => ['tickets', 'count', 'all'] as const,
  resolvedTodayCount: (userId: string, day: string) =>
    ['tickets', 'count', 'resolvedToday', userId, day] as const,
  detail: (ticketId: string) => ['tickets', ticketId] as const,
  messages: (ticketId: string, kind: MessageKind) => ['tickets', ticketId, 'messages', kind] as const,
  events: (ticketId: string) => ['tickets', ticketId, 'events'] as const,
};

/** `YYYY-MM-DD` for the device's local day — forces a new query key past midnight. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useTicketList(filter: TicketFilter, options: TicketListOptions = {}) {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ticketKeys.list(filter, userId ?? '', options),
    queryFn: () => {
      if (filter === 'mine') return fetchMyTickets(userId as string, options);
      if (filter === 'unassigned') return fetchUnassignedTickets(options);
      return fetchAllTickets(options);
    },
    // 'unassigned' and 'all' don't need a user id, but the screen can switch to
    // 'mine' at any time — gate uniformly so the key namespace stays consistent.
    enabled: Boolean(userId),
  });
}

export function useMyTickets(limit?: number) {
  return useTicketList('mine', { limit });
}

export function useUnassignedTickets(limit?: number) {
  return useTicketList('unassigned', { limit });
}

export function useMyOpenCount() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ticketKeys.myOpenCount(userId ?? ''),
    queryFn: () => fetchMyOpenCount(userId as string),
    enabled: Boolean(userId),
  });
}

/** The "Mine" chip count — §4.4 (`new, open, pending`); not Home's `myOpen` stat. */
export function useMyTicketsCount() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ticketKeys.myTicketsCount(userId ?? ''),
    queryFn: () => fetchMyTicketsCount(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUnassignedCount() {
  return useQuery({
    queryKey: ticketKeys.unassignedCount(),
    queryFn: fetchUnassignedCount,
  });
}

/** The "All" chip count. */
export function useAllTicketsCount() {
  return useQuery({
    queryKey: ticketKeys.allCount(),
    queryFn: fetchAllTicketsCount,
  });
}

export function useResolvedTodayCount() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const day = todayKey();
  return useQuery({
    queryKey: ticketKeys.resolvedTodayCount(userId ?? '', day),
    queryFn: () => fetchResolvedTodayCount(userId as string, startOfTodayIso()),
    enabled: Boolean(userId),
  });
}

export function useClaimTicket() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: (ticketId: string) => claimTicket(ticketId, userId as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Ticket detail, messages and history (story 07 — SCRUM-30)
// ---------------------------------------------------------------------------

export function useTicketDetail(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => fetchTicketDetail(ticketId),
    enabled: Boolean(ticketId),
  });
}

export function useTicketMessages(ticketId: string, kind: MessageKind) {
  return useQuery({
    queryKey: ticketKeys.messages(ticketId, kind),
    queryFn: () => fetchTicketMessages(ticketId, kind),
    enabled: Boolean(ticketId),
  });
}

export function useTicketEvents(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.events(ticketId),
    queryFn: () => fetchTicketEvents(ticketId),
    enabled: Boolean(ticketId),
  });
}

export function usePostTicketMessage(ticketId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: (input: { body: string; isInternal: boolean }) =>
      postTicketMessage({ ticketId, authorId: userId as string, ...input }),
    onSuccess: (_message, input) => {
      // Only the thread that was posted to — the other kind cannot have changed,
      // and the lists don't show message counts.
      void queryClient.invalidateQueries({
        queryKey: ticketKeys.messages(ticketId, input.isInternal ? 'internal' : 'public'),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Assignment (story 08 — SCRUM-33)
// ---------------------------------------------------------------------------

export type AssignTicketInput = {
  ticketId: string;
  /** `null` unassigns. */
  assigneeId: string | null;
  /** The assignee the sheet was rendered against — the compare-and-set guard. */
  expectedCurrentAssigneeId: string | null;
};

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, assigneeId, expectedCurrentAssigneeId }: AssignTicketInput) =>
      assignTicket(ticketId, assigneeId, expectedCurrentAssigneeId),
    onSuccess: () => {
      // Lists, chip counts and Home's stats all move when ownership moves.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      // …and so do the workload numbers inside the assign sheet itself.
      void queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Status transitions (story 09 — SCRUM-34)
// ---------------------------------------------------------------------------

export function useChangeTicketStatus(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ChangeTicketStatusInput, 'ticketId'>) =>
      changeTicketStatus({ ticketId, ...input }),
    onSuccess: () => {
      // One key covers everything a status change moves: the detail row, the
      // history timeline, both lists, the three chip counts, and Home's
      // "Resolved today" — wider than `usePostTicketMessage`'s single-thread
      // invalidation on purpose, because a status change moves all of those.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      // A customer's ticket history now lives inside `['customers', id]`
      // (story 14). Without this, resolving a ticket leaves a stale badge on
      // the customer's Tickets tab until `staleTime` expires.
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Categories and ticket creation (story 13 — SCRUM-28)
// ---------------------------------------------------------------------------

/**
 * Reference data, keyed under its OWN root — not `['tickets', …]`. Creating a
 * ticket must not refetch the category list, and Home's every-refresh
 * `ticketKeys.all` invalidation must not either. Same reasoning as `agentKeys`.
 */
export const categoryKeys = {
  all: ['categories'] as const,
  list: (departmentId: string) => ['categories', 'list', departmentId] as const,
};

export function useCategories(enabled = true) {
  const profile = useAgentProfile();
  const departmentId = profile.data?.departmentId;
  return useQuery({
    queryKey: categoryKeys.list(departmentId ?? ''),
    queryFn: () => fetchCategories(departmentId as string),
    enabled: enabled && Boolean(departmentId),
    // Categories change when an admin edits them — roughly never during a shift.
    staleTime: 5 * 60_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const profile = useAgentProfile();

  return useMutation({
    mutationFn: (input: CreateTicketInput) =>
      createTicket({
        ...input,
        departmentId: profile.data?.departmentId as string,
        branchId: profile.data?.branchId as string,
        createdBy: session?.user.id as string,
      }),
    onSuccess: (ticket) => {
      // Every list and every chip count: an unassigned `new` ticket lands in
      // "Unassigned" and "All", and both counts move.
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      // A new ticket must appear in its customer's history (story 14).
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      // Seeded AFTER the invalidation — `ticketKeys.all` matches
      // `['tickets', id]` too, so seeding first would mark it stale at once.
      queryClient.setQueryData(ticketKeys.detail(ticket.id), ticket);
    },
  });
}
