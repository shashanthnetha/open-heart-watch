import * as THREE from 'three';
import { lathe, ringGeometry } from './gears.js';
import { mesh, cyl } from './parts.js';
import {ctl} from './movement.js';
const NOTE = 'Concept component, drawn for this study. It is not an official Rolex part or drawing.';

export {DIAL_R,AP12,AP6,SUB3,SUB9} from './layout.js';
import {DIAL_R,AP12,AP6,SUB3,SUB9} from './layout.js';

function planarUV(g, r) { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * r) + 0.5, p.getY(i) / (2 * r) + 0.5); uv.needsUpdate = true; }

export function drawPrint(canvas, cfg) {
  const g = canvas.getContext('2d'), S = canvas.width, k = S / (2 * DIAL_R);
  g.clearRect(0, 0, S, S);
  const light = cfg.dial === 'silver';
  const ink = light ? '#15191f' : '#eef1f4';
  const dim = light ? 'rgba(21,25,31,.55)' : 'rgba(238,241,244,.55)';
  g.save(); g.translate(S / 2, S / 2); g.scale(k, -k);
  // minute track
  for (let i = 0; i < 300; i++) {
    const a = (i / 300) * Math.PI * 2, big = i % 25 === 0, mid = i % 5 === 0;
    const r1 = 16.35, r0 = big ? 15.3 : mid ? 15.65 : 15.95;
    g.strokeStyle = mid ? ink : dim; g.lineWidth = big ? 0.2 : mid ? 0.12 : 0.05;
    g.beginPath(); g.moveTo(Math.sin(a) * r0, Math.cos(a) * r0); g.lineTo(Math.sin(a) * r1, Math.cos(a) * r1); g.stroke();
  }
  g.restore();
  const T = (txt, x, y, size, color, weight = 400, ls = 0) => {
    g.save(); g.translate(S / 2 + x * k, S / 2 - y * k); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${weight} ${size * k}px "Helvetica Neue", Helvetica, Arial, sans-serif`; if ('letterSpacing' in g) g.letterSpacing = `${ls * k}px`;
    g.fillText(txt, 0, 0); g.restore();
  };
  T('ROLEX', 0, 1.9, 1.0, ink, 700, 0.25);
  T('OPEN HEART', 0, .75, 0.43, ink, 500, 0.12);
  T('CONCEPT CHRONOGRAPH', 0, -2.3, 0.35, dim, 500, 0.1);
  T('TOURBILLON  60 s', 0, -14.4, 0.42, dim, 500, 0.2);
  // subdial scales
  const sub = (S0, n, lab, rot) => {
    g.save(); g.translate(S / 2 + S0.x * k, S / 2 - S0.y * k); g.scale(k, -k);
    for (let i = 0; i < n; i++) { const a = rot[0] + (i / (n - 1)) * (rot[1] - rot[0]), big = i % 5 === 0; g.strokeStyle = big ? ink : dim; g.lineWidth = big ? 0.1 : 0.05; g.beginPath(); g.moveTo(Math.sin(a) * 3.5, Math.cos(a) * 3.5); g.lineTo(Math.sin(a) * (big ? 2.85 : 3.15), Math.cos(a) * (big ? 2.85 : 3.15)); g.stroke(); }
    g.restore();
  };
  sub(SUB3, 31, '30', [0, Math.PI * 2 * 0.97]);
  sub(SUB9, 21, 'PR', [-Math.PI * 0.62, Math.PI * 0.62]);
  T('30', SUB3.x, SUB3.y + 1.3, 0.55, ink, 600); T('MIN', SUB3.x, SUB3.y - 1.5, 0.4, dim, 500, 0.15);
  T('RESERVE', SUB9.x, SUB9.y - 1.5, 0.36, dim, 500, 0.1); T('0', SUB9.x - 2.3, SUB9.y + 0.1, 0.4, ink, 600); T('48h', SUB9.x + 2.3, SUB9.y + 0.1, 0.4, ink, 600);
}

function handGeom(len, w, tail, thick = 0.12) {
  const s = new THREE.Shape();
  s.moveTo(0, -tail); s.lineTo(w * 0.5, -tail * 0.6); s.lineTo(w * 0.5, 0); s.lineTo(w * 0.34, len * 0.78); s.lineTo(0, len); s.lineTo(-w * 0.34, len * 0.78); s.lineTo(-w * 0.5, 0); s.lineTo(-w * 0.5, -tail * 0.6); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  g.computeVertexNormals(); return g;
}

export function buildDial(R, printCanvas) {
  const M = R.M;
  R.add('Dial plate', 'Dial', 2, (g) => {
    const s = new THREE.Shape(); s.absarc(0, 0, DIAL_R, 0, Math.PI * 2, false);
    for (const a of [AP12, AP6, SUB3, SUB9]) { const h = new THREE.Path(); h.absarc(a.x, a.y, a.r, 0, Math.PI * 2, true); s.holes.push(h); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 2, curveSegments: 48 });
    planarUV(geo, DIAL_R); mesh(geo, M.dial, g, [0, 0, 0.35]);
  }, { mat: 'Brass base, sunburst lacquer', finish: 'Sunburst, clear-coated', note: 'Dial with open-heart aperture at 12, tourbillon aperture at 6 and two subdial recesses. ' + NOTE });
  // printed layer
  const pt = new THREE.CanvasTexture(printCanvas); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 8;
  R.printTex = pt;
  R.add('Dial print', 'Dial', 2, (g) => {
    const m = new THREE.MeshBasicMaterial({ map: pt, transparent: true, depthWrite: false, toneMapped: false });
    R.printMat = m;
    mesh(new THREE.PlaneGeometry(DIAL_R * 2, DIAL_R * 2), m, g, [0, 0, 0.88]);
  }, { mat: 'Pad-printed lacquer', finish: 'Matte print', note: 'Minute track, subdial scales and legends. ' + NOTE });
  // subdial inserts
  for (const [lab, S0] of [['30-minute counter', SUB3], ['power reserve', SUB9]]) {
    R.add(`Subdial insert (${lab})`, 'Dial', 2, (g) => {
      mesh(lathe([[0, 0], [S0.r - 0.05, 0], [S0.r - 0.05, 0.12], [S0.r * 0.62, 0.18], [S0.r * 0.6, 0.12], [S0.r * 0.3, 0.2], [S0.r * 0.28, 0.12], [0, 0.12]], 64), M.dialInset, g);
    }, { pos: [S0.x, S0.y, 0.1], mat: 'Brass, snailed lacquer', finish: 'Concentric snailing', note: 'Recessed subdial insert. ' + NOTE });
    R.add(`Subdial ring (${lab})`, 'Dial', 2, (g) => mesh(ringGeometry(S0.r + 0.25, S0.r - 0.02, 0.28, 0.08), M.hw, g), { pos: [S0.x, S0.y, 0.7], mat: 'Hardware tone', finish: 'Polished', note: 'Raised frame around the subdial. ' + NOTE });
  }
  R.add('Open-heart ring', 'Dial', 2, (g) => mesh(ringGeometry(AP12.r + 0.35, AP12.r - 0.02, 0.35, 0.09), M.hw, g), { pos: [AP12.x, AP12.y, 0.75], mat: 'Hardware tone', finish: 'Polished', note: 'Frame around the column-wheel aperture. ' + NOTE });
  R.add('Tourbillon ring', 'Dial', 2, (g) => mesh(ringGeometry(AP6.r + 0.35, AP6.r - 0.02, 0.35, 0.09), M.hw, g), { pos: [AP6.x, AP6.y, 0.75], mat: 'Hardware tone', finish: 'Polished', note: 'Frame around the tourbillon aperture. ' + NOTE });
  // indices
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2, r = 15.0;
    R.add(`Hour index ${i}`, 'Dial', 2, (g) => {
      const w = i === 12 ? 1.9 : 0.95, len = i % 3 === 0 ? 2.4 : 2.0;
      mesh(new THREE.BoxGeometry(w, len, 0.45), M.hw, g);
      mesh(new THREE.BoxGeometry(w * 0.45, len * 0.7, 0.1), M.lume, g, [0, 0, 0.24]);
    }, { pos: [Math.sin(a) * r, Math.cos(a) * r, 0.95], rot: [0, 0, -a], mat: 'Hardware tone with lume', finish: 'Applied, polished', note: 'Applied baton index. ' + NOTE });
  }
  // hands
  const hand = (name, len, w, tail, z, mat, anim, note) => R.add(name, 'Hands', 2, (g) => { mesh(handGeom(len, w, tail), mat, g); if(w>1){mesh(handGeom(len*.8,w*.3,0,.035),M.lume,g,[0,0,.18]);} }, { pos: [0, 0, z], mat: 'Hardware tone', finish: 'Polished, bevelled', note: note + ' ' + NOTE, anim });
  const clock = () => ({h:10+8/60,m:8});
  hand('Hour hand', 9.4, 1.9, 1.6, 1.05, M.hw, (t, p) => { p.q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -(clock().h / 12) * Math.PI * 2).multiply(p.q0); }, 'Hour hand, posed at 10:08 for the presentation.');
  hand('Minute hand', 14.2, 1.5, 1.8, 1.25, M.hw, (t, p) => { p.q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -(clock().m / 60) * Math.PI * 2).multiply(p.q0); }, 'Minute hand, posed at 10:08 for the presentation.');
  R.add('Chronograph seconds hand', 'Hands', 2, (g) => {
    const s = new THREE.Shape(); s.moveTo(-0.07, -3); s.lineTo(0.07, -3); s.lineTo(0.07, 15.6); s.lineTo(-0.07, 15.6); s.closePath();
    mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), M.hw, g);
    mesh(cyl(0.45, 0.14, 24).rotateX(Math.PI / 2), M.hw, g, [0, 0, 0.05]);
    const c = new THREE.Shape(); c.absarc(0, -2.2, 0.5, 0, 6.3); mesh(new THREE.ExtrudeGeometry(c, { depth: 0.08, bevelEnabled: false }), M.hw, g);
  }, { pos: [0, 0, 1.5], mat: 'Hardware tone', finish: 'Polished', note: 'Central chronograph seconds hand with counterweight. ' + NOTE, anim: (t, p, k) => { p.q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -((k.chrono % 60) / 60) * Math.PI * 2).multiply(p.q0); } });
  const sh = (name, S0, len, anim, note) => R.add(name, 'Hands', 2, (g) => { const s = new THREE.Shape(); s.moveTo(-0.1, -0.6); s.lineTo(0.1, -0.6); s.lineTo(0.05, len); s.lineTo(-0.05, len); s.closePath(); mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }), M.hw, g); mesh(cyl(0.24, 0.1, 20).rotateX(Math.PI / 2), M.hw, g, [0, 0, 0.04]); }, { pos: [S0.x, S0.y, 0.88], mat: 'Hardware tone', finish: 'Polished', note: note + ' ' + NOTE, anim });
  sh('30-minute counter hand', SUB3, 3.2, (t, p, k) => { p.q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -(((k.chrono / 60) % 30) / 30) * Math.PI * 2).multiply(p.q0); }, 'Counter hand for elapsed minutes.');
  sh('Power-reserve hand', SUB9, 3.0, (t, p) => { p.q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.45 + Math.PI * 0.9 * (.82)).multiply(p.q0); }, 'Indicates the (conceptual) 48 hour power reserve.');
  R.add('Hand cap', 'Hands', 2, (g) => { mesh(lathe([[0, 0], [0.9, 0], [0.9, 0.18], [0.55, 0.42], [0, 0.46]], 40), M.hw, g); }, { pos: [0, 0, 1.55], mat: 'Hardware tone', finish: 'Polished', note: 'Central cap that holds the hands. ' + NOTE });
}
