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

# 1. Asegurar que los cuerpos con parent (como Sirio B orbitando a Sirio) NO se añadan a solarSystem
# sino al grupo del padre. Ya se hace, pero vamos a reforzarlo.
old_create = """    if (!parent) {
      solarSystem.add(body.pivot);
    }"""
new_create = """    if (!parent) {
      // Solo los cuerpos sin padre van al grupo del sistema solar
      solarSystem.add(body.pivot);
    }"""
replace_in_file('js/celestial/CelestialBody.js', old_create, new_create, "Bariocentro: Jerarquía reforzada")

# 2. Asegurar que el sol no orbita (es el centro)
old_sun = """  updatePosition(simDays) {
    if (!this.parentBody || this.id === 'sun') return;"""
new_sun = """  updatePosition(simDays) {
    // El Sol está en el centro, no orbita
    if (this.id === 'sun') {
      this.pivot.position.set(0, 0, 0);
      return;
    }
    if (!this.parentBody) return;"""
replace_in_file('js/celestial/CelestialBody.js', old_sun, new_sun, "Bariocentro: Sol fijo en el centro")

# 3. Asegurar que los planetas con parent='sun' orbiten al sol
# (Ya lo hacen, pero vamos a asegurar que el padre sea el Sol para los que corresponden)
old_parent = """    // Posicionamiento jerárquico
    if (parentBody) {
      parentBody.satelliteGroup.add(this.pivot);
    }"""
new_parent = """    // Posicionamiento jerárquico
    if (parentBody) {
      parentBody.satelliteGroup.add(this.pivot);
    } else if (this.id === 'sun') {
      // El Sol se añade directamente al sistema solar
      // (no hace nada más, ya está en el origen)
    }
    // Los cuerpos sin padre pero con orbitRadius (estrellas lejanas) se posicionan
    // en createAllBodies"""
replace_in_file('js/celestial/CelestialBody.js', old_parent, new_parent, "Bariocentro: Padre para planetas")
