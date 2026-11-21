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

# 1. Arreglar la inmersión del "Tour Guiado" (que se detenga correctamente)
replace_in_file('js/ui/tour.js', "if (index >= TOUR_BODIES.length) {\n    stopTour();\n    return;\n  }", "if (index >= TOUR_BODIES.length) {\n    stopTour();\n    // Hacer que el tour sea infinito si se desea, o detenerse. Lo mantenemos detenido.\n    return;\n  }", "Parada del tour")

# 2. Arreglar el modo Foto para que muestre el nombre del cuerpo y la marca de agua
replace_in_file('js/main.js', "function togglePhotoMode() {\n  const isPhoto = document.body.classList.toggle('photo-mode');\n  const wm = document.getElementById('photoBodyName');\n  if (isPhoto) {\n    const id = getSelectedId();\n    wm.textContent = id && bodies[id] ? bodies[id].data.name : '';\n  }\n}", "function togglePhotoMode() {\n  const isPhoto = document.body.classList.toggle('photo-mode');\n  const wm = document.getElementById('photoBodyName');\n  if (isPhoto) {\n    const id = getSelectedId();\n    wm.textContent = id && bodies[id] ? bodies[id].data.name : '';\n    // Ocultar el loader por si acaso\n    document.getElementById('loader')?.classList.add('hide');\n  } else {\n    // Al salir del modo foto, asegurarse de que el cuerpo seleccionado siga resaltado\n    setSelectedLabel(getSelectedId());\n  }\n}", "Modo Foto mejorado")

# 3. Arreglar el Deep Link: Si la URL tiene 'body', ir a ese cuerpo, y si tiene 't', fijar el tiempo
replace_in_file('js/main.js', "if (cam && target) {\n    const [cx, cy, cz] = cam.split(',').map(Number);\n    const [tx, ty, tz] = target.split(',').map(Number);\n    if ([cx, cy, cz, tx, ty, tz].every(isFinite)) {\n      camera.position.set(cx, cy, cz);\n      controls.target.set(tx, ty, tz);\n    }\n  } else if (deepBody && bodies[deepBody]) {\n    setTimeout(() => flyToBody(deepBody), 800);\n  }", "if (cam && target) {\n    const [cx, cy, cz] = cam.split(',').map(Number);\n    const [tx, ty, tz] = target.split(',').map(Number);\n    if ([cx, cy, cz, tx, ty, tz].every(isFinite)) {\n      camera.position.set(cx, cy, cz);\n      controls.target.set(tx, ty, tz);\n    }\n  } else if (deepBody && bodies[deepBody]) {\n    setTimeout(() => flyToBody(deepBody), 800);\n  } else if (!deepBody) {\n    // Si no hay deep body, ir a la vista global\n    goHome();\n  }", "Deep Link y vista global")

# 4. Asegurar que el Tour se detiene al presionar Esc
replace_in_file('js/main.js', "case 'Escape':\n        if (isTourActive()) stopTour();\n        if (document.body.classList.contains('photo-mode')) togglePhotoMode();\n        break;", "case 'Escape':\n        if (isTourActive()) stopTour();\n        if (document.body.classList.contains('photo-mode')) togglePhotoMode();\n        break;\n      case 'r': case 'R':\n        // Añadir atajo para resetear el tiempo\n        simTimeDays = 0;\n        break;", "Atajo de teclado R (reset tiempo)")

# 5. Hacer que el buscador filtre también en los tags (tipo)
replace_in_file('js/ui/search.js', "const nameMatch = !q || btn.dataset.name.includes(q);", "const nameMatch = !q || btn.dataset.name.includes(q) || (btn.dataset.type || '').toLowerCase().includes(q);", "Búsqueda por tipo")
replace_in_file('js/ui/search.js', "btn.dataset.name = norm(data.name);", "btn.dataset.name = norm(data.name);\n      btn.dataset.type = norm(data.type);", "Guardar tipo en dataset")
