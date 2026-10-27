import {clockState,weekdays} from './clock.js';
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { mesh } from './parts.js';

export const MODEL_CREDIT = 'Rolex Datejust by Yevhen Artamonov, CC BY 4.0. Modified materials, orientation and animation.';
const NOTE='Artist-supplied exterior model. Assembly groups are visual, not a service sequence. No internal movement was supplied.';
const names={case_signature:'Bezel',numbers:'Applied hour markers',tablo:'Dial plate',arrow_small:'Hour hand',arrow_medium:'Minute hand',arrow_big:'Seconds hand',arrow_cylinder:'Hand cap',logo:'Applied crown emblem',case_logo_rolex:'Rehaut engraving',clasp:'Winding crown',back_cap_3:'Caseback inner cover',glass:'Sapphire crystal',glass_numbers:'Date magnifier',tablo_monday:'Day aperture disc',tablo_28:'Date aperture disc',belt_fastener_1:'End-link centres',logo_back:'Clasp emblem',back_cap_2:'Caseback ring',back_cap_4:'Caseback lip',case_bolts:'Spring bars',belt_fastener_2:'End links',clasp_logo:'Crown emblem',split_pin:'Clasp pin',back_cap_signature:'Caseback engraving',back_cap:'Caseback cover',case_rolex:'Case middle',belt_buckle:'Folding clasp',strap_medium_5:'Bracelet centre links',strap_3:'Upper bracelet',strap_4:'Lower bracelet',strap_1:'Lower clasp-side links',strap_2:'Upper clasp-side links',tablo_logo:'Dial print'};
const matNames={silver_rolex:'Polished steel',silver:'Steel',metal:'Polished steel',metal_brush:'Brushed steel',tablo_rolex:'Lacquer dial',glass:'Transparent crystal'};
const fix=new THREE.Matrix4().makeRotationX(Math.PI/2);fix.premultiply(new THREE.Matrix4().makeScale(850,850,850));
export async function buildDatejust(R) {
  const data=await new GLTFLoader().loadAsync(new URL('../assets/datejust-original.glb',import.meta.url).href);
  const materials=new Map();const calendar={key:null,items:[]};
  const drawCalendar=(state)=>{
    if(calendar.key===state.key)return;calendar.key=state.key;
    for(const item of calendar.items){
      const {canvas,texture,type}=item,g=canvas.getContext('2d');g.fillStyle='#eeeee6';g.fillRect(0,0,canvas.width,canvas.height);g.fillStyle='#101512';g.textAlign='center';g.textBaseline='middle';
      if(type==='date'){g.font='600 455px Arial';g.fillText(String(state.date),512,300);}
      else {const word=weekdays[state.day];g.font='600 150px Arial';const gap=Math.min(94,820/word.length);for(let i=0;i<word.length;i++){const x=(i-(word.length-1)/2)*gap;const y=165+x*x*.00065;g.save();g.translate(512+x,y);g.rotate(x*.0012);g.fillText(word[i],0,0);g.restore();}}
      texture.needsUpdate=true;
    }
  };
  for(const node of data.scene.children){
    const sourceName=node.name;let key=sourceName.replace(/ /g,'_');
    const name=names[key]||('Rehaut detail '+sourceName.replace(/\D/g,''));
    const bracelet=/strap|belt|pin|logo_back/.test(key);
    const dial=/tablo|numbers|^logo$|arrow/.test(key);
    const back=/back_cap/.test(key);
    const crystal=/glass/.test(key);
    const cat=bracelet?'Bracelet':dial?(/arrow/.test(key)?'Hands':'Dial'):'Case';
    const layer=crystal?0:key==='case_signature'?1:dial?2:back?6:3.5;
    const sourceMeshes=[];node.traverse(m=>{if(m.isMesh)sourceMeshes.push(m)});
    const part=R.add(name,cat,layer,g=>{
      for(const sm of sourceMeshes){
        // All author objects share a display quaternion and location. Work in
        // their unposed local engineering coordinates, keeping original file intact.
        let geo=sm.geometry.clone();geo.applyMatrix4(fix);
        const old=sm.material;let mat=materials.get(old);
        if(!mat){
          mat=old.clone();mat.envMap=R.M.hw.envMap;mat.envMapIntensity=1.05;
          if(/glass/.test(mat.name)){mat.transparent=true;mat.opacity=key==='glass_numbers'?.075:.035;mat.depthWrite=false;mat.roughness=.06;mat.metalness=0;}
          else if(/tablo_rolex/.test(mat.name)&&!mat.map){mat.color.set('#15392e');mat.metalness=.38;mat.roughness=.38;}
          else if(!mat.map){mat.roughness=Math.max(.16,Math.min(.36,mat.roughness));mat.color.set('#c0c6c9');}
          else if(/brush/.test(mat.name)){mat.roughness=.32;mat.normalScale?.setScalar(.055);}
          materials.set(old,mat);
        }
        if(key==='tablo_monday'||key==='tablo_28'){
          const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=key==='tablo_28'?576:384;
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
          const box=new THREE.Box3().setFromBufferAttribute(geo.attributes.position),sz=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
          geo.dispose();geo=new THREE.PlaneGeometry(sz.x,sz.y);geo.translate(c.x,c.y,c.z+.008);
          mat=new THREE.MeshStandardMaterial({map:texture,color:0xffffff,roughness:.8,metalness:0,side:THREE.DoubleSide});
          calendar.items.push({canvas,texture,type:key==='tablo_28'?'date':'day'});
        }
        const m=mesh(geo,mat,g);m.userData.sourceMaterial=old.name;if(crystal)m.renderOrder=20;
      }
    },{mat:crystal?'Crystal (artist interpretation)':dial?'Artist model dial / applied details':'Artist model steel',finish:'Source mesh, studio-lit',note:NOTE,concept:false});
    part.sourceName=sourceName;part.imported=true;
    if(cat==='Hands'&&name!=='Hand cap'){
      let far=0,angle=0;part.obj.traverse(m=>{if(m.isMesh){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),r=x*x+y*y;if(r>far){far=r;angle=Math.atan2(x,y);}}}});part.handBaseAngle=angle;
    }
    if(bracelet)part.braceletSource=true;
    if(back)part.backSource=true;
  }
  drawCalendar(clockState());return {materials,calendar,drawCalendar,credit:MODEL_CREDIT};
}
