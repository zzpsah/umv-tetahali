# UMV Data Dashboard — Staging

This directory contains the first staging implementation of the UMV Tetahali data-management dashboard.

## Scope

- Supabase Auth login
- roles: `admin`, `operator`, `viewer`
- overview cards for UDISE, e-Shiksha Kosh, OFSS, core students, reconciliation and APAAR status
- flexible cross-source student search
- reconciliation review queue
- Siwan Dropbox as a fallback/reference source
- snapshot/import history
- audit surface
- SO2/SO3 staging workflow: form definition → field mapping → transform → validate → preview

## Safety model

- Production source snapshots are not overwritten by the dashboard.
- Source data stays in UDISE / e-Shiksha / OFSS / core tables.
- Manual corrections, reconciliation decisions and form preparation belong in separate staging/review tables.
- `NOT_FOUND` is reserved for cases where no reliable/plausible candidate exists after flexible search.
- DOB/father/name/class conflicts stay visible as discrepancy statuses.
- Do not commit passwords, service-role keys, private tokens, Aadhaar/PEN lists, student exports or other private student data to GitHub.

## Current state

Frontend files are implemented on the staging branch. The backend schema/RPC draft is in:

`/supabase/staging_dashboard.sql`

It has **not** been applied to the production Supabase database. Apply it only to an isolated Supabase development branch or after explicit production approval.

## Authentication bootstrap

After the staging migration is applied and an Auth user exists, the database administrator must add that Auth user UUID to `public.umv_dashboard_profiles` with one of:

- `admin`
- `operator`
- `viewer`

The dashboard will reject authenticated users who do not have an enabled dashboard profile.

## SO2 / SO3

SO2 and SO3 currently exist as staging placeholders only. Their actual field structure must be derived from the real official/sample forms before field mappings are added. Do not guess missing fields.

## Run locally / preview

Serve the repository as static files and open:

`data-dashboard/index.html`

The browser configuration in `config.js` uses only the Supabase publishable browser key. Never replace it with a service-role key.
