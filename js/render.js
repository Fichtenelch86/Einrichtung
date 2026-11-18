'use strict';

/* ============================================================
   Zustand, Undo/Redo und Rendering
   ============================================================ */

function freshState() {
  return {
    version: 1,
    planImage: null,      // { dataUrl, w, h }
    planOpacity: 0.55,
    pxPerMeter: null,
    rooms: [],            // { id, name, points:[{x,y}], wallColor, floor }
    items: [],            // { id, type, x, y, rotation }
    nextId: 1,
  };
}
let state = freshState();
let selection = { kind: null, id: null }; // kind: 'room' | 'item'
let view = { x: 60, y: 60, k: 1 };
let mode = 'select';
let drawing = null;    // { points: [] } beim Raumzeichnen
let scalePts = null;   // { p1, p2 }
let drag = null;       // aktive Pointer-Aktion
let newDrag = null;    // Drag aus dem Katalog
let history = [];
let hIndex = -1;

const ppm = () => state.pxPerMeter || DEFAULT_PPM;
const snap = v => (state.pxPerMeter ? Math.round(v / (0.05 * ppm())) * 0.05 * ppm() : v);

const scene = $('scene');
const world = $('world');
const layerPlan = $('layer-plan');
const layerRooms = $('layer-rooms');
const layerItems = $('layer-items');
const layerOverlay = $('layer-overlay');
const gridBg = $('grid-bg');
const defs = $('defs');

// ---------- Undo/Redo ----------
function snapshot() { return JSON.stringify(state); }
function pushHistory() {
  history = history.slice(0, hIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  hIndex = history.length - 1;
  updateHistoryButtons();
}
function applySnapshot(s) {
  const parsed = JSON.parse(s);
  state = Object.assign(freshState(), parsed);
  if (!Array.isArray(state.rooms)) state.rooms = [];
  if (!Array.isArray(state.items)) state.items = [];
  if (typeof state.nextId !== 'number') state.nextId = 1;
  if (selection.kind === 'room' && !state.rooms.some(r => r.id === selection.id)) selection = { kind: null, id: null };
  if (selection.kind === 'item' && !state.items.some(i => i.id === selection.id)) selection = { kind: null, id: null };
  renderAll();
}
function undo() { if (hIndex > 0) { hIndex--; applySnapshot(history[hIndex]); updateHistoryButtons(); } }
function redo() { if (hIndex < history.length - 1) { hIndex++; applySnapshot(history[hIndex]); updateHistoryButtons(); } }
function updateHistoryButtons() {
  $('btn-undo').disabled = hIndex <= 0;
  $('btn-redo').disabled = hIndex >= history.length - 1;
}
function armHistory(inp) {
  const arm = () => { if (!inp._armed) { pushHistory(); inp._armed = true; } };
  inp.addEventListener('pointerdown', arm);
  inp.addEventListener('focus', arm);
  inp.addEventListener('blur', () => { inp._armed = false; });
}

// ---------- Toast ----------
let toastTimer = null;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---------- Rendern ----------
function renderAll() {
  buildDefs();
  renderPlan();
  renderRooms();
  renderItems();
  renderOverlay();
  renderRoomList();
  renderSelectionProps();
  updateScaleInfo();
  updateStatus();
  applyView();
  scheduleAutosave();
}

function buildDefs() {
  defs.textContent = '';
  const u = ppm();
  for (const f of Object.values(FLOORS)) defs.appendChild(f.build(u));
  const grid = svgEl('pattern', { id: 'grid', patternUnits: 'userSpaceOnUse', width: u, height: u });
  grid.appendChild(svgEl('path', { d: `M ${u} 0 H 0 V ${u}`, fill: 'none', stroke: 'rgba(255,255,255,0.05)', 'stroke-width': 1 }));
  defs.appendChild(grid);
  const filt = svgEl('filter', { id: 'ishadow', x: '-30%', y: '-30%', width: '160%', height: '160%' });
  filt.appendChild(svgEl('feDropShadow', { dx: 0, dy: 2, stdDeviation: 3, 'flood-opacity': 0.35 }));
  defs.appendChild(filt);
  gridBg.setAttribute('fill', state.pxPerMeter ? 'url(#grid)' : 'none');
}

function renderPlan() {
  layerPlan.textContent = '';
  const has = !!state.planImage;
  $('plan-props').hidden = !has;
  if (!has) return;
  const img = svgEl('image', { x: 0, y: 0, width: state.planImage.w, height: state.planImage.h, opacity: state.planOpacity, preserveAspectRatio: 'none' });
  img.setAttribute('href', state.planImage.dataUrl);
  img.setAttributeNS(XLINKNS, 'xlink:href', state.planImage.dataUrl);
  layerPlan.appendChild(img);
}

function renderRooms() {
  layerRooms.textContent = '';
  const u = ppm();
  const wallW = Math.max(3, 0.12 * u);
  for (const room of state.rooms) {
    const pts = room.points.map(p => `${p.x},${p.y}`).join(' ');
    const g = svgEl('g', { 'data-room': room.id });
    g.appendChild(svgEl('polygon', { points: pts, fill: `url(#floor-${room.floor})` }));
    g.appendChild(svgEl('polygon', { points: pts, fill: room.wallColor, opacity: 0.13 }));
    g.appendChild(svgEl('polygon', { points: pts, fill: 'none', stroke: shade(room.wallColor, -0.45), 'stroke-width': wallW, 'stroke-linejoin': 'round' }));
    if (selection.kind === 'room' && selection.id === room.id) {
      g.appendChild(svgEl('polygon', { points: pts, class: 'sel-outline' }));
    }
    const c = centroid(room.points);
    const area = state.pxPerMeter ? (polygonArea(room.points) / (u * u)).toFixed(1) + ' m²' : '';
    const t = svgEl('text', { x: c.x, y: c.y - (area ? 7 : 0), class: 'room-label' });
    t.textContent = room.name;
    g.appendChild(t);
    if (area) {
      const t2 = svgEl('text', { x: c.x, y: c.y + 12, class: 'room-label', 'font-size': '11' });
      t2.textContent = area;
      g.appendChild(t2);
    }
    layerRooms.appendChild(g);
  }
}

function renderItems() {
  layerItems.textContent = '';
  const u = ppm();
  for (const item of state.items) {
    const def = CATALOG_BY_TYPE[item.type];
    if (!def) continue;
    const g = svgEl('g', { transform: `translate(${item.x} ${item.y}) rotate(${item.rotation})`, 'data-item': item.id });
    const inner = svgEl('g', { filter: 'url(#ishadow)' });
    def.draw(inner, u);
    g.appendChild(inner);
    if (selection.kind === 'item' && selection.id === item.id) {
      g.appendChild(svgEl('rect', {
        x: -def.w * u / 2 - 5, y: -def.h * u / 2 - 5,
        width: def.w * u + 10, height: def.h * u + 10,
        rx: 4, class: 'sel-outline',
      }));
    }
    layerItems.appendChild(g);
    if (selection.kind === 'item' && selection.id === item.id) {
      const t = svgEl('text', { x: item.x, y: item.y + def.h * u / 2 + 20, class: 'item-label' });
      t.textContent = `${def.name} · ${def.w}×${def.h} m`;
      layerItems.appendChild(t);
    }
  }
}

function rotHandlePos(item) {
  const def = CATALOG_BY_TYPE[item.type];
  const u = ppm();
  const d = def.h * u / 2 + 28;
  const rad = (item.rotation * Math.PI) / 180;
  return { x: item.x + d * Math.sin(rad), y: item.y - d * Math.cos(rad) };
}

function renderOverlay() {
  layerOverlay.textContent = '';
  if (drawing && drawing.points.length > 0) {
    const pts = drawing.points.map(p => `${p.x},${p.y}`).join(' ');
    layerOverlay.appendChild(svgEl('polygon', { points: pts, class: 'overlay-poly' }));
    for (const p of drawing.points) layerOverlay.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 4.5 / view.k, class: 'overlay-point' }));
  }
  if (scalePts) {
    if (scalePts.p1) layerOverlay.appendChild(svgEl('circle', { cx: scalePts.p1.x, cy: scalePts.p1.y, r: 6 / view.k, fill: '#ffb84d', stroke: '#7a5a1a', class: 'overlay-point' }));
    if (scalePts.p1 && scalePts.p2) {
      layerOverlay.appendChild(svgEl('line', { x1: scalePts.p1.x, y1: scalePts.p1.y, x2: scalePts.p2.x, y2: scalePts.p2.y, class: 'scale-line' }));
      layerOverlay.appendChild(svgEl('circle', { cx: scalePts.p2.x, cy: scalePts.p2.y, r: 6 / view.k, fill: '#ffb84d', stroke: '#7a5a1a', class: 'overlay-point' }));
      const mid = { x: (scalePts.p1.x + scalePts.p2.x) / 2, y: (scalePts.p1.y + scalePts.p2.y) / 2 };
      const px = dist(scalePts.p1, scalePts.p2);
      const label = state.pxPerMeter ? `${px.toFixed(0)} px = ${(px / ppm()).toFixed(2)} m` : `${px.toFixed(0)} px`;
      const t = svgEl('text', { x: mid.x, y: mid.y - 8, class: 'scale-label' });
      t.textContent = label;
      layerOverlay.appendChild(t);
    }
  }
  if (newDrag && newDrag.world) {
    const def = CATALOG_BY_TYPE[newDrag.type];
    const u = ppm();
    const g = svgEl('g', { transform: `translate(${newDrag.world.x} ${newDrag.world.y})`, opacity: 0.65 });
    const inner = svgEl('g');
    def.draw(inner, u);
    g.appendChild(inner);
    layerOverlay.appendChild(g);
  }
  if (selection.kind === 'item') {
    const item = state.items.find(i => i.id === selection.id);
    if (item) {
      const def = CATALOG_BY_TYPE[item.type];
      const u = ppm();
      const rad = (item.rotation * Math.PI) / 180;
      const topX = item.x + (def.h * u / 2) * Math.sin(rad);
      const topY = item.y - (def.h * u / 2) * Math.cos(rad);
      const h = rotHandlePos(item);
      layerOverlay.appendChild(svgEl('line', { x1: topX, y1: topY, x2: h.x, y2: h.y, class: 'rot-handle-line' }));
      layerOverlay.appendChild(svgEl('circle', { cx: h.x, cy: h.y, r: 7 / view.k, class: 'rot-handle' }));
    }
  }
}

// ---------- Seitenpanels ----------
function propRow(label, ...controls) {
  const row = el('div', { class: 'prop-row' });
  row.appendChild(el('span', { class: 'prop-label' }, label));
  for (const c of controls) row.appendChild(c);
  return row;
}
function btnRow(btns) { const r = el('div', { class: 'btn-row' }); for (const b of btns) r.appendChild(b); return r; }
function smallBtn(label, fn) { const b = el('button', {}, label); b.addEventListener('click', fn); return b; }
function dangerBtn(label, fn) { const b = el('button', { class: 'danger' }, label); b.addEventListener('click', fn); return b; }
function inputText(value, onInput, onChange) {
  const i = el('input', { type: 'text', value });
  armHistory(i);
  if (onInput) i.addEventListener('input', () => onInput(i.value));
  i.addEventListener('change', () => { if (onChange) onChange(); });
  return i;
}
function inputColor(value, onInput, onChange) {
  const i = el('input', { type: 'color', value });
  armHistory(i);
  i.addEventListener('input', () => onInput(i.value));
  i.addEventListener('change', () => { if (onChange) onChange(); });
  return i;
}

function renderRoomList() {
  const box = $('room-list');
  box.textContent = '';
  if (state.rooms.length === 0) {
    box.innerHTML = '<p class="hint">Noch keine Räume. Werkzeug „Raum zeichnen“ verwenden.</p>';
    return;
  }
  const u = ppm();
  for (const room of state.rooms) {
    const row = el('div', { class: 'room-row' + (selection.kind === 'room' && selection.id === room.id ? ' selected' : '') });
    const dot = el('span', { class: 'room-dot' });
    dot.style.background = room.wallColor;
    const name = el('span', {}, room.name);
    const area = el('span', { class: 'room-area' }, state.pxPerMeter ? (polygonArea(room.points) / (u * u)).toFixed(1) + ' m²' : '');
    row.append(dot, name, area);
    row.addEventListener('click', () => { selection = { kind: 'room', id: room.id }; renderAll(); });
    box.appendChild(row);
  }
}

const WALL_PRESETS = ['#f5f0e6', '#e8dcc8', '#d7e3d0', '#cfdde8', '#e3cfd8', '#d9d9d9', '#b8c4a5', '#c9b8a3'];

function renderSelectionProps() {
  const box = $('selection-props');
  box.textContent = '';
  if (selection.kind === 'room') {
    const room = state.rooms.find(r => r.id === selection.id);
    if (!room) { selection = { kind: null, id: null }; box.innerHTML = '<p class="hint">Nichts ausgewählt.</p>'; return; }
    const u = ppm();
    box.appendChild(el('h3', {}, room.name));
    box.appendChild(propRow('Name', inputText(room.name, v => { room.name = v; }, () => renderAll())));
    const colorRow = propRow('Wandfarbe', inputColor(room.wallColor, v => { room.wallColor = v; renderRooms(); renderRoomList(); }, () => renderAll()));
    const presets = el('div', { class: 'btn-row' });
    for (const c of WALL_PRESETS) {
      const b = el('button');
      b.style.cssText = `width:22px;height:22px;padding:0;background:${c};border-radius:5px;`;
      b.title = c;
      b.addEventListener('click', () => { pushHistory(); room.wallColor = c; renderAll(); });
      presets.appendChild(b);
    }
    colorRow.appendChild(presets);
    box.appendChild(colorRow);
    const sel = el('select');
    for (const [key, f] of Object.entries(FLOORS)) {
      const o = el('option', { value: key }, f.name);
      if (room.floor === key) o.selected = true;
      sel.appendChild(o);
    }
    armHistory(sel);
    sel.addEventListener('change', () => { room.floor = sel.value; renderAll(); });
    box.appendChild(propRow('Bodenbelag', sel));
    box.appendChild(propRow('Fläche', el('span', { class: 'dim' }, state.pxPerMeter ? (polygonArea(room.points) / (u * u)).toFixed(2) + ' m²' : 'Maßstab setzen für m²-Anzeige')));
    box.appendChild(btnRow([dangerBtn('🗑 Raum löschen', () => deleteSelection())]));
  } else if (selection.kind === 'item') {
    const item = state.items.find(i => i.id === selection.id);
    if (!item) { selection = { kind: null, id: null }; box.innerHTML = '<p class="hint">Nichts ausgewählt.</p>'; return; }
    const def = CATALOG_BY_TYPE[item.type];
    box.appendChild(el('h3', {}, def.name));
    box.appendChild(propRow('Größe', el('span', { class: 'dim' }, `${def.w} × ${def.h} m (${(def.w * def.h).toFixed(2)} m²)`)));
    const range = el('input', { type: 'range', min: 0, max: 359, value: Math.round(item.rotation) });
    range.style.flex = '1';
    armHistory(range);
    range.addEventListener('input', () => { item.rotation = +range.value; renderItems(); renderOverlay(); });
    range.addEventListener('change', () => renderAll());
    box.appendChild(propRow('Drehung', range, el('span', { class: 'dim' }, Math.round(item.rotation) + '°')));
    box.appendChild(btnRow([
      smallBtn('−15°', () => { pushHistory(); item.rotation = (item.rotation - 15 + 360) % 360; renderAll(); }),
      smallBtn('+15°', () => { pushHistory(); item.rotation = (item.rotation + 15) % 360; renderAll(); }),
    ]));
    box.appendChild(btnRow([
      smallBtn('⬆ Nach vorne', () => { pushHistory(); moveItem(item.id, state.items.length - 1); renderAll(); }),
      smallBtn('⬇ Nach hinten', () => { pushHistory(); moveItem(item.id, 0); renderAll(); }),
      dangerBtn('🗑 Löschen', () => deleteSelection()),
    ]));
  } else {
    box.innerHTML = '<p class="hint">Nichts ausgewählt. Klicke auf einen Raum oder ein Möbelstück auf dem Plan.</p>';
  }
}

function moveItem(id, toIndex) {
  const idx = state.items.findIndex(i => i.id === id);
  if (idx < 0) return;
  const it = state.items.splice(idx, 1)[0];
  state.items.splice(clamp(toIndex, 0, state.items.length), 0, it);
}

function deleteSelection() {
  pushHistory();
  if (selection.kind === 'room') state.rooms = state.rooms.filter(r => r.id !== selection.id);
  if (selection.kind === 'item') state.items = state.items.filter(i => i.id !== selection.id);
  selection = { kind: null, id: null };
  renderAll();
}

function updateScaleInfo() {
  const info = $('scale-info');
  const form = $('scale-form');
  if (scalePts && scalePts.p1 && scalePts.p2) {
    info.hidden = true;
    form.hidden = false;
  } else {
    form.hidden = true;
    info.hidden = false;
    info.textContent = state.pxPerMeter
      ? `Maßstab gesetzt: 1 m = ${ppm().toFixed(1)} px`
      : 'Maßstab: nicht gesetzt (50 px/m angenommen) — Werkzeug 📏';
  }
  $('status-scale').textContent = state.pxPerMeter ? `Maßstab: 1 m = ${ppm().toFixed(1)} px` : 'Maßstab: –';
}

function updateStatus() {
  $('status-zoom').textContent = Math.round(view.k * 100) + ' %';
}

// ---------- Ansicht (Pan/Zoom) ----------
function applyView() {
  world.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.k})`);
  updateStatus();
}
function toWorld(clientX, clientY) {
  const r = scene.getBoundingClientRect();
  const sx = clientX - r.left, sy = clientY - r.top;
  return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k };
}
function fitViewToPlan() {
  if (!state.planImage) return;
  const wrap = $('canvas-wrap');
  const w = state.planImage.w, h = state.planImage.h;
  const k = clamp(Math.min((wrap.clientWidth - 80) / w, (wrap.clientHeight - 80) / h), 0.05, 4);
  view.k = k;
  view.x = (wrap.clientWidth - w * k) / 2;
  view.y = (wrap.clientHeight - h * k) / 2;
  applyView();
}

// ---------- Hit-Tests ----------
function hitItem(p) {
  const u = ppm();
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    const def = CATALOG_BY_TYPE[item.type];
    if (!def) continue;
    const rad = (-item.rotation * Math.PI) / 180;
    const dx = p.x - item.x, dy = p.y - item.y;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    const pad = 5 / view.k;
    if (Math.abs(lx) <= def.w * u / 2 + pad && Math.abs(ly) <= def.h * u / 2 + pad) return item;
  }
  return null;
}
function hitRoom(p) {
  for (let i = state.rooms.length - 1; i >= 0; i--) {
    if (pointInPolygon(p, state.rooms[i].points)) return state.rooms[i];
  }
  return null;
}
