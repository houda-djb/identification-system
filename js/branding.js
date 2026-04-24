// =====================================================
// branding.js — UniGuard IAM System
// © 2026 SYLVAH™. All Rights Reserved.
// Applies APP_CONFIG branding to current page
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
  if (!window.APP_CONFIG) return;

  const { university, product } = window.APP_CONFIG;

  // ── Logo symbol ───────────────────────────────────
  document.querySelectorAll('.logo-hex').forEach(el => {
    el.textContent = product.logo;
  });

  // ── University name ───────────────────────────────
  document.querySelectorAll('.logo-title').forEach(el => {
    el.textContent = university.name;
  });

  // ── Subtitle ──────────────────────────────────────
  document.querySelectorAll('.logo-sub').forEach(el => {
    el.textContent = product.subtitle;
  });

  // ── Topbar titles ─────────────────────────────────
  document.querySelectorAll('.tb-title').forEach(el => {
    el.textContent = university.name;
  });

  document.querySelectorAll('.tb-sub').forEach(el => {
    el.textContent = product.subtitle;
  });

  // ── Page title (browser tab) ──────────────────────
  document.title = document.title
    .replace('UNIV BATNA 2', university.name)
    .replace('UNIV BATNA 2', university.name);

  // ── Status bar ────────────────────────────────────
  document.querySelectorAll('.sb-item').forEach(el => {
    if (el.textContent.includes('UNIV BATNA 2')) {
      el.textContent = el.textContent.replace('UNIV BATNA 2', university.name);
    }
  });

  // ── Copyright ─────────────────────────────────────
  document.querySelectorAll('.product-credit').forEach(el => {
    el.textContent = product.copyright;
  });

});