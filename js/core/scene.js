/* ═══════════════════════════════════════════════════════════
 * scene.js — Escena, luces, fondo estelar y nebulosas
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.14: PointLight con decay 2 e intensidad corregida
 *  - P2/2.7: Sin scene.background redundante (clearColor ya basta)
 *  - P1/1.16: Nebulosas con depthTest true (fondo estelar detrás)
 *  - P2: reducción de partículas en LOW_POWER
 */
import * as THREE from 'three';
import { LOW_POWER, LIGHT_CFG } from '../config.js';
import { TAU } from '../utils/math.js';
import { makeGlowTexture } from '../textures/procedural.js';

let scene = null;
let bgStarsMat = null;
let bgStarsObj = null;
let nebulaeGroup = null;
let sunLight = null;
let ambientLight = null;
let hemiLight = null;

/**
 * Crea la escena con luces y fondo.
 */
export function createScene() {
  scene = new THREE.Scene();
  // NO asignamos scene.background: el clearColor del renderer ya es negro.
  // Esto ahorra un clear pass.

  // ─── Luces ───
  sunLight = new THREE.PointLight(
    0xfff2d8,
    LIGHT_CFG.sunIntensity,
    0,                 // distance = 0 → sin límite
    LIGHT_CFG.sunDecay // decay = 2 → físicamente correcto (1/r²)
  );
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  ambientLight = new THREE.AmbientLight(
    LIGHT_CFG.ambientColor,
    LIGHT_CFG.ambientIntensity
  );
  scene.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(
    LIGHT_CFG.hemiSky,
    LIGHT_CFG.hemiGround,
    LIGHT_CFG.hemiIntensity
  );
  hemiLight.position.set(0, 1, 0);
  scene.add(hemiLight);

  // ─── Fondo estelar ───
  buildStarfield();

  // ─── Nebulosas de fondo ───
  buildNebulae();

  return scene;
}

export function getScene() {
  return scene;
}

export function getSunLight() {
  return sunLight;
}

/* ═══════════════ FONDO ESTELAR ═══════════════ */
function buildStarfield() {
  const N = LOW_POWER ? 3500 : 8000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const phase = new Float32Array(N);
  const c = new THREE.Color();

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const u = Math.random() * 2 - 1;
    const ph = Math.random() * TAU;
    const s = Math.sqrt(1 - u * u);
    const R = 12000 + Math.random() * 8000;
    pos[i3] = R * s * Math.cos(ph);
    pos[i3 + 1] = R * u;
    pos[i3 + 2] = R * s * Math.sin(ph);
    c.setHSL(0.55 + Math.random() * 0.15, 0.3 * Math.random(), 0.55 + Math.random() * 0.45);
    col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
    phase[i] = Math.random() * TAU;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aPhase;
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uTime;
      void main() {
        vColor = color;
        vTwinkle = 0.7 + 0.3 * sin(uTime * 1.6 + aPhase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 1.9 * vTwinkle;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        if (dot(uv, uv) > 0.25) discard;
        gl_FragColor = vec4(vColor * vTwinkle, vTwinkle);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  bgStarsObj = new THREE.Points(geo, mat);
  bgStarsObj.frustumCulled = false;
  bgStarsObj.renderOrder = -10;
  scene.add(bgStarsObj);
  bgStarsMat = mat;
}

/* ═══════════════ NEBULOSAS ═══════════════ */
function buildNebulae() {
  nebulaeGroup = new THREE.Group();
  nebulaeGroup.renderOrder = -9;
  scene.add(nebulaeGroup);

  const cfgs = [
    { c: [180, 100, 210], s: 2400, p: [-3500, 800, -2200], o: 0.14 },
    { c: [100, 150, 255], s: 3000, p: [3200, -700, -1800], o: 0.11 },
    { c: [210, 120, 160], s: 2200, p: [-2400, -900, 3000], o: 0.13 },
    { c: [120, 180, 220], s: 2800, p: [3000, 900, 2400], o: 0.10 },
    { c: [200, 160, 240], s: 2000, p: [0, 2400, -3000], o: 0.09 }
  ];

  for (const n of cfgs) {
    const tex = makeGlowTexture(
      `rgba(${n.c[0]},${n.c[1]},${n.c[2]},1)`,
      `rgba(${n.c[0]},${n.c[1]},${n.c[2]},0.28)`,
      `rgba(${n.c[0]},${n.c[1]},${n.c[2]},0)`
    );
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: n.o,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true   // ← P1/1.16: respetar profundidad
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(...n.p);
    sp.scale.set(n.s, n.s, 1);
    nebulaeGroup.add(sp);
  }
}

/* ═══════════════ TOGGLES ═══════════════ */

export function setBgStarsVisible(v) {
  if (bgStarsObj) bgStarsObj.visible = v;
}

export function setNebulaeVisible(v) {
  if (nebulaeGroup) nebulaeGroup.visible = v;
}

export function updateBgStarsTime(t) {
  if (bgStarsMat) bgStarsMat.uniforms.uTime.value = t;
}

/* ═══════════════ DISPOSE ═══════════════ */

export function disposeScene() {
  if (!scene) return;
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
  scene.clear();
  scene = null;
  bgStarsMat = null;
  bgStarsObj = null;
  nebulaeGroup = null;
  sunLight = null;
  ambientLight = null;
  hemiLight = null;
}
