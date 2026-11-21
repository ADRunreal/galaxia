/* ═══════════════════════════════════════════════════════════
 * procedural.js — Texturas procedurales (canvas 2D)
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/2.8: tamaño reducido en LOW_POWER (1024×512 en vez de 2048×1024)
 *  - P0/2.9: nextFrame() entre texturas para no bloquear el loader
 *  - P2: anisotropía adaptativa
 *  - P2: reutilización de canvas y gradientes donde es posible
 *  - P1/1.4: parámetros de cometas corregidos en bodies.json (fuera de este archivo)
 */
import * as THREE from 'three';
import { TAU } from '../utils/math.js';
import { LOW_POWER, TEXTURE_SIZE, TEXTURE_SIZE_SMALL } from '../config.js';
import { nextFrame } from '../utils/dom.js';

const ANISO = LOW_POWER ? 4 : 8;

/* ═══════════════ HELPERS ═══════════════ */

function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return { cv, ctx: cv.getContext('2d') };
}

function finalizeTexture(cv, { anisotropy = ANISO, generateMipmaps = true } = {}) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.generateMipmaps = generateMipmaps;
  tex.minFilter = generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════════ GLOW (radial) ═══════════════ */
/**
 * Textura de resplandor radial.
 * @param {string} inner — color CSS del centro
 * @param {string} mid — color CSS intermedio
 * @param {string} outer — color CSS exterior
 * @param {number} [size=256]
 */
export function makeGlowTexture(inner, mid, outer, size = 256) {
  const { cv, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.00, inner);
  g.addColorStop(0.18, mid);
  g.addColorStop(1.00, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finalizeTexture(cv, { generateMipmaps: false });
}

/* ═══════════════ BANDAS (gigantes gaseosos) ═══════════════ */
/**
 * Textura de bandas horizontales para gigantes gaseosos.
 * @param {Object} opts
 * @param {string} opts.base — color base CSS
 * @param {number} [opts.bands=42]
 * @param {string[]} opts.palette — array de colores CSS
 * @param {boolean} [opts.greatSpot] — añadir Gran Mancha Roja
 */
export function makeBandTexture(opts) {
  const W = TEXTURE_SIZE;
  const H = Math.floor(TEXTURE_SIZE / 2);
  const { cv, ctx } = makeCanvas(W, H);

  ctx.fillStyle = opts.base;
  ctx.fillRect(0, 0, W, H);

  const bands = opts.bands || 42;
  const palette = opts.palette;
  const step = H / bands;

  for (let i = 0; i < bands; i++) {
    const yBase = i * step;
    const h = step * (0.7 + Math.random() * 0.6);
    const shade = 0.55 + Math.random() * 0.7;
    const col = new THREE.Color(palette[i % palette.length]).multiplyScalar(shade);
    ctx.fillStyle = `rgb(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0})`;

    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= W; x += 8) {
      const w = Math.sin(x * 0.012 + i * 1.7) * 6 + Math.sin(x * 0.034 + i * 3.1) * 2.5;
      ctx.lineTo(x, yBase + w);
    }
    for (let x = W; x >= 0; x -= 8) {
      const w = Math.sin(x * 0.012 + i * 1.7) * 6 + Math.sin(x * 0.034 + i * 3.1) * 2.5;
      ctx.lineTo(x, yBase + w + h);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Manchas de turbulencia
  const turbCount = LOW_POWER ? 180 : 400;
  for (let i = 0; i < turbCount; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const c = new THREE.Color(palette[i % palette.length]).multiplyScalar(0.4 + Math.random() * 0.7);
    ctx.fillStyle = `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${0.08 + Math.random() * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 15 + Math.random() * 50, 3 + Math.random() * 10, 0, 0, TAU);
    ctx.fill();
  }

  // Gran Mancha Roja (Júpiter)
  if (opts.greatSpot) {
    ctx.save();
    ctx.translate(W * 0.70, H * 0.63);
    ctx.rotate(-0.08);
    const grs = ctx.createRadialGradient(0, 0, 0, 0, 0, 95);
    grs.addColorStop(0.00, 'rgba(190, 50, 25, 0.95)');
    grs.addColorStop(0.45, 'rgba(165, 80, 50, 0.72)');
    grs.addColorStop(1.00, 'rgba(140, 100, 80, 0)');
    ctx.fillStyle = grs;
    ctx.beginPath();
    ctx.ellipse(0, 0, 95, 48, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  return finalizeTexture(cv);
}

/* ═══════════════ CRÁTERES (rocosos) ═══════════════ */
/**
 * Textura con cráteres para cuerpos rocosos.
 * @param {number|string} baseColor — 0xRRGGBB o CSS
 * @param {Object} [opts]
 * @param {number} [opts.size]
 * @param {number} [opts.craters=160]
 * @param {boolean} [opts.polarCaps]
 */
export function makeCraterTexture(baseColor, opts = {}) {
  const W = opts.size || TEXTURE_SIZE_SMALL;
  const H = Math.floor(W / 2);
  const { cv, ctx } = makeCanvas(W, H);

  const base = new THREE.Color(baseColor);
  ctx.fillStyle = '#' + base.getHexString();
  ctx.fillRect(0, 0, W, H);

  // Manchas grandes de albedo variable
  const patches = LOW_POWER ? 150 : 300;
  for (let i = 0; i < patches; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 10 + Math.random() * 80;
    const c = base.clone().multiplyScalar(0.65 + Math.random() * 0.6);
    ctx.fillStyle = `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${0.12 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  // Cráteres
  const nCraters = opts.craters ?? 160;
  for (let i = 0; i < nCraters; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 2 + Math.random() * 14;
    const dark = base.clone().multiplyScalar(0.35 + Math.random() * 0.25);
    const light = base.clone().multiplyScalar(1.1 + Math.random() * 0.2);

    // Borde iluminado
    ctx.fillStyle = `rgba(${(light.r * 255) | 0},${(light.g * 255) | 0},${(light.b * 255) | 0},0.35)`;
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.15, r, 0, TAU);
    ctx.fill();

    // Centro oscuro
    ctx.fillStyle = `rgba(${(dark.r * 255) | 0},${(dark.g * 255) | 0},${(dark.b * 255) | 0},0.55)`;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.82, 0, TAU);
    ctx.fill();
  }

  // Casquetes polares
  if (opts.polarCaps) {
    const capGrad = ctx.createLinearGradient(0, 0, 0, H * 0.12);
    capGrad.addColorStop(0, 'rgba(240, 240, 250, 0.92)');
    capGrad.addColorStop(1, 'rgba(240, 240, 250, 0)');
    ctx.fillStyle = capGrad;
    ctx.fillRect(0, 0, W, H * 0.12);

    const capGrad2 = ctx.createLinearGradient(0, H, 0, H * 0.9);
    capGrad2.addColorStop(0, 'rgba(240, 240, 250, 0.88)');
    capGrad2.addColorStop(1, 'rgba(240, 240, 250, 0)');
    ctx.fillStyle = capGrad2;
    ctx.fillRect(0, H * 0.9, W, H * 0.1);
  }

  return finalizeTexture(cv);
}

/* ═══════════════ ANILLOS DE SATURNO ═══════════════ */
export function makeSaturnRingTexture() {
  const W = 1024;
  const H = 32;
  const { cv, ctx } = makeCanvas(W, H);

  for (let x = 0; x < W; x++) {
    const t = x / W;
    let alpha = 0.55 + Math.sin(t * 24) * 0.15 + Math.random() * 0.12;
    if (t > 0.56 && t < 0.63) alpha *= 0.10;      // División de Cassini
    if (t > 0.85 && t < 0.875) alpha *= 0.35;     // División de Encke
    if (t > 0.965) alpha *= (1 - t) / 0.035;      // Borde exterior
    if (t < 0.03) alpha *= t / 0.03;              // Borde interior
    const shade = 0.65 + Math.random() * 0.35;
    ctx.fillStyle = `rgba(${(218 * shade) | 0},${(186 * shade) | 0},${(132 * shade) | 0},${alpha * 0.95})`;
    ctx.fillRect(x, 0, 1, H);
  }

  return finalizeTexture(cv, { generateMipmaps: false });
}

/* ═══════════════ GALAXIA ESPIRAL ═══════════════ */
export function makeSpiralGalaxyTexture() {
  const S = LOW_POWER ? 512 : 1024;
  const { cv, ctx } = makeCanvas(S, S);

  const grad = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0.00, 'rgba(255, 240, 200, 0.95)');
  grad.addColorStop(0.10, 'rgba(220, 220, 255, 0.55)');
  grad.addColorStop(0.40, 'rgba(140, 160, 230, 0.18)');
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  const starCount = LOW_POWER ? 1000 : 2200;
  for (let arm = 0; arm < 2; arm++) {
    const baseA = arm * Math.PI;
    for (let i = 0; i < starCount; i++) {
      const t = Math.pow(Math.random(), 0.6);
      const r = t * S * 0.45;
      const a = baseA + t * 4.2 + (Math.random() - 0.5) * 0.55;
      const x = S / 2 + Math.cos(a) * r;
      const y = S / 2 + Math.sin(a) * r;
      const size = 0.4 + Math.random() * 1.6;
      const bright = 1 - t * 0.5;
      ctx.fillStyle = `rgba(${(170 + Math.random() * 70) | 0}, ${(180 + Math.random() * 70) | 0}, 255, ${bright * (0.28 + Math.random() * 0.42)})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
    }
  }

  return finalizeTexture(cv, { generateMipmaps: false });
}

/* ═══════════════ NEBULOSA ═══════════════ */
export function makeNebulaTexture(r, g, b) {
  const S = LOW_POWER ? 384 : 512;
  const { cv, ctx } = makeCanvas(S, S);

  const blobs = LOW_POWER ? 80 : 140;
  for (let i = 0; i < blobs; i++) {
    const x = S / 2 + (Math.random() - 0.5) * S * 0.7;
    const y = S / 2 + (Math.random() - 0.5) * S * 0.7;
    const rad = 30 + Math.random() * 120;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${r},${g},${b},${0.10 + Math.random() * 0.16})`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.fill();
  }

  return finalizeTexture(cv, { generateMipmaps: false });
}

/* ═══════════════ TIERRA (día) ═══════════════ */
export function makeEarthTexture() {
  const W = TEXTURE_SIZE;
  const H = Math.floor(TEXTURE_SIZE / 2);
  const { cv, ctx } = makeCanvas(W, H);

  // Océano
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  oceanGrad.addColorStop(0, '#0a1e3f');
  oceanGrad.addColorStop(0.3, '#123a6b');
  oceanGrad.addColorStop(0.5, '#1a5090');
  oceanGrad.addColorStop(0.7, '#123a6b');
  oceanGrad.addColorStop(1, '#0a1e3f');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  // Continentes (manchas estilizadas)
  const blobs = [
    { x: 0.18, y: 0.30, rx: 0.10, ry: 0.14 }, // Norteamérica
    { x: 0.22, y: 0.55, rx: 0.06, ry: 0.11 }, // Centroamérica
    { x: 0.26, y: 0.72, rx: 0.04, ry: 0.06 }, // Sudamérica norte
    { x: 0.44, y: 0.28, rx: 0.05, ry: 0.08 }, // Europa
    { x: 0.48, y: 0.42, rx: 0.04, ry: 0.05 }, // África norte
    { x: 0.50, y: 0.62, rx: 0.05, ry: 0.10 }, // África central
    { x: 0.52, y: 0.74, rx: 0.03, ry: 0.04 }, // África sur
    { x: 0.66, y: 0.30, rx: 0.10, ry: 0.14 }, // Asia
    { x: 0.72, y: 0.45, rx: 0.07, ry: 0.08 }, // India
    { x: 0.78, y: 0.62, rx: 0.05, ry: 0.06 }, // Sudeste asiático
    { x: 0.82, y: 0.78, rx: 0.05, ry: 0.05 }, // Australia
    { x: 0.08, y: 0.45, rx: 0.03, ry: 0.05 }, // Groenlandia
    { x: 0.38, y: 0.20, rx: 0.03, ry: 0.05 }, // Islandia
    { x: 0.58, y: 0.22, rx: 0.03, ry: 0.04 }  // Siberia
  ];

  for (const b of blobs) {
    const cx = b.x * W;
    const cy = b.y * H;
    const rx = b.rx * W;
    const ry = b.ry * H;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    g.addColorStop(0, '#4a7a3a');
    g.addColorStop(0.55, '#3a6630');
    g.addColorStop(0.85, '#2d5528');
    g.addColorStop(1, 'rgba(30,70,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  // Casquetes polares suaves
  const topCap = ctx.createLinearGradient(0, 0, 0, H * 0.06);
  topCap.addColorStop(0, 'rgba(240, 248, 255, 0.7)');
  topCap.addColorStop(1, 'rgba(240, 248, 255, 0)');
  ctx.fillStyle = topCap;
  ctx.fillRect(0, 0, W, H * 0.06);

  const bottomCap = ctx.createLinearGradient(0, H, 0, H * 0.94);
  bottomCap.addColorStop(0, 'rgba(240, 248, 255, 0.85)');
  bottomCap.addColorStop(1, 'rgba(240, 248, 255, 0)');
  ctx.fillStyle = bottomCap;
  ctx.fillRect(0, H * 0.94, W, H * 0.06);

  return finalizeTexture(cv);
}

/* ═══════════════ TIERRA (nubes) ═══════════════ */
export function makeEarthCloudTexture() {
  const W = TEXTURE_SIZE;
  const H = Math.floor(TEXTURE_SIZE / 2);
  const { cv, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const clouds = LOW_POWER ? 350 : 650;
  for (let i = 0; i < clouds; i++) {
    const cx = Math.random() * W;
    const cy = Math.random() * H;
    const rad = 20 + Math.random() * 90;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(255,255,255,${0.35 + Math.random() * 0.45})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, TAU);
    ctx.fill();
  }

  return finalizeTexture(cv);
}

/* ═══════════════ LUNA ═══════════════ */
export function makeMoonTexture() {
  const W = TEXTURE_SIZE_SMALL;
  const H = Math.floor(W / 2);
  const { cv, ctx } = makeCanvas(W, H);

  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, W, H);

  // Mares lunares
  const maria = LOW_POWER ? 16 : 24;
  for (let i = 0; i < maria; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const rx = 30 + Math.random() * 90;
    const ry = 20 + Math.random() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, 'rgba(120, 120, 130, 0.55)');
    g.addColorStop(1, 'rgba(120, 120, 130, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
  }

  // Cráteres
  const craters = LOW_POWER ? 220 : 350;
  for (let i = 0; i < craters; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 2 + Math.random() * 14;
    const dark = 0.5 + Math.random() * 0.2;
    ctx.fillStyle = `rgba(${(60 * dark) | 0},${(60 * dark) | 0},${(65 * dark) | 0},0.55)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 220, 225, 0.35)';
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.9, 0, TAU);
    ctx.fill();
  }

  return finalizeTexture(cv);
}

/* ═══════════════ GENERACIÓN ASÍNCRONA DE TODAS LAS TEXTURAS ═══════════════ */
/**
 * Genera todas las texturas necesarias de forma asíncrona.
 * Cede el control al navegador entre cada textura para permitir pintar el loader.
 * @param {Function} [onProgress] — callback(pct, label)
 * @returns {Promise<Object>} mapa de texturas
 */
export async function generateAllTextures(onProgress = () => {}) {
  const TEX = {};

  onProgress(5, 'Generando texturas base…');
  await nextFrame();

  const earthTex = makeEarthTexture();
  onProgress(12, 'Generando Tierra…');
  await nextFrame();

  const earthCloud = makeEarthCloudTexture();
  onProgress(18, 'Generando nubes…');
  await nextFrame();

  const moonTex = makeMoonTexture();
  onProgress(24, 'Generando Luna…');
  await nextFrame();

  TEX.mercury = makeCraterTexture(0x9a8a78, { craters: 200 });
  onProgress(30, 'Mercurio…');
  await nextFrame();

  TEX.venus = makeBandTexture({ base: '#d9b87a', bands: 24, palette: ['#e8c890', '#c8a860', '#d9b878', '#b89850'] });
  onProgress(35, 'Venus…');
  await nextFrame();

  TEX.mars = makeCraterTexture(0xc1440e, { craters: 120, polarCaps: true });
  onProgress(40, 'Marte…');
  await nextFrame();

  TEX.jupiter = makeBandTexture({
    base: '#c9a26b', bands: 46,
    palette: ['#d4b48a', '#a07848', '#e0c898', '#8a6840', '#bfa070', '#d8b890'],
    greatSpot: true
  });
  onProgress(46, 'Júpiter…');
  await nextFrame();

  TEX.saturn = makeBandTexture({
    base: '#e0c48a', bands: 32,
    palette: ['#ead4a0', '#c8a868', '#f0dab0', '#b89858', '#d8c088']
  });
  onProgress(52, 'Saturno…');
  await nextFrame();

  TEX.uranus = makeBandTexture({
    base: '#9fd8d8', bands: 12,
    palette: ['#a8e0e0', '#8ed0d0', '#b8e8e8', '#90d0d0']
  });
  onProgress(56, 'Urano…');
  await nextFrame();

  TEX.neptune = makeBandTexture({
    base: '#4a6ab8', bands: 18,
    palette: ['#5878c8', '#3a5898', '#6888d8', '#3a5aa8', '#4a6ab8']
  });
  onProgress(60, 'Neptuno…');
  await nextFrame();

  TEX.pluto = makeCraterTexture(0xc8b09a, { craters: 80 });
  onProgress(64, 'Plutón…');
  await nextFrame();

  TEX.ceres = makeCraterTexture(0x7a6a5a, { craters: 140 });
  TEX.eris = makeCraterTexture(0xc8c0b8, { craters: 70 });
  onProgress(68, 'Planetas enanos…');
  await nextFrame();

  TEX.io = makeCraterTexture(0xe8d04a, { craters: 20 });
  TEX.europa = makeCraterTexture(0xdad0c0, { craters: 40 });
  TEX.ganymede = makeCraterTexture(0xa89880, { craters: 100 });
  TEX.callisto = makeCraterTexture(0x8a8078, { craters: 200 });
  onProgress(74, 'Lunas de Júpiter…');
  await nextFrame();

  TEX.titan = makeBandTexture({ base: '#e0a050', bands: 10, palette: ['#e8b060', '#d09040', '#f0c070'] });
  TEX.enceladus = makeCraterTexture(0xf0f0f0, { craters: 30 });
  TEX.miranda = makeCraterTexture(0xc0c0c8, { craters: 60 });
  TEX.titania = makeCraterTexture(0xc8c0c0, { craters: 60 });
  TEX.triton = makeCraterTexture(0xd8d0d0, { craters: 60 });
  TEX.charon = makeCraterTexture(0xa89888, { craters: 90 });
  TEX.vesta = makeCraterTexture(0x9a8a78, { craters: 80 });
  TEX.pallas = makeCraterTexture(0x8a7a68, { craters: 90 });
  onProgress(82, 'Lunas menores…');
  await nextFrame();

  const saturnRingTex = makeSaturnRingTexture();
  onProgress(86, 'Anillos…');
  await nextFrame();

  const spiralGalaxyTex = makeSpiralGalaxyTexture();
  onProgress(90, 'Galaxia espiral…');
  await nextFrame();

  return {
    TEX,
    earthTex,
    earthCloud,
    moonTex,
    saturnRingTex,
    spiralGalaxyTex
  };
}
