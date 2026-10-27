import * as THREE from 'three';
import { lathe, ringGeometry } from './gears.js';
import { mesh, cyl } from './parts.js';
import { ctl } from './movement.js';

const NOTE = 'Concept component, drawn for this study. It is not an official Rolex part or drawing.';

function lugGeom(dir, side) {
  const s = new THREE.Shape();
  s.moveTo(5.5, 15); s.lineTo(14.2, 14.3);
  s.bezierCurveTo(13.8,19.5,12.2,24.5,9.8,27.1);
  s.quadraticCurveTo(9.4,27.8,9.2,26.6);
  s.lineTo(9.15,20.8);s.quadraticCurveTo(8.6,18.6,5.5,18.2);s.closePath();
  const g = new THREE.ExtrudeGeometry(s,{depth:5.4,bevelEnabled:true,bevelThickness:.5,bevelSize:.3,bevelSegments:5,curveSegments:16});
  g.translate(0,0,-2.7);g.scale(side,dir,1);g.computeVertexNormals();return g;
}
function tachyTexture(){
 const c=document.createElement('canvas');c.width=c.height=2048;const g=c.getContext('2d');g.translate(1024,1024);
 const scale=2048/40;g.fillStyle='#d9ddde';g.strokeStyle='#d9ddde';g.textAlign='center';g.textBaseline='middle';
 const values=[60,65,70,75,80,85,90,95,100,110,120,130,140,150,160,180,200,240,300,400];
 values.forEach(v=>{const a=(60/v)*Math.PI*2;g.save();g.rotate(a);g.translate(0,-18.05*scale);g.font=`600 ${1.02*scale}px Arial`;g.fillText(String(v),0,0);g.restore();
  g.save();g.rotate(a);g.lineWidth=.09*scale;g.beginPath();g.moveTo(0,-16.95*scale);g.lineTo(0,-17.25*scale);g.stroke();g.restore();});
 g.save();g.translate(2.4*scale,-18.1*scale);g.rotate(.14);g.font=`600 ${.39*scale}px Arial`;g.fillText('UNITS PER HOUR',0,0);g.restore();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}

export function buildShell(R) {
  const M = R.M;
  // Crown guards belong to the case middle, not extra counted components.

  // Case middle with four lugs
  R.add('Case middle', 'Case', 3.5, (g) => {
    mesh(ringGeometry(19.85, 17.35, 7.8, 0.45), M.steelBrushed, g, [0, 0, -1.8]);
    for (const d of [1, -1]) for (const s of [1, -1]) {
      const m = mesh(lugGeom(d, s), M.steelPolished, g, [0, 0, -1.7]);
    }
    for(const sign of [-1,1]){
      const s=new THREE.Shape();s.moveTo(17.9,sign*2.2);s.lineTo(22.5,sign*3.0);s.quadraticCurveTo(23.2,sign*3.5,21.3,sign*5.3);s.lineTo(18,sign*6.5);s.closePath();
      mesh(new THREE.ExtrudeGeometry(s,{depth:4.8,bevelEnabled:true,bevelThickness:.35,bevelSize:.35,bevelSegments:5}),M.steelPolished,g,[0,0,-3.7]);
    }
    // polished chamfer line on the case top edge
    mesh(ringGeometry(19.9, 19.2, 0.5, 0.2), M.steelPolished, g, [0, 0, 1.95]);
  }, { mat: '904L-type stainless steel (concept)', finish: 'Satin-brushed flanks, polished chamfers', note: 'Ø 39.7 mm case middle with four lugs spaced for a 19 mm bracelet. ' + NOTE });
  R.add('Bezel', 'Case', 1, (g) => {
    mesh(ringGeometry(19.85,16.6,1.75,.2),M.steelPolished,g,[0,0,2.65]);
    mesh(ringGeometry(19.53,16.85,.6,.12),M.ceramic,g,[0,0,3.38]);
    const label=new THREE.MeshBasicMaterial({map:tachyTexture(),transparent:true,depthWrite:false,toneMapped:false});
    mesh(new THREE.PlaneGeometry(40,40),label,g,[0,0,3.82]);
    mesh(ringGeometry(17.2, 16.3, 0.5, 0.15), M.steelBrushed, g, [0, 0, 2.15]);
  }, { mat: 'Ceramic-inspired insert, steel rim', finish: 'Polished black with tachymetric markings', note: 'Daytona-inspired exterior treatment on a conceptual case. ' + NOTE });
  R.add('Sapphire crystal', 'Case', 1, (g) => {
    mesh(lathe([[0, 3.95], [4, 3.9], [9, 3.72], [13.5, 3.35], [16.6, 2.95], [16.8, 2.55], [16.3, 2.3], [16.3, 2.1], [0, 2.1]], 96), M.sapphire, g, [0, 0, 0]).renderOrder = 20;
  }, { mat: 'Synthetic sapphire', finish: 'Domed, anti-reflective inner face', note: 'Gently domed sapphire crystal. ' + NOTE });
  R.add('Crystal gasket', 'Case', 1, (g) => { mesh(ringGeometry(17.2, 16.5, 0.35, 0.1), M.rubber, g, [0, 0, 2.05]); }, { mat: 'Fluoroelastomer', finish: 'Matte', note: 'Seals the crystal to the case. ' + NOTE });
  R.add('Caseback ring', 'Case', 6, (g) => {
    mesh(ringGeometry(18.7, 14.2, 1.3, 0.3), M.steelBrushed, g, [0, 0, -6.1]);
    mesh(ringGeometry(14.5, 14.0, 0.5, 0.1), M.steelPolished, g, [0, 0, -6.45]);
  }, { mat: 'Stainless steel', finish: 'Brushed with polished inner lip', note: 'Screw-down caseback ring. ' + NOTE });
  R.add('Caseback sapphire', 'Case', 6, (g) => { mesh(cyl(14.2, 1.2, 96).rotateX(Math.PI / 2), M.sapphire, g, [0, 0, -6.2]).renderOrder = 20; }, { mat: 'Synthetic sapphire', finish: 'Flat, polished', note: 'Display back to view the movement. ' + NOTE });
  R.add('Caseback gasket', 'Case', 6, (g) => { mesh(ringGeometry(15.2, 14.4, 0.35, 0.1), M.rubber, g, [0, 0, -5.55]); }, { mat: 'Fluoroelastomer', finish: 'Matte', note: 'Seals the caseback. ' + NOTE });

  // crown at 3 o'clock
  R.add('Crown tube', 'Case', 3.5, (g) => { mesh(cyl(2.3, 3.0, 40).rotateZ(Math.PI / 2), M.steelPolished, g, [19.9, 0, 0]); }, { mat: 'Stainless steel', finish: 'Polished', note: 'Winding crown tube, welded to the case. ' + NOTE });
  R.add('Crown gasket', 'Case', 3.5, (g) => { mesh(cyl(2.55, 0.6, 40).rotateZ(Math.PI / 2), M.rubber, g, [21.2, 0, 0]); }, { mat: 'Fluoroelastomer', finish: 'Matte', note: 'Seal between crown and tube. ' + NOTE });
  R.add('Crown', 'Case', 3.5, (g) => {
    const s = new THREE.Shape(); const n = 36;
    for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? 3.15 : 3.4; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 3.2, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.2, bevelSegments: 3 });
    geo.rotateY(Math.PI / 2); geo.translate(21.5, 0, 0);
    mesh(geo, M.hwBrushed, g);
    mesh(cyl(2.2, 0.3, 40).rotateZ(Math.PI / 2), M.hw, g, [25.15, 0, 0]);
    for(let i=-2;i<=2;i++) {const m=mesh(new THREE.BoxGeometry(.12,.16,1.3),M.steelDark,g,[25.33,i*.28,.12]);m.rotation.x=i*.17;}
    mesh(new THREE.BoxGeometry(.12,1.3,.18),M.steelDark,g,[25.34,0,-.6]);
  }, { mat: 'Stainless steel, hardware tone', finish: 'Fluted grip, polished cap', note: 'Hand-winding and setting crown. ' + NOTE });
  // pushers at 2 and 4
  for (const [lab, a] of [['2 o\u2019clock', 0.5236], ['4 o\u2019clock', -0.5236]]) {
    const dir = [Math.cos(a), Math.sin(a)];
    const place = (g, r, len, mat, geomR) => { const m = mesh(cyl(geomR, len, 32).rotateZ(Math.PI / 2), mat, g); m.position.set(dir[0] * r, dir[1] * r, 0); m.rotation.z = a; return m; };
    R.add(`Pusher tube ${lab}`, 'Case', 3.5, (g) => place(g, 20.3, 2.6, M.steelPolished, 1.6), { mat: 'Stainless steel', finish: 'Polished', note: 'Chronograph pusher tube. ' + NOTE });
    R.add(`Pusher gasket ${lab}`, 'Case', 3.5, (g) => place(g, 21.4, 0.5, M.rubber, 1.85), { mat: 'Fluoroelastomer', finish: 'Matte', note: 'Pusher seal. ' + NOTE });
    R.add(`Pusher stem ${lab}`, 'Case', 3.5, (g) => place(g, 21.6, 3.8, M.steelBrushed, 0.95), { anim: (t, p, k) => { p.pos.x = p.pos0.x - dir[0] * 0.9 * (k.push || 0); p.pos.y = p.pos0.y - dir[1] * 0.9 * (k.push || 0); }, mat: 'Stainless steel', finish: 'Brushed', note: 'Pusher stem that acts on the chronograph lever. ' + NOTE });
    R.add(`Pusher cap ${lab}`, 'Case', 3.5, (g) => {place(g, 23.4, 3.0, M.hw, 1.9);for(let j=0;j<5;j++)place(g,22.4+j*.36,.12,M.steelDark,1.95);}, { anim: (t, p, k) => { p.pos.x = p.pos0.x - dir[0] * 0.9 * (k.push || 0); p.pos.y = p.pos0.y - dir[1] * 0.9 * (k.push || 0); }, mat: 'Hardware tone', finish: 'Polished', note: 'Start / stop and reset pusher. ' + NOTE });
  }
  // caseback screws
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.52;
    R.add(`Caseback screw ${i + 1}`, 'Fasteners', 6, (g) => { mesh(cyl(0.62, 0.5, 24).rotateX(Math.PI / 2), M.steelPolished, g, [0, 0, 0]); mesh(new THREE.BoxGeometry(0.9, 0.12, 0.1), M.steelDark, g, [0, 0, 0.26]); }, { pos: [Math.cos(a) * 16.4, Math.sin(a) * 16.4, -6.7], rot: [0, 0, a], mat: 'Stainless steel', finish: 'Polished head', note: 'Caseback fixing screw. ' + NOTE });
  }
}
