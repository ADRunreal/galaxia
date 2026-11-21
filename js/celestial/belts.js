/* ═══════════════════════════════════════════════════════════
 * belts.js — Cinturón de asteroides y de Kuiper
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/1.5: velocidad angular variable por radio (Kepler simplificado)
 *  - P2: reducción de instancias en LOW_POWER
 *  - P2: uso de InstancedMesh para asteroides (mucho más eficiente)
 */
import * as THREE from 'three';
import { TAU, gauss } from '../utils/math.js';
import { LOW_POWER } from '../config.js';

let asteroidBelt = null;
let kuiperBelt = null;

/* ═══════════════ CINTURÓN DE ASTEROIDES ═══════════════ */
export function buildAsteroidBelt(scene) {
  const N = LOW_POWER ? 900 : 1800;
  const geo = new THREE.DodecahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9a8a78,
    roughness: 1.0,
    metalness: 0,
    emissive: 0x221a12,
    emissiveIntensity: 0.3
  });

  const inst = new THREE.InstancedMesh(geo, mat, N);
  inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  inst.frustumCulled = false;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  // Radios individuales para rotación diferencial
  const radii = new Float32Array(N);
  const angles = new Float32Array(N);
  const omegas = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const r = 32 + Math.random() * 12 + gauss() * 1.5;
    const a = Math.random() * TAU;
    pos.set(Math.cos(a) * r, gauss() * 1.2, Math.sin(a) * r);
    e.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
    q.setFromEuler(e);
    const s = 0.05 + Math.random() * 0.18;
    scl.set(s, s * (0.7 + Math.random() * 0.6), s);
    m.compose(pos, q, scl);
    inst.setMatrixAt(i, m);

    radii[i] = r;
    angles[i] = a;
    // Kepler simplificado: ω ∝ r^(-3/2)
    omegas[i] = 0.00035 * Math.pow(35 / r, 1.5);
  }

  inst.instanceMatrix.needsUpdate = true;
  asteroidBelt = {
    mesh: inst,
    radii,
    angles,
    omegas,
    count: N,
    _m: new THREE.Matrix4(),
    _q: new THREE.Quaternion(),
    _e: new THREE.Euler(),
    _pos: new THREE.Vector3(),
    _scl: new THREE.Vector3(1, 1, 1)
  };

  scene.add(inst);
  return inst;
}

/* ═══════════════ CINTURÓN DE KUIPER ═══════════════ */
export function buildKuiperBelt(scene) {
  const N = LOW_POWER ? 1500 : 3000;
  const pos = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const r = 118 + Math.random() * 70 + gauss() * 2;
    const a = Math.random() * TAU;
    pos[i3] = Math.cos(a) * r;
    pos[i3 + 1] = gauss() * 3;
    pos[i3 + 2] = Math.sin(a) * r;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x7a90c4,
    size: 0.35,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  kuiperBelt = new THREE.Points(geo, mat);
  kuiperBelt.frustumCulled = false;
  scene.add(kuiperBelt);
  return kuiperBelt;
}

/* ═══════════════ ACTUALIZACIÓN (rotación diferencial) ═══════════════ */
/**
 * Actualiza el cinturón de asteroides con rotación diferencial.
 * Cada asteroide orbita a ω(r) ∝ r^(-3/2). MUY barato: solo actualiza
 * la matriz de instancia.
 * @param {number} simTimeDays
 */
export function updateBelts(simTimeDays) {
  // Kuiper: rotación uniforme simple
  if (kuiperBelt) kuiperBelt.rotation.y = simTimeDays * 0.00005;

  // Asteroides: rotación diferencial por radio
  if (asteroidBelt) {
    const { mesh, radii, angles, omegas, count, _m, _q, _e, _pos, _scl } = asteroidBelt;
    for (let i = 0; i < count; i++) {
      const a = angles[i] + omegas[i] * simTimeDays;
      const r = radii[i];
      _pos.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      _e.set(a * 0.7, a, a * 0.3);
      _q.setFromEuler(_e);
      _scl.set(1, 1, 1);
      _m.compose(_pos, _q, _scl);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ═══════════════ TOGGLES ═══════════════ */
export function setBeltsVisible(v) {
  if (asteroidBelt) asteroidBelt.mesh.visible = v;
  if (kuiperBelt) kuiperBelt.visible = v;
}

/* ═══════════════ DISPOSE ═══════════════ */
export function disposeBelts() {
  if (asteroidBelt) {
    asteroidBelt.mesh.geometry.dispose();
    asteroidBelt.mesh.material.dispose();
    asteroidBelt = null;
  }
  if (kuiperBelt) {
    kuiperBelt.geometry.dispose();
    kuiperBelt.material.dispose();
    kuiperBelt = null;
  }
}
