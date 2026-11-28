const{chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch(),page=await b.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const rows=[],escape=[],interrupts=[],exits=[];
  async function setup(fid,side,target='ryu'){
   FIN.clear('test');await SF2AI.configure({p1:side?target:'ryu',p2:side?'ryu':target,mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;
   const w=P[side],d=w.opp;AICFG.selectedProfiles[side]=null;setfighter(w,fid);resetround();G.gph=1;w.WINS=d.WINS=0;w.X=360*256;d.X=(360+(side?-40:40))*256;w.FACE=side?0:1;d.FACE=1-w.FACE;w.KEYS=d.KEYS=0;w.HP=d.HP=1000;d.DIZZY=w.DIZZY=0;
   return{w,d,step:(keys=0)=>{const a=[0,0];a[d.i]=keys;SF2.step(a);}};
  }
  const actions=[...[1,2,5].map(button=>({fid:1,button})),...[1,2,4,5].map(button=>({fid:6,button})),...[0,1,2].map(strength=>({fid:6,kind:'spd',strength})),...[1,2].map(button=>({fid:6,kind:'crouch',button})),...[1,2].map(button=>({fid:7,button})),...[1,2].map(button=>({fid:9,button})),...[1,2].map(button=>({fid:10,button}))];
  for(const a of actions)for(const side of[0,1])for(const target of['ryu','andore']){
   const{w,d,step}=await setup(a.fid,side,target),hits=[];let previousHP=d.HP;
   const x=w.X/256,face=w.FACE;let admitted;if(a.kind==='spd')admitted=startspec(w,[],(a.strength<<4)|1);else if(a.kind==='crouch'){w.KEYS=8;admitted=zgrab(w,a.button);w.KEYS=0;}else admitted=trythrow(w,a.button);
   const poses=new Set(),victimPoses=new Set();let peak=0,maxTravel=0,ticks=0,releaseDir=null;
   for(;ticks<900;ticks++){step();if(d.HP<previousHP)hits.push({tick:G.tick,y:w.Y/256,victimY:d.Y/256,phase:w.AINativeGrab?.phase,entry:w.aidx,code:w.anim.name,damage:previousHP-d.HP});previousHP=d.HP;if(d.CETHV?.kind==='fall'&&releaseDir===null)releaseDir=d.CETHV.dir;poses.add(w.cur+':'+w.aidx);victimPoses.add(d.cur+':'+d.aidx);peak=Math.max(peak,w.Y/256);maxTravel=Math.max(maxTravel,Math.abs(w.X/256-x));if(ticks>80&&!w.AINativeGrab&&!d.AINativeHeld&&!w.CEHH&&!d.CEHHV&&!d.CETHV&&w.ST===0&&d.ST===0)break;}
   rows.push({...a,side,target,admitted,ticks,peak,maxTravel,releaseDir,poses:poses.size,victimPoses:victimPoses.size,hits,damage:1000-d.HP,state:[w.ST,d.ST],links:!!(w.AINativeGrab||d.AINativeHeld||w.CEHH||d.CEHHV||d.CETHV),finalFace:w.FACE,initialFace:face});
  }
  for(const fid of[1,7,10])for(const side of[0,1]){
   for(const mash of[false,true]){
    const{w,d,step}=await setup(fid,side);trythrow(w,fid===1?2:1);let n=0;for(;n<100&&(w.AINativeGrab||w.CEHH);n++)step(mash?(n%2?0:10|16):8|16);escape.push({fid,side,mash,ticks:n,held:!!(w.AINativeGrab||w.CEHH)});
   }
  }
  for(const fid of[1,6,7,9,10])for(const side of[0,1]){
   const{w,d,step}=await setup(fid,side,'andore');if(fid===6)startspec(w,[],33);else trythrow(w,fid===1?2:1);for(let n=0;n<(fid===6?45:8);n++)step();const before=!!(d.AINativeHeld||d.CEHHV);
   applyhit(w,1,0,0,0,w.FACE?1:-1,0,1);for(let n=0;n<300;n++)step();interrupts.push({fid,side,before,held:!!(w.AINativeGrab||d.AINativeHeld||w.CEHH||d.CEHHV||d.CETHV),states:[w.ST,d.ST]});
  }
  for(const fid of[6,7,9,10])for(const reason of['death','round','reset']){
   const{w,d,step}=await setup(fid,0,'andore');if(fid===6)startspec(w,[],33);else trythrow(w,1);for(let n=0;n<45;n++)step();if(reason==='death')hpDamage(w,2000);else if(reason==='round')G.gph=2;else SF2AI.resetRound();for(let n=0;n<300;n++)step();exits.push({fid,reason,links:!!(w.AINativeGrab||d.AINativeHeld||d.AIFFHeld),finite:P.every(p=>Number.isFinite(p.X)&&Number.isFinite(p.Y)),state:P.map(p=>p.ST)});
  }
  return{rows,escape,interrupts,exits};
 });
 fs.writeFileSync(artifacts('native-grabs.json'),JSON.stringify({result,errors},null,2));const bad=result.rows.filter(r=>!r.admitted||r.links||r.state.some(s=>s!==0)||r.damage<=0||r.poses<2||r.kind==='spd'&&(r.hits.length!==1||r.hits[0].y!==0||r.peak<140)||r.fid===9&&(r.hits.length!==1||r.hits[0].tick<38||r.maxTravel>30));console.log(JSON.stringify({cases:result.rows.length,errors,bad,escape:result.escape,interrupts:result.interrupts},null,2));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 for(const r of result.rows)if(r.fid===9){assert.equal(r.releaseDir,-(r.initialFace?1:-1));assert.equal(r.finalFace,1-r.initialFace);}
 for(const r of result.escape)if(r.mash)assert.equal(r.held,false);else assert.equal(r.held,true);
 for(const r of result.exits){assert.equal(r.links,false);assert.ok(r.finite,JSON.stringify(r));}
 for(const r of result.interrupts){assert.ok(r.before);assert.equal(r.held,false);assert.deepEqual(r.states,[0,0]);}
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
