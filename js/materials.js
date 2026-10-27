import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/jsm/RoomEnvironment.js';

const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const tex = (c, srgb = true, rep = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

export function brushedMaps() {
  const r = rng(7);
  const bump = cv(512, 512, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const y = r() * h, l = 40 + r() * 300, x = r() * w, a = 0.05 + r() * 0.16; g.fillStyle = `rgba(${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${r() > .5 ? 255 : 0},${a})`; g.fillStyle = r() > .5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`; g.fillRect(x, y, l, 1); g.fillRect(x - w, y, l, 1); }
  });
  return { bump: tex(bump, false), rough: tex(bump, false) };
}
function sunburst(base, hi, lo, seed = 3) {
  const r = rng(seed);
  return cv(1024, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const grad = g.createConicGradient(0.6, w / 2, h / 2);
    for (let i = 0; i <= 24; i++) { grad.addColorStop(i / 24, i % 2 ? hi : lo); }
    g.globalAlpha = 0.3; g.fillStyle = grad; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    g.translate(w / 2, h / 2);
    for (let i = 0; i < 2400; i++) { const a = r() * 6.283, r0 = r() * 500, l = 20 + r() * 160; g.strokeStyle = r() > .5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * (r0 + l), Math.sin(a) * (r0 + l)); g.stroke(); }
  });
}
export function perlageMap() {
  return cv(512, 512, (g, w, h) => {
    g.fillStyle = '#b6bfc5'; g.fillRect(0, 0, w, h);
    const n = 16, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const cx = x * s + s / 2 + (y % 2) * s / 2, cy = y * s + s / 2;
      for (const ox of [-w, 0, w]) { const gr = g.createRadialGradient(cx + ox - 3, cy - 3, 1, cx + ox, cy, s * 0.62); gr.addColorStop(0, 'rgba(235,239,242,.2)'); gr.addColorStop(.55, 'rgba(180,187,192,.12)'); gr.addColorStop(1, 'rgba(125,135,142,.2)'); g.fillStyle = gr; g.beginPath(); g.arc(cx + ox, cy, s * 0.5, 0, 7); g.fill(); }
    }
  });
}
export function cotesMap() {
  return cv(512, 512, (g, w, h) => {
    for (let x = 0; x < w; x++) { const v = 0.5 + 0.5 * Math.sin((x / w) * Math.PI * 2 * 14 + (x % 3) * 0.02); const c = 178 + v * 16 | 0; g.fillStyle = `rgb(${c},${c + 3},${c + 8})`; g.fillRect(x, 0, 1, h); }
  });
}

export function makeEnv(renderer) {
  // A soft photographic cyclorama. Broad pale surfaces keep metal legible;
  // dark flags provide shape without making every front-facing link a black mirror.
  const studio = new THREE.Scene(); studio.background = new THREE.Color(0x626a70);
  const card = (x,y,z,w,h,value) => {
    const material = new THREE.MeshBasicMaterial({color:0xffffff}); material.color.multiplyScalar(value);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), material);
    m.position.set(x,y,z); m.lookAt(0,0,0); studio.add(m);
  };
  card(-45,30,60,36,120,2.2); card(55,12,45,20,110,1.7);
  card(0,75,25,120,30,1.8); card(0,-65,45,110,25,.7);
  card(0,5,-70,120,100,.8); card(-75,-10,-15,30,130,.07);
  card(80,-10,-20,25,140,.10);
  // Front-facing flags break a sterile uniform white into shaped reflections.
  card(-17,-4,85,8,120,.14); card(35,0,85,11,120,.24); card(0,0,88,20,120,.65);
  const pm = new THREE.PMREMGenerator(renderer);
  const result = pm.fromScene(studio,.025,1,300).texture;
  studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
  pm.dispose(); return result;
}

export const DIALS = {
  ink: { name: 'Ink', base: '#090c10', hi: '#222b37', lo: '#040506', hw: 'silver', ui: '#10151c' },
  blue: { name: 'Blue', base: '#102842', hi: '#355d7a', lo: '#0a1c46', hw: 'graphite', ui: '#173a82' },
  silver: { name: 'Silver', base: '#c8ccd2', hi: '#f2f4f6', lo: '#a2a8b0', hw: 'champagne', ui: '#c8ccd2' },
};
export const HARDWARE = {
  silver: { name: 'Silver', color: '#bfc7cd', metal: 1, rough: 0.24, ui: '#d9dde2' },
  graphite: { name: 'Graphite', color: '#3f4348', metal: 1, rough: 0.22, ui: '#3f4348' },
  champagne: { name: 'Champagne', color: '#d8bf93', metal: 1, rough: 0.17, ui: '#d8bf93' },
};

export function makeMaterials(env) {
  const bm = brushedMaps();
  const M = {};
  const phys = (o) => new THREE.MeshPhysicalMaterial({ envMap: env, envMapIntensity: 1.1, ...o });
  M.steelPolished = phys({ color: 0xb7bec4, metalness: 1, roughness: 0.23, envMapIntensity: 1.0 });
  M.steelBrushed = phys({ color: 0xb0b7bc, envMapIntensity: 0.85, metalness: 1, roughness: 0.34, bumpMap: bm.bump, bumpScale: 0.0008, roughnessMap: bm.rough });
  M.steelDark = phys({ color: 0x23272d, metalness: 1, roughness: 0.28 });
  M.silverBridge = phys({ color: 0x8b918c, bumpMap:bm.bump,bumpScale:.0015,metalness:1,roughness:.43 });
  M.silverPerlage = phys({ color: 0xa3a8a5, map: tex(perlageMap(), true, 4), metalness: .85, roughness: .45 });
  M.silverGear = phys({ color: 0xa38d61, metalness: 1, roughness: .3 });
  M.barrelSatin=phys({color:0x969e9f,metalness:1,roughness:.46,bumpMap:bm.bump,bumpScale:.0003});
  M.balanceGold = phys({color:0xb59761,metalness:1,roughness:.26});
  M.gearGold = phys({ color: 0xa88b4d, metalness: 1, roughness: .3 });
  M.blued = phys({ color: 0x1d3a8a, metalness: 0.9, roughness: 0.22 });
  M.ruby = phys({ color: 0x7a1238, metalness: 0.0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.77, emissive: 0x3a0008, emissiveIntensity: 0 });
  M.sapphire = phys({ color: 0xffffff, metalness: 0, roughness: 0.0, transparent: true, opacity: 0.08, clearcoat: 1, clearcoatRoughness: 0, ior: 1.77, envMapIntensity: 0.6, depthWrite: false, side: THREE.DoubleSide });
  M.ceramic = phys({ color: 0x080b0e, metalness: 0.0, roughness: 0.34, clearcoat: .45, clearcoatRoughness: .3 });
  M.engraving = new THREE.MeshBasicMaterial({color: 0xcbd0cf, transparent:true, depthWrite:false});
  M.rubber = phys({ color: 0x15171a, metalness: 0, roughness: 0.7 });
  M.lume = phys({ color: 0xe9f6e1, metalness: 0, roughness: 0.5, emissive: 0x7ee0a0, emissiveIntensity: 0.12 });
  // dial
  M.dial = phys({ color: 0xffffff, metalness: 0.1, roughness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 0.3, side: THREE.DoubleSide });
  M.dialRing = phys({ color: 0xffffff, metalness: 0.55, roughness: 0.34, clearcoat: 0.8 });
  M.dialInset = phys({ color: 0xffffff, metalness: 0.2, roughness: 0.5, clearcoat: 0.7, envMapIntensity: 0.6 });
  // hardware family (recoloured by configurator)
  M.hw = phys({ color: 0xd9dde2, metalness: 1, roughness: 0.24, envMapIntensity: 1.0 });
  M.hwBrushed = phys({ color: 0xd9dde2, metalness: 1, roughness: 0.36, bumpMap: bm.bump, bumpScale: 0.0008 });
  M.bracelet = phys({ color: 0xd9dde2, metalness: 1, roughness: 0.34, bumpMap: bm.bump, bumpScale: 0.0008 });
  M.braceletPol = phys({ color: 0xd9dde2, metalness: 1, roughness: 0.14 });
  M.printWhite = phys({ color: 0xf4f6f8, metalness: 0.1, roughness: 0.5 });
  M.printDark = phys({ color: 0x1b1f24, metalness: 0.1, roughness: 0.5 });
  M.highlight = new THREE.Color(0xffc15a);
  return M;
}

const dialTexCache = {};
export function applyConfig(M, cfg) {
  const d = DIALS[cfg.dial];
  if (!dialTexCache[cfg.dial]) dialTexCache[cfg.dial] = tex(sunburst(d.base, d.hi, d.lo, cfg.dial.length + 2), true);
  M.dial.map = dialTexCache[cfg.dial]; M.dial.needsUpdate = true;
  const dk = cfg.dial === 'ink' ? 0.7 : cfg.dial === 'blue' ? 0.8 : 1; M.dial.color.setScalar(dk); M.dial.clearcoat = cfg.dial === 'silver' ? 0.5 : 0.12; M.dial.roughness = cfg.dial === 'silver' ? 0.5 : 0.48; M.dial.envMapIntensity = cfg.dial === 'ink' ? 0.35 : 1;
  M.dialRing.map = dialTexCache[cfg.dial];
  M.dialInset.map = dialTexCache[cfg.dial];
  M.dialInset.color.set(cfg.dial === 'silver' ? 0xdadde2 : 0xb8bfcc);
  const light = cfg.dial === 'silver';
  M.printWhite.color.set(light ? 0x1b1f24 : 0xf4f6f8);
  const hw = HARDWARE[cfg.hw], br = HARDWARE[cfg.bracelet];
  for (const k of ['hw', 'hwBrushed']) { M[k].color.set(hw.color); M[k].roughness = k === 'hw' ? hw.rough : 0.36; }
  for (const k of ['bracelet', 'braceletPol']) { M[k].color.set(br.color); }
}
