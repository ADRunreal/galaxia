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

# 1. Activar sombras en el renderer (solo desktop, no LOW_POWER)
old_renderer = "renderer.shadowMap.enabled = false;"
new_renderer = "renderer.shadowMap.enabled = true;\n  renderer.shadowMap.type = THREE.PCFSoftShadowMap;"
replace_in_file('js/core/renderer.js', old_renderer, new_renderer, "Renderer: Activar sombras")

# 2. Configurar el PointLight del Sol para proyectar sombras
old_light = """  sunLight = new THREE.PointLight(
    0xfff2d8,
    LIGHT_CFG.sunIntensity,
    0,                 // distance = 0 → sin límite
    LIGHT_CFG.sunDecay // decay = 2 → físicamente correcto (1/r²)
  );
  sunLight.position.set(0, 0, 0);"""
new_light = """  sunLight = new THREE.PointLight(
    0xfff2d8,
    LIGHT_CFG.sunIntensity,
    0,
    LIGHT_CFG.sunDecay
  );
  sunLight.position.set(0, 0, 0);
  // Configurar sombras
  sunLight.castShadow = !LOW_POWER; // Desactivar en móvil
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.bias = -0.0005;"""
replace_in_file('js/core/scene.js', old_light, new_light, "Sol: Configurar sombras")

# 3. Hacer que Saturno proyecte y reciba sombras
old_saturn = """    const mat = new THREE.MeshStandardMaterial({
      map: _textures.saturnRingTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 1.0,
      metalness: 0,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    this.tiltGroup.add(ring);
    this.ring = ring;"""
new_saturn = """    const mat = new THREE.MeshStandardMaterial({
      map: _textures.saturnRingTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 1.0,
      metalness: 0,
      depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.receiveShadow = !LOW_POWER;
    this.tiltGroup.add(ring);
    this.ring = ring;
    // El mesh de Saturno proyecta sombra sobre el anillo
    this.mesh.castShadow = !LOW_POWER;
    this.mesh.receiveShadow = !LOW_POWER;"""
replace_in_file('js/celestial/CelestialBody.js', old_saturn, new_saturn, "Saturno: Sombras")
