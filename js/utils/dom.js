/* ═══════════════ HELPERS DOM ═══════════════ */
export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

export function setLoader(pct, txt) {
  const p = document.getElementById('loaderProgress');
  const s = document.getElementById('loaderStatus');
  if (p) p.style.width = pct + '%';
  if (s && txt) s.textContent = txt;
}

export function nextFrame() {
  return new Promise(r => requestAnimationFrame(() => r()));
}

export function isMobile() {
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 720;
}

export function isLowPower() {
  return isMobile() || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}
