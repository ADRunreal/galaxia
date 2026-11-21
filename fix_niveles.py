import re
import json
from pathlib import Path

def insert_after(path, marker, new_code, desc):
    p = Path(path)
    if not p.exists(): return
    c = p.read_text(encoding='utf-8')
    if new_code.strip() in c:
        print(f"✅ Ya existía: {desc}")
        return
    if marker not in c:
        print(f"❌ No se encontró el ancla para: {desc} en {path}")
        return
    c = c.replace(marker, marker + "\n" + new_code, 1)
    p.write_text(c, encoding='utf-8')
    print(f"✅ Inyectado: {desc}")

def replace_regex(path, pattern, replacement, desc):
    p = Path(path)
    if not p.exists(): return
    c = p.read_text(encoding='utf-8')
    new_c = re.sub(pattern, replacement, c, count=1)
    if c == new_c:
        print(f"⚠️ No se pudo reemplazar: {desc}")
    else:
        p.write_text(new_c, encoding='utf-8')
        print(f"✅ Reemplazado: {desc}")

# ─── 1. CONECTAR EL TOGGLE DE ESCALA EN MAIN.JS ───
# Buscamos el bloque initPanel y añadimos el listener de escala
main_content = Path('js/main.js').read_text(encoding='utf-8')
if 'onScaleToggle' not in main_content:
    # Buscar el cierre del initPanel
    panel_match = re.search(r'(initPanel\(\{.*?\n\s*\}\);)', main_content, re.DOTALL)
    if panel_match:
        old_block = panel_match.group(1)
        new_block = old_block.replace('});', ''',
    onScaleToggle: (isReal) => {
      import('./config.js').then(cfg => {
        window.__galaxiaConfig = cfg;
        for (const id in bodies) {
          bodies[id].applyScaleMode(isReal);
        }
        if (composer) composer.render();
        console.log('[Galaxia] Escala cambiada a:', isReal ? 'REAL' : 'VISUAL');
      });
    }
  });''')
        main_content = main_content.replace(old_block, new_block)
        Path('js/main.js').write_text(main_content, encoding='utf-8')
        print("✅ Conectado: Toggle de escala en main.js")
    else:
        print("❌ No se encontró el bloque initPanel")
else:
    print("✅ El toggle de escala ya estaba conectado")

# ─── 2. LLAMAR A LA NUBE DE OORT EN MAIN.JS ───
# Buscamos donde se llama a buildKuiperBelt y añadimos buildOortCloud después
main_content = Path('js/main.js').read_text(encoding='utf-8')
if 'buildOortCloud(scene)' not in main_content:
    main_content = main_content.replace(
        "buildKuiperBelt(scene);",
        "buildKuiperBelt(scene);\n  buildOortCloud(scene);\n  console.log('[Galaxia] ✅ Nube de Oort generada');",
        1
    )
    Path('js/main.js').write_text(main_content, encoding='utf-8')
    print("✅ Conectado: Nube de Oort en main.js")
else:
    print("✅ La Nube de Oort ya estaba conectada")

# ─── 3. CONECTAR EL BOTÓN DE RESET DE TIEMPO ───
main_content = Path('js/main.js').read_text(encoding='utf-8')
if 'btnResetTime' in main_content and 'simTimeDays = 0' not in main_content:
    anchor = "document.getElementById('btnHelp').addEventListener('click', showHelp);"
    if anchor in main_content:
        main_content = main_content.replace(anchor, anchor + """
  document.getElementById('btnResetTime')?.addEventListener('click', () => {
    simTimeDays = 0;
    showToast('Tiempo reseteado a J2000 (1 enero 2000)');
  });""")
        Path('js/main.js').write_text(main_content, encoding='utf-8')
        print("✅ Conectado: Botón reset tiempo en main.js")
    else:
        print("⚠️ No se encontró el ancla para reset tiempo")
else:
    print("✅ El reset de tiempo ya estaba conectado")

# ─── 4. ARREGLAR EL SHADER DE LA TIERRA (TERMINADOR Y NUBES) ───
# Forzar el reemplazo del shader de la Tierra y las nubes
shaders_path = Path('js/celestial/shaders.js')
c = shaders_path.read_text(encoding='utf-8')

# Reemplazar el fragment shader de la Tierra por completo
earth_frag_pattern = r'export const EARTH_FRAG = `.*?`;'
new_earth_frag = """export const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vec3 n = normalize(vNormalW);
    float ndl = dot(n, uSunDir);
    float day = smoothstep(-0.15, 0.25, ndl);
    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    float landMask = smoothstep(0.0, 0.25, dayCol.g - dayCol.b);
    vec3 nightCol = dayCol * 0.02;
    nightCol += vec3(1.0, 0.65, 0.2) * landMask * 0.25;
    vec3 litCol = dayCol * (0.05 + 0.95 * max(ndl, 0.0));
    vec3 col = mix(nightCol, litCol, day);
    float terminator = 1.0 - abs(day * 2.0 - 1.0);
    col += vec3(0.1, 0.3, 0.7) * terminator * 0.15;
    gl_FragColor = vec4(col, 1.0);
  }
`;"""
c = re.sub(earth_frag_pattern, new_earth_frag, c, flags=re.DOTALL)
print("✅ Shader: Tierra corregida")

# Reemplazar el fragment shader de las nubes
cloud_frag_pattern = r'export const CLOUD_FRAG = `.*?`;'
new_cloud_frag = """export const CLOUD_FRAG = `
  uniform sampler2D cloudMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    float a = texture2D(cloudMap, vUv).r;
    float ndl = dot(normalize(vNormalW), uSunDir);
    float day = smoothstep(-0.15, 0.25, ndl);
    vec3 col = vec3(1.0) * (0.06 + 0.94 * day);
    gl_FragColor = vec4(col, a * 0.35);
  }
`;"""
c = re.sub(cloud_frag_pattern, new_cloud_frag, c, flags=re.DOTALL)
print("✅ Shader: Nubes suaves")

shaders_path.write_text(c, encoding='utf-8')

# ─── 5. ARREGLAR LA DIRECCIÓN SOLAR DE LA TIERRA EN CELESTIALBODY.JS ───
body_path = Path('js/celestial/CelestialBody.js')
c = body_path.read_text(encoding='utf-8')
earth_dir_pattern = r'updateEarthSunDir\(\) \{.*?\n  \}'
new_earth_dir = """updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;
    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    const sunDir = new THREE.Vector3(0, 0, 0).sub(this._tmpWorldPos).normalize();
    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
c = re.sub(earth_dir_pattern, new_earth_dir, c, count=1, flags=re.DOTALL)
body_path.write_text(c, encoding='utf-8')
print("✅ Tierra: dirección solar corregida")

print("\n🎉 Reparación completada. Ejecuta ahora:")
print("git add .")
print("git commit -m \"fix: reparar conexiones de UI, Shaders y Nube de Oort\"")
print("git push origin main")
