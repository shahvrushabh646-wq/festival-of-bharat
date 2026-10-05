'use strict';
const {verifyProduction}=require('./verify-production.js');

async function main(){
  for(let index=0;index<4;index++){
    const result=await verifyProduction(index);
    if(result?.status!=='READY_FOR_REVIEW'){
      console.error(`Overnight verification FAILED: reel ${index+1}/4 did not pass.`);
      process.exitCode=1;
      return;
    }
  }
  console.log('Overnight verification PASSED: 4/4 independent real-render acceptance fixtures completed and passed QC sequentially.');
}

main().catch(error=>{
  console.error(`Could not run four-reel verifier: ${error.message}`);
  process.exitCode=1;
});
