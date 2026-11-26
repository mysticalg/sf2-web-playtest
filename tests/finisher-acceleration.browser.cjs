const{chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({args:['--disable-http2']}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await install(p);await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>SF2.VER.loading===2&&window.FIN);
 const result=await p.evaluate(async()=>{const rows=[],shots={};let serial=0;
  const profiles=[...CE_KEYS.map((name,id)=>({name,id})),...['damnd','sodom','andore','edi','rolento','abigail','belger','guy','cody','haggar'].map(name=>({name,id:null}))];
  for(const side of[0,1])for(const profile of profiles){
   FIN.clear('test');await SF2AI.configure({p1:side?'ryu':profile.id===null?profile.name:'ryu',p2:side?profile.id===null?profile.name:'ryu':'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   const w=P[side],d=w.opp;if(profile.id!==null){AICFG.selectedProfiles[side]=null;setfighter(w,profile.id);}const victimId=[0,1,2,5,6,7][profiles.indexOf(profile)%6];AICFG.selectedProfiles[1-side]=null;setfighter(d,victimId);resetround();G.gph=1;w.WINS=1;w.X=(side?500:340)*256;d.X=(side?340:500)*256;w.FACE=side?0:1;d.FACE=side?1:0;d.HP=0;
   serial++;let seed=0;while(SF2AIFINISHERS.comboPlan(seed,serial).hits!==80)seed++;G.AIMatchSeed=seed;
   FIN.offer(d,{unblocked:true});for(let n=0;n<150&&FIN.info().phase!=='prompt';n++)SF2.step([0,0]);
   const choice=SF2AIRULES.mapping(w).find(m=>!m.command);FIN.request(w.i,choice,{fresh:true,serial:G.tick});let firstShot=false,lastShot=false,ticks=0;
   for(;ticks<2300&&FIN.active();ticks++){SF2.step([0,0]);const info=FIN.info();if(profile.name==='ryu'&&side===0&&((!firstShot&&info.contacts===3)||(!lastShot&&info.contacts>=72))){SF2.render();shots[info.contacts<10?'opening':'flurry']=c.toDataURL();if(info.contacts<10)firstShot=true;else lastShot=true;}}
   const info=FIN.info(),contacts=info.events.filter(e=>e.type==='contact'),gaps=contacts.slice(1,-1).map((e,i)=>e.tick-contacts[i].tick),average=a=>a.reduce((n,v)=>n+v,0)/a.length;
   rows.push({profile:profile.name,victim:CE_KEYS[victimId],side,ticks,seed,phase:info.phase,target:info.targetHits,hits:info.contacts,normalOrder:info.normalOrder,early:average(gaps.slice(0,4)),late:average(gaps.slice(-10)),finalEvent:info.events.find(e=>e.type==='final-strike'),special:G.AIFinisherContact?.special,removed:info.removed,abort:G.AIFinisherAbort||null});delete G.AIFinisherAbort;
  }return{rows,shots};
 });
 for(const[name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts('acceleration-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;fs.writeFileSync(artifacts('acceleration.json'),JSON.stringify({result,errors},null,2));
 const bad=result.rows.filter(r=>r.phase!=='result'||r.hits!==80||r.target!==80||!r.special||r.abort||r.early<r.late*2||r.late>6);console.log(JSON.stringify({cases:result.rows.length,errors,bad:bad.map(({normalOrder,...r})=>r)}));await b.close();assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
})().catch(e=>{console.error(e);process.exit(1)});
