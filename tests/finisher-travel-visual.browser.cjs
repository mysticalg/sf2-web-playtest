const{chromium,install,url,artifacts}=require('./browser-runtime.cjs'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>SF2?.VER.loading===2&&FIN&&window.SF2AIFinisherTunnel);const result=await page.evaluate(async()=>{
  await SF2AIFinisherTunnel.ready;const rows=[],shots={};let serial=0;
  for(const setup of[{side:0,p1:'ryu',p2:'abigail'},{side:1,p1:'ryu',p2:'ken'}]){
   FIN.clear('visual-test');await SF2AI.configure({...setup,mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;const w=P[setup.side],d=w.opp;w.WINS=1;w.X=(setup.side?480:360)*256;d.X=(setup.side?360:480)*256;w.FACE=setup.side?0:1;d.FACE=1-w.FACE;serial++;let seed=0;while(SF2AIFINISHERS.comboPlan(seed,serial).hits!==32)seed++;G.AIMatchSeed=seed;d.HP=0;FIN.offer(d,{unblocked:true});for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)SF2.step([0,0]);FIN.request(w.i,SF2AIRULES.mapping(w).find(m=>!m.command),{fresh:true,serial:G.tick});
   const origins=new Map(),changes=[],times=[],baseline=[],bounds=[],poses=new Set(),tunnel=SF2AIFinisherTunnel;let lastOrigin=0,rebaseCount=0,black=false,anchored=true,firstAir=false,firstTravel=false,firstContact=false;
   const render=()=>{const at=performance.now();SF2.render();c.getContext('2d').getImageData(0,0,384,224);return performance.now()-at;};
   for(let n=0;n<7000&&FIN.active();n++){
    SF2.step([0,0]);const f=FIN.info();if(f.phase==='idle')break;
    const origin=G.AIFinisherTravel?.worldOrigin||0;if(origin!==lastOrigin){rebaseCount++;lastOrigin=origin;}
    for(const t of FIN.trailState()){if(origins.has(t.tick)&&Math.abs(origins.get(t.tick)-t.origin)>.008)anchored=false;origins.set(t.tick,t.origin);black||=t.darkness===1;}
    if(f.contacts&&!f.events.some(e=>e.type==='final-strike'))poses.add(d.cur+':'+d.aidx);
    if(n%8===0&&f.contacts&&['combo','approach','special'].includes(f.phase)){
     const camera=FIN.cameraLock(),frame=FIN.framing();if(camera&&frame){const z=384/camera.width;bounds.push({left:(frame.left-camera.cam)*z,right:(frame.right-camera.cam)*z,top:200+z*(camera.vertical.main-frame.top)+camera.panY,bottom:200+z*(camera.vertical.main-frame.bottom)+camera.panY});}
     window.SF2AIFinisherTunnel=null;baseline.push(render());window.SF2AIFinisherTunnel=tunnel;times.push(render());
     const fx=tunnel.info();changes.push({draws:fx.draws,streaks:fx.streaks,alpha:fx.alpha});
     if(!firstContact){shots['portal-contact-'+setup.side]=c.toDataURL();firstContact=true;}
     if(!firstAir&&w.Y>20*256&&d.Y>20*256){shots['portal-air-'+setup.side]=c.toDataURL();firstAir=true;}
     if(!firstTravel&&Math.abs(f.travel)>1000){shots['portal-map-'+setup.side]=c.toDataURL();firstTravel=true;}
    }
   }
   const f=FIN.info(),quantile=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))];rows.push({side:setup.side,phase:f.phase,hits:f.contacts,target:f.targetHits,travel:f.travel,rebaseCount,anchored,black,poses:poses.size,draws:Math.max(...changes.map(x=>x.draws)),streaks:Math.max(...changes.map(x=>x.streaks)),baselineP50:quantile(baseline,.5),baselineP95:quantile(baseline,.95),effectP50:quantile(times,.5),effectP95:quantile(times,.95),samples:times.length,bounds,trails:f.trails,abort:G.AIFinisherAbort||null});
  }return{rows,shots};
 });
 for(const[name,data]of Object.entries(result.shots))fs.writeFileSync(artifacts(name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.shots;fs.writeFileSync(artifacts('finisher-travel-visual.json'),JSON.stringify({result,errors},null,2));console.log(JSON.stringify({rows:result.rows.map(({bounds,...r})=>({...r,clipped:bounds.filter(b=>b.left< -1||b.right>385||b.top<55||b.bottom>217).length})),errors}));assert.deepEqual(errors,[]);for(const r of result.rows){assert.equal(r.phase,'result');assert.equal(r.hits,r.target);assert.equal(r.abort,null);assert(r.rebaseCount>1);assert(r.anchored&&r.black);assert(r.poses>1);assert(r.draws<=16&&r.streaks<=48);assert(r.samples>20);assert.equal(r.trails,0);assert(r.bounds.every(b=>b.left>=-1&&b.right<=385&&b.top>=55&&b.bottom<=217),JSON.stringify(r.bounds.filter(b=>b.left< -1||b.right>385||b.top<55||b.bottom>217)));}
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
