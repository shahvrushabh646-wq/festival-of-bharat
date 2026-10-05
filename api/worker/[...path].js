'use strict';

function hostedStatus(){
  return{
    online:false,
    configured:false,
    paused:false,
    persistent:false,
    renderer:'BROWSER_RENDER_FALLBACK',
    queued:0,
    completed:0,
    failed:0,
    today:{planned:0,completed:0,processing:0,queued:0},
    schedule:{enabled:false,windowOpen:false},
    message:'A persistent worker is not available in Vercel Functions. Use browser rendering in the studio.'
  };
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const method=String(req.method||'GET').toUpperCase();
  const path=Array.isArray(req.query?.path)?req.query.path.map(String):String(req.query?.path||'').split('/').filter(Boolean);
  if(method==='OPTIONS'){
    res.setHeader('Allow','GET, POST, OPTIONS');
    return res.status(204).end();
  }
  if(method!=='GET'&&method!=='POST'){
    res.setHeader('Allow','GET, POST, OPTIONS');
    return res.status(405).json({ok:false,code:'METHOD_NOT_ALLOWED',error:'Method not allowed.'});
  }
  if(method==='GET'&&path.length===1&&path[0]==='status')return res.status(200).json(hostedStatus());
  if(method==='GET'&&path.length===1&&path[0]==='jobs')return res.status(200).json({ok:true,status:hostedStatus(),jobs:[]});
  if(method==='GET'&&path.length===2&&path[0]==='jobs')return res.status(404).json({ok:false,code:'BACKGROUND_WORKER_UNAVAILABLE',error:'No hosted background job exists. Browser rendering is available.'});
  if(method==='POST'&&path[0]==='jobs')return res.status(503).json({ok:false,queued:false,code:'BACKGROUND_WORKER_UNAVAILABLE',message:'Vercel does not provide a persistent FFmpeg worker for this studio. Use browser rendering; no background job was queued.'});
  return res.status(404).json({ok:false,code:'WORKER_ROUTE_NOT_FOUND',error:'Unknown hosted worker route. Browser rendering is available.'});
};