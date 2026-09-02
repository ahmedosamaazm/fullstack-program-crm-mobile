import type { Database } from '@/core/types/database';

/**
 * `notifications.type` is `text` in the schema, not an enum
 * (`docs/phase1_backend_plan.md:247`) — so this union is the FIVE types the
 * product defines, and `NotificationRow` (the API layer) deliberately types
 * the field as the raw `string` the database can actually return. Narrowing
 * happens once, at the render boundary, with a default branch. Typing this as
 * the union at the API layer would be a lie the compiler cannot catch.
 */
export type NotificationType = 'assigned' | 'reply' | 'status' | 'unassigned' | 'rating';

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'assigned',
  'reply',
  'status',
  'unassigned',
  'rating',
];

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

/** One alert, camelCased. Mirrors the §9 projection. */
export type NotificationItem = {
  id: string;
  /** `null` when the alert is not about a ticket — the column is nullable. */
  ticketId: string | null;
  /** Raw. Compare with `isNotificationType` before keying a style off it. */
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
};

/** Not exported from the barrel — proves at compile time that the row shape tracks the schema. */
export type _SchemaCheck = Database['public']['Tables']['notifications']['Row'];
