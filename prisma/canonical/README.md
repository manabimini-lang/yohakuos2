# Canonical fresh-database migrations

This directory is the migration entry point for an empty PostgreSQL database.
It is intentionally separate from `prisma/migrations`, whose `0_init` migration
is already recorded in Production and must remain checksum-stable even though
its literal `USER-DEFINED` column types make it unusable as an empty-database
bootstrap.

## Fresh database path

Provision the Supabase-compatible roles, ensure the `vector` extension package
is available, set `DATABASE_URL` and `DIRECT_URL`, then run from this directory:

```sh
npx prisma migrate deploy
```

The canonical baseline is a snapshot of the current validated Prisma physical
schema plus the YUI constraints, update triggers, grants, and RLS posture. It
contains both the existing `reflections` table and the separate
`yui_reflections` table. It creates no RLS policies.

## Existing Production path

Do not run this canonical chain against the existing Production database and do
not resolve its baseline there. Production retains the historical
`prisma/migrations` ledger. Its separate preflight is:

1. Verify backup/PITR, rotated credentials, both Vercel database variables, and
   current schema fingerprints.
2. Mark only fingerprint-equivalent historical migrations as applied with
   `prisma migrate resolve --applied`.
3. Run `prisma migrate deploy` from the repository root so that only the new,
   unapplied YUI migration executes.

Production execution is deliberately outside Sprint 62.
