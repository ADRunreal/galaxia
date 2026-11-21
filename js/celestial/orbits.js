/* ═══════════════════════════════════════════════════════════
 * orbits.js — Líneas de órbita keplerianas
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/7.5: matrices de rotación R_z(Omega) · R_x(i) · R_z(omega)
 *            aplicadas en orden correcto
 *  - P2: resolución adaptativa (menos puntos en LOW_POWER)
 *  - P2: color y opacidad consistentes con el resto de la UI
 */
import * as THREE from 'three';
import { TAU } from '../utils/math.js';
import { LOW_POWER } from '../config.js';

const ORBIT_COLOR = 0x4a6ab8;
const ORBIT_OPACITY = 0.22;

/**
 * Crea una línea de órbita elíptica para un cuerpo.
 * @param {Object} body — instancia de CelestialBody (necesita a, e, i, omega, Omega)
 * @returns {THREE.Line}
 */
export function createOrbitLine(body) {
  const N = LOW_POWER ? 120 : 180;
  const a = body.a;
  const e = body.e;
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e;

  // Precalcular senos/cosenos
  const cosW = Math.cos(body.omega), sinW = Math.sin(body.omega);
  const cosI = Math.cos(body.i),     sinI = Math.sin(body.i);
  const cosO = Math.cos(body.Omega), sinO = Math.sin(body.Omega);

  const points = new Float32Array((N + 1) * 3);

  for (let i = 0; i <= N; i++) {
    const theta = (i / N) * TAU;
    const xOrb = a * Math.cos(theta) - c;
    const zOrb = b * Math.sin(theta);

    // Rotación por omega
    const x1 = xOrb * cosW - zOrb * sinW;
    const z1 = xOrb * sinW + zOrb * cosW;

    // Inclinación (rotación alrededor del eje X)
    const y2 = z1 * sinI;
    const z2 = z1 * cosI;

    // Longitud del nodo ascendente (rotación alrededor del eje Y)
    const xF = x1 * cosO - z2 * sinO;
    const zF = x1 * sinO + z2 * cosO;

    const idx = i * 3;
    points[idx] = xF;
    points[idx + 1] = y2;
    points[idx + 2] = zF;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(points, 3));

  const mat = new THREE.LineBasicMaterial({
    color: ORBIT_COLOR,
    transparent: true,
    opacity: ORBIT_OPACITY,
    depthWrite: false
  });

  const line = new THREE.Line(geo, mat);
  line.renderOrder = -1;
  line.frustumCulled = false;
  return line;
}

/**
 * Libera una línea de órbita.
 */
export function disposeOrbitLine(line) {
  if (!line) return;
  if (line.geometry) line.geometry.dispose();
  if (line.material) line.material.dispose();
}
