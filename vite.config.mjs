import {defineConfig} from 'vite';
export default defineConfig({base:'./',resolve:{alias:{three:new URL('./vendor/three.module.js',import.meta.url).pathname}},build:{outDir:'build',target:'esnext'},server:{port:5173}});
