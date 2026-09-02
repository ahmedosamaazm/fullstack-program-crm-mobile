import type { Database } from '@/core/types/database';
import type { LocalisedName } from '@/core/utils';

export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];

/** The three chips on the Tickets list (BRD US-011, API §4.1-4.3). */
export type TicketFilter = 'mine' | 'unassigned' | 'all';

/** A ticket as it appears in a list row — the §4.1/§4.2 projection, camelCased. */
export type TicketListItem = {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  customerName: string | null;
};

export type WorkloadCounts = {
  myOpen: number;
  unassigned: number;
  resolvedToday: number;
};

/** The §4.6 projection, camelCased. Wider than `TicketListItem` — this is one ticket. */
export type TicketDetail = {
  id: string;
  reference: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  resolutionNote: string | null;
  customer: { id: string; fullName: string; phone: string; email: string | null } | null;
  category: LocalisedName | null;
  assigneeName: string | null;
  /** The assignee's profile id — the compare-and-set guard for `assignTicket` (story 08). */
  assigneeId: string | null;
};

/**
 * A selectable category — the `categories` projection, camelCased. `name` is
 * the raw pair; resolve it at render with `useLocalisedName()`.
 */
export type TicketCategory = {
  id: string;
  name: LocalisedName;
  sortOrder: number;
};

/**
 * What the create form collects. `departmentId`, `branchId` and `createdBy` are
 * NOT here — they come from the signed-in agent inside the mutation. Neither are
 * `reference` or `status`: both are server-generated (API §4.7), and a field for
 * either would be a field an agent could get wrong.
 */
export type CreateTicketInput = {
  customerId: string;
  subject: string;
  description: string;
  categoryId: string;
  priority: TicketPriority;
};

/** Which thread a message belongs to. The two are fetched separately, never filtered client-side. */
export type MessageKind = 'public' | 'internal';

export type TicketMessage = {
  id: string;
  body: string;
  createdAt: string;
  isInternal: boolean;
  authorName: string | null;
  /** null when the row has no `author_id` — a customer-authored message. */
  authorId: string | null;
};

export type TicketEventType = Database['public']['Enums']['event_type'];

export type TicketEvent = {
  id: string;
  eventType: TicketEventType;
  fromValue: string | null;
  toValue: string | null;
  createdAt: string;
  actorName: string | null;
};
