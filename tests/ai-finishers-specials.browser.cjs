const{chromium,install,artifacts,url}=require('./browser-runtime.cjs'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({args:['--disable-http2']}),p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await install(p);await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>SF2.VER.loading===2&&window.FIN,null,{timeout:90000});
 const rows=await p.evaluate(async()=>{
  const rows=[],profiles=[...CE_KEYS.map((name,id)=>({name,id})),...Object.keys(AI_PROFILES).filter(name=>!['ryu','ken'].includes(name)).map(name=>({name,id:null}))];
  for(const side of[0,1])for(const profile of profiles){
   let choices=null;
   for(let choiceIndex=0;choices===null||choiceIndex<choices.length;choiceIndex++){
    FIN.clear('test');await SF2AI.configure({p1:side?'ryu':profile.id===null?profile.name:'ryu',p2:side?profile.id===null?profile.name:'ryu':'ryu',mode:'versus',training:false,seed:6453});SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;
    const w=P[side],d=w.opp;if(profile.id!==null){AICFG.selectedProfiles[side]=null;setfighter(w,profile.id);resetround();G.gph=1;}w.X=(side?480:360)*256;d.X=(side?360:480)*256;w.FACE=side?0:1;d.FACE=side?1:0;w.WINS=1;d.HP=0;
    choices??=SF2AIRULES.mapping(w).filter(m=>m.command!=='rift').filter((m,i,a)=>a.findIndex(n=>n.index===m.index&&(n.command||null)===(m.command||null))===i);
    const choice=choices[choiceIndex];if(!choice)break;
    const offered=FIN.offer(d,{unblocked:true});for(let t=0;t<25;t++)SF2.step([0,0]);const accepted=FIN.request(w.i,choice,{fresh:true,serial:G.tick});let frames=0,last=null,moves=[];
    for(;frames<2100&&FIN.active();frames++){
     SF2.step([0,0]);const m=FIN.nativeMove();if(m&&last!==m.started){moves.push(m);last=m.started;}else if(m)moves[moves.length-1]=m;
    }
    rows.push({side,profile:profile.name,choice:{index:choice.index,command:choice.command||null,name:choice.name},offered,accepted,frames,info:FIN.info(),abort:G.AIFinisherAbort||null,moves,wins:w.WINS,hp:d.HP,protect:!!d.AIFinishProtected});delete G.AIFinisherAbort;
   }
  }
  return rows;
 });
 fs.writeFileSync(artifacts('specials.json'),JSON.stringify({rows,errors},null,2));const bad=rows.filter(r=>r.info.phase!=='result'||!r.offered||!r.accepted||r.abort);
 console.log(JSON.stringify({cases:rows.length,errors,bad:bad.map(r=>({side:r.side,profile:r.profile,choice:r.choice,stage:r.info.stage,abort:r.abort,moves:r.moves.map(m=>[m.nativeName,m.contacts])}))},null,2));
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);for(const r of rows){assert.equal(r.wins,2);assert.equal(r.hp,0);assert.equal(r.protect,false);assert.deepEqual(r.moves.filter(m=>m.action.kind==='normal').map(m=>m.action.button),[0,1,2,3,4,5]);assert.ok(r.moves.every(m=>m.contacts>0));}
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
