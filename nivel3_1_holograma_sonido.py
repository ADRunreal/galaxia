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

# 1. Efecto de líneas de escaneo en el CSS
css_append = """
/* ═══════════════ HOLOGRAPHIC UI ═══════════════ */
body::after {
  content: '';
  position: fixed; inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0) 2px,
    rgba(91, 140, 255, 0.03) 3px,
    rgba(91, 140, 255, 0.03) 4px
  );
  animation: scanlines 8s linear infinite;
}

@keyframes scanlines {
  0% { background-position: 0 0; }
  100% { background-position: 0 100vh; }
}

/* Parpadeo sutil del panel */
#panel {
  animation: holoFlicker 12s infinite;
}

@keyframes holoFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.98; }
  52% { opacity: 0.94; }
  54% { opacity: 1; }
}

/* Brillo holográfico en botones */
.cat-btn:hover {
  box-shadow: inset 0 0 20px rgba(91, 140, 255, 0.2), 0 0 8px rgba(91, 140, 255, 0.3);
}

/* Aberración cromática sutil en los bordes */
body::before {
  content: '';
  position: fixed; inset: 0;
  z-index: 9998;
  pointer-events: none;
  box-shadow: inset 0 0 100px rgba(91, 140, 255, 0.05), inset 0 0 200px rgba(255, 100, 100, 0.02);
}
"""
append_to_file('css/styles.css', css_append, "CSS: Líneas de escaneo y holograma")

# 2. Añadir el botón de sonido al HTML
old_html = """  <button id="btnHelp" title="Mostrar ayuda" aria-label="Mostrar ayuda">?</button>
</div>"""
new_html = """  <button id="btnHelp" title="Mostrar ayuda" aria-label="Mostrar ayuda">?</button>
  <button id="btnAudio" title="Activar/Desactivar sonido (M)" aria-label="Sonido">🔇</button>
</div>"""
replace_in_file('index.html', old_html, new_html, "HTML: Botón de sonido")

# 3. Sistema de sonido ambiental generativo (Web Audio API)
audio_js = """
/* ═══════════════ AUDIO AMBIENTAL ═══════════════ */
let audioCtx = null;
let audioEnabled = false;
let ambientNodes = [];

export function toggleAmbientAudio() {
  audioEnabled = !audioEnabled;
  const btn = document.getElementById('btnAudio');
  if (btn) btn.textContent = audioEnabled ? '🔊' : '🔇';
  
  if (audioEnabled) {
    startAmbientAudio();
  } else {
    stopAmbientAudio();
  }
}

function startAmbientAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Drone grave (viento solar)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const filter1 = audioCtx.createBiquadFilter();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;
    filter1.type = 'lowpass';
    filter1.frequency.value = 200;
    gain1.gain.value = 0.03;
    osc1.connect(filter1).connect(gain1).connect(audioCtx.destination);
    osc1.start();
    
    // Segundo drone (más agudo)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 110;
    gain2.gain.value = 0.02;
    osc2.connect(gain2).connect(audioCtx.destination);
    osc2.start();
    
    // Modulación lenta (LFO) para que el sonido respire
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain).connect(gain1.gain);
    lfo.start();
    
    ambientNodes = [osc1, osc2, lfo];
    console.log('[Galaxia] 🎵 Audio ambiental activado');
  } catch (e) {
    console.error('[Galaxia] Error de audio:', e);
  }
}

function stopAmbientAudio() {
  ambientNodes.forEach(n => { try { n.stop(); } catch(e){} });
  ambientNodes = [];
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  console.log('[Galaxia] 🔇 Audio ambiental desactivado');
}
"""
append_to_file('js/ui/audio.js', audio_js, "Nuevo: js/ui/audio.js")

# 4. Conectar el botón de sonido en main.js
old_main_import = "import { initToasts, showToast } from './ui/toasts.js';"
new_main_import = "import { initToasts, showToast } from './ui/toasts.js';\nimport { toggleAmbientAudio } from './ui/audio.js';"
replace_in_file('js/main.js', old_main_import, new_main_import, "Main: Import audio")

old_btn = """document.getElementById('btnResetTime')?.addEventListener('click', () => {
    simTimeDays = 0;
    showToast('Tiempo reseteado a J2000 (1 enero 2000)');
  });"""
new_btn = """document.getElementById('btnResetTime')?.addEventListener('click', () => {
    simTimeDays = 0;
    showToast('Tiempo reseteado a J2000 (1 enero 2000)');
  });
  document.getElementById('btnAudio')?.addEventListener('click', toggleAmbientAudio);"""
replace_in_file('js/main.js', old_btn, new_btn, "Main: Listener audio")

# 5. Añadir atajo de teclado M para mutear
old_keyboard = """      case 'Escape':
        if (isTourActive()) stopTour();
        if (document.body.classList.contains('photo-mode')) togglePhotoMode();
        break;"""
new_keyboard = """      case 'Escape':
        if (isTourActive()) stopTour();
        if (document.body.classList.contains('photo-mode')) togglePhotoMode();
        break;
      case 'm': case 'M':
        toggleAmbientAudio();
        break;"""
replace_in_file('js/main.js', old_keyboard, new_keyboard, "Main: Atajo M para audio")
