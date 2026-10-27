import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/jsm/RoundedBoxGeometry.js';
import { mesh, cyl } from './parts.js';
const NOTE = 'Concept component, drawn for this study. It is not an official Rolex part or drawing.';
const X = new THREE.Vector3(1, 0, 0);
export const BR = { y0: 28.4, pitch: 5.2, n: 11, z0: -2.2, kappa0: 1 / 32 };

/* position and tilt for a point s mm along an arm; unfold 0 (worn curl) .. 1 (laid flat) */
export function armPose(s, sign, unfold, out) {
  const k = BR.kappa0 * (1 - unfold);
  let dy, dz, psi;
  if (k < 1e-5) { dy = s; dz = 0; psi = 0; } else { psi = k * s; dy = Math.sin(psi) / k; dz = -(1 - Math.cos(psi)) / k; }
  out.pos.set(0, sign * (BR.y0 + dy), BR.z0 + dz);
  out.q.setFromAxisAngle(X, sign > 0 ? -psi : psi);
  return out;
}

export function buildBracelet(R) {
  const M = R.M;
  const rb = (w,l,t,r) => {
    const geo=new RoundedBoxGeometry(w,l,t,5,r);
    const p=geo.attributes.position;
    // Very shallow crown on each top surface, rather than a flat chrome tile.
    for(let i=0;i<p.count;i++){const z=p.getZ(i);if(z>0){const x=p.getX(i)/(w/2);p.setZ(i,z+.18*(1-x*x)*Math.min(1,z/(t*.3)));}}
    p.needsUpdate=true;geo.computeVertexNormals();return geo;
  };
  const tmp = { pos: new THREE.Vector3(), q: new THREE.Quaternion() };
  const place = (sign, s) => (t, p, k) => { armPose(s, sign, k.unfold, tmp); p.pos.copy(tmp.pos); p.q.copy(tmp.q).multiply(p.q0); };
  const tag = (sign) => (sign > 0 ? 'upper' : 'lower');
  // end links (fit between the lugs)
  for (const sign of [1, -1]) {
    R.add(`End link (${tag(sign)})`, 'Bracelet', 3.5, (g) => { mesh(rb(18.9, 6.4, 3.6, 0.6), M.bracelet, g); mesh(rb(18.9, 0.6, 3.7, 0.2), M.braceletPol, g, [0, -sign * 2.8, 0]); }, { pos: [0, sign * 25.1, BR.z0], mat: 'Stainless steel, bracelet tone', finish: 'Brushed, polished edge', note: 'Solid end link fitted to the lugs. ' + NOTE, anim: (t, p, k) => { armPose(-3.3, sign, k.unfold, tmp); p.pos.copy(tmp.pos); p.q.copy(tmp.q).multiply(p.q0); } });
    for (const xs of [-1, 1]) R.add(`Spring bar (${tag(sign)} ${xs < 0 ? 'left' : 'right'})`, 'Bracelet', 3.5, (g) => { mesh(cyl(0.45, 2.6, 16).rotateZ(Math.PI / 2), M.steelPolished, g); }, { pos: [xs * 8.8, sign * 25.8, BR.z0], mat: 'Stainless steel', finish: 'Polished', note: 'Spring bar that holds the end link in the lugs. ' + NOTE, anim: (t, p, k) => { armPose(-2.5, sign, k.unfold, tmp); p.pos.copy(tmp.pos); p.pos.x = xs * 8.9; p.q.copy(tmp.q); } });
  }
  // links
  for (const sign of [1, -1]) for (let i = 0; i < BR.n; i++) {
    const s = BR.pitch * (i + 0.5), w = 18.6 - 3.0 * (i / (BR.n - 1)), wc = w * 0.44, wo = (w - wc) / 2 - 0.12;
    R.add(`Center link ${tag(sign)} ${i + 1}`, 'Bracelet', 3.5, (g) => {
      mesh(rb(wc, BR.pitch - 0.32, 3.0, 0.72), M.braceletPol, g);
      // Single crowned centre surface. No overlapping decorative top plate.
    }, { pos: [0, sign * (BR.y0 + s), BR.z0], mat: 'Stainless steel, bracelet tone', finish: 'Polished centre, satin outer links', note: 'Flat centre link, one of a repeating three-piece set. ' + NOTE, anim: place(sign, s) });
    for (const xs of [-1, 1]) R.add(`Outer link ${tag(sign)} ${i + 1}${xs < 0 ? 'L' : 'R'}`, 'Bracelet', 3.5, (g) => { mesh(rb(wo, BR.pitch - 0.25, 3.0, 0.5), M.bracelet, g); mesh(rb(wo * 0.15, BR.pitch - 0.3, 0.1, 0.04), M.braceletPol, g, [-xs * wo * 0.36, 0, 1.52]); },
      { pos: [xs * ((wc + wo) / 2 + 0.12), sign * (BR.y0 + s), BR.z0], mat: 'Stainless steel, bracelet tone', finish: 'Brushed, polished flank', note: 'Outer link. ' + NOTE, anim: (t, p, k) => { armPose(s, sign, k.unfold, tmp); p.pos.copy(tmp.pos).add(new THREE.Vector3(xs * ((wc + wo) / 2 + 0.12), 0, 0).applyQuaternion(tmp.q)); p.pos.x = xs * ((wc + wo) / 2 + 0.12); p.q.copy(tmp.q).multiply(p.q0); } });
  }
  // clasp
  const L = BR.pitch * BR.n + 3;
  R.add('Clasp plate', 'Bracelet', 3.5, (g) => { mesh(rb(14.6, 6.5, 2.6, 0.6), M.bracelet, g); mesh(rb(9, 3.2, 0.12, 0.05), M.braceletPol, g, [0, 0, 1.3]); }, { pos: [0, BR.y0 + L, BR.z0], mat: 'Stainless steel, bracelet tone', finish: 'Brushed, polished crest area', note: 'Folding clasp plate. ' + NOTE, anim: place(1, L) });
  R.add('Clasp cover', 'Bracelet', 3.5, (g) => { mesh(rb(13.6, 5.2, 1.0, 0.4), M.braceletPol, g); }, { pos: [0, BR.y0 + L, BR.z0], mat: 'Stainless steel, bracelet tone', finish: 'Polished', note: 'Safety cover over the clasp. ' + NOTE, anim: (t, p, k) => { armPose(L, 1, k.unfold, tmp); p.pos.copy(tmp.pos); p.pos.z += 1.75 * Math.cos(0); p.q.copy(tmp.q); } });
  R.add('Clasp blade', 'Bracelet', 3.5, (g) => { mesh(rb(12.6, 8.0, 1.6, 0.4), M.bracelet, g); }, { pos: [0, -(BR.y0 + L), BR.z0], mat: 'Stainless steel, bracelet tone', finish: 'Brushed', note: 'Deployant blade that folds under the plate. ' + NOTE, anim: place(-1, L) });
  R.add('Clasp hinge pin', 'Bracelet', 3.5, (g) => mesh(cyl(0.5, 12, 16).rotateZ(Math.PI / 2), M.steelPolished, g), { pos: [0, BR.y0 + L - 3, BR.z0], mat: 'Stainless steel', finish: 'Polished', note: 'Hinge of the clasp. ' + NOTE, anim: (t, p, k) => { armPose(L - 3, 1, k.unfold, tmp); p.pos.copy(tmp.pos); p.q.copy(tmp.q); } });
}
