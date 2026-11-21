'use strict';

/* ============================================================
   Interaktion, Werkzeuge, Import/Export, Init
   ============================================================ */

// ---------- Pointer-Interaktion auf der Zeichenfläche ----------
scene.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  scene.setPointerCapture(e.pointerId);
  scene.focus();
  const p = toWorld(e.clientX, e.clientY);
  if (mode === 'hand') {
    drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    scene.classList.add('dragging');
    return;
  }
  if (mode === 'scale') {
    if (!scalePts) scalePts = { p1: p, p2: null };
    else if (!scalePts.p2) scalePts.p2 = p;
    else scalePts = { p1: p, p2: null };
    renderOverlay();
    updateScaleInfo();
    return;
  }
  if (mode === 'room') {
    if (!drawing) drawing = { points: [] };
    const last = drawing.points[drawing.points.length - 1];
    if (!last || dist(p, last) > 4 / view.k) drawing.points.push({ x: p.x, y: p.y });
    renderOverlay();
    return;
  }
  // Modus "select"
  if (selection.kind === 'item') {
    const item = state.items.find(i => i.id === selection.id);
    if (item && dist(p, rotHandlePos(item)) < 11 / view.k) {
      drag = { kind: 'rotate', id: item.id, cx: item.x, cy: item.y, saved: false };
      return;
    }
  }
  const item = hitItem(p);
  if (item) {
    selection = { kind: 'item', id: item.id };
    drag = { kind: 'move-item', id: item.id, start: p, orig: { x: item.x, y: item.y }, saved: false };
    renderAll();
    return;
  }
  const room = hitRoom(p);
  if (room) {
    selection = { kind: 'room', id: room.id };
    drag = { kind: 'move-room', id: room.id, start: p, orig: room.points.map(q => ({ ...q })), saved: false };
    renderAll();
    return;
  }
  selection = { kind: null, id: null };
  drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  renderAll();
});

scene.addEventListener('pointermove', e => {
  const p = toWorld(e.clientX, e.clientY);
  $('status-pos').textContent = state.pxPerMeter
    ? `${(p.x / ppm()).toFixed(2)} m, ${(p.y / ppm()).toFixed(2)} m`
    : `${p.x.toFixed(0)} px, ${p.y.toFixed(0)} px`;
  if (!drag) return;
  switch (drag.kind) {
    case 'pan':
      view.x = drag.vx + (e.clientX - drag.sx);
      view.y = drag.vy + (e.clientY - drag.sy);
      applyView();
      break;
    case 'move-item': {
      if (!drag.saved && dist(p, drag.start) > 3 / view.k) { pushHistory(); drag.saved = true; }
      if (drag.saved) {
        const item = state.items.find(i => i.id === drag.id);
        if (item) { item.x = snap(drag.orig.x + (p.x - drag.start.x)); item.y = snap(drag.orig.y + (p.y - drag.start.y)); }
        renderItems(); renderOverlay();
      }
      break;
    }
    case 'move-room': {
      if (!drag.saved && dist(p, drag.start) > 3 / view.k) { pushHistory(); drag.saved = true; }
      if (drag.saved) {
        const room = state.rooms.find(r => r.id === drag.id);
        if (room) room.points = drag.orig.map(q => ({ x: snap(q.x + (p.x - drag.start.x)), y: snap(q.y + (p.y - drag.start.y)) }));
        renderRooms(); renderOverlay(); renderRoomList();
      }
      break;
    }
    case 'rotate': {
      if (!drag.saved) { pushHistory(); drag.saved = true; }
      const item = state.items.find(i => i.id === drag.id);
      if (item) {
        const ang = (Math.atan2(p.y - drag.cy, p.x - drag.cx) * 180) / Math.PI + 90;
        item.rotation = ((Math.round(ang) % 360) + 360) % 360;
        renderItems(); renderOverlay();
      }
      break;
    }
  }
});

scene.addEventListener('pointerup', () => {
  if (drag && drag.kind === 'pan') scene.classList.remove('dragging');
  drag = null;
});
scene.addEventListener('pointercancel', () => {
  drag = null;
  scene.classList.remove('dragging');
});

scene.addEventListener('dblclick', () => {
  if (mode === 'room' && drawing && drawing.points.length >= 3) finishRoom();
});

scene.addEventListener('wheel', e => {
  e.preventDefault();
  const r = scene.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const f = Math.exp(-e.deltaY * 0.0012);
  const k2 = clamp(view.k * f, 0.1, 8);
  view.x = sx - ((sx - view.x) * k2) / view.k;
  view.y = sy - ((sy - view.y) * k2) / view.k;
  view.k = k2;
  applyView();
  renderOverlay();
}, { passive: false });

function finishRoom() {
  if (!drawing || drawing.points.length < 3) return;
  pushHistory();
  const room = {
    id: state.nextId++,
    name: 'Raum ' + (state.rooms.length + 1),
    points: drawing.points.map(p => ({ x: p.x, y: p.y })),
    wallColor: '#e8dcc8',
    floor: 'parkett',
  };
  state.rooms.push(room);
  drawing = null;
  selection = { kind: 'room', id: room.id };
  renderAll();
  toast(`Raum „${room.name}“ angelegt — Wandfarbe und Bodenbelag rechts einstellen.`);
}

// ---------- Katalog ----------
function buildCatalog() {
  const box = $('catalog');
  box.textContent = '';
  const cats = [...new Set(CATALOG.map(c => c.cat))];
  for (const cat of cats) {
    const group = el('div', { class: 'cat-group' });
    group.appendChild(el('h3', {}, cat));
    const grid = el('div', { class: 'cat-items' });
    for (const def of CATALOG.filter(c => c.cat === cat)) {
      const card = el('div', { class: 'catalog-item', title: `${def.name} — ${def.w}×${def.h} m. Ziehen oder anklicken.` });
      const u = 26;
      const vb = `${-def.w * u / 2 - 6} ${-def.h * u / 2 - 6} ${def.w * u + 12} ${def.h * u + 12}`;
      const svg = svgEl('svg', { viewBox: vb });
      const g = svgEl('g');
      def.draw(g, u);
      svg.appendChild(g);
      card.appendChild(svg);
      card.appendChild(el('div', { class: 'ci-name' }, def.name));
      card.appendChild(el('div', { class: 'ci-size' }, `${def.w}×${def.h} m`));
      card.addEventListener('pointerdown', e => startNewItemDrag(e, def.type));
      grid.appendChild(card);
    }
    group.appendChild(grid);
    box.appendChild(group);
  }
}

function startNewItemDrag(e, type) {
  e.preventDefault();
  newDrag = { type, world: null, over: false, sx: e.clientX, sy: e.clientY, moved: false };
  $('drop-hint').hidden = false;
  window.addEventListener('pointermove', onNewDragMove);
  window.addEventListener('pointerup', onNewDragUp, { once: true });
  onNewDragMove(e);
}
function onNewDragMove(e) {
  if (!newDrag) return;
  if (Math.hypot(e.clientX - newDrag.sx, e.clientY - newDrag.sy) > 6) newDrag.moved = true;
  const r = scene.getBoundingClientRect();
  newDrag.over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  newDrag.world = toWorld(e.clientX, e.clientY);
  renderOverlay();
}
function onNewDragUp() {
  window.removeEventListener('pointermove', onNewDragMove);
  $('drop-hint').hidden = true;
  if (!newDrag) return;
  if (newDrag.over) {
    pushHistory();
    addItem(newDrag.type, newDrag.world);
  } else if (!newDrag.moved) {
    const r = scene.getBoundingClientRect();
    pushHistory();
    addItem(newDrag.type, toWorld(r.left + r.width / 2, r.top + r.height / 2));
  }
  newDrag = null;
  renderAll();
}
function addItem(type, pos) {
  const item = { id: state.nextId++, type, x: snap(pos.x), y: snap(pos.y), rotation: 0 };
  state.items.push(item);
  selection = { kind: 'item', id: item.id };
}

// ---------- Werkzeuge & Tastatur ----------
const MODE_HINTS = {
  select: 'Klicken wählt aus, Ziehen verschiebt. Leere Fläche ziehen = Ansicht verschieben, Mausrad = Zoom. Entf löscht die Auswahl.',
  room: 'Punkte für den neuen Raum klicken. Doppelklick oder Enter schließt das Polygon, Esc bricht ab.',
  scale: 'Zwei Punkte auf einer bekannten Strecke des Plans klicken (z. B. eine 5-m-Wand), dann die Länge in Metern eingeben.',
  hand: 'Ziehen verschiebt die Ansicht, Mausrad zoomt.',
};
function setMode(m) {
  mode = m;
  drawing = null;
  document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  scene.className = 'mode-' + m;
  $('mode-hint').textContent = MODE_HINTS[m];
  renderOverlay();
  updateScaleInfo();
}
document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Escape') {
    drawing = null; scalePts = null;
    selection = { kind: null, id: null };
    renderAll();
  } else if (e.key === 'Enter' && mode === 'room') {
    finishRoom();
  } else if ((e.key === 'Delete' || e.key === 'Backspace') && selection.kind) {
    e.preventDefault();
    deleteSelection();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault(); undo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault(); redo();
  } else if (e.key === '1') setMode('select');
  else if (e.key === '2') setMode('room');
  else if (e.key === '3') setMode('scale');
  else if (e.key === '4') setMode('hand');
});

// ---------- Grundriss laden ----------
$('btn-upload-plan').addEventListener('click', () => $('file-plan').click());
$('file-plan').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      pushHistory();
      state.planImage = { dataUrl: reader.result, w: img.naturalWidth, h: img.naturalHeight };
      renderAll();
      fitViewToPlan();
      toast('Grundriss geladen. Jetzt Maßstab setzen (📏) und Räume einzeichnen.');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

$('btn-example-plan').addEventListener('click', () => {
  pushHistory();
  state.planImage = makeExamplePlan();
  state.pxPerMeter = 60; // Beispiel ist mit 60 px/m gezeichnet
  renderAll();
  fitViewToPlan();
  toast('Beispiel-Grundriss geladen (12 × 8 m, Maßstab 60 px/m gesetzt).');
});

$('btn-remove-plan').addEventListener('click', () => {
  pushHistory();
  state.planImage = null;
  renderAll();
});

let opArmed = false;
$('plan-opacity').addEventListener('pointerdown', () => { if (!opArmed) { pushHistory(); opArmed = true; } });
$('plan-opacity').addEventListener('focus', () => { if (!opArmed) { pushHistory(); opArmed = true; } });
$('plan-opacity').addEventListener('blur', () => { opArmed = false; });
$('plan-opacity').addEventListener('input', e => {
  state.planOpacity = +e.target.value / 100;
  renderPlan();
});
$('plan-opacity').addEventListener('change', () => renderAll());

// ---------- Maßstab ----------
$('scale-ok').addEventListener('click', () => {
  if (!scalePts || !scalePts.p1 || !scalePts.p2) return;
  const meters = parseFloat($('scale-meters').value);
  if (!meters || meters <= 0) { toast('Bitte eine gültige Länge in Metern eingeben.'); return; }
  pushHistory();
  state.pxPerMeter = dist(scalePts.p1, scalePts.p2) / meters;
  scalePts = null;
  renderAll();
  toast(`Maßstab gesetzt: 1 m = ${ppm().toFixed(1)} px.`);
});
$('scale-cancel').addEventListener('click', () => { scalePts = null; renderAll(); });

// ---------- Beispiel-Grundriss (12 m × 8 m, 60 px/m) ----------
function makeExamplePlan() {
  const p = 60, W = 12, H = 8;
  const m = v => v * p;
  const wall = '#2f3540', ww = 0.18 * p;
  const seg = (x1, y1, x2, y2) => `M ${m(x1)} ${m(y1)} L ${m(x2)} ${m(y2)}`;
  let walls = '';
  walls += seg(0, 0, W, 0) + seg(0, 0, 0, H) + seg(W, 0, W, H);
  walls += seg(0, H, 9, H) + seg(10.2, H, W, H);
  walls += seg(0, 4.5, 2.5, 4.5) + seg(3.5, 4.5, W, 4.5);
  walls += seg(5, 0, 5, 3.2) + seg(5, 4.2, 5, 4.5);
  const door = (hx, hy, ex, ey) =>
    `M ${m(hx)} ${m(hy)} L ${m(ex)} ${m(ey)} ` +
    `M ${m(ex)} ${m(ey)} A ${m(Math.hypot(ex - hx, ey - hy))} ${m(Math.hypot(ex - hx, ey - hy))} 0 0 1 ${m(hx + (ey - hy))} ${m(hy - (ex - hx))}`;
  const doors = door(9, H, 9, H - 1.2) + door(2.5, 4.5, 3.5, 4.5) + door(5, 3.2, 5, 4.2);
  const win = (x1, y1, x2, y2) => `M ${m(x1)} ${m(y1)} L ${m(x2)} ${m(y2)}`;
  const windows = win(6.5, 0, 8.5, 0) + win(0, 5.5, 0, 7.5) + win(8, H, 10, H);
  const counter = `<rect x="${m(5.3)}" y="${m(0.2)}" width="${m(6.4)}" height="${m(0.55)}" fill="#cfd6dd" stroke="#93a0ac" stroke-width="2"/>`;
  const scaleBar = `<rect x="${m(0.4)}" y="${m(7.55)}" width="${m(2)}" height="${m(0.09)}" fill="#2f3540"/><text x="${m(1.4)}" y="${m(7.45)}" font-size="${m(0.28)}" fill="#2f3540" text-anchor="middle" font-family="sans-serif">2 m</text>`;
  const labels = [
    ['Schlafzimmer', 2.5, 2.1], ['Küche', 8.5, 2.1], ['Wohnzimmer', 6, 6.3],
  ].map(([t, x, y]) => `<text x="${m(x)}" y="${m(y)}" font-size="${m(0.45)}" fill="#5a6270" text-anchor="middle" font-family="sans-serif">${t}</text>`).join('');
  const svg =
    `<svg xmlns="${SVGNS}" width="${m(W)}" height="${m(H)}" viewBox="0 0 ${m(W)} ${m(H)}">` +
    `<rect width="${m(W)}" height="${m(H)}" fill="#f7f5f0"/>` +
    `<path d="${walls}" stroke="${wall}" stroke-width="${ww}" fill="none"/>` +
    `<path d="${doors}" stroke="#8a93a3" stroke-width="2" fill="none" stroke-dasharray="5 4"/>` +
    `<path d="${windows}" stroke="#9cc3e0" stroke-width="${ww}" fill="none"/>` +
    counter + scaleBar + labels + `</svg>`;
  return { dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), w: m(W), h: m(H) };
}

// ---------- Speichern / Laden / Export ----------
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

$('btn-save').addEventListener('click', () => {
  const data = { app: 'einrichtungs-assistent', version: 1, savedAt: new Date().toISOString(), state };
  download('projekt.json', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  toast('Projekt als JSON gespeichert.');
});

$('btn-load').addEventListener('click', () => $('file-load').click());
$('file-load').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !data.state) throw new Error('kein Projekt');
      state = Object.assign(freshState(), data.state);
      selection = { kind: null, id: null };
      history = [snapshot()];
      hIndex = 0;
      updateHistoryButtons();
      renderAll();
      fitViewToPlan();
      toast('Projekt geladen.');
    } catch (err) {
      toast('Datei ist kein gültiges Projekt (' + err.message + ').');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

function contentBBox() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const include = (x, y) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
  if (state.planImage) { include(0, 0); include(state.planImage.w, state.planImage.h); }
  const u = ppm();
  for (const r of state.rooms) for (const p of r.points) include(p.x, p.y);
  for (const it of state.items) {
    const def = CATALOG_BY_TYPE[it.type];
    if (!def) continue;
    const d = Math.max(def.w, def.h) * u / 2 + 20;
    include(it.x - d, it.y - d); include(it.x + d, it.y + d);
  }
  if (minX === Infinity) { minX = -200; minY = -200; maxX = 200; maxY = 200; }
  const pad = 30;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + 2 * pad, h: maxY - minY + 2 * pad };
}

function exportClone(scale) {
  const clone = scene.cloneNode(true);
  const overlay = clone.querySelector('#layer-overlay');
  if (overlay) overlay.remove();
  const b = contentBBox();
  clone.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`);
  clone.setAttribute('width', Math.round(b.w * scale));
  clone.setAttribute('height', Math.round(b.h * scale));
  clone.setAttribute('xmlns', SVGNS);
  return { clone, b };
}

$('btn-export-svg').addEventListener('click', () => {
  const { clone } = exportClone(2);
  const str = new XMLSerializer().serializeToString(clone);
  download('grundriss.svg', new Blob([str], { type: 'image/svg+xml' }));
  toast('SVG exportiert.');
});

$('btn-export-png').addEventListener('click', () => {
  const { clone, b } = exportClone(2);
  const str = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml;charset=utf-8' }));
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(b.w * 2);
    canvas.height = Math.round(b.h * 2);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob => {
      if (blob) { download('grundriss.png', blob); toast('PNG exportiert.'); }
      else toast('PNG-Export fehlgeschlagen.');
    }, 'image/png');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('PNG-Export fehlgeschlagen.'); };
  img.src = url;
});

// ---------- Neu / Autosave ----------
$('btn-new').addEventListener('click', () => {
  if (!confirm('Neues Projekt starten? Alle aktuellen Räume und Möbel gehen verloren (außer sie sind als JSON gespeichert).')) return;
  localStorage.removeItem(AUTOSAVE_KEY);
  state = freshState();
  selection = { kind: null, id: null };
  drawing = null; scalePts = null;
  history = [snapshot()];
  hIndex = 0;
  updateHistoryButtons();
  renderAll();
  toast('Neues Projekt.');
});

let autosaveTimer = null;
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ app: 'einrichtungs-assistent', state })); } catch (err) { /* Speicher voll – ignorieren */ }
  }, 400);
}
function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.state) return Object.assign(freshState(), data.state);
  } catch (err) { /* ignorieren */ }
  return null;
}

// ---------- Toolbar-Buttons ----------
$('btn-undo').addEventListener('click', undo);
$('btn-redo').addEventListener('click', redo);

// ---------- Init ----------
buildCatalog();
setMode('select');
init3D();
$('btn-3d').addEventListener('click', () => set3D(!v3.active));
const restored = loadAutosave();
if (restored) {
  state = restored;
  toast('Autosave wiederhergestellt.');
}
history = [snapshot()];
hIndex = 0;
updateHistoryButtons();
renderAll();
if (state.planImage) fitViewToPlan();
