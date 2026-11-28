const {chromium,install,url,artifacts}=require('./browser-runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage(),errors=[];
 try{
  page.on('pageerror',e=>errors.push(e.message));await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>SF2?.VER.loading===2&&window.FIN);
  const rows=await page.evaluate(async()=>{
   const rows=[];let serial=0;
   for(const side of[0,1]){
    FIN.clear('test');await SF2AI.configure({p1:side?'ryu':'guy',p2:side?'guy':'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;
    const w=P[side],d=w.opp;AICFG.selectedProfiles[1-side]=null;setfighter(d,1);
    function setup(){resetround();G.gph=1;G.hfz=G.slow=0;w.WINS=1;w.X=(side?500:340)*256;d.X=(side?340:500)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;d.HP=0;}
    // Use the same real finisher IDs as the all-roster regression. This selects
    // Guy's wall kick in the actual stage-12 rotation, without altering its plan.
    const wanted=side?42:20;while(serial<wanted-1){setup();FIN.offer(d,{unblocked:true});serial++;FIN.clear('test');}
    setup();serial++;let seed=0;while(SF2AIFINISHERS.comboPlan(seed,serial).hits!==16)seed++;G.AIMatchSeed=seed;
    let failure=null;Object.defineProperty(G,'AIFinisherAbort',{configurable:true,get:()=>failure?.reason,set:reason=>{failure={reason,info:FIN.info(),move:JSON.parse(JSON.stringify(FIN.nativeMove())),w:{x:w.X/256,y:w.Y/256,state:w.ST},d:{x:d.X/256,y:d.Y/256,state:d.ST}};}});
    FIN.offer(d,{unblocked:true});for(let n=0;n<400&&FIN.info().phase!=='prompt';n++)SF2.step([0,0]);
    FIN.request(side,{index:2,strength:2},{fresh:true,serial:G.tick});const start=FIN.info(),trace=[],completed=[];let lastCompleted=-1;
    for(let n=0;n<4200&&FIN.active();n++){
     SF2.step([0,0]);const f=FIN.info(),move=FIN.nativeMove(),s=w.AIHeroMove;
     if(s?.style==='wall')trace.push({tick:G.tick,stage:f.stage,phase:s.phase,age:s.age,fromX:s.fromX/256,wallX:s.wallX/256,travel:s.travel,x:w.X/256,y:w.Y/256,vx:w.VX/256,vy:w.VY/256,entry:w.aidx,cur:w.cur,dX:d.X/256,dY:d.Y/256,attack:boxw(w,4),hurt:[0,1,2].map(k=>boxw(d,k)),contacts:f.contacts,worldOrigin:G.AIFinisherTravel?.worldOrigin||0});
     if(move?.finished&&move.started!==lastCompleted){completed.push(JSON.parse(JSON.stringify(move)));lastCompleted=move.started;}
    }
    const f=failure?.info||FIN.info();rows.push({side,id:start.id,rotation:start.actions,phase:FIN.info().phase,target:f.targetHits,hits:f.contacts,events:f.events,completed,trace,failure,deathVoice:G.AIFinisherDeathVoice,echo:soundStats.lastFinalHit});delete G.AIFinisherAbort;
   }return rows;
  });
  fs.writeFileSync(artifacts('finisher-guy-wall.json'),JSON.stringify({rows,errors},null,2));console.log(JSON.stringify(rows.map(r=>({side:r.side,id:r.id,phase:r.phase,hits:r.hits,target:r.target,wallMoves:r.completed.filter(m=>m.action.index===2&&m.action.kind==='special').map(m=>({contacts:m.contacts,frames:m.sourceFrames,aim:m.wallAim})),failure:r.failure})),null,2));
  assert.deepEqual(errors,[]);
  for(const row of rows){assert.equal(row.rotation[12].index,2);assert.equal(row.phase,'result');assert.equal(row.hits,row.target);assert.equal(row.failure,null);const walls=row.completed.filter(m=>m.action.kind==='special'&&m.action.index===2);assert.equal(walls.length,2,'Complete both the real rotated wall kick and selected final wall kick');for(const move of walls){assert(move.contacts>0);assert(move.sourceFrames.some(f=>f==='111:1'),'Progress into original active wall-kick frame');assert(move.finished,'Finish original wall move before handing off');for(const hit of move.contactFrames)assert(hit.attack&&hit.hurt.some(h=>h&&Math.abs(hit.attack[0]-h[0])<=hit.attack[2]+h[2]&&Math.abs(hit.attack[1]-h[1])<=hit.attack[3]+h[3]),'Count only real source attack/hurt overlap');}const last=row.events.find(e=>e.type==='final-strike');assert.equal(row.deathVoice.tick,last.tick);assert.equal(row.echo.tick,last.tick);}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});

