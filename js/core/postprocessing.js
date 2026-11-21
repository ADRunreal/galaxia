/* ═══════════════════════════════════════════════════════════
 * postprocessing.js — EffectComposer + Bloom
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.15: bloom con threshold 0.75 y strength 0.35 (0.20 en LOW_POWER)
 *  - P0/2.6: bloom DESACTIVADO por defecto en LOW_POWER
 *  - P2: resize del composer en un solo lugar
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BLOOM_CFG, LOW_POWER } from '../config.js';

let composer = null;
let bloomPass = null;
let renderPass = null;
let outputPass = null;

/**
 * Crea el composer con RenderPass + Bloom + OutputPass.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 */
export function createComposer(renderer, scene, camera) {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());

  renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM_CFG.strength,
    BLOOM_CFG.radius,
    BLOOM_CFG.threshold
  );
  // En LOW_POWER el bloom empieza desactivado para no matar los FPS.
  bloomPass.enabled = !LOW_POWER;
  composer.addPass(bloomPass);

  outputPass = new OutputPass();
  composer.addPass(outputPass);

  return { composer, bloomPass };
}

export function getComposer() {
  return composer;
}

export function getBloomPass() {
  return bloomPass;
}

/**
 * Activa/desactiva bloom en runtime.
 */
export function setBloomEnabled(v) {
  if (bloomPass) bloomPass.enabled = v;
}

/**
 * Ajusta intensidad del bloom.
 */
export function setBloomStrength(v) {
  if (bloomPass) bloomPass.strength = v;
}

/**
 * Renderiza un frame con postprocesado.
 * Si el contexto WebGL se perdió, no hace nada.
 */
export function renderFrame() {
  if (!composer) return;
  composer.render();
}

/**
 * Resize del composer.
 */
export function resizeComposer() {
  if (!composer) return;
  composer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Dispose.
 */
export function disposeComposer() {
  if (bloomPass && bloomPass.dispose) bloomPass.dispose();
  if (renderPass && renderPass.dispose) renderPass.dispose();
  if (outputPass && outputPass.dispose) outputPass.dispose();
  if (composer && composer.dispose) composer.dispose();
  composer = null;
  bloomPass = null;
  renderPass = null;
  outputPass = null;
}
