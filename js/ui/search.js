/* ═══════════════════════════════════════════════════════════
 * search.js — Búsqueda y filtro del catálogo
 * ═══════════════════════════════════════════════════════════
 * Correcciones aplicadas:
 *  - P1/3.4: resaltado con <mark> en los términos coincidentes
 *  - P1/3.5: mensaje "sin resultados" con botón de reset de filtro
 *  - P2: normalización de categorías al comparar
 */
import { norm } from '../utils/math.js';
import { escapeHtml } from '../utils/dom.js';

let catalogEl = null;
let searchEl = null;
let filterEl = null;
let noResultsEl = null;
let btnResetFilter = null;

let categories = [];
let catalogGroups = {};

export function initSearch(onSelectBody) {
  catalogEl = document.getElementById('catalog');
  searchEl = document.getElementById('search');
  filterEl = document.getElementById('filter-select');
  noResultsEl = document.getElementById('noResults');
  btnResetFilter = document.getElementById('btnResetFilter');
  if (!catalogEl || !searchEl || !filterEl) return;

  // El resto lo hace main.js al construir el catálogo
  return {
    buildCatalog: (bodiesData) => buildCatalog(bodiesData, onSelectBody),
    applyFilters,
    resetFilter
  };
}

function buildCatalog(bodiesData, onSelectBody) {
  // Categorías únicas
  categories = [...new Set(bodiesData.map(b => b.category))];

  // Opciones del select
  // Mantener "all" al inicio
  for (const cat of categories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filterEl.appendChild(opt);
  }

  // Construir grupos
  catalogGroups = {};
  for (const cat of categories) {
    const group = document.createElement('div');
    group.className = 'cat-group';
    group.dataset.category = cat;
    const h3 = document.createElement('h3');
    h3.textContent = cat;
    group.appendChild(h3);
    catalogEl.appendChild(group);
    catalogGroups[cat] = group;

    const catBodies = bodiesData.filter(b => b.category === cat);
    for (const data of catBodies) {
      const btn = document.createElement('button');
      btn.className = 'cat-btn';
      btn.dataset.id = data.id;
      btn.dataset.name = norm(data.name);
      btn.dataset.type = norm(data.type);
      btn.dataset.rawName = data.name;
      btn.type = 'button';
      btn.setAttribute('role', 'listitem');

      const c = '#' + parseInt(data.color, 16).toString(16).padStart(6, '0');
      btn.innerHTML =
        `<span class="dot" style="color:${c};background:${c};"></span>` +
        `<span class="name">${escapeHtml(data.name)}</span>`;

      btn.addEventListener('click', () => onSelectBody(data.id));
      group.appendChild(btn);
    }
  }

  // Listeners
  searchEl.addEventListener('input', applyFilters);
  filterEl.addEventListener('change', applyFilters);

  if (btnResetFilter) {
    btnResetFilter.addEventListener('click', resetFilter);
  }
}

function applyFilters() {
  const q = norm(searchEl.value.trim());
  const cat = filterEl.value;
  let totalVisible = 0;

  for (const c of categories) {
    const group = catalogGroups[c];
    if (!group) continue;

    let groupVisible = 0;
    const buttons = group.querySelectorAll('.cat-btn');

    for (const btn of buttons) {
      const nameMatch = !q || btn.dataset.name.includes(q) || (btn.dataset.type || '').toLowerCase().includes(q);
      // P2: comparar categorías normalizadas
      const catMatch = cat === 'all' || norm(cat) === norm(c);

      const show = nameMatch && catMatch;
      btn.classList.toggle('hidden', !show);
      if (show) groupVisible++;

      // P1/3.4: resaltado con <mark>
      const nameSpan = btn.querySelector('.name');
      if (nameSpan) {
        const original = btn.dataset.rawName;
        if (q && nameMatch) {
          nameSpan.innerHTML = highlightMatch(original, q);
        } else {
          nameSpan.textContent = original;
        }
      }
    }

    group.classList.toggle('hidden', groupVisible === 0);
    totalVisible += groupVisible;
  }

  // P1/3.5: mensaje con botón de reset
  if (totalVisible === 0) {
    noResultsEl.classList.add('visible');
    if (btnResetFilter) {
      btnResetFilter.hidden = (cat === 'all' && q === '');
    }
  } else {
    noResultsEl.classList.remove('visible');
  }
}

function highlightMatch(text, query) {
  // Normalizar para encontrar posiciones
  const normalized = norm(text);
  const idx = normalized.indexOf(query);
  if (idx === -1) return escapeHtml(text);

  // Como norm() puede cambiar longitud (tildes → sin tilde, pero misma longitud),
  // podemos usar el mismo índice.
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return escapeHtml(before) + '<mark>' + escapeHtml(match) + '</mark>' + escapeHtml(after);
}

function resetFilter() {
  filterEl.value = 'all';
  searchEl.value = '';
  applyFilters();
}

export function setActiveCatalogItem(id) {
  if (!catalogEl) return;
  catalogEl.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.id === id);
  });
}
