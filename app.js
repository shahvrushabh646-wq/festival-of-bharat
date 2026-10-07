const VISUAL_DIRECTION = 'Create original Instagram-viral-style visuals without copying a specific reel. Open with an eye-catching frame and immediate action. Use authentic Indian people, places and details; alternate wide establishing shots with expressive close-ups. Change the visual every 1–2 seconds with varied camera angles, subtle pan/zoom, foreground depth, smooth match cuts and only occasional speed ramps. Use dramatic but natural light, rich detail, clean framing, short bold text, a curiosity-led story and a satisfying final reveal. Avoid generic stock slideshows, repetitive zooms, fake AI-looking imagery, excessive effects and watermarks. Every shot should pull the viewer into the next.';

const INSTAGRAM_SEEDS={
  ganesh:['mumbaidelights','teamssvfa1','deomanish','ganpati_bappa_morya_503'],
  temple:['athuu777','anb_architecture_studio','wanderwith_aadi','6garvkharb','voice.of.madurai','suganography','athulya_nambiar_','travelncurly'],
  heritage:['indiahiddengems','anb_architecture_studio','wanderwith_aadi','voice.of.madurai','suganography','6garvkharb'],
  navratri:['indiahiddengems','amdavad_with_amdavadi','vadodara_navratri_festival','aishwaryaradhani','_jiimmyy','rushalisagala','amdavadis_speaks','thegujjugarba','meghvrushh','radhekrishna_dandiya','ahmedabad.love__','devgarbaclasses'],
};
const TOPIC_EXPANSIONS={
  'ganesh chaturthi':['Ganesh Chaturthi','Ganpati','Ganpati Bappa','Ganeshotsav','Ganpati Aagman','Ganpati Visarjan','Mumbai Ganpati','Ganesh Mandal','Lalbaugcha Raja','Chinchpokli Ganpati','Ganpati decoration','Ganpati darshan'],
  'navratri':['Navratri','Garba','Dandiya','Durga Maa','Mata Rani','Navdurga','Navratri Gujarat','Ahmedabad Garba','Vadodara Navratri','Mumbai Navratri'],
  'temple':['Indian temples','Temples of India','Ancient temples','Temple architecture','Pilgrimage','Darshan','Temple rituals','Temple history','Temple festivals'],
  'diwali':['Diwali','Deepavali','Diwali India','Diwali traditions','Diwali lights','Lakshmi Puja'],
  'holi':['Holi','Holi festival India','Lathmar Holi','Barsana Holi','Mathura Vrindavan Holi','Holi traditions'],
  'janmashtami':['Janmashtami','Krishna Janmashtami','Dahi Handi','Mathura Krishna','Vrindavan Janmashtami'],
  'mahashivratri':['Mahashivratri','Maha Shivratri','Shiva temples','Shivratri pilgrimage','Kashi Vishwanath'],
  'ram navami':['Ram Navami','Ayodhya Ram Navami','Ram temple','Rama traditions'],
  'dussehra':['Dussehra','Vijayadashami','Ravan Dahan','Mysore Dasara','Durga Puja Vijayadashami'],
  'makar sankranti':['Makar Sankranti','Uttarayan kite festival','Pongal','Lohri','Magh Bihu'],
  'gudi padwa':['Gudi Padwa','Ugadi','Maharashtrian New Year','Gudi Padwa traditions'],
  'onam':['Onam','Onam Kerala','Vallam Kali','Pookalam','Onam traditions'],
  'pongal':['Pongal','Thai Pongal','Tamil harvest festival','Jallikattu Pongal'],
  'durga puja':['Durga Puja','Kolkata Durga Puja','Durga pandal','Durga Puja traditions'],
  'jagannath rath yatra':['Jagannath Rath Yatra','Puri Rath Yatra','Jagannath temple','Rath Yatra festival'],
  'kumbh mela':['Kumbh Mela','Maha Kumbh','Prayagraj Kumbh','Kumbh pilgrimage','Sadhus Kumbh'],
  'shiv jayanti':['Shiv Jayanti','Chhatrapati Shivaji Maharaj Jayanti','Shivaji Maharaj forts','Maharashtra heritage'],
  'indian wedding':['Indian weddings','Indian wedding traditions','Indian wedding ceremony','Indian bridal culture'],
  'indian tradition':['Indian traditions','Indian rituals','Indian cultural traditions','living traditions of India'],
  'indian food':['Indian food','Indian regional cuisine','Indian festival food','Indian traditional recipes'],
  'indian craft':['Indian crafts','Indian handicrafts','Indian artisans','traditional Indian art'],
  'indian fort':['Indian forts','Historic forts of India','Indian fort architecture','Maratha forts'],
  'indian heritage':['Indian heritage','India cultural heritage','Indian monuments','heritage of India'],
  'indian history':['Indian history','history of India','ancient India','Indian historical places'],
  'indian architecture':['Indian architecture','temple architecture India','historic Indian architecture'],
  'indian pilgrimage':['Indian pilgrimage','holy places in India','Indian pilgrimage sites','sacred India'],
  'indian mythology':['Indian mythology','Hindu mythology stories','Indian epics','mythology of India'],
  'indian festival':['Indian festivals','festivals of India','Indian festival traditions','regional festivals India'],
};
function expandedTopicQueries(topic){const normalized=String(topic||'').toLowerCase();const alias=/ganesh|ganpati|ganeshotsav/.test(normalized)?'ganesh chaturthi':/navratri|garba|dandiya|durga maa|mata rani|navdurga/.test(normalized)?'navratri':/temple|pilgrim|darshan/.test(normalized)?'temple':null;const match=Object.entries(TOPIC_EXPANSIONS).find(([key])=>normalized.includes(key))||Object.entries(TOPIC_EXPANSIONS).find(([key])=>key===alias);return match?match[1]:[topic,`${topic} India`,`${topic} tradition`];}
function instagramSeedGroup(topic){const normalized=String(topic||'').toLowerCase();if(/ganesh|ganpati|ganeshotsav/.test(normalized))return'ganesh';if(/navratri|garba|dandiya|durga/.test(normalized))return'navratri';if(/temple|pilgrim|darshan/.test(normalized))return'temple';return'heritage';}

const grid = document.querySelector('#reel-grid');
const dialog = document.querySelector('#reel-dialog');
const infoDialog = document.querySelector('#info-dialog');
const saved = JSON.parse(localStorage.getItem('bharat-reel-studio') || '{"history":[],"decisions":{},"edits":{}}');
saved.visionAnalysisCache ||= {};
saved.learningRuns ||= [];
saved.customReels ||= [];
saved.userAssets ||= [];
saved.customReels=saved.customReels.filter(reel=>Array.isArray(reel.scenes)&&Boolean(reel.pillar));
saved.currentRun ||= null;
saved.rendered ||= {};
if(saved.currentRun?.automation?.status==='running'){
  saved.currentRun.automation.status='interrupted';saved.currentRun.automation.message='The browser closed or refreshed during production. Completed scene assignments and masters are saved; choose Resume to continue.';saved.currentRun.automation.interruptedAt=new Date().toISOString();persist();
}
if(saved.currentRun?.research?.status==='blocked'){
  saved.currentRun.research.status='pending';
  saved.currentRun.research.message='Previous research stopped at an optional connector. Run this topic again to check available public fallback sources; production is not blocked.';
}
if(saved.currentRun?.patternAnalysis?.status==='blocked'){
  saved.currentRun.patternAnalysis.status='pending';
  saved.currentRun.patternAnalysis.message='Pattern analysis will use real source signals or clearly labelled original editorial guidance.';
}
if(saved.currentRun?.patternAnalysis&&/No source to observe yet|No source pattern has been recorded/i.test(saved.currentRun.patternAnalysis.message||''))
  saved.currentRun.patternAnalysis.message='Waiting for available public source results; YouTube metrics are optional.';
if(saved.currentRun?.concepts&&/observed pattern notes|explicit research skip/i.test(saved.currentRun.concepts.message||''))
  saved.currentRun.concepts.message='Original concepts follow topic research automatically; you do not need to skip an optional connector.';
let toastTimer;
const editorUndo=[];const editorRedo=[];let editorHistoryCurrent=null;let editorHistoryTimer=null;
let preserveEditorHistory=false;

let activeWork = null;
let agentTimer;

function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function persist() { localStorage.setItem('bharat-reel-studio', JSON.stringify(saved)); }
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function localStudioMode(){return location.hostname==='127.0.0.1'||location.hostname==='localhost';}
async function fetchWithRetry(url,options={},attempts=3){
  let lastError;for(let attempt=0;attempt<attempts;attempt++){
    try{const response=await fetch(url,options);if((response.status===429||response.status>=500)&&attempt<attempts-1){const header=Number(response.headers.get('retry-after'))*1000;await delay(Math.min(10000,header||800*2**attempt));continue;}return response;}
    catch(error){lastError=error;if(attempt<attempts-1)await delay(500*2**attempt);}
  }
  throw lastError||new Error('Request failed after retries.');
}
async function parseApiJson(response){
  const contentType=String(response.headers.get('content-type')||'').toLowerCase(),url=String(response.url||'');let raw='';try{raw=await response.text();}catch{}
  const fail=message=>{const result={ok:false,error:message,status:response.status};const error=new Error(message);error.apiResponse=result;throw error;};
  if(!contentType.includes('application/json')&&!contentType.includes('+json')){
    const worker=url.includes('/api/worker/');const message=worker?(localStudioMode()?'Local background worker is not running.':'Hosted background worker is unavailable; browser rendering is available.'):`Upstream returned non-JSON response (HTTP ${response.status}).`;
    return fail(message);
  }
  try{return JSON.parse(raw||'{}');}catch{return fail(url.includes('/api/worker/')?'Background worker returned an invalid response.':`API returned invalid JSON (HTTP ${response.status}).`);}
}
function allStoredReels() { return saved.customReels.slice().reverse(); }
function allReels() {
  const runId=saved.currentRun?.id;if(!runId)return[];
  const order=['The Moment','The Detail','The Energy','The Meaning'];
  return order.map(pillar=>saved.customReels.find(reel=>reel.runId===runId&&reel.pillar===pillar)).filter(Boolean);
}
function hasVerifiedAsset(asset){return Boolean(asset?.localUrl&&asset?.filename&&asset?.mediaType&&asset?.width>=640&&asset?.height>=360&&asset?.creator&&asset?.license&&asset?.pageUrl&&asset?.metadataComplete&&(asset.source==='User Upload'&&asset.userRightsConfirmed||asset.source!=='Wikimedia Commons'||asset.licenseUrl));}
function plannedSeconds(reel){return Number(reel?.plannedDuration)||parseFloat(String(reel?.duration||""))||0;}
function hasDistinctAssetSet(assets){const planner=window.FOBProductionPlanning;if(!planner)return false;const used=new Set();for(const asset of assets){if(!hasVerifiedAsset(asset))return false;const keys=planner.assetIdentityKeys(asset);if(!keys.length||keys.some(key=>used.has(key)))return false;keys.forEach(key=>used.add(key));}return true;}
function hasCompleteSceneMedia(reel){const scenes=reel?.scenes||[];return scenes.length===8&&hasDistinctAssetSet(scenes.map(scene=>scene.asset));}
function hasQcPassedMaster(reel){return Boolean(reel?.status==='ready'&&reel?.renderUrl&&reel?.qc?.checks&&reel.qc.checks.fileExists===true&&reel.qc.checks.videoStream===true&&reel.qc.checks.h264===true&&reel.qc.checks.decodeTest===true&&Object.values(reel.qc.checks).every(Boolean));}
function reelAssetCounts(reels=allReels()){const counts={'The Moment':0,'The Detail':0,'The Energy':0,'The Meaning':0};const planner=window.FOBProductionPlanning;for(const reel of reels){const used=new Set();for(const scene of reel.scenes||[]){const asset=scene.asset;if(!hasVerifiedAsset(asset))continue;const keys=planner?.assetIdentityKeys(asset)||[];if(!keys.length||keys.some(key=>used.has(key)))continue;keys.forEach(key=>used.add(key));counts[reel.pillar]=(counts[reel.pillar]||0)+1;}}return counts;}
function batchUniqueAssetCount(reels=allReels()){const used=new Set(),planner=window.FOBProductionPlanning;if(!planner)return 0;let count=0;for(const reel of reels)for(const scene of reel.scenes||[]){const asset=scene.asset;if(!hasVerifiedAsset(asset))continue;const keys=planner.assetIdentityKeys(asset);if(!keys.length||keys.some(key=>used.has(key)))continue;keys.forEach(key=>used.add(key));count++;}return count;}
function setReelProductionState(reel,next){
  const planner=window.FOBProductionPlanning;if(!reel||!planner)return false;
  const current=reel.productionState||'QUEUED';
  try{const update=planner.transitionState(current,next);reel.productionState=update.state;reel.productionStateUpdatedAt=update.updatedAt;reel.productionStateHistory||=[{state:current,at:reel.createdAt||update.updatedAt}];reel.productionStateHistory.push({state:next,at:update.updatedAt});reel.productionStateHistory=reel.productionStateHistory.slice(-40);return true;}
  catch(error){reel.productionStateError=error.message;return false;}
}
function advanceReelState(reel,target){
  const order=window.FOBProductionPlanning?.STATES||[];let current=reel?.productionState||'QUEUED';
  if(current==='APPROVED'||current==='REJECTED')return false;
  if(current==='FAILED'){if(!setReelProductionState(reel,'RETRYING'))return false;current='RETRYING';}
  if(current==='RETRYING')return setReelProductionState(reel,target);
  const start=order.indexOf(current),end=order.indexOf(target);if(start<0||end<0)return false;
  for(let i=start+1;i<=end;i++){const state=order[i];if(state==='RETRYING'||state==='FAILED')continue;if(!setReelProductionState(reel,state))return false;}
  return true;
}
function normalizeMotion(value){const raw=String(value||'').toLowerCase();if(raw.includes('pan left'))return'pan left';if(raw.includes('pan right'))return'pan right';if(raw.includes('rise')||raw.includes('crane'))return'vertical rise';if(raw.includes('static'))return'static cinematic frame';if(raw.includes('parallax'))return'parallax crop';return'slow push';}
function normalizeTransition(value){const raw=String(value||'').toLowerCase();if(raw.includes('hard cut'))return'hard cut';if(raw.includes('match cut'))return'match cut';if(raw.includes('whip'))return'whip cut';if(raw.includes('masked')||raw.includes('foreground wipe'))return'masked reveal';return'crossfade';}
function render() {
  const reelList=allReels();
  grid.innerHTML=reelList.length?reelList.map((original,index)=>{
    const r={...original,...(saved.edits[original.id]||{})};const scenes=Array.isArray(r.scenes)?r.scenes:[];const finalReady=hasQcPassedMaster(r);
    const assigned=scenes.filter(scene=>hasVerifiedAsset(scene.asset)).length;const rights=scenes.filter(scene=>hasVerifiedAsset(scene.asset)&&scene.asset.metadataComplete).length;
    const firstAsset=scenes.find(scene=>hasVerifiedAsset(scene.asset))?.asset;
    const preview=finalReady?`<video class="slot-preview" src="${escapeHtml(r.renderUrl)}" controls playsinline preload="metadata"></video>`:firstAsset?(firstAsset.mediaType==='video'?`<video class="slot-preview" src="${escapeHtml(firstAsset.localUrl)}" controls playsinline preload="metadata"></video>`:`<img class="slot-preview" src="${escapeHtml(firstAsset.localUrl)}" alt="Verified media: ${escapeHtml(firstAsset.title||firstAsset.filename)}">`):'<div class="concept-media-empty"><strong>NO VERIFIED MEDIA YET</strong><span>This storyboard is waiting for real photo or video assets.</span></div>';
    const status=finalReady?(saved.decisions[r.id]||'READY FOR REVIEW').toUpperCase():hasCompleteSceneMedia(r)?'READY FOR EDIT':r.status==='rendering'?'RENDERING':r.status==='blocked'?(r.qc?.checks?'QC FAILED':'RENDER BLOCKED'):'WAITING FOR MEDIA';
    const canRender=hasCompleteSceneMedia(r)&&r.status!=='rendering';
    return `<article class="concept-slot" data-id="${escapeHtml(r.id)}"><div class="slot-media">${preview}<span class="slot-status ${finalReady?'status-real-ready':''}">${escapeHtml(status)}</span></div><div class="card-content"><div class="card-meta"><span>CONCEPT / STORYBOARD ${String(index+1).padStart(2,'0')}</span><span>${scenes.length} planned shots</span></div><h3>${escapeHtml(r.pillar)}</h3><p class="slot-topic">${escapeHtml(r.topic)}</p><p class="card-description">${escapeHtml(r.copy||'Original story plan · production waits for verified real media.')}</p><div class="slot-metrics"><span>Planned duration <b>${plannedSeconds(r)} sec</b></span><span>Media <b>${assigned}/8</b></span><span>Rights records <b>${rights}/8</b></span></div>${!finalReady?'<p class="render-blocker slot-blocker">STORYBOARD ONLY — real media required before rendering</p>':''}<div class="card-footer"><button class="review-button" data-review="${escapeHtml(r.id)}">View storyboard</button><button class="review-button" data-edit-story="${escapeHtml(r.id)}">Edit story</button><button class="review-button" data-analyze-vision="${escapeHtml(r.id)}" ${hasCompleteSceneMedia(r)?'':'disabled title="Assign all eight verified assets first."'}>Analyze real visuals</button><button class="review-button" data-find-media="${escapeHtml(r.id)}">Find / upload media</button>${!finalReady&&assigned<scenes.length?``:''}${finalReady?`<button class="review-button" data-preview-render="${escapeHtml(r.id)}">Preview MP4</button>`:`<button class="review-button" data-render="${escapeHtml(r.id)}" ${canRender?'':'disabled title="Every scene needs a unique real file with recorded rights metadata."'}>${canRender?'Render & QC':'Render blocked · media required'}</button>`}</div></div></article>`;
  }).join(''):'<div class="empty-production"><strong>No active production slots</strong><span>Enter a topic to create exactly four concepts and storyboards. They are not reels until real media is rendered and QC passes.</span></div>';
  grid.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>openReel(b.dataset.review)));
  grid.querySelectorAll('[data-edit-story]').forEach(b=>b.addEventListener('click',()=>openReel(b.dataset.editStory)));
  grid.querySelectorAll('[data-analyze-vision]').forEach(b=>b.addEventListener('click',()=>analyzeReelAssets(b.dataset.analyzeVision)));
  grid.querySelectorAll('[data-render]').forEach(b=>b.addEventListener('click',()=>renderReel(b.dataset.render)));
  grid.querySelectorAll('[data-preview-render]').forEach(b=>b.addEventListener('click',()=>previewRender(b.dataset.previewRender)));
  grid.querySelectorAll('[data-find-media]').forEach(b=>b.addEventListener('click',()=>{const target=document.querySelector('#asset-target');target.value=b.dataset.findMedia;document.querySelector('#asset-query').value=saved.currentRun?.topic||'';renderAssetResults();document.querySelector('#asset-library').scrollIntoView({behavior:'smooth',block:'start'});}));
  document.querySelector('#reel-count').textContent=reelList.length;
  const rendered=document.querySelector('#metric-rendered');if(rendered)rendered.textContent=allStoredReels().filter(hasQcPassedMaster).length;
  const validHistory=allStoredReels().filter(hasQcPassedMaster);const decisions=validHistory.map(reel=>saved.decisions[reel.id]).filter(Boolean);const approved=document.querySelector('#metric-approved');const rejected=document.querySelector('#metric-rejected');if(approved)approved.textContent=decisions.filter(x=>x==='approved').length;if(rejected)rejected.textContent=decisions.filter(x=>x==='rejected').length;
  const target=document.querySelector('#asset-target');if(target){const previous=target.value;target.innerHTML='<option value="">Select a reel…</option>'+reelList.map((r,i)=>`<option value="${escapeHtml(r.id)}">${i+1}. ${escapeHtml(r.pillar)}</option>`).join('');if(reelList.some(r=>r.id===previous))target.value=previous;}
  renderPipeline();renderHistory();renderTeam();renderPerformanceLearning();
}
function renderPerformanceLearning(){
  const target=document.querySelector('#learning-observations'),metric=document.querySelector('#metric-performance');if(!target)return;
  const numeric=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
  const records=(saved.learningRuns||[]).filter(row=>row.metricsStatus==='API_VERIFIED'&&row.performance&&numeric(row.performance.views));
  if(metric)metric.textContent=records.length?`${records.length} linked · API verified`:'Not connected';
  if(records.length<5){target.innerHTML=`<p class="learning-insufficient">${records.length?`${records.length} authorized Reel result(s) linked. Collect at least 5 connected results before reporting a production pattern.`:'Connect and sync your own Instagram Reels, then link each post to its approved studio reel. Metrics are never inferred from competitor references.'}</p>`;return;}
  const average=field=>{const rows=records.filter(row=>numeric(row.performance[field]));return rows.length?{n:rows.length,value:rows.reduce((sum,row)=>sum+Number(row.performance[field]),0)/rows.length}:null;};
  const views=average('views'),shares=average('shares'),watch=average('watchTime');const byPillar=new Map();for(const row of records){const key=row.concept?.pillar||row.pillar||'Unknown';const group=byPillar.get(key)||[];group.push(Number(row.performance.views));byPillar.set(key,group);}
  const comparisons=[...byPillar].filter(([,values])=>values.length>=3).map(([name,values])=>({name,n:values.length,average:values.reduce((a,b)=>a+b,0)/values.length})).sort((a,b)=>b.average-a.average);
  const planner=window.FOBProductionPlanning;const directions=planner?Object.keys(planner.PILLARS).map(pillar=>planner.learnCreativeDirection(saved.learningRuns||[],pillar)).filter(row=>row.status==='OBSERVATION'):[];
  target.innerHTML=`<h3>Observations from your connected Reels</h3><div class="learning-metric-row">${views?`<span>Views average <b>${Math.round(views.value).toLocaleString('en-IN')}</b> · n=${views.n}</span>`:''}${shares?`<span>Shares average <b>${shares.value.toFixed(1)}</b> · n=${shares.n}</span>`:''}${watch?`<span>Watch-time average <b>${watch.value.toFixed(1)}</b> · n=${watch.n}</span>`:''}</div>${comparisons.length>1?`<p>Within this linked sample, <strong>${escapeHtml(comparisons[0].name)}</strong> had the highest observed average views (${Math.round(comparisons[0].average).toLocaleString('en-IN')} across ${comparisons[0].n}); descriptive only, not causal.</p>`:'More linked results per pillar are needed for a stable comparison.'}${directions.length?`<p><strong>Future pacing experiments:</strong> ${directions.map(row=>`${escapeHtml(row.pillar)} will use ${row.targetDuration}s based on its highest-view third of linked reels (n=${row.sampleSize}); exploratory, not causal.`).join(' ')}</p>`:''}`;
}
function commitDraft(id,draft){
  const stored=saved.customReels.find(item=>item.id===id);if(!stored)return;
  Object.assign(stored,draft);stored.status='waiting-for-media';stored.renderUrl=null;stored.qc=null;stored.renderedAt=null;stored.qcStartedAt=null;stored.qcCompletedAt=null;stored.decisionAt=null;delete saved.decisions[id];
  delete saved.edits[id];delete saved.rendered[id];persist();render();renderPipeline();
}

function draftChanged(original,draft){
  return original.title!==draft.title||original.coverSuggestion!==draft.coverSuggestion||original.caption!==draft.caption||original.script!==draft.script||original.visualDirection!==draft.visualDirection||original.template!==draft.template||original.plannedDuration!==draft.plannedDuration||original.scenes.length!==draft.scenes.length||original.scenes.some((scene,index)=>scene.id!==draft.scenes[index].id||scene.text!==draft.scenes[index].text||scene.seconds!==draft.scenes[index].seconds||scene.textPosition!==draft.scenes[index].textPosition||scene.cropX!==draft.scenes[index].cropX||scene.cropY!==draft.scenes[index].cropY||normalizeMotion(scene.motion||scene.cameraMovement)!==normalizeMotion(draft.scenes[index].motion)||normalizeTransition(scene.transition)!==normalizeTransition(draft.scenes[index].transition)||scene.trimStart!==draft.scenes[index].trimStart||scene.trimEnd!==draft.scenes[index].trimEnd||scene.asset?.id!==draft.scenes[index].asset?.id);
}

function setWork(task, topic, detail, progress = null, progressLabel='frames drawn') {
  activeWork = task ? { task, topic, detail, progress, progressLabel, startedAt:performance.now(), startedAtIso:new Date().toISOString() } : null;
  clearInterval(agentTimer);
  if(activeWork) agentTimer=setInterval(renderAgent,250);
  renderAgent();
}

function renderAgent() {
  const task=document.querySelector('#agent-task'); if(!task)return;
  const detail=document.querySelector('#agent-detail');const time=document.querySelector('#agent-time');const progress=document.querySelector('#agent-progress');
  if(!activeWork){task.textContent='Idle · no production task running';detail.textContent='No background or scheduled work is running.';time.textContent='—';progress.textContent='No progress';renderTeam();return;}
  const elapsed=Math.max(0,(performance.now()-activeWork.startedAt)/1000);
  task.textContent=`${activeWork.task} · ${activeWork.topic}`;detail.textContent=activeWork.detail;
  time.textContent=`${elapsed.toFixed(1)}s`;progress.textContent=activeWork.progress===null?'Waiting for actual operation result':`${activeWork.progress}% · ${activeWork.progressLabel||'operation progress'}`;
  renderTeam();
}

const TEAM_ROLES=[
  {name:'Researcher',role:'Viral Research & Source Analyst',stage:'Research',input:'Submitted topic + configured public research connectors',output:'Observed references, source URLs, view/duration metadata and research notes'},
  {name:'Viral Pattern Analyst',role:'Viral Format & Pattern Analyst',stage:'Pattern Analysis',input:'Returned metadata or user-recorded reference observations',output:'Recorded structural notes; no visual claims from metadata alone'},
  {name:'Content Strategist',role:'Festival Content Strategist',stage:'Concepts',input:'Topic + available research/pattern notes',output:'Four distinct Moment, Detail, Energy and Meaning concepts'},
  {name:'Script Writer',role:'Reel Script & Story Writer',stage:'Script',input:'Four generated concepts',output:'Saved scene-by-scene script for each concept'},
  {name:'Storyboard Director',role:'Visual Storyboard Director',stage:'Storyboard',input:'Generated scripts + topic',output:'Saved 8-shot visual plans with camera, motion and timing'},
  {name:'Asset Researcher',role:'Rights-Safe Visual Researcher',stage:'Assets',input:'Topic + storyboard media requirements',output:'Commons candidates and imported assets with source/licence records'},
  {name:'Creative Director',role:'Visual Style & Reel Director',stage:'Creative Direction',input:'Four concepts + saved storyboards',output:'Distinct selected templates and per-pillar visual direction'},
  {name:'Video Editor',role:'Professional Reel Editor',stage:'Edit',input:'Edited scenes + imported photo/video assets',output:'Rendered 1080×1920, 30fps, H.264 MP4 masters'},
  {name:'QC Manager',role:'Video Quality & Rights Controller',stage:'QC',input:'Encoded MP4 + measured render and asset metadata',output:'Recorded technical, duration, asset and text-overflow checks'},
  {name:'Reviewer',role:'Human Approval Coordinator',stage:'Review',input:'QC-passed MP4 previews, captions and asset credits',output:'Human approve/reject decision; publishing is never automatic'},
];
function dateLabel(value){if(!value)return'—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
function elapsedLabel(start,end){if(!start||!end)return'—';const ms=Math.max(0,new Date(end)-new Date(start));if(!Number.isFinite(ms))return'—';const seconds=Math.floor(ms/1000);return seconds<60?`${seconds}s`:`${Math.floor(seconds/60)}m ${String(seconds%60).padStart(2,'0')}s`;}
function renderTeam(){
  const grid=document.querySelector('#team-grid');if(!grid)return;
  const run=saved.currentRun,reelList=run?allReels().filter(reel=>reel.runId===run.id):[];
  const topic=run?.topic||'—';const topicNode=document.querySelector('#team-topic');if(topicNode)topicNode.textContent=run?`Current topic · ${topic}`:'No active topic';
  const ready=reelList.filter(hasQcPassedMaster);const failed=reelList.filter(reel=>reel.status==='blocked');
  const assigned=reelList.reduce((n,reel)=>n+(reel.scenes||[]).filter(scene=>hasVerifiedAsset(scene.asset)).length,0);
  const candidateCount=Number(run?.assetSearch?.resultCount??assetSearchResultCount??0)+saved.userAssets.length;
  const activeRole=activeWork?.task?.includes('reference research')||activeWork?.task?.includes('fallback research')?'Researcher':activeWork?.task?.toLowerCase().includes('pattern analysis')?'Viral Pattern Analyst':activeWork?.task?.includes('concept planner')?'Content Strategist':activeWork?.task?.includes('asset search')||activeWork?.task?.includes('Importing selected media')?'Asset Researcher':activeWork?.task?.includes('Rendering')?'Video Editor':null;
  const conceptsDone=run?.concepts?.status==='ready';
  const stageFor=person=>{
    const role=person.name;let status='pending',task='Waiting for the required upstream operation',input=person.input,output='No output recorded yet',start=null,end=null,progress='Not started';
    if(role==='Researcher'){
      const x=run?.research;status=x?.status==='ready'?'completed':x?.status==='error'||x?.status==='blocked'?'error':x?.status==='running'?'working':'pending';task=x?.message||'Waiting for a topic submission';output=x?.status==='ready'?`${(x.results?.length||0)+(x.instagramReferences?.length||0)} references · ${x.checked||0} YouTube candidates checked · ${x.instagramReferences?.length||0} Instagram records. ${x.message||''}`:'Research results will appear after the source request finishes.';start=x?.startedAt;end=x?.completedAt;progress=x?.status==='ready'?`${(x.results?.length||0)+(x.instagramReferences?.length||0)} references recorded`:'—';
    }else if(role==='Viral Pattern Analyst'){
      const x=run?.patternAnalysis;status=x?.status==='ready'?'completed':x?.status==='error'||x?.status==='blocked'?'error':x?.status==='working'?'working':x?.status==='unavailable'?'unavailable':'pending';task=x?.message||'Waiting for research results';output=x?.observations?.length?x.observations.map(note=>`${note.referenceTitle}: hook “${note.hook}”; opening ${note.openingVisual}; pacing ${note.pacing}; structure ${note.visualPattern}`).join(' · '):x?.insights?.join(' ')||x?.message||'No pattern notes recorded.';start=x?.startedAt;end=x?.completedAt;progress=x?.status==='ready'?`${x.observations?.length||x.insights?.length||0} notes recorded`:x?.status==='unavailable'?'No verified competitor metrics':'—';
    }else if(['Content Strategist','Script Writer','Storyboard Director','Creative Director'].includes(role)){
      const x=run?.concepts;const roleTask={ 'Content Strategist':'Developing four distinct pillar concepts','Script Writer':'Writing the saved scene-by-scene scripts','Storyboard Director':'Structuring each script into timed visual shots','Creative Director':'Assigning a distinct template and visual direction per pillar'}[role];
      status=x?.status==='ready'?'completed':x?.status==='error'?'error':x?.status==='working'&&role==='Content Strategist'?'working':'pending';task=x?.status==='ready'?`${roleTask} · saved in this production run`:x?.status==='working'&&role==='Content Strategist'?roleTask:'Waiting for the concept planner';
      if(conceptsDone){const count=role==='Content Strategist'?reelList.length:reelList.filter(reel=>role==='Script Writer'?Boolean(reel.script):role==='Storyboard Director'?reel.scenes?.length===8:Boolean(reel.template&&reel.visualDirection)).length;output=role==='Content Strategist'?`${count} original concepts · ${reelList.map(reel=>reel.pillar).join(', ')}`:role==='Script Writer'?`${count}/${reelList.length} saved scripts; 8 timed scenes per reel` :role==='Storyboard Director'?`${count}/${reelList.length} storyboards · ${reelList.reduce((n,reel)=>n+(reel.scenes?.length||0),0)} total shots`:`${count}/${reelList.length} template/style decisions saved: ${[...new Set(reelList.map(reel=>reel.template))].join(', ')}`;}
      else output='No generated output recorded.';start=x?.startedAt;end=x?.completedAt;progress=conceptsDone?`${reelList.length}/4 reels prepared`:'—';
    }else if(role==='Asset Researcher'){
      const x=run?.assetSearch;const importing=activeRole===role&&activeWork?.task?.includes('Importing');status=importing||x?.status==='running'?'working':x?.status==='error'||x?.status==='blocked'?'error':assigned>0||x?.status==='ready'?'completed':'pending';task=importing?activeWork.task:x?.message||'Waiting for storyboard media requirements';output=`${candidateCount} current candidates · ${assigned}/${reelList.length*8||0} scene assets assigned. Rights fields stay attached to imported media.`;start=importing?activeWork.startedAtIso:(assigned?reelList.flatMap(reel=>reel.scenes||[]).map(scene=>scene.asset?.importedAt).filter(Boolean).sort()[0]:x?.startedAt);end=assigned?reelList.flatMap(reel=>reel.scenes||[]).map(scene=>scene.asset?.importedAt).filter(Boolean).sort().at(-1):x?.completedAt;progress=`${assigned}/${reelList.length*8||0} assets assigned`;
    }else if(role==='Video Editor'){
      const rendering=reelList.filter(reel=>reel.status==='rendering').length;status=rendering||activeRole===role?'working':failed.length?'error':ready.length&&ready.length===reelList.length?'completed':'pending';task=rendering?`Rendering ${rendering} reel master(s)`:ready.length?`${ready.length}/${reelList.length} MP4 master(s) rendered; remaining masters are not ready`:'Waiting for eight unique rights-recorded assets per reel';output=`${ready.length}/${reelList.length} MP4 masters passed render and QC`;start=activeRole===role?activeWork.startedAtIso:(ready.at(-1)?.renderStartedAt||null);end=ready.at(-1)?.renderedAt||failed.at(-1)?.qcCompletedAt||null;progress=activeRole===role&&activeWork.progress!==null?`${activeWork.progress}% · actual frames drawn`:`${ready.length}/${reelList.length} masters`;
    }else if(role==='QC Manager'){
      const qcFail=failed.some(reel=>reel.qc?.checks&&Object.values(reel.qc.checks).some(ok=>!ok));status=qcFail?'error':ready.length&&ready.length===reelList.length?'completed':'pending';task=qcFail?'Render or QC failure recorded':ready.length?`Encoded master checks recorded · ${ready.length}/${reelList.length} pass; batch QC awaits remaining masters`:'Waiting for encoded MP4 masters';output=ready.map(reel=>`${reel.pillar}: ${Object.entries(reel.qc?.checks||{}).filter(([,ok])=>ok).length}/${Object.keys(reel.qc?.checks||{}).length} checks passed`).join(' · ')||failed.map(reel=>`${reel.pillar}: ${reel.qc?.error||'QC failed'}`).join(' · ')||'No QC report recorded.';start=ready.at(-1)?.qcStartedAt||failed.at(-1)?.qcStartedAt||failed.at(-1)?.renderStartedAt;end=ready.at(-1)?.qcCompletedAt||failed.at(-1)?.qcCompletedAt;progress=`${ready.length}/${reelList.length} passed`;
    }else if(role==='Reviewer'){
      const undecided=ready.filter(reel=>!saved.decisions[reel.id]);const allDecided=ready.length===reelList.length&&ready.length>0&&!undecided.length;status=undecided.length?'waiting-for-human':allDecided?'completed':'pending';task=undecided.length?`${undecided.length} QC-passed reel(s) await your decision`:allDecided?'All rendered reels have a recorded human decision':ready.length?`${ready.length}/${reelList.length} masters reviewed; other reels are not ready yet`:'Waiting for QC-passed previews';output=undecided.length?undecided.map(reel=>`${reel.pillar}: ${Number(reel.qc.duration).toFixed(1)} sec · ${reel.scenes?.filter(scene=>hasVerifiedAsset(scene.asset)).length||0} verified assets`).join(' · '):ready.length?`${ready.filter(reel=>saved.decisions[reel.id]==='approved').length} approved · ${ready.filter(reel=>saved.decisions[reel.id]==='rejected').length} rejected`:'No reels submitted for human review.';start=undecided.at(0)?.renderedAt;end=ready.filter(reel=>saved.decisions[reel.id]).at(-1)?.decisionAt;progress=`${ready.length-undecided.length}/${ready.length} decisions`;
    }
    if(activeRole===role&&activeWork){status='working';task=activeWork.task+(activeWork.detail?` · ${activeWork.detail}`:'');start=activeWork.startedAtIso;progress=activeWork.progress===null?'Operation in progress':`${activeWork.progress}% · actual frames drawn`;}
    return{status,task,input,output,start,end,progress};
  };
  grid.innerHTML=TEAM_ROLES.map(person=>{const d=stageFor(person);const statusLabel=d.status==='waiting-for-human'?'WAITING FOR HUMAN':d.status.toUpperCase();const timer=d.status==='working'&&activeWork?.startedAtIso?elapsedLabel(activeWork.startedAtIso,new Date().toISOString()):elapsedLabel(d.start,d.end);return`<article class="employee-card status-${d.status}"><div class="employee-top"><div><strong>${person.name}</strong><span>${person.role}</span></div><b>${statusLabel}</b></div><dl><dt>Current task</dt><dd>${escapeHtml(d.task)}</dd><dt>Topic</dt><dd>${escapeHtml(topic)}</dd><dt>Input</dt><dd>${escapeHtml(d.input)}</dd><dt>Output</dt><dd>${escapeHtml(d.output)}</dd></dl><div class="employee-meta"><span>Started <b>${dateLabel(d.start)}</b></span><span>Time <b>${timer}</b></span><span>Progress <b>${escapeHtml(d.progress)}</b></span></div></article>`}).join('');
}

function showEncoderCapability(){
  const label=document.querySelector('#encoder-status');if(!label)return;
  if(!('MediaRecorder'in window)){label.textContent='H.264 MP4 encoder: unavailable in this browser.';label.classList.add('rights-missing');return;}
  const chosen=['video/mp4;codecs="avc1.42E01E"','video/mp4;codecs=avc1','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
  label.textContent=chosen?`H.264 MP4 encoder advertised: ${chosen}. READY still requires encoding and file QC.`:'H.264 MP4 encoder: not advertised by this browser; final rendering is blocked.';
  label.classList.toggle('rights-recorded',Boolean(chosen));label.classList.toggle('rights-missing',!chosen);
  fetch('/api/status').then(parseApiJson).then(status=>{if(status.ffprobe?.label)label.textContent+=' '+status.ffprobe.label+'.';if(status.backgroundRender?.label)label.textContent+=' '+status.backgroundRender.label+'.';}).catch(()=>{label.textContent+=' FFmpeg/FFprobe status could not be read; browser rendering may still be used.';});
}

function renderPipeline() {
  const board=document.querySelector('#pipeline-board');if(!board)return;
  const run=saved.currentRun;
  const resume=document.querySelector('#resume-production');if(resume)resume.hidden=!['interrupted','partial','failed'].includes(run?.automation?.status);
  const all=allReels().filter(reel=>!run||reel.runId===run.id);
  const totalReady=all.filter(hasQcPassedMaster).length;
  const referenceState=run?.research?.status || 'idle';
  const patternState=run?.patternAnalysis?.status || 'idle';
  const conceptsState=run?.concepts?.status || 'idle';
  const searchState=run?.assetSearch?.status || 'idle';
  const counts=reelAssetCounts(all),imported=batchUniqueAssetCount(all);
  const stages=[
    ['Research',referenceState,run?.research?.message||'Not run · enter a topic to search available sources'],
    ['Pattern Analysis',patternState,run?.patternAnalysis?.message||'Waiting for a research result or topic-only fallback'],
    ['Concepts',conceptsState,run?.concepts?.message||'Original concepts follow topic research automatically'],
    ['Script',conceptsState,conceptsState==='ready'?'Four original scripts recorded from the chosen topic.':'Waiting for concepts'],
    ['Storyboard',conceptsState,conceptsState==='ready'?'Four distinct 8-shot visual plans · concepts, not rendered reels.':'Waiting for scripts'],
    ['Media',imported===all.length*8&&all.length?'ready':searchState==='running'?'running':searchState==='error'?'error':all.length?'pending':'idle',all.length?`Moment ${counts['The Moment']}/8 · Detail ${counts['The Detail']}/8 · Energy ${counts['The Energy']}/8 · Meaning ${counts['The Meaning']}/8 · TOTAL ${imported}/${all.length*8} verified unique assets · ${run?.assetSearch?.operations?.currentScene||run?.assetSearch?.message||'photo, video and photo-with-motion are supported'}`:'Waiting for storyboards before asset selection'],
    ['Edit',all.length&&all.every(hasCompleteSceneMedia)?'ready':all.length?'pending':'idle',all.length?`${all.filter(hasCompleteSceneMedia).length}/${all.length} reels READY FOR EDIT · ${all.every(hasCompleteSceneMedia)?'Video Editor READY':'waiting for 8 unique rights-recorded assets in each reel'}`:'No storyboards'],
    ['Render',all.some(r=>r.status==='rendering')?'running':all.some(r=>r.status==='blocked')?'error':all.length&&all.every(hasQcPassedMaster)?'ready':all.length?'pending':'idle',all.length?`${all.filter(hasQcPassedMaster).length}/${all.length} actual MP4 masters saved and validated`:'No MP4 files'],
    ['QC',totalReady===all.length&&all.length?'ready':all.some(r=>r.status==='rendering')?'running':all.some(r=>r.qc?.checks&&Object.values(r.qc.checks).some(ok=>!ok))?'error':all.length?'pending':'idle',all.length?`${all.filter(hasQcPassedMaster).length}/${all.length} saved masters passed file and playback checks`:'No QC reports'],
    ['Review',all.length?(totalReady===all.length?(all.every(reel=>saved.decisions[reel.id])?'ready':'waiting-for-human'):'pending'):'idle',all.length&&totalReady===all.length?(all.every(reel=>saved.decisions[reel.id])?'Human decisions recorded for all QC-passed MP4s':'QC-passed MP4s are waiting for your decision'):all.length?'Waiting for real masters that pass QC':'No concepts submitted'],
  ];
  board.innerHTML=stages.map(([label,state,message])=>`<div class="pipeline-step ${state==='ready'?'step-ready':state==='running'?'step-running':state==='error'?'step-blocked':state==='pending'?'step-pending':state==='waiting-for-human'?'step-waiting':''}"><span>${escapeHtml(label)}</span><strong>${state==='ready'?'Completed':state==='running'?'Working':state==='error'?'Error':state==='pending'?'Pending':state==='unavailable'?'Unavailable':state==='waiting-for-human'?'Waiting for human':'Not started'}</strong><small>${escapeHtml(message)}</small></div>`).join('');
  const counter=document.querySelector('#asset-counter');if(counter){const required=all.length*8;counter.innerHTML=`<strong>Scene media</strong><span>Moment <b>${counts['The Moment']||0}/8</b></span><span>Detail <b>${counts['The Detail']||0}/8</b></span><span>Energy <b>${counts['The Energy']||0}/8</b></span><span>Meaning <b>${counts['The Meaning']||0}/8</b></span><span>TOTAL <b>${imported}/${required}</b></span><span>Rendered masters <b>${all.filter(hasQcPassedMaster).length}/${all.length}</b></span>`;}
}

function conceptScenes(topic,pillar,secondsPerScene) {
  const planner=window.FOBProductionPlanning;
  if(!planner)throw new Error('Production planner module did not load. Refresh the studio before creating concepts.');
  // Pillar-specific beats intentionally replace the former uniform scene duration.
  const direction=planner.learnCreativeDirection(saved.learningRuns||[],pillar);
  return planner.planScenes(topic,pillar,direction).map(scene=>({...scene,id:crypto.randomUUID()}));
}

async function createProduction(event) {
  event.preventDefault();
  const topic=document.querySelector('#production-topic').value.trim();if(!topic)return;
  const submit=document.querySelector('#production-start');submit.disabled=true;submit.textContent='Researching…';
  const runId=crypto.randomUUID();
  const topicQueries=expandedTopicQueries(topic);const researchStartedAt=new Date().toISOString();saved.currentRun={id:runId,topic,createdAt:researchStartedAt,research:{status:'running',startedAt:researchStartedAt,message:'Checking available public reference sources.',topicQueries,instagramReferences:[]},patternAnalysis:{status:'pending',message:'Preparing an originality-safe summary from source signals actually returned.'},concepts:{status:'pending',message:'Four original concepts will follow the research summary.'},assetSearch:{status:'pending',message:'Searching Commons for candidate photos and videos.'},references:[]};
  renderInstagramDiscovery(topic);
  persist();render();
  setWork('Public reference research',topic,'Checking optional YouTube metadata and Wikimedia Commons topic discovery.');
  let youtube={available:false,results:[],checked:0,message:'Live YouTube metrics unavailable — YOUTUBE_API_KEY is not configured.'};
  let instagramDiscovery={available:false,results:[],checked:0,message:'Google Custom Search keys are not configured; use the public search links.'};
  let commons={results:[],message:''};
  try{const response=await fetchWithRetry(`/api/trends?q=${encodeURIComponent(topic)}&minViews=100000`);const data=await parseApiJson(response);if(response.ok){youtube={available:true,results:Array.isArray(data.results)?data.results:[],checked:data.checked||0,message:data.results?.length?`${data.results.length} YouTube references met the 100K+ view filter.`:'YouTube returned no references matching the 100K+ view and duration filters.'};}else{youtube.message=response.status===503?'Live YouTube metrics unavailable — YOUTUBE_API_KEY is not configured.':`Live YouTube metrics unavailable — ${data.error||'the optional connector failed'}.`;}}catch(error){youtube.message=`Live YouTube metrics unavailable — ${error.message||'the optional connector could not be reached'}.`;}
  setWork('Instagram public discovery',topic,'Searching the optional Google public index for Instagram Reel URLs. View counts remain unavailable until verified at source.');
  try{const query=topicQueries.slice(0,6).join(' OR ').slice(0,115);const response=await fetchWithRetry(`/api/instagram-research?q=${encodeURIComponent(query)}`);const data=await parseApiJson(response);if(response.ok)instagramDiscovery={available:true,results:Array.isArray(data.results)?data.results:[],checked:data.checked||0,message:`Google public index returned ${data.results?.length||0} Instagram Reel links. Metrics and visual details require inspection on Instagram.`};else instagramDiscovery.message=data.optional?'Google Custom Search keys are not configured; use the public search links.':data.error||'Google public discovery is temporarily unavailable.';}catch(error){instagramDiscovery.message=`Google public discovery unavailable; use the search links. ${error.message||''}`;}
  setWork('Public fallback research',topic,'Searching Wikimedia Commons for public topic context and candidate rights-recorded media. References are never used as reel media.');
  try{const response=await fetchWithRetry(`/api/commons-search?q=${encodeURIComponent(topic)}&kind=all`);const data=await parseApiJson(response);if(response.ok)commons={results:Array.isArray(data.results)?data.results:[],diagnostics:data.diagnostics,message:''};else commons.message=data.error||'Wikimedia Commons topic discovery is unavailable.';}catch(error){commons.message=`Wikimedia Commons topic discovery unavailable — ${error.message||'connection error'}.`;}
  const ytResults=youtube.results;const photoCount=commons.results.filter(a=>a.mediaType==='photo').length;const videoCount=commons.results.filter(a=>a.mediaType==='video').length;const rightsCount=commons.results.filter(a=>a.metadataComplete).length;
  const cd=commons.diagnostics||{};const commonsReport=commons.results.length?`Wikimedia Commons · HTTP ${cd.httpStatus||'OK'} · raw ${cd.raw??commons.results.length} · supported MIME ${cd.supportedMime??'n/a'} · creator ${cd.creator??'n/a'} · reusable licence ${cd.license??'n/a'} · rights-complete ${cd.rightsComplete??rightsCount} · downloadable ${cd.downloadable??commons.results.length} · returned ${commons.results.length}.`:`Commons topic discovery returned 0 accepted assets${cd.raw?` · HTTP ${cd.httpStatus} · raw ${cd.raw} · rights-complete ${cd.rightsComplete||0} · rejected ${cd.rejected||0}`:''}${commons.message?`: ${commons.message}`:'.'}`;
  const sourceSummary=`${instagramDiscovery.message} ${ytResults.length?`${youtube.message} ${youtube.checked} candidates checked; public YouTube view counts are current API data.`:youtube.message} ${commonsReport}`;
  const patternInsights=[];
  if(ytResults.length){const durations=ytResults.map(v=>v.durationSeconds).sort((a,b)=>a-b);patternInsights.push(`${ytResults.length} current YouTube references met the 100K+ filter; durations ${durations[0]}–${durations[durations.length-1]} seconds. These are metadata signals only; shot-level visual analysis is unavailable automatically.`);}
  else patternInsights.push('No connected source returned reel-level view counts or inspectable video frames. Original editorial blueprint from your brief (not an observed reel): hook in the first 1–2 seconds; alternate authentic wide views, close details and a human moment; change visuals about every 1–2 seconds; use short factual overlays; build Hook → Context → Detail → Human Moment → Meaning → Payoff.');
  if(ytResults.length)patternInsights.push('Original editorial blueprint (not a measured competitor pattern): open with immediate action, progress through wide and close views, reveal a human/cultural detail, and finish with meaning and payoff. Keep captions short and visuals distinct.');
  if(commons.results.length)patternInsights.push(`Topic asset discovery returned ${photoCount} photos and ${videoCount} videos; ${rightsCount} results include creator and licence metadata. Commons files are production candidates, not viral references.`);
  const patternMessage=patternInsights.join(' ');const run=saved.currentRun;
  const researchCompletedAt=new Date().toISOString();
  run.research={...run.research,status:'ready',message:sourceSummary,results:ytResults,resultCount:ytResults.length,checked:youtube.checked,youtubeAvailable:youtube.available,instagramDiscoveryResults:instagramDiscovery.results,instagramDiscoveryMessage:instagramDiscovery.message,instagramReferences:run.research.instagramReferences||[],sourcesChecked:[...(youtube.available?['YouTube Data API']:[]),...(instagramDiscovery.available?['Google Custom Search API · public Instagram URL discovery']:[])],sourcesAvailable:['Instagram public web discovery links · manual inspection','Google Custom Search API · optional','YouTube Data API · optional','Wikimedia Commons · topic assets only'],startedAt:researchStartedAt,completedAt:researchCompletedAt};
  const manualReferences=run.research.instagramReferences||[];run.patternAnalysis={status:ytResults.length||manualReferences.length?'pending':'unavailable',mode:ytResults.length?'VERIFIED_RESEARCH':manualReferences.length?'USER_PROVIDED_REFERENCES':'RESEARCH_CONNECTOR_UNAVAILABLE',type:ytResults.length?'metadata-only':'editorial-guidance',message:ytResults.length?'Verified public metrics found. Pattern notes require inspection and must be recorded; no automatic visual analysis is claimed.':manualReferences.length?`${manualReferences.length} user-provided public reference(s) are saved. Inspect one and record its pattern; user-observed metrics are not API verified.`:'No verified competitor metrics available. Optional YouTube/Google connectors are unavailable; this stage does not block original topic-led production.',insights:patternInsights,observations:[],startedAt:new Date().toISOString()};
  run.assetSearch={status:commons.message&&!commons.results.length?'error':commons.results.length?'ready':'error',startedAt:researchCompletedAt,completedAt:researchCompletedAt,resultCount:commons.results.length,diagnostics:cd,message:`${commonsReport}${cd.rejectionReasons?.length?` Rejection examples: ${cd.rejectionReasons.slice(0,3).map(item=>`${item.title}: ${item.reasons.join(', ')}`).join(' | ')}`:''}`};
  assetSearchResults=commons.results;assetSearchResultCount=commons.results.length;
  renderInstagramDiscovery(topic);renderInstagramSearchResults();renderInstagramReferences();
  if(ytResults.length)renderTrendResults({results:ytResults,checked:youtube.checked},topic);else{document.querySelector('#live-results').innerHTML='';document.querySelector('#live-status').textContent=`${youtube.message} Instagram references can be found through public web discovery and recorded with their visible source details. ${commons.results.length?`Public topic fallback returned ${photoCount} photos and ${videoCount} videos; these are candidate assets, not viral references.`:'No public topic results were returned; original concepts remain available.'}`;}
  persist();renderPipeline();
  run.concepts={status:'pending',message:'Four original concepts can use inspected reference notes or continue from the topic alone.'};persist();renderPipeline();syncConceptActions();renderResearchDashboard();renderAssetResults();setWork(null);
  submit.disabled=false;submit.textContent='Research this topic';await startAutomaticProduction();document.querySelector('#reel-grid').scrollIntoView({behavior:'smooth',block:'start'});
}

function createConcepts(skipResearch=false){
  const run=saved.currentRun;if(!run)return;
  const patterns=skipResearch?[]:(run.patternAnalysis?.observations||[]);
  if(!skipResearch&&!patterns.length){showToast('Record at least one public-reference pattern first, or choose the topic-only fallback.');return;}
  if(run.concepts?.status==='ready'){showToast('This production run already has its four concepts.');return;}
  const pillars=[['The Moment','moment',1.75],['The Detail','detail',1.25],['The Energy','energy',1.5],['The Meaning','meaning',1.75]];
  const conceptStartedAt=new Date().toISOString();run.concepts={...(run.concepts||{}),status:'working',startedAt:conceptStartedAt,message:'Building four distinct concepts, scripts, storyboards and creative treatments.'};persist();setWork('Local four-pillar concept planner',run.topic,'Generating four distinct shot plans from the submitted topic and any recorded pattern observations.');
  const drafts=pillars.map(([pillar,template,beat],index)=>{
    const scenes=conceptScenes(run.topic,pillar,beat);let cursor=0;
    const reference=patterns[index%Math.max(patterns.length,1)];
    const script=scenes.map((scene,sceneIndex)=>{const start=cursor;cursor+=scene.seconds;let shot=scene.description;if(reference&&sceneIndex===0)shot+=` Apply only the observed hook function (${reference.openingVisual}) to a new ${run.topic} shot; do not recreate the reference frame.`;if(reference&&sceneIndex===7)shot+=` Shape the original payoff around the broad reveal cue (${reference.visualPattern}); use new footage.`;return`[${start.toFixed(1)}–${cursor.toFixed(1)}s · ${pillar}] ${shot}`;}).join('\n');
    const source=reference?`Research only · observed by user from “${reference.referenceTitle}” (${formatViews(reference.views)} views, ${reference.duration}s): ${reference.pacing}; ${reference.visualPattern}. Final story, footage and audio are original.`:run.research?.message||'No connected reference metrics; original topic and pillar framework only.';
    const researchNote=reference?'Uses manually observed structure only; no source footage, text or audio is reused.':run.research?.youtubeAvailable?'Live view/duration metadata informed topic context only; no competitor visuals were copied or claimed analysed.':'Live YouTube metrics unavailable; this is an original topic-led concept, not a recreation of another reel.';
    const originalityDisclosure=run.research?.results?.length?'Reference used for research only — final reel is original.':'No viral reference was available — final reel is an original topic-led concept.';
    return {id:`${run.id}-${template}`,runId:run.id,pillar,template,title:`${run.topic}: ${pillar}`,topic:run.topic,language:'English',plannedDuration:cursor,coverSuggestion:`Use the first real media scene as the cover after assets are assigned.`,caption:`${run.topic} — ${pillar}.\nFollow Festival of Bharat for more stories across India.`,copy:`Original ${pillar} concept · storyboard only. ${researchNote} ${originalityDisclosure} Real media and recorded rights data are required before editing or rendering.`,script,visualDirection:VISUAL_DIRECTION,audio:'No music · source video/audio tracks are excluded',fact:'Fact-check historical, religious and location details against cited sources before approval.',source,scenes,status:'waiting-for-media',renderUrl:null,qc:null,createdAt:new Date().toISOString(),patternReference:reference?{referenceId:reference.referenceId,title:reference.referenceTitle,views:reference.views,url:reference.url}:null};
  });
  for(const reel of drafts){reel.productionState='QUEUED';reel.productionStateHistory=[];setReelProductionState(reel,'RESEARCHING');setReelProductionState(reel,'PLANNING');}
  saved.customReels.unshift(...drafts);run.concepts={status:'ready',startedAt:conceptStartedAt,completedAt:new Date().toISOString(),message:`Four distinct original shot plans created · Moment, Detail, Energy, Meaning · ${patterns.length?'manual visual observations used only as structural inspiration':run.research?.youtubeAvailable?'live YouTube view metadata available; competitor visuals were not claimed analysed':'no live viral metrics available; original topic and four-pillar frameworks used'}.`};
  if(skipResearch){run.concepts.message='Four topic-led concepts created without applying observed reference patterns.';run.patternAnalysis={...(run.patternAnalysis||{}),status:run.patternAnalysis?.observations?.length?'ready':'pending',message:run.patternAnalysis?.observations?.length?'Pattern notes were recorded, but you chose not to apply them to this concept run.':'Topic-only fallback selected; no competitor Reel pattern was analysed.'};}
  if(!run.assetSearch)run.assetSearch={status:'pending',message:'Search Commons for licensed photos and video for each storyboard scene.'};persist();render();renderPipeline();syncConceptActions();setWork(null);renderAssetResults();document.querySelector('#reel-grid').scrollIntoView({behavior:'smooth',block:'start'});
}

let automaticProductionActive=false;
async function startAutomaticProduction(){
  const run=saved.currentRun;if(!run||automaticProductionActive)return;
  automaticProductionActive=true;const reels=allReels();run.automation={...(run.automation||{}),status:'running',startedAt:run.automation?.startedAt||new Date().toISOString(),message:'Completing storyboards and sourcing distinct rights-recorded media; rendering mode is selected from live server capability.'};persist();renderPipeline();
  try{
    if(!reels.length)createConcepts(true);
    let current=allReels();if(!current.length)throw new Error('Four concepts and storyboards are not available; media production cannot start.');
    const worker=await backgroundWorkerStatus();let services={backgroundRender:{available:false},vision:{configured:false}};try{const response=await fetch('/api/status');services=await parseApiJson(response);if(!response.ok)throw new Error(services.error||`HTTP ${response.status}`);}catch(error){run.automation.workerNotice=localStudioMode()?`Local worker/API unavailable (${error.message}); continuing with the browser renderer.`:'Hosted worker is unavailable; continuing with the browser renderer.';}
    if(batchUniqueAssetCount(current)<32||current.some(reel=>!hasCompleteSceneMedia(reel))){const counts=reelAssetCounts(current);run.automation={...run.automation,status:'awaiting-manual-media',completedAt:new Date().toISOString(),readyCount:current.filter(hasQcPassedMaster).length,message:`Manual media selection required. Nothing is auto-assigned. Select each photo/video individually for each storyboard scene. Moment ${counts['The Moment']}/8 · Detail ${counts['The Detail']}/8 · Energy ${counts['The Energy']}/8 · Meaning ${counts['The Meaning']}/8.`};persist();renderPipeline();render();return;}
    for(let index=0;index<current.length;index++){
      const reel=saved.customReels.find(item=>item.id===current[index].id);if(!reel||hasQcPassedMaster(reel))continue;
      if(!hasCompleteSceneMedia(reel)){run.automation={...run.automation,status:'partial',message:`${reel.pillar} is not READY FOR EDIT; its eight unique rights-recorded photo/video assets are required.`};break;}
      reel.status='rendering';reel.renderMode=worker.configured?'BACKGROUND_WORKER':'BROWSER_CANVAS';advanceReelState(reel,'EDITING');advanceReelState(reel,'RENDERING');
      run.automation={...run.automation,status:'rendering',currentReel:index+1,message:`${reel.pillar} · READY FOR EDIT · rendering and QC this reel before starting the next.`};persist();render();renderPipeline();
      if(worker.configured){try{await submitBackgroundRender(reel);}catch(error){reel.status='blocked';reel.qc={...(reel.qc||{}),error:error.message};setReelProductionState(reel,'FAILED');persist();throw error;}}
      else{await renderReel(reel.id);}
      if(!hasQcPassedMaster(reel)){run.automation={...run.automation,status:'partial',failedReel:reel.pillar,message:`${reel.pillar} did not pass actual MP4 QC. Later reels have not been rendered. ${reel.qc?.error||'Inspect this reel and resume after correcting the rendering issue.'}`};persist();break;}
      current=allReels();
    }
    const done=allReels(),ready=done.filter(hasQcPassedMaster).length;run.automation={...run.automation,status:ready===4?'review':'partial',completedAt:new Date().toISOString(),readyCount:ready,message:ready===4?'Four real MP4 masters passed QC and are waiting for your review.':`${ready}/4 real MP4 masters passed QC. The batch is saved and may be resumed; no unfinished reel is labelled complete.`};
  }catch(error){run.automation={...run.automation,status:'failed',message:`Production stopped safely: ${error.message}. Saved scenes and masters remain available to resume.`};}
  finally{automaticProductionActive=false;persist();render();renderPipeline();renderTeam();setWork(null);}
}
async function resumeAutomaticProduction(){const run=saved.currentRun;if(!run)return;run.automation={...(run.automation||{}),status:'running',message:'Resuming unfinished scene searches and MP4 renders from saved progress.'};persist();renderPipeline();await startAutomaticProduction();}

function syncConceptActions(){
  const create=document.querySelector('#create-concepts-button');const skip=document.querySelector('#skip-research-button');const actions=document.querySelector('#concept-actions');const run=saved.currentRun;
  if(!create||!skip)return;
  if(actions)actions.hidden=!run||run.concepts?.status==='ready';
  const hasPattern=Boolean(run?.patternAnalysis?.observations?.length);
  create.disabled=!run||!hasPattern||run.concepts?.status==='ready';skip.disabled=!run||run.concepts?.status==='ready';
}

let assetSearchResultCount=0;

let assetSearchResults=[];
let automaticAssetSearchInProgress=false;
function sceneSearchQuery(reel,scene,index){
  const pillarTerms={
    'The Moment':['festival participants India ritual close up','devotees celebration India','hands preparing festival ritual India','festival shared human moment India'],
    'The Detail':['Indian idol craftsmanship close up','Indian temple carving detail','flowers offerings ritual India','traditional Indian craft detail'],
    'The Energy':['Indian festival procession crowd video','Indian festival dance celebration','devotional procession movement India','festival crowd celebration India'],
    'The Meaning':['Indian temple devotees ritual','Indian temple architecture heritage','Indian religious tradition ritual','historic temple India culture'],
  };
  const descriptions=String(scene.description||'').toLowerCase();
  const sceneTerms=descriptions.includes('idol')?['Ganpati idol close up','Ganesh idol decoration','Ganpati darshan']:
    descriptions.includes('crowd')||descriptions.includes('community')?['Indian festival crowd procession','devotees celebration India','festival community India']:
    descriptions.includes('flower')||descriptions.includes('offering')||descriptions.includes('detail')?['Indian ritual flower offering detail','temple offering close up','Indian festival decoration detail']:
    descriptions.includes('temple')||descriptions.includes('place')?['Indian temple architecture','historic temple India','temple exterior India']:
    descriptions.includes('dance')||descriptions.includes('rhythmic')||descriptions.includes('movement')?['Indian festival dance','India procession movement','devotional celebration crowd']:
    ['Indian festival ritual','Indian heritage tradition','Indian devotional culture'];
  const variants=sceneTerms.concat((pillarTerms[reel.pillar]||[]));
  const topic=String(reel.topic||'').trim();
  return [...new Set(variants.map(term=>`${topic} ${term}`.trim()))].slice(0,2)[index%2];
}
function globalAssetQueries(topic){
  const base=String(topic||'').trim(),lower=base.toLowerCase();const broad=['India','culture','heritage','architecture','people','streets','market','local life','festival','temple','food','daily life'];
  if(/mumbai|bombay/.test(lower))broad.push('Mumbai skyline','Mumbai street photography','Mumbai local train','Mumbai market','Mumbai heritage architecture','Gateway of India Mumbai','Marine Drive Mumbai','Chhatrapati Shivaji Maharaj Terminus Mumbai');
  else if(/ganesh|ganpati/.test(lower))broad.push('Ganesh Chaturthi India','Ganpati procession India','Ganesh idol Mumbai','Ganpati visarjan','Ganesh temple India');
  else if(/holi/.test(lower))broad.push('Holi festival India','Holi people celebration','Holi colour India','Barsana Holi','Mathura Holi');
  else if(/temple|heritage|culture|festival/.test(lower))broad.push(`${base} people`,`${base} ritual`,`${base} India architecture`);
  return [...new Set([base,...expandedTopicQueries(base),...broad.map(term=>term.toLowerCase().startsWith(`${lower} `)?term:`${base} ${term}`.trim())])].filter(Boolean).slice(0,18);
}
function cleanCommonsText(value){return String(value?.value||value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();}
function browserCommonsLicenseUrl(license){
  const value=String(license||'').toLowerCase().replace(/\s+/g,' ').trim();
  if(/cc0|creative commons zero|zero\/1\.0/.test(value))return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if(/public domain|pd-self|pd old|pd-old/.test(value))return 'https://commons.wikimedia.org/wiki/Commons:Licensing#Public_domain';
  if(/cc by-sa 4\.0/.test(value))return 'https://creativecommons.org/licenses/by-sa/4.0/';
  if(/cc by 4\.0/.test(value))return 'https://creativecommons.org/licenses/by/4.0/';
  if(/cc by-sa 3\.0/.test(value))return 'https://creativecommons.org/licenses/by-sa/3.0/';
  if(/cc by 3\.0/.test(value))return 'https://creativecommons.org/licenses/by/3.0/';
  if(/cc by 2\.0/.test(value))return 'https://creativecommons.org/licenses/by/2.0/';
  return '';
}
function browserCommonsResults(data,query){
  const pages=Array.isArray(data?.query?.pages)?data.query.pages:[],results=[];
  for(const page of pages){
    const info=page?.imageinfo?.[0]||{},meta=info.extmetadata||{};
    const mime=String(info.mime||'').split(';')[0].toLowerCase();
    const mediaType=mime.startsWith('image/')?'photo':mime.startsWith('video/')?'video':null;
    const mediaUrl=String(info.url||'');
    const pageUrl=String(info.descriptionurl||'');
    const creator=cleanCommonsText(meta.Artist)||cleanCommonsText(meta.Credit)||cleanCommonsText(meta.Author)||cleanCommonsText(meta.Creator);
    const explicitLicense=cleanCommonsText(meta.LicenseShortName)||cleanCommonsText(meta.UsageTerms)||cleanCommonsText(meta.LicenseUrl);
    const finalLicense=explicitLicense||(cleanCommonsText(meta.Copyrighted).toLowerCase()==='false'?'Public domain':'');
    const licenseUrl=cleanCommonsText(meta.LicenseUrl)||browserCommonsLicenseUrl(finalLicense);
    const licenseEvidence=explicitLicense?`License: ${explicitLicense}`:(String(meta.Copyrighted?.value||'').toLowerCase()==='false'?'Copyrighted: false':'');
    const width=Number(info.width||0),height=Number(info.height||0),size=Number(info.size||0);
    if(!mediaType||!mediaUrl||!pageUrl||!width||!height)continue;
    const metadataComplete=Boolean(creator&&finalLicense&&licenseUrl&&licenseEvidence&&pageUrl&&width>0&&height>0);
    results.push({id:String(page.pageid||''),commonsPageId:String(page.pageid||''),title:String(page.title||'').replace(/^File:/,''),description:cleanCommonsText(meta.ImageDescription),categories:(page.categories||[]).map(item=>String(item.title||'').replace(/^Category:/,'')).filter(Boolean),subjects:[],source:'Wikimedia Commons',sourceUrl:mediaUrl,mediaUrl,pageUrl,sourcePage:pageUrl,mediaType,mime,width,height,size,creator,license:finalLicense,licenseUrl,licenseEvidence,licenseCompatible:Boolean(licenseUrl),metadataComplete,rightsStatus:metadataComplete?'VERIFIED':'UNVERIFIED',downloadable:true,previewUrl:info.thumburl||mediaUrl,discoveryQueries:[query],metadataKeys:Object.keys(meta),rejectReasons:metadataComplete?[]:['creator/license/source metadata incomplete']});
  }
  return {query,source:'Wikimedia Commons',results,verifiedResults:results.filter(asset=>asset.metadataComplete),diagnostics:{raw:pages.length,returned:results.length,verified:results.filter(asset=>asset.metadataComplete).length,rightsComplete:results.filter(asset=>asset.metadataComplete).length,downloadable:results.length}};
}
async function browserCommonsSearch(query){
  const url=new URL('https://commons.wikimedia.org/w/api.php');
  [['origin','*'],['action','query'],['format','json'],['formatversion','2'],['generator','search'],['gsrnamespace','6'],['gsrsearch',String(query).trim().slice(0,180)],['gsrlimit','30'],['prop','imageinfo|categories'],['cllimit','20'],['iiprop','url|mime|size|extmetadata'],['iiurlwidth','1600']].forEach(([key,value])=>url.searchParams.set(key,value));
  const response=await fetchWithRetry(url.toString(),{},3);const data=await parseApiJson(response);if(!response.ok)throw new Error(data.error||`Wikimedia browser search HTTP ${response.status}`);return browserCommonsResults(data,query);
}
async function collectGlobalAssetPool(topic){
  const queries=globalAssetQueries(topic),rows=[],failures=[],diagnostics=[];let next=0;
  async function searchLoop(){while(next<queries.length){const query=queries[next++];try{let data;try{const response=await fetchWithRetry(`/api/commons-search?q=${encodeURIComponent(query)}&kind=all`);data=await parseApiJson(response);if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);}catch(primaryError){try{data=await browserCommonsSearch(query);}catch(browserError){throw new Error(`Commons discovery failed: ${primaryError.message}; browser fallback: ${browserError.message}`);}}diagnostics.push(data.diagnostics||{});for(const asset of data.results||[])rows.push({...asset,discoveryQueries:[...new Set([...(asset.discoveryQueries||[]),query])],commonsPageId:String(asset.commonsPageId||asset.id||'')});}catch(error){failures.push(`${query}: ${error.message}`);}}}
  await Promise.all(Array.from({length:Math.min(2,queries.length)},searchLoop));
  const pool=new Map();for(const asset of rows){const planner=window.FOBProductionPlanning,key=planner.assetIdentityKeys(asset).find(value=>value.startsWith('page:')||value.startsWith('pageurl:')||value.startsWith('media:'));if(!key)continue;const previous=pool.get(key);if(!previous)pool.set(key,asset);else pool.set(key,{...previous,...asset,discoveryQueries:[...new Set([...(previous.discoveryQueries||[]),...(asset.discoveryQueries||[])])],categories:[...new Set([...(previous.categories||[]),...(asset.categories||[])])]});}
  return{queries,assets:[...pool.values()],failures,diagnostics};
}
function scoreSceneAsset(asset,reel,scene,index,usedIds){
  const planner=window.FOBProductionPlanning;if(!planner)return -Infinity;
  const query=sceneSearchQuery(reel,scene,index);const sceneQuery=query.slice(String(reel.topic||'').length).toLowerCase();const stop=new Set(['india','indian','video','photo','close','wide','real','show','with','from','the','and','for']);const terms=[...new Set(sceneQuery.split(/[^\p{L}\p{N}]+/u).filter(word=>word.length>3&&!stop.has(word)))];
  const previousScene=index>0?reel.scenes[index-1]:null;
  return planner.rankAsset(asset,{terms,mediaPreference:scene.mediaPreference||scene.mediaRequirement,usedIds,previousScene,sceneRequirement:scene.description});
}
function assetAlreadyAssigned(asset,except={}){const planner=window.FOBProductionPlanning;if(!planner)return false;const keys=new Set(planner.assetIdentityKeys(asset));return allReels().some(reel=>(reel.scenes||[]).some(scene=>!(reel.id===except.reelId&&scene.id===except.sceneId)&&planner.assetIdentityKeys(scene.asset).some(key=>keys.has(key))));}
async function backgroundWorkerStatus(){if(!localStudioMode())return{configured:false,online:false,mode:'BROWSER_CANVAS',message:'Hosted deployment uses browser rendering; the persistent FFmpeg worker is local-only.'};try{const response=await fetch('/api/worker/status');return response.ok?await parseApiJson(response):{configured:false};}catch{return{configured:false,online:false,mode:'BROWSER_CANVAS',message:'Local background worker is unavailable; browser rendering remains available.'};}}
function seekMedia(video,time){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timed out seeking a frame for visual analysis.')),10000);video.onseeked=()=>{clearTimeout(timer);resolve();};video.onerror=()=>{clearTimeout(timer);reject(new Error('Could not decode a video frame for visual analysis.'));};video.currentTime=time;});}
async function framesForVisualAnalysis(asset){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=1365;const context=canvas.getContext('2d');if(!context)throw new Error('Canvas frame sampler is unavailable.');
  if(asset.mediaType==='video'){
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='metadata';video.src=asset.localUrl;await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error(`Could not read ${asset.title} for visual analysis.`));});
    const duration=Math.max(.1,Number(video.duration)||1),frames=[];for(const fraction of [.05,.5,.95]){await seekMedia(video,Math.min(Math.max(.05,duration*fraction),Math.max(.05,duration-.05)));context.fillStyle='#000';context.fillRect(0,0,768,1365);const scale=Math.max(768/video.videoWidth,1365/video.videoHeight),width=video.videoWidth*scale,height=video.videoHeight*scale;context.drawImage(video,(768-width)/2,(1365-height)/2,width,height);frames.push(canvas.toDataURL('image/jpeg',.72));}video.pause();video.removeAttribute('src');video.load();return frames;
  }
  const image=new Image();image.src=asset.localUrl;await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error(`Could not decode ${asset.title} for visual analysis.`));});const scale=Math.min(1,768/image.naturalWidth,1365/image.naturalHeight);const width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.width=width;canvas.height=height;context.drawImage(image,0,0,width,height);return[canvas.toDataURL('image/jpeg',.72)];
}
async function analyzeReelAssets(reelId){
  const reel=saved.customReels.find(item=>item.id===reelId);if(!reel)return;
  if(!hasCompleteSceneMedia(reel)){showToast('Visual analysis needs all eight real scene assets assigned first.');return;}
  saved.visionAnalysisCache ||= {};
  const pending=[];
  for(const scene of reel.scenes){const asset=scene.asset;const requirement=`${scene.role||''} · ${scene.description||''}`;const cacheKey=String(asset.id||asset.filename);if(asset.visualAnalysis?.actualVisualAnalysis){if(!asset.visualAnalysis.requirement||asset.visualAnalysis.requirement===requirement)continue;asset.visualAnalysis={...asset.visualAnalysis,assetId:scene.id,requirement,sceneMatch:null,reviewRequired:true,reviewReason:'This frame was previously analyzed for another scene requirement; visual observations were reused without re-uploading.'};continue;}const cached=saved.visionAnalysisCache[cacheKey];if(cached?.actualVisualAnalysis){asset.visualAnalysis={...cached,assetId:scene.id,requirement,sceneMatch:null,reviewRequired:true,reviewReason:'Visual observations were reused from the same local asset; scene-specific match remains unverified.'};continue;}pending.push({scene,requirement,cacheKey});}
  if(!pending.length){showToast('Selected frames already have reusable visual analysis.');return;}
  setWork('Hosted visual analysis',reel.title,`Analyzing ${pending.length} unanalyzed scene asset(s) only; videos are sampled at beginning, middle and end.`,0,'scenes analyzed');
  try{const assets=[];for(const item of pending){assets.push({assetId:item.scene.id,filename:item.scene.asset.filename,mediaType:item.scene.asset.mediaType,requirement:item.requirement,frameImages:await framesForVisualAnalysis(item.scene.asset)});}const response=await fetch('/api/vision/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assets})});const data=await parseApiJson(response);if(!response.ok)throw new Error(data.error||'Visual analysis failed.');for(const analysis of data.analyses||[]){const item=pending.find(entry=>entry.scene.id===analysis.assetId);if(!item)continue;const result={...analysis,requirement:item.requirement,reviewRequired:Number(analysis.sceneMatch??0)<.45||Number(analysis.confidence??0)<.45};item.scene.asset.visualAnalysis=result;saved.visionAnalysisCache[item.cacheKey]={...result,assetId:item.scene.asset.id||item.scene.asset.filename};}reel.visualAnalysis={status:'complete',provider:data.provider,analyzedAt:new Date().toISOString(),analyzedCount:assets.length,disclosure:data.disclosure};persist();render();renderPipeline();showToast(`Analyzed ${assets.length} selected asset(s). Review uncertain matches before approval.`);}
  catch(error){reel.visualAnalysis={status:'error',error:error.message,updatedAt:new Date().toISOString()};persist();showToast(`Visual analysis unavailable · ${error.message}`);}
  finally{setWork(null);refreshBackgroundQueue();}
}
async function submitBackgroundRender(reel,{wait=true}={}){
  const payload={topic:reel.topic,pillar:reel.pillar,title:reel.title,template:reel.template,scenes:(reel.scenes||[]).map(scene=>({filename:scene.asset?.filename,width:scene.asset?.width,height:scene.asset?.height,localUrl:scene.asset?.localUrl,mediaType:scene.asset?.mediaType,seconds:scene.seconds,trimStart:scene.trimStart,trimEnd:scene.trimEnd,text:scene.text,transition:scene.transition,motion:scene.motion||scene.cameraMovement,whyThisShot:scene.whyThisShot,storyPurpose:scene.storyPurpose,transitionReason:scene.transitionReason,nextShotRelationship:scene.nextShotRelationship,rights:{verified:hasVerifiedAsset(scene.asset),creator:scene.asset?.creator,license:scene.asset?.license,licenseUrl:scene.asset?.licenseUrl,sourceUrl:scene.asset?.pageUrl}}))};
  let job;if(reel.backgroundJobId){const existing=await fetch(`/api/worker/jobs/${encodeURIComponent(reel.backgroundJobId)}`);if(existing.ok)job=(await parseApiJson(existing)).job;}
  if(!job){const response=await fetch('/api/worker/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await parseApiJson(response);if(!response.ok||!data.queued)throw new Error(data.message||data.error||'Background queue rejected the reel.');job=data.job;reel.backgroundJobId=job.id;reel.renderMode='BACKGROUND_WORKER';persist();}
  reel.status=job.status==='READY_FOR_REVIEW'?'rendering':job.status==='FAILED'?'blocked':'rendering';advanceReelState(reel,'COLLECTING_ASSETS');advanceReelState(reel,'VALIDATING_RIGHTS');advanceReelState(reel,'EDITING');advanceReelState(reel,'RENDERING');reel.renderStartedAt=job.createdAt||new Date().toISOString();persist();render();renderPipeline();
  if(!wait)return job;
  setWork('Background FFmpeg render',reel.title,'The server owns this persisted job; the browser can close after queue submission.',job.progress||0,'render progress');
  while(!['READY_FOR_REVIEW','FAILED','CANCELLED'].includes(job.status)){
    const response=await fetch(`/api/worker/jobs/${encodeURIComponent(job.id)}`);const data=await parseApiJson(response);if(!response.ok)throw new Error(data.error||'Background job status could not be read.');job=data.job;reel.workerProgress=job.progress;reel.workerTask=job.currentTask||job.stage;persist();renderAgent();await delay(2500);
  }
  if(job.status==='READY_FOR_REVIEW'){
    advanceReelState(reel,'QC');const completedAt=new Date().toISOString();reel.status='ready';reel.renderUrl=job.outputUrl;reel.qc={...job.qc,checks:job.qc?.checks||{},ffprobe:{available:true,passed:true,message:'Background FFprobe and full-file decode test passed.'}};reel.qcCompletedAt=completedAt;reel.renderedAt=completedAt;advanceReelState(reel,'READY_FOR_REVIEW');saved.rendered[reel.id]=reel.renderUrl;persist();render();renderPipeline();showToast('Background MP4 saved and server-side QC passed.');
  }else{reel.status='blocked';reel.qc={error:job.error||job.message||'Background render did not complete.'};setReelProductionState(reel,'FAILED');persist();render();renderPipeline();throw new Error(reel.qc.error);}
  setWork(null);return true;
}
async function refreshBackgroundQueue(){
  const label=document.querySelector('#worker-queue-status'),list=document.querySelector('#worker-queue-jobs'),controls=document.querySelector('#worker-queue-controls');if(!label||!list)return;
  try{const response=await fetch('/api/worker/jobs');const data=await parseApiJson(response);if(!response.ok)throw new Error(data.error||'Worker queue unavailable.');const status=data.status||{};
    const beatSeconds=status.heartbeatAt?Math.max(0,Math.round((Date.now()-Date.parse(status.heartbeatAt))/1000)):null;const beatLabel=beatSeconds===null?'heartbeat unavailable':`last heartbeat ${beatSeconds<60?`${beatSeconds}s`:`${Math.floor(beatSeconds/60)}m`} ago`;const today=status.today||{};const schedule=status.schedule?.enabled?` · SCHEDULE ${status.schedule.windowOpen?'OPEN':`WAIT ${status.schedule.nextStartAt?new Date(status.schedule.nextStartAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):status.schedule.startTime}`}`:'';label.textContent=status.configured?`WORKER ONLINE · ${status.paused?'PAUSED':'ACTIVE'} · ${status.queued} queued · ${status.completed} ready · ${status.failed} failed · TODAY ${today.planned||0} planned / ${today.completed||0} complete / ${today.processing||0} processing / ${today.queued||0} waiting · ${beatLabel}${schedule}`:`WORKER OFFLINE · Background worker offline — browser fallback available. ${beatLabel}`;
    if(status.queueError){const warning=document.createElement('small');warning.className='worker-error';warning.textContent=status.queueError;label.appendChild(warning);}
    let reconciled=false;for(const job of data.jobs||[]){const reel=allReels().find(item=>item.backgroundJobId===job.id);if(!reel)continue;if(job.status==='READY_FOR_REVIEW'&&!hasQcPassedMaster(reel)){reel.status='ready';reel.renderUrl=job.outputUrl;reel.qc={...job.qc,checks:job.qc?.checks||{},ffprobe:{available:true,passed:true,message:'Background FFprobe and full-file decode test passed.'}};reel.qcCompletedAt=job.updatedAt;reel.renderedAt=job.updatedAt;advanceReelState(reel,'QC');advanceReelState(reel,'READY_FOR_REVIEW');saved.rendered[reel.id]=reel.renderUrl;reconciled=true;}else if(['FAILED','CANCELLED'].includes(job.status)&&reel.status!=='blocked'){reel.status='blocked';reel.qc={error:job.error||job.message||`Background job ${job.status.toLowerCase()}.`};setReelProductionState(reel,'FAILED');reconciled=true;}}
    if(reconciled){persist();render();renderPipeline();}
    const controlJob=(data.jobs||[])[0];if(controls)controls.innerHTML=controlJob?`<button type="button" data-queue-action="${status.paused?'resume':'pause'}" data-job-id="${escapeHtml(controlJob.id)}">${status.paused?'Resume queue':'Pause queue'}</button>`:'';
    controls?.querySelector('[data-queue-action]')?.addEventListener('click',async event=>{const button=event.currentTarget;const result=await fetch(`/api/worker/jobs/${encodeURIComponent(button.dataset.jobId)}/actions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:button.dataset.queueAction})});const body=await parseApiJson(result);if(!result.ok)showToast(body.error||'Could not update queue.');await refreshBackgroundQueue();});
    list.innerHTML=(data.jobs||[]).slice(0,8).map(job=>`<article class="worker-job"><div><strong>${escapeHtml(job.title||job.topic)}</strong><small>${escapeHtml(job.pillar||'REEL')} · ${escapeHtml(job.stage||job.status)} · ${Number(job.progress)||0}% · ${escapeHtml(job.message||'')}</small>${job.error?`<small class="worker-error">${escapeHtml(job.error)}</small>`:''}</div><div>${job.status==='READY_FOR_REVIEW'?`<a href="${escapeHtml(job.outputUrl)}?download=1" download>Download MP4</a>`:''}${['QUEUED','RENDERING','RETRYING','QC'].includes(job.status)?`<button type="button" data-worker-action="cancel" data-job-id="${escapeHtml(job.id)}">Cancel</button>`:''}${['FAILED','CANCELLED'].includes(job.status)?`<button type="button" data-worker-action="retry" data-job-id="${escapeHtml(job.id)}">Retry</button>`:''}</div></article>`).join('')||'<p class="worker-empty">No background render jobs have been queued.</p>';
    list.querySelectorAll('[data-worker-action]').forEach(button=>button.addEventListener('click',async()=>{const action=button.dataset.workerAction;if(action==='cancel'&&!confirm('Cancel this background render job?'))return;const result=await fetch(`/api/worker/jobs/${encodeURIComponent(button.dataset.jobId)}/actions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const body=await parseApiJson(result);if(!result.ok)showToast(body.error||'Could not update worker job.');await refreshBackgroundQueue();}));
  }catch(error){label.textContent=`WORKER OFFLINE · ${error.message}`;list.innerHTML='<p class="worker-empty">Start the local studio server to inspect its background queue.</p>';}
}
async function autoSourceStoryboard(reelId){
  if(automaticAssetSearchInProgress)return;
  const reels=allReels(),planner=window.FOBProductionPlanning;if(!reels.length||!planner)return;
  const missing=[],usedIds=new Set();for(const reel of reels)for(const[index,scene]of(reel.scenes||[]).entries()){if(!hasVerifiedAsset(scene.asset)){missing.push({reel,scene,index});continue;}const keys=planner.assetIdentityKeys(scene.asset);if(!keys.length||keys.some(key=>usedIds.has(key))){missing.push({reel,scene,index});continue;}keys.forEach(key=>usedIds.add(key));}
  if(!missing.length){showToast('All 32 story scenes already have verified, unique media.');return;}
  automaticAssetSearchInProgress=true;document.querySelectorAll('[data-auto-media]').forEach(button=>button.disabled=true);
  const startedAt=new Date().toISOString(),failures=[];let importedCount=0,poolResult={queries:[],assets:[],failures:[],diagnostics:[]};
  for(const reel of reels)advanceReelState(reel,'COLLECTING_ASSETS');
  saved.currentRun.assetSearch={...(saved.currentRun.assetSearch||{}),status:'running',startedAt,message:`Building one global Wikimedia Commons candidate pool for all four storyboards (${missing.length} scenes remain).`,operations:{reelId,pillar:'All four pillars',total:32,completed:32-missing.length,assigned:0,failed:0,currentScene:'Searching broad topic, place, people, culture and landmark queries.'}};persist();renderPipeline();
  try{
    setWork('Global Wikimedia candidate research',saved.currentRun.topic,`Searching ${globalAssetQueries(saved.currentRun.topic).length} broad queries in parallel; photos and videos both qualify.`,5,'Commons queries');
    poolResult=await collectGlobalAssetPool(saved.currentRun.topic);
    const productionPool=poolResult.assets.filter(asset=>asset.metadataComplete&&asset.creator&&asset.license&&asset.licenseUrl&&asset.pageUrl&&asset.mediaUrl&&asset.width>=640&&asset.height>=360);
    assetSearchResults=poolResult.assets;assetSearchResultCount=productionPool.length;renderAssetResults();
    const excluded=new Set(),pending=missing.slice();let attempts=0;
    while(pending.length&&attempts<poolResult.assets.length){
      const available=productionPool.filter(asset=>!planner.assetIdentityKeys(asset).some(key=>excluded.has(key))&&!planner.assetIdentityKeys(asset).some(key=>usedIds.has(key)));
      if(!available.length)break;
      const pairs=planner.assignAssetsToScenes(pending.map(({scene,reel})=>({...scene,topic:reel.topic})),available,{topic:saved.currentRun.topic}).filter(pair=>pair.asset);
      if(!pairs.length)break;
      const next=pairs.slice().sort((a,b)=>b.score-a.score)[0],record=pending.find(item=>item.scene===next.scene||item.scene.id===next.scene.id);if(!record){failures.push('Assignment repair could not map an optimized scene back to its storyboard.');break;}
      const candidate={...next.asset,matchScore:next.score};const candidateKeys=planner.assetIdentityKeys(candidate);attempts++;setWork('Rights verification and real media import',saved.currentRun.topic,`${record.reel.pillar} · scene ${record.index+1}/8 · downloading ${candidate.mediaType} “${candidate.title}” and decoding actual bytes.`,Math.round(importedCount/Math.max(1,missing.length)*100),'assets imported');
      try{
        let importedAsset;if(localStudioMode()){const importResponse=await fetchWithRetry('/api/assets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(candidate)});if(importResponse.ok)importedAsset=(await parseApiJson(importResponse)).asset;else{let detail={};try{detail=await parseApiJson(importResponse);}catch(error){detail={error:error.message};}if(![413,501,503].includes(importResponse.status))throw new Error(detail.error||`Local import returned HTTP ${importResponse.status}.`);importedAsset=await window.FOBAssetImport.importAsset(candidate);}}else importedAsset=await window.FOBAssetImport.importAsset(candidate);
        record.scene.asset={...importedAsset,commonsPageId:candidate.commonsPageId||candidate.id,importedAt:new Date().toISOString(),matching:{score:next.score,method:'global maximum-weight assignment',topic:saved.currentRun.topic,discoveryQueries:candidate.discoveryQueries||[],criteria:['global topic relevance','scene keyword relevance','available visual analysis','photo/video preference with photo fallback','shot orientation','usable resolution','rights metadata','unique Commons page/media identity']}};
        candidateKeys.forEach(key=>usedIds.add(key));planner.assetIdentityKeys(record.scene.asset).forEach(key=>usedIds.add(key));pending.splice(pending.indexOf(record),1);importedCount++;saved.currentRun.assetSearch.operations.assigned=importedCount;saved.currentRun.assetSearch.operations.completed=32-pending.length;const counts=reelAssetCounts(reels);saved.currentRun.assetSearch.operations.currentScene=`Moment ${counts['The Moment']}/8 · Detail ${counts['The Detail']}/8 · Energy ${counts['The Energy']}/8 · Meaning ${counts['The Meaning']}/8`;persist();render();renderPipeline();
      }catch(error){candidateKeys.forEach(key=>excluded.add(key));failures.push(`${candidate.title}: ${error.message}`);}
    }
    const counts=reelAssetCounts(reels),total=batchUniqueAssetCount(reels),complete=total===32&&reels.every(hasCompleteSceneMedia);for(const reel of reels)if(hasCompleteSceneMedia(reel))advanceReelState(reel,'VALIDATING_RIGHTS');
    const diagnostics=poolResult.diagnostics.reduce((sum,row)=>({raw:sum.raw+(row.raw||0),downloadable:sum.downloadable+(row.downloadable||0),rightsComplete:sum.rightsComplete+(row.rightsComplete||0)}),{raw:0,downloadable:0,rightsComplete:0});
    const completedAt=new Date().toISOString(),queryErrors=poolResult.failures.length?` Search errors: ${poolResult.failures.join(' | ')}`:'',importErrors=failures.length?` Import errors: ${failures.slice(0,8).join(' | ')}`:'';
    const message=`Global Commons pool · ${poolResult.queries.length} queries · ${diagnostics.raw} raw results · ${poolResult.assets.length} unique downloadable candidates · ${productionPool.length} rights-complete candidates · ${diagnostics.rightsComplete} verified query records. Moment ${counts['The Moment']}/8 · Detail ${counts['The Detail']}/8 · Energy ${counts['The Energy']}/8 · Meaning ${counts['The Meaning']}/8 · TOTAL ${total}/32.${complete?' All storyboards are ready for edit.':` Only ${productionPool.filter(asset=>!planner.assetIdentityKeys(asset).some(key=>usedIds.has(key))).length} unused pool candidates remain.`}${queryErrors}${importErrors}`;
    saved.currentRun.assetSearch={...saved.currentRun.assetSearch,status:complete?'ready':total?'partial':'error',completedAt,resultCount:poolResult.assets.length,verifiedCount:productionPool.length,diagnostics,message,operations:{...saved.currentRun.assetSearch.operations,currentScene:message,completed:32,assigned:total,failed:failures.length}};persist();render();renderPipeline();renderAssetResults();document.querySelector('#asset-status').textContent=message;showToast(complete?'32/32 unique verified scene assets assigned.':`${total}/32 scene assets assigned; remaining scenes need more rights-complete Commons files.`);
  }finally{automaticAssetSearchInProgress=false;setWork(null);render();renderPipeline();}
}
async function performAssetSearch(event) {
  if(event)event.preventDefault();
  const query=document.querySelector('#asset-query').value.trim();if(!query)return;
  const button=document.querySelector('#asset-search-button'),status=document.querySelector('#asset-status'),results=document.querySelector('#asset-results');const assetStartedAt=new Date().toISOString();
  button.disabled=true;button.textContent='Searching…';status.textContent='Searching Wikimedia Commons for real photos and video; reading file-page attribution metadata…';results.innerHTML='';
  setWork('Commons asset search',query,'Requesting live photo/video results and rights fields from Wikimedia Commons.');
  try{
    const response=await fetch(`/api/commons-search?q=${encodeURIComponent(query)}&kind=${encodeURIComponent(document.querySelector('#asset-kind').value)}`);const data=await parseApiJson(response);
    if(!response.ok)throw new Error(data.error||'Commons search failed.');
    assetSearchResults=data.results||[];assetSearchResultCount=assetSearchResults.length;
    renderAssetResults();
    const d=data.diagnostics||{};const report=`HTTP ${d.httpStatus||response.status} · raw ${d.raw??assetSearchResultCount} · supported MIME ${d.supportedMime??0} · creator ${d.creator??0} · reusable licence ${d.license??0} · rights-complete ${d.rightsComplete??0} · downloadable ${d.downloadable??0} · accepted ${assetSearchResultCount}.`;
    status.textContent=assetSearchResults.length?`${report} Asset import verifies the real media decode.`:`${report} No assets passed recorded rights and download checks.`;
    if(saved.currentRun){saved.currentRun.assetSearch={...(saved.currentRun.assetSearch||{}),status:assetSearchResultCount?'ready':'error',startedAt:assetStartedAt,completedAt:new Date().toISOString(),resultCount:assetSearchResultCount,diagnostics:d,message:report};persist();renderPipeline();}
  }catch(error){assetSearchResults=[];assetSearchResultCount=0;status.textContent=`Commons unavailable · 0 verified Commons assets found · ${error.message} Use Retry Search or add local media.`;renderAssetResults();if(saved.currentRun){saved.currentRun.assetSearch={status:'error',startedAt:assetStartedAt,completedAt:new Date().toISOString(),resultCount:0,message:`Commons unavailable · 0 verified assets found · ${error.message}`};persist();renderPipeline();}}
  finally{button.disabled=false;button.textContent='Search Commons';setWork(null);}
}

function renderAssetResults(){
  const target=document.querySelector('#asset-target').value;
  const library=[...saved.userAssets,...assetSearchResults];
  document.querySelector('#asset-results').innerHTML=library.map((asset,index)=>{
    const rights=asset.metadataComplete?`<strong class="rights-recorded">Recorded licence</strong> ${escapeHtml(asset.license)} · ${escapeHtml(String(asset.creator||''))}`:`<strong class="rights-missing">Rights: Unverified</strong> · ${escapeHtml((asset.rejectReasons||[]).join('; ')||'Creator, licence, licence URL or Commons file page is missing.')}`;
    const reused=assetAlreadyAssigned(asset);
    const mediaUrl=asset.localUrl||asset.previewUrl;const sourceLink=asset.source==='User Upload'?'User-supplied local file':asset.pageUrl?`<a href="${escapeHtml(String(asset.pageUrl))}" target="_blank" rel="noopener noreferrer">Source page ↗</a>`:'Commons file page unavailable';const canImport=Boolean(asset.metadataComplete&&asset.creator&&asset.license&&asset.licenseUrl&&asset.pageUrl);
    return `<article class="asset-card"><div class="asset-preview">${asset.mediaType==='video'?`<video src="${escapeHtml(String(mediaUrl||''))}" controls preload="metadata" playsinline></video>`:`<img src="${escapeHtml(String(mediaUrl||''))}" alt="Real media: ${escapeHtml(String(asset.title||'Untitled Commons file'))}" loading="lazy">`}<span>${asset.mediaType==='video'?'VIDEO':'PHOTO'} · ${asset.width}×${asset.height}${asset.durationSeconds?` · ${Number(asset.durationSeconds).toFixed(1)}s`:''}</span></div><div class="asset-info"><h3>${escapeHtml(String(asset.title||'Untitled Commons file'))}</h3><p>${rights}</p><p class="asset-origin">${escapeHtml(String(asset.source||'Wikimedia Commons'))} · Creator: ${escapeHtml(String(asset.creator||'Not recorded'))} · Added: ${escapeHtml(new Date(asset.retrievedAt||asset.importedAt||Date.now()).toLocaleDateString())} · ${sourceLink}${asset.licenseUrl?` · <a href="${escapeHtml(String(asset.licenseUrl))}" target="_blank" rel="noopener noreferrer">Licence terms ↗</a>`:''}</p><button class="review-button asset-add" data-add-asset="${index}" ${!target||reused||!canImport?'disabled':''}>${reused?'Already in a storyboard':!canImport?'Rights unverified':target?'Assign to selected storyboard':'Select a storyboard above'}</button></div></article>`;
  }).join('')||'';
  document.querySelectorAll('[data-add-asset]').forEach(button=>button.addEventListener('click',()=>importAndAssignAsset(library[Number(button.dataset.addAsset)])));
}

async function inspectUploadedMedia(file){
  const url=URL.createObjectURL(file);try{
    if(file.type.startsWith('image/')){const image=new Image();image.src=url;await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('The image file could not be decoded.'));});return{width:image.naturalWidth,height:image.naturalHeight,durationSeconds:null,mediaType:'photo'};}
    const video=document.createElement('video');video.preload='metadata';video.muted=true;video.src=url;await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('The video file metadata could not be read in this browser.'));});if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('The video has no readable duration.');return{width:video.videoWidth,height:video.videoHeight,durationSeconds:video.duration,mediaType:'video'};
  }finally{URL.revokeObjectURL(url);}
}
async function uploadLocalMedia(event){
  event.preventDefault();const file=document.querySelector('#local-media-file').files[0];if(!file)return;const button=document.querySelector('#local-upload-button'),status=document.querySelector('#asset-status');
  if(!document.querySelector('#local-rights-confirm').checked){showToast('Confirm the media usage rights before adding this file.');return;}
  button.disabled=true;button.textContent='Reading media…';status.textContent='Reading actual file dimensions and video duration…';setWork('Inspecting user-provided media',file.name,'Decoding the selected local file and recording verified media metadata.');
  try{
    if(file.size>100*1024*1024)throw new Error('Media files are limited to 100 MB.');const info=await inspectUploadedMedia(file);if(!info.width||!info.height)throw new Error('Could not read media dimensions.');
    const details={filename:file.name,mediaType:info.mediaType,mime:file.type,width:info.width,height:info.height,durationSeconds:info.durationSeconds,rightsConfirmed:true};const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(details))));
    setWork('Saving user-provided media',file.name,'Uploading one confirmed local media file to the studio asset library.');const response=await fetch('/api/assets/upload',{method:'POST',headers:{'Content-Type':file.type,'X-Asset-Metadata':encoded},body:file});let data;if(response.ok)data=await parseApiJson(response);else if([404,405,501].includes(response.status)){data={asset:await window.FOBAssetImport.saveUserAsset(file,details)};}else{const body=await parseApiJson(response);throw new Error(body.error||`The local media file could not be saved.`);}
    saved.userAssets.unshift(data.asset);persist();renderAssetResults();status.textContent=`Local media added: ${data.asset.mediaType} · ${data.asset.width}×${data.asset.height}${data.asset.durationSeconds?` · ${Number(data.asset.durationSeconds).toFixed(1)}s`:''} · rights confirmation recorded.`;showToast('Real local media added with file and rights metadata.');
  }catch(error){status.textContent=`Local upload failed: ${error.message}`;showToast(`Upload failed: ${error.message}`);}
  finally{button.disabled=false;button.textContent='Add local media';setWork(null);}
}

function buildPostCaption(reel){
  const marker='\n\nMedia credits:';const existing=String(reel.caption||'');
  const base=(existing.split(marker)[0]||`${reel.topic} — ${reel.pillar}.\nFollow Festival of Bharat for more stories across India.`).trim();
  const credits=[...new Map((reel.scenes||[]).map(scene=>scene.asset).filter(Boolean).map(asset=>[asset.id,asset])).values()]
    .map(asset=>`${asset.creator||'Creator not recorded'} · ${asset.license||'Licence not recorded'} · ${asset.pageUrl||'Source page not recorded'}`);
  return credits.length?`${base}${marker}\n${credits.join('\n')}`:base;
}

async function importAndAssignAsset(asset){
  const reelId=document.querySelector('#asset-target').value;const reel=saved.customReels.find(r=>r.id===reelId);if(!asset||!reel)return;
  const replacement=saved.assetTarget?.reelId===reelId?saved.assetTarget.sceneId:null;
  const slot=replacement?reel.scenes.find(scene=>scene.id===replacement):reel.scenes.find(scene=>!scene.asset);
  if(!slot){showToast('All eight shots already have media. Choose Replace in the editor first.');return;}
  if(assetAlreadyAssigned(asset,{reelId,sceneId:slot.id})){showToast('Choose a different source file for each scene and reel.');return;}
  setWork('Importing selected media',asset.title,asset.source==='User Upload'?'Assigning the already saved local file with its user-confirmed rights record.':'Downloading the selected Wikimedia file into the local project with its source and licence record.');
  try{
    let selected=asset;if(asset.source!=='User Upload'){if(localStudioMode()){const response=await fetch('/api/assets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(asset)});if(response.ok){selected=(await parseApiJson(response)).asset;}else{let detail={};try{detail=await parseApiJson(response);}catch{}if(![413,501,503].includes(response.status))throw new Error(detail.error||`Asset import returned HTTP ${response.status}.`);selected=await window.FOBAssetImport.importAsset(asset);}}else selected=await window.FOBAssetImport.importAsset(asset);}
    slot.asset={...selected,importedAt:new Date().toISOString()};saved.assetTarget=null;reel.status='waiting-for-media';reel.renderUrl=null;reel.qc=null;if(saved.currentRun)saved.currentRun.assetSearch={...(saved.currentRun.assetSearch||{}),status:'ready',importedAt:new Date().toISOString(),message:'Selected media file assigned with its source and rights record.'};persist();render();renderAssetResults();renderPipeline();showToast(`Assigned ${asset.mediaType} with source record.`);
  }catch(error){const message=error.message||'unknown import error';const isAssetFailure=asset.source!=='User Upload';showToast(isAssetFailure?`ASSET_COLLECTION_FAILED · Real asset download failed — ${message}; no fake asset substituted.`:`Import failed: ${message}`);const status=document.querySelector('#asset-status');if(status&&isAssetFailure)status.textContent=`ASSET_COLLECTION_FAILED · Real asset download failed — ${message}; no fake asset substituted.`;}
  finally{setWork(null);}
}

function renderTrendResults(data,query){
  const results=document.querySelector('#live-results');
  if(!data.results?.length){results.innerHTML='';return;}
  document.querySelector('#live-status').textContent=`${data.results.length} public YouTube Shorts references above 100K views · current YouTube Data API counts · visual patterns require inspection.`;
  const ranked=data.results.slice().sort((a,b)=>referenceRank(b,query)-referenceRank(a,query));
  results.innerHTML=ranked.map(v=>`<article class="trend-result"><div class="result-media"><img src="${escapeHtml(v.thumbnail)}" alt="Reference thumbnail: ${escapeHtml(v.title)}"><button class="result-play" data-play-video="${escapeHtml(v.id)}">▶ Watch original</button></div><div class="result-meta"><span class="result-views">${formatViews(v.views)} API views</span><span>${v.durationSeconds}s</span></div><p class="research-only-label">YOUTUBE SHORTS · RESEARCH ONLY</p><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml(v.channel)} · Published ${new Date(v.publishedAt).toLocaleDateString()} · Retrieved ${new Date(v.retrievedAt||Date.now()).toLocaleDateString()} · Source: YouTube Data API</p>${patternSummary(v.id)}<div class="result-actions"><a href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a><button data-analyze-ref="${escapeHtml(v.id)}">Record pattern</button></div></article>`).join('');
  results.querySelectorAll('[data-play-video]').forEach(play=>play.addEventListener('click',()=>{const shell=play.closest('.result-media');shell.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(play.dataset.playVideo)}?autoplay=1&playsinline=1" title="Public trend reference" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;}));
  results.querySelectorAll('[data-analyze-ref]').forEach(button=>button.addEventListener('click',()=>openPatternEditor(button.dataset.analyzeRef)));
  if(saved.currentRun){saved.currentRun.research.results=data.results;saved.currentRun.research.status='ready';saved.currentRun.research.message=`${data.results.length} actual public references above 100K views · ${data.checked||0} candidates checked.`;persist();renderPipeline();}
}

function renderInstagramDiscovery(topic=document.querySelector('#production-topic')?.value||document.querySelector('#trend-query')?.value||'Indian festivals'){
  const queries=expandedTopicQueries(topic);const seed=INSTAGRAM_SEEDS[instagramSeedGroup(topic)]||INSTAGRAM_SEEDS.heritage;
  const chips=document.querySelector('#research-query-chips');if(chips){chips.innerHTML=queries.slice(0,12).map(query=>`<a class="research-query-chip" target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com/reel ${query}`)}">${escapeHtml(query)} ↗</a>`).join('');chips.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>recordResearchSource('Google Search · topic-specific Instagram Reel query (opened by user)')));}
  const accounts=document.querySelector('#seed-account-list');if(accounts){accounts.innerHTML=seed.map(username=>`<a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/${encodeURIComponent(username)}/">@${escapeHtml(username)}</a>`).join('');accounts.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>recordResearchSource('Instagram seed profile (opened by user)')));}
  const search=document.querySelector('#open-instagram-search');if(search)search.onclick=()=>{const query=queries.slice(0,6).map(value=>`"${value}"`).join(' OR ');window.open(`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com/reel (${query})`)}`,'_blank','noopener,noreferrer');recordResearchSource('Google Search · Instagram public Reel discovery (opened by user)');};
  const discoveryStatus=document.querySelector('#instagram-discovery-status');if(discoveryStatus)discoveryStatus.textContent=saved.currentRun?.research?.instagramDiscoveryMessage||'Optional Google Custom Search is not configured. Use the public topic links below.';
  renderResearchDashboard();
}

function recordResearchSource(source){const run=saved.currentRun;if(!run)return;run.research.sourcesChecked=[...new Set([...(run.research.sourcesChecked||[]),source])];run.research.completedAt=new Date().toISOString();persist();renderResearchDashboard();renderTeam();}

function renderInstagramSearchResults(){
  const node=document.querySelector('#instagram-discovery-results');if(!node)return;const results=saved.currentRun?.research?.instagramDiscoveryResults||[];
  node.innerHTML=results.map(ref=>`<article class="instagram-discovery-card"><div class="instagram-ref-top"><span class="research-only-label">GOOGLE INDEX · INSTAGRAM RESEARCH ONLY</span><b>PUBLIC METRIC UNAVAILABLE</b></div><h4>${escapeHtml(ref.title)}</h4><p>Creator ${ref.creator?`@${escapeHtml(ref.creator)}`:'not identified from indexed result'} · Topic ${escapeHtml(ref.topic)} · Views unavailable · Duration unavailable</p><p>${escapeHtml(ref.snippet||'No public snippet returned')} · Retrieved ${new Date(ref.retrievedAt).toLocaleString()} · Confidence: ${escapeHtml(ref.confidence)}</p><div class="result-actions"><a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">Inspect original Instagram source ↗</a><button type="button" data-record-discovered="${escapeHtml(ref.id)}">Record after inspection</button></div></article>`).join('')||'';
  node.querySelectorAll('[data-record-discovered]').forEach(button=>button.addEventListener('click',()=>{const ref=results.find(item=>item.id===button.dataset.recordDiscovered);if(!ref)return;const form=document.querySelector('#instagram-reference-form');form.elements.creator.value=ref.creator||'';form.elements.url.value=ref.url;form.elements.title.value=ref.title;form.elements.publishedAt.value=ref.publishedAt?String(ref.publishedAt).slice(0,10):'';form.elements.durationSeconds.value='';form.elements.views.value='';form.elements.likes.value='';form.elements.comments.value='';form.elements.viewsObserved.checked=false;form.scrollIntoView({behavior:'smooth',block:'center'});showToast('Inspect the original, then confirm its visible details in the form.');}));
}

function renderResearchDashboard(){
  const node=document.querySelector('#research-dashboard');if(!node)return;const research=saved.currentRun?.research||{};const youtube=research.results||[];const discovered=research.instagramDiscoveryResults||[];const instagram=research.instagramReferences||[];const ytHundred=youtube.filter(ref=>ref.views>=100000);const ytMillion=youtube.filter(ref=>ref.views>=1000000);const observedHundred=instagram.filter(ref=>ref.viewsObserved&&Number(ref.views)>=100000);const observedMillion=observedHundred.filter(ref=>Number(ref.views)>=1000000);const verifiedMax=Math.max(0,...youtube.map(ref=>Number(ref.views)||0));const observedMax=Math.max(0,...observedHundred.map(ref=>Number(ref.views)||0));const uniqueRefs=new Set([...youtube,...discovered,...instagram].map(ref=>ref.url||ref.id)).size;const pattern=saved.currentRun?.patternAnalysis;const patternLabel=pattern?.observations?.length?`${pattern.observations.length} patterns recorded`:(pattern?.status||'Not started');
  node.innerHTML=`<div><span>Topic</span><strong>${escapeHtml(saved.currentRun?.topic||'Enter a topic')}</strong></div><div><span>References found</span><strong>${uniqueRefs}</strong><small>${youtube.length} API · ${discovered.length} indexed Instagram · ${instagram.length} inspected</small></div><div><span>100K+</span><strong>${ytHundred.length} API</strong><small>${observedHundred.length} user-observed · not verified</small></div><div><span>1M+</span><strong>${ytMillion.length} API</strong><small>${observedMillion.length} user-observed · not verified</small></div><div><span>Highest API-verified views</span><strong>${verifiedMax?formatViews(verifiedMax):'Unavailable'}</strong><small>Highest user-observed Instagram: ${observedMax?formatViews(observedMax):'Unavailable'}</small></div><div><span>Pattern analysis</span><strong>${escapeHtml(patternLabel)}</strong><small>Last research ${research.completedAt?new Date(research.completedAt).toLocaleString():'not run'}</small></div><div><span>Sources checked</span><strong>${escapeHtml((research.sourcesChecked||[]).join(' · ')||'None opened yet · public discovery links are ready')}</strong><small>Available: ${escapeHtml((research.sourcesAvailable||['Instagram public web discovery links · manual inspection','Google Custom Search API · optional','YouTube Data API · optional']).join(' · '))}</small></div>`;
}

function referenceRank(ref,topic){const text=`${ref.title||''} ${ref.topic||''} ${ref.creator||ref.channel||''}`.toLowerCase();const terms=expandedTopicQueries(topic).map(value=>value.toLowerCase());const relevance=terms.reduce((sum,term)=>sum+(text.includes(term)?1:0),0);const metric=ref.metricSource==='YouTube Data API'?Math.log10(Math.max(1,Number(ref.views)||1))*0.08:ref.viewsObserved?Math.log10(Math.max(1,Number(ref.views)||1))*0.025:0;const engagement=ref.engagementObserved?Math.log10(Math.max(1,(Number(ref.likes)||0)+(Number(ref.comments)||0)))*0.01:0;const date=new Date(ref.publishedAt||ref.retrievedAt||0).getTime();const recency=Number.isFinite(date)?Math.max(0,1-(Date.now()-date)/(365*86400000)):0;const india=/(india|indian|bharat|temple|festival|heritage|culture)/i.test(text)?0.15:0;const observations=saved.currentRun?.patternAnalysis?.observations?.some(note=>note.referenceId===ref.id)?0.1:0;return relevance*0.4+metric+engagement+recency*0.2+india+observations;}
function patternSummary(referenceId){const note=saved.currentRun?.patternAnalysis?.observations?.find(item=>item.referenceId===referenceId);if(!note)return'';return`<div class="pattern-summary"><strong>OBSERVED PATTERN · INSPIRATION ONLY</strong>${[['Hook',note.hook],['Opening visual',note.openingVisual],['Duration / shot count',note.durationShots||note.duration],['Pacing',note.pacing],['Visual language',note.visualLanguage],['Story',note.scenes],['Text',note.textStyle],['Transitions',note.transitions],['Emotion / curiosity',note.emotion],['Visual payoff',note.visualPattern],['CTA',note.cta]].filter(([,value])=>value).map(([label,value])=>`<p><b>${label}:</b> ${escapeHtml(value)}</p>`).join('')}</div>`;}

function renderInstagramReferences(){
  const node=document.querySelector('#instagram-reference-list');if(!node)return;const refs=saved.currentRun?.research?.instagramReferences||[];
  const ranked=refs.slice().sort((a,b)=>referenceRank(b,saved.currentRun?.topic||'')-referenceRank(a,saved.currentRun?.topic||''));
  node.innerHTML=ranked.map(ref=>{const metric=ref.viewsObserved?`${formatViews(Number(ref.views))} views · USER OBSERVED · NOT API VERIFIED`:'Public metric unavailable';const status=ref.viewsObserved?Number(ref.views)>=100000?'100K+ USER OBSERVED':'BELOW 100K · USER OBSERVED':'METRIC UNAVAILABLE';const engagement=[ref.likes?`${formatViews(ref.likes)} likes`:null,ref.comments?`${formatViews(ref.comments)} comments`:null].filter(Boolean).join(' · ');return`<article class="instagram-reference-card"><div class="instagram-ref-top"><span class="research-only-label">INSTAGRAM · RESEARCH ONLY</span><b>${escapeHtml(status)}</b></div><h4>${escapeHtml(ref.title)}</h4><p>@${escapeHtml(ref.creator.replace(/^@/,''))} · ${escapeHtml(ref.topic)} · ${metric}${engagement?` · ${engagement} · user-observed`:''}</p><p>Published ${ref.publishedAt||'date unavailable'} · ${ref.durationSeconds?`${ref.durationSeconds}s · `:''}Source: Instagram public Reel · Retrieved ${new Date(ref.retrievedAt).toLocaleString()} · Confidence: ${escapeHtml(ref.confidence)}</p>${patternSummary(ref.id)}<div class="result-actions"><a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">Open original source ↗</a><button type="button" data-analyze-instagram="${escapeHtml(ref.id)}">Record pattern</button></div></article>`;}).join('')||'<p class="empty-state">No Instagram reference has been recorded for this run. Search public results above, inspect the original on Instagram, then record its URL and any visible metrics.</p>';
  node.querySelectorAll('[data-analyze-instagram]').forEach(button=>button.addEventListener('click',()=>openPatternEditor(button.dataset.analyzeInstagram)));
  renderResearchDashboard();
}

function saveInstagramReference(event){
  event.preventDefault();const run=saved.currentRun;if(!run){showToast('Start a topic research run before recording references.');return;}const form=event.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
  let url;try{url=new URL(data.url);}catch{showToast('Enter a valid public Instagram Reel URL.');return;}if(!['instagram.com','www.instagram.com'].includes(url.hostname)||!/^\/(reel|p|tv)\//.test(url.pathname)){showToast('Use a public Instagram Reel, post, or video URL.');return;}
  const views=String(data.views||'').trim(),likes=String(data.likes||'').trim(),comments=String(data.comments||'').trim();const metricsObserved=form.elements.viewsObserved.checked;const metrics=[views,likes,comments].filter(Boolean);if(metrics.length&&(!metricsObserved||metrics.some(value=>!Number.isSafeInteger(Number(value))||Number(value)<0))){showToast('Confirm that you personally saw each entered count, or clear the metric fields.');return;}
  const ref={id:crypto.randomUUID(),creator:data.creator.trim().replace(/^@/,''),title:data.title.trim(),topic:run.topic,url:url.href,views:views?Number(views):null,likes:likes?Number(likes):null,comments:comments?Number(comments):null,viewsObserved:Boolean(views&&metricsObserved),engagementObserved:Boolean((likes||comments)&&metricsObserved),metricSource:metrics.length?'user-observed-public-page':null,publishedAt:data.publishedAt||null,durationSeconds:data.durationSeconds?Number(data.durationSeconds):null,source:'Instagram public Reel',retrievedAt:new Date().toISOString(),confidence:metrics.length?'User observed; not API verified':'Public URL saved; metric unavailable'};
  run.research.instagramReferences||=[];const existing=run.research.instagramReferences.findIndex(item=>item.url===ref.url);if(existing>=0)run.research.instagramReferences[existing]=ref;else run.research.instagramReferences.unshift(ref);
  run.research.sourcesChecked=[...new Set([...(run.research.sourcesChecked||[]),'Instagram public Reel · user-recorded'])];run.research.message=`${run.research.results?.length||0} API references and ${run.research.instagramReferences.length} user-recorded Instagram public references. Instagram competitor metrics are not API-verified.`;run.research.completedAt=new Date().toISOString();
  form.reset();persist();renderInstagramReferences();renderPipeline();renderTeam();showToast('Research-only Instagram reference saved. Nothing was downloaded or copied.');
}

function openPatternEditor(referenceId){
  const run=saved.currentRun;const ref=run?.research?.results?.find(item=>item.id===referenceId)||run?.research?.instagramReferences?.find(item=>item.id===referenceId);if(!ref)return;
  run.patternAnalysis.selectedRefId=ref.id;
  const existing=(run.patternAnalysis.observations||[]).find(item=>item.referenceId===ref.id);
  const instagram=ref.source==='Instagram public Reel';const metric=ref.viewsObserved?`${formatViews(Number(ref.views))} user-observed views · not API verified`:`${ref.views?`${formatViews(ref.views)} API views`:'Public metric unavailable'}${ref.durationSeconds?` · ${ref.durationSeconds}s`:''}`;
  document.querySelector('#pattern-reference').innerHTML=`<strong>${escapeHtml(ref.title)}</strong><br>@${escapeHtml(ref.creator||ref.channel||'')} · ${metric}<br><a target="_blank" rel="noopener noreferrer" href="${escapeHtml(ref.url)}">Open original ${instagram?'Instagram':'YouTube'} source ↗</a><br>Record broad structures only. Do not copy exact words, shots, edits, audio, or branding.`;
  const form=document.querySelector('#pattern-form');
  for(const name of ['hook','openingVisual','durationShots','pacing','visualLanguage','scenes','textStyle','transitions','emotion','visualPattern','cta'])form.elements[name].value=existing?.[name]||'';
  document.querySelector('#pattern-editor').hidden=false;document.querySelector('#pattern-editor').scrollIntoView({behavior:'smooth',block:'center'});
}

function savePatternAnalysis(event){
  event.preventDefault();const run=saved.currentRun;const id=run?.patternAnalysis?.selectedRefId;const ref=run?.research?.results?.find(item=>item.id===id)||run?.research?.instagramReferences?.find(item=>item.id===id);if(!ref)return;
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  const record={referenceId:ref.id,referenceTitle:ref.title,creator:ref.creator||ref.channel||'',source:ref.source||'YouTube Shorts',metricSource:ref.metricSource||'YouTube Data API',views:ref.views,viewsObserved:Boolean(ref.viewsObserved),duration:ref.durationSeconds,url:ref.url,...values,savedAt:new Date().toISOString()};
  run.patternAnalysis.mode=record.metricSource==='user-observed-public-page'?'USER_PROVIDED_REFERENCES':'VERIFIED_RESEARCH';run.patternAnalysis.observations||=[];const index=run.patternAnalysis.observations.findIndex(item=>item.referenceId===ref.id);
  if(index>=0)run.patternAnalysis.observations[index]=record;else run.patternAnalysis.observations.push(record);
  run.patternAnalysis.status='ready';run.patternAnalysis.startedAt||=record.savedAt;run.patternAnalysis.completedAt=record.savedAt;run.patternAnalysis.message=`${run.patternAnalysis.observations.length} reference pattern(s) manually observed and recorded.`;
  persist();renderPipeline();renderTeam();renderResearchDashboard();renderTrendResults({results:run.research.results||[],checked:run.research.checked||0},run.topic);renderInstagramReferences();syncConceptActions();document.querySelector('#pattern-reference').insertAdjacentHTML('beforeend','<p class="rights-recorded">Observation saved to this production run.</p>');showToast('Pattern notes saved. Use them only as originality-safe inspiration.');
}

function openReel(id) {
  const original = saved.customReels.find(x => x.id === id);
  const r = { ...original, ...(saved.edits[id] || {}) };
  if(!r)return;
  const reelScenes=Array.isArray(r.scenes)?r.scenes:[];
  const motionOptions=['slow push','pan left','pan right','vertical rise','static cinematic frame','parallax crop'];
  const transitionOptions=['crossfade','hard cut','match cut','masked reveal','whip cut'];
  const sceneMarkup=reelScenes.map((scene,index)=>{
    const video=scene.asset?.mediaType==='video';const maxDuration=Math.max(.2,Number(scene.asset?.durationSeconds)||30);const trimStart=Math.max(0,Number(scene.trimStart)||0);const trimEnd=Math.min(maxDuration,Number(scene.trimEnd)||Math.min(maxDuration,Number(scene.seconds)||1.5));const motionValue=normalizeMotion(scene.motion||scene.cameraMovement);const transitionValue=normalizeTransition(scene.transition);
    const thumbnail=scene.asset?scene.asset.mediaType==='video'?`<video class="timeline-thumb" src="${escapeHtml(scene.asset.localUrl)}" controls preload="metadata" muted playsinline title="Preview scene video"></video>`:`<img class="timeline-thumb" src="${escapeHtml(scene.asset.localUrl)}" alt="Scene ${index+1}" loading="lazy">`:'<div class="timeline-thumb timeline-empty">MEDIA NEEDED</div>';
    const textPosition=scene.textPosition||'bottom';const cropX=Number(scene.cropX)||0;const cropY=Number(scene.cropY)||0;
    return `<article class="scene-edit" data-scene-id="${escapeHtml(scene.id)}" draggable="true"><div class="scene-order">${thumbnail}<span>${String(index+1).padStart(2,'0')}</span><div><strong>${escapeHtml(scene.role||'SHOT')} · ${escapeHtml(scene.description)}</strong><small>Why this shot: ${escapeHtml(scene.whyThisShot||'')}</small>${scene.storyPurpose?`<small>Story purpose: ${escapeHtml(scene.storyPurpose)}</small>`:String()}${scene.visualPurpose?`<small>Visual purpose: ${escapeHtml(scene.visualPurpose)}</small>`:String()}${scene.transitionReason?`<small>Transition reason: ${escapeHtml(scene.transitionReason)}</small>`:String()}${scene.nextShotRelationship?`<small>Next-shot relationship: ${escapeHtml(scene.nextShotRelationship)}</small>`:String()}${scene.asset?.visualAnalysis?.actualVisualAnalysis?`<small class="vision-analysis">Vision: ${escapeHtml(scene.asset.visualAnalysis.composition)} · ${escapeHtml((scene.asset.visualAnalysis.subjects||[]).join(', '))} · scene match ${Math.round(Number(scene.asset.visualAnalysis.sceneMatch||0)*100)}%${scene.asset.visualAnalysis.reviewRequired?' · REVIEW MATCH':''}</small>`:''}<small>Media: ${escapeHtml(scene.mediaPreference||scene.mediaRequirement||'EITHER')} · ${scene.asset?`${escapeHtml(scene.asset.mediaType)} · ${escapeHtml(scene.asset.title)} · ${escapeHtml(scene.asset.license||'LICENCE METADATA MISSING')}`:'No real media assigned · add from Commons'}</small></div>${scene.asset?`<button class="review-button" data-replace-scene="${escapeHtml(scene.id)}">Replace media</button>`:''}</div><label class="timeline-text-label">ON-SCREEN TEXT<textarea class="edit-field scene-text" data-scene-text="${escapeHtml(scene.id)}" maxlength="90" aria-label="Scene text overlay" placeholder="Short text overlay">${escapeHtml(scene.text||'')}</textarea></label><div class="timeline-controls"><label>SCENE LENGTH · SEC<input type="number" min="0.5" max="6" step="0.1" value="${Number(scene.seconds||1.5)}" data-scene-seconds="${escapeHtml(scene.id)}"></label><label>MOTION<select data-scene-motion="${escapeHtml(scene.id)}">${motionOptions.map(value=>`<option ${value===motionValue?'selected':''}>${value}</option>`).join('')}</select></label><label>TRANSITION<select data-scene-transition="${escapeHtml(scene.id)}">${transitionOptions.map(value=>`<option ${value===transitionValue?'selected':''}>${value}</option>`).join('')}</select></label><label>TEXT POSITION<select data-text-position="${escapeHtml(scene.id)}">${['top','middle','bottom'].map(value=>`<option ${textPosition===value?'selected':''}>${value}</option>`).join('')}</select></label><label>CROP X<input type="range" min="-1" max="1" step="0.05" value="${cropX}" data-crop-x="${escapeHtml(scene.id)}"></label><label>CROP Y<input type="range" min="-1" max="1" step="0.05" value="${cropY}" data-crop-y="${escapeHtml(scene.id)}"></label>${video?`<label>VIDEO IN · ${trimStart.toFixed(1)}s<input type="range" min="0" max="${maxDuration.toFixed(1)}" step="0.1" value="${trimStart.toFixed(1)}" data-trim-start="${escapeHtml(scene.id)}"></label><label>VIDEO OUT · ${trimEnd.toFixed(1)}s<input type="range" min="0.1" max="${maxDuration.toFixed(1)}" step="0.1" value="${trimEnd.toFixed(1)}" data-trim-end="${escapeHtml(scene.id)}"></label>`:''}</div><div class="scene-tools"><button type="button" data-move-scene="up" data-id="${escapeHtml(scene.id)}" ${index===0?'disabled':''}>↑ Move up</button><button type="button" data-move-scene="down" data-id="${escapeHtml(scene.id)}" ${index===reelScenes.length-1?'disabled':''}>↓ Move down</button><span>DRAG TO REORDER · ${scene.asset?`SOURCE RECORDED · ${scene.seconds||1.5}s`:'WAITING FOR SOURCE MEDIA'}</span></div></article>`;
  }).join('');
  const templates=[['moment','The Moment · intimate serif'],['detail','The Detail · editorial close'],['energy','The Energy · beat-led display'],['meaning','The Meaning · devotional frame']];
  const realMaster=hasQcPassedMaster(r);document.querySelector('#dialog-body').innerHTML = `${realMaster?`<video class="draft-master-preview" controls playsinline preload="metadata" src="${escapeHtml(r.renderUrl)}"></video>`:`<div class="media-required-note"><strong>STORYBOARD · MEDIA REQUIRED</strong><span>No reel preview exists until real media is assigned and rendered.</span></div>`}
    <h2>${escapeHtml(r.title)}</h2><p class="dialog-sub">${escapeHtml(r.topic)} · ${escapeHtml(r.pillar||'Four-pillar concept')} · Planned duration ${plannedSeconds(r)} sec · no music</p>
    <label class="field-label" for="title-edit">REEL TITLE</label><input class="edit-field" id="title-edit" value="${escapeHtml(r.title)}">
    <label class="field-label" for="cover-edit">COVER FRAME SUGGESTION · FIRST SCENE IS USED IN THE MASTER</label><input class="edit-field" id="cover-edit" value="${escapeHtml(r.coverSuggestion||'Use the first real scene as the cover; add a short overlay.')}">
    <label class="field-label" for="caption-edit">POST CAPTION · CTA · RECORDED MEDIA CREDITS</label><textarea class="edit-field caption-field" id="caption-edit">${escapeHtml(buildPostCaption(r))}</textarea>
    <label class="field-label" for="script-edit">VOICEOVER &amp; SHOT-BY-SHOT EDIT</label><textarea class="edit-field script-field" id="script-edit">${escapeHtml(r.script)}</textarea>
    <label class="field-label" for="visual-direction-edit">VISUAL DIRECTION · ORIGINAL, AUTHENTIC, FAST-PACED</label><textarea class="edit-field visual-direction-field" id="visual-direction-edit">${escapeHtml(r.visualDirection || VISUAL_DIRECTION)}</textarea>
    <label class="field-label" for="template-edit">TEMPLATE · FOUR DISTINCT TREATMENTS</label><select class="edit-field" id="template-edit">${templates.map(([value,label])=>`<option value="${value}" ${r.template===value?'selected':''}>${label}</option>`).join('')}</select>
    <div class="source-box"><strong>REAL MEDIA &amp; RIGHTS CHECK</strong>${escapeHtml(r.fact)}<br>Selected assets must retain creator, licence, and source-page records. No soundtrack or reference audio is included.<br>${escapeHtml(r.source||'Add source media from Wikimedia Commons before rendering.')}</div>
    <section class="scene-editor"><div class="scene-editor-heading"><h3>Timeline · eight scenes</h3><div class="editor-history-actions"><span>${r.scenes.filter(s=>hasVerifiedAsset(s.asset)).length}/8 verified media assets</span><button type="button" class="review-button" id="editor-undo" ${editorUndo.length?'':'disabled'}>Undo</button><button type="button" class="review-button" id="editor-redo" ${editorRedo.length?'':'disabled'}>Redo</button></div></div><div class="timeline-ruler"><span>00:00</span><div class="timeline-track">${reelScenes.map((scene,index)=>`<span style="flex:${Math.max(.5,Number(scene.seconds)||1.5)}">${String(index+1).padStart(2,'0')} · ${Number(scene.seconds||1.5).toFixed(1)}s</span>`).join('')}</div><span>${plannedSeconds(r).toFixed(1)}s</span></div>${sceneMarkup}</section>
    ${realMaster?`<div class="qc-pass-box"><strong>QC PASSED · ACTUAL MP4</strong><span>${r.qc?.width}×${r.qc?.height} · ${r.qc?.fps} fps · ${Number(r.qc?.duration).toFixed(1)}s · ${escapeHtml(r.qc?.codec||'H.264 MP4')} · file saved and decoded · ${escapeHtml(r.qc?.ffprobe?.message||'FFprobe result unavailable')}</span><a href="${escapeHtml(r.renderUrl)}?download=1" download>Download master MP4 ↓</a><button type="button" class="review-button" id="generate-covers">Create 3 covers from this MP4</button><div class="cover-options" id="cover-options"></div></div>`:`<p class="render-blocker">${escapeHtml(r.qc?.error||'Production is blocked until every storyboard scene has a distinct local media file with verified rights metadata.')}</p>`}
    <div class="dialog-actions"><button class="button button-reject" id="reject-reel" ${realMaster?'':'disabled title="Only a real QC-passed MP4 can be reviewed."'}>Reject</button><button class="button button-outline" id="save-edit">Save edits</button><button class="button button-approve" id="approve-reel" ${realMaster?'':'disabled title="Approval is available only after a saved MP4 passes QC."'}>Approve</button></div>
    <div class="handoff-row"><button class="button button-outline" id="render-from-editor" ${hasCompleteSceneMedia(r)&&r.status!=='rendering'?'':'disabled'}>${realMaster?'Re-render master':hasCompleteSceneMedia(r)?'Render &amp; run QC':'Render blocked · media required'}</button><button class="button button-canva" id="canva-board">▧ Download storyboard sheet</button></div>`;
  dialog.showModal();
  const readDraft = () => ({
    title: document.querySelector('#title-edit').value.trim() || r.title,
    coverSuggestion:document.querySelector('#cover-edit').value,
    caption:document.querySelector('#caption-edit').value,
    script: document.querySelector('#script-edit').value,
    visualDirection: document.querySelector('#visual-direction-edit').value,
    template:document.querySelector('#template-edit').value,
    scenes:reelScenes.map(scene=>({...scene,text:document.querySelector(`[data-scene-text="${CSS.escape(scene.id)}"]`)?.value||'',seconds:Math.max(.5,Math.min(6,Number(document.querySelector(`[data-scene-seconds="${CSS.escape(scene.id)}"]`)?.value)||scene.seconds||1.5)),motion:normalizeMotion(document.querySelector(`[data-scene-motion="${CSS.escape(scene.id)}"]`)?.value||scene.motion||scene.cameraMovement),transition:normalizeTransition(document.querySelector(`[data-scene-transition="${CSS.escape(scene.id)}"]`)?.value||scene.transition),textPosition:document.querySelector(`[data-text-position="${CSS.escape(scene.id)}"]`)?.value||scene.textPosition||'bottom',cropX:Number(document.querySelector(`[data-crop-x="${CSS.escape(scene.id)}"]`)?.value??scene.cropX??0),cropY:Number(document.querySelector(`[data-crop-y="${CSS.escape(scene.id)}"]`)?.value??scene.cropY??0),...(scene.asset?.mediaType==='video'?{trimStart:Math.max(0,Number(document.querySelector(`[data-trim-start="${CSS.escape(scene.id)}"]`)?.value)||0),trimEnd:Math.max(.1,Number(document.querySelector(`[data-trim-end="${CSS.escape(scene.id)}"]`)?.value)||scene.asset.durationSeconds||scene.seconds||1.5)}:{})})),
    plannedDuration:reelScenes.reduce((total,scene)=>total+Math.max(.5,Math.min(6,Number(document.querySelector(`[data-scene-seconds="${CSS.escape(scene.id)}"]`)?.value)||scene.seconds||1.5)),0),
  });
  document.querySelector('#save-edit').onclick = () => {
    commitDraft(id,readDraft());dialog.close();showToast('Changes saved. Re-render to replace the old master.');
  };
  document.querySelector('#approve-reel').onclick = () => {
    if(!hasQcPassedMaster(r)){showToast('Approval requires a saved MP4 that passed QC.');return;}
    const edits=readDraft();if(draftChanged(r,edits)){commitDraft(id,edits);dialog.close();showToast('Edits changed after render. Re-render and pass QC before approval.');return;}
    decide(r, 'approved');
  };
  document.querySelector('#reject-reel').onclick = () => {if(hasQcPassedMaster(r))decide(r, 'rejected');};
  document.querySelector('#canva-board').onclick = () => downloadCanvaStoryboard({...r,...readDraft()});
  document.querySelector('#generate-covers')?.addEventListener('click',()=>generateCoverOptions(r));
  document.querySelector('#render-from-editor').onclick=()=>{if(!hasCompleteSceneMedia({...r,...readDraft()})){showToast('Every storyboard scene needs a distinct verified media file before rendering.');return;}commitDraft(id,readDraft());dialog.close();renderReel(id);};
  document.querySelectorAll('[data-replace-scene]').forEach(button=>button.addEventListener('click',()=>{saved.assetTarget={reelId:id,sceneId:button.dataset.replaceScene};persist();dialog.close();document.querySelector('#asset-target').value=id;document.querySelector('#asset-library').scrollIntoView({behavior:'smooth'});showToast('Choose replacement media in the Commons library.');}));
  document.querySelectorAll('[data-move-scene]').forEach(button=>button.addEventListener('click',()=>moveScene(id,button.dataset.id,button.dataset.moveScene)));
  document.querySelectorAll('[data-trim-start],[data-trim-end]').forEach(input=>input.addEventListener('input',()=>{const card=input.closest('.scene-edit');const start=card.querySelector('[data-trim-start]');const end=card.querySelector('[data-trim-end]');if(start&&end){if(input===start&&Number(start.value)>=Number(end.value))end.value=Math.min(Number(end.max),Number(start.value)+.1).toFixed(1);if(input===end&&Number(end.value)<=Number(start.value))start.value=Math.max(Number(start.min),Number(end.value)-.1).toFixed(1);start.parentElement.childNodes[0].textContent=`VIDEO IN · ${Number(start.value).toFixed(1)}s`;end.parentElement.childNodes[0].textContent=`VIDEO OUT · ${Number(end.value).toFixed(1)}s`;}}));
  document.querySelectorAll('[data-scene-seconds]').forEach(input=>input.addEventListener('input',()=>{const fields=[...document.querySelectorAll('[data-scene-seconds]')];const bars=[...document.querySelectorAll('.timeline-track span')];let total=0;fields.forEach((field,index)=>{const value=Math.max(.5,Math.min(6,Number(field.value)||.5));total+=value;if(bars[index]){bars[index].style.flex=String(value);bars[index].textContent=`${String(index+1).padStart(2,'0')} · ${value.toFixed(1)}s`;}});const endpoints=document.querySelectorAll('.timeline-ruler>span');if(endpoints.length>1)endpoints[endpoints.length-1].textContent=`${total.toFixed(1)}s · render limit 10–20s`;}));
  let draggedScene=null;document.querySelectorAll('.scene-edit[draggable="true"]').forEach(card=>{
    card.addEventListener('dragstart',event=>{draggedScene=card.dataset.sceneId;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggedScene);});
    card.addEventListener('dragover',event=>{event.preventDefault();card.classList.add('scene-drop-target');});
    card.addEventListener('dragleave',()=>card.classList.remove('scene-drop-target'));
    card.addEventListener('drop',event=>{event.preventDefault();card.classList.remove('scene-drop-target');const from=draggedScene||event.dataTransfer.getData('text/plain');if(from&&from!==card.dataset.sceneId)moveSceneTo(id,from,card.dataset.sceneId);});
  });
  if(!preserveEditorHistory){editorUndo.length=0;editorRedo.length=0;}preserveEditorHistory=false;editorHistoryCurrent=JSON.stringify(readDraft());
  const recordEditorHistory=()=>{clearTimeout(editorHistoryTimer);editorHistoryTimer=setTimeout(()=>{const next=JSON.stringify(readDraft());if(editorHistoryCurrent!==null&&next!==editorHistoryCurrent){editorUndo.push(editorHistoryCurrent);if(editorUndo.length>30)editorUndo.shift();editorRedo.length=0;editorHistoryCurrent=next;document.querySelector('#editor-undo').disabled=false;document.querySelector('#editor-redo').disabled=true;}},350);};
  document.querySelector('#dialog-body').addEventListener('input',recordEditorHistory);document.querySelector('#dialog-body').addEventListener('change',recordEditorHistory);
  document.querySelector('#editor-undo').onclick=()=>applyEditorHistory(id,editorUndo,editorRedo);
  document.querySelector('#editor-redo').onclick=()=>applyEditorHistory(id,editorRedo,editorUndo);
}

function applyEditorHistory(reelId,from,to){
  clearTimeout(editorHistoryTimer);const current=editorHistoryCurrent;if(current)to.push(current);const target=from.pop();if(!target)return;editorHistoryCurrent=target;saved.edits[reelId]=JSON.parse(target);persist();preserveEditorHistory=true;dialog.close();openReel(reelId);
}

function downloadCanvaStoryboard(reel) {
  const wrap=(text,limit=58)=>{const words=String(text||'').split(/\s+/);const lines=[];let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>limit&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;};
  const scenes=(reel.scenes||[]).slice(0,8);
  const nodes=scenes.map((scene,index)=>{const y=290+index*177;const title=wrap(scene.label||`SCENE ${index+1}`,30).slice(0,1)[0];const description=wrap(scene.text||scene.description||'Real media required for this shot.',92).slice(0,2);const media=scene.asset?`${scene.asset.mediaType.toUpperCase()} · ${scene.asset.title||scene.asset.filename}`:'MEDIA REQUIRED · assign an owned or rights-recorded file';return `<line x1="90" y1="${y+155}" x2="990" y2="${y+155}" stroke="#cbd5e1"/><text x="90" y="${y+30}" font-size="16" font-weight="700" fill="#9a5a18">${String(index+1).padStart(2,'0')} · ${escapeHtml(title)}</text>${description.map((line,i)=>`<text x="90" y="${y+65+i*25}" font-size="17" fill="#172033">${escapeHtml(line)}</text>`).join('')}<text x="90" y="${y+132}" font-size="13" fill="#64748b">${escapeHtml(media)} · ${Number(scene.seconds||0).toFixed(1)} sec planned</text>`;}).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#f8fafc"/><text x="90" y="90" font-size="16" letter-spacing="3" font-weight="700" fill="#9a5a18">FESTIVAL OF BHARAT · STORYBOARD DOCUMENT</text><text x="90" y="145" font-size="34" font-weight="700" fill="#0f172a">${escapeHtml(reel.title)}</text><text x="90" y="185" font-size="18" fill="#475569">${escapeHtml(reel.topic)} · ${escapeHtml(reel.pillar)} · ${plannedSeconds(reel)} sec planned</text><text x="90" y="225" font-size="13" font-weight="700" fill="#b91c1c">STORYBOARD ONLY · NOT A REEL OR VIDEO PREVIEW</text>${nodes}<text x="90" y="1745" font-size="15" font-weight="700" fill="#9a5a18">AUDIO PLAN</text><text x="90" y="1780" font-size="15" fill="#334155">No music · source video/audio tracks excluded</text><text x="90" y="1840" font-size="13" fill="#64748b">Import this text-led planning sheet into Canva to apply your brand design.</text></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${reel.id}-storyboard.svg`;a.click();URL.revokeObjectURL(url);showToast('Text-only storyboard sheet downloaded for Canva.');
}
function decide(r, status) {
  if(!hasQcPassedMaster(r)){showToast('Only a saved MP4 with a complete passing QC report can be approved or rejected.');return;}
  const decisionAt=new Date().toISOString();saved.decisions[r.id] = status;r.decisionAt=decisionAt;
  const stored=saved.customReels.find(item=>item.id===r.id);if(stored){stored.decisionAt=decisionAt;setReelProductionState(stored,status==='approved'?'APPROVED':'REJECTED');}
  const run=saved.currentRun;const patterns=run?.patternAnalysis?.observations||[];const allReferences=[...(run?.research?.results||[]),...(run?.research?.instagramReferences||[])];const learning={runId:r.runId||run?.id||null,topic:r.topic||run?.topic||'',references:patterns.map(note=>{const ref=allReferences.find(item=>item.id===note.referenceId);return ref?{title:ref.title,url:ref.url,creator:ref.creator||ref.channel,views:ref.views??null,metricSource:ref.metricSource||'YouTube Data API',retrievedAt:ref.retrievedAt||null}:null;}).filter(Boolean),referenceIds:patterns.map(note=>note.referenceId),patterns:patterns.map(note=>({referenceTitle:note.referenceTitle,source:note.source,hook:note.hook,openingVisual:note.openingVisual,durationShots:note.durationShots,pacing:note.pacing,visualLanguage:note.visualLanguage,visualStructure:note.scenes,textStyle:note.textStyle,transitions:note.transitions,emotion:note.emotion,curiosity:note.emotion,visualPattern:note.visualPattern,cta:note.cta})),concept:{pillar:r.pillar,title:r.title,hookType:r.pillar,scriptOpening:String(r.script||'').split('\n')[0]},assetTypes:[...new Set((r.scenes||[]).map(scene=>scene.asset?.mediaType).filter(Boolean))],finalDuration:Number(r.qc.duration),qcPassed:true,decision:status,decisionAt,performance:null};Object.assign(learning,window.FOBProductionPlanning?.performanceRecord(r,status)||{});saved.learningRuns||=[];if(!saved.learningRuns.some(item=>item.reelId===r.id)){learning.reelId=r.id;saved.learningRuns.unshift(learning);saved.learningRuns=saved.learningRuns.slice(0,120);}
  saved.history.unshift({ id: r.id, title: r.title, status, date: decisionAt, topic:r.topic, pillar:r.pillar, qcPassed:true });
  saved.history = saved.history.slice(0, 40);
  persist(); render(); dialog.close();
  showToast(status === 'approved' ? 'Approved and saved. Instagram posting needs account connection.' : 'Rejected and saved to your history.');
}

function moveScene(reelId,sceneId,direction){
  const reel=saved.customReels.find(item=>item.id===reelId);if(!reel)return;
  captureOpenEditor(reel);
  const index=reel.scenes.findIndex(scene=>scene.id===sceneId);const next=index+(direction==='up'?-1:1);
  if(index<0||next<0||next>=reel.scenes.length)return;
  moveSceneTo(reelId,reel.scenes[index].id,reel.scenes[next].id);
}

function captureOpenEditor(reel){
  reel.title=document.querySelector('#title-edit')?.value.trim()||reel.title;reel.coverSuggestion=document.querySelector('#cover-edit')?.value||reel.coverSuggestion;reel.caption=document.querySelector('#caption-edit')?.value||reel.caption;reel.script=document.querySelector('#script-edit')?.value||reel.script;reel.visualDirection=document.querySelector('#visual-direction-edit')?.value||reel.visualDirection;reel.template=document.querySelector('#template-edit')?.value||reel.template;
  for(const scene of reel.scenes){const id=CSS.escape(scene.id);scene.text=document.querySelector(`[data-scene-text="${id}"]`)?.value??scene.text;scene.seconds=Math.max(.5,Math.min(6,Number(document.querySelector(`[data-scene-seconds="${id}"]`)?.value)||scene.seconds||1.5));scene.motion=normalizeMotion(document.querySelector(`[data-scene-motion="${id}"]`)?.value||scene.motion||scene.cameraMovement);scene.transition=normalizeTransition(document.querySelector(`[data-scene-transition="${id}"]`)?.value||scene.transition);scene.textPosition=document.querySelector(`[data-text-position="${id}"]`)?.value||scene.textPosition||'bottom';scene.cropX=Number(document.querySelector(`[data-crop-x="${id}"]`)?.value??scene.cropX??0);scene.cropY=Number(document.querySelector(`[data-crop-y="${id}"]`)?.value??scene.cropY??0);if(scene.asset?.mediaType==='video'){scene.trimStart=Math.max(0,Number(document.querySelector(`[data-trim-start="${id}"]`)?.value)||0);scene.trimEnd=Math.max(.1,Number(document.querySelector(`[data-trim-end="${id}"]`)?.value)||scene.trimEnd||scene.seconds);}}
  reel.plannedDuration=reel.scenes.reduce((sum,scene)=>sum+Number(scene.seconds||0),0);
}
function moveSceneTo(reelId,fromId,toId){
  const reel=saved.customReels.find(item=>item.id===reelId);if(!reel)return;captureOpenEditor(reel);const from=reel.scenes.findIndex(scene=>scene.id===fromId),to=reel.scenes.findIndex(scene=>scene.id===toId);if(from<0||to<0)return;const [scene]=reel.scenes.splice(from,1);reel.scenes.splice(to,0,scene);reel.status='waiting-for-media';reel.renderUrl=null;reel.qc=null;persist();render();if(dialog.open)dialog.close();openReel(reelId);
}

const TEMPLATE_STYLE={
  moment:{font:'Georgia',size:83,align:'center',ink:'#fff4e1',accent:'#dfaa67',panel:'#130d0ca6',y:.73,transition:.2},
  detail:{font:'Arial',size:76,align:'left',ink:'#fff8ef',accent:'#df7556',panel:'#17141bc2',y:.77,transition:.1},
  energy:{font:'Arial Black, Arial',size:88,align:'left',ink:'#fff9e9',accent:'#ffd447',panel:'#17121bba',y:.75,transition:.08},
  meaning:{font:'Georgia',size:76,align:'center',ink:'#fff7e9',accent:'#e8c993',panel:'#1b1a18ab',y:.79,transition:.25},
};

function coverMedia(ctx,media,x,y,w,h,progress=0,motion='slow push',framing=null){
  const mw=media.videoWidth||media.naturalWidth||media.width;const mh=media.videoHeight||media.naturalHeight||media.height;
  if(!mw||!mh)return;
  const baseScale=Math.max(w/mw,h/mh);const push=motion==='slow push'?1.04+progress*.055:motion==='parallax crop'?1.07:motion==='static cinematic frame'?1:1.025;const scale=baseScale*push;const sw=w/scale,sh=h/scale;
  let px=.5+Number(framing?.cropX||0)*.3,py=.5+Number(framing?.cropY||0)*.3;if(motion==='pan left')px+=.12-progress*.24;else if(motion==='pan right')px-=.12-progress*.24;else if(motion==='vertical rise')py+=.16-progress*.3;else if(motion==='parallax crop'){px+=-.06+progress*.12;py+=-.04-progress*.08;}
  const cx=Math.max(0,Math.min(mw-sw,(mw-sw)*px));const cy=Math.max(0,Math.min(mh-sh,(mh-sh)*py));
  ctx.drawImage(media,cx,cy,sw,sh,x,y,w,h);
}

let coverOptionUrls=[];
async function generateCoverOptions(reel){
  const button=document.querySelector('#generate-covers');const panel=document.querySelector('#cover-options');if(!button||!panel||!hasQcPassedMaster(reel))return;
  button.disabled=true;button.textContent='Extracting frames from the verified MP4…';panel.innerHTML='<span>Reading three actual frames from the rendered master.</span>';
  try{
    coverOptionUrls.forEach(url=>URL.revokeObjectURL(url));coverOptionUrls=[];
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=reel.renderUrl;
    await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error('The saved MP4 could not be opened for cover extraction.'));});
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');const sample=[.04,.39,.76];const options=[];
    for(let index=0;index<sample.length;index++){
      const time=Math.min(Math.max(0,video.duration-.08),video.duration*sample[index]);video.currentTime=time;await new Promise((resolve,reject)=>{video.onseeked=resolve;video.onerror=()=>reject(new Error('Could not seek to a cover frame.'));});
      coverMedia(ctx,video,0,0,1080,1920,0,'static cinematic frame');const shade=ctx.createLinearGradient(0,1050,0,1920);shade.addColorStop(0,'#08090a00');shade.addColorStop(.36,'#08090a99');shade.addColorStop(1,'#08090af2');ctx.fillStyle=shade;ctx.fillRect(0,0,1080,1920);
      const sourceScene=reel.scenes?.[[0,3,6][index]];const words=String(sourceScene?.text||reel.topic||reel.title).replace(/[^\p{L}\p{N}\s'-]/gu,'').trim().split(/\s+/).slice(0,6);const headline=words.join(' ').toUpperCase();
      ctx.textAlign='left';ctx.fillStyle='#FBBF24';ctx.font='700 25px Arial';ctx.fillText(`FESTIVAL OF BHARAT  ·  COVER ${index+1}`,72,1485,930);ctx.fillStyle='#fffaf0';ctx.font='800 78px Arial';const lines=wrappedOverlay(ctx,headline,930,3).lines;if(lines.length>3)throw new Error('Cover headline exceeded the three-line layout.');lines.forEach((line,lineIndex)=>ctx.fillText(line,72,1585+lineIndex*94,930));
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Could not encode a cover image.');const url=URL.createObjectURL(blob);coverOptionUrls.push(url);options.push({url,time,label:`Frame ${index+1} · ${time.toFixed(1)}s`,headline});
    }
    panel.innerHTML=options.map((item,index)=>`<article class="cover-option"><img src="${item.url}" alt="Cover ${index+1} from rendered reel at ${item.time.toFixed(1)} seconds"><span>${escapeHtml(item.label)} · ${escapeHtml(item.headline)}</span><button type="button" class="review-button" data-select-cover="${index}">Select as cover</button><a href="${item.url}" download="${escapeHtml((reel.topic||'festival-of-bharat').toLowerCase().replace(/[^a-z0-9]+/g,'-'))}-cover-${index+1}.png">Download cover PNG</a></article>`).join('');
    panel.querySelectorAll('[data-select-cover]').forEach(select=>select.addEventListener('click',()=>{saved.coverChoices||={};saved.coverChoices[reel.id]=options[Number(select.dataset.selectCover)].time;persist();panel.querySelectorAll('[data-select-cover]').forEach(button=>{button.textContent='Select as cover';button.classList.remove('cover-selected');});select.textContent='Selected';select.classList.add('cover-selected');showToast(`Cover frame at ${options[Number(select.dataset.selectCover)].time.toFixed(1)} seconds selected. Download its PNG to use on Instagram.`);}));
  }catch(error){panel.textContent=`Cover generation failed: ${error.message}`;}finally{button.disabled=false;button.textContent='Recreate covers from MP4';}
}

function wrappedOverlay(ctx,text,maxWidth,maxLines){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean);const lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);return {lines,overflow:lines.length>maxLines};
}

function drawMasterFrame(ctx,loaded,sceneIndex,template,progress){
  const scene=loaded[sceneIndex];const w=1080,h=1920;const style=TEMPLATE_STYLE[template]||TEMPLATE_STYLE.moment;
  ctx.fillStyle='#171513';ctx.fillRect(0,0,w,h);coverMedia(ctx,scene.media,0,0,w,h,progress,scene.data.motion||'slow push',scene.data);
  const shade=ctx.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#100d124d');shade.addColorStop(.45,'#100d1200');shade.addColorStop(.66,style.panel);shade.addColorStop(1,'#0c0909e8');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  ctx.textAlign=style.align;ctx.fillStyle=style.ink;
  ctx.font=`700 ${style.size}px ${style.font}`;
  const label=scene.data.text||scene.data.description;const wrapped=wrappedOverlay(ctx,label,920,2);
  if(wrapped.overflow)return {overflow:true};
  const tx=style.align==='left'?80:w/2;const position=scene.data.textPosition||'bottom';const baseY=position==='top'?Math.round(h*.2):position==='middle'?Math.round(h*.52):Math.round(h*style.y);const lineHeight=Math.round(style.size*1.15);
  const reveal=Math.min(1,Math.max(0,progress/.22));ctx.save();ctx.globalAlpha=reveal;ctx.translate(0,(1-reveal)*22);wrapped.lines.forEach((line,index)=>ctx.fillText(line,tx,baseY+index*lineHeight,920));ctx.restore();
  ctx.font='600 26px Arial';ctx.fillStyle='#fff7eddd';ctx.textAlign=style.align==='left'?'left':'center';ctx.fillText(`${sceneIndex+1} / ${loaded.length}   ·   ${escapeCanvasText(scene.data.description)}`,style.align==='left'?80:w/2,h-116,920);
  if(sceneIndex===loaded.length-1){ctx.font='700 24px Arial';ctx.fillStyle=style.accent;ctx.textAlign='right';ctx.fillText('FOLLOW FOR STORIES ACROSS BHARAT',1000,h-61,920);}
  return {overflow:false};
}

function escapeCanvasText(text){return String(text||'').replace(/[<>]/g,'').slice(0,110);}

function showRenderBlocked(reel,reason){
  const stored=saved.customReels.find(item=>item.id===reel.id);if(stored){stored.status='blocked';stored.renderStartedAt=new Date().toISOString();stored.qcStartedAt=null;stored.qcCompletedAt=null;stored.qc={error:reason};}
  persist();renderPipeline();render();showToast(reason);
}

async function loadSceneMedia(scene){
  const asset=scene.asset;if(!asset?.localUrl)throw new Error('Every scene needs an imported real media file.');
  if(!asset.metadataComplete||!asset.creator||!asset.license||!asset.pageUrl)throw new Error(`Rights metadata is incomplete for “${asset.title}”.`);
  if(asset.mediaType==='video'){
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';video.src=asset.localUrl;
    await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(new Error(`Could not decode video ${asset.title}.`));video.load();});if(!Number.isFinite(video.duration)||video.duration<=0||!video.videoWidth||!video.videoHeight)throw new Error(`Video metadata or duration is invalid for ${asset.title}.`);asset.durationSeconds=video.duration;
    scene.trimStart=Math.max(0,Math.min(video.duration-.1,Number(scene.trimStart)||0));scene.trimEnd=Math.max(scene.trimStart+.1,Math.min(video.duration,Number(scene.trimEnd)||Math.min(video.duration,scene.seconds||1.5)));video.currentTime=scene.trimStart;
    await new Promise(resolve=>{if(video.seeking){video.onseeked=resolve;setTimeout(resolve,800);}else resolve();});
    return {media:video,data:scene,trimStart:scene.trimStart,trimEnd:scene.trimEnd};
  }
  const image=new Image();image.src=asset.localUrl;
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error(`Could not decode photo ${asset.title}.`));});
  return {media:image,data:scene};
}

async function renderReel(id){
  const stored=saved.customReels.find(item=>item.id===id);if(!stored)return;
  const reel={...stored,...(saved.edits[id]||{})};
  const scenes=reel.scenes||[];const assets=scenes.map(scene=>scene.asset).filter(Boolean);
  const types=new Set(assets.map(asset=>asset.mediaType));const ids=assets.map(asset=>asset.id);
  const assetsComplete=scenes.length===8&&assets.length===8&&new Set(ids).size===8&&assets.every(hasVerifiedAsset);
  if(!assetsComplete){showRenderBlocked(reel,'Render blocked — MEDIA REQUIRED: assign eight distinct real local photo/video files with recorded creator, rights, source, and dimensions. A photo-only or video-only story is allowed and will be labelled accurately.');return;}
  if(stored.productionState==='READY_FOR_REVIEW')setReelProductionState(stored,'RETRYING');
  advanceReelState(stored,'COLLECTING_ASSETS');advanceReelState(stored,'VALIDATING_RIGHTS');advanceReelState(stored,'EDITING');advanceReelState(stored,'RENDERING');
  if(!assets.every(asset=>Number(asset.width)>=640&&Number(asset.height)>=360)){showRenderBlocked(reel,'Render blocked: at least one source file is below the 640×360 production minimum. Replace it with higher-resolution media.');return;}
  if(!('MediaRecorder'in window)||!HTMLCanvasElement.prototype.captureStream){showRenderBlocked(reel,'This browser does not support canvas video recording. No MP4 was created.');return;}
  const mimeChoices=['video/mp4;codecs="avc1.42E01E"','video/mp4;codecs=avc1','video/mp4'];
  const mimeType=mimeChoices.find(type=>MediaRecorder.isTypeSupported(type));
  if(!mimeType){showRenderBlocked(reel,'This browser cannot encode H.264 MP4. No render was made; use a browser whose MediaRecorder supports video/mp4 with AVC/H.264.');return;}
  stored.status='rendering';stored.qc=null;stored.renderStartedAt=new Date().toISOString();stored.qcStartedAt=null;persist();render();renderPipeline();
  setWork('Rendering 1080×1920 master',reel.title,'Loading all eight selected source files; recording a 30 fps, music-free H.264 MP4.',0);
  let stream=null;
  try{
    const loaded=[];for(const scene of scenes)loaded.push(await loadSceneMedia(scene));persist();
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d',{alpha:false});
    const preview=document.createElement('video');preview.className='render-qc-video';preview.muted=true;preview.playsInline=true;document.body.append(preview);
    const sceneDurations=scenes.map(scene=>Number(scene.seconds||1.5));const duration=sceneDurations.reduce((sum,seconds)=>sum+seconds,0);const targetFrames=duration*30;
    if(duration<10||duration>15)throw new Error('QC blocked: edited scene timing must total 10–15 seconds.');
    const sceneStarts=sceneDurations.map((_,index)=>sceneDurations.slice(0,index).reduce((sum,seconds)=>sum+seconds,0));
    stream=canvas.captureStream(30);const track=stream.getVideoTracks()[0];const settings=track.getSettings();
    const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:10000000});const chunks=[];
    const recording=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>reject(e.error||new Error('H.264 recorder failed.'));recorder.onstop=()=>resolve(new Blob(chunks,{type:recorder.mimeType}));});
    let drawn=0;let lastScene=-1;let overflow=false;let running=true;const started=performance.now();let lastFrame=started-1000/30;
    recorder.start(500);
    const renderFrame=now=>{
      if(!running)return;
      const elapsed=Math.min(duration,(now-started)/1000);const sceneIndex=Math.min(scenes.length-1,sceneStarts.reduce((found,start,index)=>elapsed>=start?index:found,0));
      const sceneProgress=Math.min(1,(elapsed-sceneStarts[sceneIndex])/sceneDurations[sceneIndex]);
      if(sceneIndex!==lastScene){loaded.forEach((entry,index)=>{if(entry.media instanceof HTMLVideoElement){if(index===sceneIndex){entry.media.currentTime=entry.trimStart||0;const clip=Math.max(.1,(entry.trimEnd||entry.media.duration)-(entry.trimStart||0));entry.media.playbackRate=Math.max(.25,Math.min(4,clip/sceneDurations[index]));entry.media.play().catch(()=>{});}else entry.media.pause();}});lastScene=sceneIndex;}
      if(now-lastFrame>=1000/30){
        const current=drawMasterFrame(ctx,loaded,sceneIndex,reel.template,sceneProgress);overflow=overflow||current.overflow;
        const transitionName=String(scenes[sceneIndex]?.transition||'crossfade').toLowerCase();const instant=transitionName.includes('hard cut')||transitionName.includes('match cut');const wipe=transitionName.includes('whip')||transitionName.includes('masked');const transitionFrames=instant?0:(wipe?0.2:(TEMPLATE_STYLE[reel.template]?.transition||.14));const transition=elapsed-sceneStarts[sceneIndex];
        if(sceneIndex>0&&transitionFrames>0&&transition<transitionFrames){if(transitionName.includes('whip')||transitionName.includes('masked')){drawMasterFrame(ctx,loaded,sceneIndex-1,reel.template,1);ctx.save();const reveal=Math.min(1,transition/transitionFrames);ctx.beginPath();ctx.rect(0,0,Math.round(1080*reveal),1920);ctx.clip();drawMasterFrame(ctx,loaded,sceneIndex,reel.template,sceneProgress);ctx.restore();}else{ctx.save();ctx.globalAlpha=1-transition/transitionFrames;drawMasterFrame(ctx,loaded,sceneIndex-1,reel.template,1);ctx.restore();}}
        drawn++;lastFrame=now;activeWork.progress=Math.min(99,Math.floor(drawn/targetFrames*100));renderAgent();
      }
      if(elapsed>=duration){running=false;recorder.stop();return;}
      requestAnimationFrame(renderFrame);
    };
    await new Promise((resolve,reject)=>{recorder.onerror=e=>reject(e.error||new Error('Recorder failed while drawing frames.'));requestAnimationFrame(renderFrame);setTimeout(()=>{if(running){running=false;recorder.stop();reject(new Error('Render timed out before all frames were drawn.'));}},duration*1000+15000);});
    const blob=await recording;stream.getTracks().forEach(t=>t.stop());loaded.forEach(entry=>{if(entry.media instanceof HTMLVideoElement)entry.media.pause();});
    const objectUrl=URL.createObjectURL(blob);preview.src=objectUrl;
    await new Promise((resolve,reject)=>{preview.onloadedmetadata=resolve;preview.onerror=()=>reject(new Error('The encoded MP4 could not be decoded for QC.'));});
    const fps=Number(settings.frameRate||30);const codec=recorder.mimeType.match(/avc1(?:\.[^;,]+)?/i)?.[0]||'';
    const sourceResolution=assets.every(asset=>asset.width>=640&&asset.height>=360);let decodeTest=false;try{await preview.play();await new Promise(resolve=>setTimeout(resolve,120));decodeTest=preview.readyState>=2&&preview.videoWidth===1080&&preview.videoHeight===1920;preview.pause();}catch{decodeTest=false;}
    const blobHead=new Uint8Array(await blob.slice(0,32).arrayBuffer());const containerRecognized=blobHead.length>=12&&String.fromCharCode(...blobHead.slice(4,8))==='ftyp';
    advanceReelState(stored,'QC');stored.qcStartedAt=new Date().toISOString();const qc={width:preview.videoWidth,height:preview.videoHeight,fps,duration:preview.duration,codec,mime:blob.type,frames:drawn,distinctAssets:new Set(ids).size,assetTypes:[...types],checks:{videoStream:preview.videoWidth>0&&preview.videoHeight>0,h264:blob.type.startsWith('video/mp4')&&Boolean(codec),decodeTest,resolution:preview.videoWidth===1080&&preview.videoHeight===1920,aspectRatio:Math.abs(preview.videoWidth/preview.videoHeight-9/16)<.001,frameRate:fps>=29.5&&fps<=30.5,duration:preview.duration>=10&&preview.duration<=15,encoding:blob.type.startsWith('video/mp4')&&Boolean(codec)&&containerRecognized,musicFree:stream.getAudioTracks().length===0,missingAssets:assets.every(hasVerifiedAsset)&&new Set(ids).size===8,rightsMetadata:assets.every(asset=>asset.metadataComplete&&asset.creator&&asset.license&&asset.pageUrl),sourceResolution,textOverflow:!overflow,renderErrors:blob.size>50000&&drawn>=targetFrames*.95}};
    currentQc=qc;if(Object.values(qc.checks).some(ok=>!ok))throw new Error(`QC failed: ${Object.entries(qc.checks).filter(([,ok])=>!ok).map(([name])=>name).join(', ')}. No READY master was saved.`);
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(qc))));
    let savedMaster;const response=await fetch('/api/renders',{method:'POST',headers:{'Content-Type':'video/mp4','X-Render-QC':encoded},body:blob});if(response.ok){const data=await parseApiJson(response);Object.assign(qc,data.render.qc);savedMaster={url:data.render.url};}else if([404,405,413,501].includes(response.status)){savedMaster=await window.FOBAssetImport.saveMaster(id,blob);qc.checks.fileExists=true;qc.checks.finalMp4Valid=true;qc.storageMode='browser-indexeddb';}else{let data={};try{data=await parseApiJson(response);}catch{}throw new Error(data.error||`Render save failed with HTTP ${response.status}.`);}
    if(!qc.checks.fileExists||!qc.checks.finalMp4Valid||Object.values(qc.checks).some(ok=>ok!==true))throw new Error('Saved-file QC did not pass. No READY master was recorded.');
    const finishedAt=new Date().toISOString();Object.assign(stored,reel,{status:'ready',qc,renderUrl:savedMaster.url,browserMasterKey:savedMaster.key||null,qcCompletedAt:finishedAt,renderedAt:finishedAt});advanceReelState(stored,'READY_FOR_REVIEW');saved.rendered[id]=savedMaster.url;delete saved.edits[id];persist();render();renderPipeline();showToast('MP4 saved · decode, H.264, dimensions, duration and media QC passed.');
  }catch(error){stored.status='blocked';stored.qc=currentQc?{...currentQc,error:error.message}:{error:error.message};setReelProductionState(stored,'FAILED');if(currentQc)stored.qcCompletedAt=new Date().toISOString();persist();render();renderPipeline();showToast(`QC blocked · ${error.message}`);}
  finally{if(stream)stream.getTracks().forEach(track=>track.stop());document.querySelector('.render-qc-video')?.remove();setWork(null);}
}

function previewRender(id){
  const reel=saved.customReels.find(item=>item.id===id);if(!hasQcPassedMaster(reel))return;
  document.querySelector('#video-review-body').innerHTML=`<h2>${escapeHtml(reel.title)}</h2><p class="dialog-sub">${escapeHtml(reel.pillar)} · MP4 master · no audio track</p><video class="draft-master-preview" controls playsinline preload="metadata" src="${escapeHtml(reel.renderUrl)}"></video><div class="qc-pass-box"><strong>QC PASSED</strong><span>${reel.qc.width}×${reel.qc.height} · ${reel.qc.fps} fps · ${Number(reel.qc.duration).toFixed(1)}s · ${escapeHtml(reel.qc.codec)} · ${escapeHtml(reel.qc.ffprobe?.message||'Browser decode and file checks passed')}</span></div><label class="field-label">POST CAPTION / CTA / MEDIA CREDITS</label><pre class="post-caption">${escapeHtml(buildPostCaption(reel))}</pre><div class="dialog-actions"><a class="button button-outline" href="${escapeHtml(reel.renderUrl)}" download="festival-of-bharat-${escapeHtml(reel.id)}.mp4">Download MP4</a><button class="button button-reject" id="final-reject">Reject</button><button class="button button-approve" id="final-approve">Approve</button></div>`;
  document.querySelector('#final-reject').onclick=()=>{decide(reel,'rejected');document.querySelector('#video-dialog').close();};
  document.querySelector('#final-approve').onclick=()=>{decide(reel,'approved');document.querySelector('#video-dialog').close();};
  document.querySelector('#video-dialog').showModal();
}

function renderHistory() {
  const el = document.querySelector('#history-list');
  const archive=saved.history.map(entry=>{const reel=saved.customReels.find(item=>item.id===entry.id);return reel&&hasQcPassedMaster(reel)?{entry,reel}:null;}).filter(Boolean);
  el.innerHTML=archive.length?archive.map(({entry,reel})=>`<article class="real-history-card"><div><strong>${escapeHtml(reel.title)}</strong><span>${escapeHtml(reel.topic)} · ${escapeHtml(reel.pillar)} · ${new Date(reel.createdAt).toLocaleDateString()}</span><small>MP4 · ${Number(reel.qc.duration).toFixed(1)} sec · ${reel.qc.width}×${reel.qc.height} · QC PASSED · ${reel.scenes.filter(scene=>hasVerifiedAsset(scene.asset)).length} verified assets</small></div><b class="history-chip ${entry.status}">${entry.status.toUpperCase()}</b><a class="review-button" href="${escapeHtml(reel.renderUrl)}?download=1" download>Download MP4</a></article>`).join(''):'<p class="empty-state">No QC-verified MP4 decisions yet. Concepts and storyboards remain in the current production, not production history.</p>';
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.append(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function showInfo(title, html) { document.querySelector('#info-title').textContent = title; document.querySelector('#info-body').innerHTML = html; infoDialog.showModal(); }
async function openInstagramConnection(){
  let status={},insights=null;try{const r=await fetch('/api/instagram/status');status=await parseApiJson(r);const savedInsights=await fetch('/api/instagram/insights');if(savedInsights.ok)insights=await parseApiJson(savedInsights);}catch{status={message:'Start the local server to connect Instagram Insights.'};}
  const records=(saved.learningRuns||[]).filter(row=>row.decision==='approved');
  const media=insights?.media||[];const metrics=(row)=>[['Views',row.views],['Reach',row.reach],['Likes',row.likes],['Comments',row.comments],['Shares',row.shares],['Saves',row.saves],['Avg watch',row.averageWatchTime],['Total watch',row.totalWatchTime],['Interactions',row.totalInteractions]].map(([name,value])=>`${name}: ${value===null||value===undefined?'not returned':escapeHtml(String(value))}`).join(' · ');
  const rows=media.map(item=>`<article class="ig-insight-row"><div><strong>${escapeHtml(item.caption||'Your Instagram Reel')}</strong><small>${escapeHtml(item.insightsStatus)} · ${escapeHtml(item.timestamp||'Date unavailable')} · ${metrics(item)}</small>${item.insightsError?`<small>${escapeHtml(item.insightsError)}</small>`:''}<a target="_blank" rel="noopener noreferrer" href="${escapeHtml(item.permalink)}">Open your Reel ↗</a></div>${records.length?`<div><select data-ig-reel-select="${escapeHtml(item.id)}"><option value="">Link to a Festival of Bharat Reel…</option>${records.map(record=>`<option value="${escapeHtml(record.reelId)}">${escapeHtml(record.topic)} · ${escapeHtml(record.concept?.pillar||record.pillar||'Reel')}</option>`).join('')}</select><button type="button" data-link-ig-reel="${escapeHtml(item.id)}">Link metrics</button></div>`:''}</article>`).join('');
  showInfo('INSTAGRAM INSIGHTS',`<h2>${status.connected?`Connected as @${escapeHtml(status.username||'Instagram')}`:'Connect your professional account'}</h2><p>${escapeHtml(status.message||'')}</p>${status.configured&&!status.connected?'<a class="button button-approve" href="/api/instagram/connect">Authorize Instagram Insights</a>':''}${status.connected?`<p>Account type: ${escapeHtml(status.accountType||'Professional')} · token refresh due ${escapeHtml(status.expiresAt||'unknown')}</p><button class="review-button" id="sync-instagram-insights">Sync latest Reels &amp; Insights</button> <button class="review-button" id="disconnect-instagram-insights">Disconnect</button>`:''}${insights?`<p>Last sync: ${escapeHtml(insights.syncedAt)} · ${media.length} owned Reels checked. Missing metrics stay unknown.</p><div class="ig-insight-list">${rows||'<p>No Reels returned by the authorized Instagram account.</p>'}</div>`:''}<p class="research-source-note">Only your authorized account’s media/Insights are read. Selected metrics are sent to Meta during sync. Competitor references remain research-only.</p>`);
  document.querySelector('#sync-instagram-insights')?.addEventListener('click',async()=>{const button=document.querySelector('#sync-instagram-insights');button.disabled=true;button.textContent='Syncing…';try{const response=await fetch('/api/instagram/sync',{method:'POST'});const data=await parseApiJson(response);if(!response.ok)throw new Error(data.error||'Insights sync failed.');for(const record of saved.learningRuns||[]){const prior=record.performance;if(!prior?.mediaId)continue;const update=data.media.find(item=>item.id===prior.mediaId);if(update){record.performance={...prior,views:update.views,reach:update.reach,likes:update.likes,comments:update.comments,shares:update.shares,saves:update.saves,engagement:update.totalInteractions,totalWatchTime:update.totalWatchTime,watchTime:update.averageWatchTime,publishDate:update.timestamp,metricsStatus:update.insightsStatus,metricSource:'Instagram Graph API',syncedAt:data.syncedAt};record.metricsStatus=update.insightsStatus;}}persist();showToast(`Synced ${data.media.length} of your Reels from the authorized Instagram API.`);await openInstagramConnection();}catch(error){button.disabled=false;showToast(error.message);}});
  document.querySelector('#disconnect-instagram-insights')?.addEventListener('click',async()=>{const response=await fetch('/api/instagram/disconnect',{method:'POST'});if(response.ok){showToast('Instagram token and cached Insights removed from this studio.');await openInstagramConnection();}});
  document.querySelectorAll('[data-link-ig-reel]').forEach(button=>button.addEventListener('click',()=>{const mediaId=button.dataset.linkIgReel,select=document.querySelector(`[data-ig-reel-select="${CSS.escape(mediaId)}"]`);const record=saved.learningRuns?.find(row=>row.reelId===select?.value);const item=media.find(row=>row.id===mediaId);if(!record||!item){showToast('Choose one of your approved reels first.');return;}record.performance={views:item.views,reach:item.reach,likes:item.likes,comments:item.comments,shares:item.shares,saves:item.saves,engagement:item.totalInteractions,totalWatchTime:item.totalWatchTime,watchTime:item.averageWatchTime,retention:null,follows:null,publishDate:item.timestamp,mediaId:item.id,permalink:item.permalink,metricSource:'Instagram Graph API',metricsStatus:item.insightsStatus,syncedAt:insights?.syncedAt};record.metricsStatus=item.insightsStatus;persist();showToast('Authorized Instagram metrics linked to the approved reel.');}));
}

function formatViews(value) { return new Intl.NumberFormat('en-IN', { notation:'compact', maximumFractionDigits:1 }).format(value); }
async function loadResearchStatus() {
  const status = document.querySelector('#live-status');
  try {
    const response = await fetch('/api/status'); const data = await parseApiJson(response);
    if (!response.ok) throw new Error('Start the studio with node server.js to enable live research.');
    const ownInsights=data.instagramInsights?.connected?`<strong class="status-ready">● Your Instagram Insights connected</strong> · @${escapeHtml(data.instagramInsights.username||'account')} · Sync from Instagram setup.`:data.instagramInsights?.configured?'<strong>● Instagram Insights ready to connect</strong> · Authorize a Creator/Business account in Instagram setup.':'<strong>● Instagram Insights not connected</strong> · Configure Meta app credentials, then authorize a Creator/Business account.';
    status.innerHTML = `${data.googleSearch.ready ? '<strong class="status-ready">● Dynamic Google public discovery available</strong> · Indexed Reel URLs only; competitor metrics are not API-verified.' : '<strong>● Google Custom Search API unavailable</strong> · Use the generated public discovery links.'}<br>${data.youtube.ready ? '<strong class="status-ready">● YouTube Data API available</strong> · Search results use current public view counts.' : '<strong>● Live YouTube metrics unavailable</strong> · Optional connector; other research still runs.'}<br>${ownInsights}<br>${data.vision?.configured?'<strong class="status-ready">● Hosted frame analysis available</strong> · Selected frames will be sent to OpenAI.':'<strong>● Visual analysis not configured</strong> · Add OPENAI_API_KEY to enable the approved hosted analyzer.'}`;
    const analyticsStatus=document.querySelector('#analytics-connection-status');if(analyticsStatus)analyticsStatus.textContent=data.instagramInsights?.connected?`Authorized · @${data.instagramInsights.username||'Instagram'}`:data.instagramInsights?.configured?'Ready to authorize a professional account':'Instagram Insights not connected';renderPerformanceLearning();
    document.querySelector('#instagram-source').title = data.instagram.label;
  } catch {
    status.innerHTML = '<strong>● Research server not running</strong> · Start the app with <code>node server.js</code> to connect live sources.';
  }
}

async function searchLiveTrends(event) {
  event.preventDefault();const query=document.querySelector('#trend-query').value.trim();if(!query)return;
  document.querySelector('#production-topic').value=query;document.querySelector('#production-form').requestSubmit();
  document.querySelector('#production-title').scrollIntoView({behavior:'smooth',block:'center'});
}

function addTrendIdea(source, query) {
  if (!source) return;
  if (saved.customReels.some(reel => reel.id === `trend-${source.id}`)) { showToast('You already added an idea from this Short.'); return; }
  const title = `${query[0].toUpperCase()}${query.slice(1)}: a Bharat story`;
  const idea = {
    id:`trend-${source.id}`, title, topic:`Trend-inspired · ${query}`, language:'Hindi', duration:'20 sec', symbol:'✦', tone:'thumb-2',
    copy:`An original ${query} reel shaped by the source Short’s pacing. New narration and visuals; the source video and audio are not reused.`,
    script:`[0–2s · Immediate visual hook] Open on a striking, real detail connected to ${query}.\n[2–4s · Wide reveal] Establish the actual place and atmosphere.\n[4–6s · Close-up] Show an authentic human or cultural detail.\n[6–8s · Motion cut] Change angle on a beat; add foreground depth.\n[8–11s · Story beat] Add one fact-checked Festival of Bharat detail in Hindi.\n[11–14s · Match cuts] Build curiosity through two quick, relevant details.\n[14–17s · Reveal] Show the full festival, landmark, or temple context.\n[17–20s · Payoff] End with a satisfying image and a short viewer question.\n[CTA] Follow Festival of Bharat for stories across India.`,
    visualDirection:VISUAL_DIRECTION,
    fact:'Verify history, dates, location details, and cultural context before rendering.', source:`Trend reference · ${source.title} · ${source.url} · ${formatViews(source.views)} views. Use pacing/topic only; do not reuse source footage or audio.`, audio:'Hindi voiceover · original or properly licensed cinematic instrumental', music:'Use original or properly licensed audio only.',
  };
  saved.customReels.unshift(idea); persist(); render(); document.querySelector('#home').scrollIntoView({ behavior:'smooth' }); showToast('Original reel idea added to your studio.');
}

document.querySelector('#refresh-batch').addEventListener('click', () => {document.querySelector('#production-topic').focus();document.querySelector('#production-topic').scrollIntoView({behavior:'smooth',block:'center'});});
document.querySelector('#production-form').addEventListener('submit',createProduction);
document.querySelector('#resume-production').addEventListener('click',resumeAutomaticProduction);
document.querySelector('#production-topic').addEventListener('input',event=>{document.querySelector('#trend-query').value=event.target.value;renderInstagramDiscovery(event.target.value||'Indian festivals');});
document.querySelector('#trend-query').addEventListener('input',event=>renderInstagramDiscovery(event.target.value||'Indian festivals'));
document.querySelector('#history-link').addEventListener('click', () => document.querySelector('#history').scrollIntoView({ behavior:'smooth' }));
document.querySelector('#trend-search-form').addEventListener('submit', searchLiveTrends);
document.querySelector('#instagram-reference-form').addEventListener('submit',saveInstagramReference);
document.querySelector('#asset-search-form').addEventListener('submit',performAssetSearch);
document.querySelector('#local-upload-form').addEventListener('submit',uploadLocalMedia);
document.querySelector('#asset-target').addEventListener('change',renderAssetResults);
document.querySelector('#create-concepts-button').addEventListener('click',()=>createConcepts(false));
document.querySelector('#skip-research-button').addEventListener('click',()=>createConcepts(true));
document.querySelector('#pattern-form').addEventListener('submit',savePatternAnalysis);
document.querySelector('#youtube-source').addEventListener('click', () => { document.querySelector('#youtube-source').classList.add('selected'); document.querySelector('#instagram-source').classList.remove('selected'); document.querySelector('#trend-query').disabled = false; document.querySelector('#trend-search-button').disabled = false; });
document.querySelector('#instagram-source').addEventListener('click', () => {document.querySelector('#instagram-source').classList.add('selected');document.querySelector('#youtube-source').classList.remove('selected');document.querySelector('#instagram-discovery-title').scrollIntoView({behavior:'smooth',block:'center'});});
document.querySelector('.notice-close').addEventListener('click', () => document.querySelector('.notice').remove());
document.querySelector('#profile-button').addEventListener('click', () => showInfo('CREATOR WORKSPACE', '<h2>Your creator workspace</h2><p>Creator sign-in is a preview here. Add a secure authentication provider before using real accounts.</p>'));
document.querySelector('#settings-button').addEventListener('click', () => showInfo('YOUR STUDIO SETTINGS', '<h2>Your daily preferences</h2><div class="settings-row"><span>Daily batch</span><span>4 reels · 6:00 AM IST</span></div><div class="settings-row"><span>Languages</span><span>Hindi · English · Marathi · Gujarati</span></div><div class="settings-row"><span>Length</span><span>10–30 seconds</span></div><div class="settings-row"><span>Visual style</span><span>Cinematic · aerial-style · fast cuts</span></div><div class="settings-row"><span>Topics</span><span>Festivals · landmarks · temples · heritage</span></div><p>Past approvals and rejections are saved on this device so the studio can show your recent decisions.</p>'));

document.querySelector('#trend-setup').onclick=()=>showInfo('VIRAL REFERENCE SOURCES','<h2>Instagram research stays public and source-labelled</h2><p><strong>Instagram:</strong> the currently selected account type is Personal. Public discovery opens topic-expanded Google search results and the supplied seed profiles. You inspect each Reel and record its URL, visible metrics, date, duration and pattern observations. Instagram views entered here are labelled user-observed, never API-verified. The studio does not scrape Instagram, download reference Reels or claim automatic video analysis.</p><p><strong>YouTube Shorts:</strong> an optional restricted <code>YOUTUBE_API_KEY</code> returns current public view counts and basic metadata. Without it, the other available research still runs.</p><p><strong>Pattern analysis:</strong> record hook, opening visual, pacing, shot/story structure, camera language, text, transitions, emotion, curiosity and CTA. Apply broad lessons to new scripts; do not copy exact content.</p><p>Only rights-recorded assets enter final reels. All references remain on their original platforms.</p>');
document.querySelector('#connect-instagram').onclick=openInstagramConnection;
document.querySelector('#settings-button').onclick=()=>showInfo('STUDIO SETTINGS','<h2>Local production settings</h2><div class="settings-row"><span>Output</span><span>1080×1920 · 30 fps · H.264 MP4</span></div><div class="settings-row"><span>Duration</span><span>12 seconds · 8 scenes</span></div><div class="settings-row"><span>Audio</span><span>No music or source audio</span></div><div class="settings-row"><span>Templates</span><span>Moment · Detail · Energy · Meaning</span></div><div class="settings-row"><span>Media</span><span>Wikimedia Commons · creator/licence fields</span></div><p>Concepts, imported media, QC results and decisions are stored locally. Cloud sign-in, daily scheduling and Instagram publishing are not configured.</p>');

(async function hydrateBrowserMedia(){
  if(!window.FOBAssetImport)return;let changed=false;
  for(const reel of saved.customReels||[]){for(const scene of reel.scenes||[]){if(scene.asset?.browserAssetKey){scene.asset=await window.FOBAssetImport.restore(scene.asset);changed=true;}}if(reel.browserMasterKey){const restored=await window.FOBAssetImport.restore(reel);reel.renderUrl=restored.renderUrl;changed=true;}}
  if(changed){persist();render();renderPipeline();}
})();
render();
refreshBackgroundQueue();setInterval(refreshBackgroundQueue,5000);
syncConceptActions();
renderInstagramDiscovery(saved.currentRun?.topic||document.querySelector('#production-topic').value||'Indian festivals');
renderInstagramSearchResults();
renderInstagramReferences();
loadResearchStatus();
showEncoderCapability();
const date = new Intl.DateTimeFormat('en-IN', { weekday:'long', day:'numeric', month:'long' }).format(new Date());
document.querySelector('#today-date').textContent = date.toUpperCase();
if ('serviceWorker' in navigator) window.addEventListener('load', async () => { try { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(reg => reg.unregister())); if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map(key => caches.delete(key))); } } catch {} });