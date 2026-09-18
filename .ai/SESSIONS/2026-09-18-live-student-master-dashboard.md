# Session — 2026-09-18 — Live Student Master Dashboard

## Scope
Convert the staging data dashboard from a UI/demo shell into a source-backed internal Student Master and record the agreed reconciliation/form-routing rules in DevOS.

## Repository
- Repo: `zzpsah/umv-tetahali`
- Branch: `staging-data-dashboard-v1`
- Production branch `main` was not merged/changed by this session.

## Application changes
- Staging dashboard centered around `All Students / Student Master`.
- Important identity/operational columns exposed by default.
- Column picker / All Columns supported.
- Student Key opens a detailed student profile/comparison view.
- Source-presence and issue/recommended-action badges added.
- Reconciliation, SO2, SO3, Dropbox import, snapshot and audit surfaces retained.
- Hardcoded realistic demo student rows were removed from the active staging app.
- `data-dashboard/app-v2.js` was connected to live Supabase RPC data.

## Database changes
- Added/updated guarded `public.dashboard_student_master(limit_n integer)` RPC in Supabase.
- RPC execution is restricted to authenticated dashboard roles via the existing role guard.
- Source snapshot tables were not overwritten by the dashboard RPC.

## Durable rules confirmed
### Class XI source priority
1. OFSS — primary admission source.
2. e-Shiksha Kosh — secondary source.
3. UDISE — current enrollment/status reference.
4. Siwan Dropbox — fallback/history/import reference.

### Action routing
- UDISE present, no material conflict → `Mapped`.
- UDISE missing + Dropbox found → `Import from Dropbox`.
- Class XI OFSS-linked + UDISE missing + Dropbox not found → `SO2 Candidate`.
- UDISE present + relevant ambiguity/conflict → `SO3 Review`.
- Other unresolved cases → `Manual Review`.

### SO2
- Autofill from OFSS first, e-Shiksha fallback where fields actually exist.
- Human verification before final print.
- Do not fabricate unavailable fields.

### SO3
- Existing Details from UDISE.
- Proposed Details from OFSS first, e-Shiksha fallback/reference.
- Field conflicts highlighted.
- Human review mandatory before final printing.
- No direct UDISE overwrite.

## Important correction
A realistic demo student row was previously displayed without live verification. This was corrected by removing hardcoded student rows from the active staging app. Future live staging views must show only source-backed records unless an explicitly labeled demo mode is used.

## Follow-up
- Strengthen field-level reconciliation beyond the current first-pass RPC.
- Add full snapshot/session/version browser and OFSS upload workflow.
- Add audited review/correction layer.
- Implement SO2/SO3 review gating and autofill workflow.
- Re-run DevOS generated state synchronization as normal; do not manually edit `.ai/STATE-INDEX.md`.
