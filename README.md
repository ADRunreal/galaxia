# 🌌 Explorador Galáctico · Vía Láctea 3D

Explorador 3D interactivo del Sistema Solar, estrellas, nebulosas, galaxias y
agujeros negros. Construido con **Three.js** y texturas procedurales (sin
dependencias de imágenes externas).

## ✨ Características

- 🌍 Sistema Solar completo con órbitas keplerianas realistas (excentricidad, inclinación, nodos).
- ⭐ Catálogo de +50 cuerpos celestes: planetas, lunas, planetas enanos, asteroides, cometas, estrellas, exoplanetas, nebulosas, galaxias y agujeros negros.
- 🎮 Controles: orbitar, zoom, paneo, tour guiado, modo foto.
- 🔗 Deep-linking: `?body=tierra` abre directamente ese cuerpo.
- 📸 Compartir vista actual con posición de cámara y tiempo simulado.
- 🌐 i18n: español e inglés.
- 📱 PWA instalable y offline (service worker).
- ♿ Accesibilidad: roles ARIA, contraste WCAG AA, `prefers-reduced-motion`.

## 🚀 Instalación

### Requisitos

- Navegador moderno con WebGL (Chrome, Firefox, Safari, Edge).
- Servidor local (no abras `index.html` con `file://`).

### Vendorizar Three.js

Descarga Three.js r160 y colócalo en `vendor/three/`:

```bash
mkdir -p vendor/three/addons
curl -L https://unpkg.com/three@0.160.0/build/three.module.js -o vendor/three/three.module.js
curl -L https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js -o vendor/three/addons/controls/OrbitControls.js
# ... resto de addons (EffectComposer, RenderPass, UnrealBloomPass, OutputPass)

## 📜 Licencia

MIT License · Copyright (c) 2026 Explorador Galáctico

Three.js © three.js authors · MIT License
https://github.com/mrdoob/three.js/blob/dev/LICENSE
