import { currentLocale, type Locale } from '@/core/lib/i18n';

/**
 * The `{ name_en, name_ar }` pair every reference table in the schema carries —
 * `departments`, `branches`, `categories`.
 */
export type LocalisedName = { name_en: string; name_ar: string };

/**
 * Picks the localised half of a name pair, falling back to the other language
 * when the preferred one is empty.
 *
 * Takes `locale` explicitly so it stays pure. Call it from the render layer,
 * never from `api.ts`: resolving at fetch time bakes the language into the
 * TanStack Query cache, and every cached department, branch and category name
 * then stays in the old language after a switch. Components should prefer
 * `useLocalisedName()`, which binds the active locale reactively.
 *
 * The `currentLocale()` default covers the few non-render callers.
 */
export function localisedName(row: LocalisedName | null, locale: Locale = currentLocale()): string | null {
  if (!row) return null;
  const preferred = locale === 'ar' ? row.name_ar : row.name_en;
  const fallback = locale === 'ar' ? row.name_en : row.name_ar;
  return preferred || fallback || null;
}
