-- Applied to the UMV Supabase project on 2026-09-17 after explicit user approval.
-- Purpose: enable the authenticated internal data dashboard.
-- No credentials, auth user IDs, or student rows are stored here.
-- The canonical migration history remains in Supabase; this file records the feature surface expected by data-dashboard/app.js.

-- Dashboard authorization
-- public.umv_dashboard_profiles
-- public.dashboard_has_role(text[])
-- public.dashboard_my_access()

-- Staging/review tables
-- public.umv_dashboard_audit
-- public.umv_reconciliation_reviews
-- public.umv_form_definitions
-- public.umv_form_field_mappings
-- public.umv_form_staging_records

-- Read-only governed RPCs used by the internal dashboard
-- public.dashboard_summary()
-- public.dashboard_search_students(text, integer)
-- public.dashboard_udise_students(text, integer)
-- public.dashboard_eshiksha_students(text, integer)
-- public.dashboard_ofss_students(text, integer)
-- public.dashboard_dropbox_students(text, text, integer)
-- public.dashboard_reconciliation_issues(integer)
-- public.dashboard_recent_imports(integer)
-- public.dashboard_audit_log(integer)
-- public.dashboard_form_definition(text)

-- SO2/SO3 form definitions and field mappings are seeded from the supplied forms.
-- Source snapshots remain immutable; corrections and generated-form preparation are kept in staging/review tables.
-- Browser clients use only the Supabase publishable key and authenticated RPCs guarded by dashboard roles.
