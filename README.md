# 🌌 Explorador Galáctico · Vía Láctea

Un viaje interactivo en 3D por el Sistema Solar, la Vía Láctea y el universo cercano. Visita planetas, lunas, estrellas, agujeros negros, nebulosas y galaxias lejanas desde tu navegador.

[![Deploy](https://img.shields.io/badge/demo-en%20vivo-5b8cff?style=flat-square)](https://adrunreal.github.io/galaxia/)
[![License: MIT](https://img.shields.io/badge/License-MIT-5b8cff?style=flat-square)](./LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-5b8cff?style=flat-square)](https://threejs.org/)
[![Costo](https://img.shields.io/badge/costo-%240-3fb950?style=flat-square)]()

**[▶ Abrir el explorador](https://adrunreal.github.io/galaxia/)**

---

## ✨ Características

- **80+ cuerpos celestes** catalogados: planetas, lunas, planetas enanos, asteroides, objetos del cinturón de Kuiper, cometas, estrellas cercanas, exoplanetas, agujeros negros, nebulosas y galaxias.
- **Viaje interactivo**: haz clic en cualquier cuerpo (o en el catálogo) y la cámara viaja hasta él.
- **Búsqueda con soporte de acentos** y búsqueda difusa.
- **Filtros por categoría** en el catálogo.
- **Tour guiado automático** por los puntos más interesantes.
- **Modo foto** (tecla `H`) para capturas limpias sin UI.
- **Compartir por URL**: cada cuerpo tiene su enlace directo (`?body=tierra`).
- **Toggles de visualización**: etiquetas, órbitas, estrellas de fondo, nebulosas y bloom.
- **Control de velocidad del tiempo** (0× a 20×) y pausa.
- **Texturas 100% procedurales**: no se necesitan assets externos. Funciona offline.
- **Cinturón de asteroides** (1.800 rocas instanciadas), **cinturón de Kuiper** y objetos artificiales (ISS, Hubble, Voyager 1 y 2).
- **Accesibilidad**: navegación por teclado, `prefers-reduced-motion`, `aria-labels`.
- **Auto-calidad**: si detecta FPS bajos, reduce la calidad automáticamente.
- **PWA instalable** (manifest + service worker opcional).
- **Cero coste**: no requiere backend ni servicios de pago.

---

## 🎮 Controles

| Acción | Teclado | Ratón / Táctil |
|---|---|---|
| Orbitar | — | Arrastrar |
| Zoom | `+` / `-` | Rueda / pellizco |
| Seleccionar y viajar | `Enter` (en búsqueda) | Clic en el cuerpo |
| Pausar / Reanudar | `Espacio` | Botón ⏸ |
| Volver a la galaxia | `G` | Botón ⌂ |
| Tour guiado | `T` | Botón ▶ |
| Modo foto | `H` | — |
| Salir / Deseleccionar | `Esc` | — |
| Buscar | `/` | Campo de búsqueda |

---

## 🚀 Uso

### En línea
Abre **[adrunreal.github.io/galaxia](https://adrunreal.github.io/galaxia/)** y listo.

### Local
```bash
git clone https://github.com/ADRunreal/galaxia.git
cd galaxia
# Opción A: abrir index.html directamente
# Opción B: servidor local (recomendado para el service worker)
python -m http.server 8000
# o: npx serve
