const{chromium,install,artifacts,url}=require('./browser-runtime.cjs'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({args:['--disable-http2']}),p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await install(p);await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>SF2.VER.loading===2&&window.FIN,null,{timeout:90000});
 const result=await p.evaluate(async()=>{
  const rows=[],shots={},tick=(keys=[0,0])=>SF2.step(keys);
  async function setup(side=0,profile='ryu',fid=null,cpu=false){
   await SF2AI.configure({p1:side?'ryu':profile,p2:side?profile:'ryu',mode:cpu?'cpu':'versus',training:false,seed:8732});SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   const w=P[side],d=w.opp;if(fid!==null){AICFG.selectedProfiles[side]=null;setfighter(w,fid);resetround();G.gph=1;}
   w.X=(side?480:360)*256;d.X=(side?360:480)*256;w.FACE=side?0:1;d.FACE=side?1:0;w.WINS=1;d.WINS=0;return{w,d};
  }
  function arm(d){d.HP=0;return FIN.offer(d,{unblocked:true});}
  function waitPhase(phase,choice=null){
   for(let n=0;n<2000;n++){const info=FIN.info();if(info.phase===phase)return true;if(info.phase==='prompt'&&phase!=='prompt'){const w=P[info.winner],move=choice||SF2AIRULES.mapping(w).find(m=>!m.command);FIN.request(w.i,move,{fresh:true,serial:G.tick});}tick();if(FIN.info().phase==='idle')return false;}return false;
  }
  function complete(){for(let n=0;n<2000&&FIN.active();n++)tick();return FIN.info().phase;}
  function shot(name){SF2CECAMERA.latch(P);SF2.render();shots[name]=c.toDataURL();}
  for(const side of[0,1]){
   let{w,d}=await setup(side);d.HP=1;w.WINS=0;hpDamage(d,10);phase();rows.push({test:'first-round-ko',side,active:FIN.active(),wins:w.WINS,round:G.gph});
   ({w,d}=await setup(side));d.HP=1;d.KEYS=side?1:2;w.ST=11;w.MV={kind:'fb'};const blocked=applyhit(d,40,2,0,0,side?-1:1,5,0);phase();rows.push({test:'chip-ko',side,blocked,active:FIN.active(),hp:d.HP,wins:w.WINS});
   ({w,d}=await setup(side));d.HP=1;w.THV={d:side?-1:1,dmg:99};relth(w);phase();rows.push({test:'throw-lethal-offer',side,phase:FIN.info().phase,round:G.gph});
   ({w,d}=await setup(side));arm(d);w.HP=0;phase();rows.push({test:'double-ko',side,active:FIN.active(),mask:G.winmask,wins:P.map(p=>p.WINS),states:P.map(p=>p.ST)});
   ({w,d}=await setup(side));arm(d);for(let n=0;n<330;n++)tick();rows.push({test:'prompt-timeout',side,active:FIN.active(),wins:w.WINS,hp:d.HP,protect:!!d.AIFinishProtected});for(let n=0;n<70;n++)tick();
   ({w,d}=await setup(side));startspec(w,[],1);d.HP=0;FIN.offer(d,{unblocked:true,special:true,projectile:true});const beforeEcho=soundStats.koEchoRequests||0;for(let n=0;n<330;n++)tick();rows.push({test:'special-timeout-preserves-sko',side,active:FIN.active(),wins:w.WINS,echoKind:soundStats.lastKOEcho?.kind,echoes:(soundStats.koEchoRequests||0)-beforeEcho});
   ({w,d}=await setup(side));w.KEYS=144;arm(d);let keys=[0,0];keys[side]=144;for(let n=0;n<40;n++)tick(keys);const heldPhase=FIN.info().phase;tick();tick(keys);const fresh=FIN.info().phase;rows.push({test:'held-shortcut-release',side,heldPhase,fresh,complete:complete()});
   ({w,d}=await setup(side));arm(d);waitPhase('prompt');let accepted=FIN.request(d.i,{index:0},{fresh:true,serial:G.tick}),foreign=FIN.request(w.i,{index:999},{fresh:true,serial:G.tick});rows.push({test:'reject-other-player-and-foreign',side,accepted,foreign,phase:FIN.info().phase});
   ({w,d}=await setup(side));arm(d);waitPhase('prompt');const forward=side?1:2;for(const key of[8,8|forward,forward,forward|16]){const pair=[0,0];pair[side]=key;tick(pair);}rows.push({test:'original-qcf',side,phase:FIN.info().phase,request:FIN.info().request,complete:complete()});
   ({w,d}=await setup(side,'ryu',3));arm(d);waitPhase('prompt');const back=side?2:1,go=side?1:2;keys=[0,0];keys[side]=back;for(let n=0;n<100;n++)tick(keys);keys[side]=go|16;tick(keys);rows.push({test:'original-charge',side,phase:FIN.info().phase,request:FIN.info().request,complete:complete()});
   ({w,d}=await setup(side));arm(d);waitPhase('combo');const before=JSON.stringify(FIN.info());for(let n=0;n<30;n++){const copy={...d};fighterArt(copy);SF2.render();}rows.push({test:'render-pure',side,pure:before===JSON.stringify(FIN.info())});CONTROL.paused=true;const age=FIN.info().age;for(let n=0;n<20;n++)SF2.step();rows.push({test:'paused-cinematic',side,ageBefore:age,ageAfter:FIN.info().age});CONTROL.paused=false;
   for(const phaseName of['ready','prompt','combo','special','settle','result'])for(const action of['select','reset','skip']){
    ({w,d}=await setup(side));arm(d);if(phaseName!=='ready')waitPhase(phaseName);const reached=FIN.info().phase;
    if(action==='select')goNow('select');else if(action==='reset')resetround();else SF2AI.skipFinisher();
    rows.push({test:'cleanup',side,phase:phaseName,reached,action,active:FIN.active(),retained:FIN.retained(),protect:!!d.AIFinishProtected,hp:d.HP,wins:w.WINS,attached:P.some(p=>p.THV||p.AIFFHold||p.AIFFHeld||p.AIFFThrow||p.CETH||p.CETHV)});
    for(let n=0;n<4;n++)tick();
   }
   ({w,d}=await setup(side,'andore'));arm(d);waitPhase('special',SF2AIRULES.mapping(w).find(m=>m.index===3));for(let n=0;n<80&&!w.AIFFThrow;n++)tick();const attached=!!w.AIFFThrow;shot('pile-grip-'+side);const pure=JSON.stringify(FIN.info());for(let n=0;n<4;n++)SF2.render();rows.push({test:'real-pile-interrupt',side,attached,pure:pure===JSON.stringify(FIN.info())});SF2AI.skipFinisher();rows.push({test:'pile-cleanup',side,held:P.some(q=>q.AIFFHeld||q.AIFFThrow||q.THV),protect:!!d.AIFinishProtected,wins:w.WINS});for(let n=0;n<40;n++)tick();
   ({w,d}=await setup(side));arm(d);waitPhase('prompt');shot('prompt-'+side);FIN.request(w.i,SF2AIRULES.mapping(w)[0],{fresh:true,serial:G.tick});complete();for(let n=0;n<1200&&G.scene!=='win';n++)tick();for(let n=0;n<90;n++)tick();shot('result-'+side);const resultState=FIN.info();rows.push({test:'result-persistence',side,scene:G.scene,phase:resultState.phase,trails:resultState.trails,pieces:resultState.parts.length,stains:AI_BLOOD.stains.length});
  }
  for(const side of[0,1]){
   let{w,d}=await setup(side,'andore');delete G.cep;arm(d);waitPhase('prompt');FIN.request(w.i,SF2AIRULES.mapping(w)[0],{fresh:true,serial:G.tick});complete();for(let n=0;n<1800&&G.scene!=='select';n++)tick();SF2.render();
   rows.push({test:'configured-auto-return',side,scene:G.scene,grid:G.cep?.slice(),prototype:AICFG.prototype,retained:FIN.retained(),protected:P.some(q=>q.AIFinishProtected)});
   const target=12+ffGuestIds().indexOf('sodom'),pulse=(key,slot=0)=>{const keys=[0,0];keys[slot]=key;tick(keys);tick();};
   if(G.scene==='select'&&G.cep){for(let n=0;n<8&&Math.floor(G.cep[0]/6)!==Math.floor(target/6);n++)pulse(8);for(let n=0;n<6&&G.cep[0]!==target;n++)pulse(2);pulse(16);const chosen=P[0].aiProfile; pulse(16);for(let n=0;n<4&&G.scene==='select';n++)pulse(16,G.mode2p?G.selstep:0);for(let n=0;n<900&&G.scene!=='fight';n++)tick();SF2.render();rows.push({test:'configured-return-reselect',side,chosen,profile:P[0].aiProfile,scene:G.scene,active:FIN.active(),protected:P.some(q=>q.AIFinishProtected)});}
  }
  let{w,d}=await setup(1,'andore',null,true);arm(d);const cpuComplete=complete();rows.push({test:'cpu-automatic',phase:cpuComplete,request:FIN.info().request,wins:w.WINS});
  ({w,d}=await setup(0));arm(d);waitPhase('prompt');const originalStart=startspec;startspec=()=>{throw new Error('regression injected native startup failure');};FIN.request(w.i,SF2AIRULES.mapping(w)[0],{fresh:true,serial:G.tick});for(let n=0;n<1200&&FIN.active();n++)tick();startspec=originalStart;const errorFallback={test:'native-error-fallback',phase:FIN.info().phase,hp:d.HP,protect:!!d.AIFinishProtected,wins:w.WINS,reason:G.AIFinisherAbort};for(let n=0;n<40;n++)tick();rows.push(errorFallback);delete G.AIFinisherAbort;
  ({w,d}=await setup(0));arm(d);waitPhase('prompt');AI_BLOOD.stains=Array.from({length:1530},(_,i)=>({x:360+i/20,depth:i%7,size:1,color:'#d3132b'}));FIN.request(w.i,SF2AIRULES.mapping(w)[0],{fresh:true,serial:G.tick});let maximum=0;for(let n=0;n<1200&&FIN.active();n++){tick();maximum=Math.max(maximum,AI_BLOOD.particles.length);}rows.push({test:'bounded-blood',phase:FIN.info().phase,maximum,stains:AI_BLOOD.stains.length,pieces:FIN.info().parts.length,trails:FIN.info().trails});
  ({w,d}=await setup(0));let clock=0,fallbacks=0,clears=0;const art=fighterArtBase(d),fake=SF2AIFINISHERS.create({context:()=>({enabled:true,scene:'fight',tick:clock,phase:1,players:P,room:aiRoom(),keys:[0,0],training:false}),art:()=>art,prepare(){},pose(){},specials:()=>[{index:0,mask:144}],begin:()=>({duration:600,contacts:[]}),animate:()=>({advance:false}),position(){},complete(){},fallback(){fallbacks++;},cleanup(){clears++;}});d.HP=0;fake.offer(d,{unblocked:true});for(clock=1;clock<25;clock++)fake.step();fake.request(w.i,{index:0},{fresh:true,serial:clock});for(;clock<2500;clock++)fake.step();rows.push({test:'watchdog',phase:fake.info().phase,fallbacks,clears});
  ({w,d}=await setup(0));arm(d);waitPhase('combo');await SF2.setEdition('ce');SF2.freeze=1;rows.push({test:'edition-clear',edition:VER.edition,active:FIN.active(),retained:FIN.retained(),marks:P.some(p=>p.AIFinishProtected)});
  return{rows,shots};
 });
 for(const[name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts('lifecycle-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;fs.writeFileSync(artifacts('lifecycle.json'),JSON.stringify({result,errors},null,2));
 const bad=[];
 for(const r of result.rows){
  if(r.test==='first-round-ko'&& (r.active||r.wins!==1||r.round!==2))bad.push(r);
  if(r.test==='chip-ko'&&(r.blocked!=='blk'||r.active||r.hp!==0||r.wins!==2))bad.push(r);
  if(r.test==='throw-lethal-offer'&&(r.phase!=='ready'||r.round!==1))bad.push(r);
  if(r.test==='double-ko'&&(r.active||r.mask!==3||r.wins.reduce((a,b)=>a+b,0)!==3||r.states.some(s=>s!==8)))bad.push(r);
  if(r.test==='prompt-timeout'&&(r.active||r.wins!==2||r.hp!==0||r.protect))bad.push(r);
  if(r.test==='special-timeout-preserves-sko'&&(r.active||r.wins!==2||r.echoKind!=='fb'||r.echoes!==1))bad.push(r);
  if(r.test==='held-shortcut-release'&&(r.heldPhase!=='prompt'||!['approach','combo'].includes(r.fresh)||r.complete!=='result'))bad.push(r);
  if(r.test==='reject-other-player-and-foreign'&&(r.accepted||r.foreign||r.phase!=='prompt'))bad.push(r);
  if(['original-qcf','original-charge'].includes(r.test)&&(!r.request||r.complete!=='result'))bad.push(r);
  if(r.test==='render-pure'&&!r.pure||r.test==='paused-cinematic'&&r.ageBefore!==r.ageAfter)bad.push(r);
  if(r.test==='cleanup'&&(r.reached!==r.phase||r.active||r.protect||r.attached||r.action!=='skip'&&r.retained||r.action==='skip'&&r.wins!==2||r.action==='reset'&&r.hp<=0))bad.push(r);
  if(r.test==='real-pile-interrupt'&&(!r.attached||!r.pure)||r.test==='pile-cleanup'&&(r.held||r.protect||r.wins!==2))bad.push(r);
  if(r.test==='result-persistence'&&(r.scene!=='win'||r.phase!=='result'||r.trails!==24||r.pieces!==6||!r.stains))bad.push(r);
  if(r.test==='configured-auto-return'&&(r.scene!=='select'||!Array.isArray(r.grid)||r.prototype||r.retained||r.protected))bad.push(r);
  if(r.test==='configured-return-reselect'&&(r.chosen!=='sodom'||r.profile!=='sodom'||r.scene!=='fight'||r.active||r.protected))bad.push(r);
  if(r.test==='cpu-automatic'&&(r.phase!=='result'||r.wins!==2)||r.test==='edition-clear'&&(r.edition!=='ce'||r.active||r.retained||r.marks))bad.push(r);
  if(r.test==='native-error-fallback'&&(r.phase!=='idle'||r.hp!==0||r.protect||r.wins!==2||!r.reason?.startsWith('host-error:')))bad.push(r);
  if(r.test==='bounded-blood'&&(r.phase!=='result'||r.maximum>384||r.stains!==1536||r.pieces!==6||r.trails!==24))bad.push(r);
  if(r.test==='watchdog'&&(r.phase!=='idle'||r.fallbacks!==1||r.clears!==1))bad.push(r);
 }
 console.log(JSON.stringify({cases:result.rows.length,errors,bad},null,2));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
