// Admission diagnostics use logged gauge/position writes and checkpoint restores.
// They prove native move activation, not input-only arcade completion.
const {chromium,repo}=require('./browser-runtime.cjs'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch(),p=await b.newPage(),errors=[],results=[];p.on('pageerror',e=>errors.push(e.stack||e.message));try{
 await p.addInitScript(()=>{let factory;Object.defineProperty(window,'createSSF2TNative',{configurable:true,get(){return factory;},set(f){factory=(...args)=>f(...args).then(m=>{window.__nativeTestModule=m;return m;});}});});
 await p.goto(process.env.SF2_NATIVE_URL||'http://127.0.0.1:8765/ssf2t-ai/?manual=1&shortcuts=0');await p.waitForFunction(()=>!document.querySelector('#rom').disabled);await p.setInputFiles('#rom',process.env.SF2_NATIVE_ROM||'E:/Downloads/ssf2t.zip');await p.waitForFunction(()=>SSF2TNative.state().ready);
 await p.addScriptTag({path:path.join(__dirname,'fixtures/native-shortcut-harness.js')});
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/ssf2t-shortcut-activations.json'),'utf8'));let setup='';
 for(const f of fixture){const key=[f.slot,f.old,f.id].join(':');if(key!==setup){await p.evaluate(f=>NativeShortcutDiagnostic.setup(f.id,f.slot,f.old),f);setup=key;}
  const r=await p.evaluate(pair=>NativeShortcutDiagnostic.test(pair),f.pair);assert.ok(!r.error,JSON.stringify(r));assert.equal(r.name,f.name);assert.equal(r.special?.frame,f.nativeFrame,JSON.stringify({fixture:f,actual:r}));if(f.spent!==null)assert.equal(r.spent,f.spent);results.push({id:r.id,slot:r.slot,old:r.old,pair:r.pair,nativeFrame:r.special.frame,spent:r.spent});
 }
 await p.evaluate(()=>NativeShortcutDiagnostic.setup(11));const vega=await p.evaluate(()=>NativeShortcutDiagnostic.test(4,{followAt:150,frames:300}));assert.equal(vega.spent,true);assert.ok(vega.hp[1]<144);assert.ok(vega.lift>0);
 assert.deepEqual(errors,[]);const out=process.env.SF2_SHORTCUT_PROOF||path.join(repo,'work/native-shortcuts/activation-proof.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({cases:results.length,results,vegaContact:{spent:vega.spent,hp:vega.hp,lift:vega.lift},errors},null,2));console.log(JSON.stringify({cases:results.length,vegaContact:true,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
