// Native original-input arcade regression. ROM remains local to the browser.
const {chromium,repo}=require('./browser-runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const fixture=JSON.parse(fs.readFileSync(process.env.SF2_NATIVE_FIXTURE||path.join(__dirname,'fixtures','ssf2t-cammy-arcade.json'),'utf8'));
 const input=Buffer.alloc(fixture.frames*2);let at=0;
 for(const[key,count]of fixture.inputRLE)for(let n=0;n<count;n++)input.writeUInt16LE(key,at++*2);
 assert.equal(at,fixture.frames);assert.equal(crypto.createHash('sha256').update(input).digest('hex'),fixture.inputSHA256);
 const browser=await chromium.launch({args:['--disable-http2']}),page=await browser.newPage(),errors=[],methods=[];
 try{
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>methods.push(r.method()));
  await page.goto(process.env.SF2_NATIVE_URL||'http://127.0.0.1:8765/ssf2t-ai/?manual=1',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>!document.querySelector('#rom').disabled,null,{timeout:120000});
  await page.setInputFiles('#rom',process.env.SF2_NATIVE_ROM||'E:/Downloads/ssf2t.zip');
  await page.waitForFunction(()=>SSF2TNative.state().ready);
  const result=await page.evaluate(async f=>{
   const a=SSF2TNative;a.reset();let frame=0,stateChecks=0,pictureChecks=0,roundWins=0,roundLosses=0,lastResult=0,maxLadder=0,ending=false,title=false,finalAkuma=false;
   const states=new Map(f.states.map(s=>[s.frame,s]));
   const digest=bytes=>crypto.subtle.digest('SHA-256',bytes).then(x=>Array.from(new Uint8Array(x)).map(v=>v.toString(16).padStart(2,'0')).join(''));
   for(const[key,count]of f.inputRLE)for(let i=0;i<count;i++){
    frame++;a.advance(1,key,0,Object.hasOwn(f.pictures,frame));
    if(frame===f.settingAfterFrame)a.setting(0,f.difficulty);
    const ref=states.get(frame);
    if(ref){
     const s=a.state(),p=s.players,actual={frame,gameStep:s.gameStep,matchStep:s.matchStep,stage:s.stage,ladder:a.read(0xff8c50),result:a.read(0xff8dd2,1),p1wins:a.read(0xff87de,1),p2wins:a.read(0xff8bde,1),hp1:p[0].hp,hp2:p[1].hp,x1:p[0].x,x2:p[1].x,y1:p[0].y,y2:p[1].y,state1:p[0].state,state2:p[1].state,gauge:a.read(0xff8702,1),mode:s.mode,p1char:p[0].id,p2char:p[1].id,p1akuma:+p[0].akuma,p2akuma:+p[1].akuma,playersIn:s.playersIn};
     for(const[k,v]of Object.entries(ref))if(actual[k]!==v)throw Error('Frame '+frame+' '+k+': '+actual[k]+' != '+v);
     if(s.error||s.cpuFallback||s.soundFallback)throw Error('Uncovered native dispatch');
     if(s.playersIn===1){
      maxLadder=Math.max(maxLadder,actual.ladder);
      if(s.gameStep===4){if(p[0].id!==f.fighter)throw Error('Unexpected playable fighter');if(actual.ladder===f.matches-1&&p[1].akuma)finalAkuma=true;}
      if(s.gameStep===4&&actual.result!==lastResult){if(actual.result===1)roundWins++;if(actual.result===2)roundLosses++;}
      if(s.gameStep===6&&actual.ladder===f.matches)ending=true;
     }
     lastResult=actual.result;if(ending&&s.mode===0)title=true;stateChecks++;
    }
    if(Object.hasOwn(f.pictures,frame)){
     const rgba=a.pixels(),rgb=new Uint8Array(rgba.length/4*3);
     for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2];}
     if(await digest(rgb)!==f.pictures[frame])throw Error('RGB differs at '+frame);pictureChecks++;
    }
   }
   return{frame,stateChecks,pictureChecks,roundWins,roundLosses,maxLadder,ending,title,finalAkuma};
  },fixture);
  assert.equal(result.frame,fixture.frames);assert.equal(result.stateChecks,fixture.states.length);assert.equal(result.pictureChecks,Object.keys(fixture.pictures).length);
  assert.equal(result.roundWins,fixture.roundWins);assert.equal(result.roundLosses,fixture.roundLosses);assert.equal(result.maxLadder,fixture.matches);assert.ok(result.ending);assert.ok(result.title);
  assert.equal(result.finalAkuma,fixture.cpuAkumaFinal);
  assert.deepEqual(errors,[]);assert.ok(methods.every(m=>m==='GET'),'ROM workflow must not upload files');
  const out=process.env.SF2_NATIVE_PROOF||path.join(repo,'work','ssf2t-cammy-proof.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({result,errors,methods},null,2));
  console.log(JSON.stringify({result,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
