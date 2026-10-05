const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { spawn,spawnSync } = require('node:child_process');
const {createBackgroundWorker,safeAssetName}=require('./background-worker');
const {analyzeAssets}=require('./vision-provider');
const instagramAuth=require('./instagram-insights');
const planning=require('./production-planning');
const {searchCommons}=require('./commons');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8766);
const ASSET_DIR = path.join(ROOT, 'data', 'assets');
const RENDER_DIR = path.join(ROOT, 'data', 'renders');
const JOB_DIR = path.join(ROOT, 'data', 'jobs');
const INSTAGRAM_DIR=path.join(ROOT,'data','instagram');
const INSTAGRAM_TOKEN_FILE=path.join(INSTAGRAM_DIR,'token.enc.json');
const INSTAGRAM_STATE_FILE=path.join(INSTAGRAM_DIR,'oauth-state.json');
const INSTAGRAM_INSIGHTS_FILE=path.join(INSTAGRAM_DIR,'insights.json');
const ASSET_CATALOG_FILE=path.join(ASSET_DIR,'catalog.json');
loadEnvFile(path.join(ROOT, '.env'));
const FFMPEG_COMMAND=process.env.FOB_FFMPEG_PATH||process.env.FFMPEG_PATH||'ffmpeg';
const FFPROBE_COMMAND=process.env.FOB_FFPROBE_PATH||process.env.FFPROBE_PATH||'ffprobe';
const FFPROBE_AVAILABLE = spawnSync(FFPROBE_COMMAND,['-version'],{encoding:'utf8',timeout:3000,windowsHide:true}).status===0;
const FFMPEG_AVAILABLE = spawnSync(FFMPEG_COMMAND,['-version'],{encoding:'utf8',timeout:3000,windowsHide:true}).status===0;
fs.mkdirSync(ASSET_DIR, { recursive:true });
fs.mkdirSync(RENDER_DIR, { recursive:true });
const backgroundWorker=createBackgroundWorker({jobsDir:JOB_DIR,assetDir:ASSET_DIR,renderDir:RENDER_DIR,ffmpeg:FFMPEG_COMMAND,ffprobe:FFPROBE_COMMAND,ffmpegAvailable:FFMPEG_AVAILABLE,ffprobeAvailable:FFPROBE_AVAILABLE});
const VISION_MODEL=process.env.VISION_MODEL||'gpt-4.1-mini';

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const row of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = row.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.mp4':'video/mp4', '.mov':'video/quicktime', '.webm':'video/webm', '.ogv':'video/ogg', '.ogg':'video/ogg' };
function readAssetCatalog(){try{const records=JSON.parse(fs.readFileSync(ASSET_CATALOG_FILE,'utf8'));return Array.isArray(records)?records:[];}catch(error){if(error.code!=='ENOENT')console.error(`Local asset catalog could not be read: ${error.message}`);return[];}}
async function cacheAssetRecord(record){const records=readAssetCatalog().filter(item=>item.id!==record.id);records.push(record);const temp=`${ASSET_CATALOG_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;await fs.promises.writeFile(temp,JSON.stringify(records,null,2));await fs.promises.rename(temp,ASSET_CATALOG_FILE);}
function findCachedRemoteAsset(mediaUrl){const record=readAssetCatalog().find(item=>item.mediaUrl===mediaUrl&&item.filename&&fs.existsSync(path.join(ASSET_DIR,path.basename(item.filename))));return record||null;}
async function fetchWithRetry(url,options,label){let lastError;const{timeoutMs,...fetchOptions}=options;for(let attempt=1;attempt<=3;attempt++){try{const response=await fetch(url,{...fetchOptions,signal:timeoutMs?AbortSignal.timeout(timeoutMs):fetchOptions.signal});if(response.ok)return response;lastError=new Error(`HTTP ${response.status}${response.statusText?` ${response.statusText}`:''}`);}catch(error){lastError=error;}if(attempt<3)await new Promise(resolve=>setTimeout(resolve,250*2**(attempt-1)));}throw new Error(`${label} failed after 3 attempts: ${lastError?.message||'unknown network error'}`);}
async function fetchBufferWithRetry(url,options,label){let lastError;const{timeoutMs,...fetchOptions}=options;for(let attempt=1;attempt<=3;attempt++){try{const response=await fetch(url,{...fetchOptions,signal:timeoutMs?AbortSignal.timeout(timeoutMs):fetchOptions.signal});if(!response.ok)throw new Error(`HTTP ${response.status}${response.statusText?` ${response.statusText}`:''}`);return{response,buffer:Buffer.from(await response.arrayBuffer())};}catch(error){lastError=error;}if(attempt<3)await new Promise(resolve=>setTimeout(resolve,250*2**(attempt-1)));}throw new Error(`${label} failed after 3 attempts: ${lastError?.message||'unknown network error'}`);}
function inspectDownloadedMedia(file){if(!FFPROBE_AVAILABLE||!FFMPEG_AVAILABLE)return{ok:false,error:'FFmpeg and FFprobe are required to verify downloaded media.'};const probe=spawnSync(FFPROBE_COMMAND,['-v','error','-select_streams','v:0','-show_entries','stream=codec_type,width,height','-of','json',file],{encoding:'utf8',timeout:30000,windowsHide:true});if(probe.error||probe.status!==0)return{ok:false,error:`FFprobe could not read downloaded media: ${probe.error?.message||String(probe.stderr||'invalid media').trim()}`};let stream;try{stream=JSON.parse(probe.stdout||'{}').streams?.[0];}catch{return{ok:false,error:'FFprobe returned invalid media metadata.'};}if(!stream?.width||!stream?.height)return{ok:false,error:'Downloaded file has no decodable video/image stream or dimensions.'};const decode=spawnSync(FFMPEG_COMMAND,['-v','error','-i',file,'-frames:v','1','-f','null','-'],{encoding:'utf8',timeout:60000,windowsHide:true});if(decode.error||decode.status!==0)return{ok:false,error:`FFmpeg could not decode downloaded media: ${decode.error?.message||String(decode.stderr||'decode failed').trim()}`};return{ok:true,width:Number(stream.width),height:Number(stream.height)};}
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function durationSeconds(iso) {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}

function metadataValue(extmetadata, key) {
  return String(extmetadata?.[key]?.value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function commonsSearch(url, res) {
  const query=(url.searchParams.get('q')||'').trim();
  if(!query)return send(res,400,{error:'Enter a topic to search Wikimedia Commons.'});
  try{const result=await searchCommons(query);send(res,200,{query,...result});}
  catch(error){send(res,502,{query,error:error.message,source:'Wikimedia Commons',results:[],diagnostics:{httpStatus:null,raw:0,returned:0,rejected:0,requestFailed:true}});}
}

async function commonsMediaProxy(url,res){
  let source;try{source=new URL(url.searchParams.get('url')||'');}catch{return send(res,400,{error:'A valid Wikimedia media URL is required.'});}
  if(source.protocol!=='https:'||!['upload.wikimedia.org','commons.wikimedia.org'].includes(source.hostname))return send(res,400,{error:'Only public Wikimedia Commons media URLs are allowed.'});
  try{const response=await fetchWithRetry(source,{timeoutMs:60000},'Wikimedia media proxy');const type=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();if(!type.startsWith('image/')&&!type.startsWith('video/'))return send(res,415,{error:`Wikimedia returned unsupported media type ${type||'(missing)'}.`});const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length)return send(res,502,{error:'Wikimedia returned an empty media file.'});if(bytes.length>100*1024*1024)return send(res,413,{error:'Media exceeds the 100 MB import limit.'});res.writeHead(200,{'Content-Type':type,'Content-Length':String(bytes.length),'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch(error){send(res,502,{error:error.message});}
}

async function importCommonsAsset(req,res) {
  try {
    const chunks=[]; let bytes=0;
    for await (const chunk of req) { bytes+=chunk.length; if(bytes>20000) return send(res,413,{error:'Asset metadata is too large.'}); chunks.push(chunk); }
    const asset=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(asset?.source!=='Wikimedia Commons'||!asset.creator||!asset.license||!asset.licenseUrl||!asset.licenseCompatible||!asset.licenseEvidence||!asset.pageUrl?.startsWith('https://commons.wikimedia.org/wiki/'))return send(res,422,{error:'Commons asset lacks an accepted licence URL, recorded creator, or actual file page.'});
    const source=new URL(asset.mediaUrl);
    if(source.protocol!=='https:' || !['upload.wikimedia.org','commons.wikimedia.org'].includes(source.hostname)) return send(res,400,{error:'Only Wikimedia Commons media URLs can be imported.'});
    const cached=findCachedRemoteAsset(asset.mediaUrl);if(cached)return send(res,200,{asset:cached,cached:true});
    const ext=path.extname(decodeURIComponent(source.pathname)).toLowerCase();
    const allowed=new Set(['.jpg','.jpeg','.png','.webp','.mp4','.webm','.ogv','.ogg']);
    if(!allowed.has(ext)) return send(res,415,{error:'This Wikimedia format cannot be used in the reel editor.'});
    if(!FFPROBE_AVAILABLE||!FFMPEG_AVAILABLE)return send(res,503,{error:'Real asset download failed — FFmpeg and FFprobe are required to verify media; no fake asset substituted.',code:'ASSET_DOWNLOAD_FAILED'});
    const {response,buffer}=await fetchBufferWithRetry(source,{headers:{'User-Agent':'FestivalOfBharatStudio/1.0 (personal local reel editor)'},timeoutMs:60000},'Wikimedia media download');
    const type=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
    if(!(type.startsWith('image/')||type.startsWith('video/'))||type!==String(asset.mime||'').split(';')[0].toLowerCase()) return send(res,415,{error:`Wikimedia media MIME ${type||'(missing)'} does not match the recorded Commons MIME ${asset.mime||'(missing)'}.`});
    const declared=Number(response.headers.get('content-length')||0);
    if(declared>100*1024*1024) return send(res,413,{error:'Media is over the 100 MB import limit.'});
    if(buffer.length>100*1024*1024) return send(res,413,{error:'Media is over the 100 MB import limit.'});
    if(!buffer.length)return send(res,502,{error:'Real asset download failed — received an empty file; no fake asset substituted.',code:'ASSET_DOWNLOAD_FAILED'});
    const id=crypto.randomUUID(); const name=`${id}${ext}`,tempName=`${id}.download`;
    const tempPath=path.join(ASSET_DIR,tempName),localPath=path.join(ASSET_DIR,name);
    await fs.promises.writeFile(tempPath,buffer,{flag:'wx'});
    const decoded=inspectDownloadedMedia(tempPath);if(!decoded.ok){await fs.promises.unlink(tempPath).catch(()=>{});return send(res,422,{error:`Real asset download failed — ${decoded.error}; no fake asset substituted.`,code:'ASSET_DOWNLOAD_FAILED'});}
    await fs.promises.rename(tempPath,localPath);
    const downloadedAt=new Date().toISOString();const record={...asset,id,assetId:id,filename:name,localPath,localUrl:`/media/${name}`,mime:type,mediaType:type.startsWith('video/')?'video':'photo',width:decoded.width,height:decoded.height,size:buffer.length,hash:crypto.createHash('sha256').update(buffer).digest('hex'),source:'Wikimedia Commons',sourceUrl:asset.mediaUrl,sourcePage:asset.pageUrl,creator:asset.creator||'',license:asset.license||'',downloadedAt,importedAt:downloadedAt,metadataComplete:Boolean(asset.creator&&asset.license&&asset.licenseCompatible&&asset.pageUrl)};
    await cacheAssetRecord(record);
    send(res,201,{asset:record});
  } catch(error) {
    const failure=error instanceof SyntaxError?'Invalid asset record.':`Real asset download failed — ${error.message}; no fake asset substituted.`;
    send(res,error instanceof SyntaxError?400:502,{error:failure,code:error instanceof SyntaxError?undefined:'ASSET_DOWNLOAD_FAILED'});
  }
}

async function uploadUserAsset(req,res){
  try{
    let meta;try{meta=JSON.parse(Buffer.from(req.headers['x-asset-metadata']||'','base64').toString('utf8'));}catch{return send(res,400,{error:'Local media metadata is missing or invalid.'});}
    const ext=path.extname(String(meta.filename||'')).toLowerCase();const allowed=new Set(['.mp4','.mov','.webm','.jpg','.jpeg','.png','.webp']);if(!allowed.has(ext))return send(res,415,{error:'Choose an MP4, MOV, WEBM, JPG, JPEG, PNG, or WEBP file.'});
    const video=['.mp4','.mov','.webm'].includes(ext);if(!meta.rightsConfirmed||!Number.isInteger(Number(meta.width))||!Number.isInteger(Number(meta.height))||Number(meta.width)<1||Number(meta.height)<1||Boolean(meta.mediaType==='video')!==video)return send(res,400,{error:'Rights confirmation, actual dimensions, and media type are required.'});
    if(video&&(!Number.isFinite(Number(meta.durationSeconds))||Number(meta.durationSeconds)<=0))return send(res,400,{error:'Video duration must be read before upload.'});
    const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>100*1024*1024)return send(res,413,{error:'Media files are limited to 100 MB.'});chunks.push(chunk);}const buffer=Buffer.concat(chunks);if(!buffer.length)return send(res,400,{error:'The selected media file is empty.'});
    const mime=(req.headers['content-type']||'').split(';')[0].toLowerCase();const imageSignatures={'.jpg':buffer.length>3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff,'.jpeg':buffer.length>3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff,'.png':buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),'.webp':buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'};
    const fileValid=video?(ext==='.webm'?buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):buffer.toString('ascii',4,8)==='ftyp'):Boolean(imageSignatures[ext]);if(!fileValid)return send(res,415,{error:'The file bytes do not match a supported image/video container.'});
    const expectedMime=ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.png'?'image/png':ext==='.webp'?'image/webp':ext==='.mp4'?'video/mp4':ext==='.mov'?'video/quicktime':'video/webm';if(mime!==expectedMime)return send(res,415,{error:'The selected file MIME type does not match its extension.'});
    const id=crypto.randomUUID(),filename=`${id}${ext}`,now=new Date().toISOString();await fs.promises.writeFile(path.join(ASSET_DIR,filename),buffer,{flag:'wx'});
    const record={id,filename,originalName:path.basename(String(meta.filename)).slice(0,180),localUrl:`/media/${filename}`,previewUrl:`/media/${filename}`,mime,mediaType:video?'video':'photo',width:Number(meta.width),height:Number(meta.height),durationSeconds:video?Number(meta.durationSeconds):null,size:buffer.length,hash:crypto.createHash('sha256').update(buffer).digest('hex'),source:'User Upload',sourceUrl:'User Upload',creator:'User-provided',license:'User confirms permission to use this media',licenseUrl:'',pageUrl:`local-upload:${filename}`,metadataComplete:true,rightsStatus:'User confirmed',userRightsConfirmed:true,retrievedAt:now,importedAt:now};
    await cacheAssetRecord(record);
    send(res,201,{asset:record});
  }catch(error){send(res,500,{error:`Could not save local media: ${error.message}`});}
}

function inspectWithFfprobe(file) {
  const result=spawnSync(FFPROBE_COMMAND,['-v','error','-show_entries','stream=codec_name,codec_type,width,height,r_frame_rate,avg_frame_rate,pix_fmt:format=duration,format_name','-of','json',file],{encoding:'utf8',timeout:20000,windowsHide:true});
  if(result.error?.code==='ENOENT')return{available:false,message:'FFprobe unavailable; server-side media QC is incomplete.'};
  if(result.error)return{available:true,passed:false,message:`FFprobe failed: ${result.error.message}`};
  if(result.status!==0)return{available:true,passed:false,message:(result.stderr||'FFprobe could not decode this MP4.').trim()};
  try{
    const data=JSON.parse(result.stdout||'{}');const stream=(data.streams||[]).find(item=>item.codec_type==='video');const audio=(data.streams||[]).some(item=>item.codec_type==='audio');const duration=Number(data.format?.duration||0);const [numerator,denominator]=String(stream?.avg_frame_rate||stream?.r_frame_rate||'0/1').split('/').map(Number);const fps=denominator?numerator/denominator:0;const [nominalNumerator,nominalDenominator]=String(stream?.r_frame_rate||'0/1').split('/').map(Number);const nominalFps=nominalDenominator?nominalNumerator/nominalDenominator:0;
    const decode=spawnSync(FFMPEG_COMMAND,['-v','error','-i',file,'-f','null','-'],{encoding:'utf8',timeout:120000,windowsHide:true});const black=spawnSync(FFMPEG_COMMAND,['-hide_banner','-loglevel','info','-i',file,'-vf','blackdetect=d=0.75:pix_th=0.02','-an','-f','null','-'],{encoding:'utf8',timeout:120000,windowsHide:true});const blackLog=String(black.stderr||'');const blackDurations=[...blackLog.matchAll(/black_duration:([0-9.]+)/g)].map(match=>Number(match[1]));const blackFrameCheck=!black.error&&black.status===0&&!blackDurations.some(seconds=>seconds>=.75)&&(blackLog.match(/black_start:/g)||[]).length<=(blackLog.match(/black_end:/g)||[]).length;const checks={videoStream:Boolean(stream),h264:stream?.codec_name==='h264',pixelFormat:stream?.pix_fmt==='yuv420p',resolution:stream?.width===1080&&stream?.height===1920,frameRate:fps>=29.5&&fps<=30.5&&nominalFps>=29.5&&nominalFps<=30.5,duration:duration>=10&&duration<=15,audioFree:!audio,decodeTest:!decode.error&&decode.status===0&&!String(decode.stderr||'').trim(),blackFrameCheck};const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
    return{available:true,passed:failed.length===0,checks,duration,fps,width:stream?.width,height:stream?.height,pixelFormat:stream?.pix_fmt,audio,decodePassed:checks.decodeTest,nominalFps,blackFrameCheck,message:failed.length?`FFprobe/FFmpeg failed checks: ${failed.join(', ')}`:'FFprobe/FFmpeg confirmed H.264 yuv420p, dimensions, frame rate, duration, silent audio, no sustained black scenes and full-file decode.'};
  }catch(error){return{available:true,passed:false,message:`FFprobe output could not be read: ${error.message}`};}
}
async function saveRender(req,res) {
  const mime=(req.headers['content-type']||'').split(';')[0].toLowerCase();
  if(mime!=='video/mp4') return send(res,415,{error:'Only an MP4 render can be saved.'});
  let report;
  try { report=JSON.parse(Buffer.from(req.headers['x-render-qc']||'','base64').toString('utf8')); }
  catch { return send(res,400,{error:'Render QC report is missing or invalid.'}); }
  const checks=report.checks||{};
  const failed=Object.entries(checks).filter(([,ok])=>ok!==true).map(([name])=>name);
  if(failed.length) return send(res,422,{error:'QC failed. This render cannot be marked READY.',failed});
  const chunks=[];let size=0;
  try {
    for await(const chunk of req){size+=chunk.length;if(size>100*1024*1024)return send(res,413,{error:'MP4 exceeds the 100 MB local save limit.'});chunks.push(chunk);}
  } catch { return send(res,400,{error:'MP4 upload was interrupted.'}); }
  const buffer=Buffer.concat(chunks);
  if(buffer.length<16 || buffer.toString('ascii',4,8)!=='ftyp' || !buffer.includes(Buffer.from('avc1')))
    return send(res,422,{error:'The file does not contain a recognizable H.264 MP4 stream.'});
  const id=crypto.randomUUID();const filename=`${id}.mp4`;
  try { await fs.promises.writeFile(path.join(RENDER_DIR,filename),buffer,{flag:'wx'}); }
  catch { return send(res,500,{error:'Could not save the MP4 master.'}); }
  const stat=await fs.promises.stat(path.join(RENDER_DIR,filename));if(!stat.isFile()||stat.size!==buffer.length||stat.size<=0)return send(res,500,{error:'Saved MP4 file could not be verified on disk.'});
  report.checks.fileExists=true;report.checks.h264=report.checks.h264===true&&buffer.includes(Buffer.from('avc1'));report.checks.finalMp4Valid=report.checks.fileExists&&buffer.toString('ascii',4,8)==='ftyp'&&report.checks.h264;report.fileSize=stat.size;
  report.ffprobe=inspectWithFfprobe(path.join(RENDER_DIR,filename));if(!report.ffprobe.available){await fs.promises.unlink(path.join(RENDER_DIR,filename)).catch(()=>{});return send(res,503,{error:'Server-side QC is incomplete because FFprobe is unavailable. Install FFmpeg and FFprobe before a master can be marked READY.',code:'QC_TOOLS_UNAVAILABLE'});}if(!report.ffprobe.passed){await fs.promises.unlink(path.join(RENDER_DIR,filename)).catch(()=>{});return send(res,422,{error:report.ffprobe.message,failed:Object.keys(report.ffprobe.checks||{})});}Object.assign(report.checks,report.ffprobe.checks,{ffprobe:true});
  const qcFailed=Object.entries(report.checks).filter(([,ok])=>ok!==true).map(([name])=>name);if(qcFailed.length){await fs.promises.unlink(path.join(RENDER_DIR,filename)).catch(()=>{});return send(res,422,{error:'QC failed after saving the MP4. The file was removed from master storage.',failed:qcFailed});}
  const record={id,filename,url:`/media/renders/${filename}`,size:buffer.length,savedAt:new Date().toISOString(),qc:report};
  await fs.promises.appendFile(path.join(RENDER_DIR,'index.json'),JSON.stringify(record)+'\n');
  send(res,201,{render:record});
}

function serveMedia(req,res,file,contentType,downloadName='') {
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()) return send(res,404,{error:'Media file not found.'});
    const range=req.headers.range;
    if(range){
      const match=range.match(/^bytes=(\d*)-(\d*)$/);
      if(!match) { res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end(); }
      let start=match[1]?Number(match[1]):Math.max(0,stat.size-Number(match[2]||0));
      let end=match[2]?Number(match[2]):stat.size-1;
      if(start>end||end>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
      res.writeHead(206,{'Content-Type':contentType,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Accept-Ranges':'bytes','Cache-Control':'no-store',...(downloadName?{'Content-Disposition':`attachment; filename="${downloadName}"`}:{})});
      fs.createReadStream(file,{start,end}).pipe(res);return;
    }
    res.writeHead(200,{'Content-Type':contentType,'Content-Length':stat.size,'Accept-Ranges':'bytes','Cache-Control':'no-store',...(downloadName?{'Content-Disposition':`attachment; filename="${downloadName}"`}:{})});
    fs.createReadStream(file).pipe(res);
  });
}

async function youtubeTrends(url, res) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return send(res, 503, { error:'Optional YouTube live metrics are unavailable because YOUTUBE_API_KEY is not configured.', connector:'youtube', optional:true });
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const minViews = Math.max(0, Math.min(Number(url.searchParams.get('minViews') || 100000), 1000000000));
  if (!query) return send(res, 400, { error:'Enter a topic to search.' });
  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    const publishedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    Object.entries({ part:'snippet', type:'video', videoDuration:'short', videoEmbeddable:'true', order:'viewCount', maxResults:'25', regionCode:'IN', relevanceLanguage:'hi', safeSearch:'moderate', publishedAfter, q:`#Shorts ${query}`, key }).forEach(([k,v]) => searchUrl.searchParams.set(k,v));
    const searchResponse = await fetch(searchUrl, { signal:AbortSignal.timeout(15000) });
    const searchData = await searchResponse.json();
    if (!searchResponse.ok) return send(res, 502, { error:searchData.error?.message || 'YouTube search failed. Check the API key and YouTube Data API access.' });
    const ids = (searchData.items || []).map(x => x.id?.videoId).filter(Boolean);
    if (!ids.length) return send(res, 200, { source:'YouTube Shorts search', query, minViews, results:[] });
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    Object.entries({ part:'snippet,statistics,contentDetails', id:ids.join(','), key }).forEach(([k,v]) => videosUrl.searchParams.set(k,v));
    const videosResponse = await fetch(videosUrl, { signal:AbortSignal.timeout(15000) });
    const videosData = await videosResponse.json();
    if (!videosResponse.ok) return send(res, 502, { error:videosData.error?.message || 'Could not load video views.' });
    const results = planning.filterVerifiedViralReferences((videosData.items || []).map(v => ({
      id:v.id, title:v.snippet.title, channel:v.snippet.channelTitle, publishedAt:v.snippet.publishedAt,
      views:Number(v.statistics?.viewCount || 0), metricSource:'YouTube Data API',source:'YouTube Shorts',retrievedAt:new Date().toISOString(), durationSeconds:durationSeconds(v.contentDetails?.duration || ''),
      thumbnail:v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || '',
      url:`https://www.youtube.com/shorts/${v.id}`,
    })),minViews).sort((a,b) => b.views - a.views);
    send(res, 200, { source:'YouTube Shorts search', query, minViews, checked:videosData.items?.length || 0, results });
  } catch (error) {
    send(res, 502, { error:error.name === 'TimeoutError' ? 'Trend search timed out. Try again.' : 'Trend search could not reach YouTube. Check your connection and API setup.' });
  }
}

async function instagramPublicDiscovery(url,res){
  const key=process.env.GOOGLE_CSE_API_KEY,cx=process.env.GOOGLE_CSE_ID;
  if(!key||!cx)return send(res,503,{error:'Optional Google Custom Search discovery is not configured. Use the public Google search links in the studio.',connector:'google-custom-search',optional:true});
  const topic=(url.searchParams.get('q')||'').trim().slice(0,120);if(!topic)return send(res,400,{error:'Enter a topic to discover public Instagram Reels.'});
  try{
    const endpoint=new URL('https://www.googleapis.com/customsearch/v1');Object.entries({key,cx,q:`site:instagram.com/reel (${topic})`,num:'10',safe:'active'}).forEach(([name,value])=>endpoint.searchParams.set(name,value));
    const response=await fetch(endpoint,{signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok)return send(res,502,{error:data.error?.message||'Google public search discovery failed.'});
    const results=(data.items||[]).map(item=>{let link;try{link=new URL(item.link);}catch{return null;}if(!['instagram.com','www.instagram.com'].includes(link.hostname)||!/^\/reel\//.test(link.pathname))return null;const creator=String(`${item.title||''} ${item.snippet||''}`).match(/@([a-zA-Z0-9._]{2,30})/)?.[1]||'';return{id:crypto.createHash('sha256').update(link.href).digest('hex').slice(0,24),url:link.href,title:String(item.title||'Public Instagram Reel').slice(0,180),snippet:String(item.snippet||'').slice(0,360),creator,topic,source:'Google Search public index',views:null,metricStatus:'Public metric unavailable',retrievedAt:new Date().toISOString(),publishedAt:item.pagemap?.metatags?.[0]?.['article:published_time']||null,confidence:'Google-indexed result; inspect original on Instagram'}}).filter(Boolean);
    return send(res,200,{source:'Google Custom Search public index',topic,checked:Number(data.searchInformation?.totalResults||0),results});
  }catch(error){return send(res,502,{error:error.name==='TimeoutError'?'Google public search timed out.':'Google public search could not be reached.'});}
}

function captureVisionFrame(file,second){return new Promise((resolve,reject)=>{const child=spawn(FFMPEG_COMMAND,['-hide_banner','-loglevel','error','-ss',String(second),'-i',file,'-frames:v','1','-vf','scale=768:-2','-f','image2pipe','-vcodec','mjpeg','pipe:1'],{windowsHide:true,stdio:['ignore','pipe','pipe']});const chunks=[];let size=0,stderr='';const timer=setTimeout(()=>child.kill(),20000);child.stdout.on('data',chunk=>{size+=chunk.length;if(size>5*1024*1024){child.kill();return reject(new Error('Extracted analysis frame exceeded 5 MB.'));}chunks.push(chunk);});child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>stderr=(stderr+chunk).slice(-3000));child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('close',code=>{clearTimeout(timer);if(code===0&&size)resolve(Buffer.concat(chunks));else reject(new Error(stderr.trim()||'FFmpeg could not decode a frame from this video.'));});});}

function readInstagramTokens(){return instagramAuth.readEncrypted(INSTAGRAM_TOKEN_FILE,process.env.INSTAGRAM_APP_SECRET);}
function persistInstagramTokens(tokens){instagramAuth.saveEncrypted(INSTAGRAM_TOKEN_FILE,tokens,process.env.INSTAGRAM_APP_SECRET);}
async function instagramGraph(pathname,token,options={}){const url=new URL(`https://graph.instagram.com/${process.env.META_GRAPH_VERSION}/${pathname.replace(/^\//,'')}`);for(const[key,value]of Object.entries(options.query||{}))url.searchParams.set(key,String(value));const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(20000)});const data=await response.json();if(!response.ok)throw new Error(data.error?.message||`Instagram Graph request failed (${response.status}).`);return data;}
function instagramConnectionStatus(){const configured=instagramAuth.isConfigured();const stored=configured?readInstagramTokens():null;return{configured,connected:Boolean(stored?.accessToken),provider:'Instagram API with Instagram Login',username:stored?.username||null,instagramUserId:stored?.userId||null,accountType:stored?.accountType||null,expiresAt:stored?.expiresAt||null,scopes:['instagram_business_basic','instagram_business_manage_insights'],message:!configured?'Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI and META_GRAPH_VERSION in .env.':stored?'Authorized Instagram Insights connection ready.':'Instagram Insights is not connected; authorize your professional account.'};}
async function instagramOAuthCallback(req,res,url){
  const stateRecord=(()=>{try{return JSON.parse(fs.readFileSync(INSTAGRAM_STATE_FILE,'utf8'));}catch{return null;}})();
  const state=url.searchParams.get('state')||'';const expected=stateRecord?.state||'';const valid=state.length===expected.length&&state.length>0&&crypto.timingSafeEqual(Buffer.from(state),Buffer.from(expected))&&Date.now()<Number(stateRecord.expiresAt||0);
  await fs.promises.unlink(INSTAGRAM_STATE_FILE).catch(()=>{});
  if(!valid)return send(res,400,{error:'Instagram OAuth state was invalid or expired. Start Connect Insights again.'});
  if(url.searchParams.has('error'))return send(res,400,{error:`Instagram authorization was not completed: ${url.searchParams.get('error_description')||url.searchParams.get('error')}`});
  const code=url.searchParams.get('code');if(!code)return send(res,400,{error:'Instagram did not return an authorization code.'});
  try{
    const form=new URLSearchParams({client_id:process.env.INSTAGRAM_APP_ID,client_secret:process.env.INSTAGRAM_APP_SECRET,grant_type:'authorization_code',redirect_uri:process.env.INSTAGRAM_REDIRECT_URI,code});
    const exchange=await fetch('https://api.instagram.com/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form,signal:AbortSignal.timeout(20000)});const short=await exchange.json();if(!exchange.ok||!short.access_token)throw new Error(short.error_message||short.error_description||short.error?.message||'Instagram token exchange failed.');
    const longUrl=new URL('https://graph.instagram.com/access_token');Object.entries({grant_type:'ig_exchange_token',client_secret:process.env.INSTAGRAM_APP_SECRET,access_token:short.access_token}).forEach(([key,value])=>longUrl.searchParams.set(key,value));const longResponse=await fetch(longUrl,{signal:AbortSignal.timeout(20000)});const long=await longResponse.json();if(!longResponse.ok||!long.access_token)throw new Error(long.error?.message||'Long-lived Instagram token exchange failed.');
    const profile=await instagramGraph('me',long.access_token,{query:{fields:'user_id,username,account_type'}});const expiresAt=new Date(Date.now()+Number(long.expires_in||5184000)*1000).toISOString();persistInstagramTokens({accessToken:long.access_token,userId:String(profile.user_id||profile.id),username:String(profile.username||''),accountType:profile.account_type||null,expiresAt,scopes:['instagram_business_basic','instagram_business_manage_insights'],connectedAt:new Date().toISOString()});
    res.writeHead(302,{Location:'/?instagram_connected=1','Cache-Control':'no-store'});res.end();
  }catch(error){send(res,502,{error:`Instagram connection failed: ${error.message}`});}
}
async function syncInstagramInsights(req,res){
  const tokens=readInstagramTokens();if(!tokens)return send(res,401,{error:'Connect an eligible Instagram professional account before syncing Insights.'});
  try{
    if(Date.now()>new Date(tokens.expiresAt).getTime()-7*24*60*60*1000){const refreshUrl=new URL('https://graph.instagram.com/refresh_access_token');refreshUrl.searchParams.set('grant_type','ig_refresh_token');refreshUrl.searchParams.set('access_token',tokens.accessToken);const refreshed=await fetch(refreshUrl,{signal:AbortSignal.timeout(20000)});const data=await refreshed.json();if(!refreshed.ok||!data.access_token)throw new Error(data.error?.message||'Instagram token could not be refreshed. Reconnect the account.');tokens.accessToken=data.access_token;tokens.expiresAt=new Date(Date.now()+Number(data.expires_in||5184000)*1000).toISOString();persistInstagramTokens(tokens);}
    const mediaPage=await instagramGraph(`${tokens.userId}/media`,tokens.accessToken,{query:{fields:'id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count',limit:50}});const media=(mediaPage.data||[]).slice(0,50);
    const reels=media.filter(item=>item.media_product_type==='REELS'||item.media_type==='VIDEO').slice(0,40);
    for(let start=0;start<reels.length;start+=4){await Promise.all(reels.slice(start,start+4).map(async item=>{try{const insight=await instagramGraph(`${item.id}/insights`,tokens.accessToken,{query:{metric:'views,reach,likes,comments,shares,saved,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time'}});item.insights=instagramAuth.metricValues(insight.data);item.insightsStatus='API_VERIFIED';}catch(error){item.insights={};item.insightsStatus='UNAVAILABLE';item.insightsError=error.message;}}));}
    const result={account:{username:tokens.username,userId:tokens.userId},syncedAt:new Date().toISOString(),source:'Instagram Graph API · user-authorized',media:reels.map(item=>({id:String(item.id),caption:item.caption||'',mediaType:item.media_type||'',productType:item.media_product_type||'',permalink:item.permalink||'',timestamp:item.timestamp||null,likes:item.insights?.likes??item.like_count??null,comments:item.insights?.comments??item.comments_count??null,views:item.insights?.views??null,reach:item.insights?.reach??null,shares:item.insights?.shares??null,saves:item.insights?.saved??null,totalInteractions:item.insights?.total_interactions??null,averageWatchTime:item.insights?.ig_reels_avg_watch_time??null,totalWatchTime:item.insights?.ig_reels_video_view_total_time??null,insightsStatus:item.insightsStatus||'NOT_VERIFIED',insightsError:item.insightsError||null}))};
    await fs.promises.mkdir(INSTAGRAM_DIR,{recursive:true});await fs.promises.writeFile(INSTAGRAM_INSIGHTS_FILE,JSON.stringify(result,null,2),{mode:0o600});return send(res,200,result);
  }catch(error){return send(res,502,{error:`Instagram Insights sync failed: ${error.message}`});}
}

async function visualAnalysisRequest(req,res){
  if(!process.env.OPENAI_API_KEY)return send(res,503,{error:'OPENAI_API_KEY is not configured. Add it to the local .env file to enable hosted visual analysis.',code:'VISION_NOT_CONFIGURED'});
  if(!req.headers['content-type']?.includes('application/json'))return send(res,415,{error:'Send JSON asset descriptors.'});
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>20*1024*1024)return send(res,413,{error:'Visual analysis request is too large.'});}
  let payload;try{payload=JSON.parse(raw||'{}');}catch{return send(res,400,{error:'Request must contain valid JSON.'});}
  if(!Array.isArray(payload.assets)||payload.assets.length<1||payload.assets.length>8)return send(res,400,{error:'Choose one to eight local assets for analysis.'});
  const prepared=[];
  try{
    for(const row of payload.assets){const name=safeAssetName(row.filename);if(!name)return send(res,400,{error:'An asset filename is invalid.'});const file=path.resolve(ASSET_DIR,name);if(!file.startsWith(ASSET_DIR+path.sep)||!fs.existsSync(file))return send(res,404,{error:`Local source asset is missing: ${name}`});const video=/\.(mp4|mov|webm|ogv|ogg)$/i.test(name);let frames=[],mime='image/jpeg';
      if(Array.isArray(row.frameImages)&&row.frameImages.length){if(row.frameImages.length>(video?3:1))return send(res,400,{error:'Use one photo frame or up to three ordered video frames.'});for(const dataUrl of row.frameImages){const match=String(dataUrl).match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/);if(!match)return send(res,400,{error:'Visual frame data must be a JPEG, PNG, or WEBP data URL.'});mime=`image/${match[1]==='jpeg'?'jpeg':match[1]}`;const frame=Buffer.from(match[2],'base64');if(!frame.length||frame.length>5*1024*1024)return send(res,413,{error:'Each analysis frame must be smaller than 5 MB.'});frames.push(frame);}
      }else if(video){if(!FFMPEG_AVAILABLE||!FFPROBE_AVAILABLE)return send(res,503,{error:'Video-frame analysis needs FFmpeg/FFprobe or browser-sampled frame data.',code:'VIDEO_FRAME_EXTRACTOR_UNAVAILABLE'});const probe=spawnSync(FFPROBE_COMMAND,['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8',timeout:10000,windowsHide:true});const duration=Number(probe.stdout);if(probe.status!==0||!Number.isFinite(duration)||duration<=0)throw new Error(`Could not read video duration for ${name}.`);const stamps=[.2,.5,.8].map(fraction=>Math.min(Math.max(.05,duration*fraction),Math.max(.05,duration-.05)));for(const stamp of stamps)frames.push(await captureVisionFrame(file,stamp));
      }else{const stat=fs.statSync(file);mime=path.extname(name).toLowerCase()==='.png'?'image/png':path.extname(name).toLowerCase()==='.webp'?'image/webp':'image/jpeg';if(stat.size>5*1024*1024){if(!FFMPEG_AVAILABLE)return send(res,413,{error:`${name} exceeds the 5 MB hosted-analysis limit; send a browser-sampled frame.`});frames=[await captureVisionFrame(file,0)];mime='image/jpeg';}else frames=[fs.readFileSync(file)];}
      prepared.push({assetId:String(row.assetId||name),label:String(row.requirement||row.label||'Scene description').slice(0,240),mediaType:video?'video':'photo',mime,frames});if(prepared.reduce((sum,item)=>sum+item.frames.reduce((n,frame)=>n+frame.length,0),0)>16*1024*1024)return send(res,413,{error:'Selected analysis frames exceed the 16 MB request limit. Analyze fewer scenes at a time.'});
    }
    const analyses=await analyzeAssets({assets:prepared,apiKey:process.env.OPENAI_API_KEY,model:VISION_MODEL});return send(res,200,{provider:'OpenAI Responses API',analysisMode:'HOSTED_VISUAL_ANALYSIS',actualVisualAnalysis:true,disclosure:'Selected local image(s) or sampled video frames were sent to the configured hosted vision provider for analysis.',analyses});
  }catch(error){return send(res,error.statusCode||502,{error:error.message||'Hosted visual analysis failed.'});}
}

async function backgroundWorkerBoundary(req,res){
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536)return send(res,413,{error:'Worker job request is too large.'});}
  let job;try{job=JSON.parse(raw||'{}');}catch{return send(res,400,{error:'Worker job must be valid JSON.'});}
  if(!backgroundWorker.enabled)return send(res,503,{queued:false,code:'BACKGROUND_WORKER_UNAVAILABLE',message:'FFmpeg and FFprobe are required to run this durable background job. The request was not queued; browser rendering remains available.',capability:{ffmpeg:FFMPEG_AVAILABLE,ffprobe:FFPROBE_AVAILABLE,workerConfigured:false}});
  try{return send(res,202,{queued:true,job:backgroundWorker.enqueue(job)});}catch(error){return send(res,error.statusCode||400,{queued:false,error:error.message});}
}

async function workerControl(req,res,id){let body='';for await(const chunk of req){body+=chunk;if(body.length>4000)return send(res,413,{error:'Worker command is too large.'});}let action;try{action=JSON.parse(body||'{}').action;}catch{return send(res,400,{error:'Worker action must be valid JSON.'});}try{return send(res,200,{job:backgroundWorker.control(id,action)});}catch(error){return send(res,error.statusCode||400,{error:error.message});}}

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/status') {
    return send(res, 200, {
      youtube:{ ready:Boolean(process.env.YOUTUBE_API_KEY), optional:true, label:process.env.YOUTUBE_API_KEY ? 'YouTube live metrics available' : 'Live YouTube metrics unavailable; the connector is optional' },
      instagram:{ ready:false, mode:'public-web-manual', metricAccess:false, label:'Instagram competitor Reel metrics are unavailable for this Personal account. Public web discovery links and user-observed records are available; no scraping is performed.' },
      googleSearch:{ready:Boolean(process.env.GOOGLE_CSE_API_KEY&&process.env.GOOGLE_CSE_ID),optional:true,label:process.env.GOOGLE_CSE_API_KEY&&process.env.GOOGLE_CSE_ID?'Google Custom Search public Reel discovery available':'Google Custom Search keys not configured; open public search links manually'},
      ffprobe:{available:FFPROBE_AVAILABLE,label:FFPROBE_AVAILABLE?'FFprobe available for server-side stream QC':'FFprobe unavailable; masters cannot pass server-side QC'},
      backgroundRender:{available:FFMPEG_AVAILABLE&&FFPROBE_AVAILABLE,workerConfigured:backgroundWorker.enabled,label:backgroundWorker.enabled?'Persistent local FFmpeg worker and disk-backed queue are running':`Background render worker unavailable · ${!FFMPEG_AVAILABLE?'FFmpeg missing. ':''}${!FFPROBE_AVAILABLE?'FFprobe missing. ':''}`},
      vision:{configured:Boolean(process.env.OPENAI_API_KEY),provider:'OpenAI Responses API',model:VISION_MODEL,label:process.env.OPENAI_API_KEY?'Hosted visual analysis configured; selected frames leave this computer':'Hosted visual analysis not configured · add OPENAI_API_KEY'},
      instagramInsights:{...instagramConnectionStatus(),requiredAccountType:'Creator or Business'},
    });
  }
  if(url.pathname==='/api/instagram/status'&&req.method==='GET')return send(res,200,instagramConnectionStatus());
  if(url.pathname==='/api/instagram/connect'&&req.method==='GET'){
    if(!instagramAuth.isConfigured())return send(res,503,{error:instagramConnectionStatus().message,code:'INSTAGRAM_NOT_CONFIGURED'});
    const state=crypto.randomBytes(32).toString('hex');await fs.promises.mkdir(INSTAGRAM_DIR,{recursive:true});await fs.promises.writeFile(INSTAGRAM_STATE_FILE,JSON.stringify({state,expiresAt:Date.now()+10*60*1000}),{mode:0o600});res.writeHead(302,{Location:instagramAuth.authUrl(process.env,state),'Cache-Control':'no-store'});return res.end();
  }
  if(url.pathname==='/api/instagram/callback'&&req.method==='GET')return instagramOAuthCallback(req,res,url);
  if(url.pathname==='/api/instagram/sync'&&req.method==='POST')return syncInstagramInsights(req,res);
  if(url.pathname==='/api/instagram/insights'&&req.method==='GET'){try{return send(res,200,JSON.parse(fs.readFileSync(INSTAGRAM_INSIGHTS_FILE,'utf8')));}catch{return send(res,404,{error:'No Instagram Insights sync is saved yet.'});}}
  if(url.pathname==='/api/instagram/disconnect'&&req.method==='POST'){await fs.promises.unlink(INSTAGRAM_TOKEN_FILE).catch(()=>{});await fs.promises.unlink(INSTAGRAM_INSIGHTS_FILE).catch(()=>{});return send(res,200,{connected:false});}
  if(url.pathname==='/api/vision/analyze'&&req.method==='POST')return visualAnalysisRequest(req,res);
  if(url.pathname==='/api/worker/status'&&req.method==='GET')return send(res,200,backgroundWorker.status());
  if(url.pathname==='/api/worker/jobs'&&req.method==='GET')return send(res,200,{jobs:backgroundWorker.list(),status:backgroundWorker.status()});
  if(url.pathname==='/api/worker/jobs'&&req.method==='POST')return backgroundWorkerBoundary(req,res);
  const workerJobMatch=url.pathname.match(/^\/api\/worker\/jobs\/([0-9a-f-]{36})$/i);
  if(workerJobMatch&&req.method==='GET'){const job=backgroundWorker.get(workerJobMatch[1]);return job?send(res,200,{job}):send(res,404,{error:'Worker job not found.'});}
  const workerActionMatch=url.pathname.match(/^\/api\/worker\/jobs\/([0-9a-f-]{36})\/actions$/i);
  if(workerActionMatch&&req.method==='POST')return workerControl(req,res,workerActionMatch[1]);
  if (url.pathname === '/api/assets' && req.method === 'GET') return commonsSearch(url,res);
  if (url.pathname === '/api/commons-search' && req.method === 'GET') return commonsSearch(url,res);
  if (url.pathname === '/api/commons-media' && req.method === 'GET') return commonsMediaProxy(url,res);
  if (url.pathname === '/api/assets/import' && req.method === 'POST') return importCommonsAsset(req,res);
  if (url.pathname === '/api/assets/upload' && req.method === 'POST') return uploadUserAsset(req,res);
  if (url.pathname === '/api/renders' && req.method === 'POST') return saveRender(req,res);
  if (url.pathname === '/api/trends' && req.method === 'GET') return youtubeTrends(url,res);
  if (url.pathname === '/api/instagram-research' && req.method === 'GET') return instagramPublicDiscovery(url,res);
  if (url.pathname.startsWith('/api/')) return send(res, 404, { error:'API route not found.' });
  if (url.pathname.startsWith('/media/')) {
    const relative=url.pathname.slice('/media/'.length);
    const renderMatch=relative.match(/^renders\/([0-9a-f-]{36}\.mp4)$/i);
    const assetMatch=relative.match(/^([0-9a-f-]{36}\.(jpg|jpeg|png|webp|mp4|mov|webm|ogv|ogg))$/i);
    if(renderMatch) return serveMedia(req,res,path.join(RENDER_DIR,renderMatch[1]),'video/mp4',url.searchParams.has('download')?`festival-of-bharat-${renderMatch[1]}`:'');
    if(!assetMatch) return send(res,404,{error:'Asset not found.'});
    const name=assetMatch[1];
    return serveMedia(req,res,path.join(ASSET_DIR,name),MIME[path.extname(name).toLowerCase()]||'application/octet-stream');
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return send(res,400,{error:'Invalid path.'}); }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(ROOT, `.${pathname}`);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res,403,{error:'Forbidden.'});
  fs.readFile(file, (error, content) => {
    if (error) return send(res,404,'Not found.','text/plain; charset=utf-8');
    send(res,200,content,MIME[path.extname(file)] || 'application/octet-stream');
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`Festival of Bharat Studio running at http://127.0.0.1:${PORT}`));
backgroundWorker.pump();