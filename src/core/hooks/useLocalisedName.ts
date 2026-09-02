import { useCallback } from 'react';

import { useLocale } from '@/core/lib/i18n';
import { localisedName, type LocalisedName } from '@/core/utils';

/**
 * Resolves `{ name_en, name_ar }` pairs against the active locale, re-binding
 * whenever the language changes. This is why `api.ts` returns the raw pair:
 * the query cache stays locale-independent, so a switch needs no invalidation
 * and no refetch — the same cached row simply renders in the other language.
 */
export function useLocalisedName(): (row: LocalisedName | null) => string | null {
  const { locale } = useLocale();
  return useCallback((row: LocalisedName | null) => localisedName(row, locale), [locale]);
}
