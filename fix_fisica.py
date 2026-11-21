import json
from pathlib import Path

def replace_in_file(path, old, new, desc):
    p = Path(path)
    if not p.exists():
        print(f"❌ No existe: {path}")
        return
    c = p.read_text(encoding='utf-8')
    if old not in c:
        print(f"⚠️ No se encontró: {desc}")
        return
    p.write_text(c.replace(old, new, 1), encoding='utf-8')
    print(f"✅ {desc}")

# 1. Arreglar la Tierra (Luz y Nubes)
old_earth = """  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;
    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    const sunDir = this._tmpWorldPos.clone().negate().normalize();
    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
new_earth = """  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;
    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    const sunDir = new THREE.Vector3(0, 0, 0).sub(this._tmpWorldPos).normalize();
    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
replace_in_file('js/celestial/CelestialBody.js', old_earth, new_earth, "Dirección solar de la Tierra")

replace_in_file('js/celestial/shaders.js', "gl_FragColor = vec4(col, a * 0.78);", "gl_FragColor = vec4(col, a * 0.35);", "Nubes más suaves")

# 2. Alejar el Cinturón de Kuiper
replace_in_file('js/celestial/belts.js', "const r = 118 + Math.random() * 70 + gauss() * 2;", "const r = 180 + Math.random() * 80 + gauss() * 2;", "Alejar Cinturón de Kuiper")

# 3. Corregir datos orbitales de cometas y añadir objetos reales faltantes en bodies.json
p_json = Path('js/data/bodies.json')
data = json.loads(p_json.read_text(encoding='utf-8'))

# Corregir Halley y Encke para que no atraviesen el Sol
for b in data:
    if b['id'] == 'halley':
        b['orbitRadius'] = 400
        b['eccentricity'] = 0.75
    if b['id'] == 'encke':
        b['orbitRadius'] = 120
        b['eccentricity'] = 0.6

# Añadir objetos reales del sistema solar profundo y exoplanetas famosos
nuevos = [
    {"id": "arrokoth", "name": "Arrokoth", "type": "Objeto del cinturón de Kuiper", "category": "Kuiper", "radius": 0.05, "color": "0xcc8866", "parent": "sun", "orbitRadius": 220, "periodDays": 107000, "eccentricity": 0.04, "inclinationDeg": 2.5, "rotationDays": 0.66, "diameter": "36 km", "distance": "6.600 M km", "orbPeriod": "293 años", "rotPeriod": "15,9 horas", "desc": "Visitado por New Horizons en 2019. Un remanente de la formación del Sistema Solar.", "kind": "asteroid"},
    {"id": "farout", "name": "Farout", "type": "Objeto transneptuniano extremo", "category": "Kuiper", "radius": 0.15, "color": "0xd87a7a", "parent": "sun", "orbitRadius": 280, "periodDays": 3600000, "eccentricity": 0.53, "inclinationDeg": 31.5, "rotationDays": 0.4, "diameter": "500 km", "distance": "18.000 M km", "orbPeriod": "~1000 años", "rotPeriod": "Desconocido", "desc": "Uno de los objetos más lejanos observados en el Sistema Solar.", "kind": "dwarf"},
    {"id": "barnard", "name": "Estrella de Barnard", "type": "Enana roja", "category": "Estrellas", "radius": 2.5, "color": "0xff7755", "parent": None, "orbitRadius": 1100, "rotationDays": 130, "diameter": "200.000 km", "distance": "5,96 años luz", "orbPeriod": "—", "rotPeriod": "130 días", "desc": "La cuarta estrella más cercana al Sol. Se mueve muy rápido.", "kind": "star"},
    {"id": "siriusb", "name": "Sirio B", "type": "Enana blanca", "category": "Estrellas", "radius": 0.5, "color": "0xffffff", "parent": "sirius", "orbitRadius": 15, "periodDays": 18250, "eccentricity": 0.59, "inclinationDeg": 136.3, "rotationDays": 0.1, "diameter": "12.000 km", "distance": "8,6 años luz", "orbPeriod": "50 años", "rotPeriod": "Desconocido", "desc": "La enana blanca compañera de Sirio. Extremadamente densa.", "kind": "star"},
    {"id": "kepler186f", "name": "Kepler-186f", "type": "Exoplaneta rocoso", "category": "Exoplanetas", "radius": 1.1, "color": "0x88aaff", "parent": None, "orbitRadius": 2000, "rotationDays": 130, "diameter": "~15.000 km", "distance": "580 años luz", "orbPeriod": "130 días", "rotPeriod": "Sincrónica", "desc": "El primer exoplaneta del tamaño de la Tierra en la zona habitable de otra estrella.", "kind": "exoplanet"},
    {"id": "proximad", "name": "Próxima d", "type": "Exoplaneta rocoso", "category": "Exoplanetas", "radius": 0.6, "color": "0xccaa88", "parent": "proxima", "orbitRadius": 8, "periodDays": 5.1, "eccentricity": 0.0, "inclinationDeg": 0, "rotationDays": 5.1, "diameter": "~7.500 km", "distance": "4,24 años luz", "orbPeriod": "5,1 días", "rotPeriod": "Sincrónica", "desc": "Uno de los exoplanetas más ligeros conocidos.", "kind": "exoplanet"}
]

# Comprobar si ya existen para no duplicar
existing_ids = {b['id'] for b in data}
for n in nuevos:
    if n['id'] not in existing_ids:
        data.append(n)

p_json.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"✅ bodies.json actualizado con nuevos objetos ({len(data)} total)")

# 4. Fijar el tiempo BASE_RATE para que sea más realista (1 segundo = 1 día real)
replace_in_file('js/config.js', "export const BASE_RATE = 1.0;", "export const BASE_RATE = 0.5; // 0.5 días por segundo", "Velocidad real de tiempo")

# 5. Ajustar la cámara para ver mejor la escala
replace_in_file('js/config.js', "initialPosition: { x: 0, y: 900, z: 1500 },", "initialPosition: { x: 0, y: 1400, z: 2500 },", "Alejar cámara inicial")
replace_in_file('js/config.js', "planet: 8,", "planet: 14,", "Ajustar vista planetas")
replace_in_file('js/config.js', "moon: 3,", "moon: 5,", "Ajustar vista lunas")
replace_in_file('js/config.js', "star: 200,", "star: 400,", "Ajustar vista estrellas")
