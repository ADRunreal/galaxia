/* ═══════════════════════════════════════════════════════════
 * renderer.js — WebGL Renderer con fallback y pixel ratio adaptativo
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/6.9: Fallback si WebGL falla → muestra #webglError
 *  - P0/2.6: Pixel ratio adaptativo (menos en LOW_POWER)
 *  - P2: canvas con z-index explícito (vía CSS)
 *  - P2: setClearColor explícito para evitar parpadeo
 */
import * as THREE from 'three';
import { RENDERER_CFG, LOW_POWER } from '../config.js';

let renderer = null;
let contextLost = false;

/**
 * Crea el renderer WebGL con detección de errores.
 * @returns {THREE.WebGLRenderer|null}
 */
export function createRenderer() {
  if (renderer) return renderer;

  let canvasEl = null;
  try {
    // Comprobación previa de WebGL (evita excepciones feas)
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL no disponible');
  } catch (e) {
    showWebGLError();
    return null;
  }

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: RENDERER_CFG.antialias,
      powerPreference: RENDERER_CFG.powerPreference,
      alpha: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: false
    });
  } catch (e) {
    console.error('Error creando WebGLRenderer:', e);
    showWebGLError();
    return null;
  }

  renderer.setPixelRatio(RENDERER_CFG.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = RENDERER_CFG.toneMappingExposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Sombras desactivadas (no las usamos, ahorra GPU)
  renderer.shadowMap.enabled = false;

  canvasEl = renderer.domElement;
  canvasEl.setAttribute('aria-label', 'Visualización 3D del Sistema Solar. Usa los botones del panel para navegar.');
  canvasEl.setAttribute('role', 'img');
  canvasEl.tabIndex = 0;
  document.body.appendChild(canvasEl);

  // ─── Detección de pérdida de contexto WebGL ───
  canvasEl.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    contextLost = true;
    console.warn('WebGL context lost');
    showContextLostMessage();
  }, false);

  canvasEl.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    console.info('WebGL context restored');
  }, false);

  // ─── Ajuste de pixel ratio en cambios de pantalla (multi-monitor) ───
  if (window.matchMedia) {
    const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onChangeDPR = () => {
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW_POWER ? 1.5 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    if (dprQuery.addEventListener) dprQuery.addEventListener('change', onChangeDPR);
    else if (dprQuery.addListener) dprQuery.addListener(onChangeDPR);
  }

  return renderer;
}

export function getRenderer() {
  return renderer;
}

export function isContextLost() {
  return contextLost;
}

/**
 * Resize handler global.
 */
export function resizeRenderer() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Muestra el panel de error WebGL.
 */
function showWebGLError() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hide');
  const err = document.getElementById('webglError');
  if (err) err.hidden = false;
}

function showContextLostMessage() {
  const err = document.getElementById('webglError');
  if (err) {
    err.hidden = false;
    const h1 = err.querySelector('h1');
    const p = err.querySelector('p');
    if (h1) h1.textContent = 'Se perdió el contexto WebGL';
    if (p) p.textContent = 'Recarga la página para continuar explorando el cosmos.';
  }
}

/**
 * Libera recursos del renderer.
 */
export function disposeRenderer() {
  if (!renderer) return;
  renderer.dispose();
  renderer.forceContextLoss?.();
  renderer = null;
}
