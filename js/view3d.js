'use strict';

/* ============================================================
   3D-Ansicht: leichtgewichtiger Software-Renderer auf Canvas 2D
   (Perspektivprojektion + Painter's Algorithm, ohne Abhängigkeiten)
   Einheiten: Meter (2D-Pixel / pxProMeter), y zeigt nach oben.
   ============================================================ */

const WALL_H = 2.6;   // Raumhöhe in m
const WALL_T = 0.12;  // Wandstärke in m
const FLOOR3D = { parkett: '#c69a63', laminat: '#dcc096', fliesen: '#e3e3e3', teppich: '#b26055', vinyl: '#ececec', beton: '#c7c7c7' };
const LIGHT3 = norm3({ x: 0.45, y: 1, z: 0.3 });

let v3 = { active: false, theta: -0.7, phi: 0.9, dist: 25, target: { x: 0, y: 0.5, z: 0 }, drag: null, W: 800, H: 600 };
let v3canvas = null, v3ctx = null, planImg3d = null, planImgSrc = '';

function norm3(v) { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; }
function cross3(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function dot3(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function sub3(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }

function init3D() {
  v3canvas = $('view3d');
  v3ctx = v3canvas.getContext('2d');
  v3canvas.addEventListener('pointerdown', e => {
    v3canvas.setPointerCapture(e.pointerId);
    v3.drag = { pan: e.button === 2 || e.shiftKey, sx: e.clientX, sy: e.clientY, theta: v3.theta, phi: v3.phi, target: { ...v3.target } };
  });
  v3canvas.addEventListener('pointermove', e => {
    if (!v3.drag) return;
    const dx = e.clientX - v3.drag.sx, dy = e.clientY - v3.drag.sy;
    if (v3.drag.pan) {
      const b = camBasis();
      const wpp = v3.dist / fpx3();
      v3.target.x = v3.drag.target.x - (b.right.x * dx - b.up.x * dy) * wpp;
      v3.target.y = Math.max(0, v3.drag.target.y + (b.right.y * dx - b.up.y * dy) * wpp);
      v3.target.z = v3.drag.target.z - (b.right.z * dx - b.up.z * dy) * wpp;
    } else {
      v3.theta = v3.drag.theta - dx * 0.008;
      v3.phi = clamp(v3.drag.phi + dy * 0.008, 0.12, 1.45);
    }
    render3D();
  });
  const end = () => { v3.drag = null; };
  v3canvas.addEventListener('pointerup', end);
  v3canvas.addEventListener('pointercancel', end);
  v3canvas.addEventListener('contextmenu', e => e.preventDefault());
  v3canvas.addEventListener('wheel', e => {
    e.preventDefault();
    v3.dist = clamp(v3.dist * Math.exp(e.deltaY * 0.0012), 3, 250);
    render3D();
  }, { passive: false });
  v3canvas.addEventListener('dblclick', () => { fit3D(); render3D(); });
  window.addEventListener('resize', () => render3D());
}

function set3D(on) {
  v3.active = on;
  v3canvas.hidden = !on;
  $('hint3d').hidden = !on;
  scene.style.visibility = on ? 'hidden' : 'visible';
  const b = $('btn-3d');
  b.textContent = on ? '🧊 2D' : '🎲 3D';
  b.classList.toggle('active', on);
  if (on) { fit3D(); render3D(); }
}

function camBasis() {
  const cp = Math.cos(v3.phi), sp = Math.sin(v3.phi);
  const eye = {
    x: v3.target.x + v3.dist * cp * Math.sin(v3.theta),
    y: v3.target.y + v3.dist * sp,
    z: v3.target.z + v3.dist * cp * Math.cos(v3.theta),
  };
  const fwd = norm3(sub3(v3.target, eye));
  const right = norm3(cross3(fwd, { x: 0, y: 1, z: 0 }));
  const up = cross3(right, fwd);
  return { eye, fwd, right, up };
}
function fpx3() { return (v3.H * 0.5) / Math.tan((40 * Math.PI / 180) / 2); }

function project3(p, b) {
  const d = sub3(p, b.eye);
  const z = dot3(d, b.fwd);
  if (z < 0.1) return null;
  const x = dot3(d, b.right), y = dot3(d, b.up);
  const f = fpx3();
  return { x: v3.W / 2 + (f * x) / z, y: v3.H / 2 - (f * y) / z, z };
}

// Box mit 6 Flächen; Normalen werden nach außen orientiert
function boxFaces3(cx, cy, cz, w, h, d, rot, color) {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const corners = [];
  for (const [sx, sy, sz] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
    const lx = (sx * w) / 2, ly = (sy * h) / 2, lz = (sz * d) / 2;
    corners.push({ x: cx + lx * cs + lz * sn, y: cy + ly, z: cz - lx * sn + lz * cs });
  }
  const quads = [[4, 5, 6, 7], [0, 3, 2, 1], [1, 2, 6, 5], [0, 4, 7, 3], [4, 5, 1, 0], [3, 7, 6, 2]];
  const center = { x: cx, y: cy, z: cz };
  const out = [];
  for (let qi of quads) {
    let pts = qi.map(i => corners[i]);
    let n = norm3(cross3(sub3(pts[1], pts[0]), sub3(pts[2], pts[0])));
    const fc = { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2, z: (pts[0].z + pts[2].z) / 2 };
    if (dot3(n, sub3(fc, center)) < 0) { pts = pts.slice().reverse(); n = { x: -n.x, y: -n.y, z: -n.z }; }
    out.push({ pts, n, color });
  }
  return out;
}

function orientFace3(pts, ref) {
  let n = norm3(cross3(sub3(pts[1], pts[0]), sub3(pts[2], pts[0])));
  const fc = { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2, z: (pts[0].z + pts[2].z) / 2 };
  if (dot3(n, sub3(ref, fc)) < 0) { pts = pts.slice().reverse(); n = { x: -n.x, y: -n.y, z: -n.z }; }
  return { pts, n };
}

function buildFaces3() {
  const u = ppm();
  const faces = [];
  const M = p => ({ x: p.x / u, y: 0, z: p.y / u });

  // Grundriss als Textur auf der Grundebene
  if (state.planImage) {
    const w = state.planImage.w / u, h = state.planImage.h / u, y = -0.02;
    const W = state.planImage.w, H = state.planImage.h;
    faces.push({ tex: true, alpha: state.planOpacity, n: { x: 0, y: 1, z: 0 }, pts: [{ x: 0, y, z: 0 }, { x: w, y, z: 0 }, { x: w, y, z: h }], uv: [[0, 0], [W, 0], [W, H]] });
    faces.push({ tex: true, alpha: state.planOpacity, n: { x: 0, y: 1, z: 0 }, pts: [{ x: 0, y, z: 0 }, { x: w, y, z: h }, { x: 0, y, z: h }], uv: [[0, 0], [W, H], [0, H]] });
  }

  // Räume: Boden + Wände
  for (const room of state.rooms) {
    const pts = room.points.map(p => ({ x: p.x / u, y: 0.002, z: p.y / u }));
    const c = centroid(pts); c.y = 0.002;
    const col = FLOOR3D[room.floor] || '#c9c9c9';
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      faces.push({ pts: [c, a, b], n: { x: 0, y: 1, z: 0 }, color: col });
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const dx = b.x - a.x, dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 1e-6) continue;
      const nx = -dz / len, nz = dx / len;
      const t = WALL_T / 2, h = WALL_H;
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      const wall = (o) => [
        { x: a.x + nx * o, y: 0, z: a.z + nz * o },
        { x: b.x + nx * o, y: 0, z: b.z + nz * o },
        { x: b.x + nx * o, y: h, z: b.z + nz * o },
        { x: a.x + nx * o, y: h, z: a.z + nz * o },
      ];
      faces.push({ ...orientFace3(wall(t), { x: mx + nx * (t + 0.5), y: h / 2, z: mz + nz * (t + 0.5) }), color: room.wallColor });
      faces.push({ ...orientFace3(wall(-t), { x: mx - nx * (t + 0.5), y: h / 2, z: mz - nz * (t + 0.5) }), color: room.wallColor });
      const top = [
        { x: a.x + nx * t, y: h, z: a.z + nz * t },
        { x: b.x + nx * t, y: h, z: b.z + nz * t },
        { x: b.x - nx * t, y: h, z: b.z - nz * t },
        { x: a.x - nx * t, y: h, z: a.z - nz * t },
      ];
      faces.push({ ...orientFace3(top, { x: mx, y: h + 1, z: mz }), color: room.wallColor });
    }
  }

  // Möbel
  for (const item of state.items) {
    const def = CATALOG_BY_TYPE[item.type];
    if (!def || !def.parts3d) continue;
    const rot = (-item.rotation * Math.PI) / 180;
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const bx = item.x / u, bz = item.y / u;
    for (const [px, py, pz, w, h, d, col] of def.parts3d) {
      const wx = bx + px * cs + pz * sn;
      const wz = bz - px * sn + pz * cs;
      for (const f of boxFaces3(wx, py, wz, w, h, d, rot, col)) faces.push(f);
    }
  }
  return faces;
}

// Texturiertes Dreieck per affiner Abbildung (Bilddreieck → Bildschirmdreieck)
function drawTexturedTri3(ctx, img, s, uv) {
  const [p0, p1, p2] = s, [q0, q1, q2] = uv;
  const denom = (q1[0] - q0[0]) * (q2[1] - q0[1]) - (q2[0] - q0[0]) * (q1[1] - q0[1]);
  if (Math.abs(denom) < 1e-6) return;
  const a = ((p1.x - p0.x) * (q2[1] - q0[1]) - (p2.x - p0.x) * (q1[1] - q0[1])) / denom;
  const c = ((p2.x - p0.x) * (q1[0] - q0[0]) - (p1.x - p0.x) * (q2[0] - q0[0])) / denom;
  const e = p0.x - a * q0[0] - c * q0[1];
  const b = ((p1.y - p0.y) * (q2[1] - q0[1]) - (p2.y - p0.y) * (q1[1] - q0[1])) / denom;
  const d = ((p2.y - p0.y) * (q1[0] - q0[0]) - (p1.y - p0.y) * (q2[0] - q0[0])) / denom;
  const f = p0.y - b * q0[0] - d * q0[1];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = 1;
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function render3D() {
  if (!v3.active || !v3canvas) return;
  const wrap = $('canvas-wrap');
  const dpr = window.devicePixelRatio || 1;
  v3.W = wrap.clientWidth || 800;
  v3.H = wrap.clientHeight || 600;
  const pw = Math.round(v3.W * dpr), ph = Math.round(v3.H * dpr);
  if (v3canvas.width !== pw || v3canvas.height !== ph) { v3canvas.width = pw; v3canvas.height = ph; }
  v3ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  v3ctx.fillStyle = '#0f1216';
  v3ctx.fillRect(0, 0, v3.W, v3.H);

  if (state.planImage && planImgSrc !== state.planImage.dataUrl) {
    planImgSrc = state.planImage.dataUrl;
    planImg3d = new Image();
    planImg3d.onload = () => render3D();
    planImg3d.src = planImgSrc;
  }

  const b = camBasis();
  const faces = buildFaces3();
  const drawList = [];
  for (const f of faces) {
    const sp = f.pts.map(p => project3(p, b));
    if (sp.some(s => !s)) continue;
    const z = sp.reduce((s, p) => s + p.z, 0) / sp.length;
    drawList.push({ f, sp, z });
  }
  drawList.sort((a, b2) => b2.z - a.z); // hinten zuerst

  for (const { f, sp, z } of drawList) {
    const light = 0.55 + 0.45 * Math.max(0, dot3(f.n, LIGHT3));
    if (f.tex) {
      if (planImg3d && planImg3d.complete && planImg3d.naturalWidth > 0) {
        v3ctx.save();
        v3ctx.globalAlpha = f.alpha != null ? f.alpha : 0.55;
        drawTexturedTri3(v3ctx, planImg3d, sp, f.uv);
        v3ctx.restore();
        v3ctx.save();
        v3ctx.beginPath();
        v3ctx.moveTo(sp[0].x, sp[0].y); v3ctx.lineTo(sp[1].x, sp[1].y); v3ctx.lineTo(sp[2].x, sp[2].y);
        v3ctx.closePath();
        v3ctx.fillStyle = `rgba(0,0,0,${((1 - light) * 0.45).toFixed(3)})`;
        v3ctx.fill();
        v3ctx.restore();
      }
      continue;
    }
    v3ctx.beginPath();
    v3ctx.moveTo(sp[0].x, sp[0].y);
    for (let i = 1; i < sp.length; i++) v3ctx.lineTo(sp[i].x, sp[i].y);
    v3ctx.closePath();
    v3ctx.fillStyle = shade(f.color, light - 1);
    v3ctx.fill();
    v3ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    v3ctx.lineWidth = 1;
    v3ctx.stroke();
  }

  // Raumnamen in 3D
  const u = ppm();
  v3ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  v3ctx.textAlign = 'center';
  for (const room of state.rooms) {
    const c = centroid(room.points);
    const sp = project3({ x: c.x / u, y: 0.05, z: c.y / u }, b);
    if (!sp) continue;
    const area = state.pxPerMeter ? ` · ${(polygonArea(room.points) / (u * u)).toFixed(1)} m²` : '';
    v3ctx.fillStyle = 'rgba(255,255,255,0.9)';
    v3ctx.strokeStyle = 'rgba(15,18,22,0.8)';
    v3ctx.lineWidth = 3;
    v3ctx.strokeText(room.name + area, sp.x, sp.y);
    v3ctx.fillText(room.name + area, sp.x, sp.y);
  }
}

function fit3D() {
  const u = ppm();
  const pts = [];
  if (state.planImage) pts.push({ x: 0, z: 0 }, { x: state.planImage.w / u, z: state.planImage.h / u });
  for (const r of state.rooms) for (const p of r.points) pts.push({ x: p.x / u, z: p.y / u });
  for (const it of state.items) pts.push({ x: it.x / u, z: it.y / u });
  let minX = 0, minZ = 0, maxX = 10, maxZ = 8;
  if (pts.length) {
    minX = Math.min(...pts.map(p => p.x)); maxX = Math.max(...pts.map(p => p.x));
    minZ = Math.min(...pts.map(p => p.z)); maxZ = Math.max(...pts.map(p => p.z));
  }
  v3.target = { x: (minX + maxX) / 2, y: 0.8, z: (minZ + maxZ) / 2 };
  v3.dist = Math.max(maxX - minX, maxZ - minZ, 2) * 2.1 + 4;
  v3.theta = -0.7;
  v3.phi = 0.9;
}
