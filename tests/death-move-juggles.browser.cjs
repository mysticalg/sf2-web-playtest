const{chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1100,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const identity={url:page.url(),title:await page.title(),canvas:await page.locator('canvas').count(),text:(await page.locator('body').innerText()).slice(0,300)};
 const result=await page.evaluate(async()=>{
  const rows=[],shots={},tick=()=>SF2.step([0,0]);let serial=0;
  async function setup(profile,side,exceptional=false){FIN.clear('test');const native=CE_KEYS.indexOf(profile),selected=native>=0?'ryu':profile;await SF2AI.configure({p1:side?'ken':selected,p2:side?selected:'ken',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;const w=P[side],d=w.opp;if(native>=0){AICFG.selectedProfiles[side]=null;setfighter(w,native);resetround();G.gph=1;}w.WINS=1;const room=aiRoom();d.X=(side?room.left+145:room.right-145)*256;w.X=d.X+(side?65:-65)*256;w.FACE=side?0:1;d.FACE=side?1:0;w.KEYS=d.KEYS=0;serial++;let seed=0;while(SF2AIFINISHERS.comboPlan(seed,serial).hits!==(exceptional?200:32))seed++;G.AIMatchSeed=seed;d.HP=1;return{w,d};}
  function arm(w,d){hpDamage(d,20);let t=0,floor=0,getup=0,preTrails=0;const initialMusic=MUS;for(;t<400&&FIN.info().phase!=='prompt';t++){tick();if(d.cur===29&&d.Y===0)floor++;if(d.ST===10)getup++;preTrails=Math.max(preTrails,FIN.info().trails||0);}return{readyTicks:t,floor,getup,preTrails,initialMusic,prompt:FIN.banner(),music:MUS,shade:FIN.shade()};}
  for(const side of[0,1])for(const profile of['ryu','ken','guile','dhalsim','andore','rolento','cody','haggar'])for(const exceptional of ['ryu','dhalsim'].includes(profile)?[false,true]:[false]){
   const{w,d}=await setup(profile,side,exceptional),ready=arm(w,d);if(profile==='ryu'&&!side&&!exceptional){SF2CECAMERA.latch(P);SF2.render();shots.prompt=c.toDataURL();}
   const choice=SF2AIRULES.mapping(w).find(m=>!m.command&&((profile==='andore'||profile==='haggar')?m.index===1:true));const accepted=FIN.request(w.i,choice,{fresh:true,serial:G.tick});let maxWinner=0,maxVictim=0,previousWidth=null,maxWidthStep=0,cameraOutside=0,clipped=0,clipBoxes=[],measured=0,maxTrails=0,worldDrift=true,black=false,ticks=0,groundHits=0,airHits=0;
   const begin=SF2Graphics.beginWorld;
   SF2Graphics.beginWorld=function(surface,top,m){const info=FIN.info();if((info.section==='air'||info.phase==='special')&&info.contacts>6&&!FIN.hidden(d)){
    measured++;for(const actor of P){const r=fighterArt(actor).rect,x=actor.X/256+(actor.FACE?-r[4]-r[2]:r[4])-Math.floor(G.cam)+(G.AICamera?.inset||0),y=GROUND+SF2CECAMERA.state.main-actor.Y/256+r[5];const left=m.a*x+m.e,right=left+m.a*r[2],upper=m.d*y+m.f,lower=upper+m.d*r[3];if(left<0||right>W||upper<50||lower>H){clipped++;if(clipBoxes.length<8)clipBoxes.push({tick:G.tick,actor:actor.i,slot:actor.cur,left,right,upper,lower,width:aiViewWidth(),cam:G.cam});}}
   }return begin(surface,top,m);};
   try{for(;ticks<4200&&FIN.active();ticks++){tick();const info=FIN.info(),room=aiRoom();maxWinner=Math.max(maxWinner,w.Y/256);maxVictim=Math.max(maxVictim,d.Y/256);maxTrails=Math.max(maxTrails,info.trails||0);if(FIN.cameraLock()){
     if(previousWidth!==null)maxWidthStep=Math.max(maxWidthStep,Math.abs(aiViewWidth()-previousWidth));previousWidth=aiViewWidth();if(G.cam<room.left-.01||G.cam+aiViewWidth()>room.right+.01)cameraOutside++;
    }
    for(const t of FIN.trailState()){worldDrift&&=t.face?t.x<=t.origin:t.x>=t.origin;black||=t.darkness===1;}
    if(ticks%12===0){SF2CECAMERA.latch(P);SF2.render();}
    if(profile==='ryu'&&!side&&!exceptional&&info.contacts===10&&!shots.air){SF2CECAMERA.latch(P);SF2.render();shots.air=c.toDataURL();}
   }}finally{SF2Graphics.beginWorld=begin;}
   const info=FIN.info(),contacts=info.events.filter(e=>e.type==='contact'),gaps=contacts.slice(1).map((c,i)=>({gap:c.tick-contacts[i].tick,stage:c.stage}));groundHits=contacts.filter(c=>c.section==='ground'&&c.winnerY===0&&c.victimY===0).length;airHits=contacts.filter(c=>c.section==='air'&&c.winnerY>20&&c.victimY>20).length;
   rows.push({profile,side,exceptional,ready,accepted,ticks,phase:info.phase,hits:info.contacts,target:info.targetHits,groundHits,airHits,launch:info.events.some(e=>e.type==='launch'),gaps,minGap:Math.min(...gaps.map(g=>g.gap)),maxWinner,maxVictim,maxWidthStep,cameraOutside,clipped,clipBoxes,measured,maxTrails,worldDrift,black,counter:FIN.counter(),wins:w.WINS,protected:!!d.AIFinishProtected,abort:G.AIFinisherAbort||null});delete G.AIFinisherAbort;
   SF2AI.resetRound();if(FIN.cameraLock()||FIN.shade()||FIN.counter()||FIN.trailState().length)throw Error('Presentation survived reset');
  }
  // Prompt expiry has exactly 240 ticks and awards once, with no trail admission.
  const{w,d}=await setup('ryu',0),ready=arm(w,d),start=G.tick;for(let n=0;n<239;n++)tick();const before={phase:FIN.info().phase,music:MUS,trails:FIN.info().trails};tick();const expired={phase:FIN.info().phase,ticks:G.tick-start,wins:w.WINS,hp:d.HP,shade:FIN.shade(),music:MUS};for(let n=0;n<80;n++)tick();expired.laterWins=w.WINS;
  // A tiny source-pixel fixture isolates darkening/alpha and camera-relative
  // drift; gameplay contact cadence above always uses the real controllers.
  const trailPixels=[];
  for(const face of[0,1]){let clock=0;const image=document.createElement('canvas');image.width=image.height=8;const g=image.getContext('2d');g.fillStyle='#d04020';g.fillRect(0,0,8,8);const players=[{i:0,X:(face?100:200)*256,Y:0,FACE:face,HP:100,WINS:1},{i:1,X:(face?200:100)*256,Y:0,FACE:1-face,HP:0}];
   const f=SF2AIFINISHERS.create({context:()=>({enabled:true,scene:'fight',tick:clock,phase:1,players,room:{left:0,right:1000},keys:[0,0]}),art:()=>({image,rect:[0,0,8,8,-4,-8]}),prepare(){},pose(){},specials:()=>[{index:0}],begin:()=>({duration:1,contacts:[0]}),animate:()=>({}),position(p,v){p.X=v.x*256;p.Y=v.y*256;p.FACE=v.face;},complete(){},fallback(){}},{ready:0});
   f.offer(players[1],{unblocked:true});f.step();f.request(0,{index:0},{fresh:true,serial:0});for(;clock<100&&!f.info().contacts;clock++)f.step();
   const read=camera=>{const c=document.createElement('canvas');c.width=1000;c.height=100;const g=c.getContext('2d');f.draw(g,camera,50,'back');const data=g.getImageData(0,0,1000,100).data;let opaque=0,rgb=0,left=1000;for(let k=0;k<data.length;k+=4)if(data[k+3]){opaque++;rgb+=data[k]+data[k+1]+data[k+2];left=Math.min(left,(k/4)%1000);}return{opaque,rgb,left};};
   const original=read(-400),trail=f.trailState()[0];clock+=40;const black=read(-400),shift=read(-390),aged=f.trailState()[0];clock+=100;f.step();trailPixels.push({face,original,black,shift,drift:aged.x-trail.x,expired:!f.trailState().some(t=>t.tick===trail.tick)});
  }
  return{rows,shots,trailPixels,timeout:{ready,before,expired}};
 });
 for(const[name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts('juggle-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;
 fs.writeFileSync(artifacts('juggles.json'),JSON.stringify({identity,result,errors},null,2));
 const bad=result.rows.filter(r=>!r.accepted||r.phase!=='result'||r.hits!==r.target||r.target!==(r.exceptional?200:32)||r.groundHits!==5||!r.launch||r.airHits<10||r.maxWinner<50||r.maxVictim<90||r.cameraOutside||r.clipped||!r.measured||r.maxWidthStep>20||r.maxTrails>24||!r.worldDrift||!r.black||r.ready.preTrails||r.ready.floor<60||!r.ready.getup||r.ready.prompt!=='FINISH THEM'||r.ready.music!==0x8c||r.ready.shade!==.64||r.wins!==2||r.protected||r.abort||r.gaps.some(g=>g.gap<(r.exceptional&&g.stage/199>=.75?3:10)));
 console.log(JSON.stringify({cases:result.rows.length,errors,bad,timeout:result.timeout},null,2));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);assert.equal(result.timeout.before.phase,'prompt');assert.equal(result.timeout.before.trails,0);assert.equal(result.timeout.expired.ticks,240);assert.equal(result.timeout.expired.phase,'idle');assert.equal(result.timeout.expired.wins,2);assert.equal(result.timeout.expired.laterWins,2);assert.equal(result.timeout.expired.shade,0);assert.notEqual(result.timeout.expired.music,0x8c);
 for(const t of result.trailPixels){assert.equal(t.original.opaque,64);assert.ok(t.original.rgb>0);assert.equal(t.black.opaque,64);assert.equal(t.black.rgb,0);assert.equal(t.shift.left,t.black.left-10);assert.ok(t.face?t.drift<0:t.drift>0);assert.ok(t.expired);}
 // Actual keyboard shortcut and rendered canvas at both desktop and phone widths.
 await page.evaluate(async()=>{await SF2AI.configure({p1:'ryu',p2:'ken',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;P[0].WINS=1;P[0].X=340*256;P[1].X=450*256;P[1].HP=0;FIN.offer(P[1],{unblocked:true});for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)SF2.step([0,0]);SF2CECAMERA.latch(P);SF2.render();});
 await page.screenshot({path:artifacts('juggle-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:artifacts('juggle-mobile.png')});
 await page.locator('#c').click();await page.keyboard.down('a');await page.keyboard.down('z');await page.evaluate(()=>SF2.step());await page.keyboard.up('z');await page.keyboard.up('a');
 const input=await page.evaluate(()=>({phase:FIN.info().phase,request:FIN.info().request}));assert.ok(['approach','combo'].includes(input.phase));assert.equal(input.request.index,0);await page.evaluate(()=>{for(let n=0;n<220;n++)SF2.step([0,0]);SF2CECAMERA.latch(P);SF2.render();});await page.screenshot({path:artifacts('juggle-keyboard.png')});
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
