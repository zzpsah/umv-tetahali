(() => {
  const cfg = window.UMV_CONFIG || {};
  const els = id => document.getElementById(id);
  let client = null;
  let currentUser = null;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = value => value == null || value === '' ? '—' : String(value);
  const td = v => `<td class="p-3 align-top">${esc(fmt(v))}</td>`;

  function initClient() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      els('loginMsg').textContent = 'Missing staging config.';
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

  function showLogin() { els('loginView').classList.remove('hidden'); els('appView').classList.add('hidden'); }
  function showApp() { els('loginView').classList.add('hidden'); els('appView').classList.remove('hidden'); }

  function setPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav').forEach(b => b.classList.remove('bg-white/10'));
    els(`page-${name}`)?.classList.remove('hidden');
    document.querySelector(`.nav[data-page="${name}"]`)?.classList.add('bg-white/10');
    if (name === 'udise') loadUdise();
    if (name === 'eshiksha') loadEshiksha();
    if (name === 'ofss') loadOfss();
    if (name === 'dropbox') loadDropbox();
    if (name === 'reconciliation') loadIssues('reconPanel', 200);
    if (name === 'imports') loadImports();
    if (name === 'audit') loadAudit();
  }

  function cardsHtml(summary) {
    const cards = [
      ['UDISE current', summary.udise_current], ['e-Shiksha current', summary.eshiksha_current],
      ['OFSS Science', summary.ofss_science], ['OFSS Arts', summary.ofss_arts],
      ['OFSS Commerce', summary.ofss_commerce], ['Core students', summary.core_students],
      ['Reconciliation issues', summary.issue_count], ['APAAR missing/placeholder', summary.apaar_missing]
    ];
    return cards.map(([label,value]) => `<div class="bg-white border rounded-2xl p-5"><div class="text-sm text-slate-500">${esc(label)}</div><div class="text-3xl font-black mt-2">${esc(fmt(value))}</div></div>`).join('');
  }

  async function refreshOverview() {
    els('summaryCards').innerHTML = '<div class="text-sm text-slate-500">Loading…</div>';
    const { data, error } = await client.rpc('dashboard_summary');
    if (error) return els('summaryCards').innerHTML = `<div class="text-sm text-rose-600">${esc(error.message)}</div>`;
    els('summaryCards').innerHTML = cardsHtml(data || {});
    loadIssues('issuesPreview', 8);
  }

  async function loadIssues(targetId, limit = 100) {
    const target = els(targetId); target.innerHTML = 'Loading…';
    const { data, error } = await client.rpc('dashboard_reconciliation_issues', { limit_n: limit });
    if (error) return target.innerHTML = `<span class="text-rose-600">${esc(error.message)}</span>`;
    if (!data?.length) return target.innerHTML = '<span class="text-slate-500">No staged issues yet.</span>';
    target.innerHTML = `<div class="overflow-auto bg-white border rounded-2xl"><table class="w-full text-left text-xs"><thead class="bg-slate-50"><tr><th class="p-3">Status</th><th class="p-3">Student</th><th class="p-3">Source</th><th class="p-3">Reason</th></tr></thead><tbody>${data.map(r => `<tr class="border-t"><td class="p-3 font-bold">${esc(r.status)}</td>${td(r.student_name)}${td(r.source_name)}${td(r.reason)}</tr>`).join('')}</tbody></table></div>`;
  }

  async function searchStudents(query) {
    setPage('students');
    const target = els('searchResults'); target.innerHTML = '<div class="p-5 text-sm text-slate-500">Searching full sources…</div>';
    const { data, error } = await client.rpc('dashboard_search_students', { q: query, limit_n: 100 });
    if (error) return target.innerHTML = `<div class="p-5 text-sm text-rose-600">${esc(error.message)}</div>`;
    if (!data?.length) return target.innerHTML = '<div class="p-5 text-sm text-slate-500">No reliable or plausible candidate returned.</div>';
    target.innerHTML = `<table class="w-full text-left text-xs"><thead><tr class="border-b bg-slate-50"><th class="p-3">Source</th><th class="p-3">Student</th><th class="p-3">Father</th><th class="p-3">Mother</th><th class="p-3">DOB</th><th class="p-3">Class</th><th class="p-3">Identifier</th><th class="p-3">Match</th></tr></thead><tbody>${data.map(r => `<tr class="border-b"><td class="p-3 font-bold">${esc(r.source_name)}</td>${td(r.student_name)}${td(r.father_name)}${td(r.mother_name)}${td(r.dob)}${td(r.class_name)}${td(r.source_identifier)}${td(r.match_reason)}</tr>`).join('')}</tbody></table>`;
  }

  function controls(selectId, options, buttonId, label='Filter') {
    return `<div class="flex flex-wrap gap-2 mb-4"><select id="${selectId}" class="border rounded-xl px-3 py-2 text-sm bg-white">${options.map(o=>`<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}</select><button id="${buttonId}" class="border rounded-xl px-4 py-2 text-sm font-bold bg-white">${esc(label)}</button></div>`;
  }

  async function loadUdise() {
    const p = els('udisePanel');
    p.innerHTML = controls('udiseClass',[{value:'',label:'All classes'},{value:'IX',label:'Class IX'},{value:'X',label:'Class X'},{value:'XI',label:'Class XI'},{value:'XII',label:'Class XII'}],'udiseLoad') + '<div id="udiseTable">Loading…</div>';
    const run = async()=>{
      els('udiseTable').innerHTML='Loading…'; const f=els('udiseClass').value;
      const {data,error}=await client.rpc('dashboard_udise_students',{class_filter:f||null,limit_n:500});
      if(error) return els('udiseTable').innerHTML=`<div class="text-rose-600">${esc(error.message)}</div>`;
      els('udiseTable').innerHTML=`<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-3">PEN</th><th class="p-3">Student</th><th class="p-3">Father</th><th class="p-3">Mother</th><th class="p-3">DOB</th><th class="p-3">Class</th><th class="p-3">Section</th><th class="p-3">APAAR</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-t">${td(r.pen)}${td(r.student_name)}${td(r.father_name)}${td(r.mother_name)}${td(r.dob)}${td(r.class_name)}${td(r.section_name)}${td(r.apaar_status)}</tr>`).join('')}</tbody></table></div>`;
    };
    els('udiseLoad').onclick=run; await run();
  }

  async function loadEshiksha() {
    const p=els('eshikshaPanel');
    p.innerHTML=controls('eshClass',[{value:'',label:'All classes'},{value:'9',label:'Class 9'},{value:'10',label:'Class 10'},{value:'11',label:'Class 11'},{value:'12',label:'Class 12'}],'eshLoad')+'<div id="eshTable">Loading…</div>';
    const run=async()=>{ const f=els('eshClass').value; els('eshTable').innerHTML='Loading…'; const {data,error}=await client.rpc('dashboard_eshiksha_students',{class_filter:f||null,limit_n:500}); if(error)return els('eshTable').innerHTML=`<div class="text-rose-600">${esc(error.message)}</div>`; els('eshTable').innerHTML=`<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-3">Student Code</th><th class="p-3">Student</th><th class="p-3">Father</th><th class="p-3">DOB</th><th class="p-3">Class</th><th class="p-3">Stream</th><th class="p-3">UDISE PEN</th><th class="p-3">Match</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-t">${td(r.student_code)}${td(r.student_name)}${td(r.father_name)}${td(r.dob)}${td(r.class_name)}${td(r.stream)}${td(r.udise_pen)}${td(r.udise_match_status)}</tr>`).join('')}</tbody></table></div>`; };
    els('eshLoad').onclick=run; await run();
  }

  async function loadOfss() {
    const p=els('ofssPanel');
    p.innerHTML=controls('ofssStream',[{value:'',label:'All streams'},{value:'Science',label:'Science'},{value:'Arts',label:'Arts'},{value:'Commerce',label:'Commerce'}],'ofssLoad')+'<div id="ofssTable">Loading…</div>';
    const run=async()=>{ const f=els('ofssStream').value; els('ofssTable').innerHTML='Loading…'; const {data,error}=await client.rpc('dashboard_ofss_students',{stream_filter:f||null,limit_n:500}); if(error)return els('ofssTable').innerHTML=`<div class="text-rose-600">${esc(error.message)}</div>`; els('ofssTable').innerHTML=`<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-3">Stream</th><th class="p-3">Reference</th><th class="p-3">Student</th><th class="p-3">Father</th><th class="p-3">DOB</th><th class="p-3">Gender</th><th class="p-3">Marks %</th><th class="p-3">Admission</th><th class="p-3">Match</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-t">${td(r.stream_name)}${td(r.reference_no)}${td(r.student_name)}${td(r.father_name)}${td(r.dob)}${td(r.gender)}${td(r.marks_percent)}${td(r.admission_date)}${td(r.match_status)}</tr>`).join('')}</tbody></table></div>`; };
    els('ofssLoad').onclick=run; await run();
  }

  async function loadDropbox() {
    const p=els('dropboxPanel');
    p.innerHTML=`<div class="flex flex-wrap gap-2 mb-4"><input id="dropQ" class="border rounded-xl px-3 py-2 text-sm min-w-64" placeholder="Name / father / mother / PEN"><select id="dropClass" class="border rounded-xl px-3 py-2 text-sm bg-white"><option value="">All eligible classes</option><option>9</option><option>10</option><option>11</option><option>12</option></select><button id="dropLoad" class="border rounded-xl px-4 py-2 text-sm font-bold bg-white">Search</button></div><div id="dropTable">Enter a search or load all.</div>`;
    const run=async()=>{ const q=els('dropQ').value.trim(); const c=els('dropClass').value; els('dropTable').innerHTML='Loading…'; const {data,error}=await client.rpc('dashboard_dropbox_students',{q:q||null,eligible_class_filter:c||null,limit_n:500}); if(error)return els('dropTable').innerHTML=`<div class="text-rose-600">${esc(error.message)}</div>`; els('dropTable').innerHTML=`<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-3">PEN</th><th class="p-3">Student</th><th class="p-3">Father</th><th class="p-3">Mother</th><th class="p-3">Last School</th><th class="p-3">Last Class</th><th class="p-3">Eligible</th><th class="p-3">APAAR</th><th class="p-3">Block</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-t">${td(r.student_pen)}${td(r.student_name)}${td(r.father_name)}${td(r.mother_name)}${td(r.last_school_name)}${td(r.last_class)}${td(r.eligible_class_to_import)}${td(r.apaar_generated)}${td(r.block_name)}</tr>`).join('')}</tbody></table></div>`; };
    els('dropLoad').onclick=run;
  }

  async function loadImports() {
    const target = els('importsPanel'); target.innerHTML = 'Loading…';
    const { data, error } = await client.rpc('dashboard_recent_imports', { limit_n: 100 });
    if (error) return target.innerHTML = `<div class="text-sm text-rose-600">${esc(error.message)}</div>`;
    target.innerHTML = `<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead><tr class="border-b"><th class="p-3 text-left">Source</th><th class="p-3 text-left">Version</th><th class="p-3 text-left">Rows</th><th class="p-3 text-left">Imported</th></tr></thead><tbody>${(data||[]).map(r=>`<tr class="border-b">${td(r.source_name)}${td(r.version_label)}${td(r.row_count)}${td(r.imported_at)}</tr>`).join('')}</tbody></table></div>`;
  }

  async function loadAudit() {
    const target = els('auditPanel'); target.innerHTML = 'Loading…';
    const { data, error } = await client.rpc('dashboard_audit_log', { limit_n: 100 });
    if (error) return target.innerHTML = `<div class="text-sm text-rose-600">${esc(error.message)}</div>`;
    if (!data?.length) return target.innerHTML = '<div class="text-sm text-slate-500">No dashboard audit events yet.</div>';
    target.innerHTML = `<div class="bg-white border rounded-2xl overflow-auto"><table class="w-full text-xs"><thead><tr class="border-b"><th class="p-3 text-left">Time</th><th class="p-3 text-left">Action</th><th class="p-3 text-left">Entity</th><th class="p-3 text-left">Reason</th></tr></thead><tbody>${data.map(r=>`<tr class="border-b">${td(r.created_at)}${td(r.action)}${td(r.entity_type)}${td(r.reason)}</tr>`).join('')}</tbody></table></div>`;
  }

  async function loadFormDefinition() {
    const formType = els('formType').value;
    const target = els('formWorkspace'); target.innerHTML = 'Loading mapped definition…';
    const { data, error } = await client.rpc('dashboard_form_definition', { form_code: formType });
    if (error) return target.innerHTML = `<span class="text-rose-600">${esc(error.message)}</span>`;
    if (!data?.fields?.length) return target.innerHTML = `<b>${esc(formType)}</b>: no mapped fields yet.`;
    target.innerHTML = `<h3 class="font-black">${esc(formType)} · mapping v${esc(data.version || 1)}</h3><div class="mt-3 overflow-auto"><table class="w-full text-xs"><thead><tr class="border-b"><th class="p-2 text-left">Form field</th><th class="p-2 text-left">Source</th><th class="p-2 text-left">Source field</th><th class="p-2 text-left">Required</th></tr></thead><tbody>${data.fields.map(f=>`<tr class="border-b">${td(f.field_label)}${td(f.source_name)}${td(f.source_field)}<td class="p-2">${f.required ? 'Yes':'No'}</td></tr>`).join('')}</tbody></table></div>`;
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
