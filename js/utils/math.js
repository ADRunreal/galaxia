/* ═══════════════ CONSTANTES ═══════════════ */
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

/* ═══════════════ NORMALIZACIÓN ═══════════════ */
export function norm(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/* ═══════════════ RUIDO GAUSSIANO ═══════════════ */
export function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

/* ═══════════════ INTERPOLACIÓN SUAVE ═══════════════ */
export function smoothstep(x, a, b) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ═══════════════ HASH DETERMINISTA ═══════════════ */
export function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/* ═══════════════ KEPLER ROBUSTO ═══════════════
 * Resuelve la ecuación de Kepler M = E - e·sin(E)
 * con Newton-Raphson + fallback a bisección para e altos.
 */
export function solveKepler(M, e) {
  M = ((M % TAU) + TAU) % TAU;
  e = clamp(e, 0, 0.9999);

  if (e < 1e-8) return M;

  let E = e > 0.8 ? Math.PI : M;
  let converged = false;

  for (let i = 0; i < 30; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    if (Math.abs(fp) < 1e-12) break;
    const dE = f / fp;
    E -= dE;
    if (Math.abs(dE) < 1e-12) { converged = true; break; }
  }

  if (!converged) {
    // Fallback bisección
    let lo = 0, hi = TAU;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const f = mid - e * Math.sin(mid) - M;
      if (f > 0) hi = mid; else lo = mid;
    }
    E = (lo + hi) / 2;
  }
  return E;
}

/* ═══════════════ ESCALA TEMPORAL LOGARÍTMICA ═══════════════
 * Convierte un período en días a un tiempo visual en segundos
 * dentro de un rango [minSec, maxSec], usando escala logarítmica.
 */
export function periodToVisualSeconds(periodDays, minSec = 8, maxSec = 60) {
  const minDays = 0.0644;    // ISS
  const maxDays = 4161000;   // Sedna
  const t = (Math.log10(Math.max(periodDays, minDays)) - Math.log10(minDays)) /
            (Math.log10(maxDays) - Math.log10(minDays));
  return minSec + (maxSec - minSec) * clamp(t, 0, 1);
}

/* ═══════════════ PREFERS REDUCED MOTION ═══════════════ */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
