const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const rows=[],shots={};let finisherId=0;
  async function setup(side,target='ryu',owner='abigail'){
   FIN.clear('abigail-test');await SF2AI.configure({p1:side?target:owner,p2:side?owner:target,mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;
   const w=P[side],d=w.opp;w.WINS=d.WINS=0;w.X=360*256;d.X=w.X+(side?-48:48)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;d.HP=1000;d.STP=d.DIZZY=0;
   return{w,d,tick:(owner=0,victim=0)=>{const pair=[0,0];pair[side]=owner;pair[1-side]=victim;SF2.step(pair);}};
  }
  for(const side of[0,1])for(const posture of['standing','crouching','air'])for(const target of['ryu','andore']){
   const {w,d,tick}=await setup(side,target);if(posture==='air'){w.Y=d.Y=40*256;w.ST=d.ST=2;w.VY=d.VY=0;w.AY=d.AY=64;setanim(w,5,0);setanim(d,5,0);}
   const hp=d.HP;tick(128|(posture==='crouching'?8:0));for(let n=0;n<85;n++)tick(posture==='crouching'?8:0);
   rows.push({test:'normal',side,target,posture,damage:hp-d.HP,ownerState:w.ST,held:!!d.AIFFHeld});
  }
  for(const side of[0,1])for(const mode of['escape','held-button','timeout','interrupt','owner-ko','victim-ko','reset','miss','air-target']){
   const {w,d,tick}=await setup(side),slot=w.F.moves.findIndex(m=>m.style==='hold'),shortcut=SF2AIRULES.mapping(w).find(m=>m.index===slot);if(mode==='miss')d.X=w.X+(side?-150:150)*256;if(mode==='air-target'){d.Y=60*256;d.ST=2;d.VY=0;d.AY=0;setanim(d,5,0);}
   if(mode==='victim-ko')d.HP=4;if(mode==='held-button'){d.ST=5;d.STUN=60;d.KEYS=d.PREV=16;SF2AIRULES.sample(d,16,G.tick);}
   tick(shortcut.mask,mode==='held-button'?16:0);let wait=0;while(wait++<60&&!d.AIFFHeld&&w.ST===11)tick(0,mode==='held-button'?16:0);
   const attached=!!d.AIFFHeld,start=G.tick,hp=d.HP;let contacts=0,damage=0;const old=hpDamage;hpDamage=function(p,n,...rest){if(p===d&&n>0){contacts++;damage+=n;}return old(p,n,...rest);};
   if(mode==='escape'){for(let n=0;n<60&&d.AIFFHeld;n++)tick(0,n%4===0?16:n%4===2?128:0);}
   else if(mode==='held-button'){for(let n=0;n<60;n++)tick(0,16);}
   else if(mode==='interrupt'){applyhit(w,1,0,0,0,side?1:-1,0);for(let n=0;n<40;n++)tick();}
   else if(mode==='owner-ko'){applyhit(w,10000,2,0,0,side?1:-1,0);for(let n=0;n<100;n++)tick();}
   else if(mode==='reset'){SF2AI.resetRound();tick();}
   else for(let n=0;n<400&&(w.AIFFHold||mode==='victim-ko'&&d.Y>0);n++)tick();
   hpDamage=old;rows.push({test:'hold',mode,side,slot,label:shortcut.label,attached,elapsed:G.tick-start,contacts,damage,held:!!d.AIFFHeld,holding:!!w.AIFFHold,ownerState:w.ST,victimState:d.ST,victimY:d.Y/256,victimHP:d.HP});
   if(mode==='held-button')FIN.clear('cleanup');
  }
  for(const owner of['abigail','andore'])for(const side of[0,1])for(const target of owner==='abigail'?['ryu','andore','ken']:['ryu']){
   const {w,d,tick}=await setup(side,target,owner);w.WINS=1;d.HP=1;hpDamage(d,10);finisherId=FIN.info().id;for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)tick();
   const request=SF2AIRULES.mapping(w).find(m=>w.F.moves[m.index]?.style==='hold'),echoes=soundStats.finalHitRequests||0;const accepted=FIN.request(side,request,{fresh:true,serial:G.tick});let lingering=0,impactTick=null,winTick=null;for(let n=0;n<4200&&FIN.active();n++){tick();if(FIN.hidden(d)){impactTick??=G.tick;lingering+=!!(w.AIFFHold||d.AIFFHeld);if(w.ST===9)winTick??=G.tick;}}const info=FIN.info();rows.push({test:'finisher',owner,lingering,impactTick,winTick,side,target,accepted,phase:info.phase,contacts:info.contacts,targetHits:info.targetHits,parts:info.parts.length,held:!!d.AIFFHeld,holding:!!w.AIFFHold,finalHits:(soundStats.finalHitRequests||0)-echoes,abort:G.AIFinisherAbort||null});delete G.AIFinisherAbort;
  }
  for(const side of[0,1])for(const action of['skip','reset']){
   const {w,d,tick}=await setup(side);w.WINS=1;let seed=0;while(SF2AIFINISHERS.comboPlan(seed,finisherId+1).hits!==16)seed++;G.AIMatchSeed=seed;d.HP=1;hpDamage(d,10);finisherId=FIN.info().id;
   for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)tick();FIN.request(side,SF2AIRULES.mapping(w).find(m=>w.F.moves[m.index]?.style==='hold'),{fresh:true,serial:G.tick});for(let n=0;n<4200&&FIN.active()&&!w.AIFFHold;n++)tick();
   const attached=!!d.AIFFHeld,echoes=soundStats.finalHitRequests||0;if(action==='skip')SF2AI.skipFinisher();else SF2AI.resetRound();tick();
   rows.push({test:'finisher-cancel',side,action,attached,held:!!d.AIFFHeld,holding:!!w.AIFFHold,protected:!!d.AIFinishProtected,active:FIN.active(),hp:d.HP,finalHits:(soundStats.finalHitRequests||0)-echoes});
  }
  const {w,d}=await setup(0),f=w.F,source=new Image();source.src=SF2AIFFData.abigail.image;await source.decode();let sourceMismatches=0;
  for(const frame of[17,19,20,27]){const r=f.frames[frame],c=document.createElement('canvas');c.width=r[2];c.height=r[3];const g=c.getContext('2d');g.drawImage(source,...SF2AIFFData.abigail.frames[frame].slice(0,4),0,0,c.width,c.height);const old=g.getImageData(0,0,c.width,c.height).data;g.clearRect(0,0,c.width,c.height);g.drawImage(SF2AIFF.get('abigail').image,...r.slice(0,4),0,0,c.width,c.height);const now=g.getImageData(0,0,c.width,c.height).data;for(let n=0;n<old.length;n++)sourceMismatches+=old[n]!==now[n];}
  const image=SF2AIFF.get('abigail').image,rasters=new Map(),pixel=(frame,x,y)=>{const r=f.frames[frame],xx=x-r[4],yy=y-r[5];if(xx<0||yy<0||xx>=r[2]||yy>=r[3])return[0,0,0,0];let data=rasters.get(frame);if(!data){const c=document.createElement('canvas');c.width=r[2];c.height=r[3];const g=c.getContext('2d');g.drawImage(image,...r.slice(0,4),0,0,c.width,c.height);data=g.getImageData(0,0,c.width,c.height).data;rasters.set(frame,data);}return[...data.slice((yy*r[2]+xx)*4,(yy*r[2]+xx)*4+4)];};

  let lowerMismatch=0;for(let y=-25;y<=3;y++)for(let x=-100;x<=100;x++){const a=pixel(f.crouchPunch.frame,x,y),b=pixel(20,x,y);for(let n=0;n<4;n++)lowerMismatch+=a[n]!==b[n];}
  const bindings={jump:[5,6,7].map(n=>f.anims[n].ents.map(e=>e[0])),palm:[11,50,56,62].map(n=>f.anims[n].ents.find(e=>e[6]?.[2])?.[0]),low:[17,18,19].map(n=>f.anims[n].ents.find(e=>e[6]?.[2])?.[0]),sourceMismatches,lowerMismatch};
  for(const [name,slot,entry]of[['jump',5,0],['palm',11,1],['low',19,1]]){setanim(w,slot,entry);w.ST=slot===5?2:1;w.Y=slot===5?60*256:0;SF2CECAMERA.latch(P);SF2.render();shots[name]=c.toDataURL();}
  const s=w.F.moves.findIndex(m=>m.style==='hold');toidle(w);toidle(d);w.Y=d.Y=0;d.X=w.X+48*256;d.HP=1000;startspec(w,[],(2<<4)|(s+1));for(let n=0;n<40&&!d.AIFFHeld;n++)SF2.step([0,0]);for(let n=0;n<20;n++)SF2.step([0,0]);SF2CECAMERA.latch(P);SF2.render();shots.choke=c.toDataURL();
  return{rows,bindings,shots};
 });
 for(const [name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts('abigail-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;fs.writeFileSync(artifacts('abigail-controls.json'),JSON.stringify({result,errors},null,2));
 console.log(JSON.stringify({errors,rows:result.rows,bindings:result.bindings},null,2));assert.deepEqual(errors,[]);
 for(const r of result.rows){if(r.test==='normal'){assert.ok(r.damage>0,JSON.stringify(r));assert.equal(r.held,false);}else if(r.test==='finisher-cancel'){assert.ok(r.attached);assert.equal(r.held,false);assert.equal(r.holding,false);assert.equal(r.protected,false);assert.equal(r.active,false);assert.equal(r.finalHits,0);if(r.action==='skip')assert.equal(r.hp,0);else assert.ok(r.hp>0);}else if(r.test==='finisher'){assert.ok(r.accepted);assert.equal(r.phase,'result');assert.equal(r.contacts,r.targetHits);assert.equal(r.parts,6);assert.equal(r.held,false);assert.equal(r.holding,false);assert.equal(r.finalHits,1);assert.equal(r.lingering,0);assert.equal(r.winTick,r.impactTick);assert.equal(r.abort,null);}else{assert.equal(r.slot,5);if(['miss','air-target'].includes(r.mode)){assert.equal(r.attached,false);assert.equal(r.contacts,0);assert.equal(r.holding,false);}else{assert.ok(r.attached,JSON.stringify(r));if(r.mode==='held-button'){assert.ok(r.held);assert.ok(r.damage>0);}else{assert.equal(r.held,false,JSON.stringify(r));assert.equal(r.holding,false);}if(r.mode==='escape')assert.ok(r.elapsed<100);if(r.mode==='victim-ko')assert.equal(r.victimHP,0);}}}
 assert.equal(result.bindings.sourceMismatches,0);assert.equal(result.bindings.lowerMismatch,0);assert.ok(result.bindings.jump.flat().every(n=>n===27));assert.ok(result.bindings.palm.every(n=>n===19));assert.ok(result.bindings.low.every(n=>n===20));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
