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

# 1. Hacer la galaxia de fondo más visible (más estrellas y brillo)
replace_in_file('js/config.js', "stars: LOW_POWER ? 12000 : 50000,", "stars: LOW_POWER ? 25000 : 80000,", "Más estrellas en la galaxia")
replace_in_file('js/config.js', "dust: LOW_POWER ? 1500 : 7000,", "dust: LOW_POWER ? 3000 : 12000,", "Más polvo estelar")
replace_in_file('js/config.js', "haze: LOW_POWER ? 800 : 3500", "haze: LOW_POWER ? 2000 : 6000", "Más nebulosa de fondo")

# 2. Inyectar partículas orbitales alrededor del Sol (Efecto inmersivo)
# Añadimos un nuevo efecto en main.js para que el Sol brille más
replace_in_file('js/main.js', "scene = createScene();", "scene = createScene();\n  // Partículas de inmersión alrededor del Sol\n  const sunGlowGeo = new THREE.BufferGeometry();\n  const sunGlowPos = new Float32Array(500 * 3);\n  for (let i = 0; i < 500; i++) {\n    const r = 8 + Math.random() * 30;\n    const theta = Math.random() * Math.PI * 2;\n    const phi = Math.acos(2 * Math.random() - 1);\n    sunGlowPos[i*3] = Math.sin(phi) * Math.cos(theta) * r;\n    sunGlowPos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;\n    sunGlowPos[i*3+2] = Math.cos(phi) * r;\n  }\n  sunGlowGeo.setAttribute('position', new THREE.BufferAttribute(sunGlowPos, 3));\n  const sunGlowMat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.2, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });\n  const sunGlowParticles = new THREE.Points(sunGlowGeo, sunGlowMat);\n  scene.add(sunGlowParticles);", "Partículas inmersivas del Sol")

# 3. Hacer que los textos de la UI tengan un brillo (CSS)
replace_in_file('css/styles.css', "#infoName { font-size: 20px; font-weight: 600; color: var(--text-bright);", "#infoName { font-size: 20px; font-weight: 600; color: var(--text-bright); text-shadow: 0 0 15px var(--accent-glow);", "Brillo en el título de info")

# 4. Añadir un borde holográfico al panel lateral (CSS)
replace_in_file('css/styles.css', "box-shadow: 0 12px 40px rgba(0,0,0,0.5);\n  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);", "box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 0 30px rgba(91, 140, 255, 0.1);\n  border: 1px solid rgba(91, 140, 255, 0.3);\n  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);", "Holograma en el panel")

# 5. Actualizar el título de la galaxia
replace_in_file('index.html', "<title>Explorador Galáctico · Vía Láctea 3D</title>", "<title>Explorador Galáctico · Vía Láctea 3D · Simulador de Inmersión</title>", "Título de la web")
