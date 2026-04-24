// =====================================================
// auth-guard.js — UNIV BATNA 2
// Protects pages and checks auth level access
// =====================================================

(async function () {

  // ─── Page access rules ───────────────────────────
  // Which pages require which minimum auth level
  const PAGE_RULES = {
    'index.html':      3,   // Admin only (L3+)
    'create.html':     3,   // Admin only
    'search.html':     3,   // Admin only
    'profile.html':    3,   // Admin only
    'my-profile.html': 1,   // Any logged in user
  };

  // ─── Get current page name ───────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // ─── Get required level for this page ────────────
  const requiredLevel = PAGE_RULES[currentPage] || 1;

  // ─── Check session exists ─────────────────────────
  const token      = sessionStorage.getItem('session_token');
  const identityId = sessionStorage.getItem('session_identity_id');
  const authLevel  = parseInt(sessionStorage.getItem('session_auth_level') || '0');

  // ─── No session → go to login ────────────────────
  if (!token || !identityId) {
    redirectToLogin('NO_SESSION');
    return;
  }

  // ─── Wait for supabase ────────────────────────────
  await waitForSupabase();

  try {
    // ─── Validate session in DB ───────────────────
    const { data: session, error } = await window.supabase
      .from('auth_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('identity_id', identityId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      clearSession();
      redirectToLogin('SESSION_EXPIRED');
      return;
    }

    // ─── Check auth level for this page ──────────
    if (session.auth_level < requiredLevel) {
      // Not enough permissions → go to own profile
      window.location.replace('my-profile.html');
      return;
    }

    // ─── All good — expose AUTH globally ─────────
    window.AUTH = {
      identityId:   session.identity_id,
      authLevel:    session.auth_level,
      sessionToken: token,
      sessionId:    session.id,
    };

    // ─── Show the page ────────────────────────────
    document.documentElement.style.visibility = 'visible';

  } catch(e) {
    console.error('Auth guard error:', e);
    redirectToLogin('ERROR');
  }

  // ─── Helpers ──────────────────────────────────────
  function redirectToLogin(reason) {
    const depth  = window.location.pathname.split('/').length - 2;
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    window.location.replace(prefix + 'auth/login.html?reason=' + reason);
  }

  function clearSession() {
    sessionStorage.removeItem('session_token');
    sessionStorage.removeItem('session_identity_id');
    sessionStorage.removeItem('session_auth_level');
  }

  function waitForSupabase(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (window.supabase) { resolve(); return; }
      const start = Date.now();
      const interval = setInterval(() => {
        if (window.supabase) { clearInterval(interval); resolve(); }
        else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('Supabase not loaded'));
        }
      }, 50);
    });
  }

})();