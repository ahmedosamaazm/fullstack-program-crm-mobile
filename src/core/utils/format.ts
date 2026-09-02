import i18n, { currentLocale } from '@/core/lib/i18n';

/**
 * Locale-aware formatting. Everything here reads the active i18next language so
 * Arabic renders Arabic-Indic digits and Gregorian dates in the right order
 * without call sites needing to know which locale is active.
 */

function tag(locale?: string): string {
  return locale ?? currentLocale();
}

export function formatDate(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(tag(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(tag(locale), {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Time only, for message rows within a day's thread: "08:26" / "٠٨:٢٦". */
export function formatTime(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(tag(locale), { hour: '2-digit', minute: '2-digit' }).format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000_000],
  ['month', 2_592_000_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** "3 hours ago" / "منذ ٣ ساعات" — used for ticket activity timestamps. */
export function formatRelative(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diff = date.getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(tag(locale), { numeric: 'auto' });

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return formatter.format(Math.round(diff / 1000), 'second');
}

/** Suffix i18n keys for `formatRelativeShort`, e.g. `t('ticket.age.minute')` → "m" / "د". */
const SHORT_UNIT_KEY = {
  year: 'ticket.age.year',
  month: 'ticket.age.month',
  day: 'ticket.age.day',
  hour: 'ticket.age.hour',
  minute: 'ticket.age.minute',
  second: 'ticket.age.second',
} as const;

/** Compact ticket age for dense rows: "4m", "22m", "1h", "3d". Digits follow the active locale. */
export function formatRelativeShort(value: string | number | Date, locale?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const elapsed = Math.max(0, Date.now() - date.getTime());
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (elapsed >= ms) {
      const key = SHORT_UNIT_KEY[unit as keyof typeof SHORT_UNIT_KEY];
      return `${formatNumber(Math.floor(elapsed / ms), locale)}${i18n.t(key)}`;
    }
  }
  return `${formatNumber(Math.floor(elapsed / 1000), locale)}${i18n.t(SHORT_UNIT_KEY.second)}`;
}

export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(tag(locale)).format(value);
}

/** Caps a count for badges: 100 renders as "99+". */
export function formatCount(value: number, max = 99, locale?: string): string {
  return value > max ? `${formatNumber(max, locale)}+` : formatNumber(value, locale);
}

const SIZE_UNIT_KEY = ['file.size.b', 'file.size.kb', 'file.size.mb'] as const;

/**
 * "412 KB" / "١٫٤ م.ب". Binary units (1024), because that is what
 * `attachments.size_bytes` counts and what the bucket's 10 MB limit is measured
 * in — a decimal-MB label beside a binary-MB rejection is how a 10.4 MB file
 * comes to display as "10.4 MB" and be refused by a "10 MB" limit.
 *
 * Digits and the decimal separator follow the active locale via `formatNumber`;
 * the unit itself is an i18n key, because "KB" is "ك.ب" in Arabic.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < SIZE_UNIT_KEY.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatNumber(rounded, locale)} ${i18n.t(SIZE_UNIT_KEY[unit])}`;
}

/**
 * Initials for Avatar fallbacks. Handles Arabic and Latin names alike. Uses the
 * first two words, matching Figma (`Apex Logistics Group` → 'AL',
 * `أحمد محمد السيد` → 'أم'); person-name convention (first + last) deferred as
 * the story's open question 2.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase();
}

/**
 * Wraps a value in U+2066 (LRI) … U+2069 (PDI) so a phone number or reference
 * keeps its own left-to-right run inside an RTL line. `direction: 'ltr'` is not
 * an option — React Native does not apply it per-node on Android.
 *
 * Promoted from `features/customers/components/CustomerRow.tsx` (plan
 * `10-story-customer-profile-view-SCRUM-24.md` task 5) on its second consumer.
 */
export function isolateLtr(value: string): string {
  return `⁦${value}⁩`;
}
