-- STAGING-ONLY migration draft for UMV Data Dashboard.
-- Do NOT apply to production until explicitly approved.
-- No student records or secrets are stored in this repository file.

create extension if not exists pg_trgm with schema extensions;

create table if not exists public.umv_dashboard_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','operator','viewer')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.umv_dashboard_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.umv_reconciliation_reviews (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_record_id text not null,
  student_key uuid,
  student_name text,
  status text not null check (status in (
    'MATCHED','MATCHED_WITH_MINOR_VARIATION','DOB_MISMATCH','FATHER_MISMATCH',
    'CLASS_MISMATCH','MULTIPLE_CANDIDATES','MANUAL_REVIEW','NOT_FOUND'
  )),
  reason text,
  candidate_source text,
  candidate_record_id text,
  candidate_payload jsonb,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_name, source_record_id)
);

create table if not exists public.umv_form_definitions (
  id uuid primary key default gen_random_uuid(),
  form_code text not null,
  version_no integer not null default 1,
  title text not null,
  status text not null default 'STAGING' check (status in ('STAGING','ACTIVE','RETIRED')),
  source_description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(form_code, version_no)
);

create table if not exists public.umv_form_field_mappings (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references public.umv_form_definitions(id) on delete cascade,
  field_key text not null,
  field_label text not null,
  field_order integer not null default 0,
  required boolean not null default false,
  source_name text,
  source_field text,
  transform_rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(form_definition_id, field_key)
);

create table if not exists public.umv_form_staging_records (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references public.umv_form_definitions(id),
  student_key uuid,
  source_payload jsonb not null default '{}'::jsonb,
  transformed_payload jsonb not null default '{}'::jsonb,
  validation_status text not null default 'MANUAL_REVIEW' check (validation_status in ('READY','MISSING','CONFLICT','MANUAL_REVIEW')),
  validation_notes jsonb not null default '[]'::jsonb,
  manual_overrides jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.umv_form_definitions(form_code, version_no, title, status, source_description)
values
  ('SO2',1,'SO2 Form — staging placeholder','STAGING','Actual form structure pending sample/official form inspection'),
  ('SO3',1,'SO3 Form — staging placeholder','STAGING','Actual form structure pending sample/official form inspection')
on conflict (form_code, version_no) do nothing;

alter table public.umv_dashboard_profiles enable row level security;
alter table public.umv_dashboard_audit enable row level security;
alter table public.umv_reconciliation_reviews enable row level security;
alter table public.umv_form_definitions enable row level security;
alter table public.umv_form_field_mappings enable row level security;
alter table public.umv_form_staging_records enable row level security;

create or replace function public.dashboard_has_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.umv_dashboard_profiles p
    where p.user_id = auth.uid()
      and p.enabled = true
      and p.role = any(allowed_roles)
  );
$$;

revoke all on function public.dashboard_has_role(text[]) from public;
grant execute on function public.dashboard_has_role(text[]) to authenticated;

create policy "dashboard profile self read" on public.umv_dashboard_profiles
for select to authenticated
using (user_id = auth.uid());

create policy "dashboard admin profile manage" on public.umv_dashboard_profiles
for all to authenticated
using (public.dashboard_has_role(array['admin']))
with check (public.dashboard_has_role(array['admin']));

create policy "dashboard audit read" on public.umv_dashboard_audit
for select to authenticated
using (public.dashboard_has_role(array['admin','operator']));

create policy "dashboard audit insert" on public.umv_dashboard_audit
for insert to authenticated
with check (actor_user_id = auth.uid() and public.dashboard_has_role(array['admin','operator']));

create policy "dashboard review read" on public.umv_reconciliation_reviews
for select to authenticated
using (public.dashboard_has_role(array['admin','operator','viewer']));

create policy "dashboard review write" on public.umv_reconciliation_reviews
for all to authenticated
using (public.dashboard_has_role(array['admin','operator']))
with check (public.dashboard_has_role(array['admin','operator']));

create policy "dashboard form definition read" on public.umv_form_definitions
for select to authenticated
using (public.dashboard_has_role(array['admin','operator','viewer']));

create policy "dashboard form definition write" on public.umv_form_definitions
for all to authenticated
using (public.dashboard_has_role(array['admin','operator']))
with check (public.dashboard_has_role(array['admin','operator']));

create policy "dashboard form mapping read" on public.umv_form_field_mappings
for select to authenticated
using (public.dashboard_has_role(array['admin','operator','viewer']));

create policy "dashboard form mapping write" on public.umv_form_field_mappings
for all to authenticated
using (public.dashboard_has_role(array['admin','operator']))
with check (public.dashboard_has_role(array['admin','operator']));

create policy "dashboard form staging read" on public.umv_form_staging_records
for select to authenticated
using (public.dashboard_has_role(array['admin','operator','viewer']));

create policy "dashboard form staging write" on public.umv_form_staging_records
for all to authenticated
using (public.dashboard_has_role(array['admin','operator']))
with check (public.dashboard_has_role(array['admin','operator']));

create or replace function public.dashboard_my_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select jsonb_build_object('allowed', enabled, 'role', role)
     from public.umv_dashboard_profiles where user_id = auth.uid()),
    jsonb_build_object('allowed', false, 'role', null)
  );
$$;

revoke all on function public.dashboard_my_access() from public;
grant execute on function public.dashboard_my_access() to authenticated;

create or replace function public.dashboard_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, core, udise, e_shiksha_kosh, ofss
as $$
begin
  if not public.dashboard_has_role(array['admin','operator','viewer']) then
    raise exception 'not authorized';
  end if;
  return jsonb_build_object(
    'udise_current', (select count(*) from udise.active_student_snapshots where is_current),
    'eshiksha_current', (select count(*) from e_shiksha_kosh.student_snapshots where is_current),
    'ofss_science', (select count(*) from ofss.science_2026_2028),
    'ofss_arts', (select count(*) from ofss.arts_2026_2028),
    'ofss_commerce', (select count(*) from ofss.commerce_2026_2028),
    'core_students', (select count(*) from core.students),
    'issue_count', (select count(*) from public.umv_reconciliation_reviews where status not in ('MATCHED','MATCHED_WITH_MINOR_VARIATION')),
    'apaar_missing', (select count(*) from udise.active_student_snapshots where is_current and (apaar_id is null or btrim(apaar_id)='' or upper(btrim(apaar_id)) in ('NA','N/A','NULL','NOT AVAILABLE')))
  );
end;
$$;

revoke all on function public.dashboard_summary() from public;
grant execute on function public.dashboard_summary() to authenticated;

create or replace function public.dashboard_search_students(q text, limit_n integer default 100)
returns table(
  source_name text,
  source_identifier text,
  student_name text,
  father_name text,
  mother_name text,
  dob text,
  class_name text,
  match_reason text,
  score numeric
)
language plpgsql
stable
security definer
set search_path = public, core, udise, e_shiksha_kosh, ofss, extensions
as $$
declare
  needle text := lower(btrim(coalesce(q,'')));
begin
  if not public.dashboard_has_role(array['admin','operator','viewer']) then raise exception 'not authorized'; end if;
  if needle = '' then return; end if;

  return query
  with candidates as (
    select 'UDISE'::text src, coalesce(u.pen,u.student_id,u.id::text) ident, u.student_name sname, u.father_name fname, u.mother_name mname,
           u.dob::text sdob, u.class_name sclass,
           greatest(extensions.similarity(lower(coalesce(u.student_name,'')), needle), extensions.similarity(lower(coalesce(u.father_name,'')), needle), extensions.similarity(lower(coalesce(u.mother_name,'')), needle)) sim,
           (lower(coalesce(u.student_name,'')) like '%'||needle||'%' or lower(coalesce(u.father_name,'')) like '%'||needle||'%' or lower(coalesce(u.mother_name,'')) like '%'||needle||'%' or lower(coalesce(u.pen,''))=needle or lower(coalesce(u.student_id,''))=needle or lower(coalesce(u.apaar_id,''))=needle) direct
    from udise.active_student_snapshots u where u.is_current
    union all
    select 'e-Shiksha Kosh', coalesce(e.student_code,e.id::text), e.student_name, e.father_name, null::text, e.dob::text, e.class_name,
           greatest(extensions.similarity(lower(coalesce(e.student_name,'')), needle), extensions.similarity(lower(coalesce(e.father_name,'')), needle)),
           (lower(coalesce(e.student_name,'')) like '%'||needle||'%' or lower(coalesce(e.father_name,'')) like '%'||needle||'%' or lower(coalesce(e.student_code,''))=needle or lower(coalesce(e.udise_pen,''))=needle)
    from e_shiksha_kosh.student_snapshots e where e.is_current
    union all
    select 'OFSS Science', coalesce(o.reference_no,o.id::text), o.applicant_name, o.father_name, null::text, o.dob::text, o.target_class,
           greatest(extensions.similarity(lower(coalesce(o.applicant_name,'')), needle), extensions.similarity(lower(coalesce(o.father_name,'')), needle)),
           (lower(coalesce(o.applicant_name,'')) like '%'||needle||'%' or lower(coalesce(o.father_name,'')) like '%'||needle||'%' or lower(coalesce(o.reference_no,''))=needle)
    from ofss.science_2026_2028 o
    union all
    select 'OFSS Arts', coalesce(o.reference_no,o.id::text), o.applicant_name, o.father_name, null::text, o.dob::text, o.target_class,
           greatest(extensions.similarity(lower(coalesce(o.applicant_name,'')), needle), extensions.similarity(lower(coalesce(o.father_name,'')), needle)),
           (lower(coalesce(o.applicant_name,'')) like '%'||needle||'%' or lower(coalesce(o.father_name,'')) like '%'||needle||'%' or lower(coalesce(o.reference_no,''))=needle)
    from ofss.arts_2026_2028 o
    union all
    select 'OFSS Commerce', coalesce(o.reference_no,o.id::text), o.applicant_name, o.father_name, null::text, o.dob::text, o.target_class,
           greatest(extensions.similarity(lower(coalesce(o.applicant_name,'')), needle), extensions.similarity(lower(coalesce(o.father_name,'')), needle)),
           (lower(coalesce(o.applicant_name,'')) like '%'||needle||'%' or lower(coalesce(o.father_name,'')) like '%'||needle||'%' or lower(coalesce(o.reference_no,''))=needle)
    from ofss.commerce_2026_2028 o
    union all
    select 'Siwan Dropbox', coalesce(d.student_pen,d.id::text), d.student_name, d.father_name, d.mother_name, null::text, d.eligible_class_to_import,
           greatest(extensions.similarity(lower(coalesce(d.student_name,'')), needle), extensions.similarity(lower(coalesce(d.father_name,'')), needle), extensions.similarity(lower(coalesce(d.mother_name,'')), needle)),
           (lower(coalesce(d.student_name,'')) like '%'||needle||'%' or lower(coalesce(d.father_name,'')) like '%'||needle||'%' or lower(coalesce(d.mother_name,'')) like '%'||needle||'%' or lower(coalesce(d.student_pen,''))=needle)
    from udise.siwan_dropbox_master_snapshots d where d.is_current
  )
  select c.src, c.ident, c.sname, c.fname, c.mname, c.sdob, c.sclass,
         case when c.direct then 'DIRECT_OR_EXACT_FIELD' when c.sim >= 0.70 then 'STRONG_SIMILARITY' else 'POSSIBLE_SIMILARITY' end,
         round(c.sim::numeric,3)
  from candidates c
  where c.direct or c.sim >= 0.30
  order by c.direct desc, c.sim desc, c.src, c.sname
  limit greatest(1, least(coalesce(limit_n,100),500));
end;
$$;

revoke all on function public.dashboard_search_students(text,integer) from public;
grant execute on function public.dashboard_search_students(text,integer) to authenticated;

create or replace function public.dashboard_reconciliation_issues(limit_n integer default 100)
returns table(status text, student_name text, source_name text, reason text)
language sql
stable
security definer
set search_path = public
as $$
  select r.status, r.student_name, r.source_name, r.reason
  from public.umv_reconciliation_reviews r
  where public.dashboard_has_role(array['admin','operator','viewer'])
    and r.status not in ('MATCHED','MATCHED_WITH_MINOR_VARIATION')
  order by case r.status when 'NOT_FOUND' then 1 when 'MANUAL_REVIEW' then 2 else 3 end, r.updated_at desc
  limit greatest(1, least(coalesce(limit_n,100),500));
$$;

revoke all on function public.dashboard_reconciliation_issues(integer) from public;
grant execute on function public.dashboard_reconciliation_issues(integer) to authenticated;

create or replace function public.dashboard_recent_imports(limit_n integer default 100)
returns table(source_name text, version_label text, row_count integer, imported_at timestamptz)
language sql
stable
security definer
set search_path = public, core
as $$
  select i.source_system, coalesce(i.academic_session,'') || ' / v' || coalesce(i.snapshot_version,0)::text,
         coalesce(i.inserted_rows,i.input_rows,0), i.imported_at
  from core.snapshot_import_runs i
  where public.dashboard_has_role(array['admin','operator','viewer'])
  order by i.imported_at desc
  limit greatest(1, least(coalesce(limit_n,100),500));
$$;

revoke all on function public.dashboard_recent_imports(integer) from public;
grant execute on function public.dashboard_recent_imports(integer) to authenticated;

create or replace function public.dashboard_audit_log(limit_n integer default 100)
returns table(created_at timestamptz, action text, entity_type text, reason text)
language sql
stable
security definer
set search_path = public
as $$
  select a.created_at, a.action, a.entity_type, a.reason
  from public.umv_dashboard_audit a
  where public.dashboard_has_role(array['admin','operator'])
  order by a.created_at desc
  limit greatest(1, least(coalesce(limit_n,100),500));
$$;

revoke all on function public.dashboard_audit_log(integer) from public;
grant execute on function public.dashboard_audit_log(integer) to authenticated;

create or replace function public.dashboard_form_definition(form_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with d as (
    select * from public.umv_form_definitions
    where upper(umv_form_definitions.form_code)=upper(dashboard_form_definition.form_code)
      and status in ('STAGING','ACTIVE')
    order by version_no desc limit 1
  )
  select case when not public.dashboard_has_role(array['admin','operator','viewer']) then
    jsonb_build_object('error','not authorized')
  else coalesce((
    select jsonb_build_object(
      'form_code', d.form_code,
      'version', d.version_no,
      'title', d.title,
      'status', d.status,
      'fields', coalesce((select jsonb_agg(jsonb_build_object('field_key',m.field_key,'field_label',m.field_label,'source_name',m.source_name,'source_field',m.source_field,'required',m.required) order by m.field_order) from public.umv_form_field_mappings m where m.form_definition_id=d.id),'[]'::jsonb)
    ) from d
  ), jsonb_build_object('form_code',upper(form_code),'version',null,'fields','[]'::jsonb)) end;
$$;

revoke all on function public.dashboard_form_definition(text) from public;
grant execute on function public.dashboard_form_definition(text) to authenticated;

-- Bootstrap is intentionally not automated. After an auth user exists, an authorized database administrator
-- may add that user's UUID to public.umv_dashboard_profiles with role admin/operator/viewer.
-- Never commit auth user IDs, emails, passwords or service-role keys to GitHub.
