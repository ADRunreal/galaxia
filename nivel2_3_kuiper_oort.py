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

# 1. Reemplazar buildKuiperBelt por una versión más realista
old_kuiper = """export function buildKuiperBelt(scene) {
  const N = LOW_POWER ? 1500 : 3000;
  const pos = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const r = 180 + Math.random() * 80 + gauss() * 2;
    const a = Math.random() * TAU;
    pos[i3] = Math.cos(a) * r;
    pos[i3 + 1] = gauss() * 3;
    pos[i3 + 2] = Math.sin(a) * r;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x7a90c4,
    size: 0.35,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  kuiperBelt = new THREE.Points(geo, mat);
  kuiperBelt.frustumCulled = false;
  scene.add(kuiperBelt);
  return kuiperBelt;
}"""
new_kuiper = """export function buildKuiperBelt(scene) {
  const N = LOW_POWER ? 3000 : 8000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const siz = new Float32Array(N);

  // El cinturón de Kuiper está entre 30 y 50 AU. 
  // En nuestra escala visual, eso es aprox entre 180 y 300 unidades.
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    // Distribución realista: más densidad en el medio
    const r = 180 + Math.random() * 120 + gauss() * 8;
    const a = Math.random() * TAU;
    pos[i3] = Math.cos(a) * r;
    pos[i3 + 1] = gauss() * 5; // Más grueso
    pos[i3 + 2] = Math.sin(a) * r;
    
    // Colores: rojizos y azulados
    const isRed = Math.random() < 0.4;
    if (isRed) {
      col[i3] = 0.8; col[i3+1] = 0.5; col[i3+2] = 0.3;
    } else {
      col[i3] = 0.5; col[i3+1] = 0.6; col[i3+2] = 0.9;
    }
    siz[i] = 0.15 + Math.random() * 0.4;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(siz, 1));

  const mat = new THREE.PointsMaterial({
    vertexColors: true,
    size: 0.4,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  kuiperBelt = new THREE.Points(geo, mat);
  kuiperBelt.frustumCulled = false;
  kuiperBelt.renderOrder = -3;
  scene.add(kuiperBelt);
  return kuiperBelt;
}

export function buildOortCloud(scene) {
  const N = LOW_POWER ? 1500 : 4000;
  const pos = new Float32Array(N * 3);

  // La nube de Oort es una esfera gigante que rodea el sistema solar
  // En nuestra escala, la ponemos a 800-1200 unidades.
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const r = 800 + Math.random() * 400;
    const theta = Math.random() * TAU;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i3] = Math.sin(phi) * Math.cos(theta) * r;
    pos[i3+1] = Math.sin(phi) * Math.sin(theta) * r;
    pos[i3+2] = Math.cos(phi) * r;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x8899cc,
    size: 0.6,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  const oort = new THREE.Points(geo, mat);
  oort.frustumCulled = false;
  oort.renderOrder = -4;
  scene.add(oort);
  return oort;
}"""
replace_in_file('js/celestial/belts.js', old_kuiper, new_kuiper, "Kuiper: Nueva capa realista + Oort")

# 2. Actualizar main.js para llamar a buildOortCloud
old_main = """  buildAsteroidBelt(scene);
  buildKuiperBelt(scene);
  console.log('[Galaxia] ✅ Step 10: cinturones OK');"""
new_main = """  buildAsteroidBelt(scene);
  buildKuiperBelt(scene);
  buildOortCloud(scene);
  console.log('[Galaxia] ✅ Step 10: cinturones y nube de Oort OK');"""
replace_in_file('js/main.js', old_main, new_main, "Main: Añadir Nube de Oort")

# 3. Importar buildOortCloud en main.js
old_import = "import { buildAsteroidBelt, buildKuiperBelt, updateBelts, disposeBelts } from './celestial/belts.js';"
new_import = "import { buildAsteroidBelt, buildKuiperBelt, buildOortCloud, updateBelts, disposeBelts } from './celestial/belts.js';"
replace_in_file('js/main.js', old_import, new_import, "Main: Importar Oort")
