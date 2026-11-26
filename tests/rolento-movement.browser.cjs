const {chromium,url}=require('./browser-runtime.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({args:['--disable-http2']}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>SF2.VER.loading===2,null,{timeout:90000});
 const result=await page.evaluate(async()=>{
  const rows=[],shots={};
  for(const side of [0,1])for(const button of [16,256]){
   await SF2AI.configure({p1:side?'ryu':'rolento',p2:side?'rolento':'ryu',mode:'versus',training:false,seed:42});
   SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   const a=P[side],d=a.opp;a.X=(side?550:250)*256;d.X=(side?350:450)*256;a.FACE=side?0:1;d.FACE=side?1:0;d.HP=10000;
   const tick=key=>{const keys=[0,0];keys[side]=key;SF2.step(keys);};
   for(let i=0;i<50;i++)tick(8);
   tick(4|button);
   const phases=[],frames=new Set(),contacts=[];let hp=d.HP,maxY=0,style=a.MV?.style;
   for(let i=0;i<200;i++){
    if(a.MV?.style)style=a.MV.style;
    const phase=a.AIFFMove?.phase;
    if(phase!==undefined&&!phases.includes(phase)){phases.push(phase);SF2.render();shots[side+'-'+button+'-'+phase]=c.toDataURL();}
    frames.add(ent(a)[0]);maxY=Math.max(maxY,a.Y/256);
    if(d.HP!==hp){contacts.push(hp-d.HP);hp=d.HP;}
    tick(0);
   }
   rows.push({side,button,style,phases,frames:[...frames],maxY,contacts,state:a.ST,y:a.Y});
  }
  for(const side of [0,1]){
   await SF2AI.configure({p1:side?'ryu':'rolento',p2:side?'rolento':'ryu',mode:'versus',training:false,seed:42});
   SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   const a=P[side],d=a.opp;a.X=(side?550:250)*256;d.X=(side?350:450)*256;a.FACE=side?0:1;d.FACE=side?1:0;d.HP=10000;
   const tick=key=>{const keys=[0,0];keys[side]=key;SF2.step(keys);};
   const contacts=[],released=new Set();let hp=d.HP;
   tick(272);
   for(let i=0;i<220;i++){
    tick(0);for(const g of a.AIFFGrenades||[])released.add(g.index);
    if(d.HP!==hp){contacts.push(hp-d.HP);hp=d.HP;SF2.render();shots['barrage-'+side+'-'+contacts.length]=c.toDataURL();}
   }
   rows.push({test:'barrage',side,released:[...released],contacts,state:a.ST,remaining:a.AIFFGrenades?.length||0});
  }
  for(const side of [0,1])for(const button of [128,256,512]){
   await SF2AI.configure({p1:side?'ryu':'rolento',p2:side?'rolento':'ryu',mode:'versus',training:false,seed:42});
   SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   const a=P[side],d=a.opp;a.X=(side?550:250)*256;d.X=(side?300:500)*256;a.FACE=side?0:1;d.FACE=side?1:0;
   const tick=key=>{const keys=[0,0];keys[side]=key;SF2.step(keys);};
   for(let i=0;i<15;i++)tick(8);
   const start=a.X;tick(8|button);const frames=new Set();
   for(let i=0;i<80;i++){tick(8);if(a.ST===1){frames.add(ent(a)[0]);if(ent(a)[0]===18&&!shots['slide-'+side+'-'+button]){SF2.render();shots['slide-'+side+'-'+button]=c.toDataURL();}}}
   rows.push({test:'slide',side,button,distance:Math.abs(a.X-start)/256,frames:[...frames],state:a.ST,y:a.Y});
  }
  for(const side of [0,1])for(const wall of [false,true]){
   await SF2AI.configure({p1:side?'ryu':'rolento',p2:side?'rolento':'ryu',mode:'versus',training:false,seed:42});
   SF2.freeze=1;G.gph=1;G.hfz=G.slow=0;IDEL=0;
   const a=P[side],d=a.opp;a.X=(side?550:250)*256;d.X=(side?250:550)*256;a.FACE=side?0:1;d.FACE=side?1:0;
   const tick=key=>{const keys=[0,0];keys[side]=key;SF2.step(keys);};
   const room=aiRoom();if(wall)a.X=(side?room.right-42:room.left+42)*256;
   const frames=new Set();let bounced=0,maxY=0;
   for(let i=0;i<220;i++){
    tick(i<100?(wall?4|(i<6?(side?2:1):(side?1:2)):4):0);
    if(a.ST===2){frames.add(ent(a)[0]);maxY=Math.max(maxY,a.Y/256);bounced=Math.max(bounced,a.AIFFWall?.count||0);if(i===15){SF2.render();shots['jump-'+side+'-'+wall]=c.toDataURL();}}
   }
   rows.push({test:'jump',side,wall,frames:[...frames],bounced,maxY,state:a.ST,y:a.Y,rollFrames:SF2AIFF.get('rolento').data.acrobaticFrames});
  }
  return{rows,shots};
 });
 fs.mkdirSync('work/rolento-tests',{recursive:true});
 for(const[name,data]of Object.entries(result.shots))fs.writeFileSync('work/rolento-tests/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
 delete result.shots;fs.writeFileSync('work/rolento-tests/result.json',JSON.stringify({result,errors},null,2));
 console.log(JSON.stringify({result,errors}));await browser.close();
 assert.deepEqual(errors,[]);
 for(const r of result.rows){if(r.test==='barrage'){assert.deepEqual(r.released,[0,1,2]);assert.equal(r.contacts.length,3);assert.equal(r.remaining,0);}else if(r.test==='slide'){assert.ok(r.distance>10);assert.ok(r.frames.includes(18));assert.equal(r.state,3);continue;}else if(r.test==='jump'){assert.ok(r.frames.every(f=>r.rollFrames.includes(f)));assert.ok(r.frames.length>=3);assert.ok(r.maxY>70);if(r.wall)assert.ok(r.bounced>0,JSON.stringify(r));assert.equal(r.y,0);}else{assert.equal(r.style,r.button===16?'wallpunch':'wallkick');for(const phase of ['approach','wall','dive','recover'])assert.ok(r.phases.includes(phase),JSON.stringify(r));assert.ok(r.maxY>100);assert.equal(r.y,0);assert.equal(r.contacts.length,1);}assert.equal(r.state,0);}
})().catch(e=>{console.error(e);process.exit(1)});
