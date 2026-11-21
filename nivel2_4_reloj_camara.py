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

# 1. Añadir el reloj astronómico al HTML (junto al control de tiempo)
old_html = """<div id="timeControl">
  <button id="btnPause" title="Pausar / Reanudar (Espacio)" aria-label="Pausar tiempo">⏸</button>
  <span>Velocidad</span>
  <input id="timeScale" type="range" min="0" max="10" step="0.05" value="1" aria-label="Velocidad del tiempo" />
  <span id="timeValue">1×</span>
</div>"""
new_html = """<div id="timeControl">
  <button id="btnPause" title="Pausar / Reanudar (Espacio)" aria-label="Pausar tiempo">⏸</button>
  <span>Velocidad</span>
  <input id="timeScale" type="range" min="0" max="10" step="0.05" value="1" aria-label="Velocidad del tiempo" />
  <span id="timeValue">1×</span>
  <div id="astroClock" style="margin-left: 12px; padding-left: 12px; border-left: 1px solid rgba(110,160,240,0.2); font-variant-numeric: tabular-nums; color: var(--accent); font-size: 10px; letter-spacing: 0.05em;">
    <span id="clockDate">2000-01-01</span> <span id="clockTime">12:00</span>
  </div>
</div>"""
replace_in_file('index.html', old_html, new_html, "HTML: Reloj astronómico")

# 2. Añadir el update del reloj en main.js
old_animate = """  // Ocultar hint
  if (!hintHidden && realTimeSeconds > 8) {"""
new_animate = """  // Reloj astronómico: convertir simTimeDays a fecha real
  const clockDate = document.getElementById('clockDate');
  const clockTime = document.getElementById('clockTime');
  if (clockDate && clockTime) {
    // La simulación empieza en J2000 = 2000-01-01 12:00 UTC
    const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const msPerDay = 86400000;
    const currentMs = J2000 + simTimeDays * msPerDay;
    const d = new Date(currentMs);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    clockDate.textContent = `${year}-${month}-${day}`;
    clockTime.textContent = `${hours}:${mins}`;
  }

  // Ocultar hint
  if (!hintHidden && realTimeSeconds > 8) {"""
replace_in_file('js/main.js', old_animate, new_animate, "Main: Update del reloj")

# 3. Mejorar la cámara: añadir inercia al orbitar (más damping)
replace_in_file('js/config.js', "dampingFactor: 0.065,", "dampingFactor: 0.04,", "Cámara: Más inercia (damping bajo)")

# 4. Añadir un botón de "reset tiempo" al HTML (opcional)
old_buttons = """<div id="zoomControls">
  <button id="btnTour" title="Tour guiado (T)" aria-label="Tour guiado">▶</button>"""
new_buttons = """<div id="zoomControls">
  <button id="btnTour" title="Tour guiado (T)" aria-label="Tour guiado">▶</button>
  <button id="btnResetTime" title="Resetear tiempo (R)" aria-label="Resetear tiempo">⟲</button>"""
replace_in_file('index.html', old_buttons, new_buttons, "HTML: Botón reset tiempo")

# 5. Conectar el botón reset en main.js
old_reset = """  document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);
  document.getElementById('btnHelp').addEventListener('click', showHelp);"""
new_reset = """  document.getElementById('btnFullscreen').addEventListener('click', toggleFullscreen);
  document.getElementById('btnHelp').addEventListener('click', showHelp);
  document.getElementById('btnResetTime')?.addEventListener('click', () => {
    simTimeDays = 0;
    showToast('Tiempo reseteado a J2000 (1 enero 2000)');
  });"""
replace_in_file('js/main.js', old_reset, new_reset, "Main: Botón reset tiempo")
