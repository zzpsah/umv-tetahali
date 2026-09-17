# Current State

Last verified: 2026-09-17

## Verified repository state
- Default branch: `main`.
- Current development branch: `staging-data-dashboard-v1`.
- Main remains production-facing and has not been changed by the dashboard work.
- Repository contains public/admin HTML pages, assets, DevOS context, and a new staging dashboard under `data-dashboard/` on the development branch.
- The staging dashboard includes Supabase Auth UI, role-aware access checks, overview cards, flexible search, reconciliation, imports/audit surfaces, Siwan Dropbox integration surface, and SO2/SO3 staging placeholders.
- A staging-only backend migration draft exists at `supabase/staging_dashboard.sql`.

## Database boundary
- Existing Supabase production source tables remain unchanged by this branch work.
- The staging migration has NOT been applied to the production Supabase database.
- Source snapshots must remain immutable from the dashboard.
- Dashboard/review/form data belongs in separate governed tables and RPCs.

## Safety
- Do not place credentials, service-role keys, private student exports, Aadhaar/PEN lists, or unnecessary personal/student data in GitHub.
- Browser code may use only the publishable Supabase key.
- Production schema/deployment changes require explicit approval.

## Development focus
- Keep search flexible and source-aware rather than threshold-only.
- Preserve mismatch visibility and use `NOT_FOUND` only when no plausible candidate exists.
- Inspect actual SO2/SO3 forms before defining real field mappings.
