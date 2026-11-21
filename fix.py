from pathlib import Path

def replace_in_file(path, old_text, new_text, description):
    p = Path(path)
    if not p.exists():
        print(f"❌ Archivo no encontrado: {path}")
        return
    content = p.read_text(encoding='utf-8')
    if old_text not in content:
        print(f"⚠️ No se encontró el bloque para: {description} en {path}")
        return
    content = content.replace(old_text, new_text, 1)
    p.write_text(content, encoding='utf-8')
    print(f"✅ Arreglado: {description} ({path})")

# 1. Alejar el Cinturón de Kuiper y bajar su opacidad (belts.js)
replace_in_file(
    'js/celestial/belts.js',
    "const r = 118 + Math.random() * 70 + gauss() * 2;",
    "const r = 180 + Math.random() * 80 + gauss() * 2;",
    "Alejar Kuiper (radio)"
)
replace_in_file(
    'js/celestial/belts.js',
    "opacity: 0.4,",
    "opacity: 0.15,",
    "Bajar opacidad Kuiper"
)

# 2. Arreglar las órbitas de Halley y Encke en bodies.json
old_halley = '"id": "halley", "name": "Cometa Halley", "type": "Cometa periódico", "category": "Cometas", "radius": 0.09, "color": "0xd8e0f0", "parent": "sun", "orbitRadius": 215, "periodDays": 27500, "eccentricity": 0.967,'
new_halley = '"id": "halley", "name": "Cometa Halley", "type": "Cometa periódico", "category": "Cometas", "radius": 0.09, "color": "0xd8e0f0", "parent": "sun", "orbitRadius": 400, "periodDays": 27500, "eccentricity": 0.75,'
replace_in_file('js/data/bodies.json', old_halley, new_halley, "Órbita de Halley")

old_encke = '"id": "encke", "name": "Cometa Encke", "type": "Cometa periódico", "category": "Cometas", "radius": 0.06, "color": "0xe0e8f0", "parent": "sun", "orbitRadius": 45, "periodDays": 1204, "eccentricity": 0.848,'
new_encke = '"id": "encke", "name": "Cometa Encke", "type": "Cometa periódico", "category": "Cometas", "radius": 0.06, "color": "0xe0e8f0", "parent": "sun", "orbitRadius": 120, "periodDays": 1204, "eccentricity": 0.6,'
replace_in_file('js/data/bodies.json', old_encke, new_encke, "Órbita de Encke")

# 3. Arreglar la dirección solar de la Tierra (CelestialBody.js)
old_earth_dir = """  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;

    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    const sunDir = this._tmpWorldPos.clone().negate().normalize();

    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
new_earth_dir = """  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;

    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    const sunDir = new THREE.Vector3(0, 0, 0).sub(this._tmpWorldPos).normalize();

    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
replace_in_file('js/celestial/CelestialBody.js', old_earth_dir, new_earth_dir, "Dirección solar de la Tierra")

# 4. Suavizar las nubes de la Tierra (shaders.js)
replace_in_file(
    'js/celestial/shaders.js',
    "gl_FragColor = vec4(col, a * 0.78);",
    "gl_FragColor = vec4(col, a * 0.45);",
    "Suavizar nubes"
)

# 5. Alejar la cámara inicial y ajustar distancias de vista (config.js)
replace_in_file(
    'js/config.js',
    "initialPosition: { x: 0, y: 900, z: 1500 },",
    "initialPosition: { x: 0, y: 1200, z: 2000 },",
    "Alejar cámara inicial"
)
replace_in_file(
    'js/config.js',
    "planet: 8,",
    "planet: 12,",
    "Ajustar vista de planetas"
)
replace_in_file(
    'js/config.js',
    "moon: 3,",
    "moon: 4,",
    "Ajustar vista de lunas"
)

print("\n🎉 Proceso finalizado. Ahora ejecuta los comandos de git.")
