/* ═══════════════════════════════════════════════════════════
 * info.js — Panel de información del cuerpo seleccionado
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/4.1: aria-live en el panel
 *  - P2: soporte para compartir vista (botón extra)
 */
import { bodies } from '../celestial/CelestialBody.js';
import { showToast } from './toasts.js';
import { escapeHtml } from '../utils/dom.js';

let infoEl, infoName, infoType, infoDesc, infoStats;
let selectedId = null;

export function initInfo() {
  infoEl = document.getElementById('info');
  infoName = document.getElementById('infoName');
  infoType = document.getElementById('infoType');
  infoDesc = document.getElementById('infoDesc');
  infoStats = document.getElementById('infoStats');
}

export function getSelectedId() {
  return selectedId;
}

export function selectBody(id) {
  const body = bodies[id];
  if (!body) return;
  selectedId = id;
  const d = body.data;

  infoName.textContent = d.name;
  infoType.textContent = d.type;
  infoDesc.textContent = d.desc;

  infoStats.innerHTML = `
    <div class="info-stat"><div class="label">Diámetro</div><div class="value">${escapeHtml(d.diameter || '—')}</div></div>
    <div class="info-stat"><div class="label">Distancia</div><div class="value">${escapeHtml(d.distance || '—')}</div></div>
    <div class="info-stat"><div class="label">Período orbital</div><div class="value">${escapeHtml(d.orbPeriod || '—')}</div></div>
    <div class="info-stat"><div class="label">Período rotación</div><div class="value">${escapeHtml(d.rotPeriod || '—')}</div></div>
  `;
  infoEl.classList.remove('hidden');
}

export function clearSelection() {
  selectedId = null;
  if (infoEl) infoEl.classList.add('hidden');
}

/* ═══════════════ COMPARTIR ═══════════════ */

export function shareBodyLink() {
  if (!selectedId) return;
  const url = `${location.origin}${location.pathname}?body=${encodeURIComponent(selectedId)}`;
  copyToClipboard(url, 'Enlace copiado al portapapeles');
}

export function shareCurrentView(cameraPos, targetPos, simTimeDays, currentBodyId) {
  const params = new URLSearchParams();
  if (currentBodyId) params.set('body', currentBodyId);
  params.set('cam', `${cameraPos.x.toFixed(2)},${cameraPos.y.toFixed(2)},${cameraPos.z.toFixed(2)}`);
  params.set('target', `${targetPos.x.toFixed(2)},${targetPos.y.toFixed(2)},${targetPos.z.toFixed(2)}`);
  params.set('t', simTimeDays.toFixed(2));
  const url = `${location.origin}${location.pathname}?${params.toString()}`;
  copyToClipboard(url, 'Vista copiada al portapapeles');
}

function copyToClipboard(text, successMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg))
      .catch(() => showToast('No se pudo copiar. Enlace: ' + text));
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(successMsg); }
    catch { showToast('Enlace: ' + text); }
    document.body.removeChild(ta);
  }
}
