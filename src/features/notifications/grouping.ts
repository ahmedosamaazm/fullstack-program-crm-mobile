import type { NotificationItem } from './types';

export type NotificationGroupKey = 'today' | 'earlier';

export type NotificationGroup = {
  key: NotificationGroupKey;
  /** i18n key — reuses `tickets.groups.*`; see the note below. */
  titleKey: string;
  data: NotificationItem[];
};

/**
 * Buckets by the DEVICE's calendar day, exactly as `tickets/grouping.ts` does
 * and for the same reason: an agent at +03:00 reading at 01:00 must see the
 * alert from ten minutes ago under "Today". Compare midnight-normalised dates
 * rather than subtracting milliseconds, so a DST shift cannot move an alert a
 * day.
 *
 * Only TWO buckets — BRD `:850` and Figma `7:3066` both say Today and
 * Earlier, so yesterday's alerts fall under Earlier. Do not reuse
 * `groupTicketsByDay`: its third bucket would render a "YESTERDAY" header
 * this screen has no design for, and its item type is a ticket.
 *
 * Incoming order is preserved — the fetcher already sorted `created_at` desc,
 * so "newest first" (BRD `:850`) is the fetcher's job, not this function's.
 * Unparseable timestamps land in `earlier` rather than throwing. Empty groups
 * are omitted, because `SectionList` renders a header for an empty section.
 */
export function groupNotificationsByRecency(
  items: NotificationItem[],
  now = new Date(),
): NotificationGroup[] {
  const buckets: Record<NotificationGroupKey, NotificationItem[]> = { today: [], earlier: [] };
  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const item of items) {
    const created = new Date(item.createdAt);
    const day = Number.isNaN(created.getTime())
      ? null
      : new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();

    if (day !== null && day >= midnightToday) buckets.today.push(item);
    else buckets.earlier.push(item);
  }

  const groups: NotificationGroup[] = [
    { key: 'today', titleKey: 'tickets.groups.today', data: buckets.today },
    { key: 'earlier', titleKey: 'tickets.groups.earlier', data: buckets.earlier },
  ];
  return groups.filter((group) => group.data.length > 0);
}
