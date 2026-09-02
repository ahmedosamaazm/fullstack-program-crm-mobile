import type { LocalisedName } from '@/core/utils';
import type { TicketPriority, TicketStatus } from '@/features/tickets';

/** A customer as it appears in a list row — the §3.1 projection, camelCased. */
export type CustomerListItem = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
  /** Tickets in `new`, `open` or `pending`. Never null — a customer with none is 0. */
  openTicketCount: number;
};

/** The three chips on the Customers list. */
export type CustomerFilter = 'all' | 'withOpenTickets' | 'recent';

/** One entry in a customer's `secondary_contacts` array (API §3.3's shape). */
export type SecondaryContact = {
  /** `'phone'` | `'email'` in the seed data; kept open — this is untyped `Json` in the DB. */
  type: string;
  value: string;
  label: string | null;
};

/** One editable secondary contact. `label` is Figma's "Contact name". */
export type SecondaryContactInput = {
  label: string;
  value: string;
};

/**
 * What the create/edit form collects. `departmentId` and `branchId` are NOT
 * here — they are read from the signed-in agent inside the mutation (API §3.3:
 * RLS rejects any other value), so a screen can neither set them nor forget them.
 *
 * `email` is `string`, not `string | null`: React Hook Form's controlled inputs
 * need `''`, and the empty-to-null conversion is the data layer's job.
 */
export type CreateCustomerInput = {
  fullName: string;
  phone: string;
  email: string;
  secondaryContacts: SecondaryContactInput[];
};

/**
 * One row of a customer's ticket history — API §3.5's embedded `tickets`
 * projection. Deliberately NOT `TicketListItem`: that type carries
 * `customerName`, which is the customer whose profile this is and therefore
 * says nothing here. The tab maps to `TicketListItem` at the render boundary
 * (`CustomerTicketsTab`) because `TicketRow` needs the field, and Figma does
 * show the name.
 */
export type CustomerTicket = {
  id: string;
  reference: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
};

/** The §3.5 projection, camelCased. Wider than `CustomerListItem` — this is one customer. */
export type CustomerDetail = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  secondaryContacts: SecondaryContact[];
  department: LocalisedName | null;
  branch: LocalisedName | null;
  createdAt: string;
  /** Every ticket, newest first — all statuses, `closed` included (BRD `:570`). */
  tickets: CustomerTicket[];
};

/**
 * One free-text note on a customer — the `customer_notes` projection, camelCased.
 *
 * `authorId` is NOT NULL in the deployed table, unlike `ticket_messages.author_id`
 * — a note always has a human author, so there is no "system note" case here.
 * `authorName` is still nullable: it comes from a `profiles` embed, which RLS can
 * legitimately return empty for an author outside the reader's own department.
 */
export type CustomerNote = {
  id: string;
  body: string;
  createdAt: string;
  /** `null` when the author's profile is not visible to this reader, not when there is no author. */
  authorName: string | null;
  authorId: string;
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
