import * as THREE from 'three';
import { makeEnv, makeMaterials, applyConfig } from './materials.js';
import { Registry } from './parts.js';
import { buildShell } from './shell.js';
import { buildDial, drawPrint } from './dial.js';
import { buildMovement, buildJewelsAndScrews, kin } from './movement.js';
import { buildChrono } from './chrono.js';
import { buildBracelet } from './bracelet.js';

export const UNITS = 359;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => x * x * (3 - 2 * x);
const rank = (p) => (p.cat === 'Dial' ? 1 : p.cat === 'Hands' ? 2 : p.cat === 'Bracelet' ? 5 : p.cat === 'Case' ? (p.name === 'Sapphire crystal' || p.name === 'Bezel' ? 4 : 3) : p.name.startsWith('Caseback screw') ? 3 : 0);

export function createWatch(renderer) {
  const env = makeEnv(renderer);
  const M = makeMaterials(env);
  const R = new Registry(M);
  const printCanvas = document.createElement('canvas'); printCanvas.width = printCanvas.height = 2048;
  const cfg = { dial: 'ink', hw: 'silver', bracelet: 'silver' };
  drawPrint(printCanvas, cfg);
  buildMovement(R); buildChrono(R); buildShell(R); buildDial(R, printCanvas); buildBracelet(R);
  buildJewelsAndScrews(R, UNITS);
  R.finalize();
  const parts = R.parts;
  const root = new THREE.Group();
  const total = parts.length;

  // assembly order and layout grid
  const order = parts.slice().sort((a, b) => rank(a) - rank(b) || a.id - b.id);
  const cols = 23, rows = Math.ceil(total / cols), cw = 4.6, ch = 4.8;
  order.forEach((p, i) => {
    p.order = i;
    const cx = i % cols, cy = Math.floor(i / cols);
    p.layoutPos = new THREE.Vector3((cx - (cols - 1) / 2) * cw, ((rows - 1) / 2 - cy) * ch, 0);
    p.layoutScale = Math.min(9, 3.4 / p.size);
    // centre the part's own geometry on its cell
    p.layoutOffset = p.center ? p.center.clone() : new THREE.Vector3();
  });

  // own material per mesh so fades and highlights are independent
  const meshes = [];
  for (const p of parts) {
    p.obj.traverse((m) => {
      if (!m.isMesh) return;
      m.userData.baseMat = m.material;
      m.material = m.material.clone();
      m.userData.emis = m.material.emissive ? m.material.emissive.clone() : null;
      m.userData.emisI = m.material.emissiveIntensity ?? 1;
      m.userData.envI = m.material.envMapIntensity ?? 1;
      m.userData.baseOpacity = m.material.opacity;
      m.userData.baseTransparent = m.material.transparent;
      m.userData.baseDepthWrite = m.material.depthWrite;
      meshes.push(m);
    });
    root.add(p.obj);
  }
  const sync = () => {
    for (const m of meshes) {
      const b = m.userData.baseMat, mm = m.material;
      if (mm.color && b.color) mm.color.copy(b.color);
      if ('roughness' in b) mm.roughness = b.roughness;
      if ('clearcoat' in b) mm.clearcoat = b.clearcoat;
      if (mm.map !== b.map) { mm.map = b.map; mm.needsUpdate = true; }
    }
  };
  const setConfig = (c) => { Object.assign(cfg, c); applyConfig(M, cfg); drawPrint(printCanvas, cfg); R.printTex.needsUpdate = true; sync(); };
  setConfig({});

  const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), idQ = new THREE.Quaternion(), tmpP = new THREE.Vector3();
  const layerSpacing = 10.2;
  const hlCol = new THREE.Color(0xc1d4d1);
  let lastK = null;

  function update(t, S, sel, dt) {
    const k = kin(t); k.unfold = S.unfold; lastK = k;
    const N = total, W = 30;
    for (const p of parts) {
      p.pos.copy(p.pos0); p.q.copy(p.q0); p.spin.scale.set(1, 1, 1);
      if (p.anim) p.anim(t, p, k);
      tmpP.copy(p.pos);
      const le=ease(clamp(S.explode*1.55-Math.abs(p.layer-3.5)*.13));
      tmpP.z+=(3.5-p.layer)*layerSpacing*le;
      // Fan the stack slightly in the transverse plane, preserving each layer's engineering alignment.
      tmpP.x+=Math.sin((p.layer-3.5)*.42)*3.4*le;
      tmpP.y+=Math.cos((p.layer-3.5)*.42)*1.2*le;
      const e = S.asm >= 1 ? 1 : S.asm <= 0 ? 0 : ease(clamp((S.asm * (N + W) - p.order) / W));
      if (e < 1) {
        tmpV.copy(p.layoutOffset).multiplyScalar(p.layoutScale);
        tmpV.negate().add(p.layoutPos);
        tmpP.lerp(tmpV, 1 - e);
        tmpP.z += Math.sin(Math.PI * e) * (20+Math.sin(p.order*2.4)*8);
        tmpP.x += Math.sin(Math.PI*e)*Math.sin(p.order*.62)*11;
        tmpP.y += Math.sin(Math.PI*e)*Math.cos(p.order*.62)*7;
        p.q.slerp(idQ, 1 - e);
        p.obj.scale.setScalar(THREE.MathUtils.lerp(p.layoutScale, 1, e));
      } else p.obj.scale.setScalar(1);
      p.obj.position.copy(tmpP); p.obj.quaternion.copy(p.q);
      // visibility targets
      let target = 1;
      if (p.cat === 'Dial' || p.cat === 'Hands') target = Math.min(target, 1 - S.hideDial);
      if (p.name === 'Sapphire crystal') target = Math.min(target, 1 - S.hideCrystal);
      if (p.name === 'Bezel' || p.name === 'Crystal gasket') target = Math.min(target, 1 - S.hideCrystal * 0.0);
      if (p.cat === 'Bracelet') target = Math.min(target, 1 - Math.max(S.hideShell, S.hideBr));
      else if (S.hideShell > 0 && p.cat === 'Case' && p.name !== 'Sapphire crystal') target = Math.min(target, 1 - S.hideShell);
      if (sel.mode === 'isolate' && sel.part) target = p === sel.part ? 1 : 0.04;
      if (sel.mode === 'deep' && sel.part) target = p === sel.part ? 1 : 0.0;
      // Selection is described by the inspector; never dim the entire watch on a click.
      p.state.fade += (target - p.state.fade) * (1-Math.exp(-dt*9));
      if (S.snap) { p.state.fade = target; }
      const hl = (sel.part === p ? 1 : 0) * 0.55 + (sel.hover === p ? 0.8 : 0);
      p.state.hl += (hl - p.state.hl) * (1-Math.exp(-dt*12));
    }
    for (const m of meshes) {
      const p = m.userData.part, f = p.state.fade, mt = m.material;
      const op = m.userData.baseOpacity * f;
      const tr = f < 0.995 || m.userData.baseTransparent;
      mt.envMapIntensity = m.userData.envI;
      if (mt.opacity !== op) mt.opacity = op;
      if (mt.transparent !== tr) { mt.transparent = tr; }
      mt.depthWrite = f > 0.5 && m.userData.baseDepthWrite;
      m.visible = f > 0.01;
      if (m.userData.emis) { mt.emissive.copy(m.userData.emis); mt.emissiveIntensity = m.userData.emisI; /* Preserve material identity on hover and selection. */ }
    }
  }
  return { root, R, M, parts, meshes, cfg, setConfig, update, total, env, get k() { return lastK; } };
}
