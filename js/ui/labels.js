/* ═══════════════════════════════════════════════════════════
 * labels.js — Etiquetas 2D sobre los cuerpos celestes
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/1.9: filtra correctamente los cuerpos detrás de la cámara
 *  - P1/1.10: oculta etiquetas al desactivar el toggle (no solo retorna)
 *  - P2/2.2: cachea posiciones y solo recalcula cada N frames
 *  - P2: evita recalcular si la pestaña no está visible
 */
import * as THREE from 'three';
import { bodies } from '../celestial/CelestialBody.js';

const _v = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _toBody = new THREE.Vector3();

let labelsContainer = null;
let enabled = true;
let selectedId = null;
let frameCounter = 0;
const UPDATE_EVERY_N_FRAMES = 2;

export function initLabels() {
  labelsContainer = document.getElementById('labels');
  if (!labelsContainer) return;

  for (const id in bodies) {
    const body = bodies[id];
    const el = document.createElement('div');
    el.className = 'body-label hidden';
    el.textContent = body.data.name;
    el.setAttribute('aria-hidden', 'true');
    labelsContainer.appendChild(el);
    body.labelEl = el;
  }
}

export function setLabelsEnabled(v) {
  enabled = v;
  if (!v) {
    // P1/1.10: ocultar todas las etiquetas al desactivar
    for (const id in bodies) {
      if (bodies[id].labelEl) bodies[id].labelEl.classList.add('hidden');
    }
  }
}

export function setSelectedLabel(id) {
  selectedId = id;
  for (const bid in bodies) {
    const body = bodies[bid];
    if (body.labelEl) {
      body.labelEl.classList.toggle('active', bid === id);
    }
  }
}

export function updateLabels(camera) {
  if (!enabled || !labelsContainer) return;

  // P2: no recalcular si la pestaña está oculta
  if (document.hidden) return;

  // P2/2.2: solo cada N frames
  frameCounter++;
  if (frameCounter % UPDATE_EVERY_N_FRAMES !== 0) return;

  const camPos = camera.position;
  camera.getWorldDirection(_camDir);

  const h = window.innerHeight;
  const tanHalfFov = Math.tan((camera.fov * Math.PI / 180) / 2);
  const w = window.innerWidth;

  for (const id in bodies) {
    const body = bodies[id];
    const el = body.labelEl;
    if (!el) continue;

    // Reutilizar posición ya calculada
    _v.copy(body._lastWorldPos);

    // P1/1.9: descartar si está detrás de la cámara
    _toBody.copy(_v).sub(camPos);
    if (_toBody.dot(_camDir) < 0) {
      el.classList.add('hidden');
      continue;
    }

    const dist = _v.distanceTo(camPos);
    if (dist < 0.001) {
      el.classList.add('hidden');
      continue;
    }

    // Tamaño aparente
    const screenSize = (body.data.radius / dist) * (h * 0.5) / tanHalfFov;
    if (screenSize < 3) {
      el.classList.add('hidden');
      continue;
    }

    _v.project(camera);
    // Descartar fuera del frustum
    if (_v.x < -1.1 || _v.x > 1.1 || _v.y < -1.1 || _v.y > 1.1 || _v.z > 1) {
      el.classList.add('hidden');
      continue;
    }

    const x = (_v.x * 0.5 + 0.5) * w;
    const y = (-_v.y * 0.5 + 0.5) * h - 18;

    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    el.classList.remove('hidden');
  }
}

export function disposeLabels() {
  if (!labelsContainer) return;
  labelsContainer.innerHTML = '';
  for (const id in bodies) {
    if (bodies[id].labelEl) delete bodies[id].labelEl;
  }
  labelsContainer = null;
}
