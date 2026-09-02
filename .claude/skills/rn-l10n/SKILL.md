---
name: rn-l10n
description: Add, rename, or update translation keys in this repo's i18next locale files — "add a string for X", "rename key A to B", "Arabic as well", "remove hardcoded text", or any edit touching src/core/lib/i18n/locales/*.json. Enforces both-languages, per-feature namespaces, Arabic plural forms, and hard rule 7.
argument-hint: "<key/term and change>"
user-invocable: true
---

# L10n — locale JSON edits done right in one pass

Every locale change follows the same invariants; this skill exists so none is forgotten mid-edit.
Arabic is the **primary** language here, not the translation.

## Invariants (all edits)

1. **Both files, always.** Every key lands in `src/core/lib/i18n/locales/ar.json` AND `en.json` in
   the same pass. "English as well" must never be a follow-up. If the user gives one language,
   draft the other and mark it `<!-- review -->` in your report, never in the JSON.
   The post-edit hook fails the edit if the key trees diverge — treat that as a hard stop.
2. **Namespace per feature.** Top-level keys are feature namespaces (`home`, `tickets`,
   `ticketDetail`, `customers`, `customerNotes`, `profile`, …) plus the shared ones (`common`,
   `field`, `states`, `settings`, `placeholder`, `tabs`, `file`). A new feature gets a new
   namespace; a string used by two features goes under `common`. Never put a feature string in
   `common` "to be safe".
3. **Arabic plurals are six-way.** A count-bearing key needs `_one` + `_other` in `en.json` and
   `_zero` `_one` `_two` `_few` `_many` `_other` in `ar.json` (see `customers.rowLabel_*` for the
   house pattern). i18next picks the form via `Intl.PluralRules`; a missing `_few` in Arabic
   shows the wrong grammar for 3–10, not an error. The hook compares *base* keys, so it will
   not catch a missing plural form — you must.
4. **Interpolation** is `{{name}}`. Keep placeholder names identical across both languages.
5. **Hard rule 7 — DB-localised names are NOT translation keys.** Department, branch and
   category names come from the database as `{ name_en, name_ar }` and are resolved at render
   with `useLocalisedName()`. Never add a locale key for something the DB already localises, and
   never resolve locale in `api.ts`.
6. **No generation step.** i18next reads the JSON directly. There is nothing to run — but the
   post-edit hook runs on every save, so an edit that leaves the JSON invalid is rejected.
7. When reporting or committing, reference **keys, not translation values**.

## By operation

### Add key(s)
Grep both files for an existing key with the same meaning — reuse beats duplicate. Add to both
files under the right namespace → wire call sites with `t('namespace.key')` (components) — never
`i18n.t()` in a render path. Read locale through `useLocale()` if the component needs it, never
`currentLocale()` or `I18nManager` (CLAUDE.md "RTL and locale").

### Update value(s)
Edit both files, or the one language the user explicitly scoped. Say which.

### Rename key
Update both files → grep `'oldNamespace.oldKey'` across `src/` and update every call site
(including `i18nKey` props and `t(` calls built from a prefix) → `npm run typecheck`.

### Term sweep (one word across many values, e.g. العميل → المتعامل)
1. Grep both files for the term; list every key + value.
2. **Confirm scope before editing** — the user usually means one namespace, not the whole app.
3. Apply to the confirmed set in both languages where the term appears.

### Remove hardcoded strings
Grep `src/features` and `src/core/components` for literal Arabic or English UI text inside JSX or
`accessibilityLabel`s → replace with new keys (Add flow). Note that `Text` from
`@/core/components` is the only text primitive (single-font rule), so every literal is in a
`<Text>` child or a string prop.

## Common mistakes

- Editing `en.json` first and treating Arabic as the follow-up — invariant 1, and backwards for
  this app.
- Adding `_one`/`_other` to Arabic only — invariant 3.
- A key for a category or department name — invariant 5; that is `useLocalisedName()`.
- Reading `I18nManager.isRTL` to pick a string — direction is React state; use `useDirection()`.
