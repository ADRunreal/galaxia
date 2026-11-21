import re
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

# 1. Añadir efecto de auroras a la Tierra y Júpiter
old_earth_effects = """  _addEarthEffects() {
    const r = this.data.radius;
    const cloudGeo = new THREE.SphereGeometry(r * 1.008, LOW_POWER ? 32 : 64, LOW_POWER ? 24 : 48);
    this.cloudMat = createCloudMaterial(_textures.earthCloud);
    this.clouds = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.tiltGroup.add(this.clouds);

    const atmoGeo = new THREE.SphereGeometry(r * 1.04, LOW_POWER ? 32 : 64, LOW_POWER ? 24 : 48);
    this.atmoMat = createAtmosphereMaterial();
    this.atmosphere = new THREE.Mesh(atmoGeo, this.atmoMat);
    this.tiltGroup.add(this.atmosphere);
  }"""
new_earth_effects = """  _addEarthEffects() {
    const r = this.data.radius;
    const cloudGeo = new THREE.SphereGeometry(r * 1.008, LOW_POWER ? 32 : 64, LOW_POWER ? 24 : 48);
    this.cloudMat = createCloudMaterial(_textures.earthCloud);
    this.clouds = new THREE.Mesh(cloudGeo, this.cloudMat);
    this.tiltGroup.add(this.clouds);

    const atmoGeo = new THREE.SphereGeometry(r * 1.04, LOW_POWER ? 32 : 64, LOW_POWER ? 24 : 48);
    this.atmoMat = createAtmosphereMaterial();
    this.atmosphere = new THREE.Mesh(atmoGeo, this.atmoMat);
    this.tiltGroup.add(this.atmosphere);
    
    // Aurora boreal (anillo brillante en el polo norte)
    this._addAurora(r);
  }
  
  _addAurora(planetRadius) {
    const auroraGeo = new THREE.RingGeometry(planetRadius * 0.7, planetRadius * 0.95, 64, 1);
    const auroraMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.aurora = new THREE.Mesh(auroraGeo, auroraMat);
    this.aurora.rotation.x = Math.PI / 2;
    this.aurora.position.y = planetRadius * 0.85;
    this.tiltGroup.add(this.aurora);
  }"""
replace_in_file('js/celestial/CelestialBody.js', old_earth_effects, new_earth_effects, "Tierra: Aurora boreal")

# 2. Mejorar la estela de los cometas (siempre apuntando lejos del Sol)
old_comet = """  _addCometTail() {
    const r = this.data.radius;
    const geo = new THREE.ConeGeometry(r * 1.1, 1, 8, 1, true);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: parseColor(this.data.color),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.tail = new THREE.Mesh(geo, mat);
    this.pivot.add(this.tail);

    const c = parseColor(this.data.color);
    const tex = makeGlowTexture(
      'rgba(255,255,255,1)',
      `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.6)`,
      `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0)`
    );
    this.coma = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      color: parseColor(this.data.color),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    this.coma.scale.setScalar(r * 5);
    this.tiltGroup.add(this.coma);
  }"""
new_comet = """  _addCometTail() {
    const r = this.data.radius;
    // Cola de iones (azul, recta, apunta lejos del Sol)
    const ionGeo = new THREE.ConeGeometry(r * 0.8, 1, 8, 1, true);
    ionGeo.rotateX(Math.PI / 2);
    ionGeo.translate(0, 0, 0.5);
    const ionMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.ionTail = new THREE.Mesh(ionGeo, ionMat);
    this.pivot.add(this.ionTail);
    
    // Cola de polvo (blanca, curvada)
    const dustGeo = new THREE.ConeGeometry(r * 1.2, 1, 8, 1, true);
    dustGeo.rotateX(Math.PI / 2);
    dustGeo.translate(0, 0, 0.5);
    const dustMat = new THREE.MeshBasicMaterial({
      color: 0xffeecc,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.dustTail = new THREE.Mesh(dustGeo, dustMat);
    this.pivot.add(this.dustTail);

    // Coma (el halo brillante alrededor del núcleo)
    const c = parseColor(this.data.color);
    const tex = makeGlowTexture(
      'rgba(255,255,255,1)',
      `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.6)`,
      `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0)`
    );
    this.coma = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      color: parseColor(this.data.color),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    this.coma.scale.setScalar(r * 6);
    this.tiltGroup.add(this.coma);
  }"""
replace_in_file('js/celestial/CelestialBody.js', old_comet, new_comet, "Cometas: Cola iónica + polvo")

print("\n🎉 Nivel 3.3 aplicado.")
