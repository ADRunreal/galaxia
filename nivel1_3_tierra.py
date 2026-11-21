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

# 1. Reemplazar el fragment shader de la Tierra por uno con terminador suave
old_earth_frag = """export const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform vec3 uSunDir;   // en espacio mundo
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vec3 n = normalize(vNormalW);
    float ndl = dot(n, uSunDir);
    float day = smoothstep(-0.12, 0.28, ndl);
    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    float landMask = smoothstep(0.0, 0.30, dayCol.g - dayCol.b);
    vec3 nightCol = dayCol * 0.035;
    nightCol += vec3(1.0, 0.72, 0.32) * landMask * 0.18;
    vec3 litCol = dayCol * (0.08 + 0.92 * max(ndl, 0.0));
    vec3 col = mix(nightCol, litCol, day);
    float terminator = 1.0 - abs(day * 2.0 - 1.0);
    col += vec3(0.15, 0.35, 0.7) * terminator * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }
`;"""
new_earth_frag = """export const EARTH_FRAG = `
  uniform sampler2D dayMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vec3 n = normalize(vNormalW);
    // Cálculo suave del día/noche
    float ndl = dot(n, uSunDir);
    float day = smoothstep(-0.15, 0.25, ndl); // Terminador suave
    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    float landMask = smoothstep(0.0, 0.25, dayCol.g - dayCol.b);
    vec3 nightCol = dayCol * 0.02; // Noche casi negra
    // Luces de las ciudades en la cara nocturna
    nightCol += vec3(1.0, 0.65, 0.2) * landMask * 0.25;
    // Iluminación del día
    vec3 litCol = dayCol * (0.05 + 0.95 * max(ndl, 0.0));
    vec3 col = mix(nightCol, litCol, day);
    // Atmósfera azul en el terminador
    float terminator = 1.0 - abs(day * 2.0 - 1.0);
    col += vec3(0.1, 0.3, 0.7) * terminator * 0.15;
    gl_FragColor = vec4(col, 1.0);
  }
`;"""
replace_in_file('js/celestial/shaders.js', old_earth_frag, new_earth_frag, "Shader: Tierra corregida")

# 2. Suavizar las nubes (blending más sutil)
old_cloud_frag = """    vec3 col = vec3(1.0) * (0.06 + 0.94 * day);
    gl_FragColor = vec4(col, a * 0.78);"""
new_cloud_frag = """    vec3 col = vec3(1.0) * (0.06 + 0.94 * day);
    // Alpha más bajo y blending aditivo para que las nubes se vean como gas
    gl_FragColor = vec4(col, a * 0.35);"""
replace_in_file('js/celestial/shaders.js', old_cloud_frag, new_cloud_frag, "Shader: Nubes suaves")

# 3. Arreglar el updateEarthSunDir
old_dir = """  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;
    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    const sunDir = this._tmpWorldPos.clone().negate().normalize();
    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
new_dir = """  updateEarthSunDir() {
    if (!this.earthMat || !this.cloudMat || !this.atmoMat) return;
    this.tiltGroup.getWorldPosition(this._tmpWorldPos);
    // Vector desde la Tierra al Sol (que está en el origen)
    const sunDir = new THREE.Vector3(0, 0, 0).sub(this._tmpWorldPos).normalize();
    this.earthMat.uniforms.uSunDir.value.copy(sunDir);
    this.cloudMat.uniforms.uSunDir.value.copy(sunDir);
    this.atmoMat.uniforms.uSunDir.value.copy(sunDir);
  }"""
replace_in_file('js/celestial/CelestialBody.js', old_dir, new_dir, "Tierra: dirección solar corregida")
