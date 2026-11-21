/* ═══════════════════════════════════════════════════════════
 * main.js — Orquestador principal
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.8: tour se detiene al terminar
 *  - P0/1.11: umbral de tap más alto en móvil
 *  - P0/2.6: bloom desactivado en LOW_POWER
 *  - P1/3.6: slider 0 ↔ pausa sincronizados
 *  - P1/3.8: deep-link con cámara + tiempo
 *  - P1/3.9: onboarding en primera visita
 *  - P1/3.10: botón fullscreen
 *  - P1/3.12: toast "Viajando a X…"
 *  - P2: loop fusionado (update + shader)
 *  - P2: dispose global en beforeunload
 *  - P2: service worker registration
 *  - P2: window.__galaxiaSelectingBody flag para raycast
 */
import * as THREE from 'three';

import { LOW_POWER, BASE_RATE, IS_MOBILE } from './config.js';
import { prefersReducedMotion, clamp } from './utils/math.js';
import { nextFrame, setLoader, isLowPower } from './utils/dom.js';
import { initI18n, t } from './utils/i18n.js';

// Core
import { createRenderer, getRenderer, resizeRenderer, disposeRenderer } from './core/renderer.js';
import { createCamera, getCamera, getControls, animateCamera, tickCameraAnim, updateCameraFollow, setFollowTarget, clearFollowTarget, getFollowTarget, zoomBy, goHome, resizeCamera, disposeCamera, isCameraAnimating } from './core/camera.js';
import { createScene, getScene, setBgStarsVisible, setNebulaeVisible, updateBgStarsTime, disposeScene } from './core/scene.js';
import { createComposer, getComposer, setBloomEnabled, renderFrame, resizeComposer, disposeComposer } from './core/postprocessing.js';

// Texturas
import { generateAllTextures } from './textures/procedural.js';

// Cuerpos
import {
  setSharedTextures, createAllBodies, bodies,
  disposeAllBodies
} from './celestial/CelestialBody.js';
import { createOrbitLine, disposeOrbitLine } from './celestial/orbits.js';
import { buildAsteroidBelt, buildKuiperBelt, updateBelts, disposeBelts } from './celestial/belts.js';

// UI
import { initPanel } from './ui/panel.js';
import { initLabels, updateLabels, setLabelsEnabled, setSelectedLabel, disposeLabels } from './ui/labels.js';
import { initSearch, setActiveCatalogItem } from './ui/search.js';
import { initInfo, selectBody, getSelectedId, shareBodyLink, shareCurrentView } from './ui/info.js';
import { initTour, startTour, stopTour, isTourActive, updateTour } from './ui/tour.js';
import { initToasts, showToast } from './ui/toasts.js';

/* ═══════════════ ESTADO GLOBAL ═══════════════ */
let scene, camera, controls, renderer, composer;
let solarSystem;
let orbitLines = [];
let paused = false;
let simTimeDays = 0;
let realTimeSeconds = 0;
let clock;
let planetData = [];
let textureBundle = null;
let hintHidden = false;
let raycaster, pointer;
let pointerDown = { x: 0, y: 0, t: 0 };
let ready = false;

async function init() {
  try {
    // ─── i18n ───
    await initI18n();
    console.log('[Galaxia] ✅ Step 1: i18n OK');

    // ─── Renderer ───
    renderer = createRenderer();
    if (!renderer) {
      console.warn('[Galaxia] ⚠️ renderer null, abortando init()');
      return;
    }
    console.log('[Galaxia] ✅ Step 2: renderer OK');

    // ─── Cámara ───
    const camResult = createCamera(renderer);
    camera = camResult.camera;
    controls = camResult.controls;
    console.log('[Galaxia] ✅ Step 3: camera OK');

    // ─── Escena ───
    scene = createScene();
  // Partículas de inmersión alrededor del Sol
  const sunGlowGeo = new THREE.BufferGeometry();
  const sunGlowPos = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) {
    const r = 8 + Math.random() * 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    sunGlowPos[i*3] = Math.sin(phi) * Math.cos(theta) * r;
    sunGlowPos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
    sunGlowPos[i*3+2] = Math.cos(phi) * r;
  }
  sunGlowGeo.setAttribute('position', new THREE.BufferAttribute(sunGlowPos, 3));
  const sunGlowMat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.2, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
  const sunGlowParticles = new THREE.Points(sunGlowGeo, sunGlowMat);
  scene.add(sunGlowParticles);
    console.log('[Galaxia] ✅ Step 4: scene OK');

    // ─── Postprocesado ───
    const pp = createComposer(renderer, scene, camera);
    composer = pp.composer;
    console.log('[Galaxia] ✅ Step 5: composer OK');

    // ─── Texturas ───
    setLoader(5, 'Generando texturas…');
    await nextFrame();
    console.log('[Galaxia] 🎨 Generando texturas…');
    textureBundle = await generateAllTextures((pct, label) => setLoader(pct, label));
    setSharedTextures(textureBundle);
    console.log('[Galaxia] ✅ Step 6: texturas OK');

    // ─── Datos ───
    setLoader(90, 'Cargando datos…');
    await nextFrame();
    console.log('[Galaxia] 📡 Cargando bodies.json…');
    const res = await fetch('./js/data/bodies.json');
    if (!res.ok) throw new Error(`No se pudo cargar bodies.json (HTTP ${res.status})`);
    planetData = await res.json();
    console.log('[Galaxia] ✅ Step 7: bodies.json OK (' + planetData.length + ' cuerpos)');

    // ─── Sistema Solar ───
    setLoader(92, 'Construyendo el Sistema Solar…');
    await nextFrame();
    solarSystem = new THREE.Group();
    scene.add(solarSystem);
    createAllBodies(planetData, solarSystem);
    console.log('[Galaxia] ✅ Step 8: cuerpos creados');

    // ─── Órbitas ───
    setLoader(94, 'Trazando órbitas…');
    await nextFrame();
    for (const id in bodies) {
      const body = bodies[id];
      if (!body.parentBody || id === 'sun') continue;
      const line = createOrbitLine(body);
      orbitLines.push(line);
      if (body.parentBody.id === 'sun') {
        solarSystem.add(line);
      } else {
        body.parentBody.pivot.add(line);
      }
    }
    console.log('[Galaxia] ✅ Step 9: órbitas OK');

    // ─── Cinturones ───
    setLoader(96, 'Cinturones de asteroides…');
    await nextFrame();
    buildAsteroidBelt(scene);
    buildKuiperBelt(scene);
    console.log('[Galaxia] ✅ Step 10: cinturones OK');

    // ─── Etiquetas ───
    initLabels();
    console.log('[Galaxia] ✅ Step 11: etiquetas OK');

    // ─── UI ───
    setLoader(97, 'Preparando interfaz…');
    await nextFrame();
    initToasts();
    initInfo();

    initPanel({
      onLabelsToggle: (v) => setLabelsEnabled(v),
      onOrbitsToggle: (v) => orbitLines.forEach(l => l.visible = v),
      onBgStarsToggle: (v) => setBgStarsVisible(v),
      onNebulaeToggle: (v) => setNebulaeVisible(v),
      onBloomToggle: (v) => setBloomEnabled(v),
      onQualityToggle: () => { /* placeholder */ }
    });

    const search = initSearch((id) => flyToBody(id));
    search.buildCatalog(planetData);
    initTour((id) => flyToBody(id));
    console.log('[Galaxia] ✅ Step 12: UI OK');

    // ─── Compartir ───
    document.getElementById('btnShare').addEventListener('click', shareBodyLink);
    document.getElementById('btnShareView').addEventListener('click', () => {
      shareCurrentView(camera.position, controls.target, simTimeDays, getSelectedId());
    });

    // ─── Control de tiempo ───
    initTimeControls();

    // ─── Zoom ───
    document.getElementById('btnIn').addEventListener('click', () => zoomBy(0.6, bodies));
    document.getElementById('btnOut').addEventListener('click', () => zoomBy(1.65, bodies));
    document.getElementById('btnHome').addEventListener('click', () => goHome());
    document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);
    document.getElementById('btnHelp').addEventListener('click', showHelp);

    // ─── Raycast ───
    initRaycast();

    // ─── Teclado ───
    initKeyboard();

    // ─── Resize ───
    window.addEventListener('resize', onResize);

    // ─── beforeunload ───
    window.addEventListener('beforeunload', cleanup);

    // ─── Service Worker ───
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('[Galaxia] SW registration failed:', err);
      });
    }

    // ─── Clock ───
    clock = new THREE.Clock();

    // ─── Deep link ───
    const urlParams = new URLSearchParams(location.search);
    const deepBody = urlParams.get('body');
    const cam = urlParams.get('cam');
    const target = urlParams.get('target');
    const timeParam = urlParams.get('t');

    if (timeParam) {
      const tv = parseFloat(timeParam);
      if (isFinite(tv)) simTimeDays = tv;
    }

    if (cam && target) {
      const [cx, cy, cz] = cam.split(',').map(Number);
      const [tx, ty, tz] = target.split(',').map(Number);
      if ([cx, cy, cz, tx, ty, tz].every(isFinite)) {
        camera.position.set(cx, cy, cz);
        controls.target.set(tx, ty, tz);
      }
    } else if (deepBody && bodies[deepBody]) {
      setTimeout(() => flyToBody(deepBody), 800);
    }

    // ─── Onboarding ───
    maybeShowOnboarding();

    // ─── Listo ───
    setLoader(100, 'Listo');
    await nextFrame();
    document.getElementById('loader').classList.add('hide');
    ready = true;
    console.log('[Galaxia] 🚀 ¡Todo listo! Arrancando loop…');

    // ─── Loop ───
    animate();

  } catch (err) {
    console.error('[Galaxia] ❌ FALLÓ init() en algún paso');
    throw err; // se captura en el catch global
  }
}

/* ═══════════════ TIEMPO ═══════════════ */
function initTimeControls() {
  const timeScaleEl = document.getElementById('timeScale');
  const timeValueEl = document.getElementById('timeValue');
  const btnPause = document.getElementById('btnPause');

  timeScaleEl.addEventListener('input', () => {
    const v = parseFloat(timeScaleEl.value);
    timeValueEl.textContent = v.toFixed(2).replace(/\.?0+$/, '') + '×';

    // P1/3.6: si slider = 0, activar pausa
    if (v === 0) {
      paused = true;
      btnPause.textContent = '▶';
      btnPause.classList.add('paused');
    } else if (paused && v > 0) {
      // Si el usuario mueve el slider, despausar
      paused = false;
      btnPause.textContent = '⏸';
      btnPause.classList.remove('paused');
    }
  });

  btnPause.addEventListener('click', () => {
    paused = !paused;
    btnPause.textContent = paused ? '▶' : '⏸';
    btnPause.classList.toggle('paused', paused);
  });
}

/* ═══════════════ FLY TO ═══════════════ */
function flyToBody(id, animate = true) {
  const body = bodies[id];
  if (!body) return;

  const pos = new THREE.Vector3();
  body.mesh.getWorldPosition(pos);

  const offset = body.getCameraOffset();
  const endPos = pos.clone().add(offset);

  if (animate) {
    animateCamera(endPos, pos, prefersReducedMotion() ? 0 : 1.1, true);
    // P1/3.12: toast de viaje
    showToast(`Viajando a ${body.data.name}…`, 1500);
  } else {
    camera.position.copy(endPos);
    controls.target.copy(pos);
  }

  // Actualizar selección UI
  selectBody(id);
  setSelectedLabel(id);
  setActiveCatalogItem(id);

  // Después de la animación, establecer follow
  setTimeout(() => {
    if (!isCameraAnimating()) {
      setFollowTarget(id, camera.position.clone().sub(controls.target));
    }
  }, animate && !prefersReducedMotion() ? 1200 : 50);
}

/* ═══════════════ RAYCAST ═══════════════ */
function initRaycast() {
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
    window.__galaxiaSelectingBody = true;
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    window.__galaxiaSelectingBody = false;

    const dx = e.clientX - pointerDown.x;
    const dy = e.clientY - pointerDown.y;
    const dt = performance.now() - pointerDown.t;

    // P0/1.11: umbral más alto en móvil
    const threshold = e.pointerType === 'touch' ? 100 : 25;
    if (dx * dx + dy * dy > threshold || dt > 600) return;

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // Recoger targets
    const targets = [];
    for (const id in bodies) {
      const b = bodies[id];
      if (b.mesh && b.mesh.visible) targets.push(b.mesh);
      if (b._hitbox && b._hitbox.visible) targets.push(b._hitbox);
    }

    const hits = raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      // Recorrer hits hacia arriba para encontrar el userData.bodyId
      for (const h of hits) {
        let obj = h.object;
        while (obj && !obj.userData.bodyId) obj = obj.parent;
        if (obj && obj.userData.bodyId) {
          flyToBody(obj.userData.bodyId);
          break;
        }
      }
    }
  });
}

/* ═══════════════ TECLADO ═══════════════ */
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        document.getElementById('btnPause').click();
        break;
      case 'h': case 'H':
        togglePhotoMode();
        break;
      case 't': case 'T':
        isTourActive() ? stopTour() : startTour();
        break;
      case 'g': case 'G':
        goHome();
        break;
      case 'f': case 'F':
        toggleFullscreen();
        break;
      case '+': case '=':
        zoomBy(0.6, bodies);
        break;
      case '-': case '_':
        zoomBy(1.65, bodies);
        break;
      case 'Escape':
        if (isTourActive()) stopTour();
        if (document.body.classList.contains('photo-mode')) togglePhotoMode();
        break;
    }
  });
}

/* ═══════════════ PHOTO MODE ═══════════════ */
function togglePhotoMode() {
  const isPhoto = document.body.classList.toggle('photo-mode');
  const wm = document.getElementById('photoBodyName');
  if (isPhoto) {
    const id = getSelectedId();
    wm.textContent = id && bodies[id] ? bodies[id].data.name : '';
  }
}

/* ═══════════════ FULLSCREEN ═══════════════ */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

/* ═══════════════ HELP ═══════════════ */
function showHelp() {
  const hint = document.getElementById('hint');
  if (hint) {
    hint.classList.remove('fade');
    hintHidden = false;
  }
  showToast('Arrastra para orbitar · Rueda/pellizco zoom · Clic en cuerpo para viajar · H modo foto · T tour', 4000);
}

/* ═══════════════ ONBOARDING ═══════════════ */
function maybeShowOnboarding() {
  const seen = localStorage.getItem('galaxia-onboarding-seen');
  if (seen) return;

  const onb = document.getElementById('onboarding');
  if (!onb) return;

  onb.hidden = false;

  document.getElementById('onbStart').addEventListener('click', () => {
    localStorage.setItem('galaxia-onboarding-seen', '1');
    onb.hidden = true;
  });

  document.getElementById('onbTour').addEventListener('click', () => {
    localStorage.setItem('galaxia-onboarding-seen', '1');
    onb.hidden = true;
    startTour();
  });
}

/* ═══════════════ RESIZE ═══════════════ */
function onResize() {
  resizeRenderer();
  resizeCamera();
  resizeComposer();
}

/* ═══════════════ LIMPIEZA ═══════════════ */
function cleanup() {
  try {
    disposeBelts();
    orbitLines.forEach(disposeOrbitLine);
    orbitLines = [];
    disposeLabels();
    disposeAllBodies();
    disposeComposer();
    disposeScene();
    disposeCamera();
    disposeRenderer();
  } catch (e) {
    console.warn('cleanup error:', e);
  }
}

/* ═══════════════ LOOP ═══════════════ */
function animate() {
  requestAnimationFrame(animate);
  if (!ready) return;

  const dt = Math.min(clock.getDelta(), 0.1);
  realTimeSeconds += dt;

  if (!paused) {
    const speed = parseFloat(document.getElementById('timeScale').value) || 0;
    simTimeDays += dt * BASE_RATE * speed;
  }

  // P2: un solo loop para update + shader
  for (const id in bodies) {
    const body = bodies[id];
    body.update(simTimeDays);
    body.updateShader(realTimeSeconds);
  }

  // Dirección solar de la Tierra
  if (bodies.earth) bodies.earth.updateEarthSunDir();

  // Cinturones
  updateBelts(simTimeDays);

  // Fondo estelar
  updateBgStarsTime(realTimeSeconds);

  // Cámara
  tickCameraAnim();
  if (!isCameraAnimating()) {
    updateCameraFollow(bodies);
  }

  // Tour
  updateTour(dt);

  // Etiquetas
  updateLabels(camera);

  // Ocultar hint
  if (!hintHidden && realTimeSeconds > 8) {
    const hint = document.getElementById('hint');
    if (hint) hint.classList.add('fade');
    hintHidden = true;
  }

  controls.update();
  renderFrame();
}

/* ═══════════════ ARRANCAR ═══════════════ */
init().catch(err => {
  console.error('[Galaxia] ❌ Init error:', err);
  console.error('[Galaxia] Stack:', err.stack);

  // Mostrar el error en el loader
  setLoader(100, 'Error de inicialización');

  // NO mostrar "WebGL no soportado" — mostrar el error real
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.remove('hide');
    loader.innerHTML = `
      <div style="text-align:center;padding:24px;max-width:600px;color:#d4e2ff;font-family:ui-sans-serif,system-ui,sans-serif;">
        <h1 style="color:#ff6644;font-size:20px;margin-bottom:16px;">Error al iniciar el Explorador Galáctico</h1>
        <p style="color:#9db4dd;font-size:14px;line-height:1.6;margin-bottom:16px;">
          ${escapeHtml(err.message || 'Error desconocido')}
        </p>
        <pre style="background:rgba(0,0,0,0.5);padding:16px;border-radius:8px;text-align:left;overflow:auto;font-size:11px;color:#ff9966;max-height:300px;white-space:pre-wrap;">${escapeHtml((err.stack || '').slice(0, 2000))}</pre>
        <button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:rgba(91,140,255,0.35);border:1px solid rgba(91,140,255,0.55);border-radius:8px;color:#fff;cursor:pointer;font-size:13px;">Volver a cargar</button>
      </div>
    `;
  }
});

// Helper para escapar HTML
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
