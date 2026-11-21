/* ═══════════════════════════════════════════════════════════
 * camera.js — Cámara, OrbitControls y seguimiento de cuerpos
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.7: followTarget se limpia al hacer zoom/pan manual
 *  - P1/3.13: zoomBy actualiza offset persistido del followTarget
 *  - P1/4.3: animateCamera respeta prefers-reduced-motion
 *  - P2: camAnim con cancelación segura
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA_CFG } from '../config.js';
import { easeInOutCubic, prefersReducedMotion, clamp } from '../utils/math.js';

let camera = null;
let controls = null;
let camAnim = null;

// followTarget guarda { id, offset } donde offset es Vector3 relativo al cuerpo
let followTarget = null;

/**
 * Crea la cámara y los controles de órbita.
 * @param {THREE.WebGLRenderer} renderer
 */
export function createCamera(renderer) {
  camera = new THREE.PerspectiveCamera(
    CAMERA_CFG.fov,
    window.innerWidth / window.innerHeight,
    CAMERA_CFG.near,
    CAMERA_CFG.far
  );
  camera.position.set(
    CAMERA_CFG.initialPosition.x,
    CAMERA_CFG.initialPosition.y,
    CAMERA_CFG.initialPosition.z
  );

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = CAMERA_CFG.dampingFactor;
  controls.rotateSpeed = CAMERA_CFG.rotateSpeed;
  controls.zoomSpeed = CAMERA_CFG.zoomSpeed;
  controls.panSpeed = CAMERA_CFG.panSpeed;
  controls.minDistance = CAMERA_CFG.minDistance;
  controls.maxDistance = CAMERA_CFG.maxDistance;
  controls.target.set(0, 0, 0);

  // ─── Al iniciar interacción manual, se rompe el follow ───
  // Excepción: si estamos en medio de una animación de cámara, no.
  controls.addEventListener('start', () => {
    if (!camAnim) {
      // Solo limpiamos si el usuario empezó a orbitar/paneo, no si fue un clic
      // El clic se maneja aparte en main.js; aquí limpiamos siempre porque
      // un 'start' real implica gesto activo.
      // PERO: en pointerdown de selección de cuerpo también se dispara 'start'
      // en algunos navegadores. Por eso lo comprobamos con un flag externo.
      if (!window.__galaxiaSelectingBody) {
        followTarget = null;
      }
    }
  });

  return { camera, controls };
}

export function getCamera() {
  return camera;
}

export function getControls() {
  return controls;
}

/* ═══════════════ FOLLOW TARGET ═══════════════ */

export function setFollowTarget(id, offset) {
  followTarget = { id, offset: offset.clone() };
}

export function clearFollowTarget() {
  followTarget = null;
}

export function getFollowTarget() {
  return followTarget;
}

/**
 * Actualiza la cámara para seguir al cuerpo objetivo.
 * Se llama cada frame DESPUÉS de actualizar posiciones de cuerpos.
 * @param {Object} bodiesMap — mapa id → { mesh }
 */
export function updateCameraFollow(bodiesMap) {
  if (!followTarget || camAnim) return;
  const body = bodiesMap[followTarget.id];
  if (!body || !body.mesh) return;

  const targetPos = new THREE.Vector3();
  body.mesh.getWorldPosition(targetPos);

  // Mantener el offset actual respecto al cuerpo
  controls.target.copy(targetPos);
  camera.position.copy(targetPos).add(followTarget.offset);
}

/**
 * Recalcula el offset actual (útil si el usuario hizo zoom estando en follow).
 * Llamado por zoomBy.
 */
export function refreshFollowOffset(bodiesMap) {
  if (!followTarget) return;
  const body = bodiesMap[followTarget.id];
  if (!body || !body.mesh) return;
  const targetPos = new THREE.Vector3();
  body.mesh.getWorldPosition(targetPos);
  const currentOffset = camera.position.clone().sub(controls.target);
  followTarget.offset.copy(currentOffset);
}

/* ═══════════════ ANIMACIÓN DE CÁMARA ═══════════════ */

/**
 * Anima la cámara a una posición y target dados.
 * @param {THREE.Vector3} endPos
 * @param {THREE.Vector3} endTarget
 * @param {number} durationSec
 * @param {boolean} [clearFollow=true]
 */
export function animateCamera(endPos, endTarget, durationSec = 1.1, clearFollow = true) {
  if (prefersReducedMotion()) {
    camera.position.copy(endPos);
    controls.target.copy(endTarget);
    camAnim = null;
    if (clearFollow) followTarget = null;
    return;
  }

  if (clearFollow) followTarget = null;

  camAnim = {
    startPos: camera.position.clone(),
    startTarget: controls.target.clone(),
    endPos: endPos.clone(),
    endTarget: endTarget.clone(),
    duration: durationSec * 1000,
    startTime: performance.now()
  };
}

/**
 * Cancela la animación de cámara en curso.
 */
export function cancelCameraAnim() {
  camAnim = null;
}

export function isCameraAnimating() {
  return camAnim !== null;
}

/**
 * Tick de la animación. Llamar cada frame.
 */
export function tickCameraAnim() {
  if (!camAnim) return;
  const t = Math.min(1, (performance.now() - camAnim.startTime) / camAnim.duration);
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(camAnim.startPos, camAnim.endPos, e);
  controls.target.lerpVectors(camAnim.startTarget, camAnim.endTarget, e);
  if (t >= 1) camAnim = null;
}

/* ═══════════════ ZOOM ═══════════════ */

/**
 * Zoom relativo al target actual.
 * @param {number} factor — <1 acerca, >1 aleja
 * @param {Object} bodiesMap — para refrescar follow offset
 */
export function zoomBy(factor, bodiesMap) {
  const target = controls.target;
  const offset = camera.position.clone().sub(target);
  const len = offset.length();
  const newLen = clamp(len * factor, controls.minDistance, controls.maxDistance);
  offset.setLength(newLen);
  camera.position.copy(target).add(offset);

  // Si estamos siguiendo un cuerpo, persistir el nuevo offset
  if (followTarget && bodiesMap) {
    refreshFollowOffset(bodiesMap);
  }
}

/**
 * Vista global (home).
 */
export function goHome() {
  clearFollowTarget();
  cancelCameraAnim();
  animateCamera(
    new THREE.Vector3(
      CAMERA_CFG.initialPosition.x,
      CAMERA_CFG.initialPosition.y,
      CAMERA_CFG.initialPosition.z
    ),
    new THREE.Vector3(0, 0, 0),
    1.4,
    true
  );
}

/* ═══════════════ RESIZE ═══════════════ */

export function resizeCamera() {
  if (!camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

/* ═══════════════ DISPOSE ═══════════════ */

export function disposeCamera() {
  if (controls) controls.dispose();
  controls = null;
  camera = null;
  camAnim = null;
  followTarget = null;
}
