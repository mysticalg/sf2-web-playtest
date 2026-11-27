const {chromium}=require('./browser-runtime.cjs'),fs=require('fs'),assert=require('assert/strict');
const path=require('path');const output=process.env.SF2_DIAGNOSTIC_PROOF||path.join(__dirname,'../work/native-shortcuts/browser-diagnostic-proof.json');fs.mkdirSync(path.dirname(output),{recursive:true});
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errors=[],results=[];p.on('pageerror',e=>errors.push(e.stack||e.message));try{
 await p.addInitScript(()=>{let factory;Object.defineProperty(window,'createSSF2TNative',{configurable:true,get(){return factory;},set(f){factory=(...args)=>f(...args).then(m=>{window.__nativeTestModule=m;return m;});}});});
 await p.goto(process.env.SF2_NATIVE_URL||'http://127.0.0.1:8765/ssf2t-ai/?manual=1&shortcuts=0');await p.waitForFunction(()=>!document.querySelector('#rom').disabled);await p.setInputFiles('#rom',process.env.SF2_NATIVE_ROM||'E:/Downloads/ssf2t.zip');await p.waitForFunction(()=>SSF2TNative.state().ready);
 await p.addScriptTag({content:fs.readFileSync(path.join(__dirname,'fixtures/native-shortcut-harness.js'),'utf8').replace('return{setup,test,raw};','return{setup,test,raw,findRAM};')});
 for(const fixture of JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/ssf2t-native-shortcut-diagnostics.json'),'utf8'))){
  const result=await p.evaluate(async f=>{
   const a=SSF2TNative,m=__nativeTestModule; a.setShortcuts(false);a.reset();let ram=null,frame=0,stateChecks=0,pictureChecks=0,writeCount=0,audioLength=0;const audio=[],states=new Map(f.states.map(s=>[+s.frame,s])),writes=new Map();for(const w of f.writes){if(!writes.has(w.frame))writes.set(w.frame,[]);writes.get(w.frame).push(w);}
   const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
   for(const [k,j,n]of f.inputs)for(let t=0;t<n;t++){
    frame++;for(const w of writes.get(frame)||[]){if(![0xff8702,0xff8b02,0xff8454,0xff8455,0xff8854,0xff8855].includes(w.address))throw Error('Unapproved diagnostic write');ram??=NativeShortcutDiagnostic.findRAM();m.HEAPU8[ram.base+((w.address&65535)^ram.swap)]=w.value;writeCount++;}
    a.advance(1,k,j,!!f.pictures[frame]);const count=m._ssf_audio_count(),pointer=m._ssf_audio(),chunk=m.HEAPU8.slice(pointer,pointer+count*2);audio.push(chunk);audioLength+=chunk.length;
    const ref=states.get(frame);if(ref){const s=a.state(),q=s.players;const actual={frame:s.frame,pc:s.pc.toString(16).padStart(6,'0'),game:s.gameStep,match:s.matchStep,id1:q[0].id,id2:q[1].id,hp1:q[0].hp,hp2:q[1].hp,x1:q[0].x,x2:q[1].x,y1:q[0].y,y2:q[1].y};for(const key of Object.keys(actual))if(String(actual[key])!==ref[key])throw Error(f.name+' frame '+frame+' '+key+': '+actual[key]+' != '+ref[key]);stateChecks++;}
    if(f.pictures[frame]){const width=m._ssf_width(),pixels=m.HEAPU8.subarray(m._ssf_pixels(),m._ssf_pixels()+width*224*4),rgb=new Uint8Array(width*224*3);for(let i=0,j=0;i<pixels.length;i+=4){rgb[j++]=pixels[i];rgb[j++]=pixels[i+1];rgb[j++]=pixels[i+2];}if(await digest(rgb)!==f.pictures[frame])throw Error(f.name+' picture '+frame);pictureChecks++;}
   }
   const pcm=new Uint8Array(audioLength);let offset=0;for(const chunk of audio){pcm.set(chunk,offset);offset+=chunk.length;}if(await digest(pcm)!==f.audioSHA256)throw Error(f.name+' audio mismatch');return{name:f.name,frames:frame,stateChecks,pictureChecks,audioBytes:audioLength,loggedWrites:writeCount,error:a.state().error};
  },fixture);assert.equal(result.frames,fixture.frames);assert.ok(!result.error);results.push(result);console.log(JSON.stringify(result));fs.writeFileSync(output,JSON.stringify({results,errors},null,2));
 }
 assert.deepEqual(errors,[]);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
