/* ═══════════════════════════════════════════════════════════
 * tour.js — Tour guiado con pausa, prev, next y stop
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.8: el tour se DETIENE al terminar el ciclo
 *  - P1/3.7: botones de pausa, prev y next
 *  - P2: respeta prefers-reduced-motion
 */
import { TOUR_BODIES, TOUR_DWELL_SECONDS } from '../config.js';
import { bodies } from '../celestial/CelestialBody.js';
import { prefersReducedMotion } from '../utils/math.js';

let active = false;
let paused = false;
let index = -1;
let timer = 0;

let bannerEl, textEl, btnPause, flyCallback;

export function initTour(onFlyTo) {
  flyCallback = onFlyTo;
  bannerEl = document.getElementById('tourBanner');
  textEl = document.getElementById('tourText');
  btnPause = document.getElementById('tourPause');

  document.getElementById('btnTour').addEventListener('click', startTour);
  document.getElementById('btnTour2').addEventListener('click', startTour);
  document.getElementById('tourStop').addEventListener('click', stopTour);
  document.getElementById('tourPause').addEventListener('click', togglePause);
  document.getElementById('tourPrev').addEventListener('click', prevStop);
  document.getElementById('tourNext').addEventListener('click', nextStop);
}

export function startTour() {
  if (active) return;
  active = true;
  paused = false;
  index = -1;
  timer = 0;
  if (bannerEl) bannerEl.classList.add('show');
  if (btnPause) {
    btnPause.textContent = '⏸';
    btnPause.title = 'Pausar tour';
  }
  nextStop();
}

export function stopTour() {
  active = false;
  paused = false;
  timer = 0;
  if (bannerEl) bannerEl.classList.remove('show');
}

export function isTourActive() {
  return active;
}

function togglePause() {
  if (!active) return;
  paused = !paused;
  if (btnPause) {
    btnPause.textContent = paused ? '▶' : '⏸';
    btnPause.title = paused ? 'Reanudar tour' : 'Pausar tour';
  }
}

function nextStop() {
  if (!active) return;
  index++;
  // P0/1.8: si llegamos al final, DETENER
  if (index >= TOUR_BODIES.length) {
    stopTour();
    return;
  }
  const id = TOUR_BODIES[index];
  const body = bodies[id];
  if (!body) { nextStop(); return; }
  if (textEl) textEl.textContent = `Tour · ${body.data.name}`;
  if (flyCallback) flyCallback(id);
  timer = 0;
  if (paused) {
    paused = false;
    if (btnPause) {
      btnPause.textContent = '⏸';
      btnPause.title = 'Pausar tour';
    }
  }
}

function prevStop() {
  if (!active) return;
  index = Math.max(0, index - 2); // -2 porque nextStop suma +1
  nextStop();
}

export function updateTour(dt) {
  if (!active || paused) return;
  timer += dt;
  if (timer >= TOUR_DWELL_SECONDS) nextStop();
}
