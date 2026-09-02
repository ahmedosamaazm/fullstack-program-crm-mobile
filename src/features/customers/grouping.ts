import type { CustomerListItem } from './types';

export type CustomerGroupKey = 'a-f' | 'g-m' | 'n-z' | 'other';

export type CustomerGroup = {
  key: CustomerGroupKey;
  /** i18n key, e.g. `customers.groups.a-f`. */
  titleKey: string;
  data: CustomerListItem[];
};

/**
 * Buckets by the first letter of `fullName`, matching Figma's A – F / G – M /
 * N – Z headers. Names that start with no Latin letter — every Arabic name,
 * and this is an ARABIC-FIRST app — fall into `other`, which sorts last.
 * Figma shows Arabic names inside "A – F", which is placeholder behaviour
 * rather than a decision; see the story's open question 1.
 *
 * Incoming order is preserved inside each bucket — the server already sorted
 * by `full_name`; re-sorting client-side would fight the DB collation and
 * reorder rows as pages arrive. Runs over the accumulated pages, so a group
 * legitimately grows as the agent scrolls. Empty groups are omitted, always
 * in the fixed order a-f, g-m, n-z, other.
 */
export function groupCustomersAlpha(customers: CustomerListItem[]): CustomerGroup[] {
  const buckets: Record<CustomerGroupKey, CustomerListItem[]> = {
    'a-f': [],
    'g-m': [],
    'n-z': [],
    other: [],
  };

  for (const customer of customers) {
    const letter = customer.fullName.trim().charAt(0).toUpperCase();

    if (letter >= 'A' && letter <= 'F') buckets['a-f'].push(customer);
    else if (letter >= 'G' && letter <= 'M') buckets['g-m'].push(customer);
    else if (letter >= 'N' && letter <= 'Z') buckets['n-z'].push(customer);
    else buckets.other.push(customer);
  }

  const groups: CustomerGroup[] = [
    { key: 'a-f', titleKey: 'customers.groups.a-f', data: buckets['a-f'] },
    { key: 'g-m', titleKey: 'customers.groups.g-m', data: buckets['g-m'] },
    { key: 'n-z', titleKey: 'customers.groups.n-z', data: buckets['n-z'] },
    { key: 'other', titleKey: 'customers.groups.other', data: buckets.other },
  ];
  return groups.filter((group) => group.data.length > 0);
}
