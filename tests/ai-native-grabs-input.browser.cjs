const{chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await install(p);await p.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await p.evaluate(async(smoke)=>{
  const inputs=[],finishers=[],edges=[],shots={},dizzy=[];
  async function setup(fid,side,target='ryu'){
   FIN.clear('test');await SF2AI.configure({p1:side?target:'ryu',p2:side?'ryu':target,mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;const w=P[side],d=w.opp;AICFG.selectedProfiles[side]=null;setfighter(w,fid);resetround();G.gph=1;w.WINS=d.WINS=0;w.X=360*256;d.X=(360+(side?-40:40))*256;w.FACE=side?0:1;d.FACE=1-w.FACE;w.HP=d.HP=1000;return{w,d,step:(keys=0)=>{const a=[0,0];a[side]=keys;SF2.step(a);}};
  }
  for(const fid of[1,7,9,10])for(const side of[0,1]){const{w,d}=await setup(fid,side);d.ST=5;d.STUN=170;d.DIZZY=2;const admitted=trythrow(w,fid===1?2:1);dizzy.push({fid,side,admitted,dizzy:d.DIZZY});}
  if(smoke)return{inputs,finishers,edges,shots,dizzy};
  for(const side of[0,1])for(const[fid,button]of[[1,1],[1,2],[1,5],[6,1],[6,2],[6,4],[6,5],[7,1],[7,2],[9,2],[10,1]]){
   const{w,d,step}=await setup(fid,side);for(let n=0;n<8;n++)step((side?1:2)|(16<<button));inputs.push({fid,button,side,name:w.AINativeGrab?.name||w.anim.name,held:!!(w.AINativeGrab||w.CEHH)});
  }
  for(const side of[0,1])for(const motion of[false,true]){
   const{w,d,step}=await setup(6,side);if(motion){for(const k of[side?1:2,8,side?2:1,16])for(let n=0;n<3;n++)step(k);}else for(let n=0;n<4;n++)step(SF2AIRULES.mapping(w)[0].mask);
   inputs.push({fid:6,side,motion,name:w.AINativeGrab?.name,held:!!w.AINativeGrab});
  }
  for(const side of[0,1])for(const target of['ryu','andore']){
   const{w,d,step}=await setup(6,side,target);w.WINS=1;d.HP=1;hpDamage(d,20);for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)step();const accepted=FIN.request(side,SF2AIRULES.mapping(w)[0],{fresh:true,serial:G.tick});let peak=0;
   for(let n=0;n<4200&&FIN.active();n++){step();peak=Math.max(peak,w.Y/256);if(!side&&target==='andore'&&w.AINativeGrab?.phase===2&&!shots.spdAir){SF2CECAMERA.latch(P);SF2.render();shots.spdAir=c.toDataURL();}}
   const info=FIN.info();finishers.push({side,target,accepted,phase:info.phase,hits:info.contacts,targetHits:info.targetHits,peak,links:!!(w.AINativeGrab||d.AINativeHeld||d.AIFFHeld||d.CETHV),abort:G.AIFinisherAbort||null});delete G.AIFinisherAbort;
   SF2AI.resetRound();if(w.AINativeGrab||d.AINativeHeld||d.AIFFHeld)throw Error('Reset leaked native grab');
  }
  for(const fid of[1,6,7,9,10])for(const side of[0,1]){
   const{w,d,step}=await setup(fid,side,'andore'),room=aiRoom();w.X=(side?room.right-50:room.left+50)*256;d.X=w.X+(side?-40:40)*256;if(fid===6)startspec(w,[],33);else trythrow(w,fid===1?2:1);
   let outside=0;for(let n=0;n<900;n++){step();if(w.X/256<room.left||w.X/256>room.right||d.X/256<room.left||d.X/256>room.right)outside++;}edges.push({fid,side,outside,links:!!(w.AINativeGrab||d.AINativeHeld||w.CEHH||d.CEHHV)});
  }
  return{inputs,finishers,edges,shots,dizzy};
 },process.env.SF2_NATIVE_SMOKE==='1');
 for(const[name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts('native-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;fs.writeFileSync(artifacts('native-grabs-input.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify({result,errors},null,2));assert.deepEqual(errors,[]);for(const r of result.dizzy){assert.ok(r.admitted);assert.equal(r.dizzy,0);}for(const r of result.inputs){assert.ok(r.held,JSON.stringify(r));if(r.motion!==undefined)assert.equal(r.name,'giefSPD');}for(const r of result.finishers){assert.ok(r.accepted);assert.equal(r.phase,'result');assert.equal(r.hits,r.targetHits);assert.ok(r.peak>140);assert.equal(r.links,false);assert.equal(r.abort,null);}for(const r of result.edges){assert.equal(r.outside,0);assert.equal(r.links,false);}
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
