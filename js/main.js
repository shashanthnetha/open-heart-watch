import * as THREE from 'three';
import { createWatch } from './watch.js';
import { CHAPTERS, STUDIES, sample } from './timeline.js';
import { DIALS, HARDWARE } from './materials.js';
import { ctl,chronoAction } from './movement.js';

const $ = (id) => document.getElementById(id);
const qs = new URLSearchParams(location.search);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(qs.has('clock'))window.__clockOverride=qs.get('clock');
const FIX = qs.has('p') ? parseFloat(qs.get('p')) : null;      // fixed progress for stills / testing
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: qs.has('shot') });
// Phones: lower render resolution cap and adapt it to measured frame time. Desktop keeps 1.5.
const coarse = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
let pixelRatio = Math.min(devicePixelRatio, coarse ? 1.25 : 1.5);
renderer.setPixelRatio(pixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 900);
const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(40, 60, 90); scene.add(key); const ambient=new THREE.AmbientLight(0xffffff,1.1);scene.add(ambient);const fill=new THREE.DirectionalLight(0xf1f5ee,1.2);fill.position.set(0,0,70);scene.add(fill);
const rim = new THREE.DirectionalLight(0xbcd0ff, 0.8); rim.position.set(-60, 20, -40); scene.add(rim);
const spot = new THREE.SpotLight(0xffd9a0, 0, 260, 0.35, 0.6, 1); spot.position.set(20, 50, 80); scene.add(spot, spot.target);

let watch;
try { watch = await createWatch(renderer); }
catch(error){$('pct').textContent='Model could not load. Run npm ci, then npm run dev. Reload after the local server starts.';console.error(error);throw error; }
scene.add(watch.root);
window.__readyModel=true;
scene.environment = watch.env;
if (qs.has('count')) console.log('UNITS', watch.total);

// ---------- sizing ----------
let aspect = 1;
function resize() { const w = innerWidth, h = innerHeight; renderer.setPixelRatio(pixelRatio); renderer.setSize(w, h, false); aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------- UI build ----------
const rail = $('rail'), idxList = $('idxList');
CHAPTERS.forEach((c, i) => {
  const b = document.createElement('button'); b.title = c.title; b.setAttribute('aria-label', c.n+' '+c.title); b.innerHTML='<span>'+c.n+'</span>'; b.onclick = () => goTo(i); rail.appendChild(b);
  const li = document.createElement('li'); li.innerHTML = `<button><small>${c.n}</small>${c.title}</button>`; li.firstChild.onclick = () => { $('index').classList.remove('show'); goTo(i); }; idxList.appendChild(li);
});
$('indexBtn').onclick = () => $('index').classList.add('show');
$('idxClose').onclick = () => $('index').classList.remove('show');

const cfg = watch.cfg;
const swatch = { ink: 'linear-gradient(135deg,#2b3441,#07090c)', blue: 'linear-gradient(135deg,#3568c4,#0a1c46)', silver: 'linear-gradient(135deg,#f6f7f8,#a2a8b0)', silverH: 'linear-gradient(135deg,#fff,#aeb4bb)', graphite: 'linear-gradient(135deg,#6b7076,#2a2d31)', champagne: 'linear-gradient(135deg,#f3e2bd,#bd9d68)' };
function buildOpts(k, set) {
  const el = document.querySelector(`.opts[data-k=${k}]`); el.innerHTML = '';
  for (const id of Object.keys(set)) { const b = document.createElement('button'); b.dataset.id = id; b.innerHTML = `<i style="background:${k === 'dial' ? swatch[id] : id === 'silver' ? swatch.silverH : swatch[id]}"></i>${set[id].name}`; b.onclick = () => choose(k, id); el.appendChild(b); }
}
buildOpts('dial', DIALS); buildOpts('hw', HARDWARE); buildOpts('bracelet', HARDWARE);
function choose(k, id) {
  const sync = $('sync').checked, c = { ...cfg, [k]: id };
  if (sync) { if (k === 'dial') { c.hw = DIALS[id].hw; c.bracelet = DIALS[id].hw; } else if (k === 'hw') c.bracelet = id; else if (k === 'bracelet') c.hw = id; }
  watch.setConfig(c); refreshOpts();
}
function refreshOpts() {
  for (const k of ['dial', 'hw', 'bracelet']) document.querySelectorAll(`.opts[data-k=${k}] button`).forEach((b) => b.classList.toggle('on', b.dataset.id === cfg[k]));
  $('colorTxt').textContent = `${DIALS[cfg.dial].name} dial \u00b7 ${HARDWARE[cfg.hw].name} hardware \u00b7 ${HARDWARE[cfg.bracelet].name} bracelet`;
}
if (qs.has('cfg')) { const [d, h, b] = qs.get('cfg').split(','); watch.setConfig({ ...cfg, dial: d, hw: h, bracelet: b }); refreshOpts(); }
$('sync').onchange = () => { if ($('sync').checked) choose('dial', cfg.dial); };
refreshOpts();

// ---------- scroll / progress ----------
const scroller = $('scroller');
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
const pFromScroll = () => (scrollY / Math.max(1, maxScroll())) * 9;
let Pcur = FIX ?? 0, Ptar = Pcur;
// Native scroll is the playhead. No queued destination, velocity or inertia.
const paced = {reset(value){Pcur=value;return value;}};
const CHAPTER_STOPS=[0,1.65,2.45,3.65,4.55,5.78,6.55,7.38,8.12];
let auto = false, preciseScroll=true;
function setScrollP(P) { scrollTo(0, (clamp(P, 0, 9) / 9) * maxScroll()); }
function goTo(i) { stopAuto();clearSel(); flyTo(CHAPTER_STOPS[i]); }
let fly = null;
function flyTo(P) { if(reduced){setScrollP(P);return;}fly={from:pFromScroll(),to:P,t0:performance.now(),dur:620}; }
function stopAuto(){auto=false;document.body.classList.remove('playing');$('play').querySelector('span').textContent='Play';}
function interrupt(){fly=null;stopAuto();}
addEventListener('wheel',e=>{
  interrupt();
  if(!preciseScroll||e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  if(e.target.closest('input,select,.parts,.inspector,.index,dialog,.config,.movement-tools')||(sel.mode==='deep'&&sel.part))return;
  e.preventDefault();
  const px=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  // Compress only the incoming impulse. Never store wheel distance to play later.
  const limit=Math.min(180,innerHeight*.22);
  const delta=Math.sign(px)*limit*Math.tanh(Math.abs(px)/limit);
  scrollTo(0,scrollY+delta);
},{passive:false});
$('scrollMode').onclick=()=>{preciseScroll=!preciseScroll;$('scrollMode').textContent=preciseScroll?'Scroll: precise':'Scroll: native';$('scrollMode').setAttribute('aria-pressed',String(preciseScroll));};
addEventListener('touchstart', interrupt, { passive: true });
addEventListener('pointerdown',e=>{if(e.clientX>=innerWidth-18)interrupt();},{passive:true});
addEventListener('keydown', (e) => {
  if(e.target.matches('input,select,textarea')||$('about').open)return;
  const P=pFromScroll(); if(e.key!==' ')interrupt();
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(8, Math.floor(P)+1)); }
  else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.max(0, Math.floor(P)-1)); }
  else if (e.key === ' ' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); toggleAuto(); }
  else if(e.key==='Home'){e.preventDefault();flyTo(0);}
  else if(e.key==='End'){e.preventDefault();flyTo(9);}
  else if (e.key === 'Escape') { clearSel(); $('index').classList.remove('show'); $('parts').classList.remove('show'); }
});
function toggleAuto() { auto = !auto; document.body.classList.toggle('playing', auto); $('play').querySelector('span').textContent = auto ? 'Pause' : 'Play'; if (auto && Pcur > 8.9) { setScrollP(0); paced.reset(0); Pcur=0; } }
$('play').onclick = ()=>{fly=null;toggleAuto();};
$('scrub').oninput=e=>{interrupt();setScrollP(Number(e.target.value));};

// ---------- selection / inspect ----------
const sel = { mode: 'highlight', part: null, hover: null, dim: false };
function clearHover(){sel.hover=null;$('tip').style.opacity=0;canvas.style.cursor='default';}
canvas.addEventListener('pointerleave',clearHover);addEventListener('scroll',clearHover,{passive:true});
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(-9, -9);
let ptr = { x: 0, y: 0, down: false, moved: 0 };
const deepOrbit = { yaw: 0.5, pitch: 0.3, dist: 0 };
const MOTION = { 'Balance wheel': 'Oscillates at 2.5 Hz (5 beats a second).', 'Hairspring': 'Breathes in and out at 2.5 Hz.', 'Pallet fork': 'Rocks at 2.5 Hz.', 'Escape wheel': 'Five prescribed half-tooth releases per second; contact locking is not simulated.', 'Column wheel': 'Steps one pillar per pusher press.' };
document.querySelectorAll('.dock [data-m]').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
function pick(e) {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(watch.root.children, true);
  for (const h of hits) { const p = h.object.userData.part; if (p && !/crystal|magnifier/i.test(p.name) && p.state.fade > 0.3 && h.object.visible && !(h.object.material.opacity < 0.3)) return p; }
  return null;
}
canvas.addEventListener('pointermove', (e) => {
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y; ptr.x = e.clientX; ptr.y = e.clientY;
  if (ptr.down) { ptr.moved += Math.abs(dx) + Math.abs(dy); if (sel.mode === 'deep' && sel.part) { canvas.style.touchAction='none'; deepOrbit.yaw -= dx * 0.008; deepOrbit.pitch = clamp(deepOrbit.pitch + dy * 0.008, -1.4, 1.4); } }
  else { const p = e.pointerType === 'mouse' ? pick(e) : null; sel.hover = p; const t = $('tip'); t.style.opacity = p ? 1 : 0; if (p) { t.textContent = p.name; t.style.left = Math.min(innerWidth-150,e.clientX) + 'px'; t.style.top = Math.min(innerHeight-60,e.clientY) + 'px'; } canvas.style.cursor = p ? 'pointer' : 'default'; }
});
canvas.addEventListener('pointerdown', (e) => { if(sel.mode==='deep'&&sel.part)canvas.setPointerCapture(e.pointerId);ptr.down = true; ptr.moved = 0; ptr.x = e.clientX; ptr.y = e.clientY; });
canvas.addEventListener('pointercancel',()=>{ptr.down=false;});
addEventListener('pointerup', (e) => { if (!ptr.down) return; ptr.down = false; if (ptr.moved < 6 && e.target === canvas) { const p = pick(e); if (p) selectPart(p); else if (sel.mode !== 'deep') clearSel(); } });
canvas.addEventListener('wheel', (e) => { if (sel.mode === 'deep' && sel.part) { deepOrbit.dist = clamp(deepOrbit.dist * (1 + e.deltaY * 0.001), sel.part.size * 1.3, 140); } if (sel.mode === 'deep' && sel.part) e.preventDefault(); }, { passive: false });
function selectPart(p) {
  if (p.name.startsWith('Pusher cap')) chronoAction(p.name.includes('4 o')?'reset':'toggle');
  $('tip').style.opacity = 0; sel.part = p; { const bx = new THREE.Box3().setFromObject(p.obj), sz = bx.getSize(new THREE.Vector3()).length(); deepOrbit.dist = Math.max(sz * 2.4, 14); } renderInspector();
}
function clearSel() { sel.part = null;sel.mode='highlight';canvas.style.touchAction='pan-y';document.querySelectorAll('.dock [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m==='highlight'));$('inspector').classList.remove('show'); }
function renderInspector() {
  const p = sel.part, el = $('inspector'); if (!p) return;
  const hint = sel.mode === 'deep' ? 'Drag to orbit, scroll to zoom.' : sel.mode === 'isolate' ? 'Everything else is dimmed.' : 'Select parts without changing their materials.';
  el.innerHTML = `<div class="cat">${p.cat} \u00b7 layer ${Math.round(p.layer)} \u00b7 unit ${p.order + 1} of ${watch.total}</div><h4>${p.name}</h4><dl><dt>Material</dt><dd>${p.mat || '-'}</dd><dt>Finish</dt><dd>${p.finish || '-'}</dd><dt>Size</dt><dd>${p.dims}</dd>${MOTION[p.name] ? `<dt>Motion</dt><dd>${MOTION[p.name]}</dd>` : ''}</dl><p>${p.note}</p><p style="margin-top:8px">${hint}</p><div class="row"><button id="iso">${sel.mode === 'isolate' ? 'Show all' : 'Isolate'}</button><button id="deepb">${sel.mode === 'deep' ? 'Exit deep' : 'Deep inspect'}</button><button id="clr">Close</button></div>`;
  el.classList.add('show');
  $('iso').onclick = () => setMode(sel.mode === 'isolate' ? 'highlight' : 'isolate'); $('deepb').onclick = () => setMode(sel.mode === 'deep' ? 'highlight' : 'deep'); $('clr').onclick = () => { setMode('highlight'); clearSel(); };
}
function setMode(m) { sel.mode = m; canvas.style.touchAction=m==='deep'?'none':'pan-y'; document.querySelectorAll('.dock [data-m]').forEach((x) => x.classList.toggle('on', x.dataset.m === m)); renderInspector(); }
$('partsBtn').onclick = () => $('parts').classList.toggle('show');
function fillParts(q = '') {
  const l = $('plist'); l.innerHTML = '';
  watch.parts.slice().sort((a, b) => a.order - b.order).filter((p) => !q || (p.name + p.cat).toLowerCase().includes(q)).forEach((p) => { const b = document.createElement('button'); b.innerHTML = `${p.name}<span>${p.cat}</span>`; b.onclick = () => { selectPart(p); }; b.onmouseenter = () => sel.hover = p; b.onmouseleave = () => sel.hover = null; l.appendChild(b); });
}
$('pq').oninput = (e) => fillParts(e.target.value.trim().toLowerCase()); fillParts(); $('partCount').textContent = watch.total; $('pq').placeholder='Search exterior and concept parts';

// ---------- loop ----------
$('startChrono').onclick=()=>chronoAction('toggle');$('resetChrono').onclick=()=>chronoAction('reset');
$('aboutBtn').onclick=()=>$('about').showModal();$('aboutClose').onclick=()=>$('about').close();
let mechanismTime=0,mechanismRunning=true,mechanismSpeed=1,movementFocus='all';
const FOCUS_DETAIL={all:'Enclosed barrel → wheel train → escapement → fixed balance. Chapter 04 lifts the upper bridges and barrel cover. Motion is prescribed, not a torque simulation.',train:'The barrel supplies the train. Meshed wheel and pinion ratios drive opposite rotations. Gold wheels, steel pinions and ruby bearings remain distinct.',balance:'A fixed balance oscillates at 2.5 Hz over its ruby bearing. The escape wheel advances in short prescribed releases while the blued hairspring breathes. Playback speed changes viewing speed, not the stated rate.',chrono:'Start couples the stopwatch. Stop holds elapsed time. Reset is available only when stopped. The column wheel and illustrative clutch respond to the controls.'};
document.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>{movementFocus=b.dataset.focus;document.querySelectorAll('[data-focus]').forEach(x=>x.classList.toggle('on',x===b));$('mechanismDetail').textContent=FOCUS_DETAIL[movementFocus];});
$('mechanismPause').onclick=()=>{mechanismRunning=!mechanismRunning;$('mechanismPause').textContent=mechanismRunning?'Pause':'Resume';};$('mechanismSpeed').onchange=e=>mechanismSpeed=Number(e.target.value);
const S = {}, camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), tv = new THREE.Vector3();
let t0 = performance.now(), prev = t0, lastCh = -1, lastStudy = -2;
const bgL = new THREE.Color('#f5f3ed'), bgL2 = new THREE.Color('#d9dedb'), bgD = new THREE.Color('#dce3df'), bgD2 = new THREE.Color('#b7c4be'), c1 = new THREE.Color(), c2 = new THREE.Color();
let ready = false;
addEventListener('visibilitychange',()=>{if(!document.hidden)prev=performance.now();});

let slowEma = 0.016, slowFrames = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dtr = Math.max(0, (now - prev) / 1000), dt = dtr; prev = now;
  if (coarse && FIX == null && ready && dtr > 0 && dtr < 0.25) {
    slowEma += (dtr - slowEma) * 0.08;
    if (slowEma > 0.030 && pixelRatio > 0.8) { if (++slowFrames > 45) { pixelRatio = Math.max(0.75, pixelRatio - 0.15); slowFrames = 0; slowEma = 0.022; resize(); } }
    else slowFrames = 0;
  }
  if(mechanismRunning)mechanismTime+=Math.min(dtr,.25)*mechanismSpeed;
  const tsec = FIX != null && qs.has('t') ? parseFloat(qs.get('t')) : mechanismTime;
  // progress
  if (FIX == null) {
    if (fly) { const u = clamp((now - fly.t0) / fly.dur); const e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; setScrollP(fly.from + (fly.to - fly.from) * e); if (u >= 1) fly = null; }
    else if (auto) { setScrollP(pFromScroll() + dtr / 6.5); if (pFromScroll() >= 8.999) { auto = false; document.body.classList.remove('playing'); $('play').querySelector('span').textContent = 'Play'; } }
    Pcur = Ptar = pFromScroll();
  } else Pcur = Ptar = FIX;
  sample(Pcur, S);
  // Keep the conceptual study separate during its entry/exit crossfade.
  if(Pcur>=2&&Pcur<=4.02){S.hideDial=1;S.hideCrystal=1;S.hideShell=1;S.hideBr=1;}
  // Sequential exit fade: never superimpose the separate concept on the source dial.
  if(Pcur>4.02&&Pcur<4.12){const u=(Pcur-4.02)/.10;S.mechanism=Math.max(0,1-u*2);S.hideDial=S.hideCrystal=S.hideShell=S.hideBr=1-Math.max(0,u*2-1);}
  const inMechanism=Pcur>=2.16&&Pcur<=2.92;const inConstruction=Pcur>=3.08&&Pcur<=4.02;document.body.classList.toggle('constructionOn',inConstruction);
  if(inMechanism){
    S.hideDial=1;S.hideCrystal=1;S.hideShell=1;S.hideBr=1;S.mechanism=1;S.explode=0;
    S.cam=[0,1,103];S.tgt=[0,0,-1];S.rot=[-.24,.08,0];
    S.internalSpread=Number($('layers').value)*.4;S.hideBridges=$('openBridges').checked?1:0;S.movementFocus=movementFocus;
    if(movementFocus==='train'){S.cam=[-1,-1,108];S.tgt=[-1,-1,-1];S.rot=[-.35,.1,0];}
    else if(movementFocus==='balance'){S.cam=[-3.8,-8.4,52];S.tgt=[-3.8,-8.4,.3];S.rot=[-.18,.06,0];}
    else if(movementFocus==='chrono'){S.cam=[0,9,62];S.tgt=[0,8.5,1.3];S.rot=[-.2,.05,0];}
  }else{S.hideBridges=0;S.movementFocus='all';}
  // camera
  const dm = aspect <= 1.3 ? Math.max(1.12,((inMechanism||inConstruction)?.80:1.05)/aspect) : 1;
  camTgt.set(...S.tgt); camPos.set(S.cam[0], S.cam[1], S.cam[2]);
  camPos.sub(camTgt).multiplyScalar(dm).add(camTgt);
  const rz = aspect < 1.15 ? S.rot[2] * 0 : S.rot[2];
  watch.root.rotation.set(S.rot[0], S.rot[1], rz);
  // layout chapter of the strip: on portrait keep the bracelet vertical
  let deep = sel.mode === 'deep' && sel.part;document.body.classList.toggle('deepOn',!!deep);
  if (deep) {
    watch.root.updateMatrixWorld(true);
    sel.part.obj.updateMatrixWorld(true); const wc = new THREE.Box3().setFromObject(sel.part.obj).getCenter(new THREE.Vector3());
    camTgt.copy(wc); camPos.set(Math.cos(deepOrbit.pitch) * Math.sin(deepOrbit.yaw), Math.sin(deepOrbit.pitch), Math.cos(deepOrbit.pitch) * Math.cos(deepOrbit.yaw)).multiplyScalar(deepOrbit.dist).add(camTgt);
  }
  const k = deep ? 0.07 : 0.2;
  const kd = 1 - Math.exp(-dtr * 12);
  camera.position.lerp(camPos, ready ? ((deep || inMechanism) ? kd : 1) : 1);
  tv.copy(camTgt); if (!camera.userData.t) camera.userData.t = tv.clone(); camera.userData.t.lerp(tv, (deep || inMechanism) ? kd : 1); camera.lookAt(camera.userData.t);
  camera.fov = 30;
  const isCfg=Pcur>6.2&&Pcur<7;const isWide=Pcur>4.3&&Pcur<4.8; const off = aspect > 1.3 && !deep ? -innerWidth * (isWide || (Pcur>7.2&&Pcur<7.6) ? 0 : isCfg ? .035 : .16) : 0;
  const offY = aspect <= 1.3 && !deep ? innerHeight * (isCfg ? .20 : (inMechanism||inConstruction) ? .14 : .14) : 0;
  if (off || offY) camera.setViewOffset(innerWidth, innerHeight, off, offY, innerWidth, innerHeight); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  // background & light
  fill.position.copy(camera.position);fill.intensity=.7;const d = S.dark; c1.copy(bgL).lerp(bgD, d); c2.copy(bgL2).lerp(bgD2, d);
  document.body.style.background = `radial-gradient(120% 90% at 30% 15%, #${c1.getHexString()} 0%, #${c2.getHexString()} 100%)`;
  document.body.classList.toggle('dark', false);
  renderer.toneMappingExposure = inMechanism||inConstruction ? .9 : 1.05;ambient.intensity=inMechanism||inConstruction?.55:1.1;
  key.intensity = inMechanism||inConstruction?.8:1.1;fill.intensity=inMechanism||inConstruction?.25:.7; rim.intensity = inMechanism||inConstruction?.35:.8; key.position.set(45*Math.cos(Pcur*.55),55,80); spot.intensity = 0; spot.position.set(18 + camPos.x * 0.2, 40, 60); spot.target.position.set(0, 0, -2);
  // watch
  const sc = { ...S, snap: FIX != null };
  watch.update(tsec, sc, sel, dt);
  renderer.render(scene, camera);
  // UI
  updateUI(Pcur);document.body.classList.toggle('focusOn',inMechanism&&movementFocus!=='all');$('movementTools').classList.toggle('show',inMechanism&&!deep);$('chronoRead').textContent=(watch.k?.chrono||0).toFixed(1)+' s';$('startChrono').textContent=ctl.running?'Stop':'Start';$('resetChrono').disabled=ctl.running;
  if (!ready && performance.now() - t0 > 600) { ready = true; $('loader').classList.add('done'); }
}
function updateUI(P) {
  const ci = Math.min(8, Math.floor(P + 0.001)), lp = P - ci;
  if (ci !== lastCh) {
    lastCh = ci; const c = CHAPTERS[ci];
    $('chN').textContent = c.n + ' / 09'; $('chK').textContent = c.kicker; $('chT').textContent = c.title; $('chC').textContent = c.copy; $('chS1').textContent = c.stat[0]; $('chS2').textContent = c.stat[1];
    $('specBig').textContent = c.spec[0]; $('specLab').textContent = c.spec[1];
    [...rail.children].forEach((b, i) => b.classList.toggle('on', i === ci));
  }
  let op = ci === 0 ? 1-clamp((lp-.68)/.22) : ci === 8 ? 0 : clamp(Math.min(lp / 0.1, (1 - lp) / 0.14));
  if (ci === 7) op *= 1 - clamp((lp - 0.14) / 0.08) * (1 - clamp((lp - 0.93) / 0.05));
  if (sel.mode === 'deep' && sel.part) op = 0;
  const ch = $('chapter'); ch.style.opacity = (op).toFixed(3); ch.style.transform = `translateY(${((1 - op) * 14).toFixed(1)}px)`;
  $('config').classList.toggle('show', P > 6.22 && P < 6.98); document.body.classList.toggle('cfgOn', P > 6.22 && P < 6.98); document.body.classList.toggle('studyOn', P > 7.98); document.body.classList.toggle('introOn', P < .85);document.body.classList.toggle('mechanismOn',P>2&&P<3);document.body.classList.toggle('macroOn',P>2&&P<3);document.body.classList.toggle('braceletOn',P>4.25&&P<4.85);document.body.classList.toggle('layoutOn',P>7.2&&P<7.6); document.body.style.setProperty('--progress',P/9);
  $('hint').style.opacity = P < 0.06 ? 1 : 0; $('scrub').value=String(P);$('scrubLabel').textContent=CHAPTERS[ci].n+' / '+CHAPTERS[ci].kicker; document.body.classList.toggle('catchingUp',false); $('paceLabel').textContent='Moving to '+CHAPTERS[Math.min(8,Math.floor(Ptar))].n; $('paceFill').style.width=(Pcur/9*100)+'%'; $('paceTarget').style.left=(Ptar/9*100)+'%';
  let si = -1; if (P >= 8) { si = 0; STUDIES.forEach((s, i) => { if (P >= s.p - 0.12) si = i; }); }
  const st = $('study');
  if (si !== lastStudy) { lastStudy = si; if (si >= 0) { const s = STUDIES[si]; $('stN').textContent = `0${si + 1} / 04`; $('stT').textContent = s.title; $('stC').textContent = s.copy; $('stG').textContent = s.tag; } }
  st.style.opacity = si >= 0 && P > 8.03 ? 1 : 0;
  $('chapter').style.pointerEvents = 'none';
}
requestAnimationFrame(frame);
window.__watch = watch; window.__sel = sel; window.__dbg = { camera, get P() { return Pcur; }, ctl, get auto() { return auto; }, paced, get target(){return Ptar},get preciseScroll(){return preciseScroll},get mechanismTime(){return mechanismTime},get mechanismRunning(){return mechanismRunning},sourceModel:watch.sourceModel, M: watch.M, get elapsed(){return (performance.now()-t0)/1000},renderer,scene };
