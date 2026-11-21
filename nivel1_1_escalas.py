from pathlib import Path
import json

def replace_in_file(path, old, new, desc):
    p = Path(path)
    if not p.exists(): return
    c = p.read_text(encoding='utf-8')
    if old not in c:
        print(f"⚠️ No se encontró: {desc}")
        return
    p.write_text(c.replace(old, new, 1), encoding='utf-8')
    print(f"✅ {desc}")

# 1. Añadir el selector de escala en el HTML (dentro del panel de visualización)
old_html = """    <label class="toggle-row">Bloom (brillo) <input type="checkbox" id="tglBloom" checked /><span class="switch"></span></label>"""
new_html = """    <label class="toggle-row">Bloom (brillo) <input type="checkbox" id="tglBloom" checked /><span class="switch"></span></label>
    <label class="toggle-row" style="margin-top: 10px; border-top: 1px solid rgba(110,160,240,0.1); padding-top: 10px;">
      Escala Realista 
      <input type="checkbox" id="tglScale" /><span class="switch"></span>
    </label>
    <div style="font-size: 9px; color: var(--text-dim); padding: 0 8px 8px;">Actívalo para ver tamaños y distancias reales (los planetas serán casi invisibles).</div>"""
replace_in_file('index.html', old_html, new_html, "UI: Toggle de escala")

# 2. Añadir el factor de escala real en config.js
old_config = "export const VIEW_DISTANCE = {"
new_config = """// Factor para escala real. En modo real, los planetas son 1/10 de su tamaño visual
// y las distancias orbitales se multiplican para reflejar la realidad (aprox).
export const REAL_SCALE_FACTOR = 0.15; 
export const REAL_DISTANCE_FACTOR = 4.0;
export const VIEW_DISTANCE = {"""
replace_in_file('js/config.js', old_config, new_config, "Config: Factores de escala real")

# 3. Modificar CelestialBody para que guarde su tamaño original y aplique la escala
old_body_constructor = """    this.a = data.orbitRadius || 0;
    this.e = data.eccentricity || 0;
    this.i = (data.inclinationDeg || 0) * DEG;
    this.omega = (hashString(data.id + 'w') % 6283) / 1000;
    this.Omega = (hashString(data.id + 'O') % 6283) / 1000;
    this.M0 = (hashString(data.id + 'M') % 6283) / 1000;
    this.periodDays = data.periodDays || 365.25;
    this.rotationDays = data.rotationDays || 0;"""
new_body_constructor = """    this.a = data.orbitRadius || 0;
    this.e = data.eccentricity || 0;
    this.i = (data.inclinationDeg || 0) * DEG;
    this.omega = (hashString(data.id + 'w') % 6283) / 1000;
    this.Omega = (hashString(data.id + 'O') % 6283) / 1000;
    this.M0 = (hashString(data.id + 'M') % 6283) / 1000;
    this.periodDays = data.periodDays || 365.25;
    this.rotationDays = data.rotationDays || 0;
    
    // Guardar valores originales para el switch de escala
    this.originalRadius = data.radius;
    this.originalA = data.orbitRadius || 0;
    this.realScaleApplied = false;"""
replace_in_file('js/celestial/CelestialBody.js', old_body_constructor, new_body_constructor, "Cuerpo: Guardar valores originales")

# 4. Añadir método applyScaleMode a la clase CelestialBody
old_dispose = """  dispose() {"""
new_dispose = """  /**
   * Aplica modo de escala visual o real.
   * @param {boolean} isReal
   */
  applyScaleMode(isReal) {
    if (this.realScaleApplied === isReal) return;
    this.realScaleApplied = isReal;
    
    const { REAL_SCALE_FACTOR, REAL_DISTANCE_FACTOR } = window.__galaxiaConfig || { REAL_SCALE_FACTOR: 0.15, REAL_DISTANCE_FACTOR: 4.0 };

    if (isReal) {
      // Reducir tamaño de los planetas y aumentar distancias
      const newRadius = this.originalRadius * REAL_SCALE_FACTOR;
      this.mesh.scale.setScalar(REAL_SCALE_FACTOR);
      if (this.clouds) this.clouds.scale.setScalar(REAL_SCALE_FACTOR);
      if (this.atmosphere) this.atmosphere.scale.setScalar(REAL_SCALE_FACTOR);
      if (this.ring) this.ring.scale.setScalar(REAL_SCALE_FACTOR);
      this.a = this.originalA * REAL_DISTANCE_FACTOR;
    } else {
      // Restaurar escala visual
      this.mesh.scale.setScalar(1);
      if (this.clouds) this.clouds.scale.setScalar(1);
      if (this.atmosphere) this.atmosphere.scale.setScalar(1);
      if (this.ring) this.ring.scale.setScalar(1);
      this.a = this.originalA;
    }
  }

  dispose() {"""
replace_in_file('js/celestial/CelestialBody.js', old_dispose, new_dispose, "Cuerpo: Método applyScaleMode")

# 5. Conectar el toggle con el sistema en main.js
old_panel = """  initPanel({
    onLabelsToggle: (v) => setLabelsEnabled(v),"""
new_panel = """  // Exponer config al objeto global para que CelestialBody lo lea
  import('./config.js').then(cfg => { window.__galaxiaConfig = cfg; });
  
  initPanel({
    onLabelsToggle: (v) => setLabelsEnabled(v),"""
replace_in_file('js/main.js', old_panel, new_panel, "Main: Exponer config")

old_panel_listener = """    onQualityToggle: () => { /* placeholder para futuras mejoras */ }
  });"""
new_panel_listener = """    onQualityToggle: () => { /* placeholder para futuras mejoras */ },
    onScaleToggle: (isReal) => {
      console.log('[Galaxia] Cambiando escala a:', isReal ? 'REAL' : 'VISUAL');
      for (const id in bodies) {
        bodies[id].applyScaleMode(isReal);
      }
      // Forzar un re-render
      if (composer) composer.render();
    }
  });"""
replace_in_file('js/main.js', old_panel_listener, new_panel_listener, "Main: Listener del toggle de escala")
