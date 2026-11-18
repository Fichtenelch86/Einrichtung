'use strict';

/* ============================================================
   Möbel- & Deko-Katalog (Maße in Metern, Zeichnung von oben)
   ============================================================ */

function drawSofa(g, u) {
  const w = 2.2 * u, h = 0.95 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.08 * u, fill: '#8fa3bf', stroke: '#64799a', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: 0.26 * u, rx: 0.08 * u, fill: '#7d92b0' }));
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: 0.18 * u, height: h, fill: '#7d92b0' }));
  g.appendChild(svgEl('rect', { x: w / 2 - 0.18 * u, y: -h / 2, width: 0.18 * u, height: h, fill: '#7d92b0' }));
  const cw = (w - 0.36 * u) / 2;
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.18 * u, y: -h / 2 + 0.26 * u, width: cw, height: h - 0.26 * u, rx: 0.05 * u, fill: '#a3b6cd', stroke: '#64799a', 'stroke-width': 1.5 }));
  g.appendChild(svgEl('rect', { x: w / 2 - 0.18 * u - cw, y: -h / 2 + 0.26 * u, width: cw, height: h - 0.26 * u, rx: 0.05 * u, fill: '#a3b6cd', stroke: '#64799a', 'stroke-width': 1.5 }));
}
function drawEsstisch(g, u) {
  const w = 1.6 * u, h = 0.9 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.07 * u, fill: '#b98d5f', stroke: '#8f683f', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.09 * u, y: -h / 2 + 0.09 * u, width: w - 0.18 * u, height: h - 0.18 * u, rx: 0.04 * u, fill: 'none', stroke: '#8f683f', 'stroke-width': 1.2 }));
}
function drawSessel(g, u) {
  const w = 0.9 * u, h = 0.85 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.1 * u, fill: '#9db1c9', stroke: '#64799a', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: 0.24 * u, rx: 0.1 * u, fill: '#7d92b0' }));
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.12 * u, y: -h / 2 + 0.24 * u, width: w - 0.24 * u, height: h - 0.36 * u, rx: 0.05 * u, fill: '#b3c4d8' }));
}
function drawStuhl(g, u) {
  const w = 0.45 * u, h = 0.45 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.05 * u, fill: '#c8a06a', stroke: '#96703f', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: 0.09 * u, fill: '#a37c48' }));
}
function drawBett(g, u, single) {
  const w = (single ? 1.4 : 2.0) * u, h = 2.0 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.06 * u, fill: '#9fb6c9', stroke: '#7c93a8', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: 0.14 * u, fill: '#8a6f4d' }));
  const pw = single ? w - 0.3 * u : (w - 0.45 * u) / 2;
  const p1x = -w / 2 + 0.15 * u;
  g.appendChild(svgEl('rect', { x: p1x, y: -h / 2 + 0.2 * u, width: pw, height: 0.42 * u, rx: 0.06 * u, fill: '#f2f2f2', stroke: '#c9c9c9', 'stroke-width': 1 }));
  if (!single) g.appendChild(svgEl('rect', { x: w / 2 - 0.15 * u - pw, y: -h / 2 + 0.2 * u, width: pw, height: 0.42 * u, rx: 0.06 * u, fill: '#f2f2f2', stroke: '#c9c9c9', 'stroke-width': 1 }));
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2 + 0.75 * u, width: w, height: h / 2 - 0.75 * u, fill: '#7d92b0', opacity: 0.85 }));
}
function drawSchrank(g, u) {
  const w = 1.2 * u, h = 0.6 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#a98a63', stroke: '#7d6244', 'stroke-width': 2 }));
  g.appendChild(svgEl('line', { x1: 0, y1: -h / 2, x2: 0, y2: h / 2, stroke: '#7d6244', 'stroke-width': 2 }));
  g.appendChild(svgEl('circle', { cx: -0.07 * u, cy: 0, r: 0.03 * u, fill: '#5c4630' }));
  g.appendChild(svgEl('circle', { cx: 0.07 * u, cy: 0, r: 0.03 * u, fill: '#5c4630' }));
}
function drawRegal(g, u) {
  const w = 1.0 * u, h = 0.35 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#b08d5f', stroke: '#84684a', 'stroke-width': 2 }));
  for (let i = 1; i < 4; i++) {
    g.appendChild(svgEl('line', { x1: -w / 2 + (w * i) / 4, y1: -h / 2, x2: -w / 2 + (w * i) / 4, y2: h / 2, stroke: '#84684a', 'stroke-width': 1.5 }));
  }
}
function drawPflanze(g, u) {
  const r = 0.2 * u;
  g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: r, fill: '#4e8a4f', stroke: '#38683a', 'stroke-width': 2 }));
  g.appendChild(svgEl('circle', { cx: -r * 0.35, cy: -r * 0.3, r: r * 0.45, fill: '#5da05e' }));
  g.appendChild(svgEl('circle', { cx: r * 0.3, cy: r * 0.25, r: r * 0.4, fill: '#5da05e' }));
  g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 0.09 * u, fill: '#b0655a' }));
}
function drawStehlampe(g, u) {
  g.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 0.14 * u, fill: '#d8d8d8', stroke: '#9a9a9a', 'stroke-width': 2 }));
  g.appendChild(svgEl('line', { x1: 0, y1: -0.14 * u, x2: 0, y2: -0.02 * u, stroke: '#8a8a8a', 'stroke-width': 2 }));
  g.appendChild(svgEl('circle', { cx: 0, cy: -0.03 * u, r: 0.09 * u, fill: '#f2d38a', stroke: '#c9a84f', 'stroke-width': 1.5 }));
}
function drawTeppich(g, u) {
  const w = 2.0 * u, h = 1.5 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#b0655a', opacity: 0.32, stroke: '#b0655a', 'stroke-width': 2, 'stroke-dasharray': `${0.08 * u} ${0.05 * u}` }));
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.12 * u, y: -h / 2 + 0.12 * u, width: w - 0.24 * u, height: h - 0.24 * u, fill: 'none', stroke: '#b0655a', 'stroke-width': 1.5, opacity: 0.7 }));
}
function drawBild(g, u) {
  const w = 0.9 * u, h = 0.6 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#6b4f35', stroke: '#4a3524', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.07 * u, y: -h / 2 + 0.07 * u, width: w - 0.14 * u, height: h - 0.14 * u, fill: '#e8e0d0' }));
  g.appendChild(svgEl('path', { d: `M ${-w / 2 + 0.12 * u} ${h / 2 - 0.12 * u} L ${-0.05 * u} ${-0.02 * u} L ${0.08 * u} ${h / 2 - 0.2 * u} L ${0.18 * u} ${0.05 * u} L ${w / 2 - 0.12 * u} ${h / 2 - 0.12 * u}`, fill: 'none', stroke: '#7d92b0', 'stroke-width': 1.5 }));
}
function drawKuechenzeile(g, u) {
  const w = 2.4 * u, h = 0.6 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#cfd6dd', stroke: '#93a0ac', 'stroke-width': 2 }));
  g.appendChild(svgEl('line', { x1: -w / 2 + 0.05 * u, y1: -h / 2 + 0.1 * u, x2: w / 2 - 0.05 * u, y2: -h / 2 + 0.1 * u, stroke: '#93a0ac', 'stroke-width': 1.2 }));
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.15 * u, y: -h / 2 + 0.18 * u, width: 0.5 * u, height: h - 0.36 * u, rx: 0.05 * u, fill: '#eef3f6', stroke: '#93a0ac', 'stroke-width': 1.5 }));
  for (const cx of [w / 2 - 0.55 * u, w / 2 - 0.25 * u]) {
    for (const cy of [-h / 2 + 0.2 * u, -h / 2 + 0.42 * u]) {
      g.appendChild(svgEl('circle', { cx, cy, r: 0.07 * u, fill: 'none', stroke: '#5a6672', 'stroke-width': 1.5 }));
    }
  }
}
function drawBadewanne(g, u) {
  const w = 1.7 * u, h = 0.75 * u;
  g.appendChild(svgEl('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 0.3 * u, fill: '#eef3f6', stroke: '#9fb4c0', 'stroke-width': 2 }));
  g.appendChild(svgEl('rect', { x: -w / 2 + 0.09 * u, y: -h / 2 + 0.09 * u, width: w - 0.18 * u, height: h - 0.18 * u, rx: 0.22 * u, fill: '#d8e6ee' }));
  g.appendChild(svgEl('circle', { cx: w / 2 - 0.22 * u, cy: 0, r: 0.035 * u, fill: '#9fb4c0' }));
}

const CATALOG = [
  { type: 'sofa',        name: 'Sofa 2-Sitzer',  cat: 'Wohnen',       w: 2.2, h: 0.95, draw: drawSofa },
  { type: 'esstisch',    name: 'Esstisch',       cat: 'Wohnen',       w: 1.6, h: 0.9,  draw: drawEsstisch },
  { type: 'sessel',      name: 'Sessel',         cat: 'Wohnen',       w: 0.9, h: 0.85, draw: drawSessel },
  { type: 'stuhl',       name: 'Stuhl',          cat: 'Wohnen',       w: 0.45, h: 0.45, draw: drawStuhl },
  { type: 'regal',       name: 'Regal',          cat: 'Wohnen',       w: 1.0, h: 0.35, draw: drawRegal },
  { type: 'bett',        name: 'Doppelbett',     cat: 'Schlafen',     w: 2.0, h: 2.0,  draw: (g, u) => drawBett(g, u, false) },
  { type: 'einzelbett',  name: 'Einzelbett',     cat: 'Schlafen',     w: 1.4, h: 2.0,  draw: (g, u) => drawBett(g, u, true) },
  { type: 'schrank',     name: 'Kleiderschrank', cat: 'Schlafen',     w: 1.2, h: 0.6,  draw: drawSchrank },
  { type: 'kueche',      name: 'Küchenzeile',    cat: 'Küche & Bad',  w: 2.4, h: 0.6,  draw: drawKuechenzeile },
  { type: 'badewanne',   name: 'Badewanne',      cat: 'Küche & Bad',  w: 1.7, h: 0.75, draw: drawBadewanne },
  { type: 'teppich',     name: 'Teppich',        cat: 'Deko & Licht', w: 2.0, h: 1.5,  draw: drawTeppich },
  { type: 'bild',        name: 'Bild',           cat: 'Deko & Licht', w: 0.9, h: 0.6,  draw: drawBild },
  { type: 'pflanze',     name: 'Pflanze',        cat: 'Deko & Licht', w: 0.4, h: 0.4,  draw: drawPflanze },
  { type: 'stehlampe',   name: 'Stehlampe',      cat: 'Deko & Licht', w: 0.3, h: 0.3,  draw: drawStehlampe },
];
const CATALOG_BY_TYPE = Object.fromEntries(CATALOG.map(c => [c.type, c]));
