import {clockState,handRotation} from './clock.js';
import { buildDatejust } from './datejust.js';
import * as THREE from 'three';
import { makeEnv, makeMaterials, applyConfig } from './materials.js';
import { Registry } from './parts.js';
import { drawPrint } from './dial.js';
import { buildMovement, buildJewelsAndScrews, kin } from './movement.js';
import { buildChrono } from './chrono.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => x * x * (3 - 2 * x);
const rank = (p) => (p.cat === 'Dial' ? 1 : p.cat === 'Hands' ? 2 : p.cat === 'Bracelet' ? 5 : p.cat === 'Case' ? (p.name === 'Sapphire crystal' || p.name === 'Bezel' ? 4 : 3) : p.name.startsWith('Caseback screw') ? 3 : 0);

export async function createWatch(renderer) {
  const env = makeEnv(renderer);
  const M = makeMaterials(env);
  const R = new Registry(M);
  const printCanvas = document.createElement('canvas'); printCanvas.width = printCanvas.height = 2048;
  const cfg = { dial: 'ink', hw: 'silver', bracelet: 'silver' };
  drawPrint(printCanvas, cfg);
  buildMovement(R); buildChrono(R);
  const sourceModel=await buildDatejust(R);
  // No invented count padding. Imported exterior groups plus labelled concept mechanism.
  buildJewelsAndScrews(R, R.parts.length + 32);
  R.finalize();
  const parts = R.parts;
  const root = new THREE.Group();
  const total = parts.length;

  // assembly order and layout grid
  const order = parts.slice().sort((a, b) => rank(a) - rank(b) || a.id - b.id);
  const cols = 14, rows = Math.ceil(order.length / cols), cw = 8, ch = 8;
  order.forEach((p, i) => {
    p.order = i;
    const cx = i % cols, cy = Math.floor(i / cols);
    p.layoutPos = new THREE.Vector3((cx - (cols - 1) / 2) * cw, ((rows - 1) / 2 - cy) * ch, 0);
    p.layoutScale = Math.min(8, 6 / p.size);
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
  const setConfig = (c) => {
    Object.assign(cfg,c);applyConfig(M,cfg);sync();
    const colours={ink:'#10191b',blue:'#173b5e',silver:'#bfc6c6'};
    const metal={silver:'#c1c8cc',graphite:'#687278',champagne:'#c7ac77'};
    for(const m of meshes){const p=m.userData.part,mat=m.material;
      if(!p.imported)continue;
      if(p.name==='Dial plate'&&!mat.map){mat.color.set(colours[cfg.dial]);mat.roughness=.38;}
      if(p.name==='Dial print'){mat.color.set(cfg.dial==='silver'?'#333b3a':'#ffffff');}
      else if((!mat.map||/brush/.test(mat.name))&&!/glass/.test(mat.name)&&!/tablo/.test(mat.name))mat.color.set(metal[p.cat==='Bracelet'?cfg.bracelet:cfg.hw]);
    }
  };
  setConfig({});

  const tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), idQ = new THREE.Quaternion(), tmpP = new THREE.Vector3();
  const layerSpacing = 10.2;
  const hlCol = new THREE.Color(0xc1d4d1);
  let lastK = null;

  function update(t, S, sel, dt) {
    const k = kin(t); const wall=clockState(window.__clockOverride?new Date(window.__clockOverride):new Date());sourceModel.drawCalendar(wall); k.unfold = S.unfold; lastK = k;
    const N = order.length, W = 14;
    for (const p of parts) {
      p.pos.copy(p.pos0); p.q.copy(p.q0); p.spin.scale.set(1, 1, 1);
      if (p.anim) p.anim(t, p, k);
      // The source exterior has hands, but no supplied calibre. Animate the
      // seconds hand visually without claiming a recovered mechanical train.
      if(p.imported&&p.handBaseAngle!=null){const fraction=p.name==='Hour hand'?wall.hours/12:p.name==='Minute hand'?wall.minutes/60:wall.seconds/60;p.q.setFromAxisAngle(new THREE.Vector3(0,0,1),handRotation(p.handBaseAngle,fraction));}
      
      tmpP.copy(p.pos);
      const le=ease(clamp(S.explode*1.55-Math.abs(p.layer-3.5)*.13));
      tmpP.z+=(3.5-p.layer)*layerSpacing*le;
      if(!p.imported)tmpP.z+=(S.internalSpread||0)*(5-p.layer)*3.8;
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
      // Never put the separate concept mechanism into the supplied exterior watch.
      // It is shown only after the exterior is removed in the movement study.
      const mechanism = Math.max(S.mechanism||0, (1-S.asm));
      if(!p.imported) target=mechanism;
      // Concept calibre joins the exploded sequence in an explicitly marked
      // presentation. It is never sold as the source watch's real internals.
      if(!p.imported)target*=1-(S.hideConcept||0);
      const upper=!p.imported&&(/bridge|cock|signature|ratchet|crown wheel/i.test(p.name)||p.cat==='Fasteners'&&p.layer===5||p.cat==='Jewels');
      if(S.movementFocus==='train'&&upper)target=0;
      if(p.name==='Barrel cover'&&S.movementFocus==='train')target=0;
      if(upper&&p.cat!=='Chronograph'&&p.name!=='Chronograph support bridge'){const lift=S.bridgeLift||0;p.obj.position.z+=lift*9;p.obj.position.x+=lift*(p.pos0.x<0?-4:4);p.obj.position.y+=lift*7;if(S.hideBridges)target*=1-S.hideBridges;}
      if(p.name==='Balance cock'){p.obj.position.x-=(S.bridgeLift||0)*3;p.obj.position.y-=(S.bridgeLift||0)*10;}
      if(p.name==='Barrel cover'){p.obj.position.z+=(S.coverLift||0)*10;p.obj.position.x-=(S.coverLift||0)*10;p.obj.position.y+=(S.coverLift||0)*9;}
      if(p.cat==='Chronograph'||p.name==='Chronograph support bridge'){p.obj.position.z+=(S.bridgeLift||0)*11;p.obj.position.y+=(S.bridgeLift||0)*6;}
      if(!p.imported&&S.movementFocus==='train'&&!(p.cat==='Movement'||p.cat==='Fasteners'||p.cat==='Jewels'))target=0;
      if(p.name==='Mainplate'&&(S.movementFocus==='balance'||S.movementFocus==='chrono'))target=0;
      if(!p.imported&&S.movementFocus==='balance'&&!(p.cat==='Regulation'||p.name==='Balance cock'||p.name==='Pallet bridge'||p.name==='Mainplate'||(p.cat==='Jewels'&&p.pos0.y<-6)))target=0;
      if(!p.imported&&S.movementFocus==='chrono'&&p.cat!=='Chronograph'&&!['Mainplate','Chronograph support bridge'].includes(p.name))target=0;
      if(p.imported&&p.braceletSource&&S.unfold>0){
        // Source bracelet sections are rigid groups. Separation is honest;
        // do not pretend the closed wrist loop has per-link rigging.
        const side=/Upper|upper/.test(p.name)?1:/Lower|lower/.test(p.name)?-1:0;
        p.obj.position.y+=side*S.unfold*16;
      }
      if (p.cat === 'Dial' || p.cat === 'Hands') target = Math.min(target, 1 - S.hideDial);
      if (p.name === 'Sapphire crystal') target = Math.min(target, 1 - S.hideCrystal);
      if (p.name === 'Bezel' || p.name === 'Crystal gasket') target = Math.min(target, 1 - S.hideCrystal * 0.0);
      if (p.cat === 'Bracelet') target = Math.min(target, 1 - Math.max(S.hideShell, S.hideBr));
      else if (S.hideShell > 0 && p.cat === 'Case' && p.name !== 'Sapphire crystal') target = Math.min(target, 1 - S.hideShell);
      if (sel.mode === 'isolate' && sel.part) target = p === sel.part ? 1 : 0.04;
      if (sel.mode === 'deep' && sel.part) target = p === sel.part ? 1 : 0.0;
      // Selection is described by the inspector; never dim the entire watch on a click.
      p.state.fade = target; // Visibility scrubs exactly with geometry, without a fading backlog.
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
  return { sourceModel, root, R, M, parts, meshes, cfg, setConfig, update, total, env, get k() { return lastK; } };
}
