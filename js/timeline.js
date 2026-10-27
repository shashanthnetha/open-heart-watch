/* One continuous, reversible timeline. P runs 0..9, chapter i occupies [i, i+1).
   Every parameter is a pure function of P, so scrolling backward replays everything. */
export const CHAPTERS = [
  {id:'portrait',n:'01',title:'An icon, in detail.',kicker:'The exterior',copy:'A fluted bezel. A curved case. Steel that catches the light. A study of form, assembly and the movement of light. Scroll to look beneath the surface.',stat:['Model','Rolex Datejust, by Yevhen Artamonov'],spec:['37','source mesh objects']},
  {id:'layers',n:'02',title:'The heart, revealed.',kicker:'Exterior separation',copy:'Crystal, bezel, hands, dial, case and back separate as visual assembly groups. An independently built concept mechanism is revealed between them, not a replica of the source watch’s calibre.',stat:['Construction','Artist model, not a service sequence'],spec:['06','visual groups']},
  {id:'movement',n:'03',title:'Energy becomes time.',kicker:'Illustrative mechanism',copy:'The mainspring drives the barrel, then the wheel train. The escapement meters its release to a fixed balance. Enclosed barrel, fine wheelwork and bearing bridges form a separate manual-wind concept.',stat:['Concept balance','2.5 Hz / 18,000 vph'],spec:['2.5 Hz','fixed balance']},
  {id:'angles',n:'04',title:'Beneath the bridges.',kicker:'A controlled disassembly',copy:'Scroll to lift the bearing bridges and upper stopwatch deck. Then the barrel cover rises to reveal the stored spring. Reverse to seat each part again. An explanatory separation, not a service sequence.',stat:['Construction','Upper bearings, wheel train, enclosed barrel'],spec:['03','construction levels']},
  {id:'bracelet',n:'05',title:'A rhythm in steel.',kicker:'Bracelet sections',copy:'Brushed outer links and polished centres form a continuous wrist loop. The source groups separate as sections, not a simulated per-link unfolding.',stat:['Geometry','Original curved bracelet'],spec:['02','bracelet sides']},
  {id:'back',n:'06',title:'The other side.',kicker:'Front to back',copy:'Turn the source model over to its closed caseback and clasp. Nothing here invents a display back or an unseen calibre.',stat:['Caseback','Closed, as modelled by the artist'],spec:['180°','front to back']},
  {id:'config',n:'07',title:'A different character.',kicker:'Colour studies',copy:'Ink, blue or silver dial. Silver, graphite or champagne steel. These are artistic colour treatments, not official product variants.',stat:['Variants','27 artistic combinations'],spec:['27','colour studies']},
  {id:'assemble',n:'08',title:'Separate. Return.',kicker:'Parts and reassembly',copy:'Exterior objects and concept components share a field of parts. Follow their curved return paths: movement first, then dial, case and bracelet.',stat:['Parts','Exterior objects, not a calibre count'],spec:['98','study components']},
  {id:'finish',n:'09',title:'Look closer.',kicker:'Surface studies',copy:'',stat:['',''],spec:['04','surface studies']},
];
export const STUDIES = [
 {p:8.1,title:'The fluted bezel.',copy:'Alternating faces catch long studio reflections. The artist supplied this geometry; the reflection setup is new.',tag:'Source bezel / polished steel'},
 {p:8.36,title:'Steel, in contrast.',copy:'A curved bracelet with brushed outer links and polished centres. Rigid source sections, not a watchmaker’s assembly rig.',tag:'Source bracelet / two finishes'},
 {p:8.62,title:'A closed back.',copy:'The supplied model has a solid caseback. The earlier movement is a separate illustrative mechanism, never hidden inside this exterior.',tag:'Source caseback / artist model'},
 {p:8.88,title:'The dial details.',copy:'Applied markers, hands, day and date are separate source objects. The download is titled Datejust; its dial says Day-Date. We preserve that mismatch rather than asserting a real reference.',tag:'Artist interpretation / not an authenticated reference'},
];

const K = [];
let last = { cam: [0, 0, 120], tgt: [0, 0, 0], rot: [0, 0, 0], fov: 30, explode: 0, asm: 1, unfold: 0, dark: 0, hideDial: 0, hideCrystal: 0, hideShell: 0, hideBr: 0, light: 0, mechanism:0, internalSpread:0, hideConcept:0, bridgeLift:0, coverLift:0 };
function kf(p, o) { const s = JSON.parse(JSON.stringify(last)); Object.assign(s, o); s.p = p; last = s; K.push(s); }
const PI = Math.PI;
// Each beat has a travelling move and a short editorial hold.
kf(0, {cam:[0,-2,176],tgt:[0,0,0],rot:[-.20,-.44,-.18]});
kf(.28,{cam:[0,0,160],rot:[-.12,-.19,-.05]});
kf(.56,{cam:[0,4,126],tgt:[0,3,0],rot:[-.18,.18,.03]});
kf(.88,{cam:[1,6,95],tgt:[0,3,.3],rot:[-.16,.05,0],hideBr:1});
kf(1.08,{cam:[1,6,95],tgt:[0,3,.3],rot:[-.16,.05,0]});
kf(1.32,{cam:[22,-5,137],tgt:[0,0,0],rot:[-.84,.48,.13],explode:.22,hideBr:1,mechanism:1});
kf(1.63,{cam:[31,-8,192],rot:[-1.06,.68,.2],explode:1,mechanism:1});
kf(1.88,{cam:[-16,-8,192],rot:[-.93,-.22,-.1],explode:1});
// A stable overview makes the mechanism legible. Macro views are user choices.
kf(2.16,{cam:[0,1,103],tgt:[0,0,-1],rot:[-.24,.08,0],explode:0,mechanism:1,internalSpread:.22,dark:1,hideDial:1,hideCrystal:1,hideShell:1,light:1});
kf(2.34,{cam:[0,1,103],tgt:[0,0,-1],rot:[-.24,.08,0],internalSpread:.3});
kf(2.78,{cam:[0,1,103],tgt:[0,0,-1],rot:[-.24,.08,0]});
kf(2.92,{cam:[0,1,103],tgt:[0,0,-1],rot:[-.24,.08,0]});
kf(3.12,{cam:[20,-28,128],tgt:[0,0,0],rot:[-.22,-.18,0],mechanism:1,hideDial:1,hideCrystal:1,hideShell:1,hideBr:1,internalSpread:0,bridgeLift:0,coverLift:0});
kf(3.40,{cam:[20,-28,134],bridgeLift:.6,coverLift:0});
kf(3.65,{cam:[20,-28,144],bridgeLift:1,coverLift:.25});
kf(3.86,{cam:[20,-28,145],tgt:[0,3,0],bridgeLift:1,coverLift:1});
kf(3.98,{cam:[20,-28,145],tgt:[0,3,0],bridgeLift:1,coverLift:1});
kf(4.12,{cam:[0,0,180],tgt:[0,0,-1],rot:[-.3,.28,.1],unfold:0,mechanism:0,hideDial:0,hideCrystal:0,hideShell:0,hideBr:0,bridgeLift:0,coverLift:0});
kf(4.46,{cam:[0,0,248],rot:[-.2,.18,.0],unfold:1});
kf(4.72,{cam:[0,0,248],rot:[-.2,-.18,.0],unfold:1});
kf(4.93,{cam:[0,0,185],tgt:[0,0,-5],rot:[-.25,-.2,0],unfold:1});
kf(5.14,{cam:[0,0,163],tgt:[0,0,-1],rot:[-.2,-.15,0],unfold:.2});
kf(5.44,{cam:[0,0,180],rot:[-.15,PI*.5,0],unfold:0});
kf(5.75,{cam:[0,0,150],tgt:[0,0,0],rot:[.12,PI,0],hideBr:1});
kf(5.91,{cam:[0,0,150],rot:[.12,PI,0],hideBr:1});
// Return from the back by the same half-turn, not a second full revolution.
kf(6.16,{cam:[0,0,180],rot:[-.13,-.24,-.1],hideBr:0});
kf(6.4,{cam:[0,0,180],rot:[-.1,-.24,-.05]});
kf(6.94,{cam:[0,0,180],rot:[-.1,.12,.04]});
kf(7.04,{cam:[0,0,160],rot:[-.18,PI*2-.25,0],asm:1});
kf(7.26,{cam:[0,-8,260],tgt:[0,0,0],rot:[-.34,0,0],asm:0});
kf(7.48,{cam:[0,0,260],tgt:[0,0,0],rot:[0,0,0],asm:0});
kf(7.91,{cam:[0,0,166],tgt:[0,0,-1],rot:[-.3,-.4,-.12],asm:1});
kf(8.0,{cam:[0,0,162],rot:[-.3,-.4,-.12]});
kf(8.12,{cam:[25,23,24],tgt:[13.5,13.5,2.5],rot:[0,0,0]});
kf(8.25,{cam:[24,23,26],tgt:[13.5,13.5,2.5],rot:[0,0,0]});
kf(8.38,{cam:[12,30,48],tgt:[0,25,-12],rot:[-.1,0,0]});
kf(8.5,{cam:[10,30,48],tgt:[0,25,-12],rot:[-.1,0,0]});
kf(8.63,{cam:[-5,4,65],tgt:[0,0,3],rot:[0,PI+.14,0]});
kf(8.75,{cam:[-4,3,65],tgt:[0,0,3],rot:[0,PI+.14,0]});
kf(8.89,{cam:[10,2,40],tgt:[8,0,1.6],rot:[-.18,.12,0],hideDial:0});
kf(9,{cam:[9,2,42],tgt:[8,0,1.6],rot:[-.18,.12,0]});
// unwrap rotation jumps are explicit above; no wrapping needed

const sm = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpV = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
export function sample(P, out = {}) {
  P = Math.min(Math.max(P, 0), 9);
  let i = 0; while (i < K.length - 2 && P > K[i + 1].p) i++;
  const a = K[i], b = K[i + 1], t = sm(Math.min(Math.max((P - a.p) / (b.p - a.p), 0), 1));
  out.cam = lerpV(a.cam, b.cam, t); out.tgt = lerpV(a.tgt, b.tgt, t); out.rot = lerpV(a.rot, b.rot, t);
  for (const k of ['fov', 'explode', 'asm', 'unfold', 'dark', 'hideDial', 'hideCrystal', 'hideShell', 'hideBr', 'light', 'mechanism', 'internalSpread', 'hideConcept','bridgeLift','coverLift']) out[k] = lerp(a[k], b[k], t);
  return out;
}
