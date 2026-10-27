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

const result=[];const check=(name,pass,detail)=>{result.push({name,pass:!!pass,detail});console.log(name,pass,detail??'')};
const frame=()=>ev('new Promise(r=>requestAnimationFrame(r))');
const state=()=>ev('({P:__dbg.P,target:__dbg.target,y:scrollY,cam:__dbg.camera.position.toArray()})');
const goto=async p=>{await ev(`scrollTo(0,${p}/9*(document.documentElement.scrollHeight-innerHeight))`);await frame();};
const wheel=async d=>{await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:W*.63,y:H*.35,deltaX:0,deltaY:d});await frame();};
if(process.env.PHASE!=='states'){
await goto(2.45);for(const f of []){await clickEl(`[data-focus=${f}]`);await sleep(400);await frame();check('focus '+f+' stays in mechanism',Math.abs((await state()).P-2.45)<.01);await shot('r4-focus-'+f);}
await clickEl('#mechanismPause');const t=await ev('__dbg.mechanismTime');await frame();check('mechanism pause',Math.abs(t-await ev('__dbg.mechanismTime'))<.001);await clickEl('#mechanismPause');
await clickEl('#openBridges');await frame();check('bridge control',await ev('document.querySelector("#openBridges").checked'));await clickEl('#openBridges');
await clickEl('#startChrono');await sleep(400);await frame();check('chronograph starts',await ev('__watch.k.chrono>0&&__dbg.ctl.running'));await clickEl('#startChrono');await clickEl('#resetChrono');await frame();check('chronograph stops and resets',await ev('__watch.k.chrono===0'));
}
for(const p of (process.env.PHASE==='states'?(process.env.POSES||'0,1,1.99,2.04,2.98,3,3.62,4.55,5.78,6.55,7.38,7.98,8.12,8.38,8.63,8.89,9').split(',').map(Number):[])){await goto(p);const info=await ev('({finite:__dbg.camera.position.toArray().every(Number.isFinite),count:__watch.parts.filter(p=>p.obj.visible&&p.state.fade>.3).length})');check('timeline '+p,info.finite&&info.count>0,info);await shot('r4-state-'+String(p).replace('.','_'));}
check('no runtime errors',logs.length===0,logs);fs.writeFileSync('/downloads/v5-controls-'+(process.env.PHASE||'interaction')+'-results.json',JSON.stringify(result,null,2));
ws.close();ch.kill();server.kill();setTimeout(()=>process.exit(result.some(r=>!r.pass)?1:0),400);
