const TYPE_LABELS = { STU:'Student', FAC:'Faculty', STF:'Staff', PHD:'PhD', TMP:'Temporary' };

async function runSearch() {
  const text   = document.getElementById('qText').value.trim().toLowerCase();
  const type   = document.getElementById('qType').value;
  const status = document.getElementById('qStatus').value;

  document.getElementById('resMsg').textContent = 'SEARCHING...';
  document.getElementById('resMsg').style.display = 'block';
  document.getElementById('resTable').style.display = 'none';
  document.getElementById('resCount').textContent = '—';

  let req = db.from('persons').select('*').order('created_at', { ascending: false });
  if (type)   req = req.eq('type', type);
  if (status) req = req.eq('status', status);

  const { data, error } = await req;
  if (error || !data) { document.getElementById('resMsg').textContent = 'ERROR FETCHING DATA.'; return; }

  let results = data;
  if (text) {
    results = data.filter(p =>
      (p.first_name||'').toLowerCase().includes(text) ||
      (p.last_name||'').toLowerCase().includes(text)  ||
      (p.personal_email||'').toLowerCase().includes(text) ||
      (p.id||'').toLowerCase().includes(text)
    );
  }

  document.getElementById('resCount').textContent = `${results.length} RECORD(S) FOUND`;

  if (results.length === 0) { document.getElementById('resMsg').textContent = 'NO RECORDS MATCH YOUR CRITERIA.'; return; }

  const tbody = document.getElementById('resBody');
  tbody.innerHTML = results.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><strong>${p.first_name} ${p.last_name}</strong></td>
      <td><span class="type-badge tb-${p.type}">${TYPE_LABELS[p.type]||p.type}</span></td>
      <td style="font-size:10px;font-family:var(--mono)">${p.personal_email}</td>
      <td><span class="sbadge sb-${p.status}">${p.status}</span></td>
      <td style="font-family:var(--mono);font-size:10px;color:var(--muted)">${new Date(p.created_at).toLocaleDateString('en-GB')}</td>
      <td><a href="profile.html?id=${p.id}" class="view-link">VIEW →</a></td>
    </tr>
  `).join('');

  document.getElementById('resMsg').style.display = 'none';
  document.getElementById('resTable').style.display = 'table';
}

function clearSearch() {
  document.getElementById('qText').value   = '';
  document.getElementById('qType').value   = '';
  document.getElementById('qStatus').value = '';
  document.getElementById('qYear').value   = '';
  document.getElementById('resTable').style.display = 'none';
  document.getElementById('resMsg').textContent = 'ENTER SEARCH CRITERIA OR PRESS SEARCH TO LOAD ALL';
  document.getElementById('resMsg').style.display = 'block';
  document.getElementById('resCount').textContent = '—';
}