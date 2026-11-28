const {chromium,install,url,artifacts}=require('./browser-runtime.cjs'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch(),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await install(page);await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.SF2?.VER.loading===2&&FIN,null,{timeout:120000});
 const rows=await page.evaluate(async()=>{
  const rows=[],actions=[{fid:1,button:2,cue:0x47},{fid:1,button:5,cue:0x47},{fid:2,button:1,cue:0x27},{fid:6,button:1,cue:0x2e},{fid:6,kind:'spd',cue:0x2e},{fid:7,button:1,cue:0x29},{fid:10,button:1,cue:0x2c}];
  for(const action of actions)for(const side of[0,1]){
   FIN.clear('grab-audio');await SF2AI.configure({p1:'ryu',p2:'ryu',mode:'versus',training:false,seed:42});SF2.freeze=1;IDEL=0;AICFG.selectedProfiles[side]=null;setfighter(P[side],action.fid);resetround();G.gph=1;G.hfz=G.slow=0;const w=P[side],d=w.opp;w.X=360*256;d.X=w.X+(side?-40:40)*256;w.FACE=side?0:1;d.FACE=1-w.FACE;w.HP=d.HP=10000;w.WINS=d.WINS=0;
   const damage=[],sounds=[],oldDamage=hpDamage,oldHealth=SF2.health.damage,oldSound=sfxc;hpDamage=function(p,n,...rest){if(p===d&&n>0)damage.push({tick:G.tick,amount:n,y:w.Y/256,entry:w.aidx});return oldDamage(p,n,...rest);};SF2.health.damage=hpDamage;sfxc=function(code,...rest){sounds.push({tick:G.tick,code});return oldSound(code,...rest);};
   let admitted=false;for(let n=0;n<2500;n++){const pair=[0,0];pair[side]=n<8?(action.kind==='spd'?144:(side?1:2)|(16<<action.button)):0;SF2.step(pair);admitted||=!!(w.CEB||w.CEHH||w.AINativeGrab);if(n>80&&w.ST===0&&d.ST===0&&!w.CEB&&!w.CEHH&&!w.AINativeGrab)break;}
   hpDamage=oldDamage;SF2.health.damage=oldHealth;sfxc=oldSound;rows.push({...action,side,admitted,damage,sounds,impactCues:damage.map(q=>sounds.filter(s=>s.tick===q.tick&&s.code===action.cue).length),released:!w.CEB&&!d.CEBV&&!w.CEHH&&!d.CEHHV&&!w.AINativeGrab&&!d.AINativeHeld,states:[w.ST,d.ST]});
  }return rows;
 });
 fs.writeFileSync(artifacts('grab-impact-audio.json'),JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({rows:rows.map(q=>({...q,sounds:q.sounds.filter(s=>q.damage.some(d=>d.tick===s.tick))})),errors},null,2));assert.deepEqual(errors,[]);for(const row of rows){assert.ok(row.admitted,JSON.stringify(row));assert.ok(row.damage.length>0,JSON.stringify(row));assert.ok(row.impactCues.every(n=>n===1),JSON.stringify(row));assert.equal(row.released,true);if(row.fid===6)assert.ok(row.damage.every(d=>d.y===0),JSON.stringify(row));}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
