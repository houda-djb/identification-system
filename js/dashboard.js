const TYPE_LABELS = { STU:'Student', FAC:'Faculty', STF:'Staff', PHD:'PhD', TMP:'Temporary' };

let donutChart, barChart;

async function loadDashboard() {
  const { data, error } = await db.from('persons').select('type, status, created_at');
  if (error || !data) return;

  const total = data.length;
  const stu   = data.filter(p => p.type === 'STU').length;
  const phd   = data.filter(p => p.type === 'PHD').length;
  const fac   = data.filter(p => p.type === 'FAC').length;
  const stf   = data.filter(p => p.type === 'STF').length;
  const tmp   = data.filter(p => p.type === 'TMP').length;

  document.getElementById('totalCount').textContent = total || '0';
  document.getElementById('ls1').textContent = `Students (${stu})`;
  document.getElementById('ls2').textContent = `Faculty (${fac})`;
  document.getElementById('ls3').textContent = `Admin. Staff (${stf})`;
  document.getElementById('ls4').textContent = `PhD Candidates (${phd})`;
  document.getElementById('ls5').textContent = `Temporary (${tmp})`;

  const donutCtx = document.getElementById('donutChart').getContext('2d');
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Students','Faculty','Staff','PhD','Temp'],
      datasets: [{
        data: [stu, fac, stf, phd, tmp],
        backgroundColor: ['#00d4ff','#7fff00','#ff9f00','#bf5fff','#ff3c3c'],
        borderColor: '#0b1422', borderWidth: 3, hoverOffset: 4
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` },
        bodyColor: '#c8dff0', backgroundColor: '#0b1422', borderColor: '#1a2d45', borderWidth: 1
      }},
      animation: { animateRotate: true, duration: 900 }
    }
  });

  const statuses = ['Pending','Active','Suspended','Inactive','Archived'];
  const statusCounts = statuses.map(s => data.filter(p => p.status === s).length);
  const barCtx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: statuses,
      datasets: [{
        data: statusCounts,
        backgroundColor: ['#ff9f0066','#7fff0066','#ff3c3c66','#4a6a8566','#1a1a2a99'],
        borderColor:      ['#ff9f00',  '#7fff00',  '#ff3c3c',  '#4a6a85',  '#333'],
        borderWidth: 1, borderRadius: 2
      }]
    },
    options: {
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#0b1422', borderColor: '#1a2d45', borderWidth: 1,
        titleColor: '#00d4ff', bodyColor: '#c8dff0'
      }},
      scales: {
        x: { grid: { color: 'rgba(26,45,69,0.4)' }, ticks: { color: '#4a6a85', font: { family: 'Share Tech Mono', size: 10 } } },
        y: { grid: { color: 'rgba(26,45,69,0.4)' }, ticks: { color: '#4a6a85', font: { family: 'Share Tech Mono', size: 10 }, stepSize: 1 }, beginAtZero: true }
      },
      animation: { duration: 900 }
    }
  });

  const year = new Date().getFullYear();
  const stuThisYear = data.filter(p =>
    (p.type === 'STU' || p.type === 'PHD') &&
    p.created_at && new Date(p.created_at).getFullYear() === year
  ).length;
  document.getElementById('caseNum').textContent = stuThisYear;
  setTimeout(() => {
    document.getElementById('progFill').style.width = Math.min((stuThisYear / 15500) * 100, 100) + '%';
  }, 400);

  await loadRecentIds();
}

async function loadRecentIds() {
  const { data } = await db.from('persons')
    .select('id, type, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(8);

  const tbody = document.getElementById('recentIds');
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="lc">NO RECORDS YET</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(p => `
    <tr onclick="showQuickProfile('${p.id}')">
      <td>${p.id}</td>
      <td><span class="type-badge tb-${p.type}">${TYPE_LABELS[p.type] || p.type}</span></td>
      <td>${p.first_name} ${p.last_name}</td>
      <td>${new Date(p.created_at).toLocaleDateString('en-GB')} ${new Date(p.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</td>
    </tr>
  `).join('');
}

async function showQuickProfile(id) {
  const container = document.getElementById('quickProfile');
  container.innerHTML = '<div class="qp-placeholder"><div class="qp-icon">⊡</div><div>LOADING...</div></div>';

  const { data } = await db.from('persons').select('*').eq('id', id).single();
  if (!data) return;

  container.innerHTML = `
    <div class="quick-profile">
      <div class="qp-top">
        <div class="qp-avatar">${data.first_name[0]}${data.last_name[0]}</div>
        <div>
          <div class="qp-name">${data.first_name.toUpperCase()} ${data.last_name.toUpperCase()}</div>
          <div class="qp-id">${data.id}</div>
          <div class="qp-badges">
            <span class="type-badge tb-${data.type}">${TYPE_LABELS[data.type]||data.type}</span>
            <span class="sbadge sb-${data.status}">${data.status}</span>
          </div>
        </div>
      </div>
      <div class="qp-field"><span class="k">DOB</span><span class="v">${data.date_of_birth||'—'}</span></div>
      <div class="qp-field"><span class="k">NATIONALITY</span><span class="v">${data.nationality||'—'}</span></div>
      <div class="qp-field"><span class="k">EMAIL</span><span class="v" style="font-size:10px">${data.personal_email||'—'}</span></div>
      <div class="qp-field"><span class="k">PHONE</span><span class="v">${data.phone||'—'}</span></div>
      <div class="qp-field"><span class="k">GENDER</span><span class="v">${data.gender||'—'}</span></div>
      <div class="qp-actions">
        <a href="profile.html?id=${data.id}" class="qp-btn primary">VIEW DETAILED</a>
        <span class="qp-btn info" onclick="document.getElementById('quickProfile').innerHTML='<div class=qp-placeholder><div class=qp-icon>⊡</div><div>SELECT A RECORD TO VIEW PROFILE</div></div>'">✕ CLOSE</span>
      </div>
    </div>
  `;
}

window.addEventListener('DOMContentLoaded', loadDashboard);