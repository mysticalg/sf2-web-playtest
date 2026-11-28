const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const rows=[],contacts=[],bites=[],staticChecks=[];let context=null,label=null;
  const original={hitcheck,fbhit,ceYogaHit,sfxc,hpDamage,applyhit,healthDamage:SF2.health.damage};
  sfxc=function(code,...rest){if(context)context.cues.push(code);if(label?.kind==='bite'&&code===0x27&&label.lastDamage?.tick===G.tick)bites.push({tick:G.tick,side:label.side,entry:P[label.side].aidx,marker:P[label.side].anim.flags[P[label.side].aidx],damage:label.lastDamage});return original.sfxc(code,...rest);};
  hpDamage=function(p,amount,...rest){if(label?.kind==='bite'&&p.i!==label.side)label.lastDamage={tick:G.tick,amount};return original.hpDamage(p,amount,...rest);};SF2.health.damage=hpDamage;
  applyhit=function(...args){const result=original.applyhit(...args);if(context)context.blocked=result==='blk';return result;};
  function wrap(kind,fn,p,record,run){const outer=context,q=p.opp,hp=q.HP,c={...label,kind,tick:G.tick,raw:record?.[6]??null,cur:p.cur,entry:p.aidx,cues:[]};context=c;try{return run();}finally{c.damage=hp-q.HP;c.blocked??=q.ST===S_BLK;context=outer;if(c.damage>0||c.cues.length)contacts.push(c);}}
  hitcheck=function(p,pr){if(!pr)return original.hitcheck(p,pr);return wrap('melee',original.hitcheck,p,SF2CECOMBAT.record(p),()=>original.hitcheck(p,pr));};
  fbhit=function(p,...rest){return wrap('projectile',original.fbhit,p,SF2CECOMBAT.projectileRecord(p),()=>original.fbhit(p,...rest));};
  ceYogaHit=function(a,p){return wrap('yoga',original.ceYogaHit,p,SF2CEDHALSIM.record(a),()=>original.ceYogaHit(a,p));};
  async function setup(fid,side,distance=55){FIN.clear('impact-audio');await SF2AI.configure({p1:'ryu',p2:'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;AICFG.selectedProfiles[side]=null;setfighter(P[side],fid);resetround();G.gph=1;G.hfz=G.slow=0;const w=P[side],d=w.opp;w.WINS=d.WINS=0;w.X=360*256;d.X=w.X+(side?-distance:distance)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;w.HP=d.HP=10000;w.DIZZY=d.DIZZY=0;return{w,d,tick:(a=0,b=0)=>{const pair=[0,0];pair[side]=a;pair[1-side]=b;SF2.step(pair);}};}
  for(const fid of Array.from({length:12},(_,i)=>i))for(const side of[0,1])for(const posture of['standing','crouching','air'])for(let button=0;button<6;button++){
   const{w,d,tick}=await setup(fid,side,posture==='air'?45:55);label={fid,side,posture,button,test:'normal'};
   if(posture==='air'){w.Y=d.Y=45*256;w.ST=d.ST=2;w.VY=d.VY=0;w.AY=d.AY=0;setanim(w,5,0);setanim(d,5,0);}
   const start=contacts.length;tick((16<<button)|(posture==='crouching'?8:0));for(let n=0;n<70;n++)tick(posture==='crouching'?8:0);rows.push({...label,contacts:contacts.length-start});
   // Every recovered active source record must route its own cue, including0.
   if(!side&&posture==='standing')for(const a of w.F.anims)if(a?.source)for(let i=0;i<a.ents.length;i++){const record=SF2CECOMBAT.record({...w,anim:a,aidx:i});if(record){staticChecks.push(aiSourceImpactCue(w,false,255,record)===record[6],aiSourceImpactCue(w,true,255,record)===0x72);}}
  }
  for(const fid of Array.from({length:12},(_,i)=>i))for(const side of[0,1]){
   const{tick}=await setup(fid,side);label={fid,side,test:'guard',button:2};const start=contacts.length;tick(64,side?1:2);for(let n=0;n<75;n++)tick(0,side?1:2);rows.push({...label,contacts:contacts.length-start});
  }
  for(const fid of Array.from({length:12},(_,i)=>i))for(const side of[0,1]){
   let{w,tick}=await setup(fid,side,95);for(const move of SF2AIRULES.mapping(w).filter((m,i,a)=>a.findIndex(q=>q.index===m.index)===i)){
    ({w,tick}=await setup(fid,side,[1,2,6,8,10,11].includes(fid)?60:95));label={fid,side,test:'special',move:move.index};const start=contacts.length;tick(move.mask);for(let n=0;n<200;n++)tick();rows.push({...label,contacts:contacts.length-start});
   }
  }
  for(const[fid,index]of[[0,0],[3,0],[4,0],[7,0],[7,1],[9,0],[9,1]])for(const side of[0,1])for(const mode of['guard','whiff']){const{w,d,tick}=await setup(fid,side,95),move=SF2AIRULES.mapping(w).find(m=>m.index===index);label={fid,side,test:'projectile-'+mode,move:index};if(mode==='whiff'){d.Y=220*256;d.ST=S_AIR;d.AY=d.VY=0;setanim(d,5,0);}const start=contacts.length;tick(move.mask,mode==='guard'?(side?1:2):0);for(let n=0;n<230;n++)tick(0,mode==='guard'?(side?1:2):0);rows.push({...label,contacts:contacts.length-start});}
  for(const side of[0,1]){const{w,tick}=await setup(2,side,40);label={kind:'bite',test:'bite',side};for(let n=0;n<8;n++)tick((side?1:2)|32);for(let n=0;n<2500&&(n<10||w.CEB||w.opp.CEBV);n++)tick();rows.push({test:'bite',side,hits:bites.filter(q=>q.side===side).length,released:!w.CEB&&!w.opp.CEBV});}
  // Whiffing an attack may make its swing cue, never a contact cue.
  for(const side of[0,1]){const{tick}=await setup(2,side,180);label={test:'whiff',side};const start=contacts.length;tick(128);for(let n=0;n<90;n++)tick();rows.push({...label,contacts:contacts.length-start});}
  // Guest contacts keep the original FF sound path rather than Balrog proxy data.
  for(const side of[0,1]){await SF2AI.configure({p1:side?'ryu':'abigail',p2:side?'abigail':'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;const w=P[side];w.X=360*256;w.opp.X=w.X+(side?-48:48)*256;w.FACE=side?0:1;w.opp.FACE=1-w.FACE;w.opp.HP=10000;w.WINS=w.opp.WINS=0;label={test:'guest',side};const start=contacts.length;for(let n=0;n<80;n++){const keys=[0,0];keys[side]=n===0?128:0;SF2.step(keys);}rows.push({...label,contacts:contacts.length-start});}
  SF2AI.setSound(true);const pcm=[0x27,0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x36,0x3e,0x72].map(code=>{const buffer=aiEchoBuffer({commands:[[0,code]],sample:null}),samples=buffer?.getChannelData(0);let peak=0;for(const x of samples||[])peak=Math.max(peak,Math.abs(x));return{code,peak,duration:buffer?.duration||0};});SF2.health.damage=original.healthDamage;Object.assign(window,original);return{rows,contacts,bites,pcm,staticChecks:staticChecks.length,staticFailures:staticChecks.filter(q=>!q).length};
 });
 fs.writeFileSync(artifacts('impact-audio.json'),JSON.stringify({result,errors},null,2));
 const source=result.contacts.filter(q=>q.raw!==null&&q.test!=='guest'),mismatches=source.filter(q=>JSON.stringify(q.cues)!==JSON.stringify(q.blocked?[0x72]:q.raw===0?[]:[q.raw]));
 console.log(JSON.stringify({cases:result.rows.length,actualContacts:result.contacts.length,sourceContacts:source.length,staticChecks:result.staticChecks,staticFailures:result.staticFailures,mismatches:mismatches.slice(0,12),biteCases:result.rows.filter(q=>q.test==='bite'),pcm:result.pcm,errors},null,2));
 assert.deepEqual(errors,[]);for(const p of result.pcm){assert.ok(p.peak>.001,JSON.stringify(p));assert.ok(p.duration>0);}assert.equal(result.staticFailures,0);assert.ok(result.staticChecks>1000);assert.deepEqual(mismatches,[]);assert.ok(source.length>150);
 for(const r of result.rows.filter(q=>q.test==='bite')){assert.ok(r.hits>2,JSON.stringify(r));assert.equal(r.released,true);}for(const r of result.bites){assert.equal(r.marker&1,1);assert.equal(r.damage.tick,r.tick);assert.ok(r.damage.amount>0);}assert.ok(result.contacts.filter(q=>q.test==='projectile-guard'&&q.blocked).length>=8);for(const r of result.rows.filter(q=>q.test==='whiff'||q.test==='projectile-whiff'))assert.equal(r.contacts,0);for(const r of result.contacts.filter(q=>q.test==='guest'))assert.deepEqual(r.cues,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
