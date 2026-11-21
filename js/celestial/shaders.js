/* ═══════════════════════════════════════════════════════════
 * shaders.js — Shaders GLSL personalizados
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P0/1.1: uSunDir se pasa correctamente en espacio mundo y se
 *            transforma al espacio local del tiltGroup antes de
 *            pasarlo a los shaders de Tierra/nubes/atmósfera.
 *  - P1: un único uSunDir compartido entre los 3 shaders (Tierra,
 *        nubes, atmósfera) para evitar inconsistencias.
 */
import * as THREE from 'three';

/* ═══════════════ SOL ═══════════════ */
export const SUN_VERT = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const SUN_FRAG = `
  uniform float time;
  uniform vec3 uColor;
  varying vec3 vPos;
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    vec3 p = vPos * 0.32;
    float n = noise(p + vec3(0.0, time * 0.18, 0.0)) * 0.5
            + noise(p * 2.4 + vec3(time * 0.35, 0.0, 0.0)) * 0.25
            + noise(p * 5.8 + vec3(0.0, time * 0.55, 0.0)) * 0.125;
    vec3 cool = vec3(1.0, 0.35, 0.02);
    vec3 mid  = vec3(1.0, 0.68, 0.18);
    vec3 hot  = vec3(1.0, 0.97, 0.78);
    vec3 col = mix(cool, mid, smoothstep(0.15, 0.55, n));
    col = mix(col, hot, smoothstep(0.55, 0.85, n));
    vec3 finalCol = col * uColor;
    gl_FragColor = vec4(finalCol * 1.35, 1.0);
  }
`;

/* ═══════════════ TIERRA (día) ═══════════════
 * uSunDir: dirección del Sol en espacio LOCAL del tiltGroup.
 * Se calcula en JS como: tiltGroup.worldToLocal(sunWorldPos).normalize()
 */
export const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vec3 n = normalize(vNormalW);
    float ndl = dot(n, uSunDir);
    float day = smoothstep(-0.15, 0.25, ndl);
    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    float landMask = smoothstep(0.0, 0.25, dayCol.g - dayCol.b);
    vec3 nightCol = dayCol * 0.02;
    nightCol += vec3(1.0, 0.65, 0.2) * landMask * 0.25;
    vec3 litCol = dayCol * (0.05 + 0.95 * max(ndl, 0.0));
    vec3 col = mix(nightCol, litCol, day);
    float terminator = 1.0 - abs(day * 2.0 - 1.0);
    col += vec3(0.1, 0.3, 0.7) * terminator * 0.15;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ═══════════════ NUBES ═══════════════ */
export const CLOUD_FRAG = `
  uniform sampler2D cloudMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float a = texture2D(cloudMap, vUv).r;
    float ndl = dot(normalize(vNormalW), uSunDir);
    float day = smoothstep(-0.15, 0.25, ndl);
    vec3 col = vec3(1.0) * (0.06 + 0.94 * day);
    gl_FragColor = vec4(col, a * 0.35);
  }
`;

/* ═══════════════ ATMÓSFERA ═══════════════ */
export const ATMO_VERT = `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const ATMO_FRAG = `
  uniform vec3 uSunDir;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosW);
    float rim = 1.0 - abs(dot(viewDir, normalize(vNormalW)));
    rim = pow(rim, 3.2);
    float sun = max(dot(normalize(vNormalW), uSunDir), 0.0);
    float lit = smoothstep(-0.15, 0.45, sun);
    vec3 col = vec3(0.32, 0.58, 1.0) * rim * (0.35 + 0.65 * lit);
    gl_FragColor = vec4(col, rim * lit * 0.9);
  }
`;

/* ═══════════════ AGUJERO NEGRO (disco) ═══════════════ */
export const BH_DISK_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const BH_DISK_FRAG = `
  uniform float time;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float spin = time * 1.6 + angle * 2.5 + r * 4.0;
    float noise = 0.55 + 0.45 * sin(spin) * sin(spin * 1.7 + r * 8.0);
    float ring = smoothstep(0.35, 0.55, r) * (1.0 - smoothstep(0.82, 1.0, r));
    vec3 hot = vec3(1.0, 0.95, 0.7);
    vec3 col = mix(uColor, hot, pow(noise, 2.5)) * (0.7 + 0.9 * noise);
    float a = ring * noise * 0.9;
    gl_FragColor = vec4(col, a);
  }
`;

/* ═══════════════ GALAXIA PROCEDURAL ═══════════════ */
export const GAL_VERT = `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uMaxPoint;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    float r = length(p.xz);
    float omega = 0.12 * (1.0 + 0.25 * 60.0 / (60.0 + r));
    float a = atan(p.z, p.x) + uTime * omega;
    p.x = cos(a) * r;
    p.z = sin(a) * r;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.1);
    gl_PointSize = aSize * uSize * uPixelRatio * (450.0 / dist);
    gl_PointSize = clamp(gl_PointSize, 0.5, uMaxPoint);
    vColor = aColor;
  }
`;

export const GAL_FRAG_STAR = `
  uniform float uAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    float d = sqrt(d2) * 2.0;
    float g = pow(1.0 - d, 2.2);
    vec3 col = vColor * (0.45 + 1.9 * g);
    gl_FragColor = vec4(col, g * uAlpha);
  }
`;

export const GAL_FRAG_DUST = `
  uniform float uAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    float d = sqrt(d2) * 2.0;
    float a = pow(1.0 - d, 2.0);
    gl_FragColor = vec4(vColor, a * uAlpha);
  }
`;

/* ═══════════════ FACTORY: material de la Tierra ═══════════════ */
export function createEarthMaterial(earthTex) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: earthTex },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) }
    },
    vertexShader: EARTH_VERT,
    fragmentShader: EARTH_FRAG
  });
}

export function createCloudMaterial(earthCloud) {
  return new THREE.ShaderMaterial({
    uniforms: {
      cloudMap: { value: earthCloud },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) }
    },
    vertexShader: EARTH_VERT,
    fragmentShader: CLOUD_FRAG,
    transparent: true,
    depthWrite: false
  });
}

export function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: new THREE.Vector3(1, 0, 0) }
    },
    vertexShader: ATMO_VERT,
    fragmentShader: ATMO_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
}

export function createSunMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      uColor: { value: new THREE.Color(color) }
    },
    vertexShader: SUN_VERT,
    fragmentShader: SUN_FRAG
  });
}

export function createBlackHoleDiskMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      uColor: { value: new THREE.Color(color) }
    },
    vertexShader: BH_DISK_VERT,
    fragmentShader: BH_DISK_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}
