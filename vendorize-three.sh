#!/usr/bin/env bash
set -euo pipefail

THREE_VERSION="0.160.0"
BASE="https://unpkg.com/three@${THREE_VERSION}"
JSM="${BASE}/examples/jsm"

echo "📦 Vendorizando Three.js v${THREE_VERSION}…"
echo ""

mkdir -p vendor/three/addons/controls
mkdir -p vendor/three/addons/postprocessing
mkdir -p vendor/three/addons/shaders

download() {
  local url="$1"
  local dest="$2"
  local tries=3
  local i=1

  while [ $i -le $tries ]; do
    if curl -fsSL --retry 2 --retry-delay 1 -o "$dest" "$url"; then
      if [ -s "$dest" ] && head -c 50 "$dest" | grep -qE '(import|export|//|/\*|"use strict")'; then
        echo "  ✓ $(basename "$dest")"
        return 0
      else
        echo "  ⚠ $(basename "$dest") descargado pero parece inválido (intento $i/$tries)"
      fi
    else
      echo "  ⚠ Fallo de red en $(basename "$dest") (intento $i/$tries)"
    fi
    i=$((i + 1))
    sleep 1
  done

  echo "  ✗ No se pudo descargar: $url"
  return 1
}

echo "→ Core"
download "${BASE}/build/three.module.js" "vendor/three/three.module.js"

echo "→ Controls"
download "${JSM}/controls/OrbitControls.js" "vendor/three/addons/controls/OrbitControls.js"

echo "→ Postprocessing"
download "${JSM}/postprocessing/Pass.js"                     "vendor/three/addons/postprocessing/Pass.js"
download "${JSM}/postprocessing/ShaderPass.js"               "vendor/three/addons/postprocessing/ShaderPass.js"
download "${JSM}/postprocessing/MaskPass.js"                 "vendor/three/addons/postprocessing/MaskPass.js"
download "${JSM}/postprocessing/EffectComposer.js"           "vendor/three/addons/postprocessing/EffectComposer.js"
download "${JSM}/postprocessing/RenderPass.js"               "vendor/three/addons/postprocessing/RenderPass.js"
download "${JSM}/postprocessing/UnrealBloomPass.js"          "vendor/three/addons/postprocessing/UnrealBloomPass.js"
download "${JSM}/postprocessing/OutputPass.js"               "vendor/three/addons/postprocessing/OutputPass.js"

echo "→ Shaders"
download "${JSM}/shaders/CopyShader.js"                      "vendor/three/addons/shaders/CopyShader.js"
download "${JSM}/shaders/LuminosityHighPassShader.js"        "vendor/three/addons/shaders/LuminosityHighPassShader.js"
download "${JSM}/shaders/OutputShader.js"                    "vendor/three/addons/shaders/OutputShader.js"

echo "→ Licencia"
download "${BASE}/LICENSE" "vendor/three/LICENSE"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 Verificación de archivos descargados:"
echo "═══════════════════════════════════════════════════════"

EXPECTED=(
  "vendor/three/three.module.js"
  "vendor/three/LICENSE"
  "vendor/three/addons/controls/OrbitControls.js"
  "vendor/three/addons/postprocessing/Pass.js"
  "vendor/three/addons/postprocessing/ShaderPass.js"
  "vendor/three/addons/postprocessing/MaskPass.js"
  "vendor/three/addons/postprocessing/EffectComposer.js"
  "vendor/three/addons/postprocessing/RenderPass.js"
  "vendor/three/addons/postprocessing/UnrealBloomPass.js"
  "vendor/three/addons/postprocessing/OutputPass.js"
  "vendor/three/addons/shaders/CopyShader.js"
  "vendor/three/addons/shaders/LuminosityHighPassShader.js"
  "vendor/three/addons/shaders/OutputShader.js"
)

MISSING=0
for f in "${EXPECTED[@]}"; do
  if [ -s "$f" ]; then
    size=$(du -h "$f" | cut -f1)
    echo "  ✓ $f ($size)"
  else
    echo "  ✗ FALTA: $f"
    MISSING=$((MISSING + 1))
  fi
done

echo ""
if [ $MISSING -eq 0 ]; then
  echo "✅ Three.js vendorizado correctamente (13 archivos)."
  echo ""
  echo "Próximos pasos:"
  echo "  1. git add vendor/"
  echo "  2. git commit -m 'chore(vendor): vendorize three.js r${THREE_VERSION}'"
  echo "  3. git push"
  echo ""
  echo "Para probar localmente en Codespaces:"
  echo "  python3 -m http.server 8080"
  echo "  (luego abre el puerto 8080 en la pestaña 'Ports')"
else
  echo "❌ Faltan ${MISSING} archivo(s). Revisa los errores arriba."
  exit 1
fi
