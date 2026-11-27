const{chromium,repo}=require('./browser-runtime.cjs'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({args:['--disable-http2']}),p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 await p.goto(process.env.SF2_NATIVE_URL||'http://127.0.0.1:8765/ssf2t-ai/?manual=1',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>!document.querySelector('#rom').disabled);await p.setInputFiles('#rom',process.env.SF2_NATIVE_ROM||'E:/Downloads/ssf2t.zip');await p.waitForFunction(()=>SSF2TNative.state().ready);
 const f=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/ssf2t-cammy-arcade.json'),'utf8'));
 const r=await p.evaluate(f=>{
  const a=SSF2TNative;a.reset();const checkpoints=[],shots={};let frame=0,capture=false,low=false,scroll=false,previous=null;
  for(const[key,count]of f.inputRLE)for(let n=0;n<count;n++){
   frame++;a.advance(1,key,0,true);if(frame===3001)a.setting(0,0);const fx=a.aiEffects();
   if(!capture&&fx.particles>8){a.advance(0,0,0,true);shots.hit=document.querySelector('canvas').toDataURL();capture=true;checkpoints.push({kind:'hit',frame,fx});}
   if(!low&&fx.drips>3){a.advance(0,0,0,true);shots.low=document.querySelector('canvas').toDataURL();low=true;checkpoints.push({kind:'low',frame,fx});}
   const s=a.aiSnapshot();if(!scroll&&s&&previous&&s.camera.x!==previous.camera.x&&fx.stains>5){scroll=true;checkpoints.push({kind:'scroll',frame,camera:s.camera,previous:previous.camera,fx});}previous=s;
   if(capture&&low&&scroll&&fx.stains>15){
    a.advance(0,0,0,true);const c=document.querySelector('canvas'),ctx=c.getContext('2d'),raw=a.pixels(),before=ctx.getImageData(0,0,c.width,c.height).data;let difference=0;for(let i=0;i<raw.length;i++)if(i%4!==3&&raw[i]!==before[i])difference++;
    const state=JSON.stringify(a.state());const toggle=document.querySelector('#ai-effects');toggle.checked=false;toggle.dispatchEvent(new Event('change'));const after=ctx.getImageData(0,0,c.width,c.height).data;let faithfulDifference=0;for(let i=0;i<raw.length;i++)if(i%4!==3&&raw[i]!==after[i])faithfulDifference++;
    const pure=state===JSON.stringify(a.state());shots.original=c.toDataURL();return{checkpoints,stats:fx,difference,faithfulDifference,pure,disabled:a.aiEffects(),shots};
   }
  }
  throw Error('Native tape did not produce required effects: '+JSON.stringify(a.aiEffects()));
 },f);
 const guard=await p.evaluate(()=>{
  const a=SSF2TNative,toggle=document.querySelector('#ai-effects');toggle.checked=true;toggle.dispatchEvent(new Event('change'));
  a.boot();a.advance(30,2048,0,false);a.advance(30,0,0,false);a.advance(30,2048,0,false);a.advance(60,0,0,false);a.advance(12,1024,0,false);a.advance(238,0,0,false);a.advance(3,4,0,false);a.advance(9,0,0,false);a.advance(12,16,0,false);
  for(let i=0;i<2000&&a.state().matchStep!==10;i++)a.advance(1,0,0,false);
  for(let i=0;i<2400;i++){const before=a.aiEffects();a.advance(1,6,0,true);const after=a.aiEffects();if(after.blocked>before.blocked){const shot=document.querySelector('canvas').toDataURL(),state=a.state();document.querySelector('#reset').click();return{before,after,state,shot,reset:a.aiEffects()};}}
  throw Error('Ordinary crouch-block input never produced guarded chip damage');
 });
 assert.equal(guard.after.hits,guard.before.hits);assert.equal(guard.after.spawned,guard.before.spawned);assert.equal(guard.state.players[0].state,8);assert.equal(guard.reset.particles,0);assert.equal(guard.reset.stains,0);assert.equal(guard.reset.hits,0);
 r.shots.guard=guard.shot;delete guard.shot;r.guard=guard;
 const out=path.join(repo,'work','native-ai-effects');fs.mkdirSync(out,{recursive:true});for(const[k,data]of Object.entries(r.shots))fs.writeFileSync(path.join(out,k+'.png'),Buffer.from(data.split(',')[1],'base64'));delete r.shots;fs.writeFileSync(path.join(out,'proof.json'),JSON.stringify({result:r,errors},null,2));console.log(JSON.stringify({checkpoints:r.checkpoints,stats:r.stats,difference:r.difference,faithfulDifference:r.faithfulDifference,pure:r.pure,errors}));
 assert.deepEqual(errors,[]);assert.ok(r.difference>0);assert.equal(r.faithfulDifference,0);assert.ok(r.pure);assert.equal(r.disabled.particles,0);assert.equal(r.disabled.stains,0);assert.ok(r.stats.particles<=480&&r.stats.stains<=320);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
