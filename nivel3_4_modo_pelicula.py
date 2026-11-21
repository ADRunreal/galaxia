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

# 1. Botón de "Modo Película" al HTML
old_html = """  <button id="btnAudio" title="Activar/Desactivar sonido (M)" aria-label="Sonido">🔇</button>
</div>"""
new_html = """  <button id="btnAudio" title="Activar/Desactivar sonido (M)" aria-label="Sonido">🔇</button>
  <button id="btnCinema" title="Modo Película (C)" aria-label="Modo Película">🎬</button>
</div>"""
replace_in_file('index.html', old_html, new_html, "HTML: Botón modo película")

# 2. Lógica del modo película en main.js
old_keyboard = """      case 'm': case 'M':
        toggleAmbientAudio();
        break;"""
new_keyboard = """      case 'm': case 'M':
        toggleAmbientAudio();
        break;
      case 'c': case 'C':
        toggleCinemaMode();
        break;"""
replace_in_file('js/main.js', old_keyboard, new_keyboard, "Main: Atajo C modo película")

# 3. Añadir la función toggleCinemaMode
old_toggle_photo = """function togglePhotoMode() {"""
new_toggle_photo = """let cinemaInterval = null;
let cinemaIndex = 0;
const CINEMA_TOUR = ['sun', 'earth', 'jupiter', 'saturn', 'orion', 'andromeda', 'sgra', 'betelgeuse'];

function toggleCinemaMode() {
  const btn = document.getElementById('btnCinema');
  if (cinemaInterval) {
    clearInterval(cinemaInterval);
    cinemaInterval = null;
    if (btn) btn.classList.remove('active');
    showToast('Modo película detenido');
  } else {
    if (btn) btn.classList.add('active');
    showToast('🎬 Modo película iniciado. La cámara viajará automáticamente.');
    cinemaIndex = 0;
    flyToBody(CINEMA_TOUR[0]);
    cinemaInterval = setInterval(() => {
      cinemaIndex = (cinemaIndex + 1) % CINEMA_TOUR.length;
      flyToBody(CINEMA_TOUR[cinemaIndex]);
    }, 8000);
  }
}

function togglePhotoMode() {"""
replace_in_file('js/main.js', old_toggle_photo, new_toggle_photo, "Main: Función modo película")

# 4. Conectar el botón
old_btn = """  document.getElementById('btnAudio')?.addEventListener('click', toggleAmbientAudio);"""
new_btn = """  document.getElementById('btnAudio')?.addEventListener('click', toggleAmbientAudio);
  document.getElementById('btnCinema')?.addEventListener('click', toggleCinemaMode);"""
replace_in_file('js/main.js', old_btn, new_btn, "Main: Listener modo película")

# 5. Añadir estilo al botón activo
css_append = """
#btnCinema.active {
  background: rgba(255, 100, 100, 0.35) !important;
  border-color: rgba(255, 100, 100, 0.55) !important;
  animation: cinemaPulse 2s infinite;
}

@keyframes cinemaPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 100, 100, 0.4); }
  50% { box-shadow: 0 0 25px rgba(255, 100, 100, 0.8); }
}
"""
append_to_file('css/styles.css', css_append, "CSS: Animación modo película")
