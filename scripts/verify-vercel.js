'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const failures=[];
if(config.buildCommand!=='npm run build')failures.push('vercel.json buildCommand must be npm run build.');
if(config.installCommand!=='npm install')failures.push('vercel.json installCommand must be npm install.');
if(config.outputDirectory!=='dist')failures.push('vercel.json outputDirectory must be dist.');
if(config.framework!==null)failures.push('vercel.json framework must remain null.');
if(config.cleanUrls!==true)failures.push('vercel.json cleanUrls must remain true.');
if(pkg.type==='module')failures.push('package.json type=module conflicts with current server/API module layout.');
if(pkg.engines?.node!=='22.x')failures.push('package.json must pin Node.js 22.x for this tested deployment baseline.');
const apiDir=path.join(root,'api');
const hostedApiFallback=path.join(apiDir,'[...path].js');
const entries=fs.existsSync(apiDir)?fs.readdirSync(apiDir).filter(file=>/\.(?:js|mjs|cjs|ts|mts|cts)$/i.test(file)):[];
const hostedWorkerRoute=path.join(apiDir,'worker','[...path].js');
const routes=new Map();
for(const file of entries){const route=file.replace(/\.(?:js|mjs|cjs|ts|mts|cts)$/i,'').toLowerCase();routes.set(route,[...(routes.get(route)||[]),file]);}
for(const [route,variants] of routes)if(variants.length!==1)failures.push(`/api/${route} has duplicate implementations: ${variants.join(', ')}.`);
for(const route of ['status','health','commons-search','commons-media'])if(routes.get(route)?.length!==1)failures.push(`Expected exactly one /api/${route} handler.`);
if(!fs.existsSync(hostedWorkerRoute))failures.push('Missing hosted /api/worker/[...path].js fallback route.');
if(!fs.existsSync(hostedApiFallback))failures.push('Missing hosted /api/[...path].js API fallback route.');
const dist=path.join(root,config.outputDirectory);
for(const file of ['index.html','styles.css','app.js'])if(!fs.existsSync(path.join(dist,file)))failures.push(`Missing deployment output dist/${file}.`);
if(failures.length){console.error('Vercel verification FAILED:\n'+failures.map(v=>` - ${v}`).join('\n'));process.exit(1);}
console.log(`Vercel verification PASSED · ${entries.length} unique root API route(s) · hosted worker fallback present · static output is complete.`);
