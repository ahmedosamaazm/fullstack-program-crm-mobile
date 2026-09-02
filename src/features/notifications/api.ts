import { supabase } from '@/core/lib/supabase';
import { toAppError } from '@/core/utils';

import type { NotificationItem } from './types';

const LIST_SELECT = 'id, ticket_id, type, title, body, is_read, created_at';

type NotificationRow = {
  id: string;
  ticket_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

function toItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * `recipient_id` is filtered explicitly even though `select_own` RLS already
 * scopes every query to the signed-in agent — a query whose correctness is
 * invisible in the query text is a query nobody can review.
 */
export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(LIST_SELECT)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw toAppError(error);
  return (data ?? []).map(toItem);
}

/** The Home bell's badge. `head: true` sends no rows over the wire. */
export async function fetchUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw toAppError(error);
  return count ?? 0;
}

/**
 * Deliberately no `{ count: 'exact' }` compare-and-set here, unlike
 * `claimTicket` (tickets/api.ts) — marking an already-read alert read is
 * idempotent, and a zero-row result means nothing went wrong. Treating a
 * double tap as an error would be the wrong behaviour, not a safety net.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw toAppError(error);
}

/**
 * `.eq('is_read', false)` bounds the write to rows that actually change —
 * setting `true` on an already-`true` row is harmless, but this matters the
 * day an agent has hundreds of alerts.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) throw toAppError(error);
}
