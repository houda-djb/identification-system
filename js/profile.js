const STATUS_TRANSITIONS = {
  'Pending':   ['Active'],
  'Active':    ['Suspended','Inactive'],
  'Suspended': ['Active'],
  'Inactive':  ['Archived'],
  'Archived':  []
};
const TYPE_LABELS = { STU:'Student', FAC:'Faculty', STF:'Staff', PHD:'PhD', TMP:'Temporary' };

let person = null, editing = false;

async function loadProfile() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { showErr(); return; }
  const { data, error } = await db.from('persons').select('*').eq('id', id).single();
  if (error || !data) { showErr(); return; }

  person = data;
  document.getElementById('loadMsg').style.display = 'none';
  document.getElementById('profileContent').style.display = 'block';
  document.title = `${data.first_name} ${data.last_name} — UNIV BATNA 2`;

  document.getElementById('pAvatar').textContent = data.first_name[0]+data.last_name[0];
  document.getElementById('pName').textContent = data.first_name.toUpperCase()+' '+data.last_name.toUpperCase();
  document.getElementById('pId').textContent = data.id;

  const tb = document.getElementById('pType');
  tb.textContent = TYPE_LABELS[data.type]||data.type;
  tb.className = `type-badge tb-${data.type}`;

  const sb = document.getElementById('pStatus');
  sb.textContent = data.status;
  sb.className = `sbadge sb-${data.status}`;

  const sel = document.getElementById('statusSel');
  sel.innerHTML = '<option value="">CHANGE STATUS...</option>';
  (STATUS_TRANSITIONS[data.status]||[]).forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = '→ '+s.toUpperCase(); sel.appendChild(o);
  });
  sel.disabled = (STATUS_TRANSITIONS[data.status]||[]).length === 0;

  renderPersonal(data);
  await loadSpecific(data);
  await loadHistory(id);
}

function renderPersonal(p) {
  const fields = [
    ['DATE OF BIRTH', p.date_of_birth], ['PLACE OF BIRTH', p.place_of_birth],
    ['NATIONALITY', p.nationality], ['GENDER', p.gender],
    ['EMAIL', p.personal_email], ['PHONE', p.phone],
    ['CREATED', new Date(p.created_at).toLocaleDateString('en-GB')]
  ];
  document.getElementById('personalInfo').innerHTML = fields.map(([k,v]) =>
    `<div class="irow"><span class="ik">${k}</span><span class="iv" data-f="${k}">${v||'—'}</span></div>`
  ).join('');
}

async function loadSpecific(p) {
  let title = 'ADDITIONAL INFORMATION', html = '';
  if (p.type==='STU'||p.type==='PHD') {
    title = 'ACADEMIC INFORMATION';
    const { data } = await db.from('students').select('*').eq('id', p.id).single();
    if (data) html = [
      ['NATIONAL ID',data.national_id],['MAJOR',data.major],['ENTRY YEAR',data.entry_year],
      ['FACULTY',data.faculty],['DEPARTMENT',data.department],['GROUP',data.group_name],
      ['DIPLOMA',`${data.diploma_type||''} ${data.diploma_year||''} ${data.diploma_honors||''}`.trim()],
      ['SCHOLARSHIP',data.scholarship?'YES':'NO']
    ].map(([k,v])=>`<div class="irow"><span class="ik">${k}</span><span class="iv">${v||'—'}</span></div>`).join('');
  } else if (p.type==='FAC') {
    title = 'PROFESSIONAL INFORMATION';
    const { data } = await db.from('faculty').select('*').eq('id', p.id).single();
    if (data) html = [
      ['RANK',data.rank],['CATEGORY',data.employment_category],['DEPARTMENT',data.primary_department],
      ['OFFICE',data.office],['PHD INSTITUTION',data.phd_institution],['RESEARCH AREAS',data.research_areas],
      ['HABILITATION',data.habilitation?'YES':'NO'],['CONTRACT TYPE',data.contract_type],['TEACHING HOURS',data.teaching_hours]
    ].map(([k,v])=>`<div class="irow"><span class="ik">${k}</span><span class="iv">${v||'—'}</span></div>`).join('');
  } else if (p.type==='STF'||p.type==='TMP') {
    title = 'STAFF INFORMATION';
    const { data } = await db.from('staff').select('*').eq('id', p.id).single();
    if (data) html = [
      ['DEPARTMENT',data.department],['JOB TITLE',data.job_title],
      ['GRADE',data.grade],['ENTRY DATE',data.entry_date]
    ].map(([k,v])=>`<div class="irow"><span class="ik">${k}</span><span class="iv">${v||'—'}</span></div>`).join('');
  }
  document.getElementById('specificTitle').textContent = title;
  document.getElementById('specificInfo').innerHTML = html || '<div class="no-hist">NO ADDITIONAL DATA</div>';
}

async function loadHistory(personId) {
  const { data } = await db.from('modification_history')
    .select('*').eq('person_id', personId).order('modified_at', { ascending: false });
  const el = document.getElementById('historyContent');
  if (!data || data.length === 0) { el.innerHTML = '<div class="no-hist">NO MODIFICATIONS RECORDED YET</div>'; return; }
  el.innerHTML = data.map(h => `
    <div class="hist-row">
      <span class="hdate">${new Date(h.modified_at).toLocaleString('en-GB')}</span>
      <span class="hfield">${h.field_name}</span>
      <span class="hold">${h.old_value||'—'}</span>
      <span class="hnew">${h.new_value||'—'}</span>
    </div>
  `).join('');
}

async function changeStatus() {
  const newStatus = document.getElementById('statusSel').value;
  if (!newStatus || !person) return;
  const old = person.status;
  const { error } = await db.from('persons').update({ status: newStatus }).eq('id', person.id);
  if (error) { alert('Error: '+error.message); return; }
  await db.from('modification_history').insert([{ person_id: person.id, field_name: 'STATUS', old_value: old, new_value: newStatus }]);
  person.status = newStatus;
  document.getElementById('pStatus').textContent = newStatus;
  document.getElementById('pStatus').className = `sbadge sb-${newStatus}`;
  const sel = document.getElementById('statusSel');
  sel.innerHTML = '<option value="">CHANGE STATUS...</option>';
  (STATUS_TRANSITIONS[newStatus]||[]).forEach(s => { const o = document.createElement('option'); o.value=s; o.textContent='→ '+s.toUpperCase(); sel.appendChild(o); });
  sel.disabled = (STATUS_TRANSITIONS[newStatus]||[]).length === 0;
  await loadHistory(person.id);
}

function toggleEdit() {
  editing = !editing;
  const btn = document.getElementById('editBtn');
  if (editing) {
    btn.textContent = '💾 SAVE CHANGES'; btn.className = 'prof-action-btn pab-save'; btn.onclick = saveChanges;
    document.querySelectorAll('#personalInfo .iv').forEach(span => {
      if (span.dataset.f === 'CREATED') return;
      const inp = document.createElement('input');
      inp.value = span.textContent === '—' ? '' : span.textContent;
      inp.dataset.f = span.dataset.f; span.replaceWith(inp);
    });
  } else {
    btn.textContent = '✏ EDIT INFO'; btn.className = 'prof-action-btn pab-edit'; btn.onclick = toggleEdit;
    renderPersonal(person);
  }
}

async function saveChanges() {
  const map = { 'DATE OF BIRTH':'date_of_birth','PLACE OF BIRTH':'place_of_birth','NATIONALITY':'nationality','GENDER':'gender','EMAIL':'personal_email','PHONE':'phone' };
  const updates = {}, hist = [];
  document.querySelectorAll('#personalInfo input').forEach(inp => {
    const dbf = map[inp.dataset.f]; if (!dbf) return;
    const oldV = person[dbf]||'', newV = inp.value.trim();
    if (oldV !== newV) { updates[dbf] = newV; hist.push({ person_id: person.id, field_name: inp.dataset.f, old_value: String(oldV), new_value: newV }); }
  });
  if (Object.keys(updates).length > 0) {
    const { error } = await db.from('persons').update(updates).eq('id', person.id);
    if (error) { alert('Save error: '+error.message); return; }
    if (hist.length) await db.from('modification_history').insert(hist);
    Object.assign(person, updates);
  }
  editing = false;
  const btn = document.getElementById('editBtn');
  btn.textContent = '✏ EDIT INFO'; btn.className = 'prof-action-btn pab-edit'; btn.onclick = toggleEdit;
  renderPersonal(person);
  await loadHistory(person.id);
}

function showErr() {
  document.getElementById('loadMsg').style.display = 'none';
  document.getElementById('errMsg').style.display = 'block';
}

// VULNERABILITY 1 — XSS via innerHTML (High severity)
function showUsername(username) {
    document.getElementById("welcome").innerHTML = "Hello, " + username;
}

// VULNERABILITY 2 — eval() usage (High severity)
function calculate(input) {
    return eval(input);
}

// VULNERABILITY 3 — Hardcoded password (High severity)
const DB_PASSWORD = "admin1234";
const API_KEY = "sk-abc123supersecretkey";

// VULNERABILITY 4 — Math.random() for security token (Medium)
function generateToken() {
    return Math.random().toString(36);
}

// VULNERABILITY 5 — document.write (Medium)
function displayMessage(msg) {
    document.write(msg);
}

window.addEventListener('DOMContentLoaded', loadProfile);
