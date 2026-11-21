import json
from pathlib import Path

p_json = Path('js/data/bodies.json')
data = json.loads(p_json.read_text(encoding='utf-8'))

# Catálogo de estrellas reales (las más brillantes y cercanas)
nuevas_estrellas = [
    {"id": "alpha_centauri", "name": "Alfa Centauri A", "type": "Estrella G2V", "category": "Estrellas", "radius": 4.5, "color": "0xfff4e6", "parent": None, "orbitRadius": 1400, "rotationDays": 22, "diameter": "1.700.000 km", "distance": "4,37 años luz", "orbPeriod": "—", "rotPeriod": "22 días", "desc": "La estrella más cercana al Sol. Sistema triple con Alfa Centauri B y Próxima.", "kind": "star"},
    {"id": "alpha_centauri_b", "name": "Alfa Centauri B", "type": "Estrella K1V", "category": "Estrellas", "radius": 3.8, "color": "0xffcc88", "parent": "alpha_centauri", "orbitRadius": 15, "periodDays": 29200, "eccentricity": 0.52, "inclinationDeg": 79.2, "rotationDays": 41, "diameter": "1.200.000 km", "distance": "4,37 años luz", "orbPeriod": "79,9 años", "rotPeriod": "41 días", "desc": "La compañera naranja de Alfa Centauri A.", "kind": "star"},
    {"id": "barnard", "name": "Estrella de Barnard", "type": "Enana roja M4V", "category": "Estrellas", "radius": 1.8, "color": "0xff6644", "parent": None, "orbitRadius": 1100, "rotationDays": 130, "diameter": "200.000 km", "distance": "5,96 años luz", "orbPeriod": "—", "rotPeriod": "130 días", "desc": "La cuarta estrella más cercana al Sol. Se mueve muy rápido por el cielo.", "kind": "star"},
    {"id": "wolf359", "name": "Wolf 359", "type": "Enana roja M6V", "category": "Estrellas", "radius": 1.2, "color": "0xff5533", "parent": None, "orbitRadius": 1200, "rotationDays": 20, "diameter": "160.000 km", "distance": "7,86 años luz", "orbPeriod": "—", "rotPeriod": "20 días", "desc": "Una de las estrellas más débiles y cercanas. Famosa por Star Trek.", "kind": "star"},
    {"id": "lalande21185", "name": "Lalande 21185", "type": "Enana roja M2V", "category": "Estrellas", "radius": 2.0, "color": "0xff7744", "parent": None, "orbitRadius": 1150, "rotationDays": 56, "diameter": "400.000 km", "distance": "8,31 años luz", "orbPeriod": "—", "rotPeriod": "56 días", "desc": "Una enana roja cercana con posibles planetas.", "kind": "star"},
    {"id": "ross154", "name": "Ross 154", "type": "Enana roja M3.5V", "category": "Estrellas", "radius": 1.5, "color": "0xff6644", "parent": None, "orbitRadius": 1250, "rotationDays": 2.5, "diameter": "240.000 km", "distance": "9,69 años luz", "orbPeriod": "—", "rotPeriod": "2,5 días", "desc": "Una enana roja con fulguraciones intensas.", "kind": "star"},
    {"id": "ross248", "name": "Ross 248", "type": "Enana roja M5.5V", "category": "Estrellas", "radius": 1.0, "color": "0xff5533", "parent": None, "orbitRadius": 1300, "rotationDays": 100, "diameter": "130.000 km", "distance": "10,3 años luz", "orbPeriod": "—", "rotPeriod": "100 días", "desc": "Una enana roja que pasará cerca del Sol en 36.000 años.", "kind": "star"},
    {"id": "epsilon_eridani", "name": "Épsilon Eridani", "type": "Estrella K2V", "category": "Estrellas", "radius": 3.5, "color": "0xffcc88", "parent": None, "orbitRadius": 1350, "rotationDays": 11, "diameter": "1.100.000 km", "distance": "10,5 años luz", "orbPeriod": "—", "rotPeriod": "11 días", "desc": "Una estrella joven con un disco de escombros y un planeta confirmado.", "kind": "star"},
    {"id": "lacaille9352", "name": "Lacaille 9352", "type": "Enana roja M0.5V", "category": "Estrellas", "radius": 2.2, "color": "0xff8844", "parent": None, "orbitRadius": 1400, "rotationDays": 44, "diameter": "480.000 km", "distance": "10,7 años luz", "orbPeriod": "—", "rotPeriod": "44 días", "desc": "Una enana roja con dos planetas conocidos.", "kind": "star"},
    {"id": "ross128", "name": "Ross 128", "type": "Enana roja M4V", "category": "Estrellas", "radius": 1.3, "color": "0xff6644", "parent": None, "orbitRadius": 1450, "rotationDays": 165, "diameter": "180.000 km", "distance": "11,0 años luz", "orbPeriod": "—", "rotPeriod": "165 días", "desc": "Una enana roja con un planeta del tamaño de la Tierra.", "kind": "star"},
    {"id": "procyon", "name": "Procyon", "type": "Estrella F5IV", "category": "Estrellas", "radius": 5.5, "color": "0xfff4e6", "parent": None, "orbitRadius": 1500, "rotationDays": 23, "diameter": "2.000.000 km", "distance": "11,4 años luz", "orbPeriod": "—", "rotPeriod": "23 días", "desc": "La estrella más brillante de Canis Minor.", "kind": "star"},
    {"id": "61cygni", "name": "61 Cygni", "type": "Enana naranja K5V", "category": "Estrellas", "radius": 3.0, "color": "0xffcc88", "parent": None, "orbitRadius": 1550, "rotationDays": 35, "diameter": "900.000 km", "distance": "11,4 años luz", "orbPeriod": "—", "rotPeriod": "35 días", "desc": "La primera estrella cuya distancia fue medida con paralaje.", "kind": "star"},
    {"id": "tau_ceti", "name": "Tau Ceti", "type": "Estrella G8V", "category": "Estrellas", "radius": 4.2, "color": "0xfff4d6", "parent": None, "orbitRadius": 1600, "rotationDays": 34, "diameter": "1.500.000 km", "distance": "11,9 años luz", "orbPeriod": "—", "rotPeriod": "34 días", "desc": "Una estrella similar al Sol con un sistema planetario.", "kind": "star"},
    {"id": "luyten7268", "name": "Luyten 726-8", "type": "Enana roja M5.5V", "category": "Estrellas", "radius": 1.0, "color": "0xff5533", "parent": None, "orbitRadius": 1650, "rotationDays": 5, "diameter": "130.000 km", "distance": "8,7 años luz", "orbPeriod": "—", "rotPeriod": "5 días", "desc": "Un sistema binario de enanas rojas.", "kind": "star"},
    {"id": "teegardens", "name": "Estrella de Teegarden", "type": "Enana roja M7V", "category": "Estrellas", "radius": 0.9, "color": "0xff5533", "parent": None, "orbitRadius": 1700, "rotationDays": 180, "diameter": "120.000 km", "distance": "12,5 años luz", "orbPeriod": "—", "rotPeriod": "180 días", "desc": "Una enana roja ultrafría con dos planetas en zona habitable.", "kind": "star"}
]

# Insertar sin duplicar
existing_ids = {b['id'] for b in data}
for estrella in nuevas_estrellas:
    if estrella['id'] not in existing_ids:
        data.append(estrella)

p_json.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"✅ Catálogo estelar actualizado. Total de cuerpos: {len(data)}")
