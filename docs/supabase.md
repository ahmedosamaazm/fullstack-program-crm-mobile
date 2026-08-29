# Supabase in this project

Personal running notes on the Supabase setup — what was built, why it looks the way it does, and how to keep it up to date. Companion to [expo-guide.md](./expo-guide.md) (env vars are documented there since that's an Expo mechanism, not a Supabase one).

## Contents

- [The client](#the-client)
- [Generated database types](#generated-database-types)
- [Error normalization](#error-normalization)

---

## The client

`src/core/lib/supabase.ts` creates one typed Supabase client, shared across the app.

```ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
```

Points worth remembering:

- **`createClient<Database>`** — the generic type parameter is what makes every table query, insert, and update fully typed (autocomplete on column names, correct return shapes). `Database` comes from the generated types file, not written by hand.
- **`storage: AsyncStorage`** — on native there's no `localStorage`, so the Supabase JS client is told to persist the session (refresh token etc.) in `@react-native-async-storage/async-storage` instead. Without this, users would be logged out every time the app restarts.
- **`autoRefreshToken: true`** — the client refreshes the access token in the background before it expires, so API calls don't start failing mid-session.
- **`detectSessionInUrl: Platform.OS === 'web'`** — this handles the OAuth-redirect case where Supabase puts a session token in the URL after a login redirect. Only the web build has a URL to parse; native apps don't, so it's off there.
- The URL and anon key come from `process.env.EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — see the [env vars section](./expo-guide.md#environment-variables) of the Expo guide. The client throws immediately if either is missing, rather than failing later on the first query.

## Generated database types

`src/core/types/database.ts` is **never hand-written**. It's regenerated from the live database schema with the Supabase CLI:

```bash
npx supabase gen types typescript --project-id svcxmjibmgjtaxuzrquf > src/core/types/database.ts
```

This requires being logged in via Supabase auth (`npx supabase login`), so it's run manually, not in CI.

Why this matters: every table's `Row`, `Insert`, and `Update` shapes, every enum, and every foreign-key relationship in the file mirror the actual Postgres schema. If a column is added/renamed/dropped in the database, the fix is to **re-run the command**, not to edit the file — hand edits would just get overwritten and would drift from reality anyway.

Helper types exported from the file (`Tables<'tickets'>`, `TablesInsert<'tickets'>`, `Enums<'ticket_status'>`, etc.) are what feature code should import instead of writing out `Database['public']['Tables']['tickets']['Row']` by hand each time.

## Error normalization

Supabase (via PostgREST) doesn't throw JS-native errors with a `.status` — it returns objects with fields like `message` and a `code` (e.g. `"PGRST116"`, or a stringified HTTP-like code). `src/core/utils/errors.ts` exists to flatten that — and fetch/network failures, and anything else thrown — into one shape (`AppError`) the rest of the app can branch on:

```ts
export type AppError = {
  kind: 'network' | 'auth' | 'notFound' | 'validation' | 'server' | 'unknown';
  message: string;      // developer-facing, never rendered
  status?: number;
  messageKey: string;   // i18n key the UI renders instead
  cause?: unknown;
};
```

`toAppError(error)` is the single entry point. It's meant to be called **at the data-layer boundary** (where a Supabase call happens), not scattered through business logic — per this repo's rule that errors are caught once, mapped once, and everything above that layer just deals with `AppError`.

It's also used outside error *display*: `src/core/lib/query-client.ts` calls `toAppError` inside its retry logic, so a 4xx (auth/validation) failure is never retried, while transient/server errors get a couple of retries.
