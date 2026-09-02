/**
 * PostgREST parses `or=(...)` as a logic tree, so a term containing `,` `(` `)`
 * or `.` corrupts the filter string rather than failing loudly. `%` and `_` are
 * `ilike` wildcards and `*` is PostgREST's spelling of `%`. Strip all of them
 * instead of escaping — an agent searching for a literal comma is not a case
 * worth the parser risk.
 *
 * Promoted from `features/tickets/api.ts` (plan
 * `04-story-ticket-list-with-filters-SCRUM-27.md` task 2a) once
 * `features/customers/api.ts` became a second consumer (hard rule 2).
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,().*%_\\]/g, ' ').trim();
}
