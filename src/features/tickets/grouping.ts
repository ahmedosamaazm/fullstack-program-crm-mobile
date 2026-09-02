import type { TicketListItem } from './types';

export type TicketGroupKey = 'today' | 'yesterday' | 'earlier';

export type TicketGroup = {
  key: TicketGroupKey;
  /** i18n key, e.g. `tickets.groups.today`. */
  titleKey: string;
  data: TicketListItem[];
};

/**
 * Buckets by the DEVICE's calendar day, not UTC — an agent at +03:00 working at
 * 01:00 must see the ticket they filed ten minutes ago under "Today". Compare
 * midnight-normalised dates rather than subtracting milliseconds, so a DST shift
 * cannot move a ticket a day. (The API's `toISOString().slice(0, 10)` form is
 * only acceptable for cache keys, not here.)
 *
 * Incoming order is preserved inside each bucket — the fetchers already sorted
 * by priority then recency. Unparseable timestamps land in `earlier` rather
 * than throwing. Empty groups are omitted: `SectionList` renders a header for
 * an empty section, and a bare "TODAY" rule over nothing is worse than no
 * header at all.
 */
export function groupTicketsByDay(
  tickets: TicketListItem[],
  now = new Date(),
): TicketGroup[] {
  const buckets: Record<TicketGroupKey, TicketListItem[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const midnightYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();

  for (const ticket of tickets) {
    const created = new Date(ticket.createdAt);
    const day = Number.isNaN(created.getTime())
      ? null
      : new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();

    if (day === null || day < midnightYesterday) buckets.earlier.push(ticket);
    else if (day >= midnightToday) buckets.today.push(ticket);
    else buckets.yesterday.push(ticket);
  }

  const groups: TicketGroup[] = [
    { key: 'today', titleKey: 'tickets.groups.today', data: buckets.today },
    { key: 'yesterday', titleKey: 'tickets.groups.yesterday', data: buckets.yesterday },
    { key: 'earlier', titleKey: 'tickets.groups.earlier', data: buckets.earlier },
  ];
  return groups.filter((group) => group.data.length > 0);
}
