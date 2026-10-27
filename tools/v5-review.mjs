// Live interaction test via Chrome DevTools Protocol. usage: node tools/e2e.mjs
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const server=spawn('python3',['-m','http.server','8184','--bind','127.0.0.1'],{stdio:'ignore'});
const W=+process.env.W||960,H=+process.env.H||640, port=+(process.env.PORT||9333);
const ch = spawn('google-chrome',['--headless=new',`--user-data-dir=/tmp/watch-qa-${Date.now()}`,'--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist',`--window-size=${W},${H}`,'--hide-scrollbars',`--remote-debugging-port=${port}`,'about:blank'],{stdio:'ignore'});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let tabs; for(let i=0;i<40;i++){ try{ tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if(tabs[0]) break;}catch{} await sleep(500);}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const pend={}; const logs=[];
ws.onmessage=(m)=>{const d=JSON.parse(m.data); if(d.id&&pend[d.id]){pend[d.id](d);delete pend[d.id];} else if(d.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(d.params.type)) logs.push(d.params.args.map(a=>a.value||a.description).join(' ')); else if(d.method==='Runtime.exceptionThrown') logs.push('EXC '+JSON.stringify(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text));};
const send=(method,params={})=>new Promise(r=>{const i=++id;const t=setTimeout(()=>{console.log("TIMEOUT",method);r({})},60000);pend[i]=(d)=>{clearTimeout(t);r(d)};ws.send(JSON.stringify({id:i,method,params}));});
const ev=async(e)=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}); return r.result?.result?.value;};
const shot=async(n)=>{const r=await send('Page.captureScreenshot',{format:'png',fromSurface:false}); fs.writeFileSync(`/downloads/qa-${n}.png`,Buffer.from(r.result.data,'base64'));};
const out=[]; const log=(k,v)=>{out.push(k+': '+JSON.stringify(v)); console.log(k+': '+JSON.stringify(v));};
await send('Runtime.enable'); await send('Page.enable');console.log('browser ready');
await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:process.env.PHASE==='touch'});
await send('Page.navigate',{url:(process.env.URL||'http://127.0.0.1:8184/build/index.html')+(process.env.PHASE==='config'?'?p=6.5':'')});
for(let i=0;i<20;i++){ if(await ev('!!window.__dbg')) break; await sleep(1000);} 
for(let i=0;i<15;i++){if(await ev('getComputedStyle(document.querySelector("#loader")).visibility==="hidden"'))break;await sleep(300)}
await ev('__dbg.renderer.setPixelRatio(.4)');
log('loaded', await ev('!!window.__dbg'));
log('parts', await ev('__watch.parts.length'));
const setP=async(P,wait=500)=>{console.log("setP",P,Date.now()%100000);await key('Escape');await ev(`scrollTo(0,(${P}/9)*(document.documentElement.scrollHeight-innerHeight));__dbg.paced.reset(${P})`); const t0=Date.now(); while(Date.now()-t0<15000){ const cur=await ev('__dbg.P'); if(Math.abs(cur-P)<0.003) break; await sleep(150);} await sleep(wait);};
const key=async(k,code)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:code||k,windowsVirtualKeyCode:({ArrowDown:40,ArrowUp:38,' ':32,Escape:27})[k]||0,text:k===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:code||k});};
const click=async(x,y)=>{await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(30);await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});if(process.env.PHASE!=='config')await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');else await sleep(80);};
const proj=(name)=>ev(`(()=>{const p=__watch.parts.find(p=>p.name.startsWith(${JSON.stringify(name)}));if(!p)return null;p.obj.updateWorldMatrix(true,false);const v=p.obj.localToWorld(p.center.clone().sub(p.obj.position));v.project(__dbg.camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,name:p.name}})()`);

const checks=[];const ok=(name,value)=>{checks.push({name,pass:!!value});log(name,value);if(!value)console.log('FAIL '+name)};
const clickEl=async sel=>{if(process.env.PHASE==='config')console.log('click',sel);const r=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(!r)throw Error('No '+sel);for(let i=0;i<30;i++){const hit=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});return e===document.elementFromPoint(${r.x},${r.y})||e.contains(document.elementFromPoint(${r.x},${r.y}))})()`);if(hit)break;await sleep(300)}await click(r.x,r.y)};


const result=[];const check=(n,p,d)=>{result.push({name:n,pass:!!p,detail:d});console.log(n,!!p,d??'')};
const frame=()=>ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
const go=async p=>{await ev(`scrollTo(0,${p}/9*(document.documentElement.scrollHeight-innerHeight))`);await frame();};
const mode=process.env.MODE||'construction';
if(mode==='construction'){
 await go(3.12);const names=['Train bridge','Barrel cover','Chronograph support bridge'];const a=await ev(`__watch.parts.filter(p=>${JSON.stringify(names)}.includes(p.name)).map(p=>({name:p.name,pos:p.obj.position.toArray()}))`);await go(3.86);const b=await ev(`__watch.parts.filter(p=>${JSON.stringify(names)}.includes(p.name)).map(p=>({name:p.name,pos:p.obj.position.toArray()}))`);check('Chapter 04 visibly separates all three assemblies',a.every((p,i)=>Math.hypot(...p.pos.map((x,j)=>x-b[i].pos[j]))>10),{a,b});await go(3.12);const c=await ev(`__watch.parts.filter(p=>${JSON.stringify(names)}.includes(p.name)).map(p=>p.obj.position.toArray())`);check('Reverse exactly reseats assemblies',a.every((p,i)=>p.pos.every((x,j)=>Math.abs(x-c[i][j])<.001)));
 await go(2.45);await clickEl('#openBridges');await frame();check('Hide upper bridges keeps mainplate',await ev('__watch.R.byName.get("Train bridge").state.fade===0&&__watch.R.byName.get("Mainplate").state.fade===1'));await clickEl('#openBridges');
}
if(mode==='chrono'){
 await go(2.45);await frame();const pos=await ev('(()=>{const e=document.querySelector("#startChrono"),r=e.getBoundingClientRect();return {rect:[r.x,r.y,r.width,r.height],hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML}})()');console.log('startHit',pos);await clickEl('#startChrono');await frame();check('Real pointer starts timer',await ev('__dbg.ctl.running'));check('Running reset disabled',await ev('document.querySelector("#resetChrono").disabled'));await frame();check('Timer advances',await ev('__watch.k.chrono>0'));await clickEl('#startChrono');await frame();check('Real pointer stops timer',await ev('!__dbg.ctl.running'));await clickEl('#resetChrono');await frame();check('Real pointer resets timer',await ev('__watch.k.chrono===0'));
}
if(mode==='focus'){
 await go(2.45);for(const f of ['train','balance','chrono','all']){await clickEl(`[data-focus=${f}]`);await frame();check('focus '+f,await ev(`document.querySelector('[data-focus=${f}]').classList.contains('on')`));await shot('v5-focus-'+f);}
}
if(mode==='inspect'){
 await go(2.45);await clickEl('#partsBtn');await clickEl('#pq');await send('Input.insertText',{text:'Escape wheel'});await frame();check('Search finds exact part',await ev('document.querySelectorAll("#plist button").length===1'));await clickEl('#plist button');await clickEl('#partsBtn');await clickEl('[data-m=deep]');await frame();await frame();console.log('deepState',await ev('({mode:__sel.mode,part:__sel.part?.name})'));const a=await ev('__dbg.camera.position.toArray()');await send('Input.dispatchMouseEvent',{type:'mousePressed',x:W*.6,y:H*.35,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:W*.7,y:H*.4,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:W*.7,y:H*.4,button:'left',clickCount:1});await frame();await frame();await frame();const b=await ev('__dbg.camera.position.toArray()');console.log('orbit',{a,b});check('Deep mouse orbit',Math.hypot(...a.map((v,i)=>v-b[i]))>.1);const sy=await ev('scrollY');await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:W*.6,y:H*.35,deltaX:0,deltaY:-100});await frame();check('Deep wheel does not scroll page',Math.abs(sy-await ev('scrollY'))<2);await key('Escape');await frame();check('Escape returns from Deep',await ev('__sel.part===null'));
}

if(mode==='touch'){
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await go(0);const y=await ev('scrollY');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:360}]});for(let yy=340;yy>=160;yy-=30)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150,y:yy}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame();await frame();check('Touch advances native scroll',await ev('scrollY')>y+50);await go(2.45);await clickEl('#partsBtn');await clickEl('#pq');await send('Input.insertText',{text:'Escape wheel'});await clickEl('#plist button');await clickEl('#partsBtn');await clickEl('[data-m=deep]');await frame();await frame();console.log('touchDeep',await ev('({mode:__sel.mode,part:__sel.part?.name})'));const a=await ev('__dbg.camera.position.toArray()');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:140,y:230}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:205,y:255}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame();await frame();await frame();const b=await ev('__dbg.camera.position.toArray()');check('Touch Deep orbit',Math.hypot(...a.map((v,i)=>v-b[i]))>.1);await key('Escape');await frame();check('Leaving Deep restores page pan',await ev('getComputedStyle(document.querySelector("#gl")).touchAction==="pan-y"'));
}
check('No runtime errors',logs.length===0,logs);fs.writeFileSync('/downloads/v5-'+mode+'-results.json',JSON.stringify(result,null,2));ws.close();ch.kill();server.kill();setTimeout(()=>process.exit(result.some(r=>!r.pass)?1:0),300);
