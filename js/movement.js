import * as THREE from 'three';
import { gearGeometry, ringGeometry, meshedAngle } from './gears.js';
import { mesh, cyl } from './parts.js';
const Z=new THREE.Vector3(0,0,1), TAU=Math.PI*2;
const NOTE='Independent manual-wind concept, not a Rolex calibre or a service drawing. Motion is prescribed kinematics, not a torque or contact simulation.';
export const C=new THREE.Vector2(0,0),Bp=new THREE.Vector2(-7.6,0),Tp=new THREE.Vector2(4.56,0),Ip=new THREE.Vector2(4.56,-4.2),F=new THREE.Vector2(-3.8,-8.4),COL=new THREE.Vector2(0,8.3);
const E=new THREE.Vector2(1.15,-6.65);
export const ZL={plate:-2.1,train:-.8,tour:.2,bridge:.55,chrono:1.5};
export const ctl={steps:0,eased:0,pressT:-99,now:0,running:false,elapsed:0,started:0,manual:false};
export function chronoAction(action){ctl.manual=true;if(action==='reset'){if(ctl.running)return false;ctl.elapsed=0;}else if(ctl.running){ctl.elapsed+=ctl.now-ctl.started;ctl.running=false;}else{ctl.started=ctl.now;ctl.running=true;}ctl.steps++;ctl.pressT=ctl.now;return true;}
const angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
export function kin(t){
 const beat=t*5,whole=Math.floor(beat),u=(beat-whole),release=Math.min(1,u/.16),s=release*release*(3-2*release);
 const k={}; k.E=-(whole+s)/30*TAU; // half-tooth release on each semi-oscillation
 k.I=meshedAngle(k.E,10,angle(E,Ip),60);k.T=meshedAngle(k.I,10,angle(Ip,Tp),60);k.C=meshedAngle(k.T,12,angle(Tp,C),64);k.B=meshedAngle(k.C,15,angle(C,Bp),80);
 k.car=0;k.bal=3.9*Math.sin(t*TAU*2.5);k.fork=.13*Math.tanh(5*Math.sin(t*TAU*2.5+.4));k.esc=k.E;k.escRel=k.E;k.chrono=ctl.elapsed+(ctl.running?Math.max(0,t-ctl.started):0);k.running=ctl.running;
 const dt=Math.max(0,t-(ctl.lastT??t));ctl.lastT=t;ctl.now=t;ctl.eased+=(ctl.steps-ctl.eased)*(1-Math.exp(-dt*12));k.col=-ctl.eased/9*TAU;k.push=Math.max(0,1-(t-ctl.pressT)/.35);k.hair=1+.06*Math.sin(t*TAU*2.5);return k;
}
export function hullShape(circles,holes=[],seg=32){const pts=[];for(const c of circles)for(let i=0;i<seg;i++){const a=i/seg*TAU;pts.push([c.x+Math.cos(a)*c.r,c.y+Math.sin(a)*c.r]);}pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];for(const p of pts){while(lo.length>1&&cr(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of pts.slice().reverse()){while(up.length>1&&cr(up.at(-2),up.at(-1),p)<=0)up.pop();up.push(p);}const s=new THREE.Shape();lo.slice(0,-1).concat(up.slice(0,-1)).forEach((p,i)=>(i?s.lineTo(...p):s.moveTo(...p)));s.closePath();for(const c of holes){const h=new THREE.Path();h.absarc(c.x,c.y,c.r,0,TAU,true);s.holes.push(h);}return s;}
export function plateGeom(s,t=.4,b=.055){const g=new THREE.ExtrudeGeometry(s,{depth:t-b*2,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:32});g.translate(0,0,-t/2+b);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/24,p.getY(i)/24);g.computeVertexNormals();return g;}
const disc=(r,t)=>cyl(r,t,64).rotateX(Math.PI/2);
const spin=key=>(t,p,k)=>p.q.setFromAxisAngle(Z,k[key]).multiply(p.q0);
const spiral=(r0,r1,turns)=>{const pts=[];for(let i=0;i<=200;i++){const u=i/200,a=u*turns*TAU,r=r0+(r1-r0)*u;pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0));}return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),220,.012,4,false);};
export function buildMovement(R){const M=R.M;
 const add=(name,cat,layer,build,pos,extra={})=>R.add(name,cat,layer,build,{pos,mat:'Machined alloy / independent concept',finish:'Satin faces, polished chamfers',note:NOTE,...extra});
 const circle=(r,holes=[])=>hullShape([{x:0,y:0,r}],holes,80);
 add('Mainplate','Movement',6,g=>{mesh(plateGeom(circle(15.5,[{x:F.x,y:F.y,r:3.5}]),.75,.08),M.silverPerlage,g);mesh(ringGeometry(15.65,15.22,.3,.04,80),M.steelPolished,g,[0,0,.4]);
 
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const gradient=ctx.createRadialGradient(256,256,10,256,256,256);gradient.addColorStop(0,'rgba(8,12,12,.42)');gradient.addColorStop(.65,'rgba(8,12,12,.25)');gradient.addColorStop(1,'rgba(8,12,12,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,512);const ao=new THREE.CanvasTexture(c);
 for(const [x,y,r]of [[Bp.x,Bp.y,6.4],[0,0,3.8],[Tp.x,Tp.y,3.6],[Ip.x,Ip.y,3.6],[0,8.3,5]])mesh(new THREE.PlaneGeometry(r*2.35,r*2.35),new THREE.MeshBasicMaterial({map:ao,transparent:true,depthWrite:false}),g,[x+.2,y-.3,.43]);
 
 for(let i=0;i<18;i++){const a=i/18*TAU;mesh(disc(.16,.018),M.steelDark,g,[14*Math.cos(a),14*Math.sin(a),.39]);}
 },[0,0,-2.1]);
 // The barrel is enclosed in normal viewing. Its lid lifts only in the service study.
 add('Barrel drum','Movement',4,g=>{mesh(gearGeometry({N:80,m:.16,t:.6,bore:5.8}),M.gearGold,g);mesh(ringGeometry(6.1,5.8,.8,.025),M.steelBrushed,g,[0,0,.35]);mesh(disc(5.8,.18),M.steelBrushed,g,[0,0,-.3]);},[Bp.x,Bp.y,-.9],{anim:spin('B')});
 add('Mainspring','Movement',4,g=>mesh(spiral(.7,5.5,13),M.steelDark,g),[Bp.x,Bp.y,-.62]);
 add('Barrel cover','Movement',5,g=>{mesh(disc(5.91,.22),M.barrelSatin,g);mesh(ringGeometry(5.9,5.64,.08,.015),M.steelPolished,g,[0,0,.13]);},[Bp.x,Bp.y,-.15],{cover:true});
 add('Barrel arbor','Movement',4,g=>{mesh(disc(.42,2),M.steelPolished,g);mesh(disc(.9,.12),M.steelPolished,g,[0,0,.7]);},[Bp.x,Bp.y,-.4]);
 const wheel=(name,v,N,m,key,z=-.9)=>{add(name,'Movement',4,g=>mesh(gearGeometry({N,m,t:.18,bore:.14,spokes:5,hub:.4,rim:.19,bevel:.018}),M.gearGold,g),[v.x,v.y,z],{anim:spin(key)});};
 const pin=(name,v,N,m,key,z)=>add(name,'Movement',4,g=>{mesh(gearGeometry({N,m,t:.8,bore:0,bevel:.015}),M.steelPolished,g);mesh(disc(.14,2.1),M.steelPolished,g);},[v.x,v.y,z],{anim:spin(key)});
 wheel('Center wheel',C,64,.12,'C');pin('Center pinion',C,15,.16,'C',-.9);
 wheel('Third wheel',Tp,60,.12,'T',-.5);pin('Third pinion',Tp,12,.12,'T',-.9);
 wheel('Fourth wheel',Ip,60,.12,'I',-.9);pin('Fourth pinion',Ip,10,.12,'I',-.5);
 // Escape pinion and fourth wheel share a pitch plane. Balance is fixed, not a fantasy tourbillon.
 pin('Escape pinion',E,10,.12,'E',-.9);
 add('Escape wheel','Regulation',4,g=>{const s=new THREE.Shape();for(let i=0;i<15;i++)for(const [j,r,a]of [[0,1.08,0],[1,1.5,.07],[2,1.46,.19],[3,1.04,.38]]){const q=i/15*TAU+a;(i===0&&j===0?s.moveTo(Math.cos(q)*r,Math.sin(q)*r):s.lineTo(Math.cos(q)*r,Math.sin(q)*r));}s.closePath();mesh(plateGeom(s,.13,.018),M.steelPolished,g);},[E.x,E.y,.2],{anim:spin('E'),note:'15-tooth illustrative escape wheel. Five prescribed half-tooth releases per second. Locking geometry and torque are not simulated. '+NOTE});
 const fork=new THREE.Vector2(-.2,-7.7);
 add('Pallet fork','Regulation',4,g=>{const s=new THREE.Shape();s.moveTo(-.1,-.2);s.lineTo(.1,-.2);s.lineTo(.16,.9);s.lineTo(1.3,1.2);s.lineTo(1.22,1.4);s.lineTo(0,1.1);s.lineTo(-.9,.7);s.lineTo(-.8,.5);s.lineTo(-.13,.75);s.closePath();mesh(plateGeom(s,.14,.02),M.steelPolished,g);for(const [x,y]of [[1.22,1.3],[-.8,.6]])mesh(new THREE.BoxGeometry(.22,.13,.16),M.ruby,g,[x,y,.05]);mesh(disc(.2,.9),M.steelPolished,g);},[fork.x,fork.y,.4],{anim:spin('fork')});
 add('Balance wheel','Regulation',4,g=>{mesh(ringGeometry(3.25,3.02,.25,.03),M.balanceGold,g);for(let i=0;i<3;i++){const m=mesh(new THREE.BoxGeometry(.14,5.95,.14),M.balanceGold,g);m.rotation.z=i*Math.PI/3;}mesh(disc(.38,.35),M.balanceGold,g);mesh(disc(.12,1.7),M.steelPolished,g);for(let i=0;i<12;i++){const a=i/12*TAU;mesh(disc(.12,.12),M.steelPolished,g,[3.13*Math.cos(a),3.13*Math.sin(a),.14]);}},[F.x,F.y,.35],{anim:spin('bal'),note:'Fixed balance, 2.5 Hz prescribed oscillation. Not a tourbillon. '+NOTE});
 add('Hairspring','Regulation',4,g=>mesh(spiral(.35,2.5,11),M.blued,g),[F.x,F.y,.72],{anim:(t,p,k)=>p.spin.scale.set(k.hair,k.hair,1)});
 const bridge=(name,cs,holes)=>add(name,'Movement',5,g=>{let shape=hullShape(cs,holes);
 if(name==='Train bridge'){
 shape=new THREE.Shape();shape.moveTo(-.85,-.3);shape.bezierCurveTo(-1.1,1.5,2.7,1,4.3,2.8);shape.bezierCurveTo(5.4,3.8,7.1,2.6,7.2,1);shape.lineTo(8,-1.6);shape.bezierCurveTo(8.7,-2.2,11.9,-1,12.6,-2.3);shape.bezierCurveTo(13.7,-4.2,11.1,-5.1,9.8,-4.4);shape.lineTo(6,-5);shape.bezierCurveTo(4.5,-5.5,3.3,-4.7,3.6,-3.5);shape.lineTo(4.2,-2.1);shape.bezierCurveTo(5,-.2,2.9,-1.1,1.1,-1);shape.bezierCurveTo(0,-1.7,-.6,-1.5,-.85,-.3);shape.closePath();for(const c of holes){const h=new THREE.Path();h.absarc(c.x,c.y,c.r,0,TAU,true);shape.holes.push(h);}
 }
 if(name==='Barrel bridge'){
 shape=new THREE.Shape();shape.moveTo(-12.4,5);shape.bezierCurveTo(-13.5,8.8,-8,9,-5.1,7.2);shape.bezierCurveTo(-2.1,6.3,-2.5,3.4,-4.5,3.2);shape.lineTo(-6.2,2.6);shape.lineTo(-6.55,-.2);shape.bezierCurveTo(-7,-1.8,-9,-1.2,-8.8,.2);shape.lineTo(-9.4,3.2);shape.bezierCurveTo(-10.1,4.2,-11.6,3.6,-12.4,5);shape.closePath();for(const c of holes){const h=new THREE.Path();h.absarc(c.x,c.y,c.r,0,TAU,true);shape.holes.push(h);}
 }
 mesh(plateGeom(shape,.38,.025),[M.silverBridge,M.steelPolished],g);},[0,0,.9]);
 bridge('Barrel bridge',[{x:-11,y:5.6,r:2.4},{x:-8,y:3,r:2.5},{x:-5,y:5.2,r:1.8},{x:-7.6,y:0,r:1.2}],[{x:-7.6,y:0,r:.36}]);
 bridge('Train bridge',[{x:0,y:0,r:1},{x:5.2,y:1.5,r:2},{x:7.6,y:-3.5,r:1.8},{x:4.56,y:-4.2,r:.9},{x:11.5,y:-3,r:1.4}],[{x:0,y:0,r:.26},{x:4.56,y:0,r:.26},{x:4.56,y:-4.2,r:.26}]);
 bridge('Balance cock',[{x:F.x,y:F.y,r:.6},{x:-9.8,y:-9.2,r:1.4},{x:-10.5,y:-6.4,r:1}],[{x:F.x,y:F.y,r:.22}]);
 bridge('Pallet bridge',[{x:-.2,y:-7.7,r:.5},{x:1.5,y:-10.5,r:.9}],[{x:-.2,y:-7.7,r:.2}]);
 // Functional mounting ring, small winding works, and an upper chronograph deck.
 add('Chronograph support bridge','Movement',3.6,g=>{const s=hullShape([{x:-5,y:8.4,r:2.6},{x:0,y:10.8,r:2.5},{x:5,y:8.4,r:2.6},{x:0,y:5.7,r:2}], [{x:0,y:8.2,r:1.6}]);mesh(plateGeom(s,.36,.05),M.silverBridge,g);},[0,0,.5]);
 add('Ratchet wheel','Movement',5,g=>{mesh(gearGeometry({N:48,m:.10,t:.19,bore:.2}),M.steelBrushed,g);mesh(disc(.5,.12),M.steelPolished,g,[0,0,.15]);mesh(new THREE.BoxGeometry(.63,.07,.03),M.steelDark,g,[0,0,.23]);},[-7.6,0,1.22]);
 add('Crown wheel','Movement',5,g=>{mesh(gearGeometry({N:30,m:.10,t:.2,bore:.16}),M.steelBrushed,g);mesh(disc(.35,.1),M.steelPolished,g,[0,0,.15]);},[-7.6,3.9,1.24]);
 add('Winding stem','Movement',5,g=>mesh(cyl(.17,5.6,16).rotateZ(Math.PI/2),M.steelPolished,g),[12.6,0,-.6]);
 add('Keyless works bridge','Movement',5,g=>mesh(plateGeom(hullShape([{x:9.2,y:1.5,r:1.2},{x:12.2,y:.7,r:1.1},{x:9.6,y:-1,r:.8}]),.25,.03),M.steelBrushed,g),[0,0,.5]);
 add('Sliding pinion','Movement',4,g=>mesh(gearGeometry({N:12,m:.10,t:.5,bore:.15}).rotateY(Math.PI/2),M.steelPolished,g),[11.6,0,-.6]);
 // Restrained engraved signature, rendered as actual surface detail rather than a bright decal.
 const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const ctx=cv.getContext('2d');ctx.clearRect(0,0,1024,256);ctx.fillStyle='#45504b';ctx.textAlign='center';ctx.font='38px Georgia';ctx.fillText('ATELIER  /  01',512,102);ctx.font='23px Arial';ctx.fillText('MANUAL WIND  ·  CONCEPT STUDY',512,156);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 add('Bridge signature','Movement',5,g=>mesh(new THREE.PlaneGeometry(6.2,1.55),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),g),[-7.7,6.5,1.10]);
}
export function buildJewelsAndScrews(R){const M=R.M;const seats=[['Center',C,.9],['Third',Tp,.9],['Fourth',Ip,.9],['Escape',E,.28],['Balance',F,1.16],['Pallet',new THREE.Vector2(-.2,-7.7),1.16]];
 for(const [name,v,z]of seats)R.add(name+' jewel','Jewels',5,g=>{mesh(ringGeometry(.38,.19,.1,.015,24),M.balanceGold,g);mesh(disc(.21,.09),M.ruby,g,[0,0,.04]);mesh(disc(.065,.02),M.steelDark,g,[0,0,.10]);}, {pos:[v.x,v.y,z+.24],mat:'Synthetic ruby / brass seat',finish:'Polished bearing',note:NOTE});
 const pts=[[-11,5.6],[-5,5.2],[5.3,1.5],[7.6,-3.5],[11.5,-3],[-9.8,-9.2],[-10.5,-6.4],[1.5,-10.5],[-4.8,9.4],[4.8,9.4],[0,11.6],[10.1,1.4]];
 pts.forEach(([x,y],i)=>R.add('Bridge screw '+(i+1),'Fasteners',5,g=>{mesh(ringGeometry(.48,.29,.05,.009,24),M.steelPolished,g,[0,0,-.09]);mesh(disc(.29,.13),M.blued,g);mesh(new THREE.BoxGeometry(.43,.055,.018),M.steelDark,g,[0,0,.075]);},{pos:[x,y,i===8||i===9||i===10?.85:1.2],rot:[0,0,i*1.71],mat:'Blued steel',finish:'Recessed slotted head',note:NOTE}));
 for(let i=0;i<6;i++){const a=i/6*TAU+.2;R.add('Movement ring screw '+(i+1),'Fasteners',6,g=>{mesh(disc(.26,.13),M.steelPolished,g);mesh(new THREE.BoxGeometry(.4,.055,.02),M.steelDark,g,[0,0,.08]);},{pos:[14.8*Math.cos(a),14.8*Math.sin(a),-1.6],mat:'Steel',finish:'Polished',note:NOTE});}
}
