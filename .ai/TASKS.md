# Tasks

## Active
- Keep DevOS portable context healthy and synchronized.
- Develop `data-dashboard/` on `staging-data-dashboard-v1` without changing production.
- Validate staging backend migration/RPCs on an isolated Supabase development branch before any production application.
- Keep flexible student search and discrepancy visibility aligned with DevOS reconciliation rules.

## Planned
- Add real SO2/SO3 field definitions only after official/sample forms are inspected.
- Add mapping editor, staged transformed records, validation and preview/output workflow for SO2/SO3.
- Add role administration and reconciliation-review actions to the dashboard UI.
- Add source-specific data tables/filters for UDISE, e-Shiksha Kosh, OFSS and Siwan Dropbox.
- Add correction-review workflow and audit events without overwriting source snapshots.
- Update semantic context when verified architecture, deployment, or product decisions change.

## Blocked
- Live dashboard data RPCs require the staging migration to be applied to an isolated Supabase development branch (preferred) or explicit approval for production.
- Real SO2/SO3 mapping is blocked until actual form samples/official structures are available.
