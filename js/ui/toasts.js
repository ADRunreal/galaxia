/* ═══════════════════════════════════════════════════════════
 * toasts.js — Notificaciones flotantes accesibles
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/4.7: aria-live="polite" en el contenedor
 *  - P2: máximo 3 toasts simultáneos
 */
import { el } from '../utils/dom.js';

const MAX_TOASTS = 3;

export function initToasts() {
  // El contenedor ya tiene aria-live en el HTML
}

export function showToast(text, duration = 2400) {
  const container = document.getElementById('toasts');
  if (!container) return;

  // Limitar cantidad
  while (container.children.length >= MAX_TOASTS) {
    container.removeChild(container.firstChild);
  }

  const node = el('div', { class: 'toast', role: 'status' }, [text]);
  container.appendChild(node);

  requestAnimationFrame(() => node.classList.add('show'));

  setTimeout(() => {
    node.classList.remove('show');
    setTimeout(() => node.remove(), 300);
  }, duration);
}
