import * as THREE from 'three';

/* Gear geometry. Teeth are drawn as a smooth flank profile (narrow tip, wide root)
   so that two wheels of equal module placed at pitch-radius sum really interleave. */
export function toothOutline(N, m, steps = 3) {
  const rp = (m * N) / 2, rRoot = rp - 1.25 * m, rTip = rp + 1.0 * m;
  const pa = (Math.PI * 2) / N;
  const pts = [];
  const half = (r) => {            // half angular width of tooth at radius r
    const t = (r - rRoot) / (rTip - rRoot);
    return pa * (0.34 - 0.20 * Math.pow(t, 0.85));
  };
  for (let i = 0; i < N; i++) {
    const a0 = i * pa;
    // left flank up
    for (let k = 0; k <= steps; k++) { const r = rRoot + (rTip - rRoot) * (k / steps); const a = a0 - half(r); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    // tip arc
    const tipA = half(rTip);
    pts.push([Math.cos(a0 - tipA * 0.4) * rTip, Math.sin(a0 - tipA * 0.4) * rTip]);
    pts.push([Math.cos(a0 + tipA * 0.4) * rTip, Math.sin(a0 + tipA * 0.4) * rTip]);
    for (let k = steps; k >= 0; k--) { const r = rRoot + (rTip - rRoot) * (k / steps); const a = a0 + half(r); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    // root land
    const rootA = a0 + half(rRoot), nextA = a0 + pa - half(rRoot);
    const mid = (rootA + nextA) / 2;
    pts.push([Math.cos(mid) * rRoot, Math.sin(mid) * rRoot]);
  }
  return { pts, rp, rRoot, rTip };
}

/* opts: N, m, t (thickness), bore, spokes, hub, rim (rim width), bevel */
export function gearGeometry(o) {
  const { N, m, t = 0.3, bore = 0.25, spokes = 0, hub = null, rim = null, bevel = Math.min(0.025, t * 0.12) } = o;
  const { pts, rRoot } = toothOutline(N, m);
  const shape = new THREE.Shape();
  pts.forEach((p, i) => (i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1])));
  shape.closePath();
  if (bore > 0) { const h = new THREE.Path(); h.absarc(0, 0, bore, 0, Math.PI * 2, true); shape.holes.push(h); }
  if (spokes > 0) {
    const hubR = hub ?? Math.max(bore * 2.2, rRoot * 0.2);
    const rimIn = rRoot - (rim ?? Math.max(m * 1.6, rRoot * 0.14));
    if (rimIn > hubR + m) {
      const sw = 0.5 * (Math.PI * 2 / spokes) * 0.15; // slim manufactured spokes, not broad diagram sectors
      for (let s = 0; s < spokes; s++) {
        const a0 = (s / spokes) * Math.PI * 2 + sw, a1 = ((s + 1) / spokes) * Math.PI * 2 - sw;
        const h = new THREE.Path();
        const rr = Math.min(m * 1.2, (rimIn - hubR) * 0.35);
        h.absarc(0, 0, hubR + rr * 0.2, a0, a1, false);
        h.absarc(0, 0, rimIn, a1, a0, true);
        h.closePath();
        shape.holes.push(h);
      }
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: t - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -t / 2 + bevel);
  g.computeVertexNormals();
  return g;
}

/* Lathe helper (profile in [radius, z] pairs) */
export function lathe(profile, seg = 64) {
  const pts = profile.map(([r, z]) => new THREE.Vector2(r, z));
  const g = new THREE.LatheGeometry(pts, seg);
  g.rotateX(Math.PI / 2); // axis -> z
  g.computeVertexNormals();
  return g;
}

export function ringGeometry(rOut, rIn, h, bev = 0.15, seg = 72) {
  const s = new THREE.Shape(); s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, rIn, 0, Math.PI * 2, true); s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: seg });
  g.translate(0, 0, -h / 2 + bev); g.computeVertexNormals(); return g;
}

export function roundedPlate(w, hgt, t, r, bev = 0.05) {
  const s = new THREE.Shape(); const x = -w / 2, y = -hgt / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + hgt - r); s.quadraticCurveTo(x + w, y + hgt, x + w - r, y + hgt);
  s.lineTo(x + r, y + hgt); s.quadraticCurveTo(x, y + hgt, x, y + hgt - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: t - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -t / 2 + bev); g.computeVertexNormals(); return g;
}

/* Rotation of a wheel driven by a parent wheel so teeth interleave exactly.
   phi: angle of the line from parent centre to this wheel centre. */
export function meshedAngle(parentAngle, Np, phi, N) {
  return phi + Math.PI - Math.PI / N - (Np / N) * (parentAngle - phi);
}
