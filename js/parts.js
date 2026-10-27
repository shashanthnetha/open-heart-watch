import * as THREE from 'three';

export class Registry {
  constructor(M) { this.M = M; this.parts = []; this.byName = new Map(); }
  /* add a part. build(group) fills the spin-group with meshes (local coords).
     o: {pos:[x,y,z], rot:[rx,ry,rz], layer, mat (label), finish, note, anim(t,p), spinsFlat} */
  add(name, cat, layer, build, o = {}) {
    const obj = new THREE.Group(), spin = new THREE.Group();
    obj.add(spin); build(spin);
    const p = {
      id: this.parts.length, name, cat, layer, obj, spin,
      pos0: new THREE.Vector3(...(o.pos || [0, 0, 0])),
      q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.rot || [0, 0, 0]))),
      pos: new THREE.Vector3(), q: new THREE.Quaternion(), anim: o.anim || null,
      mat: o.mat || '', finish: o.finish || '', note: o.note || '', concept: o.concept !== false,
      scaleFit: 1, size: 1, dims: '', hover: 0, state: { hl: 0, fade: 1 },
    };
    p.pos.copy(p.pos0); p.q.copy(p.q0);
    obj.traverse((m) => { if (m.isMesh) { m.userData.part = p; } });
    this.parts.push(p); this.byName.set(name, p);
    return p;
  }
  finalize() {
    for (const p of this.parts) {
      const box = new THREE.Box3().setFromObject(p.spin);
      const s = box.getSize(new THREE.Vector3());
      p.size = Math.max(s.x, s.y, s.z, 0.05);
      p.dimsV = s.clone();
      p.dims = `${s.x.toFixed(2)} x ${s.y.toFixed(2)} x ${s.z.toFixed(2)} mm`;
      p.center = box.getCenter(new THREE.Vector3());
    }
  }
}
// Smooth coincident curved vertices, retaining creases above 35 degrees.
// ExtrudeGeometry duplicates each triangle's vertices, otherwise cylinders
// show a separate mirror reflection per triangle even at high subdivision.
const smoothed = new WeakSet();
function soften(g) {
  if (smoothed.has(g)) return; smoothed.add(g);
  const p=g.attributes.position,n=g.attributes.normal;if(!n)return;
  const groups=new Map();
  for(let i=0;i<p.count;i++) {const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);}
  const old=n.array.slice();
  for(const ids of groups.values()) for(const i of ids){let x=0,y=0,z=0;for(const j of ids){const dot=old[i*3]*old[j*3]+old[i*3+1]*old[j*3+1]+old[i*3+2]*old[j*3+2];if(dot>.80){x+=old[j*3];y+=old[j*3+1];z+=old[j*3+2];}}const l=Math.hypot(x,y,z)||1;n.setXYZ(i,x/l,y/l,z/l);}
  n.needsUpdate=true;
}
export const mesh = (g, m, parent, pos, rot) => { soften(g); let x;
 if(Array.isArray(m)){x=new THREE.Group();for(const group of g.groups){const geo=g.clone();geo.clearGroups();geo.setDrawRange(group.start,group.count);x.add(new THREE.Mesh(geo,m[group.materialIndex]||m[0]));}}
 else x = new THREE.Mesh(g, m); if (pos) x.position.set(...pos); if (rot) x.rotation.set(...rot); parent.add(x); return x; };
export const cyl = (r, h, seg = 48) => new THREE.CylinderGeometry(r, r, h, seg);
