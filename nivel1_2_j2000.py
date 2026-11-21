from pathlib import Path
import json

# 1. Añadir los datos J2000 al JSON (solo para los 8 planetas y la Luna)
p_json = Path('js/data/bodies.json')
data = json.loads(p_json.read_text(encoding='utf-8'))

# Datos J2000 reales: { id: { omega: grados, Omega: grados, M0: grados } }
j2000 = {
    "mercury": {"omega": 29.124, "Omega": 48.331, "M0": 174.796},
    "venus":   {"omega": 54.884, "Omega": 76.680, "M0": 50.115},
    "earth":   {"omega": 288.06, "Omega": -11.26064, "M0": 357.529},
    "mars":    {"omega": 286.50, "Omega": 49.558, "M0": 19.373},
    "jupiter": {"omega": 273.867, "Omega": 100.464, "M0": 20.020},
    "saturn":  {"omega": 339.392, "Omega": 113.665, "M0": 317.020},
    "uranus":  {"omega": 96.999, "Omega": 74.006, "M0": 142.238},
    "neptune": {"omega": 276.336, "Omega": 131.784, "M0": 259.883},
    "pluto":   {"omega": 113.763, "Omega": 110.299, "M0": 14.882},
    "moon":    {"omega": 318.15, "Omega": 125.08, "M0": 135.27}
}

for b in data:
    if b['id'] in j2000:
        b['omegaDeg'] = j2000[b['id']]['omega']
        b['OmegaDeg'] = j2000[b['id']]['Omega']
        b['M0Deg'] = j2000[b['id']]['M0']

p_json.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"✅ bodies.json actualizado con datos J2000 reales")

# 2. Modificar CelestialBody.js para usar los valores J2000 si existen
def replace_in_file(path, old, new, desc):
    p = Path(path)
    if not p.exists(): return
    c = p.read_text(encoding='utf-8')
    if old not in c:
        print(f"⚠️ No se encontró: {desc}")
        return
    p.write_text(c.replace(old, new, 1), encoding='utf-8')
    print(f"✅ {desc}")

old_construct = """    this.omega = (hashString(data.id + 'w') % 6283) / 1000;
    this.Omega = (hashString(data.id + 'O') % 6283) / 1000;
    this.M0 = (hashString(data.id + 'M') % 6283) / 1000;"""
new_construct = """    // Usar datos J2000 reales si están disponibles, si no, hash aleatorio
    if (data.omegaDeg !== undefined) {
      this.omega = data.omegaDeg * DEG;
      this.Omega = data.OmegaDeg * DEG;
      this.M0 = data.M0Deg * DEG;
    } else {
      this.omega = (hashString(data.id + 'w') % 6283) / 1000;
      this.Omega = (hashString(data.id + 'O') % 6283) / 1000;
      this.M0 = (hashString(data.id + 'M') % 6283) / 1000;
    }"""
replace_in_file('js/celestial/CelestialBody.js', old_construct, new_construct, "Cuerpo: Usar datos J2000")
