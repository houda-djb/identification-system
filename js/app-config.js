
const APP_CONFIG = {

  // ── University (customize per deployment) ─────────
  university: {
    name:      'UNIV BATNA 2',   
    short:     'UB2',              
    id:        'UNIV-DZ-BATNA2-001',           
  },

  // ── Product branding ──────────────────────────────
  product: {
    name:      'UniGuard',
    subtitle:  'IDENTITY & ACCESS MANAGEMENT',
    logo:      'UG',
    version:   '1.0.0',
    author:    'SYLVAH™',
    year:      '2026',
    copyright: '© 2026 SYLVAH™. All Rights Reserved.',
  },

  // ── Auth settings ─────────────────────────────────
  auth: {
    sessionDuration: 8,    // hours
    maxFailedAttempts: 5,
    lockoutMinutes: 30,
    otpExpiryMinutes: 5,
  },
};

const SYLVAH_SIGNATURE = {
  product:    'UNIGUARD-IAM',
  author:     'SYLVAH™',
  version:    '1.0.0',
  created:    '2026-03-29',
  repository: 'github.com/houda-djb/uniguard',
  id:         'UG-SYL-2026-C4M1',
  hash:       'a7f3e2c9d1b8f4a2',
};

window.APP_CONFIG       = APP_CONFIG;
window.__uniguard_iam__ = SYLVAH_SIGNATURE;