(() => {
  const cfg = window.UMV_CONFIG || {};
  const els = id => document.getElementById(id);
  let client = null;
  let currentUser = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = value => value == null ? '—' : String(value);

  function initClient() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      els('loginMsg').textContent = 'Missing staging config. Create data-dashboard/config.js from config.example.js.';
      return false;
    }
    client = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true,autoRefreshToken:true}});
    return true;
  }

  async function ensureAuthorized() {
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return showLogin();
    currentUser = session.user;
    const { data, error } = await client.rpc('dashboard_my_access');
    if (error || !data?.allowed) {
      await client.auth.signOut();
      els('loginMsg').textContent = 'Authenticated, but this account is not authorized for the UMV dashboard.';
      return showLogin();
    }
    els('who').textContent = `${currentUser.email || 'user'} · ${data.role || 'viewer'}`;
    showApp();
    await refreshOverview();
  }

  function showLogin() {
    els('loginView').classList.remove('hidden');
    els('appView').classList.add('hidden');
  }

  function showApp() {
    els('loginView').classList.add('hidden');
    els('appView').classList.remove('hidden');
  }

  function setPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav').forEach(b => b.classList.remove('bg-white/10'));
    els(`page-${name}`)?.classList.remove('hidden');
    document.querySelector(`.nav[data-page="${name}"]`)?.classList.add('bg-white/10');
    if (name === 'reconciliation') loadIssues('reconPanel', 200);
    if (name === 'imports') loadImports();
    if (name === 'audit') loadAudit();
  }

  function cardsHtml(summary) {
    const cards = [
      ['UDISE current', summary.udise_current],
      ['e-Shiksha current', summary.eshiksha_current],
      ['OFSS Science', summary.ofss_science],
      ['OFSS Arts', summary.ofss_arts],
      ['OFSS Commerce', summary.ofss_commerce],
      ['Core students', summary.core_students],
      ['Reconciliation issues', summary.issue_count],
      ['APAAR missing/placeholder', summary.apaar_missing]
    ];
    return cards.map(([label,value]) => `<div class="bg-white border rounded-2xl p-5"><div class="text-sm text-slate-500">${esc(label)}</div><div class="text-3xl font-black mt-2">${esc(fmt(value))}</div></div>`).join('');
  }

  async function refreshOverview() {
    els('summaryCards').innerHTML = '<div class="text-sm text-slate-500">Loading…</div>';
    const { data, error } = await client.rpc('dashboard_summary');
    if (error) {
      els('summaryCards').innerHTML = `<div class="text-sm text-rose-600">${esc(error.message)}</div>`;
      return;
    }
    els('summaryCards').innerHTML = cardsHtml(data || {});
    loadIssues('issuesPreview', 8);
  }

  async function loadIssues(targetId, limit = 100) {
    const target = els(targetId);
    target.innerHTML = 'Loading…';
    const { data, error } = await client.rpc('dashboard_reconciliation_issues', { limit_n: limit });
    if (error) return target.innerHTML = `<span class="text-rose-600">${esc(error.message)}</span>`;
    if (!data?.length) return target.innerHTML = '<span class="text-slate-500">No staged issues yet.</span>';
    target.innerHTML = `<div class="overflow-auto"><table class="w-full text-left text-xs"><thead><tr class="border-b"><th class="p-2">Status</th><th class="p-2">Student</th><th class="p-2">Source</th><th class="p-2">Reason</th></tr></thead><tbody>${data.map(r => `<tr class="border-b last:border-0"><td class="p-2 font-bold">${esc(r.status)}</td><td class="p-2">${esc(r.student_name)}</td><td class="p-2">${esc(r.source_name)}</td><td class="p-2">${esc(r.reason)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  async function searchStudents(query) {
    setPage('students');
    const target = els('searchResults');
    target.innerHTML = '<div class="p-5 text-sm text-slate-500">Searching full sources…</div>';
    const { data, error } = await client.rpc('dashboard_search_students', { q: query, limit_n: 100 });
    if (error) return target.innerHTML = `<div class="p-5 text-sm text-rose-600">${esc(error.message)}</div>`;
    if (!data?.length) return target.innerHTML = '<div class="p-5 text-sm text-slate-500">No reliable or plausible candidate returned.</div>';
    target.innerHTML = `<table class="w-full text-left text-xs"><thead><tr class="border-b bg-slate-50"><th class="p-3">Source</th><th class="p-3">Student</th><th class="p-3">Father</th><th class="p-3">Mother</th><th class="p-3">DOB</th><th class="p-3">Class</th><th class="p-3">Identifier</th><th class="p-3">Match</th></tr></thead><tbody>${data.map(r => `<tr class="border-b"><td class="p-3 font-bold">${esc(r.source_name)}</td><td class="p-3">${esc(r.student_name)}</td><td class="p-3">${esc(r.father_name)}</td><td class="p-3">${esc(r.mother_name)}</td><td class="p-3">${esc(r.dob)}</td><td class="p-3">${esc(r.class_name)}</td><td class="p-3">${esc(r.source_identifier)}</td><td class="p-3">${esc(r.match_reason)}</td></tr>`).join('')}</tbody></table>`;
  }

  async function loadImports() {
    const target = els('importsPanel'); target.innerHTML = 'Loading…';
    const { data, error } = await client.rpc('dashboard_recent_imports', { limit_n: 100 });
    if (error) return target.innerHTML = `<div class="text-sm text-rose-600">${esc(error.message)}</div>`;
    target.innerHTML = `<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead><tr class="border-b"><th class="p-3 text-left">Source</th><th class="p-3 text-left">Version</th><th class="p-3 text-left">Rows</th><th class="p-3 text-left">Imported</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-b"><td class="p-3">${esc(r.source_name)}</td><td class="p-3">${esc(r.version_label)}</td><td class="p-3">${esc(r.row_count)}</td><td class="p-3">${esc(r.imported_at)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  async function loadAudit() {
    const target = els('auditPanel'); target.innerHTML = 'Loading…';
    const { data, error } = await client.rpc('dashboard_audit_log', { limit_n: 100 });
    if (error) return target.innerHTML = `<div class="text-sm text-rose-600">${esc(error.message)}</div>`;
    target.innerHTML = `<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead><tr class="border-b"><th class="p-3 text-left">Time</th><th class="p-3 text-left">Action</th><th class="p-3 text-left">Entity</th><th class="p-3 text-left">Reason</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-b"><td class="p-3">${esc(r.created_at)}</td><td class="p-3">${esc(r.action)}</td><td class="p-3">${esc(r.entity_type)}</td><td class="p-3">${esc(r.reason)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  async function loadFormDefinition() {
    const formType = els('formType').value;
    const target = els('formWorkspace'); target.innerHTML = 'Loading staging definition…';
    const { data, error } = await client.rpc('dashboard_form_definition', { form_code: formType });
    if (error) return target.innerHTML = `<span class="text-rose-600">${esc(error.message)}</span>`;
    if (!data?.fields?.length) return target.innerHTML = `<b>${esc(formType)}</b>: no real field definition mapped yet. Add the actual form/sample and map its fields here.`;
    target.innerHTML = `<h3 class="font-black">${esc(formType)} · mapping v${esc(data.version || 1)}</h3><div class="mt-3 overflow-auto"><table class="w-full text-xs"><thead><tr class="border-b"><th class="p-2 text-left">Form field</th><th class="p-2 text-left">Source</th><th class="p-2 text-left">Source field</th><th class="p-2 text-left">Required</th></tr></thead><tbody>${data.fields.map(f=>`<tr class="border-b"><td class="p-2">${esc(f.field_label)}</td><td class="p-2">${esc(f.source_name)}</td><td class="p-2">${esc(f.source_field)}</td><td class="p-2">${f.required ? 'Yes':'No'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  els('loginForm').addEventListener('submit', async e => {
    e.preventDefault(); els('loginMsg').textContent = '';
    if (!client) return;
    const { error } = await client.auth.signInWithPassword({ email: els('email').value.trim(), password: els('password').value });
    if (error) return els('loginMsg').textContent = error.message;
    await ensureAuthorized();
  });
  els('logout').addEventListener('click', async () => { await client.auth.signOut(); showLogin(); });
  els('refreshOverview').addEventListener('click', refreshOverview);
  els('loadForm').addEventListener('click', loadFormDefinition);
  document.querySelectorAll('.nav').forEach(btn => btn.addEventListener('click', () => setPage(btn.dataset.page)));
  els('globalSearch').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.value.trim()) searchStudents(e.target.value.trim()); });

  if (initClient()) ensureAuthorized();
})();
