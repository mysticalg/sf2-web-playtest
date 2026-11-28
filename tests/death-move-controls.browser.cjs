const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const rows=[];let serial=0;
  async function setup(profile,side=0,victim='ken'){
   FIN.clear('test');await SF2AI.configure({p1:side?'ken':profile,p2:side?profile:'ken',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;
   const w=P[side],d=w.opp;AICFG.selectedProfiles[d.i]=null;setfighter(d,5);resetround();G.gph=1;const room=aiRoom();w.WINS=1;w.X=(room.left+room.right)/2*256+(side?40:-40)*256;d.X=w.X+(side?-80:80)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;w.KEYS=d.KEYS=0;
   let seed=0;serial++;while(SF2AIFINISHERS.comboPlan(seed,serial).hits!==80)seed++;G.AIMatchSeed=seed;d.HP=1;hpDamage(d,20);
   return{w,d,step:(keys=0)=>{const pair=[0,0];pair[side]=keys;SF2.step(pair);}};
  }
  for(const side of[0,1])for(const profile of['ryu','ken','andore','sodom']){
   const{w,d,step}=await setup(profile,side,'chunli');
   const before=w.X;for(let n=0;n<12;n++)step(side?1:2);const openingMoved=Math.abs(w.X-before)/256,openingContacts=FIN.info().contacts;
   for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)step();
   const baseline=aiViewWidth(),cam=G.cam;FIN.request(side,SF2AIRULES.mapping(w).find(m=>!m.command),{fresh:true,serial:G.tick});
   const captured={width:FIN.cameraLock()?.width,cam:FIN.cameraLock()?.cam};
   const states=[];function hold(keys,n=50){for(let i=0;i<n&&FIN.active();i++)step(keys);const info=FIN.info();states.push({keys,phase:info.phase,posture:info.posture,requested:info.requestedPosture,y:w.Y/256,contacts:info.contacts});}
   hold(8);hold(0,2);hold(4);hold(0,2);hold(4,70);hold(0,2);hold(8,45);hold(0,2);hold(8,40);hold(0,2);hold(4,40);hold(0,2);hold(4,65);const high=w.Y/256;hold(0,170);const descended=w.Y/256;
   let earlyParts=false,voiceEarly=false,maxTrailRate=0,lastTrail=-Infinity;const births=[];let voiceCount=0;const original=sfxc;sfxc=function(code,...args){if(code===XS(d)?.ko)voiceCount++;return original(code,...args);};audioInit();const starts=new Map(),makeSource=AC.createBufferSource.bind(AC);AC.createBufferSource=function(){const source=makeSource(),start=source.start.bind(source);source.start=function(when,...args){starts.set(source,when);return start(when,...args);};return source;};
   for(let n=0;n<4200&&FIN.active();n++){
    step();const info=FIN.info(),final=info.events.some(e=>e.type==='final-strike');earlyParts||=info.removed.length>0&&!final;voiceEarly||=voiceCount>0&&!final;
    for(const t of FIN.trailState())if(!births.includes(t.tick))births.push(t.tick);
   }
   sfxc=original;AC.createBufferSource=makeSource;const heavy=aiEchoBuffer({commands:[[0,XS(w)?.hit?.[5]||0x2a]],sample:null}),scheduled=[...starts].filter(([source])=>source.buffer===heavy).map(([,when])=>when);const repeatSpacing=scheduled.slice(1).map((v,i)=>v-scheduled[i]);const info=FIN.info(),final=info.events.find(e=>e.type==='final-strike'),detached=info.events.filter(e=>e.type==='detached'),contacts=info.events.filter(e=>e.type==='contact');
   const audio={...soundStats.lastFinalHit},voice={...G.AIFinisherDeathVoice};const nodesBefore=AI_ECHO.nodes.length;FIN.clear('test-reset');const nodesAfter=AI_ECHO.nodes.length;
   rows.push({profile,side,openingMoved,openingContacts,baseline,cam,captured,states,high,descended,earlyParts,voiceEarly,voiceCount,phase:info.phase,hits:info.contacts,target:info.targetHits,finalTrails:info.trails,trailStop:info.events.find(e=>e.type==='trails-stopped'),final,detached,voice,audio,repeatSpacing,nodesBefore,nodesAfter,birthGaps:births.slice(1).map((v,i)=>v-births[i]),sections:[...new Set(contacts.map(e=>e.section))],abort:G.AIFinisherAbort||null});delete G.AIFinisherAbort;
  }
  const recovery=[];
  for(const profile of['andore','sodom']){
   FIN.clear('test');await SF2AI.configure({p1:profile,p2:'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;const w=P[0],d=P[1];w.WINS=d.WINS=0;
   const index=w.F.moves.findIndex(m=>['dash','sodom-charge'].includes(m.style));startspec(w,[],(2<<4)|(index+1));for(let n=0;n<300&&w.ST===11;n++)SF2.step([0,0]);
   const postSpecial={state:w.ST,mv:w.MV?.style,canProbe:SF2AIFF.canProbe(w)};
   w.X=340*256;d.X=385*256;w.FACE=1;d.FACE=0;toidle(w);toidle(d);d.HP=aiMax(d);d.DIZZY=0;d.STP=0;const hp=d.HP;
   SF2.step([16,0]);for(let n=0;n<65;n++)SF2.step([0,0]);const normalDamage=hp-d.HP;
   // Enter the real dizzy get-up path, then verify both the timer and overlay recover.
   w.DIZZY=1;w.ST=10;setanim(w,30,w.F.anims[30].ents.length-1);w.adone=1;for(let n=0;n<240;n++)SF2.step([0,0]);
   recovery.push({profile,postSpecial,normalDamage,dizzy:w.DIZZY,state:w.ST,stun:w.STUN});
  }
  return{rows,recovery};
 });
 fs.writeFileSync(artifacts('death-controls.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify({errors,rows:result.rows.map(r=>({profile:r.profile,side:r.side,phase:r.phase,hits:r.hits,abort:r.abort,states:r.states})),recovery:result.recovery},null,2));
 assert.deepEqual(errors,[]);
 for(const r of result.rows){assert.ok(r.openingMoved>0,`${r.profile} setup movement`);assert.equal(r.openingContacts,0);assert.equal(r.captured.width,r.baseline);assert.equal(r.captured.cam,r.cam);assert.equal(r.phase,'result');assert.equal(r.hits,r.target);assert.equal(r.abort,null);assert.equal(r.earlyParts,false);assert.equal(r.voiceEarly,false);assert.equal(r.voiceCount,1);assert.equal(r.voice.tick,r.final.tick);assert.equal(r.audio.tick,r.final.tick);assert.deepEqual(r.audio.taps,[0,.5,1,1.5,2,2.5]);assert.ok(r.audio.played);assert.equal(r.repeatSpacing.length,5);assert.ok(r.repeatSpacing.every(n=>Math.abs(n-.5)<.001));assert.equal(r.finalTrails,0);assert.equal(r.trailStop.tick,r.final.tick);assert.equal(r.detached.length,6);assert.ok(r.detached.every(e=>e.tick===r.final.tick));assert.equal(r.nodesAfter,0);assert.ok(r.birthGaps.every(n=>n>=10));assert.ok(r.high>20);assert.ok(r.descended<r.high);for(const section of['crouching','standing','air'])assert.ok(r.sections.includes(section));
  assert.equal(r.states[0].requested,'crouching');assert.equal(r.states[2].requested,'standing');assert.equal(r.states[4].requested,'airborne');assert.equal(r.states[6].requested,'standing');assert.equal(r.states[8].requested,'crouching');
 }
 for(const r of result.recovery){assert.ok(r.postSpecial.canProbe);assert.ok(r.normalDamage>0);assert.equal(r.dizzy,0);assert.equal(r.state,0);}
 // Exercise the actual keyboard and Gamepad API routes, including a held Up.
 await page.evaluate(async()=>{FIN.clear('input-test');await SF2AI.configure({p1:'ryu',p2:'ken',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;P[0].WINS=1;P[1].HP=0;FIN.offer(P[1],{unblocked:true});for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)SF2.step([0,0]);FIN.request(0,SF2AIRULES.mapping(P[0])[0],{fresh:true,serial:G.tick});});
 await page.locator('#c').click();await page.keyboard.down('ArrowDown');await page.evaluate(()=>{for(let n=0;n<35;n++)SF2.step();});assert.equal(await page.evaluate(()=>FIN.info().requestedPosture),'crouching');await page.keyboard.up('ArrowDown');await page.evaluate(()=>SF2.step());
 await page.keyboard.down('ArrowUp');await page.evaluate(()=>{for(let n=0;n<35;n++)SF2.step();});assert.equal(await page.evaluate(()=>FIN.info().requestedPosture),'standing');await page.keyboard.up('ArrowUp');await page.evaluate(()=>SF2.step());
 await page.evaluate(()=>{window.testPad={id:'Standard test controller',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testPad]});SF2.step();window.testPad.buttons[12]={pressed:true,value:1};for(let n=0;n<60;n++)SF2.step();});assert.equal(await page.evaluate(()=>FIN.info().requestedPosture),'airborne');await page.evaluate(()=>{window.testPad.buttons[12]={pressed:false,value:0};SF2.step();window.testPad.buttons[13]={pressed:true,value:1};for(let n=0;n<35;n++)SF2.step();});assert.equal(await page.evaluate(()=>FIN.info().requestedPosture),'standing');await page.evaluate(()=>{FIN.clear('input-test');SF2.clearInput?.();});
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
