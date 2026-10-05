const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const output=path.join(root,'dist');
const files=['index.html','app.js','production-planning.js','commons.js','asset-import.js','background-worker.js','vision-provider.js','instagram-insights.js','server.js','styles.css','overrides.css','sw.js','manifest.webmanifest','icon.svg','README.md','.env.example','package.json','vercel.json','scripts/start-studio.ps1','scripts/register-startup-task.ps1','scripts/typecheck.js','scripts/build.js','scripts/verify-production.js','scripts/verify-overnight.js','scripts/verify-vercel.js','test/production-planning.test.js','test/commons-assets.test.js'];
const apiRoot=path.join(root,'api');
function collectApiFiles(directory=apiRoot){
  if(!fs.existsSync(directory))return[];
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())return collectApiFiles(absolute);
    return entry.isFile()&&/\.(?:js|mjs|cjs|ts|mts|cts)$/i.test(entry.name)
      ? [path.relative(apiRoot,absolute).replace(/\\/g,'/')] : [];
  });
}
const apiFiles=collectApiFiles();
const routes=new Map();
for(const filename of apiFiles){
  const route=filename.replace(/\.(?:js|mjs|cjs|ts|mts|cts)$/i,'').toLowerCase();
  routes.set(route,[...(routes.get(route)||[]),filename]);
}
const duplicates=[...routes].filter(([,variants])=>variants.length>1);
if(duplicates.length){
  console.error('Duplicate API route variants:\n'+duplicates.map(([route,variants])=>` - ${route}: ${variants.join(', ')}`).join('\n'));
  process.exit(1);
}
const packageJson=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(packageJson.type==='module'){
  console.error('package.json type=module is incompatible with the current mixed-runtime deployment.');
  process.exit(1);
}
const missing=files.filter(file=>!fs.existsSync(path.join(root,file)));
for(const required of ['api/worker/[...path].js','api/[...path].js']){
  if(!fs.existsSync(path.join(root,required)))missing.push(required);
}
if(missing.length){
  console.error('Build inputs missing:\n'+missing.map(file=>` - ${file}`).join('\n'));
  process.exit(1);
}
fs.rmSync(output,{recursive:true,force:true});
for(const file of files){
  const destination=path.join(output,file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(path.join(root,file),destination);
}
for(const required of [
  'index.html','styles.css','app.js',
  'api/status.js','api/health.js','api/commons-search.js','api/commons-media.js',
  'api/worker/[...path].js','api/[...path].js'
]){
  if(!fs.existsSync(path.join(output,required))){
    console.error(`Required deployment output is missing: dist/${required}`);
    process.exit(1);
  }
}
console.log(`Built ${files.length} local production files in ${output}; ${apiFiles.length} API files validated recursively; hosted worker and catch-all fallbacks validated.`);
