const assert=require('node:assert/strict');require('../ssf2t-ai/ai-shortcuts.js');
const C=globalThis.SSF2TAIShortcuts;
function fixture(enabled=true,id=0){
 const controller=C.create({enabled}),state={ready:true,frame:0,gameStep:4,matchStep:10,playersIn:3,players:[{id,hp:144,state:0,y:40},{id:4,hp:144,state:0,y:40}]};let meter=48;
 const api={state:()=>state,read:(address)=>address===0xff8460?1:address===0xff8860?0:[0xff8702,0xff8b02].includes(address)?meter:0};
 const step=(input=[0,0])=>{state.frame++;const original=input.slice(),out=controller.process(api,input);assert.deepEqual(input,original);return out;};
 return{controller,state,step,setMeter:v=>meter=v};
}
let checks=0;
{
 const f=fixture(false);for(let mask=0;mask<4096;mask++){assert.deepEqual(f.step([mask,mask^4095]),[mask,mask^4095]);checks++;}
}
{
 const f=fixture();for(const gameStep of[0,2,6,8])for(const matchStep of[0,2,4,10]){f.state.gameStep=gameStep;f.state.matchStep=matchStep;assert.deepEqual(f.step([144,544]),[144,544]);checks++;}
 f.state.gameStep=4;f.state.matchStep=4;assert.deepEqual(f.step([144,544]),[144,544]);checks++;
}
{
 const f=fixture();f.step();for(const keys of[112,896,1008,144|32])assert.deepEqual(f.step([keys,keys]),[keys,keys]);checks+=4;
}
{
 const f=fixture();f.step();assert.notEqual(f.step([144,0])[0],144);for(let i=0;i<20;i++)f.step([144,0]);assert.equal(f.controller.info().players[0].pending,0);assert.equal(f.step([144,0])[0],0);f.step();f.step([144,0]);assert.ok(f.controller.info().players[0].pending>0);checks+=4;
 f.state.players[0].state=14;assert.equal(f.step([2,0])[0],2);assert.equal(f.controller.info().players[0].pending,0);assert.equal(f.controller.info().players[0].last.status,'interrupted');checks+=3;
}
{
 const f=fixture();f.step();f.setMeter(0);assert.equal(f.step([544,0])[0],0);assert.equal(f.controller.info().players[0].last.status,'meter-needed');assert.equal(f.controller.info().players[0].pending,0);checks+=3;
 f.controller.reset();f.setMeter(48);assert.deepEqual(f.step([544,0]),[544,0]);assert.equal(f.controller.info().players[0].pending,0);checks+=2;
}
{
 const f=fixture(true,13);f.step();f.step([544,0]);f.state.players[0].y=60;f.step();f.state.players[0].y=40;f.step();assert.equal(f.controller.info().players[0].pending,0);assert.equal(f.controller.info().players[0].last.status,'missed-buffer');assert.equal(f.step([1,0])[0],1);checks+=3;
}
console.log(JSON.stringify({checks,disabledIdentityMasks:4096,menuPassThrough:true,heldChordSuppression:true,hitInterruption:true,missedBufferRelease:true}));
