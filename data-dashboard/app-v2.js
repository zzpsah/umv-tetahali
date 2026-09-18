(() => {
  const $ = id => document.getElementById(id);
  const cfg = window.UMV_CONFIG || {};
  let client = null;
  let students = [];
  let visible = new Set(['key','name','father','mother','dob','category','className','stream','pen','apaar','studentId','mobile','udise','eshiksha','ofss','dropbox','issues','action']);

  const columns = [
    ['key','Student Key'],['name','Student Name'],['father','Father Name'],['mother','Mother Name'],['dob','DOB'],['gender','Gender'],['category','Category'],['className','Class'],['section','Section'],['stream','Stream'],['pen','PEN'],['apaar','APAAR'],['studentId','Student Unique ID'],['mobile','Mobile'],['udise','UDISE'],['eshiksha','e-Shiksha'],['ofss','OFSS'],['dropbox','Dropbox'],['issues','Issues'],['action','Recommended Action'],['snapshot','Snapshot']
  ];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (text, kind='ok') => `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${kind==='bad'?'border-rose-300 bg-rose-50 text-rose-700':kind==='warn'?'border-amber-300 bg-amber-50 text-amber-700':'border-slate-200 bg-slate-50 text-slate-700'}">${esc(text)}</span>`;

  function normalizeClass(v='') {
    const s = String(v).toUpperCase().replace('CLASS','').trim();
    if (s === '9') return 'IX';
    if (s === '10') return 'X';
    if (s === '11') return 'XI';
    if (s === '12') return 'XII';
    return s;
  }

  function mapRow(r) {
    return {
      key:r.student_key,
      name:r.student_name,
      father:r.father_name,
      mother:r.mother_name,
      dob:r.dob,
      gender:r.gender,
      category:r.category,
      className:normalizeClass(r.class_name),
      section:r.section_name,
      stream:r.stream,
      pen:r.pen,
      apaar:r.apaar_id,
      studentId:r.student_code,
      mobile:r.mobile_number,
      udise:!!r.udise_present,
      eshiksha:!!r.eshiksha_present,
      ofss:!!r.ofss_present,
      dropbox:!!r.dropbox_present,
      issues:r.issue_status && r.issue_status!=='MATCHED' ? [r.issue_status] : [],
      action:r.recommended_action || 'Mapped',
      snapshot:r.snapshot_info,
      ofssReference:r.ofss_reference_no,
      udiseName:r.udise_name,
      udiseFather:r.udise_father,
      udiseMother:r.udise_mother,
      udiseDob:r.udise_dob,
      udiseClass:r.udise_class,
      udiseSection:r.udise_section,
      ofssName:r.ofss_name,
      ofssFather:r.ofss_father,
      ofssDob:r.ofss_dob,
      ofssStream:r.ofss_stream,
      udiseMatchMethod:r.udise_match_method,
      ofssMatchMethod:r.ofss_match_method
    };
  }

  function showLogin(msg='') {
    $('loginView').classList.remove('hidden');
    $('appView').classList.add('hidden');
    $('loginMsg').textContent = msg;
  }

  async function loadLiveData() {
    $('summaryCards').innerHTML = '<div class="text-sm text-slate-500">Loading live student master…</div>';
    const {data,error} = await client.rpc('dashboard_student_master',{limit_n:500});
    if (error) throw error;
    students = (data||[]).map(mapRow);
    renderAll();
    await Promise.allSettled([renderSnapshotsLive(), renderAuditLive()]);
  }

  async function showApp(label='') {
    $('loginView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    $('who').textContent = label;
    try { await loadLiveData(); }
    catch (e) {
      $('summaryCards').innerHTML = `<div class="text-sm text-rose-600">Live data failed: ${esc(e.message)}</div>`;
    }
  }

  function initAuth() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
      showLogin('Supabase configuration missing. Demo data has been removed.');
      return;
    }
    client = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true,autoRefreshToken:true}});
    client.auth.getSession().then(async ({data}) => {
      if (!data.session?.user) return showLogin();
      const {data:access,error} = await client.rpc('dashboard_my_access');
      if (error || !access?.allowed) return showLogin('Authenticated account is not authorized.');
      await showApp(`${data.session.user.email || 'user'} · ${access.role || 'viewer'}`);
    });
  }

  function renderAll() {
    renderSummary(); renderColumns(); renderMaster(); renderQueues();
  }

  function renderSummary() {
    const count = a => students.filter(s=>s.action===a).length;
    const items = [
      ['Students',students.length],
      ['Mapped',count('Mapped')],
      ['SO2 candidates',count('SO2 Candidate')],
      ['SO3 review',count('SO3 Review')],
      ['Dropbox import',count('Import from Dropbox')],
      ['Manual review',count('Manual Review')]
    ];
    $('summaryCards').innerHTML = items.map(([l,v]) => `<div class="bg-white border rounded-2xl p-4"><div class="text-xs text-slate-500">${esc(l)}</div><div class="text-2xl font-black mt-1">${v}</div></div>`).join('');
  }

  function renderColumns() {
    if ($('columnChecks').children.length) return;
    $('columnChecks').innerHTML = columns.map(([k,l]) => `<label class="flex items-center gap-2"><input type="checkbox" data-col="${k}" ${visible.has(k)?'checked':''}><span>${esc(l)}</span></label>`).join('');
  }

  function cell(s,k) {
    if (['udise','eshiksha','ofss','dropbox'].includes(k)) return s[k] ? badge('Yes') : badge('No','warn');
    if (k === 'issues') return s.issues.length ? s.issues.map(x => badge(x.replaceAll('_',' '), x.includes('MISMATCH')?'bad':'warn')).join(' ') : badge('No issue');
    if (k === 'action') return badge(s.action, s.action==='Mapped'?'ok':'warn');
    if (k === 'key') return `<button class="student-key font-bold text-blue-700 underline decoration-dotted underline-offset-2" data-key="${esc(s.key)}">${esc(s.key)}</button>`;
    return esc(s[k] || '—');
  }

  function renderMaster() {
    const q = ($('masterSearch').value || '').trim().toLowerCase();
    const cls = $('masterClass').value;
    const action = $('masterAction').value;
    const rows = students.filter(s => (!cls || s.className===cls) && (!action || s.action===action) && (!q || Object.values(s).flat().join(' ').toLowerCase().includes(q)));
    $('masterHead').innerHTML = columns.filter(([k])=>visible.has(k)).map(([,l])=>`<th class="p-3 whitespace-nowrap">${esc(l)}</th>`).join('');
    $('masterBody').innerHTML = rows.map(s => `<tr class="border-t hover:bg-slate-50">${columns.filter(([k])=>visible.has(k)).map(([k])=>`<td class="p-3 whitespace-nowrap align-top">${cell(s,k)}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="30" class="p-8 text-center text-slate-500">No matching students</td></tr>';
    document.querySelectorAll('.student-key').forEach(b => b.onclick = () => openProfile(b.dataset.key));
  }

  function queueCard(s,note) {
    return `<div class="bg-white border rounded-2xl p-4"><div class="flex items-start justify-between gap-3"><div><div class="font-black">${esc(s.name)}</div><div class="text-xs text-slate-500 mt-1">${esc(s.key)} · ${esc(s.className)} ${esc(s.stream||'')}</div></div><button class="queue-open border rounded-xl px-3 py-2 text-sm font-bold" data-key="${esc(s.key)}">Review</button></div><div class="flex flex-wrap gap-2 mt-3">${s.issues.map(i=>badge(i.replaceAll('_',' '),'warn')).join('')}</div><p class="text-sm text-slate-500 mt-3">${esc(note)}</p></div>`;
  }

  function renderQueues() {
    $('so2Queue').innerHTML = students.filter(s=>s.action==='SO2 Candidate').map(s=>queueCard(s,'UDISE missing + Siwan Dropbox not found. Class XI OFSS-linked student. Human verification before SO2 print.')).join('') || '<div class="text-slate-500">No candidates.</div>';
    $('so3Queue').innerHTML = students.filter(s=>s.action==='SO3 Review').map(s=>queueCard(s,'UDISE exists but source fields conflict. Human review required before SO3 print.')).join('') || '<div class="text-slate-500">No candidates.</div>';
    $('importQueue').innerHTML = students.filter(s=>s.action==='Import from Dropbox').map(s=>queueCard(s,'UDISE missing but matching Siwan Dropbox record found. Import/reconciliation before SO2.')).join('') || '<div class="text-slate-500">No candidates.</div>';
    $('reconQueue').innerHTML = students.filter(s=>s.action!=='Mapped').map(s=>queueCard(s,`Recommended action: ${s.action}`)).join('') || '<div class="text-slate-500">No open reconciliation cases.</div>';
    document.querySelectorAll('.queue-open').forEach(b => b.onclick = () => openProfile(b.dataset.key));
  }

  function statusFor(a,b) {
    if (!a && !b) return ['MISSING','warn'];
    if (!a || !b) return ['MISSING IN SOURCE','warn'];
    const na=String(a).trim().toUpperCase(), nb=String(b).trim().toUpperCase();
    return na===nb ? ['MATCH','ok'] : ['MISMATCH','bad'];
  }

  function openProfile(key) {
    const s = students.find(x=>x.key===key); if (!s) return;
    $('profileName').textContent = s.name;
    $('profileKey').textContent = s.key;
    $('decisionPanel').innerHTML = `<div class="grid md:grid-cols-5 gap-3 text-sm"><div><div class="text-slate-500">Primary source</div><div class="font-black">${s.className==='XI'?'OFSS':'e-Shiksha'}</div></div><div><div class="text-slate-500">Secondary</div><div class="font-black">${s.className==='XI'?'e-Shiksha':'UDISE'}</div></div><div><div class="text-slate-500">UDISE</div>${s.udise?badge('Found'):badge('Missing','warn')}</div><div><div class="text-slate-500">Dropbox</div>${s.dropbox?badge('Found'):badge('Not found','warn')}</div><div><div class="text-slate-500">Action</div>${badge(s.action,s.action==='Mapped'?'ok':'warn')}</div></div>`;
    const pairs = [['Father',s.father],['Mother',s.mother],['DOB',s.dob],['Gender',s.gender],['Category',s.category],['Class',s.className],['Section',s.section],['Stream',s.stream||'—'],['PEN',s.pen||'Missing'],['APAAR',s.apaar||'Missing'],['Student ID',s.studentId],['Mobile',s.mobile||'Missing'],['OFSS Ref',s.ofssReference||'—']];
    $('profileCore').innerHTML = pairs.map(([a,b])=>`<div class="text-slate-500">${esc(a)}</div><div class="font-medium">${esc(b)}</div>`).join('');
    $('profileSources').innerHTML = [['UDISE',s.udise],['e-Shiksha',s.eshiksha],['OFSS',s.ofss],['Siwan Dropbox',s.dropbox]].map(([a,b])=>`<div class="flex justify-between gap-4"><span>${esc(a)}</span>${b?badge('Mapped'):badge('Not mapped','warn')}</div>`).join('');

    const rows = [
      ['Name',s.udiseName,s.name,s.ofssName],
      ['Father',s.udiseFather,s.father,s.ofssFather],
      ['Mother',s.udiseMother,s.mother,'—'],
      ['DOB',s.udiseDob,s.dob,s.ofssDob],
      ['Class',s.udiseClass,s.className,s.ofss?'XI':'—'],
      ['Section',s.udiseSection,s.section,'—'],
      ['Stream','—',s.stream,s.ofssStream]
    ];
    $('comparisonBody').innerHTML = rows.map(r=>{
      const reference = r[2] || r[3] || r[1];
      const values=[r[1],r[2],r[3]].filter(v=>v && v!=='—');
      const mismatch = values.length>1 && values.some(v=>String(v).trim().toUpperCase()!==String(reference).trim().toUpperCase());
      return `<tr class="border-t"><td class="p-3 font-bold">${esc(r[0])}</td><td class="p-3">${esc(r[1]||'—')}</td><td class="p-3">${esc(r[2]||'—')}</td><td class="p-3">${esc(r[3]||'—')}</td><td class="p-3">${mismatch?badge('MISMATCH','bad'):badge(values.length?'MATCH / AVAILABLE':'MISSING','ok')}</td></tr>`;
    }).join('');
    $('profileModal').classList.remove('hidden');
  }

  async function renderSnapshotsLive() {
    const {data,error}=await client.rpc('dashboard_recent_imports',{limit_n:100});
    if (error) {
      $('snapshotBody').innerHTML = `<tr><td class="p-3 text-rose-600" colspan="8">${esc(error.message)}</td></tr>`;
      return;
    }
    $('snapshotBody').innerHTML = (data||[]).map(r=>`<tr class="border-t"><td class="p-3">${esc(r.source_name||'—')}</td><td class="p-3">${esc(r.academic_session||'—')}</td><td class="p-3">—</td><td class="p-3">${esc(r.version_label||r.snapshot_version||'—')}</td><td class="p-3">${esc(r.snapshot_date||r.imported_at||'—')}</td><td class="p-3">${esc(r.row_count||r.inserted_rows||'—')}</td><td class="p-3">${esc(r.source_file||'—')}</td><td class="p-3">${badge('Imported')}</td></tr>`).join('') || '<tr><td colspan="8" class="p-6 text-slate-500">No import history available.</td></tr>';
  }

  async function renderAuditLive() {
    const {data,error}=await client.rpc('dashboard_audit_log',{limit_n:100});
    if (error) {
      $('auditBody').innerHTML = `<tr><td class="p-3 text-rose-600" colspan="8">${esc(error.message)}</td></tr>`;
      return;
    }
    $('auditBody').innerHTML = (data||[]).map(r=>`<tr class="border-t"><td class="p-3">${esc(r.created_at||r.event_time||'—')}</td><td class="p-3">${esc(r.actor_email||r.actor||'System')}</td><td class="p-3">${esc(r.student_key||r.entity_id||'—')}</td><td class="p-3">${esc(r.action||'—')}</td><td class="p-3">${esc(r.source_name||r.entity_type||'—')}</td><td class="p-3">${esc(r.old_value||'—')}</td><td class="p-3">${esc(r.new_value||'—')}</td><td class="p-3">${esc(r.reason||'—')}</td></tr>`).join('') || '<tr><td colspan="8" class="p-6 text-slate-500">No audit events yet.</td></tr>';
  }

  function setPage(page) {
    document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
    document.querySelectorAll('.nav').forEach(n=>n.classList.remove('bg-white/10'));
    $(`page-${page}`).classList.remove('hidden');
    document.querySelector(`.nav[data-page="${page}"]`)?.classList.add('bg-white/10');
  }

  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>setPage(b.dataset.page));
  $('loginForm').onsubmit = async e => {
    e.preventDefault();
    if (!client) return showLogin('Supabase configuration missing.');
    $('loginMsg').textContent='';
    const {error} = await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    if (error) return $('loginMsg').textContent=error.message;
    initAuth();
  };
  $('logout').onclick = async () => { if (client) await client.auth.signOut(); showLogin(); };
  $('masterSearch').oninput = renderMaster;
  $('masterClass').onchange = renderMaster;
  $('masterAction').onchange = renderMaster;
  $('columnsBtn').onclick = () => $('columnPanel').classList.toggle('hidden');
  $('columnChecks').onchange = e => { if (!e.target.dataset.col) return; e.target.checked ? visible.add(e.target.dataset.col) : visible.delete(e.target.dataset.col); renderMaster(); };
  $('identityPreset').onclick = () => { visible = new Set(['key','name','father','mother','dob','category','className','stream','pen','apaar','studentId','mobile','udise','eshiksha','ofss','dropbox','issues','action']); sync(); renderMaster(); };
  $('reconPreset').onclick = () => { visible = new Set(['key','name','father','mother','dob','className','stream','udise','eshiksha','ofss','dropbox','issues','action','snapshot']); sync(); renderMaster(); };
  $('allColumns').onclick = () => { visible = new Set(columns.map(c=>c[0])); sync(); renderMaster(); };
  $('closeProfile').onclick = () => $('profileModal').classList.add('hidden');
  $('uploadSnapshot').onclick = () => $('uploadPanel').classList.toggle('hidden');
  function sync(){ document.querySelectorAll('#columnChecks input').forEach(x=>x.checked=visible.has(x.dataset.col)); }

  initAuth();
})();