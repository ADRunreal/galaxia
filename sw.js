/* Explorador Galáctico · Service Worker */
const CACHE_NAME = 'galaxia-v2.0.0';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/main.js',
  './js/config.js',
  './js/core/renderer.js',
  './js/core/camera.js',
  './js/core/scene.js',
  './js/core/postprocessing.js',
  './js/celestial/CelestialBody.js',
  './js/celestial/orbits.js',
  './js/celestial/shaders.js',
  './js/celestial/belts.js',
  './js/textures/procedural.js',
  './js/data/bodies.json',
  './js/ui/panel.js',
  './js/ui/labels.js',
  './js/ui/tour.js',
  './js/ui/toasts.js',
  './js/ui/search.js',
  './js/ui/info.js',
  './js/utils/math.js',
  './js/utils/dom.js',
  './js/utils/i18n.js',
  './js/i18n/es.json',
  './js/i18n/en.json',
  './assets/favicon.svg',
  './vendor/three/three.module.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE).catch(err => console.warn('SW precache parcial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (!res || res.status !== 200) return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
