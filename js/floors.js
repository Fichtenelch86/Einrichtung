'use strict';

/* ============================================================
   Bodenbeläge als SVG-Pattern (Kacheln in Metern skaliert)
   ============================================================ */

function plankPattern(id, u, plankLenM, plankWM, rows, colorA, colorB) {
  const w = plankLenM * u, h = plankWM * rows * u;
  const p = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: w, height: h });
  const rh = plankWM * u;
  for (let r = 0; r < rows; r++) {
    const y = r * rh;
    const sw = Math.max(1, 0.008 * u);
    if (r % 2 === 0) {
      p.appendChild(svgEl('rect', { x: 0, y, width: w, height: rh, fill: r % 4 === 0 ? colorA : colorB, stroke: 'rgba(0,0,0,0.18)', 'stroke-width': sw }));
    } else {
      p.appendChild(svgEl('rect', { x: 0, y, width: w / 2, height: rh, fill: colorA, stroke: 'rgba(0,0,0,0.18)', 'stroke-width': sw }));
      p.appendChild(svgEl('rect', { x: w / 2, y, width: w / 2, height: rh, fill: colorB, stroke: 'rgba(0,0,0,0.18)', 'stroke-width': sw }));
    }
  }
  return p;
}

const FLOORS = {
  parkett:  { name: 'Parkett',  build(u) { return plankPattern('floor-parkett', u, 1.2, 0.2, 2, '#c69a63', '#bd9058'); } },
  laminat:  { name: 'Laminat',  build(u) { return plankPattern('floor-laminat', u, 1.5, 0.2, 2, '#dcc096', '#d3b585'); } },
  fliesen:  { name: 'Fliesen',  build(u) {
    const s = 0.6 * u;
    const p = svgEl('pattern', { id: 'floor-fliesen', patternUnits: 'userSpaceOnUse', width: s, height: s });
    p.appendChild(svgEl('rect', { x: 0, y: 0, width: s, height: s, fill: '#ececec', stroke: '#c6c6c6', 'stroke-width': Math.max(1, 0.012 * u) }));
    p.appendChild(svgEl('rect', { x: s / 2, y: s / 2, width: s / 2, height: s / 2, fill: '#e2e2e2' }));
    return p;
  } },
  teppich:  { name: 'Teppich',  build(u) {
    const s = 2 * u;
    const p = svgEl('pattern', { id: 'floor-teppich', patternUnits: 'userSpaceOnUse', width: s, height: s });
    p.appendChild(svgEl('rect', { x: 0, y: 0, width: s, height: s, fill: '#b26055' }));
    p.appendChild(svgEl('rect', { x: 0.08 * u, y: 0.08 * u, width: s - 0.16 * u, height: s - 0.16 * u, fill: 'none', stroke: '#8e4a42', 'stroke-width': 0.05 * u }));
    return p;
  } },
  vinyl:    { name: 'Vinyl',    build(u) {
    const s = 0.3 * u;
    const p = svgEl('pattern', { id: 'floor-vinyl', patternUnits: 'userSpaceOnUse', width: s, height: s });
    p.appendChild(svgEl('rect', { x: 0, y: 0, width: s, height: s, fill: '#f2f2f2' }));
    p.appendChild(svgEl('rect', { x: s / 2, y: 0, width: s / 2, height: s / 2, fill: '#e6e6e6' }));
    p.appendChild(svgEl('rect', { x: 0, y: s / 2, width: s / 2, height: s / 2, fill: '#e6e6e6' }));
    return p;
  } },
  beton:    { name: 'Beton',    build(u) {
    const s = 1 * u;
    const p = svgEl('pattern', { id: 'floor-beton', patternUnits: 'userSpaceOnUse', width: s, height: s });
    p.appendChild(svgEl('rect', { x: 0, y: 0, width: s, height: s, fill: '#c7c7c7' }));
    for (const [cx, cy, r] of [[0.2, 0.3, 0.02], [0.7, 0.15, 0.015], [0.45, 0.65, 0.025], [0.85, 0.8, 0.018], [0.1, 0.85, 0.02]]) {
      p.appendChild(svgEl('circle', { cx: cx * s, cy: cy * s, r: r * s, fill: 'rgba(0,0,0,0.10)' }));
    }
    return p;
  } },
};
