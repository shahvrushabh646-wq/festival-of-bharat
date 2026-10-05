'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {createBackgroundWorker}=require('../background-worker.js');

const projectRoot=path.resolve(__dirname,'..');
function loadLocalEnv(file){if(!fs.existsSync(file))return;for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const match=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');}}
loadLocalEnv(path.join(projectRoot,'.env'));
const ffmpeg=process.env.FOB_FFMPEG_PATH||process.env.FFMPEG_PATH||'ffmpeg';
const ffprobe=process.env.FOB_FFPROBE_PATH||process.env.FFPROBE_PATH||'ffprobe';
const pillars=['The Moment','The Detail','The Energy','The Meaning'];
const templates=['moment','detail','energy','meaning'];
const palette=['0xB22222','0xC58B12','0x126E58','0x283F78'];
function run(args,command=ffmpeg){const result=spawnSync(command,args,{encoding:'utf8',windowsHide:true});if(result.error||result.status!==0)throw new Error(result.error?.message||`${path.basename(command)} exited ${result.status}: ${(result.stderr||'').split(/\r?\n/).slice(-8).join(' ')}`);}
function inspectPhoto(file){const result=spawnSync(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=pix_fmt,color_range,width,height','-of','json',file],{encoding:'utf8',windowsHide:true});if(result.error||result.status!==0)throw new Error(`Could not inspect JPEG smoke-test input: ${result.error?.message||result.stderr}`);const stream=JSON.parse(result.stdout||'{}').streams?.[0];if(!stream?.width||!stream?.height)throw new Error('JPEG smoke-test input has no decodable image stream.');if(!String(stream.pix_fmt||'').startsWith('yuvj')&&!['pc','jpeg'].includes(String(stream.color_range||'').toLowerCase()))throw new Error(`JPEG fixture is not reported full range; cannot exercise the JPEG range regression: ${JSON.stringify(stream)}`);return{pixelFormat:stream.pix_fmt,colorRange:stream.color_range,width:stream.width,height:stream.height};}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function makeReelFixtures(reelIndex,assetDir){
  const basePhoto=`${crypto.randomUUID()}.jpg`,baseVideo=`${crypto.randomUUID()}.mp4`,color=palette[reelIndex];
  run(['-y','-f','lavfi','-i',`color=c=${color}:s=1080x1920:d=1.5`,'-frames:v','1',path.join(assetDir,basePhoto)]);
  const photoInput=inspectPhoto(path.join(assetDir,basePhoto));
  run(['-y','-f','lavfi','-i','testsrc2=s=1080x1920:r=30:d=1.5','-vf',`drawbox=x=${40+reelIndex*140}:y=160:w=360:h=260:color=${color}@0.85:t=fill,drawtext=text='Festival of Bharat':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2`,'-an','-c:v','libx264','-preset','ultrafast','-tune','zerolatency','-pix_fmt','yuv420p','-r','30',path.join(assetDir,baseVideo)]);
  const filenames=[];
  for(let sceneIndex=0;sceneIndex<8;sceneIndex++){
    const mediaType=sceneIndex%2===0?'photo':'video',extension=mediaType==='photo'?'jpg':'mp4',filename=`${crypto.randomUUID()}.${extension}`;
    fs.copyFileSync(path.join(assetDir,mediaType==='photo'?basePhoto:baseVideo),path.join(assetDir,filename));filenames.push({filename,mediaType});
  }
  fs.unlinkSync(path.join(assetDir,basePhoto));fs.unlinkSync(path.join(assetDir,baseVideo));
  return{topic:'Ganesh Chaturthi Mumbai',pillar:pillars[reelIndex],template:templates[reelIndex],title:`Ganesh Chaturthi Mumbai · ${pillars[reelIndex]}`,photoInput,scenes:filenames.map(({filename,mediaType},sceneIndex)=>({filename,width:1080,height:1920,mediaType,seconds:1.5,text:`${pillars[reelIndex]} ${sceneIndex+1}`,motion:sceneIndex%2?'pan right':'slow push',transition:sceneIndex===0?'hard cut':sceneIndex%2?'soft reveal':'match cut',rights:{verified:true,creator:'Synthetic local verification fixture',license:'Generated test fixture; not for publication',sourceUrl:'local://verification-fixture'}}))};
}
async function verifyProduction(singleFixtureIndex=null){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'fob-production-smoke-'));
  const assetDir=path.join(root,'assets'),jobsDir=path.join(root,'jobs'),renderDir=path.join(root,'renders');
  fs.mkdirSync(assetDir,{recursive:true});
  let worker=null;
  try{
    worker=createBackgroundWorker({jobsDir,assetDir,renderDir,ffmpeg,ffprobe,ffmpegAvailable:true,ffprobeAvailable:true,enabled:true,autostart:true,scheduleEnabled:false,preset:'ultrafast'});
    const inputs=[makeReelFixtures(singleFixtureIndex===null?0:singleFixtureIndex,assetDir)];
    const queued=inputs.map(input=>worker.enqueue(input));
    const deadline=Date.now()+Math.max(180000,reelCount*180000);let jobs=queued.map(job=>worker.get(job.id));
    while(Date.now()<deadline){jobs=queued.map(job=>worker.get(job.id));if(jobs.every(job=>job.status==='READY_FOR_REVIEW'||job.status==='FAILED'))break;await sleep(250);}
    jobs=queued.map(job=>worker.get(job.id));const failures=jobs.filter(job=>job.status!=='READY_FOR_REVIEW');
    if(failures.length)throw new Error(failures.map(job=>`${job.title}: ${job.error||job.message||job.status}`).join(' | '));
    const outputs=jobs.map((job,index)=>{const output=path.join(renderDir,job.outputFilename);if(!fs.existsSync(output))throw new Error(`${job.title}: MP4 output missing`);if(!job.qc?.passed)throw new Error(`${job.title}: QC did not pass`);if(job.qc.codec!=='h264'||job.qc.pixelFormat!=='yuv420p'||job.qc.width!==1080||job.qc.height!==1920||job.qc.fps<29.5||job.qc.fps>30.5||!(job.qc.duration>0))throw new Error(`${job.title}: final file reported unexpected FFprobe values: ${JSON.stringify({codec:job.qc.codec,pixelFormat:job.qc.pixelFormat,width:job.qc.width,height:job.qc.height,fps:job.qc.fps,duration:job.qc.duration})}`);return{title:job.title,file:path.basename(output),bytes:fs.statSync(output).size,duration:job.qc.duration,width:job.qc.width,height:job.qc.height,fps:job.qc.fps,codec:job.qc.codec,pixelFormat:job.qc.pixelFormat,inputJpeg:inputs[index].photoInput,photoScenes:4,videoScenes:4,attempts:job.attempts,qc:job.qc};});
    for(const output of outputs)console.log(`${output.title} FINAL FFPROBE · codec: ${output.codec} · pixel_format: ${output.pixelFormat} · resolution: ${output.width}x${output.height} · fps: ${output.fps} · duration: ${output.duration}s`);
    const result={status:'READY_FOR_REVIEW',mode:singleFixtureIndex===null?'MIXED_MEDIA_PRODUCTION_SMOKE':`SINGLE_REEL_ACCEPTANCE_FIXTURE_${singleFixtureIndex+1}`,queueJobs:jobs.length,distinctLocalAssetFiles:8,outputs};console.log(JSON.stringify(result,null,2));return result;
  }catch(error){console.error(`Production verification FAILED: ${error.message}`);return {status:'FAILED',error:error.message};}
  finally{worker?.shutdown?.();fs.rmSync(root,{recursive:true,force:true});}
}

async function main(){
  if(process.argv.includes('--four-reels')){
    for(let index=0;index<4;index++){
      const result=await verifyProduction(index);
      if(result?.status!=='READY_FOR_REVIEW'){
        process.exitCode=1;
        break;
      }
    }
    if(!process.exitCode)console.log('Overnight verification PASSED: 4/4 independent real-render acceptance fixtures completed and passed QC sequentially.');
    return;
  }
  const raw=process.env.FOB_REEL_INDEX;
  const index=raw===undefined?null:Number(raw);
  const result=await verifyProduction(index!==null&&Number.isInteger(index)&&index>=0&&index<4?index:null);
  if(result?.status!=='READY_FOR_REVIEW')process.exitCode=1;
}
if(require.main===module)main();
module.exports={verifyProduction};
