/* ═══════════════════════════════════════════════════════════
 * panel.js — Controles del panel lateral (toggles de visualización)
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/1.10: toggles de labels llaman a setLabelsEnabled (oculta todas)
 *  - P2: toggle de calidad para LOW_POWER
 */
export function initPanel({
  onLabelsToggle,
  onOrbitsToggle,
  onBgStarsToggle,
  onNebulaeToggle,
  onBloomToggle,
  onQualityToggle,
  onConstellationsToggle
}) {
  const panelEl = document.getElementById('panel');
  const btnToggle = document.getElementById('btnTogglePanel');

  if (btnToggle && panelEl) {
    btnToggle.addEventListener('click', () => {
      panelEl.classList.toggle('collapsed');
    });
  }

  const tglLabels = document.getElementById('tglLabels');
  const tglOrbits = document.getElementById('tglOrbits');
  const tglBgStars = document.getElementById('tglBgStars');
  const tglNebulae = document.getElementById('tglNebulae');
  const tglBloom = document.getElementById('tglBloom');
  const tglQuality = document.getElementById('tglQuality');
  const tglConstellations = document.getElementById('tglConstellations');

  tglLabels?.addEventListener('change', e => onLabelsToggle(e.target.checked));
  tglOrbits?.addEventListener('change', e => onOrbitsToggle(e.target.checked));
  tglBgStars?.addEventListener('change', e => onBgStarsToggle(e.target.checked));
  tglNebulae?.addEventListener('change', e => onNebulaeToggle(e.target.checked));
  tglBloom?.addEventListener('change', e => onBloomToggle(e.target.checked));
  tglQuality?.addEventListener('change', e => onQualityToggle?.(e.target.checked));
  tglConstellations?.addEventListener('change', e => onConstellationsToggle?.(e.target.checked));

  return {
    setBloomChecked: (v) => { if (tglBloom) tglBloom.checked = v; }
  };
}
