// Live interaction test via Chrome DevTools Protocol. usage: node tools/e2e.mjs
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const server=spawn('python3',['-m','http.server','8184','--bind','127.0.0.1'],{stdio:'ignore'});
const W=+process.env.W||640,H=+process.env.H||400, port=+(process.env.PORT||9333);
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
await ev('__dbg.renderer.setPixelRatio(.35)');
log('loaded', await ev('!!window.__dbg'));
log('parts', await ev('__watch.parts.length'));
const setP=async(P,wait=500)=>{console.log("setP",P,Date.now()%100000);await key('Escape');await ev(`scrollTo(0,(${P}/9)*(document.documentElement.scrollHeight-innerHeight));__dbg.paced.reset(${P})`); const t0=Date.now(); while(Date.now()-t0<15000){ const cur=await ev('__dbg.P'); if(Math.abs(cur-P)<0.003) break; await sleep(150);} await sleep(wait);};
const key=async(k,code)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:code||k,windowsVirtualKeyCode:({ArrowDown:40,ArrowUp:38,' ':32,Escape:27})[k]||0,text:k===' '?' ':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:code||k});};
const click=async(x,y)=>{await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(30);await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});if(process.env.PHASE!=='config')await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');else await sleep(80);};
const proj=(name)=>ev(`(()=>{const p=__watch.parts.find(p=>p.name.startsWith(${JSON.stringify(name)}));if(!p)return null;p.obj.updateWorldMatrix(true,false);const v=p.obj.localToWorld(p.center.clone().sub(p.obj.position));v.project(__dbg.camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,name:p.name}})()`);

const checks=[];const ok=(name,value)=>{checks.push({name,pass:!!value});log(name,value);if(!value)console.log('FAIL '+name)};
const clickEl=async sel=>{let r;for(let i=0;i<30;i++){r=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return {x,y,hit:e===document.elementFromPoint(x,y)||e.contains(document.elementFromPoint(x,y))}})()`);if(r?.hit)break;await ev('new Promise(r=>requestAnimationFrame(r))');}if(!r?.hit)throw Error('Control not actionable: '+sel);await click(r.x,r.y);};
const phase=process.env.PHASE||'core';
if(phase==='core'){
ok('37 source objects plus concept parts',await ev('__watch.parts.filter(p=>p.imported).length===37&&new Set(__watch.parts.map(p=>p.id)).size===__watch.total'));
await clickEl('#aboutBtn');await sleep(450);ok('Study opens',await ev('document.querySelector("#about").open'));await clickEl('#aboutClose');
await clickEl('#indexBtn');await sleep(650);ok('Index opens',await ev('document.querySelector("#index").classList.contains("show")'));await clickEl('#idxClose');await sleep(800);ok('Index closes',await ev('!document.querySelector("#index").classList.contains("show")'));
await key('Escape');await sleep(600);await key('ArrowDown');await sleep(2000);ok('Arrow navigation reaches a composed chapter pose',await ev('Math.abs(__dbg.P-1.65)<.01'));await key('Escape');
await setP(2.4);await sleep(600);await clickEl('#startChrono');await sleep(700);log('chrono',await ev('({ctl:__dbg.ctl,chrono:__watch.k.chrono})'));ok('Start advances stopwatch',await ev('__dbg.ctl.running&&__watch.k.chrono>0'));
ok('Reset blocked running',await ev('document.querySelector("#resetChrono").disabled'));await clickEl('#startChrono');let held=await ev('__watch.k.chrono');await sleep(500);ok('Stop holds time',Math.abs(held-await ev('__watch.k.chrono'))<.01);await clickEl('#resetChrono');await sleep(600);ok('Reset zero',await ev('__watch.k.chrono===0'));
}
if(phase==='config'){
await sleep(2000);log('cfg status',await ev('({P:__dbg.P,cl:document.querySelector("#config").className})'));await clickEl('#sync');let variants=true;
for(const d of (process.env.DIAL?[process.env.DIAL]:['ink','blue','silver']))for(const h of (process.env.HARDWARE?[process.env.HARDWARE]:['silver','graphite','champagne']))for(const b of ['silver','graphite','champagne']){await clickEl(`.opts[data-k=dial] [data-id=${d}]`);await clickEl(`.opts[data-k=hw] [data-id=${h}]`);await clickEl(`.opts[data-k=bracelet] [data-id=${b}]`);variants&&=await ev(`__watch.cfg.dial==='${d}'&&__watch.cfg.hw==='${h}'&&__watch.cfg.bracelet==='${b}'`)}ok('Unpaired colour combinations via real clicks (DIAL restricts to nine)',variants);await shot('config');await clickEl('#sync');await clickEl('.opts[data-k=dial] [data-id=ink]');ok('Paired dial applies both materials',await ev('__watch.cfg.hw==="silver"&&__watch.cfg.bracelet==="silver"'));
}
if(phase==='inspect'){
await setP(2.4);await clickEl('#partsBtn');await clickEl('#pq');await send('Input.insertText',{text:'Escape wheel'});ok('Parts search',await ev('document.querySelectorAll("#plist button").length===1'));await clickEl('#plist button');ok('Highlight selection',await ev('__sel.part?.name==="Escape wheel"'));await clickEl('#partsBtn');await clickEl('[data-m=isolate]');await sleep(500);ok('Isolate dims rest',await ev('__watch.parts.filter(p=>p!==__sel.part).every(p=>p.state.fade<.08)'));
await clickEl('[data-m=deep]');await sleep(500);const before=await ev('__dbg.camera.position.toArray()');await send('Input.dispatchMouseEvent',{type:'mousePressed',x:400,y:135,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:460,y:140,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:460,y:140,button:'left',clickCount:1});await sleep(500);const after=await ev('__dbg.camera.position.toArray()');ok('Deep drag orbits',Math.hypot(...after.map((v,i)=>v-before[i]))>.1);const sy=await ev('scrollY');await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:400,y:135,deltaX:0,deltaY:-100});await sleep(500);ok('Deep wheel does not page scroll',Math.abs(sy-await ev('scrollY'))<2);await shot('deep');await key('Escape');ok('Escape clears selection',await ev('__sel.part===null'));
await setP(1);const pose=await ev('__watch.parts.filter(p=>!p.anim).map(p=>p.obj.position.toArray())');await setP(7.5);await setP(1);const pose2=await ev('__watch.parts.filter(p=>!p.anim).map(p=>p.obj.position.toArray())');ok('Reverse scroll restores geometry positions',Math.max(...pose.flat().map((v,i)=>Math.abs(v-pose2.flat()[i])))<1);
await key('Escape');await ev('document.activeElement.blur()');await setP(8.85);await clickEl('#play');for(let i=0;i<60;i++){if(await ev('!__dbg.auto&&__dbg.P>8.9'))break;await sleep(300)}ok('Autoplay stops at end',await ev('!__dbg.auto&&__dbg.P>8.9'));await clickEl('#play');await sleep(1000);ok('Play restarts from end',await ev('__dbg.auto&&__dbg.P<1'));await clickEl('#play');
}
if(phase==='pusher'){
await setP(2.4);await clickEl('#partsBtn');await clickEl('#pq');await send('Input.insertText',{text:'Pusher cap'});log('pusher labels',await ev('[...document.querySelectorAll("#plist button")].map(e=>e.textContent)'));
await clickEl('#plist button:first-child');ok('Pusher at 2 starts timing',await ev('__dbg.ctl.running'));
await clickEl('#plist button:first-child');ok('Pusher at 2 stops timing',await ev('!__dbg.ctl.running'));
await clickEl('#plist button:last-child');await sleep(600);ok('Pusher at 4 resets timing',await ev('__watch.k.chrono===0'));
await clickEl('#partsBtn');await key('Escape');
}
if(phase==='touch'){
await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await setP(0);const y=await ev('scrollY');await send('Input.synthesizeScrollGesture',{x:160,y:350,yDistance:-500,speed:700,gestureSourceType:'touch'});await sleep(1500);log('touch scroll state',await ev('({y:scrollY,act:getComputedStyle(document.querySelector("#gl")).touchAction,body:document.body.className})'));await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:350}]});for(let y=340;y>=120;y-=20){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:150,y}]});await sleep(30)}await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(1200);ok('Touch swiping advances page',await ev('scrollY')>y+100);
await setP(2.4);await clickEl('#partsBtn');await clickEl('#pq');await send('Input.insertText',{text:'Escape wheel'});await clickEl('#plist button');await clickEl('#partsBtn');await clickEl('[data-m=deep]');await sleep(700);ok('Deep sets touch orbit mode',await ev('getComputedStyle(document.querySelector("#gl")).touchAction==="none"'));
const before=await ev('__dbg.camera.position.toArray()');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:140,y:220}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:240}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(700);const after=await ev('__dbg.camera.position.toArray()');ok('Touch drag orbits selected part',Math.hypot(...after.map((v,i)=>v-before[i]))>.1);
await key('Escape');ok('Leaving Deep restores page pan',await ev('getComputedStyle(document.querySelector("#gl")).touchAction==="pan-y"'));await shot('touch-final');
}
if(phase==='movement'){
await setP(2.34);await clickEl('[data-focus=train]');await sleep(600);ok('Energy focus',await ev('document.querySelector("[data-focus=train]").classList.contains("on")'));
await clickEl('[data-focus=balance]');await sleep(600);ok('Balance focus dims other assemblies',await ev('__watch.parts.find(p=>p.name==="Column wheel").state.fade<.2'));
await clickEl('#mechanismPause');const time=await ev('__dbg.mechanismTime');await sleep(700);ok('Pause stops internal mechanism time',Math.abs(time-await ev('__dbg.mechanismTime'))<.001);await clickEl('#mechanismPause');await sleep(500);ok('Resume restores movement',await ev('__dbg.mechanismTime')>time);
await clickEl('[data-focus=all]');await clickEl('#openBridges');await sleep(700);ok('Opening bridges reveals train',await ev('__watch.parts.find(p=>p.name==="Train bridge").state.fade<.1&&__watch.parts.find(p=>p.name==="Mainplate").state.fade>.9'));await clickEl('#openBridges');
await shot('movement-controls');
await clickEl('[data-focus=balance]');await sleep(800);await shot('balance-a');await sleep(1100);await shot('balance-b');await clickEl('[data-focus=train]');await sleep(700);await shot('train');await clickEl('[data-focus=all]');
// Override only for deterministic calendar/hand verification, never normal operation.
await setP(0);await ev('window.__clockOverride="2028-02-29T23:59:59.500"');for(let i=0;i<40;i++){if(await ev('__dbg.sourceModel.calendar.key==="2028-1-29"'))break;await sleep(200)};ok('Leap day calendar drawn',await ev('__dbg.sourceModel.calendar.key==="2028-1-29"'));
const before=await ev('__watch.parts.find(p=>p.name==="Hour hand").obj.quaternion.toArray()');await ev('window.__clockOverride="2028-03-01T00:00:00.000"');for(let i=0;i<30;i++){if(await ev('__dbg.sourceModel.calendar.key==="2028-2-1"'))break;await sleep(200)};ok('Midnight rolls date from leap day',await ev('__dbg.sourceModel.calendar.key==="2028-2-1"'));
await ev('window.__clockOverride="2026-12-31T23:59:59.900"');await sleep(500);await ev('window.__clockOverride="2027-01-01T00:00:00.000"');for(let i=0;i<40;i++){if(await ev('__dbg.sourceModel.calendar.key==="2027-0-1"'))break;await sleep(200)};ok('Year boundary calendar',await ev('__dbg.sourceModel.calendar.key==="2027-0-1"'));
ok('All three hands point up at midnight',await ev('__watch.parts.filter(p=>p.handBaseAngle!=null).every(p=>{const a=p.handBaseAngle-2*Math.atan2(p.obj.quaternion.z,p.obj.quaternion.w);return Math.abs(Math.sin(a))<.001&&Math.cos(a)>.999})'));
await ev('window.__clockOverride="2026-10-26T19:52:42.000"');for(let i=0;i<40;i++){if(await ev('__dbg.sourceModel.calendar.key==="2026-9-26"'))break;await sleep(200)};await shot('live-calendar');
await ev('delete window.__clockOverride');await sleep(400);ok('Clearing override recovers live clock',await ev('__dbg.sourceModel.calendar.key!=="2027-0-1"'));
}
if(phase==='sweep'){
await setP(0);await ev('__dbg.renderer.setPixelRatio(1)');
const samples=await ev(`new Promise(resolve=>{let a=[];function sample(){const p=__watch.parts.find(p=>p.name==='Seconds hand');a.push({at:Date.now(),q:p.obj.quaternion.toArray()});if(a.length===8)resolve(a);else requestAnimationFrame(sample)}requestAnimationFrame(sample)})`);log('live sweep samples',samples);
ok('Each rendered live second-hand pose differs',samples.every((v,i)=>!i||Math.hypot(...v.q.map((x,k)=>x-samples[i-1].q[k]))>1e-6));
for(const [clock,name] of [['2026-10-26T20:03:59.900','sweep-before'],['2026-10-26T20:04:00.100','sweep-after']]){await ev('window.__clockOverride='+JSON.stringify(clock));await ev('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await shot(name)}
const angles=await ev(`(()=>{const p=__watch.parts.find(p=>p.name==='Seconds hand');return {q:p.obj.quaternion.toArray(),base:p.handBaseAngle}})()`);log('wrap after',angles);
await ev('delete window.__clockOverride');const original=tabs.find(t=>t.type==='page').id;const extra=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:extra.result.targetId});await sleep(2100);await send('Target.activateTarget',{targetId:original});await send('Page.bringToFront');await sleep(1500);await send('Target.closeTarget',{targetId:extra.result.targetId});
ok('Tab recovery matches fresh wall time',await ev(`(()=>{const d=new Date(),p=__watch.parts.find(p=>p.name==='Seconds hand'),a=p.handBaseAngle-(d.getSeconds()+d.getMilliseconds()/1000)/60*Math.PI*2;return Math.abs(Math.sin((a-2*Math.atan2(p.obj.quaternion.z,p.obj.quaternion.w))/2))<.03})()`));
}
if(phase==='focus'){await setP(2.34);await clickEl('[data-focus=balance]');await sleep(600);await shot('focus-final');ok('Focus headline hidden',await ev('getComputedStyle(document.querySelector("#chapter")).visibility==="hidden"'));}
if(phase==='finite'){
let finite=true;for(let p=0;p<=9;p+=.5){await setP(p,0);finite&&=await ev('__watch.parts.every(p=>[...p.obj.position.toArray(),...p.obj.quaternion.toArray(),...p.obj.scale.toArray()].every(Number.isFinite))')}ok('Finite transforms across 19 rendered states',finite);ok('No runtime exceptions',logs.length===0);}
ok('No runtime exceptions',logs.length===0);log('runtime issues',logs);fs.writeFileSync('QA-'+(process.env.PHASE||'core')+(process.env.DIAL||'')+(process.env.HARDWARE||'')+'.json',JSON.stringify({viewport:[W,H],checks,logs},null,2));ws.close();ch.kill();server.kill();process.exit(checks.every(c=>c.pass)?0:2);