import { build } from 'esbuild';
import fs from 'node:fs';
const modelURI='data:model/gltf-binary;base64,'+fs.readFileSync('assets/datejust-original.glb').toString('base64');
const r = await build({ plugins:[{name:'inline-model',setup(b){b.onLoad({filter:/datejust\.js$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace("new URL('../assets/datejust-original.glb',import.meta.url).href",JSON.stringify(modelURI)),loader:'js'}));}}], entryPoints: ['js/main.js'], bundle: true, minify: true, format: 'esm', write: false, alias: { three: './vendor/three.module.js' }, target: 'es2022' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const css = fs.readFileSync('css/style.css', 'utf8');
let html = fs.readFileSync('index.html', 'utf8')
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${css}</style>`)
  .replace(/<script type="importmap">.*?<\/script>/s, '')
  .replace(/<script type="module" src="js\/main.js"><\/script>/, () => `<script type="module">${js}</script>`);
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('dist/index.html', (html.length / 1024).toFixed(0) + ' KB');
