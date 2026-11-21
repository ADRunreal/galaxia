/* ═══════════════════════════════════════════════════════════
 * CelestialBody.js — Clase que representa un cuerpo celeste
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.1: uSunDir calculado en espacio mundo y compartido entre
 *            Tierra, nubes y atmósfera.
 *  - P0/1.3: updateRotation protegido contra rotationDays === 0 o undefined.
 *  - P1/1.6: viewDistance por kind (planet, moon, star, galaxy, etc.)
 *  - P1/1.9: labels usan dot(camDir, toBody) para filtrar detrás de cámara.
 *  - P1/1.16: sprites de nebulosa/galaxia con depthTest true.
 *  - P2/2.10: segmentos de esfera adaptativos según LOW_POWER.
 *  - P2: dispose() completo con liberación de texturas y sprites.
 *  - P2: hitbox invisible para cuerpos pequeños (radius < 0.5).
 */
import * as THREE from 'three';
import { DEG, TAU, solveKepler, hashString } from '../utils/math.js';
import { LOW_POWER, VIEW_DISTANCE } from '../config.js';
import {
  createSunMaterial,
  createEarthMaterial,
  createCloudMaterial,
  createAtmosphereMaterial,
  createBlackHoleDiskMaterial
} from './shaders.js';
import {
  makeGlowTexture,
  makeNebulaTexture,
  makeSpiralGalaxyTexture
} from '../textures/procedural.js';

/* ═══════════════ REGISTRO GLOBAL DE CUERPOS ═══════════════ */
export const bodies = {};

/* ═══════════════ TEXTURAS COMPARTIDAS (inyectadas desde main) ═══════════════ */
let _textures = null;

export function setSharedTextures(textures) {
  _textures = textures;
}

/* ═══════════════ CLASE ═══════════════ */
export class CelestialBody {
  /**
   * @param {Object} data — entrada de bodies.json
   * @param {CelestialBody|null} parentBody
   */
  constructor(data, parentBody = null) {
    this.data = data;
    this.parentBody = parentBody || null;
    this.id = data.id;

    /* ─── Jerarquía de transformaciones ─── */
    this.pivot = new THREE.Group();          // posición orbital
    this.tiltGroup = new THREE.Group();      // inclinación axial
    this.tiltGroup.rotation.z = (data.axialTiltDeg || 0) * DEG;
    this.pivot.add(this.tiltGroup);

    /* ─── Elementos orbitales keplerianos ─── */
    this.a = data.orbitRadius || 0;
    this.e = data.eccentricity || 0;
    this.i = (data.inclinationDeg || 0) * DEG;
    this.omega = (hashString(data.id + 'w') % 6283) / 1000;
    this.Omega = (hashString(data.id + 'O') % 6283) / 1000;
    this.M0 = (hashString(data.id + 'M') % 6283) / 1000;
    this.periodDays = data.periodDays || 365.25;
    this.rotationDays = data.rotationDays || 0;

    /* ─── Mesh principal ─── */
    this._createMesh();
    this._createHitbox();

    /* ─── Efectos especiales ─── */
    if (data.isEarth) this._addEarthEffects();
    if (data.isSaturn) this._addSaturnRings();
    if (data.kind === 'star' || data.id === 'sun') this._addSunCorona();
    if (data.isComet) this._addCometTail();
    if (data.isBlackHole) this._addBlackHoleEffect();
    if (data.isNebula) this._addNebulaEffect();
    if (data.isGalaxy) this._addGalaxyEffect();
    if (data.isArtificial) this._addArtificialMarker();

    /* ─── Hijos (lunas, etc.) ─── */
    this.satelliteGroup = new THREE.Group();
    this.pivot.add(this.satelliteGroup);

    /* ─── Posicionamiento jerárquico ─── */
    if (parentBody) {
      parentBody.satelliteGroup.add(this.pivot);
    }

    /* ─── Registro ─── */
    bodies[data.id] = this;
    this._lastWorldPos = new THREE.Vector3();
    this._tmpWorldPos = new THREE.Vector3();
  }

  /* ═══════════════ CREACIÓN DE MESH ═══════════════ */

  _createMesh() {
    const d = this.data;

    // Segmentos adaptativos
    let segs;
    if (LOW_POWER) {
      segs = d.radius > 1 ? 32 : (d.radius > 0.3 ? 24 : 16);
    } else {
      segs = d.radius > 1 ? 64 : (d.radius > 0.3 ? 48 : 24);
    }
    const heightSegs = Math.max(12, Math.floor(segs / 2));

    const geo = new THREE.SphereGeometry(d.radius, segs, heightSegs);
    const mat = this._createMaterial();
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.userData.bodyId = d.id;
    this.mesh.frustumCulled = true;
    this.tiltGroup.add(this.mesh);
  }

  _createMaterial() {
    const d = this.data;

    // Estrella / Sol
    if (d.kind === 'star' || d.id === 'sun') {
      return createSunMaterial(new THREE.Color(d.color));
    }

    // Tierra
    if (d.isEarth) {
      this.earthMat = createEarthMaterial(_textures.earthTex);
      return this.earthMat;
    }

    // Luna
    if (d.isMoon) {
      return new THREE.MeshStandardMaterial({
        map: _textures.moonTex,
        roughness: 1.0,
        metalness: 0
      });
    }

    // Agujero negro
    if (d.isBlackHole) {
      return new THREE.MeshBasicMaterial({ color: 0x000000 });
    }

    // Nebulosa (mesh invisible, solo sprites)
    if (d.isNebula) {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.color),
        transparent: true,
        opacity: 0.05
      });
    }

    // Galaxia (mesh invisible, solo sprite)
    if (d.isGalaxy) {
      return new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0
      });
    }

    // Artificial
    if (d.isArtificial) {
      return new THREE.MeshBasicMaterial({ color: new THREE.Color(d.color) });
    }

    // Cuerpos con textura específica
    if (_textures.TEX[d.id]) {
      return new THREE.MeshStandardMaterial({
        map: _textures.TEX[d.id],
        roughness: 0.92,
        metalness: 0.02
      });
    }

    // Fallback: color plano
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(d.color),
      roughness: 0.95,
      metalness: 0
    });
  }

  _createHitbox() {
    const d = this.data;
    if (d.radius >= 0.5) return;
    const hitRadius = Math.max(d.radius * 2.5, 0.12);
    const hb = new THREE.Mesh(
      new THREE.SphereGeometry(hitRadius, 8, 6),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    hb.userData.bodyId = d.id;
    hb.userData.isHitbox = true;
    this.tiltGroup.add(hb);
    this._hitbox = hb;
  }

  /* ═══════════════ EFECTOS ESPECIALES ═══════════════ */

  _addEarthEffects() {
    const r = this.data.radius;

    // Nubes
    const cloudGeo = new THREE.SphereGeometry(r * 1.008, LOW_POWER ? 32 : 64, LOW_POWER ? 24 : 48);
    this.cloudMat = createCloudMaterial(_textures.earthCloud);
    this.clouds = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.tiltGroup.add(this.clouds);

    // Atmósfera
    const atmoGeo = new THREE.SphereGeometry(r * 1.04, LOW_POWER ? 32 : 64, LOW_POWER ? 24 : 48);
    this.atmoMat = createAtmosphereMaterial();
    this.atmosphere = new THREE.Mesh(atmoGeo, this.atmoMat);
    this.tiltGroup.add(this.atmosphere);
  }

  _addSaturnRings() {
    const r = this.data.radius;
    const inner = r * 1.35;
    const outer = r * 2.4;
    const geo = new THREE.RingGeometry(inner, outer, LOW_POWER ? 64 : 128, 1);

    // Ajustar UV radial
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const rad = v.length();
      uv.setXY(i, (rad - inner) / (outer - inner), 0.5);
    }

    const mat = new THREE.MeshStandardMaterial({
      map: _textures.saturnRingTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 1.0,
      metalness: 0,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    this.tiltGroup.add(ring);
    this.ring = ring;
  }

  _addSunCorona() {
    const tex = makeGlowTexture(
      'rgba(255,255,255,1)',
      'rgba(200,200,255,0.5)',
      'rgba(0,0,0,0)'
    );
    this.coronaA = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false
    }));
    const r = this.data.radius;
    this.coronaA.scale.set(r * 6, r * 6, 1);
    this.tiltGroup.add(this.coronaA);
  }

  _addCometTail() {
    const r = this.data.radius;

    // Cola (cono)
    const geo = new THREE.ConeGeometry(r * 1.1, 1, 8, 1, true);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.tail = new THREE.Mesh(geo, mat);
    this.pivot.add(this.tail);

    // Coma (glow)
    const c = new THREE.Color(this.data.color);
    const tex = makeGlowTexture(
      'rgba(255,255,255,1)',
      `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.6)`,
      `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0)`
    );
    this.coma = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    this.coma.scale.setScalar(r * 5);
    this.tiltGroup.add(this.coma);
  }

  _addBlackHoleEffect() {
    const r = this.data.radius;

    // Disco de acreción
    const diskGeo = new THREE.RingGeometry(r * 1.4, r * 3.5, LOW_POWER ? 48 : 96, 1);
    this.diskMat = createBlackHoleDiskMaterial(new THREE.Color(this.data.color));
    this.disk = new THREE.Mesh(diskGeo, this.diskMat);
    this.disk.rotation.x = Math.PI / 2.3;
    this.tiltGroup.add(this.disk);

    // Anillo fotónico
    const photonGeo = new THREE.RingGeometry(r * 1.05, r * 1.12, LOW_POWER ? 32 : 64);
    const photonMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.photonRing = new THREE.Mesh(photonGeo, photonMat);
    this.photonRing.rotation.x = Math.PI / 2.3;
    this.tiltGroup.add(this.photonRing);
  }

  _addNebulaEffect() {
    const [r, g, b] = this.data.nebulaColor || [255, 130, 200];

    // Sprite principal
    const tex = makeNebulaTexture(r, g, b);
    const sprMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true   // P1/1.16
    });
    const spr = new THREE.Sprite(sprMat);
    spr.scale.setScalar(this.data.radius * 3.0);
    spr.renderOrder = -5;
    this.tiltGroup.add(spr);

    // Glow adicional
    const glowTex = makeGlowTexture(
      `rgba(${r},${g},${b},1)`,
      `rgba(${r},${g},${b},0.35)`,
      `rgba(${r},${g},${b},0)`
    );
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(this.data.radius * 5.5);
    glow.renderOrder = -5;
    this.tiltGroup.add(glow);

    this.mesh.visible = false;
    this.nebulaSprites = [spr, glow];
  }

  _addGalaxyEffect() {
    const tex = makeSpiralGalaxyTexture();
    const sprMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true   // P1/1.16
    });
    const spr = new THREE.Sprite(sprMat);
    spr.scale.setScalar(this.data.radius * 4.0);
    spr.renderOrder = -5;
    this.tiltGroup.add(spr);
    this.mesh.visible = false;
    this.galaxySprite = spr;
  }

  _addArtificialMarker() {
    const tex = makeGlowTexture(
      'rgba(255,255,255,1)',
      'rgba(255,220,150,0.5)',
      'rgba(255,200,100,0)'
    );
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    spr.scale.setScalar(0.35);
    this.tiltGroup.add(spr);
    this.marker = spr;
  }

  /* ═══════════════ ACTUALIZACIÓN ORBITAL ═══════════════ */

  /**
   * Propaga la posición orbital con elementos keplerianos.
   * @param {number} simDays
   */
  updatePosition(simDays) {
    if (!this.parentBody || this.id === 'sun') return;
    if (this.periodDays === 0) return;

    const M = this.M0 + TAU * (simDays / this.periodDays);
    const E = solveKepler(M, this.e);

    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const r = this.a * (1 - this.e * cosE);

    const nu = 2 * Math.atan2(
      Math.sqrt(1 + this.e) * Math.sin(E / 2),
      Math.sqrt(1 - this.e) * Math.cos(E / 2)
    );

    const xOrb = r * Math.cos(nu);
    const zOrb = r * Math.sin(nu);

    // Rotación por omega
    const cosW = Math.cos(this.omega), sinW = Math.sin(this.omega);
    const x1 = xOrb * cosW - zOrb * sinW;
    const z1 = xOrb * sinW + zOrb * cosW;

    // Inclinación
    const cosI = Math.cos(this.i), sinI = Math.sin(this.i);
    const y2 = z1 * sinI;
    const z2 = z1 * cosI;

    // Nodo ascendente
    const cosO = Math.cos(this.Omega), sinO = Math.sin(this.Omega);
    const xF = x1 * cosO - z2 * sinO;
    const zF = x1 * sinO + z2 * cosO;

    this.pivot.position.set(xF, y2, zF);
  }

  /**
   * Actualiza la rotación propia.
   * Protegido contra rotationDays 0 / undefined / NaN.
   * @param {number} simDays
   */
  updateRotation(simDays) {
    const rd = this.rotationDays;
    if (!rd || rd === 0 || !isFinite(rd)) return;

    this.mesh.rotation.y = (simDays / rd) * TAU;

    // Nubes: rotan ligeramente más rápido (protegido)
    if (this.clouds && isFinite(rd)) {
      this.clouds.rotation.y = (simDays / (rd * 0.95)) * TAU;
    }
  }

  /**
   * Tick principal del cuerpo.
   */
  update(simDays) {
    this.updatePosition(simDays);
    this.updateRotation(simDays);
    this.mesh.getWorldPosition(this._lastWorldPos);
  }

  /* ═══════════════ ACTUALIZACIÓN DE SHADERS ═══════════════ */

  updateShader(t) {
    // Sol / estrellas
    if (this.data.kind === 'star' || this.data.id === 'sun') {
      if (this.mesh.material && this.mesh.material.uniforms) {
        this.mesh.material.uniforms.time.value = t;
      }
      if (this.coronaA) {
        const s = this.data.radius * (6 + Math.sin(t * 1.3) * 0.25);
        this.coronaA.scale.set(s, s, 1);
      }
    }

    // Agujero negro
    if (this.disk && this.diskMat) {
      this.diskMat.uniforms.time.value = t;
    }
    if (this.photonRing) {
      this.photonRing.material.opacity = 0.6 + 0.3 * Math.sin(t * 3.0);
      this.photonRing.rotation.z = t * 0.15;
    }

    // Anillo de Saturno
    if (this.ring) this.ring.rotation.z = t * 0.04;

    // Nebulosas
    if (this.nebulaSprites) {
      const [spr, glow] = this.nebulaSprites;
      spr.material.opacity = 0.4 + 0.18 * Math.sin(t * 0.6);
      glow.material.opacity = 0.3 + 0.12 * Math.sin(t * 0.9 + 1.0);
    }

    // Galaxia
    if (this.galaxySprite) this.galaxySprite.material.rotation = t * 0.03;

    // Marcador artificial
    if (this.marker) this.marker.material.opacity = 0.6 + 0.35 * Math.sin(t * 4.0);
  }

  /* ═══════════════ TIERRA: DIRECCIÓN SOLAR ═══════════════ */

  /**
   * Actualiza uSunDir en los 3 uniforms de la Tierra.
   * El Sol está en el origen (0,0,0) en el espacio mundo.
   */
  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;

    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    // Dirección del Sol en espacio mundo: (0,0,0) - earthPos
    const sunDir = this._tmpWorldPos.clone().negate().normalize();

    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }

  /* ═══════════════ HELPERS PARA CÁMARA / UI ═══════════════ */

  /**
   * Distancia sugerida para flyTo según el kind.
   */
  getViewDistance() {
    const kind = this.data.kind || 'planet';
    const base = VIEW_DISTANCE[kind] ?? VIEW_DISTANCE.planet;
    // Escalar por el radio real
    return Math.max(this.data.radius * base * 0.15, base * 0.5);
  }

  /**
   * Offset 3D de cámara para flyTo.
   */
  getCameraOffset() {
    const d = this.getViewDistance();
    return new THREE.Vector3(d * 1.4, d * 0.7, d * 1.4);
  }

  /**
   * Comprueba si el cuerpo está detrás de la cámara (para labels).
   */
  isBehindCamera(camera) {
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    const toBody = this._lastWorldPos.clone().sub(camera.position);
    return toBody.dot(camDir) < 0;
  }

  /* ═══════════════ DISPOSE ═══════════════ */

  dispose() {
    const safeDispose = (obj) => {
      if (!obj) return;
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map && !m.map.userData?.shared) m.map.dispose();
            m.dispose();
          });
        } else {
          if (obj.material.map && !obj.material.map.userData?.shared) {
            obj.material.map.dispose();
          }
          obj.material.dispose();
        }
      }
    };

    safeDispose(this.mesh);
    safeDispose(this.clouds);
    safeDispose(this.atmosphere);
    safeDispose(this.ring);
    safeDispose(this.disk);
    safeDispose(this.photonRing);
    safeDispose(this.tail);
    safeDispose(this._hitbox);

    if (this.coma) this.coma.material.dispose();
    if (this.coronaA) this.coronaA.material.dispose();
    if (this.marker) this.marker.material.dispose();

    if (this.nebulaSprites) {
      this.nebulaSprites.forEach(s => s.material.dispose());
    }
    if (this.galaxySprite) this.galaxySprite.material.dispose();

    // Eliminar del registro
    delete bodies[this.id];
  }
}

/* ═══════════════ FACTORY ═══════════════ */

/**
 * Instancia todos los cuerpos a partir del JSON, en orden jerárquico.
 * @param {Array} bodiesData
 * @param {THREE.Group} solarSystem
 * @returns {Object} bodies
 */
export function createAllBodies(bodiesData, solarSystem) {
  const created = {};

  for (const data of bodiesData) {
    const parent = data.parent ? created[data.parent] || null : null;
    const body = new CelestialBody(data, parent);

    if (!parent) {
      solarSystem.add(body.pivot);
    }

    // Cuerpos sin padre pero con orbitRadius: posicionamiento estático
    if (!data.parent && data.id !== 'sun' && data.orbitRadius > 0) {
      const h = hashString(data.id);
      const ang = (h % 6283) / 1000;
      const yAng = ((h >> 10) % 6283) / 1000 * 0.6 - 0.3;
      const r = data.orbitRadius;
      const cy = Math.cos(yAng);
      body.pivot.position.set(
        Math.cos(ang) * cy * r,
        Math.sin(yAng) * r * 0.6,
        Math.sin(ang) * cy * r
      );
    }

    if (data.id === 'sun') {
      body.pivot.position.set(0, 0, 0);
    }

    created[data.id] = body;
  }

  return created;
}

/**
 * Dispose global de todos los cuerpos.
 */
export function disposeAllBodies() {
  for (const id in bodies) {
    bodies[id].dispose();
  }
}
