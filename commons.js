'use strict';

const COMMONS_API='https://commons.wikimedia.org/w/api.php';
const IMAGE_MIMES=new Set(['image/jpeg','image/png','image/webp','image/tiff','image/gif']);
const VIDEO_MIMES=new Set(['video/mp4','video/webm','video/ogg','video/quicktime']);
const EXTENSIONS={
  'image/jpeg':['.jpg','.jpeg'],'image/png':['.png'],'image/webp':['.webp'],
  'image/tiff':['.tif','.tiff'],'image/gif':['.gif'],
  'video/mp4':['.mp4'],'video/webm':['.webm'],'video/ogg':['.ogv','.ogg'],
  'video/quicktime':['.mov'],
};

function classifyMime(value){const mime=String(value||'').split(';')[0].trim().toLowerCase();if(IMAGE_MIMES.has(mime))return'photo';if(VIDEO_MIMES.has(mime))return'video';return null;}
function cleanValue(value){const raw=typeof value==='object'&&value!==null?value.value:value;if(raw===undefined||raw===null)return'';return String(raw).replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim();}
function firstMeta(meta,keys){for(const key of keys){const value=cleanValue(meta?.[key]);if(value)return{key,value};}return{key:null,value:''};}
function usableLicense(label,url=''){const value=`${label} ${url}`.toLowerCase();return /public\s*domain|cc0|creativecommons\.org\/licenses\/(by|by-sa|zero)|\bcc\s*by(?:-sa)?\b|\b(gfdl|gnu free documentation license|gpl|free art license|ofl)\b/.test(value)&&!/(by-nc|non.?commercial|by-nd|no.?derivatives)/.test(value);}
function extensionFrom(url){try{return new URL(url).pathname.split('/').pop().match(/\.[^.]+$/)?.[0].toLowerCase()||'';}catch{return'';}}
function normalizedPage(page){const info=page?.imageinfo?.[0]||{},meta=info.extmetadata||{},mime=String(info.mime||'').split(';')[0].toLowerCase(),mediaType=classifyMime(mime),mediaUrl=String(info.url||''),pageUrl=String(info.descriptionurl||''),creatorField=firstMeta(meta,['Artist','Credit','Author','Creator']),licenseField=firstMeta(meta,['LicenseShortName','UsageTerms','LicenseUrl','License']);
  let license=licenseField.value,licenseEvidence=licenseField.key?`${licenseField.key}: ${licenseField.value}`:'';
  if(licenseField.key==='LicenseUrl')license=licenseField.value;
  if(!license&&String(cleanValue(meta.Copyrighted)).toLowerCase()==='false'){license='Public domain';licenseEvidence='Copyrighted: false';}
  const licenseUrl=cleanValue(meta.LicenseUrl);
  const creator=creatorField.value,width=Number(info.width||0),height=Number(info.height||0),size=Number(info.size||0),extension=extensionFrom(mediaUrl);
  const licenseCompatible=usableLicense(license,licenseUrl);
  const rejectReasons=[];
  if(!mediaType)rejectReasons.push(`unsupported MIME type: ${mime||'missing'}`);
  if(!mediaUrl)rejectReasons.push('Commons imageinfo has no original media URL');
  let hostname='';try{hostname=new URL(mediaUrl).hostname;}catch{}
  if(mediaUrl&&(!/^https:$/.test((()=>{try{return new URL(mediaUrl).protocol;}catch{return'';}})())||!['upload.wikimedia.org','commons.wikimedia.org'].includes(hostname)))rejectReasons.push('media URL is not an HTTPS Wikimedia Commons URL');
  if(mediaType&&!extension)rejectReasons.push('media URL has no recognizable file extension');
  if(mediaType&&extension&&!EXTENSIONS[mime]?.includes(extension))rejectReasons.push(`file extension ${extension} does not match MIME ${mime}`);
  if(!pageUrl)rejectReasons.push('Commons file page URL is missing');
  if(!creator)rejectReasons.push('creator metadata missing (Artist/Credit/Author/Creator)');
  if(!license)rejectReasons.push('license metadata missing (LicenseShortName/UsageTerms/LicenseUrl/Copyrighted)');
  if(!licenseEvidence)rejectReasons.push('no explicit Commons license evidence');
  if(!licenseUrl)rejectReasons.push('licence URL missing');
  if(license&&!licenseCompatible)rejectReasons.push(`license is not an accepted reusable Commons license: ${license}`);
  if(!(width>0&&height>0))rejectReasons.push('Commons dimensions are missing');
  if(!(size>0))rejectReasons.push('Commons file size is missing');
  const description=firstMeta(meta,['ImageDescription','Description','ObjectName']).value,categories=(page?.categories||[]).map(item=>String(item.title||'').replace(/^Category:/,'')).filter(Boolean);
  const metadataComplete=Boolean(mediaType&&mediaUrl&&pageUrl&&creator&&license&&licenseUrl&&licenseEvidence&&licenseCompatible&&width>0&&height>0&&size>0);
  return{id:String(page?.pageid||''),commonsPageId:String(page?.pageid||''),title:String(page?.title||'').replace(/^File:/,''),description,categories,subjects:[],source:'Wikimedia Commons',sourceUrl:mediaUrl,mediaUrl,pageUrl,sourcePage:pageUrl,mediaType,mime,width,height,size,creator,license,licenseUrl,licenseEvidence,licenseCompatible,metadataComplete,rightsStatus:metadataComplete?'VERIFIED':'UNVERIFIED',downloadable:Boolean(mediaType&&mediaUrl&&pageUrl&&width>0&&height>0&&size>0&&!rejectReasons.some(reason=>reason.includes('MIME')||reason.includes('HTTPS')||reason.includes('extension'))),previewUrl:info.thumburl||mediaUrl,metadataKeys:Object.keys(meta),rejectReasons};
}
function buildSearchUrl(query){const url=new URL(COMMONS_API);for(const[key,value]of Object.entries({origin:'*',action:'query',format:'json',formatversion:'2',generator:'search',gsrnamespace:'6',gsrsearch:String(query||'').trim().slice(0,180),gsrlimit:'30',prop:'imageinfo|categories',cllimit:'20',iiprop:'url|mime|size|extmetadata',iiurlwidth:'1600'}))url.searchParams.set(key,value);return url;}
function parseSearchResponse(data,httpStatus=200){const pages=data?.query?.pages||[],results=[],rejected=[],counts={raw:pages.length,withImageInfo:0,supportedMime:0,creator:0,license:0,licenseRejected:0,rightsComplete:0,downloadable:0};
  const verifiedResults=[];
  for(const page of pages){if(page?.imageinfo?.[0])counts.withImageInfo++;const asset=normalizedPage(page);if(asset.mediaType)counts.supportedMime++;if(asset.creator)counts.creator++;if(asset.licenseCompatible)counts.license++;else if(asset.license)counts.licenseRejected++;if(asset.metadataComplete)counts.rightsComplete++;if(asset.downloadable)counts.downloadable++;
    if(asset.mediaType&&asset.mediaUrl&&asset.width>0&&asset.height>0&&asset.size>0)results.push(asset);if(asset.metadataComplete&&asset.downloadable)verifiedResults.push(asset);else rejected.push({title:asset.title,reasons:asset.rejectReasons});}
  return{source:'Wikimedia Commons',httpStatus,results,verifiedResults,diagnostics:{...counts,returned:results.length,verified:verifiedResults.length,rejected:rejected.length,rejectionReasons:rejected.slice(0,20),apiError:data?.error?.info||null,warning:data?.warnings||null}};
}
async function searchCommons(query,{fetchImpl=fetch,attempts=3,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
  const url=buildSearchUrl(query);let lastError=null;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{
      const response=await fetchImpl(url,{headers:{'User-Agent':'FestivalOfBharatAIStudio/1.0 (Commons source discovery)'},signal:AbortSignal.timeout(20000)});
      let raw='';try{raw=await response.text();}catch{}
      let data;try{data=JSON.parse(raw||'{}');}catch{const error=new Error(`Wikimedia returned a non-JSON response (HTTP ${response.status}).`);error.httpStatus=response.status;error.retryAfter=response.headers?.get?.('retry-after');throw error;}
      if(response.ok&&!data.error)return parseSearchResponse(data,response.status);
      lastError=new Error(data?.error?.info||`Wikimedia HTTP ${response.status}${response.statusText?` ${response.statusText}`:''}`);lastError.httpStatus=response.status;lastError.retryAfter=response.headers?.get?.('retry-after');
    }catch(error){lastError=error;}
    if(attempt<attempts){const hinted=Number(lastError?.retryAfter)*1000;const backoff=hinted||((lastError?.httpStatus===429||lastError?.httpStatus===503)?1000*2**(attempt-1):250*2**(attempt-1));await sleep(Math.min(10000,backoff));}
  }
  throw new Error(`Wikimedia Commons search failed after ${attempts} attempts: ${lastError?.message||'unknown request failure'}`);
}

module.exports={COMMONS_API,IMAGE_MIMES,VIDEO_MIMES,EXTENSIONS,classifyMime,cleanValue,usableLicense,normalizedPage,buildSearchUrl,parseSearchResponse,searchCommons};