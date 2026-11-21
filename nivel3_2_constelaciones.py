import json
from pathlib import Path

def replace_in_file(path, old, new, desc):
    p = Path(path)
    if not p.exists(): return
    c = p.read_text(encoding='utf-8')
    if old not in c:
        print(f"⚠️ No se encontró: {desc}")
        return
    p.write_text(c.replace(old, new, 1), encoding='utf-8')
    print(f"✅ {desc}")

def append_to_file(path, text, desc):
    p = Path(path)
    if not p.exists(): return
    c = p.read_text(encoding='utf-8')
    if text.strip() in c: 
        print(f"✅ Ya existía: {desc}")
        return
    p.write_text(c + "\n" + text, encoding='utf-8')
    print(f"✅ Añadido: {desc}")

# 1. Crear el archivo de constelaciones
constellations_js = """
/* ═══════════════ CONSTELACIONES ═══════════════ */
import * as THREE from 'three';

export const CONSTELLATIONS = [
  {
    name: 'Orión',
    stars: [
      [1500, -200, 800],   // Betelgeuse
      [1520, -220, 780],   // Rigel
      [1480, -180, 820],   // Bellatrix
      [1500, -210, 800],   // Mintaka
      [1510, -215, 790],   // Alnilam
      [1520, -205, 810]    // Alnitak
    ],
    lines: [[0, 3], [1, 5], [3, 4], [4, 5], [0, 2]]
  },
  {
    name: 'Osa Mayor',
    stars: [
      [-1200, 300, -1500],
      [-1150, 320, -1480],
      [-1100, 310, -1450],
      [-1050, 330, -1420],
      [-1080, 290, -1400],
      [-1120, 280, -1380],
      [-1180, 270, -1400]
    ],
    lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,0]]
  },
  {
    name: 'Casiopea',
    stars: [
      [-1400, 500, 600],
      [-1350, 520, 620],
      [-1300, 510, 640],
      [-1250, 530, 620],
      [-1200, 540, 600]
    ],
    lines: [[0,1], [1,2], [2,3], [3,4]]
  }
];

export function createConstellations(scene) {
  const group = new THREE.Group();
  group.name = 'constellations';
  
  CONSTELLATIONS.forEach(constellation => {
    // Convertir las coordenadas a Vector3
    const vectors = constellation.stars.map(s => new THREE.Vector3(...s));
    
    // Crear las líneas
    constellation.lines.forEach(([i, j]) => {
      const points = [vectors[i], vectors[j]];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ 
        color: 0x88bbff, 
        transparent: true, 
        opacity: 0.15,
        depthWrite: false
      });
      const line = new THREE.Line(geo, mat);
      group.add(line);
    });
    
    // Añadir etiquetas de nombre
    const center = vectors.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(vectors.length);
    const label = document.createElement('div');
    label.className = 'body-label';
    label.textContent = constellation.name;
    label.style.color = '#88bbff';
    label.style.fontStyle = 'italic';
    label.dataset.constellation = constellation.name;
    document.getElementById('labels').appendChild(label);
  });
  
  scene.add(group);
  console.log('[Galaxia] ⭐ Constelaciones creadas:', CONSTELLATIONS.length);
  return group;
}
"""
append_to_file('js/ui/constellations.js', constellations_js, "Nuevo: js/ui/constellations.js")

# 2. Añadir el toggle de constelaciones al HTML
old_visibility = """    <label class="toggle-row">Calidad alta <input type="checkbox" id="tglQuality" /><span class="switch"></span></label>"""
new_visibility = """    <label class="toggle-row">Calidad alta <input type="checkbox" id="tglQuality" /><span class="switch"></span></label>
    <label class="toggle-row" style="margin-top: 8px; border-top: 1px solid rgba(110,160,240,0.1); padding-top: 8px;">
      Constelaciones <input type="checkbox" id="tglConstellations" /><span class="switch"></span>
    </label>"""
replace_in_file('index.html', old_visibility, new_visibility, "HTML: Toggle constelaciones")

# 3. Importar y conectar en main.js
old_import = "import { toggleAmbientAudio } from './ui/audio.js';"
new_import = "import { toggleAmbientAudio } from './ui/audio.js';\nimport { createConstellations } from './ui/constellations.js';"
replace_in_file('js/main.js', old_import, new_import, "Main: Import constelaciones")

old_init = """  buildAsteroidBelt(scene);
  buildKuiperBelt(scene);
  buildOortCloud(scene);
  console.log('[Galaxia] ✅ Step 10: cinturones y nube de Oort OK');"""
new_init = """  buildAsteroidBelt(scene);
  buildKuiperBelt(scene);
  buildOortCloud(scene);
  createConstellations(scene);
  console.log('[Galaxia] ✅ Step 10: cinturones, Oort y constelaciones OK');"""
replace_in_file('js/main.js', old_init, new_init, "Main: Crear constelaciones")

# 4. Conectar el toggle
old_panel = """    onScaleToggle: (isReal) => {"""
new_panel = """    onConstellationsToggle: (v) => {
      scene.traverse(obj => {
        if (obj.name === 'constellations') obj.visible = v;
      });
      // Ocultar etiquetas de constelaciones
      document.querySelectorAll('[data-constellation]').forEach(el => {
        el.style.display = v ? 'block' : 'none';
      });
    },
    onScaleToggle: (isReal) => {"""
replace_in_file('js/main.js', old_panel, new_panel, "Main: Toggle constelaciones")

# 5. Conectar el toggle en panel.js
old_panel_init = """  const tglQuality = document.getElementById('tglQuality');"""
new_panel_init = """  const tglQuality = document.getElementById('tglQuality');
  const tglConstellations = document.getElementById('tglConstellations');"""
replace_in_file('js/ui/panel.js', old_panel_init, new_panel_init, "Panel: Variable constelaciones")

old_listeners = """  tglQuality?.addEventListener('change', e => onQualityToggle?.(e.target.checked));"""
new_listeners = """  tglQuality?.addEventListener('change', e => onQualityToggle?.(e.target.checked));
  tglConstellations?.addEventListener('change', e => onConstellationsToggle?.(e.target.checked));"""
replace_in_file('js/ui/panel.js', old_listeners, new_listeners, "Panel: Listener constelaciones")

# 6. Añadir onConstellationsToggle al destructuring
old_destructure = """  onQualityToggle
}) {"""
new_destructure = """  onQualityToggle,
  onConstellationsToggle
}) {"""
replace_in_file('js/ui/panel.js', old_destructure, new_destructure, "Panel: Destructuring constelaciones")
