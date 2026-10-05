const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const ignored=new Set(['dist','.git','node_modules','data']);
const files=[];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(dir==='.' && ignored.has(entry.name)) continue;
    const relative=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(relative);
    else if(entry.isFile() && relative.endsWith('.js')) files.push(relative);
  }
}

walk('.');
let failed=false;
for(const file of files.sort()){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){
    console.error(result.stderr||file+' syntax validation failed');
    failed=true;
  }else{
    console.log('Syntax OK: '+file);
  }
}
if(failed) process.exitCode=1;
