// =====================================================
// auth-password.js — UNIV BATNA 2
// Calls the auth-password Edge Function for all
// password operations: hash, verify, validate
// =====================================================

const EDGE_URL = window.SUPABASE_URL + '/functions/v1/auth-password';

async function _callEdge(payload) {
  const res = await fetch(EDGE_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + window.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── Hash a new password (bcrypt cost 12) ────────────────
async function hashPassword(password, identity = {}) {
  const data = await _callEdge({ action: 'hash', password, identity });
  if (data.error) throw new Error(data.error);
  return data.hash;
}

// ─── Verify password against stored hash ─────────────────
async function verifyPassword(password, hash) {
  const data = await _callEdge({ action: 'verify', password, hash });
  if (data.error) throw new Error(data.error);
  return data.match; // true | false
}

// ─── Validate password policy + get strength ─────────────
// Returns { valid, strength, score, error }
async function validatePassword(password, identity = {}) {
  const data = await _callEdge({ action: 'validate', password, identity });
  return data;
}

// ─── Check password history (last 5) ─────────────────────
// Returns true if password was already used
async function isPasswordReused(identityId, plainPassword) {
  const { data: history } = await window.supabase
    .from('auth_password_history')
    .select('password_hash')
    .eq('identity_id', identityId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!history || history.length === 0) return false;

  for (const row of history) {
    const match = await verifyPassword(plainPassword, row.password_hash);
    if (match) return true;
  }
  return false;
}

// ─── Save new password (hash + store in history) ─────────
async function saveNewPassword(identityId, plainPassword, identity = {}) {
  // 1. Hash the new password
  const hash = await hashPassword(plainPassword, identity);

  // 2. Update auth_credentials
  const { error } = await window.supabase
    .from('auth_credentials')
    .update({
      password_hash:  hash,
      is_first_login: false,
      updated_at:     new Date().toISOString(),
    })
    .eq('identity_id', identityId);

  if (error) throw new Error(error.message);

  // 3. Add to password history
  await window.supabase.from('auth_password_history').insert({
    identity_id:   identityId,
    password_hash: hash,
  });

  // 4. Keep only last 5 in history (delete older ones)
  const { data: allHistory } = await window.supabase
    .from('auth_password_history')
    .select('id, created_at')
    .eq('identity_id', identityId)
    .order('created_at', { ascending: false });

  if (allHistory && allHistory.length > 5) {
    const toDelete = allHistory.slice(5).map(r => r.id);
    await window.supabase
      .from('auth_password_history')
      .delete()
      .in('id', toDelete);
  }

  return hash;
}

// ─── Strength bar renderer (for UI) ──────────────────────
function renderStrengthBar(containerId, strength) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const levels = {
    'WEAK':        1,
    'MODERATE':    2,
    'STRONG':      3,
    'VERY STRONG': 4
  };
  const colors = {
    'WEAK':        'var(--red)',
    'MODERATE':    'var(--accent3)',
    'STRONG':      'var(--accent2)',
    'VERY STRONG': 'var(--accent)',
  };

  const level = levels[strength] || 0;
  const color = colors[strength] || 'var(--muted)';
  const pct   = (level / 4) * 100;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
      <span style="font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:0.1em">
        PASSWORD STRENGTH
      </span>
      <span style="font-family:var(--mono);font-size:9px;color:${color};letter-spacing:0.1em">
        ${strength}
      </span>
    </div>
    <div style="height:3px;background:var(--panelbrd);border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${color};transition:width 0.4s ease;box-shadow:0 0 8px ${color}40;"></div>
    </div>
  `;
}