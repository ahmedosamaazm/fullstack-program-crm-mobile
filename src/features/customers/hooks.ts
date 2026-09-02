import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAgentProfile, useAuth } from '@/features/auth';

import {
  createCustomer,
  createCustomerNote,
  fetchCustomerAttachments,
  fetchCustomerDetail,
  fetchCustomerNotes,
  fetchCustomers,
  fetchCustomersCount,
  fetchRecentCustomersCount,
  fetchWithOpenTicketsCount,
  PAGE_SIZE,
  updateCustomer,
  uploadCustomerAttachment,
} from './api';
import type { CreateCustomerInput, CustomerFilter, PickedFile } from './types';

/**
 * A root separate from `['tickets', …]` — a claim cannot change a customer's
 * record, so `useClaimTicket` and `useAssignTicket` never refetch this.
 *
 * `useCreateTicket` and `useChangeTicketStatus` (story 14, SCRUM-25) DO
 * invalidate it: `customerKeys.detail(id)` now embeds the customer's ticket
 * history (`CustomerDetail.tickets`), so a new ticket or a status change must
 * reach this root or the customer's Tickets tab shows stale data.
 */
export const customerKeys = {
  all: ['customers'] as const,
  list: (filter: CustomerFilter, search: string) =>
    ['customers', 'list', filter, search] as const,
  count: (filter: CustomerFilter) => ['customers', 'count', filter] as const,
  /**
   * `['customers', <uuid>]` — a customer id can never collide with the
   * `'list'` / `'count'` segments above. This is the ONE cache entry story 11's
   * create redirect lands on, story 12's edit form reads and invalidates, and
   * SCRUM-25's Tickets tab extends. Do not add a second detail query.
   */
  detail: (customerId: string) => ['customers', customerId] as const,
  /**
   * `['customers', <uuid>, 'attachments']` — a SIBLING of `detail`, not a
   * second copy of it (story 24, SCRUM-26). Nests under `all`, so
   * `useCreateCustomer`/`useUpdateCustomer`'s existing `invalidateQueries({
   * queryKey: customerKeys.all })` also invalidates this — harmless, since the
   * query is `enabled`-gated on the Notes tab being open.
   */
  attachments: (customerId: string) => ['customers', customerId, 'attachments'] as const,
  /** `['customers', <uuid>, 'notes']` — a SIBLING of `detail`, same reasoning as `attachments`. */
  notes: (customerId: string) => ['customers', customerId, 'notes'] as const,
};

/**
 * BRD `:519` requires pagination — the one structural difference from the
 * Tickets list's flat `useQuery`. `getNextPageParam` returns a PAGE INDEX
 * (`allPages.length`), never `lastPage.length`: conflating the two would
 * silently re-fetch page 0 forever once a page comes back short.
 */
export function useCustomers(filter: CustomerFilter, search = '') {
  return useInfiniteQuery({
    queryKey: customerKeys.list(filter, search),
    queryFn: ({ pageParam }) => fetchCustomers({ filter, search, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
  });
}

/**
 * Search-only view of the same query — SCRUM-28's Create Ticket customer
 * picker. Shares `customerKeys.list('all', term)` with this screen, so a
 * picker search an agent already ran on the Customers tab is served from
 * cache. Not called anywhere in this story; exported for SCRUM-28.
 */
export function useCustomerSearch(search: string) {
  return useCustomers('all', search);
}

export function useCustomersCount() {
  return useQuery({
    queryKey: customerKeys.count('all'),
    queryFn: fetchCustomersCount,
  });
}

export function useWithOpenTicketsCount() {
  return useQuery({
    queryKey: customerKeys.count('withOpenTickets'),
    queryFn: fetchWithOpenTicketsCount,
  });
}

export function useRecentCustomersCount() {
  return useQuery({
    queryKey: customerKeys.count('recent'),
    queryFn: fetchRecentCustomersCount,
  });
}

/** The customer profile's single query — story 10 (SCRUM-24). */
export function useCustomerDetail(customerId: string) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => fetchCustomerDetail(customerId),
    enabled: Boolean(customerId),
  });
}

/**
 * The org fields come from the signed-in agent, never from the form — API §3.3:
 * "RLS rejects any department_id/branch_id that isn't the caller's own". The
 * screen disables Save until the profile has loaded rather than sending an empty
 * string, which would surface as an opaque foreign-key error.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const profile = useAgentProfile();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      createCustomer({
        ...input,
        departmentId: profile.data?.departmentId as string,
        branchId: profile.data?.branchId as string,
        createdBy: session?.user.id as string,
      }),
    onSuccess: (customer) => {
      // The list, all three chip counts, and any cached detail entry.
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      // …then seed the detail entry the redirect is about to read, so the
      // profile screen paints from the insert's own response. This MUST come
      // after the invalidation — `customerKeys.all` matches `['customers', id]`
      // too, so seeding first would mark the fresh entry stale immediately.
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    },
  });
}

export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => updateCustomer(customerId, input),
    onSuccess: (customer) => {
      // BOTH entries, per the intake: `customerKeys.all` covers the list and the
      // three chip counts; it also matches `['customers', id]`, so the detail is
      // refetched too. The explicit seed below is what makes the profile paint
      // with the new values on the very next frame rather than after a round
      // trip — the update's own response is authoritative. Invalidate first,
      // seed second, or the fresh entry is marked stale the moment it is written.
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.setQueryData(customerKeys.detail(customerId), customer);
    },
  });
}

// ---------------------------------------------------------------------------
// Notes and attachments (story 24 — SCRUM-26)
// ---------------------------------------------------------------------------

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
 * `enabled` is the tab's visibility, not just a truthy id. The Notes tab is the
 * third of three and is often never opened; firing this on every profile open
 * is the cost story 14's embed was right to avoid and this query would
 * reintroduce.
 */
export function useCustomerAttachments(customerId: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.attachments(customerId),
    queryFn: () => fetchCustomerAttachments(customerId),
    enabled: enabled && Boolean(customerId),
  });
}

/**
 * `branchId` and `departmentId` come from the signed-in AGENT, never from the
 * customer being viewed — exactly as `useCreateCustomer` does, and for a
 * sharper reason here: those two values are the first two segments of the
 * storage path, and the `storage.objects` policies compare them against
 * `current_branch()` and `current_department()`
 * (`docs/phase1_backend_plan.md:121-146`). A path built from the customer's org
 * would be refused for any customer outside the agent's own scope — and would
 * *appear* to work for every customer inside it, which is how this becomes a
 * bug found in production rather than in review.
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
