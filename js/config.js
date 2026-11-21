/* ═══════════════ CONFIGURACIÓN GLOBAL ═══════════════ */
import { isLowPower, isMobile } from './utils/dom.js';

export const IS_MOBILE = isMobile();
export const LOW_POWER = isLowPower();

/* Escala temporal base (días simulados por segundo real) */
export const BASE_RATE = 0.5; // 0.5 días por segundo

/* Configuración de la galaxia procedural */
export const GALAXY_CFG = {
  radius: 400,
  stars: LOW_POWER ? 25000 : 80000,
  arms: 2,
  tightness: 0.135,
  dust: LOW_POWER ? 3000 : 12000,
  haze: LOW_POWER ? 2000 : 6000
};

/* Límite de tamaño de punto para la galaxia */
export const GAL_MAX_POINT = LOW_POWER ? 24 : 100;

/* Configuración del renderer */
export const RENDERER_CFG = {
  antialias: !LOW_POWER,
  powerPreference: 'high-performance',
  pixelRatio: Math.min(window.devicePixelRatio, LOW_POWER ? 1.5 : 2),
  toneMappingExposure: 0.9
};

/* Configuración de cámara */
export const CAMERA_CFG = {
  fov: 50,
  near: 0.05,
  far: 60000,
  initialPosition: { x: 0, y: 1200, z: 2000 },
  minDistance: 0.3,
  maxDistance: 30000,
  dampingFactor: 0.065,
  rotateSpeed: 0.5,
  zoomSpeed: 0.85,
  panSpeed: 0.6
};

/* Configuración de bloom */
export const BLOOM_CFG = LOW_POWER
  ? { strength: 0.0, radius: 0.5, threshold: 0.85 }
  : { strength: 0.35, radius: 0.6, threshold: 0.75 };

/* Configuración de texturas */
export const TEXTURE_SIZE = LOW_POWER ? 1024 : 2048;
export const TEXTURE_SIZE_SMALL = LOW_POWER ? 512 : 1024;

/* Configuración de iluminación */
export const LIGHT_CFG = {
  sunIntensity: LOW_POWER ? 6.0 : 8.0,
  sunDecay: 2,
  ambientColor: 0x223355,
  ambientIntensity: 0.18,
  hemiSky: 0x3a5a9a,
  hemiGround: 0x1a1008,
  hemiIntensity: 0.22
};

/* Velocidad de la cámara en tour */
export const TOUR_DWELL_SECONDS = 6;
export const TOUR_BODIES = [
  'sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'io',
  'europa', 'saturn', 'titan', 'uranus', 'neptune', 'triton', 'pluto',
  'orion', 'andromeda', 'sgra'
];

/* Distancia de vista por tipo de cuerpo */
export const VIEW_DISTANCE = {
  star: 400,
  planet: 12,
  moon: 4,
  dwarf: 4,
  asteroid: 2,
  comet: 2,
  exoplanet: 3,
  nebula: 300,
  galaxy: 800,
  blackHole: 80,
  artificial: 1.5
};
