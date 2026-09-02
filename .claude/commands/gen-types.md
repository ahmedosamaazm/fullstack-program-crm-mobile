---
description: Regenerate the Supabase database types, then typecheck — a schema change can break callers.
---

`src/core/types/database.ts` is **generated, never hand-written** (hard rule 6). This is the only
sanctioned way to change it.

## Steps

1. `npm run gen:types`
   - Needs Supabase auth. If it fails on authentication, do **not** work around it — tell the user
     to run `! npx supabase login` in this session, then rerun this command.
   - If the output is empty or not TypeScript (an error page, a login prompt), `git checkout --
     src/core/types/database.ts` to restore the previous version and stop. Never commit a broken
     types file.
2. `git diff --stat src/core/types/database.ts` and summarise what changed: tables, columns,
   enums, functions added or removed.
3. `npm run typecheck`. Errors here are **call sites the schema change broke** — list each with
   file:line and what the type used to be. Do not fix them in this command; that is feature work.
4. If the diff shows a new table, remind the user that its RLS policies are backend scope and to
   check `docs/phase1_backend_plan.md` before assuming the client can read or write it.

Never edit `database.ts` by hand to make typecheck pass — the pre-edit hook blocks it anyway.
