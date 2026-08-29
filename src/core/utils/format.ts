import { currentLocale } from '@/core/lib/i18n';

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

export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(tag(locale)).format(value);
}

/** Caps a count for badges: 100 renders as "99+". */
export function formatCount(value: number, max = 99, locale?: string): string {
  return value > max ? `${formatNumber(max, locale)}+` : formatNumber(value, locale);
}

/** Initials for Avatar fallbacks. Handles Arabic and Latin names alike. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}
