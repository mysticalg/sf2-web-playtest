const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const rows=await page.evaluate(async()=>{
  const rows=[];let serial=0;
  for(const side of[0,1])for(const hits of[32,200]){
   FIN.clear('test');await SF2AI.configure({p1:side?'ken':'ryu',p2:side?'ryu':'ken',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;G.gph=1;G.hfz=G.slow=0;SF2AI.setSound(true);const w=P[side],d=w.opp;w.WINS=1;w.X=(side?470:350)*256;d.X=(side?350:470)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;
   let seed=0;serial++;while(SF2AIFINISHERS.comboPlan(seed,serial).hits!==hits)seed++;G.AIMatchSeed=seed;d.HP=1;hpDamage(d,20);for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)SF2.step([0,0]);FIN.request(side,SF2AIRULES.mapping(w)[0],{fresh:true,serial:G.tick});
   let firstTrail=null,final=null,stops=0;const original=aiEchoStop;aiEchoStop=function(){stops++;return original();};
   for(let n=0;n<4200&&FIN.active();n++){SF2.step([0,0]);const info=FIN.info();if(firstTrail===null&&info.trails)firstTrail=G.tick;if(!final&&info.events.some(e=>e.type==='final-strike'))final={tick:G.tick,trails:info.trails,nodes:AI_ECHO.nodes.length,stops};}
   const info=FIN.info(),firstContact=info.events.find(e=>e.type==='contact')?.tick,trailStop=info.events.find(e=>e.type==='trails-stopped')?.tick,atResult=info.trails,stopsBeforeReset=stops;FIN.clear('reset-proof');const afterReset={trails:FIN.trailState().length,nodes:AI_ECHO.nodes.length,stops};aiEchoStop=original;
   rows.push({side,hits,actual:info.contacts,phase:info.phase,firstTrail,firstContact,final,trailStop,atResult,stopsBeforeReset,afterReset});
  }
  return rows;
 });
 fs.writeFileSync(artifacts('finisher-trail-stop.json'),JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({rows,errors},null,2));assert.deepEqual(errors,[]);for(const r of rows){assert.equal(r.phase,'result');assert.equal(r.actual,r.hits);assert.equal(r.firstTrail,r.firstContact);assert.equal(r.final.trails,0);assert.equal(r.final.nodes,6);assert.equal(r.final.stops,0);assert.equal(r.trailStop,r.final.tick);assert.equal(r.atResult,0);assert.equal(r.stopsBeforeReset,0);assert.equal(r.afterReset.trails,0);assert.equal(r.afterReset.nodes,0);assert.equal(r.afterReset.stops,1);}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
