# Supabase production state

The connected production project `qdfasvoyffrrhesyheba` has already received the completion/hardening migrations through the Supabase connection used during this build. The local migration-history file should be synchronized with `supabase db pull` before using `supabase db push` so the generated migration files match the production schema.

Implemented in production: completion/waiting-for-verification/reopened statuses, college-scoped complaint numbering, duplicate detection with pg_trgm, protected workflow functions, verification rules, active QR resolution, college suspension checks, and public privacy-safe issue/history functions.
