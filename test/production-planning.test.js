const test=require('node:test');
const assert=require('node:assert/strict');
const plan=require('../production-planning.js');

test('four creative pillars generate eight-scene plans',()=>{
  for(const pillar of Object.keys(plan.PILLARS)){
    const scenes=plan.planScenes('Ganesh Chaturthi Mumbai',pillar);
    assert.equal(scenes.length,8);
    assert.ok(scenes.every(scene=>scene.seconds>0));
  }
});

test('viral reference filter rejects unverified or sub-100K references',()=>{
  const valid={source:'YouTube Shorts',metricSource:'YouTube Data API',views:500000,durationSeconds:12,url:'https://www.youtube.com/shorts/test'};
  assert.equal(plan.filterVerifiedViralReferences([valid]).length,1);
  assert.equal(plan.filterVerifiedViralReferences([{...valid,views:99999}]).length,0);
});

test('learning data stays disconnected until real metrics exist',()=>{
  const record=plan.performanceRecord({id:'test',topic:'Ganesh Chaturthi',pillar:'The Moment',scenes:[]},'approved');
  assert.equal(record.views,null);
  assert.equal(record.metricsStatus,'NOT CONNECTED');
});
