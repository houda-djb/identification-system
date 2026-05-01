
function onTypeChange(type) {
  ['STU','PHD','FAC','STF','TMP'].forEach(t => {
    document.getElementById('btn-'+t).classList.toggle('selected', t === type);
  });
  document.getElementById('commonPanel').style.display = 'block';
  document.getElementById('studentPanel').style.display = (type==='STU'||type==='PHD') ? 'block' : 'none';
  document.getElementById('facultyPanel').style.display = type==='FAC' ? 'block' : 'none';
  document.getElementById('staffPanel').style.display   = (type==='STF'||type==='TMP') ? 'block' : 'none';
  document.getElementById('submitPanel').style.display  = 'block';
  updateIdPreview(type);
}

function g(id) { return document.getElementById(id)?.value.trim() || ''; }

function showErr(msg) {
  document.getElementById('errBox').textContent = '⚠ ' + msg;
  document.getElementById('errBox').style.display = 'block';
  document.getElementById('okBox').style.display  = 'none';
}

function showOk(msg) {
  document.getElementById('okBox').innerHTML = msg;
  document.getElementById('okBox').style.display  = 'block';
  document.getElementById('errBox').style.display = 'none';
}

function validate() {
  const type = document.querySelector('input[name="ptype"]:checked')?.value;
  if (!type) return 'Please select an identity type.';
  const fn = g('firstName'), ln = g('lastName');
  if (fn.length < 2) return 'First name must be at least 2 characters.';
  if (ln.length < 2) return 'Last name must be at least 2 characters.';
  const email = g('personalEmail');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  const dob = g('dateOfBirth');
  if (!dob) return 'Date of birth is required.';
  if (new Date(dob) > new Date()) return 'Date of birth cannot be in the future.';
  if (type==='STU'||type==='PHD') {
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    if (age < 16) return 'Student must be at least 16 years old.';
  }
  const phone = g('phone');
  if (phone && !/^\d+$/.test(phone)) return 'Phone number must contain digits only.';
  return null;
}

// ─── Generate temporary password ─────────────────────
function generateTempPassword() {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 6; i++) {
    const all = upper + lower + numbers + special;
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// ─── Generate username ────────────────────────────────
function generateUsername(firstName, lastName) {
  return (firstName + '.' + lastName)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z.]/g, '');
}

// ─── Create auth credentials ──────────────────────────
async function createAuthCredentials(identityId, identityType, firstName, lastName) {
  const tempPassword = generateTempPassword();

  const res = await fetch(window.SUPABASE_URL + '/functions/v1/auth-password', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+window.SUPABASE_ANON_KEY },
    body: JSON.stringify({ action: 'hash', password: tempPassword })
  });
  const { hash, error: hashErr } = await res.json();
  if (hashErr) throw new Error('Hash error: ' + hashErr);

  const authLevels = { STU:1, PHD:2, FAC:2, STF:2, TMP:1 };
  const authLevel  = authLevels[identityType] || 1;

  let username = generateUsername(firstName, lastName);
  const { data: existing } = await window.supabase
    .from('auth_credentials').select('username').ilike('username', username + '%');
  if (existing && existing.length > 0) username = username + (existing.length + 1);

  const { error: insertErr } = await window.supabase.from('auth_credentials').insert({
    identity_id:    identityId,
    username:       username,
    password_hash:  hash,
    auth_level:     authLevel,
    is_first_login: true,
  });

  if (insertErr) throw new Error('Auth insert error: ' + insertErr.message);

  return { username, tempPassword };
}

// ─── Send confirmation email ──────────────────────────
async function sendConfirmationEmail(email, name, identityId, username, tempPassword) {
  try {
    const uniName = window.APP_CONFIG?.university?.name || 'University';
    await fetch(window.SUPABASE_URL + '/functions/v1/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+window.SUPABASE_ANON_KEY },
      body: JSON.stringify({
        email, name, identity_id: identityId,
        username, temp_password: tempPassword,
        university_name: uniName,
      }),
    });
    console.log('Confirmation email sent to:', email);
  } catch(e) {
    console.warn('Confirmation email failed (non-critical):', e.message);
  }
}

// ─── Main form submission ─────────────────────────────
async function submitForm() {
  const type = document.querySelector('input[name="ptype"]:checked')?.value;
  const err = validate();
  if (err) { showErr(err); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '◌ PROCESSING...';

  // Duplicate check
  const { data: dup } = await db.from('persons')
    .select('id').eq('first_name', g('firstName'))
    .eq('last_name', g('lastName')).eq('date_of_birth', g('dateOfBirth'));
  if (dup && dup.length > 0) {
    showErr('A person with this name and date of birth already exists.');
    btn.disabled = false; btn.textContent = '⊕ CREATE IDENTITY'; return;
  }

  const newId = await generateId(type);
  if (!newId) {
    showErr('Failed to generate ID.');
    btn.disabled = false; btn.textContent = '⊕ CREATE IDENTITY'; return;
  }

  // Insert person
  const person = {
    id: newId, type,
    first_name: g('firstName'), last_name: g('lastName'),
    date_of_birth: g('dateOfBirth'), place_of_birth: g('placeOfBirth'),
    nationality: g('nationality'), gender: g('gender'),
    personal_email: g('personalEmail'), phone: g('phone'),
    status: 'Pending'
  };

  const { error: e1 } = await db.from('persons').insert([person]);
  if (e1) {
    showErr(e1.message.includes('unique') ? 'Email already registered.' : 'Error: ' + e1.message);
    btn.disabled = false; btn.textContent = '⊕ CREATE IDENTITY'; return;
  }

  // Insert type-specific data
  if (type==='STU' || type==='PHD') {
    await db.from('students').insert([{
      id: newId, national_id: g('nationalId'), diploma_type: g('diplomaType'),
      diploma_year: g('diplomaYear')||null, diploma_honors: g('diplomaHonors'),
      major: g('major'), entry_year: g('entryYear')||null,
      faculty: g('studentFaculty'), department: g('studentDepartment'),
      group_name: g('groupName'), scholarship: g('scholarship')==='true'
    }]);
  } else if (type==='FAC') {
    await db.from('faculty').insert([{
      id: newId, rank: g('rank'), employment_category: g('employmentCategory'),
      appointment_date: g('appointmentDate')||null, primary_department: g('primaryDepartment'),
      office: g('office'), phd_institution: g('phdInstitution'),
      research_areas: g('researchAreas'), habilitation: g('habilitation')==='true',
      contract_type: g('contractType'), contract_start: g('contractStart')||null,
      contract_end: g('contractEnd')||null, teaching_hours: g('teachingHours')||null
    }]);
  } else if (type==='STF' || type==='TMP') {
    await db.from('staff').insert([{
      id: newId, department: g('staffDepartment'), job_title: g('jobTitle'),
      grade: g('grade'), entry_date: g('entryDate')||null
    }]);
  }

  // Create auth credentials
  let username = '—';
  let tempPassword = '—';
  try {
    const authResult = await createAuthCredentials(newId, type, g('firstName'), g('lastName'));
    username    = authResult.username;
    tempPassword = authResult.tempPassword;

    // Send confirmation email (non-blocking)
    const fullName = g('firstName') + ' ' + g('lastName');
    sendConfirmationEmail(g('personalEmail'), fullName, newId, username, tempPassword);

  } catch(authErr) {
    console.error('Auth credentials error:', authErr.message);
  }

  // Show success
  document.getElementById('previewId').textContent = newId;
  document.getElementById('idPreviewBox').style.display = 'flex';

  showOk(`
    ✔ IDENTITY CREATED SUCCESSFULLY<br><br>
    🪪 ID: <strong>${newId}</strong><br>
    👤 USERNAME: <strong>${username}</strong><br>
    🔑 TEMP PASSWORD: <strong>${tempPassword}</strong><br><br>
    📧 CONFIRMATION EMAIL SENT TO: <strong>${g('personalEmail')}</strong><br><br>
    ⚠ GIVE THESE CREDENTIALS TO THE USER.<br>
    THEY MUST CHANGE THE PASSWORD ON FIRST LOGIN.
  `);

  btn.textContent = '⊕ CREATE IDENTITY';
  btn.disabled = false;

  // Reset form after 6 seconds
  setTimeout(() => {
    ['STU','PHD','FAC','STF','TMP'].forEach(t =>
      document.getElementById('btn-'+t).classList.remove('selected'));
    document.querySelectorAll('input[name="ptype"]').forEach(r => r.checked = false);
    ['commonPanel','studentPanel','facultyPanel','staffPanel','submitPanel'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
    document.querySelectorAll('.create-inner input[type=text],.create-inner input[type=email],.create-inner input[type=date],.create-inner input[type=number]')
      .forEach(el => el.value = '');
    document.querySelectorAll('.create-inner select').forEach(el => el.selectedIndex = 0);
    document.getElementById('okBox').style.display  = 'none';
    document.getElementById('idPreviewBox').style.display = 'none';
  }, 6000);
}