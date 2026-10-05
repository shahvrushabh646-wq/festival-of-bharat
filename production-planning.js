/* Shared, deterministic planning helpers. Visual inspection is explicitly metadata-only. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FOBProductionPlanning = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PILLARS = {
    'The Moment': [
      ['HOOK','A surprising human action at the heart of {topic}.','VIDEO PREFERRED','close-up','fast push','hard cut',0.8,'Movement opens a question before the setting is revealed.'],
      ['ESTABLISHING','Reveal the place surrounding {topic}.','VIDEO PREFERRED','wide establishing','slow pull-back','hard cut',1.5,'The wider view answers where the opening action happened.'],
      ['CONTEXT','Show a person preparing for this moment.','EITHER','moving medium','pan right','match cut',1.4,'Preparation gives the event a human lead-in.'],
      ['DETAIL','Cut to a meaningful ritual detail.','PHOTO PREFERRED','detail insert','static cinematic frame','match cut',1.0,'A close detail makes the tradition tangible.'],
      ['HUMAN MOMENT','Hold on a real expression or shared gesture.','VIDEO PREFERRED','portrait close-up','slow push','hard cut',1.6,'A human response gives the detail emotional weight.'],
      ['CULTURE','Reveal the community sharing the moment.','VIDEO PREFERRED','wide movement','pan left','hard cut',1.5,'The frame expands from one person to the community.'],
      ['MEANING','Connect the moment to its cultural meaning.','PHOTO PREFERRED','human detail','vertical reveal','soft reveal',1.8,'A calmer image gives the story room to explain its meaning.'],
      ['PAYOFF','End on the emotional payoff in {topic}.','VIDEO PREFERRED','payoff wide','slow pull-back','match cut',1.4,'The final wide image resolves the opening question.']
    ],
    'The Detail': [
      ['HOOK','Open on an intricate detail from {topic}.','PHOTO PREFERRED','macro close-up','slow push','hard cut',1.0,'Texture creates curiosity before the object is identified.'],
      ['CONTEXT','Reveal the object and its real setting.','EITHER','close-up','vertical reveal','match cut',1.3,'The reveal identifies what the opening texture belongs to.'],
      ['DETAIL','Show material, texture, craft or offering close.','PHOTO PREFERRED','macro detail','pan right','hard cut',1.2,'A second angle confirms the physical detail.'],
      ['HUMAN MOMENT','Match cut to a hand or artisan in action.','VIDEO PREFERRED','human detail','slow push','match cut',1.4,'Human action connects the object to its maker or use.'],
      ['DETAIL','Reveal a related detail that raises a question.','EITHER','detail insert','pan left','hard cut',1.0,'A related shape or material extends the visual question.'],
      ['ESTABLISHING','Show how the detail fits the wider scene.','VIDEO PREFERRED','wide establishing','slow pull-back','hard cut',1.7,'The context explains where this detail belongs.'],
      ['HISTORY','Give one verified historical or cultural fact.','PHOTO PREFERRED','heritage close-up','static cinematic frame','soft reveal',1.8,'A still heritage view lets the verified fact register.'],
      ['PAYOFF','End with the detail in its full context.','VIDEO PREFERRED','payoff wide','slow pull-back','match cut',1.6,'The final composition connects the detail back to the whole.']
    ],
    'The Energy': [
      ['HOOK','Open at the peak of movement in {topic}.','VIDEO PREFERRED','action close-up','fast push','hard cut',0.8,'Immediate motion signals the reel’s energy.'],
      ['ESTABLISHING','Cut wide to show the crowd and place.','VIDEO PREFERRED','wide movement','pan right','hard cut',1.1,'The wide shot reveals the scale behind the action.'],
      ['ENERGY','Track a rhythmic action at ground level.','VIDEO PREFERRED','low tracking move','pan left','match cut',1.2,'Movement continues in the same direction for visual flow.'],
      ['DETAIL','Cut close to hands, feet, fabric or instruments.','EITHER','detail insert','fast push','hard cut',1.0,'A close rhythmic detail adds texture between wide shots.'],
      ['ENERGY','Follow a turn, procession or shared gesture.','VIDEO PREFERRED','moving medium','pan right','match cut',1.3,'The action grows from a detail into a shared gesture.'],
      ['CULTURE','Change angle and reveal the scale.','VIDEO PREFERRED','wide establishing','vertical reveal','hard cut',1.4,'A fresh angle keeps the movement from feeling repetitive.'],
      ['CONTEXT','Give a brief breath before the final build.','PHOTO PREFERRED','human moment','static cinematic frame','soft reveal',1.8,'A short visual pause makes the final burst feel stronger.'],
      ['PAYOFF','End with the group moving together.','VIDEO PREFERRED','payoff wide','slow pull-back','match cut',1.5,'The group action resolves the individual movement motifs.']
    ],
    'The Meaning': [
      ['HOOK','Ask a visual question about {topic}.','VIDEO PREFERRED','symbol close-up','slow push','hard cut',1.1,'A specific symbol creates a question the story can answer.'],
      ['ESTABLISHING','Establish the real place in natural light.','VIDEO PREFERRED','wide establishing','slow pull-back','hard cut',1.7,'The location grounds the question in a real place.'],
      ['BELIEF','Show a symbol or ritual detail accurately.','PHOTO PREFERRED','detail insert','static cinematic frame','match cut',1.5,'The detail introduces the tradition without inventing a claim.'],
      ['HUMAN MOMENT','Show a participant carrying the tradition.','VIDEO PREFERRED','portrait close-up','slow push','hard cut',1.7,'A participant makes the tradition present and human.'],
      ['HISTORY','Show a verified historical or devotional link.','PHOTO PREFERRED','heritage close-up','vertical reveal','soft reveal',2.0,'The slower heritage frame creates room for context.'],
      ['MEANING','Contrast a close human moment with the wide place.','EITHER','wide movement','slow pull-back','match cut',1.8,'The contrast connects personal practice to shared place.'],
      ['CONTEXT','Let the visual answer the opening question.','VIDEO PREFERRED','human detail','pan right','hard cut',1.8,'The answer returns to the symbol established at the start.'],
      ['PAYOFF','End on a quiet reveal and thoughtful invitation.','EITHER','payoff wide','static cinematic frame','soft reveal',1.8,'A quiet final image gives the meaning a memorable landing.']
    ]
  };
  const STATES = ['QUEUED','RESEARCHING','PLANNING','COLLECTING_ASSETS','VALIDATING_RIGHTS','EDITING','RENDERING','QC','READY_FOR_REVIEW','APPROVED','REJECTED','FAILED','RETRYING'];
  const ALLOWED = {
    QUEUED:['RESEARCHING','FAILED'], RESEARCHING:['PLANNING','RETRYING','FAILED'], PLANNING:['COLLECTING_ASSETS','RETRYING','FAILED'],
    COLLECTING_ASSETS:['VALIDATING_RIGHTS','RETRYING','FAILED'], VALIDATING_RIGHTS:['EDITING','RETRYING','FAILED'], EDITING:['RENDERING','RETRYING','FAILED'],
    RENDERING:['QC','RETRYING','FAILED'], QC:['READY_FOR_REVIEW','RETRYING','FAILED'], READY_FOR_REVIEW:['APPROVED','REJECTED','RETRYING'],
    RETRYING:['RESEARCHING','PLANNING','COLLECTING_ASSETS','VALIDATING_RIGHTS','EDITING','RENDERING','QC','FAILED'], APPROVED:[], REJECTED:[], FAILED:['RETRYING']
  };
  const STORY_PURPOSE={HOOK:'Create an unanswered visual question immediately.',ESTABLISHING:'Place the action in a legible real-world setting.',CONTEXT:'Show who is preparing and what is happening.',DETAIL:'Make a tactile cultural detail visible.',HUMAN_MOMENT:'Connect the tradition to a person or shared gesture.',CULTURE:'Expand the moment from an individual to its community.',HISTORY:'Offer a place for one verified historical fact.',BELIEF:'Show a visible symbol or ritual without interpreting beyond evidence.',ENERGY:'Carry movement forward and build intensity.',MEANING:'Connect the visible moment to cultural context.',PAYOFF:'Resolve the opening question with a final image or invitation.'};
  const VISUAL_PURPOSE={'wide establishing':'Reveal geography and scale.','macro close-up':'Make material and texture legible.','detail insert':'Isolate a meaningful visual cue.','portrait close-up':'Make the human response readable.','low tracking move':'Keep visible motion moving through the frame.','action close-up':'Start in the middle of physical action.','moving medium':'Bridge intimate detail and environment.','payoff wide':'Resolve with a complete final composition.'};
  function learnCreativeDirection(records,pillar,minSample=3) {
    const rows=(records||[]).filter(row=>row?.metricsStatus==='API_VERIFIED'&&row?.performance&&Number.isFinite(Number(row.performance.views))&&Number.isFinite(Number(row.duration))&&(row.concept?.pillar||row.pillar)===pillar);
    if(rows.length<minSample)return{status:'INSUFFICIENT_DATA',sampleSize:rows.length,minimumSample:minSample,pillar};
    const top=rows.slice().sort((a,b)=>Number(b.performance.views)-Number(a.performance.views)).slice(0,Math.max(1,Math.ceil(rows.length/3)));
    const durations=top.map(row=>Number(row.duration)).sort((a,b)=>a-b);const duration=durations[Math.floor(durations.length/2)];
    return{status:'OBSERVATION',pillar,sampleSize:rows.length,highViewSubsetSize:top.length,targetDuration:Math.max(10,Math.min(20,Math.round(duration*10)/10)),basis:'Median duration among the highest-view third of your linked, API-verified reels in this pillar. Exploratory and descriptive, not causal.'};
  }
  function planScenes(topic, pillar, direction=null) {
    const plan=PILLARS[pillar]; if(!plan) throw new Error(`Unknown creative pillar: ${pillar}`);
    const defaultDuration=plan.reduce((sum,row)=>sum+row[6],0);const scale=direction?.status==='OBSERVATION'&&direction.pillar===pillar?direction.targetDuration/defaultDuration:1;
    const scenes=plan.map((row,index)=>{
      const [role,description,mediaPreference,shotType,cameraMovement,transition,seconds,whyThisShot]=row;
      const formatted=description.replaceAll('{topic}',String(topic||'the tradition'));
      const next=plan[(index+1)%plan.length];
      const relationship=index===plan.length-1?'Close on a visual or emotional echo of the opening.':`${shotType} leads into ${next[3]}: ${next[0].toLowerCase()} follows ${role.toLowerCase()}.`;
      return {sceneNumber:index+1,role,description:formatted,visualRequirement:formatted,mediaPreference,mediaRequirement:mediaPreference,shotType,cameraMovement,transition,seconds:Math.max(.5,Math.round(seconds*scale*10)/10),whyThisShot,storyPurpose:STORY_PURPOSE[role]||'Advance the specific story beat.',visualPurpose:VISUAL_PURPOSE[shotType]||`Use a ${shotType} composition to make the scene requirement clear.`,transitionReason:`${transition} carries the ${role.toLowerCase()} beat into ${next[0].toLowerCase()} without adding decoration.`,nextShotRelationship:relationship,continuityFromPrevious:index?`${plan[index-1][3]} into ${shotType}: ${whyThisShot}`:'Open with the pillar-specific visual question.',emotionalProgression:pillar==='The Energy'?'intensity':pillar==='The Meaning'?'reflection':pillar==='The Detail'?'curiosity':role==='HUMAN MOMENT'?'connection':'anticipation',learningObservation:direction?.status==='OBSERVATION'?direction:null,textTreatment:role==='HOOK'?'hook':role==='HISTORY'?'historical fact':role==='MEANING'?'meaning':role==='PAYOFF'?'payoff':'context',asset:null,narration:'',onScreenText:index===0?String(topic||''):formatted.split(/\s+/).slice(0,5).join(' '),text:index===0?String(topic||''):formatted.split(/\s+/).slice(0,5).join(' ')};
    });
    if(direction?.status==='OBSERVATION'&&direction.pillar===pillar){let delta=Math.round((direction.targetDuration-scenes.reduce((sum,scene)=>sum+scene.seconds,0))*10)/10;for(const scene of [...scenes].reverse()){if(Math.abs(delta)<.01)break;const change=delta>0?Math.min(delta,6-scene.seconds):Math.max(delta,.5-scene.seconds);scene.seconds=Math.round((scene.seconds+change)*10)/10;delta=Math.round((delta-change)*10)/10;}}
    return scenes;
  }
  function analyzeAsset(asset) {
    const width=Number(asset?.width)||0,height=Number(asset?.height)||0,title=String(asset?.title||asset?.filename||'');
    return {analysisMode:'METADATA',actualVisualAnalysis:false,subjects:[],faces:null,peopleCount:null,motion:asset?.mediaType==='video'?'video-file (content not inspected)':'unknown',orientation:width&&height?(width>height?'landscape':width<height?'portrait':'square'):'unknown',resolutionPixels:width*height,titleTerms:title.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean),limitations:'Visual subjects, composition, faces, shot scale and image quality have not been inspected by a computer-vision model.'};
  }
  function normalizedAssetUrl(value){try{const url=new URL(String(value));url.hash='';url.search='';url.hostname=url.hostname.toLowerCase();return url.toString().replace(/\/$/,'');}catch{return String(value||'').trim().toLowerCase();}}
  function assetIdentityKeys(asset){const pageId=asset?.commonsPageId||asset?.id;return[pageId&&`page:${pageId}`,asset?.fileId&&`file:${asset.fileId}`,asset?.hash&&`hash:${asset.hash}`,asset?.filename&&`file:${String(asset.filename).toLowerCase()}`,asset?.pageUrl&&`pageurl:${normalizedAssetUrl(asset.pageUrl)}`,asset?.mediaUrl&&`media:${normalizedAssetUrl(asset.mediaUrl)}`,asset?.sourceUrl&&`source:${normalizedAssetUrl(asset.sourceUrl)}`,...(asset?.identityAliases||[])].filter(Boolean);}
  function tokenWords(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu,' ').split(/\s+/).filter(word=>word.length>2&&!['the','and','for','from','with','show','real','shot','scene','photo','video','wide','close','detail','india','indian'].includes(word));}
  function compatibilityScore(asset,scene,context={}){
    if(!asset?.metadataComplete||!asset.creator||!asset.license||!asset.licenseUrl||!asset.pageUrl||!asset.mediaUrl)return-Infinity;
    const width=Number(asset.width),height=Number(asset.height);if(width<640||height<360)return-Infinity;
    const sceneTerms=tokenWords(`${scene?.description||''} ${scene?.visualRequirement||''} ${scene?.shotType||''}`),topicTerms=tokenWords(context.topic||scene?.topic||'');
    const searchable=tokenWords(`${asset.title||''} ${asset.description||''} ${(asset.categories||[]).join(' ')} ${(asset.subjects||[]).join(' ')} ${(asset.discoveryQueries||[]).join(' ')}`);
    const hitRatio=terms=>terms.length?terms.filter(term=>searchable.some(word=>word.includes(term)||term.includes(word))).length/terms.length:0;
    const topic=30*hitRatio(topicTerms),sceneMatch=25*hitRatio(sceneTerms),vision=asset.visualAnalysis?.actualVisualAnalysis?asset.visualAnalysis:null;
    const visual=20*(vision&&Number.isFinite(Number(vision.sceneMatch))?Math.max(0,Math.min(1,Number(vision.sceneMatch))):Math.max(hitRatio(sceneTerms),hitRatio(topicTerms)*.45));
    const pref=String(scene?.mediaPreference||scene?.mediaRequirement||'EITHER'),media=pref.includes('VIDEO')?(asset.mediaType==='video'?10:7):pref.includes('PHOTO')?(asset.mediaType==='photo'?10:7):8.5;
    const ratio=width/height,shot=String(scene?.shotType||'').toLowerCase();let orientation=7;if(shot.includes('wide')||shot.includes('establish'))orientation=ratio>=1.2?10:ratio>=.75?7:4;else if(shot.includes('close')||shot.includes('portrait')||shot.includes('detail'))orientation=ratio<=1?10:ratio<=1.5?7:4;
    const resolution=5*Math.max(0,Math.min(1,(width*height)/(1920*1080)));return Math.round((topic+sceneMatch+visual+media+orientation+resolution)*100)/100;
  }
  function hungarianMax(scores){const n=scores.length;if(!n)return[];const columns=Math.max(0,...scores.map(row=>row.length)),m=Math.max(n,columns),u=Array(n+1).fill(0),v=Array(m+1).fill(0),p=Array(m+1).fill(0),way=Array(m+1).fill(0),maxScore=Math.max(100,...scores.flat().filter(Number.isFinite));for(let i=1;i<=n;i++){p[0]=i;let j0=0;const minv=Array(m+1).fill(Infinity),used=Array(m+1).fill(false);do{used[j0]=true;const i0=p[j0];let delta=Infinity,j1=0;for(let j=1;j<=m;j++)if(!used[j]){const score=scores[i0-1]?.[j-1],cost=maxScore-(Number.isFinite(score)?score:0),cur=cost-u[i0]-v[j];if(cur<minv[j]){minv[j]=cur;way[j]=j0;}if(minv[j]<delta){delta=minv[j];j1=j;}}for(let j=0;j<=m;j++)if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else minv[j]-=delta;j0=j1;}while(p[j0]!==0);do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0!==0);}const result=Array(n).fill(-1);for(let j=1;j<=m;j++)if(p[j])result[p[j]-1]=j-1;return result;}
  function dedupeAssets(candidates){const assets=[],owner=new Map();for(const asset of candidates||[]){if(!asset?.metadataComplete||!asset.creator||!asset.license||!asset.licenseUrl||!asset.pageUrl||!asset.mediaUrl)continue;const keys=assetIdentityKeys(asset),matches=[...new Set(keys.map(key=>owner.get(key)).filter(index=>index!==undefined))];if(!matches.length){const normalized={...asset,identityAliases:[...new Set([...(asset.identityAliases||[]),...keys])]};const index=assets.push(normalized)-1;for(const key of keys)owner.set(key,index);continue;}const target=matches[0],merged=(left,right)=>({...left,...right,identityAliases:[...new Set([...assetIdentityKeys(left),...assetIdentityKeys(right)])],categories:[...new Set([...(left.categories||[]),...(right.categories||[])])],discoveryQueries:[...new Set([...(left.discoveryQueries||[]),...(right.discoveryQueries||[])])]});assets[target]=merged(assets[target],asset);for(const key of assetIdentityKeys(assets[target]))owner.set(key,target);for(const extra of matches.slice(1)){if(extra===target||!assets[extra])continue;assets[target]=merged(assets[target],assets[extra]);for(const key of assetIdentityKeys(assets[extra]))owner.set(key,target);assets[extra]=null;}}return assets.filter(Boolean);}
  function assignAssetsToScenes(scenes,candidates,context={}){const assets=dedupeAssets(candidates),scores=(scenes||[]).map(scene=>assets.map(asset=>compatibilityScore(asset,scene,{...context,topic:context.topic||scene.topic}))),assignment=hungarianMax(scores);return(scenes||[]).map((scene,index)=>{const ci=assignment[index],asset=ci>=0&&ci<assets.length?assets[ci]:null,score=asset?scores[index][ci]:-Infinity;return asset&&score>0?{scene,asset,score,candidateIndex:ci}:{scene,asset:null,score:null,candidateIndex:-1};});}
  function rankAsset(asset,context={}) {
    if(!asset?.metadataComplete||!asset.creator||!asset.license||!asset.licenseUrl||!asset.pageUrl) return -Infinity;
    const used=context.usedIds||new Set();if(assetIdentityKeys(asset).some(key=>used.has(key))) return -Infinity;
    const analysis=analyzeAsset(asset);const terms=(context.terms||[]).map(v=>String(v).toLowerCase()).filter(Boolean);
    const searchable=`${asset.title||''} ${asset.description||''} ${(asset.categories||[]).join(' ')} ${(asset.subjects||[]).join(' ')}`.toLowerCase();const hits=terms.filter(term=>searchable.includes(term)).length;
    const relevance=hits/Math.max(1,terms.length),pixels=analysis.resolutionPixels;
    if(!analysis.orientation||Number(asset.width)<640||Number(asset.height)<360)return -Infinity;
    const resolution=Math.min(1,pixels/(1920*1080));const ratio=Number(asset.width)/Number(asset.height);const orientation=ratio>=.48&&ratio<=1.65?1:ratio>=.3&&ratio<=2.2?.55:.2;
    const preference=context.mediaPreference||'EITHER';const mediaFit=preference==='EITHER'?.85:asset.mediaType===(preference==='VIDEO PREFERRED'?'video':'photo')?1:.7;
    const cultural=/(india|indian|temple|festival|ganesh|ganpati|devot|ritual|heritage|tradition|pilgrim|puja|idol)/i.test(searchable)?1:.25;
    const vision=asset.visualAnalysis?.actualVisualAnalysis?asset.visualAnalysis:null;
    const sceneFit=vision&&Number.isFinite(Number(vision.sceneMatch))?Math.max(0,Math.min(1,Number(vision.sceneMatch))):null;
    if(sceneFit!==null&&sceneFit<.25)return -Infinity;
    const visualQuality=vision?.visualQuality!==null&&vision?.visualQuality!==undefined?Math.max(0,Math.min(1,Number(vision.visualQuality))):resolution;
    const confidence=vision&&Number.isFinite(Number(vision.confidence))?Math.max(0,Math.min(1,Number(vision.confidence))):null;
    const motionFit=asset.mediaType==='video'?(vision?.motion&&vision.motion!=='static'?1:.7):.8;
    const reliability=asset.license&&asset.pageUrl&&asset.creator?1:.2;
    const relationship=context.previousScene?.asset?.visualAnalysis?.subjects?.length&&vision?.subjects?.length?overlap(context.previousScene.asset.visualAnalysis.subjects,vision.subjects):.5;
    const weighted=(relevance*.22+cultural*.09+visualQuality*.10+resolution*.08+orientation*.07+mediaFit*.06+reliability*.10+motionFit*.06+(sceneFit===null?.5:sceneFit)*.14+(confidence===null?.5:confidence)*.04+relationship*.04);
    return Math.round(weighted*100);
  }
  function overlap(left,right){const a=new Set(left.map(value=>String(value).toLowerCase()));const b=new Set(right.map(value=>String(value).toLowerCase()));const common=[...a].filter(value=>b.has(value)).length;return common/Math.max(1,Math.min(a.size,b.size));}
  function transitionState(current,next) {
    if(!STATES.includes(current)||!STATES.includes(next))throw new Error('Unknown production state.');
    if(!ALLOWED[current].includes(next))throw new Error(`Invalid production transition: ${current} → ${next}.`);
    return {state:next,updatedAt:new Date().toISOString()};
  }
  function performanceRecord(reel,decision) {
    const scenes=reel?.scenes||[],video=scenes.filter(s=>s.asset?.mediaType==='video').length,photo=scenes.filter(s=>s.asset?.mediaType==='photo').length;
    return {reelId:reel?.id||null,topic:reel?.topic||'',pillar:reel?.pillar||'',hookType:reel?.pillar||null,duration:Number(reel?.qc?.duration)||null,shotCount:scenes.length,videoPercentage:scenes.length?Math.round(video/scenes.length*100):null,photoPercentage:scenes.length?Math.round(photo/scenes.length*100):null,openingVisual:scenes[0]?.role||null,textStyle:reel?.template||null,transitionStyle:[...new Set(scenes.map(s=>s.transition).filter(Boolean))],CTA:reel?.caption||null,views:null,reach:null,likes:null,comments:null,shares:null,saves:null,engagement:null,watchTime:null,retention:null,follows:null,publishDate:null,metricsStatus:'NOT CONNECTED',decision:decision||null,recordedAt:new Date().toISOString()};
  }
  function summarizeLearning(records,field,minSample=5) {
    const known=(records||[]).filter(row=>row?.performance?.[field]!==null&&row?.performance?.[field]!==undefined&&row?.performance?.[field]!==''&&Number.isFinite(Number(row.performance[field])));
    if(known.length<minSample)return {status:'INSUFFICIENT_DATA',sampleSize:known.length,minimumSample:minSample,observation:null};
    const avg=known.reduce((sum,row)=>sum+Number(row.performance[field]),0)/known.length;
    return {status:'OBSERVATION',sampleSize:known.length,minimumSample:minSample,average:avg,observation:`Observed average ${field}: ${avg.toFixed(1)} across ${known.length} connected records. This is descriptive, not causal.`};
  }
  function filterVerifiedViralReferences(references,minimumViews=100000){return(references||[]).filter(item=>item?.source==='YouTube Shorts'&&item?.metricSource==='YouTube Data API'&&Number.isFinite(Number(item.views))&&Number(item.views)>=minimumViews&&Number(item.durationSeconds)>=10&&Number(item.durationSeconds)<=30&&/^https:\/\/www\.youtube\.com\/(shorts|watch)\//.test(String(item.url||'')));}
  return {PILLARS,STATES,planScenes,analyzeAsset,assetIdentityKeys,rankAsset,compatibilityScore,assignAssetsToScenes,transitionState,performanceRecord,summarizeLearning,learnCreativeDirection,filterVerifiedViralReferences};
});