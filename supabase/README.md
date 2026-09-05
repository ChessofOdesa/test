# Supabase database setup

For a new or empty Supabase project, open **SQL Editor**, create a new query for
each file, paste the complete file, and run the migrations in this exact order:

1. `20260309155255_6c312438-0cdf-4893-b5b0-4c8e6ee7b1f7.sql`
2. `20260310070109_df13d73c-5207-4f9c-9046-28bd4341feed.sql`
3. `20260401092414_62ab9f15-a08f-4151-8fe2-25f867bdbc9e.sql`
4. `20260403054139_a61b0655-1d9b-44f2-bac7-e3cd45d22b34.sql`
5. `20260403054148_80c74ef1-2dfe-4a37-80a0-5db637ccedeb.sql`
6. `20260416000000_add_quests_system.sql`
7. `20260423000000_add_profile_auth_fields.sql`
8. `20260826000000_secure_profiles_and_game_access.sql`
9. `20260904000000_online_game_persistence_and_ratings.sql`
10. `20260905000000_lichess_evaluation_cache.sql`

Run every file separately and wait for a successful result before continuing.
Do not rerun files that already completed successfully. The final migration
checks for the required base tables and reports which earlier migration is
missing instead of failing later with an unclear relation error.

The old `req_key is not a known variable` error in the quests migration is fixed
in the repository version. Always copy the current file from the `main` branch.

After migration 9 succeeds, add `SUPABASE_SECRET_KEY` only to the Render online
server. Never add this key to Vercel, a `VITE_*` variable, client code, or Git.

Migration 10 creates a private server-only cache for Lichess position
evaluations. It is safe to run after migration 9 and does not require any new
environment variable. Browser users cannot read or change this table directly.
