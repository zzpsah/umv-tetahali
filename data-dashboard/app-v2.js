(() => {
  const $ = id => document.getElementById(id);
  const cfg = window.UMV_CONFIG || {};
  let client = null;
  let visible = new Set(['key','name','father','mother','dob','category','className','stream','pen','apaar','studentId','mobile','udise','eshiksha','ofss','dropbox','issues','action']);

  const columns = [
    ['key','Student Key'],['name','Student Name'],['father','Father Name'],['mother','Mother Name'],['dob','DOB'],['gender','Gender'],['category','Category'],['className','Class'],['section','Section'],['stream','Stream'],['pen','PEN'],['apaar','APAAR'],['studentId','Student Unique ID'],['mobile','Mobile'],['udise','UDISE'],['eshiksha','e-Shiksha'],['ofss','OFSS'],['dropbox','Dropbox'],['issues','Issues'],['action','Recommended Action'],['snapshot','Snapshot']
  ];

  const demo = [
    {key:'STU-XI-001',name:'Aman Kumar',father:'Rakesh Kumar',mother:'Sunita Devi',dob:'2010-01-05',gender:'M',category:'BC',className:'XI',section:'A',stream:'Science',pen:'22123456789',apaar:'APAAR-78431',studentId:'ESK-110021',mobile:'98XXXXXX41',udise:true,eshiksha:true,ofss:true,dropbox:false,issues:[],action:'Mapped',snapshot:'UDISE v2 · ESK v1 · OFSS v1'},
    {key:'STU-XI-002',name:'Guddi Khatoon',father:'Imam Hasan',mother:'Shabnam Khatoon',dob:'2010-12-31',gender:'F',category:'EBC',className:'XI',section:'A',stream:'Arts',pen:'22199887766',apaar:'',studentId:'ESK-110057',mobile:'97XXXXXX33',udise:true,eshiksha:true,ofss:true,dropbox:false,issues:['DOB_MISMATCH'],action:'SO3 Review',snapshot:'UDISE v2 · ESK v1 · OFSS v1'},
    {key:'STU-XI-003',name:'Rizwan Alam',father:'Sajid Alam',mother:'Nasima Khatoon',dob:'2009-07-12',gender:'M',category:'General',className:'XI',section:'A',stream:'Science',pen:'',apaar:'',studentId:'ESK-110071',mobile:'95XXXXXX72',udise:false,eshiksha:true,ofss:true,dropbox:false,issues:['MISSING_UDISE','NOT_IN_DROPBOX'],action:'SO2 Candidate',snapshot:'ESK v1 · OFSS v1'},
    {key:'STU-XI-004',name:'Neha Kumari',father:'Santosh Kumar',mother:'Meena Devi',dob:'2010-03-11',gender:'F',category:'SC',className:'XI',section:'B',stream:'Science',pen:'22003344771',apaar:'APAAR-99220',studentId:'ESK-110014',mobile:'96XXXXXX90',udise:false,eshiksha:true,ofss:true,dropbox:true,issues:['MISSING_UDISE','FOUND_IN_DROPBOX'],action:'Import from Dropbox',snapshot:'ESK v1 · OFSS v1 · Dropbox Jul-2026'},
    {key:'STU-XI-005',name:'Soharab Alam',father:'Md Karim',mother:'Razia Khatoon',dob:'2011-09-05',gender:'M',category:'BC',className:'XI',section:'A',stream:'Science',pen:'22007881221',apaar:'APAAR-50111',studentId:'ESK-110088',mobile:'94XXXXXX18',udise:true,eshiksha:true,ofss:true,dropbox:false,issues:['NAME_VARIATION'],action:'SO3 Review',snapshot:'UDISE v2 · ESK v1 · OFSS v1'},
    {key:'STU-X-006',name:'Pooja Kumari',father:'Mahesh Prasad',mother:'Kiran Devi',dob:'2011-02-22',gender:'F',category:'BC',className:'X',section:'A',stream:'',pen:'21999887711',apaar:'APAAR-22198',studentId:'ESK-100099',mobile:'93XXXXXX87',udise:true,eshiksha:true,ofss:false,dropbox:false,issues:['FATHER_MISMATCH'],action:'Manual Review',snapshot:'UDISE v2 · ESK v1'}
  ];

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (text, kind='ok') => `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${kind==='bad'?'border-rose-300 bg-rose-50 text-rose-700':kind==='warn'?'border-amber-300 bg-amber-50 text-amber-700':'border-slate-200 bg-slate-50 text-slate-700'}">${esc(text)}</span>`;

  function initAuth() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) {
      showApp('demo@staging');
      return;
    }
    client = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {auth:{persistSession:true,autoRefreshToken:true}});
    client.auth.getSession().then(async ({data}) => {
      if (!data.session?.user) return showLogin();
      try {
        const {data: access, error} = await client.rpc('dashboard_my_access');
        if (error || !access?.allowed) return showLogin('Authenticated account is not authorized for this dashboard.');
        showApp(`${data.session.user.email || 'user'} · ${access.role || 'viewer'}`);
      } catch (_) { showApp(data.session.user.email || 'user'); }
    });
  }

  function showLogin(msg='') {
    $('loginView').classList.remove('hidden');
    $('appView').classList.add('hidden');
    $('loginMsg').textContent = msg;
  }
  function showApp(label='') {
    $('loginView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    $('who').textContent = label;
    renderAll();
  }

  function renderAll() {
    renderSummary(); renderColumns(); renderMaster(); renderQueues(); renderSnapshots(); renderAudit();
  }

  function renderSummary() {
    const items = [
      ['Students',220],['Mapped',183],['SO2 candidates',6],['SO3 review',11],['Dropbox import',4],['Manual review',8]
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
    const rows = demo.filter(s => (!cls || s.className===cls) && (!action || s.action===action) && (!q || Object.values(s).flat().join(' ').toLowerCase().includes(q)));
    $('masterHead').innerHTML = columns.filter(([k])=>visible.has(k)).map(([,l])=>`<th class="p-3 whitespace-nowrap">${esc(l)}</th>`).join('');
    $('masterBody').innerHTML = rows.map(s => `<tr class="border-t hover:bg-slate-50">${columns.filter(([k])=>visible.has(k)).map(([k])=>`<td class="p-3 whitespace-nowrap align-top">${cell(s,k)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="30" class="p-8 text-center text-slate-500">No matching students</td></tr>`;
    document.querySelectorAll('.student-key').forEach(b => b.onclick = () => openProfile(b.dataset.key));
  }

  function renderQueues() {
    const card = (s,note) => `<div class="bg-white border rounded-2xl p-4"><div class="flex items-start justify-between gap-3"><div><div class="font-black">${esc(s.name)}</div><div class="text-xs text-slate-500 mt-1">${esc(s.key)} · ${esc(s.className)} ${esc(s.stream)}</div></div><button class="queue-open border rounded-xl px-3 py-2 text-sm font-bold" data-key="${esc(s.key)}">Review</button></div><div class="flex flex-wrap gap-2 mt-3">${s.issues.map(i=>badge(i.replaceAll('_',' '),'warn')).join('')}</div><p class="text-sm text-slate-500 mt-3">${esc(note)}</p></div>`;
    $('so2Queue').innerHTML = demo.filter(s=>s.action==='SO2 Candidate').map(s=>card(s,'OFSS primary → e-Shiksha fallback. UDISE missing + Siwan Dropbox not found. Human verification before SO2 print.')).join('') || '<div class="text-slate-500">No candidates.</div>';
    $('so3Queue').innerHTML = demo.filter(s=>s.action==='SO3 Review').map(s=>card(s,'Existing details from UDISE; proposed values from OFSS first, e-Shiksha second. Human review required before print.')).join('') || '<div class="text-slate-500">No candidates.</div>';
    $('importQueue').innerHTML = demo.filter(s=>s.action==='Import from Dropbox').map(s=>card(s,'UDISE missing but record found in Siwan Dropbox. Use import/reconciliation instead of SO2.')).join('') || '<div class="text-slate-500">No candidates.</div>';
    $('reconQueue').innerHTML = demo.filter(s=>s.action!=='Mapped').map(s=>card(s,`Recommended action: ${s.action}`)).join('');
    document.querySelectorAll('.queue-open').forEach(b => b.onclick = () => openProfile(b.dataset.key));
  }

  function openProfile(key) {
    const s = demo.find(x=>x.key===key); if (!s) return;
    $('profileName').textContent = s.name;
    $('profileKey').textContent = s.key;
    $('decisionPanel').innerHTML = `<div class="grid md:grid-cols-5 gap-3 text-sm"><div><div class="text-slate-500">Primary source</div><div class="font-black">${s.className==='XI'?'OFSS':'UDISE'}</div></div><div><div class="text-slate-500">Secondary</div><div class="font-black">${s.className==='XI'?'e-Shiksha':'—'}</div></div><div><div class="text-slate-500">UDISE</div>${s.udise?badge('Found'):badge('Missing','warn')}</div><div><div class="text-slate-500">Dropbox</div>${s.dropbox?badge('Found'):badge('Not found','warn')}</div><div><div class="text-slate-500">Action</div>${badge(s.action,s.action==='Mapped'?'ok':'warn')}</div></div>`;
    const pairs = [['Father',s.father],['Mother',s.mother],['DOB',s.dob],['Gender',s.gender],['Category',s.category],['Class',s.className],['Section',s.section],['Stream',s.stream||'—'],['PEN',s.pen||'Missing'],['APAAR',s.apaar||'Missing'],['Student ID',s.studentId],['Mobile',s.mobile]];
    $('profileCore').innerHTML = pairs.map(([a,b])=>`<div class="text-slate-500">${esc(a)}</div><div class="font-medium">${esc(b)}</div>`).join('');
    $('profileSources').innerHTML = [['UDISE',s.udise],['e-Shiksha',s.eshiksha],['OFSS',s.ofss],['Siwan Dropbox',s.dropbox]].map(([a,b])=>`<div class="flex justify-between gap-4"><span>${esc(a)}</span>${b?badge('Mapped'):badge('Not mapped','warn')}</div>`).join('');
    const cmp = [
      ['Name',s.udise?s.name:'—',s.eshiksha?s.name:'—',s.ofss?s.name:'—',s.issues.includes('NAME_VARIATION')?'MINOR_VARIATION':'MATCH'],
      ['Father',s.udise?s.father:'—',s.eshiksha?s.father:'—',s.ofss?s.father:'—',s.issues.includes('FATHER_MISMATCH')?'FATHER_MISMATCH':'MATCH'],
      ['Mother',s.udise?s.mother:'—',s.eshiksha?s.mother:'—','—','MATCH'],
      ['DOB',s.udise?s.dob:'—',s.eshiksha?s.dob:'—',s.ofss?(s.issues.includes('DOB_MISMATCH')?'2010-12-30':s.dob):'—',s.issues.includes('DOB_MISMATCH')?'DOB_MISMATCH':'MATCH'],
      ['Class',s.udise?s.className:'—',s.eshiksha?s.className:'—',s.ofss?s.className:'—','MATCH'],
      ['Stream',s.udise?(s.stream||'—'):'—',s.eshiksha?(s.stream||'—'):'—',s.ofss?(s.stream||'—'):'—','MATCH']
    ];
    $('comparisonBody').innerHTML = cmp.map(r=>`<tr class="border-t"><td class="p-3 font-bold">${esc(r[0])}</td><td class="p-3">${esc(r[1])}</td><td class="p-3">${esc(r[2])}</td><td class="p-3">${esc(r[3])}</td><td class="p-3">${badge(r[4].replaceAll('_',' '),r[4].includes('MISMATCH')?'bad':r[4].includes('VARIATION')?'warn':'ok')}</td></tr>`).join('');
    $('profileModal').classList.remove('hidden');
  }

  function renderSnapshots() {
    const rows = [
      ['UDISE','2026-2027','—','v2','17 Sep 2026','210','udise_active_students.xlsx','Current'],
      ['e-Shiksha','2026-2027','—','v1','17 Sep 2026','220','eshikshakosh_students.xlsx','Current'],
      ['OFSS','2026-2028','Science','v1','17 Sep 2026','67','ofss_science.xlsx','Current'],
      ['OFSS','2026-2028','Arts','v1','17 Sep 2026','12','ofss_arts.xlsx','Current'],
      ['OFSS','2026-2028','Commerce','v1','17 Sep 2026','1','ofss_commerce.xlsx','Current']
    ];
    $('snapshotBody').innerHTML = rows.map(r=>`<tr class="border-t">${r.map(x=>`<td class="p-3 whitespace-nowrap">${esc(x)}</td>`).join('')}</tr>`).join('');
  }

  function renderAudit() {
    const rows = [
      ['17 Sep 2026 18:20','System','STU-XI-002','SO3 recommended','UDISE ↔ OFSS','DOB value','Conflict flagged','Deterministic mismatch'],
      ['17 Sep 2026 18:21','System','STU-XI-003','SO2 candidate generated','OFSS + e-Shiksha','UDISE missing','SO2 queue','Not found in UDISE or Dropbox'],
      ['17 Sep 2026 18:22','System','STU-XI-004','Import candidate generated','Siwan Dropbox','UDISE missing','Dropbox found','Import path before SO2']
    ];
    $('auditBody').innerHTML = rows.map(r=>`<tr class="border-t">${r.map(x=>`<td class="p-3 whitespace-nowrap">${esc(x)}</td>`).join('')}</tr>`).join('');
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
    if (!client) return showApp('demo@staging');
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
