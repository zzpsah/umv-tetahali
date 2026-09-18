# Tasks

## Active
- Keep DevOS portable context healthy and synchronized.
- Continue developing `data-dashboard/` on `staging-data-dashboard-v1` without merging to production.
- Validate the live Student Master output against source datasets and correct any over-simplified reconciliation rules.
- Expand the Student Master profile so all relevant source fields can be inspected without hiding important columns.
- Build human-readable reconciliation views with field-level mismatch highlighting and ambiguity handling.
- Build real SO2/SO3 queue preparation on top of the approved deterministic routing rules.
- Keep source snapshots immutable.

## Next
- Improve `dashboard_student_master` so Class XI comparison follows OFSS primary → e-Shiksha secondary → UDISE status → Dropbox fallback with full field-level evidence.
- Add proper source-specific mother name/mobile/category handling where the source actually contains those values; never invent missing values.
- Add snapshot/session/version browser for UDISE, e-Shiksha and OFSS.
- Add OFSS snapshot upload workflow: session + stream + CSV/XLSX preview + validation + duplicate detection + confirmation + versioning + history.
- Add snapshot-aware re-reconciliation so recommendations can be refreshed after a new import.
- Add SO2 autofill workspace:
  - candidate evidence,
  - UDISE search result,
  - Dropbox search result,
  - OFSS-first values,
  - e-Shiksha fallback,
  - human review before print.
- Add SO3 review workspace:
  - Existing Details from UDISE,
  - Proposed Details from OFSS first / e-Shiksha fallback,
  - per-field Accept / Keep Existing / Edit,
  - mandatory human review before print,
  - audit event on completion.
- Add a governed correction/review layer and human-readable audit/reporting filters.
- Add explicit ambiguity queue for multiple candidates and unresolved identity links.
- Document every meaningful database migration and dashboard behavior change in DevOS context.

## Completed / unblocked
- Official/reference SO2 and SO3 forms have been inspected and documented.
- Printable SO2/SO3 HTML forms are present.
- Dashboard auth/access RPC layer is available.
- Live Student Master RPC has been added and the staging UI no longer relies on hardcoded student demo rows.

## Safety / boundaries
- No private student exports in public GitHub.
- No service-role secret in browser code.
- No direct overwrite of immutable source snapshots.
- No merge to `main` or production website deployment without explicit approval.
