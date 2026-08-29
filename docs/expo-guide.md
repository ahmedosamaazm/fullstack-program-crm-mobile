# Expo / React Native guide

Personal running notes on Expo and React Native concepts as I learn them on this project.
Each topic is its own section below — add new ones as they come up.

## Contents

- [Environment variables](#environment-variables)

---

## Environment variables

### Where they live

- `.env` — the real file, at the project root. Holds actual values. **Gitignored**, never committed.
- `.env.example` — checked into git. Documents which keys are expected, with placeholder values. Copy it to `.env` and fill in real values when setting up the project locally:

  ```bash
  cp .env.example .env
  ```

### The `EXPO_PUBLIC_` prefix

Expo's Metro bundler only inlines env vars whose name starts with `EXPO_PUBLIC_` into the JS bundle. Anything without that prefix stays server-side/build-time only and is **not** reachable from app code via `process.env`.

This is not a Node.js thing — it's an Expo/Metro build step. There's no `dotenv` package involved; it's built into `expo` itself.

### Why "PUBLIC" matters

Because `EXPO_PUBLIC_*` values get baked directly into the client bundle, **anyone who has the app can extract them** (unzip the bundle, read the string). That means:

- Only ever put publishable/anon keys in `EXPO_PUBLIC_*` vars — e.g. the Supabase **anon key**, which is safe to expose because Supabase enforces access with Row Level Security (RLS) policies on the backend.
- **Never** put a secret/service-role key, or anything that grants privileged access, in an `EXPO_PUBLIC_*` var.

### How to read one in code

```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

See `src/core/lib/supabase.ts` for the real usage — it reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` and throws early if either is missing, so a misconfigured `.env` fails loudly at startup instead of silently breaking network calls later.

### Picking up changes

Metro reads `.env` once, when the dev server starts. If you edit `.env` while `npm start` is already running, **restart the dev server** — the new value won't be picked up otherwise (hot reload won't do it).

### Current keys in this project

| Key | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project's API URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key — safe to expose client-side, protected by RLS |
